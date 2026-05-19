import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const aiFeatures = [
  { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖' },
  { id: 'ai-flights', name: 'Flight Finder', icon: '✈️' },
  { id: 'ai-hotels', name: 'Hotel Matcher', icon: '🏨' },
  { id: 'ai-weather', name: 'Weather Advisor', icon: '🌤️' },
  { id: 'ai-budget', name: 'Budget Tracker', icon: '💵' },
  { id: 'ai-activities', name: 'Activity Finder', icon: '🎯' },
  { id: 'ai-history', name: 'AI History', icon: '📜', path: '/ai-history' },
  { id: 'trip-inspiration', name: 'Trip Inspiration', icon: '🌟', path: '/trip-inspiration' },
  { id: 'day-of-mode', name: 'Day-Of Mode', icon: '📍', path: '/day-of-mode' },
  { id: 'visa-advisor', name: 'Visa Advisor', icon: '🛂', path: '/visa-advisor' },
  { id: 'insurance-recommender', name: 'Insurance', icon: '🛡️', path: '/insurance-recommender' },
  { id: 'dynamic-adjuster', name: 'Dynamic Adjuster', icon: '🔄', path: '/dynamic-adjuster' },
  { id: 'custom-views', name: 'Travel Views', icon: '🗺️', path: '/custom-views' },
];

const dataFeatures = [
  { id: 'trips', name: 'Trips', icon: '🌍' },
  { id: 'destinations', name: 'Destinations', icon: '📍' },
  { id: 'activities', name: 'Activities', icon: '🎯' },
  { id: 'accommodations', name: 'Accommodations', icon: '🏨' },
  { id: 'transportation', name: 'Transportation', icon: '✈️' },
  { id: 'restaurants', name: 'Restaurants', icon: '🍽️' },
  { id: 'budgets', name: 'Budgets', icon: '💰' },
  { id: 'documents', name: 'Documents', icon: '📄' },
  { id: 'packing-lists', name: 'Packing Lists', icon: '🧳' },
  { id: 'travel-tips', name: 'Travel Tips', icon: '💡' },
  { id: 'emergency-contacts', name: 'Emergency', icon: '🆘' },
  { id: 'reviews', name: 'Reviews', icon: '⭐' },
  { id: 'photos', name: 'Photos', icon: '📸' },
  { id: 'notes', name: 'Notes', icon: '📝' },
  { id: 'document-vault', name: 'Document Vault', icon: '🔒', path: '/document-vault' },
  { id: 'trip-collaboration', name: 'Collaboration', icon: '👥', path: '/trip-collaboration' },
];

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [aiExpanded, setAiExpanded] = useState(true);
  const [dataExpanded, setDataExpanded] = useState(true);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <NavLink to="/" className="sidebar-brand-link">
            <span className="sidebar-brand-icon">✈️</span>
            <span className="sidebar-brand-text">TravelAI</span>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* Dashboard link */}
          <NavLink
            to="/"
            className={`sidebar-nav-item ${isActive('/') ? 'sidebar-nav-item--active' : ''}`}
            onClick={() => window.innerWidth < 768 && onToggle()}
          >
            <span className="sidebar-nav-icon">📊</span>
            <span className="sidebar-nav-label">Dashboard</span>
          </NavLink>

          {/* AI Tools Section */}
          <div className="sidebar-section">
            <button
              className="sidebar-section-header"
              onClick={() => setAiExpanded(!aiExpanded)}
            >
              <span className="sidebar-section-title">AI Tools</span>
              <span className={`sidebar-section-arrow ${aiExpanded ? 'sidebar-section-arrow--open' : ''}`}>
                &#9654;
              </span>
            </button>
            <div className={`sidebar-section-items ${aiExpanded ? 'sidebar-section-items--expanded' : ''}`}>
              {aiFeatures.map((feature) => {
                const featurePath = feature.path || `/feature/${feature.id}`;
                return (
                  <NavLink
                    key={feature.id}
                    to={featurePath}
                    className={`sidebar-nav-item sidebar-nav-item--sub ${
                      isActive(featurePath) ? 'sidebar-nav-item--active' : ''
                    }`}
                    onClick={() => window.innerWidth < 768 && onToggle()}
                  >
                    <span className="sidebar-nav-icon">{feature.icon}</span>
                    <span className="sidebar-nav-label">{feature.name}</span>
                    <span className="sidebar-nav-badge sidebar-nav-badge--ai">AI</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Travel Data Section */}
          <div className="sidebar-section">
            <button
              className="sidebar-section-header"
              onClick={() => setDataExpanded(!dataExpanded)}
            >
              <span className="sidebar-section-title">Travel Data</span>
              <span className={`sidebar-section-arrow ${dataExpanded ? 'sidebar-section-arrow--open' : ''}`}>
                &#9654;
              </span>
            </button>
            <div className={`sidebar-section-items ${dataExpanded ? 'sidebar-section-items--expanded' : ''}`}>
              {dataFeatures.map((feature) => (
                <NavLink
                  key={feature.id}
                  to={`/feature/${feature.id}`}
                  className={`sidebar-nav-item sidebar-nav-item--sub ${
                    isActive(`/feature/${feature.id}`) ? 'sidebar-nav-item--active' : ''
                  }`}
                  onClick={() => window.innerWidth < 768 && onToggle()}
                >
                  <span className="sidebar-nav-icon">{feature.icon}</span>
                  <span className="sidebar-nav-label">{feature.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} title="Profile Settings">
            <div className="sidebar-user-avatar">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || 'Traveler'}</span>
              <span className="sidebar-user-email">{user?.email}</span>
            </div>
            <svg className="sidebar-settings-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
          <button onClick={logout} className="sidebar-logout" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
