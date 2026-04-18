-- Migration: add_verification_to_users
-- Created at: 2026-04-18T13:32:00
-- Description: Adds is_verified and verification_token columns to users table

ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_token TEXT;

-- For already existing users (like the seed admin), mark them as verified
UPDATE users SET is_verified = 1;
