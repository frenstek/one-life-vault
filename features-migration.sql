-- ═══════════════════════════════════════════════════════════════════════════════
-- One Life Vault — Feature Expansion Migration
-- Adds: Incidents, Announcements, Messages, Shift Handovers, Roster,
--        Medication Charts, Multiple Emergency Contacts
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── INCIDENTS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_number TEXT UNIQUE,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  reported_by TEXT NOT NULL,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_time TIME,
  location TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN (
    'injury', 'medication', 'behaviour', 'property_damage',
    'abuse_neglect', 'missing_person', 'fall', 'aggression', 'other'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  immediate_actions TEXT,
  witnesses TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_actions TEXT,
  follow_up_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read incidents" ON incidents FOR SELECT USING (true);
CREATE POLICY "Service role manage incidents" ON incidents FOR ALL USING (true) WITH CHECK (true);

-- Auto-generate incident numbers: INC-YYYYMM-001
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq_num INT;
BEGIN
  prefix := 'INC-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
  SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM LENGTH(prefix) + 1) AS INT)), 0) + 1
    INTO seq_num
    FROM incidents
    WHERE incident_number LIKE prefix || '%';
  NEW.incident_number := prefix || LPAD(seq_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_incident_number
  BEFORE INSERT ON incidents
  FOR EACH ROW
  WHEN (NEW.incident_number IS NULL)
  EXECUTE FUNCTION generate_incident_number();

-- ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Admin',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  target_role TEXT NOT NULL DEFAULT 'all' CHECK (target_role IN ('all', 'admin', 'manager', 'staff')),
  pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Service role manage announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID,
  sender_name TEXT NOT NULL,
  recipient_id UUID,
  recipient_name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Service role manage messages" ON messages FOR ALL USING (true) WITH CHECK (true);

-- ─── SHIFT HANDOVERS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shift_handovers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_name TEXT,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_type TEXT NOT NULL DEFAULT 'morning' CHECK (shift_type IN ('morning', 'afternoon', 'night', 'sleepover')),
  participant_notes TEXT,
  maintenance_notes TEXT,
  general_notes TEXT NOT NULL,
  flagged_items TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shift_handovers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shift_handovers" ON shift_handovers FOR SELECT USING (true);
CREATE POLICY "Service role manage shift_handovers" ON shift_handovers FOR ALL USING (true) WITH CHECK (true);

-- ─── SHIFT ROSTER ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shift_roster (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_name TEXT,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL DEFAULT 'morning' CHECK (shift_type IN ('morning', 'afternoon', 'night', 'sleepover')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shift_roster ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shift_roster" ON shift_roster FOR SELECT USING (true);
CREATE POLICY "Service role manage shift_roster" ON shift_roster FOR ALL USING (true) WITH CHECK (true);

-- ─── MEDICATION CHARTS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS medication_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT DEFAULT 'oral' CHECK (route IN ('oral', 'topical', 'injection', 'inhaled', 'sublingual', 'rectal', 'other')),
  prescriber TEXT,
  pharmacy TEXT,
  start_date DATE,
  end_date DATE,
  time_slots TEXT[], -- e.g. ['08:00', '12:00', '20:00']
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'prn', 'on_hold')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medication_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read medication_charts" ON medication_charts FOR SELECT USING (true);
CREATE POLICY "Service role manage medication_charts" ON medication_charts FOR ALL USING (true) WITH CHECK (true);

-- ─── EMERGENCY CONTACTS (multiple per participant) ───────────────────────────

CREATE TABLE IF NOT EXISTS participant_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL DEFAULT 'emergency' CHECK (contact_type IN ('emergency', 'gp', 'specialist', 'allied_health', 'guardian', 'family', 'other')),
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  organisation TEXT,
  role_title TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE participant_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read participant_contacts" ON participant_contacts FOR SELECT USING (true);
CREATE POLICY "Service role manage participant_contacts" ON participant_contacts FOR ALL USING (true) WITH CHECK (true);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_participant ON incidents(participant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_date ON shift_handovers(shift_date DESC);
CREATE INDEX IF NOT EXISTS idx_shift_roster_date ON shift_roster(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_roster_staff ON shift_roster(staff_id);
CREATE INDEX IF NOT EXISTS idx_medication_charts_participant ON medication_charts(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_contacts_participant ON participant_contacts(participant_id);
