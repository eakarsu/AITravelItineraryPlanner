# Governed Travel Operations

The supported backend is `/api/governed-travel`. Original generated, direct-AI, upload, broad CRUD, and `gap*` routes remain as prototype reference material but are not mounted by `backend/src/index.js`.

## Controlled setup

1. Copy `.env.example` into a secret-managed runtime and replace placeholders.
2. Run `./scripts/bootstrap.sh` explicitly to install lockfile-pinned dependencies.
3. Apply `./scripts/migrate.sh apply-governed-travel-001` through normal database change approval.
4. Provision tenant memberships through an administrator-controlled channel. Demo credentials and public registration are disabled.
5. Enable providers only after their HTTPS endpoint, runtime credential, user consent, and least-privilege scopes are ready. Provider readiness fails closed.
6. Run `./start.sh`. It refuses missing dependencies and occupied ports and does not write configuration, install packages, seed/reset databases, or terminate processes it did not start.

## Planning and booking lifecycle

Travelers or authorized guardians create minimal, versioned preferences: dates, budget, currency, age group, interests, dietary/mobility needs, pace, and safety constraints. Precise location history and payment credentials are rejected. Recommendations must have source digests, availability, safety, accessibility, diet, and price evidence; filters and explanations are retained. Edits and feedback form linked corrections and never trigger bookings.

Itineraries are evaluated for relevance, provider diversity, safety, accessibility, cold start, changed preferences, failure behavior, and latency. Booking integration begins with an idempotent authoritative search and an immutable, expiring quote. A traveler confirms the exact total and currency (plus guardian approval for a minor) before a reservation outbox can be queued. Provider success requires an external reference and evidence receipt; failures retry to a dead-letter ceiling.

Integrations record explicit scopes and consent and can be revoked. Privacy exports return subject-owned data with a digest manifest. Deletion requests propagate to every connected provider and remain incomplete until receipts arrive. Provider outcomes, usage, failures, itinerary versions, feedback, exports, and deletion receipts are durable evidence.

## External validation still required

Local tests cover recommendation filters, cold start, accessibility, corrections, evaluation gates, consent scopes, quote/approval behavior, deletion propagation, migration, API, and launcher contracts without external services. Production release still requires real calendar/maps/transit/content/currency/booking contract tests, booking sandbox and cancellation tests, accessibility/safety owner review, age-protection and privacy review, representative-user evaluation, migration/restore rehearsal, load tests, and security/access validation.
