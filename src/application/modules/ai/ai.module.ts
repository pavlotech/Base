import Module, { ModuleType } from "src/core/classes/module.class";
import { Events, Message } from "discord.js";

/**
 * AI Module with Gemini API Integration
 *
 * Features:
 * 1. Permission-based Access Control:
 *    - Only users with specific roles (1295827280177795143, 1330842655302746174) or Administrator permissions can use AI
 *    - Automatically filters out unauthorized users
 *
 * 2. Automatic Context Caching:
 *    - Caches conversation history after 4+ messages to reduce costs
 *    - Cache TTL: 1 hour (automatically refreshed on new messages)
 *    - Only caches history, not the current message
 *    - Saves ~90% on cached tokens vs regular input tokens
 *
 * 3. Thread Reply Detection:
 *    - In threads, bot only responds when directly replied to (using Discord's reply feature)
 *    - Or when explicitly mentioned with @bot
 *    - Or when it's the first message in thread
 *    - Prevents unwanted responses to general thread conversations
 *
 * 4. Smart Image Processing:
 *    - If user asks "What's in this image?" with attached image → analyzes and describes
 *    - If user says "Draw a cat" → generates image (soyjak style only if explicitly requested or user mentioned)
 *    - Soyjak style applied only when: explicit "soyjak" keyword OR user mention AND no other style specified
 *    - Automatically detects intent based on keywords and attached images
 *    - Routes to appropriate model (gemini-2.5-flash-image for images)
 *
 * 5. Smart Thread Naming:
 *    - Automatically generates thread title from first message
 */
