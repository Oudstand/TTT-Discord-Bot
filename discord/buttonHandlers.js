// discord/buttonHandlers.js
const {ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const meta = require('../storage/metaStore');
const config = require('../config');
const {getClient, getGuild} = require('./client');

// Button-Nachricht einmalig senden
async function createUnmuteButton() {
    const client = getClient();
    try {
        const channel = await client.channels.fetch(config.commandChannelId);
        if (!channel) {
            console.error(`❌ Button-Kanal mit ID ${config.commandChannelId} nicht gefunden.`);
            return;
        }

        const messageId = meta.get('unmuteButtonMessageId');
        if (messageId) {
            try {
                await channel.messages.fetch(messageId);
            } catch (error) {
                // Fehler 10008 = "Unknown Message", d.h. sie wurde gelöscht
                if (error.code === 1008) {
                    meta.set('unmuteButtonMessageId', undefined);
                    await createUnmuteButton();
                }
            }
        } else {
            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('self_unmute')
                    .setLabel('Selbst entmuten')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔊')
            );
            const unmuteMessage = await channel.send({content: '', components: [button]});
            meta.set('unmuteButtonMessageId', unmuteMessage.id);
        }
    } catch (e) {
        console.error('❌ Fehler beim Erstellen des Buttons:', e.message);
    }

    setupButtonInteraction();
}

// Button-Handler für Entmute
function setupButtonInteraction() {
    const client = getClient();
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'self_unmute') {
            const guild = getGuild();
            const member = guild.members.cache.get(interaction.user.id);
            if (!member) return;

            if (member.voice?.channel) {
                try {
                    await member.voice.setMute(false, 'Selbst entmutet via Button');
                    await interaction.reply({content: '🔊 Du wurdest entmutet.', ephemeral: true});
                } catch (err) {
                    console.error('❌ Fehler beim Selbstentmuten:', err);
                    await interaction.reply({content: '❌ Fehler beim Entmuten.', ephemeral: true});
                }
            }
        }
    });
}

module.exports = {
    createUnmuteButton
};