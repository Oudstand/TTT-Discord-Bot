// routes/voice.js
const express = require('express');
const router = express.Router();
const {getGuild} = require('../discord/client');
const {getNameBySteamId} = require('../utils/playerName');
const {getSteamIdByDiscordId} = require('../storage/bindingsStore');

// Voice-Mitglieder abrufen
router.get('/voice', async (req, res) => {
    try {
        const guild = getGuild();
        if (!guild) return res.status(503).send('Guild nicht bereit');

        const results = guild.voiceStates.cache
            .map((state) => {
                const member = guild.members.cache.get(state.id);
                if (!member) return null;

                const steamId = getSteamIdByDiscordId(member.id);
                const name = getNameBySteamId(steamId) || member.displayName;

                return {
                    name,
                    steamId,
                    discordId: member.id,
                    muted: state.serverMute,
                    avatarUrl: member.user.avatar
                        ? member.user.avatarURL()
                        : 'https://cdn.discordapp.com/embed/avatars/0.png',
                };
            })
            .filter(Boolean);

        res.json(results);
    } catch (err) {
        console.error('Fehler beim Voice-Check:', err);
        res.status(500).send('Fehler');
    }
});

module.exports = router;
