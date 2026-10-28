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
  'start_date_with_olf',
  'plan_start_date', 'plan_end_date', 'funding_type', 'funding_ratio', 'support_level',
  'primary_disability', 'secondary_disability',
  'communication_needs', 'mobility', 'dietary_requirements', 'allergies',
  'medications_summary', 'medicare_number', 'cultural_considerations',
  'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
  'gp_name', 'gp_phone', 'gp_clinic',
  'pharmacy_name', 'pharmacy_phone', 'pharmacy_address',
  'bsp_name', 'bsp_phone', 'bsp_email', 'bsp_organisation',
  'support_coordinator_name', 'support_coordinator_phone', 'support_coordinator_email', 'support_coordinator_organisation',
  'occupational_therapist', 'speech_pathologist', 'psychologist',
  'plan_manager_name', 'plan_manager_email', 'plan_manager_organisation',
  'assigned_staff', 'status', 'notes',
  'notes_expected', 'notes_min_per_day',  // missing-notes check (optional columns, missing-notes-migration.sql)
];

const DATE_FIELDS = ['date_of_birth', 'start_date_with_olf', 'plan_start_date', 'plan_end_date', 'next_follow_up', 'inquiry_date'];
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
  if (error) return res.status(500).json({ error: 'Failed to fetch inquiries' });
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
  if (error) return res.status(500).json({ error: 'Failed to create inquiry' });
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
  let query = supabase.from('participants').select('*').order('first_name', { ascending: true }).order('last_name', { ascending: true });
  if (status) query = query.eq('status', status);
  if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,ndis_number.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to fetch participants' });
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

  // Generate signed URLs for files (1 hour expiry — works regardless of bucket visibility)
  const files = await Promise.all((rawFiles || []).map(async (f) => {
    if (f.storage_path) {
      const { data: signedData, error: signError } = await supabase.storage
        .from('participant-files')
        .createSignedUrl(f.storage_path, 3600);
      if (!signError && signedData?.signedUrl) {
        return { ...f, public_url: signedData.signedUrl };
      }
      // Fallback to public URL if signing fails
      const { data: urlData } = supabase.storage.from('participant-files').getPublicUrl(f.storage_path);
      return { ...f, public_url: urlData?.publicUrl || null };
    }
    return { ...f, public_url: null };
  }));

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
  if (error) return res.status(500).json({ error: 'Failed to create participant' });

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

  const noteType = body.note_type?.trim() || 'progress';
  const author = body.author?.trim() || 'Staff';

  // Progress-type notes go to progress_notes table (unified with Progress Notes page)
  if (noteType === 'progress') {
    const { data: participant } = await supabase
      .from('participants')
      .select('first_name, last_name')
      .eq('id', body.participant_id)
      .single();

    const participantName = participant
      ? `${participant.first_name || ''} ${participant.last_name || ''}`.trim()
      : '';

    const { data, error } = await supabase.from('progress_notes').insert({
      participant_id: body.participant_id,
      participant_name: participantName,
      content: body.content.trim(),
      staff_name: author,
      note_date: new Date().toISOString().split('T')[0],
      shift: body.shift || null,
    }).select().single();

    if (error) return res.status(500).json({ error: 'Failed to add note' });
    return res.status(201).json(data);
  }

  // Non-progress notes (incident, handover, etc.) go to participant_notes
  const insertData = {
    participant_id: body.participant_id,
    content: body.content.trim(),
    note_type: noteType,
    author,
  };

  const { data, error } = await supabase.from('participant_notes').insert(insertData).select().single();
  if (error) return res.status(500).json({ error: 'Failed to add note' });
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
  if (uploadError) return res.status(500).json({ error: 'Upload failed' });

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
    return res.status(500).json({ error: 'Failed to save file record' });
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
  if (error) return res.status(500).json({ error: 'Failed to add note' });
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
  if (createErr) return res.status(500).json({ error: 'Failed to create participant' });

  // Mark inquiry as converted
  const { data: updated, error: updateErr } = await supabase.from('participant_inquiries')
    .update({ status: 'Converted', converted_participant_id: participant.id, updated_at: new Date().toISOString() })
    .eq('id', inquiry_id).select().single();
  if (updateErr) return res.status(500).json({ error: 'Participant created but failed to update inquiry' });

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
  // Strip the routing key — `action` is not a medication_charts column (PGRST204 otherwise)
  const { id, action: _action, ...updates } = req.body;
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
// SUPPORT PLANS
// ═══════════════════════════════════════════════════════════════════════════

