import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get the public URL for a file in the "documents" storage bucket.
 * @param {string} storagePath - The path within the bucket (e.g. "Forms Updated/Form01.Risk Register.xlsx")
 * @returns {string} The full public URL
 */
export function getPublicUrl(storagePath) {
  return `${supabaseUrl}/storage/v1/object/public/documents/${encodeURIComponent(storagePath)}`;
}
