// websocket-service.ts
import {WebSocketServer} from "ws";

let wss: WebSocketServer | null = null;

function setWebSocketServer(server: WebSocketServer): void {
    wss = server;
}

function getWebSocketServer(): WebSocketServer | null {
    return wss;
}

export {setWebSocketServer, getWebSocketServer};