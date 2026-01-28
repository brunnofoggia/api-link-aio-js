import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { OAuth2Api } from './oauth2Api';
import { OAuth2PrivateKeyOptions } from './interfaces/auth.interface';

export const OAuth2PrivateJwtDefaultOptions = {
    assertionType: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    assertionTTL: 300, // seconds
    assertionTimestampInSeconds: 1, // o padrao JWT é trabalhar com timestamp em segundos
    assertionAlg: 'RS256',
    assertionNotBeforeOffset: -1,
};

export abstract class OAuth2PrivateJwtApi extends OAuth2Api {
    // #region vars, getters and setters
    assertionType: string;
    assertionTTL: number; // seconds
    assertionAlg: string;
    assertionTimestampInSeconds: boolean | number;
    assertionNotBeforeOffset: number;
    privateKey: string;
    // #endregion

    async prepareInitializeOptions(args: any[]): Promise<any> {
        const options = (await super.prepareInitializeOptions(args)) as Partial<OAuth2PrivateKeyOptions>;

        this.assertionType = options.assertionType || OAuth2PrivateJwtDefaultOptions.assertionType;
        this.assertionTTL = options.assertionTTL || OAuth2PrivateJwtDefaultOptions.assertionTTL;
        this.assertionNotBeforeOffset = options.assertionNotBeforeOffset || OAuth2PrivateJwtDefaultOptions.assertionNotBeforeOffset;
        this.assertionTimestampInSeconds = options.assertionTimestampInSeconds || OAuth2PrivateJwtDefaultOptions.assertionTimestampInSeconds;
        this.assertionAlg = options.assertionAlg || OAuth2PrivateJwtDefaultOptions.assertionAlg;
        if (options.privateKey) this.privateKey = options.privateKey;

        return options;
    }

    async authReqOptionBody(reqOptions: Partial<OAuth2PrivateKeyOptions> = {}): Promise<any> {
        const body: any = await super.authReqOptionBody(reqOptions as any);

        body.client_assertion_type = this.assertionType;
        body.client_assertion = reqOptions.assertion || (await this.generateAssertion(reqOptions));
        return body;
    }

    async generateAssertion(reqOptions: Partial<OAuth2PrivateKeyOptions>): Promise<string> {
        const clientId = reqOptions.username || this._getUsername();
        const privateKey = reqOptions.privateKey || this.privateKey;

        const assertionAlg = reqOptions.assertionAlg || this.assertionAlg;
        const ttl = reqOptions.assertionTTL || this.assertionTTL;
        const aud = this._prepareUrl(this.authPath);

        const timestamp = this.generateTimestamp(reqOptions.assertionTimestampInSeconds || this.assertionTimestampInSeconds);
        const now = Math.floor(timestamp);

        const notBeforeOffset = reqOptions.assertionNotBeforeOffset || this.assertionNotBeforeOffset;
        const nbf = this.defineNbf(notBeforeOffset, now);

        const jti = this.buildJti();
        const key = await this.generateKeyFromPrivateKey(privateKey);
        const jwt = await this.buildSignJWT(clientId, assertionAlg, aud, now, nbf, ttl, jti, key);
        return jwt;
    }

    generateTimestamp(assertionTimestampInSeconds: boolean | number): number {
        return assertionTimestampInSeconds === 1 ? Date.now() / 1000 : Date.now();
    }

    defineNbf(notBeforeOffset: number, now: number): number | null {
        return notBeforeOffset === -1 ? null : now - notBeforeOffset;
    }

    async generateKeyFromPrivateKey(privateKey?: string): Promise<any> {
        // jsonwebtoken
        return privateKey;
        // jose
        // const key = await jose.importPKCS8(privateKey, 'RS256');
        // return key;
    }

    buildJti(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    async buildSignJWT(
        clientId: string,
        assertionAlg: string,
        aud: string,
        now: number,
        nbf: number,
        ttl: number,
        jti: string,
        key: any,
    ): Promise<string> {
        // jsonwebtoken
        const tokenHeader: any = {
            iat: now,
            exp: now + ttl,
        };
        this._setNbfHeader(nbf, tokenHeader);

        const token = jwt.sign(tokenHeader, key, {
            algorithm: assertionAlg,
            issuer: clientId,
            subject: clientId,
            audience: aud,
            jwtid: jti,
            header: {
                typ: 'JWT',
            },
        });
        // jose
        // const jwt = await new jose.SignJWT({})
        //     .setProtectedHeader({ alg: assertionAlg, typ: 'JWT' })
        //     .setIssuer(clientId) // iss = client_id
        //     .setSubject(clientId) // sub = client_id
        //     .setAudience(aud) // aud = token endpoint
        //     .setIssuedAt(now)
        //     .setExpirationTime(now + ttl)
        //     .setJti(jti)
        //     .sign(key);
        // return jwt;

        return token;
    }

    _setNbfHeader(nbf: number, tokenHeader: any) {
        if (nbf !== null) {
            tokenHeader.nbf = nbf;
        }
    }
}
