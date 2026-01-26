import { PrismaClient } from "@prisma/client";

export const isCommandEnabled = async (prisma: PrismaClient, guildId: string, commandName: string): Promise<boolean> => {
    // Always allow ping and setup
    if (commandName === 'ping' || commandName === 'setup') return true;

    const guild = await prisma.guild.findUnique({ where: { id: guildId } });

    // If guild not found, only default commands are allowed (which are handled above)
    if (!guild) return false;

    const allowed = guild.allowedCmds.split(',');
    return allowed.includes(commandName);
};
