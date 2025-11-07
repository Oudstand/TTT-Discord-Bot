// discord/button-handlers.ts
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, Channel, Client, Guild, GuildMember, Interaction, Message, MessageFlags, TextChannel} from 'discord.js';
import {get, set} from '../storage/meta-store';
import config from '../config';
import {getClient, getGuild} from './client';

const translations = {
    en: {
        buttonLabel: 'Unmute yourself',
        guildNotFound: '❌ Error: Guild not found.',
        unmuted: '🔊 You have been unmuted.',
        unmuteError: '❌ Error unmuting.',
        notInVoice: '❌ You are not in a voice channel.'
    },
    de: {
        buttonLabel: 'Entmute dich selbst',
        guildNotFound: '❌ Fehler: Server nicht gefunden.',
        unmuted: '🔊 Du wurdest entmutet.',
        unmuteError: '❌ Fehler beim Entmuten.',
        notInVoice: '❌ Du bist nicht in einem Voice-Channel.'
    }
};

const t = (key: keyof typeof translations.en): string => {
    const lang = (config.dashboardLanguage || 'en') as 'en' | 'de';
    return translations[lang][key];
};

// Send button message once
async function createUnmuteButton(): Promise<void> {
    if (!config.commandChannelId) {
        console.error('❌ Button channel ID (COMMAND_CHANNEL_ID) is not set in configuration.');
        return;
    }

    const client: Client = getClient();
    try {
        const channel: Channel | null = await client.channels.fetch(config.commandChannelId);
        if (!channel || !(channel instanceof TextChannel)) {
            console.error(`❌ Button channel with ID ${config.commandChannelId} not found.`);
            return;
        }

        const messageId = get<string>('unmuteButtonMessageId');
        if (messageId) {
            try {
                await channel.messages.fetch(messageId);
            } catch (error: any) {
                // Error 10008 = "Unknown Message", i.e. it was deleted
                if (error.code === 10008) {
                    set('unmuteButtonMessageId', undefined);
                    await createUnmuteButton();
                }
            }
        } else {
            const button: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('self_unmute')
                    .setLabel(t('buttonLabel'))
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔊')
            );
            const unmuteMessage: Message = await channel.send({content: '', components: [button]});
            set('unmuteButtonMessageId', unmuteMessage.id);
        }
    } catch (error: any) {
        console.error('❌ Error creating button:', error.message);
    }
}

// Button handler for unmute
function setupButtonInteraction(): void {
    const client: Client = getClient();
    client.on('interactionCreate', async (interaction: Interaction) => {
        if (!interaction.isButton() || interaction.customId !== 'self_unmute') return;

        const guild: Guild | null = getGuild();
        if (!guild) {
            await interaction.reply({content: t('guildNotFound'), flags: [MessageFlags.Ephemeral]});
            return;
        }

        const member: GuildMember | undefined = guild.members.cache.get(interaction.user.id);
        if (!member) return;

        if (member.voice?.channel) {
            try {
                await member.voice.setMute(false, 'Self-unmuted via button');
                await interaction.reply({content: t('unmuted'), flags: [MessageFlags.Ephemeral]});
            } catch (error) {
                console.error('❌ Error during self-unmute:', error);
                // Only reply if not already replied to avoid crashes
                if (!interaction.replied) {
                    await interaction.reply({content: t('unmuteError'), flags: [MessageFlags.Ephemeral]});
                }
            }
        } else {
            await interaction.reply({content: t('notInVoice'), flags: [MessageFlags.Ephemeral]});
        }
    });
}

export {
    createUnmuteButton,
    setupButtonInteraction
};