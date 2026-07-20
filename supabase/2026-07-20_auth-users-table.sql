-- ═══════════════════════════════════════════════════════════════
-- Migration: Create users table with hashed passwords
-- Date: 2026-07-20
-- Run: Supabase SQL Editor → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- Enable pgcrypto for crypt() and gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can read/write (server-side only)
CREATE POLICY "Service role only access to users" ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Password verification function (callable via RPC)
-- Returns true if password matches the stored bcrypt hash
CREATE OR REPLACE FUNCTION verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT crypt(input_password, stored_hash) = stored_hash;
$$;

-- Grant execute on the verify function
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO service_role;

-- Insert seed admin user
-- Password: LeadGen2026, hashed with bcrypt via pgcrypto
INSERT INTO users (email, password_hash, role)
VALUES (
  'dami@leadgen.os',
  crypt('LeadGen2026', gen_salt('bf')),
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Verify
SELECT id, email, role, created_at FROM users;
