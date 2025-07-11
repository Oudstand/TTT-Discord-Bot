// storage/statsStore.js
const db = require('./database');
const {getNameBySteamId} = require('../utils/playerName');

// Prepared statements
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
}

function addKill(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["kills"].run(steamId);
}

function addTeamKill(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["teamKills"].run(steamId);
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

function addTraitorRound(steamId) {
    ensureStatsEntry(steamId);
    stmtIncrement["traitorRounds"].run(steamId);
}

function addDamage(steamId, damage) {
    ensureStatsEntry(steamId);
    stmtAddDamage.run(damage, steamId);
}

function addTeamDamage(steamId, damage) {
    ensureStatsEntry(steamId);
    stmtAddTeamDamage.run(damage, steamId);
}

function deleteAllStats() {
    stmtDeleteAll.run();
}

module.exports = {
    getStats,
    addKill,
    addTeamKill,
    addDeath,
    addLoss,
    addWin,
    addTraitorRound,
    addDamage,
    addTeamDamage,
    deleteAllStats
};

