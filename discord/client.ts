// discord/client.js
import {Client, GatewayIntentBits, Guild, Partials, VoiceState} from 'discord.js';
import {getWebSocketServer} from '../websocketService';
import WebSocket, {WebSocketServer} from 'ws';
import config from '../config';

const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

client.on('voiceStateUpdate', (oldState: VoiceState, newState: VoiceState): void => {
    if (oldState.channelId !== newState.channelId || oldState.selfMute !== newState.selfMute || oldState.serverMute !== newState.serverMute) {
        const wss: WebSocketServer | undefined = getWebSocketServer();
        if (wss) {
            wss.clients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({type: 'voiceUpdate'}));
                }
            });
        }
    }
});

function getClient(): Client {
    return client;
}

let guild: Guild | null = null;

async function loadGuild() {
    if (!config.guildId) {
        console.error('❌ Server-ID (GUILD_ID) ist nicht in der Konfiguration gesetzt.');
        return;
    }

    try {
        guild = await client.guilds.fetch(config.guildId);
    } catch (error: any) {
        console.error('❌ Fehler beim Laden der Guild:', error.message);
    }
}

function getGuild(): Guild | null {
    return guild;
}

export {
    client,
    getClient,
    loadGuild,
    getGuild
};