// routes/game.ts
import express, {Request, Response, Router} from 'express';
import {updateStats} from '../storage/stats-store';
import {unmuteAll} from "../utils/mute";
import {updateStatsMessage} from "../discord/stats-announcer";
import WebSocket, {WebSocketServer} from "ws";
import {getWebSocketServer} from "../websocket-service";
import {RoundEndBody} from "../types";

const router: Router = express.Router();

router.post('/roundEnd', async (req: Request<{}, {}, RoundEndBody>, res: Response): Promise<void> => {
    try {
        void unmuteAll();
        const {players} = req.body;
        if (!Array.isArray(players)) {
            res.status(400).send('Spielerliste fehlt oder ist kein Array.');
            return;
        }

        console.log('📊 Rundenende empfangen, Statistiken werden aktualisiert...');

        updateStats(players);

        void updateStatsMessage('all');
        void updateStatsMessage('session');

        const wss: WebSocketServer | null = getWebSocketServer();
        if (wss) {
            const message: string = JSON.stringify({type: 'statsUpdate'});
            wss.clients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(message);
                }
            });
        }

        res.status(200).send('Rundenende erfolgreich verarbeitet.');
    } catch (error) {
        console.error("❌ Fehler bei der Verarbeitung des Rundenendes:", error);
        res.status(500).send("Interner Serverfehler beim Verarbeiten des Rundenendes.");
    }
});

export default router;