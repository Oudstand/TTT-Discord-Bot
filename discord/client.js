// discord/client.js
const {Client, GatewayIntentBits, Partials} = require('discord.js');
const config = require('../config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

function getClient() {
    return client;
}

let guild = null;

async function loadGuild() {
    try {
        guild = await client.guilds.fetch(config.guildId);
    } catch (e) {
        console.error('❌ Fehler beim Laden der Guild:', e.message);
    }
}

function getGuild() {
    return guild;
}

module.exports = {
    client,
    getClient,
    loadGuild,
    getGuild
};
