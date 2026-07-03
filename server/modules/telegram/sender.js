const config = require('../../config');
const logger = require('../../utils/logger');

async function send({ text, chatId, parseMode }) {
  const bot = require('./bot').getBot();
  if (!bot) return { success: false, error: 'Telegram bot not initialized' };

  try {
    const id = chatId || config.telegram.chatId;
    if (!id) return { success: false, error: 'No chat ID configured' };

    await bot.telegram.sendMessage(id, text, {
      parse_mode: parseMode || 'HTML',
      disable_web_page_preview: true,
    });
    return { success: true };
  } catch (err) {
    logger.error('Telegram', `Send failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function sendVideo({ videoPath, caption, chatId }) {
  const bot = require('./bot').getBot();
  if (!bot) return { success: false, error: 'Telegram bot not initialized' };
  const fs = require('fs');
  if (!videoPath || !fs.existsSync(videoPath)) return { success: false, error: 'Video not found' };

  try {
    const id = chatId || config.telegram.chatId;
    if (!id) return { success: false, error: 'No chat ID configured' };

    await bot.telegram.sendVideo(id, { source: videoPath }, {
      caption: caption || '',
      supports_streaming: true,
    });
    return { success: true };
  } catch (err) {
    logger.error('Telegram', `Send video failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function sendReport(reportLines) {
  if (!reportLines || !reportLines.length) return;
  const lines = [
    `🤖 <b>AI Wakeel - تقرير دوري</b>`,
    `🕐 ${new Date().toLocaleString('ar-EG')}`,
    `──────────────────`,
    ...reportLines.map(l => `• ${l}`),
    ``,
    `✅ النظام يعمل بشكل طبيعي`,
  ];
  return send({ text: lines.join('\n'), parseMode: 'HTML' });
}

module.exports = { send, sendVideo, sendReport };
