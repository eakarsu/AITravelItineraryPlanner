import FormattedAIReport from '../components/FormattedAIReport';
import TravelPresets from '../components/TravelPresets';
import React, { useState } from 'react';
import { ai } from '../services/api';

const vibeOptions = [
  { value: 'beach', label: 'Beach & Relaxation', icon: '🏖️' },
  { value: 'adventure', label: 'Adventure & Outdoors', icon: '🏔️' },
  { value: 'city', label: 'City & Urban', icon: '🏙️' },
  { value: 'culture', label: 'Culture & History', icon: '🏛️' },
  { value: 'food', label: 'Food & Culinary', icon: '🍜' },
  { value: 'wellness', label: 'Wellness & Spa', icon: '🧘' },
];

const TripInspiration = () => {
  const [form, setForm] = useState({ budget: 2000, duration: 7, vibe: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [disclaimer, setDisclaimer] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vibe) {
      setError('Please select a travel vibe');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setDisclaimer('');

    try {
      const res = await ai.tripInspiration(form);
      setResult(res.data);
      if (res.data._disclaimer) setDisclaimer(res.data._disclaimer);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get inspiration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
          Trip Inspiration
        </h1>
        <p style={{ color: '#64748b' }}>
          Tell us your vibe and budget. AI finds destinations personalized to your travel history.
        </p>
      </div>

      <TravelPresets presets={[{ label: 'Kyoto culture week', values: { vibe: 'culture', budget: 2600, duration: 7 } }, { label: 'Costa Rica adventure', values: { vibe: 'adventure', budget: 3200, duration: 10 } }, { label: 'Lisbon food break', values: { vibe: 'food', budget: 1400, duration: 5 } }]} disabled={loading} onChoose={(values) => setForm((current) => ({ ...current, ...values }))} />
      <form onSubmit={handleSubmit} style={{
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem'
      }}>
        {/* Vibe Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
            What's your travel vibe?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {vibeOptions.map(v => (
              <button
                key={v.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, vibe: v.value }))}
                style={{
                  padding: '0.875rem 1rem', borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${form.vibe === v.value ? '#3b82f6' : '#e5e7eb'}`,
                  background: form.vibe === v.value ? '#eff6ff' : '#fff',
                  color: form.vibe === v.value ? '#1d4ed8' : '#374151',
                  fontWeight: form.vibe === v.value ? 700 : 400,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{v.icon}</span>
                <span style={{ fontSize: '0.85rem' }}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#374151' }}>
              Budget (USD)
            </label>
            <input
              type="number"
              value={form.budget}
              onChange={e => setForm(f => ({ ...f, budget: parseInt(e.target.value) || 0 }))}
              min="200" max="50000" step="100"
              style={{
                width: '100%', padding: '0.6rem 1rem', border: '1px solid #d1d5db',
                borderRadius: '8px', fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#374151' }}>
              Duration (days)
            </label>
            <input
              type="number"
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 1 }))}
              min="1" max="30"
              style={{
                width: '100%', padding: '0.6rem 1rem', border: '1px solid #d1d5db',
                borderRadius: '8px', fontSize: '1rem'
              }}
            />
          </div>
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
            color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '1rem'
          }}
        >
          {loading ? 'Finding destinations...' : 'Get Inspiration'}
        </button>
      </form>

      {disclaimer && (
        <div style={{
          padding: '0.6rem 1rem', background: '#fefce8', border: '1px solid #fef08a',
          borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem', color: '#713f12'
        }}>
          Note: {disclaimer}
        </div>
      )}

      {result && <FormattedAIReport response={result} title='Travel plan' />}
    </div>
  );
};

export default TripInspiration;
