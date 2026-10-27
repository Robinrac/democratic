CREATE TABLE IF NOT EXISTS open_circle_migrations (version integer PRIMARY KEY);
-- A workshop is a small aggregate (seven teams, at most 2,000 posts).
-- Locking its row serializes claims, posts and phase changes across Node instances.
CREATE TABLE IF NOT EXISTS open_circle_sessions (
  id text PRIMARY KEY,
  expires_at bigint NOT NULL,
  state jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS open_circle_expiry ON open_circle_sessions(expires_at);
INSERT INTO open_circle_migrations(version) VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS open_circle_revocations (token_hash text PRIMARY KEY, expires_at bigint NOT NULL);
