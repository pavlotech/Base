import Module, { ModuleType } from "src/core/classes/module.class";
import { Events, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } from "discord.js";
import { SteamProfileService } from "src/infrastructure/services/profile.service";

import { isCommandEnabled } from "src/utils/permission.util";

export default new Module({ type: ModuleType.MODULE }, async (deps, config) => {
    const steamProfileService = new SteamProfileService();

    deps.command.addStoredCommand(
        new SlashCommandBuilder()
            .setName('profile')
            .setDescription('Показати Steam профіль користувача')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('Користувач для перегляду профілю')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('steam')
                    .setDescription('Посилання на Steam профіль або Steam ID (для перегляду без прив\'язки)')
                    .setRequired(false)
            )
    );

    deps.client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand() || interaction.commandName !== "profile") return;

        if (interaction.guildId && !await isCommandEnabled(deps.storage.prisma, interaction.guildId, 'profile')) {
            await interaction.reply({ content: "This command is disabled in this server.", flags: MessageFlags.Ephemeral });
            return;
        }

        const targetUser = interaction.options.getUser('user');
        const steamInput = interaction.options.getString('steam');

        // If no options provided, default to self
        const userToCheck = targetUser || (!steamInput ? interaction.user : null);

        try {
            const steamApiKey = process.env.STEAM_API_KEY;
            if (!steamApiKey) {
                throw new Error('STEAM_API_KEY not configured');
            }

            let steamIdToFetch: string | null = null;
            let displayName = 'Unknown';

            // 1. Direct Steam ID/URL provided
            if (steamInput) {
                try {
                    steamIdToFetch = await steamProfileService.resolveSteamId(steamInput, steamApiKey);
                    displayName = steamInput; // Temporary name until profile fetched

                    // Save the Steam ID for the target user (either specified user or command executor)
                    const targetUserForLinking = targetUser || interaction.user;

                    await deps.storage.prisma.user.upsert({
                        where: { id: targetUserForLinking.id },
                        update: { steamId: steamIdToFetch },
                        create: {
                            id: targetUserForLinking.id,
                            steamId: steamIdToFetch
                        }
                    });

                    deps.logger.info(`Auto-linked Steam profile for user ${targetUserForLinking.tag} (${targetUserForLinking.id}): ${steamIdToFetch}`);
                } catch (e) {
                    await interaction.reply({ content: 'Не вдалося знайти Steam профіль за вказаним посиланням/ID.', flags: MessageFlags.Ephemeral });
                    return;
                }
            }
            // 2. Discord User provided (or self)
            else if (userToCheck) {
                displayName = userToCheck.username;
                const dbUser = await deps.storage.prisma.user.findUnique({
                    where: { id: userToCheck.id }
                });

                if (dbUser?.steamId) {
                    steamIdToFetch = dbUser.steamId;
                } else {
                    // User not in DB or not linked
                    await interaction.reply({
                        content: `⚠️ **Steam профіль не знайдено**\n\nDiscord не дозволяє ботам автоматично бачити прив'язані акаунти користувачів через налаштування приватності.\n\nКористувач ${userToCheck} повинен один раз виконати команду \`/link\`, щоб зберегти свій профіль.\n\n**Або** ви можете переглянути профіль прямо зараз, вказавши посилання:\n\`/profile steam:<посилання_або_id>\``,
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
            }

            if (!steamIdToFetch) {
                await interaction.reply({ content: 'Не вдалося визначити Steam ID.', flags: MessageFlags.Ephemeral });
                return;
            }

            await interaction.deferReply();

            const profileData = await steamProfileService.fetchSteamProfile(steamIdToFetch, steamApiKey);

            if (!profileData) {
                await interaction.editReply({ content: 'Не вдалося отримати дані профілю Steam.' });
                return;
            }

            const imageBuffer = await steamProfileService.generateProfileCard(profileData);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'profile.png' });

            const embed = new EmbedBuilder()
                .setTitle(`Steam профіль ${profileData.personaname}`)
                .setURL(profileData.profileUrl)
                .setImage('attachment://profile.png')
                /*                 .addFields(
                                    { name: 'Steam ID', value: `\`${profileData.steamId}\``, inline: true },
                                    { name: 'Ігор', value: `${profileData.gamesCount}`, inline: true },
                                    { name: 'Рівень', value: `${profileData.level}`, inline: true }
                                ) */
                .setColor(config.embed.defaultColor)
                .setFooter({ text: `Запит від ${interaction.user.tag}` });

            await interaction.editReply({ embeds: [embed], files: [attachment] });
            deps.logger.info(`Profile displayed for ${displayName} (${steamIdToFetch})`);

        } catch (error: any) {
            deps.logger.error(`Error fetching Steam profile: ${error.message}`);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: `Помилка: ${error.message}` });
            } else {
                await interaction.reply({ content: `Помилка: ${error.message}`, flags: MessageFlags.Ephemeral });
            }
        }
    });
});
