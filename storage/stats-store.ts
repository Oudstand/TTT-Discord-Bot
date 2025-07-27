// storage/stats-store.ts
import db from './database';
import {getDiscordAvatarUrl, getNameBySteamId, getSteamAvatarUrl} from '../utils/player';
import {MappedStat, PlayerRoundData, Stat, StatTableName} from "../types";

function createStatStore(tableName: StatTableName) {
    // 1. Dynamisch vorbereitete Statements für die gegebene Tabelle
    const statements = {
        // @formatter:off
        all: db.prepare<Stat, []>(`SELECT * FROM ${tableName}`),
        has: db.prepare<{ steamId: string }, [string]>(`SELECT steamId FROM ${tableName} WHERE steamId = ?`),
        insert: db.prepare<null, [string, string | null]>(`INSERT INTO ${tableName} (steamId, name, kills, teamKills, deaths, wins, losses, damage, teamDamage, traitorRounds) VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0)`),
        insertOrUpdate: db.prepare<null, Record<string, any>>(`
            INSERT INTO ${tableName} (steamId, name, kills, teamKills, deaths, wins, losses, damage, teamDamage, traitorRounds)
            VALUES (@steamId, @name, @kills, @teamKills, @deaths, @wins, @losses, @damage, @teamDamage, @traitorRounds)
            ON CONFLICT(steamId) DO UPDATE SET
                kills         = kills + @kills,
                teamKills     = teamKills + @teamKills,
                deaths        = deaths + @deaths,
                wins          = wins + @wins,
                losses        = losses + @losses,
                damage        = damage + @damage,
                teamDamage    = teamDamage + @teamDamage,
                traitorRounds = traitorRounds + @traitorRounds;
         `),
        updateName: db.prepare<null, [string, string]>(`UPDATE ${tableName} SET name = ? WHERE steamId = ?`),
        addKills: db.prepare<null, [number, string]>(`UPDATE ${tableName} SET kills = kills + ? WHERE steamId = ?`),
        addTeamKills: db.prepare<null, [number, string]>(`UPDATE ${tableName} SET teamKills = teamKills + ? WHERE steamId = ?`),
        addDeaths: db.prepare<null, [number, string]>(`UPDATE ${tableName} SET deaths = deaths + ? WHERE steamId = ?`),
        addWins: db.prepare<null, [number, string]>(`UPDATE ${tableName} SET wins = wins + ? WHERE steamId = ?`),
        addLosses: db.prepare<null, [number, string]>(`UPDATE ${tableName} SET losses = losses + ? WHERE steamId = ?`),
        addTraitorRounds: db.prepare<null, [number, string]>(`UPDATE ${tableName} SET traitorRounds = traitorRounds + ? WHERE steamId = ?`),
        addDamage: db.prepare<null, [number, string]>(`UPDATE ${tableName} SET damage = damage + ? WHERE steamId = ?`),
        addTeamDamage: db.prepare<null, [number, string]>(`UPDATE ${tableName} SET teamDamage = teamDamage + ? WHERE steamId = ?`),
        deleteAll: db.prepare<null, []>(`DELETE FROM ${tableName}`)
        // @formatter:on
    };

    const insertOrUpdateTransaction = db.transaction((players: PlayerRoundData[]) => {
        players.forEach((player: PlayerRoundData) => {
            const params = {
                '@steamId': player.steamId,
                '@name': getNameBySteamId(player.steamId) ?? player.steamId,
                '@kills': player.kills ?? 0,
                '@teamKills': player.teamKills ?? 0,
                '@deaths': player.deaths ?? 0,
                '@wins': player.win ? 1 : 0,
                '@losses': player.win ? 0 : 1,
                '@damage': player.damage ?? 0,
                '@teamDamage': player.teamDamage ?? 0,
                '@traitorRounds': player.wasTraitor ? 1 : 0,
            };
            statements.insertOrUpdate.run(params);
        })
    });

    // 2. Ein Objekt mit sauberen Aktions-Funktionen zurückgeben
    return {
        getAll: (): Stat[] => statements.all.all(),
        has: (steamId: string): boolean => !!statements.has.get(steamId),
        insert: (steamId: string) => statements.insert.run(steamId, getNameBySteamId(steamId)),
        insertOrUpdate: (players: PlayerRoundData[]) => insertOrUpdateTransaction(players),
        updateName: (name: string, steamId: string) => statements.updateName.run(name, steamId),
        deleteAll: () => statements.deleteAll.run(),

        // Funktionen, die einen Wert hinzufügen
        addKills: (steamId: string, value: number) => statements.addKills.run(value, steamId),
        addTeamKills: (steamId: string, value: number) => statements.addTeamKills.run(value, steamId),
        addDeaths: (steamId: string, value: number) => statements.addDeaths.run(value, steamId),
        addWins: (steamId: string, value: number) => statements.addWins.run(value, steamId),
        addLosses: (steamId: string, value: number) => statements.addLosses.run(value, steamId),
        addTraitorRounds: (steamId: string, value: number) => statements.addTraitorRounds.run(value, steamId),
        addDamage: (steamId: string, value: number) => statements.addDamage.run(value, steamId),
        addTeamDamage: (steamId: string, value: number) => statements.addTeamDamage.run(value, steamId),
    };
}

