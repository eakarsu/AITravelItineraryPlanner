import React, { useState, useEffect } from 'react';
import { ai, trips } from '../services/api';

const DayOfMode = () => {
  const [tripList, setTripList] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [delays, setDelays] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    trips.getAll().then(res => {
      setTripList(Array.isArray(res.data) ? res.data : res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentLocation.trim()) {
      setError('Current location is required');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await ai.dayOfPlan({
        tripId: selectedTrip || undefined,
        currentLocation,
        currentTime,
        delays: delays || undefined
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate day plan');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    const map = {
      'on-time': '#16a34a',
      'adjusted': '#d97706',
      'skipped': '#ef4444'
    };
    return map[status] || '#6b7280';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
          Day-Of Mode
        </h1>
        <p style={{ color: '#64748b' }}>
          Real-time plan adjustments based on your current location and any delays.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#374151' }}>
              Trip (optional)
            </label>
            <select
              value={selectedTrip}
              onChange={e => setSelectedTrip(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 1rem', border: '1px solid #d1d5db',
                borderRadius: '8px', fontSize: '0.95rem'
              }}
            >
              <option value="">-- No trip selected --</option>
              {tripList.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#374151' }}>
              Current Time
            </label>
            <input
              type="time"
              value={currentTime}
              onChange={e => setCurrentTime(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 1rem', border: '1px solid #d1d5db',
                borderRadius: '8px', fontSize: '0.95rem'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#374151' }}>
            Current Location *
          </label>
          <input
            type="text"
            value={currentLocation}
            onChange={e => setCurrentLocation(e.target.value)}
            placeholder="e.g. Eiffel Tower, Paris / Hotel lobby"
            style={{
              width: '100%', padding: '0.6rem 1rem', border: '1px solid #d1d5db',
              borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#374151' }}>
            Delays or Issues (optional)
          </label>
          <input
            type="text"
            value={delays}
            onChange={e => setDelays(e.target.value)}
            placeholder="e.g. Museum was closed, metro delayed 30 min"
            style={{
              width: '100%', padding: '0.6rem 1rem', border: '1px solid #d1d5db',
              borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box'
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '0.6rem 1rem', background: '#fee2e2', color: '#991b1b',
            borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 2rem', background: loading ? '#93c5fd' : '#3b82f6',
            color: '#fff', border: 'none', borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem'
          }}
        >
          {loading ? 'Adjusting plan...' : 'Adjust My Plan'}
        </button>
      </form>

      {result && (
        <div>
          {/* Adjusted Schedule */}
          {result.adjusted_schedule && result.adjusted_schedule.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>
                Adjusted Schedule
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {result.adjusted_schedule.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#fff', border: '1px solid #e5e7eb',
                      borderRadius: '10px', padding: '1rem',
                      borderLeft: `4px solid ${statusColor(item.status)}`,
                      opacity: item.status === 'skipped' ? 0.65 : 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontWeight: 700, color: '#1e293b',
                        background: '#f1f5f9', padding: '0.2rem 0.6rem',
                        borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.9rem'
                      }}>
                        {item.time}
                      </span>
                      <span style={{ fontWeight: 600, color: '#1e293b', flex: 1 }}>{item.activity}</span>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem',
                        borderRadius: '999px', background: `${statusColor(item.status)}22`,
                        color: statusColor(item.status), textTransform: 'capitalize'
                      }}>
                        {item.status || 'scheduled'}
                      </span>
                    </div>
                    {item.location && (
                      <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        📍 {item.location}
                        {item.duration_minutes && ` · ${item.duration_minutes} min`}
                      </div>
                    )}
                    {item.tips && (
                      <div style={{ color: '#374151', fontSize: '0.875rem', marginTop: '0.4rem' }}>
                        💡 {item.tips}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary stats */}
          {result.time_saved_or_lost && (
            <div style={{
              display: 'inline-block', padding: '0.5rem 1rem',
              background: result.time_saved_or_lost.startsWith('+') ? '#fef3c7' : '#dcfce7',
              borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600,
              color: result.time_saved_or_lost.startsWith('+') ? '#92400e' : '#166534'
            }}>
              Time {result.time_saved_or_lost.startsWith('+') ? 'lost' : 'saved'}: {result.time_saved_or_lost}
            </div>
          )}

          {/* Nearby alternatives */}
          {result.nearby_alternatives && result.nearby_alternatives.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>Nearby Alternatives</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {result.nearby_alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      borderRadius: '8px', padding: '0.875rem'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#15803d', marginBottom: '0.25rem' }}>
                      {alt.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                      {alt.type} · {alt.distance}
                    </div>
                    {alt.why && (
                      <div style={{ fontSize: '0.8rem', color: '#374151', marginTop: '0.25rem' }}>
                        {alt.why}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div style={{
              background: '#f0f9ff', border: '1px solid #bae6fd',
              borderRadius: '10px', padding: '1rem'
            }}>
              <h3 style={{ fontWeight: 700, color: '#0369a1', marginBottom: '0.5rem' }}>
                AI Recommendations
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#0c4a6e', fontSize: '0.9rem' }}>
                {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DayOfMode;
