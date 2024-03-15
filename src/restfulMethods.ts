import { AxiosRequestConfig, AxiosResponse } from 'axios';

import { ObjectLiteral } from './common/types/objectLiteral';
import { RequestConfigMixed, RequestConfigSplit } from './interfaces/requestConfig.interface';

export abstract class RestfulMethods {
    abstract request(options_: ObjectLiteral, config_: RequestConfigSplit | RequestConfigMixed): Promise<AxiosResponse>;

    public async get(url: string, options_: Partial<AxiosRequestConfig> = {}, config_: RequestConfigMixed = {}): Promise<AxiosResponse> {
        options_.url = url;
        options_.method = 'get';
        return this.request(options_, config_);
    }

    public async post(
        url: string,
        data: any = {},
        options_: Partial<AxiosRequestConfig> = {},
        config_: RequestConfigMixed = {},
    ): Promise<AxiosResponse> {
        options_.method = 'post';
        options_.url = url;
        options_.data = data;
        return this.request(options_, config_);
    }

    public async put(
        url: string,
        data: any = {},
        options_: Partial<AxiosRequestConfig> = {},
        config_: RequestConfigMixed = {},
    ): Promise<AxiosResponse> {
        options_.method = 'put';
        options_.url = url;
        options_.data = data;
        return this.request(options_, config_);
    }

    public async delete(url: string, options_: Partial<AxiosRequestConfig> = {}, config_: RequestConfigMixed = {}): Promise<AxiosResponse> {
        options_.method = 'delete';
        options_.url = url;
        return this.request(options_, config_);
    }

    public async patch(
        url: string,
        data: any = {},
        options_: Partial<AxiosRequestConfig> = {},
        config_: RequestConfigMixed = {},
    ): Promise<AxiosResponse> {
        options_.method = 'patch';
        options_.url = url;
        options_.data = data;
        return this.request(options_, config_);
    }

    public async head(url: string, options_: Partial<AxiosRequestConfig> = {}, config_: RequestConfigMixed = {}): Promise<AxiosResponse> {
        options_.method = 'head';
        options_.url = url;
        return this.request(options_, config_);
    }

    public async options(url: string, options_: Partial<AxiosRequestConfig> = {}, config_: RequestConfigMixed = {}): Promise<AxiosResponse> {
        options_.method = 'options';
        options_.url = url;
        return this.request(options_, config_);
    }
}
