const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const openrouter = require('../services/openrouter');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const photoUploadDir = path.join(__dirname, '../../uploads/photos');
if (!fs.existsSync(photoUploadDir)) {
  fs.mkdirSync(photoUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = req.baseUrl.includes('photos') ? photoUploadDir : uploadDir;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext || mime) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs and Word docs are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Ensure uploaded_documents table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS uploaded_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    trip_id INTEGER,
    original_name VARCHAR(255),
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    mime_type VARCHAR(100),
    size_bytes INTEGER,
    ai_extracted JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('uploaded_documents table init error:', err.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS uploaded_photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    trip_id INTEGER,
    original_name VARCHAR(255),
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    mime_type VARCHAR(100),
    size_bytes INTEGER,
    caption VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('uploaded_photos table init error:', err.message));

// POST /api/documents/:tripId/upload — upload document + AI extraction
router.post('/:tripId/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tripId = req.params.tripId;
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    // AI extraction of confirmation numbers, dates, etc.
    let aiExtracted = null;
    try {
      const extractionPrompt = [
        {
          role: 'system',
          content: 'You are a document analysis expert. Extract key travel information from document filenames and context. Return only valid JSON.'
        },
        {
          role: 'user',
          content: `Extract travel booking information from this document.
Filename: ${req.file.originalname}
File type: ${req.file.mimetype}
Additional context from user: ${req.body.description || 'None'}

Return JSON with any fields you can infer:
{
  "document_type": "flight/hotel/car_rental/passport/visa/insurance/other",
  "confirmation_number": "extracted number or null",
  "flight_number": "extracted or null",
  "hotel_name": "extracted or null",
  "airline": "extracted or null",
  "dates": {"checkin": "date or null", "checkout": "date or null", "departure": "date or null", "return": "date or null"},
  "passenger_name": "name or null",
  "booking_platform": "platform or null",
  "notes": "any other relevant info"
}`
        }
      ];

      const raw = await openrouter.callOpenRouter(extractionPrompt, { maxTokens: 500 });
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        aiExtracted = JSON.parse(match[0]);
      }
    } catch (aiErr) {
      console.error('AI extraction failed (non-fatal):', aiErr.message);
    }

    const result = await pool.query(
      `INSERT INTO uploaded_documents (user_id, trip_id, original_name, file_path, file_url, mime_type, size_bytes, ai_extracted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, tripId || null, req.file.originalname, req.file.path, fileUrl,
       req.file.mimetype, req.file.size, JSON.stringify(aiExtracted)]
    );

    res.status(201).json({
      document: result.rows[0],
      aiExtracted,
      message: aiExtracted ? 'Document uploaded and analyzed' : 'Document uploaded (AI extraction not available)'
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// GET /api/documents/:tripId — list documents for a trip with AI fields
router.get('/:tripId', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM uploaded_documents WHERE user_id = $1 AND trip_id = $2',
      [req.user.id, req.params.tripId]
    );

    const result = await pool.query(
      'SELECT * FROM uploaded_documents WHERE user_id = $1 AND trip_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [req.user.id, req.params.tripId, limit, offset]
    );

    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/documents/:tripId/:docId
router.delete('/:tripId/:docId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM uploaded_documents WHERE id = $1 AND user_id = $2 AND trip_id = $3 RETURNING file_path',
      [req.params.docId, req.user.id, req.params.tripId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from disk
    const filePath = result.rows[0].file_path;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
