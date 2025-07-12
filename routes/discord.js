// routes/discord.js
const express = require('express');
const router = express.Router();
const {getGuild} = require("../discord/client");
const {getSteamIdByDiscordId, getBinding} = require("../storage/bindingsStore");
const {getNameBySteamId, getNameByDiscordId} = require("../utils/name");

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
                    console.error(`❌ Fehler beim Entmuten von ${getNameByDiscordId(member.id)}:`, e.message);
                }
            }
        }
        mutedUsers.clear();
        res.sendStatus(200);
    } catch (err) {
        console.error('❌ Fehler beim Entmuten aller:', err);
        res.status(500).send('Fehler');
    }
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
            console.log(`${mute ? '🔇 Gemutet' : '🔊 Entmutet'}: ${getNameByDiscordId(discordId)}`);
        }
        res.sendStatus(200);
    } catch (err) {
        console.error('❌ Fehler beim Muten/Entmuten:', err);
        res.status(500).send('Fehler');
    }
}

module.exports = router;
