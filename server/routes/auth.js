const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config');

router.post('/login', (req, res) => {
  const { password } = req.body;
  const defaultPass = process.env.ADMIN_PASSWORD || 'wakeel123';
  if (password !== defaultPass) {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }
  const token = jwt.sign({ role: 'admin' }, config.jwt.secret, { expiresIn: '7d' });
  res.json({ success: true, token });
});

router.get('/status', (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.json({ authenticated: false });
  try {
    jwt.verify(auth, config.jwt.secret);
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});

module.exports = router;
