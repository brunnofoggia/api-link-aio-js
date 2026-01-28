import { defaultsDeep, get } from 'lodash';
import { AxiosResponse } from 'axios';

import { Err } from './common/utils/error';
import { ObjectLiteral } from './common/types/objectLiteral';
import { AuthApi } from './authApi';
import { ERROR_CODE } from './enum/error';

export const TokenAuthDefaultOptions = {
    authResTokenField: 'token',
};

export abstract class TokenAuthApi extends AuthApi {
    abstract authHeaderPrefix: string;

    authResTokenField: string = TokenAuthDefaultOptions.authResTokenField;
    token: string = '';

    _isAuthenticated() {
        return !!this.token;
    }

    setToken(token: string) {
        this.token = token;
    }

    clearToken() {
        this.token = '';
    }

    _getDefaultHeaders() {
        let defaultHeaders: ObjectLiteral = super._getDefaultHeaders();
        if (this._isAuthenticated()) {
            defaultHeaders = defaultsDeep(this._loggedHeaders() || {}, defaultHeaders);
        }
        return defaultHeaders;
    }

    _loggedHeaders() {
        return {
            Authorization: [this.authHeaderPrefix, this.token].join(' '),
        };
    }

    authResHandle(response: AxiosResponse) {
        const token = this.getTokenFromResponse(response);
        this.setToken(token);

        if (!this.token) {
            throw new Err('Failed to retrieve token from response', ERROR_CODE.TOKEN_MISSING);
        }
        return this.token;
    }

    getTokenFromResponse(response: AxiosResponse) {
        return get(response.data, this.authResTokenField, '');
    }
}
