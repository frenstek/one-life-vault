-- Documents metadata table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  file_type TEXT,
  size BIGINT,
  storage_path TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS with public read
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON documents FOR SELECT USING (true);
CREATE POLICY "Service write" ON documents FOR ALL USING (true) WITH CHECK (true);

-- Categories view
CREATE OR REPLACE VIEW categories AS
SELECT DISTINCT category, COUNT(*) as doc_count
FROM documents
GROUP BY category
ORDER BY category;
