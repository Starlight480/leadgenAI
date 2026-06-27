-- Migration 008: Add deploy fields to projects table
-- Run this in Supabase SQL Editor

-- Add spec_html to store generated HTML for deployment
ALTER TABLE projects ADD COLUMN IF NOT EXISTS spec_html TEXT;

-- Deploy tracking columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deployed BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deploy_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMPTZ;

-- Index for quick deploy status lookups
CREATE INDEX IF NOT EXISTS idx_projects_deployed ON projects (deployed);