const totalStatsStore = createStatStore('stats');
const sessionStatsStore = createStatStore('stats_session');

async function getStats(): Promise<MappedStat[]> {
    return Promise.all(totalStatsStore.getAll().map(mapStats));
}

function getSessionStats(): Promise<MappedStat[]> {
    return Promise.all(sessionStatsStore.getAll().map(mapStats));
}

async function mapStats(stat: Stat): Promise<MappedStat> {
    const kdRatio: number = stat.deaths > 0 ? parseFloat((stat.kills / stat.deaths).toFixed(2)) : stat.kills;
    const totalGames: number = stat.wins + stat.losses;
    const winrate: number = totalGames ? parseFloat(((stat.wins / totalGames) * 100).toFixed(2)) : 0;
    return {
        ...stat,
        kdRatio,
        winrate,
        steamAvatarUrl: await getSteamAvatarUrl(stat.steamId),
        discordAvatarUrl: await getDiscordAvatarUrl(stat.steamId)
    };
}

function updateStats(players: PlayerRoundData[]): void {
    totalStatsStore.insertOrUpdate(players);
    sessionStatsStore.insertOrUpdate(players);
}

function updateNameInStats(steamId: string, name: string): void {
    if (totalStatsStore.has(steamId)) {
        totalStatsStore.updateName(name, steamId);
    }
    if (sessionStatsStore.has(steamId)) {
        sessionStatsStore.updateName(name, steamId);
    }
}

function ensureStatsEntry(steamId: string): void {
    if (!totalStatsStore.has(steamId)) {
        totalStatsStore.insert(steamId);
    }

    if (!sessionStatsStore.has(steamId)) {
        sessionStatsStore.insert(steamId);
    }
}

function addKills(steamId: string, kills: number): void {
    ensureStatsEntry(steamId);
    totalStatsStore.addKills(steamId, kills);
    sessionStatsStore.addKills(steamId, kills);
}

function addTeamKills(steamId: string, teamKills: number): void {
    ensureStatsEntry(steamId);
    totalStatsStore.addTeamKills(steamId, teamKills);
    sessionStatsStore.addTeamKills(steamId, teamKills);
}

function addDeaths(steamId: string, deaths: number): void {
    ensureStatsEntry(steamId);
    totalStatsStore.addDeaths(steamId, deaths);
    sessionStatsStore.addDeaths(steamId, deaths);
}

function addWin(steamId: string): void {
    ensureStatsEntry(steamId);
    totalStatsStore.addWins(steamId, 1);
    sessionStatsStore.addWins(steamId, 1);
}

function addLoss(steamId: string): void {
    ensureStatsEntry(steamId);
    totalStatsStore.addLosses(steamId, 1);
    sessionStatsStore.addLosses(steamId, 1);
}

function addTraitorRound(steamId: string): void {
    ensureStatsEntry(steamId);
    totalStatsStore.addTraitorRounds(steamId, 1);
    sessionStatsStore.addTraitorRounds(steamId, 1);
}

function addDamage(steamId: string, damage: number): void {
    ensureStatsEntry(steamId);
    totalStatsStore.addDamage(steamId, damage);
    sessionStatsStore.addDamage(steamId, damage);
}

function addTeamDamage(steamId: string, damage: number): void {
    ensureStatsEntry(steamId);
    totalStatsStore.addTeamDamage(steamId, damage);
    sessionStatsStore.addTeamDamage(steamId, damage);
}

function deleteAllStats(): void {
    totalStatsStore.deleteAll();
}

function deleteAllSessionStats(): void {
    sessionStatsStore.deleteAll();
}

function resetSessionStats(): void {
    deleteAllSessionStats();
}

export {
    getStats,
    getSessionStats,
    updateStats,
    updateNameInStats,
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