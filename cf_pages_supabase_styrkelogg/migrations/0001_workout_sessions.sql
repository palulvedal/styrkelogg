-- D1 schema for the strength log app.
-- user_email is the e-mail Cloudflare Access verified for the request.
CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  session_date TEXT NOT NULL,
  workout_key TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{"exerciseLogs":[]}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date
  ON workout_sessions (user_email, session_date, created_at);
