import { IBaseDeps } from "src/core/interfaces/deps.interface";
import { Logger } from "src/utils/logger.util";
import Redis from "../storage/redis.service";
import { IConfig } from "src/core/interfaces/config.interface";
import { IRedis } from "src/core/interfaces/redis.interface";
import { AppDependencies } from "src/core/interfaces/app.interface";
import Loader from "src/core/classes/loader.class";
import { Telegraf, Scenes, session } from "telegraf";
import config from "app.config";
import { IContext } from "src/core/interfaces/context.interface";
import { PrismaClient } from "@prisma/client";

export default class App {
    private readonly deps: IBaseDeps;
    private readonly config: IConfig;
    private readonly logger: Logger;
    private readonly redis: IRedis;
    private readonly prisma: PrismaClient;
    private readonly bot: Telegraf<IContext>;
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
        this.bot = new Telegraf<IContext>(this.config.get('TELEGRAM_BOT_TOKEN'));
        this.deps = {
            logger: this.logger,
            config: this.config,
            storage: {
                redis: this.redis,
                prisma: this.prisma,
            },
            bot: this.bot,
            services: {

            },
        };
        this.loader = new Loader(this.deps);
        this.main();
    }

    private async main() {
        await this.redis.connect();
        await this.prisma.$connect();
        const scenes = await this.loader.loadScenes();

        const stage = new Scenes.Stage(scenes, { ttl: config.stage.ttl });
        this.bot.use(session());
        this.bot.use(stage.middleware());

        await this.loader.loadModules();

        this.bot.telegram.setMyCommands(config.botCommands);

        this.bot.launch({}, async () => {
            this.logger.info(`${this.bot?.botInfo?.username} successfully launched`);
        });
    }
}