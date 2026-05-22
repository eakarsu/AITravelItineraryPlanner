import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const blank = { name: '', budget: 'medium', pace: 'medium', maxDailyUsd: 150, notes: '' };

const TravelPreferenceRulesEditor = () => {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/custom-views/preference-rules`);
      const data = await res.json();
      setRules(data.rules || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const url = editingId
        ? `${API_URL}/custom-views/preference-rules/${editingId}`
        : `${API_URL}/custom-views/preference-rules`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      setForm(blank);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEdit = (r) => {
    setForm({ name: r.name, budget: r.budget, pace: r.pace, maxDailyUsd: r.maxDailyUsd, notes: r.notes || '' });
    setEditingId(r.id);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/custom-views/preference-rules/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const inputStyle = { width: '100%', padding: 6, border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 };

  return (
    <div data-testid="travel-preference-rules" style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' }}>
      <h3 style={{ marginTop: 0 }}>Travel Preference Rules</h3>
      <p style={{ color: '#64748b', margin: '4px 0 10px' }}>Manage budget and pace preferences (CRUD).</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: 8, alignItems: 'end', marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: '#475569' }}>Name</label>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#475569' }}>Budget</label>
          <select style={inputStyle} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
            <option value="low">low</option><option value="medium">medium</option><option value="high">high</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#475569' }}>Pace</label>
          <select style={inputStyle} value={form.pace} onChange={(e) => setForm({ ...form, pace: e.target.value })}>
            <option value="slow">slow</option><option value="medium">medium</option><option value="fast">fast</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#475569' }}>Max $/day</label>
          <input type="number" style={inputStyle} value={form.maxDailyUsd} onChange={(e) => setForm({ ...form, maxDailyUsd: Number(e.target.value) })} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#475569' }}>Notes</label>
          <input style={inputStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button type="submit" style={{ background: '#16a34a', color: '#fff', padding: '8px 14px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          {editingId ? 'Update' : 'Add'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Budget</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Pace</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Max $/day</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Notes</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: 8 }}>{r.name}</td>
              <td style={{ padding: 8 }}>{r.budget}</td>
              <td style={{ padding: 8 }}>{r.pace}</td>
              <td style={{ padding: 8 }}>${r.maxDailyUsd}</td>
              <td style={{ padding: 8 }}>{r.notes}</td>
              <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                <button onClick={() => handleEdit(r)} style={{ marginRight: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4 }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TravelPreferenceRulesEditor;
