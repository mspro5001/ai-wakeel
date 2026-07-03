const express = require('express');
const router = express.Router();
const { db } = require('../database');
const logger = require('../utils/logger');

router.get('/stats', (req, res) => {
  const stats = {
    totalTasks: db.prepare('SELECT COUNT(*) as c FROM tasks').get().c,
    pendingTasks: db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'pending'").get().c,
    completedTasks: db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'completed'").get().c,
    failedTasks: db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'failed'").get().c,
    runningTasks: db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'running'").get().c,
    totalVideos: db.prepare('SELECT COUNT(*) as c FROM videos').get().c,
    totalCampaigns: db.prepare('SELECT COUNT(*) as c FROM contentrewards_campaigns').get().c,
    tiktokPosts: db.prepare("SELECT COUNT(*) as c FROM tiktok_posts WHERE status = 'published'").get().c,
    totalMessages: db.prepare('SELECT COUNT(*) as c FROM whatsapp_messages').get().c,
    halal: db.prepare("SELECT COUNT(*) as c FROM contentrewards_campaigns WHERE status = 'halal'").get().c,
    haram: db.prepare("SELECT COUNT(*) as c FROM contentrewards_campaigns WHERE status LIKE '%haram%'").get().c,
  };
  res.json({ success: true, stats });
});

router.get('/campaigns', (req, res) => {
  const filter = req.query.filter || 'all';
  let campaigns;
  if (filter === 'halal') {
    campaigns = db.prepare("SELECT * FROM contentrewards_campaigns WHERE status = 'halal' ORDER BY created_at DESC LIMIT 50").all();
  } else if (filter === 'haram') {
    campaigns = db.prepare("SELECT * FROM contentrewards_campaigns WHERE status LIKE '%haram%' ORDER BY created_at DESC LIMIT 50").all();
  } else if (filter === 'approved') {
    campaigns = db.prepare("SELECT * FROM contentrewards_campaigns WHERE status LIKE '%approved%' OR status = 'linked_to_tiktok' ORDER BY created_at DESC LIMIT 50").all();
  } else {
    campaigns = db.prepare('SELECT * FROM contentrewards_campaigns ORDER BY created_at DESC LIMIT 50').all();
  }
  res.json({ success: true, campaigns, count: campaigns.length, filter });
});

router.get('/campaigns/:id', (req, res) => {
  const campaign = db.prepare('SELECT * FROM contentrewards_campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  campaign.requirements = campaign.requirements ? JSON.parse(campaign.requirements) : [];
  res.json({ success: true, campaign });
});

router.get('/recent-tasks', (req, res) => {
  const tasks = db.prepare('SELECT id, title, type, status, priority, created_at, completed_at FROM tasks ORDER BY created_at DESC LIMIT 15').all();
  res.json({ success: true, tasks });
});

router.get('/activity', (req, res) => {
  const logs = db.prepare('SELECT * FROM logs ORDER BY created_at DESC LIMIT 30').all();
  const tasks = db.prepare("SELECT id, title, type, status, 'task_update' as module, created_at FROM tasks WHERE created_at > datetime('now', '-1 day') ORDER BY created_at DESC LIMIT 20").all();
  const combined = [...logs, ...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 30);
  res.json({ success: true, activity: combined });
});

router.get('/tiktok-posts', (req, res) => {
  const posts = db.prepare('SELECT * FROM tiktok_posts ORDER BY created_at DESC LIMIT 20').all();
  res.json({ success: true, posts });
});

router.get('/system-health', (req, res) => {
  const config = require('../config');
  const checks = {
    database: true,
    email: !!config.email.pass && config.email.pass !== 'YOUR_APP_PASSWORD',
    tiktok: !!config.tiktok.accessToken,
    nvidia: !!config.nvidia.apiKey,
    contentrewards: !!config.contentrewards.username,
    telegram: !!config.telegram.botToken,
  };
  res.json({ success: true, status: checks, all_ok: Object.values(checks).every(Boolean) });
});

router.post('/run-pipeline', async (req, res) => {
  const { videoPath, caption, campaignLink } = req.body;
  const io = global.io || null;
  try {
    const orchestrator = require('../modules/agents/orchestrator');
    const result = await orchestrator.runPipeline({ videoPath, caption, campaignLink }, io);
    res.json(result);
  } catch (err) {
    logger.error('Dashboard', `Pipeline run failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/run-agent', async (req, res) => {
  const { agentName, params } = req.body;
  const allowed = ['scout', 'legal', 'publisher', 'reporter'];
  if (!allowed.includes(agentName)) {
    return res.status(400).json({ success: false, error: `Unknown agent: ${agentName}` });
  }
  try {
    const agent = require(`../modules/agents/${agentName}-agent`);
    const result = await agent.execute(params || {}, { io: global.io || null });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
