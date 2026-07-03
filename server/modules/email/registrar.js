const puppeteer = require('puppeteer');
const logger = require('../../utils/logger');

async function register(params) {
  const { url, email, password, name, fields = {} } = params;
  if (!url) return { success: false, error: 'URL is required' };

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const emailField = await page.$('input[type="email"], input[name*="email" i], input[placeholder*="email" i], input[id*="email" i]');
    if (emailField && email) {
      await emailField.type(email);
    }

    const passField = await page.$('input[type="password"], input[name*="pass" i], input[placeholder*="pass" i]');
    if (passField && password) {
      await passField.type(password);
    }

    for (const [selector, value] of Object.entries(fields)) {
      try {
        const el = await page.$(selector);
        if (el) await el.type(value);
      } catch (e) {}
    }

    const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("تسجيل"), button:has-text("اشتراك"), button:has-text("Register"), button:has-text("Sign Up")');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }

    const pageUrl = page.url();
    logger.info('EmailRegistrar', `Completed registration at ${url}`);

    await browser.close();
    return { success: true, url, registered: true, finalUrl: pageUrl, email };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    logger.error('EmailRegistrar', `Registration failed for ${url}`, err.message);
    return { success: false, error: err.message, url };
  }
}

module.exports = { register };
