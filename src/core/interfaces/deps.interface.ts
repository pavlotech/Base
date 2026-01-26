import { Logger } from "src/utils/logger.util";
import { IConfig } from "src/core/interfaces/config.interface";
import { IRedis } from "src/core/interfaces/redis.interface";
import { PrismaClient } from "@prisma/client";
import { Client } from "discord.js";
import Command from "src/core/classes/command.class";
import { GoogleGenAI } from "@google/genai";
import { CacheService } from "src/infrastructure/services/cache.service";

export interface IBaseDeps {
    logger: Logger;
    config: IConfig;
    client: Client;
    command: Command;
    storage: {
        prisma: PrismaClient;
        redis: IRedis;
    };
    services: {
        cache: CacheService;
    };
    ai: GoogleGenAI;
}

export interface IModuleDeps extends IBaseDeps { }
