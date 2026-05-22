import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const ItineraryPdfExport = () => {
  const [status, setStatus] = useState('');

  const handleDownload = async () => {
    setStatus('Generating...');
    try {
      const res = await fetch(`${API_URL}/custom-views/itinerary-pdf`);
      if (!res.ok) throw new Error('PDF request failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'itinerary.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus('Downloaded itinerary.pdf');
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div data-testid="itinerary-pdf-export" style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' }}>
      <h3 style={{ marginTop: 0 }}>Itinerary PDF Export</h3>
      <p style={{ color: '#64748b' }}>
        Download a printable PDF version of your current itinerary with all daily activities.
      </p>
      <button
        onClick={handleDownload}
        style={{
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          padding: '10px 18px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Download Itinerary PDF
      </button>
      {status && <div style={{ marginTop: 10, fontSize: 13, color: '#475569' }}>{status}</div>}
    </div>
  );
};

export default ItineraryPdfExport;
