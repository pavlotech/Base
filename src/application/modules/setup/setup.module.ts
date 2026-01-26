import Module, { ModuleType } from "src/core/classes/module.class";
import { Events, SlashCommandBuilder, PermissionFlagsBits, MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } from "discord.js";

export default new Module({ type: ModuleType.MODULE }, async (deps, config) => {
    deps.command.addSlashCommand(
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('Manage guild commands')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    );

    deps.client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isChatInputCommand() && interaction.commandName === "setup") {
            if (!interaction.guildId) {
                await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
                return;
            }

            const guild = await deps.storage.prisma.guild.findUnique({ where: { id: interaction.guildId } });
            const allowedCmds = guild ? guild.allowedCmds.split(',') : ['ping', 'setup'];

            const storedCommands = deps.command.getAllStoredCommands();

            if (storedCommands.length === 0) {
                await interaction.reply({ content: "No optional commands available to configure.", flags: MessageFlags.Ephemeral });
                return;
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('setup_commands')
                .setPlaceholder('Select commands to enable')
                .setMinValues(0)
                .setMaxValues(storedCommands.length)
                .addOptions(
                    storedCommands.map(cmd =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel(cmd.name)
                            .setDescription(cmd.description)
                            .setValue(cmd.name)
                            .setDefault(allowedCmds.includes(cmd.name))
                    )
                );

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setTitle('Command Setup')
                .setDescription('Select the commands you want to enable for this server.\n`ping` and `setup` are always enabled.')
                .setColor(config.embed.defaultColor);

            await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
        }

        if (interaction.isStringSelectMenu() && interaction.customId === 'setup_commands') {
            if (!interaction.guild) return;

            const selectedCommands = interaction.values;
            const finalCommands = ['ping', 'setup', ...selectedCommands];

            try {
                // Defer immediately to prevent timeout
                await interaction.deferUpdate();

                // 1. Update DB
                await deps.storage.prisma.guild.upsert({
                    where: { id: interaction.guildId! },
                    update: { allowedCmds: finalCommands.join(',') },
                    create: {
                        id: interaction.guildId!,
                        allowedCmds: finalCommands.join(',')
                    }
                });

                // 2. Register selected commands to guild
                const commandsToRegister = [];
                for (const cmdName of selectedCommands) {
                    const cmdDef = deps.command.getStoredCommand(cmdName);
                    if (cmdDef) {
                        commandsToRegister.push(cmdDef.toJSON());
                    }
                }

                await interaction.guild.commands.set(commandsToRegister);

                await interaction.editReply({
                    content: `✅ Updated! Enabled commands: ${finalCommands.join(', ')}`,
                    components: [],
                    embeds: []
                });

            } catch (error) {
                deps.logger.error("Error updating guild commands:", error);

                if (interaction.deferred) {
                    await interaction.editReply({ content: "❌ Failed to update commands." });
                } else {
                    await interaction.reply({ content: "❌ Failed to update commands.", flags: MessageFlags.Ephemeral });
                }
            }
        }
    });
});
