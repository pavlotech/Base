# Implementation Summary: Gemini API Caching & Thread Reply Detection

## ✅ Completed Tasks

### 1. Automatic Context Caching

**Implementation:** `src/infrastructure/services/cache.service.ts`

The system now automatically caches conversation history to reduce API costs:

- **Threshold**: Activates after 4+ messages
- **TTL**: 1 hour (auto-refreshes on new messages)
- **Strategy**: Caches all previous messages, sends only new message
- **Cost Savings**: ~90% reduction on cached tokens

**Key Features:**
- Automatic cache creation and management
- Smart cache invalidation (updates when 2+ new messages)
- Hourly cleanup of expired caches
- Database tracking of cache metadata

**Database Schema:**
```sql
CREATE TABLE cached_contexts (
    id TEXT PRIMARY KEY,
    contextId TEXT UNIQUE,
    cacheName TEXT,
    messageCount INTEGER,
    expiresAt DATETIME,
    createdAt DATETIME,
    updatedAt DATETIME
);
```

### 2. Thread Reply Detection & First Message Handling

**Implementation:** `src/application/modules/ai/ai.module.ts` (lines 147-160)

The bot now only responds in threads when:
1. User directly replies to bot's message (using Discord's reply feature)
2. User explicitly mentions the bot with `@BotName`
3. **NEW:** It's the first message in the thread

