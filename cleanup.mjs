import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY'
);

async function cleanup() {
  // Fetch all documents
  const { data: docs, error } = await supabase
    .from('documents')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch:', error.message);
    return;
  }

  console.log(`Total documents: ${docs.length}`);

  // Find duplicates by name (keep the one with the most recent updated_at)
  const byName = {};
  for (const doc of docs) {
    const key = doc.name.toLowerCase().trim();
    if (!byName[key]) {
      byName[key] = [];
    }
    byName[key].push(doc);
  }

  const toDelete = [];
  for (const [name, copies] of Object.entries(byName)) {
    if (copies.length > 1) {
      // Sort by updated_at desc, keep the first (newest), delete the rest
      copies.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      const keep = copies[0];
      const dupes = copies.slice(1);
      console.log(`Duplicate: "${copies[0].name}" — keeping 1, deleting ${dupes.length}`);
      toDelete.push(...dupes);
    }
  }

  console.log(`\nFound ${toDelete.length} duplicates to remove`);

  if (toDelete.length === 0) {
    console.log('No duplicates found!');
    return;
  }

  // Delete duplicates from database
  const deleteIds = toDelete.map(d => d.id);
  const { error: delError } = await supabase
    .from('documents')
    .delete()
    .in('id', deleteIds);

  if (delError) {
    console.error('Delete error:', delError.message);
    return;
  }

  // Also clean up storage for deleted docs
  const storagePaths = toDelete.map(d => d.storage_path).filter(Boolean);
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove(storagePaths);

    if (storageError) {
      console.log('Storage cleanup warning:', storageError.message);
    }
  }

  // Verify final count
  const { count } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✓ Removed ${toDelete.length} duplicates`);
  console.log(`✓ Remaining documents: ${count}`);
}

cleanup();
