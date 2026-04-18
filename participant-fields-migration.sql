-- ═══════════════════════════════════════════════════════════════════
-- PARTICIPANT FIELDS UPDATE
-- Run this in Supabase SQL Editor
-- Renames address → location, adds state and funding_ratio
-- ═══════════════════════════════════════════════════════════════════

-- Rename address to location
ALTER TABLE participants RENAME COLUMN address TO location;

-- Add state column (Australian states)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS state TEXT;

-- Add funding ratio column (e.g. 1:1, 1:2, 1:3, 2:1)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS funding_ratio TEXT;

-- ═══════════════════════════════════════════════════════════════════
-- PARTICIPANT INQUIRIES — same changes
-- ═══════════════════════════════════════════════════════════════════

-- Rename address to location
ALTER TABLE participant_inquiries RENAME COLUMN address TO location;

-- Add state column
ALTER TABLE participant_inquiries ADD COLUMN IF NOT EXISTS state TEXT;

-- Add funding ratio column
ALTER TABLE participant_inquiries ADD COLUMN IF NOT EXISTS funding_ratio TEXT;

-- Add follow-up tracking
ALTER TABLE participant_inquiries ADD COLUMN IF NOT EXISTS next_follow_up DATE;

-- Add converted participant reference
ALTER TABLE participant_inquiries ADD COLUMN IF NOT EXISTS converted_participant_id UUID REFERENCES participants(id);

-- ═══════════════════════════════════════════════════════════════════
-- INQUIRY NOTES TABLE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS inquiry_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES participant_inquiries(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT DEFAULT 'Staff',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_notes_inquiry ON inquiry_notes(inquiry_id);
