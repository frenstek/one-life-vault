import { supabase, getPublicUrl } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

// Allow large uploads (base64 inflates ~33%, so 35MB covers 25MB files)
export const config = {
  api: { bodyParser: { sizeLimit: '35mb' } },
};

// ─── Shared Helpers ──────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

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

/** Extract the full folder path from a doc's storage_path (supports nested folders) */
function getFullFolderPath(doc) {
  const catPrefix = doc.category + '/';
  if (!doc.storage_path || !doc.storage_path.startsWith(catPrefix)) return null;
  const rest = doc.storage_path.substring(catPrefix.length);
  const lastSlash = rest.lastIndexOf('/');
  if (lastSlash === -1) return null; // root level: category/filename
  return rest.substring(0, lastSlash); // e.g. "Employment Pack/Templates"
}

// Backwards compat alias
function getDocFolder(doc) {
  const fp = getFullFolderPath(doc);
  if (!fp) return null;
  const idx = fp.indexOf('/');
  return idx === -1 ? fp : fp.substring(0, idx);
}

// ─── GET Handlers ────────────────────────────────────────────────────────────

async function handleList(req, res) {
  const { category, subcategory, folder } = req.query;

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
    return res.status(500).json({ error: 'Database query failed' });
  }

  const all = data || [];

  // Separate folder markers from regular documents
  const allFolderMarkers = all.filter((d) => d.file_type === 'folder');
  const regularDocs = all.filter((d) => d.file_type !== 'folder');

  let documents, folders;

  if (folder) {
    // Show docs directly in this folder (not in subfolders)
    documents = regularDocs.filter((d) => getFullFolderPath(d) === folder);
    // Show immediate subfolder markers: markers whose name starts with "folder/" and has no further "/"
    const prefix = folder + '/';
    folders = allFolderMarkers.filter((f) => {
      if (!f.name.startsWith(prefix)) return false;
      const rest = f.name.substring(prefix.length);
      return rest.length > 0 && !rest.includes('/');
    });
  } else {
    // Root level — show docs without any folder + root-level folder cards
    documents = regularDocs.filter((d) => getFullFolderPath(d) === null);
    folders = allFolderMarkers.filter((f) => !f.name.includes('/'));
  }

  // Count docs per folder recursively (include docs in subfolders)
  const folderCounts = {};
  for (const f of folders) {
    const fPrefix = f.name + '/';
    folderCounts[f.name] = regularDocs.filter((d) => {
      const fp = getFullFolderPath(d);
      return fp === f.name || (fp && fp.startsWith(fPrefix));
    }).length;
  }

  res.status(200).json({
    folders: folders.map((f) => ({
      ...f,
      // Display name is just the last segment
      display_name: f.name.includes('/') ? f.name.substring(f.name.lastIndexOf('/') + 1) : f.name,
      doc_count: folderCounts[f.name] || 0,
    })),
    documents: documents.map((doc) => ({
      ...doc,
      download_url: getPublicUrl(doc.storage_path),
    })),
  });
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
    return res.status(500).json({ error: 'Database query failed' });
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
    .neq('file_type', 'folder')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Supabase search error:', error);
    return res.status(500).json({ error: 'Search query failed' });
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
    .select('category, file_type');

  if (error) {
    console.error('Supabase query error:', error);
    return res.status(500).json({ error: 'Database query failed' });
  }

  const counts = {};
  for (const doc of data || []) {
    if (doc.file_type === 'folder') continue; // Don't count folder markers
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
  const { fileName, fileData, category, subcategory, folder, requestSignedUrl, directUpload, storagePath: preUploadedPath, fileSize: preUploadedSize } = req.body || {};

  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ error: 'Missing required field: fileName' });
  }
  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'Missing required field: category' });
  }

  const sanitizedCategory = sanitizePath(category);
  const sanitizedFileName = sanitizePath(fileName);
  const sanitizedFolder = folder ? sanitizePath(folder) : null;

  // ── Signed URL request: return a signed upload URL for large files ──
  if (requestSignedUrl) {
    const sPath = sanitizedFolder
      ? `${sanitizedCategory}/${sanitizedFolder}/${sanitizedFileName}`
      : `${sanitizedCategory}/${sanitizedFileName}`;

    const { data, error: signErr } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(sPath);

    if (signErr) {
      console.error('Signed upload URL error:', signErr);
      return res.status(500).json({ error: 'Failed to create upload URL: ' + signErr.message });
    }

    return res.status(200).json({ signedUrl: data.signedUrl, storagePath: sPath, token: data.token });
  }

  // ── Direct upload path: file already in Supabase Storage, just register metadata ──
  if (directUpload && preUploadedPath) {
    const contentType = getMimeType(sanitizedFileName);
    const fileType = getFileType(sanitizedFileName);

    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        name: sanitizedFileName,
        storage_path: preUploadedPath,
        category: sanitizedCategory,
        subcategory: subcategory || null,
        folder: sanitizedFolder,
        file_type: fileType,
        content_type: contentType,
        file_size: preUploadedSize || 0,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error (direct upload):', dbError);
      return res.status(500).json({ error: 'Failed to register document' });
    }

    return res.status(201).json({ document: doc, message: 'Document uploaded successfully' });
  }

  if (!fileData || typeof fileData !== 'string') {
    return res.status(400).json({ error: 'Missing required field: fileData (base64 encoded file content)' });
  }

  let buffer;
  try {
    buffer = Buffer.from(fileData, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid base64 fileData' });
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return res.status(413).json({
      error: `File too large. Maximum size is ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB. Received ${(buffer.length / (1024 * 1024)).toFixed(1)}MB.`,
    });
  }

  if (!sanitizedCategory || !sanitizedFileName) {
    return res.status(400).json({ error: 'Invalid category or fileName after sanitization' });
  }

  // Include folder in storage path if specified
  const storagePath = sanitizedFolder
    ? `${sanitizedCategory}/${sanitizedFolder}/${sanitizedFileName}`
    : `${sanitizedCategory}/${sanitizedFileName}`;
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
      return res.status(409).json({ error: 'A file with this name already exists in this location' });
    }
    return res.status(500).json({ error: 'Failed to upload file to storage' });
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
    return res.status(500).json({ error: 'Failed to save document metadata' });
  }

  res.status(201).json({
    ...docRecord,
    download_url: getPublicUrl(docRecord.storage_path),
  });
}

