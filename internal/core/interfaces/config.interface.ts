import config from "@config/index";

export interface IConfig {
    get(key: string): string;
}

export type ConfigType = typeof config;
