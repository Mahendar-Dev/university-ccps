const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_ALGOS = new Set(['md5', 'sha-1', 'sha-256', 'sha-384', 'sha-512']);

// Save a new hash entry (hashing itself happens client-side; server just records it)
router.post('/', requireAuth, (req, res) => {
  const { sourceType, sourceLabel, algorithm, digest } = req.body || {};

  if (!['text', 'file'].includes(sourceType)) {
    return res.status(400).json({ error: 'sourceType must be "text" or "file".' });
  }
  if (!ALLOWED_ALGOS.has(algorithm)) {
    return res.status(400).json({ error: 'Unsupported algorithm.' });
  }
  if (typeof digest !== 'string' || digest.length < 8) {
    return res.status(400).json({ error: 'Invalid digest.' });
  }

  const label = (sourceLabel || '').toString().slice(0, 200);

  const info = db.prepare(`
    INSERT INTO hash_history (user_id, source_type, source_label, algorithm, digest)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.userId, sourceType, label, algorithm, digest);

  const row = db.prepare('SELECT * FROM hash_history WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

// List current user's history, most recent first
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT id, source_type, source_label, algorithm, digest, created_at
    FROM hash_history
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 500
  `).all(req.userId);
  res.json(rows);
});

// Delete one history entry (only if it belongs to the requesting user)
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM hash_history WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Entry not found.' });
  }
  res.status(204).end();
});

// Clear all history for the current user
router.delete('/', requireAuth, (req, res) => {
  db.prepare('DELETE FROM hash_history WHERE user_id = ?').run(req.userId);
  res.status(204).end();
});

module.exports = router;
