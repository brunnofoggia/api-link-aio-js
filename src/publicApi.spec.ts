import '@test/common/jest.test';

import {
    CreateApiServer,
    SomeIntegration,
    baseUrl,
    getResponse,
    postResponse,
    fakeBaseUrl,
    postBody,
    uninitializedServerReject,
    putBody,
    putResponse,
    deleteResponse,
    deleteHeaders,
    badRequestServerReject,
} from '@test/publicIntegration.test';
import { closeServer } from '@test/publicApi.test';
import { Err } from 'common/utils/error';

let apiProvider, server;
describe('Api Provider', () => {
    beforeAll(async () => {
        server = await CreateApiServer();
    });

    beforeEach(async () => {
        apiProvider = new SomeIntegration();
        await apiProvider.initialize();
    });

    afterAll(async () => {
        await closeServer(server);
    });

    describe('prepare url', () => {
        it('url with base url', () => {
            expect.assertions(1);
            expect(apiProvider._prepareUrl('test')).toEqual(`${baseUrl}/test`);
        });

        it('url starting with slash', () => {
            expect.assertions(1);
            expect(apiProvider._prepareUrl('/test')).toEqual(`${baseUrl}/test`);
        });

        it('url with base url starting with slash', () => {
            expect.assertions(1);
            apiProvider.baseUrl = baseUrl + '/';
            expect(apiProvider._prepareUrl('test')).toEqual(`${baseUrl}/test`);
        });

        it('url and base url with slash', () => {
            expect.assertions(1);
            apiProvider.baseUrl = baseUrl + '/';
            expect(apiProvider._prepareUrl('/test')).toEqual(`${baseUrl}/test`);
        });

        it('full url', () => {
            expect.assertions(1);
            expect(apiProvider._prepareUrl('http://test')).toEqual('http://test');
        });
    });

    describe('server up', () => {
        it('successful get', async () => {
            expect.assertions(1);
            await expect(apiProvider._request({ url: 'test' })).resolves.toMatchObject(getResponse);
        });

        it('successful post', async () => {
            expect.assertions(1);
            await expect(apiProvider._request({ url: 'test', method: 'post', data: postBody })).resolves.toMatchObject(postResponse);
        });

        it('successful put', async () => {
            expect.assertions(1);
            await expect(apiProvider._request({ url: 'test?x=1', method: 'put', data: putBody })).resolves.toMatchObject(putResponse);
        });

        it('successful delete', async () => {
            expect.assertions(1);
            await expect(apiProvider._request({ url: 'test', method: 'delete', data: postBody, headers: deleteHeaders })).resolves.toMatchObject(
                deleteResponse,
            );
        });

        it('failed retries', async () => {
            expect.assertions(2);
            let c = 0;
            const error = new Error('');
            error['code'] = badRequestServerReject.code;

            jest.spyOn(apiProvider, '_request').mockImplementationOnce(() => {
                ++c;
                throw error;
            });

            await expect(apiProvider.request({ url: 'testerr' })).rejects.toThrowCode(badRequestServerReject.code);
            expect(c).toEqual(1);
        });
    });

    describe('server down', () => {
        it('failed request', async () => {
            expect.assertions(1);
            apiProvider.baseUrl = fakeBaseUrl;
            await expect(apiProvider._request({ url: 'test1' })).rejects.toThrow(uninitializedServerReject.code);
        });

        it('failed retries', async () => {
            expect.assertions(3);
            apiProvider.baseUrl = fakeBaseUrl;
            const error = new Error('');
            error['code'] = uninitializedServerReject.code;
            let c = 0;
            const retry = 3;

            jest.spyOn(apiProvider, '_request').mockImplementation(() => {
                ++c;
                throw error;
            });

            await expect(apiProvider._retryRequest({ url: 'test2' })).rejects.toThrow(error);
            await expect(apiProvider._retryRequest({ url: 'test2' })).rejects.toThrowCode(error['code']);
            expect(c).toEqual(retry * 2);
        });

        it('failed retries with custom retry', async () => {
            expect.assertions(2);
            apiProvider.baseUrl = fakeBaseUrl;
            const error = new Error('');
            error['code'] = uninitializedServerReject.code;
            let c = 0;
            jest.spyOn(apiProvider, '_request').mockImplementation(() => {
                ++c;
                throw error;
            });

            const __retry = 20;
            await expect(apiProvider._retryRequest({ url: 'test3' }, {}, __retry)).rejects.toThrow(error);
            expect(c).toEqual(__retry);
        });

        it('failed retries with custom retry setting', async () => {
            expect.assertions(2);
            apiProvider.baseUrl = fakeBaseUrl;
            const error = new Error('');
            error['code'] = uninitializedServerReject.code;
            let c = 0;
            jest.spyOn(apiProvider, '_request').mockImplementation(() => {
                ++c;
                throw error;
            });

            const __retry = 4;
            await expect(apiProvider.request({ url: 'test3' }, { __retry })).rejects.toThrow(error);
            expect(c).toEqual(__retry);
        });
    });
});
