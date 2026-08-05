// utils/logger.ts
import { appendFileSync } from 'fs';
import { join } from 'path';
import { broadcast } from '../websocket-service';

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// The Windows exe is built with --windows-hide-console, so fatal errors would
// otherwise disappear without a trace — keep them in a file next to the executable.
const errorLogPath = join(process.cwd(), 'error.log');

export function logErrorToFile(message: string): void {
    try {
        appendFileSync(errorLogPath, `[${new Date().toISOString()}] ${message}\n`);
    } catch {
        // Nowhere left to report to
    }
}

process.on('uncaughtException', error => {
    originalConsoleError(error);
    logErrorToFile(`Uncaught exception: ${error?.stack ?? error}`);
    process.exit(1);
});

process.on('unhandledRejection', reason => {
    console.error('Unhandled rejection:', reason);
    logErrorToFile(`Unhandled rejection: ${(reason as Error)?.stack ?? reason}`);
});

function safelyStringify(arg: any): string {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.message;
    try {
        return JSON.stringify(arg);
    } catch {
        return String(arg);
    }
}

const logHistory: { level: 'info' | 'error', message: string }[] = [];

export function getLogHistory() {
    return logHistory;
}

function broadcastLog(type: 'info' | 'error', args: any[]) {
    const message = args.map(safelyStringify).join(' ');
    logHistory.push({ level: type, message });
    if (logHistory.length > 200) logHistory.shift();

    try {
        broadcast({ type: 'log', level: type, message });
    } catch {
        // Ignoriert, falls WebSocket noch nicht bereit ist
    }
}

console.log = function (...args) {
    originalConsoleLog.apply(console, args);
    broadcastLog('info', args);
};

console.error = function (...args) {
    originalConsoleError.apply(console, args);
    broadcastLog('error', args);
};
