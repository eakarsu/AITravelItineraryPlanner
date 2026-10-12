import React from 'react';

export default function TravelPresets({ presets, onChoose, disabled = false, note }) {
  return <div className="ai-preset-bar" aria-label="Sample trips">
    <div><strong>Fill sample details</strong><p>{note || 'Choose a realistic example, then review every field before generating.'}</p></div>
    <div className="ai-actions">{presets.map(({ label, values }) =>
      <button key={label} type="button" className="btn btn-secondary" disabled={disabled} onClick={() => onChoose(values)}>{label}</button>)}</div>
  </div>;
}