async function handleCreateFolder(req, res) {
  const { name, category, subcategory, parentFolder } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Missing required field: name (folder name)' });
  }
  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'Missing required field: category' });
  }

  const sanitizedName = sanitizePath(name.trim());
  const sanitizedCategory = sanitizePath(category);

  if (!sanitizedName || !sanitizedCategory) {
    return res.status(400).json({ error: 'Invalid folder name or category' });
  }

  // Full folder path: parentFolder/name or just name for root-level
  const fullName = parentFolder ? `${sanitizePath(parentFolder)}/${sanitizedName}` : sanitizedName;

  // Check if folder already exists
  const { data: existing } = await supabase
    .from('documents')
    .select('id')
    .eq('category', sanitizedCategory)
    .eq('subcategory', subcategory?.trim() || null)
    .eq('file_type', 'folder')
    .eq('name', fullName)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: `Folder "${sanitizedName}" already exists` });
  }

  // Use a unique storage_path for the folder marker (no actual file in storage)
  const folderId = crypto.randomUUID();
  const markerPath = `__folders__/${folderId}`;

  const { data: folderRecord, error: dbError } = await supabase
    .from('documents')
    .insert({
      name: fullName,
      category: sanitizedCategory,
      subcategory: subcategory?.trim() || null,
      file_type: 'folder',
      size: 0,
      storage_path: markerPath,
    })
    .select()
    .single();

  if (dbError) {
    console.error('Supabase DB insert error:', dbError);
    return res.status(500).json({ error: 'Failed to create folder' });
  }

  res.status(201).json({ ...folderRecord, display_name: sanitizedName });
}

