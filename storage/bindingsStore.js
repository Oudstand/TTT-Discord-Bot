// storage/bindingsStore.js
import db from './database.js';

// Prepared statements
const stmtAll = db.prepare('SELECT * FROM bindings');
const stmtBySteam = db.prepare('SELECT * FROM bindings WHERE steamId = ?');
const stmtByDiscord = db.prepare('SELECT * FROM bindings WHERE discordId = ?');
const stmtUpsert = db.prepare(`INSERT OR REPLACE INTO bindings (steamId, discordId, name) VALUES (?, ?, ?)`);
const stmtDelete = db.prepare('DELETE FROM bindings WHERE steamId = ?');

// Alle Bindings abrufen
function getBindings() {
    return stmtAll.all();
}

function getBinding(steamId) {
    return stmtBySteam.get(steamId);
}

function getBindingByDiscordId(discordId) {
    return stmtByDiscord.get(discordId);
}

function getSteamIdByDiscordId(discordId) {
    return stmtByDiscord.get(discordId)?.steamId;
}

function setBinding(steamId, discordId, name) {
    stmtUpsert.run(steamId, discordId, name);
}

function deleteBinding(steamId) {
    stmtDelete.run(steamId);
}

export {
    getBindings,
    getBinding,
    getBindingByDiscordId,
    getSteamIdByDiscordId,
    setBinding,
    deleteBinding
};