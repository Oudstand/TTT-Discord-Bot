// utils/name.js
import { getBinding, getBindingByDiscordId } from '../storage/bindingsStore.js';

function getNameByDiscordId(discordId) {
    return getBindingByDiscordId(discordId)?.name;
}

function getNameBySteamId(steamId) {
    return getBinding(steamId)?.name;
}

export {
    getNameByDiscordId,
    getNameBySteamId,
};