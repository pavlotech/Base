/**
 * Cache Verification Script
 * 
 * This script helps verify that the caching system is working correctly.
 * Run this to check cache status and statistics.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyCacheSystem() {
    console.log("🔍 Verifying Cache System...\n");

    try {
        // Check if cached_contexts table exists and has data
        const caches = await prisma.cachedContext.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        console.log(`📊 Total Active Caches: ${caches.length}\n`);

        if (caches.length === 0) {
            console.log("ℹ️  No caches found. This is normal if:");
            console.log("   - Bot just started");
            console.log("   - No conversations have reached 4+ messages yet");
            console.log("   - All caches have expired\n");
        } else {
            console.log("📋 Recent Caches:\n");
            for (const cache of caches) {
                const isExpired = cache.expiresAt < new Date();
                const status = isExpired ? "❌ EXPIRED" : "✅ ACTIVE";
                const timeLeft = isExpired 
                    ? "Expired" 
                    : `${Math.round((cache.expiresAt.getTime() - Date.now()) / 60000)} minutes left`;

                console.log(`${status} Context: ${cache.contextId}`);
                console.log(`   Cache Name: ${cache.cacheName}`);
                console.log(`   Messages: ${cache.messageCount}`);
                console.log(`   Created: ${cache.createdAt.toLocaleString()}`);
                console.log(`   Expires: ${cache.expiresAt.toLocaleString()} (${timeLeft})`);
                console.log();
            }
        }

        // Check message statistics
        const messageCount = await prisma.message.count();
        const contexts = await prisma.message.groupBy({
            by: ['contextId'],
            _count: {
                contextId: true
            },
            orderBy: {
                _count: {
                    contextId: 'desc'
                }
            },
            take: 5
        });

        console.log(`💬 Total Messages: ${messageCount}`);
        console.log(`🗨️  Active Conversations: ${contexts.length}\n`);

        if (contexts.length > 0) {
            console.log("📈 Top Conversations:\n");
            for (const ctx of contexts) {
                const isCached = caches.some(c => c.contextId === ctx.contextId);
                const cacheStatus = isCached ? "🔄 CACHED" : "⚪ NOT CACHED";
                console.log(`${cacheStatus} Context: ${ctx.contextId} - ${ctx._count.contextId} messages`);
            }
            console.log();
        }

        // Recommendations
        console.log("💡 Recommendations:\n");
        
        const expiredCount = caches.filter(c => c.expiresAt < new Date()).length;
        if (expiredCount > 0) {
            console.log(`⚠️  ${expiredCount} expired cache(s) found. They will be cleaned up automatically.`);
        }

        const uncachedLongConversations = contexts.filter(
            ctx => ctx._count.contextId >= 4 && !caches.some(c => c.contextId === ctx.contextId)
        );
        if (uncachedLongConversations.length > 0) {
            console.log(`ℹ️  ${uncachedLongConversations.length} conversation(s) with 4+ messages are not cached yet.`);
            console.log("   This is normal - caches are created on the next message.");
        }

        const cachedShortConversations = contexts.filter(
            ctx => ctx._count.contextId < 4 && caches.some(c => c.contextId === ctx.contextId)
        );
        if (cachedShortConversations.length > 0) {
            console.log(`⚠️  ${cachedShortConversations.length} conversation(s) with <4 messages are cached.`);
            console.log("   This shouldn't happen - check cache creation logic.");
        }

        if (caches.length > 0 && expiredCount === 0 && uncachedLongConversations.length === 0) {
            console.log("✅ Everything looks good! Cache system is working properly.");
        }

        console.log("\n✨ Verification Complete!");

    } catch (error) {
        console.error("❌ Error verifying cache system:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run verification
verifyCacheSystem().catch(console.error);

