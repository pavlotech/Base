import { IBaseDeps } from "src/core/interfaces/deps.interface";
import { Logger } from "src/utils/logger.util";
import Redis from "src/infrastructure/storage/redis.service";
import { IConfig } from "src/core/interfaces/config.interface";
import { IRedis } from "src/core/interfaces/redis.interface";
import { AppDependencies } from "src/core/interfaces/app.interface";
import { PrismaClient } from "@prisma/client";
import Loader from "src/core/classes/loader.class";
import { Client, Events, GatewayIntentBits } from "discord.js";
import Command from "src/core/classes/command.class";
import { GoogleGenAI } from "@google/genai";
import { CacheService } from "src/infrastructure/services/cache.service";


export default class App {
    private readonly deps: IBaseDeps;
    private readonly config: IConfig;
    private readonly logger: Logger;
    private readonly redis: IRedis;
    private readonly prisma: PrismaClient;
    private readonly loader: Loader;
    private readonly client: Client;
    private readonly command: Command;
    private readonly ai: GoogleGenAI;
    private readonly cacheService: CacheService;

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
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ]
        });
        this.command = new Command(this.logger);
        this.ai = new GoogleGenAI({
            apiKey: this.config.get("GOOGLE_AI_API_KEY"),
        });
        this.cacheService = new CacheService(this.ai, this.prisma, this.logger);

        this.deps = {
            logger: this.logger,
            config: this.config,
            client: this.client,
            command: this.command,
            storage: {
                redis: this.redis,
                prisma: this.prisma,
            },
            services: {
                cache: this.cacheService,
            },
            ai: this.ai,
        };
        this.loader = new Loader(this.deps);
        this.main();
    }

    private async main() {
        await this.redis.connect();
        await this.prisma.$connect();

        await this.loader.loadModules();

        const token = this.config.get("DISCORD_BOT_TOKEN");
        await this.client.login(token);

        this.client.on(Events.ClientReady, async () => {
            this.logger.info(`Logged in as ${this.client.user?.tag}!`);
            await this.command.registerCommands(this.client, token);
            
            // Clean up expired caches every hour
            setInterval(() => {
                this.cacheService.cleanupExpiredCaches();
            }, 3600000); // 1 hour
        });
    }
}