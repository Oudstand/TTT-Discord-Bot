// storage/bindingsStore.js
const db = require('./database');

// Prepared statements
const stmtAll = db.prepare('SELECT steamId, discordId, name FROM bindings');
const stmtBySteam = db.prepare('SELECT discordId, name FROM bindings WHERE steamId = ?');
const stmtByDiscord = db.prepare('SELECT steamId FROM bindings WHERE discordId = ?');
const stmtUpsert = db.prepare(`INSERT OR REPLACE INTO bindings (steamId, discordId, name)
    VALUES (?, ?, ?)`);
const stmtDelete = db.prepare('DELETE FROM bindings WHERE steamId = ?');

// Alle Bindings abrufen
function getBindings() {
    const rows = stmtAll.all();
    return Object.fromEntries(rows.map(r => [r.steamId, { discordId: r.discordId, name: r.name }]));
}
function getBinding(steamId) {
    const row = stmtBySteam.get(steamId);
    return row ? { discordId: row.discordId, name: row.name } : null;
}

function getSteamIdByDiscordId(discordId) {
    const row = stmtByDiscord.get(discordId);
    return row?.steamId || null;
}

function setBinding(steamId, data) {
    stmtUpsert.run(steamId, data.discordId, data.name);
}

function deleteBinding(steamId) {
    stmtDelete.run(steamId);
}

function reloadBindings() {
    // Datenbank speichert bereits permanent
}

module.exports = {
    getBindings,
    getBinding,
    getSteamIdByDiscordId,
    setBinding,
    deleteBinding,
    reloadBindings,
};
