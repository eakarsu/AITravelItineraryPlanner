const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Ensure trip_collaborators table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS trip_collaborators (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    owner_user_id INTEGER NOT NULL,
    collaborator_email VARCHAR(255) NOT NULL,
    collaborator_user_id INTEGER,
    role VARCHAR(50) DEFAULT 'viewer',
    status VARCHAR(50) DEFAULT 'pending',
    invited_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP
  )
`).catch(err => console.error('trip_collaborators table init error:', err.message));

// POST /api/collaborators/trips/:id/invite — invite collaborator by email
router.post('/trips/:id/invite', authMiddleware, async (req, res) => {
  try {
    const tripId = req.params.id;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verify the trip belongs to this user
    const tripCheck = await pool.query(
      'SELECT id FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );
    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found or not authorized' });
    }

    // Check if already invited
    const existing = await pool.query(
      'SELECT id FROM trip_collaborators WHERE trip_id = $1 AND collaborator_email = $2',
      [tripId, email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already invited to this trip' });
    }

    // Look up collaborator user id if they exist
    const userLookup = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const collaboratorUserId = userLookup.rows.length > 0 ? userLookup.rows[0].id : null;

    const result = await pool.query(
      `INSERT INTO trip_collaborators (trip_id, owner_user_id, collaborator_email, collaborator_user_id, role, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [tripId, req.user.id, email.toLowerCase(), collaboratorUserId, role || 'viewer']
    );

    res.status(201).json({
      message: `Invitation sent to ${email}`,
      collaboration: result.rows[0]
    });
  } catch (error) {
    console.error('Invite collaborator error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/collaborators/trips/shared — trips user is collaborator on
router.get('/trips/shared', authMiddleware, async (req, res) => {
  try {
    // First check if user is authenticated with an email
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userEmail = userResult.rows[0].email;

    const result = await pool.query(
      `SELECT t.*, tc.role, tc.status as invite_status, tc.invited_at,
              u.name as owner_name, u.email as owner_email
       FROM trip_collaborators tc
       JOIN trips t ON t.id = tc.trip_id
       JOIN users u ON u.id = tc.owner_user_id
       WHERE tc.collaborator_email = $1
       ORDER BY tc.invited_at DESC`,
      [userEmail]
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const total = result.rows.length;
    const data = result.rows.slice(offset, offset + limit);

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get shared trips error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/collaborators/trips/:id/collaborators — list collaborators on a trip
router.get('/trips/:id/collaborators', authMiddleware, async (req, res) => {
  try {
    const tripId = req.params.id;

    const tripCheck = await pool.query(
      'SELECT id FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );
    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found or not authorized' });
    }

    const result = await pool.query(
      'SELECT * FROM trip_collaborators WHERE trip_id = $1 ORDER BY invited_at DESC',
      [tripId]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/collaborators/trips/:tripId/collaborators/:collabId/accept
router.put('/trips/:tripId/collaborators/:collabId/accept', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const userEmail = userResult.rows[0].email;

    const result = await pool.query(
      `UPDATE trip_collaborators SET status = 'accepted', collaborator_user_id = $1, accepted_at = NOW()
       WHERE id = $2 AND collaborator_email = $3 AND trip_id = $4 RETURNING *`,
      [req.user.id, req.params.collabId, userEmail, req.params.tripId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json({ message: 'Invitation accepted', collaboration: result.rows[0] });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/collaborators/trips/:tripId/collaborators/:collabId — remove collaborator
router.delete('/trips/:tripId/collaborators/:collabId', authMiddleware, async (req, res) => {
  try {
    const tripCheck = await pool.query(
      'SELECT id FROM trips WHERE id = $1 AND user_id = $2',
      [req.params.tripId, req.user.id]
    );
    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found or not authorized' });
    }

    await pool.query(
      'DELETE FROM trip_collaborators WHERE id = $1 AND trip_id = $2',
      [req.params.collabId, req.params.tripId]
    );

    res.json({ message: 'Collaborator removed' });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
