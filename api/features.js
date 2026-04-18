import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

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
      const { title, content, author, priority, target_role, pinned, expires_at } = req.body || {};
      if (!title) return res.status(400).json({ error: 'title required' });
      const { data, error } = await supabase.from('announcements').insert({
        title, content: content || '', author: author || 'Admin', priority: priority || 'normal',
        target_role: target_role || 'all', pinned: pinned || false, expires_at: expires_at || null,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (action === 'update-announcement' && method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const allowed = ['title', 'content', 'author', 'priority', 'target_role', 'pinned', 'expires_at'];
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

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Features handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
