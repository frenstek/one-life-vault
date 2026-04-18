import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

// ─── Allowed fields for participant inquiry ─────────────────────────────────

const INQUIRY_FIELDS = [
  'first_name', 'last_name', 'date_of_birth', 'ndis_number',
  'phone', 'email', 'location', 'state', 'referral_source', 'referral_contact',
  'service_type', 'support_needs', 'current_living', 'funding_status', 'funding_ratio',
  'inquiry_date', 'status', 'priority', 'assigned_to', 'notes', 'next_follow_up',
];

const PARTICIPANT_FIELDS = [
  'first_name', 'last_name', 'preferred_name', 'date_of_birth', 'ndis_number',
  'phone', 'email', 'location', 'state', 'bio', 'photo_url',
  'plan_start_date', 'plan_end_date', 'funding_type', 'funding_ratio', 'support_level',
  'primary_disability', 'secondary_disability',
  'communication_needs', 'mobility', 'dietary_requirements', 'allergies',
  'medications_summary', 'medicare_number', 'cultural_considerations',
  'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
  'gp_name', 'gp_phone', 'gp_clinic',
  'bsp_name', 'bsp_phone', 'bsp_organisation',
  'support_coordinator_name', 'support_coordinator_phone', 'support_coordinator_organisation',
  'occupational_therapist', 'speech_pathologist', 'psychologist',
  'plan_manager_name', 'plan_manager_organisation',
  'assigned_staff', 'status', 'notes',
];

const DATE_FIELDS = ['date_of_birth', 'plan_start_date', 'plan_end_date', 'next_follow_up', 'inquiry_date'];
const MAX_FILE_SIZE = 4.5 * 1024 * 1024;

function stripBase64Prefix(str) {
  const match = str.match(/^data:[^;]+;base64,/);
  return match ? str.slice(match[0].length) : str;
}

// ═══════════════════════════════════════════════════════════════════════════
// INQUIRY HANDLERS (existing)
// ═══════════════════════════════════════════════════════════════════════════

async function handleInquiryList(req, res) {
  const { status, search } = req.query;
  let query = supabase.from('participant_inquiries').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,ndis_number.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to fetch inquiries', details: error.message });
  res.status(200).json(data || []);
}

async function handleInquiryGet(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { data, error } = await supabase.from('participant_inquiries').select('*').eq('id', id).single();
  if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.code === 'PGRST116' ? 'Not found' : error.message });
  const { data: timelineNotes } = await supabase.from('inquiry_notes').select('*').eq('inquiry_id', id).order('created_at', { ascending: false });
  res.status(200).json({ ...data, timeline_notes: timelineNotes || [] });
}

async function handleInquiryStats(req, res) {
  const { data, error } = await supabase.from('participant_inquiries').select('status');
  if (error) return res.status(500).json({ error: error.message });
  const rows = data || [];
  const stats = { total: rows.length, new: 0, in_progress: 0, accepted: 0, declined: 0, waitlisted: 0 };
  for (const row of rows) {
    const s = (row.status || '').toLowerCase().replace(/\s+/g, '_');
    if (stats[s] !== undefined) stats[s]++;
  }
  res.status(200).json(stats);
}

