// routes/stats.js
import express from 'express';
const router = express.Router();
import WebSocket from 'ws';
import { getWebSocketServer } from '../websocketService.js';
import { updateStatsMessage } from '../discord/statsAnnouncer.js';
import {
    getStats,
    getSessionStats,
    addKills,
    addTeamKills,
    addDeaths,
    addWin,
    addLoss,
    deleteAllStats,
    addTraitorRound,
    addDamage,
    addTeamDamage
} from '../storage/statsStore.js';
import { getNameBySteamId } from '../utils/name.js';

// Alle Statistiken abrufen
router.get('/stats', (req, res) => {
    res.json(getStats());
});

// Session Statistiken abrufen
router.get('/stats/session', (req, res) => {
    res.json(getSessionStats());
});

// Statistik-Announcer aktualisieren
router.post('/updateStats', (req, res) => {
    console.log('📊 Statistiken aktualisieren');
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

    res.sendStatus(200);
});

// Death-Tracking
router.post('/trackDeath', (req, res) => {
    const { steamId } = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    addDeaths(steamId, 1);
    console.log(`📊 Death-Stat: ${getNameBySteamId(steamId)}`);
    res.sendStatus(200);
});

// Kill-Tracking
router.post('/trackKill', (req, res) => {
    const { steamId } = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    addKills(steamId, 1);

    console.log(`📊 Kill-Stat: ${getNameBySteamId(steamId)}`);
    res.sendStatus(200);
});

// Team-Kill-Tracking
router.post('/trackTeamKill', (req, res) => {
    const { steamId } = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    addTeamKills(steamId, 1);

    console.log(`📊 TeamKill-Stat: ${getNameBySteamId(steamId)}`);
    res.sendStatus(200);
});

// Win/Loss-Tracking
router.post('/trackWin', (req, res) => {
    const { steamId, win } = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    win === '1' ? addWin(steamId) : addLoss(steamId);

    console.log(`🏁 Spieler ${getNameBySteamId(steamId)} hat ${win === '1' ? 'gewonnen' : 'verloren'}`);
    res.sendStatus(200);
});

// Traitor-Tracking
router.post('/trackTraitorRound', (req, res) => {
    const { steamId } = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    addTraitorRound(steamId);

    console.log(`📊 Traitor-Runde: ${getNameBySteamId(steamId)}`);
    res.sendStatus(200);
});

// Damage-Tracking
router.post('/trackDamage', (req, res) => {
    const { steamId, damage } = req.body;
    if (!steamId || !damage) return res.status(400).send('Daten fehlen');

    addDamage(steamId, damage);

    console.log(`📊 Schaden: ${getNameBySteamId(steamId)} - ${damage}`);
    res.sendStatus(200);
});

// Team-Damage-Tracking
router.post('/trackTeamDamage', (req, res) => {
    const { steamId, damage } = req.body;
    if (!steamId || !damage) return res.status(400).send('Daten fehlen');

    addTeamDamage(steamId, damage);

    console.log(`📊 Teamschaden: ${getNameBySteamId(steamId)} - ${damage}`);
    res.sendStatus(200);
});

// --- Debug ---
router.delete('/debug/stats/clear', (req, res) => {
    deleteAllStats();
    res.sendStatus(200);
});

export default router;