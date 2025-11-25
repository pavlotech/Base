import { createClient, RedisClientType } from 'redis';
import { IConfig } from 'src/core/interfaces/config.interface';
import { IRedis } from 'src/core/interfaces/redis.interface';

export default class Redis implements IRedis {
    private client: RedisClientType;
    private readonly config: IConfig;

    constructor(
        private readonly options: { config: IConfig }
    ) {
        this.config = options.config;

        try {
            this.client = createClient({
                url: this.config.get('REDIS_URL'),
                database: 0
            });
        } catch (error) {
            throw error;
        }
    }

    public async connect(): Promise<void> {
        try {
            await this.client.connect();
        } catch (error) {
            if (error instanceof Error && error.message.includes('AUTH')) {
                await this.client.disconnect();
                
                this.client = createClient({
                    url: this.config.get('REDIS_URL'),
                    database: 0
                });
                
                await this.client.connect();
            } else {
                throw error;
            }
        }
    }

    public async disconnect(): Promise<void> {
        await this.client.disconnect();
    }

    public async set(key: string, value: any, ttl?: number): Promise<void> {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

        if (ttl) {
            await this.client.set(key, stringValue, { EX: ttl });
        } else {
            await this.client.set(key, stringValue);
        }
    }

    public async get(key: string): Promise<any> {
        const value = await this.client.get(key);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    public async delete(key: string): Promise<boolean> {
        return (await this.client.del(key)) > 0;
    }

    public async del(key: string): Promise<boolean> {
        return this.delete(key);
    }

    public async exists(key: string): Promise<boolean> {
        return (await this.client.exists(key)) === 1;
    }

    public async setWithExpiry(key: string, value: any, seconds: number): Promise<void> {
        await this.set(key, value, seconds);
    }

    public async getKeys(pattern: string): Promise<string[]> {
        return await this.client.keys(pattern);
    }

    public async flushDb(): Promise<void> {
        await this.client.flushDb();
    }
}