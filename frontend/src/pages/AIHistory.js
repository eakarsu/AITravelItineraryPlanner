import React, { useState, useEffect, useCallback } from 'react';
import { aiHistory } from '../services/api';

const featureLabels = {
  itinerary: { label: 'Itinerary', icon: '🗺️' },
  autofill: { label: 'Auto-Fill', icon: '✨' },
  optimize: { label: 'Budget', icon: '💰' },
  packing: { label: 'Packing', icon: '🧳' },
  chat: { label: 'Chat', icon: '💬' },
  summarize: { label: 'Summary', icon: '📊' },
  analyze: { label: 'Analysis', icon: '🔍' },
  activities: { label: 'Activities', icon: '🎯' },
  restaurants: { label: 'Restaurants', icon: '🍽️' },
  accommodations: { label: 'Hotels', icon: '🏨' },
  info: { label: 'Info', icon: '📍' },
  translate: { label: 'Translate', icon: '🌐' },
  report: { label: 'Report', icon: '📄' },
  flights: { label: 'Flights', icon: '✈️' },
  weather: { label: 'Weather', icon: '🌤️' },
  matchHotels: { label: 'Hotel Match', icon: '🏨' },
};

// ─── Professional Response Renderers ───────────────────────────────

const renderItinerary = (data) => {
  const days = data.days || data.itinerary || [];
  return (
    <div className="ai-result-formatted">
      <div className="ai-result-header">
        <h3>🗓️ Trip Itinerary</h3>
        <div className="ai-result-meta">
          {(data.fromLocation || data.from) && <span>🛫 From: {data.fromLocation || data.from}</span>}
          <span>📍 To: {data.destination || data.to}</span>
          {(data.totalDays || days.length) > 0 && <span>📅 {data.totalDays || days.length} Days</span>}
          {(data.estimatedBudget || data.totalBudget || data.budget) && (
            <span>💰 ${data.estimatedBudget || data.totalBudget || data.budget}</span>
          )}
        </div>
      </div>
      {(data.summary || data.overview) && (
        <div className="ai-overview-card"><p>{data.summary || data.overview}</p></div>
      )}
      {data.visaInfo && (
        <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
          <h4>📋 Visa Information</h4>
          <p>{data.visaInfo}</p>
        </div>
      )}
      {data.flights && (
        <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
          <h4>✈️ Flight Information</h4>
          {data.flights.outbound && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Outbound:</strong> {data.flights.outbound.from} → {data.flights.outbound.to}
              {data.flights.outbound.estimatedCost && <span> (~${data.flights.outbound.estimatedCost})</span>}
            </div>
          )}
          {data.flights.return && (
            <div><strong>Return:</strong> {data.flights.return.from} → {data.flights.return.to}</div>
          )}
        </div>
      )}
      {data.accommodation && (
        <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
          <h4>🏨 Recommended Accommodation</h4>
          <p><strong>{data.accommodation.name}</strong> ({data.accommodation.type})</p>
          {data.accommodation.pricePerNight && <p>~${data.accommodation.pricePerNight}/night</p>}
        </div>
      )}
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
                        {activity.cost > 0 && <span className="ai-activity-cost">${activity.cost}</span>}
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
                      <span>{typeof details === 'string' ? details : (details.name || details.suggestion)}</span>
                    </div>
                  ))}
                </div>
              )}
              {day.estimatedCost && (
                <div className="ai-day-cost">Day Cost: <strong>${day.estimatedCost}</strong></div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.tips && Array.isArray(data.tips) && data.tips.length > 0 && (
        <div className="ai-tips-section">
          <h4>💡 Tips</h4>
          <ul>{data.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
        </div>
      )}
    </div>
  );
};

const renderPackingList = (data) => {
  const categories = data.categories || {};
  const categoryIcons = {
    clothing: '👕', footwear: '👟', toiletries: '🧴', electronics: '📱',
    health: '💊', accessories: '🎒', documents: '📄', miscellaneous: '📦'
  };
  return (
    <div className="ai-result-formatted">
      <div className="ai-result-header">
        <h3>🧳 Smart Packing List</h3>
        <div className="ai-result-meta">
          {data.destination && <span>📍 {data.destination}</span>}
          {data.duration && <span>📅 {data.duration}</span>}
          {data.season && <span>🌤️ {data.season}</span>}
        </div>
      </div>
      {data.weatherForecast && (
        <div className="ai-weather-card"><h4>🌡️ Weather Forecast</h4><p>{data.weatherForecast}</p></div>
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
          <ul>{data.tips.map((tip, idx) => <li key={idx}>{tip}</li>)}</ul>
        </div>
      )}
    </div>
  );
};

