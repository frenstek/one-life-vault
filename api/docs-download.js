import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

// Map file extensions to MIME types
const MIME_TYPES = {
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

function getMimeType(filename) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export default async function handler(req, res) {
  setCors(res, 'GET, OPTIONS');
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Missing required parameter: path (storage_path)' });
    }

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .download(path);

    if (error) {
      console.error('Supabase storage error:', error);
      return res.status(404).json({ error: 'File not found in storage', details: error.message });
    }

    // Get filename from the path
    const filename = path.split('/').pop();
    const contentType = getMimeType(filename);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'public, max-age=300');

    // Convert Blob to Buffer and send
    const buffer = Buffer.from(await data.arrayBuffer());
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file', details: error.message });
  }
}
