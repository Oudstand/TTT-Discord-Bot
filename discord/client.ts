// discord/client.ts
import {Client, GatewayIntentBits, Guild, Partials, VoiceState} from 'discord.js';
import {broadcast} from '../websocket-service';
import config, {lang} from '../config';
import {t} from '../i18n/translations';

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
        broadcast({type: 'voiceUpdate'});
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