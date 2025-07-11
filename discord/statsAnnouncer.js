// discord/statsAnnouncer.js
const meta = require('../storage/metaStore');
const config = require('../config');
const {getClient} = require('./client');
const {screenshotStats} = require('../utils/statScreenshotter');
const {AttachmentBuilder} = require('discord.js');

let statsMessage = null;

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
            statsMessage = await channel.send({content: 'Statistiken werden geladen...'});
            meta.set('statsMessageId', statsMessage.id);
        }
    } catch (error) {
        console.error('[Stats] Fehler bei der Initialisierung der Statistik-Nachricht:', error);
    }
}

/**
 * Aktualisiert die gespeicherte Nachricht mit dem neuen Embed.
 */
async function updateStatsMessage() {
    if (!statsMessage) {
        await initializeStatsMessage();
        if (!statsMessage) return;
    }

    try {
        await screenshotStats();
        const attachment = new AttachmentBuilder('./stats.png');
        await statsMessage.edit({content: ' ', files: [attachment]});
    } catch (error) {
        console.error('[Stats] Fehler beim Aktualisieren der Statistik-Nachricht:', error.message);
        // Fehler 10008 = "Unknown Message", tritt auf, wenn die Nachricht gelöscht wurde.
        if (error.code === 10008) {
            console.log('[Stats] Nachricht wurde wohl gelöscht. Erstelle eine neue.');
            statsMessage = null;
        }
    }
}

module.exports = {updateStatsMessage};