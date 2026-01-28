import * as dotenv from 'dotenv';
import * as path from 'path';
import { OAuth2Api, OAuth2DefaultOptions } from './oauth2Api';
import { OAuth2Options } from './interfaces/auth.interface';

// Carrega variáveis de ambiente do .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Classe concreta para testes (OAuth2Api é abstrata)
class TestOAuth2Api extends OAuth2Api {}

describe('OAuth2Api', () => {
    describe('Testes Unitários - Métodos Locais', () => {
        let api: TestOAuth2Api;

        beforeEach(async () => {
            api = new TestOAuth2Api();
            await api.initialize({
                baseUrl: 'https://api.test.com',
                username: 'client_id_test',
                password: 'client_secret_test',
                authPath: '/oauth/token',
                authGrantType: 'client_credentials',
                scope: 'read write',
            });
        });

        describe('prepareInitializeOptions', () => {
            it('deve configurar as opções básicas corretamente', async () => {
                const options: Partial<OAuth2Options> = {
                    baseUrl: 'https://api.example.com',
                    username: 'my_client_id',
                    password: 'my_client_secret',
                    authPath: '/token',
                    authGrantType: 'password',
                    scope: 'custom_scope',
                };

                await api.prepareInitializeOptions([options]);

                expect(api.baseUrl).toBe('https://api.example.com');
                expect(api.username).toBe('my_client_id');
                expect(api.password).toBe('my_client_secret');
                expect(api.authPath).toBe('/token');
                expect(api.authGrantType).toBe('password');
                expect(api.scope).toBe('custom_scope');
            });

            it('deve usar valores padrão quando opções não são fornecidas', async () => {
                api = new TestOAuth2Api();
                await api.initialize({});

                expect(api.scope).toEqual(OAuth2DefaultOptions.scope);
                expect(api.authResTokenField).toEqual(OAuth2DefaultOptions.authResTokenField);
            });

            it('deve configurar authResTokenField com valor padrão', async () => {
                const options: Partial<OAuth2Options> = {
                    baseUrl: 'https://api.example.com',
                    username: 'client_id',
                    password: 'client_secret',
                    authPath: '/token',
                    authGrantType: 'client_credentials',
                    authResTokenField: OAuth2DefaultOptions.authResTokenField,
                };

                await api.prepareInitializeOptions([options]);

                expect(api.authResTokenField).toBe(OAuth2DefaultOptions.authResTokenField);
            });

            it('deve configurar authResRefreshTokenField com valor padrão', async () => {
                const options: Partial<OAuth2Options> = {
                    baseUrl: 'https://api.example.com',
                    username: 'client_id',
                    password: 'client_secret',
                    authPath: '/token',
                    authGrantType: 'client_credentials',
                    authResRefreshTokenField: OAuth2DefaultOptions.authResRefreshTokenField,
                };

                await api.prepareInitializeOptions([options]);

                expect(api.authResRefreshTokenField).toBe('refresh_token');
            });

            it('deve permitir configurar um token inicial', async () => {
                const options: Partial<OAuth2Options> = {
                    baseUrl: 'https://api.example.com',
                    username: 'client_id',
                    password: 'client_secret',
                    authPath: '/token',
                    authGrantType: 'client_credentials',
                    token: 'initial_token_123',
                };

                await api.prepareInitializeOptions([options]);

                expect(api.token).toBe('initial_token_123');
            });

            it('deve usar scope padrão quando não fornecido', async () => {
                api = new TestOAuth2Api();
                const options: Partial<OAuth2Options> = {
                    baseUrl: 'https://api.example.com',
                    username: 'client_id',
                    password: 'client_secret',
                    authPath: '/token',
                    authGrantType: 'client_credentials',
                    scope: undefined,
                };

                await api.prepareInitializeOptions([options]);

                expect(api.scope).toBe(OAuth2DefaultOptions.scope);
            });
        });

        describe('authReqOptionBody', () => {
            it('deve construir corpo da requisição com credenciais padrão', async () => {
                const body = await api.authReqOptionBody();

                expect(body).toEqual({
                    client_id: 'client_id_test',
                    grant_type: 'client_credentials',
                    scope: 'read write',
                    client_secret: 'client_secret_test',
                });
            });

            it('deve permitir sobrescrever username na requisição', async () => {
                const body = await api.authReqOptionBody({
                    username: 'override_client_id',
                });

                expect(body.client_id).toBe('override_client_id');
            });

            it('deve permitir sobrescrever password na requisição', async () => {
                const body = await api.authReqOptionBody({
                    password: 'override_client_secret',
                });

                expect(body.client_secret).toBe('override_client_secret');
            });

            it('deve permitir sobrescrever grant_type na requisição', async () => {
                const body = await api.authReqOptionBody({
                    authGrantType: 'password',
                });

                expect(body.grant_type).toBe('password');
            });

            it('deve permitir sobrescrever scope na requisição', async () => {
                const body = await api.authReqOptionBody({
                    scope: 'custom_scope',
                });

                expect(body.scope).toBe('custom_scope');
            });

            it('deve incluir apenas campos definidos', async () => {
                api = new TestOAuth2Api();
                await api.initialize({
                    baseUrl: 'https://api.test.com',
                    username: 'my_client_id',
                    password: 'my_client_secret',
                    authPath: '/token',
                    authGrantType: 'client_credentials',
                });

                api.scope = undefined;
                api.authGrantType = undefined;
                api.password = undefined;

                const body = await api.authReqOptionBody();

                expect(body.client_id).toBeDefined();
                expect(body.grant_type).toBeUndefined();
                expect(body.scope).toBeUndefined();
                expect(body.client_secret).toBeUndefined();
            });
        });

        describe('authReqOptionHeaders', () => {
            it('deve retornar headers corretos para OAuth2', () => {
                const headers = api.authReqOptionHeaders();

                expect(headers).toEqual({
                    'Content-Type': 'application/x-www-form-urlencoded',
                });
            });
        });

        describe('authHeaderPrefix', () => {
            it('deve usar "Bearer" como prefixo padrão', () => {
                expect(api.authHeaderPrefix).toBe('Bearer');
            });
        });

        describe('_defaultHeaders', () => {
            it('deve incluir Content-Type para application/x-www-form-urlencoded', () => {
                expect(api._defaultHeaders['Content-Type']).toBe('application/x-www-form-urlencoded');
            });
        });
    });

    describe('Teste de Integração - Autenticação', () => {
        it('deve autenticar usando options com dados do .env.test', async () => {
            // Pula o teste se as variáveis de ambiente não estiverem configuradas
            if (!process.env.OAUTH2_BASE_URL || !process.env.OAUTH2_CLIENT_ID) {
                console.warn('⚠️  Variáveis de ambiente não configuradas. Pulando teste de integração.');
                return;
            }

            const api = new TestOAuth2Api();
            await api.initialize({
                baseUrl: process.env.OAUTH2_BASE_URL,
                username: process.env.OAUTH2_CLIENT_ID,
                password: process.env.OAUTH2_CLIENT_SECRET,
                authPath: process.env.OAUTH2_AUTH_PATH,
                authGrantType: process.env.OAUTH2_GRANT_TYPE,
                scope: process.env.OAUTH2_SCOPE,
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

        it('deve autenticar definindo a classe com dados do .env.test', async () => {
            class TestOAuth2Api2 extends OAuth2Api {
                baseUrl = process.env.OAUTH2_BASE_URL;
                authPath = process.env.OAUTH2_AUTH_PATH;
                authGrantType = process.env.OAUTH2_GRANT_TYPE;
                scope = process.env.OAUTH2_SCOPE;
            }

            const api = new TestOAuth2Api2();
            await api.initialize({
                username: process.env.OAUTH2_CLIENT_ID,
                password: process.env.OAUTH2_CLIENT_SECRET,
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
            const api = new TestOAuth2Api();
            await api.initialize({
                baseUrl: process.env.OAUTH2_BASE_URL || 'https://api.example.com',
                username: process.env.OAUTH2_CLIENT_ID || 'test_client',
                password: process.env.OAUTH2_CLIENT_SECRET || 'test_secret',
                authPath: process.env.OAUTH2_AUTH_PATH || '/oauth/token',
                authGrantType: process.env.OAUTH2_GRANT_TYPE || 'client_credentials',
                scope: process.env.OAUTH2_SCOPE || 'default',
            });

            const reqOptions = await api.authBuildReqOptions();

            expect(reqOptions.url).toBe(api.authPath);
            expect(reqOptions.method).toBe('post');
            expect(reqOptions.data).toHaveProperty('client_id');
            expect(reqOptions.data).toHaveProperty('grant_type');
            expect(reqOptions.headers).toHaveProperty('Content-Type', 'application/x-www-form-urlencoded');
        });

        it('deve limpar token corretamente', async () => {
            const api = new TestOAuth2Api();
            await api.initialize({
                baseUrl: 'https://api.test.com',
                username: 'client_id',
                password: 'client_secret',
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
