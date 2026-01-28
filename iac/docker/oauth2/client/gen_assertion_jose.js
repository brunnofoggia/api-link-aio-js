const fs = require('fs');
const crypto = require('crypto');
const { SignJWT, importPKCS8 } = require('jose');

async function main() {
    const clientId = process.env.CLIENT_ID || 'test-client';
    const aud = process.env.AUD || 'http://localhost:8080/auth';
    const privPath = process.env.CLIENT_PRIVATE_KEY || '-';
    const ttl = Number(process.env.ASSERTION_TTL_SECONDS || 60);

    const pem = fs.readFileSync(privPath, 'utf8');

    // key generation below
    const key = await importPKCS8(pem, 'RS256');

    const now = Math.floor(Date.now() / 1000);
    const jti = crypto.randomBytes(16).toString('hex');

    const jwt = await new SignJWT({})
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuer(clientId) // iss = client_id
        .setSubject(clientId) // sub = client_id
        .setAudience(aud) // aud = token endpoint
        .setIssuedAt(now)
        .setExpirationTime(now + ttl)
        .setJti(jti)
        .sign(key);

    process.stdout.write(jwt);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
