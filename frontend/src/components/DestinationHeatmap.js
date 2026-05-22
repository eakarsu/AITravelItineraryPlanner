import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const heatColor = (intensity) => {
  // Map intensity 0-1 to red-orange-yellow gradient
  const r = 255;
  const g = Math.round(255 * (1 - intensity * 0.85));
  const b = Math.round(80 * (1 - intensity));
  return `rgb(${r}, ${g}, ${b})`;
};

const DestinationHeatmap = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/custom-views/destination-heatmap`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!data) return <div>Loading heatmap...</div>;

  return (
    <div data-testid="destination-heatmap" style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' }}>
      <h3 style={{ marginTop: 0 }}>{data.title}</h3>
      <p style={{ color: '#64748b', margin: '4px 0 12px' }}>Max visits: {data.max}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {data.cells.map((c) => (
          <div
            key={c.destination}
            style={{
              background: heatColor(c.intensity),
              color: '#1e293b',
              padding: 14,
              borderRadius: 8,
              textAlign: 'center',
              minHeight: 76,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>{c.destination}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{c.visits} visits</div>
            <div style={{ fontSize: 11 }}>{c.avgRating}★</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DestinationHeatmap;
