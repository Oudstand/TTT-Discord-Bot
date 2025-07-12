// routes/discord.js
const express = require('express');
const router = express.Router();
const {updateStatsMessage} = require('../discord/statsAnnouncer');
const WebSocket = require('ws');
const {getGuild} = require("../discord/client");
const {getSteamIdByDiscordId} = require("../storage/bindingsStore");
const {getNameBySteamId} = require("../utils/playerName");

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

router.get('/voice', async (req, res) => {
    try {
        const guild = getGuild();
        if (!guild) return res.status(503).send('Guild nicht bereit');

        const results = Array.from(guild.members.cache.values())
            .filter(member => member.voice.channel)
            .map((member) => {
                const steamId = getSteamIdByDiscordId(member.id);
                const name = getNameBySteamId(steamId) || member.displayName;
                const voiceState = member.voice;
                return {
                    name,
                    steamId,
                    discordId: member.id,
                    muted: voiceState.selfMute || voiceState.serverMute,
                    avatarUrl: member.user.avatar ? member.user.avatarURL() : 'https://cdn.discordapp.com/embed/avatars/0.png'
                };
            });

        res.json(results);
    } catch (err) {
        console.error('Fehler beim Voice-Check:', err);
        res.status(500).send('Fehler');
    }
});

module.exports = router;
