-- ============================================
-- ONBOARDING CHECKLIST TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS onboarding_checklist_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_complete_doc_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE onboarding_checklist_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read onboarding_checklist_templates" ON onboarding_checklist_templates;
CREATE POLICY "Public read onboarding_checklist_templates" ON onboarding_checklist_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write onboarding_checklist_templates" ON onboarding_checklist_templates;
CREATE POLICY "Service write onboarding_checklist_templates" ON onboarding_checklist_templates FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STAFF ONBOARDING PROGRESS
-- ============================================

CREATE TABLE IF NOT EXISTS staff_onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES onboarding_checklist_templates(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, template_id)
);

ALTER TABLE staff_onboarding_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read staff_onboarding_progress" ON staff_onboarding_progress;
CREATE POLICY "Public read staff_onboarding_progress" ON staff_onboarding_progress FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write staff_onboarding_progress" ON staff_onboarding_progress;
CREATE POLICY "Service write staff_onboarding_progress" ON staff_onboarding_progress FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED: Default onboarding checklist items
-- ============================================

-- Documentation & Clearances
INSERT INTO onboarding_checklist_templates (label, category, sort_order, auto_complete_doc_type) VALUES
  ('Police Check submitted', 'Documentation & Clearances', 1, 'Police Check'),
  ('WWCC submitted', 'Documentation & Clearances', 2, 'WWCC'),
  ('NDIS Worker Screening Check submitted', 'Documentation & Clearances', 3, 'NDIS Worker Screening Check'),
  ('First Aid Certificate submitted', 'Documentation & Clearances', 4, 'First Aid Certificate'),
  ('CPR Certificate submitted', 'Documentation & Clearances', 5, 'CPR Certificate'),
  ('Driver''s License submitted', 'Documentation & Clearances', 6, 'Driver''s License'),
  ('COVID-19 Vaccination proof submitted', 'Documentation & Clearances', 7, 'COVID-19 Vaccination')
ON CONFLICT DO NOTHING;

-- Employment & Admin
INSERT INTO onboarding_checklist_templates (label, category, sort_order) VALUES
  ('Employment contract signed', 'Employment & Admin', 10),
  ('Tax File Number declaration completed', 'Employment & Admin', 11),
  ('Superannuation choice form completed', 'Employment & Admin', 12),
  ('Bank details provided', 'Employment & Admin', 13),
  ('Emergency contact details provided', 'Employment & Admin', 14)
ON CONFLICT DO NOTHING;

-- Training & Induction
INSERT INTO onboarding_checklist_templates (label, category, sort_order, auto_complete_doc_type) VALUES
  ('Organisation induction completed', 'Training & Induction', 20, NULL),
  ('NDIS Code of Conduct training', 'Training & Induction', 21, NULL),
  ('Medication administration training', 'Training & Induction', 22, 'Medication Administration Certificate'),
  ('Manual handling training', 'Training & Induction', 23, 'Manual Handling Certificate'),
  ('Fire safety & WHS induction', 'Training & Induction', 24, NULL),
  ('Participant-specific orientation completed', 'Training & Induction', 25, NULL)
ON CONFLICT DO NOTHING;

-- Access & Setup
INSERT INTO onboarding_checklist_templates (label, category, sort_order) VALUES
  ('System account created', 'Access & Setup', 30),
  ('Roster system access set up', 'Access & Setup', 31),
  ('Work mobile/equipment issued', 'Access & Setup', 32)
ON CONFLICT DO NOTHING;
