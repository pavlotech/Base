import { PrismaClient } from "@prisma/client";
import { IDatabase } from "@core/interfaces/database.interface";

export default class Database implements IDatabase {
    public readonly prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async $connect() {
        await this.prisma.$connect();
    }

    async $disconnect() {
        await this.prisma.$disconnect();
    }

    async $transaction(args: any): Promise<any> {
        return await this.prisma.$transaction(args);
    }
}
