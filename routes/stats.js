// routes/stats.js
const express = require('express');
const router = express.Router();
const {getStats, addKill, addDeath, addWin, addLoss, deleteAllStats} = require('../storage/statsStore');

// Alle Statistiken abrufen
router.get('/stats', (req, res) => {
    let stats = getStats().map(stat => {
        const kdRatio = stat.deaths > 0 ? (stat.kills / stat.deaths).toFixed(2) : stat.kills.toFixed(2);

        const totalGames = stat.wins + stat.losses;
        const winrate = totalGames ? (stat.wins / totalGames) * 100 : 0;

        return {
            ...stat,
            kdRatio,
            winrate
        }
    });
    res.json(stats);
});

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

// --- Debug ---
router.delete('/debug/stats/clear', (req,res) => {
    deleteAllStats();
    res.sendStatus(200);
});

module.exports = router;