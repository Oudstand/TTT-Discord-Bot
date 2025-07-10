// storage/bindingsStore.js
const {loadBindings, saveBindings} = require('../utils/fileStorage');

let bindings = loadBindings();

function getBindings() {
    return bindings;
}

function getBinding(steamid) {
    return bindings[steamid];
}

function getSteamIdByDiscordId(discordId) {
    const bindingEntry = Object.entries(bindings).find(([, entry]) => entry.discordId === discordId);
    return bindingEntry?.[0] || null;
}

function setBinding(steamId, data) {
    bindings[steamId] = data;
    saveBindings(bindings);
}

function deleteBinding(steamId) {
    if (bindings[steamId]) {
        delete bindings[steamId];
        saveBindings(bindings);
    }
}

function reloadBindings() {
    bindings = loadBindings();
}

module.exports = {
    getBindings,
    getBinding,
    getSteamIdByDiscordId,
    setBinding,
    deleteBinding,
    reloadBindings,
};
