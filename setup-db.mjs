import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Create storage bucket
async function createBucket() {
  const { data, error } = await supabase.storage.createBucket('documents', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
  });
  if (error && !error.message.includes('already exists')) {
    console.error('Bucket error:', error);
    return false;
  }
  console.log('✓ Storage bucket ready');
  return true;
}

// Get all files recursively
function getFiles(dir, baseDir = dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({ fullPath, relativePath, name: entry.name, size: fs.statSync(fullPath).size });
    }
  }
  return results;
}

// Map folder to category
function getCategory(relativePath) {
  const parts = relativePath.split('/');
  const folder = parts[0].toLowerCase();
  if (folder.includes('completed')) return 'Completed Forms';
  if (folder.includes('forms')) return 'Forms & Templates';
  if (folder.includes('job')) return 'Job Descriptions';
  if (folder.includes('module 1')) return 'Module 1 - Core';
  if (folder.includes('module 2')) return 'Module 2 - Safety';
  if (folder.includes('module 3')) return 'Module 3 - Supports';
  if (folder.includes('module 4')) return 'Module 4 - Environment';
  if (folder.includes('module 5')) return 'Module 5 - Specialist';
  if (folder.includes('ndis manual') || folder === 'ndis manual') return 'NDIS Manual';
  if (folder.includes('ndis')) return 'NDIS Information';
  if (folder.includes('records')) return 'Records';
  return 'General';
}

function getSubcategory(relativePath) {
  const parts = relativePath.split('/');
  if (parts.length > 2) return parts[1];
  return null;
}

function getFileType(name) {
  const ext = path.extname(name).toLowerCase();
  const map = {
    '.pdf': 'pdf', '.docx': 'docx', '.doc': 'doc',
    '.xlsx': 'xlsx', '.xls': 'xls', '.rtf': 'rtf',
    '.pptx': 'pptx', '.txt': 'txt', '.csv': 'csv',
  };
  return map[ext] || ext.replace('.', '') || 'unknown';
}

function getMimeType(name) {
  const ext = path.extname(name).toLowerCase();
  const map = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.rtf': 'application/rtf',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.DOCX': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[ext] || 'application/octet-stream';
}

async function uploadAll() {
  const filesDir = path.resolve('Files');
  if (!fs.existsSync(filesDir)) {
    console.error('Files directory not found!');
    return;
  }

  await createBucket();

  const files = getFiles(filesDir);
  console.log(`Found ${files.length} files to upload\n`);

  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const storagePath = file.relativePath;
    const fileBuffer = fs.readFileSync(file.fullPath);
    const mimeType = getMimeType(file.name);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`✗ ${storagePath}: ${uploadError.message}`);
      failed++;
      continue;
    }

    // Insert metadata
    const { error: dbError } = await supabase
      .from('documents')
      .upsert({
        name: file.name,
        category: getCategory(file.relativePath),
        subcategory: getSubcategory(file.relativePath),
        file_type: getFileType(file.name),
        size: file.size,
        storage_path: storagePath,
      }, { onConflict: 'storage_path' });

    if (dbError) {
      console.error(`✗ DB ${storagePath}: ${dbError.message}`);
      failed++;
    } else {
      uploaded++;
      process.stdout.write(`\r  Uploaded: ${uploaded}/${files.length}`);
    }
  }

  console.log(`\n\n✓ Done! ${uploaded} uploaded, ${failed} failed`);
}

uploadAll();
