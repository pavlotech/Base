import { GoogleGenAI } from "@google/genai";
import { PrismaClient } from "@prisma/client";
import { Logger } from "src/utils/logger.util";

export interface CacheOptions {
    contextId: string;
    history: Array<{ role: "user" | "model"; parts: any[] }>;
    systemInstruction?: string;
}

export class CacheService {
    private readonly CACHE_TTL_SECONDS = 3600; // 1 hour
    private readonly MIN_MESSAGES_FOR_CACHE = 4; // Minimum messages to justify caching
    private readonly MODEL_NAME = "gemini-2.0-flash";

    constructor(
        private readonly ai: GoogleGenAI,
        private readonly prisma: PrismaClient,
        private readonly logger: Logger
    ) { }

    /**
     * Get or create a cache for the given context
     * Returns cache name if available and valid, null otherwise
     */
    async getOrCreateCache(options: CacheOptions): Promise<string | null> {
        try {
            const { contextId, history, systemInstruction } = options;

            // Don't cache if history is too short (not cost-effective)
            if (history.length < this.MIN_MESSAGES_FOR_CACHE) {
                this.logger.debug(`History too short for caching (${history.length} messages)`);
                return null;
            }

            // Check if we have a valid cache
            const existingCache = await this.prisma.cachedContext.findUnique({
                where: { contextId }
            });

            const currentMessageCount = history.length;

            // If cache exists and is still valid
            if (existingCache && existingCache.expiresAt > new Date()) {
                // If message count hasn't changed much, reuse the cache
                if (currentMessageCount <= existingCache.messageCount + 2) {
                    this.logger.debug(`Reusing cache ${existingCache.cacheName} for context ${contextId}`);
                    return existingCache.cacheName;
                } else {
                    // Too many new messages, need to update cache
                    this.logger.debug(`Cache outdated (${existingCache.messageCount} -> ${currentMessageCount}), updating...`);
                    await this.deleteCache(existingCache.cacheName);
                }
            } else if (existingCache) {
                // Cache expired, clean it up
                this.logger.debug(`Cache expired for context ${contextId}, creating new one`);
                await this.deleteCache(existingCache.cacheName);
            }

            // Create new cache with all history except the last message
            // (last message will be sent as the current prompt)
            const historyToCache = history.slice(0, -1);

            if (historyToCache.length === 0) {
                return null;
            }

            const cacheConfig: any = {
                model: this.MODEL_NAME,
                config: {
                    contents: historyToCache,
                    ttl: `${this.CACHE_TTL_SECONDS}s`,
                },
            };

            if (systemInstruction) {
                cacheConfig.config.systemInstruction = systemInstruction;
            }

            const cache = await this.ai.caches.create(cacheConfig);

            this.logger.info(`Created cache ${cache.name} for context ${contextId} with ${historyToCache.length} messages`);

            // Save cache info to database
            const expiresAt = new Date(Date.now() + this.CACHE_TTL_SECONDS * 1000);
            await this.prisma.cachedContext.upsert({
                where: { contextId },
                create: {
                    contextId,
                    cacheName: cache.name,
                    messageCount: currentMessageCount,
                    expiresAt,
                },
                update: {
                    cacheName: cache.name,
                    messageCount: currentMessageCount,
                    expiresAt,
                },
            });

            return cache.name;
        } catch (error) {
            this.logger.error("Error managing cache:", error);
            return null;
        }
    }

    /**
     * Delete a cache by name
     */
    private async deleteCache(cacheName: string): Promise<void> {
        try {
            await this.ai.caches.delete({ name: cacheName });
            this.logger.debug(`Deleted cache ${cacheName}`);
        } catch (error) {
            this.logger.error(`Error deleting cache ${cacheName}:`, error);
        }
    }

    /**
     * Clean up expired caches from database
     */
    async cleanupExpiredCaches(): Promise<void> {
        try {
            const expiredCaches = await this.prisma.cachedContext.findMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });

            for (const cache of expiredCaches) {
                await this.deleteCache(cache.cacheName);
                await this.prisma.cachedContext.delete({
                    where: { id: cache.id },
                });
            }

            if (expiredCaches.length > 0) {
                this.logger.info(`Cleaned up ${expiredCaches.length} expired caches`);
            }
        } catch (error) {
            this.logger.error("Error cleaning up expired caches:", error);
        }
    }

    /**
     * Invalidate cache for a specific context
     */
    async invalidateCache(contextId: string): Promise<void> {
        try {
            const cache = await this.prisma.cachedContext.findUnique({
                where: { contextId },
            });

            if (cache) {
                await this.deleteCache(cache.cacheName);
                await this.prisma.cachedContext.delete({
                    where: { id: cache.id },
                });
                this.logger.info(`Invalidated cache for context ${contextId}`);
            }
        } catch (error) {
            this.logger.error(`Error invalidating cache for context ${contextId}:`, error);
        }
    }
}

