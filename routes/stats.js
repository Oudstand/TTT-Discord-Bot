// routes/stats.js
const express = require('express');
const router = express.Router();
const {addKill, addDeath, addWin, addLoss} = require('../storage/statsStore');

// Kill-Tracking
router.post('/trackKill', (req, res) => {
    const {killer, victim} = req.body;
    if (!killer || !victim) return res.status(400).send('Fehlende Daten');

    addKill(killer);
    addDeath(victim);

    console.log(`📊 Kill-Stat: ${killer} -> ${victim}`);
    res.sendStatus(200);
});

// Win/Loss-Tracking
router.post('/trackWin', (req, res) => {
    const {steamid, win} = req.body;
    if (!steamid) return res.status(400).send('SteamID fehlt');

    win === '1' ? addWin(steamid) : addLoss(steamid);

    console.log(`🏁 Spieler ${steamid} hat ${win === '1' ? 'gewonnen' : 'verloren'}`);
    res.sendStatus(200);
});

module.exports = router;