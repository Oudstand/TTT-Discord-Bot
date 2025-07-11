// routes/discord.js
const express = require('express');
const router = express.Router();
const {updateStatsMessage} = require('../discord/statsAnnouncer');

// Statistik-Announcer aktualisieren
router.post('/updateStats', (req, res) => {
    console.log('Updating stats');
    updateStatsMessage();
    res.sendStatus(200);
});

module.exports = router;
