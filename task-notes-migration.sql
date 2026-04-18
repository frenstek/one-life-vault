-- Task Notes table (for task board note comments)
CREATE TABLE IF NOT EXISTS task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by task
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON task_notes(task_id);

-- RLS
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to task_notes" ON task_notes
  FOR ALL USING (true) WITH CHECK (true);
