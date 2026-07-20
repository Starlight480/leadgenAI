-- ═══════════════════════════════════════════════════════════════
-- Migration: Drop rentnaija_listings table (dead code)
-- Date: 2026-07-20
-- Run: Supabase SQL Editor → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- Drop the rentnaija_listings table (dead code, no longer in repo)
DROP TABLE IF EXISTS rentnaija_listings CASCADE;

-- Verify it's gone
-- Should return 0 rows
SELECT tablename FROM pg_tables WHERE tablename = 'rentnaija_listings';
