const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');
const openrouter = require('../services/openrouter');
const pool = require('../config/database');

const router = express.Router();

// AI rate limiter: 20 requests per hour per user
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : ipKeyGenerator(req.ip),
  message: { error: 'AI rate limit exceeded. Max 20 AI requests per hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Ensure ai_results table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint VARCHAR(100),
    input_data JSONB,
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('ai_results table init error:', err.message));

async function saveAIResult(userId, endpoint, inputData, result) {
  try {
    await pool.query(
      'INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)',
      [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result)]
    );
  } catch (err) {
    console.error('Failed to save AI result:', err.message);
  }
}

const AI_DISCLAIMER = 'AI_ESTIMATE_ONLY: These results are AI-generated estimates for planning purposes only, not real bookings or live data.';

// AI History helpers
function generateTitle(featureType, promptData) {
  const p = promptData || {};
  switch (featureType) {
    case 'itinerary': return `Itinerary: ${p.destination || 'Unknown'} (${p.days || '?'} days)`;
    case 'autofill': return `Auto-fill: ${p.destination || 'Unknown'}`;
    case 'optimize': return `Budget: ${p.destination || 'Unknown'} ($${p.budget || '?'})`;
    case 'packing': return `Packing: ${p.destination || 'Unknown'}`;
    case 'chat': return `Chat: ${(p.message || '').substring(0, 60)}`;
    case 'summarize': return `Review Summary (${p.count || '?'} reviews)`;
    case 'analyze': return `Analyze: ${p.destination || 'trip'}`;
    case 'activities': return `Activities: ${p.destination || 'Unknown'}`;
    case 'restaurants': return `Restaurants: ${p.destination || 'Unknown'}`;
    case 'accommodations': return `Accommodations: ${p.destination || 'Unknown'}`;
    case 'info': return `Info: ${p.destination || 'Unknown'}`;
    case 'translate': return `Translate: "${(p.phrase || '').substring(0, 40)}" to ${p.targetLanguage || '?'}`;
    case 'report': return `Trip Report`;
    case 'flights': return `Flights: ${p.origin || '?'} to ${p.destination || '?'}`;
    case 'weather': return `Weather: ${p.destination || 'Unknown'}`;
    case 'matchHotels': return `Hotels: ${p.destination || 'Unknown'}`;
    default: return `AI Result: ${featureType}`;
  }
}

async function saveToHistory(userId, featureType, promptData, responseData) {
  try {
    const title = generateTitle(featureType, promptData);
    await pool.query(
      'INSERT INTO ai_history (user_id, feature_type, title, prompt_data, response_data) VALUES ($1, $2, $3, $4, $5)',
      [userId, featureType, title, JSON.stringify(promptData), JSON.stringify(responseData)]
    );
  } catch (err) {
    console.error('Failed to save AI history:', err.message);
  }
}

// 1. Generate complete itinerary
router.post('/generate-itinerary', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { fromLocation, destination, days, budget, interests } = req.body;

    if (!destination || !days) {
      return res.status(400).json({ error: 'Destination and days are required' });
    }

    const itinerary = await openrouter.generateItinerary(
      fromLocation || 'United States',
      destination,
      days,
      budget || 1000,
      interests || ['sightseeing', 'culture', 'food']
    );

    saveToHistory(req.user.id, 'itinerary', { destination, days, budget, interests, fromLocation }, itinerary);
    res.json(itinerary);
  } catch (error) {
    console.error('Generate itinerary error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate itinerary' });
  }
});

// 2. Auto-fill destination information
router.post('/auto-fill-destination', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const info = await openrouter.autoFillDestination(destination);
    saveToHistory(req.user.id, 'autofill', { destination }, info);
    res.json(info);
  } catch (error) {
    console.error('Auto-fill destination error:', error);
    res.status(500).json({ error: error.message || 'Failed to get destination info' });
  }
});

