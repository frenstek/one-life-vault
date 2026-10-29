import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';
import { NDIS_SIL_RATES, getRatioMultiplier, getItemForShift, calcShiftHours } from './_lib/ndis-rates.js';

// ═══════════════════════════════════════════════════════════════════════════════
// Consolidated features API — incidents, announcements, messages, registers
// ═══════════════════════════════════════════════════════════════════════════════

const INCIDENT_FIELDS = [
  'title', 'description', 'reported_by', 'incident_date', 'incident_time',
  'location', 'severity', 'category', 'participant_id', 'property_id',
  'immediate_actions', 'witnesses', 'follow_up_required', 'follow_up_actions',
  'follow_up_date',
];

const CI_FIELDS = [
  'title', 'description', 'source', 'category', 'priority', 'identified_by',
  'identified_date', 'action_plan', 'responsible_person', 'target_date',
  'completion_date', 'outcome', 'evidence', 'review_notes',
];

const RISK_FIELDS = [
  'title', 'description', 'category', 'risk_owner', 'likelihood', 'consequence',
  'risk_rating', 'existing_controls', 'additional_controls', 'review_date',
  'last_reviewed', 'notes',
];

const ASSET_FIELDS = [
  'name', 'category', 'description', 'serial_number', 'asset_tag', 'location',
  'assigned_to', 'property_id', 'condition', 'purchase_date', 'purchase_price',
  'supplier', 'warranty_expiry', 'notes', 'image_url',
];

const EXPENSE_FIELDS = [
  'title', 'category', 'amount', 'date', 'paid_by', 'payment_method',
  'receipt_ref', 'supplier', 'property_id', 'description', 'notes', 'image_url',
];

const RECURRING_FIELDS = [
  'title', 'category', 'amount', 'frequency', 'supplier', 'description',
  'next_due', 'payment_method', 'notes',
];

const LEGISLATION_FIELDS = [
  'title', 'legislation_type', 'jurisdiction', 'reference_number', 'administering_body',
  'description', 'relevance', 'compliance_status', 'responsible_person', 'review_date',
  'last_reviewed', 'effective_date', 'link', 'notes',
];

const COI_FIELDS = [
  'declared_by', 'position', 'conflict_type', 'description', 'related_party',
  'relationship', 'date_declared', 'risk_level', 'management_plan', 'mitigation_actions',
  'reviewed_by', 'review_date', 'next_review_date', 'outcome', 'notes',
];

