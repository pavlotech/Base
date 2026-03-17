import { Color } from "@core/enums/logger.enum";

export interface LoggerOptions {
    directory: string;
    saveIntervalHours?: number;
    colorizeObjects: boolean;
    disableFileLogs?: boolean;
}

export interface CachedTimestamp {
    timeString: string;
    expires: number;
}

export interface LogExtra {
    color?: Color | string;
    noDate?: boolean;
    rainbow?: boolean;
    colorMap?: string[];
}

export interface ILogger {
    opt(opts: LogExtra): ILogger;
    log(...data: any[]): void;
    debug(...data: any[]): void;
    info(...data: any[]): void;
    warn(...data: any[]): void;
    error(...data: any[]): void;
}

