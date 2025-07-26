// utils/name.ts
import {getBinding, getBindingByDiscordId} from '../storage/bindings-store';

function getNameByDiscordId(discordId: string): string | null {
    return getBindingByDiscordId(discordId)?.name ?? null;
}

function getNameBySteamId(steamId: string): string | null {
    return getBinding(steamId)?.name ?? null;
}

export {
    getNameByDiscordId,
    getNameBySteamId,
};