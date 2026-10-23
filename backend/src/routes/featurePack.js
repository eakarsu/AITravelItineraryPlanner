'use strict';
// Feature pack: authenticated tasks, search/filter, CSV/JSON export, and
// deterministic domain insights over this app's own task records.
// No provider calls are made here: insights are a labelled deterministic
// fallback (aiGenerated:false), so behaviour is identical offline and in tests
// even if a parent .env reloads provider keys.
const express = require('express');

const DOMAIN = "Travel Itinerary";
const FEATURES = [{"id": "itinerary-pace", "label": "Itinerary pace outlook", "kind": "workload"}, {"id": "budget-watch", "label": "Budget watch", "kind": "risk"}, {"id": "readiness-focus", "label": "Trip readiness focus", "kind": "focus"}];

function createStore(seed) {
  let nextId = 1;
  const records = [];
  function insert(input) {
    const rec = {
      id: nextId++,
      title: String(input.title || ''),
      status: input.status !== undefined && input.status !== null && input.status !== '' ? String(input.status) : 'open',
      priority: input.priority !== undefined && input.priority !== null && input.priority !== '' ? String(input.priority) : 'normal',
      category: input.category !== undefined && input.category !== null ? String(input.category) : '',
      notes: input.notes !== undefined && input.notes !== null ? String(input.notes) : '',
      dueDate: input.dueDate !== undefined && input.dueDate !== null ? String(input.dueDate) : '',
      estimateHours: Number.isFinite(Number(input.estimateHours)) ? Number(input.estimateHours) : 0,
      completed: input.completed === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    records.push(rec);
    return rec;
  }
  (seed || []).forEach(insert);
  return { records, insert };
}

function filterRecords(records, query) {
  const q = String((query && query.q) || '').trim().toLowerCase();
  const status = String((query && query.status) || '').trim().toLowerCase();
  const priority = String((query && query.priority) || '').trim().toLowerCase();
  const category = String((query && query.category) || '').trim().toLowerCase();
  return records.filter((r) => {
    if (q && ![r.title, r.notes, r.category, r.status, r.priority].join(' ').toLowerCase().includes(q)) return false;
    if (status && String(r.status).toLowerCase() !== status) return false;
    if (priority && String(r.priority).toLowerCase() !== priority) return false;
    if (category && String(r.category).toLowerCase() !== category) return false;
    return true;
  });
}

function csvCell(v) {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const COLUMNS = ['id','title','status','priority','category','notes','dueDate','estimateHours','completed','createdAt','updatedAt'];
function toCSV(records) {
  const lines = [COLUMNS.join(',')];
  for (const r of records) lines.push(COLUMNS.map((c) => csvCell(r[c])).join(','));
  return lines.join('\n') + '\n';
}

function section(label, value) { return { label, value }; }

function buildInsights(records) {
  const total = records.length;
  const open = records.filter((r) => !r.completed && String(r.status).toLowerCase() !== 'done').length;
  const done = records.filter((r) => r.completed || String(r.status).toLowerCase() === 'done').length;
  const high = records.filter((r) => String(r.priority).toLowerCase() === 'high').length;
  const hours = records.reduce((sum, r) => sum + (Number(r.estimateHours) || 0), 0);
  const byCategory = {};
  for (const r of records) { const k = r.category || ''; byCategory[k] = (byCategory[k] || 0) + 1; }
  const topCategory = Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a])[0];
  const summaries = {
    workload: `Total records: ${total}; open: ${open}; completed: ${done}; estimated hours: ${hours}.`,
    risk: high === 0 ? 'No high-priority records; risk is 0-flagged.' : `${high} high-priority record(s) need attention first.`,
    focus: total === 0 ? 'No records yet; focus category is empty.' : `Largest category: ${topCategory === '' ? '(empty)' : topCategory} (${byCategory[topCategory]} record(s)).`,
  };
  return FEATURES.map((f) => ({
    id: f.id,
    label: f.label,
    aiGenerated: false,
    source: 'deterministic-fallback',
    notice: 'Deterministic fallback (no provider call)',
    summary: summaries[f.kind] || summaries.workload,
    sections: [
      section('Total records', total),
      section('Open records', open),
      section('Completed records', done),
      section('High-priority records', high),
      section('Estimated hours', hours),
      section('Has records', total > 0),
      section('Top category', topCategory === undefined ? '' : topCategory),
      section('Domain', DOMAIN),
    ],
  }));
}

function createFeaturePackRouter(authenticate, store) {
  const router = express.Router();
  const data = store || createStore();
  if (typeof authenticate === 'function') router.use(authenticate);
  else router.use((_req, res) => res.status(401).json({ error: 'Access token required' }));

  router.get('/tasks', (req, res) => {
    const items = filterRecords(data.records, req.query);
    res.json({ label: `${DOMAIN} tasks`, total: items.length, items });
  });

  router.post('/tasks', (req, res) => {
    const title = String((req.body && req.body.title) || '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });
    const rec = data.insert({ ...req.body, title });
    return res.status(201).json(rec);
  });

  router.put('/tasks/:id', (req, res) => {
    const rec = data.records.find((r) => String(r.id) === String(req.params.id));
    if (!rec) return res.status(404).json({ error: 'Task not found' });
    const body = req.body || {};
    for (const key of ['title','status','priority','category','notes','dueDate']) {
      if (body[key] !== undefined) rec[key] = String(body[key]);
    }
    if (body.estimateHours !== undefined) rec.estimateHours = Number.isFinite(Number(body.estimateHours)) ? Number(body.estimateHours) : 0;
    if (body.completed !== undefined) rec.completed = body.completed === true;
    rec.updatedAt = new Date().toISOString();
    return res.json(rec);
  });

  router.get('/tasks/export', (req, res) => {
    const items = filterRecords(data.records, req.query);
    const format = String(req.query.format || 'json').toLowerCase();
    if (format === 'csv') {
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', 'attachment; filename="tasks.csv"');
      return res.send(toCSV(items));
    }
    res.set('Content-Disposition', 'attachment; filename="tasks.json"');
    return res.json({ label: `${DOMAIN} tasks export`, total: items.length, items });
  });

  router.get('/insights', (req, res) => {
    const items = filterRecords(data.records, req.query);
    res.json({ label: `${DOMAIN} insights`, aiGenerated: false, source: 'deterministic-fallback', features: buildInsights(items) });
  });

  return router;
}

module.exports = createFeaturePackRouter;
module.exports.createFeaturePackRouter = createFeaturePackRouter;
module.exports.createStore = createStore;
module.exports.filterRecords = filterRecords;
module.exports.toCSV = toCSV;
module.exports.buildInsights = buildInsights;
