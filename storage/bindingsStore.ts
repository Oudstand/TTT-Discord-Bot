// storage/bindingsStore.ts
import db from './database';
import {Binding} from "../types";

// Prepared statements
const stmtAll = db.prepare<Binding, []>('SELECT * FROM bindings');
const stmtBySteam = db.prepare<Binding, [string]>('SELECT * FROM bindings WHERE steamId = ?');
const stmtByDiscord = db.prepare<Binding, [string]>('SELECT * FROM bindings WHERE discordId = ?');
const stmtUpsert = db.prepare<null, [string, string, string]>(`INSERT OR REPLACE INTO bindings (steamId, discordId, name) VALUES (?, ?, ?)`);
const stmtDelete = db.prepare<null, [string]>('DELETE FROM bindings WHERE steamId = ?');

// Alle Bindings abrufen
function getBindings(): Binding[] {
    return stmtAll.all();
}

function getBinding(steamId: string): Binding | null {
    return stmtBySteam.get(steamId);
}

function getBindingByDiscordId(discordId: string): Binding | null {
    return stmtByDiscord.get(discordId);
}

function getSteamIdByDiscordId(discordId: string): string | undefined {
    return stmtByDiscord.get(discordId)?.steamId;
}

function setBinding(steamId: string, discordId: string, name: string): void {
    stmtUpsert.run(steamId, discordId, name);
}

function deleteBinding(steamId: string): void {
    stmtDelete.run(steamId);
}

export {
    getBindings,
    getBinding,
    getBindingByDiscordId,
    getSteamIdByDiscordId,
    setBinding,
    deleteBinding
};