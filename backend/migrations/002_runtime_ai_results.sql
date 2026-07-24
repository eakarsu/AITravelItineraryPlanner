CREATE TABLE IF NOT EXISTS travel_ai_results (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES travel_tenants(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES travel_users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS travel_ai_results_scope_idx
  ON travel_ai_results (tenant_id, user_id, endpoint, created_at DESC);
