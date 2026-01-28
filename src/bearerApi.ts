import { AuthOptions } from './interfaces/auth.interface';
import { TokenAuthApi } from './tokenAuthApi';

export abstract class BearerApi extends TokenAuthApi {
    authHeaderPrefix = 'Bearer';

    async authReqOptionBody(reqOptions: Partial<AuthOptions> = {}): Promise<any> {
        return this.authBuildBody(reqOptions);
    }
}
