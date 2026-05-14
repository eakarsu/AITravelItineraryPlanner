const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));
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
const collaboratorsRoutes = require('./routes/collaborators');
const aiResultsRoutes = require('./routes/aiResults');
const documentUploadRoutes = require('./routes/documentUpload');
const photoUploadRoutes = require('./routes/photoUpload');
const path = require('path');

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
app.use('/api/collaborators', collaboratorsRoutes);
app.use('/api/ai-results', aiResultsRoutes);
app.use('/api/documents', documentUploadRoutes);
app.use('/api/photos', photoUploadRoutes);
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Travel Planner API is running' });
});

app.use('/api/dynamic-itinerary-adjust', require('./routes/dynamicItineraryAdjust')); app.use('/api/multi-currency-tracker', require('./routes/multiCurrencyTracker')); app.use('/api/travel-community', require('./routes/travelCommunity')); app.use('/api/visa-document-advisor', require('./routes/visaDocumentAdvisor')); app.use('/api/insurance-recommender', require('./routes/insuranceRecommender')); app.use('/api/group-cost-splitter', require('./routes/groupCostSplitter'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-ai-coverage-is-comprehensive', require('./routes/gapAiCoverageIsComprehensive'));
app.use('/api/gap-no-vision-based-receipt-expense-capture', require('./routes/gapNoVisionBasedReceiptExpenseCapture'));
app.use('/api/gap-no-conversational-travel-agent-voice-interface', require('./routes/gapNoConversationalTravelAgentVoiceInterface'));
app.use('/api/gap-no-deep-integration-with-booking-platforms-expedia-booking', require('./routes/gapNoDeepIntegrationWithBookingPlatformsExpediaBooking'));
app.use('/api/gap-no-real-time-flight-price-alerts', require('./routes/gapNoRealTimeFlightPriceAlerts'));
app.use('/api/gap-no-travel-insurance-comparison-shopping', require('./routes/gapNoTravelInsuranceComparisonShopping'));
app.use('/api/gap-no-visa-requirement-checker', require('./routes/gapNoVisaRequirementChecker'));
app.use('/api/gap-no-multi-currency-tracking', require('./routes/gapNoMultiCurrencyTracking'));
app.use('/api/gap-no-webhooks-for-trip-events', require('./routes/gapNoWebhooksForTripEvents'));
app.use('/api/gap-no-notifications-subsystem', require('./routes/gapNoNotificationsSubsystem'));
app.use('/api/gap-no-audit-log', require('./routes/gapNoAuditLog'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
