import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const CHANGE_TYPES = [
  { value: 'weather', label: 'Weather change (storm, heatwave, cold front)' },
  { value: 'flight_delay', label: 'Flight delay or cancellation' },
  { value: 'budget_cut', label: 'Reduced budget' },
  { value: 'illness', label: 'Illness / mobility limitation' },
  { value: 'schedule_shift', label: 'Schedule shift (start later / leave earlier)' },
  { value: 'closure', label: 'Venue closure / strike' },
  { value: 'extension', label: 'Trip extended' },
  { value: 'other', label: 'Other' },
];

export default function DynamicAdjuster() {
  const [form, setForm] = useState({
    tripId: '',
    current_itinerary: '',
    change_type: 'weather',
    change_details: '',
    new_constraints: '',
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
      const payload = { change_type: form.change_type };
      if (form.tripId) payload.tripId = Number(form.tripId);
      if (form.current_itinerary) {
        try { payload.current_itinerary = JSON.parse(form.current_itinerary); }
        catch { payload.current_itinerary = { text: form.current_itinerary }; }
      }
      if (form.change_details) {
        try { payload.change_details = JSON.parse(form.change_details); }
        catch { payload.change_details = { description: form.change_details }; }
      }
      if (form.new_constraints) {
        try { payload.new_constraints = JSON.parse(form.new_constraints); }
        catch { payload.new_constraints = { description: form.new_constraints }; }
      }
      const res = await axios.post(`${API_URL}/ai/adjust-itinerary`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        setError('AI not configured: set OPENROUTER_API_KEY on the server.');
      } else {
        setError(err.response?.data?.error || err.message || 'Adjustment failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>🔄 Dynamic Itinerary Adjuster</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
        Re-plan an existing itinerary in response to disruptions (weather, delays, illness, budget changes).
      </p>

      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Trip ID (optional)</label>
            <input type="number" value={form.tripId} onChange={(e) => handleChange('tripId', e.target.value)} placeholder="leave blank if pasting itinerary"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Change Type *</label>
            <select required value={form.change_type} onChange={(e) => handleChange('change_type', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}>
              {CHANGE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Current Itinerary (JSON or text, optional if Trip ID given)</label>
            <textarea rows={4} value={form.current_itinerary} onChange={(e) => handleChange('current_itinerary', e.target.value)}
              placeholder='e.g. {"trip":"Paris 5 days","activities":[...]}'
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontFamily: 'monospace', fontSize: 12 }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Change Details</label>
            <textarea rows={2} value={form.change_details} onChange={(e) => handleChange('change_details', e.target.value)}
              placeholder='e.g. {"days_affected":[2,3],"severity":"high"} or free text'
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontFamily: 'monospace', fontSize: 12 }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>New Constraints (optional)</label>
            <textarea rows={2} value={form.new_constraints} onChange={(e) => handleChange('new_constraints', e.target.value)}
              placeholder='e.g. {"max_walking_min":15,"new_budget_usd":500}'
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontFamily: 'monospace', fontSize: 12 }} />
          </div>
        </div>
        <button type="submit" disabled={loading}
          style={{ marginTop: 16, background: loading ? '#9ca3af' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Re-planning...' : 'Adjust Itinerary'}
        </button>
      </form>

      {error && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {result && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Revised Plan</h2>
          {result.summary && <p style={{ marginBottom: 12 }}>{result.summary}</p>}
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#f9fafb', padding: 14, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
