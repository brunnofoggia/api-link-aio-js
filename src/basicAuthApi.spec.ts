import '@test/common/jest.test';
import _debug from 'debug';
const debug = _debug('test:class:api');

import { closeServer } from '@test/publicApi.test';
import { CreateApiServer, SomeBasicAuthIntegration, getResponse } from '@test/basicAuthIntegration.test';
import { getToken } from '@test/masterKeyApi.test';

let apiProvider: SomeBasicAuthIntegration, server;
describe('Basic Auth Api Provider', () => {
    beforeAll(async () => {
        server = await CreateApiServer();
    });

    beforeEach(async () => {
        apiProvider = new SomeBasicAuthIntegration();
        await apiProvider.initialize();
        // apiProvider.debug(debug);
    });

    afterAll(async () => {
        await closeServer(server);
    });

    describe('authentication', () => {
        it('should authenticate', async () => {
            expect.assertions(3);
            expect(apiProvider._isAuthenticated()).toBe(false);
            await apiProvider.auth();
            expect(apiProvider._isAuthenticated()).toBe(true);
            expect(apiProvider.token).toBe(getToken());
        });
    });

    describe('open endpoint', () => {
        it('should get', async () => {
            expect.assertions(2);
            const response = await apiProvider.request({ url: '/test' }, { __public: true });
            expect(apiProvider._isAuthenticated()).toBe(false);
            expect(response).toMatchObject(getResponse);
        });
    });

    describe('private endpoint', () => {
        it('should get', async () => {
            expect.assertions(3);
            const response = await apiProvider.request({ url: '/logged' });
            expect(apiProvider.token).toBe(getToken());
            expect(response).toMatchObject(getResponse);
            expect(apiProvider._isAuthenticated()).toBe(true);
        });
    });
});
