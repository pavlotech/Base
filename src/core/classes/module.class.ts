import { IModuleDeps } from "src/core/interfaces/deps.interface";
import { ModuleOptions } from "src/core/interfaces/module.interface.js";
import { ModuleType } from 'src/core/enums/module.enum';
import { ConfigType } from "src/core/interfaces/config.interface";

export default class Module {
    private buildFn: (deps: IModuleDeps, config: ConfigType) => Promise<void>;
    private deps?: IModuleDeps;
    private config?: ConfigType;

    constructor(private readonly options: ModuleOptions, buildFn: (deps: IModuleDeps, config: ConfigType) => Promise<void>) {
        this.buildFn = buildFn;
    }

    public setDeps(deps: IModuleDeps) {
        this.deps = deps;
    }

    public setConfig(config: ConfigType) {
        this.config = config;
    }

    public async init() {
        if (!this.deps) {
            throw new Error("Dependencies not installed");
        }
        await this.buildFn(this.deps, this.config as ConfigType);
    }   

    public getOptions(): ModuleOptions {
        return this.options;
    }
}

export {
    ModuleType
}