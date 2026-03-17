import App from "@core/classes/app.class";
import Config from "@utils/config.util";
import Redis from "@storage/redis.service";
import Database from "@storage/database.service";
import Locale from "@pkg/locale.util";
import Loader from "@core/classes/loader.class";
import Router from "@core/classes/router.class";
import Logger from "@utils/logger.util";
import { IBaseDeps } from "@core/interfaces/deps.interface";

// 1. Core utilities
const config = new Config();
const logger = new Logger({
    directory: "logs",
    saveIntervalHours: 3,
    colorizeObjects: true,
    disableFileLogs: true,
});

// 2. Storage
const redis = new Redis({ config, logger });
const database = new Database();

// 5. Build IBaseDeps
const deps: IBaseDeps = {
    config,
    logger,
    storage: {
        redis, database
    },
    locale: new Locale(),
    services: {

    },
};

// 6. Infrastructure Core
const loader = new Loader(deps);
const router = new Router(logger);

// 7. App orchestration
const app = new App({
    deps,
    loader,
    router,
});

await app.init();

process.on("uncaughtException", (error) => {
    logger.error("CRITICAL: Uncaught Exception:", error);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error("CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down...");
    process.exit(0);
});

process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down...");
    process.exit(0);
});