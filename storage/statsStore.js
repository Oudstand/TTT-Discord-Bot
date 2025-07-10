// storage/statsStore.js
const {loadStats, saveStats} = require('../utils/fileStorage');
const {getNameBySteamId} = require('../utils/playerName');

let stats = loadStats();

function getStats() {
    return stats;
}

function ensureStatsEntry(steamId) {
    if (!stats[steamId]) {
        stats[steamId] = {
            name: getNameBySteamId(steamId),
            kills: 0,
            deaths: 0,
            wins: 0,
            losses: 0
        };
    }
    return stats[steamId];
}

function incrementStat(steamId, field) {
    ensureStatsEntry(steamId);
    if (stats[steamId][field] !== undefined) {
        stats[steamId][field]++;
        saveStats(stats);
    }
}

function setStats(steamId, newData) {
    stats[steamId] = newData;
    saveStats(stats);
}

function reloadStats() {
    stats = loadStats();
}

module.exports = {
    getStats,
    ensureStatsEntry,
    incrementStat,
    setStats,
    reloadStats
};