const renderSuggestions = (data) => {
  const items = data.suggestions || data.activities || data.restaurants || data.accommodations || [];
  const title = data.restaurants ? 'Restaurants' : data.accommodations ? 'Accommodations' : data.activities ? 'Activities' : 'Suggestions';
  const icons = { activities: '🎯', restaurants: '🍽️', accommodations: '🏨', suggestions: '💡' };
  return (
    <div className="ai-result-formatted">
      <div className="ai-result-header">
        <h3>{icons[title.toLowerCase()] || '💡'} {title}{data.destination ? ` for ${data.destination}` : ''}</h3>
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
                {item.highlights.map((h, i) => <span key={i} className="ai-highlight-tag">{h}</span>)}
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
    </div>
  );
};

const renderDestinationInfo = (data) => (
  <div className="ai-result-formatted">
    <div className="ai-result-header">
      <h3>📍 {data.name || data.destination}</h3>
      {data.country && <span className="ai-country">{data.country}</span>}
    </div>
    <div className="ai-destination-grid">
      {data.description && <div className="ai-info-card full-width"><p>{data.description}</p></div>}
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
        <div className="ai-info-card"><h4>📅 Best Time to Visit</h4><p>{data.bestTimeToVisit}</p></div>
      )}
      {data.weather && (
        <div className="ai-info-card"><h4>🌤️ Weather</h4><p>{typeof data.weather === 'string' ? data.weather : JSON.stringify(data.weather)}</p></div>
      )}
      {data.attractions && (
        <div className="ai-info-card">
          <h4>🏛️ Top Attractions</h4>
          <ul>{(Array.isArray(data.attractions) ? data.attractions : []).map((a, i) => <li key={i}>{typeof a === 'string' ? a : a.name}</li>)}</ul>
        </div>
      )}
      {data.tips && (
        <div className="ai-info-card full-width">
          <h4>💡 Travel Tips</h4>
          <ul>{(Array.isArray(data.tips) ? data.tips : [data.tips]).map((tip, i) => <li key={i}>{tip}</li>)}</ul>
        </div>
      )}
    </div>
  </div>
);

const renderBudgetOptimization = (data) => {
  const getAmount = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) return value.allocated || value.amount || value.cost || 0;
    return 0;
  };
  const totalBudget = data.budget || data.totalBudget || 1000;
  return (
    <div className="ai-result-formatted">
      <div className="ai-result-header">
        <h3>💰 Budget Optimization</h3>
        <div className="ai-result-meta">
          {data.destination && <span>📍 {data.destination}</span>}
          <span>📅 {data.days || data.duration} days</span>
          <span>💵 Budget: ${totalBudget}</span>
        </div>
      </div>
      {data.summary && <div className="ai-overview-card"><p>{data.summary}</p></div>}
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
                  {isObject && value.recommended && <p className="ai-budget-recommendation">💡 {value.recommended}</p>}
                  {isObject && value.tip && <p className="ai-budget-tip">✨ {value.tip}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(data.savingTips || data.tips) && (
        <div className="ai-tips-section">
          <h4>💡 Money-Saving Tips</h4>
          <ul>
            {(Array.isArray(data.savingTips || data.tips) ? (data.savingTips || data.tips) : []).map((tip, i) => (
              <li key={i}>{typeof tip === 'string' ? tip : (tip.tip || tip.description || JSON.stringify(tip))}</li>
            ))}
          </ul>
        </div>
      )}
      {data.recommendations && (
        <div>
          <h4 style={{ margin: '1rem 0 0.5rem' }}>✨ Recommendations</h4>
          {Object.entries(data.recommendations).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '0.5rem' }}>
              <h5 style={{ textTransform: 'capitalize', color: '#667eea' }}>{category}</h5>
              <ul>{(Array.isArray(items) ? items : [items]).map((item, i) => (
                <li key={i}>{typeof item === 'string' ? item : (item.name || item.description || JSON.stringify(item))}</li>
              ))}</ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const renderTranslation = (data) => (
  <div className="ai-result-formatted">
    <div className="ai-result-header"><h3>🌐 Translation</h3></div>
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
        <div className="ai-pronunciation"><label>🔊 Pronunciation</label><p>{data.pronunciation}</p></div>
      )}
      {data.notes && (
        <div className="ai-translation-notes"><label>💡 Notes</label><p>{data.notes}</p></div>
      )}
    </div>
  </div>
);

