-- Migration: add_environment_type
-- Created: 2026-03-10T12:00:00Z
-- Description: Add type column to environments table

-- Add type column to environments table with default value 'other'
ALTER TABLE environments ADD COLUMN type TEXT DEFAULT 'other';
