const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY expiry_date ASC',
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
      `DELETE FROM documents WHERE id = ANY($1::int[]) AND user_id = $2 RETURNING id`,
      [ids, req.user.id]
    );
    res.json({ message: `${result.rowCount} items deleted`, deletedIds: result.rows.map(r => r.id) });
  } catch (error) {
    console.error('Bulk delete documents error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { trip_id, type, name, document_number, issue_date, expiry_date, issuing_country, notes, file_url } = req.body;
    const result = await pool.query(
      `INSERT INTO documents (user_id, trip_id, type, name, document_number, issue_date, expiry_date, issuing_country, notes, file_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.id, trip_id, type, name, document_number, issue_date, expiry_date, issuing_country, notes, file_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { trip_id, type, name, document_number, issue_date, expiry_date, issuing_country, notes, file_url } = req.body;
    const result = await pool.query(
      `UPDATE documents SET trip_id = $1, type = $2, name = $3, document_number = $4, issue_date = $5,
       expiry_date = $6, issuing_country = $7, notes = $8, file_url = $9, updated_at = NOW()
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [trip_id, type, name, document_number, issue_date, expiry_date, issuing_country, notes, file_url, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
