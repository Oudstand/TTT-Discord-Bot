// storage/statsStore.js
const db = require('./database');
const {getNameBySteamId} = require('../utils/playerName');

// Prepared statements
const stmtAll = db.prepare('SELECT steamId, name, kills, deaths, wins, losses FROM stats');
const stmtHas = db.prepare('SELECT steamId FROM stats WHERE steamId = ?');
const stmtInsert = db.prepare('INSERT INTO stats (steamId, name, kills, deaths, wins, losses) VALUES (?, ?, 0, 0, 0, 0)');
const stmtSelect = db.prepare('SELECT name, kills, deaths, wins, losses FROM stats WHERE steamId = ?');
const stmtIncrement = {
    kills: db.prepare('UPDATE stats SET kills = kills + 1 WHERE steamId = ?'),
    deaths: db.prepare('UPDATE stats SET deaths = deaths + 1 WHERE steamId = ?'),
    wins: db.prepare('UPDATE stats SET wins = wins + 1 WHERE steamId = ?'),
    losses: db.prepare('UPDATE stats SET losses = losses + 1 WHERE steamId = ?'),
};
const stmtUpsert = db.prepare(`INSERT INTO stats (steamId, name, kills, deaths, wins, losses)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(steamId) DO UPDATE SET
    name=excluded.name,
    kills=excluded.kills,
    deaths=excluded.deaths,
    wins=excluded.wins,
    losses=excluded.losses`);

function getStats() {
    const rows = stmtAll.all();
    return Object.fromEntries(rows.map(r => [r.steamId, {
        name: r.name,
        kills: r.kills,
        deaths: r.deaths,
        wins: r.wins,
        losses: r.losses
    }]));
}

function ensureStatsEntry(steamId) {
    const row = stmtHas.get(steamId);
    if (!row) {
        stmtInsert.run(steamId, getNameBySteamId(steamId));
    }
    return stmtSelect.get(steamId);
}

function incrementStat(steamId, field) {
    if (!stmtIncrement[field]) return;
    ensureStatsEntry(steamId);
    stmtIncrement[field].run(steamId);
}

function setStats(steamId, newData) {
    stmtUpsert.run(
        steamId,
        newData.name,
        newData.kills,
        newData.deaths,
        newData.wins,
        newData.losses
    );
}

function reloadStats() {
    // Datenbank speichert bereits permanent
}

module.exports = {
    getStats,
    ensureStatsEntry,
    incrementStat,
    setStats,
    reloadStats
};

