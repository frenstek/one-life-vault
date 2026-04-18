import { supabase, getPublicUrl } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

// ─── Shared Helpers ──────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 4.5 * 1024 * 1024;

function getFileType(fileName) {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const typeMap = {
    '.pdf': 'pdf',
    '.doc': 'doc',
    '.docx': 'docx',
    '.xls': 'xls',
    '.xlsx': 'xlsx',
    '.ppt': 'ppt',
    '.pptx': 'pptx',
    '.png': 'png',
    '.jpg': 'jpg',
    '.jpeg': 'jpeg',
    '.gif': 'gif',
    '.svg': 'svg',
    '.txt': 'txt',
    '.csv': 'csv',
    '.zip': 'zip',
    '.mp4': 'mp4',
    '.mp3': 'mp3',
  };
  return typeMap[ext] || ext.replace('.', '') || 'unknown';
}

function getMimeType(fileName) {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const mimeMap = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

function sanitizePath(str) {
  return str
    .replace(/[<>:"|?*\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/\/+/g, '/')
    .trim();
}

// ─── GET Handlers ────────────────────────────────────────────────────────────

async function handleList(req, res) {
  const { category, subcategory } = req.query;

  let query = supabase
    .from('documents')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  if (subcategory) {
    query = query.eq('subcategory', subcategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase query error:', error);
    return res.status(500).json({ error: 'Database query failed', details: error.message });
  }

  const documents = (data || []).map((doc) => ({
    ...doc,
    download_url: getPublicUrl(doc.storage_path),
  }));

  res.status(200).json(documents);
}

async function handleFile(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase query error:', error);
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Document not found' });
    }
    return res.status(500).json({ error: 'Database query failed', details: error.message });
  }

  res.status(200).json({
    ...data,
    download_url: getPublicUrl(data.storage_path),
  });
}

async function handleSearch(req, res) {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Missing required parameter: q (search query)' });
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .ilike('name', `%${q.trim()}%`)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Supabase search error:', error);
    return res.status(500).json({ error: 'Search query failed', details: error.message });
  }

  const documents = (data || []).map((doc) => ({
    ...doc,
    download_url: getPublicUrl(doc.storage_path),
  }));

  res.status(200).json(documents);
}

async function handleCategories(req, res) {
  const { data, error } = await supabase
    .from('documents')
    .select('category');

  if (error) {
    console.error('Supabase query error:', error);
    return res.status(500).json({ error: 'Database query failed', details: error.message });
  }

  const counts = {};
  for (const doc of data || []) {
    const cat = doc.category || 'Uncategorized';
    counts[cat] = (counts[cat] || 0) + 1;
  }

  const categories = Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category));

  res.status(200).json(categories);
}

// ─── POST Handlers ───────────────────────────────────────────────────────────

async function handleUpload(req, res) {
  const { fileName, fileData, category, subcategory } = req.body || {};

  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ error: 'Missing required field: fileName' });
  }
  if (!fileData || typeof fileData !== 'string') {
    return res.status(400).json({ error: 'Missing required field: fileData (base64 encoded file content)' });
  }
  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'Missing required field: category' });
  }

  let buffer;
  try {
    buffer = Buffer.from(fileData, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid base64 fileData' });
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return res.status(413).json({
      error: `File too large. Maximum size is ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB (Vercel hobby plan limit). Received ${(buffer.length / (1024 * 1024)).toFixed(2)}MB.`,
    });
  }

  const sanitizedCategory = sanitizePath(category);
  const sanitizedFileName = sanitizePath(fileName);

  if (!sanitizedCategory || !sanitizedFileName) {
    return res.status(400).json({ error: 'Invalid category or fileName after sanitization' });
  }

  const storagePath = `${sanitizedCategory}/${sanitizedFileName}`;
  const contentType = getMimeType(sanitizedFileName);
  const fileType = getFileType(sanitizedFileName);

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError);
    if (uploadError.message?.includes('already exists') || uploadError.statusCode === '409') {
      return res.status(409).json({ error: 'A file with this name already exists in this category', details: uploadError.message });
    }
    return res.status(500).json({ error: 'Failed to upload file to storage', details: uploadError.message });
  }

  const { data: docRecord, error: dbError } = await supabase
    .from('documents')
    .insert({
      name: sanitizedFileName,
      category: sanitizedCategory,
      subcategory: subcategory?.trim() || null,
      file_type: fileType,
      size: buffer.length,
      storage_path: storagePath,
    })
    .select()
    .single();

  if (dbError) {
    console.error('Supabase DB insert error:', dbError);
    await supabase.storage.from('documents').remove([storagePath]);
    return res.status(500).json({ error: 'Failed to save document metadata', details: dbError.message });
  }

  res.status(201).json({
    ...docRecord,
    download_url: getPublicUrl(docRecord.storage_path),
  });
}

