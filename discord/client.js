// discord/client.js
const {Client, GatewayIntentBits, Partials} = require('discord.js');
const WebSocket = require('ws');
const config = require('../config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});
let wssInstance = null;

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.channelId !== newState.channelId || oldState.selfMute !== newState.selfMute || oldState.serverMute !== newState.serverMute) {
        if (wssInstance) {
            wssInstance.clients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({type: 'voiceUpdate'}));
                }
            });
        }
    }
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

function setWebSocketServer(wss) {
    wssInstance = wss;
}

function getWebSocketServer() {
    return wssInstance;
}

module.exports = {
    client,
    getClient,
    loadGuild,
    getGuild,
    setWebSocketServer,
    getWebSocketServer
};
