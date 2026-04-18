-- ═══════════════════════════════════════════════════════════════════
-- PARTICIPANT MANAGEMENT TABLES
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Participants (profiles)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  ndis_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  bio TEXT,
  photo_url TEXT,
  plan_start_date DATE,
  plan_end_date DATE,
  funding_type TEXT,           -- Self-managed, Plan-managed, NDIA-managed
  support_level TEXT,          -- Standard, High, Complex
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  gp_name TEXT,
  gp_phone TEXT,
  gp_clinic TEXT,
  status TEXT DEFAULT 'active', -- active, inactive, exited
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Participant progress notes
CREATE TABLE IF NOT EXISTS participant_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'progress', -- progress, incident, handover, general
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Participant file attachments
CREATE TABLE IF NOT EXISTS participant_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  category TEXT DEFAULT 'General', -- Care Plan, BSP, Service Agreement, Medical, NDIS Plan, Other, General
  storage_path TEXT NOT NULL,
  file_type TEXT,
  size INTEGER,
  notes TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Service write participants" ON participants FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read participant_notes" ON participant_notes FOR SELECT USING (true);
CREATE POLICY "Service write participant_notes" ON participant_notes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read participant_files" ON participant_files FOR SELECT USING (true);
CREATE POLICY "Service write participant_files" ON participant_files FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_participant_notes_participant ON participant_notes(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_files_participant ON participant_files(participant_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_ndis ON participants(ndis_number);

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKET
-- Create a bucket called "participant-files" in Supabase Dashboard:
--   Storage > New Bucket > Name: "participant-files" > Public: true
-- ═══════════════════════════════════════════════════════════════════
