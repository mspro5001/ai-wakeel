const { getDatabase } = require('./database');
const logger = require('./utils/logger');

console.log('🤖 AI Wakeel - Setup');
console.log('====================');
console.log('');

const db = getDatabase();
console.log('✅ Database initialized');

require('./config');
console.log('✅ Configuration loaded');

const defaultSettings = {
  admin_password: 'wakeel123',
  report_interval: '3',
  last_report_time: null,
};

const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(defaultSettings)) {
  insert.run(key, value);
}
console.log('✅ Default settings saved');

console.log('');
console.log('📋 Accounts to activate:');
console.log('  1. Gmail App Password → myaccount.google.com/apppasswords');
console.log('  2. NVIDIA NIM API Key → build.nvidia.com (free)');
console.log('  3. WhatsApp Business → business.whatsapp.com');
console.log('  4. TikTok Developer → developers.tiktok.com');
console.log('  5. ContentRewards → contentrewards.com');
console.log('  6. Render.com → render.com (free hosting)');
console.log('');
console.log('🚀 Run "npm start" to launch the server');
