import fs from 'fs'
import path from 'path'
import util from 'util'
import process from 'process'
import { CachedTimestamp, LogExtra, LoggerOptions } from 'src/core/interfaces/logger.interface';
import { Color, Level } from 'src/core/enums/logger.enum'

class FileWriter {
    private currentLogFileName: string = '';
    private nextSaveTime: number = 0;

    constructor(private readonly options: LoggerOptions) {
        fs.mkdirSync(this.options.logDirectory, { recursive: true });
        this.calcNextTime();
    }

    public write(level: Level, message: string) {
        const now = Date.now();
        if (now >= this.nextSaveTime || !this.currentLogFileName) {
            this.calcNextTime();
            this.currentLogFileName = path.join(this.options.logDirectory, this.makeFileName());
        }
        const t = plainTimeString();
        const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, '');
        fs.appendFileSync(this.currentLogFileName, `${t}[${level}] ${cleanMessage}\n`);
    }

    private calcNextTime() {
        const now = Date.now();
        const interval = this.options.saveIntervalHours ? this.options.saveIntervalHours * 3600000 : 86400000;
        this.nextSaveTime = now + interval;
    }

    private makeFileName() {
        const iso = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        return `${iso}.log`;
    }
}

class ConsoleOutput {
    constructor(private options: LoggerOptions) { }

    public print(level: Level, message: string, opts: LogExtra = {}) {
        const { noDate, color, rainbow, colorMap } = opts;
        const finalMessage = colorMap && colorMap.length > 0
            ? colorMapify(message, colorMap)
            : rainbow
                ? rainbowify(message)
                : message;
        const colorSeq = color ? generateColorSeq(color) : this.getDefaultColor(level);
        const prefix = noDate ? '' : grayTimeString() + colorSeq + `[${level}] `;
        console.log(prefix + finalMessage + (colorMap ? '' : Color.RESET));
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
            case Level.ASSERT:
                return Color.RED;
            case Level.CLEAR:
                return Color.GRAY;
            case Level.COUNT:
                return Color.CYAN;
            case Level.DIR:
                return Color.WHITE;
            case Level.DIRXML:
                return Color.WHITE;
            case Level.GROUP:
                return Color.CYAN;
            case Level.GROUPCOLLAPSED:
                return Color.CYAN;
            case Level.GROUPEND:
                return Color.CYAN;
            case Level.TABLE:
                return Color.WHITE;
            case Level.TIME:
                return Color.MAGENTA;
            case Level.TIMELOG:
                return Color.MAGENTA;
            case Level.TIMEEND:
                return Color.MAGENTA;
            case Level.TIMESTAMP:
                return Color.GREEN;
            case Level.TRACE:
                return Color.MAGENTA;
            case Level.PROFILE:
                return Color.GREEN;
            case Level.PROFILEEND:
                return Color.GREEN;
            case Level.PROGRESS:
                return Color.CYAN;
            default:
                return Color.WHITE;
        }
    }
}

export class Logger {
    private fileWriter: FileWriter
    private consoleOutput: ConsoleOutput
    private options: LoggerOptions
    private pendingOptions: LogExtra | undefined = undefined
    private counters = new Map<string, number>()
    private timers = new Map<string, number>()
    private inlineActive = false

    constructor(options: LoggerOptions) {
        this.options = { ...options, logDirectory: path.resolve(options.logDirectory) }
        this.fileWriter = new FileWriter(this.options)
        this.consoleOutput = new ConsoleOutput(this.options)
    }

    opt(opts: LogExtra): this {
        this.pendingOptions = opts
        return this
    }

    log(...data: any[]) {
        this.finishInlineIfNeeded()
        const opts = this.pendingOptions
        this.pendingOptions = undefined
        const fileMessage = this.formatMessageForFile(data)
        const consoleMessage = this.formatMessageForConsole(data)
        if (opts && opts.noDate) {
            this.consoleOutput.print(Level.LOG, consoleMessage, opts)
        } else {
            this.fileWriter.write(Level.LOG, fileMessage)
            this.consoleOutput.print(Level.LOG, consoleMessage, opts)
        }
    }

