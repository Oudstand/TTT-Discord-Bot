//type.ts

// --- Types ---

export type ScreenshotPath = `${string}.png` | `${string}.jpeg` | `${string}.webp`;
export type StatsType = 'all' | 'session';
export type StatTableName = 'stats' | 'stats_session';

// --- Binding ---

export interface Binding {
    steamId: string;
    discordId: string;
    name: string;
}

export interface BindingWithAvatar extends Binding {
    avatarUrl?: string;
}

// --- Voice ---

export interface VoiceUser {
    name: string;
    steamId?: string;
    discordId: string;
    muted: boolean;
    avatarUrl: string;
}

export interface UnmuteResult {
    success: boolean;
    errors: string[];
}

// -- Statistics ---

export interface Stat {
    steamId: string;
    name: string;
    kills: number;
    teamKills: number;
    deaths: number;
    wins: number;
    losses: number;
    traitorRounds: number;
    damage: number;
    teamDamage: number;
}

export interface MappedStat extends Stat {
    kdRatio: number;
    winrate: number;
}

export interface PlayerRoundData {
    steamId: string;
    name: string;
    kills: number;
    teamKills: number;
    deaths: number;
    win: boolean;
    damage: number;
    teamDamage: number;
    wasTraitor: boolean;
}

// --- Bodys ---

export interface SteamIdBody {
    steamId: string;
}

export interface DiscordIdParams {
    discordId: string;
}

export interface RoundEndBody {
    players: PlayerRoundData[];
}

export interface WinLossBody extends SteamIdBody {
    win: '1' | '0';
}

export interface DamageBody extends SteamIdBody {
    damage: number;
}