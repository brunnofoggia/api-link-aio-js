import { AxiosResponse, AxiosRequestConfig } from 'axios';
import { RestfulMethods } from './restfulMethods';
import { ObjectLiteral } from './common/types/objectLiteral';
import { RequestConfigMixed, RequestConfigSplit } from './interfaces/requestConfig.interface';

// Implementação concreta para testes
class TestRestfulMethods extends RestfulMethods {
    public requestSpy = jest.fn();

    async request(options_: ObjectLiteral, config_: RequestConfigSplit | RequestConfigMixed): Promise<AxiosResponse> {
        return this.requestSpy(options_, config_);
    }
}

describe('RestfulMethods', () => {
    let restfulMethods: TestRestfulMethods;
    let mockResponse: AxiosResponse;

    beforeEach(() => {
        restfulMethods = new TestRestfulMethods();

        // Mock da resposta padrão do Axios
        mockResponse = {
            data: { success: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
            request: {},
        };

        restfulMethods.requestSpy.mockResolvedValue(mockResponse);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET method', () => {
        it('deve fazer requisição GET básica', async () => {
            const url = '/api/users';

            const result = await restfulMethods.get(url);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    url: '/api/users',
                    method: 'get',
                },
                {},
            );
            expect(result).toBe(mockResponse);
        });

        it('deve fazer requisição GET com options', async () => {
            const url = '/api/users';
            const options = {
                headers: { Authorization: 'Bearer token' },
                timeout: 5000,
            };

            await restfulMethods.get(url, options);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    url: '/api/users',
                    method: 'get',
                    headers: { Authorization: 'Bearer token' },
                    timeout: 5000,
                },
                {},
            );
        });

        it('deve fazer requisição GET com config personalizado', async () => {
            const url = '/api/users';
            const options = { params: { page: 1 } };
            const config = { retry: 3, cache: true };

            await restfulMethods.get(url, options, config);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    url: '/api/users',
                    method: 'get',
                    params: { page: 1 },
                },
                { retry: 3, cache: true },
            );
        });

        it('deve sobrescrever URL se já existir em options', async () => {
            const url = '/api/users';
            const options = { url: '/api/old-url' };

            await restfulMethods.get(url, options);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    url: '/api/users', // URL do parâmetro deve sobrescrever
                    method: 'get',
                },
                {},
            );
        });
    });

    describe('POST method', () => {
        it('deve fazer requisição POST básica', async () => {
            const url = '/api/users';
            const data = { name: 'John', email: 'john@example.com' };

            await restfulMethods.post(url, data);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'post',
                    url: '/api/users',
                    data: { name: 'John', email: 'john@example.com' },
                },
                {},
            );
        });

        it('deve fazer requisição POST sem data', async () => {
            const url = '/api/users';

            await restfulMethods.post(url);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'post',
                    url: '/api/users',
                    data: {},
                },
                {},
            );
        });

        it('deve fazer requisição POST com data null', async () => {
            const url = '/api/users';

            await restfulMethods.post(url, null);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'post',
                    url: '/api/users',
                    data: null,
                },
                {},
            );
        });

        it('deve fazer requisição POST com options e config', async () => {
            const url = '/api/users';
            const data = { name: 'John' };
            const options = {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            };
            const config = { validateStatus: (status: number) => status < 400 };

            await restfulMethods.post(url, data, options, config);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'post',
                    url: '/api/users',
                    data: { name: 'John' },
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000,
                },
                { validateStatus: config.validateStatus },
            );
        });

        it('deve sobrescrever data se já existir em options', async () => {
            const url = '/api/users';
            const data = { name: 'John' };
            const options = { data: { name: 'Old Name' } };

            await restfulMethods.post(url, data, options);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { name: 'John' }, // Data do parâmetro deve sobrescrever
                }),
                {},
            );
        });
    });

    describe('PUT method', () => {
        it('deve fazer requisição PUT básica', async () => {
            const url = '/api/users/1';
            const data = { name: 'John Updated', email: 'john.updated@example.com' };

            await restfulMethods.put(url, data);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'put',
                    url: '/api/users/1',
                    data: { name: 'John Updated', email: 'john.updated@example.com' },
                },
                {},
            );
        });

        it('deve fazer requisição PUT sem data', async () => {
            const url = '/api/users/1';

            await restfulMethods.put(url);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'put',
                    url: '/api/users/1',
                    data: {},
                },
                {},
            );
        });

        it('deve fazer requisição PUT com options completas', async () => {
            const url = '/api/users/1';
            const data = { status: 'active' };
            const options = {
                headers: { 'If-Match': 'etag-123' },
                params: { force: true },
            };
            const config = { timeout: 30000 };

            await restfulMethods.put(url, data, options, config);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'put',
                    url: '/api/users/1',
                    data: { status: 'active' },
                    headers: { 'If-Match': 'etag-123' },
                    params: { force: true },
                },
                { timeout: 30000 },
            );
        });
    });

    describe('DELETE method', () => {
        it('deve fazer requisição DELETE básica', async () => {
            const url = '/api/users/1';

            await restfulMethods.delete(url);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'delete',
                    url: '/api/users/1',
                },
                {},
            );
        });

        it('deve fazer requisição DELETE com options', async () => {
            const url = '/api/users/1';
            const options = {
                headers: { Authorization: 'Bearer token' },
                params: { force: true },
            };

            await restfulMethods.delete(url, options);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'delete',
                    url: '/api/users/1',
                    headers: { Authorization: 'Bearer token' },
                    params: { force: true },
                },
                {},
            );
        });

        it('deve fazer requisição DELETE com config', async () => {
            const url = '/api/users/1';
            const options = {};
            const config = { validateStatus: (status: number) => status === 204 };

            await restfulMethods.delete(url, options, config);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'delete',
                    url: '/api/users/1',
                },
                { validateStatus: config.validateStatus },
            );
        });
    });

    describe('PATCH method', () => {
        it('deve fazer requisição PATCH básica', async () => {
            const url = '/api/users/1';
            const data = { status: 'inactive' };

            await restfulMethods.patch(url, data);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'patch',
                    url: '/api/users/1',
                    data: { status: 'inactive' },
                },
                {},
            );
        });

        it('deve fazer requisição PATCH sem data', async () => {
            const url = '/api/users/1';

            await restfulMethods.patch(url);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'patch',
                    url: '/api/users/1',
                    data: {},
                },
                {},
            );
        });

        it('deve fazer requisição PATCH com JSON Patch', async () => {
            const url = '/api/users/1';
            const data = [
                { op: 'replace', path: '/status', value: 'active' },
                { op: 'add', path: '/lastLogin', value: new Date().toISOString() },
            ];
            const options = {
                headers: { 'Content-Type': 'application/json-patch+json' },
            };

            await restfulMethods.patch(url, data, options);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'patch',
                    url: '/api/users/1',
                    data: data,
                    headers: { 'Content-Type': 'application/json-patch+json' },
                },
                {},
            );
        });
    });

    describe('HEAD method', () => {
        it('deve fazer requisição HEAD básica', async () => {
            const url = '/api/users/1';

            await restfulMethods.head(url);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'head',
                    url: '/api/users/1',
                },
                {},
            );
        });

        it('deve fazer requisição HEAD com options', async () => {
            const url = '/api/files/document.pdf';
            const options = {
                headers: { Authorization: 'Bearer token' },
                timeout: 5000,
            };

            await restfulMethods.head(url, options);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'head',
                    url: '/api/files/document.pdf',
                    headers: { Authorization: 'Bearer token' },
                    timeout: 5000,
                },
                {},
            );
        });

        it('deve fazer requisição HEAD para verificar existência de recurso', async () => {
            const url = '/api/users/exists';
            const options = { params: { email: 'test@example.com' } };
            const config = { validateStatus: (status: number) => status === 200 || status === 404 };

            await restfulMethods.head(url, options, config);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'head',
                    url: '/api/users/exists',
                    params: { email: 'test@example.com' },
                },
                { validateStatus: config.validateStatus },
            );
        });
    });

    describe('OPTIONS method', () => {
        it('deve fazer requisição OPTIONS básica', async () => {
            const url = '/api/users';

            await restfulMethods.options(url);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'options',
                    url: '/api/users',
                },
                {},
            );
        });

        it('deve fazer requisição OPTIONS com headers CORS', async () => {
            const url = '/api/users';
            const options = {
                headers: {
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type, Authorization',
                },
            };

            await restfulMethods.options(url, options);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'options',
                    url: '/api/users',
                    headers: {
                        'Access-Control-Request-Method': 'POST',
                        'Access-Control-Request-Headers': 'Content-Type, Authorization',
                    },
                },
                {},
            );
        });

        it('deve fazer requisição OPTIONS para preflight CORS', async () => {
            const url = '/api/users';
            const options = {};
            const config = {
                withCredentials: true,
                validateStatus: (status: number) => status >= 200 && status < 300,
            };

            await restfulMethods.options(url, options, config);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    method: 'options',
                    url: '/api/users',
                },
                {
                    withCredentials: true,
                    validateStatus: config.validateStatus,
                },
            );
        });
    });

    describe('Casos extremos e validações', () => {
        it('deve tratar URLs com query strings', async () => {
            const url = '/api/users?page=1&limit=10';

            await restfulMethods.get(url);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    url: '/api/users?page=1&limit=10',
                    method: 'get',
                },
                {},
            );
        });

        it('deve tratar URLs absolutas', async () => {
            const url = 'https://api.example.com/users';

            await restfulMethods.get(url);

            expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                {
                    url: 'https://api.example.com/users',
                    method: 'get',
                },
                {},
            );
        });

        it('deve tratar data com tipos diversos', async () => {
            const testCases = [
                { name: 'string', data: 'plain text' },
                { name: 'number', data: 42 },
                { name: 'boolean', data: true },
                { name: 'array', data: [1, 2, 3] },
                { name: 'FormData', data: new FormData() },
            ];

            for (const testCase of testCases) {
                await restfulMethods.post('/api/test', testCase.data);

                expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: testCase.data,
                    }),
                    {},
                );
            }
        });

        it('deve preservar referências de objetos', async () => {
            const data = { name: 'John' };
            const options = { timeout: 5000 };
            const config = { retry: 3 };

            await restfulMethods.post('/api/users', data, options, config);

            const [calledOptions, calledConfig] = restfulMethods.requestSpy.mock.calls[0];

            // Verifica que as referências são preservadas onde apropriado
            expect(calledOptions.data).toBe(data);
            expect(calledConfig).toBe(config);
        });

        it('deve propagar erros do método request', async () => {
            const error = new Error('Network error');
            restfulMethods.requestSpy.mockRejectedValue(error);

            await expect(restfulMethods.get('/api/users')).rejects.toThrow('Network error');
            await expect(restfulMethods.post('/api/users', {})).rejects.toThrow('Network error');
            await expect(restfulMethods.put('/api/users/1', {})).rejects.toThrow('Network error');
            await expect(restfulMethods.delete('/api/users/1')).rejects.toThrow('Network error');
            await expect(restfulMethods.patch('/api/users/1', {})).rejects.toThrow('Network error');
            await expect(restfulMethods.head('/api/users/1')).rejects.toThrow('Network error');
            await expect(restfulMethods.options('/api/users')).rejects.toThrow('Network error');
        });

        it('deve manter ordem de propriedades ao sobrescrever', async () => {
            const options = {
                method: 'get', // Será sobrescrito
                url: '/old-url', // Será sobrescrito
                headers: { Custom: 'header' },
                timeout: 5000,
            };

            await restfulMethods.post('/api/users', { name: 'John' }, options);

            const [calledOptions] = restfulMethods.requestSpy.mock.calls[0];

            expect(calledOptions.method).toBe('post');
            expect(calledOptions.url).toBe('/api/users');
            expect(calledOptions.headers).toEqual({ Custom: 'header' });
            expect(calledOptions.timeout).toBe(5000);
        });
    });

    describe('Consistência entre métodos', () => {
        it('deve ter assinatura similar para métodos com data', async () => {
            const url = '/api/test';
            const data = { test: true };
            const options = { timeout: 1000 };
            const config = { retry: 1 };

            const methods = ['post', 'put', 'patch'] as const;

            for (const method of methods) {
                await restfulMethods[method](url, data, options, config);

                expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        method,
                        url,
                        data,
                        timeout: 1000,
                    }),
                    { retry: 1 },
                );
            }
        });

        it('deve ter assinatura similar para métodos sem data', async () => {
            const url = '/api/test';
            const options = { timeout: 1000 };
            const config = { retry: 1 };

            const methods = ['get', 'delete', 'head', 'options'] as const;

            for (const method of methods) {
                await restfulMethods[method](url, options, config);

                expect(restfulMethods.requestSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        method,
                        url,
                        timeout: 1000,
                    }),
                    { retry: 1 },
                );
            }
        });

        it('deve sempre retornar Promise<AxiosResponse>', async () => {
            const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'] as const;

            for (const method of methods) {
                const result =
                    method === 'get' || method === 'delete' || method === 'head' || method === 'options'
                        ? await restfulMethods[method]('/api/test')
                        : await restfulMethods[method]('/api/test', {});

                expect(result).toBe(mockResponse);
                expect(result).toHaveProperty('data');
                expect(result).toHaveProperty('status');
                expect(result).toHaveProperty('statusText');
                expect(result).toHaveProperty('headers');
                expect(result).toHaveProperty('config');
            }
        });
    });
});