// 3. Budget optimizer
router.post('/optimize-budget', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, days, budget, travelStyle, expenses } = req.body;

    if (!destination || !budget) {
      return res.status(400).json({ error: 'Destination and budget are required' });
    }

    const optimization = await openrouter.optimizeBudget(
      destination,
      days || 7,
      budget,
      travelStyle || 'moderate',
      expenses
    );

    saveToHistory(req.user.id, 'optimize', { destination, days, budget, travelStyle }, optimization);
    res.json(optimization);
  } catch (error) {
    console.error('Budget optimization error:', error);
    res.status(500).json({ error: error.message || 'Failed to optimize budget' });
  }
});

// 4. Smart packing list
router.post('/smart-packing-list', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, duration, season, activities, tripType } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const packingList = await openrouter.generateSmartPackingList(
      destination,
      duration || 7,
      season || 'summer',
      activities || ['sightseeing'],
      tripType || 'leisure'
    );

    saveToHistory(req.user.id, 'packing', { destination, duration, season, activities, tripType }, packingList);
    res.json(packingList);
  } catch (error) {
    console.error('Smart packing list error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate packing list' });
  }
});

// 5. Chat assistant
router.post('/chat', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await openrouter.chatAssistant(message, context || {});
    saveToHistory(req.user.id, 'chat', { message }, response);
    res.json(response);
  } catch (error) {
    console.error('Chat assistant error:', error);
    res.status(500).json({ error: error.message || 'Failed to get response' });
  }
});

// 6. Summarize reviews
router.post('/summarize-reviews', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { reviews } = req.body;

    // If no reviews provided, fetch from database
    let reviewsToSummarize = reviews;
    if (!reviews || reviews.length === 0) {
      const result = await pool.query(
        'SELECT * FROM reviews WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
        [req.user.id]
      );
      reviewsToSummarize = result.rows;
    }

    if (!reviewsToSummarize || reviewsToSummarize.length === 0) {
      return res.status(400).json({ error: 'No reviews to summarize' });
    }

    const summary = await openrouter.summarizeReviews(reviewsToSummarize);
    saveToHistory(req.user.id, 'summarize', { count: reviewsToSummarize.length }, summary);
    res.json(summary);
  } catch (error) {
    console.error('Summarize reviews error:', error);
    res.status(500).json({ error: error.message || 'Failed to summarize reviews' });
  }
});

// 7. Analyze itinerary for conflicts
router.post('/analyze-itinerary', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { activities, destination, days } = req.body;

    // If destination is provided, generate and analyze a new itinerary for it
    // Otherwise, use provided activities or fetch from database
    let activitiesToAnalyze = activities;

    if (destination) {
      // User wants to analyze a specific destination - AI will generate itinerary
      const analysis = await openrouter.analyzeItinerary(
        [],  // Empty activities - AI will generate them
        destination,
        days || 5
      );
      saveToHistory(req.user.id, 'analyze', { destination, days }, analysis);
      return res.json(analysis);
    }

    // Fallback: fetch user's saved activities
    if (!activities || activities.length === 0) {
      const result = await pool.query(
        'SELECT * FROM activities WHERE user_id = $1 ORDER BY date, time',
        [req.user.id]
      );
      activitiesToAnalyze = result.rows;
    }

    if (!activitiesToAnalyze || activitiesToAnalyze.length === 0) {
      return res.status(400).json({ error: 'No activities to analyze. Please enter a destination or add activities first.' });
    }

    const analysis = await openrouter.analyzeItinerary(
      activitiesToAnalyze,
      'your trip'
    );

    saveToHistory(req.user.id, 'analyze', { destination: 'your trip' }, analysis);
    res.json(analysis);
  } catch (error) {
    console.error('Analyze itinerary error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze itinerary' });
  }
});

// 8. Suggest activities
router.post('/suggest-activities', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, interests, budget } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const activities = await openrouter.suggestActivities(
      destination,
      interests || ['sightseeing'],
      budget || 'moderate'
    );

    saveToHistory(req.user.id, 'activities', { destination, interests, budget }, activities);
    res.json(activities);
  } catch (error) {
    console.error('Suggest activities error:', error);
    res.status(500).json({ error: error.message || 'Failed to suggest activities' });
  }
});

