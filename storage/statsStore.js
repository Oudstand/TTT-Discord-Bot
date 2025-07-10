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
const stmtDeleteAll = db.prepare('DELETE FROM stats');

function getStats() {
    return stmtAll.all().map(stat => {
        const kdRatio = stat.deaths > 0 ? (stat.kills / stat.deaths).toFixed(2) : stat.kills.toFixed(2);

        const totalGames = stat.wins + stat.losses;
        const winrate = totalGames ? (stat.wins / totalGames) * 100 : 0;

        return {
            ...stat,
            kdRatio,
            winrate
        }
    });
}

function ensureStatsEntry(steamId) {
    const row = stmtHas.get(steamId);
    if (!row) {
        stmtInsert.run(steamId, getNameBySteamId(steamId));
    }
    return stmtSelect.get(steamId);
}

function addKill(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["kills"].run(steamId);
}

function addDeath(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["deaths"].run(steamId);
}

function addWin(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["wins"].run(steamId);
}

function addLoss(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["losses"].run(steamId);
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

function deleteAllStats() {
    stmtDeleteAll.run();
}

module.exports = {
    getStats,
    ensureStatsEntry,
    addKill,
    addDeath,
    addLoss,
    addWin,
    setStats,
    deleteAllStats
};

