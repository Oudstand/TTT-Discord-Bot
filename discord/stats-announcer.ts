// discord/stats-announcer.ts
import {get, set} from '../storage/meta-store';
import config from '../config';
import {getClient} from './client';
import {screenshotStats} from '../utils/stats-screenshot';
import {AttachmentBuilder, Channel, Client, Message, TextChannel} from 'discord.js';
import {ScreenshotPath, StatsType} from "../types";
import {t, Language} from '../i18n/translations';

class StatsAnnouncer {
    private message: Message | null = null;
    private readonly type: StatsType;
    private readonly messageName: string;
    private readonly metaKey: 'statsMessageIdAll' | 'statsMessageIdSession';
    private readonly content: string;
    private readonly imagePath: ScreenshotPath;

    constructor(type: StatsType) {
        this.type = type;
        const lang = (config.dashboardLanguage || 'en') as Language;
        this.messageName = type === 'all' ? t('discord.stats.total', lang) : t('discord.stats.session', lang);
        this.metaKey = type === 'all' ? 'statsMessageIdAll' : 'statsMessageIdSession';
        this.content = type === 'all' ? `\u200B**🏆 TTT ${this.messageName}**` : `\u200B**📊 TTT ${this.messageName}**`;
        this.imagePath = `stats_${type}.png`;
    }

    /**
     * Updates the stored message with the new embed.
     */
    public async update(): Promise<void> {
        if (!this.message) {
            await this.initializeStatsMessage();
            if (!this.message) return;
        }

        try {
            await screenshotStats(this.type, this.imagePath);
            const attachment: AttachmentBuilder = new AttachmentBuilder(this.imagePath);
            await this.message.edit({content: this.content, files: [attachment]});
        } catch (error: any) {
            console.error(`❌ Error updating ${this.messageName} message:`, error.message);
            // Error 10008 = "Unknown Message", occurs when the message was deleted
            if (error.code === 10008) {
                this.message = null;
                set(this.metaKey, undefined);
                await this.update();
            }
        }
    }

    /**
     * Finds an existing statistics message or creates a new one.
     */
    private async initializeStatsMessage(): Promise<void> {
        if (this.message) return;

        if (!config.statsChannelId) {
            console.error('❌ Stats channel ID (STATS_CHANNEL_ID) is not set in configuration.');
            return;
        }

        const client: Client = getClient();
        try {
            const channel: Channel | null = await client.channels.fetch(config.statsChannelId);
            if (!channel || !(channel instanceof TextChannel)) {
                console.error(`❌ Stats channel with ID ${config.statsChannelId} not found.`);
                return;
            }

            let messageId: string | undefined = get<string>(this.metaKey);
            if (messageId) {
                try {
                    this.message = await channel.messages.fetch(messageId);
                } catch (error: any) {
                    // Error 10008 = "Unknown Message", i.e. it was deleted
                    if (error.code === 10008) {
                        console.log(`🔎 ${this.messageName} message was deleted. Creating new one.`);
                        set(this.metaKey, undefined);
                        await this.createNewMessage(channel);
                    } else {
                        console.error(`❌ Error fetching ${this.messageName} stats message (ID: ${messageId})`, error.message);
                    }
                }
            } else {
                await this.createNewMessage(channel);
            }
        } catch (error) {
            console.error(`❌ Error initializing ${this.messageName} stats message:`, error);
        }
    }

    private async createNewMessage(channel: TextChannel): Promise<void> {
        try {
            const msg = await channel.send({content: `*${this.messageName} is being initialized...*`});
            this.message = msg;
            set(this.metaKey, msg.id);
        } catch (error) {
            console.error(`❌ Error creating new ${this.messageName} message:`, error);
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