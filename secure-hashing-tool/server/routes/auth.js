const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function isValidUsername(u) {
  return typeof u === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(u);
}

router.post('/register', (req, res) => {
  const { username, password } = req.body || {};

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 characters: letters, numbers, underscore only.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);

  const token = jwt.sign({ userId: info.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, username });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

module.exports = router;
