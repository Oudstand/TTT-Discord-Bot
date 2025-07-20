import { getGuild } from "../discord/client.js";
import { getNameByDiscordId } from "./name.js";

async function unmuteAll() {
    const guild = getGuild();
    if (!guild) {
        return { success: false, errors: ['❌ Guild nicht bereit'] };
    }

    console.log('🔊 Versuche, alle Spieler zu entmuten...');

    const errors = [];
    const unmutePromises = [];
    for (const state of guild.voiceStates.cache.values()) {
        if (state.channel && state.member) {
            unmutePromises.push(
                state.member.voice.setMute(false).catch(err => {
                    const errorMessage = `❌ Fehler beim Entmuten von ${getNameByDiscordId(state.member.id)}: ${err.message}`;
                    console.error(errorMessage);
                    errors.push(errorMessage);
                })
            );
        }
    }

    await Promise.all(unmutePromises);

    if (errors.length > 0) {
        console.log(`🔊 Entmutung abgeschlossen mit ${errors.length} Fehlern.`);
        return { success: false, errors: errors };
    } else {
        console.log('🔊 Alle Spieler erfolgreich entmutet.');
        return { success: true, errors: [] };
    }
}

export {
    unmuteAll,
}