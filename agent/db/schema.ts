export const SCHEMA = `
CREATE TABLE IF NOT EXISTS runs (
  id           TEXT PRIMARY KEY,
  run_number   INTEGER NOT NULL,
  topic        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  started_at   TEXT NOT NULL,
  completed_at TEXT,
  total_cost_ace  REAL DEFAULT 0,
  error        TEXT
);

CREATE TABLE IF NOT EXISTS steps (
  id           TEXT PRIMARY KEY,
  run_id       TEXT NOT NULL REFERENCES runs(id),
  step_number  INTEGER NOT NULL,
  step_name    TEXT NOT NULL,
  api_used     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',
  cost_usdc    REAL DEFAULT 0,
  tx_hash      TEXT,
  duration_ms  INTEGER,
  output_ref   TEXT,
  started_at   TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS outputs (
  id            TEXT PRIMARY KEY,
  run_id        TEXT NOT NULL REFERENCES runs(id),
  article_title TEXT,
  article_body  TEXT,
  image_path    TEXT,
  audio_path    TEXT,
  news_sources  TEXT
);
`;

export default SCHEMA;