    debug(...data: any[]) {
        this.finishInlineIfNeeded()
        const opts = this.pendingOptions
        this.pendingOptions = undefined
        const fileMessage = this.formatMessageForFile(data)
        const consoleMessage = this.formatMessageForConsole(data)
        if (opts && opts.noDate) {
            this.consoleOutput.print(Level.DEBUG, consoleMessage, opts)
        } else {
            this.fileWriter.write(Level.DEBUG, fileMessage)
            this.consoleOutput.print(Level.DEBUG, consoleMessage, opts)
        }
    }

    info(...data: any[]) {
        this.finishInlineIfNeeded()
        const opts = this.pendingOptions
        this.pendingOptions = undefined
        const fileMessage = this.formatMessageForFile(data)
        const consoleMessage = this.formatMessageForConsole(data)
        if (opts && opts.noDate) {
            this.consoleOutput.print(Level.INFO, consoleMessage, opts)
        } else {
            this.fileWriter.write(Level.INFO, fileMessage)
            this.consoleOutput.print(Level.INFO, consoleMessage, opts)
        }
    }

    warn(...data: any[]) {
        this.finishInlineIfNeeded()
        const opts = this.pendingOptions
        this.pendingOptions = undefined
        const fileMessage = this.formatMessageForFile(data)
        const consoleMessage = this.formatMessageForConsole(data)
        if (opts && opts.noDate) {
            this.consoleOutput.print(Level.WARN, consoleMessage, opts)
        } else {
            this.fileWriter.write(Level.WARN, fileMessage)
            this.consoleOutput.print(Level.WARN, consoleMessage, opts)
        }
    }

    error(...data: any[]) {
        this.finishInlineIfNeeded()
        const opts = this.pendingOptions
        this.pendingOptions = undefined
        const fileMessage = this.formatMessageForFile(data)
        const consoleMessage = this.formatMessageForConsole(data)
        if (opts && opts.noDate) {
            this.consoleOutput.print(Level.ERROR, consoleMessage, opts)
        } else {
            this.fileWriter.write(Level.ERROR, fileMessage)
            this.consoleOutput.print(Level.ERROR, consoleMessage, opts)
        }
    }

    assert(condition: any, ...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        if (!condition) {
            const msg = data.length ? data.join(' ') : 'Assertion failed'
            const message = `Assertion failed: ${msg}`
            this.fileWriter.write(Level.ASSERT, message)
            this.consoleOutput.print(Level.ASSERT, message)
        }
    }

    clear() {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        console.clear()
        const message = '----- CONSOLE CLEARED -----'
        this.fileWriter.write(Level.CLEAR, message)
        this.consoleOutput.print(Level.CLEAR, message)
    }

    count(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const val = (this.counters.get(label) || 0) + 1
        this.counters.set(label, val)
        const message = `${label}: ${val}`
        this.fileWriter.write(Level.COUNT, message)
        this.consoleOutput.print(Level.COUNT, message)
    }

    countReset(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        this.counters.set(label, 0)
        const message = `${label}: 0 (reset)`
        this.fileWriter.write(Level.COUNT, message)
        this.consoleOutput.print(Level.COUNT, message)
    }