const renderAnalysis = (data) => (
  <div className="ai-result-formatted">
    <div className="ai-result-header">
      <h3>🔍 Itinerary Analysis</h3>
      <div className="ai-result-meta">
        {data.destination && <span>📍 {data.destination}</span>}
        {data.dailyBudget && <span>💰 ~${data.dailyBudget}/day</span>}
        {data.overallScore && <span>⭐ Score: {data.overallScore}/100</span>}
      </div>
    </div>
    {data.hasConflicts !== undefined && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem',
        borderRadius: '12px', marginBottom: '1rem', fontWeight: '500',
        background: data.hasConflicts ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        color: data.hasConflicts ? '#92400e' : '#166534',
        border: data.hasConflicts ? '1px solid #fcd34d' : '1px solid #86efac'
      }}>
        <span style={{ fontSize: '1.5rem' }}>{data.hasConflicts ? '⚠️' : '✅'}</span>
        <span>{data.hasConflicts ? 'Some Issues Found' : 'Great Itinerary - No Major Issues!'}</span>
      </div>
    )}
    {data.feedback && <div className="ai-overview-card"><p>{data.feedback}</p></div>}
    {data.generatedItinerary && Array.isArray(data.generatedItinerary) && (
      <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
        <h4>📅 Generated Activities</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.generatedItinerary.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ background: '#667eea', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>Day {item.day}</span>
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
    {data.topAttractions && Array.isArray(data.topAttractions) && (
      <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
        <h4>🏛️ Must-See Attractions</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {data.topAttractions.map((a, idx) => (
            <span key={idx} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.9rem' }}>{a}</span>
          ))}
        </div>
      </div>
    )}
    {data.conflicts && Array.isArray(data.conflicts) && data.conflicts.length > 0 && (
      <div className="ai-info-card" style={{ marginBottom: '1rem', borderLeft: '4px solid #f59e0b' }}>
        <h4>⚠️ Issues</h4>
        {data.conflicts.map((c, idx) => (
          <div key={idx} style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: '600', color: '#92400e' }}>{c.activity1} ↔ {c.activity2}</div>
            <p style={{ color: '#78350f', fontSize: '0.9rem', margin: '0.25rem 0' }}>{c.description}</p>
            {c.suggestion && <p style={{ color: '#166534', fontSize: '0.85rem', margin: 0 }}>💡 {c.suggestion}</p>}
          </div>
        ))}
      </div>
    )}
    {data.topSuggestions && Array.isArray(data.topSuggestions) && (
      <div className="ai-tips-section">
        <h4>💡 Top Recommendations</h4>
        <ul>{data.topSuggestions.map((tip, idx) => <li key={idx}>{tip}</li>)}</ul>
      </div>
    )}
  </div>
);

