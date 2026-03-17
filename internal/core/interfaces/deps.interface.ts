import { Logger } from "@utils/logger.util";
import { IConfig } from "@core/interfaces/config.interface";
import { IRedis } from "@core/interfaces/redis.interface";
import { IDatabase } from "@core/interfaces/database.interface";
import { ILocale } from "@core/interfaces/locale.interface";
/* import { Telegraf, Scenes } from "telegraf"; */
/* import { IContext } from "@core/interfaces/context.interface"; */
/* import { IUserService } from "@core/interfaces/user.interface"; */

export interface IBaseDeps {
    logger: Logger;
    config: IConfig;
    storage: {
        database: IDatabase;
        redis: IRedis;
    };
    locale: ILocale;
    services: {

    };
}

export interface IModuleDeps extends IBaseDeps {}

/* export interface ISceneDeps extends IBaseDeps {
    scene: Scenes.BaseScene<any>;
} */

export interface IRouteDeps extends IBaseDeps {
    router: any;
}
