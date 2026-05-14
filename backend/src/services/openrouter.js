require('dotenv').config({ path: '../../.env' });

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const defaultModel = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Travel Itinerary Planner'
    },
    body: JSON.stringify({
      model: options.model || defaultModel,
      messages: messages,
      max_tokens: options.maxTokens || 10000,
      temperature: options.temperature || 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenRouter API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Helper to fix truncated JSON
function fixTruncatedJSON(jsonStr) {
  let str = jsonStr.trim();

  // Remove trailing incomplete values
  str = str.replace(/,\s*"[^"]*$/, '');  // Incomplete key
  str = str.replace(/,\s*"[^"]*":\s*("[^"]*)?$/, '');  // Incomplete key-value
  str = str.replace(/,\s*"[^"]*":\s*\d*$/, '');  // Incomplete number value
  str = str.replace(/,\s*\{[^}]*$/, '');  // Incomplete object
  str = str.replace(/,\s*\[[^\]]*$/, '');  // Incomplete array
  str = str.replace(/,\s*$/, '');  // Trailing comma

  // Count brackets
  const openBraces = (str.match(/\{/g) || []).length;
  const closeBraces = (str.match(/\}/g) || []).length;
  const openBrackets = (str.match(/\[/g) || []).length;
  const closeBrackets = (str.match(/\]/g) || []).length;

  // Add missing closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    str += ']';
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    str += '}';
  }

  return str;
}

// Parse JSON from AI response
function parseJsonResponse(response) {
  try {
    // First, clean up the response - remove markdown code blocks
    let cleaned = response;

    // Remove ```json ... ``` blocks
    cleaned = cleaned.replace(/```json\s*/gi, '');
    cleaned = cleaned.replace(/```\s*/gi, '');
    cleaned = cleaned.trim();

    // Try to parse the cleaned response directly first
    try {
      const parsed = JSON.parse(cleaned);
      console.log('Successfully parsed JSON directly');
      return parsed;
    } catch (e) {
      // If direct parsing fails, try to extract JSON object
      console.log('Direct parsing failed, trying extraction...');
    }

    // Try to find and parse JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed extracted JSON object');
        return parsed;
      } catch (e) {
        // Try fixing truncated JSON
        console.log('Attempting to fix truncated JSON...');
        try {
          const fixed = fixTruncatedJSON(jsonMatch[0]);
          const parsed = JSON.parse(fixed);
          console.log('Successfully parsed fixed JSON');
          return parsed;
        } catch (e2) {
          console.log('Could not fix JSON object:', e2.message);
        }
      }
    }

    // Try to find and parse JSON array
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e) {
        // Try fixing truncated array
        try {
          const fixed = fixTruncatedJSON(arrayMatch[0]);
          return JSON.parse(fixed);
        } catch (e2) {
          console.log('Could not fix JSON array:', e2.message);
        }
      }
    }

    // Last resort - try to fix the entire cleaned string
    try {
      const fixed = fixTruncatedJSON(cleaned);
      const parsed = JSON.parse(fixed);
      console.log('Successfully parsed fixed entire response');
      return parsed;
    } catch (e) {
      // If all parsing fails, return the cleaned text
      console.error('All JSON parsing attempts failed');
      return { rawResponse: response, parseError: true };
    }
  } catch (e) {
    console.error('JSON parse error:', e.message);
    return { rawResponse: response, parseError: true };
  }
}

// 1. Generate complete itinerary
async function generateItinerary(fromLocation, destination, days, budget, interests) {
  // Cap at 14 days; for very long trips split into chunks of 7 if needed
  const limitedDays = Math.min(days, 14);

  const messages = [
    {
      role: 'system',
      content: 'You are a travel planner. Return ONLY valid JSON, no markdown.'
    },
    {
      role: 'user',
      content: `Create a ${limitedDays}-day trip from ${fromLocation || 'USA'} to ${destination}. Budget: $${budget}. Interests: ${interests.join(', ')}.

Return this JSON (2-3 activities per day, covering all ${limitedDays} days):
{
  "fromLocation": "${fromLocation || 'USA'}",
  "destination": "${destination}",
  "totalDays": ${limitedDays},
  "estimatedBudget": ${budget},
  "summary": "one sentence summary",
  "days": [
    {"day": 1, "theme": "theme", "activities": [{"time": "09:00", "name": "activity", "cost": 0}]}
  ],
  "tips": ["tip1", "tip2", "tip3"]
}`
    }
  ];

  const response = await callOpenRouter(messages, { maxTokens: 10000 });
  return parseJsonResponse(response);
}

