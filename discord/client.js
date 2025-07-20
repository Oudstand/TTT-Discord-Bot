// discord/client.js
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { getWebSocketServer } from '../websocketService.js';
import WebSocket from 'ws';
import config from '../config.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.channelId !== newState.channelId || oldState.selfMute !== newState.selfMute || oldState.serverMute !== newState.serverMute) {
        const wss = getWebSocketServer();
        if (wss) {
            wss.clients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'voiceUpdate' }));
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

export {
    client,
    getClient,
    loadGuild,
    getGuild
};