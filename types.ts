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
    steamAvatarUrl?: string;
    discordAvatarUrl?: string;
}

// --- Steam API ---

export interface SteamPlayer {
    steamid: string;
    personaname: string;
    avatarfull: string;
}

// --- Voice ---

export interface VoiceUser {
    name: string;
    steamId?: string;
    discordId: string;
    muted: boolean;
    avatarUrl: string;
}

export enum MuteResultCode {
    OK = 'OK',
    GUILD_NOT_FOUND = 'GUILD_NOT_FOUND',
    GUILD_UNAVAILABLE = 'GUILD_UNAVAILABLE',
    MEMBER_NOT_FOUND = 'MEMBER_NOT_FOUND',
    MEMBER_NOT_IN_VOICE = 'MEMBER_NOT_IN_VOICE',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    INTERNAL = 'INTERNAL',
}

export interface MuteResult {
    success: boolean;
    code: MuteResultCode;
    message?: string;
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
    steamAvatarUrl?: string;
    discordAvatarUrl?: string;
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