import Module, { ModuleType } from "src/core/classes/module.class";
import { Events, SlashCommandBuilder, MessageFlags } from "discord.js";
import { isCommandEnabled } from "src/utils/permission.util";

export default new Module({ type: ModuleType.MODULE }, async (deps) => {
    deps.command.addStoredCommand(
        new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Очистити історію розмови з AI в цьому чаті')
    );

    deps.client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand() || interaction.commandName !== 'clear') return;

        if (interaction.guildId && !await isCommandEnabled(deps.storage.prisma, interaction.guildId, 'clear')) {
            await interaction.reply({ content: "This command is disabled in this server.", flags: MessageFlags.Ephemeral });
            return;
        }

        const contextId = interaction.channel?.isThread()
            ? interaction.channel.id
            : interaction.channelId;

        try {
            const { count } = await deps.storage.prisma.message.deleteMany({
                where: { contextId }
            });

            if (count > 0) {
                await interaction.reply({ content: '✅ Історія розмови очищена!', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'ℹ️ Історія розмови вже пуста.', flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            deps.logger.error("Error clearing history:", error);
            await interaction.reply({ content: '❌ Помилка при очищенні історії.', flags: MessageFlags.Ephemeral });
        }
    });
});
