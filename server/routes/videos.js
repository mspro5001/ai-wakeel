const express = require('express');
const router = express.Router();
const path = require('path');
const config = require('../config');
const { db } = require('../database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

router.post('/upload', (req, res) => {
  if (!req.file && !req.files) return res.status(400).json({ success: false, error: 'No file uploaded' });
  const file = req.file || req.files[0];
  const id = uuidv4();
  db.prepare('INSERT INTO videos (id, title, original_path, status) VALUES (?, ?, ?, ?)')
    .run(id, file.originalname, file.path, 'uploaded');
  res.json({ success: true, id, filename: file.originalname, path: file.path });
});

router.post('/process', async (req, res) => {
  const { videoId, action, options } = req.body;
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
  if (!video) return res.status(404).json({ success: false, error: 'Video not found' });
  try {
    const editor = require('../modules/video-editor/editor');
    const result = await editor.process({ action, inputPath: video.original_path, options });
    if (result.success) {
      db.prepare('UPDATE videos SET processed_path = ?, status = ?, metadata = ? WHERE id = ?')
        .run(result.outputPath, 'processed', JSON.stringify({ action, options }), videoId);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', (req, res) => {
  const videos = db.prepare('SELECT * FROM videos ORDER BY created_at DESC').all();
  res.json({ success: true, videos });
});

module.exports = router;
