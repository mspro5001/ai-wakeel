const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CLIENT_KEY = 'awclkpbhlfujxy97';
const CLIENT_SECRET = '0hLg4AOHeErYKObmPUeXh2985kDrLHEL';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ENV_PATH = path.join(__dirname, '..', '..', '.env');
const REDIRECT_URI = 'https://localhost:3000/auth/tiktok/callback';

const AUTH_URL = `https://www.tiktok.com/v2/auth/authorize?client_key=${CLIENT_KEY}&scope=user.info.basic,video.upload,video.publish&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

async function exchangeCode(code) {
  console.log('\n🔄 استبدال الكود بـ Access Token...');
  try {
    const params = new URLSearchParams();
    params.append('client_key', CLIENT_KEY);
    params.append('client_secret', CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', REDIRECT_URI);

    const res = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });

    const data = res.data;
    if (!data.access_token) {
      console.log('❌ فشل:', JSON.stringify(data));
      return null;
    }
    console.log('✅ Access Token:', data.access_token);
    console.log('🔄 Refresh Token:', data.refresh_token || 'لا يوجد');
    console.log('⏳ Expires in:', data.expires_in, 'seconds');
    return data.access_token;
  } catch (err) {
    console.log('❌ خطأ:', err.response?.status, err.response?.data?.error_description || err.response?.data || err.message);
    return null;
  }
}

function saveToEnv(token, refreshToken) {
  let env = fs.readFileSync(ENV_PATH, 'utf8');
  env = env.replace(/TIKTOK_ACCESS_TOKEN=.*/, `TIKTOK_ACCESS_TOKEN=${token}`);
  if (refreshToken) {
    if (env.includes('TIKTOK_REFRESH_TOKEN=')) {
      env = env.replace(/TIKTOK_REFRESH_TOKEN=.*/, `TIKTOK_REFRESH_TOKEN=${refreshToken}`);
    } else {
      env += `\nTIKTOK_REFRESH_TOKEN=${refreshToken}`;
    }
  }
  fs.writeFileSync(ENV_PATH, env);
  console.log('💾 تم حفظ التوكنات في .env');
}

async function main() {
  console.log('🚀 فتح مصادقة TikTok OAuth...\n');

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CHROME_PATH,
    args: ['--start-maximized', '--no-sandbox'],
    defaultViewport: null,
  });

  let page;
  try {
    page = await browser.newPage();

    // Listen for ALL navigation requests to catch the code
    const codePromise = new Promise((resolve) => {
      page.on('request', (req) => {
        const url = req.url();
        if (url.includes('code=')) {
          const match = url.match(/[?&]code=([^&]+)/);
          if (match) resolve(decodeURIComponent(match[1]));
        }
      });
      page.on('framenavigated', () => {
        const url = page.url();
        if (url.includes('code=')) {
          const match = url.match(/[?&]code=([^&]+)/);
          if (match) resolve(decodeURIComponent(match[1]));
        }
      });
      // Also check URL periodically
      const check = setInterval(() => {
        try {
          const url = page.url();
          if (url.includes('code=')) {
            clearInterval(check);
            const match = url.match(/[?&]code=([^&]+)/);
            if (match) resolve(decodeURIComponent(match[1]));
          }
        } catch(e) {}
      }, 1000);
    });

    console.log('🌐 فتح صفحة التفويض...');
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('✅ تم فتح المتصفح');
    console.log('📌 سجّل الدخول ووافق على الصلاحيات (Authorize)');
    console.log('⏳ في انتظار التفويض...\n');

    // Wait up to 5 minutes for the code
    const code = await Promise.race([
      codePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('انتهى الوقت')), 300000))
    ]);

    console.log('\n🔑 تم العثور على الكود:', code);
    await browser.close();

    const token = await exchangeCode(code);
    if (token) {
      saveToEnv(token, null);
      console.log('\n🎉 تم بنجاح!');
      console.log('الوكيل جاهز لرفع فيديوهات TikTok.');
    }

  } catch (err) {
    console.log('❌ خطأ:', err.message);
    console.log('\n⚠️ الطريقة البديلة:');
    console.log('1. افتح هذا الرابط في المتصفح:');
    console.log('   ' + AUTH_URL);
    console.log('2. وافق على الصلاحيات');
    console.log('3. انسخ رابط الخطأ من المتصفح (يحتوي على code=...)');
    console.log('4. أرسله لي');
    if (browser) await browser.close().catch(() => {});
  }

  process.exit(0);
}

main();
