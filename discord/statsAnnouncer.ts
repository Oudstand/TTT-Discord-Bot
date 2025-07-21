// discord/statsAnnouncer.js
import {get, set} from '../storage/metaStore';
import config from '../config';
import {getClient} from './client';
import {screenshotStats} from '../utils/statsScreenshot';
import {AttachmentBuilder, Channel, Client, Message, TextChannel} from 'discord.js';

let statsMessageAll: Message | null = null;
let statsMessageSession: Message | null = null;

type StatsType = 'all' | 'session';

/**
 * Sucht eine bestehende Statistik-Nachricht oder erstellt eine neue.
 */
async function initializeStatsMessage(type: StatsType = 'all'): Promise<void> {
    if (!config.statsChannelId) {
        console.error('❌ Statistik-Kanal-ID (STATS_CHANNEL_ID) ist nicht in der Konfiguration gesetzt.');
        return;
    }

    const client: Client = getClient();
    try {
        const channel: Channel | null = await client.channels.fetch(config.statsChannelId);
        if (!channel || !(channel instanceof TextChannel)) {
            console.error(`❌ Statistik-Kanal mit ID ${config.statsChannelId} nicht gefunden.`);
            return;
        }

        const metaKey = getMetaKey(type);
        let messageId: string | undefined = get<string>(metaKey);

        if (messageId) {
            try {
                let statsMessage: Message = await channel.messages.fetch(messageId);
                setStatsMessage(type, statsMessage);
            } catch (error: any) {
                // Fehler 10008 = "Unknown Message", d.h. sie wurde gelöscht
                if (error.code === 10008) {
                    set(metaKey, undefined);
                    await initializeStatsMessage();
                } else {
                    console.error('❌ Fehler beim Abrufen der Nachricht via ID:', error.message);
                }
            }
        } else {
            const msg: Message = await channel.send({content: type === 'session' ? 'Sessionstatistik wird geladen...' : 'Gesamtstatistik wird geladen...'});
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
async function updateStatsMessage(type: StatsType = 'all'): Promise<void> {
    if (!config.CHROMIUM_PATH) {
        console.error('❌ Es wurde kein Chromium-Pfad angegeben. Ohne diesen können keine Screenshots der Statistiken erstellt werden. In der README.md ist erklärt, wie der Pfad zu hinterlegen ist.');
        return;
    }

    let statsMessage: Message | null = getStatsMessage(type);
    if (!statsMessage) {
        await initializeStatsMessage(type);
        statsMessage = getStatsMessage(type);
        if (!statsMessage) return;
    }

    try {
        const imagePath: string = `stats_${type}.png`;
        await screenshotStats(type, imagePath);
        const attachment: AttachmentBuilder = new AttachmentBuilder(imagePath);
        await statsMessage.edit({content: getContent(type), files: [attachment]});
    } catch (error: any) {
        console.error('❌ Fehler beim Aktualisieren der Statistik-Nachricht:', error.message);
        // Fehler 10008 = "Unknown Message", tritt auf, wenn die Nachricht gelöscht wurde.
        if (error.code === 10008) {
            console.log('❌ Nachricht wurde wohl gelöscht. Erstelle eine neue.');
            setStatsMessage(type, null);
            set(getContent(type), undefined);
            await updateStatsMessage(type);
        }
    }
}

function getStatsMessage(type: StatsType = 'all'): Message | null {
    return type === 'session' ? statsMessageSession : statsMessageAll;
}

function setStatsMessage(type = 'all', msg: Message | null): void {
    if (type === 'session') statsMessageSession = msg;
    else statsMessageAll = msg;
}

function getContent(type: StatsType = 'all'): string {
    return type === 'all' ? '\u200B\n**🏆 TTT Gesamt-Statistik**' : '\u200B\n**📊 TTT Session-Statistik**';
}

function getMetaKey(type: StatsType): string {
    return type === 'session' ? 'statsMessageIdSession' : 'statsMessageIdAll';
}

export {updateStatsMessage};