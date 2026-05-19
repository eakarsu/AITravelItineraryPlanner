// Custom Views - 4 features (2 VIZ + 2 NON-VIZ) for AITravelItineraryPlanner
// 1. Trip Timeline (VIZ: day x activity)
// 2. Destination Popularity Heatmap (VIZ)
// 3. Itinerary PDF (NON-VIZ)
// 4. Travel Preference Rules Editor (NON-VIZ: CRUD budget, pace)

const express = require('express');
const router = express.Router();

// ---- In-memory stores (no DB schema changes required) ----
const preferenceRules = [
  { id: 'rule-1', name: 'Budget Backpacker', budget: 'low', pace: 'slow', maxDailyUsd: 75, notes: 'Hostels + local food' },
  { id: 'rule-2', name: 'Comfortable Explorer', budget: 'medium', pace: 'medium', maxDailyUsd: 200, notes: 'Mid-range hotels' },
  { id: 'rule-3', name: 'Luxury Fast Pace', budget: 'high', pace: 'fast', maxDailyUsd: 600, notes: 'Premium experiences' },
];
let ruleSeq = 4;

// Seed data for timeline + heatmap (renderable without DB)
const seedTimeline = (() => {
  const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
  const slots = ['Morning', 'Afternoon', 'Evening'];
  const activityNames = [
    'Eiffel Tower visit', 'Louvre Museum', 'Seine River Cruise', 'Montmartre walk',
    'Versailles Palace', 'Cafe in Marais', 'Notre-Dame view', 'Latin Quarter dinner',
    'Picnic at Luxembourg', 'Arc de Triomphe', 'Sacre-Coeur sunset', 'Wine tasting',
    'Bike along the Seine', 'Opera Garnier tour', 'Champs-Elysees shop'
  ];
  const items = [];
  let i = 0;
  for (const d of days) for (const s of slots) {
    items.push({ day: d, slot: s, activity: activityNames[i % activityNames.length], durationMin: 60 + (i % 3) * 30 });
    i++;
  }
  return { destination: 'Paris', items };
})();

const seedHeatmap = {
  cells: [
    { destination: 'Paris', visits: 92, avgRating: 4.6 },
    { destination: 'Tokyo', visits: 88, avgRating: 4.8 },
    { destination: 'New York', visits: 81, avgRating: 4.4 },
    { destination: 'Rome', visits: 76, avgRating: 4.5 },
    { destination: 'Barcelona', visits: 70, avgRating: 4.6 },
    { destination: 'Bangkok', visits: 65, avgRating: 4.3 },
    { destination: 'Sydney', visits: 58, avgRating: 4.7 },
    { destination: 'Cape Town', visits: 47, avgRating: 4.5 },
    { destination: 'Reykjavik', visits: 41, avgRating: 4.8 },
    { destination: 'Lisbon', visits: 53, avgRating: 4.5 },
    { destination: 'Marrakech', visits: 38, avgRating: 4.2 },
    { destination: 'Buenos Aires', visits: 44, avgRating: 4.4 },
  ],
};

// ============================================================
// VIZ 1: GET /api/custom-views/trip-timeline
// Returns day x activity grid
// ============================================================
router.get('/trip-timeline', (req, res) => {
  res.json({
    success: true,
    view: 'trip-timeline',
    title: 'Trip Timeline (Day x Activity)',
    destination: seedTimeline.destination,
    columns: ['Morning', 'Afternoon', 'Evening'],
    rows: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
    items: seedTimeline.items,
  });
});

// ============================================================
// VIZ 2: GET /api/custom-views/destination-heatmap
// Returns popularity heatmap data
// ============================================================
router.get('/destination-heatmap', (req, res) => {
  const cells = seedHeatmap.cells;
  const max = Math.max(...cells.map((c) => c.visits));
  res.json({
    success: true,
    view: 'destination-heatmap',
    title: 'Destination Popularity Heatmap',
    max,
    cells: cells.map((c) => ({ ...c, intensity: Math.round((c.visits / max) * 100) / 100 })),
  });
});

// ============================================================
// NON-VIZ 1: GET /api/custom-views/itinerary-pdf
// Returns a downloadable PDF of the itinerary
// (minimal PDF stream — no external lib)
// ============================================================
function buildMinimalPdf(lines) {
  // Build a valid 1-page PDF containing text lines
  const safe = (s) => String(s).replace(/[()\\]/g, (m) => '\\' + m);
  const textOps = lines
    .map((ln, i) => `1 0 0 1 50 ${760 - i * 18} Tm (${safe(ln)}) Tj`)
    .join('\n');
  const stream = `BT\n/F1 12 Tf\n14 TL\n${textOps}\nET`;
  const objs = [];
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

router.get('/itinerary-pdf', (req, res) => {
  const lines = [
    'AI Travel Itinerary Planner',
    'Trip Summary - Paris (5 days)',
    '',
    ...seedTimeline.items.map((it) => `${it.day} - ${it.slot}: ${it.activity} (${it.durationMin}m)`),
    '',
    'Generated by Custom Views',
  ];
  const pdf = buildMinimalPdf(lines);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="itinerary.pdf"');
  res.status(200).end(pdf);
});

// ============================================================
// NON-VIZ 2: /api/custom-views/preference-rules  (CRUD)
// ============================================================
router.get('/preference-rules', (req, res) => {
  res.json({ success: true, rules: preferenceRules });
});

router.post('/preference-rules', (req, res) => {
  const { name = 'Untitled Rule', budget = 'medium', pace = 'medium', maxDailyUsd = 100, notes = '' } = req.body || {};
  const rule = { id: `rule-${ruleSeq++}`, name, budget, pace, maxDailyUsd, notes };
  preferenceRules.push(rule);
  res.status(201).json({ success: true, rule });
});

router.put('/preference-rules/:id', (req, res) => {
  const idx = preferenceRules.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Rule not found' });
  preferenceRules[idx] = { ...preferenceRules[idx], ...req.body, id: preferenceRules[idx].id };
  res.json({ success: true, rule: preferenceRules[idx] });
});

router.delete('/preference-rules/:id', (req, res) => {
  const idx = preferenceRules.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Rule not found' });
  const [removed] = preferenceRules.splice(idx, 1);
  res.json({ success: true, removed });
});

module.exports = router;
