export enum Level {
    LOG = 'LOG',
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    ASSERT = 'ASSERT',
    CLEAR = 'CLEAR',
    COUNT = 'COUNT',
    DIR = 'DIR',
    DIRXML = 'DIRXML',
    GROUP = 'GROUP',
    GROUPCOLLAPSED = 'GROUPCOLLAPSED',
    GROUPEND = 'GROUPEND',
    TABLE = 'TABLE',
    TIME = 'TIME',
    TIMELOG = 'TIMELOG',
    TIMEEND = 'TIMEEND',
    TIMESTAMP = 'TIMESTAMP',
    TRACE = 'TRACE',
    PROFILE = 'PROFILE',
    PROFILEEND = 'PROFILEEND',
    PROGRESS = 'PROGRESS'
}

export enum Color {
    BLACK = '\x1b[30m',
    RED = '\x1b[31m',
    GREEN = '\x1b[32m',
    YELLOW = '\x1b[33m',
    BLUE = '\x1b[34m',
    MAGENTA = '\x1b[35m',
    CYAN = '\x1b[36m',
    WHITE = '\x1b[37m',
    GRAY = '\x1b[90m',
    RESET = '\x1b[0m'
}