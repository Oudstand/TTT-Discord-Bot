// routes/stats.js
const express = require('express');
const router = express.Router();
const {getStats, addKill, addDeath, addWin, addLoss, deleteAllStats} = require('../storage/statsStore');
const {getNameBySteamId} = require('../utils/playerName');

// Alle Statistiken abrufen
router.get('/stats', (req, res) => {
    res.json(getStats());
});

// Death-Tracking
router.post('/trackDeath', (req, res) => {
    const {steamId} = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    addDeath(steamId);
    console.log(`📊 Death-Stat: ${getNameBySteamId(steamId)}`);
    res.sendStatus(200);
});

// Kill-Tracking
router.post('/trackKill', (req, res) => {
    const {killer, victim} = req.body;
    if (!killer || !victim) return res.status(400).send('Fehlende Daten');

    addKill(killer);

    console.log(`📊 Kill-Stat: ${getNameBySteamId(killer)} -> ${getNameBySteamId(victim)}`);
    res.sendStatus(200);
});

// Win/Loss-Tracking
router.post('/trackWin', (req, res) => {
    const {steamId, win} = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    win === '1' ? addWin(steamId) : addLoss(steamId);

    console.log(`🏁 Spieler ${steamId} hat ${win === '1' ? 'gewonnen' : 'verloren'}`);
    res.sendStatus(200);
});

// --- Debug ---
router.delete('/debug/stats/clear', (req,res) => {
    deleteAllStats();
    res.sendStatus(200);
});

module.exports = router;