import { PrismaClient } from "@prisma/client";

export interface IDatabase {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $transaction(args: any): Promise<any>;
    
    // Low-level access if needed, but discouraged
    readonly prisma: PrismaClient;
}
