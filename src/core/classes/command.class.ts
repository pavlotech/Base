import { REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder, Client, ApplicationCommandDataResolvable } from "discord.js";
import { Logger } from "src/utils/logger.util";

export default class Command {
    private readonly commands: ApplicationCommandDataResolvable[] = [];
    private readonly storedCommands: Map<string, SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder> = new Map();

    constructor(private readonly logger: Logger) { }

    public addSlashCommand(command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder) {
        this.commands.push(command.toJSON());
    }

    public addStoredCommand(command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder) {
        this.storedCommands.set(command.name, command);
    }

    public getStoredCommand(name: string) {
        return this.storedCommands.get(name);
    }

    public getAllStoredCommands() {
        return Array.from(this.storedCommands.values());
    }

    public async registerCommands(client: Client, token: string) {
        const rest = new REST({ version: '10' }).setToken(token);

        try {
            if (client.user) {
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: this.commands },
                );
            }
        } catch (error) {
            this.logger.error('Error reloading application (/) commands:', error);
        }
    }
}
