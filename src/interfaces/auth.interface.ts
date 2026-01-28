export interface AuthOptions {
    username: string;
    password: string;
}

export interface OAuth2Options extends AuthOptions {
    baseUrl: string;
    authPath: string;
    authGrantType: string;
    scope?: string;
    authResTokenField?: string;
    authResRefreshTokenField?: string;
    token?: string;
}

export interface OAuth2PrivateKeyOptions extends OAuth2Options {
    privateKey?: string;
    assertionType?: string;
    assertionTTL?: number;
    assertionAlg?: string;
    assertionNotBeforeOffset?: number;
    assertionTimestampInSeconds?: boolean | number;
    // rare cases that you want to provide your own generated
    assertion?: string;
}
