const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM packing_lists WHERE user_id = $1 ORDER BY created_at DESC',
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
      `DELETE FROM packing_lists WHERE id = ANY($1::int[]) AND user_id = $2 RETURNING id`,
      [ids, req.user.id]
    );
    res.json({ message: `${result.rowCount} items deleted`, deletedIds: result.rows.map(r => r.id) });
  } catch (error) {
    console.error('Bulk delete packing_lists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM packing_lists WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Packing list item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { trip_id, item_name, category, quantity, is_packed, priority, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO packing_lists (user_id, trip_id, item_name, category, quantity, is_packed, priority, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, trip_id, item_name, category, quantity || 1, is_packed || false, priority || 'medium', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { trip_id, item_name, category, quantity, is_packed, priority, notes } = req.body;
    const result = await pool.query(
      `UPDATE packing_lists SET trip_id = $1, item_name = $2, category = $3, quantity = $4,
       is_packed = $5, priority = $6, notes = $7, updated_at = NOW()
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [trip_id, item_name, category, quantity, is_packed, priority, notes, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Packing list item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM packing_lists WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Packing list item not found' });
    }
    res.json({ message: 'Packing list item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
