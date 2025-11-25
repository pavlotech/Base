import { Logger } from "src/utils/logger.util";
import { IConfig } from "src/core/interfaces/config.interface";
import { IRedis } from "src/core/interfaces/redis.interface";
import { PrismaClient } from "@prisma/client";

export interface IBaseDeps {
    logger: Logger;
    config: IConfig;
    storage: {
        prisma: PrismaClient;
        redis: IRedis;
    };
    services: {

    };
}

export interface IModuleDeps extends IBaseDeps {}
