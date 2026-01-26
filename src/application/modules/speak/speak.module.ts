import Module, { ModuleType } from "src/core/classes/module.class";
import { Events, SlashCommandBuilder, EmbedBuilder, MessageFlags, ColorResolvable, TextBasedChannel } from "discord.js";
import { isCommandEnabled } from "src/utils/permission.util";

export default new Module({ type: ModuleType.MODULE }, async (deps) => {
    deps.command.addStoredCommand(
        new SlashCommandBuilder()
            .setName("speak")
            .setDescription("Команда для відправлення повідомлень")
            .addStringOption(option =>
                option
                    .setName("text")
                    .setDescription("Текст повідомлення, який потрібно відправити.")
                    .setRequired(false)
            )
            .addStringOption(option =>
                option
                    .setName("reply_to")
                    .setDescription("ID повідомлення, на яке потрібно відповісти.")
                    .setRequired(false)
            )
            .addAttachmentOption(option =>
                option
                    .setName("attachment")
                    .setDescription("Прикріпіть вкладення до повідомлення.")
                    .setRequired(false)
            )
            .addStringOption(option =>
                option
                    .setName("title")
                    .setDescription("Заголовок для ембеду.")
                    .setRequired(false)
            )
            .addStringOption(option =>
                option
                    .setName("color")
                    .setDescription("Колір ембеду у форматі HEX (#RRGGBB).")
                    .setRequired(false)
            )
            .addStringOption(option =>
                option
                    .setName("footer")
                    .setDescription("Текст для нижнього колонтитула ембеду.")
                    .setRequired(false)
            )
            .addAttachmentOption(option =>
                option
                    .setName("thumbnail")
                    .setDescription("Прикріпіть ескіз до ембеду.")
                    .setRequired(false)
            )
            .addStringOption(option =>
                option
                    .setName("embed")
                    .setDescription("Відправити повідомлення у вигляді ембеду.")
                    .setRequired(false)
                    .addChoices(
                        { name: 'Так', value: 'true' },
                        { name: 'Ні', value: 'false' }
                    )
            )
    );

    deps.client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand() || interaction.commandName !== "speak") return;

        if (!interaction.guild) {
            await interaction.reply({ content: "Ця команда доступна лише на сервері.", flags: MessageFlags.Ephemeral });
            return;
        }

        if (!await isCommandEnabled(deps.storage.prisma, interaction.guildId!, 'speak')) {
            await interaction.reply({ content: "This command is disabled in this server.", flags: MessageFlags.Ephemeral });
            return;
        }

        // Check if user has administrator permissions
        if (!interaction.memberPermissions?.has('Administrator')) {
            await interaction.reply({ content: "Ви не адміністратор.", flags: MessageFlags.Ephemeral });
            return;
        }

        const messageContent = interaction.options.getString("text") || "";
        const replyTo = interaction.options.getString("reply_to");
        const title = interaction.options.getString("title");
        const color = interaction.options.getString("color") || "#0099ff";
        const validColor = /^#([0-9A-F]{3}){1,2}$/i.test(color) ? color : "#0099ff";
        const footer = interaction.options.getString("footer");
        const attachment = interaction.options.getAttachment("attachment");
        const thumbnail = interaction.options.getAttachment("thumbnail");
        const isEmbed = interaction.options.getString("embed") === 'true';

        const channel = interaction.channel as TextBasedChannel;
        if (!channel) {
            await interaction.reply({ content: "Не вдалося знайти текстовий канал.", flags: MessageFlags.Ephemeral });
            return;
        }

        const replyMessage = replyTo ? await channel.messages.fetch(replyTo).catch(() => null) : null;

        if (!messageContent && !isEmbed && !attachment) {
            await interaction.reply({ content: "Повідомлення не може бути порожнім.", flags: MessageFlags.Ephemeral });
            return;
        }

        if (isEmbed) {
            const embed = new EmbedBuilder()
                .setColor(validColor as ColorResolvable)
                .setDescription(messageContent || null)
                .setTitle(title || null)
                .setFooter(footer ? { text: footer } : null)
                .setImage(attachment?.url || null)
                .setThumbnail(thumbnail?.url || null);

            const embedResponse = replyMessage
                ? await replyMessage.reply({ embeds: [embed] })
                : await (channel as any).send({ embeds: [embed] });

            await interaction.reply({ content: "Повідомлення успішно відправлено!", flags: MessageFlags.Ephemeral });
            return embedResponse;
        }

        const content = attachment ? `${messageContent}\n${attachment.url}` : messageContent;
        const textResponse = replyMessage
            ? await replyMessage.reply({ content })
            : await (channel as any).send({ content });

        await interaction.reply({ content: "Повідомлення успішно відправлено!", flags: MessageFlags.Ephemeral });
        return textResponse;
    });
});
