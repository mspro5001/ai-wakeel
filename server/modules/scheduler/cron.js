const cron = require('node-cron');
const { db } = require('../../database');
const logger = require('../../utils/logger');

function start(io) {
  logger.info('Scheduler', 'Starting scheduler...');
  cron.schedule('0 */3 * * *', async () => {
    logger.info('Scheduler', 'Running 3-hour report cycle');
    await generateAndSendReport(io);
  });
  cron.schedule('* * * * *', async () => {
    await processPendingTasks();
  });
  cron.schedule('0 0 * * *', async () => {
    await cleanupOldLogs();
  });
  logger.info('Scheduler', 'Scheduler started: reports every 3h, tasks every 1m, cleanup daily');
}

async function generateAndSendReport(io) {
  const recentTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE created_at > datetime('now', '-3 hours')").get();
  const failedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'failed' AND created_at > datetime('now', '-24 hours')").get();
  const pendingTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get();
  const videosProcessed = db.prepare("SELECT COUNT(*) as count FROM videos WHERE created_at > datetime('now', '-3 hours')").get();

  const lines = [
    `AI Wakeel - ${new Date().toLocaleString('ar-SA')}`,
    `Tasks (3h): ${recentTasks.count} | Pending: ${pendingTasks.count} | Failed: ${failedTasks.count}`,
    `Videos: ${videosProcessed.count}`,
    `System: Active`,
  ];

  logger.info('Scheduler', 'Report generated', lines);
  if (io) io.emit('report', lines.join('\n'));

  try { const tg = require('../telegram/sender'); await tg.sendReport(lines); } catch (e) {}
  try {
    const email = require('../email/sender');
    const config = require('../../config');
    if (config.email.pass && config.email.pass !== 'YOUR_APP_PASSWORD') {
      await email.send({ to: config.email.user, subject: 'AI Wakeel Report', text: lines.join('\n') });
    }
  } catch (e) {}

  db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
    .run('last_report_time', new Date().toISOString(), new Date().toISOString());
}

async function processPendingTasks() {
  const pending = db.prepare("SELECT * FROM tasks WHERE status = 'pending' AND (scheduled_at IS NULL OR scheduled_at <= ?) LIMIT 5")
    .all(new Date().toISOString());
  for (const task of pending) {
    db.prepare('UPDATE tasks SET status = ?, started_at = ? WHERE id = ?')
      .run('running', new Date().toISOString(), task.id);
    try {
      const executor = require('../agent/executor');
      await executor.execute(JSON.parse(task.input_data || '{}'));
    } catch (err) {
      logger.error('Scheduler', `Task ${task.id} failed`, err.message);
    }
  }
}

async function cleanupOldLogs() {
  const result = db.prepare("DELETE FROM logs WHERE created_at < datetime('now', '-30 days')").run();
  logger.info('Scheduler', `Cleanup: ${result.changes} old entries removed`);
}

module.exports = { start, generateAndSendReport };
