// routes/stats.ts
import express, { Request, Response, Router } from 'express';
import { broadcast } from '../websocket-service';
import { updateStatsMessage } from '../discord/stats-announcer';
import {
    addDamage,
    addDeaths,
    addKills,
    addLoss,
    addTeamDamage,
    addTeamKills,
    addTraitorRound,
    addWin,
    getSessionStats,
    getStats,
    deleteStatsBySteamId,
    deleteSessionStatsBySteamId
} from '../storage/stats-store';
import { getNameBySteamId } from '../utils/player';
import { DamageBody, SteamIdBody, WinLossBody } from "../types";
import { t } from '../i18n/translations';
import { lang } from '../config';

const router: Router = express.Router();

function notifyClientsAndDiscord(): void {
    console.log(`📊 ${t('console.statsUpdate', lang())}`);
    void updateStatsMessage('all');
    void updateStatsMessage('session');

    broadcast({ type: 'statsUpdate' });
}

// Alle Statistiken abrufen
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        res.json(await getStats());
    } catch (error) {
        res.status(500).send(t('api.stats.errorAll', lang()));
    }
});

// Session Statistiken abrufen
router.get('/stats/session', async (req: Request, res: Response): Promise<void> => {
    try {
        res.json(await getSessionStats());
    } catch (error) {
        res.status(500).send(t('api.stats.errorSession', lang()));
    }
});

// Statistik-Announcer aktualisieren
router.post('/updateStats', (req: Request, res: Response): void => {
    try {
        notifyClientsAndDiscord();
        res.status(200).send(t('api.stats.updating', lang()));
    } catch (error) {
        res.status(500).send(t('api.stats.errorUpdate', lang()));
    }
});

// Death-Tracking
router.post('/trackDeath', (req: Request<{}, {}, SteamIdBody>, res: Response): void => {
    const { steamId } = req.body;
    if (!steamId) {
        res.status(400).send(t('api.stats.missingSteamId', lang()));
        return;
    }

    addDeaths(steamId, 1);
    console.log(`📊 ${t('console.deathTracked', lang())}: ${getNameBySteamId(steamId) ?? steamId}`);
    res.status(200).send(t('api.stats.deathRecorded', lang()));
});

// Kill-Tracking
router.post('/trackKill', (req: Request<{}, {}, SteamIdBody>, res: Response): void => {
    const { steamId } = req.body;
    if (!steamId) {
        res.status(400).send(t('api.stats.missingSteamId', lang()));
        return;
    }

    addKills(steamId, 1);
    console.log(`📊 ${t('console.killTracked', lang())}: ${getNameBySteamId(steamId) ?? steamId}`);
    res.status(200).send(t('api.stats.killRecorded', lang()));
});

// Team-Kill-Tracking
router.post('/trackTeamKill', (req: Request<{}, {}, SteamIdBody>, res: Response): void => {
    const { steamId } = req.body;
    if (!steamId) {
        res.status(400).send(t('api.stats.missingSteamId', lang()));
        return;
    }

    addTeamKills(steamId, 1);
    console.log(`📊 ${t('console.teamKillTracked', lang())}: ${getNameBySteamId(steamId) ?? steamId}`);
    res.status(200).send(t('api.stats.teamKillRecorded', lang()));
});

// Win/Loss-Tracking
router.post('/trackWin', (req: Request<{}, {}, WinLossBody>, res: Response): void => {
    const { steamId, win } = req.body;
    if (!steamId || (win !== '1' && win !== '0')) {
        res.status(400).send(t('api.stats.invalidWinStatus', lang()));
        return;
    }

    win === '1' ? addWin(steamId) : addLoss(steamId);
    const translationKey = win === '1' ? 'console.winTracked' : 'console.lossTracked';
    console.log(`🏁 ${t(translationKey, lang(), { player: getNameBySteamId(steamId) ?? steamId })}`);
    res.status(200).send(t('api.stats.winLossRecorded', lang()));
});

// Traitor-Tracking
router.post('/trackTraitorRound', (req: Request<{}, {}, SteamIdBody>, res: Response): void => {
    const { steamId } = req.body;
    if (!steamId) {
        res.status(400).send(t('api.stats.missingSteamId', lang()));
        return;
    }

    addTraitorRound(steamId);
    console.log(`📊 ${t('console.traitorTracked', lang())}: ${getNameBySteamId(steamId) ?? steamId}`);
    res.status(200).send(t('api.stats.traitorRecorded', lang()));
});

// Damage-Tracking
router.post('/trackDamage', (req: Request<{}, {}, DamageBody>, res: Response): void => {
    const { steamId, damage } = req.body;
    if (!steamId || typeof damage !== 'number') {
        res.status(400).send(t('api.stats.missingDamage', lang()));
        return;
    }

    addDamage(steamId, damage);
    console.log(`📊 ${t('console.damageTracked', lang())}: ${getNameBySteamId(steamId) ?? steamId} - ${damage}`);
    res.status(200).send(t('api.stats.damageRecorded', lang()));
});

// Team-Damage-Tracking
router.post('/trackTeamDamage', (req: Request<{}, {}, DamageBody>, res: Response): void => {
    const { steamId, damage } = req.body;
    if (!steamId || typeof damage !== 'number') {
        res.status(400).send(t('api.stats.missingDamage', lang()));
        return;
    }

    addTeamDamage(steamId, damage);
    console.log(`📊 ${t('console.teamDamageTracked', lang())}: ${getNameBySteamId(steamId) ?? steamId} - ${damage}`);
    res.status(200).send(t('api.stats.teamDamageRecorded', lang()));
});

// Delete stats for a player (total stats)
router.delete('/stats/:steamId', (req: Request, res: Response): void => {
    const { steamId } = req.params;
    if (!steamId) {
        res.status(400).send(t('api.stats.missingSteamId', lang()));
        return;
    }

    deleteStatsBySteamId(steamId);
    notifyClientsAndDiscord();
    console.log(`🗑️ ${t('console.statsDeleted', lang())}: ${getNameBySteamId(steamId) ?? steamId}`);
    res.status(200).send(t('api.stats.statsDeleted', lang()));
});

// Delete stats for a player (session stats)
router.delete('/stats/session/:steamId', (req: Request, res: Response): void => {
    const { steamId } = req.params;
    if (!steamId) {
        res.status(400).send(t('api.stats.missingSteamId', lang()));
        return;
    }

    deleteSessionStatsBySteamId(steamId);
    notifyClientsAndDiscord();
    console.log(`🗑️ ${t('console.sessionStatsDeleted', lang())}: ${getNameBySteamId(steamId) ?? steamId}`);
    res.status(200).send(t('api.stats.sessionStatsDeleted', lang()));
});

export default router;