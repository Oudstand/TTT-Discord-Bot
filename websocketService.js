// websocketService.js
let wss = null;

function setWebSocketServer(server) {
    wss = server;
}

function getWebSocketServer() {
    return wss;
}

export { setWebSocketServer, getWebSocketServer };