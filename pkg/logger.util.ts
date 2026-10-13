import fs from "fs";
import path from "path";
import util from "util";
import { CachedTimestamp, ILogger, LogExtra, LoggerOptions } from "@core/interfaces/logger.interface";
import { Color, Level } from "@core/enums/logger.enum";

class FileWriter {
    private currentLogFileName: string = "";
    private nextSaveTime: number = 0;

    constructor(private readonly options: LoggerOptions) {
        fs.mkdirSync(this.options.directory, { recursive: true });
        this.calcNextTime();
    }

    public readonly write = (level: Level, message: string): void => {
        if (this.options.disableFileLogs && level !== Level.ERROR) {
            return;
        }

        const now = Date.now();
        if (now >= this.nextSaveTime || !this.currentLogFileName) {
            this.calcNextTime();
            this.currentLogFileName = path.join(
                this.options.directory,
                this.makeFileName(),
            );
        }
        const t = plainTimeString();
        const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, "");
        fs.appendFileSync(
            this.currentLogFileName,
            `${t}[${level}] ${cleanMessage}\n`,
        );
    }

    private calcNextTime() {
        const now = Date.now();
        const interval = this.options.saveIntervalHours
            ? this.options.saveIntervalHours * 3600000
            : 86400000;
        this.nextSaveTime = now + interval;
    }

    private makeFileName() {
        const iso = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
        return `${iso}.log`;
    }
}

class ConsoleOutput {
    constructor(private readonly options: LoggerOptions) { }

    public print(level: Level, message: string, opts: LogExtra = {}) {
        const { noDate, color, rainbow, colorMap } = opts;
        const finalMessage =
            colorMap && colorMap.length > 0
                ? colorMapify(message, colorMap)
                : rainbow
                    ? rainbowify(message)
                    : message;
        const colorSeq = color
            ? generateColorSeq(color)
            : this.getDefaultColor(level);
        const prefix = noDate
            ? ""
            : grayTimeString() + colorSeq + `[${level}] `;
        console.log(prefix + finalMessage + (colorMap ? "" : Color.RESET));
    }

    private getDefaultColor(level: Level): string {
        switch (level) {
            case Level.DEBUG:
            case Level.INFO:
                return Color.GREEN;
            case Level.WARN:
                return Color.YELLOW;
            case Level.ERROR:
                return Color.RED;
            default:
                return Color.WHITE;
        }
    }
}

export default class Logger implements ILogger {
    private readonly fileWriter: FileWriter;
    private readonly consoleOutput: ConsoleOutput;
    private readonly options: LoggerOptions;
    private pendingOptions: LogExtra | undefined = undefined;

    constructor(options: LoggerOptions) {
        this.options = {
            ...options,
            directory: path.resolve(options.directory),
        };
        this.fileWriter = new FileWriter(this.options);
        this.consoleOutput = new ConsoleOutput(this.options);
    }

    public opt(opts: LogExtra): this {
        this.pendingOptions = opts;
        return this;
    }

    private emit(level: Level, data: any[]) {
        const opts = this.pendingOptions;
        this.pendingOptions = undefined;
        const fileMessage = this.formatMessageForFile(data);
        const consoleMessage = this.formatMessageForConsole(data);
        if (opts?.noDate) {
            this.consoleOutput.print(level, consoleMessage, opts);
        } else {
            this.fileWriter.write(level, fileMessage);
            this.consoleOutput.print(level, consoleMessage, opts);
        }
    }

    public log(...data: any[]) {
        this.emit(Level.LOG, data);
    }

    public debug(...data: any[]) {
        this.emit(Level.DEBUG, data);
    }

    public info(...data: any[]) {
        this.emit(Level.INFO, data);
    }

    public warn(...data: any[]) {
        this.emit(Level.WARN, data);
    }

    public error(...data: any[]) {
        this.emit(Level.ERROR, data);
    }

    private formatItem(x: any, colorize: boolean): string {
        if (x instanceof Error) {
            return x.stack || (x.name ? `${x.name}: ${x.message}` : x.message) || String(x);
        }
        if (x && typeof x === "object") {
            if (typeof x.name === "string" && typeof x.message === "string") {
                return x.stack || `${x.name}: ${x.message}`;
            }
            return util.inspect(x, {
                depth: null,
                colors: colorize,
            });
        }
        return String(x);
    }

    private formatMessageForFile(data: any[]): string {
        return data
            .map((x) => this.formatItem(x, false))
            .join(" ");
    }

    private formatMessageForConsole(data: any[]): string {
        return data
            .map((x) => this.formatItem(x, this.options.colorizeObjects ?? false))
            .join(" ");
    }
}

const cachedTimestamp: CachedTimestamp = { timeString: "", expires: 0 };

export const plainTimeString = (): string => {
    const now = Date.now();
    if (now > cachedTimestamp.expires) {
        const d = new Date();
        const off = d.getTimezoneOffset();
        const sign = off < 0 ? "+" : "-";
        const hh = String(Math.abs(Math.floor(off / 60))).padStart(2, "0");
        const mm = String(Math.abs(off % 60)).padStart(2, "0");
        const ds = d.toISOString().slice(0, 10);
        const ts = d.toLocaleTimeString();
        cachedTimestamp.timeString = `[${sign}${hh}:${mm} ${ds} ${ts}] `;
        cachedTimestamp.expires = now + 1000;
    }
    return cachedTimestamp.timeString;
};

export const grayTimeString = (): string => {
    return Color.GRAY + plainTimeString() + Color.RESET;
};

export const colorMapify = (text: string, map: string[]): string => {
    return (
        text
            .split("")
            .map((ch, i) => generateColorSeq(map[i % map.length]) + ch)
            .join("") + Color.RESET
    );
};

export const rainbowify = (str: string): string => {
    const palette = [
        Color.RED,
        Color.GREEN,
        Color.YELLOW,
        Color.BLUE,
        Color.MAGENTA,
        Color.CYAN,
    ];
    return (
        str
            .split("")
            .map((ch, i) => palette[i % palette.length] + ch)
            .join("") + Color.RESET
    );
};

export const generateColorSeq = (input: string): string => {
    if (Object.values(Color).includes(input as Color)) {
        return input;
    }
    if (input.startsWith("#") && (input.length === 7 || input.length === 4)) {
        const { r, g, b } = hexToRgb(input);
        return `\x1b[38;2;${r};${g};${b}m`;
    }
    return Color.WHITE;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const clean = hex.replace("#", "");
    const processedHex =
        clean.length === 3
            ? clean
                .split("")
                .map((c) => c + c)
                .join("")
            : clean;
    const bigint = parseInt(processedHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
};
