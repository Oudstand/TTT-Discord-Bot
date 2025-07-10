// discord/buttonHandlers.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const { client, getGuild } = require('./client');

// Button-Nachricht einmalig senden
async function createUnmuteButton() {
    try {
        const channel = await client.channels.fetch(config.commandChannelId);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('self_unmute')
                .setLabel('Selbst entmuten')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔊')
        );

        await channel.send({ content: '', components: [row] });
    } catch (e) {
        console.error('❌ Fehler beim Erstellen des Buttons:', e.message);
    }
}

// Button-Handler für Entmute
function setupButtonInteraction() {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'self_unmute') {
            const guild = getGuild();
            const member = guild.members.cache.get(interaction.user.id);
            if (!member) return;

            if (member.voice?.channel) {
                try {
                    await member.voice.setMute(false, 'Selbst entmutet via Button');
                    await interaction.reply({ content: '🔊 Du wurdest entmutet.', ephemeral: true });
                } catch (err) {
                    console.error('❌ Fehler beim Selbstentmuten:', err);
                    await interaction.reply({ content: '❌ Fehler beim Entmuten.', ephemeral: true });
                }
            }
        }
    });
}

module.exports = {
    createUnmuteButton,
    setupButtonInteraction,
};