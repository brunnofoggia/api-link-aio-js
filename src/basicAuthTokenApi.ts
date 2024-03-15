import { TokenAuthApi } from './tokenAuthApi';

export abstract class BasicAuthTokenApi extends TokenAuthApi {
    authHeaderPrefix = 'Bearer';

    authReqOptionAuth(): any {
        return this.authBuildBody();
    }
}
