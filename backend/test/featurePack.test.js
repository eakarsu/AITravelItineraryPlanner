'use strict';
// Offline only: unset provider keys before importing app code.
delete process.env.OPENROUTER_API_KEY;
delete process.env.OPENAI_API_KEY;
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const createFeaturePackRouter = require('../src/routes/featurePack');

function stubAuth(req, res, next) {
  if (req.headers.authorization === 'Bearer test-token') { req.user = { id: 'u1' }; return next(); }
  return res.status(401).json({ error: 'Access token required' });
}
async function withServer(fn) {
  const app = express();
  app.use(express.json());
  app.use('/api/feature-pack', createFeaturePackRouter(stubAuth));
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/api/feature-pack`;
  const headers = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
  try { await fn(base, headers); } finally { server.close(); }
}

test('tasks require auth and support create/list/search/update', async () => {
  await withServer(async (base, headers) => {
    const unauth = await fetch(`${base}/tasks`);
    assert.equal(unauth.status, 401);
    const created = await fetch(`${base}/tasks`, { method: 'POST', headers, body: JSON.stringify({ title: 'Alpha task', status: 'open', priority: 'high', category: 'ops', estimateHours: 0, completed: false, notes: '' }) });
    assert.equal(created.status, 201);
    const rec = await created.json();
    assert.equal(rec.estimateHours, 0);
    assert.equal(rec.completed, false);
    assert.equal(rec.notes, '');
    await fetch(`${base}/tasks`, { method: 'POST', headers, body: JSON.stringify({ title: 'Beta task', status: 'done', priority: 'low' }) });
    const all = await (await fetch(`${base}/tasks`, { headers })).json();
    assert.equal(all.total, 2);
    const filtered = await (await fetch(`${base}/tasks?q=alpha`, { headers })).json();
    assert.equal(filtered.total, 1);
    const byStatus = await (await fetch(`${base}/tasks?status=done`, { headers })).json();
    assert.equal(byStatus.total, 1);
    const updated = await fetch(`${base}/tasks/${rec.id}`, { method: 'PUT', headers, body: JSON.stringify({ status: 'done', completed: true }) });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).status, 'done');
    const missing = await fetch(`${base}/tasks/9999`, { method: 'PUT', headers, body: JSON.stringify({ status: 'done' }) });
    assert.equal(missing.status, 404);
    const bad = await fetch(`${base}/tasks`, { method: 'POST', headers, body: JSON.stringify({}) });
    assert.equal(bad.status, 400);
  });
});

test('export supports CSV and JSON preserving false/0/empty', async () => {
  await withServer(async (base, headers) => {
    await fetch(`${base}/tasks`, { method: 'POST', headers, body: JSON.stringify({ title: 'Export me', estimateHours: 0, completed: false, notes: '' }) });
    const csvRes = await fetch(`${base}/tasks/export?format=csv`, { headers });
    assert.match(csvRes.headers.get('content-type') || '', /text\/csv/);
    const csv = await csvRes.text();
    assert.match(csv, /Export me/);
    assert.match(csv, /,0,false,/);
    const json = await (await fetch(`${base}/tasks/export?format=json`, { headers })).json();
    assert.equal(json.total, 1);
    assert.equal(json.items[0].estimateHours, 0);
    assert.equal(json.items[0].completed, false);
    assert.equal(json.items[0].notes, '');
  });
});

test('insights are labelled deterministic fallback with falsy values preserved', async () => {
  await withServer(async (base, headers) => {
    const empty = await (await fetch(`${base}/insights`, { headers })).json();
    assert.equal(empty.aiGenerated, false);
    assert.ok(empty.features.length >= 2 && empty.features.length <= 3);
    for (const f of empty.features) {
      assert.equal(f.aiGenerated, false);
      assert.ok(f.label && f.sections.length >= 3);
      assert.ok(f.sections.some((s) => s.label === 'Total records' && s.value === 0));
      assert.ok(f.sections.some((s) => s.label === 'Has records' && s.value === false));
    }
    await fetch(`${base}/tasks`, { method: 'POST', headers, body: JSON.stringify({ title: 'Insight task', priority: 'high' }) });
    const filled = await (await fetch(`${base}/insights`, { headers })).json();
    assert.ok(filled.features[0].sections.some((s) => s.label === 'Total records' && s.value === 1));
  });
});