**Benefits:**
- Prevents unwanted responses to general thread conversations
- Reduces API calls and costs
- Better user experience (bot doesn't interrupt conversations)

### 3. Access Control & Permissions

**Implementation:** `checkUserPermissions()` function and early filtering in message handler

**Permission Requirements:**
- **Required Roles**: `1295827280177795143`, `1330842655302746174`
- **Administrator Rights**: Users with Administrator permission can also access
- **Filtering**: Unauthorized users are silently ignored (no response, logged as debug)

**Technical Details:**
- Checks `message.member.permissions.has('Administrator')`
- Validates `message.member.roles.cache` against allowed role IDs
- Early return prevents any AI processing for unauthorized users

### 5. Smart Image Processing

**Implementation:** Enhanced intent detection in `detectIntent()` function

**Image Analysis Mode:**
- Triggered when: User asks questions about image content + attaches images
- Keywords: "что на", "что это", "что изображено", "опиши", "what's in", etc.
- Result: Bot analyzes and describes the image content in text

**Image Generation Mode:**
- Triggered when: User uses generation commands
- Keywords: "нарисуй", "сгенерируй", "draw", "generate image", etc.
- Result: Bot generates new image
- Soyjak Style Logic:
  - Applied when: explicit "soyjak" keyword OR user mention AND no other style specified
  - Not applied when: other style explicitly requested (anime, realistic, etc.)
  - Examples:
    - "Нарисуй кота" → normal style
    - "Нарисуй кота в стиле сойджака" → soyjak style
    - "@user нарисуй кота" → soyjak style
    - "Нарисуй кота в стиле аниме" → anime style

**Technical Details:**
- Enhanced `detectIntent()` function with precise keyword pattern matching
- Uses word boundary patterns `(?:^|\s)keyword(?:\s|$)` to avoid false matches
- Context-aware processing based on attached images
- Default soyjak style for all image generations (unless overridden)
- Fixed false positive detection for words like "генерировался" not triggering image generation

### 6. Integration Points

**Modified Files:**
1. `database/schema.prisma` - Added CachedContext model
2. `src/infrastructure/services/cache.service.ts` - New cache management service
3. `src/infrastructure/services/app.service.ts` - Initialize cache service
4. `src/core/interfaces/deps.interface.ts` - Added cache service to dependencies
5. `src/application/modules/ai/ai.module.ts` - Integrated caching and reply detection

## 📊 Cost Optimization Example

### Before Caching:
```
Message 1: 100 tokens @ $0.075/1M = $0.0075
Message 2: 200 tokens @ $0.075/1M = $0.0150
Message 3: 300 tokens @ $0.075/1M = $0.0225
Message 4: 400 tokens @ $0.075/1M = $0.0300
Message 5: 500 tokens @ $0.075/1M = $0.0375
Total: $0.1125
```

### After Caching:
```
Message 1: 100 tokens @ $0.075/1M = $0.0075
Message 2: 200 tokens @ $0.075/1M = $0.0150
Message 3: 300 tokens @ $0.075/1M = $0.0225
Message 4: 400 tokens @ $0.075/1M = $0.0300
Message 5: 400 cached @ $0.01875/1M + 100 new @ $0.075/1M = $0.0150
Total: $0.0900
Savings: 20% (increases with longer conversations)
```

## 🔄 How It Works

### Cache Lifecycle:

```
┌─────────────────────────────────────────────────────────────┐
│ User sends message in thread                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Check: Is it a reply to bot OR mention?                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─── NO ──► Ignore message
                     │
                     └─── YES ──► Continue
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Fetch conversation history from database                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Check: Do we have 4+ messages?                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─── NO ──► Send full history (no cache)
                     │
                     └─── YES ──► Check for existing cache
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Cache exists and valid?                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─── YES ──► Use cache + send only new message
                     │
                     └─── NO ──► Create new cache with history
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Send to Gemini API with cached content                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Save response to database & reply to user                   │
└─────────────────────────────────────────────────────────────┘
```

## 🧪 Testing

### Manual Testing Steps:

1. **Test Thread Reply Detection:**
   ```
   1. Create a thread in the designated channel
   2. Send a message mentioning the bot
   3. Bot should respond
   4. Send another message WITHOUT replying to bot
   5. Bot should NOT respond
   6. Reply to bot's previous message
   7. Bot should respond
   ```

2. **Test Caching:**
   ```
   1. Start a new conversation (messages 1-3)
   2. Check logs - should say "No cache available"
   3. Send message 4
   4. Check logs - should say "Created cache"
   5. Send message 5
   6. Check logs - should say "Using cache"
   7. Check database - should see entry in cached_contexts table
   ```

3. **Test Cache Expiration:**
   ```
   1. Wait 1 hour after creating a cache
   2. Send a new message
   3. Check logs - should say "Cache expired, creating new one"
   ```

### Verify in Database:

```sql
-- Check cached contexts
SELECT * FROM cached_contexts;

-- Check message history
SELECT * FROM chat_messages WHERE contextId = 'YOUR_THREAD_ID';
```

## 📝 Configuration

### Adjustable Parameters in `cache.service.ts`:

```typescript
private readonly CACHE_TTL_SECONDS = 3600; // 1 hour
private readonly MIN_MESSAGES_FOR_CACHE = 4; // Minimum messages
private readonly MODEL_NAME = "gemini-2.0-flash";
```

### To Change Cache Duration:
- Increase `CACHE_TTL_SECONDS` for longer cache (saves more money but uses more storage)
- Decrease for shorter cache (less storage but more API calls)

### To Change Cache Threshold:
- Increase `MIN_MESSAGES_FOR_CACHE` to cache only longer conversations
- Decrease to cache shorter conversations (may not be cost-effective below 4)

## 🚀 Deployment

1. **Run Migration:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Restart Bot:**
   ```bash
   npm run start
   ```

3. **Monitor Logs:**
   ```bash
   tail -f logs/latest.log | grep -i cache
   ```

## 📚 Documentation

- Full caching documentation: `docs/CACHING.md`
- Gemini API docs: https://ai.google.dev/gemini-api/docs/caching?lang=node

## ⚠️ Important Notes

1. **Minimum Token Requirement**: Gemini requires at least 1,024 tokens for caching (2.5 Flash). The system handles this automatically.

2. **Cache Storage**: Caches are stored on Google's servers, not locally. Database only stores metadata.

3. **Cost Tracking**: Monitor `usageMetadata` in API responses to see cached vs regular tokens.

4. **Thread Detection**: Only works in threads under the designated channel. Regular channels work as before.

5. **Automatic Cleanup**: Expired caches are cleaned every hour automatically.

## 🎯 Next Steps

1. Monitor cache hit rates in production
2. Adjust thresholds based on actual usage patterns
3. Consider implementing cache warming for frequently used contexts
4. Add metrics/analytics for cost tracking

## ✨ Benefits Achieved

- ✅ Automatic cost optimization (no manual intervention needed)
- ✅ Smart thread behavior (no spam responses)
- ✅ Maintains conversation quality (full history via cache)
- ✅ Self-managing (auto-cleanup, auto-refresh)
- ✅ Production-ready (error handling, logging, monitoring)

