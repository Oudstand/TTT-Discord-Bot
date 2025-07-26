// discord/stats-announcer.ts
import {get, set} from '../storage/meta-store';
import config from '../config';
import {getClient} from './client';
import {screenshotStats} from '../utils/stats-screenshot';
import {AttachmentBuilder, Channel, Client, Message, TextChannel} from 'discord.js';
import {StatsType} from "../types";

class StatsAnnouncer {
    private message: Message | null = null;
    private readonly type: StatsType;
    private readonly messageName: string;
    private readonly metaKey: 'statsMessageIdAll' | 'statsMessageIdSession';
    private readonly content: string;
    private readonly imagePath: string;

    constructor(type: StatsType) {
        this.type = type;
        this.messageName = type === 'all' ? 'Gesamt-Statistik' : 'Session-Statistik';
        this.metaKey = type === 'all' ? 'statsMessageIdAll' : 'statsMessageIdSession';
        this.content = type === 'all' ? `\u200B**🏆 TTT ${this.messageName}**` : `\u200B**📊 TTT ${this.messageName}**`;
        this.imagePath = `stats_${type}.png`;
    }

    /**
     * Aktualisiert die gespeicherte Nachricht mit dem neuen Embed.
     */
    public async update(): Promise<void> {
        if (!config.CHROMIUM_PATH) {
            console.error('❌ Chromium-Pfad ist nicht konfiguriert. Screenshots können nicht erstellt werden.');
            return;
        }

        if (!this.message) {
            await this.initializeStatsMessage();
            if (!this.message) return;
        }

        try {
            await screenshotStats(this.type, this.imagePath);
            const attachment: AttachmentBuilder = new AttachmentBuilder(this.imagePath);
            await this.message.edit({content: this.content, files: [attachment]});
        } catch (error: any) {
            console.error(`❌ Fehler beim Aktualisieren der ${this.messageName}-Nachricht:`, error.message);
            // Fehler 10008 = "Unknown Message", tritt auf, wenn die Nachricht gelöscht wurde.
            if (error.code === 10008) {
                this.message = null;
                set(this.metaKey, undefined);
                await this.update();
            }
        }
    }

    /**
     * Sucht eine bestehende Statistik-Nachricht oder erstellt eine neue.
     */
    private async initializeStatsMessage(): Promise<void> {
        if (this.message) return;

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

            let messageId: string | undefined = get<string>(this.metaKey);
            if (messageId) {
                try {
                    this.message = await channel.messages.fetch(messageId);
                } catch (error: any) {
                    // Fehler 10008 = "Unknown Message", d.h. sie wurde gelöscht
                    if (error.code === 10008) {
                        console.log(`🔎 ${this.messageName}-Nachricht wurde gelöscht. Erstelle eine neue.`);
                        set(this.metaKey, undefined);
                        await this.createNewMessage(channel);
                    } else {
                        console.error(`❌ Fehler beim Abrufen der ${this.messageName}-Statistik-Nachricht (ID: ${messageId})`, error.message);
                    }
                }
            } else {
                await this.createNewMessage(channel);
            }
        } catch (error) {
            console.error(`❌ Fehler bei der Initialisierung der ${this.messageName}-Statistik-Nachricht:`, error);
        }
    }

    private async createNewMessage(channel: TextChannel): Promise<void> {
        try {
            const msg = await channel.send({content: `*${this.messageName} wird initialisiert...*`});
            this.message = msg;
            set(this.metaKey, msg.id);
        } catch (error) {
            console.error(`❌ Fehler beim Erstellen einer neuen ${this.messageName}-Nachricht:`, error);
        }
    }
}

const allStatsAnnouncer: StatsAnnouncer = new StatsAnnouncer('all');
const sessionStatsAnnouncer: StatsAnnouncer = new StatsAnnouncer('session');

export async function updateStatsMessage(type: StatsType = 'all'): Promise<void> {
    if (type === 'session') {
        await sessionStatsAnnouncer.update();
    } else {
        await allStatsAnnouncer.update();
    }
}