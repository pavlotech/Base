# Quick Start: Testing the New Features

## 🔐 Access Requirements

**Important:** The AI system requires specific permissions:
- Users must have **one of these roles**: `1295827280177795143`, `1330842655302746174`
- Or have **Administrator permissions**
- Unauthorized users will be **silently ignored** (no response)

### Test Access Control:
```
Unauthorized User: @Bot Hello!
Bot: [No response - user lacks permissions]
```
✅ Expected: Bot ignores the message, logs debug info

## 🚀 Getting Started

### 1. Apply Database Migration

```bash
npx prisma migrate deploy
```

Or if in development:

```bash
npx prisma migrate dev
```

### 2. Restart the Bot

```bash
npm run start
```

## 🧪 Test Scenario 1: Thread Reply Detection

### Setup:
1. Go to your designated AI channel in Discord
2. Create a new thread or use an existing one

### Test Steps:

**Step 1: Initial Message (Should Respond)**
```
You: @BotName Hello!
Bot: [Responds with greeting]
```
✅ Expected: Bot responds because you mentioned it

**Step 2: Regular Message (Should NOT Respond)**
```
You: Just thinking about something...
Bot: [No response]
```
✅ Expected: Bot ignores because it's not a reply and no mention

**Step 3: Reply to Bot (Should Respond)**
```
You: [Use Discord's Reply feature on bot's message] Tell me more
Bot: [Responds with more information]
```
✅ Expected: Bot responds because you replied to it directly

**Step 4: Mention in Thread (Should Respond)**
```
You: @BotName what do you think?
Bot: [Responds]
```
✅ Expected: Bot responds because you mentioned it

## 🧪 Test Scenario 2: Image Analysis vs Generation

### Test Image Analysis (Should respond with text):
```
You: Что на этом изображении? [attach an image]
Bot: [Analyzes and describes the image content]
```
✅ Expected: Bot analyzes the image and gives textual description

```
You: What is in this picture? [attach an image]
Bot: [Analyzes and describes the image content]
```
✅ Expected: Bot analyzes the image and gives textual description

### Test Image Generation (Should generate image - normal style):
```
You: Нарисуй кота
Bot: [Generates and sends image in normal style]
```
✅ Expected: Bot generates image (NO soyjak style by default)

### Test Image Generation with Soyjak Keyword:
```
You: Нарисуй кота в стиле сойджака
Bot: [Generates and sends image in soyjak style]
```
✅ Expected: Bot generates image in soyjak style (explicit keyword)

### Test Image Generation with User Mention:
```
You: @user нарисуй кота
Bot: [Generates and sends image in soyjak style]
```
✅ Expected: Bot generates image in soyjak style (user mention triggers it)

### Test Image Generation Override (no soyjak):
```
You: Нарисуй кота в стиле аниме
Bot: [Generates and sends image in anime style]
```
✅ Expected: Bot generates image in anime style (other style prevents soyjak)

### Test False Positive Prevention:
```
You: тут генерировался пользователь <@user> как изображение кстати расскажи мне про него
Bot: [Analyzes and describes the user, NOT generates image]
```
✅ Expected: Bot gives textual description, NOT image (fixed false positive)

## 🧪 Test Scenario 3: Caching System

### Setup:
1. Start a fresh conversation in a thread
2. Have terminal/logs visible to see cache messages

### Test Steps:

**Messages 1-3: Building History**
```
You: Message 1
Bot: Response 1
[Check logs: "No cache available for context XXX, sending full history"]

You: Message 2  
Bot: Response 2
[Check logs: "No cache available for context XXX, sending full history"]

You: Message 3
Bot: Response 3
[Check logs: "No cache available for context XXX, sending full history"]
```
✅ Expected: No caching yet (need 4+ messages)

**Message 4: Cache Creation**
```
You: Message 4
Bot: Response 4
[Check logs: "Created cache projects/.../cachedContents/... for context XXX with X messages"]
```
✅ Expected: Cache is created

**Message 5+: Using Cache**
```
You: Message 5
Bot: Response 5
[Check logs: "Using cache projects/.../cachedContents/... for context XXX"]
```
✅ Expected: Cache is reused, saving costs!

### Verify in Database:

```bash
# Run the verification script
npx ts-node scripts/verify-cache.ts
```

Or manually check:

```bash
npx prisma studio
```

Then navigate to `cached_contexts` table and verify:
- `contextId` matches your thread ID
- `messageCount` is correct
- `expiresAt` is ~1 hour in the future
- `cacheName` starts with `projects/`

## 📊 Monitoring Cache Performance

### Check Logs:

```bash
# Watch for cache-related logs
tail -f logs/latest.log | grep -i cache
```

You should see:
- `Created cache ...` - When new cache is created
- `Using cache ...` - When cache is reused (💰 saving money!)
- `Cache outdated ... updating` - When cache needs refresh
- `Cleaned up X expired caches` - Hourly cleanup

### Check Database Stats:

```bash
npx ts-node scripts/verify-cache.ts
```

This will show:
- Total active caches
- Cache expiration times
- Message counts per conversation
- Recommendations

## 🎯 Success Criteria

### Thread Reply Detection:
- ✅ Bot responds to mentions
- ✅ Bot responds to direct replies
- ✅ Bot ignores regular thread messages
- ✅ Logs show "Ignoring message in thread - not a reply to bot"

### Caching:
- ✅ No cache for conversations < 4 messages
- ✅ Cache created at message 4+
- ✅ Cache reused on subsequent messages
- ✅ Logs show cache creation and usage
- ✅ Database has cached_contexts entries
- ✅ Caches expire after 1 hour

## 🐛 Troubleshooting

### Bot Not Responding in Threads:

**Problem:** Bot doesn't respond even when replying
**Solution:** 
1. Make sure you're using Discord's Reply feature (right-click → Reply)
2. Check if thread is under the correct parent channel
3. Try mentioning the bot explicitly

### Cache Not Being Created:

**Problem:** Logs always show "No cache available"
**Solution:**
1. Verify conversation has 4+ messages
2. Check Gemini API key has caching permissions
3. Look for error messages in logs
4. Verify database migration ran successfully

### Cache Errors:

**Problem:** Errors when creating/using cache
**Solution:**
1. Check if messages are long enough (1024+ tokens for 2.5 Flash)
2. Verify API quotas aren't exceeded
3. Check internet connectivity
4. Review full error in logs

## 📈 Expected Cost Savings

### Example Conversation (10 messages, 100 tokens each):

**Without Caching:**
```
Total input tokens: 5,500 (1+2+3+4+5+6+7+8+9+10 × 100)
Cost: $0.4125
```

**With Caching:**
```
Messages 1-3: 600 tokens @ full price = $0.045
Message 4: 1,000 tokens @ full price = $0.075
Messages 5-10: ~4,500 cached + 600 new
  Cached: $0.084
  New: $0.045
Total: $0.249
Savings: 40%
```

The longer the conversation, the more you save! 💰

## 🎉 Next Steps

Once testing is complete:
1. Monitor production usage for a few days
2. Check cache hit rates in logs
3. Adjust `MIN_MESSAGES_FOR_CACHE` if needed
4. Consider increasing `CACHE_TTL_SECONDS` for very active threads

## 📚 Additional Resources

- Full documentation: `docs/CACHING.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
- Gemini API docs: https://ai.google.dev/gemini-api/docs/caching?lang=node

