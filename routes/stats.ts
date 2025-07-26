// routes/stats.ts
import express, {Request, Response, Router} from 'express';
import WebSocket from 'ws';
import {getWebSocketServer} from '../websocket-service';
import {updateStatsMessage} from '../discord/stats-announcer';
import {
    addDamage,
    addDeaths,
    addKills,
    addLoss,
    addTeamDamage,
    addTeamKills,
    addTraitorRound,
    addWin,
    deleteAllStats,
    getSessionStats,
    getStats
} from '../storage/stats-store';
import {getNameBySteamId} from '../utils/name';
import {DamageBody, SteamIdBody, WinLossBody} from "../types";

const router: Router = express.Router();

function notifyClientsAndDiscord(): void {
    console.log('📊 Statistiken werden aktualisiert und Clients benachrichtigt...');
    void updateStatsMessage('all');
    void updateStatsMessage('session');

    const wss = getWebSocketServer();
    if (wss) {
        const message = JSON.stringify({type: 'statsUpdate'});
        wss.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
}

// Alle Statistiken abrufen
router.get('/stats', (req: Request, res: Response): void => {
    try {
        res.json(getStats());
    } catch (error) {
        res.status(500).send("Fehler beim Abrufen der Gesamtstatistiken.");
    }
});

// Session Statistiken abrufen
router.get('/stats/session', (req: Request, res: Response): void => {
    try {
        res.json(getSessionStats());
    } catch (error) {
        res.status(500).send("Fehler beim Abrufen der Session-Statistiken.");
    }
});

// Statistik-Announcer aktualisieren
router.post('/updateStats', (req: Request, res: Response): void => {
    try {
        notifyClientsAndDiscord();
        res.status(200).send("Statistiken werden aktualisiert.");
    } catch (error) {
        res.status(500).send("Fehler beim manuellen Update der Statistiken.");
    }
});

// Death-Tracking
router.post('/trackDeath', (req: Request<{}, {}, SteamIdBody>, res: Response): void => {
    const {steamId} = req.body;
    if (!steamId) {
        res.status(400).send('SteamID fehlt');
        return;
    }

    addDeaths(steamId, 1);
    console.log(`📊 Death-Stat: ${getNameBySteamId(steamId) ?? steamId}`);
    res.status(200).send('Death erfasst.');
});

// Kill-Tracking
router.post('/trackKill', (req: Request<{}, {}, SteamIdBody>, res: Response): void => {
    const {steamId} = req.body;
    if (!steamId) {
        res.status(400).send('SteamID fehlt');
        return;
    }

    addKills(steamId, 1);
    console.log(`📊 Kill-Stat: ${getNameBySteamId(steamId) ?? steamId}`);
    res.status(200).send('Kill erfasst.');
});

// Team-Kill-Tracking
router.post('/trackTeamKill', (req: Request<{}, {}, SteamIdBody>, res: Response): void => {
    const {steamId} = req.body;
    if (!steamId) {
        res.status(400).send('SteamID fehlt');
        return;
    }

    addTeamKills(steamId, 1);
    console.log(`📊 TeamKill-Stat: ${getNameBySteamId(steamId) ?? steamId}`);
    res.status(200).send('TeamKill erfasst.');
});

// Win/Loss-Tracking
router.post('/trackWin', (req: Request<{}, {}, WinLossBody>, res: Response): void => {
    const {steamId, win} = req.body;
    if (!steamId || (win !== '1' && win !== '0')) {
        res.status(400).send('SteamID fehlt oder ungültiger Win-Status');
        return;
    }

    win === '1' ? addWin(steamId) : addLoss(steamId);
    console.log(`🏁 Spieler ${getNameBySteamId(steamId) ?? steamId} hat ${win === '1' ? 'gewonnen' : 'verloren'}`);
    res.status(200).send('Win/Loss erfasst.');
});

// Traitor-Tracking
router.post('/trackTraitorRound', (req: Request<{}, {}, SteamIdBody>, res: Response): void => {
    const {steamId} = req.body;
    if (!steamId) {
        res.status(400).send('SteamID fehlt');
        return;
    }

    addTraitorRound(steamId);
    console.log(`📊 Traitor-Runde: ${getNameBySteamId(steamId) ?? steamId}`);
    res.status(200).send('Traitor-Runde erfasst.');
});

// Damage-Tracking
router.post('/trackDamage', (req: Request<{}, {}, DamageBody>, res: Response): void => {
    const {steamId, damage} = req.body;
    if (!steamId || typeof damage !== 'number') {
        res.status(400).send('SteamID oder Schaden fehlen oder haben ein falsches Format');
        return;
    }

    addDamage(steamId, damage);
    console.log(`📊 Schaden: ${getNameBySteamId(steamId) ?? steamId} - ${damage}`);
    res.status(200).send('Schaden erfasst.');
});

// Team-Damage-Tracking
router.post('/trackTeamDamage', (req: Request<{}, {}, DamageBody>, res: Response): void => {
    const {steamId, damage} = req.body;
    if (!steamId || typeof damage !== 'number') {
        res.status(400).send('SteamID oder Schaden fehlen oder haben ein falsches Format');
        return;
    }

    addTeamDamage(steamId, damage);
    console.log(`📊 Teamschaden: ${getNameBySteamId(steamId) ?? steamId} - ${damage}`);
    res.status(200).send('Teamschaden erfasst.');
});

// --- Debug ---
router.delete('/debug/stats/clear', (req: Request, res: Response): void => {
    try {
        deleteAllStats();
        res.status(200).send("Alle Statistiken wurden gelöscht.");
    } catch (error) {
        res.status(500).send("Fehler beim Löschen der Statistiken.");
    }
});

export default router;