// 2. Intelligent Auto-Fill for Destinations
async function autoFillDestination(destination) {
  const messages = [
    {
      role: 'system',
      content: 'You are a travel destination expert. Provide comprehensive destination information. Always respond with valid JSON only.'
    },
    {
      role: 'user',
      content: `Provide complete travel information for "${destination}". Return ONLY valid JSON:
      {
        "name": "${destination}",
        "country": "country name",
        "city": "city name",
        "description": "2-3 sentence description",
        "best_time_to_visit": "best months to visit",
        "language": "primary language(s)",
        "currency": "currency code (e.g., USD, EUR)",
        "timezone": "timezone (e.g., GMT+1)",
        "climate": "climate description",
        "visa_requirements": "general visa info for tourists",
        "safety_rating": "Safe/Moderate/Caution",
        "safety_tips": ["tip1", "tip2", "tip3"],
        "cultural_etiquette": ["etiquette1", "etiquette2", "etiquette3"],
        "emergency_numbers": { "police": "number", "ambulance": "number", "tourist_helpline": "number" },
        "popular_attractions": ["attraction1", "attraction2", "attraction3"],
        "local_cuisine": ["dish1", "dish2", "dish3"],
        "average_daily_budget": { "budget": 50, "moderate": 100, "luxury": 250 },
        "rating": 4.5
      }`
    }
  ];

  const response = await callOpenRouter(messages);
  return parseJsonResponse(response);
}

// 3. Budget Optimizer
async function optimizeBudget(destination, days, currentBudget, travelStyle, expenses) {
  const messages = [
    {
      role: 'system',
      content: 'You are a travel budget expert. Analyze budgets and provide money-saving recommendations. Always respond with valid JSON.'
    },
    {
      role: 'user',
      content: `Analyze and optimize this travel budget for ${destination} (${days} days):
      Current Budget: $${currentBudget}
      Travel Style: ${travelStyle}
      Current Expenses: ${JSON.stringify(expenses || {})}

      Return JSON:
      {
        "analysis": {
          "totalPlanned": ${currentBudget},
          "estimatedActual": number,
          "status": "Under Budget/On Track/Over Budget",
          "savingsPotential": number
        },
        "breakdown": {
          "accommodation": { "allocated": number, "recommended": number, "tip": "saving tip" },
          "food": { "allocated": number, "recommended": number, "tip": "saving tip" },
          "transportation": { "allocated": number, "recommended": number, "tip": "saving tip" },
          "activities": { "allocated": number, "recommended": number, "tip": "saving tip" },
          "shopping": { "allocated": number, "recommended": number, "tip": "saving tip" },
          "miscellaneous": { "allocated": number, "recommended": number, "tip": "saving tip" }
        },
        "moneySavingTips": [
          { "tip": "tip description", "potentialSavings": number },
          { "tip": "tip description", "potentialSavings": number }
        ],
        "freeActivities": ["activity1", "activity2", "activity3"],
        "budgetAlternatives": [
          { "instead_of": "expensive option", "try": "budget option", "savings": number }
        ],
        "splurgeWorthy": ["worth spending on 1", "worth spending on 2"],
        "warnings": ["warning if any"],
        "dailyBudgetRecommendation": number
      }`
    }
  ];

  const response = await callOpenRouter(messages);
  return parseJsonResponse(response);
}

// 4. Smart Packing List Generator
async function generateSmartPackingList(destination, duration, season, activities, tripType) {
  const messages = [
    {
      role: 'system',
      content: 'You are a travel packing expert. Create concise packing lists. Respond with valid JSON only, no markdown.'
    },
    {
      role: 'user',
      content: `Create a packing list for ${destination} (${duration} days, ${season}, ${tripType || 'leisure'}).

Return this exact JSON format with 3-5 items per category:
{
  "destination": "${destination}",
  "duration": "${duration} days",
  "season": "${season}",
  "weatherForecast": "brief weather summary",
  "categories": {
    "documents": [{"item": "name", "quantity": 1, "priority": "essential", "notes": "brief note"}],
    "clothing": [{"item": "name", "quantity": 1, "priority": "essential", "notes": "brief note"}],
    "toiletries": [{"item": "name", "quantity": 1, "priority": "essential", "notes": "brief note"}],
    "electronics": [{"item": "name", "quantity": 1, "priority": "important", "notes": "brief note"}],
    "miscellaneous": [{"item": "name", "quantity": 1, "priority": "optional", "notes": "brief note"}]
  },
  "tips": ["tip 1", "tip 2", "tip 3"]
}`
    }
  ];

  const response = await callOpenRouter(messages, { maxTokens: 10000 });
  return parseJsonResponse(response);
}

