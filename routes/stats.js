// routes/stats.js
const express = require('express');
const router = express.Router();
const {getStats, addKill, addTeamKill, addDeath, addWin, addLoss, deleteAllStats, addTraitorRound, addDamage, addTeamDamage} = require('../storage/statsStore');
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
    const {steamId} = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    addKill(steamId);

    console.log(`📊 Kill-Stat: ${getNameBySteamId(steamId)}`);
    res.sendStatus(200);
});

// Team-Kill-Tracking
router.post('/trackTeamKill', (req, res) => {
    const {steamId} = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    addTeamKill(steamId);

    console.log(`📊 TeamKill-Stat: ${getNameBySteamId(steamId)}`);
    res.sendStatus(200);
});

// Win/Loss-Tracking
router.post('/trackWin', (req, res) => {
    const {steamId, win} = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    win === '1' ? addWin(steamId) : addLoss(steamId);

    console.log(`🏁 Spieler ${getNameBySteamId(steamId)} hat ${win === '1' ? 'gewonnen' : 'verloren'}`);
    res.sendStatus(200);
});

// Traitor-Tracking
router.post('/trackTraitorRound', (req, res) => {
    const {steamId} = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    addTraitorRound(steamId);

    console.log(`📊 Traitor-Runde: ${getNameBySteamId(steamId)}`);
    res.sendStatus(200);
});

// Damage-Tracking
router.post('/trackDamage', (req, res) => {
    const {steamId, damage} = req.body;
    if (!steamId || !damage) return res.status(400).send('Daten fehlen');

    addDamage(steamId, damage);

    console.log(`📊 Schaden: ${getNameBySteamId(steamId)} - ${damage}`);
    res.sendStatus(200);
});

// Team-Damage-Tracking
router.post('/trackTeamDamage', (req, res) => {
    const {steamId, damage} = req.body;
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

module.exports = router;