async function handleInquiryCreate(req, res) {
  const body = req.body || {};
  if (!body.first_name) return res.status(400).json({ error: 'Missing first_name' });
  if (!body.last_name) return res.status(400).json({ error: 'Missing last_name' });
  const insertData = { status: 'New' };
  for (const key of INQUIRY_FIELDS) {
    if (key in body && body[key] !== undefined && body[key] !== '') {
      insertData[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  }
  let { data, error } = await supabase.from('participant_inquiries').insert(insertData).select().single();
  if (error && error.code === '42703') {
    const col = error.message?.match(/column "(\w+)"/)?.[1];
    if (col) { delete insertData[col]; const r = await supabase.from('participant_inquiries').insert(insertData).select().single(); data = r.data; error = r.error; }
  }
  if (error) return res.status(500).json({ error: 'Failed to create inquiry', details: error.message });
  await supabase.from('audit_log').insert({ user_email: 'system', action: 'create', resource_type: 'participant_inquiry', resource_id: data.id, resource_name: `${data.first_name} ${data.last_name}` });
  res.status(201).json(data);
}

async function handleInquiryUpdate(req, res) {
  const { id, ...fields } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const updates = {};
  for (const key of INQUIRY_FIELDS) { if (key in fields) updates[key] = typeof fields[key] === 'string' ? fields[key].trim() : fields[key]; }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields' });
  updates.updated_at = new Date().toISOString();
  let { data, error } = await supabase.from('participant_inquiries').update(updates).eq('id', id).select().single();
  if (error && error.code === '42703') {
    const col = error.message?.match(/column "(\w+)"/)?.[1];
    if (col) { delete updates[col]; const r = await supabase.from('participant_inquiries').update(updates).eq('id', id).select().single(); data = r.data; error = r.error; }
  }
  if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
  await supabase.from('audit_log').insert({ user_email: 'system', action: 'update', resource_type: 'participant_inquiry', resource_id: data.id, resource_name: `${data.first_name} ${data.last_name}`, details: { updated_fields: Object.keys(updates).filter(k => k !== 'updated_at') } });
  res.status(200).json(data);
}

async function handleInquiryDelete(req, res) {
  const id = req.query?.id || req.body?.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { data: inquiry, error: fetchErr } = await supabase.from('participant_inquiries').select('id, first_name, last_name').eq('id', id).single();
  if (fetchErr) return res.status(fetchErr.code === 'PGRST116' ? 404 : 500).json({ error: fetchErr.message });
  const { error } = await supabase.from('participant_inquiries').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  await supabase.from('audit_log').insert({ user_email: 'system', action: 'delete', resource_type: 'participant_inquiry', resource_id: id, resource_name: `${inquiry.first_name} ${inquiry.last_name}` });
  res.status(200).json({ message: `Deleted "${inquiry.first_name} ${inquiry.last_name}"`, id });
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTICIPANT PROFILE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function handleParticipantList(req, res) {
  const { status, search } = req.query;
  let query = supabase.from('participants').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,ndis_number.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to fetch participants', details: error.message });
  res.status(200).json(data || []);
}

async function handleParticipantGet(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const { data: participant, error } = await supabase.from('participants').select('*').eq('id', id).single();
  if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });

  // Fetch notes
  const { data: notes } = await supabase.from('participant_notes').select('*').eq('participant_id', id).order('created_at', { ascending: false });

  // Fetch files
  const { data: rawFiles } = await supabase.from('participant_files').select('*').eq('participant_id', id).order('created_at', { ascending: false });

  // Generate public URLs for files
  const files = (rawFiles || []).map(f => {
    if (f.storage_path) {
      const { data: urlData } = supabase.storage.from('participant-files').getPublicUrl(f.storage_path);
      return { ...f, public_url: urlData?.publicUrl || null };
    }
    return { ...f, public_url: null };
  });

  res.status(200).json({ ...participant, progress_notes: notes || [], files });
}

async function handleParticipantCreate(req, res) {
  const body = req.body || {};
  if (!body.first_name) return res.status(400).json({ error: 'Missing first_name' });
  if (!body.last_name) return res.status(400).json({ error: 'Missing last_name' });

  const insertData = { status: 'active' };
  for (const key of PARTICIPANT_FIELDS) {
    if (key in body && body[key] !== undefined && body[key] !== '') {
      let val = typeof body[key] === 'string' ? body[key].trim() : body[key];
      // Skip empty date values
      if (DATE_FIELDS.includes(key) && val === '') continue;
      insertData[key] = val;
    }
  }

  const { data, error } = await supabase.from('participants').insert(insertData).select().single();
  if (error) return res.status(500).json({ error: 'Failed to create participant', details: error.message });

  await supabase.from('audit_log').insert({ user_email: 'system', action: 'create', resource_type: 'participant', resource_id: data.id, resource_name: `${data.first_name} ${data.last_name}` });
  res.status(201).json(data);
}

async function handleParticipantUpdate(req, res) {
  const { id, ...fields } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const updates = {};
  for (const key of PARTICIPANT_FIELDS) {
    if (key in fields) {
      let val = typeof fields[key] === 'string' ? fields[key].trim() : fields[key];
      // Convert empty strings to null for date fields
      if (DATE_FIELDS.includes(key) && val === '') val = null;
      updates[key] = val;
    }
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields' });
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('participants').update(updates).eq('id', id).select().single();
  if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });

  await supabase.from('audit_log').insert({ user_email: 'system', action: 'update', resource_type: 'participant', resource_id: data.id, resource_name: `${data.first_name} ${data.last_name}`, details: { updated_fields: Object.keys(updates).filter(k => k !== 'updated_at') } });
  res.status(200).json(data);
}

