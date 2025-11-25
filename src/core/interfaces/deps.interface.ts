import { Logger } from "src/utils/logger.util";
import { IConfig } from "src/core/interfaces/config.interface";
import { IRedis } from "src/core/interfaces/redis.interface";
import { PrismaClient } from "@prisma/client";
import { Telegraf, Scenes } from "telegraf";
import { IContext } from "src/core/interfaces/context.interface";

export interface IBaseDeps {
    logger: Logger;
    config: IConfig;
    storage: {
        prisma: PrismaClient;
        redis: IRedis;
    };
    bot: Telegraf<IContext>;
    services: {

    };
}

export interface IModuleDeps extends IBaseDeps {}

export interface ISceneDeps extends IBaseDeps {
    scene: Scenes.BaseScene<any>;
}
