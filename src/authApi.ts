import { HttpStatusCode } from 'axios';

import { ObjectLiteral } from './common/types/objectLiteral';
import { RequestConfigInternalAuth } from './interfaces/requestConfig.interface';
import { PublicApi } from './publicApi';
import { omit } from 'lodash';
import { AuthOptions } from './interfaces/auth.interface';
import { Err } from './common/utils/error';
import { ERROR_CODE } from './enum/error';

export abstract class AuthApi extends PublicApi {
    authMethod: string = 'post';
    username: string;
    password: string;
    authPath: string;

    abstract authResHandle(response): any;
    abstract _isAuthenticated(): boolean;

    async authReqOptionBody(options: Partial<AuthOptions> = {}): Promise<any> {}
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

    async authBuildReqOptions(options: Partial<AuthOptions> = {}) {
        const reqOptions: any = this.authReqOptionsDefault();

        this._setReqOptions(reqOptions, 'data', await this.authReqOptionBody(options))
            ._setReqOptions(reqOptions, 'headers', omit(this.authReqOptionHeaders(), 'Authorization'))
            ._setReqOptions(reqOptions, 'auth', this.authReqOptionAuth());

        return reqOptions;
    }

    // generic builder. will be used into authReqOptionsBody of subclasses, for example.
    authBuildBody(options: Partial<AuthOptions> = {}) {
        return {
            username: options.username || this._getUsername(),
            password: options.password || this._getPassword(),
        };
    }

    async auth(_options: Partial<AuthOptions> = {}) {
        this.debug('authenticating');
        if (!this.authPath) {
            throw new Err('authPath is required', ERROR_CODE.MISSING_AUTH_URL);
        }

        const reqOptions = await this.authBuildReqOptions(_options);
        const response = await this._request(reqOptions);
        this.debug('authenticated', this.authResHandle(response));

        return { options: reqOptions, isAuthenticated: this._isAuthenticated(), response };
    }

    _isAuthorizing(options) {
        return options.url.indexOf(this.authPath) >= 0;
    }

    _isUnauthorizedError(error) {
        const status = error?.response?.status;
        return !!(status && status === HttpStatusCode.Unauthorized);
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
        if (isUnauthorized) {
            retry++;
        }

        let { shouldTryAgain } = await super._retryCheck(error, retry);

        // re-authenticate
        if (isUnauthorized && retry) {
            await this.auth();
            shouldTryAgain = true;
        }

        return { shouldTryAgain, retry };
    }
}