// 5. Travel Chat Assistant
async function chatAssistant(message, context) {
  const messages = [
    {
      role: 'system',
      content: `You are a helpful AI travel assistant. You help users plan trips, answer travel questions, and provide recommendations.

      Current context:
      - Current Trip: ${context.tripName || 'Not specified'}
      - Destination: ${context.destination || 'Not specified'}
      - Travel Dates: ${context.dates || 'Not specified'}

      Be concise, helpful, and practical. If you don't know something specific, say so and provide general guidance.`
    },
    {
      role: 'user',
      content: message
    }
  ];

  const response = await callOpenRouter(messages, { maxTokens: 10000, temperature: 0.8 });
  return { response };
}

// 6. Review Summarizer
async function summarizeReviews(reviews) {
  const messages = [
    {
      role: 'system',
      content: 'You are a travel review analyst. Summarize and analyze travel reviews to provide insights. Always respond with valid JSON.'
    },
    {
      role: 'user',
      content: `Analyze and summarize these travel reviews:
      ${JSON.stringify(reviews)}

      Return JSON:
      {
        "overallSentiment": "Positive/Mixed/Negative",
        "averageRating": number,
        "totalReviews": ${reviews.length},
        "summary": "2-3 sentence overall summary",
        "commonPros": ["pro1", "pro2", "pro3"],
        "commonCons": ["con1", "con2", "con3"],
        "highlights": ["memorable experience 1", "memorable experience 2"],
        "recommendations": ["recommendation 1", "recommendation 2"],
        "bestFor": ["type of traveler 1", "type of traveler 2"],
        "tipFromReviews": "most useful tip extracted from reviews",
        "categoryBreakdown": {
          "accommodation": { "sentiment": "Positive/Mixed/Negative", "summary": "brief" },
          "food": { "sentiment": "Positive/Mixed/Negative", "summary": "brief" },
          "activities": { "sentiment": "Positive/Mixed/Negative", "summary": "brief" },
          "value": { "sentiment": "Positive/Mixed/Negative", "summary": "brief" }
        }
      }`
    }
  ];

  const response = await callOpenRouter(messages);
  return parseJsonResponse(response);
}

// 7. Itinerary Conflict Detection & Optimization
async function analyzeItinerary(activities, destination, days = 5) {
  // If no activities provided, generate a sample itinerary for the destination first
  const hasActivities = activities && activities.length > 0;

  const messages = [
    {
      role: 'system',
      content: 'You are a travel itinerary optimizer. Create and analyze travel itineraries. Always respond with valid JSON.'
    },
    {
      role: 'user',
      content: hasActivities
        ? `Analyze this itinerary for ${destination}:
      Activities: ${JSON.stringify(activities)}

      Check for conflicts, timing issues, and optimization opportunities.`
        : `Create a ${days}-day itinerary for ${destination} and then analyze it for potential issues.

      Generate 3-4 activities per day with realistic times, then check for:
      1. Time conflicts or tight schedules
      2. Travel time between locations
      3. Missing meals or rest time
      4. Better activity ordering

      Return JSON:
      {
        "destination": "${destination}",
        "generatedItinerary": [
          { "day": 1, "activity": "activity name", "time": "09:00", "duration": "2 hours", "location": "place", "cost": 0 }
        ],
        "hasConflicts": true/false,
        "conflicts": [
          { "type": "issue type", "activity1": "name", "activity2": "name", "description": "issue", "suggestion": "fix" }
        ],
        "warnings": [
          { "type": "warning", "message": "message", "suggestion": "suggestion" }
        ],
        "optimizedOrder": [
          { "day": 1, "activities": [{ "time": "09:00", "activity": "name", "reason": "why" }] }
        ],
        "topAttractions": ["must-see 1", "must-see 2", "must-see 3"],
        "dailyBudget": 100,
        "overallScore": 85,
        "feedback": "assessment",
        "topSuggestions": ["tip 1", "tip 2", "tip 3"]
      }`
    }
  ];

  const response = await callOpenRouter(messages, { maxTokens: 10000 });
  return parseJsonResponse(response);
}