    dir(item: any, options?: util.InspectOptions) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const str = util.inspect(item, { depth: null, colors: this.options.colorizeObjects, ...options })
        this.fileWriter.write(Level.DIR, str)
        this.consoleOutput.print(Level.DIR, str)
    }

    dirxml(...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const message = this.formatMessageForFile(data)
        this.fileWriter.write(Level.DIRXML, message)
        this.consoleOutput.print(Level.DIRXML, this.formatMessageForConsole(data))
    }

    group(...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const message = this.formatMessageForFile(data)
        this.fileWriter.write(Level.GROUP, message)
        this.consoleOutput.print(Level.GROUP, this.formatMessageForConsole(data))
        console.group(...data)
    }

    groupCollapsed(...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const message = this.formatMessageForFile(data)
        this.fileWriter.write(Level.GROUPCOLLAPSED, message)
        this.consoleOutput.print(Level.GROUPCOLLAPSED, this.formatMessageForConsole(data))
        console.groupCollapsed(...data)
    }

    groupEnd() {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const message = '(group end)'
        this.fileWriter.write(Level.GROUPEND, message)
        this.consoleOutput.print(Level.GROUPEND, message)
        console.groupEnd()
    }

    table(rows: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        if (!Array.isArray(rows) || rows.length < 1) {
            const message = '(empty table)'
            this.fileWriter.write(Level.TABLE, message)
            this.consoleOutput.print(Level.TABLE, message)
            return
        }
        const tableString = makeAsciiTable(rows)
        console.log(grayTimeString().replace(/\x1b\[[0-9;]*m/g, ''))
        console.log(tableString)
        this.fileWriter.write(Level.TABLE, 'Custom table used')
    }

    time(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        this.timers.set(label, Date.now())
        const message = `Timer "${label}" started`
        this.fileWriter.write(Level.TIME, message)
        this.consoleOutput.print(Level.TIME, message)
    }

    timeLog(label = 'default', ...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const start = this.timers.get(label)
        if (!start) {
            const message = `No such label "${label}"`
            this.fileWriter.write(Level.TIMELOG, message)
            this.consoleOutput.print(Level.TIMELOG, message)
            return
        }
        const duration = Date.now() - start
        const message = `Timer "${label}": ${duration}ms ${this.formatMessageForFile(data)}`
        this.fileWriter.write(Level.TIMELOG, message)
        this.consoleOutput.print(Level.TIMELOG, `Timer "${label}": ${duration}ms ${this.formatMessageForConsole(data)}`)
    }

    timeEnd(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const start = this.timers.get(label)
        if (!start) {
            const message = `No such label "${label}"`
            this.fileWriter.write(Level.TIMEEND, message)
            this.consoleOutput.print(Level.TIMEEND, message)
            return
        }
        const duration = Date.now() - start
        const message = `Timer "${label}" ended: ${duration}ms`
        this.fileWriter.write(Level.TIMEEND, message)
        this.consoleOutput.print(Level.TIMEEND, message)
        this.timers.delete(label)
    }

    timeStamp(label?: string) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const txt = label ? `Timestamp [${label}]` : 'Timestamp'
        this.fileWriter.write(Level.TIMESTAMP, txt)
        this.consoleOutput.print(Level.TIMESTAMP, txt)
    }

    trace(...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const stack = new Error().stack || ''
        const message = `${this.formatMessageForFile(data)}\nStack Trace:\n${stack}`
        this.fileWriter.write(Level.TRACE, message)
        this.consoleOutput.print(Level.TRACE, `${this.formatMessageForConsole(data)}\nStack Trace:\n${stack}`)
    }

    profile(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const message = `Profile "${label}" started`
        this.fileWriter.write(Level.PROFILE, message)
        this.consoleOutput.print(Level.PROFILE, message)
    }

    profileEnd(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const message = `Profile "${label}" ended`
        this.fileWriter.write(Level.PROFILEEND, message)
        this.consoleOutput.print(Level.PROFILEEND, message)
    }

    progress(label: string, current: number, total: number, barLength = 20) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        const ratio = total === 0 ? 0 : current / total
        const fillCount = Math.floor(ratio * barLength)
        const emptyCount = barLength - fillCount
        const bar = Color.GREEN + '█'.repeat(fillCount) + Color.GRAY + '─'.repeat(emptyCount) + Color.RESET
        const perc = (ratio * 100).toFixed(1) + '%'
        const message = `${label} ${bar} ${perc} (${current}/${total})`
        this.fileWriter.write(Level.PROGRESS, `${label} ${perc} (${current}/${total})`)
        this.consoleOutput.print(Level.PROGRESS, message)
    }

    progressInline(label: string, current: number, total: number, barLength = 20) {
        this.inlineActive = true
        this.pendingOptions = undefined
        const ratio = total === 0 ? 0 : current / total
        const fillCount = Math.floor(ratio * barLength)
        const emptyCount = barLength - fillCount
        const bar = Color.GREEN + '█'.repeat(fillCount) + Color.GRAY + '─'.repeat(emptyCount) + Color.RESET
        const perc = (ratio * 100).toFixed(1) + '%'
        const text = `[PROGRESS] ${label} ${bar} ${perc} (${current}/${total})`
        process.stdout.write('\r' + Color.CYAN + text + Color.RESET)
        if (current >= total) {
            console.log()
            this.inlineActive = false
        }
    }

    lineChart(values: number[], colorHexOrAnsi?: string) {
        this.finishInlineIfNeeded()
        this.pendingOptions = undefined
        if (!Array.isArray(values) || values.length === 0) {
            const message = '(empty chart)'
            this.fileWriter.write(Level.LOG, message)
            this.consoleOutput.print(Level.LOG, message)
            return
        }
        const colorSeq = colorHexOrAnsi ? generateColorSeq(colorHexOrAnsi) : Color.GREEN
        const maxVal = Math.max(...values)
        const lines = values.map((val, idx) => `${idx}: ${colorSeq}${'█'.repeat(val)}${Color.RESET} (${val})`).join('\n')
        console.log(grayTimeString().replace(/\x1b\[[0-9;]*m/g, ''))
        console.log(lines)
        this.fileWriter.write(Level.LOG, `lineChart with ${values.length} bars (max=${maxVal})`)
    }

    private formatMessageForFile(data: any[]): string {
        return data.map(x =>
            typeof x === 'object'
                ? util.inspect(x, { depth: null, colors: false })
                : String(x)
        ).join(' ');
    }

    private formatMessageForConsole(data: any[]): string {
        return data.map(x =>
            typeof x === 'object'
                ? util.inspect(x, { depth: null, colors: this.options.colorizeObjects })
                : String(x)
        ).join(' ');
    }

    private finishInlineIfNeeded() {
        if (this.inlineActive) {
            console.log();
            this.inlineActive = false;
        }
    }
}

