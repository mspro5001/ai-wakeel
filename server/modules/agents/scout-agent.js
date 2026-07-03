const puppeteer = require('puppeteer');
const config = require('../../config');
const { db } = require('../../database');
const logger = require('../../utils/logger');
const { detectHaram, filterCampaigns } = require('../contentrewards/haram-detector');

async function execute(input, context = {}) {
  const { url = 'https://contentrewards.com', autoRejectHaram = true } = input;
  const sessionId = context.sessionId || Date.now().toString();

  logger.info('ScoutAgent', `Starting scout mission for session ${sessionId}`);

  if (!config.contentrewards.username) {
    return { success: false, error: 'Contentrewards not configured', setupRequired: true, agent: 'scout' };
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://contentrewards.com/login', { waitUntil: 'networkidle2', timeout: 30000 });

    await page.type('input[name="email"], input[type="email"], input[name="username"]', config.contentrewards.username);
    if (config.contentrewards.password) {
      await page.type('input[type="password"]', config.contentrewards.password);
    }
    await page.click('button[type="submit"]').catch(() => {});
    await page.waitForTimeout(5000);

    const campaigns = [];
    if (page.url().includes('dashboard') || page.url().includes('contentrewards.com/')) {
      const campaignElements = await page.$$('.campaign-card, .campaign-item, [class*="campaign"]');
      for (const el of campaignElements.slice(0, 20)) {
        const text = await el.evaluate(e => e.textContent).catch(() => '');
        const title = await el.evaluate(e => e.querySelector('h3, h4, .title, [class*="title"]')?.textContent || '').catch(() => '');
        campaigns.push({ text: text.trim().slice(0, 500), title: title.trim(), url: page.url() });
      }
    }

    const filtered = await filterCampaigns(campaigns);

    const foundCampaigns = [];
    for (const c of filtered.halal) {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      db.prepare(`INSERT OR REPLACE INTO contentrewards_campaigns (id, campaign_name, platform, requirements, status, rules_analyzed, compliance_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        id, c.title || 'Campaign', 'contentrewards', JSON.stringify(c), 'halal', 1, c.haramCheck.score
      );
      foundCampaigns.push({ id, title: c.title, text: c.text, haramCheck: c.haramCheck });
    }

    for (const c of filtered.haram) {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      db.prepare(`INSERT OR REPLACE INTO contentrewards_campaigns (id, campaign_name, platform, requirements, status, rules_analyzed, compliance_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        id, c.title || 'Haram Campaign', 'contentrewards', JSON.stringify(c), 'haram_rejected', 1, c.haramCheck.score
      );
    }

    logger.info('ScoutAgent', `Session ${sessionId}: ${filtered.halalCount} halal, ${filtered.haramCount} haram`);

    await browser.close();

    return {
      success: true,
      agent: 'scout',
      sessionId,
      summary: `وجدت ${filtered.total} حملة | حلال: ${filtered.halalCount} | حرام: ${filtered.haramCount}`,
      total: filtered.total,
      halalCount: filtered.halalCount,
      haramCount: filtered.haramCount,
      campaigns: foundCampaigns,
      haramDetails: filtered.haram.map(c => ({
        title: c.title,
        violations: c.haramCheck.violations.map(v => v.reason),
      })),
    };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    logger.error('ScoutAgent', `Session ${sessionId} failed: ${err.message}`);
    return { success: false, agent: 'scout', sessionId, error: err.message };
  }
}

module.exports = { execute };