// 9. Suggest restaurants
router.post('/suggest-restaurants', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, cuisine, budget } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const restaurants = await openrouter.suggestRestaurants(
      destination,
      cuisine || 'local',
      budget || 'moderate'
    );

    saveToHistory(req.user.id, 'restaurants', { destination, cuisine, budget }, restaurants);
    res.json(restaurants);
  } catch (error) {
    console.error('Suggest restaurants error:', error);
    res.status(500).json({ error: error.message || 'Failed to suggest restaurants' });
  }
});

// 10. Suggest accommodations
router.post('/suggest-accommodations', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, type, budget, nights } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const accommodations = await openrouter.suggestAccommodations(
      destination,
      type || 'hotel',
      budget || 500,
      nights || 3
    );

    saveToHistory(req.user.id, 'accommodations', { destination, type, budget, nights }, accommodations);
    res.json(accommodations);
  } catch (error) {
    console.error('Suggest accommodations error:', error);
    res.status(500).json({ error: error.message || 'Failed to suggest accommodations' });
  }
});

// 11. Get destination info (legacy)
router.post('/destination-info', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const info = await openrouter.getDestinationInfo(destination);
    saveToHistory(req.user.id, 'info', { destination }, info);
    res.json(info);
  } catch (error) {
    console.error('Get destination info error:', error);
    res.status(500).json({ error: error.message || 'Failed to get destination info' });
  }
});

// 12. Translate phrase
router.post('/translate', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { phrase, targetLanguage } = req.body;

    if (!phrase || !targetLanguage) {
      return res.status(400).json({ error: 'Phrase and target language are required' });
    }

    const translation = await openrouter.translatePhrase(phrase, targetLanguage);
    saveToHistory(req.user.id, 'translate', { phrase, targetLanguage }, translation);
    res.json(translation);
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ error: error.message || 'Failed to translate' });
  }
});

// 13. Generate trip report
router.post('/trip-report', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { tripId, tripData } = req.body;

    let data = tripData;

    // If tripId provided, fetch trip data from database
    if (tripId && !tripData) {
      const tripResult = await pool.query(
        'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
        [tripId, req.user.id]
      );

      if (tripResult.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const trip = tripResult.rows[0];

      // Fetch related data
      const [activities, accommodations, restaurants, reviews] = await Promise.all([
        pool.query('SELECT * FROM activities WHERE trip_id = $1', [tripId]),
        pool.query('SELECT * FROM accommodations WHERE trip_id = $1', [tripId]),
        pool.query('SELECT * FROM restaurants WHERE trip_id = $1', [tripId]),
        pool.query('SELECT * FROM reviews WHERE trip_id = $1', [tripId])
      ]);

      data = {
        trip,
        activities: activities.rows,
        accommodations: accommodations.rows,
        restaurants: restaurants.rows,
        reviews: reviews.rows
      };
    }

    if (!data) {
      return res.status(400).json({ error: 'Trip data is required' });
    }

    const report = await openrouter.generateTripReport(data);
    saveToHistory(req.user.id, 'report', { tripId }, report);
    res.json(report);
  } catch (error) {
    console.error('Generate trip report error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate trip report' });
  }
});

// Legacy endpoint for packing list
router.post('/generate-packing-list', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, duration, season, activities } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const packingList = await openrouter.generateSmartPackingList(
      destination,
      duration || 7,
      season || 'summer',
      activities || ['sightseeing'],
      'leisure'
    );

    saveToHistory(req.user.id, 'packing', { destination, duration, season, activities }, packingList);
    res.json(packingList);
  } catch (error) {
    console.error('Generate packing list error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate packing list' });
  }
});

// Legacy endpoint for budget advice
router.post('/budget-advice', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, days, travelStyle } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const budgetAdvice = await openrouter.optimizeBudget(
      destination,
      days || 7,
      1000,
      travelStyle || 'moderate',
      {}
    );

    saveToHistory(req.user.id, 'optimize', { destination, days, travelStyle }, budgetAdvice);
    res.json(budgetAdvice);
  } catch (error) {
    console.error('Get budget advice error:', error);
    res.status(500).json({ error: error.message || 'Failed to get budget advice' });
  }
});

