// app.ts (Haupteinstiegspunkt)
import express, {Request, Response} from 'express';
import http from 'http';
import {WebSocketServer} from "ws";
import {setWebSocketServer} from './websocketService';
import {client, loadGuild} from './discord/client';
import {createUnmuteButton} from './discord/buttonHandlers';
import {updateStatsMessage} from './discord/statsAnnouncer';
import {resetSessionStats} from './storage/statsStore';

import bindingsRoutes from './routes/bindings';
import statsRoutes from './routes/stats';
import statusRoutes from './routes/status';
import discordRoutes from './routes/discord';
import gameRoutes from './routes/game';

import config from './config';

// --- Lade alle UI-Assets zur Build-Zeit direkt in den Code ---
import indexHtml from './public/index.html' with {type: 'text'};
import dashboardJs from './public/js/dashboard.js' with {type: 'text'};
import faviconIco from './public/favicon.ico' with {type: 'buffer'};
import {Client} from "discord.js";
import openBrowser from "./utils/openBrowser";
// ---

const app = express();
const port = 3000;

const server = http.createServer(app);
const wss = new WebSocketServer({server});

if (process.platform === 'win32') {
    process.title = 'TTT Discord Bot';
    import('child_process').then(cp => cp.exec('title TTT Discord Bot'));
}

app.set('wss', wss);
setWebSocketServer(wss);

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// API-Routen
app.use('/api', bindingsRoutes);
app.use('/api', statsRoutes);
app.use('/api', statusRoutes);
app.use('/api', discordRoutes);
app.use('/api', gameRoutes);

// --- Auslieferung der UI-Assets aus dem Speicher ---
app.get('/', (req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'text/html');
    res.send(indexHtml);
});

app.get('/js/dashboard.js', (req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(dashboardJs);
});

app.get('/favicon.ico', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'image/x-icon');
    res.send(faviconIco);
});
// ---

// Discord Login & Bot Start
client.once('ready', async (readyClient: Client) => {
    if (!readyClient.user) {
        console.error("❌ Client ist bereit, aber der Benutzer konnte nicht ermittelt werden.");
        return;
    }

    await loadGuild();
    console.log(`✅  Bot ist bereit als ${readyClient.user.tag}`);

    server.listen(port, () => {
        console.log(`🌐 Dashboard läuft auf http://localhost:${port}`)
        openBrowser('http://localhost:3000');
    });

    resetSessionStats();

    await updateStatsMessage('all');
    await updateStatsMessage('session');
    await createUnmuteButton();
});

if (!config.token) {
    throw new Error("❌ Discord-Bot-Token (DISCORD_TOKEN) fehlt in der Konfiguration. Der Bot kann nicht gestartet werden.");
}

void client.login(config.token);