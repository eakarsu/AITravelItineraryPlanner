import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
  verify: () => api.get('/auth/verify'),
  getDemoCredentials: () => api.get('/auth/demo-credentials'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// Generic CRUD for all features
const createCrud = (endpoint) => ({
  getAll: () => api.get(endpoint),
  getById: (id) => api.get(`${endpoint}/${id}`),
  create: (data) => api.post(endpoint, data),
  update: (id, data) => api.put(`${endpoint}/${id}`, data),
  delete: (id) => api.delete(`${endpoint}/${id}`),
  bulkDelete: (ids) => api.delete(`${endpoint}/bulk`, { data: { ids } }),
});

export const trips = createCrud('/trips');
export const destinations = createCrud('/destinations');
export const activities = createCrud('/activities');
export const accommodations = createCrud('/accommodations');
export const transportation = createCrud('/transportation');
export const restaurants = createCrud('/restaurants');
export const budgets = createCrud('/budgets');
export const documents = createCrud('/documents');
export const packingLists = createCrud('/packing-lists');
export const travelTips = createCrud('/travel-tips');
export const emergencyContacts = createCrud('/emergency-contacts');
export const reviews = createCrud('/reviews');
export const photos = createCrud('/photos');
export const notes = createCrud('/notes');

// AI History
export const aiHistory = {
  getAll: () => api.get('/ai-history'),
  getById: (id) => api.get(`/ai-history/${id}`),
  delete: (id) => api.delete(`/ai-history/${id}`),
  clearAll: () => api.delete('/ai-history'),
};

// AI Features
export const ai = {
  // 1. Generate complete itinerary
  generateItinerary: (data) => api.post('/ai/generate-itinerary', data),

  // 2. Auto-fill destination information
  autoFillDestination: (data) => api.post('/ai/auto-fill-destination', data),

  // 3. Budget optimizer
  optimizeBudget: (data) => api.post('/ai/optimize-budget', data),

  // 4. Smart packing list
  smartPackingList: (data) => api.post('/ai/smart-packing-list', data),

  // 5. Chat assistant
  chat: (data) => api.post('/ai/chat', data),

  // 6. Summarize reviews
  summarizeReviews: (data) => api.post('/ai/summarize-reviews', data),

  // 7. Analyze itinerary for conflicts
  analyzeItinerary: (data) => api.post('/ai/analyze-itinerary', data),

  // 8. Suggest activities
  suggestActivities: (data) => api.post('/ai/suggest-activities', data),

  // 9. Suggest restaurants
  suggestRestaurants: (data) => api.post('/ai/suggest-restaurants', data),

  // 10. Suggest accommodations
  suggestAccommodations: (data) => api.post('/ai/suggest-accommodations', data),

  // 11. Get destination info
  getDestinationInfo: (data) => api.post('/ai/destination-info', data),

  // 12. Translate phrase
  translate: (data) => api.post('/ai/translate', data),

  // 13. Generate trip report
  generateTripReport: (data) => api.post('/ai/trip-report', data),

  // 14. AI Flight Finder
  findFlights: (data) => api.post('/ai/find-flights', data),

  // 15. AI Weather Advisor
  getWeatherAdvice: (data) => api.post('/ai/weather-advice', data),

  // 16. AI Hotel Matcher
  matchHotels: (data) => api.post('/ai/match-hotels', data),

  // Legacy endpoints
  generatePackingList: (data) => api.post('/ai/generate-packing-list', data),
  getBudgetAdvice: (data) => api.post('/ai/budget-advice', data),
};

export default api;
