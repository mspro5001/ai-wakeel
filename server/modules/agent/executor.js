const { v4: uuidv4 } = require('uuid');
const { db } = require('../../database');
const logger = require('../../utils/logger');

async function execute(task, emitUpdate = null) {
  const taskId = task.id || uuidv4();

  db.prepare(`INSERT OR REPLACE INTO tasks (id, title, description, type, status, priority, source, input_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    taskId, task.title || task.action, task.description || '', task.type, 'running', task.priority || 'medium', task.source || 'manual', JSON.stringify(task)
  );

  let result;
  try {
    switch (task.type) {
      case 'video_edit':
        const videoEditor = require('../video-editor/editor');
        result = await videoEditor.process(task.params);
        break;
      case 'email_send':
        const emailSender = require('../email/sender');
        result = await emailSender.send(task.params);
        break;
      case 'email_register':
        const registrar = require('../email/registrar');
        result = await registrar.register(task.params);
        break;
      case 'tiktok_upload':
        const tiktok = require('../tiktok/uploader');
        result = await tiktok.upload(task.params);
        break;
      case 'whatsapp_send':
        const whatsapp = require('../whatsapp/client');
        result = await whatsapp.send(task.params);
        break;
      case 'campaign_analyze':
        const legal = require('../legal/analyzer');
        result = await legal.analyze(task.params);
        break;
      case 'contentrewards':
        const cr = require('../contentrewards/scraper');
        result = await cr.process(task.params);
        break;
      case 'agent_pipeline':
        const orchestrator = require('../agents/orchestrator');
        result = await orchestrator.runPipeline(task.params, global.io);
        break;
      case 'browser_automate':
        const browser = require('../../utils/helpers');
        result = await browser.automate(task.params);
        break;
      default:
        result = { success: false, message: `Unknown task type: ${task.type}` };
    }

    db.prepare(`UPDATE tasks SET status = ?, output_data = ?, completed_at = ? WHERE id = ?`)
      .run('completed', JSON.stringify(result), new Date().toISOString(), taskId);
  } catch (err) {
    logger.error('Executor', `Task ${taskId} failed`, err.message);
    db.prepare(`UPDATE tasks SET status = ?, error = ?, updated_at = ? WHERE id = ?`)
      .run('failed', err.message, new Date().toISOString(), taskId);
    result = { success: false, error: err.message };
  }

  if (emitUpdate) {
    emitUpdate({ type: 'task_update', taskId, status: result.success ? 'completed' : 'failed', result });
  }

  return result;
}

module.exports = { execute };
