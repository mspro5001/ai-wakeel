const { v4: uuidv4 } = require('uuid');
const { db } = require('../../database');
const logger = require('../../utils/logger');

async function runPipeline(input, io = null) {
  const sessionId = uuidv4().slice(0, 12);
  const context = { sessionId, io };

  logger.info('Orchestrator', `Starting pipeline session ${sessionId}`);

  const taskId = uuidv4();
  db.prepare(`INSERT INTO tasks (id, title, description, type, status, priority, input_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    taskId, 'Agent Pipeline', `4-Agent pipeline session ${sessionId}`,
    'agent_pipeline', 'running', 'high', JSON.stringify(input)
  );

  const emit = (data) => {
    if (io) io.emit('pipeline_update', { sessionId, ...data });
  };

  emit({ stage: 'starting', message: '🚀 بدء تشغيل الوكلاء الأربعة' });

  const results = {};

  emit({ stage: 'scout', message: '🔍 الوكيل 1: استكشاف الموقع والتسجيل...' });
  const scout = await runAgent('scout', input, context);
  results.scout = scout;
  emit({ stage: 'scout_done', message: scout.summary || 'تم الاستكشاف', result: scout });

  if (!scout.success) {
    emit({ stage: 'failed', message: '❌ فشل وكيل الاستكشاف' });
    return finalize(sessionId, taskId, results, 'failed', io);
  }

  if (!scout.campaigns || scout.campaigns.length === 0) {
    emit({ stage: 'no_campaigns', message: '⚠️ لا توجد حملات مناسبة، إلغاء المهام التالية' });
    return finalize(sessionId, taskId, results, 'completed', io, 'لا توجد حملات مناسبة');
  }

  emit({ stage: 'legal', message: `⚖️ الوكيل 2: تحليل شروط ${scout.campaigns.length} حملة...` });
  const campaignText = scout.campaigns.map(c => `${c.title}: ${c.text}`).join('\n---\n');
  const campaignId = scout.campaigns[0]?.id;
  const legal = await runAgent('legal', { text: campaignText, campaignId }, context);
  results.legal = legal;
  emit({ stage: 'legal_done', message: legal.summary || 'تم التحليل', result: legal });

  if (!legal.success) {
    emit({ stage: 'failed', message: '❌ فشل وكيل الشروط' });
    return finalize(sessionId, taskId, results, 'failed', io);
  }

  emit({ stage: 'publisher', message: '📱 الوكيل 3: النشر على TikTok...' });
  const publisher = await runAgent('publisher', {
    videoPath: input.videoPath || null,
    caption: legal.modifiedContent || input.caption || 'تم النشر عبر AI Wakeel 🤖',
    campaignLink: input.campaignLink || scout.campaigns[0]?.url || null,
    campaignId,
  }, context);
  results.publisher = publisher;
  emit({ stage: 'publisher_done', message: publisher.summary || 'تم النشر', result: publisher });

  emit({ stage: 'reporter', message: '📊 الوكيل 4: تلخيص التقرير النهائي...' });
  const reporter = await runAgent('reporter', { results }, context);
  results.reporter = reporter;
  emit({ stage: 'reporter_done', message: '✅ تم إنشاء التقرير', result: reporter });

  emit({ stage: 'complete', message: '🎉 تم إنجاز جميع المهام', report: reporter?.report });

  return finalize(sessionId, taskId, results, 'completed', io);
}

async function runAgent(name, input, context) {
  try {
    const agent = require(`./${name}-agent`);
    const result = await agent.execute(input, context);
    return result;
  } catch (err) {
    logger.error('Orchestrator', `Agent ${name} error: ${err.message}`);
    return { success: false, agent: name, error: err.message };
  }
}

function finalize(sessionId, taskId, results, status, io, customMessage) {
  let summary = customMessage;
  if (!summary) {
    const scout = results.scout;
    const legal = results.legal;
    const publisher = results.publisher;
    const parts = [];
    if (scout?.success) parts.push(`استكشاف: ${scout.halalCount || 0} حملة`);
    if (legal?.success) parts.push(`تحليل: ${legal.score}/100`);
    if (publisher?.success) parts.push(publisher.tiktok ? 'نشر TikTok' : 'ربط');
    summary = parts.length ? parts.join(' | ') : (status === 'failed' ? 'فشلت بعض المهام' : 'اكتمل');
  }

  db.prepare(`UPDATE tasks SET status = ?, output_data = ?, completed_at = ? WHERE id = ?`)
    .run(status, JSON.stringify({ results, summary }), new Date().toISOString(), taskId);

  logger.info('Orchestrator', `Session ${sessionId} ${status}: ${summary}`);

  return {
    success: status === 'completed',
    sessionId,
    summary,
    status,
    results,
  };
}

module.exports = { runPipeline };
