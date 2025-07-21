// routes/bindings.ts
import express, {Request, Response, Router} from 'express';
import {Binding, deleteBinding, getBinding, getBindings, setBinding} from '../storage/bindingsStore';
import {getGuild} from "../discord/client";
import {Guild, GuildMember} from "discord.js";

const router: Router = express.Router();

interface BindingWithAvatar extends Binding {
    avatarUrl?: string | null;
}

// Alle Bindings abrufen
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
                        avatarUrl: member.user.avatarURL()
                    };
                } catch {
                    return {
                        ...binding,
                        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png'
                    };
                }
            }));
        }

        res.json(bindings);
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der Bindings:", error);
        res.status(500).send("Interner Serverfehler");
    }
});

// Einzelnes Binding abrufen
router.get('/bindings/:steamId', (req: Request<{ steamId: string }>, res: Response): void => {
    try {
        const binding: Binding | null = getBinding(req.params.steamId);
        if (binding) {
            res.json(binding);
        } else {
            res.status(404).send('Binding nicht gefunden');
        }
    } catch (error) {
        console.error("❌ Fehler beim Abrufen eines einzelnen Bindings:", error);
        res.status(500).send("Interner Serverfehler");
    }
});

// Neuen Binding-Eintrag speichern oder aktualisieren
router.post('/bindings', (req: Request<{}, {}, Binding>, res: Response): void => {
    try {
        const {steamId, discordId, name} = req.body;
        if (!steamId || !discordId || !name) {
            res.status(400).send('Fehlende Felder: steamId, discordId und name sind erforderlich.');
            return;
        }

        setBinding(steamId, discordId, name);
        res.status(200).send("Binding erfolgreich gespeichert.");
    } catch (error) {
        console.error("❌ Fehler beim Speichern eines Bindings:", error);
        res.status(500).send("Interner Serverfehler");
    }
});

// Binding löschen
router.delete('/bindings/:steamId', (req: Request<{ steamId: string }>, res: Response): void => {
    try {
        const {steamId} = req.params;
        deleteBinding(steamId);
        res.sendStatus(200).send("Binding erfolgreich gelöscht.");
    } catch (error) {
        console.error("❌ Fehler beim Löschen eines Bindings:", error);
        res.status(500).send("Interner Serverfehler");
    }
});

export default router;