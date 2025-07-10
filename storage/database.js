const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS bindings (
    steamId TEXT PRIMARY KEY,
    discordId TEXT UNIQUE,
    name TEXT
);
CREATE TABLE IF NOT EXISTS stats (
    steamId TEXT PRIMARY KEY,
    name TEXT,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
);
`);

module.exports = db;

