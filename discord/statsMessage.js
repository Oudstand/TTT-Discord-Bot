const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const stats = require('../storage/statsStore').getStats();
const { guildId, statsChannelId } = require('../config');
const statsFile = './statsMessage.json';
const {getGuild} = require('/client.js');


let channel = null;
async function updateStatsMessage(client) {

    if (!channel) {
        channel = await getGuild().channels.fetch(statsChannelId);
    }

    let messageId = null;

    // Vorhandene Nachricht-ID laden
    try {
        messageId = JSON.parse(fs.readFileSync(statsFile)).messageId;
    } catch {}

    const content = formatStatsAsEmbed(stats);

    if (messageId) {
        try {
            const msg = await channel.messages.fetch(messageId);
            await msg.edit(content);
            return;
        } catch {
            console.warn('⚠️ Nachricht nicht gefunden – wird neu erstellt');
        }
    }

    const newMsg = await channel.send(content);
    fs.writeFileSync(statsFile, JSON.stringify({ messageId: newMsg.id }));
}

function formatStatsAsEmbed(stats) {
    const entries = Object.entries(stats);
    if (!entries.length) {
        return { content: 'Noch keine Statistikdaten vorhanden.' };
    }

    const embed = new EmbedBuilder()
        .setTitle('🎯 TTT Statistiken')
        .setColor(0x2ecc71)
        .setDescription('Kills, Tode, Siege und Niederlagen aller Spieler');

    entries.forEach(([steamId, s]) => {
        embed.addFields({
            name: `${steamId}`,
            value: `💀 Kills: ${s.kills} | ☠️ Tode: ${s.deaths} | 🏆 Siege: ${s.wins} | ❌ Niederlagen: ${s.losses}`,
            inline: false
        });
    });

    return { embeds: [embed] };
}

module.exports = { updateStatsMessage };
