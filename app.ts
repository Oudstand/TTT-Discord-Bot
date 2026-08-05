// app.ts (Main entry point)
import { logErrorToFile } from './utils/logger';
import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from "ws";
import { Client } from "discord.js";

import config, { lang } from './config';
import { setWebSocketServer } from './websocket-service';

import { client, loadGuild } from './discord/client';
import { createUnmuteButton, setupButtonInteraction } from './discord/button-handlers';
import { updateStatsMessage } from './discord/stats-announcer';
import { resetSessionStats } from './storage/stats-store';

import bindingsRoutes from './routes/bindings';
import statsRoutes from './routes/stats';
import statusRoutes from './routes/status';
import discordRoutes from './routes/discord';
import gameRoutes from './routes/game';

import openBrowser from "./utils/open-browser";
import { shutdownGracefully } from "./utils/shutdown";

import indexHtml from "./public/index.html" with {type: "text"};
import dashboardJs from "./public/js/dashboard.js" with {type: "text"};
import { faviconBase64 } from './favicon-embedded';
import { cacheAvatars } from "./utils/player";
import { t } from './i18n/translations';

const app = express();

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

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
        console.error(`❌ ${t('config.clientUserNotDetermined', lang())}`);
        return;
    }

    await loadGuild();
    await cacheAvatars();

    console.log(`✅ ${t('console.botReady', lang())} ${readyClient.user.tag}`);

    server.listen(config.port, () => {
        const dashboardUrl = `http://localhost:${config.port}?lang=${lang()}`;
        console.log(`🌐 ${t('console.dashboardRunning', lang())} ${dashboardUrl}`)
        openBrowser(dashboardUrl);
    });

    resetSessionStats();

    // Small delay so the first screenshots run after everything has settled
    setTimeout(async () => {
        await updateStatsMessage('all');
        await updateStatsMessage('session');
    }, 2000);

    await createUnmuteButton();
    setupButtonInteraction();
});

process.on('SIGINT', () => void shutdownGracefully());
process.on('SIGTERM', () => void shutdownGracefully());

if (!config.token) {
    const message = '❌ Discord bot token (DISCORD_TOKEN) is missing from configuration. Bot cannot start.';
    console.error(message);
    logErrorToFile(message);
    process.exit(1);
}

client.login(config.token).catch(error => {
    console.error('❌ Discord login failed:', error);
    logErrorToFile(`Discord login failed: ${error?.message ?? error}\n${error?.stack ?? ''}`);
    process.exit(1);
});