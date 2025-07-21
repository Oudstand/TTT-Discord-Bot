// routes/status.ts
import express, {Request, Response, Router} from 'express';
import {getClient} from '../discord/client';
import {Client} from "discord.js";

const router: Router = express.Router();

router.get('/status', (req: Request, res: Response): void => {
    try {
        const client: Client = getClient();
        res.json({tag: client.user?.tag ?? 'Unverbunden'});
    } catch (error) {
        res.status(500).send({tag: 'Fehler'});
    }
});

export default router;