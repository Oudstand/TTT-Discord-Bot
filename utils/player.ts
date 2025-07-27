// utils/player.ts
import {getBinding, getBindingByDiscordId} from '../storage/bindings-store';
import config from "../config";
import {Binding, SteamPlayer} from "../types";
import {Guild, GuildMember} from "discord.js";
import {getGuild} from "../discord/client";

const avatarMap: Map<string, string> = new Map<string, string>();
const fallBackAvatarUrl: string = 'https://cdn.discordapp.com/embed/avatars/0.png';
const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${config.steamApiKey}&steamids=`;


async function getAvatarUrl(steamId?: string): Promise<string> {
    if (!steamId) {
        return fallBackAvatarUrl;
    }

    if (avatarMap.has(steamId)) {
        return avatarMap.get(steamId)!;
    }

    let url: string | null = null;
    if (config.steamApiKey) {
        url = await getAvatarUrlBySteamApi(steamId);
    }
    if (!url) {
        url = await getAvatarUrlByDiscord(steamId);
    }
    if (!url) {
        url = fallBackAvatarUrl;
    }

    avatarMap.set(steamId, url);
    return url;
}

async function getAvatarUrlBySteamApi(steamId: string): Promise<string | null> {
    try {
        const response = await fetch(steamApiUrl + steamId, {});
        if (!response.ok) {
            console.error(`❌ Fehler bei der Steam API-Anfrage für Steam-ID "${steamId}":`, response.statusText);
            return null;
        }

        const data = await response.json();
        const players: SteamPlayer[] = data.response?.players ?? [];
        const player: SteamPlayer | undefined = players.filter(player => player.steamid === steamId).pop();

        return player ? player.avatarfull : null;
    } catch (error) {
        console.error(`❌ Fehler bei der Steam API-Anfrage für Steam-ID "${steamId}":`, error);
        return null;
    }
}

async function getAvatarUrlByDiscord(steamId: string): Promise<string | null> {
    try {
        const binding: Binding | null = getBinding(steamId);
        if (!binding) {
            console.error(`❌ Binding konnte für die Steam-ID "${steamId}" nicht gefunden werden.`);
            return null;
        }

        const guild: Guild | null = getGuild();
        if (!guild || !guild.available) {
            console.error(`❌ Guild wurde nicht gefunden oder ist nicht verfügbar`);
            return null;
        }

        const member: GuildMember = await guild.members.fetch(binding.discordId);
        return member.user.avatarURL();
    } catch (error) {
        console.error('❌ Fehler beim Anfragen der Avatar-URL:', error);
        return null;
    }
}

function getNameByDiscordId(discordId: string): string | null {
    return getBindingByDiscordId(discordId)?.name ?? null;
}

function getNameBySteamId(steamId: string): string | null {
    return getBinding(steamId)?.name ?? null;
}

export {
    fallBackAvatarUrl,
    getAvatarUrl,
    getNameByDiscordId,
    getNameBySteamId,
};