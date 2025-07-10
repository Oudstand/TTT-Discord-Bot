// routes/status.js
const express = require('express');
const router = express.Router();
const {getClient} = require('../discord/client');

router.get('/status', (req, res) => {
    res.json({ tag: getClient().user?.tag || 'Unverbunden' });
});

module.exports = router;
