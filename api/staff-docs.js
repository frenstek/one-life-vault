import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';
import { calcDocumentStatus, REQUIRED_DOCUMENT_TYPES } from './_lib/ndis.js';

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel hobby plan limit)

// Derive file_type from extension
function getFileType(fileName) {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const typeMap = {
    '.pdf': 'pdf',
    '.doc': 'doc',
    '.docx': 'docx',
    '.png': 'png',
    '.jpg': 'jpg',
    '.jpeg': 'jpeg',
    '.gif': 'gif',
    '.txt': 'txt',
    '.csv': 'csv',
  };
  return typeMap[ext] || ext.replace('.', '') || 'unknown';
}

// Map file type to MIME type
function getMimeType(fileName) {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const mimeMap = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

// Sanitize file/path names
function sanitizePath(str) {
  return str
    .replace(/[<>:"|?*\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/\/+/g, '/')
    .trim();
}

// Attempt to create the staff-documents storage bucket if it doesn't exist
async function ensureBucket() {
  try {
    const { error } = await supabase.storage.createBucket('staff-documents', {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
    });
    // Ignore error if bucket already exists
    if (error && !error.message?.includes('already exists')) {
      console.warn('Bucket creation warning:', error.message);
    }
  } catch (e) {
    console.warn('Bucket creation attempt failed:', e.message);
  }
}

// ─── POST Handler (Upload) ──────────────────────────────────────────────────

async function handleUpload(req, res) {
  const {
    staffId,
    documentType,
    fileName,
    fileData,
    issueDate,
    expiryDate,
    notes,
  } = req.body || {};

  // Validate required fields
  if (!staffId) {
    return res.status(400).json({ error: 'Missing required field: staffId' });
  }
  if (!documentType || typeof documentType !== 'string') {
    return res.status(400).json({ error: 'Missing required field: documentType' });
  }
  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ error: 'Missing required field: fileName' });
  }
  if (!fileData || typeof fileData !== 'string') {
    return res.status(400).json({ error: 'Missing required field: fileData (base64 encoded)' });
  }

  // Validate document type is a known NDIS type (warn but allow custom)
  if (!REQUIRED_DOCUMENT_TYPES.includes(documentType)) {
    console.warn(`Non-standard document type: "${documentType}"`);
  }

  // Verify staff member exists
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, first_name, last_name')
    .eq('id', staffId)
    .single();

  if (staffError || !staff) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  // Decode base64
  let buffer;
  try {
    buffer = Buffer.from(fileData, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid base64 fileData' });
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return res.status(413).json({
      error: `File too large. Maximum size is ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB. Received ${(buffer.length / (1024 * 1024)).toFixed(2)}MB.`,
    });
  }

  // Build storage path
  const sanitizedDocType = sanitizePath(documentType);
  const sanitizedFileName = sanitizePath(fileName);

  if (!sanitizedDocType || !sanitizedFileName) {
    return res.status(400).json({ error: 'Invalid documentType or fileName after sanitization' });
  }

  const storagePath = `${staffId}/${sanitizedDocType}/${sanitizedFileName}`;
  const contentType = getMimeType(sanitizedFileName);
  const fileType = getFileType(sanitizedFileName);

  // Ensure bucket exists
  await ensureBucket();

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('staff-documents')
    .upload(storagePath, buffer, {
      contentType,
      upsert: true, // Overwrite if re-uploading same document
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return res.status(500).json({ error: 'Failed to upload file to storage', details: uploadError.message });
  }

  // Calculate document status
  const status = calcDocumentStatus(expiryDate || null);

  // Insert into staff_documents table
  const { data: docRecord, error: dbError } = await supabase
    .from('staff_documents')
    .insert({
      staff_id: staffId,
      document_type: documentType,
      document_name: sanitizedFileName,
      storage_path: storagePath,
      file_type: fileType,
      size: buffer.length,
      issue_date: issueDate || null,
      expiry_date: expiryDate || null,
      status,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (dbError) {
    console.error('DB insert error:', dbError);
    // Clean up uploaded file
    await supabase.storage.from('staff-documents').remove([storagePath]);
    return res.status(500).json({ error: 'Failed to save document metadata', details: dbError.message });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'upload_document',
    resource_type: 'staff_document',
    resource_id: docRecord.id,
    resource_name: `${documentType} - ${sanitizedFileName}`,
    details: {
      staff_id: staffId,
      staff_name: `${staff.first_name} ${staff.last_name}`,
      document_type: documentType,
      expiry_date: expiryDate || null,
      status,
    },
  });

  res.status(201).json(docRecord);
}

// ─── DELETE Handler ──────────────────────────────────────────────────────────

async function handleDelete(req, res) {
  const id = req.query?.id || req.body?.id;

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id (provide as query param or in JSON body)' });
  }

  // Fetch document to get storage_path and metadata for logging
  const { data: doc, error: fetchError } = await supabase
    .from('staff_documents')
    .select('id, staff_id, storage_path, document_type, document_name')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Document fetch error:', fetchError);
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Document not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch document', details: fetchError.message });
  }

  // Delete file from storage
  if (doc.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('staff-documents')
      .remove([doc.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }
  }

  // Delete record from staff_documents table
  const { error: dbError } = await supabase
    .from('staff_documents')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('DB delete error:', dbError);
    return res.status(500).json({ error: 'Failed to delete document record', details: dbError.message });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'delete_document',
    resource_type: 'staff_document',
    resource_id: id,
    resource_name: `${doc.document_type} - ${doc.document_name}`,
    details: {
      staff_id: doc.staff_id,
      document_type: doc.document_type,
      storage_path: doc.storage_path,
    },
  });

  res.status(200).json({
    message: `Document "${doc.document_name}" (${doc.document_type}) deleted successfully`,
    id: doc.id,
  });
}

// ─── GET Handler (Download URL) ──────────────────────────────────────────────

async function handleDownload(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing required query parameter: id' });
  }

  // Fetch document record
  const { data: doc, error: fetchError } = await supabase
    .from('staff_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Document fetch error:', fetchError);
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Document not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch document', details: fetchError.message });
  }

  // Create signed URL (1 hour expiry)
  const { data: signedData, error: signError } = await supabase.storage
    .from('staff-documents')
    .createSignedUrl(doc.storage_path, 3600);

  if (signError) {
    console.error('Signed URL error:', signError);
    return res.status(500).json({ error: 'Failed to create download URL', details: signError.message });
  }

  res.status(200).json({ url: signedData.signedUrl, document: doc });
}

// ─── Main Router ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    if (req.method === 'GET') {
      return await handleDownload(req, res);
    }

    if (req.method === 'POST') {
      return await handleUpload(req, res);
    }

    if (req.method === 'DELETE') {
      return await handleDelete(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Staff docs handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
