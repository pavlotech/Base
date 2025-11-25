import { ISceneDeps } from "../interfaces/deps.interface";
import { SceneOptions } from "../interfaces/scene.interface";
import { ConfigType } from "../interfaces/config.interface";

export default class Scene {
    public readonly name: string;
    private buildFn: (deps: ISceneDeps, config: ConfigType) => Promise<void>;
    private deps?: ISceneDeps;
    private config?: ConfigType;

    constructor(private readonly options: SceneOptions, buildFn: (deps: ISceneDeps, config: ConfigType) => Promise<void>) {
        this.name = options.name;
        this.buildFn = buildFn;
    }

    public setDeps(deps: ISceneDeps) {
        this.deps = deps;
    }

    public setConfig(config: ConfigType) {
        this.config = config;
    }

    public async init() {
        if (!this.deps) {
            throw new Error("Dependencies not installed");
        }
        if (!this.config) {
            throw new Error("Config not installed");
        }
        await this.buildFn(this.deps, this.config);
    }
}