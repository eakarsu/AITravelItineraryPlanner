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

  // 17. Packing optimizer (weather + activities aware)
  optimizePacking: (data) => api.post('/ai/optimize-packing', data),

  // 18. Trip inspiration
  tripInspiration: (data) => api.post('/ai/trip-inspiration', data),

  // 19. Day-of plan adjuster
  dayOfPlan: (data) => api.post('/ai/day-of-plan', data),

  // 20. Similar trips
  similarTrips: (data) => api.post('/ai/similar-trips', data),
};

// Collaborators
export const collaborators = {
  invite: (tripId, data) => api.post(`/collaborators/trips/${tripId}/invite`, data),
  getSharedTrips: () => api.get('/collaborators/trips/shared'),
  getTripCollaborators: (tripId) => api.get(`/collaborators/trips/${tripId}/collaborators`),
  acceptInvite: (tripId, collabId) => api.put(`/collaborators/trips/${tripId}/collaborators/${collabId}/accept`),
  removeCollaborator: (tripId, collabId) => api.delete(`/collaborators/trips/${tripId}/collaborators/${collabId}`),
};

// Document uploads
export const documentUploads = {
  upload: (tripId, formData) => api.post(`/documents/${tripId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list: (tripId) => api.get(`/documents/${tripId}`),
  delete: (tripId, docId) => api.delete(`/documents/${tripId}/${docId}`),
};

// Photo uploads
export const photoUploads = {
  upload: (tripId, formData) => api.post(`/photos/${tripId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list: (tripId) => api.get(`/photos/${tripId}/uploads`),
  delete: (tripId, photoId) => api.delete(`/photos/${tripId}/${photoId}`),
};

// AI Results
export const aiResults = {
  getAll: (params) => api.get('/ai-results', { params }),
  getById: (id) => api.get(`/ai-results/${id}`),
  delete: (id) => api.delete(`/ai-results/${id}`),
};

export default api;
