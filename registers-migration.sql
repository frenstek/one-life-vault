-- ═══════════════════════════════════════════════════════════════════════════════
-- One Life Vault — Registers Migration
-- Adds: Continuous Improvement, Risk Register, Hazard Register,
--        Feedback & Complaints Register
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── CONTINUOUS IMPROVEMENT REGISTER ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS continuous_improvement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'internal_review' CHECK (source IN (
    'audit', 'feedback', 'incident', 'internal_review', 'staff_suggestion', 'complaint', 'other'
  )),
  category TEXT NOT NULL DEFAULT 'operations' CHECK (category IN (
    'service_delivery', 'safety', 'compliance', 'operations', 'training', 'communication', 'other'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN (
    'identified', 'in_progress', 'implemented', 'reviewed', 'closed'
  )),
  identified_by TEXT NOT NULL,
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  action_plan TEXT,
  responsible_person TEXT,
  target_date DATE,
  completion_date DATE,
  outcome TEXT,
  evidence TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE continuous_improvement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read continuous_improvement" ON continuous_improvement FOR SELECT USING (true);
CREATE POLICY "Service role manage continuous_improvement" ON continuous_improvement FOR ALL USING (true) WITH CHECK (true);

-- ─── RISK REGISTER ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS risk_register (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'operational' CHECK (category IN (
    'operational', 'financial', 'clinical', 'compliance', 'reputational', 'safety', 'environmental', 'other'
  )),
  risk_owner TEXT NOT NULL,
  likelihood TEXT NOT NULL DEFAULT 'possible' CHECK (likelihood IN (
    'rare', 'unlikely', 'possible', 'likely', 'almost_certain'
  )),
  consequence TEXT NOT NULL DEFAULT 'moderate' CHECK (consequence IN (
    'insignificant', 'minor', 'moderate', 'major', 'catastrophic'
  )),
  risk_rating TEXT NOT NULL DEFAULT 'medium' CHECK (risk_rating IN ('low', 'medium', 'high', 'extreme')),
  existing_controls TEXT,
  additional_controls TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'mitigated', 'closed')),
  review_date DATE,
  last_reviewed DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE risk_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read risk_register" ON risk_register FOR SELECT USING (true);
CREATE POLICY "Service role manage risk_register" ON risk_register FOR ALL USING (true) WITH CHECK (true);

-- ─── HAZARD REGISTER ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hazard_register (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  location TEXT,
  hazard_type TEXT NOT NULL DEFAULT 'other' CHECK (hazard_type IN (
    'slip_trip_fall', 'manual_handling', 'chemical', 'electrical', 'biological',
    'ergonomic', 'psychosocial', 'fire', 'vehicle', 'other'
  )),
  reported_by TEXT NOT NULL,
  date_identified DATE NOT NULL DEFAULT CURRENT_DATE,
  risk_level_before TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level_before IN ('low', 'medium', 'high', 'extreme')),
  controls_implemented TEXT,
  risk_level_after TEXT DEFAULT 'low' CHECK (risk_level_after IN ('low', 'medium', 'high', 'extreme')),
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN (
    'identified', 'controls_in_place', 'monitoring', 'resolved', 'closed'
  )),
  responsible_person TEXT,
  review_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hazard_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hazard_register" ON hazard_register FOR SELECT USING (true);
CREATE POLICY "Service role manage hazard_register" ON hazard_register FOR ALL USING (true) WITH CHECK (true);

