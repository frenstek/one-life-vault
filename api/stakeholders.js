import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

const STAKEHOLDER_TYPES = [
  'Support Coordinator',
  'SDA Provider',
  'Plan Manager',
  'Allied Health',
  'Behaviour Support Practitioner',
  'Occupational Therapist',
  'Speech Pathologist',
  'Psychologist',
  'Physiotherapist',
  'Dietitian',
  'GP / Medical',
  'NDIS LAC',
  'Transport Provider',
  'Equipment Supplier',
  'Other',
];

const ALLOWED_FIELDS = [
  'name',
  'type',
  'organization',
  'contact_name',
  'phone',
  'email',
  'address',
  'website',
  'notes',
  'status',
];

// ─── GET Handlers ────────────────────────────────────────────────────────────

async function handleList(req, res) {
  const { status, type, search } = req.query;

  let query = supabase
    .from('stakeholders')
    .select('*')
    .order('name', { ascending: true });

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;

  if (error) {
    console.error('Stakeholders list error:', error);
    return res.status(500).json({ error: 'Failed to fetch stakeholders', details: error.message });
  }

  res.status(200).json(data || []);
}

async function handleGet(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing required query parameter: id' });
  }

  const { data, error } = await supabase
    .from('stakeholders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Stakeholder not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch stakeholder', details: error.message });
  }

  res.status(200).json(data);
}

async function handleTypes(req, res) {
  res.status(200).json(STAKEHOLDER_TYPES);
}

// ─── POST Handler ────────────────────────────────────────────────────────────

async function handleCreate(req, res) {
  const body = req.body || {};

  if (!body.name || typeof body.name !== 'string') {
    return res.status(400).json({ error: 'Missing required field: name' });
  }
  if (!body.type || typeof body.type !== 'string') {
    return res.status(400).json({ error: 'Missing required field: type' });
  }

  const insertData = { status: 'active' };
  for (const key of ALLOWED_FIELDS) {
    if (key in body && body[key] !== undefined && body[key] !== '') {
      insertData[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  }
  if (insertData.email) insertData.email = insertData.email.toLowerCase();

  const { data, error } = await supabase
    .from('stakeholders')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Stakeholder create error:', error);
    return res.status(500).json({ error: 'Failed to create stakeholder', details: error.message });
  }

  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'create',
    resource_type: 'stakeholder',
    resource_id: data.id,
    resource_name: data.name,
    details: { type: data.type, email: data.email },
  }).catch(() => {});

  res.status(201).json(data);
}

// ─── PATCH Handler ───────────────────────────────────────────────────────────

async function handleUpdate(req, res) {
  const { id, ...fields } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  const updates = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in fields) {
      updates[key] = typeof fields[key] === 'string' ? fields[key].trim() : fields[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  if (updates.email) updates.email = updates.email.toLowerCase();
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('stakeholders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Stakeholder not found' });
    }
    return res.status(500).json({ error: 'Failed to update stakeholder', details: error.message });
  }

  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'update',
    resource_type: 'stakeholder',
    resource_id: data.id,
    resource_name: data.name,
    details: { updated_fields: Object.keys(updates).filter((k) => k !== 'updated_at') },
  }).catch(() => {});

  res.status(200).json(data);
}

// ─── DELETE Handler ──────────────────────────────────────────────────────────

async function handleDelete(req, res) {
  const id = req.query?.id || req.body?.id;

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  const { data: stakeholder, error: fetchError } = await supabase
    .from('stakeholders')
    .select('id, name, type')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Stakeholder not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch stakeholder', details: fetchError.message });
  }

  const { error: deleteError } = await supabase
    .from('stakeholders')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return res.status(500).json({ error: 'Failed to delete stakeholder', details: deleteError.message });
  }

  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'delete',
    resource_type: 'stakeholder',
    resource_id: id,
    resource_name: stakeholder.name,
    details: { type: stakeholder.type },
  }).catch(() => {});

  res.status(200).json({ message: `Stakeholder "${stakeholder.name}" deleted successfully`, id });
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
        case 'get':
          return await handleGet(req, res);
        case 'types':
          return await handleTypes(req, res);
        default:
          return res.status(400).json({ error: 'Invalid action. Valid GET actions: list, get, types' });
      }
    }

    if (req.method === 'POST') return await handleCreate(req, res);
    if (req.method === 'PATCH') return await handleUpdate(req, res);
    if (req.method === 'DELETE') return await handleDelete(req, res);

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Stakeholders handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
