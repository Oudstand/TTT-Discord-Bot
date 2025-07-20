import { Database } from "bun:sqlite";
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath, { create: true });

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
        teamKills INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        traitorRounds INTEGER DEFAULT 0,
        damage INTEGER DEFAULT 0,
        teamDamage INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS stats_session  (
        steamId TEXT PRIMARY KEY,
        name TEXT,
        kills INTEGER DEFAULT 0,
        teamKills INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        traitorRounds INTEGER DEFAULT 0,
        damage INTEGER DEFAULT 0,
        teamDamage INTEGER DEFAULT 0
    );
`);

export default db;