// utils/logger.ts
import { getWebSocketServer } from '../websocket-service';

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

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

    // Only fetch socket server if available, avoid crashing during init
    try {
        const wss = getWebSocketServer();
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(JSON.stringify({ type: 'log', level: type, message }));
                }
            });
        }
    } catch (e) {
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
