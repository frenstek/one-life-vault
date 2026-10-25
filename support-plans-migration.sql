-- Support Plans table for participant support plan management
CREATE TABLE IF NOT EXISTS support_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  plan_start_date DATE,
  plan_end_date DATE,
  plan_review_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'under_review', 'expired')),
  prepared_by TEXT,
  short_term_goals TEXT,
  long_term_goals TEXT,
  daily_support_needs TEXT,
  health_medical TEXT,
  behaviour_support TEXT,
  community_access TEXT,
  communication TEXT,
  risk_management TEXT,
  overnight_support TEXT,
  additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service full access support_plans" ON support_plans;
CREATE POLICY "Service full access support_plans" ON support_plans FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookups by participant
CREATE INDEX IF NOT EXISTS idx_support_plans_participant_id ON support_plans(participant_id);
CREATE INDEX IF NOT EXISTS idx_support_plans_status ON support_plans(status);
