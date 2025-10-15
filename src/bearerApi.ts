import { AuthOptions } from './interfaces/auth.interface';
import { TokenAuthApi } from './tokenAuthApi';

export abstract class BearerApi extends TokenAuthApi {
    authHeaderPrefix = 'Bearer';

    authReqOptionBody(reqOptions: Partial<AuthOptions> = {}): any {
        return this.authBuildBody(reqOptions);
    }
}
