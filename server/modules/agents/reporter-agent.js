const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');

async function execute(input, context = {}) {
  const { results } = input;
  const sessionId = context.sessionId || Date.now().toString();
  const io = context.io || null;

  logger.info('ReporterAgent', `Generating report for session ${sessionId}`);

  const scoutResult = results?.scout || {};
  const legalResult = results?.legal || {};
  const publisherResult = results?.publisher || {};

  const report = {
    sessionId,
    timestamp: new Date().toISOString(),
    status: 'completed',
    agents: {
      scout: scoutResult.success ? '✅' : '❌',
      legal: legalResult.success ? '✅' : '❌',
      publisher: publisherResult.success ? '✅' : '❌',
    },
    summary: generateSummary(scoutResult, legalResult, publisherResult),
    details: {
      scout: scoutResult.summary || 'لم ينفذ',
      legal: legalResult.summary || 'لم ينفذ',
      publisher: publisherResult.summary || 'لم ينفذ',
    },
    output: {
      campaigns: scoutResult.campaigns || [],
      legalScore: legalResult.score ?? '-',
      tiktokPost: publisherResult.tiktok?.postId || '-',
      linkedCampaign: publisherResult.linkedCampaign || '-',
    },
  };

  if (config.nvidia.apiKey) {
    try {
      const prompt = `لخص تقرير وكيل ذكاء اصطناعي بالعربية. البيانات:\n${JSON.stringify(report, null, 2)}\n\nأعد تلخيصاً جميلاً بالعربية الفصحى مناسب لإرساله في رسالة (لا تزيد عن 150 كلمة). اذكر الإنجازات والأخطاء إن وجدت.`;
      const response = await axios.post(`${config.nvidia.baseUrl}/llm/chat`, {
        messages: [{ role: 'user', content: prompt }],
        model: 'meta/llama-3.2-3b-instruct',
        temperature: 0.3,
      }, { headers: { Authorization: `Bearer ${config.nvidia.apiKey}` } });
      report.aiSummary = response.data.choices[0].message.content.trim();
    } catch (err) {
      logger.warn('ReporterAgent', 'NVIDIA summary failed, using template');
    }
  }

  if (!report.aiSummary) {
    report.aiSummary = generateTemplateSummary(report, scoutResult, legalResult, publisherResult);
  }

  report.formattedMessage = formatTelegramMessage(report);

  const { db } = require('../../database');
  const reportId = 'rpt_' + Date.now().toString();
  db.prepare(`INSERT OR REPLACE INTO tasks (id, title, description, type, status, priority, output_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    reportId, `Agent Report ${new Date().toLocaleDateString('ar-SA')}`, report.aiSummary,
    'agent_report', 'completed', 'medium', JSON.stringify(report)
  );

  try {
    const bot = require('../telegram/bot').getBot();
    if (bot) {
      await bot.telegram.sendMessage(config.telegram.chatId || process.env.TELEGRAM_CHAT_ID, report.formattedMessage, {
        parse_mode: 'Markdown',
      });
      logger.info('ReporterAgent', 'Report sent via Telegram');
    }
  } catch (err) {
    logger.warn('ReporterAgent', `Telegram send failed: ${err.message}`);
  }

  if (io) {
    io.emit('agent_report', report);
  }

  logger.info('ReporterAgent', `Report ${sessionId} generated`);

  return {
    success: true,
    agent: 'reporter',
    sessionId,
    report,
    aiSummary: report.aiSummary,
    formattedMessage: report.formattedMessage,
  };
}

function generateSummary(scout, legal, publisher) {
  const parts = [];
  if (scout.success) parts.push(`وجد ${scout.halalCount || 0} حملة حلال`);
  if (legal.success) parts.push(legal.shariaCompliant ? 'جميعها متوافقة شرعاً' : 'بعضها يحتاج تعديلاً');
  if (publisher.success && publisher.tiktok) parts.push('نشر على TikTok');
  return parts.length ? parts.join(' | ') : 'لم تكتمل جميع المهام';
}

function generateTemplateSummary(report, scout, legal, publisher) {
  let msg = `📊 تقرير الجلسة ${report.sessionId.slice(-6)}\n\n`;
  msg += `🔍 وكيل الاستكشاف: ${scout.success ? `عثر على ${scout.halalCount || 0} حملة حلال` : 'فشل'}\n`;
  msg += `⚖️ وكيل الشروط: ${legal.success ? `التقييم ${legal.score}/100` : 'فشل'}\n`;
  msg += `📱 وكيل النشر: ${publisher.success && publisher.tiktok ? `نشر بنجاح` : publisher.success ? 'تم الربط' : 'فشل'}\n`;
  msg += `\n📌 الإجمالي: ${report.status === 'completed' ? '✅ تمت جميع المهام بنجاح' : '⚠️ بعض المهام لم تكتمل'}`;
  return msg;
}

function formatTelegramMessage(report) {
  const emoji = report.status === 'completed' ? '✅' : '⚠️';
  let msg = `${emoji} *تقرير وكيل AI Wakeel*\n\n`;
  msg += `🆔 الجلسة: \`${report.sessionId.slice(-8)}\`\n`;
  msg += `🕐 الوقت: ${new Date().toLocaleString('ar-SA')}\n\n`;

  msg += `━━━ *الوكلاء* ━━━\n`;
  msg += `🔍 الاستكشاف: ${report.agents.scout} ${report.details.scout}\n`;
  msg += `⚖️ القانوني: ${report.agents.legal} ${report.details.legal}\n`;
  msg += `📱 النشر: ${report.agents.publisher} ${report.details.publisher}\n\n`;

  msg += `━━━ *النتائج* ━━━\n`;
  msg += `📋 الحملات: ${report.output.campaigns.length}\n`;
  msg += `📊 التقييم: ${report.output.legalScore}\n`;
  if (report.output.tiktokPost !== '-') msg += `🎬 TikTok: \`${report.output.tiktokPost}\`\n`;
  msg += `\n${report.aiSummary}`;

  return msg;
}

module.exports = { execute };
