// storage/statsStore.js
const db = require('./database');
const {getNameBySteamId} = require('../utils/name');

function createStatStore(tableName) {
    // 1. Dynamisch vorbereitete Statements für die gegebene Tabelle
    const statements = {
        all: db.prepare(`SELECT *
                         FROM ${tableName}`),
        has: db.prepare(`SELECT steamId
                         FROM ${tableName}
                         WHERE steamId = ?`),
        insert: db.prepare(`INSERT INTO ${tableName} (steamId, name, kills, teamKills, deaths, wins, losses, damage, teamDamage, traitorRounds)
                            VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0)`),
        insertOrUpdate: db.prepare(`
            INSERT INTO ${tableName}
            (steamId, name, kills, teamKills, deaths, wins, losses,
             damage, teamDamage, traitorRounds)
            VALUES (@steamId, @name, @kills, @teamKills, @deaths, @wins, @losses,
                    @damage, @teamDamage, @traitorRounds)
            ON CONFLICT(steamId) DO UPDATE SET kills         = kills + excluded.kills,
                                               teamKills     = teamKills + excluded.teamKills,
                                               deaths        = deaths + excluded.deaths,
                                               wins          = wins + excluded.wins,
                                               losses        = losses + excluded.losses,
                                               damage        = damage + excluded.damage,
                                               teamDamage    = teamDamage + excluded.teamDamage,
                                               traitorRounds = traitorRounds + excluded.traitorRounds;
        `),
        addKills: db.prepare(`UPDATE ${tableName}
                              SET kills = kills + ?
                              WHERE steamId = ?`),
        addTeamKills: db.prepare(`UPDATE ${tableName}
                                  SET teamKills = teamKills + ?
                                  WHERE steamId = ?`),
        addDeaths: db.prepare(`UPDATE ${tableName}
                               SET deaths = deaths + ?
                               WHERE steamId = ?`),
        addWins: db.prepare(`UPDATE ${tableName}
                             SET wins = wins + ?
                             WHERE steamId = ?`),
        addLosses: db.prepare(`UPDATE ${tableName}
                               SET losses = losses + ?
                               WHERE steamId = ?`),
        addTraitorRounds: db.prepare(`UPDATE ${tableName}
                                      SET traitorRounds = traitorRounds + ?
                                      WHERE steamId = ?`),
        addDamage: db.prepare(`UPDATE ${tableName}
                               SET damage = damage + ?
                               WHERE steamId = ?`),
        addTeamDamage: db.prepare(`UPDATE ${tableName}
                                   SET teamDamage = teamDamage + ?
                                   WHERE steamId = ?`),
        deleteAll: db.prepare(`DELETE
                               FROM ${tableName}`)
    };

    const insertOrUpdateTransaction = db.transaction(players => {
        players.forEach((player) => {
            statements.insertOrUpdate.run({
                steamId: player.steamId,
                name: getNameBySteamId(player.steamId),
                kills: parseInt(player.kills) || 0,
                teamKills: parseInt(player.teamKills) || 0,
                deaths: parseInt(player.deaths) || 0,
                wins: player.win ? 1 : 0,
                losses: player.win ? 0 : 1,
                damage: parseFloat(player.damage) || 0,
                teamDamage: parseFloat(player.teamDamage) || 0,
                traitorRounds: player.wasTraitor ? 1 : 0
            });
        })
    });

    // 2. Ein Objekt mit sauberen Aktions-Funktionen zurückgeben
    return {
        getAll: () => statements.all.all(),
        has: (steamId) => statements.has.get(steamId),
        insert: (steamId) => statements.insert.run(steamId, getNameBySteamId(steamId)),
        insertOrUpdate: (players) => insertOrUpdateTransaction(players),
        deleteAll: () => statements.deleteAll.run(),

        // Funktionen, die einen Wert hinzufügen
        addKills: (steamId, value) => statements.addKills.run(parseInt(value) || 0, steamId),
        addTeamKills: (steamId, value) => statements.addTeamKills.run(parseInt(value) || 0, steamId),
        addDeaths: (steamId, value) => statements.addDeaths.run(parseInt(value) || 0, steamId),
        addWins: (steamId, value) => statements.addWins.run(parseInt(value) || 0, steamId),
        addLosses: (steamId, value) => statements.addLosses.run(parseInt(value) || 0, steamId),
        addTraitorRounds: (steamId, value) => statements.addTraitorRounds.run(parseInt(value) || 0, steamId),
        addDamage: (steamId, value) => statements.addDamage.run(parseFloat(value) || 0, steamId),
        addTeamDamage: (steamId, value) => statements.addTeamDamage.run(parseFloat(value) || 0, steamId),
    };
}

