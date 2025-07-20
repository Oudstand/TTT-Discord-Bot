// routes/status.js
import express from 'express';
const router = express.Router();
import { getClient } from '../discord/client.js';

router.get('/status', (req, res) => {
    res.json({ tag: getClient().user?.tag || 'Unverbunden' });
});

export default router;