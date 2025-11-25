import { Color } from "src/core/enums/logger.enum"

export interface LoggerOptions {
    logDirectory: string
    saveIntervalHours?: number
    colorizeObjects: boolean
}

export interface CachedTimestamp {
    timeString: string
    expires: number
}

export interface LogExtra {
    color?: Color | string
    noDate?: boolean
    rainbow?: boolean
    colorMap?: string[]
}