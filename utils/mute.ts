// utils/mute.ts
import {getGuild} from "../discord/client";
import {getNameByDiscordId} from "./name";
import {Guild, GuildMember} from "discord.js";
import {UnmuteResult} from "../types";

async function unmuteAll(): Promise<UnmuteResult> {
    const guild: Guild | null = getGuild();
    if (!guild) {
        return {success: false, errors: ['❌ Guild nicht bereit']};
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
        return {success: false, errors};
    } else {
        console.log('🔊 Alle Spieler erfolgreich entmutet.');
        return {success: true, errors: []};
    }
}

export {
    unmuteAll,
}