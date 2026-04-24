const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM photos WHERE user_id = $1 ORDER BY taken_at DESC, created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk delete
router.delete('/bulk', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }
    const result = await pool.query(
      `DELETE FROM photos WHERE id = ANY($1::int[]) AND user_id = $2 RETURNING id`,
      [ids, req.user.id]
    );
    res.json({ message: `${result.rowCount} items deleted`, deletedIds: result.rows.map(r => r.id) });
  } catch (error) {
    console.error('Bulk delete photos error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM photos WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { trip_id, url, title, description, location, taken_at, is_favorite, tags } = req.body;
    const result = await pool.query(
      `INSERT INTO photos (user_id, trip_id, url, title, description, location, taken_at, is_favorite, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, trip_id, url, title, description, location, taken_at, is_favorite || false, tags]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { trip_id, url, title, description, location, taken_at, is_favorite, tags } = req.body;
    const result = await pool.query(
      `UPDATE photos SET trip_id = $1, url = $2, title = $3, description = $4, location = $5,
       taken_at = $6, is_favorite = $7, tags = $8, updated_at = NOW()
       WHERE id = $9 AND user_id = $10 RETURNING *`,
      [trip_id, url, title, description, location, taken_at, is_favorite, tags, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM photos WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
