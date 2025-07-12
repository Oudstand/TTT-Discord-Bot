// routes/discord.js
const express = require('express');
const router = express.Router();
const {updateStatsMessage} = require('../discord/statsAnnouncer');
const WebSocket = require('ws');

// Statistik-Announcer aktualisieren
router.post('/updateStats', (req, res) => {
    console.log('Updating stats');
    updateStatsMessage();

    req.app.get('wss').clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({type: 'statsUpdate'}));
        }
    })

    res.sendStatus(200);
});

module.exports = router;
