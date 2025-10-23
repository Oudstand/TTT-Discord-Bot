// routes/bindings.ts
import express, {Request, Response, Router} from 'express';
import {deleteBinding, getBinding, getBindings, setBinding} from '../storage/bindings-store';
import {getGuild} from "../discord/client";
import {Guild, GuildMember} from "discord.js";
import {Binding, BindingWithAvatar} from "../types";
import {fallBackAvatarUrl, getSteamAvatarUrl} from "../utils/player";
import {updateNameInStats} from "../storage/stats-store";

const router: Router = express.Router();

// Get all bindings
router.get('/bindings', async (req: Request, res: Response): Promise<void> => {
    try {
        let bindings: BindingWithAvatar[] = getBindings();
        const guild: Guild | null = getGuild();

        if (guild) {
            bindings = await Promise.all(bindings.map(async (binding): Promise<BindingWithAvatar> => {
                try {
                    const member: GuildMember = await guild.members.fetch(binding.discordId);
                    return {
                        ...binding,
                        steamAvatarUrl: await getSteamAvatarUrl(binding.steamId),
                        discordAvatarUrl: member.user.avatarURL() ?? fallBackAvatarUrl
                    };
                } catch {
                    return {
                        ...binding,
                        steamAvatarUrl: fallBackAvatarUrl,
                        discordAvatarUrl: fallBackAvatarUrl
                    };
                }
            }));
        }

        res.json(bindings);
    } catch (error) {
        console.error('❌ Error fetching bindings:', error);
        res.status(500).send('Internal server error');
    }
});

// Get single binding
router.get('/bindings/:steamId', (req: Request<{ steamId: string }>, res: Response): void => {
    try {
        const binding: Binding | null = getBinding(req.params.steamId);
        if (binding) {
            res.json(binding);
        } else {
            res.status(404).send('Binding not found');
        }
    } catch (error) {
        console.error('❌ Error fetching single binding:', error);
        res.status(500).send('Internal server error');
    }
});

// Save or update binding entry
router.post('/bindings', (req: Request<{}, {}, Binding>, res: Response): void => {
    try {
        const {steamId, discordId, name} = req.body;
        if (!steamId || !discordId || !name) {
            res.status(400).send('Missing fields: steamId, discordId, and name are required.');
            return;
        }

        setBinding(steamId, discordId, name);
        updateNameInStats(steamId, name);
        res.status(200).send('Binding saved successfully.');
    } catch (error) {
        console.error('❌ Error saving binding:', error);
        res.status(500).send('Internal server error');
    }
});

// Delete binding
router.delete('/bindings/:steamId', (req: Request<{ steamId: string }>, res: Response): void => {
    try {
        const {steamId} = req.params;
        deleteBinding(steamId);
        res.status(200).send('Binding deleted successfully.');
    } catch (error) {
        console.error('❌ Error deleting binding:', error);
        res.status(500).send('Internal server error');
    }
});

export default router;