async function handleMove(req, res) {
  const { ids, category, subcategory } = req.body || {};

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Missing required field: ids (array of document IDs)' });
  }

  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'Missing required field: category (target category)' });
  }

  const targetCategory = sanitizePath(category);
  if (!targetCategory) {
    return res.status(400).json({ error: 'Invalid category after sanitization' });
  }

  const { data: docs, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .in('id', ids);

  if (fetchError) {
    console.error('Supabase fetch error:', fetchError);
    return res.status(500).json({ error: 'Failed to fetch documents', details: fetchError.message });
  }

  if (!docs || docs.length === 0) {
    return res.status(404).json({ error: 'No documents found for the provided IDs' });
  }

  const results = [];
  const errors = [];

  for (const doc of docs) {
    const newStoragePath = `${targetCategory}/${doc.name}`;

    try {
      if (newStoragePath !== doc.storage_path) {
        const { error: copyError } = await supabase.storage
          .from('documents')
          .copy(doc.storage_path, newStoragePath);

        if (copyError) {
          errors.push({ id: doc.id, name: doc.name, error: `Storage copy failed: ${copyError.message}` });
          continue;
        }

        const { error: deleteError } = await supabase.storage
          .from('documents')
          .remove([doc.storage_path]);

        if (deleteError) {
          console.error(`Storage delete error for ${doc.storage_path}:`, deleteError);
        }
      }

      const { data: updated, error: updateError } = await supabase
        .from('documents')
        .update({
          category: targetCategory,
          subcategory: subcategory !== undefined ? (subcategory?.trim() || null) : doc.subcategory,
          storage_path: newStoragePath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id)
        .select()
        .single();

      if (updateError) {
        errors.push({ id: doc.id, name: doc.name, error: `DB update failed: ${updateError.message}` });
        continue;
      }

      results.push({
        ...updated,
        download_url: getPublicUrl(updated.storage_path),
      });
    } catch (err) {
      errors.push({ id: doc.id, name: doc.name, error: err.message });
    }
  }

  res.status(200).json({
    moved: results.length,
    failed: errors.length,
    documents: results,
    errors: errors.length > 0 ? errors : undefined,
  });
}

async function handleBulkDelete(req, res) {
  const { ids } = req.body || {};

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Missing required field: ids (array of document IDs)' });
  }

  const { data: docs, error: fetchError } = await supabase
    .from('documents')
    .select('id, storage_path, name')
    .in('id', ids);

  if (fetchError) {
    console.error('Supabase fetch error:', fetchError);
    return res.status(500).json({ error: 'Failed to fetch documents', details: fetchError.message });
  }

  if (!docs || docs.length === 0) {
    return res.status(404).json({ error: 'No documents found for the provided IDs' });
  }

  const storagePaths = docs.map((doc) => doc.storage_path);
  const foundIds = docs.map((doc) => doc.id);

  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove(storagePaths);

  if (storageError) {
    console.error('Supabase storage bulk delete error:', storageError);
  }

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .in('id', foundIds);

  if (dbError) {
    console.error('Supabase DB bulk delete error:', dbError);
    return res.status(500).json({ error: 'Failed to delete document records', details: dbError.message });
  }

  const notFound = ids.filter((id) => !foundIds.includes(id));

  res.status(200).json({
    message: `Successfully deleted ${foundIds.length} document(s)`,
    deleted: foundIds.length,
    ids: foundIds,
    not_found: notFound.length > 0 ? notFound : undefined,
  });
}

// ─── PATCH Handler ───────────────────────────────────────────────────────────

async function handleUpdate(req, res) {
  const { id, name, category, subcategory } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  if (name === undefined && category === undefined && subcategory === undefined) {
    return res.status(400).json({ error: 'No fields to update. Provide at least one of: name, category, subcategory' });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Supabase fetch error:', fetchError);
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Document not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch document', details: fetchError.message });
  }

  const newName = name ? sanitizePath(name) : existing.name;
  const newCategory = category ? sanitizePath(category) : existing.category;
  const newSubcategory = subcategory !== undefined ? (subcategory?.trim() || null) : existing.subcategory;
  const newStoragePath = `${newCategory}/${newName}`;

  if (newStoragePath !== existing.storage_path) {
    const { error: copyError } = await supabase.storage
      .from('documents')
      .copy(existing.storage_path, newStoragePath);

    if (copyError) {
      console.error('Supabase storage copy error:', copyError);
      return res.status(500).json({ error: 'Failed to move file in storage', details: copyError.message });
    }

    const { error: deleteError } = await supabase.storage
      .from('documents')
      .remove([existing.storage_path]);

    if (deleteError) {
      console.error('Supabase storage delete error (old file):', deleteError);
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('documents')
    .update({
      name: newName,
      category: newCategory,
      subcategory: newSubcategory,
      storage_path: newStoragePath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Supabase DB update error:', updateError);
    return res.status(500).json({ error: 'Failed to update document metadata', details: updateError.message });
  }

  res.status(200).json({
    ...updated,
    download_url: getPublicUrl(updated.storage_path),
  });
}

// ─── DELETE Handler ──────────────────────────────────────────────────────────

async function handleDelete(req, res) {
  const id = req.query?.id || req.body?.id;

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id (provide as query param or in JSON body)' });
  }

  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('id, storage_path, name')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Supabase fetch error:', fetchError);
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Document not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch document', details: fetchError.message });
  }

  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([doc.storage_path]);

  if (storageError) {
    console.error('Supabase storage delete error:', storageError);
  }

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Supabase DB delete error:', dbError);
    return res.status(500).json({ error: 'Failed to delete document record', details: dbError.message });
  }

  res.status(200).json({
    message: `Document "${doc.name}" deleted successfully`,
    id: doc.id,
  });
}

// ─── Main Router ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const { action } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        case 'list':
          return await handleList(req, res);
        case 'file':
          return await handleFile(req, res);
        case 'search':
          return await handleSearch(req, res);
        case 'categories':
          return await handleCategories(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action query parameter. Valid GET actions: list, file, search, categories' });
      }
    }

    if (req.method === 'POST') {
      const bodyAction = req.body?.action || action;
      switch (bodyAction) {
        case 'upload':
          return await handleUpload(req, res);
        case 'move':
          return await handleMove(req, res);
        case 'bulk-delete':
          return await handleBulkDelete(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action. Valid POST actions: upload, move, bulk-delete' });
      }
    }

    if (req.method === 'PATCH') {
      return await handleUpdate(req, res);
    }

    if (req.method === 'DELETE') {
      return await handleDelete(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Docs handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
