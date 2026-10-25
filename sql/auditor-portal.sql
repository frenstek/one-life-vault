-- Auditor Portal — folder metadata table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS auditor_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS — service role has full access
ALTER TABLE auditor_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on auditor_folders"
  ON auditor_folders
  FOR ALL
  USING (true)
  WITH CHECK (true);
