import { createClient, RedisClientType } from "redis";
import { IConfig } from "@core/interfaces/config.interface";
import { IRedis } from "@core/interfaces/redis.interface";
import { ILogger } from "@core/interfaces/logger.interface";

export default class Redis implements IRedis {
    private client: RedisClientType | null = null;
    private readonly config: IConfig;
    private readonly logger: ILogger;
    private readonly isEnabled: boolean;
    private readonly memoryStorage = new Map<string, string>();

    constructor(private readonly options: { config: IConfig; logger: ILogger }) {
        this.config = options.config;
        this.logger = options.logger;
        const useRedis = this.config.get("USE_REDIS");

        this.isEnabled = useRedis !== "false";

        if (this.isEnabled) {
            try {
                this.client = createClient({
                    url: this.config.get("REDIS_URL"),
                    database: 0,
                });
            } catch (error) {
                this.logger.error("Failed to initialize Redis client", error);
                throw error;
            }
        } else {
            this.logger.warn("Redis is disabled. Using in-memory storage.");
        }
    }

    public async connect(): Promise<void> {
        if (!this.isEnabled || !this.client) return;
        try {
            await this.client.connect();
        } catch (error) {
            if (error instanceof Error && error.message.includes("AUTH")) {
                await this.client.disconnect();

                this.client = createClient({
                    url: this.config.get("REDIS_URL"),
                    database: 0,
                });

                await this.client.connect();
            } else {
                throw error;
            }
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.isEnabled || !this.client) return;
        await this.client.disconnect();
    }

    public async set(key: string, value: any, ttl?: number): Promise<void> {
        const stringValue =
            typeof value === "object" ? JSON.stringify(value) : String(value);

        if (!this.isEnabled || !this.client) {
            this.memoryStorage.set(key, stringValue);
            // In-memory TTL implementation optional but good for consistency
            if (ttl) {
                // Determine if we want to handle expiration in memory.
                // For dev/test without Redis, simple storage is usually enough.
            }
            return;
        }

        if (ttl) {
            await this.client.set(key, stringValue, { EX: ttl });
        } else {
            await this.client.set(key, stringValue);
        }
    }

    public async get(key: string): Promise<any> {
        if (!this.isEnabled || !this.client) {
            const value = this.memoryStorage.get(key);
            if (!value) return null;
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }

        const value = await this.client.get(key);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    public async delete(key: string): Promise<boolean> {
        if (!this.isEnabled || !this.client) {
            return this.memoryStorage.delete(key);
        }
        return (await this.client.del(key)) > 0;
    }

    public async del(key: string): Promise<boolean> {
        return this.delete(key);
    }

    public async exists(key: string): Promise<boolean> {
        if (!this.isEnabled || !this.client) {
            return this.memoryStorage.has(key);
        }
        return (await this.client.exists(key)) === 1;
    }

    public async setWithExpiry(
        key: string,
        value: any,
        seconds: number,
    ): Promise<void> {
        await this.set(key, value, seconds);
    }

    public async getKeys(pattern: string): Promise<string[]> {
        if (!this.isEnabled || !this.client) {
            if (pattern === "*") return Array.from(this.memoryStorage.keys());

            const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
            return Array.from(this.memoryStorage.keys()).filter((k) =>
                regex.test(k),
            );
        }
        return await this.client.keys(pattern);
    }

    public async flushDb(): Promise<void> {
        if (!this.isEnabled || !this.client) {
            this.memoryStorage.clear();
            return;
        }
        await this.client.flushDb();
    }
}
