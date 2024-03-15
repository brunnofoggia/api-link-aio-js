import { PublicApi } from '../src/publicApi';
import { createApp, createServer, setRoutes } from './publicApi.test';

export const schema = 'http';
export const host = '127.0.0.1';
export const port = 1990;
export const baseUrl = `${schema}://${host}:${port}`;
export const fakeBaseUrl = `${schema}://${host}:1${port}`;

export class SomeIntegration extends PublicApi {
    baseUrl = baseUrl;

    _setDefaultInternalConfig() {
        this._defaultInternalConfig.__retryTimer = 10;
    }
}

export const CreateApiServer = async () => {
    const app = createApp(setRoutes);
    return await createServer(app, port);
};

export const emptyResponse = {
    status: 200,
};

export const getResponse = {
    ...emptyResponse,
    data: {
        receivedData: {
            method: 'GET',
        },
    },
};

export const postBody = {
    somedata: 'somevalue',
};

export const postResponse = {
    ...emptyResponse,
    data: {
        receivedData: {
            method: 'POST',
            body: postBody,
        },
    },
};

export const putBody = {
    somedata: 'someothervalue',
};

export const putResponse = {
    ...emptyResponse,
    data: {
        receivedData: {
            method: 'PUT',
            body: putBody,
            query: {
                x: '1',
            },
        },
    },
};

export const deleteHeaders = {
    'x-delete': 'true',
};

export const deleteResponse = {
    ...emptyResponse,
    data: {
        receivedData: {
            method: 'DELETE',
            body: postBody,
            headers: deleteHeaders,
        },
    },
};

export const uninitializedServerReject = { code: 'ECONNREFUSED' };

export const badRequestServerReject = { code: 'ERR_BAD_RESPONSE' };
