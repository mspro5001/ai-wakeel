const { db } = require('../../database');
const { detectHaram } = require('./haram-detector');
const logger = require('../../utils/logger');

async function analyzeCampaign(campaignId) {
  const campaign = db.prepare('SELECT * FROM contentrewards_campaigns WHERE id = ?').get(campaignId);
  if (!campaign) return { success: false, error: 'Campaign not found' };

  const requirements = campaign.requirements ? JSON.parse(campaign.requirements) : [];
  const textToCheck = requirements.map(r => r.text || r.title || '').join(' ') || campaign.campaign_name || '';

  const haramCheck = await detectHaram(textToCheck);

  return {
    success: true,
    campaign: {
      ...campaign,
      haramCheck,
    },
    compliance: analyzeRequirements(campaign, haramCheck),
  };
}

async function listCampaigns(filter = 'all') {
  let campaigns;
  if (filter === 'halal') {
    campaigns = db.prepare("SELECT * FROM contentrewards_campaigns WHERE status = 'halal' ORDER BY created_at DESC").all();
  } else if (filter === 'haram') {
    campaigns = db.prepare("SELECT * FROM contentrewards_campaigns WHERE status LIKE '%haram%' ORDER BY created_at DESC").all();
  } else {
    campaigns = db.prepare('SELECT * FROM contentrewards_campaigns ORDER BY created_at DESC').all();
  }

  return { success: true, campaigns, count: campaigns.length, filter };
}

async function getStats() {
  const halal = db.prepare("SELECT COUNT(*) as c FROM contentrewards_campaigns WHERE status = 'halal'").get().c;
  const haram = db.prepare("SELECT COUNT(*) as c FROM contentrewards_campaigns WHERE status LIKE '%haram%'").get().c;
  const total = db.prepare('SELECT COUNT(*) as c FROM contentrewards_campaigns').get().c;

  return { success: true, stats: { total, halal, haram, halalPercent: total ? Math.round(halal / total * 100) : 0 } };
}

function analyzeRequirements(campaign, haramCheck) {
  const requirements = campaign.requirements ? JSON.parse(campaign.requirements) : [];
  return {
    platform: campaign.platform,
    ruleCount: requirements.length,
    status: campaign.status,
    haram: haramCheck,
    summary: requirements.map(r => ({ text: r.text?.slice(0, 100) })),
  };
}

module.exports = { analyzeCampaign, listCampaigns, getStats };
