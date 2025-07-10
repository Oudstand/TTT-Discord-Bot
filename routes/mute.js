// routes/mute.js
const express = require('express');
const router = express.Router();
const {getGuild} = require('../discord/client');
const {getBinding} = require('../storage/bindingsStore');
const {updateStatsMessage} = require('../discord/statsAnnouncer');

const mutedUsers = new Set();

// Spieler muten per SteamID
router.post('/mute', async (req, res) => {
    const {steamId} = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    const binding = getBinding(steamId);
    if (!binding) return res.status(404).send('SteamID nicht gefunden');

    return muteMember(binding.discordId, true, res);
});

// Spieler entmuten per SteamID
router.post('/unmute', async (req, res) => {
    const {steamId} = req.body;
    if (!steamId) return res.status(400).send('SteamID fehlt');

    const binding = getBinding(steamId);
    if (!binding) return res.status(404).send('SteamID nicht gefunden');

    return muteMember(binding.discordId, false, res);
});

// Spieler muten/entmuten per DiscordID
router.post('/mute/:discordId', async (req, res) => muteMember(req.params.discordId, true, res));
router.post('/unmute/:discordId', async (req, res) => muteMember(req.params.discordId, false, res));

// Alle entmuten
router.post('/unmuteAll', async (req, res) => {
    const guild = getGuild();
    if (!guild) return res.status(503).send('Guild nicht bereit');

    console.log('🔊 Alle Spieler entmutet');
    try {
        for (const state of guild.voiceStates.cache.values()) {
            const member = guild.members.cache.get(state.id);
            if (member?.voice?.channel) {
                try {
                    await member.voice.setMute(false);
                } catch (e) {
                    console.error(`Fehler beim Entmuten von ${member.user.tag}:`, e.message);
                }
            }
        }
        mutedUsers.clear();
        res.sendStatus(200);
    } catch (err) {
        console.error('Fehler beim Entmuten aller:', err);
        res.status(500).send('Fehler');
    }

    updateStatsMessage();
});

// Hilfsfunktion
async function muteMember(discordId, mute, res) {
    try {
        const guild = getGuild();
        if (!guild) return res.status(503).send('Guild nicht bereit');

        const member = guild.members.cache.get(discordId);
        if (member?.voice?.channel) {
            await member.voice.setMute(mute);
            mute ? mutedUsers.add(discordId) : mutedUsers.delete(discordId);
            console.log(`${mute ? '🔇 Gemutet' : '🔊 Entmutet'}: ${member.user.tag}`);
        }
        res.sendStatus(200);
    } catch (err) {
        console.error('Fehler beim Muten/Entmuten:', err);
        res.status(500).send('Fehler');
    }
}

module.exports = router;
