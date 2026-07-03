const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const dbPath = path.join(config.paths.db, 'wakeel.db');
let db = null;
let SQL = null;

async function initDatabase() {
  SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');
  initializeSchema();
  flush();
  return db;
}

function getDatabase() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

function flush() {
  if (db) {
    const data = db.export();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

function initializeSchema() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, description TEXT, type TEXT, status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'medium', source TEXT DEFAULT 'manual', input_data TEXT, output_data TEXT, error TEXT, scheduled_at TEXT, started_at TEXT, completed_at TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, title TEXT, original_path TEXT, processed_path TEXT, status TEXT DEFAULT 'pending', task_id TEXT, metadata TEXT DEFAULT '{}', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS whatsapp_messages (id TEXT PRIMARY KEY, from_number TEXT, message_body TEXT, message_type TEXT DEFAULT 'text', direction TEXT DEFAULT 'incoming', status TEXT DEFAULT 'received', task_id TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS tiktok_posts (id TEXT PRIMARY KEY, video_path TEXT, caption TEXT, status TEXT DEFAULT 'pending', platform_post_id TEXT, analytics TEXT DEFAULT '{}', scheduled_at TEXT, posted_at TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS contentrewards_campaigns (id TEXT PRIMARY KEY, campaign_name TEXT, platform TEXT, requirements TEXT, status TEXT DEFAULT 'pending', rules_analyzed INTEGER DEFAULT 0, compliance_score REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT DEFAULT 'info', module TEXT, message TEXT, data TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT DEFAULT (datetime('now')))`,
  ];
  tables.forEach(t => db.run(t));
}

// better-sqlite3 compatible wrapper
const db_api = {
  prepare: (sql) => ({
    run: (...params) => { db.run(sql, params); flush(); return { changes: db.getRowsModified() }; },
    get: (...params) => {
      const stmt = db.prepare(sql);
      if (params.length) stmt.bind(params);
      const result = stmt.step() ? stmt.getAsObject() : undefined;
      stmt.free();
      return result;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      if (params.length) stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    },
  }),
  exec: (sql) => { db.run(sql); flush(); },
};

module.exports = { initDatabase, getDatabase, flush, db: db_api };
