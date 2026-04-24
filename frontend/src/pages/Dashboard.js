import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

const quickAccessItems = [
  { id: 'trips', name: 'Trips', icon: '🌍', apiKey: 'trips' },
  { id: 'destinations', name: 'Destinations', icon: '📍', apiKey: 'destinations' },
  { id: 'activities', name: 'Activities', icon: '🎯', apiKey: 'activities' },
  { id: 'accommodations', name: 'Accommodations', icon: '🏨', apiKey: 'accommodations' },
  { id: 'transportation', name: 'Transportation', icon: '✈️', apiKey: 'transportation' },
  { id: 'restaurants', name: 'Restaurants', icon: '🍽️', apiKey: 'restaurants' },
  { id: 'budgets', name: 'Budgets', icon: '💰', apiKey: 'budgets' },
  { id: 'documents', name: 'Documents', icon: '📄', apiKey: 'documents' },
  { id: 'packing-lists', name: 'Packing Lists', icon: '🧳', apiKey: 'packingLists' },
  { id: 'travel-tips', name: 'Travel Tips', icon: '💡', apiKey: 'travelTips' },
  { id: 'emergency-contacts', name: 'Emergency Contacts', icon: '🆘', apiKey: 'emergencyContacts' },
  { id: 'reviews', name: 'Reviews', icon: '⭐', apiKey: 'reviews' },
  { id: 'photos', name: 'Photos', icon: '📸', apiKey: 'photos' },
  { id: 'notes', name: 'Notes', icon: '📝', apiKey: 'notes' },
];

const aiTools = [
  { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖', desc: 'Get travel advice and suggestions' },
  { id: 'ai-flights', name: 'Flight Finder', icon: '✈️', desc: 'Find the best flight deals' },
  { id: 'ai-hotels', name: 'Hotel Matcher', icon: '🏨', desc: 'Match your perfect hotel' },
  { id: 'ai-weather', name: 'Weather Advisor', icon: '🌤️', desc: 'Weather-based recommendations' },
  { id: 'ai-budget', name: 'Budget Tracker', icon: '💵', desc: 'Optimize your travel budget' },
  { id: 'ai-activities', name: 'Activity Finder', icon: '🎯', desc: 'Discover activities for you' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const countPromises = quickAccessItems.map(async (feature) => {
        try {
          const response = await api[feature.apiKey].getAll();
          return { [feature.id]: response.data.length };
        } catch {
          return { [feature.id]: 0 };
        }
      });

      const results = await Promise.all(countPromises);
      const countsObj = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setCounts(countsObj);
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const totalTrips = counts['trips'] || 0;
  const totalDestinations = counts['destinations'] || 0;
  const totalBudgets = counts['budgets'] || 0;

  const firstName = user?.name?.split(' ')[0] || 'Traveler';

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <h1>Welcome back, {firstName}</h1>
        <p>Here's an overview of your travel plans</p>
      </div>

      {/* Stats Row */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon--purple">🌍</div>
          <div className="stat-card-info">
            <h3>{loading ? '-' : totalTrips}</h3>
            <p>Total Trips</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon--blue">📍</div>
          <div className="stat-card-info">
            <h3>{loading ? '-' : totalDestinations}</h3>
            <p>Destinations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon--green">💰</div>
          <div className="stat-card-info">
            <h3>{loading ? '-' : totalBudgets}</h3>
            <p>Budget Plans</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon--orange">📋</div>
          <div className="stat-card-info">
            <h3>{loading ? '-' : totalItems}</h3>
            <p>Total Items</p>
          </div>
        </div>
      </div>

      {/* AI Tools Section */}
      <h2 className="dashboard-section-title">AI-Powered Tools</h2>
      <div className="features-grid ai-features-grid" style={{ marginBottom: '2rem' }}>
        {aiTools.map((tool) => (
          <div
            key={tool.id}
            className="feature-card ai-feature-card"
            onClick={() => navigate(`/feature/${tool.id}`)}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
            }}
          >
            <div className="feature-card-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
              {tool.icon}
            </div>
            <h3 style={{ color: 'white' }}>{tool.name}</h3>
            <p style={{ color: 'rgba(255,255,255,0.85)' }}>{tool.desc}</p>
            <span
              className="feature-card-count"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              AI Powered
            </span>
          </div>
        ))}
      </div>

      {/* Data Section */}
      <h2 className="dashboard-section-title">Travel Data</h2>
      <div className="features-grid">
        {quickAccessItems.map((feature) => (
          <div
            key={feature.id}
            className="feature-card"
            onClick={() => navigate(`/feature/${feature.id}`)}
          >
            <div className="feature-card-icon">{feature.icon}</div>
            <h3>{feature.name}</h3>
            {!loading && counts[feature.id] !== undefined && (
              <span className="feature-card-count">{counts[feature.id]} items</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
