const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/ai-results — list user's structured AI results with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const endpoint = req.query.endpoint;

    let query = 'SELECT * FROM ai_results WHERE user_id = $1';
    const params = [req.user.id];

    if (endpoint) {
      params.push(endpoint);
      query += ` AND endpoint = $${params.length}`;
    }

    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );

    params.push(limit);
    params.push(offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get AI results error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/ai-results/:id — single AI result
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ai_results WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'AI result not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get AI result error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/ai-results/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM ai_results WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'AI result not found' });
    }
    res.json({ message: 'AI result deleted' });
  } catch (error) {
    console.error('Delete AI result error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
