// routes/discord.ts
import express, {Request, Response, Router} from 'express';
import {getGuild} from "../discord/client";
import {getSteamIdByDiscordId} from "../storage/bindings-store";
import {fallBackAvatarUrl, getNameBySteamId} from "../utils/player";
import {setMute, toHttpStatus, unmuteAll} from "../utils/mute";
import {Guild, GuildMember, VoiceState} from "discord.js";
import {DiscordIdParams, MuteResult, VoiceUser} from "../types";

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
                    avatarUrl: member.user.avatarURL() ?? fallBackAvatarUrl
                };
            });

        res.json(results);
    } catch (error) {
        console.error('❌ Fehler beim Voice-Check:', error);
        res.status(500).send('Interner Serverfehler beim Voice-Check');
    }
});

// Spieler muten/entmuten per DiscordID
router.post('/mute/:discordId', async (req: Request<DiscordIdParams>, res: Response): Promise<void> => {
    try {
        const result: MuteResult = await setMute(req.params.discordId, true);
        res.status(toHttpStatus(result.code)).json(result);
    } catch (error) {
        console.error(`❌ Fehler bei /mute/${req.params.discordId}:`, error);
        res.status(500).send("Ein unerwarteter Fehler ist aufgetreten.");
    }
});
router.post('/unmute/:discordId', async (req: Request<DiscordIdParams>, res: Response): Promise<void> => {
    try {
        const result: MuteResult = await setMute(req.params.discordId, false);
        res.status(toHttpStatus(result.code)).json(result);
    } catch (error) {
        console.error(`❌ Fehler bei /unmute/${req.params.discordId}:`, error);
        res.status(500).send("Ein unerwarteter Fehler ist aufgetreten.");
    }
});

// Alle entmuten
router.post('/unmuteAll', async (req: Request, res: Response): Promise<void> => {
    try {
        const result: MuteResult = await unmuteAll();
        res.status(toHttpStatus(result.code)).json(result);
    } catch (error) {
        console.error("❌ Fehler bei /unmuteAll:", error);
        res.status(500).send("Ein unerwarteter Fehler ist aufgetreten.");
    }
});

export default router;