import { TokenAuthApi } from './tokenAuthApi';

export abstract class BearerApi extends TokenAuthApi {
    authHeaderPrefix = 'Bearer';

    authReqOptionBody(): any {
        return this.authBuildBody();
    }
}