async function handleParticipantDelete(req, res) {
  const id = req.query?.id || req.body?.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const { data: p, error: fetchErr } = await supabase.from('participants').select('id, first_name, last_name').eq('id', id).single();
  if (fetchErr) return res.status(fetchErr.code === 'PGRST116' ? 404 : 500).json({ error: fetchErr.message });

  // Clean up files from storage
  const { data: files } = await supabase.from('participant_files').select('storage_path').eq('participant_id', id);
  if (files?.length) {
    const paths = files.map(f => f.storage_path).filter(Boolean);
    if (paths.length) await supabase.storage.from('participant-files').remove(paths);
  }

  // Cascade deletes via FK, but explicit for safety
  await supabase.from('participant_notes').delete().eq('participant_id', id);
  await supabase.from('participant_files').delete().eq('participant_id', id);

  const { error } = await supabase.from('participants').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('audit_log').insert({ user_email: 'system', action: 'delete', resource_type: 'participant', resource_id: id, resource_name: `${p.first_name} ${p.last_name}` });
  res.status(200).json({ message: `Deleted "${p.first_name} ${p.last_name}"`, id });
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function handleAddNote(req, res) {
  const body = req.body || {};
  if (!body.participant_id) return res.status(400).json({ error: 'Missing participant_id' });
  if (!body.content) return res.status(400).json({ error: 'Missing content' });

  const insertData = {
    participant_id: body.participant_id,
    content: body.content.trim(),
    note_type: body.note_type?.trim() || 'progress',
    author: body.author?.trim() || 'Staff',
  };

  const { data, error } = await supabase.from('participant_notes').insert(insertData).select().single();
  if (error) return res.status(500).json({ error: 'Failed to add note', details: error.message });
  res.status(201).json(data);
}

async function handleUpdateNote(req, res) {
  const { id, content, note_type } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const updates = { updated_at: new Date().toISOString() };
  if (content) updates.content = content.trim();
  if (note_type) updates.note_type = note_type.trim();
  const { data, error } = await supabase.from('participant_notes').update(updates).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
}

async function handleDeleteNote(req, res) {
  const id = req.query?.id || req.body?.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('participant_notes').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: 'Note deleted', id });
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function handleUploadFile(req, res) {
  const body = req.body || {};
  if (!body.participant_id) return res.status(400).json({ error: 'Missing participant_id' });
  if (!body.fileData) return res.status(400).json({ error: 'Missing fileData' });
  if (!body.fileName) return res.status(400).json({ error: 'Missing fileName' });

  let buffer;
  try {
    buffer = Buffer.from(stripBase64Prefix(body.fileData), 'base64');
  } catch { return res.status(400).json({ error: 'Invalid base64' }); }

  if (buffer.length > MAX_FILE_SIZE) {
    return res.status(413).json({ error: `File too large. Max ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB` });
  }

  const ext = body.fileName.substring(body.fileName.lastIndexOf('.')).toLowerCase();
  const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  const contentType = mimeMap[ext] || 'application/octet-stream';

  const storagePath = `${body.participant_id}/${Date.now()}_${body.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const { error: uploadError } = await supabase.storage.from('participant-files').upload(storagePath, buffer, { contentType, upsert: false });
  if (uploadError) return res.status(500).json({ error: 'Upload failed', details: uploadError.message });

  const { data: urlData } = supabase.storage.from('participant-files').getPublicUrl(storagePath);

  const insertData = {
    participant_id: body.participant_id,
    file_name: body.fileName.trim(),
    category: body.category?.trim() || 'General',
    storage_path: storagePath,
    file_type: ext.replace('.', ''),
    size: buffer.length,
    notes: body.notes?.trim() || null,
    uploaded_by: body.uploaded_by?.trim() || 'Staff',
  };

  const { data, error } = await supabase.from('participant_files').insert(insertData).select().single();
  if (error) {
    await supabase.storage.from('participant-files').remove([storagePath]);
    return res.status(500).json({ error: 'Failed to save file record', details: error.message });
  }

  res.status(201).json({ ...data, public_url: urlData?.publicUrl || null });
}

async function handleDeleteFile(req, res) {
  const id = req.query?.id || req.body?.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const { data: file, error: fetchErr } = await supabase.from('participant_files').select('id, storage_path, file_name').eq('id', id).single();
  if (fetchErr) return res.status(fetchErr.code === 'PGRST116' ? 404 : 500).json({ error: fetchErr.message });

  if (file.storage_path) {
    await supabase.storage.from('participant-files').remove([file.storage_path]);
  }

  const { error } = await supabase.from('participant_files').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: `File "${file.file_name}" deleted`, id });
}

// ═══════════════════════════════════════════════════════════════════════════
// INQUIRY NOTE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function handleAddInquiryNote(req, res) {
  const body = req.body || {};
  if (!body.inquiry_id) return res.status(400).json({ error: 'Missing inquiry_id' });
  if (!body.content) return res.status(400).json({ error: 'Missing content' });

  const insertData = {
    inquiry_id: body.inquiry_id,
    content: body.content.trim(),
    author: body.author?.trim() || 'Staff',
  };

  const { data, error } = await supabase.from('inquiry_notes').insert(insertData).select().single();
  if (error) return res.status(500).json({ error: 'Failed to add note', details: error.message });
  res.status(201).json(data);
}

async function handleDeleteInquiryNote(req, res) {
  const id = req.query?.id || req.body?.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('inquiry_notes').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: 'Note deleted', id });
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVERT INQUIRY → PARTICIPANT
// ═══════════════════════════════════════════════════════════════════════════

async function handleConvertInquiry(req, res) {
  const { inquiry_id } = req.body || {};
  if (!inquiry_id) return res.status(400).json({ error: 'Missing inquiry_id' });

  // Fetch inquiry
  const { data: inquiry, error: fetchErr } = await supabase.from('participant_inquiries').select('*').eq('id', inquiry_id).single();
  if (fetchErr) return res.status(fetchErr.code === 'PGRST116' ? 404 : 500).json({ error: fetchErr.message });

  if (inquiry.converted_participant_id) {
    return res.status(400).json({ error: 'This inquiry has already been converted' });
  }

  // Map funding status to funding type
  const fundingMap = {
    'Plan Managed': 'Plan-managed',
    'Self Managed': 'Self-managed',
    'NDIA Managed': 'NDIA-managed',
  };

  // Build participant data from inquiry fields
  const participantData = {
    first_name: inquiry.first_name,
    last_name: inquiry.last_name,
    status: 'active',
  };

  // Copy matching fields
  const directFields = ['date_of_birth', 'ndis_number', 'phone', 'email', 'location', 'state', 'funding_ratio'];
  for (const f of directFields) {
    if (inquiry[f]) participantData[f] = inquiry[f];
  }

  // Map funding
  if (inquiry.funding_status && fundingMap[inquiry.funding_status]) {
    participantData.funding_type = fundingMap[inquiry.funding_status];
  }

  // Combine notes + support needs into bio
  const bioparts = [];
  if (inquiry.support_needs) bioparts.push(`Support Needs: ${inquiry.support_needs}`);
  if (inquiry.current_living) bioparts.push(`Current Living: ${inquiry.current_living}`);
  if (inquiry.notes) bioparts.push(`Notes: ${inquiry.notes}`);
  if (bioparts.length) participantData.bio = bioparts.join('\n\n');

  // Create participant
  const { data: participant, error: createErr } = await supabase.from('participants').insert(participantData).select().single();
  if (createErr) return res.status(500).json({ error: 'Failed to create participant', details: createErr.message });

  // Mark inquiry as converted
  const { data: updated, error: updateErr } = await supabase.from('participant_inquiries')
    .update({ status: 'Converted', converted_participant_id: participant.id, updated_at: new Date().toISOString() })
    .eq('id', inquiry_id).select().single();
  if (updateErr) return res.status(500).json({ error: 'Participant created but failed to update inquiry', details: updateErr.message });

  // Audit log
  await supabase.from('audit_log').insert([
    { user_email: 'system', action: 'convert', resource_type: 'participant_inquiry', resource_id: inquiry_id, resource_name: `${inquiry.first_name} ${inquiry.last_name}`, details: { converted_to: participant.id } },
    { user_email: 'system', action: 'create', resource_type: 'participant', resource_id: participant.id, resource_name: `${participant.first_name} ${participant.last_name}`, details: { converted_from_inquiry: inquiry_id } },
  ]);

  res.status(201).json({ participant, inquiry: updated });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ROUTER
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// MEDICATION CHARTS
// ═══════════════════════════════════════════════════════════════════════════

async function handleMedicationList(req, res) {
  const { participant_id } = req.query;
  if (!participant_id) return res.status(400).json({ error: 'participant_id required' });
  const { data, error } = await supabase.from('medication_charts').select('*').eq('participant_id', participant_id).order('status').order('medication_name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

async function handleMedicationCreate(req, res) {
  const { participant_id, medication_name, dosage, frequency, route, prescriber, pharmacy, start_date, end_date, time_slots, instructions, status } = req.body;
  if (!participant_id || !medication_name || !dosage || !frequency) return res.status(400).json({ error: 'participant_id, medication_name, dosage, frequency required' });
  const insert = { participant_id, medication_name, dosage, frequency };
  if (route) insert.route = route;
  if (prescriber) insert.prescriber = prescriber;
  if (pharmacy) insert.pharmacy = pharmacy;
  if (start_date) insert.start_date = start_date;
  if (end_date) insert.end_date = end_date;
  if (time_slots) insert.time_slots = time_slots;
  if (instructions) insert.instructions = instructions;
  if (status) insert.status = status;
  const { data, error } = await supabase.from('medication_charts').insert(insert).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function handleMedicationUpdate(req, res) {
  const { id, ...updates } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from('medication_charts').update(updates).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function handleMedicationDelete(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  const { error } = await supabase.from('medication_charts').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTICIPANT CONTACTS (multiple emergency/specialist contacts)
// ═══════════════════════════════════════════════════════════════════════════

async function handleContactList(req, res) {
  const { participant_id } = req.query;
  if (!participant_id) return res.status(400).json({ error: 'participant_id required' });
  const { data, error } = await supabase.from('participant_contacts').select('*').eq('participant_id', participant_id).order('is_primary', { ascending: false }).order('contact_type').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

async function handleContactCreate(req, res) {
  const { participant_id, contact_type, name, relationship, phone, email, organisation, role_title, is_primary, notes } = req.body;
  if (!participant_id || !name) return res.status(400).json({ error: 'participant_id and name required' });
  const insert = { participant_id, name, contact_type: contact_type || 'emergency' };
  if (relationship) insert.relationship = relationship;
  if (phone) insert.phone = phone;
  if (email) insert.email = email;
  if (organisation) insert.organisation = organisation;
  if (role_title) insert.role_title = role_title;
  if (is_primary !== undefined) insert.is_primary = is_primary;
  if (notes) insert.notes = notes;
  const { data, error } = await supabase.from('participant_contacts').insert(insert).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function handleContactDelete(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  const { error } = await supabase.from('participant_contacts').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const { action } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        // Inquiry actions
        case 'list': return await handleInquiryList(req, res);
        case 'get': return await handleInquiryGet(req, res);
        case 'stats': return await handleInquiryStats(req, res);
        // Participant profile actions
        case 'participants': return await handleParticipantList(req, res);
        case 'participant': return await handleParticipantGet(req, res);
        // Medication charts
        case 'medications': return await handleMedicationList(req, res);
        // Participant contacts
        case 'contacts': return await handleContactList(req, res);
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    if (req.method === 'POST') {
      const bodyAction = req.body?.action;
      switch (bodyAction || action) {
        // Inquiry
        case undefined:
        case null:
          return await handleInquiryCreate(req, res);
        // Participant profiles
        case 'create-participant': return await handleParticipantCreate(req, res);
        // Notes
        case 'add-note': return await handleAddNote(req, res);
        // Inquiry notes
        case 'add-inquiry-note': return await handleAddInquiryNote(req, res);
        // Convert inquiry → participant
        case 'convert-inquiry': return await handleConvertInquiry(req, res);
        // Files
        case 'upload-file': return await handleUploadFile(req, res);
        // Medications
        case 'create-medication': return await handleMedicationCreate(req, res);
        // Contacts
        case 'create-contact': return await handleContactCreate(req, res);
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    if (req.method === 'PATCH') {
      const bodyAction = req.body?.action;
      switch (bodyAction) {
        case 'update-participant': return await handleParticipantUpdate(req, res);
        case 'update-note': return await handleUpdateNote(req, res);
        case 'update-medication': return await handleMedicationUpdate(req, res);
        default:
          return await handleInquiryUpdate(req, res);
      }
    }

    if (req.method === 'DELETE') {
      const delAction = req.query?.action || req.body?.action;
      switch (delAction) {
        case 'delete-participant': return await handleParticipantDelete(req, res);
        case 'delete-note': return await handleDeleteNote(req, res);
        case 'delete-inquiry-note': return await handleDeleteInquiryNote(req, res);
        case 'delete-file': return await handleDeleteFile(req, res);
        case 'delete-medication': return await handleMedicationDelete(req, res);
        case 'delete-contact': return await handleContactDelete(req, res);
        default:
          return await handleInquiryDelete(req, res);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Participants handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
