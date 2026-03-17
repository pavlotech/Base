import { IModuleDeps } from "@core/interfaces/deps.interface";
import { ModuleOptions } from "@core/interfaces/module.interface";
import { ModuleType } from "@core/enums/module.enum";
import { ConfigType } from "@core/interfaces/config.interface";

export default class Module {
    private readonly options: ModuleOptions;
    private readonly buildFn: (
        deps: IModuleDeps,
        config: ConfigType,
    ) => Promise<void>;
    private deps?: IModuleDeps;
    private config?: ConfigType;

    constructor(
        buildFn: (deps: IModuleDeps, config: ConfigType) => Promise<void>,
    );
    constructor(
        options: ModuleOptions,
        buildFn: (deps: IModuleDeps, config: ConfigType) => Promise<void>,
    );
    constructor(
        optionsOrBuildFn:
            | ModuleOptions
            | ((deps: IModuleDeps, config: ConfigType) => Promise<void>),
        buildFn?: (deps: IModuleDeps, config: ConfigType) => Promise<void>,
    ) {
        if (typeof optionsOrBuildFn === "function") {
            this.options = {};
            this.buildFn = optionsOrBuildFn;
        } else {
            this.options = optionsOrBuildFn;
            this.buildFn = buildFn!;
        }
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

export { ModuleType };
