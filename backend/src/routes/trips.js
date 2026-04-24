const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all trips
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trips WHERE user_id = $1 ORDER BY start_date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get trips error:', error);
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
      `DELETE FROM trips WHERE id = ANY($1::int[]) AND user_id = $2 RETURNING id`,
      [ids, req.user.id]
    );
    res.json({ message: `${result.rowCount} items deleted`, deletedIds: result.rows.map(r => r.id) });
  } catch (error) {
    console.error('Bulk delete trips error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single trip
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create trip
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, from_location, destination, start_date, end_date, budget, status, description, image_url } = req.body;
    const result = await pool.query(
      `INSERT INTO trips (user_id, name, from_location, destination, start_date, end_date, budget, status, description, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.id, name, from_location, destination, start_date, end_date, budget, status || 'planning', description, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update trip
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, from_location, destination, start_date, end_date, budget, status, description, image_url } = req.body;
    const result = await pool.query(
      `UPDATE trips SET name = $1, from_location = $2, destination = $3, start_date = $4, end_date = $5,
       budget = $6, status = $7, description = $8, image_url = $9, updated_at = NOW()
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [name, from_location, destination, start_date, end_date, budget, status, description, image_url, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete trip
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
