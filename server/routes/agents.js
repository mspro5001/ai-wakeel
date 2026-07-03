const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

router.post('/pipeline', async (req, res) => {
  const { videoPath, caption, campaignLink } = req.body;
  try {
    const orchestrator = require('../modules/agents/orchestrator');
    const result = await orchestrator.runPipeline({ videoPath, caption, campaignLink }, req.io || null);
    res.json(result);
  } catch (err) {
    logger.error('AgentsRoute', `Pipeline failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/run/:agentName', async (req, res) => {
  const { agentName } = req.params;
  const allowed = ['scout', 'legal', 'publisher', 'reporter'];
  if (!allowed.includes(agentName)) {
    return res.status(400).json({ success: false, error: `Unknown agent: ${agentName}. Allowed: ${allowed.join(', ')}` });
  }
  try {
    const agent = require(`../modules/agents/${agentName}-agent`);
    const result = await agent.execute(req.body, { io: req.io || null });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
