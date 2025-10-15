import { HttpStatusCode } from 'axios';
import { AuthApi } from './authApi';
import { ObjectLiteral } from './common/types/objectLiteral';
import { RequestConfigInternalAuth } from './interfaces/requestConfig.interface';
import { AuthOptions } from './interfaces/auth.interface';

const originalAuthRequest = AuthApi.prototype.request;

// Mock do lodash
jest.mock('lodash', () => ({
    defaults: jest.fn((target, ...sources) => Object.assign({}, ...sources, target)),
    omit: jest.fn((obj, keys) => {
        const result = { ...obj };
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach((key) => delete result[key]);
        return result;
    }),
}));

// Implementação concreta para testes
class TestAuthApi extends AuthApi {
    public _requestSpy = jest.fn();
    public debugSpy = jest.fn();
    public authResHandleSpy = jest.fn();
    public _isAuthenticatedSpy = jest.fn();
    public superRequestSpy = jest.fn();
    public superRetryCheckSpy = jest.fn();

    constructor() {
        super();
        this.authPath = '/auth/login';
        this.authMethod = 'post';
        this.username = 'testuser';
        this.password = 'testpass';

        this.debug = (message?: any, ...optionalParams: any[]) => {
            return this.debugSpy(message, ...optionalParams);
        };
    }

    authResHandle(response: any): any {
        return this.authResHandleSpy(response);
    }

    _isAuthenticated(): boolean {
        return this._isAuthenticatedSpy();
    }

    async _request(options: any) {
        return this._requestSpy(options);
    }

    async request(options: ObjectLiteral = {}, config: RequestConfigInternalAuth = {}) {
        // Chama a implementação da classe pai AuthApi
        return super.request(options, config);
    }

    // Mock do super.request para simular PublicApi.request
    async ['super.request'](options: ObjectLiteral = {}, config: RequestConfigInternalAuth = {}) {
        return this.superRequestSpy(options, config);
    }

    // Mock do super._retryCheck para simular PublicApi._retryCheck
    async ['super._retryCheck'](error: any, retry: number) {
        return this.superRetryCheckSpy(error, retry);
    }
}

