import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { defaultsDeep, forEach, omitBy, size } from 'lodash';

import { Err } from './common/utils/error';
import { sleep } from './common/utils/sleep';
import { ObjectLiteral } from './common/types/objectLiteral';
import { RequestConfigExternal, RequestConfigInternal, RequestConfigMixed, RequestConfigSplit } from './interfaces/requestConfig.interface';
import { debugInjection } from './common/utils/debug';
import { ERROR_CODE } from './enum/error';
import { RestfulMethods } from './restfulMethods';

export abstract class PublicApi extends RestfulMethods {
    _initialized = false;
    baseUrl: string = '';

    debug = debugInjection;
    _defaultConfig: ObjectLiteral;
    _defaultInternalConfig: ObjectLiteral = {
        __retry: 3,
        __retryTimer: 1000,
    };
    _defaultHeaders: ObjectLiteral = {
        'Content-Type': 'application/json',
    };

    async initialize(...args) {
        await this._setDefaultHeaders();
        await this._setDefaultConfig();
        this._initialized = true;
    }

    async _request(options_: AxiosRequestConfig = {}, config_: RequestConfigSplit | RequestConfigMixed = {}): Promise<AxiosResponse> {
        if (!this._initialized)
            throw new Err('api integration not initialized. Execute "await instance.initialize()" first.', ERROR_CODE.NOT_INITIALIZED);
        const options = this._prepareOptions(options_);
        const config = this._prepareConfig(config_);

        return await axios(options);
    }

    _prepareOptions(options_: AxiosRequestConfig = {}) {
        if (!options_['__isReady']) {
            const options = this._applyDefaultOptions(options_);
            const url = this._prepareUrl(options.url || '');

            this.debug('url requested', url);
            options.url = url;
            options['__isReady'] = true;
            return options;
        }
        return options_;
    }

    _prepareUrl(url_: string) {
        if (/^http/.test(url_)) return url_;
        else if (!this.baseUrl) throw new Err('base url not found for api request', ERROR_CODE.MISSING_BASE_URL);

        const baseUrl = this.baseUrl.replace(/\/$/, '');
        const url = url_.replace(/^\//, '');
        return [baseUrl, url].join('/');
    }

    _prepareConfig(config_: RequestConfigSplit | RequestConfigMixed = {}): RequestConfigSplit {
        if (!config_.__isReady) {
            const config: RequestConfigSplit = this._applyDefaultConfig(config_);
            config.__isReady = true;

            return config;
        }
        return config_ as RequestConfigSplit;
    }

    _applyDefaultOptions(options_: ObjectLiteral = {}) {
        return defaultsDeep({}, options_, this._buildDefaultOptions(options_));
    }

    _applyDefaultConfig(config_: ObjectLiteral = {}): RequestConfigSplit {
        return this._separateInternal(defaultsDeep({}, config_, this._getDefaultConfig()));
    }

    _separateInternal(obj: ObjectLiteral = {}): RequestConfigSplit {
        const internal: RequestConfigInternal = {};
        const external: RequestConfigExternal = {};
        forEach(obj, function (value, key) {
            if (key.startsWith('__')) {
                internal[key] = value;
            } else {
                external[key] = value;
            }
        });

        return { internal, external };
    }

    _stripInternal(obj: ObjectLiteral = {}) {
        return omitBy(obj, (value: any, key: string) => key.startsWith('__'));
    }

    _setDefaultConfig() {
        this._setDefaultInternalConfig();
        this._defaultConfig = defaultsDeep({}, this._getDefaultInternalConfig(), this._getDefaultConfig);
    }

    _setDefaultInternalConfig() {}

    _getDefaultConfig() {
        return this._defaultConfig;
    }

    _getDefaultInternalConfig() {
        return this._defaultInternalConfig;
    }

    _buildDefaultOptions(options_: ObjectLiteral = {}) {
        return {
            url: '',
            method: size(options_.data) ? 'post' : 'get',
            headers: this._getDefaultHeaders(),
        };
    }

    _setDefaultHeaders() {}

    _getDefaultHeaders() {
        return this._defaultHeaders;
    }

    /* retry pattern */
    async request(options_: AxiosRequestConfig = {}, config_: RequestConfigInternal = {}) {
        const options = this._prepareOptions(options_);
        const config = this._prepareConfig(config_);

        if (config.internal.__retry) {
            return this._retryRequest(options, config);
        }
        return this._request(options, config);
    }

    async _retryRequest(options_: AxiosRequestConfig = {}, config_: ObjectLiteral = {}, retry_ = undefined) {
        const options = this._prepareOptions(options_);
        const config = this._prepareConfig(config_);
        const retry = retry_ === undefined ? config.internal.__retry : retry_;

        try {
            retry_ === undefined && this.debug('first try request', options.url);
            return await this._request(options, config);
        } catch (error) {
            return this._handleRetryRequestError(error, options, config, retry - 1);
        }
    }

    async _handleRetryRequestError(error: any, options: AxiosRequestConfig, config: RequestConfigSplit, retry_: number) {
        const { shouldTryAgain, retry } = await this._retryCheck(error, retry_);
        if (shouldTryAgain) {
            this.debug('will try again', retry, options.url, error.code, error.message);
            await sleep(config.internal.__retryTimer);
            return await this._retryRequest(options, config, retry);
        }

        await this._dispatchRequestError(error, options);
    }

    async _retryCheck(error, retry: number) {
        const shouldTryAgain = error.code === 'ECONNREFUSED' && retry > 0;
        return { shouldTryAgain, retry };
    }

    async _dispatchRequestError(error: any, options: AxiosRequestConfig) {
        const data = typeof error.response?.data === 'object' ? error.response?.data : {};
        const dataStr: any = typeof data === 'object' ? JSON.stringify(data) : error.response?.data || '';
        this.debug([error.code, error.message || '', dataStr, options.url]);
        this.debug('options', options);

        error.code = error.code || ERROR_CODE.UNKNOWN;
        throw error;
    }
}