async function handleDeleteFolder(req, res) {
  const { id } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id (folder ID)' });
  }

  // Get the folder marker
  const { data: folder, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('file_type', 'folder')
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Folder not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch folder' });
  }

  // Find all documents inside this folder (including subfolders)
  const folderPrefix = `${folder.category}/${folder.name}/`;
  const { data: docsInFolder } = await supabase
    .from('documents')
    .select('id, storage_path')
    .eq('category', folder.category)
    .neq('file_type', 'folder')
    .like('storage_path', `${folderPrefix}%`);

  // Check for subfolder markers
  const { data: subfolders } = await supabase
    .from('documents')
    .select('id, name')
    .eq('category', folder.category)
    .eq('file_type', 'folder')
    .like('name', `${folder.name}/%`);

  const totalChildren = (docsInFolder?.length || 0) + (subfolders?.length || 0);
  if (totalChildren > 0) {
    return res.status(400).json({
      error: `Folder "${folder.name.includes('/') ? folder.name.substring(folder.name.lastIndexOf('/') + 1) : folder.name}" is not empty (${docsInFolder?.length || 0} document${(docsInFolder?.length || 0) !== 1 ? 's' : ''}, ${subfolders?.length || 0} subfolder${(subfolders?.length || 0) !== 1 ? 's' : ''}). Move or delete contents first.`,
    });
  }

  // Delete the folder marker from DB (no storage file to delete for markers)
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (dbError) {
    return res.status(500).json({ error: 'Failed to delete folder' });
  }

  // Clean up marker storage path if it exists
  if (folder.storage_path) {
    await supabase.storage.from('documents').remove([folder.storage_path]);
  }

  res.status(200).json({ message: `Folder "${folder.name}" deleted successfully`, id });
}

