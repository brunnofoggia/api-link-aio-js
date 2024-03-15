import { AxiosResponse } from 'axios';

import { BearerApi } from '../src/bearerApi';
import { BasicAuthTokenApi } from '../src/basicAuthTokenApi';
import { createApp, setRoutes } from './basicAuthApi.test';
import { createServer } from './publicApi.test';

export const schema = 'http';
export const host = '127.0.0.1';
export const port = 1990;
export const baseUrl = `${schema}://${host}:${port}`;
export const fakeBaseUrl = `${schema}://${host}:1${port}`;

export class SomeBasicAuthIntegration extends BasicAuthTokenApi {
    baseUrl = baseUrl;
    authPath = '/auth';
    authResTokenField = 'token';
    username = 'someuser';
    password = 'somepass';

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

export const uninitializedServerReject = { code: 'ECONNREFUSED' };
