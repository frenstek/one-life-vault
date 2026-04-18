-- Stakeholders Directory table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS stakeholders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Other',
  organization TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_stakeholders_type ON stakeholders(type);
CREATE INDEX IF NOT EXISTS idx_stakeholders_status ON stakeholders(status);

-- Enable RLS
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON stakeholders
  FOR ALL USING (true) WITH CHECK (true);
