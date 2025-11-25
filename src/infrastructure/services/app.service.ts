import { IBaseDeps } from "src/core/interfaces/deps.interface";
import { Logger } from "src/utils/logger.util";
import Redis from "../storage/redis.service";
import { IConfig } from "src/core/interfaces/config.interface";
import { IRedis } from "src/core/interfaces/redis.interface";
import { AppDependencies } from "src/core/interfaces/app.interface";
import { PrismaClient } from "@prisma/client";
import Loader from "src/core/classes/loader.class";

export default class App {
    private readonly deps: IBaseDeps;
    private readonly config: IConfig;
    private readonly logger: Logger;
    private readonly redis: IRedis;
    private readonly prisma: PrismaClient;
    private readonly loader: Loader;

    constructor(private readonly params: AppDependencies) {
        this.config = params.config;
        this.logger = new Logger({
            logDirectory: "logs",
            saveIntervalHours: 1,
            colorizeObjects: true,
        });
        this.redis = new Redis({
            config: this.config,
        });
        this.prisma = new PrismaClient();
        this.deps = {
            logger: this.logger,
            config: this.config,
            storage: {
                redis: this.redis,
                prisma: this.prisma,
            },
            services: {

            },
        };
        this.loader = new Loader(this.deps);
        this.main();
    }

    private async main() {
        await this.redis.connect();
        await this.prisma.$connect();

        await this.loader.loadModules();
    }
}