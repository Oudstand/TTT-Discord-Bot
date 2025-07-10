// routes/stats.js
const express = require('express');
const router = express.Router();
const {incrementStat} = require('../storage/statsStore');

const STAT_KILLS = 'kills';
const STAT_DEATHS = 'deaths';
const STAT_WINS = 'wins';
const STAT_LOSSES = 'losses';

// Kill-Tracking
router.post('/trackKill', (req, res) => {
    const {killer, victim} = req.body;
    if (!killer || !victim) return res.status(400).send('Fehlende Daten');

    incrementStat(killer, STAT_KILLS);
    incrementStat(victim, STAT_DEATHS);

    console.log(`📊 Kill-Stat: ${killer} -> ${victim}`);
    res.sendStatus(200);
});

// Win/Loss-Tracking
router.post('/trackWin', (req, res) => {
    const {steamid, win} = req.body;
    if (!steamid) return res.status(400).send('SteamID fehlt');

    const field = win === '1' ? STAT_WINS : STAT_LOSSES;
    incrementStat(steamid, field);

    console.log(`🏁 Spieler ${steamid} hat ${win === '1' ? 'gewonnen' : 'verloren'}`);
    res.sendStatus(200);
});

module.exports = router;