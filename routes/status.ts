// routes/status.ts
import express, { Request, Response, Router } from 'express';
import { getClient } from '../discord/client';
import { Client } from "discord.js";
import { getLogHistory } from "../utils/logger";

const router: Router = express.Router();

router.get('/status', (req: Request, res: Response): void => {
    try {
        const client: Client = getClient();
        res.json({ tag: client.user?.tag ?? 'Unverbunden' });
    } catch (error) {
        res.status(500).send({ tag: 'Fehler' });
    }
});

router.post('/shutdown', (req: Request, res: Response): void => {
    res.status(200).send('Shutting down...');
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

router.get('/logs', (req: Request, res: Response): void => {
    res.json(getLogHistory());
});

export default router;