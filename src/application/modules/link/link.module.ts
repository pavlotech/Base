import Module, { ModuleType } from "src/core/classes/module.class";
import { Events, SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { SteamProfileService } from "src/infrastructure/services/profile.service";

import { isCommandEnabled } from "src/utils/permission.util";

export default new Module({ type: ModuleType.MODULE }, async (deps, config) => {
    deps.command.addStoredCommand(
        new SlashCommandBuilder()
            .setName('link')
            .setDescription('Прив\'яжіть свій Steam профіль')
            .addStringOption(option =>
                option.setName('steam')
                    .setDescription('Посилання на Steam профіль або Steam ID')
                    .setRequired(true)
            )
    );

    deps.client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand() || interaction.commandName !== "link") return;

        if (interaction.guildId && !await isCommandEnabled(deps.storage.prisma, interaction.guildId, 'link')) {
            await interaction.reply({ content: "This command is disabled in this server.", flags: MessageFlags.Ephemeral });
            return;
        }

        const steamInput = interaction.options.getString('steam');
        if (!steamInput) {
            await interaction.reply({ content: 'Невірний введений текст.', flags: MessageFlags.Ephemeral });
            return;
        }

        const { tag, id } = interaction.user;
        const guildId = interaction.guild?.id;

        const steamProfileService = new SteamProfileService(); // Or inject if possible, but for now instantiate
        const steamApiKey = process.env.STEAM_API_KEY;

        try {
            if (!steamApiKey) throw new Error('STEAM_API_KEY not configured');

            const steamId = await steamProfileService.resolveSteamId(steamInput, steamApiKey);

            await deps.storage.prisma.user.upsert({
                where: { id },
                update: { steamId },
                create: {
                    id,
                    steamId
                }
            });

            const embed = new EmbedBuilder()
                .setTitle(`Ваш Steam профіль успішно прив'язано до системи`)
                .addFields(
                    { name: 'Посилання на профіль', value: `https://steamcommunity.com/profiles/${steamId}` },
                    { name: 'Steam ID', value: `\`\`\`${steamId}\`\`\`` }
                )
                .setFooter({ text: `Команда виконана користувачем ${tag}` })
                .setColor(config.embed.defaultColor);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            deps.logger.info(`User ${tag} (${id}) linked Steam profile: ${steamInput} in guild ${guildId}.`);
        } catch (error: any) {
            deps.logger.error(`Error linking Steam profile for user ${tag} (${id}): ${error.message}`);
            await interaction.reply({ content: 'Не вдалося прив\'язати Steam профіль. Спробуйте пізніше.', flags: MessageFlags.Ephemeral });
        }
    });
});
