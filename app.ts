// app.ts (Main entry point)
import express, {Request, Response} from 'express';
import http from 'http';
import {WebSocketServer} from "ws";
import {Client} from "discord.js";

import config from './config';
import {setWebSocketServer} from './websocket-service';

import {client, loadGuild} from './discord/client';
import {createUnmuteButton, setupButtonInteraction} from './discord/button-handlers';
import {updateStatsMessage} from './discord/stats-announcer';
import {resetSessionStats} from './storage/stats-store';

import bindingsRoutes from './routes/bindings';
import statsRoutes from './routes/stats';
import statusRoutes from './routes/status';
import discordRoutes from './routes/discord';
import gameRoutes from './routes/game';

import openBrowser from "./utils/open-browser";

import indexHtml from "./public/index.html" with {type: "text"};
import dashboardJs from "./public/js/dashboard.js" with {type: "text"};
import {faviconBase64} from './favicon-embedded';
import {cacheAvatars} from "./utils/player";
import {t, Language} from './i18n/translations';

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

app.get('/', (_req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(indexHtml);
});

app.get('/js/dashboard.js', (_req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(dashboardJs);
});

app.get('/favicon.ico', (_req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = Buffer.from(faviconBase64, 'base64');
    res.send(buffer);
});

// Discord Login & Bot Start
client.once('ready', async (readyClient: Client) => {
    if (!readyClient.user) {
        console.error(`❌ ${t('config.clientUserNotDetermined', (config.language || 'en') as Language)}`);
        return;
    }

    await loadGuild();
    await cacheAvatars();

    const lang = (config.language || 'en') as Language;
    console.log(`✅ ${t('console.botReady', lang)} ${readyClient.user.tag}`);

    server.listen(port, () => {
        console.log(`🌐 ${t('console.dashboardRunning', lang)} http://localhost:${port}`)
        openBrowser(`http://localhost:3000?lang=${lang}`);
    });

    resetSessionStats();

    // Small delay to let Edge initialize properly on first launch
    setTimeout(async () => {
        await updateStatsMessage('all');
        await updateStatsMessage('session');
    }, 2000);

    await createUnmuteButton();
    setupButtonInteraction();
});

if (!config.token) {
    throw new Error('❌ Discord bot token (DISCORD_TOKEN) is missing from configuration. Bot cannot start.');
}

void client.login(config.token);