import express from 'express';
const router = express.Router();
import { updateStats } from '../storage/statsStore.js';
import { unmuteAll } from "../utils/mute.js";
import { updateStatsMessage } from "../discord/statsAnnouncer.js";
import WebSocket from "ws";
import { getWebSocketServer } from "../websocketService.js";

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
                ws.send(JSON.stringify({ type: 'statsUpdate' }));
            }
        });
    }

    return res.status(200).send('Runde beendet');
});

export default router;