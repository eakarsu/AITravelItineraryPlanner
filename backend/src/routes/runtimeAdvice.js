'use strict';

const router = require('express').Router();
const pool = require('../config/database');

function parseContent(content) {
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(cleaned); } catch (_) { return { content: cleaned }; }
}

router.post('/itinerary', async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    const model = process.env.OPENROUTER_MODEL || '';
    const baseUrl = (process.env.OPENROUTER_BASE_URL || '').replace(/\/$/, '');
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is required');
    if (!model) throw new Error('OPENROUTER_MODEL is required');
    if (baseUrl !== 'https://openrouter.ai/api/v1') {
      throw new Error('OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a careful travel itinerary planner. Return substantive JSON with summary, daily_plan, risks, and recommendations.' },
          { role: 'user', content: JSON.stringify(req.body || {}) },
        ],
        temperature: 0.4,
        max_tokens: 1600,
      }),
      signal: AbortSignal.timeout(120000),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || `OpenRouter returned HTTP ${response.status}`);
    const content = data.choices?.[0]?.message?.content || '';
    if (!content.trim()) throw new Error('OpenRouter returned an empty response');
    const result = parseContent(content);
    await pool.query(
      `INSERT INTO travel_ai_results(tenant_id,user_id,endpoint,input_data,result,model)
       VALUES($1,$2,'itinerary',$3,$4,$5)`,
      [req.user.tenantId, req.user.id, req.body || {}, result, model]
    );
    res.json({ result, content, model });
  } catch (error) {
    console.error('Runtime itinerary advice failed:', error.message);
    res.status(502).json({ error: 'Unable to generate itinerary advice' });
  }
});

module.exports = router;
