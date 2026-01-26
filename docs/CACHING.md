# Gemini API Context Caching

## Overview

This project implements intelligent context caching for Gemini API to significantly reduce costs while maintaining conversation quality.

## Access Control

The AI system is restricted to authorized users only:
- **Required Roles**: Users must have one of these roles: `1295827280177795143`, `1330842655302746174`
- **Administrator Override**: Users with Administrator permissions can also use AI features
- **Automatic Filtering**: Unauthorized users are silently ignored (no response or error message)

## How It Works

### Automatic Caching Strategy

The system automatically manages caches based on conversation history:

1. **Minimum Threshold**: Caching activates after 4+ messages in a conversation
2. **Cache Duration**: 1 hour TTL (Time To Live)
3. **Cost Savings**: ~90% reduction on cached tokens compared to regular input tokens

### Cache Lifecycle

```
User Message 1 → Bot Response 1 → User Message 2 → Bot Response 2
                                                    ↓
                                            [No cache yet - only 2 messages]

User Message 3 → Bot Response 3 → User Message 4 → Bot Response 4
                                                    ↓
                                            [Cache created with messages 1-3]
                                            [Only message 4 sent as new input]

User Message 5 → Bot Response 5
         ↓
[Cache reused - messages 1-4 retrieved from cache]
[Only message 5 sent as new input]
```

### Cache Updates

The cache is automatically updated when:
- More than 2 new messages have been added since last cache
- Cache has expired (after 1 hour)
- Conversation continues (cache is refreshed with new TTL)

### Cost Optimization

**Without Caching:**
```
Request 1: 100 tokens input
Request 2: 200 tokens input (100 old + 100 new)
Request 3: 300 tokens input (200 old + 100 new)
Total: 600 tokens at full price
```

**With Caching:**
```
Request 1: 100 tokens input
Request 2: 200 tokens input (100 old + 100 new)
Request 3: 200 tokens cached + 100 tokens input
Total: 200 cached tokens (90% off) + 400 regular tokens
Savings: ~40% on this conversation
```

## Thread Behavior

### Reply Detection

In threads, the bot now only responds when:
1. **Direct Reply**: User uses Discord's reply feature to reply to bot's message
2. **Mention**: User explicitly mentions the bot with `@BotName`

This prevents the bot from responding to every message in a thread, saving costs and reducing noise.

### Example Thread Behavior

```
Thread: "Help with my code"
├─ User: "I need help with Python"
├─ Bot: "Sure! What do you need help with?"
├─ User: "Just thinking about it..." ❌ Bot ignores (not a reply)
├─ User: [Replies to bot] "How do I use loops?" ✅ Bot responds
└─ User: "@Bot what about functions?" ✅ Bot responds
```

## Database Schema

### CachedContext Table

```prisma
model CachedContext {
    id           String   @id @default(uuid())
    contextId    String   @unique          // Discord channel/thread ID
    cacheName    String                    // Gemini cache identifier
    messageCount Int                       // Number of messages in cache
    expiresAt    DateTime                  // When cache expires
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
}
```

## API Usage

### Cache Service

The `CacheService` provides automatic cache management:

```typescript
// Automatically get or create cache
const cacheName = await cacheService.getOrCreateCache({
    contextId: "discord-channel-id",
    history: conversationHistory,
    systemInstruction: "Optional system prompt"
});

// Use cache in API call
const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [currentMessage],
    config: { cachedContent: cacheName }
});
```

### Manual Cache Management

```typescript
// Invalidate cache for a conversation
await cacheService.invalidateCache(contextId);

// Clean up expired caches
await cacheService.cleanupExpiredCaches();
```

## Monitoring

The system logs cache operations:

```
[INFO] Created cache projects/xxx/locations/xxx/cachedContents/xxx for context 123456 with 8 messages
[INFO] Using cache projects/xxx/locations/xxx/cachedContents/xxx for context 123456
[DEBUG] Cache outdated (8 -> 12), updating...
[INFO] Cleaned up 3 expired caches
```

## Cost Comparison

### Pricing (as of 2024)

| Token Type | Price per 1M tokens |
|-----------|---------------------|
| Regular Input | $0.075 |
| Cached Input | $0.01875 |
| Output | $0.30 |

### Example Scenario

**Long conversation (50 messages, avg 100 tokens each):**

Without caching:
- Total input tokens: 127,500 (sum of 1+2+3+...+50 × 100)
- Cost: $9.56

With caching:
- Cached tokens: ~120,000 at $0.01875/1M
- Regular tokens: ~7,500 at $0.075/1M
- Cost: $2.81
- **Savings: 71%**

## Best Practices

1. **Let it auto-manage**: The system handles cache creation/updates automatically
2. **Monitor logs**: Check for cache hit rates in production
3. **Adjust thresholds**: Modify `MIN_MESSAGES_FOR_CACHE` in `cache.service.ts` if needed
4. **Clean up regularly**: The system auto-cleans every hour, but you can trigger manually

## Troubleshooting

### Cache not being created

- Check if conversation has at least 4 messages
- Verify Gemini API key has caching permissions
- Check logs for error messages

### High costs despite caching

- Verify cache hit rate in logs
- Check if conversations are too short (< 4 messages)
- Ensure cache TTL is appropriate for your use case

### Cache errors

- Gemini caching requires minimum 1,024 tokens for 2.5 Flash
- System automatically skips caching for short conversations
- Check API quotas and limits

## Smart Image Processing

The system includes intelligent image processing with two distinct modes:

### Image Analysis Mode
When users ask questions about image content with attached images:
- Keywords: "что на", "что это", "опиши", "what's in", "describe"
- Action: Analyzes and describes image content using text
- Example: "Что на этом изображении?" → Textual description of the image

### Image Generation Mode
When users request image creation:
- Keywords: "нарисуй", "сгенерируй", "draw", "generate image"
- Action: Generates new images
- Soyjak Style: Applied only when explicitly requested ("soyjak") or when mentioning a user, unless another style is specified
- Example: "Нарисуй кота" → Generated image (normal style)
- Example: "Нарисуй кота в стиле сойджака" → Generated image in soyjak style
- Example: "@user нарисуй кота" → Generated image in soyjak style
- Example: "Нарисуй кота в стиле аниме" → Generated image in anime style (no soyjak)
- **Smart Filtering**: Uses precise pattern matching to avoid false positives like "генерировался"

### Automatic Style Application
- All generated images default to soyjak meme style
- Users can override by specifying different styles
- Example: "Нарисуй кота в стиле аниме" → Anime-style cat image

## References

- [Gemini API Context Caching Documentation](https://ai.google.dev/gemini-api/docs/caching?lang=node)
- [Gemini API Pricing](https://ai.google.dev/pricing)

