import { defaults, isPlainObject } from 'lodash';

import { OAuth2Options } from './interfaces/auth.interface';
import { TokenAuthDefaultOptions as TokenAuthDefaultOptions, TokenAuthApi } from './tokenAuthApi';
import { Err } from 'common/utils/error';

export const OAuth2DefaultOptions = defaults(
    {
        authResTokenField: 'access_token',
        authResRefreshTokenField: 'refresh_token',
        scope: 'default',
    },
    TokenAuthDefaultOptions,
);

export abstract class OAuth2Api extends TokenAuthApi {
    // #region vars, getters and setters
    authGrantType: string;
    scope: string;
    authResRefreshTokenField: string;
    refreshToken: string;
    authResTokenField: string = OAuth2DefaultOptions.authResTokenField;
    authHeaderPrefix = 'Bearer';

    _defaultHeaders: any = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    authReqOptionHeaders(): any {
        return {
            'Content-Type': 'application/x-www-form-urlencoded',
        };
    }
    // #endregion

    async prepareInitializeOptions(args: any[]): Promise<any> {
        const options = (await super.prepareInitializeOptions(args)) as Partial<OAuth2Options>;

        if (options.baseUrl) this.baseUrl = options.baseUrl;
        // username = clientId
        if (options.username) this.username = options.username;
        // password = clientSecret
        if (options.password) this.password = options.password;
        if (options.authGrantType) this.authGrantType = options.authGrantType;
        if (options.authPath) this.authPath = options.authPath;

        // Optional
        if (options.scope || !this.scope) this.scope = options.scope || OAuth2DefaultOptions.scope;
        if (options.authResTokenField) this.authResTokenField = options.authResTokenField;
        if (options.authResRefreshTokenField || !this.authResRefreshTokenField)
            this.authResRefreshTokenField = options.authResRefreshTokenField || OAuth2DefaultOptions.authResRefreshTokenField;

        this.setToken(options?.token || '');

        return options;
    }

    async authReqOptionBody(reqOptions: Partial<OAuth2Options> = {}): Promise<any> {
        const body: any = {
            client_id: reqOptions.username || this._getUsername(),
        };

        const grantType = reqOptions.authGrantType || this.authGrantType;
        const scope = reqOptions.scope || this.scope;
        const password = reqOptions.password || this._getPassword();

        if (grantType) body.grant_type = grantType;
        if (scope) body.scope = scope;
        if (password) body.client_secret = password;

        return body;
    }
}
