// utils/playerName.js
const { getBindings } = require('../storage/bindingsStore');

function getNameByDiscordId(discordId) {
    const bindings = getBindings();
    const entry = Object.entries(bindings).find(([, value]) => value.discordId === discordId);
    return entry?.[1]?.name || null;
}

function getNameBySteamId(steamId) {
    const bindings = getBindings();
    return bindings[steamId]?.name || null;
}

module.exports = {
    getNameByDiscordId,
    getNameBySteamId,
};
