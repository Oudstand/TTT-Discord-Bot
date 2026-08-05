// config.ts
import type {Language} from './i18n/translations';

// Only accept supported language codes — on Linux the OS often sets LANGUAGE
// to values like "de_DE:de", which would break translation lookups.
const envLanguage = [process.env.BOT_LANGUAGE, process.env.LANGUAGE]
    .find((value): value is Language => value === 'de' || value === 'en');

function parsePort(value: string | undefined): number {
    if (value === undefined || value === '') return 3000;

    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be an integer between 1 and 65535.');
    }

    return port;
}

const config = {
    steamApiKey: process.env.STEAM_API_KEY,
    token: process.env.DISCORD_TOKEN,
    guildId: process.env.GUILD_ID,
    commandChannelId: process.env.COMMAND_CHANNEL_ID,
    statsChannelId: process.env.STATS_CHANNEL_ID,
    port: parsePort(process.env.PORT),
    language: envLanguage ?? 'en'
};

export const lang = (): Language => config.language;

export default config;