// Upload base64 image to Supabase Storage bucket and return public URL
async function uploadImage(supabase, bucket, folder, imageData) {
  if (!imageData || typeof imageData !== 'string') return null;
  const base64Content = imageData.includes(',') ? imageData.split(',')[1] : imageData;
  const buffer = Buffer.from(base64Content, 'base64');
  if (buffer.length > 5 * 1024 * 1024) throw new Error('Image must be under 5MB');

  // Detect mime type from data URI prefix
  let ext = 'jpg';
  let contentType = 'image/jpeg';
  if (imageData.startsWith('data:image/png')) { ext = 'png'; contentType = 'image/png'; }
  else if (imageData.startsWith('data:image/webp')) { ext = 'webp'; contentType = 'image/webp'; }

  const fileName = `${folder}/${Date.now()}.${ext}`;

  // Ensure bucket exists
  try {
    await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 5 * 1024 * 1024 });
  } catch (_) {}

  const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, { contentType, upsert: false });
  if (error) throw new Error('Image upload failed: ' + error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

const HAZARD_FIELDS = [
  'title', 'description', 'property_id', 'location', 'hazard_type', 'reported_by',
  'date_identified', 'risk_level_before', 'controls_implemented', 'risk_level_after',
  'responsible_person', 'review_date', 'notes',
];

const FC_FIELDS = [
  'title', 'description', 'type', 'source', 'participant_id', 'lodged_by',
  'lodged_date', 'category', 'severity', 'assigned_to', 'resolution',
  'resolution_date', 'follow_up_required', 'follow_up_date', 'follow_up_notes',
  'satisfaction_outcome',
];

const SDS_FIELDS = [
  'product_name', 'manufacturer', 'hazard_classification', 'ghs_pictograms',
  'location_stored', 'first_aid', 'sds_date', 'sds_on_site', 'risk_rating',
  'property_location', 'notes',
];

const INFECTION_FIELDS = [
  'event_date', 'property_location', 'infection_type', 'description',
  'persons_affected', 'number_affected', 'actions_taken', 'ppe_used',
  'cleaning_completed', 'notification_required', 'notified_to', 'notification_date',
  'reported_by', 'outcome', 'resolution_date', 'follow_up_required',
  'follow_up_date', 'follow_up_notes',
];

const PROGRESS_NOTE_FIELDS = [
  'participant_id', 'participant_name', 'note_date', 'shift', 'day_of_week',
  'staff_name', 'content', 'bsl_reading', 'medication_notes', 'concerns',
  'mood', 'sleep_quality', 'meals', 'activities', 'created_by',
];

const SCREENING_FIELDS = [
  'participant_name', 'ndis_number', 'assessor_name',
  'total_core_funding', 'hours_per_week_available', 'current_hours_used',
  'has_sda', 'has_sil',
  'weekly_income', 'weekly_rent',
  'needs_1_to_1', 'needs_overnight', 'needs_24_7',
  'plan_status',
  'number_of_providers', 'total_hours_used', 'willing_to_reduce_hours',
  'notes',
];

const INVOICE_FIELDS = [
  'participant_id', 'invoice_date', 'due_date',
  'service_period_start', 'service_period_end',
  'claim_reference', 'claim_type', 'bill_to', 'bill_to_email',
  'notes', 'status', 'created_by',
];

const MAX_INVOICE_FILE = 4.5 * 1024 * 1024;

function stripBase64Prefix(str) {
  const match = str.match(/^data:[^;]+;base64,/);
  return match ? str.slice(match[0].length) : str;
}

function calculateScreeningScore(data) {
  const flags = [];
  const hoursRemaining = (data.hours_per_week_available || 0) - (data.current_hours_used || 0);

  // 1. Funding
  if (hoursRemaining < 5) flags.push({ section: 'Funding', severity: 'AMBER', message: `Only ${hoursRemaining}h/week remaining` });
  if (!data.has_sda && !data.has_sil && data.needs_24_7) flags.push({ section: 'Funding', severity: 'RED', message: 'No SDA/SIL funding but requires 24/7 support' });
  if (!data.has_sil && data.needs_overnight) flags.push({ section: 'Funding', severity: 'RED', message: 'No SIL funding but requires overnight support' });
  if ((data.total_core_funding || 0) === 0) flags.push({ section: 'Funding', severity: 'RED', message: 'No core funding recorded' });

  // 2. Housing
  if (data.weekly_income && data.weekly_income > 0) {
    const rentRatio = (data.weekly_rent || 0) / data.weekly_income;
    if (rentRatio > 0.75) flags.push({ section: 'Housing', severity: 'RED', message: `Rent ratio ${(rentRatio * 100).toFixed(0)}% — unaffordable` });
    else if (rentRatio >= 0.5) flags.push({ section: 'Housing', severity: 'AMBER', message: `Rent ratio ${(rentRatio * 100).toFixed(0)}% — borderline` });
  }

  // 3. Support
  if (data.needs_24_7 && !data.has_sil) flags.push({ section: 'Support', severity: 'RED', message: 'Needs 24/7 support without SIL funding' });
  if (data.needs_overnight && !data.has_sil && !data.has_sda) flags.push({ section: 'Support', severity: 'AMBER', message: 'Needs overnight support without SIL/SDA' });
  if (data.needs_1_to_1 && hoursRemaining < 10) flags.push({ section: 'Support', severity: 'AMBER', message: '1:1 support needed but limited hours available' });

  // 4. Plan
  if (data.plan_status === 'under_review') flags.push({ section: 'Plan', severity: 'AMBER', message: 'Plan currently under review' });
  if (data.plan_status === 'change_requested') flags.push({ section: 'Plan', severity: 'AMBER', message: 'Plan change has been requested' });

  // 5. Providers
  if ((data.number_of_providers || 0) >= 3 && !data.willing_to_reduce_hours) flags.push({ section: 'Providers', severity: 'AMBER', message: `${data.number_of_providers} existing providers, unwilling to reduce` });
  if ((data.total_hours_used || 0) > (data.hours_per_week_available || 0)) flags.push({ section: 'Providers', severity: 'RED', message: 'Hours used exceed available hours' });

  const result = flags.some((f) => f.severity === 'RED') ? 'RED' : flags.some((f) => f.severity === 'AMBER') ? 'AMBER' : 'GREEN';
  return { result, flags };
}

async function generateROCNumber() {
  const now = new Date();
  const prefix = `ROC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
  const { data } = await supabase.from('roster_of_care')
    .select('roc_number')
    .like('roc_number', `${prefix}%`);
  let maxSeq = 0;
  for (const row of (data || [])) {
    const num = parseInt(row.roc_number.slice(prefix.length), 10);
    if (num > maxSeq) maxSeq = num;
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

// Progress notes created from the Progress Notes page only carry the participant's name; link them to the participant
// record so they show on the participant's profile and in exports (21 Oct 2026: 258 of John Ross's notes were unlinked).
async function participantIdFor(name) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return null;
  const { data } = await supabase.from('participants').select('id, first_name, last_name');
  const hit = (data || []).find(p => `${p.first_name || ''} ${p.last_name || ''}`.trim().toLowerCase() === n);
  return hit ? hit.id : null;
}

function pickFields(body, fields) {
  const obj = {};
  for (const k of fields) {
    if (k in body && body[k] !== undefined && body[k] !== '') {
      obj[k] = typeof body[k] === 'string' ? body[k].trim() : body[k];
    }
  }
  return obj;
}

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const action = req.query.action || (req.body && req.body.action) || null;
    const method = req.method;

    // ─── INCIDENTS ────────────────────────────────────────────────

    if (action === 'incidents' && method === 'GET') {
      const { status, severity, participant_id, property_id } = req.query;
      let q = supabase.from('incidents').select('*').order('incident_date', { ascending: false }).order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      if (severity) q = q.eq('severity', severity);
      if (participant_id) q = q.eq('participant_id', participant_id);
      if (property_id) q = q.eq('property_id', property_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'incident' && method === 'GET') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from('incidents').select('*').eq('id', id).single();
      if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
      return res.json(data);
    }

    if (action === 'incident-stats' && method === 'GET') {
      const { data, error } = await supabase.from('incidents').select('status, severity');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, open: 0, investigating: 0, resolved: 0, closed: 0, critical_open: 0 };
      for (const r of rows) {
        const s = (r.status || '').toLowerCase();
        if (stats[s] !== undefined) stats[s]++;
        if ((s === 'open' || s === 'investigating') && (r.severity === 'critical' || r.severity === 'high')) stats.critical_open++;
      }
      return res.json(stats);
    }

    if (action === 'create-incident' && method === 'POST') {
      const body = req.body || {};
      if (!body.title) return res.status(400).json({ error: 'title required' });
      const insert = { status: 'open' };
      for (const k of INCIDENT_FIELDS) {
        if (k in body && body[k] !== undefined && body[k] !== '') insert[k] = typeof body[k] === 'string' ? body[k].trim() : body[k];
      }
      // Generate incident_number server-side (trigger has search_path issue)
      const now = new Date();
      const prefix = 'INC-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + '-';
      const { data: existing } = await supabase.from('incidents')
        .select('incident_number')
        .like('incident_number', `${prefix}%`);
      let maxSeq = 0;
      if (existing && existing.length > 0) {
        for (const row of existing) {
          const num = parseInt((row.incident_number || '').slice(prefix.length), 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
      insert.incident_number = prefix + String(maxSeq + 1).padStart(3, '0');
      const { data, error } = await supabase.from('incidents').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'update-incident' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = {};
      for (const k of [...INCIDENT_FIELDS, 'status', 'resolved_by', 'resolution_notes']) {
        if (k in fields) updates[k] = typeof fields[k] === 'string' ? fields[k].trim() : fields[k];
      }
      if (updates.status === 'resolved' || updates.status === 'closed') {
        updates.resolved_at = new Date().toISOString();
      }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('incidents').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'delete-incident' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('incidents').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── ANNOUNCEMENTS ───────────────────────────────────────────

    if (action === 'announcements' && method === 'GET') {
      const { target_role } = req.query;
      let q = supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false });
      if (target_role) q = q.eq('target_role', target_role);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'create-announcement' && method === 'POST') {
      const { title, content, author, priority, target_role, pinned, expires_at, image_url } = req.body || {};
      if (!title) return res.status(400).json({ error: 'title required' });
      const { data, error } = await supabase.from('announcements').insert({
        title, content: content || '', author: author || 'Admin', priority: priority || 'normal',
        target_role: target_role || 'all', pinned: pinned || false, expires_at: expires_at || null,
        image_url: image_url || null,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'upload-announcement-image' && method === 'POST') {
      const { fileName, fileData } = req.body || {};
      if (!fileName || typeof fileName !== 'string') return res.status(400).json({ error: 'Missing fileName' });
      if (!fileData || typeof fileData !== 'string') return res.status(400).json({ error: 'Missing fileData (base64)' });

      const raw = fileData.replace(/^data:[^;]+;base64,/, '');
      let buffer;
      try { buffer = Buffer.from(raw, 'base64'); } catch {
        return res.status(400).json({ error: 'Invalid base64 fileData' });
      }

      const MAX_IMG = 5 * 1024 * 1024;
      if (buffer.length > MAX_IMG) {
        return res.status(413).json({ error: `File too large. Max ${(MAX_IMG / (1024 * 1024)).toFixed(0)}MB` });
      }

      const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
      const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
      if (!allowedExts.includes(ext)) {
        return res.status(400).json({ error: `Invalid image type. Allowed: ${allowedExts.join(', ')}` });
      }

      const mimeMap = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
      const contentType = mimeMap[ext] || 'application/octet-stream';

      const sanitized = fileName.replace(/[<>:"|?*\\]/g, '').replace(/\.\./g, '').replace(/\/+/g, '/').trim();
      if (!sanitized) return res.status(400).json({ error: 'Invalid fileName' });

      const timestamp = Date.now();
      const storagePath = `announcements/${timestamp}-${sanitized}`;

      // Ensure bucket exists
      try {
        const { error: bucketErr } = await supabase.storage.createBucket('announcement-images', {
          public: true,
          fileSizeLimit: MAX_IMG,
        });
        if (bucketErr && !bucketErr.message?.includes('already exists')) {
          console.warn('Bucket creation warning:', bucketErr.message);
        }
      } catch (e) {
        console.warn('Bucket creation attempt failed:', e.message);
      }

      const { error: uploadError } = await supabase.storage
        .from('announcement-images')
        .upload(storagePath, buffer, { contentType, upsert: false });

      if (uploadError) {
        console.error('Announcement image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }

      const { data: urlData } = supabase.storage.from('announcement-images').getPublicUrl(storagePath);

      return res.status(201).json({ url: urlData?.publicUrl || null, storage_path: storagePath });
    }

    if (action === 'update-announcement' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const allowed = ['title', 'content', 'author', 'priority', 'target_role', 'pinned', 'expires_at', 'image_url'];
      const updates = {};
      for (const k of allowed) { if (k in fields) updates[k] = fields[k]; }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('announcements').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'delete-announcement' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── MESSAGES ────────────────────────────────────────────────

    if (action === 'messages' && method === 'GET') {
      const { recipient_id } = req.query;
      let q = supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (recipient_id) q = q.eq('recipient_id', recipient_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'unread-count' && method === 'GET') {
      const { recipient_id } = req.query;
      if (!recipient_id) return res.status(400).json({ error: 'recipient_id required' });
      const { count, error } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('recipient_id', recipient_id).eq('read', false);
      if (error) throw error;
      return res.json({ unread_count: count || 0 });
    }

    if (action === 'send-message' && method === 'POST') {
      const { sender_id, sender_name, recipient_id, recipient_name, subject, content } = req.body || {};
      if (!content) return res.status(400).json({ error: 'content required' });
      const { data, error } = await supabase.from('messages').insert({
        sender_id, sender_name: sender_name || 'Unknown', recipient_id, recipient_name: recipient_name || 'Unknown',
        subject: subject || null, content, read: false,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'mark-read' && method === 'POST') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from('messages').update({ read: true, read_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'delete-message' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── CONTINUOUS IMPROVEMENT ───────────────────────────────────

    if (action === 'ci-list' && method === 'GET') {
      const { status, priority } = req.query;
      let q = supabase.from('continuous_improvement').select('*').order('identified_date', { ascending: false }).order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      if (priority) q = q.eq('priority', priority);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'ci-stats' && method === 'GET') {
      const { data, error } = await supabase.from('continuous_improvement').select('status, priority');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, identified: 0, in_progress: 0, implemented: 0, reviewed: 0, closed: 0, high_priority: 0 };
      for (const r of rows) {
        if (stats[r.status] !== undefined) stats[r.status]++;
        if ((r.priority === 'high' || r.priority === 'critical') && r.status !== 'closed') stats.high_priority++;
      }
      return res.json(stats);
    }

    if (action === 'ci-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.title) return res.status(400).json({ error: 'title required' });
      const insert = { status: 'identified', ...pickFields(body, CI_FIELDS) };
      const { data, error } = await supabase.from('continuous_improvement').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'ci-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, [...CI_FIELDS, 'status']);
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('continuous_improvement').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'ci-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('continuous_improvement').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── RISK REGISTER ────────────────────────────────────────────

    if (action === 'risk-list' && method === 'GET') {
      const { status, risk_rating } = req.query;
      let q = supabase.from('risk_register').select('*').order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      if (risk_rating) q = q.eq('risk_rating', risk_rating);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'risk-stats' && method === 'GET') {
      const { data, error } = await supabase.from('risk_register').select('status, risk_rating');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, active: 0, monitoring: 0, mitigated: 0, closed: 0, extreme: 0, high: 0 };
      for (const r of rows) {
        if (stats[r.status] !== undefined) stats[r.status]++;
        if (r.risk_rating === 'extreme' && r.status !== 'closed') stats.extreme++;
        if (r.risk_rating === 'high' && r.status !== 'closed') stats.high++;
      }
      return res.json(stats);
    }

    if (action === 'risk-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.title) return res.status(400).json({ error: 'title required' });
      const insert = { status: 'active', ...pickFields(body, RISK_FIELDS) };
      const { data, error } = await supabase.from('risk_register').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'risk-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, [...RISK_FIELDS, 'status']);
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('risk_register').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'risk-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('risk_register').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── POLICY REGISTER ──────────────────────────────────────────

    if (action === 'policy-list' && method === 'GET') {
      const { status, source } = req.query;
      let q = supabase.from('policy_register').select('*').order('ref_number', { ascending: true });
      if (status) q = q.eq('status', status);
      if (source) q = q.eq('source_document', source);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'policy-stats' && method === 'GET') {
      const { data, error } = await supabase.from('policy_register').select('status, source_document');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, reviewed: 0, not_reviewed: 0, requires_update: 0, compliant: 0 };
      const sources = {};
      for (const r of rows) {
        if (stats[r.status] !== undefined) stats[r.status]++;
        sources[r.source_document] = (sources[r.source_document] || 0) + 1;
      }
      return res.json({ ...stats, by_source: sources });
    }

    if (action === 'policy-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.ref_number || !body.policy_name) return res.status(400).json({ error: 'ref_number and policy_name required' });
      const fields = ['ref_number', 'policy_name', 'source_document', 'page_reference', 'ndis_element', 'version', 'original_date', 'review_date', 'reviewed_by', 'status', 'changes_required', 'addendum_ref', 'link', 'notes'];
      const insert = {};
      for (const f of fields) { if (body[f] !== undefined && body[f] !== '') insert[f] = body[f]; }
      const { data, error } = await supabase.from('policy_register').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'policy-update' && method === 'PATCH') {
      const body = req.body || {};
      const { id, ...fields } = body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const allowed = ['ref_number', 'policy_name', 'source_document', 'page_reference', 'ndis_element', 'version', 'original_date', 'review_date', 'reviewed_by', 'status', 'changes_required', 'addendum_ref', 'link', 'notes'];
      const updates = {};
      for (const f of allowed) { if (f in fields) updates[f] = fields[f] || null; }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('policy_register').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'policy-delete' && method === 'DELETE') {
      const body = req.body || {};
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('policy_register').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── CONFLICT OF INTEREST REGISTER ─────────────────────────────

    if (action === 'coi-list' && method === 'GET') {
      const { status } = req.query;
      let q = supabase.from('conflict_of_interest_register').select('*').order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'coi-stats' && method === 'GET') {
      const { data, error } = await supabase.from('conflict_of_interest_register').select('status, risk_level');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, declared: 0, under_review: 0, managed: 0, resolved: 0, closed: 0, high_risk: 0 };
      for (const r of rows) {
        if (stats[r.status] !== undefined) stats[r.status]++;
        if (r.risk_level === 'high' && r.status !== 'closed') stats.high_risk++;
      }
      return res.json(stats);
    }

    if (action === 'coi-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.declared_by) return res.status(400).json({ error: 'declared_by required' });
      if (!body.description) return res.status(400).json({ error: 'description required' });
      const insert = { status: 'declared', ...pickFields(body, COI_FIELDS) };
      const { data, error } = await supabase.from('conflict_of_interest_register').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'coi-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, [...COI_FIELDS, 'status']);
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('conflict_of_interest_register').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'coi-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('conflict_of_interest_register').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── HAZARD REGISTER ──────────────────────────────────────────

    if (action === 'hazard-list' && method === 'GET') {
      const { status, property_id } = req.query;
      let q = supabase.from('hazard_register').select('*').order('date_identified', { ascending: false }).order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      if (property_id) q = q.eq('property_id', property_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'hazard-stats' && method === 'GET') {
      const { data, error } = await supabase.from('hazard_register').select('status, risk_level_before');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, identified: 0, controls_in_place: 0, monitoring: 0, resolved: 0, closed: 0, extreme_open: 0 };
      for (const r of rows) {
        if (stats[r.status] !== undefined) stats[r.status]++;
        if ((r.risk_level_before === 'extreme' || r.risk_level_before === 'high') && r.status !== 'closed' && r.status !== 'resolved') stats.extreme_open++;
      }
      return res.json(stats);
    }

    if (action === 'hazard-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.title) return res.status(400).json({ error: 'title required' });
      const insert = { status: 'identified', ...pickFields(body, HAZARD_FIELDS) };
      const { data, error } = await supabase.from('hazard_register').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'hazard-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, [...HAZARD_FIELDS, 'status']);
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('hazard_register').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'hazard-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('hazard_register').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── FEEDBACK & COMPLAINTS ────────────────────────────────────

    if (action === 'fc-list' && method === 'GET') {
      const { status, type, severity } = req.query;
      let q = supabase.from('feedback_complaints').select('*').order('lodged_date', { ascending: false }).order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      if (type) q = q.eq('type', type);
      if (severity) q = q.eq('severity', severity);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'fc-stats' && method === 'GET') {
      const { data, error } = await supabase.from('feedback_complaints').select('status, type, severity');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, received: 0, acknowledged: 0, investigating: 0, resolved: 0, closed: 0, complaints: 0, open_critical: 0 };
      for (const r of rows) {
        if (stats[r.status] !== undefined) stats[r.status]++;
        if (r.type === 'complaint') stats.complaints++;
        if ((r.severity === 'critical' || r.severity === 'high') && r.status !== 'closed' && r.status !== 'resolved') stats.open_critical++;
      }
      return res.json(stats);
    }

    if (action === 'fc-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.title) return res.status(400).json({ error: 'title required' });
      const insert = { status: 'received', ...pickFields(body, FC_FIELDS) };
      const { data, error } = await supabase.from('feedback_complaints').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'fc-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, [...FC_FIELDS, 'status']);
      if (updates.status === 'resolved' || updates.status === 'closed') {
        if (!updates.resolution_date) updates.resolution_date = new Date().toISOString().split('T')[0];
      }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('feedback_complaints').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'fc-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('feedback_complaints').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── SDS REGISTER ────────────────────────────────────────────────

    if (action === 'sds-list' && method === 'GET') {
      const { risk_rating } = req.query;
      let q = supabase.from('sds_register').select('*').order('product_name', { ascending: true });
      if (risk_rating) q = q.eq('risk_rating', risk_rating);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'sds-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.product_name) return res.status(400).json({ error: 'product_name required' });
      const insert = pickFields(body, SDS_FIELDS);
      const { data, error } = await supabase.from('sds_register').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'sds-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, SDS_FIELDS);
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('sds_register').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'sds-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('sds_register').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── INFECTION REGISTER ───────────────────────────────────────

    if (action === 'infection-list' && method === 'GET') {
      const { status, infection_type } = req.query;
      let q = supabase.from('infection_register').select('*').order('event_date', { ascending: false }).order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      if (infection_type) q = q.eq('infection_type', infection_type);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'infection-stats' && method === 'GET') {
      const { data, error } = await supabase.from('infection_register').select('status, infection_type');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, active: 0, monitoring: 0, resolved: 0, closed: 0 };
      for (const r of rows) {
        if (stats[r.status] !== undefined) stats[r.status]++;
      }
      return res.json(stats);
    }

    if (action === 'infection-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.description) return res.status(400).json({ error: 'description required' });
      if (!body.reported_by) return res.status(400).json({ error: 'reported_by required' });
      const insert = { status: 'active', ...pickFields(body, INFECTION_FIELDS) };
      // Generate reference number
      const month = new Date().toISOString().slice(0, 7).replace('-', '');
      const { data: existing } = await supabase.from('infection_register').select('reference_number').like('reference_number', `INF-${month}-%`);
      const seq = (existing?.length || 0) + 1;
      insert.reference_number = `INF-${month}-${String(seq).padStart(3, '0')}`;
      const { data, error } = await supabase.from('infection_register').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'infection-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, [...INFECTION_FIELDS, 'status']);
      if (updates.status === 'resolved' || updates.status === 'closed') {
        if (!updates.resolution_date) updates.resolution_date = new Date().toISOString().split('T')[0];
      }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('infection_register').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'infection-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('infection_register').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── SCREENING CHECKLISTS ────────────────────────────────────

    if (action === 'screening-list' && method === 'GET') {
      const { result: filterResult, search } = req.query;
      let q = supabase.from('screening_checklists').select('*').order('created_at', { ascending: false });
      if (filterResult) q = q.eq('result', filterResult);
      if (search) q = q.or(`participant_name.ilike.%${search}%,ndis_number.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'screening-get' && method === 'GET') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from('screening_checklists').select('*').eq('id', id).single();
      if (error) return res.status(404).json({ error: 'Screening not found' });
      return res.json(data);
    }

    if (action === 'screening-stats' && method === 'GET') {
      const { data, error } = await supabase.from('screening_checklists').select('result');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, green: 0, amber: 0, red: 0 };
      for (const r of rows) {
        const key = (r.result || '').toLowerCase();
        if (stats[key] !== undefined) stats[key]++;
      }
      return res.json(stats);
    }

    if (action === 'screening-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.participant_name) return res.status(400).json({ error: 'participant_name required' });
      const insert = pickFields(body, SCREENING_FIELDS);
      const { result, flags } = calculateScreeningScore(body);
      insert.result = result;
      insert.flags = flags;
      if (insert.weekly_income && insert.weekly_income > 0) insert.rent_ratio = insert.weekly_rent / insert.weekly_income;
      const { data, error } = await supabase.from('screening_checklists').insert(insert).select().single();
      if (error) throw error;
      try { await supabase.from('audit_log').insert({ user_email: 'system', action: 'create', resource_type: 'screening_checklist', resource_id: data.id, resource_name: body.participant_name }); } catch (_) {}
      return res.status(201).json(data);
    }

    if (action === 'screening-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data: existing } = await supabase.from('screening_checklists').select('*').eq('id', id).single();
      if (!existing) return res.status(404).json({ error: 'Screening not found' });
      const updates = pickFields(fields, SCREENING_FIELDS);
      const merged = { ...existing, ...updates };
      const { result, flags } = calculateScreeningScore(merged);
      updates.result = result;
      updates.flags = flags;
      updates.updated_at = new Date().toISOString();
      if (merged.weekly_income && merged.weekly_income > 0) updates.rent_ratio = merged.weekly_rent / merged.weekly_income;
      const { data, error } = await supabase.from('screening_checklists').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'screening-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('screening_checklists').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── ROSTER OF CARE ─────────────────────────────────────────

    if (action === 'roc-list' && method === 'GET') {
      const { property_id, status } = req.query;
      let q = supabase
        .from('roster_of_care')
        .select('*, property:properties(id, name)')
        .order('created_at', { ascending: false });
      if (property_id) q = q.eq('property_id', property_id);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      const rocIds = (data || []).map(r => r.id);
      if (rocIds.length > 0) {
        const [{ data: partCounts }, { data: blockCounts }] = await Promise.all([
          supabase.from('roc_participants').select('roster_id').in('roster_id', rocIds),
          supabase.from('roc_time_blocks').select('roster_id').in('roster_id', rocIds),
        ]);
        const partMap = {};
        const blockMap = {};
        (partCounts || []).forEach(r => { partMap[r.roster_id] = (partMap[r.roster_id] || 0) + 1; });
        (blockCounts || []).forEach(r => { blockMap[r.roster_id] = (blockMap[r.roster_id] || 0) + 1; });
        data.forEach(roc => {
          roc.participant_count = partMap[roc.id] || 0;
          roc.time_block_count = blockMap[roc.id] || 0;
        });
      }
      return res.json(data || []);
    }

    if (action === 'roc-get' && method === 'GET') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data: roc, error } = await supabase
        .from('roster_of_care')
        .select('*, property:properties(id, name, address)')
        .eq('id', id)
        .single();
      if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
      const [{ data: participants }, { data: timeBlocks }] = await Promise.all([
        supabase.from('roc_participants')
          .select('*, participant:participants(id, first_name, last_name, ndis_number, funding_ratio)')
          .eq('roster_id', id).order('created_at'),
        supabase.from('roc_time_blocks')
          .select('*').eq('roster_id', id).order('day_of_week').order('start_time'),
      ]);
      const blockIds = (timeBlocks || []).map(b => b.id);
      let staffAssignments = [];
      if (blockIds.length > 0) {
        const { data: assignments } = await supabase
          .from('roc_staff_assignments')
          .select('*, staff:staff(id, first_name, last_name)')
          .in('time_block_id', blockIds);
        staffAssignments = assignments || [];
      }
      const blocksWithStaff = (timeBlocks || []).map(block => ({
        ...block,
        staff_assignments: staffAssignments.filter(a => a.time_block_id === block.id),
      }));
      return res.json({ ...roc, participants: participants || [], time_blocks: blocksWithStaff });
    }

    if (action === 'roc-stats' && method === 'GET') {
      const { data, error } = await supabase.from('roster_of_care').select('status');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, draft: 0, active: 0, archived: 0 };
      for (const r of rows) { if (stats[r.status] !== undefined) stats[r.status]++; }
      return res.json(stats);
    }

    if (action === 'roc-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.name) return res.status(400).json({ error: 'name required' });
      if (!body.property_id) return res.status(400).json({ error: 'property_id required' });
      if (!body.effective_from) return res.status(400).json({ error: 'effective_from required' });
      const ROC_FIELDS = ['property_id', 'name', 'effective_from', 'effective_to', 'status', 'version', 'notes', 'created_by'];
      const insert = pickFields(body, ROC_FIELDS);
      insert.roc_number = await generateROCNumber();
      const { data, error } = await supabase.from('roster_of_care').insert(insert)
        .select('*, property:properties(id, name)').single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'roc-update' && method === 'PATCH') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const ROC_FIELDS = ['property_id', 'name', 'effective_from', 'effective_to', 'status', 'version', 'notes', 'created_by'];
      const updates = pickFields(rest, ROC_FIELDS);
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('roster_of_care').update(updates).eq('id', id)
        .select('*, property:properties(id, name)').single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'roc-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('roster_of_care').delete().eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    if (action === 'roc-add-participant' && method === 'POST') {
      const { roster_id, participant_id, individual_ratio, notes } = req.body || {};
      if (!roster_id || !participant_id) return res.status(400).json({ error: 'roster_id and participant_id required' });
      const insert = { roster_id, participant_id };
      if (individual_ratio) insert.individual_ratio = individual_ratio;
      if (notes) insert.notes = notes.trim();
      const { data, error } = await supabase.from('roc_participants').insert(insert)
        .select('*, participant:participants(id, first_name, last_name, ndis_number, funding_ratio)').single();
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Participant already added' });
        throw error;
      }
      return res.status(201).json(data);
    }

    if (action === 'roc-remove-participant' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('roc_participants').delete().eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    if (action === 'roc-add-time-block' && method === 'POST') {
      const body = req.body || {};
      if (!body.roster_id) return res.status(400).json({ error: 'roster_id required' });
      if (body.day_of_week === undefined) return res.status(400).json({ error: 'day_of_week required' });
      if (!body.start_time || !body.end_time) return res.status(400).json({ error: 'start_time and end_time required' });
      const TB_FIELDS = ['day_of_week', 'start_time', 'end_time', 'support_type', 'support_ratio', 'required_staff', 'notes'];
      const insert = { roster_id: body.roster_id, ...pickFields(body, TB_FIELDS) };
      const { data, error } = await supabase.from('roc_time_blocks').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'roc-update-time-block' && method === 'PATCH') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const TB_FIELDS = ['day_of_week', 'start_time', 'end_time', 'support_type', 'support_ratio', 'required_staff', 'notes'];
      const updates = pickFields(rest, TB_FIELDS);
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('roc_time_blocks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'roc-delete-time-block' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('roc_time_blocks').delete().eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    if (action === 'roc-assign-staff' && method === 'POST') {
      const { time_block_id, staff_id } = req.body || {};
      if (!time_block_id || !staff_id) return res.status(400).json({ error: 'time_block_id and staff_id required' });
      const { data, error } = await supabase.from('roc_staff_assignments')
        .insert({ time_block_id, staff_id })
        .select('*, staff:staff(id, first_name, last_name)').single();
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Staff already assigned' });
        throw error;
      }
      return res.status(201).json(data);
    }

    if (action === 'roc-unassign-staff' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('roc_staff_assignments').delete().eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    if (action === 'roc-duplicate' && method === 'POST') {
      const { id, name, effective_from } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data: original, error: fetchErr } = await supabase.from('roster_of_care').select('*').eq('id', id).single();
      if (fetchErr) throw fetchErr;
      const newRoc = {
        property_id: original.property_id, name: name || `${original.name} (Copy)`,
        effective_from: effective_from || original.effective_from, effective_to: original.effective_to,
        status: 'draft', version: (original.version || 1) + 1, notes: original.notes, created_by: original.created_by,
        roc_number: await generateROCNumber(),
      };
      const { data: created, error: createErr } = await supabase.from('roster_of_care').insert(newRoc)
        .select('*, property:properties(id, name)').single();
      if (createErr) throw createErr;
      // Copy participants
      const { data: origParts } = await supabase.from('roc_participants').select('*').eq('roster_id', id);
      if (origParts && origParts.length > 0) {
        await supabase.from('roc_participants').insert(origParts.map(p => ({
          roster_id: created.id, participant_id: p.participant_id, individual_ratio: p.individual_ratio, notes: p.notes,
        })));
      }
      // Copy time blocks + staff assignments
      const { data: origBlocks } = await supabase.from('roc_time_blocks').select('*').eq('roster_id', id);
      if (origBlocks && origBlocks.length > 0) {
        for (const block of origBlocks) {
          const { data: createdBlock } = await supabase.from('roc_time_blocks').insert({
            roster_id: created.id, day_of_week: block.day_of_week, start_time: block.start_time,
            end_time: block.end_time, support_type: block.support_type, support_ratio: block.support_ratio,
            required_staff: block.required_staff, notes: block.notes,
          }).select().single();
          const { data: origAssignments } = await supabase.from('roc_staff_assignments').select('*').eq('time_block_id', block.id);
          if (origAssignments && origAssignments.length > 0 && createdBlock) {
            await supabase.from('roc_staff_assignments').insert(
              origAssignments.map(a => ({ time_block_id: createdBlock.id, staff_id: a.staff_id }))
            );
          }
        }
      }
      return res.status(201).json(created);
    }

    if (action === 'roc-copy-day' && method === 'POST') {
      const { roster_id, from_day, to_days } = req.body || {};
      if (!roster_id || from_day === undefined || !to_days || !to_days.length) {
        return res.status(400).json({ error: 'roster_id, from_day, and to_days required' });
      }
      const { data: sourceBlocks } = await supabase.from('roc_time_blocks').select('*')
        .eq('roster_id', roster_id).eq('day_of_week', from_day);
      if (!sourceBlocks || sourceBlocks.length === 0) {
        return res.status(400).json({ error: 'No time blocks found for source day' });
      }
      for (const day of to_days) {
        await supabase.from('roc_time_blocks').delete().eq('roster_id', roster_id).eq('day_of_week', day);
        for (const block of sourceBlocks) {
          const { data: created } = await supabase.from('roc_time_blocks').insert({
            roster_id, day_of_week: day, start_time: block.start_time, end_time: block.end_time,
            support_type: block.support_type, support_ratio: block.support_ratio,
            required_staff: block.required_staff, notes: block.notes,
          }).select().single();
          const { data: assignments } = await supabase.from('roc_staff_assignments').select('*').eq('time_block_id', block.id);
          if (assignments && assignments.length > 0 && created) {
            await supabase.from('roc_staff_assignments').insert(
              assignments.map(a => ({ time_block_id: created.id, staff_id: a.staff_id }))
            );
          }
        }
      }
      return res.json({ ok: true, copied: to_days.length });
    }

    // ─── PROGRESS NOTES ──────────────────────────────────────────

    if (action === 'pn-list' && method === 'GET') {
      const { participant_name, participant_id, start_date, end_date, search } = req.query;
      let byName = null;
      if (participant_id) {
        const { data: pp } = await supabase.from('participants').select('first_name, last_name').eq('id', participant_id).single();
        if (pp) byName = `${pp.first_name || ''} ${pp.last_name || ''}`.trim();
      }
      const build = () => {
        let q = supabase.from('progress_notes').select('*').order('note_date', { ascending: false }).order('created_at', { ascending: false }).order('id');
        if (participant_id && byName) q = q.or(`participant_id.eq.${participant_id},and(participant_id.is.null,participant_name.eq."${byName.replace(/"/g, '')}")`);
        else if (participant_id) q = q.eq('participant_id', participant_id);
        else if (participant_name) q = q.ilike('participant_name', `%${participant_name}%`);
        if (start_date) q = q.gte('note_date', start_date);
        if (end_date) q = q.lte('note_date', end_date);
        if (search) q = q.or(`content.ilike.%${search}%,staff_name.ilike.%${search}%,concerns.ilike.%${search}%,medication_notes.ilike.%${search}%`);
        return q;
      };
      const all = [];
      for (let from = 0; from < 50000; from += 1000) {  // the API returns at most 1000 rows per request
        const { data, error } = await build().range(from, from + 999);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      return res.json(all);
    }

    if (action === 'pn-stats' && method === 'GET') {
      // Get active participant names so the count only reflects active ones
      const { data: activeParticipants } = await supabase.from('participants').select('first_name, last_name').eq('status', 'active');
      const activeNames = new Set((activeParticipants || []).map(p => `${p.first_name} ${p.last_name}`));

      const rows = [];
      for (let from = 0; from < 100000; from += 1000) {  // the API returns at most 1000 rows per request (the old "1k notes" cap)
        const { data, error } = await supabase.from('progress_notes').select('participant_name, note_date, mood, concerns').order('id').range(from, from + 999);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      const allParticipantCounts = {};
      const activeParticipantCounts = {};
      let withConcerns = 0;
      const moodCounts = {};
      for (const r of rows) {
        allParticipantCounts[r.participant_name] = (allParticipantCounts[r.participant_name] || 0) + 1;
        if (activeNames.has(r.participant_name)) {
          activeParticipantCounts[r.participant_name] = (activeParticipantCounts[r.participant_name] || 0) + 1;
        }
        if (r.concerns && r.concerns.trim()) withConcerns++;
        if (r.mood) moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
      }
      return res.json({
        total: rows.length,
        participants: Object.keys(activeParticipantCounts).length,
        participant_counts: activeParticipantCounts,
        with_concerns: withConcerns,
        mood_counts: moodCounts,
      });
    }

    if (action === 'pn-missing' && method === 'GET') {
      // MISSING PROGRESS NOTES (29 Oct 2026, Kevin: "flag if they miss a progress note for the day").
      // A participant is WATCHED when participants.notes_expected = 'daily', or (default 'auto') when they had a note on
      // at least 60% of the last 28 days, i.e. a 24/7 SIL participant. 'none' switches a participant off. Every watched
      // participant must have at least notes_min_per_day (default 1) notes on every day up to yesterday; today is
      // reported separately. Dates are Melbourne dates. The two columns are optional (missing-notes-migration.sql).
      const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 60);
      const LOOKBACK = 28;
      const melb = new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Melbourne' }));
      const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const back = (n) => { const d = new Date(melb); d.setDate(d.getDate() - n); return ymd(d); };
      const today = ymd(melb);
      const since = back(LOOKBACK);
      const { data: parts, error: pErr } = await supabase.from('participants').select('*').eq('status', 'active').order('last_name');
      if (pErr) throw pErr;
      const notes = [];
      for (let from = 0; from < 50000; from += 1000) {
        const { data, error } = await supabase.from('progress_notes').select('participant_id, participant_name, note_date, staff_name').gte('note_date', since).order('id').range(from, from + 999);
        if (error) throw error;
        notes.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      const byId = {}, byName = {};
      for (const n of notes) {
        const d = String(n.note_date).slice(0, 10);
        if (n.participant_id) ((byId[n.participant_id] ??= {})[d] ??= []).push(n.staff_name || '');
        else ((byName[(n.participant_name || '').trim().toLowerCase()] ??= {})[d] ??= []).push(n.staff_name || '');
      }
      const lookbackDates = Array.from({ length: LOOKBACK }, (_, i) => back(i + 1));
      const windowDates = Array.from({ length: days }, (_, i) => back(days - i));  // oldest -> yesterday
      const watched = [], notWatched = [];
      const pinnedNames = (process.env.NOTES_WATCH || 'John Eric Ross, Antonino Fiorito').split(',').map((x) => x.trim()).filter(Boolean);
      for (const p of parts || []) {
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        const merged = { ...(byName[name.toLowerCase()] || {}) };
        for (const [d, staff] of Object.entries(byId[p.id] || {})) merged[d] = [...(merged[d] || []), ...staff];
        const count = (d) => (merged[d] || []).length;
        const cfg = p.notes_expected || 'auto';
        const min = Math.max(1, parseInt(p.notes_min_per_day, 10) || 1);
        const notedDays = lookbackDates.filter((d) => count(d) > 0).length;
        const autoDaily = notedDays >= Math.ceil(LOOKBACK * 0.6);
        // PINNED LIST (Kevin, 29 Oct 2026: "it should only show for nino and john for now as darrell is in hospital").
        // While NOTES_WATCH (or this default) names anyone, only those names are watched; clear it to go back to the auto rule.
        const pinned = (process.env.NOTES_WATCH || 'John Eric Ross, Antonino Fiorito').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
        const expected = pinned.length ? pinned.includes(name.toLowerCase()) : (cfg === 'daily' || (cfg !== 'none' && autoDaily));
        const row = { id: p.id, name, setting: cfg, min_per_day: min, noted_days_28: notedDays };
        if (!expected) { notWatched.push(row); continue; }
        const dayRows = windowDates.map((d) => ({ date: d, count: count(d), staff: [...new Set(merged[d] || [])].filter(Boolean) }));
        const missing = dayRows.filter((r) => r.count < min).map((r) => ({ date: r.date, count: r.count, need: min }));
        watched.push({ ...row, days: dayRows, missing, today_count: count(today), last_note: Object.keys(merged).sort().pop() || null });
      }
      const missingTotal = watched.reduce((a, w) => a + w.missing.length, 0);
      return res.json({ generated_at: new Date().toISOString(), today, days, window: windowDates, lookback_days: LOOKBACK, pinned: pinnedNames,
        participants: watched, not_watched: notWatched,
        summary: { watched: watched.length, with_gaps: watched.filter((w) => w.missing.length).length, missing_days: missingTotal, none_today: watched.filter((w) => w.today_count === 0).length } });
    }

    if (action === 'pn-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.participant_name) return res.status(400).json({ error: 'participant_name required' });
      if (!body.content) return res.status(400).json({ error: 'content required' });
      if (!body.note_date) return res.status(400).json({ error: 'note_date required' });
      const insert = pickFields(body, PROGRESS_NOTE_FIELDS);
      if (!insert.participant_id) insert.participant_id = await participantIdFor(insert.participant_name);
      const { data, error } = await supabase.from('progress_notes').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'pn-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, PROGRESS_NOTE_FIELDS);
      if (updates.participant_name && !updates.participant_id) {
        const pid = await participantIdFor(updates.participant_name);
        if (pid) updates.participant_id = pid;
      }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('progress_notes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'pn-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('progress_notes').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    if (action === 'pn-bulk-import' && method === 'POST') {
      const { notes } = req.body || {};
      if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return res.status(400).json({ error: 'notes array required' });
      }
      const rows = [];
      for (const n of notes) {
        const row = pickFields(n, PROGRESS_NOTE_FIELDS);
        if (!row.participant_id) row.participant_id = await participantIdFor(row.participant_name);
        rows.push(row);
      }
      const { data, error } = await supabase.from('progress_notes').insert(rows).select();
      if (error) throw error;
      return res.status(201).json({ imported: (data || []).length, notes: data });
    }

    // ─── INVOICES ──────────────────────────────────────────────────

    if (action === 'inv-list' && method === 'GET') {
      const { status, participant_id } = req.query;
      let q = supabase.from('invoices').select('*, participants(first_name, last_name, ndis_number)').order('invoice_date', { ascending: false });
      if (status) q = q.eq('status', status);
      if (participant_id) q = q.eq('participant_id', participant_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'inv-get' && method === 'GET') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data: inv, error } = await supabase
        .from('invoices')
        .select('*, participants(first_name, last_name, ndis_number, funding_type, plan_manager_name, plan_manager_organisation)')
        .eq('id', id)
        .single();
      if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('sort_order', { ascending: true });
      return res.json({ ...inv, items: items || [] });
    }

    if (action === 'inv-stats' && method === 'GET') {
      const { data, error } = await supabase.from('invoices').select('status, total');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, draft: 0, sent: 0, claimed: 0, paid: 0, rejected: 0, total_value: 0, paid_value: 0, outstanding: 0 };
      for (const r of rows) {
        const s = (r.status || 'draft').toLowerCase();
        if (stats[s] !== undefined) stats[s]++;
        stats.total_value += Number(r.total) || 0;
        if (s === 'paid') stats.paid_value += Number(r.total) || 0;
        if (s === 'sent' || s === 'claimed') stats.outstanding += Number(r.total) || 0;
      }
      return res.json(stats);
    }

    if (action === 'inv-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.participant_id) return res.status(400).json({ error: 'participant_id required' });
      const items = body.items || [];

      // Calculate totals from items
      let subtotal = 0;
      let gst = 0;
      for (const item of items) {
        const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
        subtotal += lineTotal;
        if (item.gst_applicable) gst += lineTotal * 0.1;
      }

      const insert = pickFields(body, INVOICE_FIELDS);
      insert.subtotal = subtotal;
      insert.gst = gst;
      insert.total = subtotal + gst;
      insert.invoice_number = ''; // trigger auto-gen

      const { data: inv, error } = await supabase.from('invoices').insert(insert).select().single();
      if (error) throw error;

      // Insert line items
      if (items.length > 0) {
        const itemRows = items.map((item, idx) => ({
          invoice_id: inv.id,
          support_item_number: item.support_item_number || null,
          support_item_name: item.support_item_name || 'Support Item',
          description: item.description || null,
          service_date: item.service_date || null,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'hours',
          unit_price: Number(item.unit_price) || 0,
          gst_applicable: !!item.gst_applicable,
          line_total: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
          sort_order: idx,
        }));
        const { error: itemErr } = await supabase.from('invoice_items').insert(itemRows);
        if (itemErr) console.error('Error inserting invoice items:', itemErr);
      }

      return res.status(201).json(inv);
    }

    if (action === 'inv-update' && method === 'PATCH') {
      const { id, items, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });

      const updates = pickFields(fields, INVOICE_FIELDS);

      // If items provided, recalculate totals
      if (items) {
        let subtotal = 0;
        let gst = 0;
        for (const item of items) {
          const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
          subtotal += lineTotal;
          if (item.gst_applicable) gst += lineTotal * 0.1;
        }
        updates.subtotal = subtotal;
        updates.gst = gst;
        updates.total = subtotal + gst;

        // Replace all items
        await supabase.from('invoice_items').delete().eq('invoice_id', id);
        if (items.length > 0) {
          const itemRows = items.map((item, idx) => ({
            invoice_id: id,
            support_item_number: item.support_item_number || null,
            support_item_name: item.support_item_name || 'Support Item',
            description: item.description || null,
            service_date: item.service_date || null,
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'hours',
            unit_price: Number(item.unit_price) || 0,
            gst_applicable: !!item.gst_applicable,
            line_total: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
            sort_order: idx,
          }));
          await supabase.from('invoice_items').insert(itemRows);
        }
      }

      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'inv-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      // Items cascade-deleted via FK
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    if (action === 'inv-upload' && method === 'POST') {
      const { invoice_id, fileData, fileName } = req.body || {};
      if (!invoice_id || !fileData || !fileName) {
        return res.status(400).json({ error: 'invoice_id, fileData, fileName required' });
      }
      const raw = stripBase64Prefix(fileData);
      const buffer = Buffer.from(raw, 'base64');
      if (buffer.length > MAX_INVOICE_FILE) {
        return res.status(400).json({ error: 'File too large (max 4.5 MB)' });
      }
      const ext = fileName.split('.').pop() || 'pdf';
      const storagePath = `invoices/${invoice_id}/${Date.now()}-${fileName}`;
      const { error: upErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, { contentType: `application/${ext}`, upsert: true });
      if (upErr) throw upErr;

      const { data, error } = await supabase.from('invoices').update({
        file_name: fileName,
        storage_path: storagePath,
        file_type: ext,
        file_size: buffer.length,
        updated_at: new Date().toISOString(),
      }).eq('id', invoice_id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    // ─── NDIS INVOICE DATA ────────────────────────────────────────

    if (action === 'ndis-invoice-data' && method === 'GET') {
      const { participant_id, start_date, end_date } = req.query;
      if (!participant_id) return res.status(400).json({ error: 'participant_id required' });
      if (!start_date || !end_date) return res.status(400).json({ error: 'start_date and end_date required' });

      // 1. Fetch participant
      const { data: participant, error: pErr } = await supabase
        .from('participants')
        .select('id, first_name, last_name, ndis_number, funding_type, funding_ratio, plan_manager_name, plan_manager_organisation')
        .eq('id', participant_id)
        .single();
      if (pErr) return res.status(pErr.code === 'PGRST116' ? 404 : 500).json({ error: pErr.message });

      const ratio = participant.funding_ratio || '1:3';
      const ratioDivisor = getRatioMultiplier(ratio);

      // 2. Find which property the participant lives at (via property_residents)
      const { data: residentRows } = await supabase
        .from('property_residents')
        .select('property_id, property:properties(id, name, address)')
        .eq('participant_name', `${participant.first_name} ${participant.last_name}`)
        .eq('status', 'active')
        .limit(1);

      // Also try matching by NDIS number
      let property = residentRows?.[0]?.property || null;
      let propertyId = residentRows?.[0]?.property_id || null;

      if (!propertyId) {
        // Try matching by NDIS number in property_residents
        const { data: ndisRows } = await supabase
          .from('property_residents')
          .select('property_id, property:properties(id, name, address)')
          .eq('ndis_number', participant.ndis_number)
          .eq('status', 'active')
          .limit(1);
        if (ndisRows?.[0]) {
          property = ndisRows[0].property;
          propertyId = ndisRows[0].property_id;
        }
      }

      if (!propertyId) {
        return res.status(400).json({ error: 'Participant is not assigned to any property. Please add them as a resident in a property first.' });
      }

      // 3. Fetch shifts for that property in the date range
      const { data: shifts, error: shiftErr } = await supabase
        .from('shift_roster')
        .select('*')
        .eq('property_id', propertyId)
        .gte('shift_date', start_date)
        .lte('shift_date', end_date)
        .in('status', ['completed', 'confirmed', 'scheduled'])
        .order('shift_date')
        .order('start_time');
      if (shiftErr) throw shiftErr;

      if (!shifts || shifts.length === 0) {
        return res.json({
          participant: {
            id: participant.id,
            name: `${participant.first_name} ${participant.last_name}`,
            ndis_number: participant.ndis_number,
            funding_type: participant.funding_type,
            funding_ratio: ratio,
          },
          property: property ? { id: property.id, name: property.name, address: property.address } : null,
          line_items: [],
          subtotal: 0,
          gst: 0,
          total: 0,
          start_date,
          end_date,
        });
      }

      // 4. Build line items — one per shift
      const lineItems = [];
      for (const shift of shifts) {
        const itemCode = getItemForShift(shift.shift_date, shift.shift_type, shift.start_time, shift.end_time);
        const rateInfo = NDIS_SIL_RATES[itemCode];
        if (!rateInfo) continue;

        const isFlat = !!rateInfo.isFlat;
        const unitPrice = Math.round((rateInfo.rate / ratioDivisor) * 100) / 100;
        const qty = isFlat ? 1 : Math.round(calcShiftHours(shift.start_time, shift.end_time) * 100) / 100;
        const total = Math.round(unitPrice * qty * 100) / 100;

        // Format date for description - match existing OLF invoice format
        const shiftDateObj = new Date(shift.shift_date + 'T00:00:00');
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const dateFormatted = `${shiftDateObj.getDate()} ${monthNames[shiftDateObj.getMonth()]} ${shiftDateObj.getFullYear()}`;

        // Format times for description
        function fmtTime(t) {
          if (!t) return '';
          const [h, m] = t.split(':').map(Number);
          const ampm = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 || 12;
          return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
        }

        // Match existing invoice labels: Morning/Afternoon/Sleepover (evening 8PM-10PM is "Afternoon Service")
        let shiftLabel;
        if (isFlat) {
          shiftLabel = 'Sleepover';
        } else {
          const startHour = parseInt((shift.start_time || '0').split(':')[0]);
          if (startHour < 12) shiftLabel = 'Morning';
          else shiftLabel = 'Afternoon';
        }

        const timeRange = isFlat ? ' 10:00PM - 6:00AM' : ` ${fmtTime(shift.start_time)} - ${fmtTime(shift.end_time)}`;
        const hoursLabel = isFlat ? '8 Hours' : `${qty} Hours`;
        const description = `${dateFormatted} - ${shiftLabel} Service${timeRange} (Mon-Sun) (${ratio} Support) (${hoursLabel}) [${itemCode}]`;

        lineItems.push({
          date: shift.shift_date,
          description,
          item_code: itemCode,
          item_name: rateInfo.name,
          qty,
          unit: isFlat ? 'each' : 'hours',
          unit_price: unitPrice,
          total,
        });
      }

      const subtotal = Math.round(lineItems.reduce((sum, li) => sum + li.total, 0) * 100) / 100;

      return res.json({
        participant: {
          id: participant.id,
          name: `${participant.first_name} ${participant.last_name}`,
          ndis_number: participant.ndis_number,
          funding_type: participant.funding_type,
          funding_ratio: ratio,
        },
        property: property ? { id: property.id, name: property.name, address: property.address } : null,
        line_items: lineItems,
        subtotal,
        gst: 0,
        total: subtotal,
        start_date,
        end_date,
      });
    }

    // ─── PAYSLIP DATA ──────────────────────────────────────────────

    if (action === 'payslip-data' && method === 'GET') {
      const { start_date, end_date } = req.query;
      if (!start_date || !end_date) return res.status(400).json({ error: 'start_date and end_date required' });

      // Fetch shifts in date range
      const { data: shifts, error: shiftErr } = await supabase
        .from('shift_roster')
        .select('*')
        .gte('shift_date', start_date)
        .lte('shift_date', end_date)
        .in('status', ['completed', 'confirmed', 'scheduled'])
        .order('shift_date')
        .order('start_time');
      if (shiftErr) throw shiftErr;

      // Fetch active staff
      const { data: staffList, error: staffErr } = await supabase
        .from('staff')
        .select('*')
        .eq('status', 'active')
        .order('last_name')
        .order('first_name');
      if (staffErr) throw staffErr;

      // Group shifts by staff_id
      const shiftsByStaff = {};
      for (const s of (shifts || [])) {
        if (!s.staff_id) continue;
        if (!shiftsByStaff[s.staff_id]) shiftsByStaff[s.staff_id] = [];
        shiftsByStaff[s.staff_id].push(s);
      }

      // Build payslip data for each staff member
      const staffMap = {};
      for (const st of (staffList || [])) {
        staffMap[st.id] = st;
      }

      const result = [];
      const allStaffIds = new Set([...Object.keys(shiftsByStaff)]);

      for (const staffId of allStaffIds) {
        const staff = staffMap[staffId];
        if (!staff) continue;

        const staffShifts = shiftsByStaff[staffId] || [];
        let weekday_hours = 0;
        let saturday_hours = 0;
        let sunday_hours = 0;
        let sleepover_count = 0;

        for (const shift of staffShifts) {
          if (shift.shift_type === 'sleepover') {
            sleepover_count++;
            continue;
          }

          // Parse times
          const [sh, sm] = (shift.start_time || '0:0').split(':').map(Number);
          const [eh, em] = (shift.end_time || '0:0').split(':').map(Number);
          let startMins = sh * 60 + sm;
          let endMins = eh * 60 + em;
          if (endMins <= startMins) endMins += 24 * 60;
          const hours = (endMins - startMins) / 60;

          // Day of week: 0=Sun, 6=Sat
          const dow = new Date(shift.shift_date + 'T00:00:00').getDay();
          if (dow === 0) {
            sunday_hours += hours;
          } else if (dow === 6) {
            saturday_hours += hours;
          } else {
            weekday_hours += hours;
          }
        }

        const rateWD = Number(staff.pay_rate_weekday) || 0;
        const rateSat = Number(staff.pay_rate_saturday) || 0;
        const rateSun = Number(staff.pay_rate_sunday) || 0;
        const rateSleep = Number(staff.sleepover_rate) || 0;

        const weekday_pay = weekday_hours * rateWD;
        const saturday_pay = saturday_hours * rateSat;
        const sunday_pay = sunday_hours * rateSun;
        const sleepover_pay = sleepover_count * rateSleep;
        const total_pay = weekday_pay + saturday_pay + sunday_pay + sleepover_pay;

        result.push({
          staff,
          shifts: staffShifts,
          weekday_hours: Math.round(weekday_hours * 100) / 100,
          saturday_hours: Math.round(saturday_hours * 100) / 100,
          sunday_hours: Math.round(sunday_hours * 100) / 100,
          sleepover_count,
          weekday_pay: Math.round(weekday_pay * 100) / 100,
          saturday_pay: Math.round(saturday_pay * 100) / 100,
          sunday_pay: Math.round(sunday_pay * 100) / 100,
          sleepover_pay: Math.round(sleepover_pay * 100) / 100,
          total_pay: Math.round(total_pay * 100) / 100,
        });
      }

      // Sort by staff last name
      result.sort((a, b) => (a.staff.last_name || '').localeCompare(b.staff.last_name || ''));
      return res.json(result);
    }

    // ─── Role Permissions ──────────────────────────────────────────────────────

    if (action === 'permissions-list' && method === 'GET') {
      const { data, error } = await supabase.from('role_permissions').select('*').order('role').order('feature');
      if (error) return res.status(500).json({ error: error.message });
      // Group by role
      const grouped = {};
      for (const row of data) {
        if (!grouped[row.role]) grouped[row.role] = {};
        grouped[row.role][row.feature] = row.can_access;
      }
      return res.json(grouped);
    }

    if (action === 'permissions-update' && method === 'POST') {
      const { role, feature, can_access } = req.body;
      if (!role || !feature) return res.status(400).json({ error: 'role and feature required' });
      const { data, error } = await supabase.from('role_permissions')
        .upsert({ role, feature, can_access, updated_at: new Date().toISOString() }, { onConflict: 'role,feature' })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }

    // ─── Monitoring Charts ────────────────────────────────────────────────────

    if (action === 'monitoring-charts' && method === 'GET') {
      const pid = req.query.participant_id;
      if (!pid) return res.status(400).json({ error: 'participant_id required' });
      const { data, error } = await supabase.from('participant_monitoring')
        .select('*').eq('participant_id', pid).order('chart_type');
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ charts: data || [] });
    }

    if (action === 'monitoring-toggle' && method === 'POST') {
      const { participant_id, chart_type, enabled } = req.body;
      if (!participant_id || !chart_type) return res.status(400).json({ error: 'participant_id and chart_type required' });
      if (enabled) {
        const { data, error } = await supabase.from('participant_monitoring')
          .upsert({ participant_id, chart_type, enabled: true, updated_at: new Date().toISOString() }, { onConflict: 'participant_id,chart_type' })
          .select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      } else {
        await supabase.from('participant_monitoring').delete().eq('participant_id', participant_id).eq('chart_type', chart_type);
        return res.json({ success: true });
      }
    }

    if (action === 'monitoring-entries' && method === 'GET') {
      const pid = req.query.participant_id;
      const ct = req.query.chart_type;
      const limit = parseInt(req.query.limit) || 60;
      if (!pid || !ct) return res.status(400).json({ error: 'participant_id and chart_type required' });
      const { data, error } = await supabase.from('monitoring_entries')
        .select('*').eq('participant_id', pid).eq('chart_type', ct)
        .order('recorded_at', { ascending: false }).limit(limit);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ entries: data || [] });
    }

    if (action === 'monitoring-add' && method === 'POST') {
      const { participant_id, chart_type, value, value_text, notes, recorded_by, recorded_at, metadata } = req.body;
      if (!participant_id || !chart_type) return res.status(400).json({ error: 'participant_id and chart_type required' });
      const { data, error } = await supabase.from('monitoring_entries')
        .insert({
          participant_id, chart_type,
          value: value != null ? value : null,
          value_text: value_text || null,
          notes: notes || null,
          recorded_by: recorded_by || null,
          recorded_at: recorded_at || new Date().toISOString(),
          metadata: metadata || {},
        }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }

    if (action === 'monitoring-delete' && method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('monitoring_entries').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    // ─── NDIS News Feed ──────────────────────────────────────────────────────

    if (action === 'ndis-news' && method === 'GET') {
      try {
        const rssUrl = 'https://news.google.com/rss/search?q=NDIS+australia&hl=en-AU&gl=AU&ceid=AU:en';
        const response = await fetch(rssUrl);
        const xml = await response.text();

        // Parse RSS XML items
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
          const itemXml = match[1];
          const title = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
          const link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
          const pubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
          const source = (itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';

          // Extract image from media:content, enclosure, or description <img>
          let image = '';
          const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/);
          if (mediaMatch) {
            image = mediaMatch[1];
          } else {
            const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/);
            if (enclosureMatch) {
              image = enclosureMatch[1];
            } else {
              const descImgMatch = itemXml.match(/<description>[\s\S]*?<img[^>]+src=["']([^"']+)["']/);
              if (descImgMatch) {
                image = descImgMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&');
              }
            }
          }

          // Clean CDATA
          const cleanTitle = title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
          const cleanLink = link.replace(/<!\[CDATA\[|\]\]>/g, '');

          // Filter out generic Google News logo — not useful as article thumbnail
          const isGenericLogo = image && (image.includes('lh3.googleusercontent.com') || image.includes('google.com/s2/favicons'));

          if (cleanTitle) {
            items.push({
              title: cleanTitle,
              link: cleanLink,
              pubDate,
              source: source.replace(/<!\[CDATA\[|\]\]>/g, ''),
              timeAgo: pubDate ? getTimeAgo(new Date(pubDate)) : '',
              image: isGenericLogo ? '' : (image || ''),
            });
          }
        }

        // Use source favicon as image instead of unreliable OG images from Google News redirects
        const finalItems = items.map(item => {
          if (!item.image && item.source) {
            // Use Google favicon service for the source domain
            const sourceDomain = item.source.toLowerCase().replace(/\s+/g, '').includes('guardian') ? 'theguardian.com'
              : item.source.toLowerCase().includes('abc') || item.source.toLowerCase().includes('australian broadcasting') ? 'abc.net.au'
              : item.source.toLowerCase().includes('the australian') ? 'theaustralian.com.au'
              : item.source.toLowerCase().includes('sbs') ? 'sbs.com.au'
              : item.source.toLowerCase().includes('9news') ? '9news.com.au'
              : item.source.toLowerCase().includes('7news') ? '7news.com.au'
              : item.source.toLowerCase().includes('smh') || item.source.toLowerCase().includes('sydney morning') ? 'smh.com.au'
              : item.source.toLowerCase().includes('age') ? 'theage.com.au'
              : null;
            if (sourceDomain) {
              item.favicon = `https://www.google.com/s2/favicons?domain=${sourceDomain}&sz=64`;
            }
          }
          return item;
        });

        return res.json({ articles: finalItems, _v: 3 });
      } catch (err) {
        console.error('NDIS news fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch news', articles: [] });
      }
    }

    // ─── ASSET REGISTER ──────────────────────────────────────────

    if (action === 'asset-list' && method === 'GET') {
      const { category, status } = req.query;
      let q = supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (category) q = q.eq('category', category);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'asset-stats' && method === 'GET') {
      const { data, error } = await supabase.from('assets').select('status, purchase_price');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, active: 0, in_repair: 0, disposed: 0, lost: 0, total_value: 0 };
      for (const r of rows) {
        if (stats[r.status] !== undefined) stats[r.status]++;
        if (r.purchase_price) stats.total_value += parseFloat(r.purchase_price);
      }
      return res.json(stats);
    }

    if (action === 'asset-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.name) return res.status(400).json({ error: 'name required' });
      const insert = { status: 'active', ...pickFields(body, ASSET_FIELDS) };
      if (insert.purchase_price) insert.purchase_price = parseFloat(insert.purchase_price);
      if (body.imageData) {
        insert.image_url = await uploadImage(supabase, 'images', 'assets', body.imageData);
      }
      const { data, error } = await supabase.from('assets').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'asset-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, [...ASSET_FIELDS, 'status']);
      if (updates.purchase_price) updates.purchase_price = parseFloat(updates.purchase_price);
      if (fields.imageData) {
        updates.image_url = await uploadImage(supabase, 'images', 'assets', fields.imageData);
      }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('assets').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'asset-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── EXPENSE TRACKER ─────────────────────────────────────────

    if (action === 'expense-list' && method === 'GET') {
      const { category, status, month } = req.query;
      let q = supabase.from('expenses').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
      if (category) q = q.eq('category', category);
      if (status) q = q.eq('status', status);
      if (month) {
        // month format: YYYY-MM
        const start = `${month}-01`;
        const [y, m] = month.split('-').map(Number);
        const end = new Date(y, m, 1).toISOString().split('T')[0];
        q = q.gte('date', start).lt('date', end);
      }
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'expense-stats' && method === 'GET') {
      const { month } = req.query;
      let q = supabase.from('expenses').select('status, amount, date');
      if (month) {
        const start = `${month}-01`;
        const [y, m] = month.split('-').map(Number);
        const end = new Date(y, m, 1).toISOString().split('T')[0];
        q = q.gte('date', start).lt('date', end);
      }
      const { data, error } = await q;
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, total_spent: 0, pending: 0, approved: 0, rejected: 0, reimbursed: 0 };
      for (const r of rows) {
        if (stats[r.status] !== undefined) stats[r.status]++;
        if (r.amount) stats.total_spent += parseFloat(r.amount);
      }
      return res.json(stats);
    }

    if (action === 'expense-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.title) return res.status(400).json({ error: 'title required' });
      if (!body.amount) return res.status(400).json({ error: 'amount required' });
      const insert = { status: 'pending', ...pickFields(body, EXPENSE_FIELDS) };
      if (insert.amount) insert.amount = parseFloat(insert.amount);
      if (!insert.date) insert.date = new Date().toISOString().split('T')[0];
      if (body.imageData) {
        insert.image_url = await uploadImage(supabase, 'images', 'expenses', body.imageData);
      }
      const { data, error } = await supabase.from('expenses').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'expense-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, [...EXPENSE_FIELDS, 'status', 'approved_by', 'approved_at']);
      if (updates.amount) updates.amount = parseFloat(updates.amount);
      if (fields.imageData) {
        updates.image_url = await uploadImage(supabase, 'images', 'expenses', fields.imageData);
      }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'expense-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── LEGISLATION REGISTER ──────────────────────────────────

    if (action === 'legislation-list' && method === 'GET') {
      const { compliance_status, legislation_type, jurisdiction } = req.query;
      let q = supabase.from('legislation_register').select('*').order('title', { ascending: true });
      if (compliance_status) q = q.eq('compliance_status', compliance_status);
      if (legislation_type) q = q.eq('legislation_type', legislation_type);
      if (jurisdiction) q = q.eq('jurisdiction', jurisdiction);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'legislation-stats' && method === 'GET') {
      const { data, error } = await supabase.from('legislation_register').select('compliance_status, status');
      if (error) throw error;
      const rows = data || [];
      const stats = { total: rows.length, compliant: 0, 'partially-compliant': 0, 'non-compliant': 0, 'under-review': 0, active: 0 };
      for (const r of rows) {
        if (r.compliance_status && stats[r.compliance_status] !== undefined) stats[r.compliance_status]++;
        if (r.status === 'active') stats.active++;
      }
      return res.json(stats);
    }

    if (action === 'legislation-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.title) return res.status(400).json({ error: 'title required' });
      const insert = { status: 'active', ...pickFields(body, LEGISLATION_FIELDS) };
      const { data, error } = await supabase.from('legislation_register').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'legislation-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, [...LEGISLATION_FIELDS, 'status']);
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('legislation_register').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'legislation-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('legislation_register').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── ORIENTATION GUIDE ─────────────────────────────────────

    if (action === 'orientation-get' && method === 'GET') {
      const { participant_id } = req.query;
      if (!participant_id) return res.status(400).json({ error: 'participant_id required' });
      const { data, error } = await supabase.from('participant_orientations').select('*').eq('participant_id', participant_id).single();
      if (error && error.code === 'PGRST116') return res.json(null);
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'orientation-save' && method === 'POST') {
      const { participant_id, ...fields } = req.body || {};
      if (!participant_id) return res.status(400).json({ error: 'participant_id required' });
      const allowed = [
        'about', 'likes', 'dislikes', 'upsets', 'calms', 'critical_alerts',
        'daily_routine_morning', 'daily_routine_afternoon', 'daily_routine_evening', 'daily_routine_overnight',
        'medication_management', 'insulin_schedule', 'personal_care', 'meals_nutrition', 'mobility_transfers',
        'communication_style', 'behaviour_guidance', 'behaviour_notes', 'appointments',
        'risk_management', 'emergency_protocols', 'household_duties', 'family_visitors',
        'additional_notes', 'last_updated_by',
      ];
      const insert = { participant_id, updated_at: new Date().toISOString() };
      for (const k of allowed) { if (k in fields) insert[k] = fields[k]; }
      const { data, error } = await supabase.from('participant_orientations').upsert(insert, { onConflict: 'participant_id' }).select().single();
      if (error) throw error;
      return res.json(data);
    }

    // ─── RECURRING EXPENSES ────────────────────────────────────

    if (action === 'recurring-list' && method === 'GET') {
      let q = supabase.from('recurring_expenses').select('*').order('next_due', { ascending: true });
      if (req.query.active_only === 'true') q = q.eq('is_active', true);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'recurring-create' && method === 'POST') {
      const body = req.body || {};
      if (!body.title) return res.status(400).json({ error: 'title required' });
      if (!body.amount) return res.status(400).json({ error: 'amount required' });
      const insert = { is_active: true, ...pickFields(body, RECURRING_FIELDS) };
      if (insert.amount) insert.amount = parseFloat(insert.amount);
      const { data, error } = await supabase.from('recurring_expenses').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'recurring-update' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = pickFields(fields, [...RECURRING_FIELDS, 'is_active']);
      if (updates.amount) updates.amount = parseFloat(updates.amount);
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('recurring_expenses').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'recurring-delete' && method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── TEAM CHAT ──────────────────────────────────────────────

    if (action === 'team-chat' && method === 'GET') {
      const { data, error } = await supabase
        .from('team_chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'send-team-chat' && method === 'POST') {
      const { sender_id, sender_name, sender_role, content } = req.body || {};
      if (!sender_id || !sender_name || !content) {
        return res.status(400).json({ error: 'sender_id, sender_name, and content are required' });
      }
      const { data, error } = await supabase
        .from('team_chat_messages')
        .insert({
          sender_id,
          sender_name,
          sender_role: sender_role || 'staff',
          content: content.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'delete-team-chat' && method === 'POST') {
      const { id, sender_id, role } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });

      // Only allow deleting own messages or if user is admin
      if (role !== 'admin' && sender_id) {
        const { data: msg, error: fetchErr } = await supabase
          .from('team_chat_messages')
          .select('sender_id')
          .eq('id', id)
          .single();
        if (fetchErr) throw fetchErr;
        if (msg.sender_id !== sender_id) {
          return res.status(403).json({ error: 'You can only delete your own messages' });
        }
      }

      const { error } = await supabase.from('team_chat_messages').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── PLATFORM UPDATES (stored in announcements with special priority) ───

    // ─── ACTIVITY FEED ──────────────────────────────────────────

    if (action === 'activity-feed' && method === 'GET') {
      const feed = [];

      // Recent documents
      try {
        const { data: docs } = await supabase
          .from('documents')
          .select('id, name, category, subcategory, file_type, updated_at')
          .order('updated_at', { ascending: false })
          .limit(10);
        if (docs) {
          docs.forEach(d => feed.push({
            id: `doc-${d.id}`,
            type: 'document',
            title: d.name,
            subtitle: [d.category, d.subcategory].filter(Boolean).join(' / '),
            meta: d.file_type?.toUpperCase() || 'FILE',
            author: null,
            timestamp: d.updated_at,
          }));
        }
      } catch {}

      // Announcements (admins use these to post feature updates too)
      try {
        const { data: anns } = await supabase
          .from('announcements')
          .select('id, title, content, priority, author, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        if (anns) {
          anns.forEach(a => feed.push({
            id: `ann-${a.id}`,
            type: 'announcement',
            title: a.title,
            subtitle: a.content,
            meta: a.priority,
            author: a.author,
            timestamp: a.created_at,
          }));
        }
      } catch {}

      // Recent incidents
      try {
        const { data: incidents } = await supabase
          .from('incidents')
          .select('id, title, severity, category, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
        if (incidents) {
          incidents.forEach(i => feed.push({
            id: `inc-${i.id}`,
            type: 'incident',
            title: i.title,
            subtitle: i.category || null,
            meta: i.severity,
            author: null,
            timestamp: i.created_at,
          }));
        }
      } catch {}

      // Sort combined feed by timestamp descending
      feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return res.json(feed.slice(0, 20));
    }

    // ═══════════════════════════════════════════════════════════════════
    // AUDIT CALENDAR
    // ═══════════════════════════════════════════════════════════════════

    if (action === 'audit-list' && method === 'GET') {
      const { data, error } = await supabase
        .from('audit_calendar')
        .select('*')
        .order('event_date', { ascending: true });
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'audit-create' && method === 'POST') {
      const body = req.body || {};
      const fields = ['title', 'event_type', 'event_date', 'end_date', 'status', 'priority', 'assigned_to', 'category', 'description', 'notes', 'recurrence', 'completed_date', 'completed_by'];
      const insert = {};
      for (const f of fields) {
        if (body[f] !== undefined && body[f] !== '') insert[f] = body[f];
      }
      const { data, error } = await supabase.from('audit_calendar').insert(insert).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'audit-update' && method === 'PATCH') {
      const body = req.body || {};
      const { id, ...updates } = body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      // Clean empty strings to null
      for (const k of Object.keys(updates)) {
        if (updates[k] === '') updates[k] = null;
      }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('audit_calendar').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }

    if (action === 'audit-delete' && method === 'DELETE') {
      const body = req.body || {};
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { error } = await supabase.from('audit_calendar').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ─── EXPENSE HUB (Finance Hub synced data) ──────────────────────

    if (action === 'hub-expenses' && method === 'GET') {
      const { month } = req.query;
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('notes', 'Added via Finance Hub')
        .order('created_at', { ascending: false });
      if (month) {
        const [y, m] = month.split('-');
        const start = `${y}-${m}-01`;
        const endDate = new Date(parseInt(y), parseInt(m), 1);
        const end = endDate.toISOString().slice(0, 10);
        query = query.gte('date', start).lt('date', end);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'hub-invoices' && method === 'GET') {
      const { month } = req.query;
      let query = supabase
        .from('supplier_invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (month) {
        const [y, m] = month.split('-');
        const start = `${y}-${m}-01`;
        const endDate = new Date(parseInt(y), parseInt(m), 1);
        const end = endDate.toISOString().slice(0, 10);
        query = query.gte('issue_date', start).lt('issue_date', end);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.json(data || []);
    }

    if (action === 'hub-stats' && method === 'GET') {
      const { month } = req.query;
      // Fetch expenses added via Finance Hub
      let expQuery = supabase
        .from('expenses')
        .select('amount, status')
        .eq('notes', 'Added via Finance Hub');
      if (month) {
        const [y, m] = month.split('-');
        const start = `${y}-${m}-01`;
        const endDate = new Date(parseInt(y), parseInt(m), 1);
        const end = endDate.toISOString().slice(0, 10);
        expQuery = expQuery.gte('date', start).lt('date', end);
      }
      const { data: expenses, error: expErr } = await expQuery;
      if (expErr) throw expErr;

      // Fetch all supplier invoices
      let invQuery = supabase
        .from('supplier_invoices')
        .select('amount, gst_amount, status');
      if (month) {
        const [y, m] = month.split('-');
        const start = `${y}-${m}-01`;
        const endDate = new Date(parseInt(y), parseInt(m), 1);
        const end = endDate.toISOString().slice(0, 10);
        invQuery = invQuery.gte('issue_date', start).lt('issue_date', end);
      }
      const { data: invoices, error: invErr } = await invQuery;
      if (invErr) throw invErr;

      const expRows = expenses || [];
      const invRows = invoices || [];

      const totalExpenses = expRows.length;
      const totalExpenseAmount = expRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
      const totalInvoices = invRows.length;
      const totalInvoiceAmount = invRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
      const pendingExpenses = expRows.filter(r => r.status === 'pending').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
      const unpaidInvoices = invRows.filter(r => r.status === 'unpaid' || r.status === 'overdue').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

      return res.json({
        totalExpenses,
        totalExpenseAmount,
        totalInvoices,
        totalInvoiceAmount,
        pendingAmount: pendingExpenses + unpaidInvoices,
      });
    }

    // ─── EXPENSE HUB: Create supplier invoice (manual upload) ─────
    if (action === 'hub-invoice-create' && method === 'POST') {
      const { invoice_number, supplier, amount, gst_amount, issue_date, due_date, status, category, notes, fileData, fileName } = req.body || {};
      if (!supplier || !amount) {
        return res.status(400).json({ error: 'supplier and amount are required' });
      }

      // Insert the invoice record
      const insert = {
        invoice_number: invoice_number || null,
        supplier,
        amount: parseFloat(amount),
        gst_amount: gst_amount ? parseFloat(gst_amount) : null,
        issue_date: issue_date || new Date().toISOString().slice(0, 10),
        due_date: due_date || null,
        status: status || 'unpaid',
        category: category || null,
        notes: notes || null,
        created_at: new Date().toISOString(),
      };

      const { data: inv, error: invErr } = await supabase
        .from('supplier_invoices')
        .insert(insert)
        .select()
        .single();
      if (invErr) throw invErr;

      // If a file was attached, upload to storage
      if (fileData && fileName) {
        const raw = stripBase64Prefix(fileData);
        const buffer = Buffer.from(raw, 'base64');
        if (buffer.length > MAX_INVOICE_FILE) {
          return res.status(400).json({ error: 'File too large (max 4.5 MB)' });
        }
        const ext = fileName.split('.').pop() || 'pdf';
        const storagePath = `supplier-invoices/${inv.id}/${Date.now()}-${fileName}`;
        const { error: upErr } = await supabase.storage
          .from('documents')
          .upload(storagePath, buffer, { contentType: `application/${ext}`, upsert: true });
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
        const fileUrl = urlData?.publicUrl || null;

        const { data: updated, error: updErr } = await supabase
          .from('supplier_invoices')
          .update({ file_url: fileUrl, file_type: ext })
          .eq('id', inv.id)
          .select()
          .single();
        if (updErr) throw updErr;
        return res.status(201).json(updated);
      }

      return res.status(201).json(inv);
    }

    // ─── EXPENSE HUB: Update supplier invoice ─────────────────────
    if (action === 'hub-invoice-update' && method === 'PATCH') {
      const { id, invoice_number, supplier, amount, gst_amount, issue_date, due_date, status, category, notes, fileData, fileName } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });

      const updates = { updated_at: new Date().toISOString() };
      if (invoice_number !== undefined) updates.invoice_number = invoice_number || null;
      if (supplier !== undefined) updates.supplier = supplier;
      if (amount !== undefined) updates.amount = parseFloat(amount);
      if (gst_amount !== undefined) updates.gst_amount = gst_amount ? parseFloat(gst_amount) : null;
      if (issue_date !== undefined) updates.issue_date = issue_date || null;
      if (due_date !== undefined) updates.due_date = due_date || null;
      if (status !== undefined) updates.status = status;
      if (category !== undefined) updates.category = category || null;
      if (notes !== undefined) updates.notes = notes || null;

      // If a new file was attached, upload to storage
      if (fileData && fileName) {
        const raw = stripBase64Prefix(fileData);
        const buffer = Buffer.from(raw, 'base64');
        if (buffer.length > MAX_INVOICE_FILE) {
          return res.status(400).json({ error: 'File too large (max 4.5 MB)' });
        }
        const ext = fileName.split('.').pop() || 'pdf';
        const storagePath = `supplier-invoices/${id}/${Date.now()}-${fileName}`;
        const { error: upErr } = await supabase.storage
          .from('documents')
          .upload(storagePath, buffer, { contentType: `application/${ext}`, upsert: true });
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
        updates.file_url = urlData?.publicUrl || null;
        updates.file_type = ext;
      }

      const { data, error } = await supabase
        .from('supplier_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }

    // ─── EXPENSE HUB: Delete supplier invoice ──────────────────────
    if (action === 'hub-invoice-delete' && method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('supplier_invoices').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Features handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}
