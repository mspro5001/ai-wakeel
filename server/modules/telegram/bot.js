const config = require('../../config');
const logger = require('../../utils/logger');

let bot = null;

async function init() {
  if (!config.telegram.botToken) {
    logger.warn('Telegram', 'Bot token not configured');
    return null;
  }

  const { Telegraf } = require('telegraf');
  bot = new Telegraf(config.telegram.botToken);

  bot.start((ctx) => ctx.reply('مرحباً بك في AI Wakeel 🤖\nأرسل /help لمعرفة الأوامر'));
  
  bot.help((ctx) => ctx.reply(
    '📋 الأوامر المتاحة:\n' +
    '/start - بدء المحادثة\n' +
    '/help - عرض المساعدة\n' +
    '/status - حالة النظام\n' +
    '/stats - إحصائيات المهام\n' +
    '/id - معرف المحادثة'
  ));

  bot.command('status', async (ctx) => {
    try {
      const { db } = require('../../database');
      const tasks = db.prepare('SELECT COUNT(*) as c FROM tasks').get();
      const pending = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'pending'").get();
      const failed = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'failed'").get();
      ctx.reply(
        `🤖 *AI Wakeel - Status*\n\n` +
        `Tasks: ${tasks.c}\n` +
        `Pending: ${pending.c}\n` +
        `Failed: ${failed.c}\n` +
        `Uptime: ${Math.floor(process.uptime() / 60)}m`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      ctx.reply(`❌ خطأ: ${e.message}`);
    }
  });

  bot.command('stats', async (ctx) => {
    try {
      const { db } = require('../../database');
      const total = db.prepare('SELECT COUNT(*) as c FROM tasks').get();
      const completed = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'completed'").get();
      const failed = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'failed'").get();
      const pending = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'pending'").get();
      const videos = db.prepare('SELECT COUNT(*) as c FROM videos').get();
      ctx.reply(
        `📊 *AI Wakeel - Stats*\n\n` +
        `📋 Tasks: ${total.c}\n` +
        `✅ Completed: ${completed.c}\n` +
        `❌ Failed: ${failed.c}\n` +
        `⏳ Pending: ${pending.c}\n` +
        `🎬 Videos: ${videos.c}`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      ctx.reply(`❌ خطأ: ${e.message}`);
    }
  });

  bot.command('id', (ctx) => ctx.reply(`🆔 Chat ID: \`${ctx.chat.id}\``, { parse_mode: 'Markdown' }));

  bot.on('text', (ctx) => {
    if (!ctx.message.text.startsWith('/')) {
      ctx.reply('أرسل /help لعرض الأوامر المتاحة');
    }
  });

  bot.launch().then(() => {
    logger.info('Telegram', 'Bot started with polling');
  }).catch((err) => {
    logger.error('Telegram', `Bot launch failed: ${err.message}`);
    bot = null;
  });

  return bot;
}

function getBot() {
  return bot;
}

module.exports = { init, getBot };
