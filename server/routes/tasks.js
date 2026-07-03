const express = require('express');
const router = express.Router();
const { db } = require('../database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50').all();
  res.json({ success: true, tasks });
});

router.post('/', (req, res) => {
  const { title, description, type, priority, params } = req.body;
  if (!title || !type) return res.status(400).json({ success: false, error: 'Title and type required' });

  const id = uuidv4();
  db.prepare("INSERT INTO tasks (id, title, description, type, status, priority, input_data) VALUES (?, ?, ?, ?, 'pending', ?, ?)")
    .run(id, title, description || '', type, priority || 'medium', JSON.stringify(params || {}));

  logger.info('Tasks', `Created task: ${title}`, { id, type });
  res.json({ success: true, id, title, type, status: 'pending' });
});

router.get('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  res.json({ success: true, task });
});

router.post('/:id/execute', async (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  try {
    const executor = require('../modules/agent/executor');
    const result = await executor.execute(JSON.parse(task.input_data || '{}'));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
