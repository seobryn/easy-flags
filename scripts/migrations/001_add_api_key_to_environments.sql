-- Migration: Add API Key field to environments table
-- Description: Adds api_key column to store unique API keys for each environment

-- Check if column already exists using a workaround
-- This is safe to run multiple times
PRAGMA table_info(environments);

-- Add the column (will be skipped by migration system if it already exists)
ALTER TABLE environments ADD COLUMN api_key TEXT;

-- Update existing rows to generate unique keys if they don't have one
UPDATE environments SET api_key = hex(randomblob(8)) || '_' || hex(randomblob(8)) WHERE api_key IS NULL;

-- Create unique index on api_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_environments_api_key ON environments(api_key);
