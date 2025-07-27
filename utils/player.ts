// utils/player.ts
import {getBinding, getBindingByDiscordId, getBindings} from '../storage/bindings-store';
import config from "../config";
import {Binding, SteamPlayer} from "../types";
import {Collection, Guild, GuildMember} from "discord.js";
import {getGuild} from "../discord/client";

const steamAvatarMap: Map<string, string> = new Map<string, string>();
const discordAvatarMap: Map<string, string> = new Map<string, string>();
const fallBackAvatarUrl: string = 'https://cdn.discordapp.com/embed/avatars/0.png';
const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${config.steamApiKey}&steamids=`;

async function cacheAvatars(): Promise<void> {
    const bindings: Binding[] = getBindings();
    const steamIds: string[] = bindings.map((binding: Binding) => binding.steamId);
    const discordIds: string[] = bindings.map((binding: Binding) => binding.discordId);

    // cache steam avatars
    try {
        const response = await fetch(steamApiUrl + steamIds, {});
        if (response.ok) {
            const data = await response.json();
            const players: SteamPlayer[] = data.response?.players ?? [];
            players.forEach((player: SteamPlayer) => steamAvatarMap.set(player.steamid, player.avatarfull ?? fallBackAvatarUrl));
        }
    } catch (error) {
        console.error('❌ Fehler beim Cachen der Steam-Avatare', error);
    }

    // cache discord avatars
    try {
        const guild: Guild | null = getGuild();
        if (guild && guild.available) {
            const members: Collection<string, GuildMember> = await guild.members.fetch({user: discordIds});
            members.values().forEach((member: GuildMember) => {
                const binding: Binding | undefined = bindings.find((_binding: Binding) => _binding.discordId === member.id);
                if (binding) {
                    discordAvatarMap.set(binding.steamId, member.user.avatarURL() ?? fallBackAvatarUrl);
                }
            });
        } else {
            console.error(`❌ Guild wurde nicht gefunden oder ist nicht verfügbar`);
        }
    } catch (error) {
        console.error('❌ Fehler beim Cachen der Discord-Avatare', error);
    }
}

async function getSteamAvatarUrl(steamId?: string): Promise<string> {
    if (!steamId || !config.steamApiKey) {
        return fallBackAvatarUrl;
    }

    if (steamAvatarMap.has(steamId)) {
        return steamAvatarMap.get(steamId)!;
    }

    let url = fallBackAvatarUrl;
    try {
        const response = await fetch(steamApiUrl + steamId, {});
        if (response.ok) {
            const data = await response.json();
            const players: SteamPlayer[] = data.response?.players ?? [];
            const player: SteamPlayer | undefined = players.filter(player => player.steamid === steamId).pop();

            if (player?.avatarfull) {
                url = player.avatarfull;
            }
        } else {
            console.error(`❌ Fehler bei der Steam API-Anfrage für Steam-ID "${steamId}":`, response.statusText);
        }
    } catch (error) {
        console.error(`❌ Fehler bei der Steam API-Anfrage für Steam-ID "${steamId}":`, error);
    }

    steamAvatarMap.set(steamId, url);
    return url;
}

async function getDiscordAvatarUrl(steamId: string): Promise<string> {
    if (!steamId) {
        return fallBackAvatarUrl;
    }

    if (discordAvatarMap.has(steamId)) {
        return discordAvatarMap.get(steamId)!;
    }

    let url = fallBackAvatarUrl;
    try {
        const binding: Binding | null = getBinding(steamId);
        if (binding) {
            const guild: Guild | null = getGuild();
            if (guild && guild.available) {
                const member: GuildMember = await guild.members.fetch(binding.discordId);
                if (member.user.avatarURL()) {
                    url = member.user.avatarURL()!;
                }
            } else {
                console.error(`❌ Guild wurde nicht gefunden oder ist nicht verfügbar`);
            }
        } else {
            console.error(`❌ Binding konnte für die Steam-ID "${steamId}" nicht gefunden werden.`);
        }
    } catch (error) {
        console.error('❌ Fehler beim Anfragen der Avatar-URL:', error);
    }

    discordAvatarMap.set(steamId, url);
    return url;
}

function getNameByDiscordId(discordId: string): string | null {
    return getBindingByDiscordId(discordId)?.name ?? null;
}

function getNameBySteamId(steamId: string): string | null {
    return getBinding(steamId)?.name ?? null;
}

export {
    fallBackAvatarUrl,
    cacheAvatars,
    getSteamAvatarUrl,
    getDiscordAvatarUrl,
    getNameByDiscordId,
    getNameBySteamId,
};