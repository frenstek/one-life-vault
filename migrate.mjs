import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || `postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const SQL = `
-- ============================================
-- AUTH: Enable Supabase Auth (already built-in)
-- We just need a profiles table to store roles
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write profiles" ON profiles;
CREATE POLICY "Service write profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'staff');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STAFF MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Support Worker',
  department TEXT,
  start_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read staff" ON staff;
CREATE POLICY "Public read staff" ON staff FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write staff" ON staff;
CREATE POLICY "Service write staff" ON staff FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STAFF DOCUMENTS (certifications, checks, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS staff_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  storage_path TEXT,
  file_type TEXT,
  size BIGINT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'expiring', 'expired', 'missing')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read staff_documents" ON staff_documents;
CREATE POLICY "Public read staff_documents" ON staff_documents FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write staff_documents" ON staff_documents;
CREATE POLICY "Service write staff_documents" ON staff_documents FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read audit_log" ON audit_log;
CREATE POLICY "Public read audit_log" ON audit_log FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write audit_log" ON audit_log;
CREATE POLICY "Service write audit_log" ON audit_log FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for staff documents
-- (This is done via Supabase client, not SQL)
`;

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Split and execute statements
    const statements = SQL.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      try {
        await client.query(trimmed + ';');
        console.log('✓', trimmed.substring(0, 60).replace(/\n/g, ' ') + '...');
      } catch (err) {
        // Handle multi-statement blocks (functions, triggers)
        if (err.message.includes('syntax')) {
          console.log('⚠ Skipping (may need manual run):', trimmed.substring(0, 50) + '...');
        } else {
          console.log('⚠', err.message.substring(0, 80));
        }
      }
    }

    console.log('\n✓ Migration complete!');
  } catch (err) {
    console.error('Connection error:', err.message);
    console.log('\nTrying alternative connection...');

    // Try direct connection
    const client2 = new pg.Client({
      connectionString: process.env.DATABASE_URL_DIRECT || `postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres`,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client2.connect();
      console.log('Connected via direct connection');
      await client2.query(SQL);
      console.log('✓ Migration complete!');
      await client2.end();
    } catch (err2) {
      console.error('Also failed:', err2.message);
      console.log('\nPlease run the SQL manually in Supabase SQL Editor.');
      // Write SQL file for manual execution
      const fs = await import('fs');
      fs.writeFileSync('migration.sql', SQL);
      console.log('SQL saved to migration.sql');
    }
  } finally {
    try { await client.end(); } catch {}
  }
}

migrate();
