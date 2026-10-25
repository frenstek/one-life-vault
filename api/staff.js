import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';
import { buildComplianceSummary, REQUIRED_DOCUMENT_TYPES, calcDocumentStatus } from './_lib/ndis.js';

// ─── Role mapping: staff directory role → vault role ────────────────────────
function mapToVaultRole(staffRole) {
  const role = (staffRole || '').toLowerCase();
  if (['manager', 'operations manager', 'general manager', 'director', 'admin'].some(r => role === r)) return 'admin';
  if (['team leader', 'coordinator'].some(r => role === r)) return 'manager';
  return 'staff'; // Support Worker, Nurse, Allied Health, etc.
}

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  const bytes = randomBytes(length);
  let pw = '';
  for (let i = 0; i < length; i++) pw += chars[bytes[i] % chars.length];
  return pw;
}

// ─── Allowed fields for staff update ─────────────────────────────────────────

const ALLOWED_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'role',
  'department',
  'start_date',
  'status',
  'notes',
  'photo_url',
  'date_of_birth',
  'address',
  'position_type',
  'emergency_contact_name',
  'emergency_contact_phone',
  'emergency_contact_relationship',
  'ndis_clearance_number',
  'pay_rate_weekday',
  'pay_rate_saturday',
  'pay_rate_sunday',
  'sleepover_rate',
  'abn',
  'bsb',
  'bank_account',
];

// ─── GET Handlers ────────────────────────────────────────────────────────────

async function handleList(req, res) {
  const { status } = req.query;

  let staffQuery = supabase
    .from('staff')
    .select('*')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (status === 'active') {
    staffQuery = staffQuery.eq('status', 'active');
  } else if (status === 'inactive') {
    staffQuery = staffQuery.in('status', ['inactive', 'resigned', 'terminated']);
  } else if (status) {
    staffQuery = staffQuery.eq('status', status);
  }

  const { data: staffList, error: staffError } = await staffQuery;

  if (staffError) {
    console.error('Staff query error:', staffError);
    return res.status(500).json({ error: 'Failed to fetch staff' });
  }

  if (!staffList || staffList.length === 0) {
    return res.status(200).json([]);
  }

  // Fetch all staff documents in one query
  const staffIds = staffList.map((s) => s.id);
  const { data: allDocs, error: docsError } = await supabase
    .from('staff_documents')
    .select('*')
    .in('staff_id', staffIds);

  if (docsError) {
    console.error('Staff documents query error:', docsError);
    return res.status(500).json({ error: 'Failed to fetch staff documents' });
  }

  // Group documents by staff_id
  const docsByStaff = {};
  for (const doc of allDocs || []) {
    if (!docsByStaff[doc.staff_id]) {
      docsByStaff[doc.staff_id] = [];
    }
    docsByStaff[doc.staff_id].push(doc);
  }

  // Build response with compliance summary for each staff member
  const result = staffList.map((staff) => {
    const docs = docsByStaff[staff.id] || [];
    const compliance = buildComplianceSummary(docs);
    return {
      ...staff,
      compliance,
    };
  });

  res.status(200).json(result);
}

async function handleGet(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing required query parameter: id' });
  }

  // Fetch staff member
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .single();

  if (staffError) {
    console.error('Staff fetch error:', staffError);
    if (staffError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch staff member' });
  }

  // Fetch all documents for this staff member
  const { data: documents, error: docsError } = await supabase
    .from('staff_documents')
    .select('*')
    .eq('staff_id', id)
    .order('document_type', { ascending: true })
    .order('created_at', { ascending: false });

  if (docsError) {
    console.error('Documents fetch error:', docsError);
    return res.status(500).json({ error: 'Failed to fetch staff documents' });
  }

  const docs = documents || [];

  // Recalculate status for each document
  const docsWithStatus = docs.map((doc) => ({
    ...doc,
    status: calcDocumentStatus(doc.expiry_date),
  }));

  // Build compliance summary
  const compliance = buildComplianceSummary(docsWithStatus);

  // Build a checklist of all required doc types
  const uploadedByType = {};
  for (const doc of docsWithStatus) {
    if (!uploadedByType[doc.document_type]) {
      uploadedByType[doc.document_type] = doc;
    }
  }

  const documentChecklist = REQUIRED_DOCUMENT_TYPES.map((docType) => {
    const doc = uploadedByType[docType] || null;
    return {
      document_type: docType,
      uploaded: !!doc,
      status: doc ? doc.status : 'missing',
      document: doc,
    };
  });

  res.status(200).json({
    ...staff,
    documents: docsWithStatus,
    compliance,
    document_checklist: documentChecklist,
  });
}