// 8. Suggest Activities
async function suggestActivities(destination, interests, budget) {
  const messages = [
    {
      role: 'system',
      content: 'You are a travel activity expert. Suggest unique and memorable activities. Always respond with valid JSON array.'
    },
    {
      role: 'user',
      content: `Suggest 10 activities for ${destination}.
      Interests: ${interests.join(', ')}
      Budget level: ${budget}

      Return JSON array:
      [
        {
          "name": "activity name",
          "description": "2-3 sentences",
          "estimatedCost": number,
          "duration": "2 hours",
          "category": "Culture/Adventure/Food/Nature/Entertainment",
          "bestTime": "morning/afternoon/evening",
          "bookingRequired": true/false,
          "insiderTip": "helpful tip"
        }
      ]`
    }
  ];

  const response = await callOpenRouter(messages);
  const result = parseJsonResponse(response);
  return Array.isArray(result) ? result : result.activities || [];
}

// 9. Suggest Restaurants
async function suggestRestaurants(destination, cuisine, budget) {
  const messages = [
    {
      role: 'system',
      content: 'You are a culinary travel expert. Recommend restaurants with helpful details. Always respond with valid JSON array.'
    },
    {
      role: 'user',
      content: `Recommend 10 restaurants in ${destination}.
      Cuisine preference: ${cuisine}
      Budget level: ${budget}

      Return JSON array:
      [
        {
          "name": "restaurant name",
          "cuisine": "cuisine type",
          "priceRange": "$/$$/$$$/$$$",
          "specialty": "signature dish",
          "atmosphere": "casual/fine dining/street food",
          "address": "general area/neighborhood",
          "mustTry": ["dish1", "dish2"],
          "reservationNeeded": true/false,
          "tip": "insider tip"
        }
      ]`
    }
  ];

  const response = await callOpenRouter(messages);
  const result = parseJsonResponse(response);
  return Array.isArray(result) ? result : result.restaurants || [];
}

// 10. Suggest Accommodations
async function suggestAccommodations(destination, type, budget, nights) {
  const messages = [
    {
      role: 'system',
      content: 'You are an accommodation expert. Recommend lodging options. Always respond with valid JSON array.'
    },
    {
      role: 'user',
      content: `Recommend 10 ${type} accommodations in ${destination} for ${nights} nights.
      Budget: $${budget} total

      Return JSON array:
      [
        {
          "name": "hotel name",
          "type": "${type}",
          "pricePerNight": number,
          "rating": 4.5,
          "neighborhood": "area name",
          "amenities": ["amenity1", "amenity2"],
          "bestFor": "couples/families/solo travelers",
          "walkingDistanceTo": ["attraction1", "attraction2"],
          "tip": "insider tip"
        }
      ]`
    }
  ];

  const response = await callOpenRouter(messages);
  const result = parseJsonResponse(response);
  return Array.isArray(result) ? result : result.accommodations || [];
}

// 11. Get Destination Info
async function getDestinationInfo(destination) {
  return await autoFillDestination(destination);
}

// 12. Translate Phrase
async function translatePhrase(phrase, targetLanguage) {
  const messages = [
    {
      role: 'system',
      content: 'You are a language translation expert for travelers. Provide translations with pronunciation guides. Always respond with valid JSON.'
    },
    {
      role: 'user',
      content: `Translate for a traveler: "${phrase}" to ${targetLanguage}.

      Return JSON:
      {
        "original": "${phrase}",
        "translation": "translated text",
        "pronunciation": "phonetic pronunciation",
        "formal": "formal version if different",
        "informal": "informal version if different",
        "context": "when to use this phrase",
        "culturalNote": "any cultural context",
        "relatedPhrases": [
          { "phrase": "related phrase", "translation": "translation", "pronunciation": "phonetic" }
        ]
      }`
    }
  ];

  const response = await callOpenRouter(messages);
  return parseJsonResponse(response);
}

