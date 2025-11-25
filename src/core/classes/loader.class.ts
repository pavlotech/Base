import { IBaseDeps, IModuleDeps, ISceneDeps } from "src/core/interfaces/deps.interface";
import path from "path";
import fs from "fs";
import Module from "src/core/classes/module.class";
import Scene from "src/core/classes/scene.class";
import { Scenes } from "telegraf";
import { ModuleType } from "src/core/enums/module.enum";
import { Config } from "src/core/interfaces/config.interface";
import config from "app.config";

export default class Loader {
    private readonly deps: IBaseDeps;
    private readonly config: Config;
    private readonly modulesPath: string = path.join(process.cwd(), "src", "application", "modules");
    private readonly scenesPath: string = path.join(process.cwd(), "src", "application", "scenes");
    private readonly suffix: string = ".ts";

    constructor(deps: IBaseDeps) {
        this.deps = deps;
        this.config = config;
    }

    public async loadModules(): Promise<void> {
        const moduleFiles = this.getFiles(this.modulesPath, this.suffix);
        const modules: { file: string; instance: Module; type: string }[] = [];

        for (const file of moduleFiles) {
            try {
                const module = await import(file);

                // Process all exports (including default and named exports)
                const exportsToProcess = [];

                // Check default export
                if (module.default) {
                    if (module.default instanceof Module) {
                        exportsToProcess.push(module.default);
                    } else if (Array.isArray(module.default) && module.default.every((item: any) => item instanceof Module)) {
                        exportsToProcess.push(...module.default);
                    }
                }

                // Check named exports
                for (const [key, value] of Object.entries(module)) {
                    if (key !== 'default' && value instanceof Module) {
                        exportsToProcess.push(value);
                    }
                }

                // Process all found modules
                for (const moduleInstance of exportsToProcess) {
                    const moduleType = moduleInstance.getOptions().type || ModuleType.MODULE;
                    modules.push({ file, instance: moduleInstance, type: moduleType });
                }
            } catch (error) {
                this.deps.logger.error(`Error loading module from ${file}:`, error);
            }
        }

        modules.sort((a, b) => {
            if (a.type === ModuleType.EVENT && b.type !== ModuleType.EVENT) return 1;
            if (a.type !== ModuleType.EVENT && b.type === ModuleType.EVENT) return -1;
            return 0;
        });

        for (const { file, instance: moduleInstance } of modules) {
            try {
                moduleInstance.setDeps(this.deps as IModuleDeps);
                moduleInstance.setConfig(this.config as Config);
                await moduleInstance.init();
            } catch (error) {
                this.deps.logger.error(`Error initializing module from ${file}:`, error);
            }
        }
    }

    public async loadScenes(): Promise<Scenes.BaseScene<any>[]> {
        const sceneFiles = this.getFiles(this.scenesPath, this.suffix);
        const scenes: Scenes.BaseScene<any>[] = [];

        for (const [index, file] of sceneFiles.entries()) {
            try {
                const module = await import(file);
                if (module.default instanceof Scene) {
                    const sceneInstance = module.default as Scene;
                    const scene = new Scenes.BaseScene<any>(sceneInstance.name);
                    const sceneDeps: ISceneDeps = { ...this.deps, scene };
                    sceneInstance.setDeps(sceneDeps);
                    sceneInstance.setConfig(this.config as Config);
                    await sceneInstance.init();
                    scenes.push(scene);
                }
            } catch (error) {
                this.deps.logger.error(`Error loading scene from ${file}:`, error);
            }
        }

        return scenes;
    }

    private getFiles(dir: string, suffix: string): string[] {
        const files: string[] = [];
        if (!fs.existsSync(dir)) {
            this.deps.logger.warn(`Directory ${dir} does not exist`);
            return files;
        }
        
        fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
            const fullPath = path.join(dir, entry.name);
            entry.isDirectory()
                ? files.push(...this.getFiles(fullPath, suffix))
                : entry.name.endsWith(suffix) && files.push(fullPath);
        });
        return files;
    }
}