async function handleCompliance(req, res) {
  // Fetch all active staff
  const { data: staffList, error: staffError } = await supabase
    .from('staff')
    .select('id, first_name, last_name, email, role, department, status')
    .eq('status', 'active')
    .order('last_name', { ascending: true });

  if (staffError) {
    console.error('Staff query error:', staffError);
    return res.status(500).json({ error: 'Failed to fetch staff' });
  }

  const staff = staffList || [];
  const totalStaff = staff.length;

  if (totalStaff === 0) {
    return res.status(200).json({
      total_staff: 0,
      fully_compliant: 0,
      expiring_soon: 0,
      non_compliant: 0,
      expiring_documents: [],
      expired_documents: [],
      document_type_rates: {},
    });
  }

  // Fetch all documents for active staff
  const staffIds = staff.map((s) => s.id);
  const { data: allDocs, error: docsError } = await supabase
    .from('staff_documents')
    .select('*')
    .in('staff_id', staffIds);

  if (docsError) {
    console.error('Documents query error:', docsError);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }

  const docs = allDocs || [];

  // Group documents by staff_id
  const docsByStaff = {};
  for (const doc of docs) {
    if (!docsByStaff[doc.staff_id]) {
      docsByStaff[doc.staff_id] = [];
    }
    docsByStaff[doc.staff_id].push(doc);
  }

  // Staff-by-staff compliance
  let fullyCompliant = 0;
  let expiringSoon = 0;
  let nonCompliant = 0;

  const staffLookup = {};
  for (const s of staff) {
    staffLookup[s.id] = s;
  }

  for (const s of staff) {
    const staffDocs = docsByStaff[s.id] || [];
    const summary = buildComplianceSummary(staffDocs);
    if (summary.is_fully_compliant) {
      fullyCompliant++;
    } else if (summary.docs_expired > 0 || summary.docs_uploaded < summary.total_required) {
      nonCompliant++;
    } else if (summary.docs_expiring > 0) {
      expiringSoon++;
    }
  }

  // Build lists of expiring and expired documents
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringDocuments = [];
  const expiredDocuments = [];

  for (const doc of docs) {
    if (!doc.expiry_date) continue;

    const expiry = new Date(doc.expiry_date);
    expiry.setHours(0, 0, 0, 0);

    const staffMember = staffLookup[doc.staff_id];
    const enrichedDoc = {
      ...doc,
      staff_name: staffMember
        ? `${staffMember.first_name} ${staffMember.last_name}`
        : 'Unknown',
      staff_email: staffMember?.email || null,
    };

    if (expiry < now) {
      expiredDocuments.push(enrichedDoc);
    } else if (expiry <= thirtyDaysFromNow) {
      expiringDocuments.push(enrichedDoc);
    }
  }

  // Sort by expiry date (soonest first)
  expiringDocuments.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  expiredDocuments.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

  // Per-document-type compliance rates
  const documentTypeRates = {};
  for (const docType of REQUIRED_DOCUMENT_TYPES) {
    let hasValid = 0;
    let hasExpiring = 0;
    let hasExpired = 0;
    let missing = 0;

    for (const s of staff) {
      const staffDocs = docsByStaff[s.id] || [];
      const docOfType = staffDocs.find((d) => d.document_type === docType);

      if (!docOfType) {
        missing++;
      } else if (!docOfType.expiry_date) {
        hasValid++;
      } else {
        const expiry = new Date(docOfType.expiry_date);
        expiry.setHours(0, 0, 0, 0);
        if (expiry < now) {
          hasExpired++;
        } else if (expiry <= thirtyDaysFromNow) {
          hasExpiring++;
        } else {
          hasValid++;
        }
      }
    }

    documentTypeRates[docType] = {
      valid: hasValid,
      expiring: hasExpiring,
      expired: hasExpired,
      missing,
      total_staff: totalStaff,
      compliance_rate: totalStaff > 0
        ? Math.round(((hasValid + hasExpiring) / totalStaff) * 100)
        : 0,
    };
  }

  // Build per-staff missing documents list
  const staffGaps = [];
  for (const s of staff) {
    const staffDocs = docsByStaff[s.id] || [];
    const uploadedTypes = new Set(staffDocs.map(d => d.document_type));
    const missing = REQUIRED_DOCUMENT_TYPES.filter(t => !uploadedTypes.has(t));
    if (missing.length > 0) {
      staffGaps.push({
        staff_id: s.id,
        staff_name: `${s.first_name} ${s.last_name}`,
        role: s.role,
        email: s.email,
        missing_documents: missing,
        missing_count: missing.length,
        uploaded_count: REQUIRED_DOCUMENT_TYPES.length - missing.length,
        total_required: REQUIRED_DOCUMENT_TYPES.length,
      });
    }
  }
  // Sort by most missing first
  staffGaps.sort((a, b) => b.missing_count - a.missing_count);

  res.status(200).json({
    total_staff: totalStaff,
    fully_compliant: fullyCompliant,
    expiring_soon: expiringSoon,
    non_compliant: nonCompliant,
    expiring_documents: expiringDocuments,
    expired_documents: expiredDocuments,
    document_type_rates: documentTypeRates,
    staff_gaps: staffGaps,
  });
}

