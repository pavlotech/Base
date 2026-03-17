import { IBaseDeps } from "@core/interfaces/deps.interface";
import { IDependencies } from "@core/interfaces/app.interface";
import Loader from "@core/classes/loader.class";
import Router from "@core/classes/router.class";

export default class App {
    private readonly deps: IBaseDeps;
    private readonly loader: Loader;
    private readonly router: Router;

    constructor(params: IDependencies) {
        this.deps = params.deps;
        this.loader = params.loader;
        this.router = params.router;
    }

    public async init() {
        await this.deps.storage.redis.connect();
        await this.deps.storage.database.$connect();

        await this.loader.loadModules();
        await this.loader.loadRoutes(this.router);

        const args = process.argv;
        const hostIndex = args.indexOf("--host");
        const hostname = hostIndex !== -1
            ? (args[hostIndex + 1] && !args[hostIndex + 1].startsWith("-") ? args[hostIndex + 1] : "0.0.0.0")
            : undefined;

        Bun.serve({
            port: this.deps.config.get("API_PORT"),
            hostname: hostname,
            fetch: (request: Request) => this.router.handle(request),
            error: (error: any) => {
                this.deps.logger.error("Bun server error:", error);
                return new Response("Internal Server Error", { status: 500 });
            },
        });
    }
}
