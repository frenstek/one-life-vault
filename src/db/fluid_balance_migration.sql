-- Fluid Balance Chart entries
-- Free-text fluid intake/output tracking for participants

CREATE TABLE IF NOT EXISTS fluid_balance_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  date date NOT NULL,
  time text NOT NULL,              -- HH:MM format
  type text NOT NULL CHECK (type IN ('intake', 'output')),
  description text NOT NULL,       -- Free text: "Water", "Tea", "Urine", etc.
  amount_ml integer,               -- Optional ml amount
  staff_initials text,             -- Who recorded it
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups by participant + date
CREATE INDEX idx_fluid_balance_participant_date
  ON fluid_balance_entries(participant_id, date);

-- Enable RLS
ALTER TABLE fluid_balance_entries ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access"
  ON fluid_balance_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);
