const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB for photos
});

// POST /api/photos/:tripId/upload
router.post('/:tripId/upload', authMiddleware, upload.array('photos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const tripId = req.params.tripId;
    const caption = req.body.caption || '';

    const uploaded = [];
    for (const file of req.files) {
      const fileUrl = `/uploads/photos/${file.filename}`;
      const result = await pool.query(
        `INSERT INTO uploaded_photos (user_id, trip_id, original_name, file_path, file_url, mime_type, size_bytes, caption)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [req.user.id, tripId || null, file.originalname, file.path, fileUrl,
         file.mimetype, file.size, caption]
      );
      uploaded.push(result.rows[0]);
    }

    res.status(201).json({
      photos: uploaded,
      count: uploaded.length,
      message: `${uploaded.length} photo(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// GET /api/photos/:tripId/uploads — list uploaded photos for a trip
router.get('/:tripId/uploads', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM uploaded_photos WHERE user_id = $1 AND trip_id = $2',
      [req.user.id, req.params.tripId]
    );

    const result = await pool.query(
      'SELECT * FROM uploaded_photos WHERE user_id = $1 AND trip_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [req.user.id, req.params.tripId, limit, offset]
    );

    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/photos/:tripId/:photoId
router.delete('/:tripId/:photoId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM uploaded_photos WHERE id = $1 AND user_id = $2 AND trip_id = $3 RETURNING file_path',
      [req.params.photoId, req.user.id, req.params.tripId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const filePath = result.rows[0].file_path;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Photo deleted' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
