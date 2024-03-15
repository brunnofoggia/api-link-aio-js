import { defaultsDeep, get } from 'lodash';

import { ObjectLiteral } from './common/types/objectLiteral';
import { AuthApi } from './authApi';
import { AxiosResponse } from 'axios';

export abstract class TokenAuthApi extends AuthApi {
    abstract authHeaderPrefix: string;

    authResTokenField: string = 'token';
    token: string = '';

    _isAuthenticated() {
        return !!this.token;
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
        return (this.token = this.getTokenFromResponse(response));
    }

    getTokenFromResponse(response: AxiosResponse) {
        return get(response.data, this.authResTokenField, '');
    }
}
