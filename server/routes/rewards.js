const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

router.post('/check', async (req, res) => {
  try {
    const scraper = require('../modules/contentrewards/scraper');
    const result = await scraper.process({ action: 'check', autoRejectHaram: true });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/campaigns', (req, res) => {
  const filter = req.query.filter || 'all';
  const campaign = require('../modules/contentrewards/campaign');
  campaign.listCampaigns(filter).then(result => res.json(result));
});

router.post('/analyze', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ success: false, error: 'Text required' });
  const haramDetector = require('../modules/contentrewards/haram-detector');
  const result = await haramDetector.detectHaram(text);
  res.json({ success: true, ...result });
});

router.get('/stats', async (req, res) => {
  const campaign = require('../modules/contentrewards/campaign');
  const result = await campaign.getStats();
  res.json(result);
});

router.get('/haram-categories', (req, res) => {
  const { HARAM_CATEGORIES, HARAM_KEYWORDS } = require('../modules/contentrewards/haram-detector');
  const summary = HARAM_CATEGORIES.map(cat => ({
    category: cat,
    keywords: HARAM_KEYWORDS[cat].words.slice(0, 5),
    reason: HARAM_KEYWORDS[cat].reason,
  }));
  res.json({ success: true, categories: summary });
});

router.post('/re-check/:id', async (req, res) => {
  try {
    const campaign = require('../modules/contentrewards/campaign');
    const result = await campaign.analyzeCampaign(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
