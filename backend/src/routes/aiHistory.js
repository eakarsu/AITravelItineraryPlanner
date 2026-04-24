const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET all history entries (excludes response_data for performance)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, feature_type, title, prompt_data, created_at FROM ai_history WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get AI history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single entry with full response_data
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ai_history WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'History entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get AI history entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE single entry
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM ai_history WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'History entry not found' });
    }
    res.json({ message: 'History entry deleted successfully' });
  } catch (error) {
    console.error('Delete AI history entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE all entries for user
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM ai_history WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'All history cleared successfully' });
  } catch (error) {
    console.error('Clear AI history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
