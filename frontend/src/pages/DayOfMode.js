import FormattedAIReport from '../components/FormattedAIReport';
import TravelPresets from '../components/TravelPresets';
import React, { useState, useEffect } from 'react';
import { ai, trips, recordRows } from '../services/api';

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
      setTripList(recordRows(res.data));
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

      <TravelPresets disabled={loading} note="Samples fill location, time, and delay. An existing trip selection is preserved; select a real trip if one is required."
        presets={[{ label: 'Paris museum closure', values: { location: 'Louvre Museum, Paris', time: '11:00', delay: 'Museum closed unexpectedly; find a nearby indoor alternative.' } }, { label: 'Tokyo transit delay', values: { location: 'Tokyo Station', time: '15:30', delay: 'Train delayed 45 minutes; dinner reservation is at 19:00.' } }, { label: 'Rome heat adjustment', values: { location: 'Colosseum, Rome', time: '13:00', delay: 'Heat advisory; reduce outdoor walking this afternoon.' } }]}
        onChoose={({ location, time, delay }) => { setCurrentLocation(location); setCurrentTime(time); setDelays(delay); }} />
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

      {result && <FormattedAIReport response={result} title='Travel plan' />}
    </div>
  );
};

export default DayOfMode;