const totalStatsStore = createStatStore('stats');
const sessionStatsStore = createStatStore('stats_session');

function getStats() {
    return totalStatsStore.getAll().map(mapStats);
}

function getSessionStats() {
    return sessionStatsStore.getAll().map(mapStats);
}

function mapStats(stat) {
    const kdRatio = stat.deaths > 0 ? parseFloat((stat.kills / stat.deaths).toFixed(2)) : stat.kills;
    const totalGames = stat.wins + stat.losses;
    const winrate = totalGames ? parseFloat(((stat.wins / totalGames) * 100).toFixed(2)) : 0;
    return {...stat, kdRatio, winrate};
}

function updateStats(players) {
    totalStatsStore.insertOrUpdate(players);
    sessionStatsStore.insertOrUpdate(players);
}

function ensureStatsEntry(steamId) {
    if (!totalStatsStore.has(steamId)) {
        totalStatsStore.insert(steamId);
    }

    if (!sessionStatsStore.has(steamId)) {
        sessionStatsStore.insert(steamId);
    }
}

function addKills(steamId, kills) {
    ensureStatsEntry(steamId);
    totalStatsStore.addKills(steamId, kills);
    sessionStatsStore.addKills(steamId, kills);
}

function addTeamKills(steamId, teamKills) {
    ensureStatsEntry(steamId);
    totalStatsStore.addTeamKills(steamId, teamKills);
    sessionStatsStore.addTeamKills(steamId, teamKills);
}

function addDeaths(steamId, deaths) {
    ensureStatsEntry(steamId);
    totalStatsStore.addDeaths(steamId, deaths);
    sessionStatsStore.addDeaths(steamId, deaths);
}

function addWin(steamId) {
    ensureStatsEntry(steamId);
    totalStatsStore.addWins(steamId, 1);
    sessionStatsStore.addWins(steamId, 1);
}

function addLoss(steamId) {
    ensureStatsEntry(steamId);
    totalStatsStore.addLosses(steamId, 1);
    sessionStatsStore.addLosses(steamId, 1);
}

function addTraitorRound(steamId) {
    ensureStatsEntry(steamId);
    totalStatsStore.addTraitorRounds(steamId, 1);
    sessionStatsStore.addTraitorRounds(steamId, 1);
}

function addDamage(steamId, damage) {
    ensureStatsEntry(steamId);
    totalStatsStore.addDamage(steamId, damage);
    sessionStatsStore.addDamage(steamId, damage);
}

function addTeamDamage(steamId, damage) {
    ensureStatsEntry(steamId);
    totalStatsStore.addTeamDamage(steamId, damage);
    sessionStatsStore.addTeamDamage(steamId, damage);
}

function deleteAllStats() {
    totalStatsStore.deleteAll();
}

function deleteAllSessionStats() {
    sessionStatsStore.deleteAll();
}

function resetSessionStats() {
    deleteAllSessionStats();
}

module.exports = {
    getStats,
    getSessionStats,
    updateStats,
    addKills,
    addTeamKills,
    addDeaths,
    addLoss,
    addWin,
    addTraitorRound,
    addDamage,
    addTeamDamage,
    deleteAllStats,
    deleteAllSessionStats,
    resetSessionStats
};

