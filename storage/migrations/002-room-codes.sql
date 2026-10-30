CREATE TABLE IF NOT EXISTS open_circle_room_codes (
  session_id text PRIMARY KEY REFERENCES open_circle_sessions(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z]{6}$')
);
INSERT INTO open_circle_migrations(version) VALUES (2) ON CONFLICT DO NOTHING;
