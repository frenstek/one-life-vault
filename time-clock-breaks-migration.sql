-- Adds break_start to time_entries to track in-progress breaks.
-- Run this in the Supabase SQL Editor.

ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS break_start TIMESTAMPTZ;