async function handleRenameFolder(req, res) {
  const { id, newName } = req.body || {};

  if (!id || !newName?.trim()) {
    return res.status(400).json({ error: 'Missing required fields: id, newName' });
  }

  const sanitizedNewName = sanitizePath(newName.trim());

  // Get the folder
  const { data: folder, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('file_type', 'folder')
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') return res.status(404).json({ error: 'Folder not found' });
    return res.status(500).json({ error: 'Failed to fetch folder' });
  }

  // Build new full name preserving parent path
  const parentPath = folder.name.includes('/') ? folder.name.substring(0, folder.name.lastIndexOf('/')) : null;
  const newFullName = parentPath ? `${parentPath}/${sanitizedNewName}` : sanitizedNewName;

  // Check if new name already exists at the same level
  const { data: existing } = await supabase
    .from('documents')
    .select('id')
    .eq('category', folder.category)
    .eq('subcategory', folder.subcategory)
    .eq('file_type', 'folder')
    .eq('name', newFullName)
    .neq('id', id)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: `Folder "${sanitizedNewName}" already exists` });
  }

  const oldStoragePrefix = `${folder.category}/${folder.name}/`;
  const newStoragePrefix = `${folder.category}/${newFullName}/`;

  // Move all documents inside the folder (including nested subfolders' docs)
  const { data: docsInFolder } = await supabase
    .from('documents')
    .select('*')
    .eq('category', folder.category)
    .neq('file_type', 'folder')
    .like('storage_path', `${oldStoragePrefix}%`);

  const errors = [];
  for (const doc of docsInFolder || []) {
    const newPath = newStoragePrefix + doc.storage_path.substring(oldStoragePrefix.length);
    try {
      if (newPath !== doc.storage_path) {
        await supabase.storage.from('documents').copy(doc.storage_path, newPath);
        await supabase.storage.from('documents').remove([doc.storage_path]);
      }
      await supabase
        .from('documents')
        .update({ storage_path: newPath, updated_at: new Date().toISOString() })
        .eq('id', doc.id);
    } catch (e) {
      errors.push({ id: doc.id, error: e.message });
    }
  }

  // Rename all descendant subfolder markers (e.g., "OldName/Sub" → "NewName/Sub")
  const { data: descendantFolders } = await supabase
    .from('documents')
    .select('id, name')
    .eq('category', folder.category)
    .eq('file_type', 'folder')
    .like('name', `${folder.name}/%`);

  for (const sub of descendantFolders || []) {
    const newSubName = newFullName + sub.name.substring(folder.name.length);
    await supabase
      .from('documents')
      .update({ name: newSubName, updated_at: new Date().toISOString() })
      .eq('id', sub.id);
  }

  // Rename the folder marker itself
  await supabase
    .from('documents')
    .update({ name: newFullName, updated_at: new Date().toISOString() })
    .eq('id', id);

  res.status(200).json({
    message: `Folder renamed to "${sanitizedNewName}"`,
    docs_moved: (docsInFolder || []).length - errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

async function handleMove(req, res) {
  const { ids, category, subcategory, folder } = req.body || {};

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

  const targetFolder = folder ? sanitizePath(folder) : null;

  const { data: docs, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .in('id', ids);

  if (fetchError) {
    console.error('Supabase fetch error:', fetchError);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }

  if (!docs || docs.length === 0) {
    return res.status(404).json({ error: 'No documents found for the provided IDs' });
  }

  const results = [];
  const errors = [];

  for (const doc of docs) {
    const newStoragePath = targetFolder
      ? `${targetCategory}/${targetFolder}/${doc.name}`
      : `${targetCategory}/${doc.name}`;

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
    .select('id, storage_path, name, file_type')
    .in('id', ids);

  if (fetchError) {
    console.error('Supabase fetch error:', fetchError);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }

  if (!docs || docs.length === 0) {
    return res.status(404).json({ error: 'No documents found for the provided IDs' });
  }

  // Only delete real files from storage (not folder markers)
  const storagePaths = docs
    .filter((d) => d.file_type !== 'folder')
    .map((d) => d.storage_path);
  const foundIds = docs.map((doc) => doc.id);

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove(storagePaths);

    if (storageError) {
      console.error('Supabase storage bulk delete error:', storageError);
    }
  }

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .in('id', foundIds);

  if (dbError) {
    console.error('Supabase DB bulk delete error:', dbError);
    return res.status(500).json({ error: 'Failed to delete document records' });
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
  const { id, name, category, subcategory, folder } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  if (name === undefined && category === undefined && subcategory === undefined && folder === undefined) {
    return res.status(400).json({ error: 'No fields to update. Provide at least one of: name, category, subcategory, folder' });
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
    return res.status(500).json({ error: 'Failed to fetch document' });
  }

  const newName = name ? sanitizePath(name) : existing.name;
  const newCategory = category ? sanitizePath(category) : existing.category;
  const newSubcategory = subcategory !== undefined ? (subcategory?.trim() || null) : existing.subcategory;

  // Determine new folder
  const currentFolder = getDocFolder(existing);
  const newFolder = folder !== undefined ? (folder || null) : currentFolder;

  const newStoragePath = newFolder
    ? `${newCategory}/${sanitizePath(newFolder)}/${newName}`
    : `${newCategory}/${newName}`;

  if (newStoragePath !== existing.storage_path) {
    const { error: copyError } = await supabase.storage
      .from('documents')
      .copy(existing.storage_path, newStoragePath);

    if (copyError) {
      console.error('Supabase storage copy error:', copyError);
      return res.status(500).json({ error: 'Failed to move file in storage' });
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
    return res.status(500).json({ error: 'Failed to update document metadata' });
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
    .select('id, storage_path, name, file_type')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Supabase fetch error:', fetchError);
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Document not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch document' });
  }

  // Only delete from storage if it's a real file
  if (doc.file_type !== 'folder') {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.storage_path]);

    if (storageError) {
      console.error('Supabase storage delete error:', storageError);
    }
  }

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Supabase DB delete error:', dbError);
    return res.status(500).json({ error: 'Failed to delete document record' });
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
        case 'create-folder':
          return await handleCreateFolder(req, res);
        case 'delete-folder':
          return await handleDeleteFolder(req, res);
        case 'rename-folder':
          return await handleRenameFolder(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action. Valid POST actions: upload, move, bulk-delete, create-folder, delete-folder, rename-folder' });
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
    res.status(500).json({ error: 'Internal server error' });
  }
}
