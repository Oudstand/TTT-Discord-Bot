// storage/database.ts
import {Database} from "bun:sqlite";
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath, {create: true});

db.exec(`
    CREATE TABLE IF NOT EXISTS bindings
    (
        steamId   TEXT NOT NULL PRIMARY KEY,
        discordId TEXT NOT NULL UNIQUE,
        name      TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS stats
    (
        steamId       TEXT PRIMARY KEY,
        name          TEXT,
        kills         INTEGER NOT NULL DEFAULT 0,
        teamKills     INTEGER NOT NULL DEFAULT 0,
        deaths        INTEGER NOT NULL DEFAULT 0,
        wins          INTEGER NOT NULL DEFAULT 0,
        losses        INTEGER NOT NULL DEFAULT 0,
        traitorRounds INTEGER NOT NULL DEFAULT 0,
        damage        INTEGER NOT NULL DEFAULT 0,
        teamDamage    INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS stats_session
    (
        steamId       TEXT PRIMARY KEY,
        name          TEXT,
        kills         INTEGER NOT NULL DEFAULT 0,
        teamKills     INTEGER NOT NULL DEFAULT 0,
        deaths        INTEGER NOT NULL DEFAULT 0,
        wins          INTEGER NOT NULL DEFAULT 0,
        losses        INTEGER NOT NULL DEFAULT 0,
        traitorRounds INTEGER NOT NULL DEFAULT 0,
        damage        INTEGER NOT NULL DEFAULT 0,
        teamDamage    INTEGER NOT NULL DEFAULT 0
    );
`);

export default db;