import '@test/common/jest.test';
import _debug from 'debug';
const debug = _debug('test:class:api');

import { closeServer } from '@test/publicApi.test';
import { CreateApiServer, SomeMasterKeyIntegration, getResponse } from '@test/masterKeyIntegration.test';
import { getToken } from '@test/masterKeyApi.test';

let apiProvider: SomeMasterKeyIntegration, server;
describe('MasterKey Api Provider', () => {
    beforeAll(async () => {
        server = await CreateApiServer();
    });

    beforeEach(async () => {
        apiProvider = new SomeMasterKeyIntegration();
        await apiProvider.initialize();
        // apiProvider.debug(debug);
    });

    afterAll(async () => {
        await closeServer(server);
    });

    describe('open endpoint', () => {
        it('should get', async () => {
            expect.assertions(2);
            const response = await apiProvider.request({ url: '/test' }, { __public: true });
            expect(apiProvider._isAuthenticated()).toBe(true);
            expect(response).toMatchObject(getResponse);
        });
    });

    describe('private endpoint', () => {
        it('should get', async () => {
            expect.assertions(2);
            expect(apiProvider.token).toBe(getToken());
            const response = await apiProvider.request({ url: '/logged' });
            expect(response).toMatchObject(getResponse);
        });
    });
});
