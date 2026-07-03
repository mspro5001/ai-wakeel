const fs = require('fs');
const path = require('path');
const config = require('../config');

const logFile = path.join(config.paths.logs, `wakeel-${new Date().toISOString().slice(0, 10)}.log`);

function log(level, module, message, data = null) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, module, message, data };
  const line = JSON.stringify(entry);

  try {
    const method = level === 'error' ? 'error' : 'log';
    console[method](`[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`);
  } catch (e) {}

  try {
    fs.appendFileSync(logFile, line + '\n');
  } catch (e) {}
}

module.exports = {
  error: (module, msg, data) => log('error', module, msg, data),
  warn: (module, msg, data) => log('warn', module, msg, data),
  info: (module, msg, data) => log('info', module, msg, data),
  debug: (module, msg, data) => log('debug', module, msg, data),
};