// ─── POST Handler ────────────────────────────────────────────────────────────

async function handleCreate(req, res) {
  const body = req.body || {};

  if (!body.first_name || typeof body.first_name !== 'string') {
    return res.status(400).json({ error: 'Missing required field: first_name' });
  }
  if (!body.last_name || typeof body.last_name !== 'string') {
    return res.status(400).json({ error: 'Missing required field: last_name' });
  }
  if (!body.email || typeof body.email !== 'string') {
    return res.status(400).json({ error: 'Missing required field: email' });
  }

  // Check for duplicate email
  const { data: existing } = await supabase
    .from('staff')
    .select('id')
    .eq('email', body.email.toLowerCase().trim())
    .single();

  if (existing) {
    return res.status(409).json({ error: 'A staff member with this email already exists' });
  }

  // Build insert object from allowed fields
  const insertData = { status: 'active' };
  for (const key of ALLOWED_FIELDS) {
    if (key in body && body[key] !== undefined && body[key] !== '') {
      insertData[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  }
  if (insertData.email) insertData.email = insertData.email.toLowerCase();

  // Try insert; if column doesn't exist, retry without unknown columns
  let { data: staff, error } = await supabase
    .from('staff')
    .insert(insertData)
    .select()
    .single();

  if (error && error.code === '42703') {
    // Column doesn't exist — strip unknown columns and retry
    const colMatch = error.message?.match(/column "(\w+)"/);
    if (colMatch) {
      delete insertData[colMatch[1]];
      const retry = await supabase.from('staff').insert(insertData).select().single();
      staff = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    console.error('Staff create error:', error);
    return res.status(500).json({ error: 'Failed to create staff member' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'create',
    resource_type: 'staff',
    resource_id: staff.id,
    resource_name: `${staff.first_name} ${staff.last_name}`,
    details: { email: staff.email, role: staff.role, department: staff.department },
  });

  // ─── Auto-create vault account if email provided ────────────────────────
  let vaultAccount = null;
  if (staff.email) {
    try {
      const adminSb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const vaultRole = mapToVaultRole(staff.role);
      const password = generatePassword();
      const fullName = `${staff.first_name} ${staff.last_name}`.trim();

      // Check if vault account already exists for this email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', staff.email)
        .single();

      if (!existingProfile) {
        // Create auth user
        const { data: authData, error: authErr } = await adminSb.auth.admin.createUser({
          email: staff.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, role: vaultRole },
        });

        if (!authErr && authData?.user) {
          const userId = authData.user.id;

          // Create profile
          const { error: profileErr } = await supabase.from('profiles').insert({
            id: userId,
            email: staff.email,
            full_name: fullName,
            role: vaultRole,
          });

          if (profileErr) {
            // Auth user created but profile failed — clean up orphaned auth user
            await adminSb.auth.admin.deleteUser(userId);
            vaultAccount = { created: false, reason: 'Profile creation failed: ' + profileErr.message };
          } else {
            // Log account creation
            await supabase.from('audit_log').insert({
              user_email: 'system',
              action: 'create_user',
              resource_type: 'user',
              resource_id: userId,
              resource_name: fullName,
              details: { email: staff.email, vault_role: vaultRole, auto_created: true },
            });

            vaultAccount = {
              created: true,
              email: staff.email,
              password,
              vault_role: vaultRole,
            };
          }
        } else if (authErr?.message?.includes('already been registered')) {
          vaultAccount = { created: false, reason: 'Account already exists for this email' };
        } else {
          vaultAccount = { created: false, reason: authErr?.message || 'Failed to create account' };
        }
      } else {
        vaultAccount = { created: false, reason: 'Account already exists for this email' };
      }
    } catch (err) {
      console.error('Auto vault account creation error:', err);
      vaultAccount = { created: false, reason: err.message };
    }
  }

  res.status(201).json({ ...staff, vault_account: vaultAccount });
}

// ─── PATCH Handler ───────────────────────────────────────────────────────────

async function handleUpdate(req, res) {
  const { id, ...fields } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  // Filter to allowed fields only
  const updates = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in fields) {
      updates[key] = typeof fields[key] === 'string' ? fields[key].trim() : fields[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update. Allowed: ' + ALLOWED_FIELDS.join(', ') });
  }

  // If email is being updated, normalize it
  if (updates.email) {
    updates.email = updates.email.toLowerCase();
  }

  // Set updated_at
  updates.updated_at = new Date().toISOString();

  // Try update; if column doesn't exist, strip it and retry
  let { data: staff, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error && error.code === '42703') {
    const colMatch = error.message?.match(/column "(\w+)"/);
    if (colMatch) {
      delete updates[colMatch[1]];
      const retry = await supabase.from('staff').update(updates).eq('id', id).select().single();
      staff = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    console.error('Staff update error:', error);
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    return res.status(500).json({ error: 'Failed to update staff member' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'update',
    resource_type: 'staff',
    resource_id: staff.id,
    resource_name: `${staff.first_name} ${staff.last_name}`,
    details: { updated_fields: Object.keys(updates).filter((k) => k !== 'updated_at') },
  });

  res.status(200).json(staff);
}

// ─── DELETE Handler ──────────────────────────────────────────────────────────

async function handleDelete(req, res) {
  const id = req.query?.id || req.body?.id;

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id (provide as query param or in JSON body)' });
  }

  // Fetch staff member to confirm existence and get name for logging
  const { data: staff, error: fetchError } = await supabase
    .from('staff')
    .select('id, first_name, last_name, email')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Staff fetch error:', fetchError);
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch staff member' });
  }

  // Fetch all documents for this staff member to clean up storage
  const { data: docs } = await supabase
    .from('staff_documents')
    .select('id, storage_path')
    .eq('staff_id', id);

  // Delete files from storage
  if (docs && docs.length > 0) {
    const storagePaths = docs.map((d) => d.storage_path).filter(Boolean);
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('staff-documents')
        .remove(storagePaths);

      if (storageError) {
        console.error('Storage cleanup error:', storageError);
      }
    }

    // Delete document records
    const { error: docsDeleteError } = await supabase
      .from('staff_documents')
      .delete()
      .eq('staff_id', id);

    if (docsDeleteError) {
      console.error('Documents delete error:', docsDeleteError);
    }
  }

  // Delete staff record
  const { error: deleteError } = await supabase
    .from('staff')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Staff delete error:', deleteError);
    return res.status(500).json({ error: 'Failed to delete staff member' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'delete',
    resource_type: 'staff',
    resource_id: id,
    resource_name: `${staff.first_name} ${staff.last_name}`,
    details: { email: staff.email, documents_deleted: docs?.length || 0 },
  });

  res.status(200).json({
    message: `Staff member "${staff.first_name} ${staff.last_name}" and ${docs?.length || 0} documents deleted successfully`,
    id,
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
        case 'get':
          return await handleGet(req, res);
        case 'compliance':
          return await handleCompliance(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action query parameter. Valid GET actions: list, get, compliance' });
      }
    }

    if (req.method === 'POST') {
      return await handleCreate(req, res);
    }

    if (req.method === 'PATCH') {
      return await handleUpdate(req, res);
    }

    if (req.method === 'DELETE') {
      return await handleDelete(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Staff handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