const renderFlightResults = (data) => (
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
    {data.totalEstimate && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Budget</div>
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
    {data.bestValue && (
      <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #f59e0b', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⭐</span>
          <div>
            <div style={{ fontWeight: '700', color: '#92400e' }}>Best Value: {data.bestValue.airline}</div>
            <div style={{ color: '#78350f', fontSize: '0.9rem' }}>${data.bestValue.price} - {data.bestValue.why}</div>
          </div>
        </div>
      </div>
    )}
    {data.recommendations && Array.isArray(data.recommendations) && (
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#334155' }}>🛫 Available Flights</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.recommendations.map((flight, idx) => (
            <div key={idx} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
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
                  fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '10px', display: 'inline-block',
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
                <div style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.85rem', color: '#0369a1' }}>💡 {flight.bookingTip}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
    {data.bookingTips && Array.isArray(data.bookingTips) && (
      <div className="ai-tips-section">
        <h4>💡 Booking Tips</h4>
        <ul>{data.bookingTips.map((tip, idx) => <li key={idx}>{tip}</li>)}</ul>
      </div>
    )}
    {data.bestTimeToBook && (
      <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.9rem' }}>
        📅 <strong>Best Time to Book:</strong> {data.bestTimeToBook}
      </div>
    )}
  </div>
);

const renderWeatherResults = (data) => (
  <div className="ai-result-formatted">
    <div className="ai-result-header">
      <h3>🌤️ Weather Forecast & Advice</h3>
      <div className="ai-result-meta">
        {data.destination && <span>📍 {data.destination}</span>}
        {data.travelPeriod && <span>📅 {data.travelPeriod}</span>}
      </div>
    </div>
    {data.weatherOverview && (
      <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', color: 'white', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{data.weatherOverview.temperature?.average || data.weatherOverview.temperature?.high}</div>
            <div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Average Temp</div>
          </div>
          {data.weatherOverview.temperature?.high && <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem' }}>☀️ {data.weatherOverview.temperature.high}</div><div style={{ opacity: 0.9, fontSize: '0.85rem' }}>High</div></div>}
          {data.weatherOverview.temperature?.low && <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem' }}>🌙 {data.weatherOverview.temperature.low}</div><div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Low</div></div>}
          {data.weatherOverview.humidity && <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem' }}>💧 {data.weatherOverview.humidity}</div><div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Humidity</div></div>}
          {data.weatherOverview.precipitation && <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem' }}>🌧️ {data.weatherOverview.precipitation}</div><div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Rain Chance</div></div>}
        </div>
        {data.weatherOverview.conditions && <div style={{ marginTop: '1rem', textAlign: 'center', opacity: 0.95 }}>{data.weatherOverview.conditions}</div>}
      </div>
    )}
    {data.seasonInfo && (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.75rem 0', color: '#334155' }}>🗓️ Season Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {data.seasonInfo.currentSeason && <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Current Season</div><div style={{ fontWeight: '600' }}>{data.seasonInfo.currentSeason}</div></div>}
          {data.seasonInfo.isTouristSeason !== undefined && <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Tourist Season</div><div style={{ fontWeight: '600' }}>{data.seasonInfo.isTouristSeason ? '✅ Yes' : '❌ No'}</div></div>}
          {data.seasonInfo.crowdLevel && <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Crowd Level</div><div style={{ fontWeight: '600' }}>{data.seasonInfo.crowdLevel}</div></div>}
        </div>
        {data.seasonInfo.description && <p style={{ marginTop: '0.75rem', color: '#475569', fontSize: '0.9rem' }}>{data.seasonInfo.description}</p>}
      </div>
    )}
    {data.dailyForecast && Array.isArray(data.dailyForecast) && data.dailyForecast.length > 0 && (
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#334155' }}>📅 Daily Forecast</h4>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '0.75rem', paddingBottom: '0.5rem' }}>
          {data.dailyForecast.map((day, idx) => (
            <div key={idx} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', minWidth: '140px', textAlign: 'center' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{day.day}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>{day.date}</div>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}><span style={{ color: '#ef4444' }}>{day.high}</span> / <span style={{ color: '#3b82f6' }}>{day.low}</span></div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>{day.conditions}</div>
              {day.rainChance && <div style={{ fontSize: '0.8rem', color: '#0ea5e9', marginTop: '0.25rem' }}>🌧️ {day.rainChance}</div>}
            </div>
          ))}
        </div>
      </div>
    )}
    {data.activityRecommendations && Array.isArray(data.activityRecommendations) && (
      <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
        <h4>🎯 Activity Recommendations</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.activityRecommendations.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <strong>{item.activity}</strong>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Best: {item.bestTime}</div>
              </div>
              <span style={{
                padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '500',
                background: item.weatherSuitability === 'ideal' ? '#dcfce7' : item.weatherSuitability === 'good' ? '#dbeafe' : '#fef3c7',
                color: item.weatherSuitability === 'ideal' ? '#166534' : item.weatherSuitability === 'good' ? '#1d4ed8' : '#92400e'
              }}>{item.weatherSuitability}</span>
            </div>
          ))}
        </div>
      </div>
    )}
    {data.packingRecommendations && (
      <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
        <h4>🧳 Packing for the Weather</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {Object.entries(data.packingRecommendations).map(([category, items]) => (
            <div key={category}>
              <h5 style={{ textTransform: 'capitalize', color: '#667eea', marginBottom: '0.5rem' }}>{category}</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {Array.isArray(items) && items.map((item, idx) => (
                  <span key={idx} style={{ background: '#f1f5f9', padding: '0.25rem 0.6rem', borderRadius: '15px', fontSize: '0.8rem' }}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    {data.warnings && Array.isArray(data.warnings) && data.warnings.length > 0 && (
      <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>⚠️ Weather Warnings</h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#78350f' }}>
          {data.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
        </ul>
      </div>
    )}
    {data.localTips && Array.isArray(data.localTips) && (
      <div className="ai-tips-section"><h4>💡 Local Weather Tips</h4><ul>{data.localTips.map((tip, idx) => <li key={idx}>{tip}</li>)}</ul></div>
    )}
    {data.bestTimesToVisit && (
      <div className="ai-info-card" style={{ marginBottom: '1rem' }}>
        <h4>📆 Best Times to Visit</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {data.bestTimesToVisit.overall && <div style={{ padding: '0.75rem', background: '#dcfce7', borderRadius: '8px' }}><div style={{ color: '#166534', fontWeight: '600' }}>Best Overall</div><div style={{ color: '#15803d' }}>{data.bestTimesToVisit.overall}</div></div>}
          {data.bestTimesToVisit.forWeather && <div style={{ padding: '0.75rem', background: '#dbeafe', borderRadius: '8px' }}><div style={{ color: '#1d4ed8', fontWeight: '600' }}>Best Weather</div><div style={{ color: '#2563eb' }}>{data.bestTimesToVisit.forWeather}</div></div>}
          {data.bestTimesToVisit.forPrices && <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '8px' }}><div style={{ color: '#92400e', fontWeight: '600' }}>Best Prices</div><div style={{ color: '#a16207' }}>{data.bestTimesToVisit.forPrices}</div></div>}
        </div>
      </div>
    )}
    {data.sunriseSunset && (
      <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f0f9ff', borderRadius: '8px' }}>
        🌅 <strong>Sunrise:</strong> {data.sunriseSunset.sunrise} | 🌇 <strong>Sunset:</strong> {data.sunriseSunset.sunset}
        {data.sunriseSunset.goldenHour && <span> | 📸 <strong>Golden Hour:</strong> {data.sunriseSunset.goldenHour}</span>}
      </div>
    )}
  </div>
);

const renderHotelMatchResults = (data) => (
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
    {data.perfectMatches && Array.isArray(data.perfectMatches) && (
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#334155' }}>⭐ Perfect Matches</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.perfectMatches.map((hotel, idx) => (
            <div key={idx} style={{ background: 'white', border: idx === 0 ? '2px solid #667eea' : '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', position: 'relative' }}>
              {idx === 0 && <span style={{ position: 'absolute', top: '-10px', left: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>🏆 Top Pick</span>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>{hotel.name}</h4>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{hotel.type} {hotel.neighborhood && `• ${hotel.neighborhood}`}</div>
                  {hotel.distanceToCenter && <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>📍 {hotel.distanceToCenter} from center</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>${hotel.pricePerNight}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>per night</div>
                  {hotel.matchScore && <div style={{ marginTop: '0.25rem', padding: '0.2rem 0.5rem', background: '#dcfce7', color: '#166534', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>{hotel.matchScore}% Match</div>}
                </div>
              </div>
              {hotel.highlights && Array.isArray(hotel.highlights) && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {hotel.highlights.map((h, i) => <span key={i} style={{ background: '#f1f5f9', padding: '0.25rem 0.6rem', borderRadius: '15px', fontSize: '0.8rem' }}>✓ {h}</span>)}
                </div>
              )}
              {hotel.amenities && Array.isArray(hotel.amenities) && <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>Amenities: {hotel.amenities.join(' • ')}</div>}
              {hotel.bestFor && <div style={{ marginTop: '0.5rem', color: '#667eea', fontSize: '0.85rem' }}>👥 Best for: {hotel.bestFor}</div>}
              {hotel.bookingTip && <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.85rem', color: '#0369a1' }}>💡 {hotel.bookingTip}</div>}
            </div>
          ))}
        </div>
      </div>
    )}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {data.budgetOptions && Array.isArray(data.budgetOptions) && data.budgetOptions.length > 0 && (
        <div style={{ background: '#dcfce7', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#166534' }}>💚 Budget-Friendly</h4>
          {data.budgetOptions.map((opt, idx) => (
            <div key={idx} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: '600', color: '#15803d' }}>{opt.name} - ${opt.pricePerNight}/night</div>
              <div style={{ color: '#166534', fontSize: '0.85rem' }}>{opt.tradeoffs}</div>
            </div>
          ))}
        </div>
      )}
      {data.splurgeOptions && Array.isArray(data.splurgeOptions) && data.splurgeOptions.length > 0 && (
        <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#92400e' }}>💎 Worth the Splurge</h4>
          {data.splurgeOptions.map((opt, idx) => (
            <div key={idx} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: '600', color: '#a16207' }}>{opt.name} - ${opt.pricePerNight}/night</div>
              <div style={{ color: '#78350f', fontSize: '0.85rem' }}>{opt.worthIt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
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
              </div>
              {hood.bestFor && <div style={{ color: '#667eea', fontSize: '0.8rem', marginTop: '0.25rem' }}>Best for: {hood.bestFor}</div>}
            </div>
          ))}
        </div>
      </div>
    )}
    {data.bookingTips && Array.isArray(data.bookingTips) && (
      <div className="ai-tips-section"><h4>💡 Booking Tips</h4><ul>{data.bookingTips.map((tip, idx) => <li key={idx}>{tip}</li>)}</ul></div>
    )}
  </div>
);

// Smart generic renderer for chat, review summary, trip report, and unknown types
const renderGenericResult = (data) => {
  if (typeof data === 'string') {
    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header"><h3>🤖 AI Response</h3></div>
        <div className="ai-generic-text">{data.split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>
      </div>
    );
  }
  if (data.text || data.message || data.content || data.response) {
    const textContent = data.text || data.message || data.content || data.response;
    return (
      <div className="ai-result-formatted">
        <div className="ai-result-header"><h3>🤖 AI Response</h3></div>
        <div className="ai-generic-text">
          {typeof textContent === 'string'
            ? textContent.split('\n').map((line, i) => <p key={i}>{line}</p>)
            : <p>{JSON.stringify(textContent)}</p>
          }
        </div>
      </div>
    );
  }

  const getIcon = (key) => {
    const k = key.toLowerCase();
    const icons = {
      destination: '📍', location: '📍', duration: '📅', days: '📅',
      budget: '💰', cost: '💵', tips: '💡', suggestions: '💡',
      activities: '🎯', restaurants: '🍽️', hotels: '🏨', accommodation: '🏨',
      transport: '🚗', flights: '✈️', summary: '📋', overview: '📋',
      rating: '⭐', reviews: '⭐', language: '🗣️', translation: '🌐',
      recommendations: '✨', analysis: '📊', breakdown: '📊',
      overallsentiment: '😊', commonpros: '👍', commoncons: '👎',
      highlights: '✨', bestmoments: '🌟', lessonslearned: '📚',
      weather: '🌤️', warnings: '⚠️', conflicts: '⚠️',
    };
    return icons[k] || '•';
  };

  const renderSmartValue = (value, key = '', depth = 0) => {
    if (value === null || value === undefined) return <span style={{ color: '#94a3b8' }}>-</span>;
    if (typeof value === 'boolean') return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500', background: value ? '#dcfce7' : '#fee2e2', color: value ? '#166534' : '#991b1b' }}>{value ? '✓ Yes' : '✗ No'}</span>;
    if (typeof value === 'number') {
      const kl = key.toLowerCase();
      const isPrice = kl.includes('cost') || kl.includes('price') || kl.includes('budget') || kl.includes('amount');
      return <span style={{ fontWeight: '600', color: isPrice ? '#16a34a' : '#667eea' }}>{isPrice ? `$${value.toLocaleString()}` : value.toLocaleString()}</span>;
    }
    if (typeof value === 'string') return <span>{value}</span>;
    if (Array.isArray(value)) {
      if (value.length === 0) return <span style={{ color: '#94a3b8' }}>None</span>;
      if (typeof value[0] === 'string') {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {value.map((item, idx) => <span key={idx} style={{ background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', color: '#475569' }}>{item}</span>)}
          </div>
        );
      }
      if (typeof value[0] === 'object' && depth < 2) {
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {value.map((item, idx) => (
              <div key={idx} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                {Object.entries(item).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</span>
                    <span style={{ color: '#1e293b', fontWeight: '500', fontSize: '0.85rem', textAlign: 'right', maxWidth: '60%' }}>
                      {typeof v === 'boolean' ? (v ? '✓' : '✗') : typeof v === 'number' ? (k.toLowerCase().includes('cost') || k.toLowerCase().includes('price') ? `$${v}` : v) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
    }
    if (typeof value === 'object' && depth < 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {Object.entries(value).map(([k, v]) => (
            <div key={k} style={{ paddingLeft: '0.5rem', borderLeft: '2px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'capitalize', fontWeight: '500' }}>{getIcon(k)} {k.replace(/_/g, ' ')}:</span>{' '}
              {renderSmartValue(v, k, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    return <span>{JSON.stringify(value)}</span>;
  };

  const skipKeys = ['destination', 'duration', 'tripType', 'season', 'summary', 'overview',
    'description', 'weatherForecast', 'hasConflicts', 'rawText', 'isRawText',
    'message', 'overallScore', 'feedback', 'totalReviews'];

  return (
    <div className="ai-result-formatted">
      <div className="ai-result-header">
        <h3>🤖 AI Results</h3>
        {(data.destination || data.duration || data.totalReviews) && (
          <div className="ai-result-meta">
            {data.destination && <span>📍 {data.destination}</span>}
            {data.duration && <span>📅 {data.duration}</span>}
            {data.totalReviews && <span>📝 {data.totalReviews} reviews</span>}
          </div>
        )}
      </div>
      {data.overallScore !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <span style={{ fontSize: '2rem' }}>⭐</span>
          <div><div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data.overallScore}/100</div><div style={{ fontSize: '0.85rem', opacity: '0.9' }}>Score</div></div>
        </div>
      )}
      {(data.summary || data.overview || data.feedback) && (
        <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', borderLeft: '4px solid #667eea', marginBottom: '1rem' }}>
          <p style={{ color: '#475569', lineHeight: '1.6', margin: 0 }}>{data.summary || data.overview || data.feedback}</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.entries(data)
          .filter(([key]) => !skipKeys.includes(key))
          .filter(([, value]) => value !== null && value !== undefined)
          .map(([key, value]) => {
            const icon = getIcon(key);
            const title = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
            return (
              <div key={key} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <h4 style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '0.75rem 1rem', margin: 0, fontSize: '1rem', color: '#334155', borderBottom: '1px solid #e2e8f0', textTransform: 'capitalize' }}>
                  {icon} {title}
                </h4>
                <div style={{ padding: '1rem' }}>{renderSmartValue(value, key, 0)}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

// ─── Smart Detection (matches FeaturePage logic) ───────────────────

const detectAndRender = (data, featureType) => {
  if (!data) return <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No response data</p>;

  // Use feature_type hint for known types
  if (featureType === 'translate' && (data.translation || data.translated || data.original)) return renderTranslation(data);
  if (featureType === 'flights' && (data.recommendations || data.totalEstimate)) return renderFlightResults(data);
  if (featureType === 'weather' && (data.weatherOverview || data.dailyForecast || data.seasonInfo)) return renderWeatherResults(data);
  if (featureType === 'matchHotels' && (data.perfectMatches || data.neighborhoodGuide)) return renderHotelMatchResults(data);

  // Auto-detect by data shape (same logic as FeaturePage)
  if (data.categories && typeof data.categories === 'object') return renderPackingList(data);
  if (data.hasConflicts !== undefined || data.generatedItinerary || data.optimizedOrder || (data.conflicts && Array.isArray(data.conflicts))) return renderAnalysis(data);
  if (data.days || data.itinerary || (data.fromLocation && data.totalDays)) return renderItinerary(data);
  if (data.suggestions || (Array.isArray(data.activities) && data.activities.length > 0 && data.activities[0]?.name) ||
      (Array.isArray(data.restaurants) && data.restaurants.length > 0) ||
      (Array.isArray(data.accommodations) && data.accommodations.length > 0)) return renderSuggestions(data);
  if (data.breakdown || data.savingTips || data.moneySavingTips || data.analysis || (data.budget && data.recommendations)) return renderBudgetOptimization(data);
  if (data.translation || data.translated || (data.original && data.pronunciation)) return renderTranslation(data);
  if ((data.language || data.currency || data.attractions || data.bestTimeToVisit) && !data.days && !data.itinerary) return renderDestinationInfo(data);
  if (data.recommendations && data.totalEstimate && (data.searchCriteria?.origin || data.cheapestOption)) return renderFlightResults(data);
  if (data.weatherOverview || data.dailyForecast || data.seasonInfo || data.packingRecommendations) return renderWeatherResults(data);
  if (data.perfectMatches || data.neighborhoodGuide || (data.budgetOptions && data.splurgeOptions)) return renderHotelMatchResults(data);

  return renderGenericResult(data);
};

// ─── Main Component ────────────────────────────────────────────────

const AIHistory = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await aiHistory.getAll();
      setEntries(res.data);
    } catch (err) {
      console.error('Failed to load AI history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleViewDetail = async (id) => {
    try {
      setDetailLoading(true);
      const res = await aiHistory.getById(id);
      setSelectedEntry(res.data);
    } catch (err) {
      console.error('Failed to load detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this history entry?')) return;
    try {
      await aiHistory.delete(id);
      setEntries(entries.filter(e => e.id !== id));
      if (selectedEntry?.id === id) setSelectedEntry(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all AI history? This cannot be undone.')) return;
    try {
      await aiHistory.clearAll();
      setEntries([]);
      setSelectedEntry(null);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const uniqueTypes = [...new Set(entries.map(e => e.feature_type))];
  const filtered = filterType === 'all' ? entries : entries.filter(e => e.feature_type === filterType);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getFeatureInfo = (type) => featureLabels[type] || { label: type, icon: '🤖' };

  const renderPromptChips = (promptData) => {
    if (!promptData || typeof promptData !== 'object') return null;
    const chips = Object.entries(promptData)
      .filter(([, v]) => v != null && v !== '' && !Array.isArray(v))
      .slice(0, 5);
    if (chips.length === 0) return null;
    return (
      <div className="ai-history-chips">
        {chips.map(([key, val]) => (
          <span key={key} className="ai-history-chip">
            {key}: {String(val).substring(0, 30)}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ai-history-page">
        <div className="ai-history-header"><h1>AI History</h1></div>
        <div className="ai-history-loading"><div className="spinner"></div><p>Loading history...</p></div>
      </div>
    );
  }

  return (
    <div className="ai-history-page">
      <div className="ai-history-header">
        <div>
          <h1>AI History</h1>
          <p className="ai-history-subtitle">{entries.length} saved result{entries.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="ai-history-actions">
          <select className="ai-history-filter" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{getFeatureInfo(t).label}</option>)}
          </select>
          {entries.length > 0 && (
            <button className="ai-history-clear-btn" onClick={handleClearAll}>Clear All</button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ai-history-empty">
          <span className="ai-history-empty-icon">📜</span>
          <h3>No AI History Yet</h3>
          <p>Your AI-generated results will appear here automatically.</p>
        </div>
      ) : (
        <div className="ai-history-grid">
          {filtered.map((entry) => {
            const info = getFeatureInfo(entry.feature_type);
            return (
              <div key={entry.id} className="ai-history-card" onClick={() => handleViewDetail(entry.id)}>
                <div className="ai-history-card-header">
                  <span className="ai-history-card-icon">{info.icon}</span>
                  <span className="ai-history-card-badge">{info.label}</span>
                  <button className="ai-history-card-delete" onClick={(e) => handleDelete(entry.id, e)} title="Delete">&times;</button>
                </div>
                <h3 className="ai-history-card-title">{entry.title}</h3>
                {renderPromptChips(entry.prompt_data)}
                <p className="ai-history-card-date">{formatDate(entry.created_at)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {(selectedEntry || detailLoading) && (
        <div className="ai-history-modal-overlay" onClick={() => !detailLoading && setSelectedEntry(null)}>
          <div className="ai-history-modal" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="ai-history-loading"><div className="spinner"></div><p>Loading details...</p></div>
            ) : selectedEntry && (
              <>
                <div className="ai-history-modal-header">
                  <div>
                    <span className="ai-history-card-icon">{getFeatureInfo(selectedEntry.feature_type).icon}</span>
                    <span className="ai-history-card-badge">{getFeatureInfo(selectedEntry.feature_type).label}</span>
                  </div>
                  <button className="ai-history-modal-close" onClick={() => setSelectedEntry(null)}>&times;</button>
                </div>
                <h2 className="ai-history-modal-title">{selectedEntry.title}</h2>
                <p className="ai-history-card-date">{formatDate(selectedEntry.created_at)}</p>

                {selectedEntry.prompt_data && Object.keys(selectedEntry.prompt_data).length > 0 && (
                  <div className="ai-history-section">
                    <h4>Input Parameters</h4>
                    <div className="ai-history-chips">
                      {Object.entries(selectedEntry.prompt_data)
                        .filter(([, v]) => v != null && v !== '')
                        .map(([key, val]) => (
                          <span key={key} className="ai-history-chip">
                            {key}: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="ai-history-section">
                  {detectAndRender(selectedEntry.response_data, selectedEntry.feature_type)}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIHistory;
