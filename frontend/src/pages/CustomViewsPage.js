import React from 'react';
import TripTimelineView from '../components/TripTimelineView';
import DestinationHeatmap from '../components/DestinationHeatmap';
import ItineraryPdfExport from '../components/ItineraryPdfExport';
import TravelPreferenceRulesEditor from '../components/TravelPreferenceRulesEditor';

const CustomViewsPage = () => {
  return (
    <div data-testid="custom-views-page" style={{ padding: 20, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 4 }}>Travel Views</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Custom visualizations and tools for your travel itinerary.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        <section>
          <h2 style={{ fontSize: 16, color: '#334155', marginBottom: 8 }}>Visualizations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <TripTimelineView />
            <DestinationHeatmap />
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 16, color: '#334155', marginBottom: 8 }}>Tools</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <ItineraryPdfExport />
            <TravelPreferenceRulesEditor />
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomViewsPage;
