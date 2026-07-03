const express = require('express');
const router = express.Router();
const { db } = require('../database');
const logger = require('../utils/logger');

router.post('/send', async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to) return res.status(400).json({ success: false, error: 'Recipient required' });
  try {
    const sender = require('../modules/email/sender');
    const result = await sender.send({ to, subject, text, html });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/inbox', async (req, res) => {
  try {
    const receiver = require('../modules/email/receiver');
    const result = await receiver.check();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/register', async (req, res) => {
  const { url, email, password, name } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'URL required' });
  try {
    const registrar = require('../modules/email/registrar');
    const result = await registrar.register({ url, email, password, name });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
