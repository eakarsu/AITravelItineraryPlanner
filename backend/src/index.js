const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const tripsRoutes = require('./routes/trips');
const destinationsRoutes = require('./routes/destinations');
const activitiesRoutes = require('./routes/activities');
const accommodationsRoutes = require('./routes/accommodations');
const transportationRoutes = require('./routes/transportation');
const restaurantsRoutes = require('./routes/restaurants');
const budgetsRoutes = require('./routes/budgets');
const documentsRoutes = require('./routes/documents');
const packingListsRoutes = require('./routes/packingLists');
const travelTipsRoutes = require('./routes/travelTips');
const emergencyContactsRoutes = require('./routes/emergencyContacts');
const reviewsRoutes = require('./routes/reviews');
const photosRoutes = require('./routes/photos');
const notesRoutes = require('./routes/notes');
const aiRoutes = require('./routes/ai');
const aiHistoryRoutes = require('./routes/aiHistory');

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/destinations', destinationsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/accommodations', accommodationsRoutes);
app.use('/api/transportation', transportationRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/packing-lists', packingListsRoutes);
app.use('/api/travel-tips', travelTipsRoutes);
app.use('/api/emergency-contacts', emergencyContactsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-history', aiHistoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Travel Planner API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
