const express = require('express');
const router = express.Router();
const {updateStats} = require('../storage/statsStore');
const {unmuteAll} = require("../utils/mute");
const {updateStatsMessage} = require("../discord/statsAnnouncer");
const WebSocket = require("ws");
const {getWebSocketServer} = require("../websocketService");

router.post('/roundEnd', async (req, res) => {
    void unmuteAll();

    const players = req.body.players;
    if (!Array.isArray(players)) {
        return res.status(400).send('Spielerliste fehlt');
    }

    console.log('📊 Statistiken aktualisieren');
    updateStats(players);
    void updateStatsMessage('all');
    void updateStatsMessage('session');

    const wss = getWebSocketServer();
    if (wss) {
        wss.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: 'statsUpdate'}));
            }
        });
    }

    return res.status(200).send('Runde beendet');
});

module.exports = router;