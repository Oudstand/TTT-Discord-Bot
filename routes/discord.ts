// routes/discord.ts
import express, {Request, Response, Router} from 'express';
import {getGuild} from "../discord/client";
import {getBinding, getSteamIdByDiscordId} from "../storage/bindings-store";
import {getNameByDiscordId, getNameBySteamId} from "../utils/name";
import {unmuteAll} from "../utils/mute";
import {Guild, GuildMember, VoiceState} from "discord.js";
import {Binding, DiscordIdParams, SteamIdBody, VoiceUser} from "../types";

const router: Router = express.Router();


router.get('/voice', async (req: Request, res: Response): Promise<void> => {
    try {
        const guild: Guild | null = getGuild();
        if (!guild) {
            res.status(503).send('Guild nicht bereit');
            return;
        }

        const results: VoiceUser[] = Array.from(guild.members.cache.values())
            .filter((member: GuildMember) => member.voice.channel)
            .map((member: GuildMember) => {
                const steamId: string | undefined = getSteamIdByDiscordId(member.id);
                const name: string = steamId ? (getNameBySteamId(steamId) ?? member.displayName) : member.displayName;
                const voiceState: VoiceState = member.voice;
                return {
                    name,
                    steamId,
                    discordId: member.id,
                    muted: !!(voiceState.selfMute || voiceState.serverMute),
                    avatarUrl: member.user.avatarURL() ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
                };
            });

        res.json(results);
    } catch (error) {
        console.error('❌ Fehler beim Voice-Check:', error);
        res.status(500).send('Interner Serverfehler beim Voice-Check');
    }
});

// Spieler muten per SteamID
router.post('/mute', async (req: Request<{}, {}, SteamIdBody>, res: Response): Promise<void> => {
    return setMuteBySteamId(req.body.steamId, true, res);
});

// Spieler entmuten per SteamID
router.post('/unmute', async (req: Request<{}, {}, SteamIdBody>, res: Response): Promise<void> => {
    void setMuteBySteamId(req.body.steamId, false, res);
});

async function setMuteBySteamId(steamId: string, mute: boolean, res: Response): Promise<void> {
    if (!steamId) {
        res.status(400).send('SteamID fehlt');
        return;
    }

    const binding: Binding | null = getBinding(steamId);
    if (!binding) {
        res.status(404).send('Binding für diese SteamID nicht gefunden');
        return;
    }

    void setMute(binding.discordId, mute, res);
}

// Spieler muten/entmuten per DiscordID
router.post('/mute/:discordId', async (req: Request<DiscordIdParams>, res: Response): Promise<void> => {
    await setMute(req.params.discordId, true, res)
});
router.post('/unmute/:discordId', async (req: Request<DiscordIdParams>, res: Response): Promise<void> => {
    await setMute(req.params.discordId, false, res)
});

// Alle entmuten
router.post('/unmuteAll', async (req: Request, res: Response): Promise<void> => {
    try {
        const result: { success: boolean, errors: any[] } = await unmuteAll();
        if (!result.success) {
            const combinedErrorMessage = result.errors.join('\n');
            res.status(500).send(combinedErrorMessage);
        } else {
            res.status(200).send('Alle Spieler erfolgreich entmutet.');
        }
    } catch (error) {
        console.error("❌ Fehler bei /unmuteAll:", error);
        res.status(500).send("Ein unerwarteter Fehler ist aufgetreten.");
    }
});

// Hilfsfunktion
async function setMute(discordId: string, mute: boolean, res: Response): Promise<void> {
    try {
        const guild: Guild | null = getGuild();
        if (!guild) {
            res.status(503).send('Guild nicht bereit');
            return;
        }

        const member: GuildMember | null = await guild.members.fetch(discordId).catch(() => null);
        if (member?.voice?.channel) {
            await member.voice.setMute(mute);
            const name = getNameByDiscordId(discordId) ?? member.displayName;
            console.log(`${mute ? '🔇 Gemutet' : '🔊 Entmutet'}: ${name}`);
            res.status(200).send(`Benutzer ${name} wurde ${mute ? 'gemutet' : 'entmutet'}.`);
        } else {
            res.status(404).send(`Benutzer nicht im Voice-Kanal gefunden.`);
        }
    } catch (error) {
        console.error('❌ Fehler beim Muten/Entmuten:', error);
        res.status(500).send('Interner Serverfehler beim Muten/Entmuten');
    }
}

export default router;