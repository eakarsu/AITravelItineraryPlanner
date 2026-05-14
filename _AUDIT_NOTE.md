# Audit Note — AITravelItineraryPlanner

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_08.md` (section 21).

## Original Recommendations

### Missing AI Counterparts
- None obvious; AI coverage is comprehensive (22 endpoints).

### Missing Non-AI Features
- Booking platform integrations (Expedia, Booking.com, Airbnb)
- Real-time flight price alerts
- Travel insurance comparison
- Visa requirement checker
- Multi-currency tracking

### Custom Feature Suggestions
- Dynamic itinerary adjustment
- Local currency spending tracker
- Travel community features
- Visa/document advisor
- Travel insurance recommender

## Implemented (this round)
1. `POST /api/ai/visa-advisor` — visa/document requirements by citizenship + destination.
2. `POST /api/ai/insurance-recommender` — coverage tier and cost estimate.

Pattern reused: `openrouter.callOpenRouter` (messages + options) + ad-hoc JSON extraction matching existing `/similar-trips`. Returns `AI_DISCLAIMER`. Syntax-checked.

## Backlog (prioritized)
1. **MECHANICAL** Dynamic itinerary adjustment endpoint.
2. **NEEDS-CREDS** Booking platform OAuth/API integrations.
3. **NEEDS-CREDS** Real-time flight price feeds.
4. **NEEDS-PRODUCT-DECISION** Travel community / social features.

## Apply pass 5 (all backlog)

Cleared the backlog with 6 new endpoints (4 features). All additive, gated on env vars where applicable.

- `POST/GET /api/ai/currency/spend` — PRODUCT-DECISION: local currency spending tracker. Stores per-trip rows in new `currency_spend` table; computes base-currency totals server-side. Caller passes `fx_rate` (no external FX feed required).
- `POST /api/ai/booking-search` — NEEDS-CREDS: gated on `BOOKING_API_KEY` and `BOOKING_PROVIDER` (returns 503 + `missing` if unset). Uses LLM to return normalized booking options when configured.
- `POST/GET /api/ai/flight-alerts` — NEEDS-CREDS: gated on `FLIGHT_PRICE_API_KEY`. New `flight_price_alerts` table records alerts. No live polling — that's a job-runner concern.
- `POST/GET /api/ai/community/posts` — PRODUCT-DECISION: travel community = lightweight per-trip public note board (no social graph). New `community_posts` table.

Smoke test: backend on :4000 with empty `OPENROUTER_API_KEY`; logged in as `demo@travelplanner.com / Demo123!`; `booking-search` returned 503 + `missing: 'BOOKING_API_KEY'`; `flight-alerts` POST returned 503 + `missing: 'FLIGHT_PRICE_API_KEY'`; `community/posts` GET/POST returned 200/201; `currency/spend` POST returned 201. Backend killed.

Files modified:
- `backend/src/routes/ai.js` (added `CREATE TABLE IF NOT EXISTS` for `currency_spend`, `flight_price_alerts`, `community_posts`; 6 new endpoints)

Syntax: `node --check` OK.

## Apply pass 4 (mechanical backlog)

Added the one MECHANICAL backlog item: dynamic itinerary adjustment.

### Backend (`backend/src/routes/ai.js`)
- `POST /api/ai/adjust-itinerary` — re-plans an existing itinerary in response to disruptions (weather, flight delay, budget cut, illness, schedule shift, closure, extension). Accepts either `tripId` (auto-loads trip + activities from DB) or a `current_itinerary` payload. Reuses existing `openrouter.callOpenRouter` helper.
- 503 handling: when the openrouter helper throws "API key not configured", the route returns **503** with a user-facing message.
- Logs to existing `ai_history` and `ai_results` tables via existing helpers.

### Frontend
- `frontend/src/pages/DynamicAdjuster.js` — new page mirroring the styling of `InsuranceRecommender.js` and `VisaAdvisor.js`. JWT bearer auth via `localStorage.getItem('token')`. Handles 503 with "AI not configured" message.
- `frontend/src/App.js` — added import and route at `/dynamic-adjuster`.
- `frontend/src/components/Sidebar.js` — added entry under AI Tools.

### Smoke test
- Started backend with empty `OPENROUTER_API_KEY`; logged in as `demo@travelplanner.com / Demo123!`; `POST /api/ai/adjust-itinerary` returned **503** with the configured AI-not-configured message. Cleanup: backend killed.

### Files modified
- `backend/src/routes/ai.js`
- `frontend/src/App.js`
- `frontend/src/components/Sidebar.js`
- `frontend/src/pages/DynamicAdjuster.js` (new)

Syntax: `node --check` passed for backend; `@babel/parser` (with jsx plugin) passed for frontend.

## Apply pass 3 (frontend)

- Pre-existing FE: `pages/VisaAdvisor.js` already calls `/api/ai/visa-advisor` but was NOT routed in `App.js` and not linked in `Sidebar`. Fixed.
- Created `pages/InsuranceRecommender.js` for the `/api/ai/insurance-recommender` endpoint (mirrors VisaAdvisor styling and auth pattern).
- Added 503 ("AI not configured") handling to both pages.
- Wired both pages into `App.js` (`/visa-advisor`, `/insurance-recommender`) and `components/Sidebar.js` AI Tools section.
- Backend already mounts `/api/ai` in `src/index.js`; no backend changes needed.

### Files modified
- `frontend/src/App.js` — added imports + routes.
- `frontend/src/components/Sidebar.js` — added AI Tools entries.
- `frontend/src/pages/VisaAdvisor.js` — 503 handling.
- `frontend/src/pages/InsuranceRecommender.js` — created.