// 13. Generate Trip Summary Report
async function generateTripReport(tripData) {
  const messages = [
    {
      role: 'system',
      content: 'You are a travel report writer. Create comprehensive trip summary reports. Always respond with valid JSON.'
    },
    {
      role: 'user',
      content: `Generate a trip summary report:
      Trip: ${JSON.stringify(tripData)}

      Return JSON:
      {
        "title": "Trip to [Destination] Summary",
        "overview": "2-3 paragraph trip overview",
        "highlights": ["highlight 1", "highlight 2", "highlight 3"],
        "statistics": {
          "totalDays": number,
          "totalSpent": number,
          "placesVisited": number,
          "mealsEaten": number,
          "photosWorthTaking": number
        },
        "bestMoments": ["moment 1", "moment 2"],
        "lessonsLearned": ["lesson 1", "lesson 2"],
        "recommendations": {
          "mustDo": ["activity 1", "activity 2"],
          "skip": ["what to skip"],
          "budgetTips": ["tip 1", "tip 2"]
        },
        "wouldReturn": true/false,
        "idealFor": ["type of traveler"],
        "rating": 4.5,
        "oneLineReview": "If I had to describe this trip in one line..."
      }`
    }
  ];

  const response = await callOpenRouter(messages);
  return parseJsonResponse(response);
}

// 14. AI Flight Finder
async function findFlights(origin, destination, departureDate, returnDate, budget, passengers) {
  const messages = [
    {
      role: 'system',
      content: 'You are a flight search expert. Recommend flights with realistic prices and airlines. Always respond with valid JSON.'
    },
    {
      role: 'user',
      content: `Find flight options from ${origin} to ${destination}.
      Departure: ${departureDate || 'flexible'}
      Return: ${returnDate || 'flexible'}
      Budget: $${budget || 500} per person
      Passengers: ${passengers || 1}

      Return JSON:
      {
        "searchCriteria": {
          "origin": "${origin}",
          "destination": "${destination}",
          "departureDate": "${departureDate || 'flexible'}",
          "returnDate": "${returnDate || 'flexible'}",
          "passengers": ${passengers || 1}
        },
        "recommendations": [
          {
            "airline": "airline name",
            "flightNumber": "XX123",
            "departureTime": "09:00",
            "arrivalTime": "14:30",
            "duration": "5h 30m",
            "stops": 0,
            "price": number,
            "class": "Economy/Business",
            "bookingTip": "helpful booking tip",
            "pros": ["pro1", "pro2"],
            "cons": ["con1"]
          }
        ],
        "cheapestOption": {
          "airline": "name",
          "price": number,
          "tradeoffs": "what you sacrifice"
        },
        "bestValue": {
          "airline": "name",
          "price": number,
          "why": "why this is best value"
        },
        "premiumOption": {
          "airline": "name",
          "price": number,
          "benefits": "what you get"
        },
        "bookingTips": ["tip1", "tip2", "tip3"],
        "bestTimeToBook": "recommendation",
        "priceAlerts": "when prices typically drop",
        "alternativeAirports": [
          { "airport": "nearby airport", "savings": number }
        ],
        "totalEstimate": {
          "budget": number,
          "moderate": number,
          "premium": number
        }
      }`
    }
  ];

  const response = await callOpenRouter(messages, { maxTokens: 10000 });
  return parseJsonResponse(response);
}

