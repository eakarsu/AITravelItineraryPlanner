const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transportation WHERE user_id = $1 ORDER BY departure_date ASC, departure_time ASC',
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
      `DELETE FROM transportation WHERE id = ANY($1::int[]) AND user_id = $2 RETURNING id`,
      [ids, req.user.id]
    );
    res.json({ message: `${result.rowCount} items deleted`, deletedIds: result.rows.map(r => r.id) });
  } catch (error) {
    console.error('Bulk delete transportation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transportation WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transportation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { trip_id, type, provider, departure_location, arrival_location, departure_date, departure_time, arrival_date, arrival_time, booking_reference, cost, status, seat_info, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO transportation (user_id, trip_id, type, provider, departure_location, arrival_location, departure_date, departure_time, arrival_date, arrival_time, booking_reference, cost, status, seat_info, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [req.user.id, trip_id, type, provider, departure_location, arrival_location, departure_date, departure_time, arrival_date, arrival_time, booking_reference, cost, status, seat_info, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { trip_id, type, provider, departure_location, arrival_location, departure_date, departure_time, arrival_date, arrival_time, booking_reference, cost, status, seat_info, notes } = req.body;
    const result = await pool.query(
      `UPDATE transportation SET trip_id = $1, type = $2, provider = $3, departure_location = $4, arrival_location = $5,
       departure_date = $6, departure_time = $7, arrival_date = $8, arrival_time = $9, booking_reference = $10,
       cost = $11, status = $12, seat_info = $13, notes = $14, updated_at = NOW()
       WHERE id = $15 AND user_id = $16 RETURNING *`,
      [trip_id, type, provider, departure_location, arrival_location, departure_date, departure_time, arrival_date, arrival_time, booking_reference, cost, status, seat_info, notes, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transportation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM transportation WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transportation not found' });
    }
    res.json({ message: 'Transportation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
