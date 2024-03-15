import { AxiosResponse } from 'axios';

import { BearerApi } from '../src/bearerApi';
import { createApp, createServer } from './publicApi.test';
import { setRoutes } from './masterKeyApi.test';
import { MasterKeyApi } from '../src/masterKeyApi';
import { getToken } from './masterKeyApi.test';

export const schema = 'http';
export const host = '127.0.0.1';
export const port = 1990;
export const baseUrl = `${schema}://${host}:${port}`;
export const fakeBaseUrl = `${schema}://${host}:1${port}`;

export class SomeMasterKeyIntegration extends MasterKeyApi {
    baseUrl = baseUrl;
    token = getToken();

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

export const uninitializedServerReject = { code: 'ECONNREFUSED' };
