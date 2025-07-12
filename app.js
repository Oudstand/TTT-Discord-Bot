// app.js (Haupteinstiegspunkt)
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const {setWebSocketServer} = require('./websocketService');
const {client, loadGuild} = require('./discord/client');
const {createUnmuteButton} = require('./discord/buttonHandlers');
const {updateStatsMessage} = require('./discord/statsAnnouncer');
const {resetSessionStats} = require('./storage/statsStore');

const bindingsRoutes = require('./routes/bindings');
const statsRoutes = require('./routes/stats');
const statusRoutes = require('./routes/status');
const discordRoutes = require('./routes/discord');

const config = require('./config');
const app = express();
const port = 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({server});
app.set('wss', wss);
setWebSocketServer(wss);

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Routen
app.use('/api', bindingsRoutes);
app.use('/api', statsRoutes);
app.use('/api', statusRoutes);
app.use('/api', discordRoutes);

// Dashboard-View
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Discord Login & Bot Start
client.once('ready', async () => {
    await loadGuild();
    console.log(`✅  Bot ist bereit als ${client.user.tag}`);

    server.listen(port, () => {
        console.log(`🌐 Dashboard läuft auf http://ttthost:${port}`)
    });

    resetSessionStats();

    await updateStatsMessage('all');
    await updateStatsMessage('session');
    await createUnmuteButton();
});

client.login(config.token);