let cachedTimestamp: CachedTimestamp = { timeString: '', expires: 0 }

export const plainTimeString = (): string => {
    const now = Date.now()
    if (now > cachedTimestamp.expires) {
        const d = new Date()
        const off = d.getTimezoneOffset()
        const sign = off < 0 ? '+' : '-'
        const hh = String(Math.abs(Math.floor(off / 60))).padStart(2, '0')
        const mm = String(Math.abs(off % 60)).padStart(2, '0')
        const ds = d.toISOString().slice(0, 10)
        const ts = d.toLocaleTimeString()
        cachedTimestamp.timeString = `[${sign}${hh}:${mm} ${ds} ${ts}] `
        cachedTimestamp.expires = now + 1000
    }
    return cachedTimestamp.timeString
}

export const grayTimeString = (): string => {
    return Color.GRAY + plainTimeString() + Color.RESET
}

export const makeAsciiTable = (rows: any[]): string => {
    if (!rows.length) return '(empty)'
    const first = rows[0]
    if (typeof first !== 'object' || Array.isArray(first) || !first) {
        return rows.map((x, i) => `${i}: ${String(x)}`).join('\n')
    }
    const keys = Object.keys(first)
    const widths = keys.map(k => Math.max(k.length, ...rows.map(r => String(r[k]).length)))
    const top = '┌' + widths.map(w => '─'.repeat(w + 2)).join('┬') + '┐'
    const middle = '├' + widths.map(w => '─'.repeat(w + 2)).join('┼') + '┤'
    const bottom = '└' + widths.map(w => '─'.repeat(w + 2)).join('┴') + '┘'
    const head = '│' + keys.map((k, i) => ' ' + k.padEnd(widths[i]) + ' ').join('│') + '│'
    const body = rows.map(r =>
        '│' + keys.map((k, i) => {
            const val = r[k] == null ? '' : String(r[k])
            return ' ' + val.padEnd(widths[i]) + ' '
        }).join('│') + '│'
    )
    return [top, head, middle, ...body, bottom].join('\n')
}

export const colorMapify = (text: string, map: string[]): string => {
    return text.split('').map((ch, i) => generateColorSeq(map[i % map.length]) + ch).join('') + Color.RESET
}

export const rainbowify = (str: string): string => {
    const palette = [Color.RED, Color.GREEN, Color.YELLOW, Color.BLUE, Color.MAGENTA, Color.CYAN]
    return str.split('').map((ch, i) => palette[i % palette.length] + ch).join('') + Color.RESET
}

export const generateColorSeq = (input: string): string => {
    if (Object.values(Color).includes(input as Color)) {
        return input
    }
    if (input.startsWith('#') && (input.length === 7 || input.length === 4)) {
        const { r, g, b } = hexToRgb(input)
        return `\x1b[38;2;${r};${g};${b}m`
    }
    return Color.WHITE
}

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const clean = hex.replace('#', '')
    const processedHex = clean.length === 3
        ? clean.split('').map(c => c + c).join('')
        : clean;
    const bigint = parseInt(processedHex, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return { r, g, b }
}