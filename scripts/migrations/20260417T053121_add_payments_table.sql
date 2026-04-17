-- Migration: add_payments_table
-- Created: 2026-04-17T05:31:21.000Z

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL,
  pricing_plan_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  external_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (space_id) REFERENCES spaces(id),
  FOREIGN KEY (pricing_plan_id) REFERENCES pricing_plans(id)
);

-- Index for faster lookups by space and reference
CREATE INDEX IF NOT EXISTS idx_payments_space_id ON payments(space_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
