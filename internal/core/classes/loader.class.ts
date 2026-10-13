import { IBaseDeps, IModuleDeps } from "@core/interfaces/deps.interface";
import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import Module from "@core/classes/module.class";
import { ModuleType } from "@core/enums/module.enum";
import { ConfigType } from "@core/interfaces/config.interface";
import Router from "@core/classes/router.class";
import Route from "@core/classes/route.class";
import { IRouteDeps } from "@core/interfaces/deps.interface";
import config from "@config";

export default class Loader {
    private readonly deps: IBaseDeps;
    private readonly config: ConfigType;
    private readonly modulesPath: string = path.join(
        process.cwd(),
        "internal",
        "application",
        "modules",
    );
    private readonly scenesPath: string = path.join(
        process.cwd(),
        "internal",
        "application",
        "scenes",
    );
    private readonly routesPath: string = path.join(
        process.cwd(),
        "internal",
        "application",
        "routes",
    );
    private readonly suffix: string = ".ts";

    constructor(deps: IBaseDeps) {
        this.deps = deps;
        this.config = config;
    }

    public async loadModules(): Promise<void> {
        let loadedItems: { file: string; module: any }[] = [];

        try {
            // Check if bundled manifest is available (standalone binary mode)
            // @ts-ignore - internal/generated/manifest is generated dynamically before build
            const manifest = await import("../../generated/manifest");
            if (manifest && Array.isArray(manifest.bundledModules) && manifest.bundledModules.length > 0) {
                loadedItems = manifest.bundledModules;
            }
        } catch {
            // Manifest not found or cannot be imported - fallback to dynamic filesystem scan
        }

        if (loadedItems.length === 0) {
            const moduleFiles = this.getFiles(this.modulesPath, this.suffix);
            for (const file of moduleFiles) {
                try {
                    const mod = await import(pathToFileURL(file).href);
                    loadedItems.push({ file, module: mod });
                } catch (error) {
                    this.deps.logger.error(`Error loading module from ${file}:`, error);
                }
            }
        }

        const modules: { file: string; instance: Module; type: string }[] = [];

        for (const { file, module } of loadedItems) {
            try {
                const exportsToProcess: Module[] = [];

                if (module.default) {
                    if (module.default instanceof Module) {
                        exportsToProcess.push(module.default);
                    } else if (
                        Array.isArray(module.default) &&
                        module.default.every((item: any) => item instanceof Module)
                    ) {
                        exportsToProcess.push(...module.default);
                    }
                }

                for (const [key, value] of Object.entries(module)) {
                    if (key !== "default" && value instanceof Module) {
                        exportsToProcess.push(value);
                    }
                }

                for (const moduleInstance of exportsToProcess) {
                    const moduleType = moduleInstance.getOptions().type || ModuleType.MODULE;
                    modules.push({
                        file,
                        instance: moduleInstance,
                        type: moduleType,
                    });
                }
            } catch (error) {
                this.deps.logger.error(`Error processing module from ${file}:`, error);
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
                moduleInstance.setConfig(this.config);
                await moduleInstance.init();
            } catch (error) {
                this.deps.logger.error(`Error initializing module from ${file}:`, error);
            }
        }
    }

/*     public async loadScenes(): Promise<Scenes.BaseScene<any>[]> {
        const sceneFiles = this.getFiles(this.scenesPath, this.suffix);
        const scenes: Scenes.BaseScene<any>[] = [];

        for (const [index, file] of sceneFiles.entries()) {
            try {
                const module = await import(pathToFileURL(file).href);
                if (module.default instanceof Scene) {
                    const sceneInstance = module.default as Scene;
                    const scene = new Scenes.BaseScene<any>(sceneInstance.name);
                    const sceneDeps: ISceneDeps = { ...this.deps, scene };
                    sceneInstance.setDeps(sceneDeps);
                    sceneInstance.setConfig(this.config);
                    await sceneInstance.init();
                    scenes.push(scene);
                }
            } catch (error) {
                this.deps.logger.error(
                    `Error loading scene from ${file}:`,
                    error,
                );
            }
        }

        return scenes;
    } */

    public async loadRoutes(router: Router): Promise<void> {
        let loadedItems: { file: string; module: any }[] = [];

        try {
            // @ts-ignore - internal/generated/manifest is generated dynamically before build
            const manifest = await import("../../generated/manifest");
            if (manifest && Array.isArray(manifest.bundledRoutes) && manifest.bundledRoutes.length > 0) {
                loadedItems = manifest.bundledRoutes;
            }
        } catch {
            // Manifest not found or cannot be imported - fallback to dynamic filesystem scan
        }

        if (loadedItems.length === 0) {
            const routeFiles = this.getFiles(this.routesPath, this.suffix);
            for (const file of routeFiles) {
                try {
                    const mod = await import(pathToFileURL(file).href);
                    loadedItems.push({ file, module: mod });
                } catch (error) {
                    this.deps.logger.error(`Error loading route from ${file}:`, error);
                }
            }
        }

        for (const { file, module } of loadedItems) {
            try {
                const routeInstance = module.default;

                if (routeInstance && (routeInstance instanceof Route || typeof routeInstance.init === "function")) {
                    const routeDeps: IRouteDeps = {
                        ...this.deps,
                        router,
                    } as IRouteDeps;
                    routeInstance.setDeps(routeDeps);
                    routeInstance.setConfig(this.config);
                    await routeInstance.init();
                } else {
                    this.deps.logger.warn(`File ${file} does not export a valid Route instance`);
                }
            } catch (error) {
                this.deps.logger.error(`Error loading route from ${file}:`, error);
            }
        }
    }

    private getFiles(dir: string, suffix: string): string[] {
        const files: string[] = [];
        if (!fs.existsSync(dir)) {
            this.deps.logger.warn(`Directory ${dir} does not exist`);
            return files;
        }

        fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
            const fullPath = path.join(dir, entry.name);
            entry.isDirectory()
                ? files.push(...this.getFiles(fullPath, suffix))
                : entry.name.endsWith(suffix) && files.push(fullPath);
        });
        return files;
    }
}
