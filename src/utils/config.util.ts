import { config, DotenvParseOutput } from "dotenv";
import { existsSync } from "fs";
import { IConfig } from "src/core/interfaces/config.interface";
import appConfig from "app.config";

export default class Config implements IConfig {
    private readonly envConfig: DotenvParseOutput;
    private readonly appConfig: typeof appConfig;

    constructor() {
        const possiblePaths = [
            './.env',
            '../.env',
            '../../.env'
        ];

        const envPath = possiblePaths.find(path => existsSync(path));
        
        const envConfig = envPath 
            ? (() => {
                const { error, parsed } = config({ path: envPath, override: false });
                if (error) {
                    console.error('Error loading .env file:', error);
                }
                return (!error && parsed) ? parsed : {};
            })()
            : {};

        this.envConfig = envConfig;
        this.appConfig = appConfig;
    }

    public get(key: string): string {
        const envValue = process.env[key];
        if (envValue) {
            return envValue;
        }

        const configValue = this.envConfig[key];
        if (configValue) {
            return configValue;
        }

        throw new Error(`Environment variable ${key} not found in process.env or .env file`);
    }

    public get config() {
        return this.appConfig;
    }
}