// 15. AI Weather Advisor
async function getWeatherAdvice(destination, travelDates, activities) {
  const messages = [
    {
      role: 'system',
      content: 'You are a travel weather expert. Provide detailed weather information and packing advice. Always respond with valid JSON.'
    },
    {
      role: 'user',
      content: `Provide weather advice for traveling to ${destination}.
      Travel dates: ${travelDates || 'upcoming month'}
      Planned activities: ${activities ? activities.join(', ') : 'general sightseeing'}

      Return JSON:
      {
        "destination": "${destination}",
        "travelPeriod": "${travelDates || 'upcoming month'}",
        "weatherOverview": {
          "temperature": {
            "high": "XX°C/°F",
            "low": "XX°C/°F",
            "average": "XX°C/°F"
          },
          "humidity": "XX%",
          "precipitation": "XX% chance",
          "conditions": "sunny/cloudy/rainy/etc",
          "uvIndex": "low/moderate/high/very high"
        },
        "seasonInfo": {
          "currentSeason": "summer/winter/etc",
          "description": "what to expect",
          "isTouristSeason": true,
          "crowdLevel": "low/moderate/high"
        },
        "dailyForecast": [
          {
            "day": "Monday",
            "date": "date if known",
            "high": "XX°C",
            "low": "XX°C",
            "conditions": "description",
            "rainChance": "XX%",
            "recommendation": "best activities for this day"
          }
        ],
        "activityRecommendations": [
          {
            "activity": "activity name",
            "bestTime": "morning/afternoon/evening",
            "weatherSuitability": "ideal/good/manageable/avoid",
            "tip": "helpful tip"
          }
        ],
        "packingRecommendations": {
          "essentials": ["item1", "item2"],
          "clothing": ["item1", "item2"],
          "accessories": ["item1", "item2"],
          "weatherGear": ["item1", "item2"]
        },
        "warnings": ["any weather warnings or concerns"],
        "bestTimesToVisit": {
          "overall": "best months",
          "forWeather": "months with best weather",
          "forPrices": "months with lower prices",
          "avoid": "months to avoid and why"
        },
        "localTips": ["local weather tip 1", "local weather tip 2"],
        "sunriseSunset": {
          "sunrise": "approximate time",
          "sunset": "approximate time",
          "goldenHour": "best time for photos"
        }
      }`
    }
  ];

  const response = await callOpenRouter(messages, { maxTokens: 10000 });
  return parseJsonResponse(response);
}

// 16. AI Hotel Matcher (Enhanced accommodation finder)
async function matchHotels(destination, preferences, budget, dates, travelers) {
  const messages = [
    {
      role: 'system',
      content: 'You are a hotel concierge expert. Match travelers with perfect accommodations based on their preferences. Always respond with valid JSON.'
    },
    {
      role: 'user',
      content: `Find the perfect hotel in ${destination}.
      Preferences: ${preferences ? preferences.join(', ') : 'comfort, location, value'}
      Budget: $${budget || 150} per night
      Dates: ${dates || 'flexible'}
      Travelers: ${travelers || '2 adults'}

      Return JSON:
      {
        "destination": "${destination}",
        "searchCriteria": {
          "budget": ${budget || 150},
          "preferences": ${JSON.stringify(preferences || ['comfort', 'location', 'value'])},
          "travelers": "${travelers || '2 adults'}"
        },
        "perfectMatches": [
          {
            "name": "hotel name",
            "type": "Hotel/Resort/Boutique/etc",
            "starRating": 4,
            "pricePerNight": number,
            "matchScore": 95,
            "neighborhood": "area name",
            "distanceToCenter": "X km/miles",
            "highlights": ["highlight1", "highlight2"],
            "amenities": ["amenity1", "amenity2"],
            "bestFor": "who this hotel is best for",
            "pros": ["pro1", "pro2"],
            "cons": ["con1"],
            "bookingTip": "helpful tip",
            "cancelPolicy": "policy summary"
          }
        ],
        "budgetOptions": [
          {
            "name": "budget hotel",
            "pricePerNight": number,
            "tradeoffs": "what you compromise",
            "stillGreatFor": "why it's still good"
          }
        ],
        "splurgeOptions": [
          {
            "name": "luxury option",
            "pricePerNight": number,
            "worthIt": "why it's worth splurging"
          }
        ],
        "neighborhoodGuide": [
          {
            "name": "neighborhood name",
            "vibe": "description",
            "bestFor": "type of traveler",
            "avgPrice": number,
            "walkability": "score or description"
          }
        ],
        "bookingTips": ["tip1", "tip2", "tip3"],
        "bestTimeToBook": "recommendation",
        "alternativeAccommodation": {
          "type": "Airbnb/Hostel/etc",
          "recommendation": "when to consider this instead"
        }
      }`
    }
  ];

  const response = await callOpenRouter(messages, { maxTokens: 10000 });
  return parseJsonResponse(response);
}

