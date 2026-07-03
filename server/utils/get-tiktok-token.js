const axios = require('axios');
const config = require('../config');

const CLIENT_KEY = config.tiktok.clientKey;
const CLIENT_SECRET = config.tiktok.clientSecret;
const REDIRECT_URI = 'https://localhost:3000/auth/tiktok/callback';

if (!CLIENT_KEY || !CLIENT_SECRET) {
  console.log('ERROR: TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET not set in .env');
  process.exit(1);
}

const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${CLIENT_KEY}&scope=user.info.basic,video.upload,video.publish&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

console.log('\n==================== TikTok Access Token ====================');
console.log('1. افتح هذا الرابط في المتصفح (انسخه والصقه):\n');
console.log(authUrl);
console.log('\n2. سجّل الدخول إلى TikTok ووافق على الصلاحيات');
console.log('3. سيتم تحويلك إلى رابط مثل:');
console.log('   https://localhost:3000/auth/tiktok/callback?code=xxxx&scopes=xxxx');
console.log('4. انسخ قيمة code من الرابط (الجزء بعد ?code= وقبل &scopes)');
console.log('5. الصق الـ code هنا:\n');

process.stdin.once('data', async (data) => {
  const code = data.toString().trim();
  if (!code) {
    console.log('ما دخلت كود. شغّل السكريبت مرة ثانية.');
    process.exit(1);
  }

  try {
    const res = await axios.post('https://open-api.tiktok.com/oauth/access_token/', null, {
      params: {
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      },
    });

    const { access_token, refresh_token, expires_in } = res.data.data;
    console.log('\n==================== نجاح! ====================');
    console.log(`Access Token:  ${access_token}`);
    console.log(`Refresh Token: ${refresh_token}`);
    console.log(`Expires in:    ${expires_in} seconds\n`);
    console.log('انسخ Access Token واحفظه في .env عند TIKTOK_ACCESS_TOKEN\n');
  } catch (err) {
    console.log('\nERROR:', err.response?.data?.message || err.message);
    console.log('\nجرب ثانية أو تأكد أن الكود صحيح.');
  }

  process.exit(0);
});
