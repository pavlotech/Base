import { IRouteDeps } from "@core/interfaces/deps.interface";
import { RouteOptions } from "@core/interfaces/route.interface";
import { RouteHandler } from "@core/interfaces/router.interface";
import { ConfigType } from "@core/interfaces/config.interface";

export default class Route {
    private readonly options: RouteOptions;
    private readonly handler: (deps: IRouteDeps, request: Request, config: ConfigType) => Response | Promise<Response>;
    private deps?: IRouteDeps;
    private config?: ConfigType;

    constructor(options: RouteOptions, handler: (deps: IRouteDeps, request: Request, config: ConfigType) => Response | Promise<Response>) {
        this.options = options;
        this.handler = handler;
    }

    public setDeps(deps: IRouteDeps) {
        this.deps = deps;
    }

    public setConfig(config: ConfigType) {
        this.config = config;
    }

    public async init() {
        if (!this.deps) throw new Error("Dependencies not set");
        const methods = Array.isArray(this.options.method) ? this.options.method : [this.options.method];
        const routeHandler: RouteHandler = (request: Request) => this.handler(this.deps!, request, this.config!);

        const methodMap: { [key: string]: (path: string, handler: RouteHandler) => void } = {
            GET: this.deps.router.get.bind(this.deps.router),
            POST: this.deps.router.post.bind(this.deps.router),
            PUT: this.deps.router.put.bind(this.deps.router),
            DELETE: this.deps.router.delete.bind(this.deps.router),
            PATCH: this.deps.router.patch.bind(this.deps.router),
            OPTIONS: this.deps.router.options.bind(this.deps.router),
            HEAD: this.deps.router.head.bind(this.deps.router),
        };

        for (const m of methods) {
            const method = m.toUpperCase();
            const routerMethod = methodMap[method];
            if (!routerMethod) throw new Error(`Unsupported method: ${method}`);
            routerMethod(this.options.path, routeHandler);
        }
    }
}
