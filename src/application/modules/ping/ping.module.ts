import Module, { ModuleType } from "src/core/classes/module.class";
import { Events, MessageFlags, SlashCommandBuilder } from "discord.js";

export default new Module({ type: ModuleType.MODULE }, async (deps) => {
    deps.command.addSlashCommand(
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Повертає ping бота')
    );

    deps.client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand() || interaction.commandName !== "ping") return;

        const latency = deps.client.ws.ping;

        await interaction.reply({
            content: `Понг! 🏓 Затримка становить ${latency}мс.`,
            flags: MessageFlags.Ephemeral
        });
    });
});