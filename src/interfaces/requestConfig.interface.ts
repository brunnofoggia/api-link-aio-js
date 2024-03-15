import { ObjectLiteral } from 'common/types/objectLiteral';

export interface RequestConfigExternal extends ObjectLiteral {}

export interface RequestConfigInternal extends ObjectLiteral {
    __retry?: number;
    __retryTimer?: number;
}

export interface RequestConfigMixed extends RequestConfigInternal, RequestConfigExternal {}

export interface RequestConfigInternalAuth extends RequestConfigInternal {
    __public?: boolean;
}

export interface RequestConfigSplit {
    internal: RequestConfigInternal;
    external: ObjectLiteral;
    __isReady?: boolean;
}
