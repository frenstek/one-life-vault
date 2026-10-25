-- Participant movements: hospital stays, respite, leave, etc.
-- One open row (ended_at IS NULL) per participant = where they are right now.
-- Run in the Supabase SQL editor (project czdlemutsimvwfpwylxh) or via the management API.

CREATE TABLE IF NOT EXISTS participant_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  participant_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('hospital', 'respite', 'leave', 'other')),
  location TEXT,                 -- e.g. The Northern Hospital, Epping
  reason TEXT,                   -- why they went
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_return DATE,
  ended_at TIMESTAMPTZ,          -- null = still away
  notes TEXT,
  created_by TEXT,
  ended_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Updates while away (ward changes, discharge plans, calls with the hospital)
CREATE TABLE IF NOT EXISTS participant_movement_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id UUID NOT NULL REFERENCES participant_movements(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_participant ON participant_movements(participant_id);
CREATE INDEX IF NOT EXISTS idx_pm_open ON participant_movements(participant_id) WHERE ended_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pm_one_open ON participant_movements(participant_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pmu_movement ON participant_movement_updates(movement_id);

ALTER TABLE participant_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_movement_updates ENABLE ROW LEVEL SECURITY;
-- API uses the service role key; no anon policies on purpose.
