-- ============================================================================
-- Property Profile Migration
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Add profile columns to properties table
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS bedrooms integer,
  ADD COLUMN IF NOT EXISTS bathrooms integer,
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS accessibility text,
  ADD COLUMN IF NOT EXISTS nearby_amenities text;

-- 2. Create property_photos table
CREATE TABLE IF NOT EXISTS property_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  size integer,
  is_cover boolean DEFAULT false,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON property_photos(property_id);

-- 3. Create property-photos storage bucket (public for easy image URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('property-photos', 'property-photos', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policies for property-photos bucket
CREATE POLICY "Allow public read on property-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

CREATE POLICY "Allow service role insert on property-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "Allow service role delete on property-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-photos');

-- 5. RLS on property_photos table
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on property_photos"
  ON property_photos FOR ALL
  USING (true)
  WITH CHECK (true);
