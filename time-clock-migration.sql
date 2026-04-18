-- Time Clock / Time Entries table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by staff + date
CREATE INDEX idx_time_entries_staff ON time_entries(staff_id);
CREATE INDEX idx_time_entries_clock_in ON time_entries(clock_in DESC);

-- RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API uses service_role key)
CREATE POLICY "Service role full access" ON time_entries
  FOR ALL USING (true) WITH CHECK (true);
