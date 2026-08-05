// websocket-service.ts
import WebSocket, {WebSocketServer} from "ws";

let wss: WebSocketServer | null = null;

function setWebSocketServer(server: WebSocketServer): void {
    wss = server;
}

function broadcast(payload: object): void {
    if (!wss) return;

    const message = JSON.stringify(payload);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

export {setWebSocketServer, broadcast};
