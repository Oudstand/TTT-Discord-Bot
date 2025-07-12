// storage/statsStore.js
const db = require('./database');
const {getNameBySteamId} = require('../utils/name');

// Prepared statements stats
const stmtAll = db.prepare('SELECT * FROM stats');
const stmtHas = db.prepare('SELECT steamId FROM stats WHERE steamId = ?');
const stmtInsert = db.prepare('INSERT INTO stats (steamId, name, kills, deaths, wins, losses) VALUES (?, ?, 0, 0, 0, 0)');
const stmtIncrement = {
    kills: db.prepare('UPDATE stats SET kills = kills + 1 WHERE steamId = ?'),
    teamKills: db.prepare('UPDATE stats SET teamKills = teamKills + 1 WHERE steamId = ?'),
    deaths: db.prepare('UPDATE stats SET deaths = deaths + 1 WHERE steamId = ?'),
    wins: db.prepare('UPDATE stats SET wins = wins + 1 WHERE steamId = ?'),
    losses: db.prepare('UPDATE stats SET losses = losses + 1 WHERE steamId = ?'),
    traitorRounds: db.prepare('UPDATE stats SET traitorRounds = traitorRounds + 1 WHERE steamId = ?')
};
const stmtAddDamage = db.prepare('UPDATE stats SET damage = damage + ? WHERE steamId = ?');
const stmtAddTeamDamage = db.prepare('UPDATE stats SET teamDamage = teamDamage + ? WHERE steamId = ?')
const stmtDeleteAll = db.prepare('DELETE FROM stats');

// Prepared statements session stats
const stmtAllSession = db.prepare('SELECT * FROM stats_session');
const stmtHasSession = db.prepare('SELECT steamId FROM stats_session WHERE steamId = ?');
const stmtInsertSession = db.prepare('INSERT INTO stats_session (steamId, name, kills, deaths, wins, losses) VALUES (?, ?, 0, 0, 0, 0)');
const stmtIncrementSession = {
    kills: db.prepare('UPDATE stats_session SET kills = kills + 1 WHERE steamId = ?'),
    teamKills: db.prepare('UPDATE stats_session SET teamKills = teamKills + 1 WHERE steamId = ?'),
    deaths: db.prepare('UPDATE stats_session SET deaths = deaths + 1 WHERE steamId = ?'),
    wins: db.prepare('UPDATE stats_session SET wins = wins + 1 WHERE steamId = ?'),
    losses: db.prepare('UPDATE stats_session SET losses = losses + 1 WHERE steamId = ?'),
    traitorRounds: db.prepare('UPDATE stats_session SET traitorRounds = traitorRounds + 1 WHERE steamId = ?')
};
const stmtAddDamageSession = db.prepare('UPDATE stats_session SET damage = damage + ? WHERE steamId = ?');
const stmtAddTeamDamageSession = db.prepare('UPDATE stats_session SET teamDamage = teamDamage + ? WHERE steamId = ?')
const stmtDeleteAllSession = db.prepare('DELETE FROM stats_session');

function getStats() {
    return stmtAll.all().map(mapStats);
}

function getSessionStats(stats) {
    return stmtAllSession.all().map(mapStats);
}

function mapStats(stat) {
    const kdRatio = stat.deaths > 0 ? (stat.kills / stat.deaths).toFixed(2) : stat.kills.toFixed(2);

    const totalGames = stat.wins + stat.losses;
    const winrate = totalGames ? (stat.wins / totalGames) * 100 : 0;

    return {
        ...stat,
        kdRatio,
        winrate
    };
}

function ensureStatsEntry(steamId) {
    let row = stmtHas.get(steamId);
    if (!row) {
        stmtInsert.run(steamId, getNameBySteamId(steamId));
    }

    row = stmtHasSession.get(steamId);
    if (!row) {
        stmtInsertSession.run(steamId, getNameBySteamId(steamId));
    }
}

function addKill(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["kills"].run(steamId);
    stmtIncrementSession["kills"].run(steamId);
}

function addTeamKill(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["teamKills"].run(steamId);
    stmtIncrementSession["teamKills"].run(steamId);
}

function addDeath(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["deaths"].run(steamId);
    stmtIncrementSession["deaths"].run(steamId);
}

function addWin(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["wins"].run(steamId);
    stmtIncrementSession["wins"].run(steamId);
}

function addLoss(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["losses"].run(steamId);
    stmtIncrementSession["losses"].run(steamId);
}

function addTraitorRound(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["traitorRounds"].run(steamId);
    stmtIncrementSession["traitorRounds"].run(steamId);
}

function addDamage(steamId, damage) {
    ensureStatsEntry(steamId);
    stmtAddDamage.run(damage, steamId);
    stmtAddDamageSession.run(damage, steamId);
}

function addTeamDamage(steamId, damage) {
    ensureStatsEntry(steamId);
    stmtAddTeamDamage.run(damage, steamId);
    stmtAddTeamDamageSession.run(damage, steamId);
}

function deleteAllStats() {
    stmtDeleteAll.run();
}

function deleteAllSessionStats() {
    stmtDeleteAllSession.run();
}

function resetSessionStats() {
    deleteAllSessionStats();
}

module.exports = {
    getStats,
    getSessionStats,
    addKill,
    addTeamKill,
    addDeath,
    addLoss,
    addWin,
    addTraitorRound,
    addDamage,
    addTeamDamage,
    deleteAllStats,
    deleteAllSessionStats,
    resetSessionStats
};

