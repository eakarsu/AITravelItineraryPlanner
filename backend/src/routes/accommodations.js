const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM accommodations WHERE user_id = $1 ORDER BY check_in_date ASC',
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
      `DELETE FROM accommodations WHERE id = ANY($1::int[]) AND user_id = $2 RETURNING id`,
      [ids, req.user.id]
    );
    res.json({ message: `${result.rowCount} items deleted`, deletedIds: result.rows.map(r => r.id) });
  } catch (error) {
    console.error('Bulk delete accommodations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM accommodations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Accommodation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { trip_id, name, type, address, check_in_date, check_out_date, price_per_night, total_price, booking_status, booking_reference, amenities, rating, contact_phone, contact_email, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO accommodations (user_id, trip_id, name, type, address, check_in_date, check_out_date, price_per_night, total_price, booking_status, booking_reference, amenities, rating, contact_phone, contact_email, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [req.user.id, trip_id, name, type, address, check_in_date, check_out_date, price_per_night, total_price, booking_status, booking_reference, amenities, rating, contact_phone, contact_email, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { trip_id, name, type, address, check_in_date, check_out_date, price_per_night, total_price, booking_status, booking_reference, amenities, rating, contact_phone, contact_email, notes } = req.body;
    const result = await pool.query(
      `UPDATE accommodations SET trip_id = $1, name = $2, type = $3, address = $4, check_in_date = $5, check_out_date = $6,
       price_per_night = $7, total_price = $8, booking_status = $9, booking_reference = $10, amenities = $11,
       rating = $12, contact_phone = $13, contact_email = $14, notes = $15, updated_at = NOW()
       WHERE id = $16 AND user_id = $17 RETURNING *`,
      [trip_id, name, type, address, check_in_date, check_out_date, price_per_night, total_price, booking_status, booking_reference, amenities, rating, contact_phone, contact_email, notes, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Accommodation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM accommodations WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Accommodation not found' });
    }
    res.json({ message: 'Accommodation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
