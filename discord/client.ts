// discord/client.ts
import {Client, GatewayIntentBits, Guild, Partials, VoiceState} from 'discord.js';
import {getWebSocketServer} from '../websocket-service';
import WebSocket, {WebSocketServer} from 'ws';
import config from '../config';
import {t, Language} from '../i18n/translations';

const lang = () => (config.language || 'en') as Language;

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
        const wss: WebSocketServer | null = getWebSocketServer();
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
        console.error(`❌ ${t('config.guildIdNotSet', lang())}`);
        return;
    }

    try {
        guild = await client.guilds.fetch(config.guildId);
    } catch (error: any) {
        console.error(`❌ ${t('discord.errorLoadingGuild', lang())}`, error.message);
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