export default new Module({ type: ModuleType.MODULE }, async (deps, config) => {
    const THREAD_CHANNEL_ID = "1443034209966100480";

    const getUserInfo = async (userId: string, guild: any) => {
        try {
            const member = await guild.members.fetch(userId);
            if (!member) return null;
            const user = member.user;
            return {
                textInfo: config.userInfo.formatUserInfo(user, member),
                avatarUrl: user.displayAvatarURL({ extension: 'png', size: 512 }),
                username: user.username
            };
        } catch (error) {
            deps.logger.error(`Error fetching member ${userId}:`, error);
            return null;
        }
    };

    const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer).toString('base64');
        } catch (error) {
            deps.logger.error(`Error fetching image from ${url}:`, error);
            return null;
        }
    };

    const getHistory = async (contextId: string) => {
        try {
            const messages = await deps.storage.prisma.message.findMany({
                where: { contextId },
                orderBy: { createdAt: 'asc' },
                take: 30
            });
            return messages.map(m => ({
                role: m.role as "user" | "model",
                parts: [{ text: m.content }]
            }));
        } catch (error) {
            deps.logger.error("Error fetching history:", error);
            return [];
        }
    };

    const saveMessage = async (contextId: string, role: "user" | "model", content: string) => {
        try {
            await deps.storage.prisma.message.create({
                data: { contextId, role, content }
            });
        } catch (error) {
            deps.logger.error("Error saving message:", error);
        }
    };

    const sendLongMessage = async (message: Message, text: string) => {
        if (text.length <= 2000) {
            await message.reply(text);
            return;
        }

        const chunks = text.match(/[\s\S]{1,1950}/g) || [];
        for (const chunk of chunks) {
            if (message.channel.isSendable()) {
                await message.channel.send(chunk);
            }
        }
    };

    const detectIntent = async (prompt: string, hasImages: boolean = false): Promise<"image" | "text" | "code"> => {
        try {
            // Check for explicit image generation commands
            // More precise patterns to avoid false matches
            const imageGenerationPatterns = [
                /(?:^|\s)нарисуй(?:\s|$)/i, /(?:^|\s)сгенерируй(?:\s|$)/i,
                /(?:^|\s)создай изображение(?:\s|$)/i, /\bdraw(?:\s|$)/i,
                /(?:^|\s)generate image(?:\s|$)/i, /(?:^|\s)create image(?:\s|$)/i,
                /(?:^|\s)make a picture(?:\s|$)/i, /(?:^|\s)picture of(?:\s|$)/i,
                /(?:^|\s)image of(?:\s|$)/i
            ];
            const isImageGeneration = imageGenerationPatterns.some(pattern => pattern.test(prompt));

            // Check for image analysis questions when images are attached
            const imageAnalysisPatterns = [
                /(?:^|\s)что на(?:\s|$)/i, /(?:^|\s)что это(?:\s|$)/i,
                /(?:^|\s)что изображено(?:\s|$)/i, /(?:^|\s)что тут(?:\s|$)/i,
                /(?:^|\s)что здесь(?:\s|$)/i, /(?:^|\s)опиш(?:\s|$)/i,
                /(?:^|\s)расскаж(?:\s|$)/i, /(?:^|\s)анализ(?:\s|$)/i,
                /(?:^|\s)what is on(?:\s|$)/i, /(?:^|\s)what's in(?:\s|$)/i,
                /(?:^|\s)what is in(?:\s|$)/i, /(?:^|\s)describe(?:\s|$)/i,
                /(?:^|\s)analyze(?:\s|$)/i, /(?:^|\s)what do you see(?:\s|$)/i,
                /(?:^|\s)what can you see(?:\s|$)/i
            ];
            const isImageAnalysis = hasImages && imageAnalysisPatterns.some(pattern => pattern.test(prompt));

            // If explicit image generation command
            if (isImageGeneration) {
                return "image";
            }

            // If image analysis question with attached images
            if (isImageAnalysis) {
                return "text"; // Will analyze the image
            }

            // Use AI to detect intent for other cases
            const response = await deps.ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [{ parts: [{ text: config.prompts.intentDetection(prompt) }] }],
            });
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
            if (text === "image") return "image";
            if (text === "code") return "code";
            return "text";
        } catch (error) {
            deps.logger.error("Error detecting intent:", error);
            return "text";
        }
    };

    const renameThreadIfFirst = async (message: Message, prompt: string, contextId: string) => {
        if (!message.channel.isThread()) return;

        try {
            const count = await deps.storage.prisma.message.count({ where: { contextId } });
            // Only rename on first exchange (count = 2 after saving user + model messages)
            if (count !== 2) return;

            const titleResponse = await deps.ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [{ parts: [{ text: config.prompts.threadTitleGeneration(prompt) }] }]
            });

            const title = titleResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim().substring(0, 100);
            if (title) {
                await message.channel.setName(title);
                deps.logger.info(`Thread renamed to: ${title}`);
            }
        } catch (error) {
            deps.logger.error("Error renaming thread:", error);
        }
    };

    const checkUserPermissions = async (message: Message): Promise<boolean> => {
        try {
            // Allow administrators
            if (message.member?.permissions.has('Administrator')) {
                return true;
            }

            // Check for specific roles
            const allowedRoleIds = ['1295827280177795143', '1330842655302746174'];
            const hasAllowedRole = message.member?.roles.cache.some(role =>
                allowedRoleIds.includes(role.id)
            );

            return hasAllowedRole || false;
        } catch (error) {
            deps.logger.error("Error checking user permissions:", error);
            return false;
        }
    };

    deps.client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) return;

        // Check user permissions - only allow users with specific roles or admin rights
        const hasPermission = await checkUserPermissions(message);
        if (!hasPermission) {
            deps.logger.debug(`User ${message.author.id} doesn't have permission to use AI features`);
            return;
        }

        const isThread = message.channel.isThread();
        const parentId = isThread && 'parent' in message.channel ? message.channel.parent?.id : null;

        // Check if bot is mentioned
        const isMentioned = message.mentions.has(deps.client.user!.id);
        const isInDesignatedChannel = !isThread && message.channelId === THREAD_CHANNEL_ID;
        const isInDesignatedThread = isThread && parentId === THREAD_CHANNEL_ID;

        // In threads, only respond if it's a direct reply to the bot OR it's the first message
        if (isInDesignatedThread) {
            // Check if this is the first message in the thread
            const messages = await message.channel.messages.fetch({ limit: 2 });
            const isFirstMessage = messages.size === 1;

            const isReplyToBot = message.reference?.messageId ?
                (await message.channel.messages.fetch(message.reference.messageId))?.author.id === deps.client.user!.id :
                false;

            if (!isReplyToBot && !isMentioned && !isFirstMessage) {
                deps.logger.debug(`Ignoring message in thread - not a reply to bot and not first message`);
                return;
            }
        }

        // Bot responds if: mentioned anywhere, or in designated channel, or reply to bot in designated thread
        if (!isMentioned && !isInDesignatedChannel && !isInDesignatedThread) return;

        let prompt = message.content.trim();

        // Remove bot mention from prompt
        if (isMentioned) {
            prompt = prompt.replace(new RegExp(`<@!?${deps.client.user!.id}>`, 'g'), '').trim();
        }

        if (!prompt && message.attachments.size === 0) return;

        const contextId = message.channel.id;

        try {
            await message.channel.sendTyping();

            const mentionedUsers = message.mentions.users;
            const attachments = message.attachments;

            // Filter out bot from mentioned users
            const userContexts = await Promise.all(
                Array.from(mentionedUsers.keys())
                    .filter(id => id !== deps.client.user!.id)
                    .map(id => getUserInfo(id, message.guild))
            );
            const validUserContexts = userContexts.filter((u): u is NonNullable<typeof u> => u !== null);

            const hasImages = attachments.some(att => att.contentType?.startsWith('image/'));
            const intent = prompt ? await detectIntent(prompt, hasImages) : "text";

            if (intent === "image") {
                // Add soyjak style only when explicitly requested or when mentioning a user
                const hasSoyjakKeywords = prompt.toLowerCase().includes('soyjak') || prompt.toLowerCase().includes('сойджак');
                const hasUserMention = message.mentions.users.size > 0;
                const hasOtherStyle = /\b(?:anime|realistic|photorealistic|cartoon|pixel|3d|abstract|minimalist|watercolor|oil|sketch|painting|drawing|portrait|landscape|digital|traditional)\b/i.test(prompt);

                const imagePrompt = (hasSoyjakKeywords || hasUserMention) && !hasOtherStyle
                    ? `${prompt} in soyjak meme style`
                    : prompt;

                const parts: any[] = [{ text: imagePrompt }];

                for (const [_, attachment] of attachments) {
                    if (attachment.contentType?.startsWith('image/')) {
                        const base64 = await fetchImageAsBase64(attachment.url);
                        if (base64) {
                            parts.push({ inlineData: { mimeType: "image/png", data: base64 } });
                        }
                    }
                }

                for (const userCtx of validUserContexts) {
                    if (userCtx.avatarUrl) {
                        const base64 = await fetchImageAsBase64(userCtx.avatarUrl);
                        if (base64) {
                            parts.push({ inlineData: { mimeType: "image/png", data: base64 } });
                        }
                    }
                }

                const response = await deps.ai.models.generateContent({
                    model: "gemini-2.5-flash-image",
                    contents: [{ parts }]
                });

                const responseParts = response.candidates?.[0]?.content?.parts;
                const imagePart = responseParts?.find(p => p.inlineData?.mimeType?.startsWith('image/'));

                if (imagePart?.inlineData?.data) {
                    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
                    await message.reply({ files: [{ attachment: buffer, name: 'generated.png' }] });
                    await renameThreadIfFirst(message, prompt, contextId);
                } else {
                    await message.reply(config.messages.imageGenerationFailed);
                }
                return;
            }

            const history = await getHistory(contextId);
            const currentParts: any[] = [];

            if (prompt) currentParts.push({ text: prompt });

            // Add images to parts for analysis (when intent is text)
            // or for reference (when intent is image generation)
            for (const [_, attachment] of attachments) {
                if (attachment.contentType?.startsWith('image/') || attachment.contentType?.startsWith('video/') || attachment.contentType?.startsWith('audio/')) {
                    const base64 = await fetchImageAsBase64(attachment.url);
                    if (base64) {
                        currentParts.push({ inlineData: { mimeType: attachment.contentType, data: base64 } });
                    }
                }
            }

            if (validUserContexts.length > 0) {
                const contextText = config.messages.userContextHeader +
                    validUserContexts.map(u => u.textInfo).join(config.messages.userContextSeparator);
                currentParts.push({ text: contextText });
            }

            // Prepare full history including current message for caching
            const fullHistory = [
                ...history,
                { role: "user" as const, parts: currentParts }
            ];

            // Try to get or create cache
            const cacheName = await deps.services.cache.getOrCreateCache({
                contextId,
                history: fullHistory,
            });

            let result;
            if (cacheName) {
                // Use cached content - only send the last message
                deps.logger.info(`Using cache ${cacheName} for context ${contextId}`);
                result = await deps.ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: currentParts.length > 0 ? [{ role: "user", parts: currentParts }] : [],
                    config: { cachedContent: cacheName }
                });
            } else {
                // No cache available, send full history
                deps.logger.debug(`No cache available for context ${contextId}, sending full history`);
                result = await deps.ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: fullHistory
                });
            }

            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (responseText) {
                await saveMessage(contextId, "user", prompt || "[Media]");
                await saveMessage(contextId, "model", responseText);

                await sendLongMessage(message, responseText);
                await renameThreadIfFirst(message, prompt, contextId);
            } else {
                await message.reply(config.messages.textGenerationFailed);
            }

        } catch (error) {
            deps.logger.error("Error in AI module:", error);
            await message.reply(config.messages.errorProcessingRequest);
        }
    });
});
