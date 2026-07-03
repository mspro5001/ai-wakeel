const puppeteer = require('puppeteer');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function ask(q) { return new Promise(r => rl.question(q, r)); }

async function registerTikTok() {
  console.log('🚀 فتح صفحة تسجيل TikTok Developer...\n');

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CHROME_PATH,
    args: ['--start-maximized', '--no-sandbox'],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto('https://developers.tiktok.com/registration/', { waitUntil: 'networkidle2' });

  console.log('✅ تم فتح صفحة التسجيل');
  console.log('📧 البريد المستخدم: islamsaib100@gmail.com');
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('📋 التعليمات:');
  console.log('1. أدخل بريدك: islamsaib100@gmail.com');
  console.log('2. أدخل اسماً للمطور (مثلاً: AI Wakeel)');
  console.log('3. اختر كلمة مرور قوية');
  console.log('4. أدخل رمز التحقق الذي سيصلك على Gmail');
  console.log('5. أكمل التوثيق برقم الهاتف إن طُلب');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('ℹ️  المتصفح مفتوح أمامك - أكمل التسجيل يدوياً');
  console.log('ℹ️  بعد الانتهاء، اكتب "done" هنا واضغط Enter');
  console.log('');

  const answer = await ask('اكتب "done" بعد إتمام التسجيل: ');

  const currentUrl = page.url();
  console.log(`\n🌐 الرابط الحالي: ${currentUrl}`);

  await browser.close();
  rl.close();

  if (currentUrl.includes('dashboard') || currentUrl.includes('developer') || answer === 'done') {
    console.log('\n✅ ممتاز! الآن خذ الـ API Keys:');
    console.log('   1. اذهب إلى https://developers.tiktok.com/apps');
    console.log('   2. أنشئ تطبيق → اختر "Video Upload"');
    console.log('   3. املأ البيانات وانشئ التطبيق');
    console.log('   4. انسخ هذه البيانات:');
    console.log('      ┌─────────────────────────────────┐');
    console.log('      │ Client Key     = Client Key     │');
    console.log('      │ Client Secret  = Client Secret  │');
    console.log('      │ Access Token   = Access Token   │');
    console.log('      └─────────────────────────────────┘');
    console.log('   5. أعطني البيانات لأضيفها في ملف .env');
    console.log('');
    console.log('📌 أو أضفها بنفسك في ملف .env:');
    console.log('   TIKTOK_CLIENT_KEY=your_key');
    console.log('   TIKTOK_CLIENT_SECRET=your_secret');
    console.log('   TIKTOK_ACCESS_TOKEN=your_token');
  } else {
    console.log('\n⚠️  لم يكتمل التسجيل.');
    console.log('جرب يدوياً: https://developers.tiktok.com/registration/');
  }
}

registerTikTok().catch(err => {
  console.error('❌ خطأ:', err.message);
  rl.close();
  process.exit(1);
});
