const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const { SignJWT, jwtVerify, importPKCS8, importSPKI } = require('jose');

// #region vars
const PORT = process.env.PORT || 8080;

const TOKEN_ENDPOINT_AUDIENCE = process.env.TOKEN_ENDPOINT_AUDIENCE || `http://localhost:${PORT}/auth`;
const CLIENT_ASSERTION_TTL_SECONDS = Number(process.env.CLIENT_ASSERTION_TTL_SECONDS || 120);
const JWT_ISSUER = process.env.JWT_ISSUER || 'oauth-test-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'your-app';
const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS || 3600);

const OAUTH_CLIENT_AUTH_MODE = process.env.OAUTH_CLIENT_AUTH_MODE || 'private_key_jwt';
const CLIENT_ID = process.env.CLIENT_ID || 'test-client';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'test-secret';
const CLIENT_PUBLIC_KEY_PATH = process.env.CLIENT_PUBLIC_KEY_PATH || '/keys/client_public.pem';
const SERVER_PRIVATE_KEY_PATH = process.env.SERVER_PRIVATE_KEY_PATH || '/keys/server_private.pem';
const SERVER_PUBLIC_KEY_PATH = process.env.SERVER_PUBLIC_KEY_PATH || '/keys/server_public.pem';
// #endregion

// #region key functions
function log(level, msg, extra = {}) {
    const base = {
        ts: new Date().toISOString(),
        level,
        msg,
    };

    const payload = Object.keys(extra).length > 0 ? { ...base, ...extra } : base;

    console.log(JSON.stringify(payload));
}
function readText(path) {
    return fs.readFileSync(path, 'utf8');
}

// Lê arquivos a cada uso => trocar PEM no volume tem efeito imediato
async function getClientPublicKey() {
    return importSPKI(readText(CLIENT_PUBLIC_KEY_PATH), 'RS256');
}
async function getServerPrivateKey() {
    return importPKCS8(readText(SERVER_PRIVATE_KEY_PATH), 'RS256');
}
async function getServerPublicKey() {
    return importSPKI(readText(SERVER_PUBLIC_KEY_PATH), 'RS256');
}

function nowEpoch() {
    return Math.floor(Date.now() / 1000);
}

function extractBasicAuthSecret(authHeader = '') {
    if (!authHeader.startsWith('Basic ')) return null;

    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [, secret] = decoded.split(':');
    return secret;
}

// Anti-replay simples (memória). Bom o suficiente p/ ambiente de teste.
const seenJti = new Map(); // jti -> expEpoch
function cleanupSeenJti() {
    const t = nowEpoch();
    for (const [jti, exp] of seenJti.entries()) {
        if (exp <= t) seenJti.delete(jti);
    }
}
// #endregion

// #region middlewares to validate
function authenticateClientWithSecret(req, client_id) {
    const client_secret = req.body?.client_secret || extractBasicAuthSecret(req.headers.authorization);

    if (!client_secret || client_secret !== CLIENT_SECRET) {
        throw new Error('client_secret inválido');
    }

    const payload = { sub: client_id }; // mock payload
    return { payload };
}

// Middleware para validar access_token (public key do servidor)
async function authenticateClientWithPrivateKeyJwt(req, client_id) {
    cleanupSeenJti();

    const client_assertion_type = req.body?.client_assertion_type;
    const client_assertion = req.body?.client_assertion;

    if (client_assertion_type !== 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer') {
        throw new Error('invalid client_assertion_type');
    }

    if (!client_assertion) {
        throw new Error('client_assertion ausente');
    }

    const clientPublicKey = await getClientPublicKey();

    const { payload } = await jwtVerify(client_assertion, clientPublicKey, {
        audience: TOKEN_ENDPOINT_AUDIENCE,
        issuer: client_id,
        clockTolerance: 5,
    });

    if (payload.sub !== client_id) {
        throw new Error('assertion sub inválido');
    }

    if (!payload.jti) {
        throw new Error('assertion sem jti');
    }

    if (seenJti.has(payload.jti)) {
        throw new Error('assertion replay detectado');
    }

    const now = nowEpoch();
    if (!payload.iat || !payload.exp || payload.exp <= now) {
        throw new Error('assertion expirado');
    }

    if (now - payload.iat > CLIENT_ASSERTION_TTL_SECONDS) {
        throw new Error('assertion muito antigo');
    }

    seenJti.set(payload.jti, payload.exp);
    return { payload };
}

