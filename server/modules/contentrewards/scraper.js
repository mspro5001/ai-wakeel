const puppeteer = require('puppeteer');
const config = require('../../config');
const logger = require('../../utils/logger');
const { db } = require('../../database');
const { detectHaram, filterCampaigns } = require('./haram-detector');

async function process(params) {
  const { action = 'check', url = 'https://contentrewards.com', autoRejectHaram = true } = params;

  if (!config.contentrewards.username) {
    return { success: false, error: 'Contentrewards not configured', setupRequired: true };
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://contentrewards.com/login', { waitUntil: 'networkidle2' });

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

    for (const c of filtered.halal) {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      db.prepare(`INSERT OR REPLACE INTO contentrewards_campaigns (id, campaign_name, platform, requirements, status, rules_analyzed, compliance_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        id, c.title || 'Campaign', 'contentrewards', JSON.stringify(c), 'halal', 1, c.haramCheck.score
      );
    }

    for (const c of filtered.haram) {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      db.prepare(`INSERT OR REPLACE INTO contentrewards_campaigns (id, campaign_name, platform, requirements, status, rules_analyzed, compliance_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        id, c.title || 'Haram Campaign', 'contentrewards', JSON.stringify(c), 'haram_rejected', 1, c.haramCheck.score
      );
    }

    logger.info('ContentRewards',
      `Checked: ${filtered.total} campaigns | Halal: ${filtered.halalCount} | Haram rejected: ${filtered.haramCount}`
    );

    await browser.close();

    return {
      success: true,
      total: filtered.total,
      halal: filtered.halalCount,
      haram: filtered.haramCount,
      autoRejectHaram,
      halalCampaigns: autoRejectHaram ? filtered.halal : filtered.all,
      haramDetails: filtered.haram.map(c => ({
        title: c.title,
        violations: c.haramCheck.violations.map(v => v.reason),
        score: c.haramCheck.score,
      })),
    };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    logger.error('ContentRewards', 'Scraping failed', err.message);
    return { success: false, error: err.message, campaigns: [] };
  }
}

module.exports = { process };
