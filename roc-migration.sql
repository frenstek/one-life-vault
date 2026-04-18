-- ═══════════════════════════════════════════════════════════════════════════════
-- One Life Vault — Roster of Care Migration
-- Adds: roster_of_care, roc_participants, roc_time_blocks, roc_staff_assignments
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── ROSTER OF CARE (master) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roster_of_care (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roc_number TEXT UNIQUE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  version INT DEFAULT 1,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roster_of_care ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roc" ON roster_of_care FOR SELECT USING (true);
CREATE POLICY "Service role manage roc" ON roster_of_care FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_roc_property ON roster_of_care(property_id);
CREATE INDEX idx_roc_status ON roster_of_care(status);

-- Auto-generate ROC numbers: ROC-YYYYMM-001
CREATE OR REPLACE FUNCTION generate_roc_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq_num INT;
BEGIN
  prefix := 'ROC-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
  SELECT COALESCE(MAX(CAST(SUBSTRING(roc_number FROM LENGTH(prefix) + 1) AS INT)), 0) + 1
    INTO seq_num
    FROM roster_of_care
    WHERE roc_number LIKE prefix || '%';
  NEW.roc_number := prefix || LPAD(seq_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roc_number
  BEFORE INSERT ON roster_of_care
  FOR EACH ROW
  WHEN (NEW.roc_number IS NULL)
  EXECUTE FUNCTION generate_roc_number();

-- ─── ROC PARTICIPANTS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roc_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_id UUID NOT NULL REFERENCES roster_of_care(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  individual_ratio TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(roster_id, participant_id)
);

ALTER TABLE roc_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roc_participants" ON roc_participants FOR SELECT USING (true);
CREATE POLICY "Service role manage roc_participants" ON roc_participants FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_roc_participants_roster ON roc_participants(roster_id);

-- ─── ROC TIME BLOCKS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roc_time_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_id UUID NOT NULL REFERENCES roster_of_care(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Mon, 6=Sun
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  support_type TEXT NOT NULL DEFAULT 'active' CHECK (support_type IN ('active', 'sleepover', 'passive_night')),
  support_ratio TEXT NOT NULL DEFAULT '1:3',
  required_staff INT NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roc_time_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roc_time_blocks" ON roc_time_blocks FOR SELECT USING (true);
CREATE POLICY "Service role manage roc_time_blocks" ON roc_time_blocks FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_roc_time_blocks_roster ON roc_time_blocks(roster_id);

-- ─── ROC STAFF ASSIGNMENTS ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roc_staff_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time_block_id UUID NOT NULL REFERENCES roc_time_blocks(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(time_block_id, staff_id)
);

ALTER TABLE roc_staff_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roc_staff_assignments" ON roc_staff_assignments FOR SELECT USING (true);
CREATE POLICY "Service role manage roc_staff_assignments" ON roc_staff_assignments FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_roc_staff_time_block ON roc_staff_assignments(time_block_id);
CREATE INDEX idx_roc_staff_staff ON roc_staff_assignments(staff_id);
