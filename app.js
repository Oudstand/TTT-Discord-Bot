// app.js (Haupteinstiegspunkt)
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { setWebSocketServer } from './websocketService.js';
import { client, loadGuild } from './discord/client.js';
import { createUnmuteButton } from './discord/buttonHandlers.js';
import { updateStatsMessage } from './discord/statsAnnouncer.js';
import { resetSessionStats } from './storage/statsStore.js';
import openBrowser from './utils/openBrowser.js';

import bindingsRoutes from './routes/bindings.js';
import statsRoutes from './routes/stats.js';
import statusRoutes from './routes/status.js';
import discordRoutes from './routes/discord.js';
import gameRoutes from './routes/game.js';

import config from './config.js';

// --- Lade alle UI-Assets zur Build-Zeit direkt in den Code ---
import indexHtml from './public/index.html' with { type: 'text' };
import dashboardJs from './public/js/dashboard.js' with { type: 'text' };
import faviconIco from './public/favicon.ico' with { type: 'buffer' };
// ---

const app = express();
const port = 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

if (process.platform === 'win32') {
    process.title = 'TTT Discord Bot';
    import('child_process').then(cp => cp.exec('title TTT Discord Bot'));
}

app.set('wss', wss);
setWebSocketServer(wss);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API-Routen
app.use('/api', bindingsRoutes);
app.use('/api', statsRoutes);
app.use('/api', statusRoutes);
app.use('/api', discordRoutes);
app.use('/api', gameRoutes);

// --- Auslieferung der UI-Assets aus dem Speicher ---
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(indexHtml);
});

app.get('/js/dashboard.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(dashboardJs);
});

app.get('/favicon.ico', (req, res) => {
    res.setHeader('Content-Type', 'image/x-icon');
    res.send(faviconIco);
});
// ---

// Discord Login & Bot Start
client.once('ready', async () => {
    await loadGuild();
    console.log(`✅  Bot ist bereit als ${client.user.tag}`);

    server.listen(port, () => {
        console.log(`🌐 Dashboard läuft auf http://localhost:${port}`)
        openBrowser('http://localhost:3000');
    });

    resetSessionStats();

    await updateStatsMessage('all');
    await updateStatsMessage('session');
    await createUnmuteButton();
});

client.login(config.token);