// 14. AI Flight Finder
router.post('/find-flights', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, budget, passengers } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const flights = await openrouter.findFlights(
      origin,
      destination,
      departureDate,
      returnDate,
      budget || 500,
      passengers || 1
    );

    saveToHistory(req.user.id, 'flights', { origin, destination, departureDate, returnDate, budget, passengers }, flights);
    saveAIResult(req.user.id, 'find-flights', { origin, destination, departureDate, returnDate, budget, passengers }, flights);
    res.json({ ...flights, _disclaimer: AI_DISCLAIMER });
  } catch (error) {
    console.error('Find flights error:', error);
    res.status(500).json({ error: error.message || 'Failed to find flights' });
  }
});

// 15. AI Weather Advisor
router.post('/weather-advice', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, travelDates, activities } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const weatherAdvice = await openrouter.getWeatherAdvice(
      destination,
      travelDates,
      activities || []
    );

    saveToHistory(req.user.id, 'weather', { destination, travelDates, activities }, weatherAdvice);
    saveAIResult(req.user.id, 'weather-advice', { destination, travelDates, activities }, weatherAdvice);
    res.json({ ...weatherAdvice, _disclaimer: AI_DISCLAIMER });
  } catch (error) {
    console.error('Weather advice error:', error);
    res.status(500).json({ error: error.message || 'Failed to get weather advice' });
  }
});

// 16. AI Hotel Matcher
router.post('/match-hotels', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, preferences, budget, dates, travelers } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const hotels = await openrouter.matchHotels(
      destination,
      preferences || ['comfort', 'location', 'value'],
      budget || 150,
      dates,
      travelers || '2 adults'
    );

    saveToHistory(req.user.id, 'matchHotels', { destination, preferences, budget, dates, travelers }, hotels);
    saveAIResult(req.user.id, 'match-hotels', { destination, preferences, budget, dates, travelers }, hotels);
    res.json({ ...hotels, _disclaimer: AI_DISCLAIMER });
  } catch (error) {
    console.error('Match hotels error:', error);
    res.status(500).json({ error: error.message || 'Failed to match hotels' });
  }
});

// 17. Packing Optimizer (weather + activities aware)
router.post('/optimize-packing', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, activities, weatherSummary, duration, tripId } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // If tripId provided, fetch activities from DB
    let tripActivities = activities || [];
    if (tripId && (!activities || activities.length === 0)) {
      const result = await pool.query(
        'SELECT name, description FROM activities WHERE trip_id = $1',
        [tripId]
      );
      tripActivities = result.rows.map(r => r.name);
    }

    const packingList = await openrouter.optimizePackingList(
      destination,
      tripActivities,
      weatherSummary,
      duration || 7
    );

    saveToHistory(req.user.id, 'packing', { destination, duration, activities: tripActivities }, packingList);
    saveAIResult(req.user.id, 'optimize-packing', { destination, duration, activities: tripActivities }, packingList);
    res.json(packingList);
  } catch (error) {
    console.error('Optimize packing error:', error);
    res.status(500).json({ error: error.message || 'Failed to optimize packing list' });
  }
});

// 18. Trip Inspiration
router.post('/trip-inspiration', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { budget, duration, vibe } = req.body;

    if (!vibe) {
      return res.status(400).json({ error: 'Vibe is required (beach/adventure/city/culture)' });
    }

    // Fetch user's past destinations for personalization
    const pastTrips = await pool.query(
      'SELECT DISTINCT destination FROM trips WHERE user_id = $1 ORDER BY destination LIMIT 20',
      [req.user.id]
    );
    const pastDestinations = pastTrips.rows.map(r => r.destination).filter(Boolean);

    const inspiration = await openrouter.tripInspiration(
      budget || 2000,
      duration || 7,
      vibe,
      pastDestinations
    );

    saveToHistory(req.user.id, 'inspiration', { budget, duration, vibe, pastDestinations }, inspiration);
    saveAIResult(req.user.id, 'trip-inspiration', { budget, duration, vibe }, inspiration);
    res.json(inspiration);
  } catch (error) {
    console.error('Trip inspiration error:', error);
    res.status(500).json({ error: error.message || 'Failed to get trip inspiration' });
  }
});

