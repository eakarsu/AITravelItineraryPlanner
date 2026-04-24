const express = require('express');
const authMiddleware = require('../middleware/auth');
const openrouter = require('../services/openrouter');
const pool = require('../config/database');

const router = express.Router();

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
router.post('/generate-itinerary', authMiddleware, async (req, res) => {
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
router.post('/auto-fill-destination', authMiddleware, async (req, res) => {
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
router.post('/optimize-budget', authMiddleware, async (req, res) => {
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
router.post('/smart-packing-list', authMiddleware, async (req, res) => {
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
router.post('/chat', authMiddleware, async (req, res) => {
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
router.post('/summarize-reviews', authMiddleware, async (req, res) => {
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
router.post('/analyze-itinerary', authMiddleware, async (req, res) => {
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
router.post('/suggest-activities', authMiddleware, async (req, res) => {
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
router.post('/suggest-restaurants', authMiddleware, async (req, res) => {
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
router.post('/suggest-accommodations', authMiddleware, async (req, res) => {
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
router.post('/destination-info', authMiddleware, async (req, res) => {
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
router.post('/translate', authMiddleware, async (req, res) => {
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
router.post('/trip-report', authMiddleware, async (req, res) => {
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
router.post('/generate-packing-list', authMiddleware, async (req, res) => {
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
router.post('/budget-advice', authMiddleware, async (req, res) => {
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
router.post('/find-flights', authMiddleware, async (req, res) => {
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
    res.json(flights);
  } catch (error) {
    console.error('Find flights error:', error);
    res.status(500).json({ error: error.message || 'Failed to find flights' });
  }
});

// 15. AI Weather Advisor
router.post('/weather-advice', authMiddleware, async (req, res) => {
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
    res.json(weatherAdvice);
  } catch (error) {
    console.error('Weather advice error:', error);
    res.status(500).json({ error: error.message || 'Failed to get weather advice' });
  }
});

// 16. AI Hotel Matcher
router.post('/match-hotels', authMiddleware, async (req, res) => {
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
    res.json(hotels);
  } catch (error) {
    console.error('Match hotels error:', error);
    res.status(500).json({ error: error.message || 'Failed to match hotels' });
  }
});

module.exports = router;