async function generate_token(client_id, scope) {
    const tokenIat = nowEpoch();
    const tokenExp = tokenIat + TOKEN_TTL_SECONDS;
    const tokenJti = crypto.randomBytes(16).toString('hex');

    const serverPrivateKey = await getServerPrivateKey();

    const access_token = await new SignJWT({ scope, client_auth: OAUTH_CLIENT_AUTH_MODE })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .setIssuedAt(tokenIat)
        .setExpirationTime(tokenExp)
        .setSubject(client_id)
        .setJti(tokenJti)
        .sign(serverPrivateKey);

    return access_token;
}

async function requireAuth(req, res, next) {
    try {
        const auth = req.headers.authorization || '';
        const match = auth.match(/^Bearer\s+(.+)$/i);
        if (!match) {
            return res.status(401).json({
                error: 'invalid_request',
                error_description: 'Faltou Authorization: Bearer <token>',
            });
        }

        log('INFO', 'Bearer token received', {
            path: req.path,
        });

        const token = match[1];
        const serverPublicKey = await getServerPublicKey();

        const { payload } = await jwtVerify(token, serverPublicKey, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        log('INFO', 'Access token validated', {
            sub: payload.sub,
            scope: payload.scope,
        });

        req.user = payload;
        next();
    } catch (err) {
        log('WARN', 'Invalid access token', {
            error: String(err?.message || err),
        });

        return res.status(401).json({
            error: 'invalid_token',
            error_description: String(err?.message || err),
        });
    }
}
// #endregion

// #region app setup
if (!['private_key_jwt', 'client_secret'].includes(OAUTH_CLIENT_AUTH_MODE)) {
    throw new Error(`Invalid OAUTH_CLIENT_AUTH_MODE=${OAUTH_CLIENT_AUTH_MODE}`);
}

const app = express();
// aceita JSON e x-www-form-urlencoded (padrão token endpoint)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// #endregion

// #region routes
app.use((req, res, next) => {
    log('INFO', 'Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
    });
    next();
});

app.get('/', (req, res) => {
    log('INFO', 'Healthcheck called');
    res.json({ ok: true, service: 'oauth-test-api', time: new Date().toISOString() });
});

app.post('/auth', async (req, res) => {
    const grant_type = req.body?.grant_type;
    const client_id = req.body?.client_id;
    const scope = req.body?.scope || 'default';

    log('INFO', 'POST /auth called', {
        client_id,
        grant_type,
    });

    if (grant_type !== 'client_credentials') {
        return res.status(400).json({
            error: 'unsupported_grant_type',
            error_description: 'Use grant_type=client_credentials',
        });
    }

    if (client_id !== CLIENT_ID) {
        log('WARN', 'Invalid client_id', { received: client_id });
        return res.status(401).json({
            error: 'invalid_client',
            error_description: 'client_id não reconhecido',
        });
    }

    try {
        let payload;
        if (OAUTH_CLIENT_AUTH_MODE === 'private_key_jwt') {
            ({ payload } = await authenticateClientWithPrivateKeyJwt(req, client_id));
        }

        if (OAUTH_CLIENT_AUTH_MODE === 'client_secret') {
            ({ payload } = authenticateClientWithSecret(req, client_id));
        }

        log('INFO', 'Access token issued', {
            client_id,
            mode: OAUTH_CLIENT_AUTH_MODE,
            scope,
            expires_in: TOKEN_TTL_SECONDS,
        });

        const access_token = await generate_token(client_id, scope);
        return res.json({
            token_type: 'Bearer',
            access_token,
            expires_in: TOKEN_TTL_SECONDS,
        });
    } catch (e) {
        log('WARN', 'Client authentication failed', {
            client_id,
            mode: OAUTH_CLIENT_AUTH_MODE,
            error: e.message,
        });

        return res.status(401).json({
            error: 'invalid_client',
            error_description: e.message,
        });
    }
});

app.get('/private', requireAuth, (req, res) => {
    log('INFO', 'Private endpoint accessed', {
        sub: req.user.sub,
        scope: req.user.scope,
    });

    res.json({
        ok: true,
        message: 'Acesso autorizado ✅',
        token_claims: req.user,
    });
});
// #endregion

app.listen(PORT, () => {
    console.log(`oauth-test-api listening on :${PORT}`);
    console.log(`Client public key: ${CLIENT_PUBLIC_KEY_PATH}`);
    console.log(`Server keys: priv=${SERVER_PRIVATE_KEY_PATH} pub=${SERVER_PUBLIC_KEY_PATH}`);
    console.log(`Assertion aud expected: ${TOKEN_ENDPOINT_AUDIENCE}`);
});