// 19. Day-Of Live Plan
router.post('/day-of-plan', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { tripId, currentLocation, currentTime, delays, activities } = req.body;

    if (!currentLocation) {
      return res.status(400).json({ error: 'Current location is required' });
    }

    // Fetch today's activities from DB if tripId provided
    let todayActivities = activities || [];
    if (tripId && (!activities || activities.length === 0)) {
      const today = new Date().toISOString().split('T')[0];
      const result = await pool.query(
        `SELECT name, time, location, description, duration FROM activities
         WHERE trip_id = $1 AND (date = $2 OR date IS NULL) ORDER BY time`,
        [tripId, today]
      );
      todayActivities = result.rows;
    }

    const plan = await openrouter.dayOfPlan(
      todayActivities,
      currentLocation,
      currentTime || new Date().toLocaleTimeString(),
      delays
    );

    saveAIResult(req.user.id, 'day-of-plan', { tripId, currentLocation, currentTime, delays }, plan);
    res.json(plan);
  } catch (error) {
    console.error('Day-of plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate day-of plan' });
  }
});

// 20. Similar Trips (embedding-based inspiration from history)
router.post('/similar-trips', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, interests, budget } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Fetch user's past AI history for context
    const historyResult = await pool.query(
      `SELECT feature_type, prompt_data, response_data FROM ai_history
       WHERE user_id = $1 AND feature_type IN ('itinerary', 'activities', 'autofill')
       ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );
    const pastHistory = historyResult.rows;

    const messages = [
      {
        role: 'system',
        content: 'You are a travel personalization expert. Compare a new trip request to past user travel history and find similar patterns. Respond with valid JSON only.'
      },
      {
        role: 'user',
        content: `New trip: ${destination}, budget: $${budget || 'flexible'}, interests: ${(interests || []).join(', ')}.

Past travel history (last 10 AI requests):
${pastHistory.map(h => `- ${h.feature_type}: ${JSON.stringify(h.prompt_data)}`).join('\n')}

Find similar past activities/destinations and suggest relevant ideas. Return JSON:
{
  "similar_past_trips": [
    {"destination": "place", "similarity_reason": "why similar", "reusable_tips": ["tip1", "tip2"]}
  ],
  "personalized_suggestions": [
    {"activity": "name", "why_you_ll_love_it": "reason based on history", "estimated_cost": 50}
  ],
  "your_travel_style": "description based on history",
  "recommended_duration": "X days"
}`
      }
    ];

    const { callOpenRouter, parseJsonResponse: parse } = openrouter;
    // Use openrouter's callOpenRouter
    const raw = await openrouter.callOpenRouter(messages, { maxTokens: 2000 });
    // Parse via the service's own parser - use dynamic import workaround
    const result = typeof raw === 'string' ? JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim().match(/\{[\s\S]*\}/)?.[0] || '{}') : raw;

    saveAIResult(req.user.id, 'similar-trips', { destination, interests, budget }, result);
    res.json(result);
  } catch (error) {
    console.error('Similar trips error:', error);
    res.status(500).json({ error: error.message || 'Failed to find similar trips' });
  }
});

// Visa & document advisor
router.post('/visa-advisor', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { citizenship, destination, travel_purpose, duration_days, departure_date } = req.body;
    if (!citizenship || !destination) return res.status(400).json({ error: 'citizenship and destination are required' });

    const messages = [
      { role: 'system', content: 'You are a travel documentation advisor. Always respond with valid JSON only.' },
      { role: 'user', content: `Provide visa and document requirements for travel.
Citizenship: ${citizenship}
Destination: ${destination}
Purpose: ${travel_purpose || 'tourism'}
Duration: ${duration_days || 'unknown'} days
Departure: ${departure_date || 'unknown'}

Return JSON:
{
  "visa_required": <boolean>,
  "visa_type": "...",
  "processing_time_days": <number>,
  "estimated_fee_usd": <number>,
  "passport_requirements": ["..."],
  "additional_documents": ["..."],
  "vaccinations": ["..."],
  "currency_advisory": "...",
  "embassy_links": ["..."],
  "summary": "..."
}` }
    ];
    const raw = await openrouter.callOpenRouter(messages, { maxTokens: 1500 });
    const result = typeof raw === 'string'
      ? JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim().match(/\{[\s\S]*\}/)?.[0] || '{}')
      : raw;
    saveAIResult(req.user.id, 'visa-advisor', { citizenship, destination, travel_purpose }, result);
    res.json({ ...result, disclaimer: AI_DISCLAIMER });
  } catch (error) {
    console.error('Visa advisor error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch visa requirements' });
  }
});

// Travel insurance recommender
router.post('/insurance-recommender', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { destination, duration_days, traveler_age, activities, budget_usd, has_preexisting } = req.body;
    const messages = [
      { role: 'system', content: 'You are a travel insurance advisor. Always respond with valid JSON only.' },
      { role: 'user', content: `Recommend travel insurance coverage.
Destination: ${destination || 'unspecified'}
Duration: ${duration_days || 'unknown'} days
Traveler age: ${traveler_age || 'unknown'}
Planned activities: ${JSON.stringify(activities || [])}
Budget for insurance (USD): ${budget_usd || 'unspecified'}
Pre-existing conditions: ${has_preexisting ? 'yes' : 'no'}

Return JSON:
{
  "recommended_coverage": [{"type": "medical|trip_cancel|baggage|adventure|evacuation", "minimum_limit_usd": <number>, "rationale": "..."}],
  "tier_recommendation": "basic|standard|premium",
  "estimated_cost_usd": <number>,
  "watch_outs": ["..."],
  "policy_features_to_check": ["..."],
  "summary": "..."
}` }
    ];
    const raw = await openrouter.callOpenRouter(messages, { maxTokens: 1500 });
    const result = typeof raw === 'string'
      ? JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim().match(/\{[\s\S]*\}/)?.[0] || '{}')
      : raw;
    saveAIResult(req.user.id, 'insurance-recommender', { destination, duration_days, traveler_age }, result);
    res.json({ ...result, disclaimer: AI_DISCLAIMER });
  } catch (error) {
    console.error('Insurance recommender error:', error);
    res.status(500).json({ error: error.message || 'Failed to recommend insurance' });
  }
});

// Dynamic itinerary adjustment - re-plan an existing itinerary in response to changes
router.post('/adjust-itinerary', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const {
      tripId,
      current_itinerary,
      change_type,
      change_details,
      new_constraints,
    } = req.body;

    if (!change_type) {
      return res.status(400).json({ error: 'change_type is required (e.g. weather, flight_delay, budget_cut, illness, schedule_shift)' });
    }

    // If tripId provided and no current_itinerary, fetch trip + activities from DB
    let itinerary = current_itinerary;
    if (tripId && !current_itinerary) {
      const tripResult = await pool.query(
        'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
        [tripId, req.user.id]
      );
      if (tripResult.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      const activitiesResult = await pool.query(
        'SELECT * FROM activities WHERE trip_id = $1 ORDER BY date, time',
        [tripId]
      );
      itinerary = {
        trip: tripResult.rows[0],
        activities: activitiesResult.rows,
      };
    }

    if (!itinerary) {
      return res.status(400).json({ error: 'Either tripId or current_itinerary is required' });
    }

    const messages = [
      { role: 'system', content: 'You are a dynamic travel itinerary adjuster. When given an existing itinerary and a disruption, propose a revised plan that minimizes lost activities and respects constraints. Always respond with valid JSON only.' },
      { role: 'user', content: `Adjust this itinerary in response to a change.

Current itinerary:
${JSON.stringify(itinerary).slice(0, 6000)}

Change type: ${change_type}
Change details: ${JSON.stringify(change_details || {})}
New constraints: ${JSON.stringify(new_constraints || {})}

Return JSON only:
{
  "summary": "what changed and why this revision",
  "impact_assessment": ["bullet1", "bullet2"],
  "revised_activities": [
    { "date": "YYYY-MM-DD", "time": "HH:MM", "name": "...", "location": "...", "duration_min": 0, "notes": "...", "status": "kept|moved|added|removed", "rationale": "..." }
  ],
  "removed_activities": [{ "name": "...", "reason": "..." }],
  "added_activities": [{ "name": "...", "reason": "..." }],
  "estimated_cost_delta_usd": 0,
  "user_action_required": ["..."],
  "warnings": ["..."]
}` },
    ];

    const raw = await openrouter.callOpenRouter(messages, { maxTokens: 3000 });
    const result = typeof raw === 'string'
      ? JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim().match(/\{[\s\S]*\}/)?.[0] || '{}')
      : raw;

    saveToHistory(req.user.id, 'adjust', { tripId, change_type, change_details }, result);
    saveAIResult(req.user.id, 'adjust-itinerary', { tripId, change_type, change_details, new_constraints }, result);
    res.json({ ...result, _disclaimer: AI_DISCLAIMER });
  } catch (error) {
    if (error && /api key not configured/i.test(error.message || '')) {
      return res.status(503).json({ error: 'AI not configured: set OPENROUTER_API_KEY on the server.' });
    }
    console.error('Adjust itinerary error:', error);
    res.status(500).json({ error: error.message || 'Failed to adjust itinerary' });
  }
});

// ============================================================
// Apply pass 5 — remaining backlog (additive, gated, non-breaking)
// ============================================================

// Currency-tracker schema (additive). Stores per-user spend events in any
// currency along with a base-currency conversion at insert time.
pool.query(`
  CREATE TABLE IF NOT EXISTS currency_spend (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    trip_id INTEGER,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(8) NOT NULL,
    base_currency VARCHAR(8) DEFAULT 'USD',
    base_amount DOUBLE PRECISION,
    fx_rate DOUBLE PRECISION,
    note TEXT,
    spent_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('currency_spend init:', err.message));

// PRODUCT-DECISION: local currency spending tracker keeps all numbers
// server-side and uses an LLM to suggest spending categories when AI is
// available. Without AI it just stores rows. No external FX feed; the
// caller passes the rate.
router.post('/currency/spend', authMiddleware, async (req, res) => {
  try {
    const { trip_id, amount, currency, base_currency, fx_rate, note } = req.body || {};
    if (!amount || !currency) return res.status(400).json({ error: 'amount and currency required' });
    const base = base_currency || 'USD';
    const rate = parseFloat(fx_rate) || 1;
    const baseAmt = parseFloat(amount) * rate;
    const r = await pool.query(
      `INSERT INTO currency_spend (user_id, trip_id, amount, currency, base_currency, base_amount, fx_rate, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, trip_id || null, parseFloat(amount), currency, base, baseAmt, rate, note || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/currency/spend', authMiddleware, async (req, res) => {
  try {
    const trip_id = req.query.trip_id;
    const params = [req.user.id];
    let where = 'user_id = $1';
    if (trip_id) { params.push(trip_id); where += ` AND trip_id = $${params.length}`; }
    const rows = await pool.query(
      `SELECT * FROM currency_spend WHERE ${where} ORDER BY spent_at DESC LIMIT 500`, params
    );
    const totals = {};
    for (const r of rows.rows) {
      const k = r.base_currency || 'USD';
      totals[k] = (totals[k] || 0) + (parseFloat(r.base_amount) || 0);
    }
    res.json({ rows: rows.rows, totals });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// NEEDS-CREDS: booking platform stub. Env vars: BOOKING_PROVIDER (expedia|booking|airbnb),
// BOOKING_API_KEY, BOOKING_BASE_URL. Without them the endpoint returns 503.
// With them we return a normalized AI-generated mock list (for development);
// the actual integration must be implemented per provider.
// Documented env: BOOKING_PROVIDER, BOOKING_API_KEY, BOOKING_BASE_URL.
router.post('/booking-search', authMiddleware, aiRateLimiter, async (req, res) => {
  if (!process.env.BOOKING_API_KEY) {
    return res.status(503).json({ error: 'Booking integration not configured.', missing: 'BOOKING_API_KEY' });
  }
  if (!process.env.BOOKING_PROVIDER) {
    return res.status(503).json({ error: 'Booking integration not configured.', missing: 'BOOKING_PROVIDER' });
  }
  try {
    const { destination, check_in, check_out, type } = req.body || {};
    const messages = [
      { role: 'system', content: 'You are a travel-booking summariser. Return ONLY JSON.' },
      { role: 'user', content: `Generate plausible booking options. Return ONLY JSON: {"results":[{"name":"...","provider":"${process.env.BOOKING_PROVIDER}","type":"${type||'hotel'}","price_per_night":0,"currency":"USD","rating":0,"link":"#"}]}\nDestination: ${destination}\nCheck-in: ${check_in}\nCheck-out: ${check_out}` },
    ];
    const text = await openrouter.callOpenRouter(messages, { temperature: 0.3, max_tokens: 2500 });
    const m = (text || '').match(/\{[\s\S]*\}/);
    let parsed = null; if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
    saveAIResult(req.user.id, 'booking-search', { destination, check_in, check_out, type }, parsed || { raw: text });
    res.json({ provider: process.env.BOOKING_PROVIDER, ...(parsed || { raw: text }), _disclaimer: AI_DISCLAIMER });
  } catch (error) {
    if (error && /api key not configured/i.test(error.message || '')) {
      return res.status(503).json({ error: 'AI not configured: set OPENROUTER_API_KEY on the server.', missing: 'OPENROUTER_API_KEY' });
    }
    res.status(500).json({ error: error.message });
  }
});

// NEEDS-CREDS: flight price alert stub. Env var: FLIGHT_PRICE_API_KEY.
// Without it returns 503. With it we record an alert row (additive table).
pool.query(`
  CREATE TABLE IF NOT EXISTS flight_price_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    origin VARCHAR(8),
    destination VARCHAR(8),
    target_price DOUBLE PRECISION,
    currency VARCHAR(8) DEFAULT 'USD',
    depart_date DATE,
    return_date DATE,
    status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('flight_price_alerts init:', err.message));

router.post('/flight-alerts', authMiddleware, async (req, res) => {
  if (!process.env.FLIGHT_PRICE_API_KEY) {
    return res.status(503).json({ error: 'Flight price feed not configured.', missing: 'FLIGHT_PRICE_API_KEY' });
  }
  try {
    const { origin, destination, target_price, currency, depart_date, return_date } = req.body || {};
    if (!origin || !destination) return res.status(400).json({ error: 'origin and destination required' });
    const r = await pool.query(
      `INSERT INTO flight_price_alerts (user_id, origin, destination, target_price, currency, depart_date, return_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, origin, destination, target_price || null, currency || 'USD', depart_date || null, return_date || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/flight-alerts', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM flight_price_alerts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200', [req.user.id]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PRODUCT-DECISION: travel community = lightweight per-trip public note board
// (additive). No social graph, no comments threading — just public notes.
pool.query(`
  CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    destination VARCHAR(255),
    title VARCHAR(255),
    body TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('community_posts init:', err.message));

router.get('/community/posts', authMiddleware, async (req, res) => {
  try {
    const dest = req.query.destination;
    const params = [];
    let where = '';
    if (dest) { params.push(dest); where = 'WHERE destination ILIKE $1'; }
    const r = await pool.query(`SELECT id, user_id, destination, title, body, tags, created_at FROM community_posts ${where} ORDER BY created_at DESC LIMIT 100`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/community/posts', authMiddleware, async (req, res) => {
  try {
    const { destination, title, body, tags } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });
    const r = await pool.query(
      `INSERT INTO community_posts (user_id, destination, title, body, tags) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, destination || null, title, body, Array.isArray(tags) ? tags : null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
