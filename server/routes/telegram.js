const express = require('express');
const router = express.Router();
const config = require('../config');
const logger = require('../utils/logger');

router.post('/send', async (req, res) => {
  const { text, chatId, parseMode } = req.body;
  try {
    const sender = require('../modules/telegram/sender');
    const result = await sender.send({ text, chatId, parseMode });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/status', (req, res) => {
  const bot = require('../modules/telegram/bot').getBot();
  res.json({
    configured: !!config.telegram.botToken,
    botToken: config.telegram.botToken ? '✅ Set' : '❌ Not set',
    chatId: config.telegram.chatId || '❌ Not set',
    botRunning: !!bot,
  });
});

module.exports = router;
