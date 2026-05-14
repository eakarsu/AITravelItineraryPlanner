import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function VisaAdvisor() {
  const [form, setForm] = useState({
    citizenship: '',
    destination: '',
    purpose: 'tourism',
    duration_days: 14,
    transit_countries: '',
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
      const transitCountries = form.transit_countries
        ? form.transit_countries.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
      const payload = {
        citizenship: form.citizenship,
        destination: form.destination,
        purpose: form.purpose,
        duration_days: Number(form.duration_days) || 14,
        ...(transitCountries ? { transit_countries: transitCountries } : {}),
      };
      const res = await axios.post(`${API_URL}/ai/visa-advisor`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        setError('AI not configured: set OPENROUTER_API_KEY on the server.');
      } else {
        setError(err.response?.data?.error || err.message || 'Lookup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>🛂 Visa & Document Advisor</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>Get visa and entry-document requirements based on your citizenship and destination.</p>

      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Citizenship *</label>
            <input type="text" required value={form.citizenship} onChange={(e) => handleChange('citizenship', e.target.value)} placeholder="e.g. United States" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Destination *</label>
            <input type="text" required value={form.destination} onChange={(e) => handleChange('destination', e.target.value)} placeholder="e.g. Japan" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Purpose</label>
            <select value={form.purpose} onChange={(e) => handleChange('purpose', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <option value="tourism">Tourism</option>
              <option value="business">Business</option>
              <option value="study">Study</option>
              <option value="work">Work</option>
              <option value="transit">Transit</option>
              <option value="medical">Medical</option>
              <option value="family">Family Visit</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Duration (days)</label>
            <input type="number" min={1} max={365} value={form.duration_days} onChange={(e) => handleChange('duration_days', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Transit Countries (comma-separated)</label>
            <input type="text" value={form.transit_countries} onChange={(e) => handleChange('transit_countries', e.target.value)} placeholder="e.g. France, Singapore" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
        </div>
        <button type="submit" disabled={loading}
          style={{ marginTop: 16, background: loading ? '#9ca3af' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Checking requirements...' : 'Check Visa Requirements'}
        </button>
      </form>

      {error && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {result && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Requirements</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#f9fafb', padding: 14, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
