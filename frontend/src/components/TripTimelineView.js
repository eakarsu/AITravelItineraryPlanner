import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const slotColor = (slot) => {
  if (slot === 'Morning') return '#fef3c7';
  if (slot === 'Afternoon') return '#bfdbfe';
  return '#e9d5ff';
};

const TripTimelineView = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/custom-views/trip-timeline`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!data) return <div>Loading trip timeline...</div>;

  return (
    <div data-testid="trip-timeline" style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' }}>
      <h3 style={{ marginTop: 0 }}>{data.title}</h3>
      <p style={{ color: '#64748b', margin: '4px 0 12px' }}>Destination: {data.destination}</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, background: '#f1f5f9' }}>Day</th>
              {data.columns.map((c) => (
                <th key={c} style={{ textAlign: 'left', padding: 8, background: '#f1f5f9' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((day) => (
              <tr key={day}>
                <td style={{ padding: 8, fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>{day}</td>
                {data.columns.map((slot) => {
                  const cell = data.items.find((i) => i.day === day && i.slot === slot);
                  return (
                    <td key={slot} style={{ padding: 8, borderBottom: '1px solid #e5e7eb', background: cell ? slotColor(slot) : '#fff' }}>
                      {cell ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{cell.activity}</div>
                          <div style={{ fontSize: 11, color: '#475569' }}>{cell.durationMin} min</div>
                        </div>
                      ) : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TripTimelineView;
