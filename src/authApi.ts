import { HttpStatusCode } from 'axios';

import { ObjectLiteral } from './common/types/objectLiteral';
import { RequestConfigInternalAuth } from './interfaces/requestConfig.interface';
import { PublicApi } from './publicApi';

export abstract class AuthApi extends PublicApi {
    authMethod: string = 'post';
    username: string;
    password: string;

    abstract authPath: string;
    abstract authResHandle(response): any;
    abstract _isAuthenticated(): boolean;

    authReqOptionBody(): any {}
    authReqOptionHeaders(): any {}
    authReqOptionAuth(): any {}

    authReqOptionsDefault() {
        return {
            url: this.authPath,
            method: this.authMethod || 'post',
        };
    }

    _setReqOptions(options: ObjectLiteral, keyName: string, value: any) {
        if (value !== undefined) {
            options[keyName] = value;
        }
        return this;
    }

    authBuildReqOptions() {
        const options: any = this.authReqOptionsDefault();

        this._setReqOptions(options, 'data', this.authReqOptionBody())
            ._setReqOptions(options, 'headers', this.authReqOptionHeaders())
            ._setReqOptions(options, 'auth', this.authReqOptionAuth());

        return options;
    }

    authBuildBody() {
        return {
            username: this._getUsername(),
            password: this._getPassword(),
        };
    }

    async auth() {
        this.debug('authenticating');
        const options = this.authBuildReqOptions();
        const response = await super._request(options);
        this.debug('authenticated', this.authResHandle(response));
    }

    _isAuthorizing(options) {
        return options.url.indexOf(this.authPath) >= 0;
    }

    _isUnauthorizedError(error) {
        return error?.response?.status === HttpStatusCode.Unauthorized;
    }

    _getUsername() {
        return this.username;
    }

    _getPassword() {
        return this.password;
    }

    _setUser(username: string) {
        this.username = username;
        return this;
    }

    _setPass(password: string) {
        this.password = password;
        return this;
    }

    _setAuth(username: string, password: string) {
        this._setUser(username);
        this._setPass(password);
        return this;
    }

    /* override */
    async request(options: ObjectLiteral = {}, config: RequestConfigInternalAuth = {}) {
        if (!config.__public && !this._isAuthenticated() && !this._isAuthorizing(options)) {
            await this.auth();
        }
        return super.request(options, config);
    }

    async _retryCheck(error, retry: number) {
        const isUnauthorized = this._isUnauthorizedError(error);
        if (!isUnauthorized) retry++;

        const { shouldTryAgain } = await super._retryCheck(error, retry);

        // re-authenticate
        if (isUnauthorized && shouldTryAgain) await this.auth();

        return { shouldTryAgain, retry };
    }
}
