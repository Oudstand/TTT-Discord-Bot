// routes/bindings.js
import express from 'express';
const router = express.Router();
import { getBindings, setBinding, deleteBinding, getBinding } from '../storage/bindingsStore.js';
import { getGuild } from "../discord/client.js";

// Alle Bindings abrufen
router.get('/bindings', async (req, res) => {
    let bindings = getBindings();
    const guild = getGuild();

    if (guild) {
        bindings = await Promise.all(bindings.map(async (binding) => {
            try {
                const member = await guild.members.fetch(binding.discordId);
                return {
                    ...binding,
                    avatarUrl: member.user.avatarURL()
                };
            } catch {
                return {
                    ...binding
                };
            }
        }));
    }

    res.json(bindings);
});

// Einzelnes Binding abrufen
router.get('/bindings/:steamId', (req, res) => {
    res.json(getBinding(req.params.steamId));
});

// Neuen Binding-Eintrag speichern oder aktualisieren
router.post('/bindings', (req, res) => {
    const { steamId, discordId, name } = req.body;
    if (!steamId || !discordId || !name) return res.status(400).send('Fehlende Felder');

    setBinding(steamId, discordId, name);
    res.sendStatus(200);
});

// Binding löschen
router.delete('/bindings/:steamId', (req, res) => {
    deleteBinding(req.params.steamId);
    res.sendStatus(200);
});

export default router;