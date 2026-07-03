const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('./logger');

async function automate(params) {
  const { url, actions = [] } = params;
  if (!url) return { success: false, error: 'URL required' };
  
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          await page.click(action.selector);
          break;
        case 'type':
          await page.type(action.selector, action.value);
          break;
        case 'wait':
          await page.waitForTimeout(action.ms || 2000);
          break;
        case 'screenshot':
          await page.screenshot({ path: action.path || `${config.paths.storage}/${uuidv4()}.png` });
          break;
        case 'extract':
          action.result = await page.evaluate((sel) => document.querySelector(sel)?.textContent, action.selector);
          break;
      }
    }
    
    await browser.close();
    return { success: true, url, actions };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    return { success: false, error: err.message };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { automate, sleep };
