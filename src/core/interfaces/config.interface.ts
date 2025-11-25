import config from "app.config";

export interface IConfig {
    get(key: string): string;
}

export type ConfigType = typeof config;