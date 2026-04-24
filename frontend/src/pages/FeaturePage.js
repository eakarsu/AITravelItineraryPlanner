import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import AIChat from '../components/AIChat';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { validateField, validateForm } from '../utils/validation';

const featureConfigs = {
  trips: {
    title: 'Trips',
    icon: '🌍',
    apiKey: 'trips',
    columns: ['name', 'from_location', 'destination', 'start_date', 'end_date', 'budget', 'status'],
    columnLabels: { name: 'Trip Name', from_location: 'From', destination: 'To', start_date: 'Start Date', end_date: 'End Date', budget: 'Budget', status: 'Status' },
    fields: [
      { name: 'name', label: 'Trip Name', type: 'text', required: true },
      { name: 'from_location', label: 'From (City/Country)', type: 'text', required: true },
      { name: 'destination', label: 'Destination', type: 'text', required: true },
      { name: 'start_date', label: 'Start Date', type: 'date' },
      { name: 'end_date', label: 'End Date', type: 'date' },
      { name: 'budget', label: 'Budget ($)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['planning', 'confirmed', 'completed'] },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    aiFeatures: ['itinerary', 'budget', 'report'],
  },
  destinations: {
    title: 'Destinations',
    icon: '📍',
    apiKey: 'destinations',
    columns: ['name', 'country', 'city', 'best_time_to_visit', 'rating'],
    columnLabels: { name: 'Name', country: 'Country', city: 'City', best_time_to_visit: 'Best Time', rating: 'Rating' },
    fields: [
      { name: 'name', label: 'Destination Name', type: 'text', required: true },
      { name: 'country', label: 'Country', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'best_time_to_visit', label: 'Best Time to Visit', type: 'text' },
      { name: 'language', label: 'Language', type: 'text' },
      { name: 'currency', label: 'Currency', type: 'text' },
      { name: 'timezone', label: 'Timezone', type: 'text' },
      { name: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5, step: 0.1 },
    ],
    aiFeatures: ['autofill', 'info'],
  },
  activities: {
    title: 'Activities',
    icon: '🎯',
    apiKey: 'activities',
    columns: ['name', 'category', 'date', 'time', 'duration', 'cost', 'booking_status'],
    columnLabels: { name: 'Activity', category: 'Category', date: 'Date', time: 'Time', duration: 'Duration', cost: 'Cost', booking_status: 'Status' },
    fields: [
      { name: 'name', label: 'Activity Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'time', label: 'Time', type: 'time' },
      { name: 'duration', label: 'Duration', type: 'text' },
      { name: 'cost', label: 'Cost ($)', type: 'number' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['Sightseeing', 'Culture', 'Nature', 'Food', 'Entertainment', 'Outdoor', 'History', 'Wellness'] },
      { name: 'booking_status', label: 'Booking Status', type: 'select', options: ['not_booked', 'booked', 'confirmed'] },
      { name: 'booking_reference', label: 'Booking Reference', type: 'text' },
    ],
    aiFeatures: ['suggest', 'analyze'],
  },
  accommodations: {
    title: 'Accommodations',
    icon: '🏨',
    apiKey: 'accommodations',
    columns: ['name', 'type', 'check_in_date', 'check_out_date', 'price_per_night', 'rating', 'booking_status'],
    columnLabels: { name: 'Name', type: 'Type', check_in_date: 'Check In', check_out_date: 'Check Out', price_per_night: 'Per Night', rating: 'Rating', booking_status: 'Status' },
    fields: [
      { name: 'name', label: 'Accommodation Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['Hotel', 'Resort', 'Hostel', 'Airbnb', 'Boutique Hotel', 'Luxury Hotel', 'Villa', 'Apartment'] },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'check_in_date', label: 'Check-in Date', type: 'date' },
      { name: 'check_out_date', label: 'Check-out Date', type: 'date' },
      { name: 'price_per_night', label: 'Price per Night ($)', type: 'number' },
      { name: 'total_price', label: 'Total Price ($)', type: 'number' },
      { name: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5, step: 0.1 },
      { name: 'booking_status', label: 'Booking Status', type: 'select', options: ['not_booked', 'pending', 'confirmed'] },
      { name: 'booking_reference', label: 'Booking Reference', type: 'text' },
      { name: 'contact_phone', label: 'Contact Phone', type: 'text' },
      { name: 'contact_email', label: 'Contact Email', type: 'email' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    aiFeatures: ['suggest'],
  },
  transportation: {
    title: 'Transportation',
    icon: '✈️',
    apiKey: 'transportation',
    columns: ['type', 'provider', 'departure_location', 'arrival_location', 'departure_date', 'cost', 'status'],
    columnLabels: { type: 'Type', provider: 'Provider', departure_location: 'From', arrival_location: 'To', departure_date: 'Date', cost: 'Cost', status: 'Status' },
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['Flight', 'Train', 'Bus', 'Ferry', 'Car Rental', 'Taxi', 'Shuttle'], required: true },
      { name: 'provider', label: 'Provider/Airline', type: 'text' },
      { name: 'departure_location', label: 'From', type: 'text' },
      { name: 'arrival_location', label: 'To', type: 'text' },
      { name: 'departure_date', label: 'Departure Date', type: 'date' },
      { name: 'departure_time', label: 'Departure Time', type: 'time' },
      { name: 'arrival_date', label: 'Arrival Date', type: 'date' },
      { name: 'arrival_time', label: 'Arrival Time', type: 'time' },
      { name: 'cost', label: 'Cost ($)', type: 'number' },
      { name: 'booking_reference', label: 'Booking Reference', type: 'text' },
      { name: 'seat_info', label: 'Seat Info', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'booked', 'confirmed', 'completed'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  restaurants: {
    title: 'Restaurants',
    icon: '🍽️',
    apiKey: 'restaurants',
    columns: ['name', 'cuisine', 'address', 'price_range', 'rating'],
    columnLabels: { name: 'Name', cuisine: 'Cuisine', address: 'Address', price_range: 'Price', rating: 'Rating' },
    fields: [
      { name: 'name', label: 'Restaurant Name', type: 'text', required: true },
      { name: 'cuisine', label: 'Cuisine Type', type: 'text' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'price_range', label: 'Price Range', type: 'select', options: ['$', '$$', '$$$', '$$$$'] },
      { name: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5, step: 0.1 },
      { name: 'reservation_date', label: 'Reservation Date', type: 'date' },
      { name: 'reservation_time', label: 'Reservation Time', type: 'time' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'website', label: 'Website', type: 'url' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    aiFeatures: ['suggest'],
  },
  budgets: {
    title: 'Budgets',
    icon: '💰',
    apiKey: 'budgets',
    columns: ['category', 'planned_amount', 'actual_amount', 'currency'],
    columnLabels: { category: 'Category', planned_amount: 'Planned', actual_amount: 'Actual', currency: 'Currency' },
    fields: [
      { name: 'category', label: 'Category', type: 'select', options: ['Flights', 'Accommodation', 'Food & Dining', 'Activities', 'Transportation', 'Shopping', 'Entertainment', 'Emergency Fund', 'Travel Insurance', 'Visa Fees', 'Tips & Gratuities', 'Phone & Data', 'Miscellaneous'], required: true },
      { name: 'planned_amount', label: 'Planned Amount', type: 'number' },
      { name: 'actual_amount', label: 'Actual Amount', type: 'number' },
      { name: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    aiFeatures: ['optimize'],
  },
  documents: {
    title: 'Documents',
    icon: '📄',
    apiKey: 'documents',
    columns: ['type', 'name', 'document_number', 'expiry_date', 'issuing_country'],
    columnLabels: { type: 'Type', name: 'Name', document_number: 'Number', expiry_date: 'Expires', issuing_country: 'Country' },
    fields: [
      { name: 'type', label: 'Document Type', type: 'select', options: ['Passport', 'Visa', 'Travel Insurance', 'Driver License', 'Vaccination Card', 'Health Insurance', 'Credit Card', 'Membership', 'Hotel Loyalty', 'Airline Loyalty', 'Other'], required: true },
      { name: 'name', label: 'Document Name', type: 'text', required: true },
      { name: 'document_number', label: 'Document Number', type: 'text' },
      { name: 'issue_date', label: 'Issue Date', type: 'date' },
      { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
      { name: 'issuing_country', label: 'Issuing Country', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'packing-lists': {
    title: 'Packing Lists',
    icon: '🧳',
    apiKey: 'packingLists',
    columns: ['item_name', 'category', 'quantity', 'is_packed', 'priority'],
    columnLabels: { item_name: 'Item', category: 'Category', quantity: 'Qty', is_packed: 'Packed', priority: 'Priority' },
    fields: [
      { name: 'item_name', label: 'Item Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Documents', 'Electronics', 'Clothing', 'Footwear', 'Toiletries', 'Health', 'Comfort', 'Accessories', 'Essentials', 'Other'] },
      { name: 'quantity', label: 'Quantity', type: 'number', min: 1 },
      { name: 'is_packed', label: 'Packed', type: 'checkbox' },
      { name: 'priority', label: 'Priority', type: 'select', options: ['high', 'medium', 'low'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    aiFeatures: ['generate'],
  },
  'travel-tips': {
    title: 'Travel Tips',
    icon: '💡',
    apiKey: 'travelTips',
    columns: ['title', 'destination', 'category'],
    columnLabels: { title: 'Title', destination: 'Destination', category: 'Category' },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'destination', label: 'Destination', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['Money', 'Culture', 'Safety', 'Transportation', 'Food', 'Bargaining', 'Timing', 'Wildlife', 'Photography', 'Wellness', 'Shopping', 'Nature', 'General'] },
      { name: 'content', label: 'Content', type: 'textarea', required: true },
      { name: 'source', label: 'Source', type: 'text' },
    ],
  },
  'emergency-contacts': {
    title: 'Emergency Contacts',
    icon: '🆘',
    apiKey: 'emergencyContacts',
    columns: ['name', 'relationship', 'phone', 'email', 'is_primary'],
    columnLabels: { name: 'Name', relationship: 'Relationship', phone: 'Phone', email: 'Email', is_primary: 'Primary' },
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'relationship', label: 'Relationship', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'is_primary', label: 'Primary Contact', type: 'checkbox' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  reviews: {
    title: 'Reviews',
    icon: '⭐',
    apiKey: 'reviews',
    columns: ['entity_name', 'entity_type', 'rating', 'title', 'would_recommend'],
    columnLabels: { entity_name: 'Name', entity_type: 'Type', rating: 'Rating', title: 'Title', would_recommend: 'Recommend' },
    fields: [
      { name: 'entity_name', label: 'Place/Service Name', type: 'text', required: true },
      { name: 'entity_type', label: 'Type', type: 'select', options: ['Hotel', 'Restaurant', 'Activity', 'Transportation', 'Tour', 'Attraction', 'Other'] },
      { name: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5, required: true },
      { name: 'title', label: 'Review Title', type: 'text' },
      { name: 'content', label: 'Review Content', type: 'textarea' },
      { name: 'would_recommend', label: 'Would Recommend', type: 'checkbox' },
      { name: 'visit_date', label: 'Visit Date', type: 'date' },
    ],
    aiFeatures: ['summarize'],
  },
  photos: {
    title: 'Photos',
    icon: '📸',
    apiKey: 'photos',
    columns: ['title', 'location', 'is_favorite'],
    columnLabels: { title: 'Title', location: 'Location', is_favorite: 'Favorite' },
    fields: [
      { name: 'url', label: 'Photo URL', type: 'url', required: true },
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'taken_at', label: 'Date Taken', type: 'date' },
      { name: 'is_favorite', label: 'Favorite', type: 'checkbox' },
    ],
  },
  notes: {
    title: 'Notes',
    icon: '📝',
    apiKey: 'notes',
    columns: ['title', 'category', 'is_pinned'],
    columnLabels: { title: 'Title', category: 'Category', is_pinned: 'Pinned' },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'select', options: ['Transportation', 'Language', 'Food', 'Activities', 'Shopping', 'Safety', 'Wellness', 'Nature', 'General'] },
      { name: 'is_pinned', label: 'Pinned', type: 'checkbox' },
      { name: 'color', label: 'Color', type: 'select', options: ['#ffffff', '#e3f2fd', '#fff3e0', '#f3e5f5', '#e8f5e9', '#fce4ec', '#fff8e1', '#e1f5fe', '#f1f8e9', '#ffebee'] },
    ],
    aiFeatures: ['translate'],
  },
  'ai-assistant': {
    title: 'AI Assistant',
    icon: '🤖',
    isAI: true,
  },
  'ai-flights': {
    title: 'AI Flight Finder',
    icon: '✈️',
    isAI: true,
    aiType: 'flights',
  },
  'ai-hotels': {
    title: 'AI Hotel Matcher',
    icon: '🏨',
    isAI: true,
    aiType: 'hotels',
  },
  'ai-weather': {
    title: 'AI Weather Advisor',
    icon: '🌤️',
    isAI: true,
    aiType: 'weather',
  },
  'ai-budget': {
    title: 'AI Budget Tracker',
    icon: '💵',
    isAI: true,
    aiType: 'budget',
  },
  'ai-activities': {
    title: 'AI Activity Recommender',
    icon: '🎯',
    isAI: true,
    aiType: 'activities',
  },
};

const FeaturePage = () => {
  const { featureName } = useParams();
  const navigate = useNavigate();
  const config = featureConfigs[featureName];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, item: null });
  const { showSuccess, showError } = useToast();

  // AI State
  const [aiTab, setAiTab] = useState('chat');
  const [aiInput, setAiInput] = useState({
    fromLocation: '',
    destination: '',
    days: 7,
    budget: 1000,
    interests: '',
    season: 'summer',
    travelStyle: 'moderate',
    tripType: 'leisure',
    phrase: '',
    targetLanguage: 'Spanish'
  });
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ saving: false, message: '' });

  // Save AI-generated trip to database
  const saveTrip = async (data) => {
    setSaveStatus({ saving: true, message: 'Saving trip...' });
    try {
      const tripData = {
        name: `Trip to ${data.destination}`,
        from_location: data.fromLocation || aiInput.fromLocation || 'Not specified',
        destination: data.destination,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + (data.totalDays || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: data.estimatedBudget || aiInput.budget,
        status: 'planning',
        description: data.summary || `AI-generated trip to ${data.destination}`
      };
      await api.trips.create(tripData);
      setSaveStatus({ saving: false, message: '✅ Trip saved!' });
      setTimeout(() => setSaveStatus({ saving: false, message: '' }), 3000);
    } catch (err) {
      setSaveStatus({ saving: false, message: '❌ Failed to save: ' + (err.response?.data?.error || err.message) });
    }
  };

  // Save AI-generated activities to database
  const saveActivities = async (activities, destination) => {
    setSaveStatus({ saving: true, message: 'Saving activities...' });
    try {
      const items = Array.isArray(activities) ? activities : (activities.suggestions || activities.activities || []);
      let savedCount = 0;
      for (const activity of items.slice(0, 10)) { // Limit to 10
        await api.activities.create({
          name: activity.name || activity.activity,
          description: activity.description || '',
          location: activity.location || destination,
          category: activity.category || 'Sightseeing',
          cost: activity.estimatedCost || activity.cost || 0,
          duration: activity.duration || '2 hours',
          booking_status: 'not_booked'
        });
        savedCount++;
      }
      setSaveStatus({ saving: false, message: `✅ ${savedCount} activities saved!` });
      setTimeout(() => setSaveStatus({ saving: false, message: '' }), 3000);
    } catch (err) {
      setSaveStatus({ saving: false, message: '❌ Failed to save: ' + (err.response?.data?.error || err.message) });
    }
  };

  // Save AI-generated restaurants to database
  const saveRestaurants = async (restaurants, destination) => {
    setSaveStatus({ saving: true, message: 'Saving restaurants...' });
    try {
      const items = Array.isArray(restaurants) ? restaurants : (restaurants.suggestions || restaurants.restaurants || []);
      let savedCount = 0;
      for (const restaurant of items.slice(0, 10)) {
        await api.restaurants.create({
          name: restaurant.name,
          cuisine: restaurant.cuisine || 'Local',
          address: restaurant.address || destination,
          price_range: restaurant.priceRange || '$$',
          rating: restaurant.rating || 4,
          notes: restaurant.tip || restaurant.specialty || ''
        });
        savedCount++;
      }
      setSaveStatus({ saving: false, message: `✅ ${savedCount} restaurants saved!` });
      setTimeout(() => setSaveStatus({ saving: false, message: '' }), 3000);
    } catch (err) {
      setSaveStatus({ saving: false, message: '❌ Failed to save: ' + (err.response?.data?.error || err.message) });
    }
  };

  // Save AI-generated accommodations to database
  const saveAccommodations = async (accommodations, destination) => {
    setSaveStatus({ saving: true, message: 'Saving accommodations...' });
    try {
      const items = Array.isArray(accommodations) ? accommodations : (accommodations.suggestions || accommodations.accommodations || []);
      let savedCount = 0;
      for (const hotel of items.slice(0, 10)) {
        await api.accommodations.create({
          name: hotel.name,
          type: hotel.type || 'Hotel',
          address: hotel.neighborhood || destination,
          price_per_night: hotel.pricePerNight || 100,
          rating: hotel.rating || 4,
          booking_status: 'not_booked',
          notes: hotel.tip || (hotel.amenities ? hotel.amenities.join(', ') : '')
        });
        savedCount++;
      }
      setSaveStatus({ saving: false, message: `✅ ${savedCount} accommodations saved!` });
      setTimeout(() => setSaveStatus({ saving: false, message: '' }), 3000);
    } catch (err) {
      setSaveStatus({ saving: false, message: '❌ Failed to save: ' + (err.response?.data?.error || err.message) });
    }
  };

  // Save AI-generated packing list to database
  const savePackingList = async (packingData) => {
    setSaveStatus({ saving: true, message: 'Saving packing list...' });
    try {
      const categories = packingData.categories || {};
      let savedCount = 0;
      for (const [category, items] of Object.entries(categories)) {
        for (const item of (items || []).slice(0, 5)) { // 5 per category
          await api.packingLists.create({
            item_name: item.item || item.name,
            category: category.charAt(0).toUpperCase() + category.slice(1),
            quantity: item.quantity || 1,
            priority: item.priority || 'medium',
            is_packed: false,
            notes: item.notes || ''
          });
          savedCount++;
        }
      }
      setSaveStatus({ saving: false, message: `✅ ${savedCount} packing items saved!` });
      setTimeout(() => setSaveStatus({ saving: false, message: '' }), 3000);
    } catch (err) {
      setSaveStatus({ saving: false, message: '❌ Failed to save: ' + (err.response?.data?.error || err.message) });
    }
  };

  // Save AI-generated destination to database
  const saveDestination = async (data) => {
    setSaveStatus({ saving: true, message: 'Saving destination...' });
    try {
      await api.destinations.create({
        name: data.name || data.destination,
        country: data.country || '',
        city: data.city || data.name,
        description: data.description || '',
        best_time_to_visit: data.best_time_to_visit || data.bestTimeToVisit || '',
        language: data.language || '',
        currency: data.currency || '',
        timezone: data.timezone || '',
        rating: data.rating || 4
      });
      setSaveStatus({ saving: false, message: '✅ Destination saved!' });
      setTimeout(() => setSaveStatus({ saving: false, message: '' }), 3000);
    } catch (err) {
      setSaveStatus({ saving: false, message: '❌ Failed to save: ' + (err.response?.data?.error || err.message) });
    }
  };

  const fetchData = useCallback(async () => {
    if (config?.isAI) {
      setLoading(false);
      return;
    }
    try {
      const response = await api[config.apiKey].getAll();
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      fetchData();
    }
  }, [config, fetchData]);

  if (!config) {
    return (
      <div className="main-content">
        <div className="feature-page">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <h3>Feature not found</h3>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleAdd = () => {
    setFormData({});
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFormData({ ...item });
    setIsEditing(true);
    setShowDetail(false); // Close detail view so modal can show
    setShowModal(true);
  };

  const handleDelete = (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setConfirmDialog({ open: true, item });
  };

  const confirmDelete = async () => {
    const item = confirmDialog.item;
    setConfirmDialog({ open: false, item: null });
    try {
      await api[config.apiKey].delete(item.id);
      showSuccess('Item deleted successfully!');
      await fetchData();
      if (showDetail && selectedItem?.id === item.id) {
        setShowDetail(false);
        setSelectedItem(null);
      }
    } catch (err) {
      showError('Failed to delete item: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await api[config.apiKey].bulkDelete(ids);
      showSuccess(`${ids.length} item${ids.length > 1 ? 's' : ''} deleted successfully!`);
      await fetchData();
    } catch (err) {
      showError('Failed to delete items: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (config.fields) {
      const { errors, isValid } = validateForm(config.fields, formData);
      setFieldErrors(errors);
      if (!isValid) return;
    }

    try {
      if (isEditing) {
        await api[config.apiKey].update(formData.id, formData);
        showSuccess('Item updated successfully!');
      } else {
        await api[config.apiKey].create(formData);
        showSuccess('Item created successfully!');
      }
      setShowModal(false);
      setFieldErrors({});
      await fetchData();
    } catch (err) {
      showError('Failed to save item: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const formatValue = (value, column) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? '✓' : '-';
    if (column.includes('date') && value) {
      return new Date(value).toLocaleDateString();
    }
    if (column === 'budget' || column === 'cost' || column.includes('amount') || column.includes('price')) {
      return `$${parseFloat(value).toLocaleString()}`;
    }
    if (column === 'rating' && value) {
      return '⭐'.repeat(Math.round(value));
    }
    if (column === 'status' || column === 'booking_status') {
      return <span className={`status-badge status-${value}`}>{value}</span>;
    }
    if (column === 'price_range') {
      return <span className="price-range">{value}</span>;
    }
    return value;
  };

  // AI Feature Handlers
  const handleAIFeature = async (feature) => {
    setAiLoading(true);
    setAiResult(null);
    setError('');

    try {
      let response;
      const interests = aiInput.interests ? aiInput.interests.split(',').map((i) => i.trim()) : ['sightseeing', 'culture', 'food'];

      switch (feature) {
        case 'itinerary':
          response = await api.ai.generateItinerary({
            fromLocation: aiInput.fromLocation,
            destination: aiInput.destination,
            days: aiInput.days,
            budget: aiInput.budget,
            interests,
          });
          break;
        case 'autofill':
          response = await api.ai.autoFillDestination({ destination: aiInput.destination });
          break;
        case 'optimize':
          response = await api.ai.optimizeBudget({
            destination: aiInput.destination,
            days: aiInput.days,
            budget: aiInput.budget,
            travelStyle: aiInput.travelStyle,
          });
          break;
        case 'packing':
          response = await api.ai.smartPackingList({
            destination: aiInput.destination,
            duration: aiInput.days,
            season: aiInput.season,
            activities: interests,
            tripType: aiInput.tripType,
          });
          break;
        case 'activities':
          response = await api.ai.suggestActivities({
            destination: aiInput.destination,
            interests,
            budget: aiInput.travelStyle,
          });
          break;
        case 'restaurants':
          response = await api.ai.suggestRestaurants({
            destination: aiInput.destination,
            cuisine: 'local',
            budget: aiInput.travelStyle,
          });
          break;
        case 'accommodations':
          response = await api.ai.suggestAccommodations({
            destination: aiInput.destination,
            type: 'hotel',
            budget: aiInput.budget,
            nights: aiInput.days,
          });
          break;
        case 'analyze':
          response = await api.ai.analyzeItinerary({
            destination: aiInput.destination || 'popular destination',
            days: aiInput.days || 5,
          });
          break;
        case 'summarize':
          response = await api.ai.summarizeReviews({});
          break;
        case 'translate':
          response = await api.ai.translate({
            phrase: aiInput.phrase,
            targetLanguage: aiInput.targetLanguage,
          });
          break;
        case 'info':
          response = await api.ai.getDestinationInfo({ destination: aiInput.destination });
          break;
        case 'report':
          response = await api.ai.generateTripReport({ tripData: { destination: aiInput.destination, days: aiInput.days } });
          break;
        case 'flights':
          response = await api.ai.findFlights({
            origin: aiInput.fromLocation,
            destination: aiInput.destination,
            departureDate: aiInput.departureDate,
            returnDate: aiInput.returnDate,
            budget: aiInput.budget,
            passengers: aiInput.passengers || 1,
          });
          break;
        case 'weather':
          response = await api.ai.getWeatherAdvice({
            destination: aiInput.destination,
            travelDates: aiInput.travelDates,
            activities: aiInput.interests ? aiInput.interests.split(',').map(i => i.trim()) : [],
          });
          break;
        case 'matchHotels':
          response = await api.ai.matchHotels({
            destination: aiInput.destination,
            preferences: aiInput.preferences ? aiInput.preferences.split(',').map(i => i.trim()) : ['comfort', 'location', 'value'],
            budget: aiInput.budget,
            dates: aiInput.travelDates,
            travelers: aiInput.travelers || '2 adults',
          });
          break;
        default:
          throw new Error('Unknown AI feature');
      }

      setAiResult(response.data);
    } catch (err) {
      setAiResult({ error: err.response?.data?.error || err.message || 'AI request failed' });
    } finally {
      setAiLoading(false);
    }
  };

  // Helper to fix truncated JSON
  const fixTruncatedJSON = (jsonStr) => {
    let str = jsonStr.trim();

    // Count open brackets
    const openBraces = (str.match(/\{/g) || []).length;
    const closeBraces = (str.match(/\}/g) || []).length;
    const openBrackets = (str.match(/\[/g) || []).length;
    const closeBrackets = (str.match(/\]/g) || []).length;

    // Remove any trailing incomplete values (after last comma or colon)
    str = str.replace(/,\s*"[^"]*$/, '');  // Incomplete key
    str = str.replace(/,\s*"[^"]*":\s*("[^"]*)?$/, '');  // Incomplete key-value
    str = str.replace(/,\s*\{[^}]*$/, '');  // Incomplete object
    str = str.replace(/,\s*\[[^\]]*$/, '');  // Incomplete array
    str = str.replace(/,\s*$/, '');  // Trailing comma

    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      str += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      str += '}';
    }

    return str;
  };

  // Helper to parse AI response (handles rawResponse with markdown code blocks)
  const parseAIResponse = (result) => {
    if (!result) return null;

    // If it's already a properly parsed object with expected properties, return it directly
    if (typeof result === 'object' && !result.parseError && !result.rawResponse) {
      // Check if it has any of the expected AI result properties
      const hasAIProperties = result.days || result.categories || result.breakdown ||
                              result.translation || result.suggestions || result.conflicts ||
                              result.hasConflicts !== undefined || result.destination ||
                              result.fromLocation || result.activities || result.overallSentiment;
      if (hasAIProperties) {
        console.log('AI Response already parsed:', Object.keys(result));
        return result;
      }
    }

    let content = '';

    // Get the content to parse
    if (result.rawResponse) {
      content = result.rawResponse;
    } else if (typeof result === 'string') {
      content = result;
    } else if (typeof result === 'object' && !result.parseError) {
      // Already parsed object - return it
      console.log('Returning already parsed object');
      return result;
    }

    if (!content) return result;

    // Clean up the content - remove all common prefixes/wrappers
    content = content.toString();

    // Remove markdown code blocks
    content = content.replace(/^[\s\S]*?```json\s*/i, '');
    content = content.replace(/^[\s\S]*?```\s*/i, '');
    content = content.replace(/\s*```[\s\S]*$/i, '');

    // Remove "json" prefix (with or without quotes)
    content = content.replace(/^["']?json["']?\s*/i, '');

    // Remove leading/trailing quotes if the whole thing is quoted
    content = content.trim();
    if ((content.startsWith('"') && content.endsWith('"')) ||
        (content.startsWith("'") && content.endsWith("'"))) {
      content = content.slice(1, -1);
    }

    // Try to extract JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}?/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0];

      // First try parsing as-is
      try {
        const parsed = JSON.parse(jsonStr);
        console.log('Successfully parsed AI response from rawResponse');
        return parsed;
      } catch (e) {
        // Try fixing truncated JSON
        console.log('Attempting to fix truncated JSON...');
        try {
          const fixed = fixTruncatedJSON(jsonStr);
          const parsed = JSON.parse(fixed);
          console.log('Successfully parsed fixed JSON');
          return parsed;
        } catch (e2) {
          console.log('Could not fix JSON:', e2.message);
        }
      }
    }

    // Try parsing the whole content
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (e) {
      // Try fixing the whole content
      try {
        const fixed = fixTruncatedJSON(content);
        const parsed = JSON.parse(fixed);
        console.log('Successfully parsed fixed content');
        return parsed;
      } catch (e2) {
        console.log('Could not parse, returning as structured text');
        // Instead of raw text, try to create a minimal structure
        return { message: content, isRawText: true };
      }
    }
  };

  // Render priority badge
  const renderPriority = (priority) => {
    const colors = {
      essential: '#dc2626',
      high: '#ea580c',
      important: '#ca8a04',
      medium: '#2563eb',
      low: '#16a34a',
      optional: '#6b7280'
    };
    return (
      <span style={{
        backgroundColor: colors[priority] || colors.medium,
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.7rem',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {priority}
      </span>
    );
  };

  // Render packing list
  const renderPackingList = (data) => {
    const categories = data.categories || {};
    const categoryIcons = {
      documents: '📄',
      clothing: '👕',
      footwear: '👟',
      toiletries: '🧴',
      electronics: '📱',
      health: '💊',
      accessories: '🎒',
      miscellaneous: '📦'
    };

    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header">
          <h3>🧳 Smart Packing List</h3>
          <div className="ai-result-meta">
            <span>📍 {data.destination}</span>
            <span>📅 {data.duration}</span>
            <span>🌤️ {data.season}</span>
          </div>
        </div>

        {data.weatherForecast && (
          <div className="ai-weather-card">
            <h4>🌡️ Weather Forecast</h4>
            <p>{data.weatherForecast}</p>
          </div>
        )}

        <div className="ai-packing-categories">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category} className="ai-packing-category">
              <h4>{categoryIcons[category] || '📦'} {category.charAt(0).toUpperCase() + category.slice(1)}</h4>
              <div className="ai-packing-items">
                {Array.isArray(items) && items.map((item, idx) => (
                  <div key={idx} className="ai-packing-item">
                    <div className="ai-packing-item-header">
                      <span className="ai-packing-item-name">{item.item}</span>
                      <span className="ai-packing-item-qty">x{item.quantity}</span>
                      {renderPriority(item.priority)}
                    </div>
                    {item.notes && <p className="ai-packing-item-notes">{item.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {data.tips && data.tips.length > 0 && (
          <div className="ai-tips-section">
            <h4>💡 Pro Tips</h4>
            <ul>
              {data.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Save Button */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => savePackingList(data)}
            disabled={saveStatus.saving}
            style={{ width: 'auto' }}
          >
            💾 Save to My Packing List
          </button>
          {saveStatus.message && <span style={{ color: saveStatus.message.includes('✅') ? '#16a34a' : '#dc2626' }}>{saveStatus.message}</span>}
        </div>
      </div>
    );
  };

  // Render itinerary
  const renderItinerary = (data) => {
    const days = data.days || data.itinerary || [];

    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header">
          <h3>🗓️ Your Trip Itinerary</h3>
          <div className="ai-result-meta">
            {(data.fromLocation || data.from) && <span>🛫 From: {data.fromLocation || data.from}</span>}
            <span>📍 To: {data.destination || data.to}</span>
            {(data.totalDays || data.days?.length) && <span>📅 {data.totalDays || data.days?.length || 0} Days</span>}
            {(data.estimatedBudget || data.totalBudget || data.budget) && (
              <span>💰 Budget: ${data.estimatedBudget || data.totalBudget || data.budget}</span>
            )}
          </div>
        </div>

        {(data.summary || data.overview) && (
          <div className="ai-overview-card">
            <p>{data.summary || data.overview}</p>
          </div>
        )}

        {/* Visa Info */}
        {data.visaInfo && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>📋 Visa Information</h4>
            <p>{data.visaInfo}</p>
          </div>
        )}

        {/* Flights */}
        {data.flights && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>✈️ Flight Information</h4>
            {data.flights.outbound && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Outbound:</strong> {data.flights.outbound.from} → {data.flights.outbound.to}
                {data.flights.outbound.estimatedCost && <span> (~${data.flights.outbound.estimatedCost})</span>}
                {data.flights.outbound.duration && <span> • {data.flights.outbound.duration}</span>}
              </div>
            )}
            {data.flights.return && (
              <div>
                <strong>Return:</strong> {data.flights.return.from} → {data.flights.return.to}
                {data.flights.return.estimatedCost && <span> (~${data.flights.return.estimatedCost})</span>}
              </div>
            )}
          </div>
        )}

        {/* Accommodation */}
        {data.accommodation && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>🏨 Recommended Accommodation</h4>
            <p><strong>{data.accommodation.name}</strong> ({data.accommodation.type})</p>
            {data.accommodation.pricePerNight && <p>~${data.accommodation.pricePerNight}/night</p>}
          </div>
        )}

        {/* Day by Day Itinerary */}
        {Array.isArray(days) && days.length > 0 && (
          <div className="ai-itinerary-days">
            <h4 style={{ marginBottom: '1rem', color: '#334155' }}>📅 Day-by-Day Plan</h4>
            {days.map((day, idx) => (
              <div key={idx} className="ai-day-card">
                <div className="ai-day-header">
                  <h4>Day {day.day || idx + 1}</h4>
                  {day.theme && <span className="ai-day-theme">{day.theme}</span>}
                </div>

                {day.activities && Array.isArray(day.activities) && (
                  <div className="ai-day-activities">
                    {day.activities.map((activity, aIdx) => (
                      <div key={aIdx} className="ai-activity-item">
                        <span className="ai-activity-time">{activity.time || '🕐'}</span>
                        <div className="ai-activity-content">
                          <strong>{activity.activity || activity.name}</strong>
                          {activity.description && <p>{activity.description}</p>}
                          {activity.duration && <span style={{ fontSize: '0.85rem', color: '#64748b' }}>⏱️ {activity.duration}</span>}
                          {activity.tips && <p style={{ fontSize: '0.85rem', color: '#667eea', marginTop: '0.25rem' }}>💡 {activity.tips}</p>}
                          {activity.cost !== undefined && activity.cost > 0 && <span className="ai-activity-cost">${activity.cost}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {day.meals && (
                  <div className="ai-day-meals">
                    <h5>🍽️ Meals</h5>
                    {Object.entries(day.meals).map(([meal, details]) => (
                      <div key={meal} className="ai-meal-item">
                        <span className="ai-meal-type">{meal}</span>
                        <span>
                          {typeof details === 'string' ? details : (
                            <>
                              {details.name || details.suggestion}
                              {details.cuisine && <span style={{ color: '#64748b' }}> ({details.cuisine})</span>}
                              {details.cost && <span style={{ color: '#16a34a' }}> ~${details.cost}</span>}
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {day.estimatedCost && (
                  <div className="ai-day-cost">
                    Day Cost: <strong>${day.estimatedCost}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Transportation Tips */}
        {data.transportationTips && Array.isArray(data.transportationTips) && (
          <div className="ai-tips-section">
            <h4>🚗 Transportation Tips</h4>
            <ul>
              {data.transportationTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
            </ul>
          </div>
        )}

        {/* Cultural Tips */}
        {data.culturalTips && Array.isArray(data.culturalTips) && (
          <div className="ai-info-card" style={{ marginTop: '1rem' }}>
            <h4>🎭 Cultural Tips</h4>
            <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
              {data.culturalTips.map((tip, idx) => <li key={idx} style={{ padding: '0.25rem 0' }}>{tip}</li>)}
            </ul>
          </div>
        )}

        {/* Packing List */}
        {data.packingList && Array.isArray(data.packingList) && (
          <div className="ai-info-card" style={{ marginTop: '1rem' }}>
            <h4>🧳 Packing Suggestions</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.packingList.map((item, idx) => (
                <span key={idx} style={{ background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' }}>{item}</span>
              ))}
            </div>
          </div>
        )}

        {/* Budget Breakdown */}
        {data.budgetBreakdown && (
          <div className="ai-budget-breakdown">
            <h4>💰 Budget Breakdown</h4>
            <div className="ai-budget-items">
              {Object.entries(data.budgetBreakdown).map(([category, amount]) => (
                <div key={category} className="ai-budget-item">
                  <span>{category}</span>
                  <strong>${typeof amount === 'number' ? amount : amount.amount || amount}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Difference */}
        {data.timeDifference && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.9rem' }}>
            🕐 <strong>Time Difference:</strong> {data.timeDifference}
          </div>
        )}

        {/* Save Buttons */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => saveTrip(data)}
            disabled={saveStatus.saving}
            style={{ width: 'auto' }}
          >
            💾 Save as Trip
          </button>
          {data.days && data.days.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                const activities = data.days.flatMap(day =>
                  (day.activities || []).map(a => ({ ...a, name: a.name || a.activity }))
                );
                saveActivities(activities, data.destination);
              }}
              disabled={saveStatus.saving}
              style={{ width: 'auto' }}
            >
              📋 Save Activities
            </button>
          )}
          {saveStatus.message && <span style={{ color: saveStatus.message.includes('✅') ? '#16a34a' : '#dc2626' }}>{saveStatus.message}</span>}
        </div>
      </div>
    );
  };

  // Render suggestions (activities, restaurants, hotels)
  const renderSuggestions = (data) => {
    const items = data.suggestions || data.activities || data.restaurants || data.accommodations || data.items || [];
    const title = data.type || 'Suggestions';
    const icons = {
      activities: '🎯',
      restaurants: '🍽️',
      accommodations: '🏨',
      hotels: '🏨'
    };

    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header">
          <h3>{icons[title.toLowerCase()] || '💡'} {title} for {data.destination}</h3>
        </div>

        <div className="ai-suggestions-grid">
          {Array.isArray(items) && items.map((item, idx) => (
            <div key={idx} className="ai-suggestion-card">
              <div className="ai-suggestion-header">
                <h4>{item.name}</h4>
                {item.rating && <span className="ai-rating">⭐ {item.rating}</span>}
              </div>
              {item.description && <p>{item.description}</p>}
              <div className="ai-suggestion-meta">
                {item.price && <span className="ai-price">{item.price}</span>}
                {item.priceRange && <span className="ai-price">{item.priceRange}</span>}
                {item.cuisine && <span className="ai-cuisine">🍴 {item.cuisine}</span>}
                {item.category && <span className="ai-category">{item.category}</span>}
                {item.location && <span className="ai-location">📍 {item.location}</span>}
                {item.duration && <span className="ai-duration">⏱️ {item.duration}</span>}
              </div>
              {item.highlights && (
                <div className="ai-highlights">
                  {item.highlights.map((h, i) => (
                    <span key={i} className="ai-highlight-tag">{h}</span>
                  ))}
                </div>
              )}
              {item.mustTry && (
                <div className="ai-must-try">
                  <strong>Must Try:</strong> {Array.isArray(item.mustTry) ? item.mustTry.join(', ') : item.mustTry}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (data.restaurants || title.toLowerCase().includes('restaurant')) {
                saveRestaurants(items, data.destination);
              } else if (data.accommodations || title.toLowerCase().includes('hotel') || title.toLowerCase().includes('accommodation')) {
                saveAccommodations(items, data.destination);
              } else {
                saveActivities(items, data.destination);
              }
            }}
            disabled={saveStatus.saving}
            style={{ width: 'auto' }}
          >
            💾 Save All to Database
          </button>
          {saveStatus.message && <span style={{ color: saveStatus.message.includes('✅') ? '#16a34a' : '#dc2626' }}>{saveStatus.message}</span>}
        </div>
      </div>
    );
  };

  // Render destination info
  const renderDestinationInfo = (data) => {
    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header">
          <h3>📍 {data.name || data.destination}</h3>
          {data.country && <span className="ai-country">{data.country}</span>}
        </div>

        <div className="ai-destination-grid">
          {data.description && (
            <div className="ai-info-card full-width">
              <p>{data.description}</p>
            </div>
          )}

          <div className="ai-info-card">
            <h4>🌍 Basic Info</h4>
            <ul>
              {data.language && <li><strong>Language:</strong> {data.language}</li>}
              {data.currency && <li><strong>Currency:</strong> {data.currency}</li>}
              {data.timezone && <li><strong>Timezone:</strong> {data.timezone}</li>}
              {data.population && <li><strong>Population:</strong> {data.population}</li>}
            </ul>
          </div>

          {data.bestTimeToVisit && (
            <div className="ai-info-card">
              <h4>📅 Best Time to Visit</h4>
              <p>{data.bestTimeToVisit}</p>
            </div>
          )}

          {data.weather && (
            <div className="ai-info-card">
              <h4>🌤️ Weather</h4>
              <p>{typeof data.weather === 'string' ? data.weather : JSON.stringify(data.weather)}</p>
            </div>
          )}

          {data.attractions && (
            <div className="ai-info-card">
              <h4>🏛️ Top Attractions</h4>
              <ul>
                {(Array.isArray(data.attractions) ? data.attractions : []).map((a, i) => (
                  <li key={i}>{typeof a === 'string' ? a : a.name}</li>
                ))}
              </ul>
            </div>
          )}

          {data.tips && (
            <div className="ai-info-card full-width">
              <h4>💡 Travel Tips</h4>
              <ul>
                {(Array.isArray(data.tips) ? data.tips : [data.tips]).map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => saveDestination(data)}
            disabled={saveStatus.saving}
            style={{ width: 'auto' }}
          >
            💾 Save Destination
          </button>
          {saveStatus.message && <span style={{ color: saveStatus.message.includes('✅') ? '#16a34a' : '#dc2626' }}>{saveStatus.message}</span>}
        </div>
      </div>
    );
  };

  // Render itinerary analysis
  const renderItineraryAnalysis = (data) => {
    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header">
          <h3>🔍 Itinerary Analysis</h3>
          <div className="ai-result-meta">
            {data.destination && <span>📍 {data.destination}</span>}
            {data.dailyBudget && <span>💰 ~${data.dailyBudget}/day</span>}
            {data.overallScore && <span>⭐ Score: {data.overallScore}/100</span>}
          </div>
        </div>

        {/* Status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1rem',
          fontWeight: '500',
          background: data.hasConflicts ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          color: data.hasConflicts ? '#92400e' : '#166534',
          border: data.hasConflicts ? '1px solid #fcd34d' : '1px solid #86efac'
        }}>
          <span style={{ fontSize: '1.5rem' }}>{data.hasConflicts ? '⚠️' : '✅'}</span>
          <span>{data.hasConflicts ? 'Some Issues Found - Review Suggestions Below' : 'Great Itinerary - No Major Issues!'}</span>
        </div>

        {/* Feedback */}
        {data.feedback && (
          <div className="ai-overview-card">
            <p>{data.feedback}</p>
          </div>
        )}

        {/* Generated Itinerary */}
        {data.generatedItinerary && Array.isArray(data.generatedItinerary) && data.generatedItinerary.length > 0 && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>📅 Generated Activities</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.generatedItinerary.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <span style={{
                    background: '#667eea',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>Day {item.day}</span>
                  <span style={{ color: '#667eea', fontWeight: '600', minWidth: '60px' }}>{item.time}</span>
                  <div style={{ flex: 1 }}>
                    <strong>{item.activity}</strong>
                    {item.location && <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>📍 {item.location}</span>}
                  </div>
                  {item.duration && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>⏱️ {item.duration}</span>}
                  {item.cost > 0 && <span style={{ color: '#16a34a', fontWeight: '600' }}>${item.cost}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optimized Order */}
        {data.optimizedOrder && Array.isArray(data.optimizedOrder) && data.optimizedOrder.length > 0 && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>✨ Optimized Schedule</h4>
            {data.optimizedOrder.map((dayPlan, idx) => (
              <div key={idx} style={{ marginBottom: '1rem' }}>
                <h5 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Day {dayPlan.day || idx + 1}</h5>
                {dayPlan.activities && Array.isArray(dayPlan.activities) && dayPlan.activities.map((act, aIdx) => (
                  <div key={aIdx} style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    background: aIdx % 2 === 0 ? '#f8fafc' : 'white',
                    borderRadius: '6px'
                  }}>
                    <span style={{ color: '#667eea', fontWeight: '600' }}>{act.time}</span>
                    <span>{act.activity}</span>
                    {act.reason && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>- {act.reason}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Top Attractions */}
        {data.topAttractions && Array.isArray(data.topAttractions) && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>🏛️ Must-See Attractions</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.topAttractions.map((attraction, idx) => (
                <span key={idx} style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem'
                }}>{attraction}</span>
              ))}
            </div>
          </div>
        )}

        {/* Conflicts */}
        {data.conflicts && Array.isArray(data.conflicts) && data.conflicts.length > 0 && (
          <div className="ai-info-card" style={{ marginBottom: '1rem', borderLeft: '4px solid #f59e0b' }}>
            <h4>⚠️ Issues to Address</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.conflicts.map((conflict, idx) => (
                <div key={idx} style={{
                  background: '#fffbeb',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #fde68a'
                }}>
                  <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.25rem' }}>
                    {conflict.activity1} ↔ {conflict.activity2}
                  </div>
                  <p style={{ color: '#78350f', fontSize: '0.9rem', margin: '0.25rem 0' }}>{conflict.description}</p>
                  {conflict.suggestion && (
                    <p style={{ color: '#166534', fontSize: '0.85rem', margin: 0 }}>💡 {conflict.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {data.warnings && Array.isArray(data.warnings) && data.warnings.length > 0 && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>📝 Warnings</h4>
            {data.warnings.map((warning, idx) => (
              <div key={idx} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: '500' }}>{warning.message}</span>
                {warning.suggestion && <span style={{ color: '#667eea', marginLeft: '0.5rem' }}>→ {warning.suggestion}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Top Suggestions */}
        {data.topSuggestions && Array.isArray(data.topSuggestions) && (
          <div className="ai-tips-section">
            <h4>💡 Top Recommendations</h4>
            <ul>
              {data.topSuggestions.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Save Button */}
        {data.generatedItinerary && Array.isArray(data.generatedItinerary) && data.generatedItinerary.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                const activities = data.generatedItinerary.map(item => ({
                  name: item.activity,
                  location: item.location || data.destination,
                  cost: item.cost || 0,
                  duration: item.duration
                }));
                saveActivities(activities, data.destination);
              }}
              disabled={saveStatus.saving}
              style={{ width: 'auto' }}
            >
              💾 Save Activities
            </button>
            {saveStatus.message && <span style={{ color: saveStatus.message.includes('✅') ? '#16a34a' : '#dc2626' }}>{saveStatus.message}</span>}
          </div>
        )}
      </div>
    );
  };

  // Render budget optimization
  const renderBudgetOptimization = (data) => {
    // Helper to get amount from breakdown value (handles both number and object)
    const getAmount = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'object' && value !== null) {
        return value.allocated || value.amount || value.cost || 0;
      }
      return 0;
    };

    // Calculate total budget
    const totalBudget = data.budget || data.totalBudget || 1000;

    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header">
          <h3>💰 Budget Optimization</h3>
          <div className="ai-result-meta">
            <span>📍 {data.destination}</span>
            <span>📅 {data.days || data.duration} days</span>
            <span>💵 Budget: ${totalBudget}</span>
          </div>
        </div>

        {data.summary && (
          <div className="ai-overview-card">
            <p>{data.summary}</p>
          </div>
        )}

        {data.breakdown && (
          <div className="ai-budget-breakdown">
            <h4>📊 Recommended Breakdown</h4>
            <div className="ai-budget-items">
              {Object.entries(data.breakdown).map(([category, value]) => {
                const amount = getAmount(value);
                const isObject = typeof value === 'object' && value !== null;

                return (
                  <div key={category} className="ai-budget-item-card">
                    <div className="ai-budget-item-header">
                      <span className="ai-budget-category">{category}</span>
                      <span className="ai-budget-amount">${amount}</span>
                    </div>
                    {isObject && value.recommended && (
                      <p className="ai-budget-recommendation">💡 {value.recommended}</p>
                    )}
                    {isObject && value.tip && (
                      <p className="ai-budget-tip">✨ {value.tip}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.savingTips && (
          <div className="ai-tips-section">
            <h4>💡 Money-Saving Tips</h4>
            <ul>
              {(Array.isArray(data.savingTips) ? data.savingTips : []).map((tip, i) => (
                <li key={i}>{typeof tip === 'string' ? tip : (tip.tip || tip.description || JSON.stringify(tip))}</li>
              ))}
            </ul>
          </div>
        )}

        {data.tips && !data.savingTips && (
          <div className="ai-tips-section">
            <h4>💡 Tips</h4>
            <ul>
              {(Array.isArray(data.tips) ? data.tips : []).map((tip, i) => (
                <li key={i}>{typeof tip === 'string' ? tip : (tip.tip || tip.description || JSON.stringify(tip))}</li>
              ))}
            </ul>
          </div>
        )}

        {data.recommendations && (
          <div className="ai-recommendations">
            <h4>✨ Recommendations</h4>
            {Object.entries(data.recommendations).map(([category, items]) => (
              <div key={category} className="ai-recommendation-category">
                <h5>{category}</h5>
                <ul>
                  {(Array.isArray(items) ? items : [items]).map((item, i) => (
                    <li key={i}>{typeof item === 'string' ? item : (item.name || item.description || JSON.stringify(item))}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        {data.breakdown && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={async () => {
                setSaveStatus({ saving: true, message: 'Saving budget...' });
                try {
                  for (const [category, value] of Object.entries(data.breakdown)) {
                    const amount = typeof value === 'number' ? value : (value.allocated || value.amount || 0);
                    await api.budgets.create({
                      category: category.charAt(0).toUpperCase() + category.slice(1),
                      planned_amount: amount,
                      actual_amount: 0,
                      currency: 'USD',
                      notes: typeof value === 'object' && value.tip ? value.tip : ''
                    });
                  }
                  setSaveStatus({ saving: false, message: '✅ Budget saved!' });
                  setTimeout(() => setSaveStatus({ saving: false, message: '' }), 3000);
                } catch (err) {
                  setSaveStatus({ saving: false, message: '❌ Failed to save' });
                }
              }}
              disabled={saveStatus.saving}
              style={{ width: 'auto' }}
            >
              💾 Save Budget Plan
            </button>
            {saveStatus.message && <span style={{ color: saveStatus.message.includes('✅') ? '#16a34a' : '#dc2626' }}>{saveStatus.message}</span>}
          </div>
        )}
      </div>
    );
  };

  // Render translation
  const renderTranslation = (data) => {
    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header">
          <h3>🌐 Translation</h3>
        </div>
        <div className="ai-translation-card">
          <div className="ai-translation-original">
            <label>Original</label>
            <p>{data.original || data.phrase}</p>
          </div>
          <div className="ai-translation-arrow">→</div>
          <div className="ai-translation-result">
            <label>{data.language || data.targetLanguage}</label>
            <p className="ai-translated-text">{data.translation || data.translated}</p>
          </div>
          {data.pronunciation && (
            <div className="ai-pronunciation">
              <label>🔊 Pronunciation</label>
              <p>{data.pronunciation}</p>
            </div>
          )}
          {data.notes && (
            <div className="ai-translation-notes">
              <label>💡 Notes</label>
              <p>{data.notes}</p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={async () => {
              setSaveStatus({ saving: true, message: 'Saving...' });
              try {
                await api.notes.create({
                  title: `Translation: ${(data.original || data.phrase || '').substring(0, 30)}...`,
                  content: `Original: ${data.original || data.phrase}\n\n${data.language || data.targetLanguage}: ${data.translation || data.translated}${data.pronunciation ? '\n\nPronunciation: ' + data.pronunciation : ''}${data.notes ? '\n\nNotes: ' + data.notes : ''}`,
                  category: 'Language',
                  is_pinned: false
                });
                setSaveStatus({ saving: false, message: '✅ Saved as Note!' });
                setTimeout(() => setSaveStatus({ saving: false, message: '' }), 3000);
              } catch (err) {
                setSaveStatus({ saving: false, message: '❌ Failed to save' });
              }
            }}
            disabled={saveStatus.saving}
            style={{ width: 'auto' }}
          >
            💾 Save as Note
          </button>
          {saveStatus.message && <span style={{ color: saveStatus.message.includes('✅') ? '#16a34a' : '#dc2626' }}>{saveStatus.message}</span>}
        </div>
      </div>
    );
  };

  // Universal value renderer - handles ALL data types beautifully
  const renderValue = (value, key = '', depth = 0) => {
    if (value === null || value === undefined) return <span className="ai-value-empty">-</span>;

    // Boolean
    if (typeof value === 'boolean') {
      return (
        <span className={`ai-value-bool ${value ? 'ai-bool-true' : 'ai-bool-false'}`}>
          {value ? '✓ Yes' : '✗ No'}
        </span>
      );
    }

    // Number
    if (typeof value === 'number') {
      const isPrice = key.toLowerCase().includes('cost') || key.toLowerCase().includes('price') ||
                      key.toLowerCase().includes('budget') || key.toLowerCase().includes('amount');
      return (
        <span className="ai-value-number">
          {isPrice ? `$${value.toLocaleString()}` : value.toLocaleString()}
        </span>
      );
    }

    // String
    if (typeof value === 'string') {
      // Check if it's a long text
      if (value.length > 200) {
        return <p className="ai-value-text-long">{value}</p>;
      }
      return <span className="ai-value-text">{value}</span>;
    }

    // Array
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="ai-value-empty">None</span>;

      // Array of strings
      if (typeof value[0] === 'string') {
        return (
          <ul className="ai-value-list">
            {value.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        );
      }

      // Array of objects
      if (typeof value[0] === 'object') {
        return (
          <div className="ai-value-cards">
            {value.map((item, idx) => (
              <div key={idx} className="ai-value-card">
                {Object.entries(item).map(([k, v]) => (
                  <div key={k} className="ai-card-field">
                    <span className="ai-card-label">{k.replace(/_/g, ' ')}:</span>
                    <span className="ai-card-value">{renderValue(v, k, depth + 1)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
    }

    // Object (but not array)
    if (typeof value === 'object') {
      if (depth > 2) {
        // Prevent too deep nesting
        return <span className="ai-value-text">{JSON.stringify(value)}</span>;
      }

      return (
        <div className="ai-value-object">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="ai-object-field">
              <span className="ai-object-label">{k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')}:</span>
              <div className="ai-object-value">{renderValue(v, k, depth + 1)}</div>
            </div>
          ))}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  // Smart section renderer - renders any section beautifully
  const renderSection = (title, icon, content, type = 'default') => {
    if (!content) return null;

    return (
      <div className={`ai-section ai-section-${type}`}>
        <h4 className="ai-section-title">{icon} {title}</h4>
        <div className="ai-section-content">
          {typeof content === 'string' ? (
            <p>{content}</p>
          ) : Array.isArray(content) ? (
            <ul className="ai-section-list">
              {content.map((item, idx) => (
                <li key={idx}>
                  {typeof item === 'string' ? item : renderValue(item, '', 0)}
                </li>
              ))}
            </ul>
          ) : typeof content === 'object' ? (
            renderValue(content, '', 0)
          ) : (
            <p>{String(content)}</p>
          )}
        </div>
      </div>
    );
  };

  // Render generic result - handles any JSON structure beautifully
  const renderGenericResult = (data) => {
    // Handle string data
    if (typeof data === 'string') {
      return (
        <div className="ai-result-formatted">
          <div className="ai-result-header">
            <h3>🤖 AI Response</h3>
          </div>
          <div className="ai-generic-text">
            {data.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      );
    }

    // Handle text/message/content properties
    if (data.text || data.message || data.content) {
      const textContent = data.text || data.message || data.content;
      return (
        <div className="ai-result-formatted">
          <div className="ai-result-header">
            <h3>🤖 AI Response</h3>
          </div>
          <div className="ai-generic-text">
            {typeof textContent === 'string' ? (
              textContent.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))
            ) : (
              renderSmartValue(textContent, 'content', 0)
            )}
          </div>
        </div>
      );
    }

    // Icon mapping for different field types
    const getIcon = (key) => {
      const keyLower = key.toLowerCase();
      const icons = {
        destination: '📍', location: '📍', place: '📍', from: '🛫', to: '🛬',
        fromlocation: '🛫', tolocation: '🛬',
        duration: '📅', days: '📅', date: '📅', time: '⏰', totaldays: '📅',
        season: '🌤️', weather: '🌡️', weatherforecast: '🌡️', climate: '🌤️',
        budget: '💰', cost: '💵', price: '💵', amount: '💵', estimatedbudget: '💰',
        tips: '💡', tip: '💡', suggestions: '💡', suggestion: '💡',
        moneysavingtips: '💡', savingtips: '💡', transportationtips: '💡',
        activities: '🎯', activity: '🎯', freeactivities: '🎯',
        conflicts: '⚠️', conflict: '⚠️', warning: '⚠️', warnings: '⚠️',
        hasconflicts: '⚠️', missingelements: '❓',
        restaurants: '🍽️', food: '🍽️', dining: '🍽️', meals: '🍽️',
        hotels: '🏨', accommodation: '🏨', accommodations: '🏨',
        transport: '🚗', transportation: '🚗', flights: '✈️',
        documents: '📄', clothing: '👕', toiletries: '🧴',
        electronics: '📱', health: '💊', miscellaneous: '📦',
        summary: '📋', overview: '📋', description: '📝', feedback: '💬',
        rating: '⭐', reviews: '⭐', overallscore: '⭐',
        language: '🗣️', translation: '🌐', translated: '🌐',
        categories: '📦', items: '📦',
        recommendations: '✨', recommended: '✨', budgetalternatives: '💡',
        donotforget: '❗', leaveathome: '🚫', locallyavailable: '🛒',
        optimizedorder: '📋', nearbyattractions: '🗺️', topsuggestions: '⭐',
        analysis: '📊', breakdown: '📊', statistics: '📊',
        overallsentiment: '😊', commonpros: '👍', commoncons: '👎',
        highlights: '✨', bestmoments: '🌟', lessonslearned: '📚',
        visainfo: '📋', timedifference: '🕐', culturaltips: '🎭',
        packinglist: '🧳', splurgeworthy: '💎'
      };
      return icons[keyLower] || '•';
    };

    // Smart value renderer that handles any type
    const renderSmartValue = (value, key = '', depth = 0) => {
      if (value === null || value === undefined) {
        return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</span>;
      }

      // Boolean
      if (typeof value === 'boolean') {
        return (
          <span style={{
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: '500',
            background: value ? '#dcfce7' : '#fee2e2',
            color: value ? '#166534' : '#991b1b'
          }}>
            {value ? '✓ Yes' : '✗ No'}
          </span>
        );
      }

      // Number
      if (typeof value === 'number') {
        const keyLower = key.toLowerCase();
        const isPrice = keyLower.includes('cost') || keyLower.includes('price') ||
                        keyLower.includes('budget') || keyLower.includes('amount') ||
                        keyLower.includes('savings') || keyLower.includes('allocated');
        return (
          <span style={{ fontWeight: '600', color: isPrice ? '#16a34a' : '#667eea' }}>
            {isPrice ? `$${value.toLocaleString()}` : value.toLocaleString()}
          </span>
        );
      }

      // String
      if (typeof value === 'string') {
        return <span>{value}</span>;
      }

      // Array
      if (Array.isArray(value)) {
        if (value.length === 0) return <span style={{ color: '#94a3b8' }}>None</span>;

        // Array of strings - render as tags or list
        if (typeof value[0] === 'string') {
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {value.map((item, idx) => (
                <span key={idx} style={{
                  background: '#f1f5f9',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  color: '#475569'
                }}>{item}</span>
              ))}
            </div>
          );
        }

        // Array of objects - render as cards
        if (typeof value[0] === 'object' && depth < 2) {
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {value.map((item, idx) => (
                <div key={idx} style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0'
                }}>
                  {Object.entries(item).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</span>
                      <span style={{ color: '#1e293b', fontWeight: '500', fontSize: '0.85rem', textAlign: 'right', maxWidth: '60%' }}>
                        {typeof v === 'boolean' ? (v ? '✓' : '✗') :
                         typeof v === 'number' ? (k.toLowerCase().includes('cost') || k.toLowerCase().includes('price') ? `$${v}` : v) :
                         String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        }
      }

      // Object - render nested
      if (typeof value === 'object' && depth < 2) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(value).map(([k, v]) => (
              <div key={k} style={{ paddingLeft: '0.5rem', borderLeft: '2px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'capitalize', fontWeight: '500' }}>
                  {getIcon(k)} {k.replace(/_/g, ' ')}:
                </span>{' '}
                {renderSmartValue(v, k, depth + 1)}
              </div>
            ))}
          </div>
        );
      }

      // Fallback for deep nesting
      return <span>{JSON.stringify(value)}</span>;
    };

    // Determine the title based on content
    const getTitle = () => {
      if (data.hasConflicts !== undefined) return '🔍 Itinerary Analysis';
      if (data.overallSentiment) return '📊 Review Summary';
      if (data.analysis) return '💰 Budget Analysis';
      if (data.highlights && data.statistics) return '📋 Trip Report';
      return '🤖 AI Results';
    };

    // Render the data smartly
    return (
      <div className="ai-result-formatted">
        {/* Header */}
        <div className="ai-result-header">
          <h3>{getTitle()}</h3>
          {(data.destination || data.duration || data.tripType || data.totalReviews) && (
            <div className="ai-result-meta">
              {data.destination && <span>📍 {data.destination}</span>}
              {data.duration && <span>📅 {data.duration}</span>}
              {data.tripType && <span>✈️ {data.tripType}</span>}
              {data.totalReviews && <span>📝 {data.totalReviews} reviews</span>}
            </div>
          )}
        </div>

        {/* Status/Conflicts indicator */}
        {data.hasConflicts !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            fontWeight: '500',
            background: data.hasConflicts ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            color: data.hasConflicts ? '#92400e' : '#166534',
            border: data.hasConflicts ? '1px solid #fcd34d' : '1px solid #86efac'
          }}>
            <span style={{ fontSize: '1.5rem' }}>{data.hasConflicts ? '⚠️' : '✅'}</span>
            <span>{data.hasConflicts ? 'Issues Found - Review Required' : 'All Good - No Issues Detected'}</span>
          </div>
        )}

        {/* Overall Score */}
        {data.overallScore !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <span style={{ fontSize: '2rem' }}>⭐</span>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data.overallScore}/100</div>
              <div style={{ fontSize: '0.85rem', opacity: '0.9' }}>Itinerary Score</div>
            </div>
          </div>
        )}

        {/* Summary/Overview/Feedback at top */}
        {(data.summary || data.overview || data.feedback) && (
          <div style={{
            background: 'white',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            borderLeft: '4px solid #667eea',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#475569', lineHeight: '1.6', margin: 0 }}>
              {data.summary || data.overview || data.feedback}
            </p>
          </div>
        )}

        {/* Weather */}
        {data.weatherForecast && (
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            color: 'white',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '1rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>🌡️ Weather</h4>
            <p style={{ margin: 0, opacity: '0.95' }}>{data.weatherForecast}</p>
          </div>
        )}

        {/* Main content sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(data)
            .filter(([key]) => !['destination', 'duration', 'tripType', 'season', 'summary', 'overview',
                                 'description', 'weatherForecast', 'hasConflicts', 'rawText', 'isRawText',
                                 'message', 'overallScore', 'feedback', 'totalReviews'].includes(key))
            .map(([key, value]) => {
              if (value === null || value === undefined) return null;

              const icon = getIcon(key);
              const title = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
              const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1);

              return (
                <div key={key} style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}>
                  <h4 style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    padding: '0.75rem 1rem',
                    margin: 0,
                    fontSize: '1rem',
                    color: '#334155',
                    borderBottom: '1px solid #e2e8f0',
                    textTransform: 'capitalize'
                  }}>
                    {icon} {capitalizedTitle}
                  </h4>
                  <div style={{ padding: '1rem' }}>
                    {renderSmartValue(value, key, 0)}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  // Render Flight Results
  const renderFlightResults = (data) => {
    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header">
          <h3>✈️ Flight Recommendations</h3>
          {data.searchCriteria && (
            <div className="ai-result-meta">
              <span>🛫 From: {data.searchCriteria.origin}</span>
              <span>🛬 To: {data.searchCriteria.destination}</span>
              {data.searchCriteria.departureDate && <span>📅 {data.searchCriteria.departureDate}</span>}
            </div>
          )}
        </div>

        {/* Price Summary */}
        {data.totalEstimate && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Budget Option</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>${data.totalEstimate.budget}</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Moderate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>${data.totalEstimate.moderate}</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Premium</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>${data.totalEstimate.premium}</div>
            </div>
          </div>
        )}

        {/* Best Value Highlight */}
        {data.bestValue && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⭐</span>
              <div>
                <div style={{ fontWeight: '700', color: '#92400e' }}>Best Value: {data.bestValue.airline}</div>
                <div style={{ color: '#78350f', fontSize: '0.9rem' }}>${data.bestValue.price} - {data.bestValue.why}</div>
              </div>
            </div>
          </div>
        )}

        {/* Flight Recommendations */}
        {data.recommendations && Array.isArray(data.recommendations) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#334155' }}>🛫 Available Flights</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.recommendations.map((flight, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1e293b' }}>{flight.airline}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{flight.flightNumber || 'Flight'}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '600' }}>{flight.departureTime}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>→ {flight.arrivalTime}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '100px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '500' }}>{flight.duration}</div>
                    <div style={{
                      fontSize: '0.75rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '10px',
                      display: 'inline-block',
                      background: flight.stops === 0 ? '#dcfce7' : '#fef3c7',
                      color: flight.stops === 0 ? '#166534' : '#92400e'
                    }}>
                      {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: '80px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16a34a' }}>${flight.price}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{flight.class || 'Economy'}</div>
                  </div>
                  {flight.bookingTip && (
                    <div style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.85rem', color: '#0369a1' }}>
                      💡 {flight.bookingTip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternative Airports */}
        {data.alternativeAirports && Array.isArray(data.alternativeAirports) && data.alternativeAirports.length > 0 && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>🛩️ Alternative Airports</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.alternativeAirports.map((alt, idx) => (
                <span key={idx} style={{
                  background: '#f1f5f9',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem'
                }}>
                  {alt.airport} <span style={{ color: '#16a34a', fontWeight: '600' }}>Save ${alt.savings}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Booking Tips */}
        {data.bookingTips && Array.isArray(data.bookingTips) && (
          <div className="ai-tips-section">
            <h4>💡 Booking Tips</h4>
            <ul>
              {data.bookingTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {data.bestTimeToBook && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.9rem' }}>
            📅 <strong>Best Time to Book:</strong> {data.bestTimeToBook}
          </div>
        )}
      </div>
    );
  };

  // Render Weather Results
  const renderWeatherResults = (data) => {
    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header">
          <h3>🌤️ Weather Forecast & Advice</h3>
          <div className="ai-result-meta">
            <span>📍 {data.destination}</span>
            {data.travelPeriod && <span>📅 {data.travelPeriod}</span>}
          </div>
        </div>

        {/* Current Weather Overview */}
        {data.weatherOverview && (
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{data.weatherOverview.temperature?.average || data.weatherOverview.temperature?.high}</div>
                <div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Average Temp</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>☀️ {data.weatherOverview.temperature?.high}</div>
                <div style={{ opacity: 0.9, fontSize: '0.85rem' }}>High</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>🌙 {data.weatherOverview.temperature?.low}</div>
                <div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Low</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>💧 {data.weatherOverview.humidity}</div>
                <div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Humidity</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>🌧️ {data.weatherOverview.precipitation}</div>
                <div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Rain Chance</div>
              </div>
            </div>
            {data.weatherOverview.conditions && (
              <div style={{ marginTop: '1rem', textAlign: 'center', opacity: 0.95 }}>
                {data.weatherOverview.conditions}
              </div>
            )}
          </div>
        )}

        {/* Season Info */}
        {data.seasonInfo && (
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#334155' }}>🗓️ Season Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Current Season</div>
                <div style={{ fontWeight: '600' }}>{data.seasonInfo.currentSeason}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Tourist Season</div>
                <div style={{ fontWeight: '600' }}>{data.seasonInfo.isTouristSeason ? '✅ Yes' : '❌ No'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Crowd Level</div>
                <div style={{ fontWeight: '600' }}>{data.seasonInfo.crowdLevel}</div>
              </div>
            </div>
            {data.seasonInfo.description && (
              <p style={{ marginTop: '0.75rem', color: '#475569', fontSize: '0.9rem' }}>{data.seasonInfo.description}</p>
            )}
          </div>
        )}

        {/* Daily Forecast */}
        {data.dailyForecast && Array.isArray(data.dailyForecast) && data.dailyForecast.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#334155' }}>📅 Daily Forecast</h4>
            <div style={{ display: 'flex', overflowX: 'auto', gap: '0.75rem', paddingBottom: '0.5rem' }}>
              {data.dailyForecast.map((day, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  minWidth: '140px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{day.day}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>{day.date}</div>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#ef4444' }}>{day.high}</span> / <span style={{ color: '#3b82f6' }}>{day.low}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>{day.conditions}</div>
                  <div style={{ fontSize: '0.8rem', color: '#0ea5e9', marginTop: '0.25rem' }}>🌧️ {day.rainChance}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Recommendations */}
        {data.activityRecommendations && Array.isArray(data.activityRecommendations) && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>🎯 Activity Recommendations by Weather</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.activityRecommendations.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <strong>{item.activity}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Best: {item.bestTime}</div>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    background: item.weatherSuitability === 'ideal' ? '#dcfce7' :
                               item.weatherSuitability === 'good' ? '#dbeafe' :
                               item.weatherSuitability === 'manageable' ? '#fef3c7' : '#fee2e2',
                    color: item.weatherSuitability === 'ideal' ? '#166534' :
                           item.weatherSuitability === 'good' ? '#1d4ed8' :
                           item.weatherSuitability === 'manageable' ? '#92400e' : '#991b1b'
                  }}>
                    {item.weatherSuitability}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Packing Recommendations */}
        {data.packingRecommendations && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>🧳 Packing for the Weather</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {Object.entries(data.packingRecommendations).map(([category, items]) => (
                <div key={category}>
                  <h5 style={{ textTransform: 'capitalize', color: '#667eea', marginBottom: '0.5rem' }}>{category}</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {Array.isArray(items) && items.map((item, idx) => (
                      <span key={idx} style={{
                        background: '#f1f5f9',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '15px',
                        fontSize: '0.8rem'
                      }}>{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Times to Visit */}
        {data.bestTimesToVisit && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>📆 Best Times to Visit</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: '#dcfce7', borderRadius: '8px' }}>
                <div style={{ color: '#166534', fontWeight: '600' }}>Best Overall</div>
                <div style={{ color: '#15803d' }}>{data.bestTimesToVisit.overall}</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#dbeafe', borderRadius: '8px' }}>
                <div style={{ color: '#1d4ed8', fontWeight: '600' }}>Best Weather</div>
                <div style={{ color: '#2563eb' }}>{data.bestTimesToVisit.forWeather}</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ color: '#92400e', fontWeight: '600' }}>Best Prices</div>
                <div style={{ color: '#a16207' }}>{data.bestTimesToVisit.forPrices}</div>
              </div>
              {data.bestTimesToVisit.avoid && (
                <div style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '8px' }}>
                  <div style={{ color: '#991b1b', fontWeight: '600' }}>Avoid</div>
                  <div style={{ color: '#b91c1c' }}>{data.bestTimesToVisit.avoid}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {data.warnings && Array.isArray(data.warnings) && data.warnings.length > 0 && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>⚠️ Weather Warnings</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#78350f' }}>
              {data.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Local Tips */}
        {data.localTips && Array.isArray(data.localTips) && (
          <div className="ai-tips-section">
            <h4>💡 Local Weather Tips</h4>
            <ul>
              {data.localTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sunrise/Sunset */}
        {data.sunriseSunset && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f0f9ff', borderRadius: '8px' }}>
            🌅 <strong>Sunrise:</strong> {data.sunriseSunset.sunrise} |
            🌇 <strong>Sunset:</strong> {data.sunriseSunset.sunset}
            {data.sunriseSunset.goldenHour && <span> | 📸 <strong>Golden Hour:</strong> {data.sunriseSunset.goldenHour}</span>}
          </div>
        )}
      </div>
    );
  };

  // Render Hotel Match Results
  const renderHotelMatchResults = (data) => {
    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header">
          <h3>🏨 Hotel Recommendations</h3>
          {data.searchCriteria && (
            <div className="ai-result-meta">
              <span>📍 {data.destination}</span>
              <span>💰 ${data.searchCriteria.budget}/night budget</span>
              <span>👥 {data.searchCriteria.travelers}</span>
            </div>
          )}
        </div>

        {/* Perfect Matches */}
        {data.perfectMatches && Array.isArray(data.perfectMatches) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#334155' }}>⭐ Perfect Matches</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.perfectMatches.map((hotel, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  border: idx === 0 ? '2px solid #667eea' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  position: 'relative'
                }}>
                  {idx === 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '1rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>🏆 Top Pick</span>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>{hotel.name}</h4>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {hotel.type} • {hotel.neighborhood} • {'⭐'.repeat(Math.floor(hotel.starRating || 4))}
                      </div>
                      {hotel.distanceToCenter && (
                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          📍 {hotel.distanceToCenter} from center
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
                        ${hotel.pricePerNight}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>per night</div>
                      {hotel.matchScore && (
                        <div style={{
                          marginTop: '0.25rem',
                          padding: '0.2rem 0.5rem',
                          background: '#dcfce7',
                          color: '#166534',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {hotel.matchScore}% Match
                        </div>
                      )}
                    </div>
                  </div>
                  {hotel.highlights && Array.isArray(hotel.highlights) && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {hotel.highlights.map((h, i) => (
                        <span key={i} style={{
                          background: '#f1f5f9',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '15px',
                          fontSize: '0.8rem'
                        }}>✓ {h}</span>
                      ))}
                    </div>
                  )}
                  {hotel.amenities && Array.isArray(hotel.amenities) && (
                    <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                      Amenities: {hotel.amenities.join(' • ')}
                    </div>
                  )}
                  {hotel.bestFor && (
                    <div style={{ marginTop: '0.5rem', color: '#667eea', fontSize: '0.85rem' }}>
                      👥 Best for: {hotel.bestFor}
                    </div>
                  )}
                  {hotel.bookingTip && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      background: '#f0f9ff',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#0369a1'
                    }}>
                      💡 {hotel.bookingTip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget & Splurge Options */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {data.budgetOptions && Array.isArray(data.budgetOptions) && data.budgetOptions.length > 0 && (
            <div style={{ background: '#dcfce7', borderRadius: '12px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#166534' }}>💚 Budget-Friendly</h4>
              {data.budgetOptions.map((opt, idx) => (
                <div key={idx} style={{ marginBottom: idx < data.budgetOptions.length - 1 ? '0.75rem' : 0 }}>
                  <div style={{ fontWeight: '600', color: '#15803d' }}>{opt.name} - ${opt.pricePerNight}/night</div>
                  <div style={{ color: '#166534', fontSize: '0.85rem' }}>{opt.tradeoffs}</div>
                  {opt.stillGreatFor && (
                    <div style={{ color: '#14532d', fontSize: '0.85rem', marginTop: '0.25rem' }}>✓ {opt.stillGreatFor}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          {data.splurgeOptions && Array.isArray(data.splurgeOptions) && data.splurgeOptions.length > 0 && (
            <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#92400e' }}>💎 Worth the Splurge</h4>
              {data.splurgeOptions.map((opt, idx) => (
                <div key={idx} style={{ marginBottom: idx < data.splurgeOptions.length - 1 ? '0.75rem' : 0 }}>
                  <div style={{ fontWeight: '600', color: '#a16207' }}>{opt.name} - ${opt.pricePerNight}/night</div>
                  <div style={{ color: '#78350f', fontSize: '0.85rem' }}>{opt.worthIt}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Neighborhood Guide */}
        {data.neighborhoodGuide && Array.isArray(data.neighborhoodGuide) && data.neighborhoodGuide.length > 0 && (
          <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
            <h4>🗺️ Neighborhood Guide</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {data.neighborhoodGuide.map((hood, idx) => (
                <div key={idx} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{hood.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{hood.vibe}</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: '500' }}>~${hood.avgPrice}/night</span>
                    {hood.walkability && <span style={{ marginLeft: '0.5rem', color: '#64748b' }}>• {hood.walkability}</span>}
                  </div>
                  <div style={{ color: '#667eea', fontSize: '0.8rem', marginTop: '0.25rem' }}>Best for: {hood.bestFor}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Tips */}
        {data.bookingTips && Array.isArray(data.bookingTips) && (
          <div className="ai-tips-section">
            <h4>💡 Booking Tips</h4>
            <ul>
              {data.bookingTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {data.bestTimeToBook && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.9rem' }}>
            📅 <strong>Best Time to Book:</strong> {data.bestTimeToBook}
          </div>
        )}

        {/* Save Button */}
        {data.perfectMatches && Array.isArray(data.perfectMatches) && data.perfectMatches.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => saveAccommodations(data.perfectMatches, data.destination)}
              disabled={saveStatus.saving}
              style={{ width: 'auto' }}
            >
              💾 Save Hotels to Database
            </button>
            {saveStatus.message && <span style={{ color: saveStatus.message.includes('✅') ? '#16a34a' : '#dc2626' }}>{saveStatus.message}</span>}
          </div>
        )}
      </div>
    );
  };

  // Main render AI Result function
  const renderAIResult = () => {
    if (!aiResult) return null;

    if (aiResult.error) {
      return <div className="error-message">{aiResult.error}</div>;
    }

    const data = parseAIResponse(aiResult);
    console.log('Rendering AI result, parsed data:', data);
    console.log('Data keys:', data ? Object.keys(data) : 'null');

    if (!data) return null;

    // If we got raw text back, try to format it nicely
    if (data.rawText || data.isRawText) {
      const textContent = data.rawText || data.message || '';

      // Try to format JSON-like content nicely
      if (textContent.includes('"') && (textContent.includes('{') || textContent.includes('['))) {
        // It looks like JSON, let's try to display it in a structured way
        return (
          <div className="ai-result-formatted">
            <div className="ai-result-header">
              <h3>🤖 AI Response</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Response was too long - showing raw data</p>
            </div>
            <pre style={{
              background: '#1e293b',
              color: '#e2e8f0',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              maxHeight: '500px'
            }}>
              {textContent}
            </pre>
          </div>
        );
      }

      return (
        <div className="ai-result-formatted">
          <div className="ai-result-header">
            <h3>🤖 AI Response</h3>
          </div>
          <div className="ai-generic-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {textContent}
          </div>
        </div>
      );
    }

    // Detect the type of result and render appropriately
    // Packing list detection - has categories object with items
    if (data.categories && typeof data.categories === 'object') {
      console.log('Detected: Packing List');
      return renderPackingList(data);
    }

    // Itinerary ANALYSIS detection - has conflicts, hasConflicts, or generatedItinerary
    if (data.hasConflicts !== undefined || data.generatedItinerary || data.optimizedOrder ||
        (data.conflicts && Array.isArray(data.conflicts))) {
      console.log('Detected: Itinerary Analysis');
      return renderItineraryAnalysis(data);
    }

    // Itinerary detection - has days array or itinerary with detailed trip info
    if (data.days || data.itinerary || (data.fromLocation && data.totalDays)) {
      console.log('Detected: Itinerary');
      return renderItinerary(data);
    }

    // Suggestions detection - activities, restaurants, or accommodations arrays
    if (data.suggestions ||
        (Array.isArray(data.activities) && data.activities.length > 0 && data.activities[0].name) ||
        (Array.isArray(data.restaurants) && data.restaurants.length > 0) ||
        (Array.isArray(data.accommodations) && data.accommodations.length > 0) ||
        Array.isArray(data) && data.length > 0 && data[0].name) {
      console.log('Detected: Suggestions');
      // Handle when result is a direct array
      if (Array.isArray(data)) {
        return renderSuggestions({ suggestions: data, type: 'Suggestions' });
      }
      return renderSuggestions(data);
    }

    // Budget optimization detection - has breakdown or analysis
    if (data.breakdown || data.savingTips || data.moneySavingTips || data.analysis ||
        (data.budget && data.recommendations)) {
      console.log('Detected: Budget Optimization');
      return renderBudgetOptimization(data);
    }

    // Translation detection
    if (data.translation || data.translated || (data.original && data.pronunciation)) {
      console.log('Detected: Translation');
      return renderTranslation(data);
    }

    // Destination info detection - ONLY if it doesn't have itinerary properties
    if ((data.language || data.currency || data.attractions || data.bestTimeToVisit ||
        data.popular_attractions || data.local_cuisine || data.climate) &&
        !data.days && !data.itinerary && !data.fromLocation && !data.totalDays) {
      console.log('Detected: Destination Info');
      return renderDestinationInfo(data);
    }

    // Review summary detection
    if (data.overallSentiment || data.commonPros || data.categoryBreakdown) {
      console.log('Detected: Review Summary');
      return renderGenericResult(data);
    }

    // Trip report detection
    if (data.highlights && data.statistics && data.bestMoments) {
      console.log('Detected: Trip Report');
      return renderGenericResult(data);
    }

    // Flight results detection
    if (data.recommendations && data.totalEstimate && (data.searchCriteria?.origin || data.cheapestOption)) {
      console.log('Detected: Flight Results');
      return renderFlightResults(data);
    }

    // Weather results detection
    if (data.weatherOverview || data.dailyForecast || data.seasonInfo || data.packingRecommendations) {
      console.log('Detected: Weather Results');
      return renderWeatherResults(data);
    }

    // Hotel match results detection
    if (data.perfectMatches || data.neighborhoodGuide || (data.budgetOptions && data.splurgeOptions)) {
      console.log('Detected: Hotel Match Results');
      return renderHotelMatchResults(data);
    }

    // Use smart generic renderer for everything else
    console.log('Using generic renderer');
    return renderGenericResult(data);
  };

  // Specialized AI Feature Pages
  if (config.isAI && config.aiType) {
    return (
      <div className="main-content">
        <div className="feature-page">
          <div className="feature-header">
            <div className="feature-header-left">
              <button className="back-btn" onClick={() => navigate('/')}>←</button>
              <h2>{config.icon} {config.title}</h2>
            </div>
          </div>

          <div className="ai-assistant-container">
            <div className="ai-content">
              {/* AI Flight Finder */}
              {config.aiType === 'flights' && (
                <div className="ai-form-section">
                  <h3>✈️ Find the Best Flights with AI</h3>
                  <p>Let AI find and compare flight options for your trip.</p>

                  <button
                    className="btn btn-secondary btn-small"
                    style={{ marginBottom: '1rem' }}
                    onClick={() => setAiInput({
                      ...aiInput,
                      fromLocation: 'New York, USA',
                      destination: 'London, UK',
                      departureDate: '2026-04-15',
                      returnDate: '2026-04-22',
                      budget: 800,
                      passengers: 2
                    })}
                  >
                    📋 Load Sample Data
                  </button>

                  <div className="ai-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>From (Origin)</label>
                        <input
                          type="text"
                          placeholder="e.g., New York, USA"
                          value={aiInput.fromLocation}
                          onChange={(e) => setAiInput({ ...aiInput, fromLocation: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>To (Destination)</label>
                        <input
                          type="text"
                          placeholder="e.g., London, UK"
                          value={aiInput.destination}
                          onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Departure Date</label>
                        <input
                          type="date"
                          value={aiInput.departureDate || ''}
                          onChange={(e) => setAiInput({ ...aiInput, departureDate: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Return Date</label>
                        <input
                          type="date"
                          value={aiInput.returnDate || ''}
                          onChange={(e) => setAiInput({ ...aiInput, returnDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Budget per Person ($)</label>
                        <input
                          type="number"
                          min="100"
                          value={aiInput.budget}
                          onChange={(e) => setAiInput({ ...aiInput, budget: parseInt(e.target.value) || 500 })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Passengers</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={aiInput.passengers || 1}
                          onChange={(e) => setAiInput({ ...aiInput, passengers: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleAIFeature('flights')}
                      disabled={!aiInput.fromLocation || !aiInput.destination || aiLoading}
                      style={{ width: 'auto' }}
                    >
                      {aiLoading ? 'Searching...' : '✈️ Find Flights'}
                    </button>
                  </div>

                  {aiLoading && (
                    <div className="ai-loading">
                      <div className="spinner"></div>
                      <span>AI is searching for flights...</span>
                    </div>
                  )}

                  {renderAIResult()}
                </div>
              )}

              {/* AI Hotel Matcher */}
              {config.aiType === 'hotels' && (
                <div className="ai-form-section">
                  <h3>🏨 Match Your Perfect Hotel with AI</h3>
                  <p>Find accommodations that match your preferences and budget.</p>

                  <button
                    className="btn btn-secondary btn-small"
                    style={{ marginBottom: '1rem' }}
                    onClick={() => setAiInput({
                      ...aiInput,
                      destination: 'Paris, France',
                      budget: 200,
                      travelDates: 'June 15-22, 2026',
                      travelers: '2 adults',
                      preferences: 'pool, central location, free breakfast, gym'
                    })}
                  >
                    📋 Load Sample Data
                  </button>

                  <div className="ai-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Destination</label>
                        <input
                          type="text"
                          placeholder="e.g., Paris, France"
                          value={aiInput.destination}
                          onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Budget per Night ($)</label>
                        <input
                          type="number"
                          min="20"
                          value={aiInput.budget}
                          onChange={(e) => setAiInput({ ...aiInput, budget: parseInt(e.target.value) || 150 })}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Travel Dates</label>
                        <input
                          type="text"
                          placeholder="e.g., June 15-22, 2024"
                          value={aiInput.travelDates || ''}
                          onChange={(e) => setAiInput({ ...aiInput, travelDates: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Travelers</label>
                        <input
                          type="text"
                          placeholder="e.g., 2 adults, 1 child"
                          value={aiInput.travelers || ''}
                          onChange={(e) => setAiInput({ ...aiInput, travelers: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Preferences (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g., pool, central location, free breakfast, gym"
                        value={aiInput.preferences || ''}
                        onChange={(e) => setAiInput({ ...aiInput, preferences: e.target.value })}
                      />
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleAIFeature('matchHotels')}
                      disabled={!aiInput.destination || aiLoading}
                      style={{ width: 'auto' }}
                    >
                      {aiLoading ? 'Matching...' : '🏨 Find Hotels'}
                    </button>
                  </div>

                  {aiLoading && (
                    <div className="ai-loading">
                      <div className="spinner"></div>
                      <span>AI is finding your perfect hotel...</span>
                    </div>
                  )}

                  {renderAIResult()}
                </div>
              )}

              {/* AI Weather Advisor */}
              {config.aiType === 'weather' && (
                <div className="ai-form-section">
                  <h3>🌤️ Get Weather-Based Travel Advice</h3>
                  <p>Plan your trip around the weather with AI recommendations.</p>

                  <button
                    className="btn btn-secondary btn-small"
                    style={{ marginBottom: '1rem' }}
                    onClick={() => setAiInput({
                      ...aiInput,
                      destination: 'Tokyo, Japan',
                      travelDates: 'April 2026',
                      interests: 'hiking, sightseeing, photography, temple visits'
                    })}
                  >
                    📋 Load Sample Data
                  </button>

                  <div className="ai-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Destination</label>
                        <input
                          type="text"
                          placeholder="e.g., Tokyo, Japan"
                          value={aiInput.destination}
                          onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Travel Dates</label>
                        <input
                          type="text"
                          placeholder="e.g., March 2024, or March 15-25"
                          value={aiInput.travelDates || ''}
                          onChange={(e) => setAiInput({ ...aiInput, travelDates: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Planned Activities (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g., hiking, beach, sightseeing, photography"
                        value={aiInput.interests}
                        onChange={(e) => setAiInput({ ...aiInput, interests: e.target.value })}
                      />
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleAIFeature('weather')}
                      disabled={!aiInput.destination || aiLoading}
                      style={{ width: 'auto' }}
                    >
                      {aiLoading ? 'Checking...' : '🌤️ Get Weather Advice'}
                    </button>
                  </div>

                  {aiLoading && (
                    <div className="ai-loading">
                      <div className="spinner"></div>
                      <span>AI is analyzing weather data...</span>
                    </div>
                  )}

                  {renderAIResult()}
                </div>
              )}

              {/* AI Budget Tracker */}
              {config.aiType === 'budget' && (
                <div className="ai-form-section">
                  <h3>💵 Optimize Your Travel Budget with AI</h3>
                  <p>Get personalized budget recommendations and money-saving tips.</p>

                  <button
                    className="btn btn-secondary btn-small"
                    style={{ marginBottom: '1rem' }}
                    onClick={() => setAiInput({
                      ...aiInput,
                      fromLocation: 'Chicago, USA',
                      destination: 'Barcelona, Spain',
                      budget: 3000,
                      days: 10,
                      travelStyle: 'moderate'
                    })}
                  >
                    📋 Load Sample Data
                  </button>

                  <div className="ai-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>From (Your Location)</label>
                        <input
                          type="text"
                          placeholder="e.g., New York, USA"
                          value={aiInput.fromLocation}
                          onChange={(e) => setAiInput({ ...aiInput, fromLocation: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Destination</label>
                        <input
                          type="text"
                          placeholder="e.g., Barcelona, Spain"
                          value={aiInput.destination}
                          onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Total Budget ($)</label>
                        <input
                          type="number"
                          min="100"
                          value={aiInput.budget}
                          onChange={(e) => setAiInput({ ...aiInput, budget: parseInt(e.target.value) || 1000 })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Duration (days)</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={aiInput.days}
                          onChange={(e) => setAiInput({ ...aiInput, days: parseInt(e.target.value) || 7 })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Travel Style</label>
                        <select
                          value={aiInput.travelStyle}
                          onChange={(e) => setAiInput({ ...aiInput, travelStyle: e.target.value })}
                        >
                          <option value="budget">Budget</option>
                          <option value="moderate">Moderate</option>
                          <option value="luxury">Luxury</option>
                        </select>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleAIFeature('optimize')}
                      disabled={!aiInput.destination || aiLoading}
                      style={{ width: 'auto' }}
                    >
                      {aiLoading ? 'Optimizing...' : '💰 Optimize Budget'}
                    </button>
                  </div>

                  {aiLoading && (
                    <div className="ai-loading">
                      <div className="spinner"></div>
                      <span>AI is optimizing your budget...</span>
                    </div>
                  )}

                  {renderAIResult()}
                </div>
              )}

              {/* AI Activity Recommender */}
              {config.aiType === 'activities' && (
                <div className="ai-form-section">
                  <h3>🎯 Get Personalized Activity Recommendations</h3>
                  <p>Discover activities tailored to your interests and budget.</p>

                  <button
                    className="btn btn-secondary btn-small"
                    style={{ marginBottom: '1rem' }}
                    onClick={() => setAiInput({
                      ...aiInput,
                      destination: 'Rome, Italy',
                      travelStyle: 'moderate',
                      interests: 'history, food, art, architecture, wine tasting'
                    })}
                  >
                    📋 Load Sample Data
                  </button>

                  <div className="ai-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Destination</label>
                        <input
                          type="text"
                          placeholder="e.g., Rome, Italy"
                          value={aiInput.destination}
                          onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Budget Level</label>
                        <select
                          value={aiInput.travelStyle}
                          onChange={(e) => setAiInput({ ...aiInput, travelStyle: e.target.value })}
                        >
                          <option value="budget">Budget-Friendly</option>
                          <option value="moderate">Moderate</option>
                          <option value="luxury">Premium/Luxury</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Interests (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g., history, food, art, adventure, nature, nightlife"
                        value={aiInput.interests}
                        onChange={(e) => setAiInput({ ...aiInput, interests: e.target.value })}
                      />
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleAIFeature('activities')}
                      disabled={!aiInput.destination || aiLoading}
                      style={{ width: 'auto' }}
                    >
                      {aiLoading ? 'Finding...' : '🎯 Get Activity Ideas'}
                    </button>
                  </div>

                  {aiLoading && (
                    <div className="ai-loading">
                      <div className="spinner"></div>
                      <span>AI is finding activities for you...</span>
                    </div>
                  )}

                  {renderAIResult()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI Assistant Page (General)
  if (config.isAI) {
    return (
      <div className="main-content">
        <div className="feature-page">
          <div className="feature-header">
            <div className="feature-header-left">
              <button className="back-btn" onClick={() => navigate('/')}>←</button>
              <h2>{config.icon} {config.title}</h2>
            </div>
          </div>

          <div className="ai-assistant-container">
            <div className="ai-tabs">
              <button className={`ai-tab ${aiTab === 'chat' ? 'active' : ''}`} onClick={() => setAiTab('chat')}>
                💬 Chat Assistant
              </button>
              <button className={`ai-tab ${aiTab === 'itinerary' ? 'active' : ''}`} onClick={() => setAiTab('itinerary')}>
                🗓️ Trip Planner
              </button>
              <button className={`ai-tab ${aiTab === 'suggestions' ? 'active' : ''}`} onClick={() => setAiTab('suggestions')}>
                💡 Get Suggestions
              </button>
              <button className={`ai-tab ${aiTab === 'tools' ? 'active' : ''}`} onClick={() => setAiTab('tools')}>
                🛠️ AI Tools
              </button>
            </div>

            <div className="ai-content">
              {aiTab === 'chat' && (
                <div className="ai-chat-section">
                  <h3>🤖 Chat with AI Travel Assistant</h3>
                  <p>Ask me anything about travel planning, destinations, tips, and more!</p>
                  <AIChat context={{ destination: aiInput.destination }} />
                </div>
              )}

              {aiTab === 'itinerary' && (
                <div className="ai-form-section">
                  <h3>🗓️ Generate Complete Trip Itinerary</h3>
                  <p>Let AI create a detailed day-by-day travel plan for you.</p>

                  <button
                    className="btn btn-secondary btn-small"
                    style={{ marginBottom: '1rem' }}
                    onClick={() => setAiInput({
                      ...aiInput,
                      fromLocation: 'San Francisco, USA',
                      destination: 'Tokyo, Japan',
                      days: 5,
                      budget: 2500,
                      travelStyle: 'moderate',
                      interests: 'temples, sushi, anime, nature, shopping'
                    })}
                  >
                    📋 Load Sample Data
                  </button>

                  <div className="ai-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>From (Your Location)</label>
                        <input
                          type="text"
                          placeholder="e.g., New York, USA"
                          value={aiInput.fromLocation}
                          onChange={(e) => setAiInput({ ...aiInput, fromLocation: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>To (Destination)</label>
                        <input
                          type="text"
                          placeholder="e.g., Tokyo, Japan"
                          value={aiInput.destination}
                          onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Duration (days)</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={aiInput.days}
                          onChange={(e) => setAiInput({ ...aiInput, days: parseInt(e.target.value) || 7 })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Budget ($)</label>
                        <input
                          type="number"
                          min="100"
                          value={aiInput.budget}
                          onChange={(e) => setAiInput({ ...aiInput, budget: parseInt(e.target.value) || 1000 })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Travel Style</label>
                        <select
                          value={aiInput.travelStyle}
                          onChange={(e) => setAiInput({ ...aiInput, travelStyle: e.target.value })}
                        >
                          <option value="budget">Budget</option>
                          <option value="moderate">Moderate</option>
                          <option value="luxury">Luxury</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Interests (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g., food, culture, adventure, nature"
                        value={aiInput.interests}
                        onChange={(e) => setAiInput({ ...aiInput, interests: e.target.value })}
                      />
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleAIFeature('itinerary')}
                      disabled={!aiInput.destination || aiLoading}
                      style={{ width: 'auto' }}
                    >
                      {aiLoading ? 'Generating...' : '✨ Generate Itinerary'}
                    </button>
                  </div>

                  {renderAIResult()}
                </div>
              )}

              {aiTab === 'suggestions' && (
                <div className="ai-form-section">
                  <h3>💡 Get AI Suggestions</h3>
                  <p>Get personalized recommendations for your trip.</p>

                  <button
                    className="btn btn-secondary btn-small"
                    style={{ marginBottom: '1rem' }}
                    onClick={() => setAiInput({
                      ...aiInput,
                      fromLocation: 'Los Angeles, USA',
                      destination: 'Bali, Indonesia'
                    })}
                  >
                    📋 Load Sample Data
                  </button>

                  <div className="form-row">
                    <div className="form-group">
                      <label>From (Your Location)</label>
                      <input
                        type="text"
                        placeholder="e.g., New York, USA"
                        value={aiInput.fromLocation}
                        onChange={(e) => setAiInput({ ...aiInput, fromLocation: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>To (Destination)</label>
                      <input
                        type="text"
                        placeholder="e.g., Paris, France"
                        value={aiInput.destination}
                        onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="ai-suggestion-buttons">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAIFeature('activities')}
                      disabled={!aiInput.destination || aiLoading}
                    >
                      🎯 Suggest Activities
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAIFeature('restaurants')}
                      disabled={!aiInput.destination || aiLoading}
                    >
                      🍽️ Suggest Restaurants
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAIFeature('accommodations')}
                      disabled={!aiInput.destination || aiLoading}
                    >
                      🏨 Suggest Hotels
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAIFeature('info')}
                      disabled={!aiInput.destination || aiLoading}
                    >
                      📍 Destination Info
                    </button>
                  </div>

                  {aiLoading && (
                    <div className="ai-loading">
                      <div className="spinner"></div>
                      <span>AI is thinking...</span>
                    </div>
                  )}

                  {renderAIResult()}
                </div>
              )}

              {aiTab === 'tools' && (
                <div className="ai-form-section">
                  <h3>🛠️ AI Travel Tools</h3>

                  <div className="ai-tools-grid">
                    {/* Packing List Generator */}
                    <div className="ai-tool-card">
                      <h4>🧳 Smart Packing List</h4>
                      <button
                        className="btn btn-secondary btn-small"
                        style={{ marginBottom: '0.5rem', fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => setAiInput({
                          ...aiInput,
                          fromLocation: 'Miami, USA',
                          destination: 'Reykjavik, Iceland',
                          season: 'winter',
                          tripType: 'adventure'
                        })}
                      >
                        📋 Sample
                      </button>
                      <div className="form-row">
                        <input
                          type="text"
                          placeholder="From (Your Location)"
                          value={aiInput.fromLocation}
                          onChange={(e) => setAiInput({ ...aiInput, fromLocation: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="To (Destination)"
                          value={aiInput.destination}
                          onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                        />
                      </div>
                      <div className="form-row">
                        <select
                          value={aiInput.season}
                          onChange={(e) => setAiInput({ ...aiInput, season: e.target.value })}
                        >
                          <option value="spring">Spring</option>
                          <option value="summer">Summer</option>
                          <option value="fall">Fall</option>
                          <option value="winter">Winter</option>
                        </select>
                        <select
                          value={aiInput.tripType}
                          onChange={(e) => setAiInput({ ...aiInput, tripType: e.target.value })}
                        >
                          <option value="leisure">Leisure</option>
                          <option value="business">Business</option>
                          <option value="adventure">Adventure</option>
                          <option value="beach">Beach</option>
                        </select>
                      </div>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleAIFeature('packing')}
                        disabled={!aiInput.destination || aiLoading}
                      >
                        Generate
                      </button>
                    </div>

                    {/* Budget Optimizer */}
                    <div className="ai-tool-card">
                      <h4>💰 Budget Optimizer</h4>
                      <button
                        className="btn btn-secondary btn-small"
                        style={{ marginBottom: '0.5rem', fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => setAiInput({
                          ...aiInput,
                          fromLocation: 'Boston, USA',
                          destination: 'Bangkok, Thailand',
                          budget: 2000,
                          days: 14
                        })}
                      >
                        📋 Sample
                      </button>
                      <div className="form-row">
                        <input
                          type="text"
                          placeholder="From (Your Location)"
                          value={aiInput.fromLocation}
                          onChange={(e) => setAiInput({ ...aiInput, fromLocation: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="To (Destination)"
                          value={aiInput.destination}
                          onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                        />
                      </div>
                      <div className="form-row">
                        <input
                          type="number"
                          placeholder="Budget $"
                          value={aiInput.budget}
                          onChange={(e) => setAiInput({ ...aiInput, budget: parseInt(e.target.value) || 1000 })}
                        />
                        <input
                          type="number"
                          placeholder="Days"
                          value={aiInput.days}
                          onChange={(e) => setAiInput({ ...aiInput, days: parseInt(e.target.value) || 7 })}
                        />
                      </div>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleAIFeature('optimize')}
                        disabled={!aiInput.destination || aiLoading}
                      >
                        Optimize
                      </button>
                    </div>

                    {/* Translator */}
                    <div className="ai-tool-card">
                      <h4>🌐 Travel Translator</h4>
                      <button
                        className="btn btn-secondary btn-small"
                        style={{ marginBottom: '0.5rem', fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => setAiInput({
                          ...aiInput,
                          phrase: 'Where is the nearest train station?',
                          targetLanguage: 'Japanese'
                        })}
                      >
                        📋 Sample
                      </button>
                      <div className="form-group">
                        <input
                          type="text"
                          placeholder="Phrase to translate"
                          value={aiInput.phrase}
                          onChange={(e) => setAiInput({ ...aiInput, phrase: e.target.value })}
                        />
                      </div>
                      <select
                        value={aiInput.targetLanguage}
                        onChange={(e) => setAiInput({ ...aiInput, targetLanguage: e.target.value })}
                      >
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Italian">Italian</option>
                        <option value="German">German</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Korean">Korean</option>
                        <option value="Thai">Thai</option>
                        <option value="Arabic">Arabic</option>
                      </select>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleAIFeature('translate')}
                        disabled={!aiInput.phrase || aiLoading}
                      >
                        Translate
                      </button>
                    </div>

                    {/* Itinerary Analyzer */}
                    <div className="ai-tool-card">
                      <h4>🔍 Itinerary Analyzer</h4>
                      <button
                        className="btn btn-secondary btn-small"
                        style={{ marginBottom: '0.5rem', fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => setAiInput({
                          ...aiInput,
                          destination: 'Istanbul, Turkey',
                          days: 5
                        })}
                      >
                        📋 Sample
                      </button>
                      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                        Generate and analyze an itinerary for any destination.
                      </p>
                      <input
                        type="text"
                        placeholder="Destination (e.g., Turkey)"
                        value={aiInput.destination}
                        onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <input
                        type="number"
                        placeholder="Days"
                        value={aiInput.days}
                        onChange={(e) => setAiInput({ ...aiInput, days: parseInt(e.target.value) || 5 })}
                        min="1"
                        max="14"
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleAIFeature('analyze')}
                        disabled={!aiInput.destination || aiLoading}
                      >
                        Analyze Itinerary
                      </button>
                    </div>

                    {/* Review Summarizer */}
                    <div className="ai-tool-card">
                      <h4>📊 Review Summarizer</h4>
                      <p style={{ fontSize: '0.85rem', color: '#666' }}>
                        Get AI insights from all your travel reviews.
                      </p>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleAIFeature('summarize')}
                        disabled={aiLoading}
                      >
                        Summarize Reviews
                      </button>
                    </div>

                    {/* Destination Auto-Fill */}
                    <div className="ai-tool-card">
                      <h4>📍 Auto-Fill Destination</h4>
                      <button
                        className="btn btn-secondary btn-small"
                        style={{ marginBottom: '0.5rem', fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => setAiInput({
                          ...aiInput,
                          fromLocation: 'New York, USA',
                          destination: 'Marrakech, Morocco'
                        })}
                      >
                        📋 Sample
                      </button>
                      <div className="form-row">
                        <input
                          type="text"
                          placeholder="From (Your Location)"
                          value={aiInput.fromLocation}
                          onChange={(e) => setAiInput({ ...aiInput, fromLocation: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="To (Destination)"
                          value={aiInput.destination}
                          onChange={(e) => setAiInput({ ...aiInput, destination: e.target.value })}
                        />
                      </div>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleAIFeature('autofill')}
                        disabled={!aiInput.destination || aiLoading}
                      >
                        Get Info
                      </button>
                    </div>
                  </div>

                  {aiLoading && (
                    <div className="ai-loading" style={{ marginTop: '1rem' }}>
                      <div className="spinner"></div>
                      <span>AI is working...</span>
                    </div>
                  )}

                  {renderAIResult()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detail View
  if (showDetail && selectedItem) {
    return (
      <div className="main-content">
        <div className="feature-page">
          <div className="feature-header">
            <div className="feature-header-left">
              <button className="back-btn" onClick={() => setShowDetail(false)}>←</button>
              <h2>{config.icon} {config.title} Details</h2>
            </div>
          </div>
          <div className="detail-view">
            <div className="detail-header">
              <div className="detail-title">
                <h2>{selectedItem.name || selectedItem.title || selectedItem.item_name || selectedItem.entity_name}</h2>
                <p className="detail-subtitle">
                  ID: {selectedItem.id} | Created: {new Date(selectedItem.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="detail-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(selectedItem, e);
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(selectedItem, e);
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
            <div className="detail-grid">
              {config.fields.map((field) => (
                <div className="detail-item" key={field.name}>
                  <label>{field.label}</label>
                  <p>{formatValue(selectedItem[field.name], field.name)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="main-content">
      <div className="feature-page">
        <div className="feature-header">
          <div className="feature-header-left">
            <button className="back-btn" onClick={() => navigate('/')}>←</button>
            <h2>{config.icon} {config.title}</h2>
          </div>
          <button className="add-btn" onClick={handleAdd}>+ Add New</button>
        </div>

        {error && <div className="error-message" style={{ margin: '1rem' }}>{error}</div>}
        {success && <div className="success-message" style={{ margin: '1rem' }}>{success}</div>}

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{config.icon}</div>
            <h3>No {config.title.toLowerCase()} yet</h3>
            <p>Click "Add New" to create your first entry</p>
          </div>
        ) : (
          <DataTable
            data={data}
            columns={config.columns}
            columnLabels={config.columnLabels}
            title={config.title}
            formatValue={formatValue}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </div>

      {/* Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        title="Delete Item"
        message="Are you sure you want to delete this item? This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ open: false, item: null })}
        danger
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setFieldErrors({}); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit' : 'Add'} {config.title.slice(0, -1)}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); setFieldErrors({}); }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {config.fields.map((field) => (
                  <div className={`form-group ${fieldErrors[field.name] ? 'form-group--error' : ''}`} key={field.name}>
                    <label htmlFor={field.name}>{field.label}{field.required && <span className="field-required">*</span>}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        rows="3"
                        className={fieldErrors[field.name] ? 'input--invalid' : ''}
                        style={{ width: '100%', padding: '0.75rem', border: `2px solid ${fieldErrors[field.name] ? '#f56565' : '#e2e8f0'}`, borderRadius: '8px' }}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        className={fieldErrors[field.name] ? 'input--invalid' : ''}
                        style={{ width: '100%', padding: '0.75rem', border: `2px solid ${fieldErrors[field.name] ? '#f56565' : '#e2e8f0'}`, borderRadius: '8px' }}
                      >
                        <option value="">Select...</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        id={field.name}
                        name={field.name}
                        checked={formData[field.name] || false}
                        onChange={handleInputChange}
                        style={{ width: 'auto', marginLeft: '0.5rem' }}
                      />
                    ) : (
                      <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        className={fieldErrors[field.name] ? 'input--invalid' : ''}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                      />
                    )}
                    {fieldErrors[field.name] && (
                      <span className="field-error">{fieldErrors[field.name]}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  {isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturePage;
