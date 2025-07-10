// discord/statsAnnouncer.js
const {EmbedBuilder} = require('discord.js');
const {getStats} = require('../storage/statsStore');
const meta = require('../storage/metaStore');
const config = require('../config');
const {getClient, getGuild} = require('./client');
const {getBinding} = require('../storage/bindingsStore');

let statsMessage = null;
const embedTitle = '📊 TTT Runden-Statistiken';

/**
 * Sucht eine bestehende Statistik-Nachricht oder erstellt eine neue.
 */
async function initializeStatsMessage() {
    const client = getClient();
    try {
        const channel = await client.channels.fetch(config.statsChannelId);
        if (!channel) {
            console.error(`[Stats] Statistik-Kanal mit ID ${config.statsChannelId} nicht gefunden.`);
            return;
        }

        const messageId = meta.get('statsMessageId');
        if (messageId) {
            try {
                statsMessage = await channel.messages.fetch(messageId);
            } catch (error) {
                // Fehler 10008 = "Unknown Message", d.h. sie wurde gelöscht
                if (error.code === 10008) {
                    meta.set('statsMessageId', undefined);
                    await initializeStatsMessage();
                } else {
                    console.error('[Stats] Fehler beim Abrufen der Nachricht via ID:', error.message);
                }
            }
        } else {
            const newEmbed = new EmbedBuilder().setTitle(embedTitle).setDescription('Statistiken werden geladen...');
            statsMessage = await channel.send({embeds: [newEmbed]});
            meta.set('statsMessageId', statsMessage.id);
        }
    } catch (error) {
        console.error('[Stats] Fehler bei der Initialisierung der Statistik-Nachricht:', error);
    }
}

/**
 * Erstellt das Discord-Embed mit den aktuellen Statistiken.
 */
function buildStatsEmbed() {
    const stats = getStats();

    const placeEmojis = ['🥇', '🥈', '🥉'];
    let description = "";

    stats
        .sort((a, b) => {
            if (b.kdRatio !== a.kdRatio) return b.kdRatio - a.kdRatio;
            return b.kills - a.kills;
        })
        .forEach((p, i) => {
            const rank = placeEmojis[i] || `#${i + 1}`;
            description += [
                `${rank} **${p.name || "Unbekannt"}**`,
                '━━━━━━━━━━━━━━━━━━━━━━',
                `📊 **K/D:** ${p.kdRatio}`,
                `💀 **Tode:** ${p.deaths}`,
                `🔪 **Kills:** ${p.kills}`,
                `🏆 **Siege:** ${p.wins}`,
                `❌ **Niederlagen:** ${p.losses}`,
                `📈 **Winrate:** ${p.winrate.toFixed(1)}%`,
                '━━━━━━━━━━━━━━━━━━━━━━'
            ].join('\n') + '\n\n';
        });

    const embed = new EmbedBuilder()
        .setTitle('📊 TTT Runden-Statistiken')
        .setColor('#FFD700')
        .setDescription(description || '*Bisher wurden keine Statistiken erfasst.*')
        .setFooter({text: 'Wird automatisch aktualisiert'})
        .setTimestamp();

    if (stats.length) {
        const guild = getGuild();
        const winner = getBinding(stats[0].steamId);
        const member = guild.members.cache.get(winner.discordId);
        if (member?.user.avatar) {
            embed.setThumbnail(member.user.avatarURL());
        }
    }

    return embed;
}

/**
 * Aktualisiert die gespeicherte Nachricht mit dem neuen Embed.
 */
async function updateStatsMessage() {
    if (!statsMessage) {
        // Versuche neu zu initialisieren, falls die Nachricht verloren ging
        await initializeStatsMessage();
        if (!statsMessage) return; // Wenn immer noch nicht erfolgreich, abbrechen.
    }

    try {
        const newEmbed = buildStatsEmbed();
        await statsMessage.edit({embeds: [newEmbed]});
    } catch (error) {
        console.error('[Stats] Fehler beim Aktualisieren der Statistik-Nachricht:', error.message);
        // Fehler 10008 = "Unknown Message", tritt auf, wenn die Nachricht gelöscht wurde.
        if (error.code === 10008) {
            console.log('[Stats] Nachricht wurde wohl gelöscht. Erstelle eine neue.');
            statsMessage = null; // Setze zurück, damit sie neu initialisiert wird.
        }
    }
}

module.exports = {updateStatsMessage};