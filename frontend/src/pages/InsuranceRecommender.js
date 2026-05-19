import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function InsuranceRecommender() {
  const [form, setForm] = useState({
    destination: '',
    duration_days: 14,
    traveler_age: 35,
    activities: '',
    pre_existing_conditions: '',
    trip_cost_usd: 2500,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const activities = form.activities
        ? form.activities.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
      const payload = {
        destination: form.destination,
        duration_days: Number(form.duration_days) || 14,
        traveler_age: Number(form.traveler_age) || 35,
        trip_cost_usd: Number(form.trip_cost_usd) || 0,
        ...(activities ? { activities } : {}),
        ...(form.pre_existing_conditions ? { pre_existing_conditions: form.pre_existing_conditions } : {}),
      };
      const res = await axios.post(`${API_URL}/ai/insurance-recommender`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        setError('AI not configured: set OPENROUTER_API_KEY on the server.');
      } else {
        setError(err.response?.data?.error || err.message || 'Recommendation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>🛡️ Travel Insurance Recommender</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>Get a recommended coverage tier and estimated cost based on your trip profile.</p>

      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Destination *</label>
            <input type="text" required value={form.destination} onChange={(e) => handleChange('destination', e.target.value)} placeholder="e.g. Thailand" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Duration (days)</label>
            <input type="number" min={1} max={365} value={form.duration_days} onChange={(e) => handleChange('duration_days', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Traveler Age</label>
            <input type="number" min={0} max={120} value={form.traveler_age} onChange={(e) => handleChange('traveler_age', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Trip Cost (USD)</label>
            <input type="number" min={0} value={form.trip_cost_usd} onChange={(e) => handleChange('trip_cost_usd', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Planned Activities (comma-separated)</label>
            <input type="text" value={form.activities} onChange={(e) => handleChange('activities', e.target.value)} placeholder="e.g. scuba diving, motorbike rental, hiking" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Pre-existing Conditions</label>
            <input type="text" value={form.pre_existing_conditions} onChange={(e) => handleChange('pre_existing_conditions', e.target.value)} placeholder="optional, e.g. asthma" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
        </div>
        <button type="submit" disabled={loading}
          style={{ marginTop: 16, background: loading ? '#9ca3af' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Generating recommendation...' : 'Recommend Insurance'}
        </button>
      </form>

      {error && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {result && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Recommendation</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#f9fafb', padding: 14, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
