export interface RedisConfig {
    host: string;
    port: string | number;
    password?: string;
    db?: number;
}

export interface IRedis {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    get(key: string): Promise<any>;
    delete(key: string): Promise<boolean>;
    del(key: string): Promise<boolean>; // Alias for delete method
    exists(key: string): Promise<boolean>;
    setWithExpiry(key: string, value: any, seconds: number): Promise<void>;
    getKeys(pattern: string): Promise<string[]>;
    flushDb(): Promise<void>;
}