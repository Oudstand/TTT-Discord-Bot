// utils/mute.ts
import {getGuild} from "../discord/client";
import {getNameByDiscordId} from "./player";
import {Guild, GuildMember} from "discord.js";
import {MuteResult, MuteResultCode} from "../types";

function ok(message?: string): MuteResult {
    return {code: MuteResultCode.OK, success: true, message};
}

function fail(code: MuteResultCode, message: string): MuteResult {
    return {code, success: false, message};
}

async function setMute(discordId: string, mute: boolean): Promise<MuteResult> {
    try {
        const guild: Guild | null = getGuild();
        if (!guild) {
            return fail(MuteResultCode.GUILD_NOT_FOUND, 'Guild nicht gefunden/gebunden.');
        }
        if (!guild.available) {
            return fail(MuteResultCode.GUILD_UNAVAILABLE, 'Guild momentan nicht verfügbar.');
        }

        let member: GuildMember;
        try {
            member = await guild.members.fetch(discordId);
        } catch {
            return fail(MuteResultCode.MEMBER_NOT_FOUND, `Member ${discordId} nicht gefunden.`);
        }

        if (!member.voice || !member.voice.channel) {
            return fail(MuteResultCode.MEMBER_NOT_IN_VOICE, `Member ${discordId} ist in keinem Voice-Channel.`);
        }

        const currentServerMute: boolean = member.voice.serverMute ?? false;
        if (currentServerMute === mute) {
            return ok('Bereits im gewünschten Zustand.');
        }

        await member.voice.setMute(mute);
        const name = getNameByDiscordId(discordId) ?? member.displayName;
        console.log(`${mute ? '🔇 Gemutet' : '🔊 Entmutet'}: ${name}`);
        return ok(`Benutzer ${name} wurde ${mute ? 'gemutet' : 'entmutet'}.`);
    } catch (error: any) {
        const code = error?.code === 50013 ? MuteResultCode.PERMISSION_DENIED : MuteResultCode.INTERNAL;
        const msg = code === MuteResultCode.PERMISSION_DENIED
            ? 'Fehlende Rechte: Prüfe Rollen-Hierarchie und Voice‑Permissions.'
            : 'Unerwarteter Fehler beim Setzen des Mute‑Status.';
        return fail(code, msg);

    }
}

function toHttpStatus(code: MuteResultCode): number {
    switch (code) {
        case MuteResultCode.OK:
            return 200;
        case MuteResultCode.MEMBER_NOT_IN_VOICE:
            return 422;
        case MuteResultCode.GUILD_UNAVAILABLE:
            return 503;
        case MuteResultCode.GUILD_NOT_FOUND:
        case MuteResultCode.MEMBER_NOT_FOUND:
            return 404;
        case MuteResultCode.PERMISSION_DENIED:
            return 403;
        default:
            return 500;
    }
}

async function unmuteAll(): Promise<MuteResult> {
    const guild: Guild | null = getGuild();
    if (!guild) {
        return fail(MuteResultCode.GUILD_NOT_FOUND, 'Guild nicht gefunden/gebunden.');
    }
    if (!guild.available) {
        return fail(MuteResultCode.GUILD_UNAVAILABLE, 'Guild momentan nicht verfügbar.');
    }

    console.log('🔊 Versuche, alle Spieler zu entmuten...');

    const errors: string[] = [];
    const unmutePromises: Promise<void | GuildMember>[] = [];

    for (const state of guild.voiceStates.cache.values()) {
        if (state.channel && state.member && state.member.voice.serverMute) {
            unmutePromises.push(
                state.member.voice.setMute(false, 'Rundenende').catch((error: Error) => {
                    const name = getNameByDiscordId(state.member!.id) ?? state.member!.displayName;
                    const errorMessage = `❌ Fehler beim Entmuten von ${name}: ${error.message}`;
                    console.error(errorMessage);
                    errors.push(errorMessage);
                })
            );
        }
    }

    await Promise.all(unmutePromises);

    if (errors.length > 0) {
        console.log(`🔊 Entmutung abgeschlossen mit ${errors.length} Fehlern.`);
        return fail(MuteResultCode.INTERNAL, errors.join('\n'));
    } else {
        console.log('🔊 Alle Spieler erfolgreich entmutet.');
        return ok('Alle Spieler erfolgreich entmutet.');
    }
}

export {
    setMute,
    toHttpStatus,
    unmuteAll
}