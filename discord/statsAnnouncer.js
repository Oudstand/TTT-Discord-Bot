// discord/statsAnnouncer.js
const meta = require('../storage/metaStore');
const config = require('../config');
const {getClient} = require('./client');
const {screenshotStats} = require('../utils/statsScreenshot');
const {AttachmentBuilder} = require('discord.js');

let statsMessageAll = null;
let statsMessageSession = null;

/**
 * Sucht eine bestehende Statistik-Nachricht oder erstellt eine neue.
 */
async function initializeStatsMessage(type = 'all') {
    const client = getClient();
    try {
        const channel = await client.channels.fetch(config.statsChannelId);
        if (!channel) {
            console.error(`❌ Statistik-Kanal mit ID ${config.statsChannelId} nicht gefunden.`);
            return;
        }

        const metaKey = type === 'session' ? 'statsMessageIdSession' : 'statsMessageIdAll';
        let messageId = meta.get(metaKey);

        if (messageId) {
            try {
                let statsMessage = await channel.messages.fetch(messageId);
                setStatsMessage(type, statsMessage);
            } catch (error) {
                // Fehler 10008 = "Unknown Message", d.h. sie wurde gelöscht
                if (error.code === 10008) {
                    meta.set(metaKey, undefined);
                    await initializeStatsMessage();
                } else {
                    console.error('❌ Fehler beim Abrufen der Nachricht via ID:', error.message);
                }
            }
        } else {
            const msg = await channel.send({content: type === 'session' ? 'Sessionstatistik wird geladen...' : 'Gesamtstatistik wird geladen...'});
            meta.set(metaKey, msg.id);
            if (type === 'session') statsMessageSession = msg;
            else statsMessageAll = msg;
        }
    } catch (error) {
        console.error('❌ Fehler bei der Initialisierung der Statistik-Nachricht:', error);
    }
}

/**
 * Aktualisiert die gespeicherte Nachricht mit dem neuen Embed.
 */
async function updateStatsMessage(type = 'all') {
    let statsMessage = getStatsMessage(type);
    if (!statsMessage) {
        await initializeStatsMessage(type);
        statsMessage = getStatsMessage(type);
        if (!statsMessage) return;
    }

    try {
        await screenshotStats(type, `stats_${type}.png`);
        const attachment = new AttachmentBuilder(`stats_${type}.png`);
        await statsMessage.edit({content: getContent(type), files: [attachment]});
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Statistik-Nachricht:', error.message);
        // Fehler 10008 = "Unknown Message", tritt auf, wenn die Nachricht gelöscht wurde.
        if (error.code === 10008) {
            console.log('❌ Nachricht wurde wohl gelöscht. Erstelle eine neue.');
            statsMessage = null;
            await updateStatsMessage(type);
        }
    }
}

function getStatsMessage(type = 'all') {
    return type === 'session' ? statsMessageSession : statsMessageAll;
}

function setStatsMessage(type = 'all', msg) {
    if (type === 'session') statsMessageSession = msg;
    else statsMessageAll = msg;
}

function getContent(type = 'all') {
    return type === 'all' ? '\u200B\n**🏆 TTT Gesamt-Statistik**' : '\u200B\n**📊 TTT Session-Statistik**';
}

module.exports = {updateStatsMessage};