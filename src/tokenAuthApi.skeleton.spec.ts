import { AxiosResponse } from 'axios';
import { TokenAuthApi } from './tokenAuthApi';
import * as lodash from 'lodash';

// Mock das funções específicas do lodash
jest.mock('lodash', () => ({
    ...jest.requireActual('lodash'),
    defaultsDeep: jest.fn(),
    get: jest.fn(),
}));

// Classe concreta mínima - USA A CLASSE ORIGINAL
class TestTokenAuthApi extends TokenAuthApi {
    authHeaderPrefix = 'Bearer';
}

describe('TokenAuthApi - Coverage Real', () => {
    let api: TestTokenAuthApi;

    beforeEach(() => {
        api = new TestTokenAuthApi();
        jest.clearAllMocks();

        // Mock super._getDefaultHeaders para simular classe pai
        // jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(api)), '_getDefaultHeaders').mockReturnValue({ 'Content-Type': 'application/json' });

        // Configure mocks padrão
        (lodash.defaultsDeep as jest.Mock).mockReturnValue({});
        (lodash.get as jest.Mock).mockReturnValue('');
    });

    // TESTE LINHA 24 - Executa defaultsDeep quando autenticado
    it('clearToken - deve limpar o token', () => {
        // Setup: usuário autenticado para triggerar linha 24
        api.setToken('valid-token');
        expect(api._isAuthenticated()).toBe(true);
        api.clearToken();
        expect(api._isAuthenticated()).toBe(false);
    });

    // TESTE LINHA 24 - Testa o "|| {}" quando _loggedHeaders retorna null
    it('executa linha 24 - fallback || {} quando _loggedHeaders é null', () => {
        // Setup para triggerar linha 24
        api.setToken('token');
        jest.spyOn(api, '_loggedHeaders').mockReturnValue(null);

        // Executa
        api._getDefaultHeaders();

        // Verifica que defaultsDeep foi chamado com {} (fallback da linha 24)
        expect(lodash.defaultsDeep).toHaveBeenCalledWith({}, { 'Content-Type': 'application/json' });
    });

    // TESTE LINHA 46 - Executa throw quando !this.token
    it('executa linha 46 - throw quando token está vazio', () => {
        // Setup: get retorna string vazia para triggerar linha 46
        (lodash.get as jest.Mock).mockReturnValue('');

        const response: AxiosResponse = {
            data: {},
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
        };

        // Executa e verifica que linha 46 REAL é executada (throw)
        expect(() => api.authResHandle(response)).toThrow('Failed to retrieve token from response');
    });

    // TESTE LINHA 46 - Executa throw quando setToken não define token
    it('executa linha 46 - throw quando setToken falha', () => {
        // Setup: get retorna token válido mas setToken falha
        (lodash.get as jest.Mock).mockReturnValue('valid-token');
        jest.spyOn(api, 'setToken').mockImplementation(() => {
            // Falha intencionalmente - não define this.token
        });

        const response: AxiosResponse = {
            data: { token: 'valid-token' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
        };

        // Executa - linha 46 REAL deve ser executada porque !this.token será true
        expect(() => api.authResHandle(response)).toThrow('Failed to retrieve token from response');
    });
});