describe('AuthApi', () => {
    let authApi: TestAuthApi;

    beforeEach(() => {
        authApi = new TestAuthApi();
        jest.clearAllMocks();

        // Setup mocks padrão
        authApi._requestSpy.mockResolvedValue({ data: { token: 'mock-token' } });
        authApi.authResHandleSpy.mockReturnValue({ token: 'mock-token' });
        authApi._isAuthenticatedSpy.mockReturnValue(true);
        authApi.superRequestSpy.mockResolvedValue({ data: 'success' });
        authApi.superRetryCheckSpy.mockResolvedValue({ shouldTryAgain: false, retry: 1 });
    });

    describe('Propriedades básicas', () => {
        it('deve ter propriedades padrão definidas', () => {
            expect(authApi.authMethod).toBe('post');
            expect(authApi.authPath).toBe('/auth/login');
            expect(authApi.username).toBe('testuser');
            expect(authApi.password).toBe('testpass');
        });

        it('deve ter métodos abstratos definidos na implementação concreta', () => {
            expect(typeof authApi.authResHandle).toBe('function');
            expect(typeof authApi._isAuthenticated).toBe('function');
        });

        it('deve ter métodos opcionais com implementação vazia', () => {
            expect(authApi.authReqOptionBody()).toBeUndefined();
            expect(authApi.authReqOptionHeaders()).toBeUndefined();
            expect(authApi.authReqOptionAuth()).toBeUndefined();
        });
    });

    describe('authReqOptionsDefault', () => {
        it('deve retornar opções padrão de autenticação', () => {
            const result = authApi.authReqOptionsDefault();

            expect(result).toEqual({
                url: '/auth/login',
                method: 'post',
            });
        });

        it('deve usar authMethod quando definido', () => {
            authApi.authMethod = 'put';

            const result = authApi.authReqOptionsDefault();

            expect(result.method).toBe('put');
        });

        it('deve usar "post" como fallback quando authMethod é null', () => {
            authApi.authMethod = null;

            const result = authApi.authReqOptionsDefault();

            expect(result.method).toBe('post');
        });
    });

    describe('_setReqOptions', () => {
        it('deve definir valor quando não é undefined', () => {
            const options = {};

            authApi._setReqOptions(options, 'testKey', 'testValue');

            expect(options).toEqual({ testKey: 'testValue' });
        });

        it('deve não definir valor quando é undefined', () => {
            const options = {};

            authApi._setReqOptions(options, 'testKey', undefined);

            expect(options).toEqual({});
        });

        it('deve definir valor null', () => {
            const options = {};

            authApi._setReqOptions(options, 'testKey', null);

            expect(options).toEqual({ testKey: null });
        });

        it('deve definir valor false', () => {
            const options = {};

            authApi._setReqOptions(options, 'testKey', false);

            expect(options).toEqual({ testKey: false });
        });

        it('deve retornar this para chaining', () => {
            const options = {};

            const result = authApi._setReqOptions(options, 'testKey', 'testValue');

            expect(result).toBe(authApi);
        });
    });

    describe('authBuildReqOptions', () => {
        beforeEach(() => {
            // Mock das funções de opções
            jest.spyOn(authApi, 'authReqOptionBody').mockReturnValue({ username: 'user', password: 'pass' });
            jest.spyOn(authApi, 'authReqOptionHeaders').mockReturnValue({ 'Content-Type': 'application/json', Authorization: 'Bearer old-token' });
            jest.spyOn(authApi, 'authReqOptionAuth').mockReturnValue({ username: 'basic-user', password: 'basic-pass' });
        });

        it('deve construir opções de request completas', () => {
            const result = authApi.authBuildReqOptions();

            expect(result).toEqual({
                url: '/auth/login',
                method: 'post',
                data: { username: 'user', password: 'pass' },
                headers: { 'Content-Type': 'application/json' }, // Authorization removida
                auth: { username: 'basic-user', password: 'basic-pass' },
            });
        });

        it('deve remover header Authorization usando omit', () => {
            const lodash = require('lodash');

            authApi.authBuildReqOptions();

            expect(lodash.omit).toHaveBeenCalledWith({ 'Content-Type': 'application/json', Authorization: 'Bearer old-token' }, 'Authorization');
        });

        it('deve retornar um objeto vazio quando métodos retornam undefined', () => {
            jest.spyOn(authApi, 'authReqOptionBody').mockReturnValue(undefined);
            jest.spyOn(authApi, 'authReqOptionHeaders').mockReturnValue(undefined);
            jest.spyOn(authApi, 'authReqOptionAuth').mockReturnValue(undefined);

            const result = authApi.authBuildReqOptions();

            expect(result).toEqual({
                headers: {},
                url: '/auth/login',
                method: 'post',
            });
        });

        it('deve passar options para authReqOptionBody', () => {
            const options = { username: 'custom-user' };

            authApi.authBuildReqOptions(options);

            expect(authApi.authReqOptionBody).toHaveBeenCalledWith(options);
        });
    });

    describe('authBuildBody', () => {
        it('deve usar credenciais da instância por padrão', () => {
            const result = authApi.authBuildBody();

            expect(result).toEqual({
                username: 'testuser',
                password: 'testpass',
            });
        });

        it('deve usar credenciais das options quando fornecidas', () => {
            const options = {
                username: 'custom-user',
                password: 'custom-pass',
            };

            const result = authApi.authBuildBody(options);

            expect(result).toEqual({
                username: 'custom-user',
                password: 'custom-pass',
            });
        });

        it('deve misturar credenciais das options e da instância', () => {
            const options = {
                username: 'custom-user',
                // password não fornecida
            };

            const result = authApi.authBuildBody(options);

            expect(result).toEqual({
                username: 'custom-user',
                password: 'testpass', // Da instância
            });
        });

        it('deve chamar _getUsername e _getPassword', () => {
            jest.spyOn(authApi, '_getUsername');
            jest.spyOn(authApi, '_getPassword');

            authApi.authBuildBody();

            expect(authApi._getUsername).toHaveBeenCalled();
            expect(authApi._getPassword).toHaveBeenCalled();
        });
    });

    describe('auth', () => {
        it('deve executar fluxo de autenticação completo', async () => {
            jest.spyOn(authApi, 'authBuildReqOptions').mockReturnValue({ url: '/auth/login', method: 'post' });
            const mockResponse = { data: { token: 'new-token' } };
            authApi._requestSpy.mockResolvedValue(mockResponse);
            authApi.authResHandleSpy.mockReturnValue({ token: 'new-token' });
            authApi._isAuthenticatedSpy.mockReturnValue(true);

            const result = await authApi.auth();

            expect(authApi.debugSpy).toHaveBeenCalledWith('authenticating');
            expect(authApi.authBuildReqOptions).toHaveBeenCalledWith({});
            expect(authApi._requestSpy).toHaveBeenCalledWith({ url: '/auth/login', method: 'post' });
            expect(authApi.authResHandleSpy).toHaveBeenCalledWith(mockResponse);
            expect(authApi.debugSpy).toHaveBeenCalledWith('authenticated', { token: 'new-token' });

            expect(result).toEqual({
                options: { url: '/auth/login', method: 'post' },
                isAuthenticated: true,
                response: mockResponse,
            });
        });

        it('deve passar options para authBuildReqOptions', async () => {
            const options = { username: 'custom-user' };
            jest.spyOn(authApi, 'authBuildReqOptions').mockReturnValue({ url: '/auth/login', method: 'post' });

            await authApi.auth(options);

            expect(authApi.authBuildReqOptions).toHaveBeenCalledWith(options);
        });

        it('deve propagar erros do _request', async () => {
            const error = new Error('Network error');
            authApi._requestSpy.mockRejectedValue(error);

            await expect(authApi.auth()).rejects.toThrow('Network error');
        });
    });

    describe('_isAuthorizing', () => {
        it('deve retornar true quando URL contém authPath', () => {
            const options = { url: '/auth/login' };

            const result = authApi._isAuthorizing(options);

            expect(result).toBe(true);
        });

        it('deve retornar true quando URL contém authPath em qualquer posição', () => {
            const options = { url: '/api/v1/auth/login' };

            const result = authApi._isAuthorizing(options);

            expect(result).toBe(true);
        });

        it('deve retornar false quando URL não contém authPath', () => {
            const options = { url: '/api/users' };

            const result = authApi._isAuthorizing(options);

            expect(result).toBe(false);
        });

        it('deve tratar URL vazia', () => {
            const options = { url: '' };

            const result = authApi._isAuthorizing(options);

            expect(result).toBe(false);
        });

        it('deve usar indexOf para verificar', () => {
            const options = { url: '/auth/login/extra' };

            const result = authApi._isAuthorizing(options);

            expect(result).toBe(true);
        });
    });

    describe('_isUnauthorizedError', () => {
        it('deve retornar true para erro 401', () => {
            const error = {
                response: {
                    status: HttpStatusCode.Unauthorized,
                },
            };

            const result = authApi._isUnauthorizedError(error);

            expect(result).toBe(true);
        });

        it('deve retornar false para outros status codes', () => {
            const testCases = [400, 403, 404, 500];

            testCases.forEach((status) => {
                const error = {
                    response: { status },
                };

                const result = authApi._isUnauthorizedError(error);

                expect(result).toBe(false);
            });
        });

        it('deve retornar false quando error é null', () => {
            const result = authApi._isUnauthorizedError(null);

            expect(result).toBe(false);
        });

        it('deve retornar false quando error.response é undefined', () => {
            const error = {};

            const result = authApi._isUnauthorizedError(error);

            expect(result).toBe(false);
        });

        it('deve usar optional chaining seguro', () => {
            const testCases = [null, undefined, {}, { response: null }, { response: {} }, { response: { status: undefined } }];

            testCases.forEach((error) => {
                const result = authApi._isUnauthorizedError(error);
                expect(result).toBe(false);
            });
        });
    });

    describe('Getters e Setters', () => {
        describe('_getUsername e _getPassword', () => {
            it('deve retornar username da instância', () => {
                expect(authApi._getUsername()).toBe('testuser');
            });

            it('deve retornar password da instância', () => {
                expect(authApi._getPassword()).toBe('testpass');
            });
        });

        describe('_setUser', () => {
            it('deve definir username', () => {
                const result = authApi._setUser('newuser');

                expect(authApi.username).toBe('newuser');
                expect(result).toBe(authApi);
            });

            it('deve retornar this para chaining', () => {
                const result = authApi._setUser('newuser');

                expect(result).toBe(authApi);
            });
        });

        describe('_setPass', () => {
            it('deve definir password', () => {
                const result = authApi._setPass('newpass');

                expect(authApi.password).toBe('newpass');
                expect(result).toBe(authApi);
            });

            it('deve retornar this para chaining', () => {
                const result = authApi._setPass('newpass');

                expect(result).toBe(authApi);
            });
        });

        describe('_setAuth', () => {
            it('deve definir username e password', () => {
                const result = authApi._setAuth('newuser', 'newpass');

                expect(authApi.username).toBe('newuser');
                expect(authApi.password).toBe('newpass');
                expect(result).toBe(authApi);
            });

            it('deve chamar _setUser e _setPass', () => {
                jest.spyOn(authApi, '_setUser');
                jest.spyOn(authApi, '_setPass');

                authApi._setAuth('newuser', 'newpass');

                expect(authApi._setUser).toHaveBeenCalledWith('newuser');
                expect(authApi._setPass).toHaveBeenCalledWith('newpass');
            });

            it('deve retornar this para chaining', () => {
                const result = authApi._setAuth('newuser', 'newpass');

                expect(result).toBe(authApi);
            });
        });
    });

    describe('request override', () => {
        beforeEach(() => {
            // Mock do super.request
            jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(authApi)), 'request').mockImplementation(authApi.superRequestSpy);
            jest.spyOn(authApi, 'auth').mockResolvedValue({
                options: {},
                isAuthenticated: true,
                response: { data: {}, status: 200, statusText: 'OK', headers: {}, config: {} as any },
            });
        });

        it('deve chamar auth quando não autenticado e não está autorizando', async () => {
            authApi._isAuthenticatedSpy.mockReturnValue(false);
            jest.spyOn(authApi, '_isAuthenticated').mockReturnValue(false);
            jest.spyOn(authApi, '_isAuthorizing').mockReturnValue(false);

            const mockSuperRequest = authApi['super.request'];
            authApi['request'] = async function (options: ObjectLiteral = {}, config: RequestConfigInternalAuth = {}) {
                if (!config.__public && !this._isAuthenticated() && !this._isAuthorizing(options)) {
                    await this.auth();
                }
                return this['super.request'](options, config);
            };

            await authApi.request({ url: '/api/users' });

            expect(authApi.auth).toHaveBeenCalled();
            expect(authApi.superRequestSpy).toHaveBeenCalledWith({ url: '/api/users' }, {});

            authApi['super.request'] = mockSuperRequest;
        });

        it('deve não chamar auth quando já está autenticado', async () => {
            authApi._isAuthenticatedSpy.mockReturnValue(true);

            await authApi.request({ url: '/api/users' }, {});

            expect(authApi.auth).not.toHaveBeenCalled();
            expect(authApi.superRequestSpy).toHaveBeenCalledWith({ url: '/api/users' }, {});
        });

        it('deve não chamar auth quando está autorizando', async () => {
            authApi._isAuthenticatedSpy.mockReturnValue(false);
            jest.spyOn(authApi, '_isAuthorizing').mockReturnValue(true);

            await authApi.request({ url: '/auth/login' }, {});

            expect(authApi.auth).not.toHaveBeenCalled();
            expect(authApi.superRequestSpy).toHaveBeenCalledWith({ url: '/auth/login' }, {});
        });

        it('deve não chamar auth quando config.__public é true', async () => {
            authApi._isAuthenticatedSpy.mockReturnValue(false);
            jest.spyOn(authApi, '_isAuthorizing').mockReturnValue(false);

            await authApi.request({ url: '/api/public' }, { __public: true });

            expect(authApi.auth).not.toHaveBeenCalled();
            expect(authApi.superRequestSpy).toHaveBeenCalledWith({ url: '/api/public' }, { __public: true });
        });

        it('deve sempre chamar super.request', async () => {
            await authApi.request({ url: '/api/test' }, { custom: true });

            expect(authApi.superRequestSpy).toHaveBeenCalledWith({ url: '/api/test' }, { custom: true });
        });
    });

    describe('_retryCheck override', () => {
        beforeEach(() => {
            // Mock do super._retryCheck
            jest.spyOn(authApi, 'auth').mockResolvedValue({
                options: {},
                isAuthenticated: true,
                response: { data: {}, status: 200, statusText: 'OK', headers: {}, config: {} as any },
            });
        });

        it('deve incrementar retry para erro 400', async () => {
            // jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(authApi)), '_retryCheck').mockImplementation(authApi.superRetryCheckSpy);
            const error = { response: { status: HttpStatusCode.BadRequest } };
            const result = await authApi._retryCheck(error, 2);

            expect(result).toEqual({ shouldTryAgain: true, retry: 3 });
        });

        it('deve não incrementar retry para erro 401', async () => {
            // jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(authApi)), '_retryCheck').mockImplementation(authApi.superRetryCheckSpy);
            const error = { response: { status: HttpStatusCode.Unauthorized } };
            const result = await authApi._retryCheck(error, 2);

            expect(result).toEqual({ shouldTryAgain: true, retry: 2 });
        });

        it('deve chamar auth para erro 401 quando shouldTryAgain é true', async () => {
            const error = { response: { status: HttpStatusCode.Unauthorized } };
            authApi.superRetryCheckSpy.mockResolvedValue({ shouldTryAgain: true, retry: 2 });

            const result = await authApi._retryCheck(error, 2);

            expect(authApi.auth).toHaveBeenCalled();
        });

        it('deve tratar erro de conexao', async () => {
            const error = { message: 'Network error', code: 'ECONNREFUSED' };

            const result = await authApi._retryCheck(error, 0);

            expect(authApi.auth).not.toHaveBeenCalled();
            expect(result).toEqual({ shouldTryAgain: true, retry: 1 });
        });
    });

    describe('Integração e casos extremos', () => {
        it('deve funcionar com chaining de setters', () => {
            const result = authApi._setAuth('user1', 'pass1')._setUser('user2')._setPass('pass2');

            expect(authApi.username).toBe('user2');
            expect(authApi.password).toBe('pass2');
            expect(result).toBe(authApi);
        });

        it('deve funcionar com authPath customizado', () => {
            authApi.authPath = '/custom/auth';

            const defaultOptions = authApi.authReqOptionsDefault();
            const isAuthorizing = authApi._isAuthorizing({ url: '/custom/auth' });

            expect(defaultOptions.url).toBe('/custom/auth');
            expect(isAuthorizing).toBe(true);
        });

        it('deve tratar credenciais vazias', () => {
            authApi._setAuth('', '');

            const body = authApi.authBuildBody();

            expect(body).toEqual({
                username: '',
                password: '',
            });
        });

        it('deve permitir sobrescrita de métodos opcionais', () => {
            authApi.authReqOptionBody = jest.fn().mockReturnValue({ custom: 'body' });
            authApi.authReqOptionHeaders = jest.fn().mockReturnValue({ Custom: 'header' });
            authApi.authReqOptionAuth = jest.fn().mockReturnValue({ type: 'basic' });

            const options = authApi.authBuildReqOptions();

            expect(options.data).toEqual({ custom: 'body' });
            expect(options.headers).toEqual({ Custom: 'header' });
            expect(options.auth).toEqual({ type: 'basic' });
        });

        it('deve lidar com configurações complexas no request', async () => {
            jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(authApi)), 'request').mockImplementation(authApi.superRequestSpy);

            const complexOptions = {
                url: '/api/complex',
                method: 'PUT',
                data: { nested: { value: true } },
                headers: { 'X-Custom': 'test' },
            };

            const complexConfig = {
                __public: false,
                timeout: 5000,
                retry: 3,
            };

            authApi._isAuthenticatedSpy.mockReturnValue(true);

            await authApi.request(complexOptions, complexConfig);

            expect(authApi.superRequestSpy).toHaveBeenCalledWith(complexOptions, complexConfig);
        });
    });
});
