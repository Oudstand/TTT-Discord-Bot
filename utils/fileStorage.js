// utils/fileStorage.js
const fs = require('fs');
const path = require('path');

const bindingsFile = path.join(__dirname, '../bindings.json');
const statsFile = path.join(__dirname, '../stats.json');

// BINDINGS
function loadBindings() {
    try {
        return JSON.parse(fs.readFileSync(bindingsFile, 'utf8'));
    } catch (e) {
        console.warn(`❌ Fehler beim Laden von ${bindingsFile}:`, e.message);
        return {};
    }
}

function saveBindings(data) {
    try {
        fs.writeFileSync(bindingsFile, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`❌ Fehler beim Speichern von ${bindingsFile}:`, e.message);
    }
}

// STATS
function loadStats() {
    try {
        return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    } catch (e) {
        console.warn(`❌ Fehler beim Laden von ${statsFile}:`, e.message);
        return {};
    }
}

function saveStats(data) {
    try {
        fs.writeFileSync(statsFile, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`❌ Fehler beim Speichern von ${statsFile}:`, e.message);
    }
}

module.exports = {
    loadBindings,
    saveBindings,
    loadStats,
    saveStats
};
