import { bind } from 'lodash';
import { BearerApi } from './bearerApi';
import { TokenAuthApi } from './tokenAuthApi';
import { PublicApi } from './publicApi';

export abstract class MasterKeyApi extends PublicApi {
    authHeaderPrefix = 'Token';

    _loggedHeaders() {
        return bind(BearerApi.prototype._loggedHeaders, this)();
    }

    _isAuthenticated() {
        return bind(TokenAuthApi.prototype._isAuthenticated, this)();
    }

    _getDefaultHeaders() {
        return bind(TokenAuthApi.prototype._getDefaultHeaders, this)();
    }
}