const SUPPORT_PLAN_FIELDS = [
  'participant_id', 'plan_start_date', 'plan_end_date', 'plan_review_date',
  'status', 'prepared_by', 'short_term_goals', 'long_term_goals',
  'daily_support_needs', 'health_medical', 'behaviour_support',
  'community_access', 'communication', 'risk_management',
  'overnight_support', 'additional_notes',
];

// Table existence is assumed - run migration SQL first via Supabase Dashboard
// See support-plans-migration.sql or GET /api/migrate-support-plans for the SQL

async function handleSupportPlanGet(req, res) {
  const { participant_id } = req.query;
  if (!participant_id) return res.status(400).json({ error: 'participant_id required' });
  const { data, error } = await supabase
    .from('support_plans')
    .select('*')
    .eq('participant_id', participant_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || null);
}

async function handleSupportPlanList(req, res) {
  const { participant_id } = req.query;
  if (!participant_id) return res.status(400).json({ error: 'participant_id required' });
  const { data, error } = await supabase
    .from('support_plans')
    .select('*')
    .eq('participant_id', participant_id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

async function handleSupportPlanCreate(req, res) {
  const body = req.body || {};
  if (!body.participant_id) return res.status(400).json({ error: 'participant_id required' });

  const insert = {};
  for (const key of SUPPORT_PLAN_FIELDS) {
    if (key in body && body[key] !== undefined) {
      insert[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  }
  if (!insert.status) insert.status = 'draft';

  const { data, error } = await supabase.from('support_plans').insert(insert).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

async function handleSupportPlanUpdate(req, res) {
  const { id, action: _action, ...fields } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });

  const updates = {};
  for (const key of SUPPORT_PLAN_FIELDS) {
    if (key in fields) {
      updates[key] = typeof fields[key] === 'string' ? fields[key].trim() : fields[key];
    }
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields' });
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('support_plans').update(updates).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function handleSupportPlanDelete(req, res) {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });
  const { error } = await supabase.from('support_plans').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// RISK PROFILE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function handleRiskProfileGet(req, res) {
  const pid = req.query.participant_id;
  if (!pid) return res.status(400).json({ error: 'participant_id required' });
  const { data, error } = await supabase
    .from('risk_profiles')
    .select('*')
    .eq('participant_id', pid)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
}

async function handleRiskProfileCreate(req, res) {
  const { participant_id, risks, review_date, next_review_date, reviewed_by, status, overall_risk_level, general_notes, environmental_context } = req.body;
  if (!participant_id) return res.status(400).json({ error: 'participant_id required' });
  const { data, error } = await supabase
    .from('risk_profiles')
    .insert({ participant_id, risks: risks || [], review_date, next_review_date, reviewed_by, status: status || 'active', overall_risk_level, general_notes, environmental_context })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
}

async function handleRiskProfileUpdate(req, res) {
  const { id, ...updates } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  delete updates.action;
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase
    .from('risk_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
}

async function handleRiskProfileDelete(req, res) {
  const id = req.body?.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  const { error } = await supabase.from('risk_profiles').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// GOALS OF CARE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

const GOALS_FIELDS = [
  'participant_id', 'goal_area', 'goal_description', 'target_outcome',
  'strategies', 'responsible_person', 'start_date', 'target_date',
  'review_date', 'status', 'progress_notes', 'progress_percentage', 'created_by',
];

async function handleGoalsOfCareList(req, res) {
  const pid = req.query.participant_id;
  if (!pid) return res.status(400).json({ error: 'participant_id required' });
  const { data, error } = await supabase
    .from('goals_of_care')
    .select('*')
    .eq('participant_id', pid)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

async function handleGoalsOfCareCreate(req, res) {
  const body = req.body || {};
  if (!body.participant_id || !body.goal_description) {
    return res.status(400).json({ error: 'participant_id and goal_description required' });
  }
  const insert = {};
  for (const key of GOALS_FIELDS) {
    if (key in body && body[key] !== undefined) {
      insert[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  }
  const { data, error } = await supabase.from('goals_of_care').insert(insert).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

async function handleGoalsOfCareUpdate(req, res) {
  const { id, action: _action, ...fields } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });
  const updates = {};
  for (const key of GOALS_FIELDS) {
    if (key in fields) {
      updates[key] = typeof fields[key] === 'string' ? fields[key].trim() : fields[key];
    }
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields' });
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from('goals_of_care').update(updates).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

async function handleGoalsOfCareDelete(req, res) {
  const id = req.body?.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  const { error } = await supabase.from('goals_of_care').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// HOSPITAL PASSPORT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

const PASSPORT_FIELDS = [
  'provider_name', 'provider_phone', 'provider_email', 'provider_address', 'provider_service',
  'communication_style', 'communication_aids',
  'things_i_like', 'things_i_dont_like', 'things_that_upset_me', 'things_that_calm_me',
  'diagnoses', 'medical_conditions', 'medical_restrictions', 'pain_indicators', 'seizure_info', 'nfr_status', 'nfr_notes',
  'mobility_transfers', 'equipment_aids', 'eating_drinking', 'personal_care_needs',
  'behaviour_triggers', 'behaviour_strategies',
  'routine_appointments', 'additional_notes', 'last_updated_by',
];

async function handleHospitalPassportGet(req, res) {
  const { participant_id } = req.query;
  if (!participant_id) return res.status(400).json({ error: 'participant_id required' });

  const { data, error } = await supabase
    .from('hospital_passports')
    .select('*')
    .eq('participant_id', participant_id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
}

async function handleHospitalPassportSave(req, res) {
  const { participant_id } = req.body;
  if (!participant_id) return res.status(400).json({ error: 'participant_id required' });

  const row = { participant_id };
  for (const f of PASSPORT_FIELDS) {
    if (req.body[f] !== undefined) row[f] = req.body[f];
  }
  row.updated_at = new Date().toISOString();

  // Upsert — insert or update if exists
  const { data, error } = await supabase
    .from('hospital_passports')
    .upsert(row, { onConflict: 'participant_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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
        // Support plans
        case 'support-plan-get': return await handleSupportPlanGet(req, res);
        case 'support-plan-list': return await handleSupportPlanList(req, res);
        // Hospital passport
        case 'hospital-passport-get': return await handleHospitalPassportGet(req, res);
        // Risk profiles
        case 'risk-profile-get': return await handleRiskProfileGet(req, res);
        // Goals of care
        case 'goals-of-care-list': return await handleGoalsOfCareList(req, res);
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
        // Support plans
        case 'support-plan-create': return await handleSupportPlanCreate(req, res);
        // Hospital passport
        case 'hospital-passport-save': return await handleHospitalPassportSave(req, res);
        // Risk profiles
        case 'risk-profile-create': return await handleRiskProfileCreate(req, res);
        // Goals of care
        case 'goals-of-care-create': return await handleGoalsOfCareCreate(req, res);
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
        case 'support-plan-update': return await handleSupportPlanUpdate(req, res);
        case 'risk-profile-update': return await handleRiskProfileUpdate(req, res);
        case 'goals-of-care-update': return await handleGoalsOfCareUpdate(req, res);
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
        case 'support-plan-delete': return await handleSupportPlanDelete(req, res);
        case 'risk-profile-delete': return await handleRiskProfileDelete(req, res);
        case 'goals-of-care-delete': return await handleGoalsOfCareDelete(req, res);
        default:
          return await handleInquiryDelete(req, res);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Participants handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
