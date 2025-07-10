// app.js (Haupteinstiegspunkt)
const express = require('express');
const path = require('path');
const {client, loadGuild} = require('./discord/client');
const {setupButtonInteraction} = require('./discord/buttonHandlers');
const {updateStatsMessage} = require('./discord/statsAnnouncer');

const bindingsRoutes = require('./routes/bindings');
const voiceRoutes = require('./routes/voice');
const muteRoutes = require('./routes/mute');
const statsRoutes = require('./routes/stats');
const statusRoutes = require('./routes/status');


const config = require('./config');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Routen
app.use('/api', bindingsRoutes);
app.use('/api', voiceRoutes);
app.use('/api', muteRoutes);
app.use('/api', statsRoutes);
app.use('/api', statusRoutes);

// Dashboard-View
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Discord Login & Bot Start
client.once('ready', async () => {
    await loadGuild();
    setupButtonInteraction();
    console.log(`✅  Bot ist bereit als ${client.user.tag}`);

    app.listen(port, () =>
        console.log(`🌐 Dashboard läuft auf http://localhost:${port}`)
    );

    updateStatsMessage();

    // Optional: Button einmalig posten
    // const { createUnmuteButton } = require('./discord/buttonHandlers');
    // await createUnmuteButton();
});

client.login(config.token);
