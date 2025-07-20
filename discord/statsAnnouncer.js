// discord/statsAnnouncer.js
import { get, set } from '../storage/metaStore.js';
import config from '../config.js';
import { getClient } from './client.js';
import { screenshotStats } from '../utils/statsScreenshot.js';
import { AttachmentBuilder } from 'discord.js';

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
        let messageId = get(metaKey);

        if (messageId) {
            try {
                let statsMessage = await channel.messages.fetch(messageId);
                setStatsMessage(type, statsMessage);
            } catch (error) {
                // Fehler 10008 = "Unknown Message", d.h. sie wurde gelöscht
                if (error.code === 10008) {
                    set(metaKey, undefined);
                    await initializeStatsMessage();
                } else {
                    console.error('❌ Fehler beim Abrufen der Nachricht via ID:', error.message);
                }
            }
        } else {
            const msg = await channel.send({ content: type === 'session' ? 'Sessionstatistik wird geladen...' : 'Gesamtstatistik wird geladen...' });
            set(metaKey, msg.id);
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
    if(!config.CHROMIUM_PATH) {
        console.error('❌ Es wurde kein Chromium-Pfad angegeben. Ohne diesen können keine Screenshots der Statistiken erstellt werden. In der README.md ist erklärt, wie der Pfad zu hinterlegen ist.');
        return;
    }

    let statsMessage = getStatsMessage(type);
    if (!statsMessage) {
        await initializeStatsMessage(type);
        statsMessage = getStatsMessage(type);
        if (!statsMessage) return;
    }

    try {
        await screenshotStats(type, `stats_${type}.png`);
        const attachment = new AttachmentBuilder(`stats_${type}.png`);
        await statsMessage.edit({ content: getContent(type), files: [attachment] });
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

export { updateStatsMessage };