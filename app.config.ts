export default {
        embed: {
                defaultColor: 0x5865F2
        },
        messages: {
                avatarAnalysisFailed: 'Не вдалося проаналізувати аватарку',
                avatarAnalysisUnavailable: 'Аналіз недоступний',
                userContextHeader: '\n\nІнформація про згаданих користувачів:\n',
                userContextSeparator: '\n\n---\n\n',
                avatarLabel: '\nАватарка: ',
                imageGenerationFailed: 'Не вдалося згенерувати зображення.',
                textGenerationFailed: 'Не вдалося згенерувати відповідь.',
                errorProcessingRequest: 'Вибачте, сталася помилка під час обробки вашого запиту.',
                userContextPrompt: '\n\nВідповідь на питання користувача, використовуючи надану інформацію про згаданих користувачів.',
                noGames: 'Немає ігор',
                chatPrefix: '> '
        },
        userInfo: {
                formatUserInfo: (user: any, member: any) => [
                        `Користувач: ${user.username} (${user.tag})`,
                        `ID: ${user.id}`,
                        `Відображуване ім'я: ${member.displayName}`,
                        `Ролі: ${member.roles.cache.map((r: { name: any; }) => r.name).filter((n: string) => n !== '@everyone').join(', ') || 'Немає ролей'}`,
                        `Дата приєднання: ${member.joinedAt?.toLocaleDateString('uk-UA') || 'Невідомо'}`,
                        `Дата створення: ${user.createdAt.toLocaleDateString('uk-UA')}`,
                        `Статус: ${member.presence?.status || 'Невідомо'}`,
                ].join('\n')
        },
        prompts: {
                systemInstruction: `You are a helpful AI assistant in a Discord server. You have access to conversation history and should maintain context across messages. 
Key behaviors:
- Be conversational and friendly
- Remember previous messages in the conversation
- Provide accurate and helpful information
- When discussing code, use proper Discord markdown formatting
- When asked about users, use the provided user information
- Maintain context and refer back to previous parts of the conversation when relevant
- Respond in the same language as the user's message`,

                formattingInstructions: `

IMPORTANT: Format your response for Discord:
- Use \`\`\`language for code blocks (e.g., \`\`\`javascript, \`\`\`python, \`\`\`typescript)
- Use \`inline code\` for short code snippets
- Use **bold** for important terms
- Use *italic* for emphasis
- Use > for quotes
- Use proper markdown formatting`,

                threadTitleGeneration: (message: string) => `Generate a concise thread title (max 100 characters) based on this user message: "${message}"

Rules:
- Maximum 100 characters
- Clear and descriptive
- Captures the main topic
- No quotes or special formatting
- In the same language as the message

Your response (only the title):`,

                intentDetection: (prompt: string) => `Analyze this user request and determine if they want to:
1. Generate an image
2. Get help with code/programming
3. Get a regular text response

User request: "${prompt}"

Respond with ONLY one word: "image", "code", or "text"

Examples:
- "create an image of a cat" -> image
- "draw a sunset" -> image
- "generate a picture of a city" -> image
- "write code to sort an array" -> code
- "how to create a function in JavaScript?" -> code
- "show me an example of a React component" -> code
- "fix this code" -> code
- "what is recursion?" -> code
- "what is the weather?" -> text
- "tell me about history" -> text
- "how are you?" -> text

Your response (only "image", "code", or "text"):`,

                avatarAnalysis: (username: string) => `Describe the avatar of user ${username}. Be brief and accurate. Describe what is shown, colors, style. Maximum 2-3 sentences.`,

                avatarContentType: `Analyze this Discord avatar image and determine if it contains meaningful visual content.
Respond with ONLY "meaningful" or "simple".

Meaningful content includes:
- Human faces or portraits
- Animals or creatures
- Anime/manga characters
- Detailed artwork or illustrations
- Recognizable objects or scenes

Simple content includes:
- Just initials or letters
- Solid colors or simple gradients
- Basic geometric shapes
- Default Discord avatars
- Minimalist logos without detail

Your response (only "meaningful" or "simple"):`,

                soyjakFromAvatar: `Transform this avatar into a soyjak/wojak meme style image. 
Style: soyjak meme art style, simple cartoon, exaggerated features, internet meme aesthetic.
Make it funny and recognizable as a soyjak variant based on the visual characteristics of the provided avatar image.`,

                soyjakFromProfile: (profileInfo: string) => `Create a soyjak/wojak meme character that represents this Discord user:
${profileInfo}

Style: soyjak/wojak meme art style, simple cartoon, exaggerated features, internet meme aesthetic.
Create a character that embodies their profile information - their username vibe, what they're doing, and their server roles.
Make it funny and characteristic.`,

                soyjakFromSteam: (username: string, steamInfo: string) => `Create a soyjak/wojak meme character that represents this Steam user:
Username: ${username}
${steamInfo}

Style: soyjak/wojak meme art style, simple cartoon, exaggerated features, internet meme aesthetic.
Create a character that embodies their gaming profile - their favorite games, playtime, achievements.
Make it funny and characteristic of a gamer.`,

                imageTransform: (prompt: string) => `${prompt}

Transform or work with this image according to the user's request.`
        }
}