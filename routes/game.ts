// routes/game.ts
import express, {NextFunction, Request, Response, Router} from 'express';
import {updateStats} from '../storage/stats-store';
import {setMute, toHttpStatus, unmuteAll} from "../utils/mute";
import {updateStatsMessage} from "../discord/stats-announcer";
import WebSocket, {WebSocketServer} from "ws";
import {getWebSocketServer} from "../websocket-service";
import {Binding, MuteResult, RoundEndBody, SteamIdBody} from "../types";
import {getBinding} from "../storage/bindings-store";
import {get, set} from "../storage/meta-store";
import {t, Language} from '../i18n/translations';
import config from '../config';

const router: Router = express.Router();
const isActiveRoundMetaKey = 'isActiveRound';

function isRoundActive() {
    return get<boolean>(isActiveRoundMetaKey) ?? false;
}

router.post('/roundStart', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        set(isActiveRoundMetaKey, true);
        return void res.sendStatus(200);
    } catch (error) {
        return void next(error);
    }
});

// Player died => mute by SteamID
router.post('/dead', async (req: Request<{}, {}, SteamIdBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (isRoundActive()) {
            return await setMuteBySteamId(req.body.steamId, true, res);
        } else {
            res.sendStatus(204);
        }
    } catch (error) {
        return void next(error);
    }
});

// Player spawned => unmute by SteamID
router.post('/spawn', async (req: Request<{}, {}, SteamIdBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
        return await setMuteBySteamId(req.body.steamId, false, res);
    } catch (err) {
        return void next(err);
    }
});

async function setMuteBySteamId(steamId: string, mute: boolean, res: Response): Promise<void> {
    if (!steamId) {
        return void res.status(400).send('SteamID missing');
    }

    const binding: Binding | null = getBinding(steamId);
    if (!binding) {
        return void res.status(404).send(`Binding for SteamID ${steamId} not found`);
    }

    const result: MuteResult = await setMute(binding.discordId, mute);
    return void res.status(toHttpStatus(result.code)).json(result);
}

router.post('/roundEnd', async (req: Request<{}, {}, RoundEndBody>, res: Response): Promise<void> => {
    try {
        set(isActiveRoundMetaKey, false);
        void unmuteAll();
        const {players} = req.body;
        if (!Array.isArray(players)) {
            res.status(400).send('Player list missing or not an array.');
            return;
        }

        const lang = (config.language || 'en') as Language;
        console.log(`📊 ${t('console.roundEnd', lang)}`);

        updateStats(players);

        void updateStatsMessage('all');
        void updateStatsMessage('session');

        const wss: WebSocketServer | null = getWebSocketServer();
        if (wss) {
            const message: string = JSON.stringify({type: 'statsUpdate'});
            wss.clients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(message);
                }
            });
        }

        res.status(200).send('Round end processed successfully.');
    } catch (error) {
        console.error(`❌ ${t('routes.errorRoundEnd', lang())}`, error);
        res.status(500).send("Internal server error processing round end.");
    }
});

export default router;