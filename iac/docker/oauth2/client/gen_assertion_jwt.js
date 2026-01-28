const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

async function main() {
    const clientId = process.env.CLIENT_ID || 'test-client';
    const aud = process.env.AUD || 'http://localhost:8080/auth';
    const privPath = process.env.CLIENT_PRIVATE_KEY || '-';
    const ttl = Number(process.env.ASSERTION_TTL_SECONDS || 60);

    const key = fs.readFileSync(privPath, 'utf8');

    // const now = Math.floor(Date.now() / 1000);
    const now = process.env.TIMESTAMP_IN_SECONDS === '1' ? Math.floor(Date.now() / 1000) : Date.now();
    const jti = crypto.randomBytes(16).toString('hex');

    const token = jwt.sign(
        {
            iat: now,
            nbf: now,
            exp: now + ttl,
        },
        key,
        {
            algorithm: 'RS256',
            issuer: clientId,
            subject: clientId,
            audience: aud,
            jwtid: jti,
            header: {
                typ: 'JWT',
            },
        },
    );

    process.stdout.write(token);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
