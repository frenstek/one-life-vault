/*  Rosters — the filing spot for roster documents (Roster of Care, shift
 *  rosters, relief rosters). Admin-only on the server, not just in the
 *  sidebar: every request must carry a Bearer token whose profile role is
 *  admin or owner. Files sit in the PRIVATE `rosters` bucket and are served
 *  through short-lived signed URLs, so a leaked link dies in ten minutes. */
import { supabase } from './_lib/supabase.js';
import { verifyAuth } from './_lib/auth.js';
import { setCors, handleOptions } from './_lib/cors.js';

const BUCKET = 'rosters';
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MIME = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
};

const stripBase64Prefix = (s) => (s.includes(',') ? s.slice(s.indexOf(',') + 1) : s);

async function requireAdmin(req, res) {
  const auth = await verifyAuth(req);
  if (!auth) { res.status(401).json({ error: 'Sign in required' }); return null; }
  const role = auth.profile?.role;
  if (role !== 'admin' && role !== 'owner') { res.status(403).json({ error: 'Rosters are admin only' }); return null; }
  return auth;
}

async function list(req, res) {
  const { participant_id, search } = req.query;
  let q = supabase.from('rosters').select('*').order('period_start', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  if (participant_id) q = q.eq('participant_id', participant_id);
  if (search) q = q.or(`title.ilike.%${search}%,participant_name.ilike.%${search}%,workers.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

async function link(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { data: row, error } = await supabase.from('rosters').select('storage_path, file_name').eq('id', id).single();
  if (error || !row) return res.status(404).json({ error: 'Roster not found' });
  const { data, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(row.storage_path, 600, { download: row.file_name });
  if (sErr) return res.status(500).json({ error: sErr.message });
  res.json({ url: data.signedUrl, file_name: row.file_name });
}

async function upload(req, res, auth) {
  const b = req.body || {};
  if (!b.title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!b.fileData || !b.fileName) return res.status(400).json({ error: 'A file is required' });
  let buffer;
  try { buffer = Buffer.from(stripBase64Prefix(b.fileData), 'base64'); } catch { return res.status(400).json({ error: 'Invalid file data' }); }
  if (buffer.length > MAX_FILE_SIZE) return res.status(413).json({ error: 'File too large (max 15 MB)' });

  const ext = b.fileName.slice(b.fileName.lastIndexOf('.')).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  const folder = b.participant_id || 'general';
  const storagePath = `${folder}/${Date.now()}_${b.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, { contentType, upsert: false });
  if (upErr) return res.status(500).json({ error: `Upload failed: ${upErr.message}` });

  const row = {
    participant_id: b.participant_id || null,
    participant_name: b.participant_name?.trim() || null,
    title: b.title.trim(),
    period_start: b.period_start || null,
    period_end: b.period_end || null,
    version: b.version?.trim() || '1.0',
    workers: b.workers?.trim() || null,
    notes: b.notes?.trim() || null,
    file_name: b.fileName.trim(),
    storage_path: storagePath,
    file_type: ext.replace('.', ''),
    size: buffer.length,
    uploaded_by: auth.profile?.full_name || auth.user.email || 'Admin',
  };
  const { data, error } = await supabase.from('rosters').insert(row).select().single();
  if (error) { await supabase.storage.from(BUCKET).remove([storagePath]); return res.status(500).json({ error: error.message }); }
  res.status(201).json(data);
}

async function update(req, res) {
  const b = req.body || {};
  if (!b.id) return res.status(400).json({ error: 'Missing id' });
  const patch = { updated_at: new Date().toISOString() };
  for (const k of ['title', 'period_start', 'period_end', 'version', 'workers', 'notes', 'participant_id', 'participant_name']) if (k in b) patch[k] = b[k] === '' ? null : b[k];
  const { data, error } = await supabase.from('rosters').update(patch).eq('id', b.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function remove(req, res) {
  const id = req.query?.id || req.body?.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { data: row } = await supabase.from('rosters').select('storage_path, file_name').eq('id', id).single();
  if (!row) return res.status(404).json({ error: 'Roster not found' });
  await supabase.storage.from(BUCKET).remove([row.storage_path]);
  const { error } = await supabase.from('rosters').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: `Deleted ${row.file_name}`, id });
}

export const config = { api: { bodyParser: { sizeLimit: '22mb' } } };

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  try {
    const action = req.query.action || req.body?.action;
    if (req.method === 'GET' && action === 'list') return await list(req, res);
    if (req.method === 'GET' && action === 'link') return await link(req, res);
    if (req.method === 'POST' && action === 'upload') return await upload(req, res, auth);
    if (req.method === 'PATCH') return await update(req, res);
    if (req.method === 'DELETE') return await remove(req, res);
    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