-- ─── FEEDBACK & COMPLAINTS REGISTER ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feedback_complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'feedback' CHECK (type IN ('feedback', 'complaint', 'compliment', 'suggestion')),
  source TEXT NOT NULL DEFAULT 'participant' CHECK (source IN (
    'participant', 'family', 'staff', 'external', 'anonymous'
  )),
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  lodged_by TEXT NOT NULL,
  lodged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'service_quality' CHECK (category IN (
    'service_quality', 'staff_conduct', 'safety', 'communication', 'facilities', 'policy', 'other'
  )),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received', 'acknowledged', 'investigating', 'resolved', 'closed'
  )),
  assigned_to TEXT,
  resolution TEXT,
  resolution_date DATE,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  satisfaction_outcome TEXT DEFAULT 'na' CHECK (satisfaction_outcome IN (
    'satisfied', 'partially_satisfied', 'unsatisfied', 'na'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read feedback_complaints" ON feedback_complaints FOR SELECT USING (true);
CREATE POLICY "Service role manage feedback_complaints" ON feedback_complaints FOR ALL USING (true) WITH CHECK (true);

-- ─── AUTO-GENERATE REFERENCE NUMBERS ────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_ci_number()
RETURNS TRIGGER AS $$
DECLARE prefix TEXT; seq_num INT;
BEGIN
  prefix := 'CI-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM LENGTH(prefix) + 1) AS INT)), 0) + 1
    INTO seq_num FROM continuous_improvement WHERE reference_number LIKE prefix || '%';
  NEW.reference_number := prefix || LPAD(seq_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ci_number
  BEFORE INSERT ON continuous_improvement
  FOR EACH ROW WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_ci_number();

CREATE OR REPLACE FUNCTION generate_risk_number()
RETURNS TRIGGER AS $$
DECLARE prefix TEXT; seq_num INT;
BEGIN
  prefix := 'RISK-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM LENGTH(prefix) + 1) AS INT)), 0) + 1
    INTO seq_num FROM risk_register WHERE reference_number LIKE prefix || '%';
  NEW.reference_number := prefix || LPAD(seq_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_risk_number
  BEFORE INSERT ON risk_register
  FOR EACH ROW WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_risk_number();

CREATE OR REPLACE FUNCTION generate_hazard_number()
RETURNS TRIGGER AS $$
DECLARE prefix TEXT; seq_num INT;
BEGIN
  prefix := 'HAZ-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM LENGTH(prefix) + 1) AS INT)), 0) + 1
    INTO seq_num FROM hazard_register WHERE reference_number LIKE prefix || '%';
  NEW.reference_number := prefix || LPAD(seq_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hazard_number
  BEFORE INSERT ON hazard_register
  FOR EACH ROW WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_hazard_number();

CREATE OR REPLACE FUNCTION generate_fc_number()
RETURNS TRIGGER AS $$
DECLARE prefix TEXT; seq_num INT;
BEGIN
  prefix := 'FC-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM LENGTH(prefix) + 1) AS INT)), 0) + 1
    INTO seq_num FROM feedback_complaints WHERE reference_number LIKE prefix || '%';
  NEW.reference_number := prefix || LPAD(seq_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fc_number
  BEFORE INSERT ON feedback_complaints
  FOR EACH ROW WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_fc_number();

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ci_status ON continuous_improvement(status);
CREATE INDEX IF NOT EXISTS idx_ci_priority ON continuous_improvement(priority);
CREATE INDEX IF NOT EXISTS idx_ci_date ON continuous_improvement(identified_date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_status ON risk_register(status);
CREATE INDEX IF NOT EXISTS idx_risk_rating ON risk_register(risk_rating);
CREATE INDEX IF NOT EXISTS idx_hazard_status ON hazard_register(status);
CREATE INDEX IF NOT EXISTS idx_hazard_property ON hazard_register(property_id);
CREATE INDEX IF NOT EXISTS idx_hazard_date ON hazard_register(date_identified DESC);
CREATE INDEX IF NOT EXISTS idx_fc_status ON feedback_complaints(status);
CREATE INDEX IF NOT EXISTS idx_fc_type ON feedback_complaints(type);
CREATE INDEX IF NOT EXISTS idx_fc_date ON feedback_complaints(lodged_date DESC);
CREATE INDEX IF NOT EXISTS idx_fc_participant ON feedback_complaints(participant_id);
