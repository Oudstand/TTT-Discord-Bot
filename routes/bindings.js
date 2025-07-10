// routes/bindings.js
const express = require('express');
const router = express.Router();
const {getBindings, setBinding, deleteBinding} = require('../storage/bindingsStore');

// Alle Bindings abrufen
router.get('/bindings', (req, res) => {
    res.json(getBindings());
});

// Neuen Binding-Eintrag speichern oder aktualisieren
router.post('/bindings', (req, res) => {
    const {steamId, discordId, name} = req.body;
    if (!steamId || !discordId || !name) return res.status(400).send('Fehlende Felder');

    setBinding(steamId, {discordId, name});
    res.sendStatus(200);
});

// Binding löschen
router.delete('/bindings/:steamId', (req, res) => {
    const steamId = req.params.steamId;
    const bindings = getBindings();
    if (!bindings[steamId]) return res.status(404).send('SteamID nicht gefunden');

    deleteBinding(steamId);

    res.sendStatus(200);
});

module.exports = router;
