// utils/name.js
const {getBinding, getBindingByDiscordId} = require('../storage/bindingsStore');

function getNameByDiscordId(discordId) {
    return getBindingByDiscordId(discordId)?.name;
}

function getNameBySteamId(steamId) {
    return getBinding(steamId)?.name;
}

module.exports = {
    getNameByDiscordId,
    getNameBySteamId,
};
