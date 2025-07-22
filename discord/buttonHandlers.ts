// discord/buttonHandlers.ts
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, Channel, Client, Guild, GuildMember, Interaction, Message, TextChannel} from 'discord.js';
import {get, set} from '../storage/metaStore';
import config from '../config';
import {getClient, getGuild} from './client';

// Button-Nachricht einmalig senden
async function createUnmuteButton(): Promise<void> {
    if (!config.commandChannelId) {
        console.error('❌ Button-Kanal-ID (COMMAND_CHANNEL_ID) ist nicht in der Konfiguration gesetzt.');
        return;
    }

    const client: Client = getClient();
    try {
        const channel: Channel | null = await client.channels.fetch(config.commandChannelId);
        if (!channel || !(channel instanceof TextChannel)) {
            console.error(`❌ Button-Kanal mit ID ${config.commandChannelId} nicht gefunden.`);
            return;
        }

        const messageId = get<string>('unmuteButtonMessageId');
        if (messageId) {
            try {
                await channel.messages.fetch(messageId);
            } catch (error: any) {
                // Fehler 10008 = "Unknown Message", d.h. sie wurde gelöscht
                if (error.code === 10008) {
                    set('unmuteButtonMessageId', undefined);
                    await createUnmuteButton();
                }
            }
        } else {
            const button: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('self_unmute')
                    .setLabel('Selbst entmuten')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔊')
            );
            const unmuteMessage: Message = await channel.send({content: '', components: [button]});
            set('unmuteButtonMessageId', unmuteMessage.id);
        }
    } catch (error: any) {
        console.error('❌ Fehler beim Erstellen des Buttons:', error.message);
    }

    setupButtonInteraction();
}

// Button-Handler für Entmute
function setupButtonInteraction(): void {
    const client: Client = getClient();
    client.on('interactionCreate', async (interaction: Interaction) => {
        if (!interaction.isButton() || interaction.customId !== 'self_unmute') return;

        const guild: Guild | null = getGuild();
        const member: GuildMember | undefined = guild?.members.cache.get(interaction.user.id);
        if (!member) return;

        if (member.voice?.channel) {
            try {
                await member.voice.setMute(false, 'Selbst entmutet via Button');
                await interaction.reply({content: '🔊 Du wurdest entmutet.', ephemeral: true});
            } catch (error) {
                console.error('❌ Fehler beim Selbstentmuten:', error);
                await interaction.reply({content: '❌ Fehler beim Entmuten.', ephemeral: true});
            }
        }
    });
}

export {
    createUnmuteButton
};