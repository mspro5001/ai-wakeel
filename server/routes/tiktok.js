const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

router.post('/upload', async (req, res) => {
  const { videoPath, caption, scheduleTime } = req.body;
  try {
    const uploader = require('../modules/tiktok/uploader');
    const result = await uploader.upload({ videoPath, caption, scheduleTime });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const analytics = require('../modules/tiktok/analytics');
    const result = await analytics.analyze();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
