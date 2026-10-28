-- Missing progress notes check (29 Oct 2026). OPTIONAL: the check works without these columns (every active
-- participant with notes on at least 60% of the last 28 days is watched automatically). Add them to switch a
-- participant on or off by hand or to require more than one note a day.
ALTER TABLE participants ADD COLUMN IF NOT EXISTS notes_expected TEXT DEFAULT 'auto'
  CHECK (notes_expected IN ('auto', 'daily', 'none'));
ALTER TABLE participants ADD COLUMN IF NOT EXISTS notes_min_per_day INTEGER DEFAULT 1;
NOTIFY pgrst, 'reload schema';
