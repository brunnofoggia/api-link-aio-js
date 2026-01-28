import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

import { OAuth2PrivateJwtApi } from './oauth2PrivateKeyApi';

// Carrega variáveis de ambiente do .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// client private key
const privPath = process.env.OAUTH2_PRIVATE_KEY_PATH;
const CLIENT_PRIVATE_KEY = fs.readFileSync(privPath, 'utf8');
if (!CLIENT_PRIVATE_KEY || CLIENT_PRIVATE_KEY.length === 0) {
    throw new Error(`Chave privada do cliente não encontrada no caminho: "${privPath}"`);
}

// Classe concreta para testes (OAuth2Api é abstrata)
class TestOAuth2PrivateJwtApi extends OAuth2PrivateJwtApi {}

describe('OAuth2PrivateJwtApi', () => {
    let api: TestOAuth2PrivateJwtApi;
    // describe('Testes Unitários - Métodos Locais', () => {
    //     let api: TestOAuth2PrivateJwtApi;
    //     beforeEach(async () => {
    //         api = new TestOAuth2PrivateJwtApi();
    //         await api.initialize({
    //             baseUrl: 'https://api.test.com',
    //             username: 'client_id_test',
    //             password: 'client_secret_test',
    //             authPath: '/oauth/token',
    //             authGrantType: 'client_credentials',
    //             scope: 'read write',
    //         });
    //     });
    // });

    describe('prepareInitializeOptions', () => {
        beforeEach(async () => {
            api = new TestOAuth2PrivateJwtApi();
            await api.initialize({
                baseUrl: 'https://api.test.com',
                username: 'client_id_test',
                authPath: '/oauth/token',
                authGrantType: 'client_credentials',
                scope: 'read write',
            });
        });

        it('privateKey deve estar undefined se não for fornecida nas opções', async () => {
            expect(api.privateKey).toBeUndefined();
        });

        it('generateTimestamp: deve retornar timestamp em segundos quando assertionTimestampInSeconds for 1', () => {
            const timestamp = api.generateTimestamp(1);
            expect(typeof timestamp).toBe('number');
            expect(timestamp).toBeLessThan(Date.now());
        });

        it('generateTimestamp: deve retornar timestamp em milissegundos quando assertionTimestampInSeconds for false', () => {
            const timestamp = api.generateTimestamp(false);
            expect(typeof timestamp).toBe('number');
            expect(timestamp).toBeGreaterThanOrEqual(Date.now() - 1);
        });

        it('defineNbf: deve retornar null quando notBeforeOffset for -1', () => {
            const nbf = api.defineNbf(-1, 1000);
            expect(nbf).toBeNull();
        });

        it('defineNbf: deve retornar valor correto quando notBeforeOffset for diferente de -1', () => {
            const nbf = api.defineNbf(10, 1000);
            expect(nbf).toBe(990);
        });

        it('_setNbfHeader: deve definir o campo nbf no tokenHeader quando nbf não for null', () => {
            const tokenHeader: any = {};
            api._setNbfHeader(100, tokenHeader);
            expect(tokenHeader.nbf).toBe(100);
        });

        it('_setNbfHeader: não deve definir o campo nbf no tokenHeader quando nbf for null', () => {
            const tokenHeader: any = {};
            api._setNbfHeader(null as any, tokenHeader);
            expect(tokenHeader.nbf).toBeUndefined();
        });
    });

    describe('Teste de Integração - Autenticação', () => {
        it('deve autenticar usando options com dados do .env.test', async () => {
            // Pula o teste se as variáveis de ambiente não estiverem configuradas
            if (!process.env.OAUTH2_PRIVATE_BASE_URL || !process.env.OAUTH2_CLIENT_ID) {
                console.warn('⚠️  Variáveis de ambiente não configuradas. Pulando teste de integração.');
                return;
            }

            const api = new TestOAuth2PrivateJwtApi();
            const options = {
                baseUrl: process.env.OAUTH2_PRIVATE_BASE_URL,
                username: process.env.OAUTH2_CLIENT_ID,
                authPath: process.env.OAUTH2_AUTH_PATH,
                authGrantType: process.env.OAUTH2_GRANT_TYPE,
                scope: process.env.OAUTH2_SCOPE,
                privateKey: CLIENT_PRIVATE_KEY,
            };
            await api.initialize(options);

            // Mock da requisição para evitar chamada real em testes
            // api._request = jest.fn().mockResolvedValue({
            //     data: {
            //         access_token: 'mock_access_token_xyz',
            //         refresh_token: 'mock_refresh_token_abc',
            //         expires_in: 3600,
            //     },
            //     status: 200,
            //     statusText: 'OK',
            //     headers: {},
            //     config: {},
            // });

            const result = await api.auth();

            expect(result.isAuthenticated).toBe(true);
            // expect(api.token).toBe('mock_access_token_xyz');
            expect(api.token.length).toBeGreaterThan(50);
            expect(api._isAuthenticated()).toBe(true);
        });

        it('deve autenticar definindo a classe com dados do .env.test', async () => {
            class TestOAuth2PrivateJwtApi2 extends OAuth2PrivateJwtApi {
                baseUrl = process.env.OAUTH2_PRIVATE_BASE_URL;
                authPath = process.env.OAUTH2_AUTH_PATH;
                authGrantType = process.env.OAUTH2_GRANT_TYPE;
                scope = process.env.OAUTH2_SCOPE;
            }

            const api = new TestOAuth2PrivateJwtApi2();
            await api.initialize({
                username: process.env.OAUTH2_CLIENT_ID,
                privateKey: CLIENT_PRIVATE_KEY,
            });

            // Mock da requisição para evitar chamada real em testes
            // api._request = jest.fn().mockResolvedValue({
            //     data: {
            //         access_token: 'mock_access_token_xyz',
            //         refresh_token: 'mock_refresh_token_abc',
            //         expires_in: 3600,
            //     },
            //     status: 200,
            //     statusText: 'OK',
            //     headers: {},
            //     config: {},
            // });

            const result = await api.auth();

            expect(result.isAuthenticated).toBe(true);
            // expect(api.token).toBe('mock_access_token_xyz');
            expect(api.token.length).toBeGreaterThan(50);
            expect(api._isAuthenticated()).toBe(true);
        });

        it('deve construir requisição de autenticação corretamente', async () => {
            const api = new TestOAuth2PrivateJwtApi();
            await api.initialize({
                baseUrl: process.env.OAUTH2_PRIVATE_BASE_URL || 'https://api.example.com',
                authPath: process.env.OAUTH2_AUTH_PATH || '/oauth/token',
                authGrantType: process.env.OAUTH2_GRANT_TYPE || 'client_credentials',
                scope: process.env.OAUTH2_SCOPE || 'default',
                username: process.env.OAUTH2_CLIENT_ID || 'test_client',
                privateKey: CLIENT_PRIVATE_KEY,
            });

            const reqOptions = await api.authBuildReqOptions();

            expect(reqOptions.url).toBe(api.authPath);
            expect(reqOptions.method).toBe('post');
            expect(reqOptions.data).toHaveProperty('client_id');
            expect(reqOptions.data).toHaveProperty('grant_type');
            expect(reqOptions.headers).toHaveProperty('Content-Type', 'application/x-www-form-urlencoded');
        });

        it('deve limpar token corretamente', async () => {
            const api = new TestOAuth2PrivateJwtApi();
            await api.initialize({
                baseUrl: 'https://api.test.com',
                username: 'client_id',
                privateKey: CLIENT_PRIVATE_KEY,
                authPath: '/token',
                authGrantType: 'client_credentials',
                token: 'existing_token',
            });

            expect(api.token).toBe('existing_token');
            expect(api._isAuthenticated()).toBe(true);

            api.clearToken();

            expect(api.token).toBe('');
            expect(api._isAuthenticated()).toBe(false);
        });
    });
});