// 17. Packing List Optimizer (weather + activities aware)
async function optimizePackingList(destination, activities, weatherSummary, duration) {
  const messages = [
    {
      role: 'system',
      content: 'You are a travel packing optimization expert. Create context-aware packing lists based on weather and planned activities. Respond with valid JSON only.'
    },
    {
      role: 'user',
      content: `Optimize a packing list for ${destination} (${duration} days).
Weather: ${weatherSummary || 'typical seasonal'}
Planned activities: ${(activities || []).join(', ') || 'general sightseeing'}

Return JSON:
{
  "destination": "${destination}",
  "duration": ${duration},
  "weatherBasedRecommendations": ["item1", "item2"],
  "activityBasedRecommendations": ["item1", "item2"],
  "categories": {
    "essential_documents": [{"item": "name", "priority": "must-have", "note": "reason"}],
    "clothing": [{"item": "name", "quantity": 1, "priority": "must-have", "weather_reason": "reason"}],
    "activity_gear": [{"item": "name", "for_activity": "activity", "priority": "important"}],
    "toiletries": [{"item": "name", "quantity": 1, "priority": "must-have"}],
    "electronics": [{"item": "name", "priority": "important", "note": "note"}],
    "medications_safety": [{"item": "name", "priority": "must-have", "note": "note"}]
  },
  "leave_behind": ["item you don't need based on context"],
  "weight_saving_tips": ["tip1", "tip2"],
  "packing_order": "advice on order to pack items"
}`
    }
  ];

  const response = await callOpenRouter(messages, { maxTokens: 4000 });
  return parseJsonResponse(response);
}

// 18. Trip Inspiration (personalized destination recommendations)
async function tripInspiration(budget, duration, vibe, pastDestinations) {
  const messages = [
    {
      role: 'system',
      content: 'You are a personalized travel inspiration expert. Recommend destinations based on user preferences and past travel. Respond with valid JSON only.'
    },
    {
      role: 'user',
      content: `Recommend travel destinations based on:
Budget: $${budget}
Duration: ${duration} days
Vibe: ${vibe} (beach/adventure/city/culture)
Past destinations: ${(pastDestinations || []).join(', ') || 'none yet'}

Avoid recommending places already visited. Return JSON:
{
  "recommendations": [
    {
      "name": "Destination, Country",
      "match_score": 95,
      "highlights": ["highlight1", "highlight2", "highlight3"],
      "best_season": "months to visit",
      "budget_estimate": {"low": 800, "mid": 1200, "high": 2000},
      "vibe_match": "why this matches the vibe",
      "unique_experiences": ["experience1", "experience2"],
      "getting_there": "typical flight info"
    }
  ],
  "hidden_gems": [{"name": "destination", "why": "reason", "budget_estimate": 1000}],
  "tips": ["general travel tip"]
}`
    }
  ];

  const response = await callOpenRouter(messages, { maxTokens: 4000 });
  return parseJsonResponse(response);
}

// 19. Day-Of Live Plan Adjuster
async function dayOfPlan(currentActivities, currentLocation, currentTime, delays) {
  const messages = [
    {
      role: 'system',
      content: 'You are a real-time travel itinerary adjuster. Help travelers adapt their plans to current conditions. Respond with valid JSON only.'
    },
    {
      role: 'user',
      content: `Adjust today's travel plan:
Current location: ${currentLocation || 'unknown'}
Current time: ${currentTime || new Date().toLocaleTimeString()}
Planned activities: ${JSON.stringify(currentActivities || [])}
Delays/issues: ${delays || 'none'}

Return adjusted schedule JSON:
{
  "adjusted_schedule": [
    {
      "time": "HH:MM",
      "activity": "activity name",
      "location": "specific place",
      "duration_minutes": 90,
      "tips": "real-time tip",
      "status": "on-time/adjusted/skipped"
    }
  ],
  "nearby_alternatives": [
    {"name": "place", "type": "restaurant/attraction/cafe", "distance": "5 min walk", "why": "reason"}
  ],
  "time_saved_or_lost": "+30 min",
  "recommendations": ["tip for rest of day"]
}`
    }
  ];

  const response = await callOpenRouter(messages, { maxTokens: 3000 });
  return parseJsonResponse(response);
}

module.exports = {
  callOpenRouter,
  generateItinerary,
  autoFillDestination,
  optimizeBudget,
  generateSmartPackingList,
  chatAssistant,
  summarizeReviews,
  analyzeItinerary,
  suggestActivities,
  suggestRestaurants,
  suggestAccommodations,
  getDestinationInfo,
  translatePhrase,
  generateTripReport,
  findFlights,
  getWeatherAdvice,
  matchHotels,
  optimizePackingList,
  tripInspiration,
  dayOfPlan
};
