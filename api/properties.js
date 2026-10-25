import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

// ─── Allowed fields per table for PATCH updates ─────────────────────────────

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel hobby plan limit)

function getMimeType(fileName) {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const mimeMap = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

function getFileType(fileName) {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return ext.replace('.', '') || 'unknown';
}

function sanitizePath(str) {
  return str.replace(/[<>:"|?*\\]/g, '').replace(/\.\./g, '').replace(/\/+/g, '/').trim();
}

async function ensureBucket() {
  try {
    const { error } = await supabase.storage.createBucket('property-photos', {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
    });
    if (error && !error.message?.includes('already exists')) {
      console.warn('Bucket creation warning:', error.message);
    }
  } catch (e) {
    console.warn('Bucket creation attempt failed:', e.message);
  }
}

const ALLOWED_FIELDS = {
  properties: [
    'name', 'address', 'suburb', 'state', 'postcode',
    'property_type', 'capacity', 'status', 'property_manager',
    'contact_phone', 'notes',
    'description', 'bedrooms', 'bathrooms', 'features', 'accessibility', 'nearby_amenities',
  ],
  property_residents: [
    'property_id', 'participant_name', 'ndis_number', 'room_number',
    'move_in_date', 'move_out_date', 'status', 'support_level', 'notes',
  ],
  property_maintenance: [
    'property_id', 'title', 'description', 'priority', 'status',
    'reported_by', 'reported_date', 'completed_date', 'cost', 'notes',
  ],
  property_inspections: [
    'property_id', 'inspection_type', 'inspection_date', 'inspector',
    'result', 'notes', 'next_due_date',
  ],
  property_risk_assessments: [
    'property_id', 'assessment_date', 'assessor', 'status',
    'overall_risk_level', 'items', 'general_notes', 'next_review_date',
  ],
};

const VALID_TABLES = Object.keys(ALLOWED_FIELDS);

const VALID_PROPERTY_TYPES = ['SIL', 'SDA', 'SIL+SDA'];
const VALID_PROPERTY_STATUSES = ['active', 'inactive', 'maintenance'];
const VALID_RESIDENT_STATUSES = ['active', 'departed', 'transitioning'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_MAINTENANCE_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
const VALID_INSPECTION_RESULTS = ['pass', 'fail', 'needs_attention'];
const VALID_RISK_STATUSES = ['draft', 'completed'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

// ─── GET Handlers ────────────────────────────────────────────────────────────

async function handleList(req, res) {
  const { status } = req.query;

  let query = supabase
    .from('properties')
    .select('*')
    .order('name', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: properties, error } = await query;

  if (error) {
    console.error('Properties query error:', error);
    return res.status(500).json({ error: 'Failed to fetch properties' });
  }

  if (!properties || properties.length === 0) {
    return res.status(200).json([]);
  }

  const propertyIds = properties.map((p) => p.id);

  // Fetch residents and maintenance in parallel
  const [residentsResult, maintenanceResult, inspectionsResult] = await Promise.all([
    supabase
      .from('property_residents')
      .select('id, property_id, status')
      .in('property_id', propertyIds)
      .eq('status', 'active'),
    supabase
      .from('property_maintenance')
      .select('id, property_id, status')
      .in('property_id', propertyIds)
      .eq('status', 'pending'),
    supabase
      .from('property_inspections')
      .select('id, property_id, next_due_date')
      .in('property_id', propertyIds)
      .not('next_due_date', 'is', null)
      .order('next_due_date', { ascending: true }),
  ]);

  if (residentsResult.error) {
    console.error('Residents query error:', residentsResult.error);
    return res.status(500).json({ error: 'Failed to fetch residents' });
  }
  if (maintenanceResult.error) {
    console.error('Maintenance query error:', maintenanceResult.error);
    return res.status(500).json({ error: 'Failed to fetch maintenance' });
  }
  if (inspectionsResult.error) {
    console.error('Inspections query error:', inspectionsResult.error);
    return res.status(500).json({ error: 'Failed to fetch inspections' });
  }

  // Group counts by property_id
  const residentCounts = {};
  for (const r of residentsResult.data || []) {
    residentCounts[r.property_id] = (residentCounts[r.property_id] || 0) + 1;
  }

  const pendingMaintenanceCounts = {};
  for (const m of maintenanceResult.data || []) {
    pendingMaintenanceCounts[m.property_id] = (pendingMaintenanceCounts[m.property_id] || 0) + 1;
  }

  // Next inspection date per property (already sorted ascending)
  const nextInspection = {};
  for (const i of inspectionsResult.data || []) {
    if (!nextInspection[i.property_id]) {
      nextInspection[i.property_id] = i.next_due_date;
    }
  }

  const result = properties.map((property) => ({
    ...property,
    resident_count: residentCounts[property.id] || 0,
    pending_maintenance_count: pendingMaintenanceCounts[property.id] || 0,
    next_inspection_date: nextInspection[property.id] || null,
  }));

  res.status(200).json(result);
}

async function handleGet(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing required query parameter: id' });
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (propertyError) {
    console.error('Property fetch error:', propertyError);
    if (propertyError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Property not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch property' });
  }

  // Fetch all related data in parallel
  const [residentsResult, maintenanceResult, inspectionsResult, photosResult, riskResult] = await Promise.all([
    supabase
      .from('property_residents')
      .select('*')
      .eq('property_id', id)
      .order('status', { ascending: true })
      .order('room_number', { ascending: true }),
    supabase
      .from('property_maintenance')
      .select('*')
      .eq('property_id', id)
      .order('reported_date', { ascending: false }),
    supabase
      .from('property_inspections')
      .select('*')
      .eq('property_id', id)
      .order('inspection_date', { ascending: false }),
    supabase
      .from('property_photos')
      .select('*')
      .eq('property_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('property_risk_assessments')
      .select('*')
      .eq('property_id', id)
      .order('assessment_date', { ascending: false }),
  ]);

  if (residentsResult.error) {
    console.error('Residents fetch error:', residentsResult.error);
    return res.status(500).json({ error: 'Failed to fetch residents' });
  }
  if (maintenanceResult.error) {
    console.error('Maintenance fetch error:', maintenanceResult.error);
    return res.status(500).json({ error: 'Failed to fetch maintenance' });
  }
  if (inspectionsResult.error) {
    console.error('Inspections fetch error:', inspectionsResult.error);
    return res.status(500).json({ error: 'Failed to fetch inspections' });
  }
  if (photosResult.error) {
    console.error('Photos fetch error:', photosResult.error);
  }
  if (riskResult.error) {
    console.error('Risk assessments fetch error:', riskResult.error);
  }

  // Build public URLs for photos
  const photos = (photosResult.data || []).map((photo) => {
    const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(photo.storage_path);
    return { ...photo, url: urlData?.publicUrl || null };
  });

  res.status(200).json({
    ...property,
    residents: residentsResult.data || [],
    maintenance: maintenanceResult.data || [],
    inspections: inspectionsResult.data || [],
    photos,
    risk_assessments: riskResult.data || [],
  });
}

async function handleDashboard(req, res) {
  // Fetch all properties
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('id, property_type, capacity, status');

  if (propError) {
    console.error('Properties query error:', propError);
    return res.status(500).json({ error: 'Failed to fetch properties' });
  }

  const allProperties = properties || [];
  const activeProperties = allProperties.filter((p) => p.status === 'active');
  const totalProperties = allProperties.length;
  const totalCapacity = activeProperties.reduce((sum, p) => sum + (p.capacity || 0), 0);

  // Properties by type breakdown
  const propertiesByType = {};
  for (const p of allProperties) {
    const type = p.property_type || 'Unknown';
    propertiesByType[type] = (propertiesByType[type] || 0) + 1;
  }

  if (totalProperties === 0) {
    return res.status(200).json({
      total_properties: 0,
      total_capacity: 0,
      total_residents: 0,
      occupancy_rate: 0,
      pending_maintenance_count: 0,
      overdue_inspections_count: 0,
      properties_by_type: propertiesByType,
    });
  }

  const activePropertyIds = activeProperties.map((p) => p.id);

  // Fetch residents, pending maintenance, and overdue inspections in parallel
  const today = new Date().toISOString().split('T')[0];

  const queries = [
    // Active residents in active properties
    activePropertyIds.length > 0
      ? supabase
          .from('property_residents')
          .select('id', { count: 'exact', head: true })
          .in('property_id', activePropertyIds)
          .eq('status', 'active')
      : Promise.resolve({ count: 0, error: null }),
    // Pending maintenance across all properties
    supabase
      .from('property_maintenance')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    // Overdue inspections (next_due_date < today)
    supabase
      .from('property_inspections')
      .select('id', { count: 'exact', head: true })
      .lt('next_due_date', today),
  ];

  const [residentsResult, maintenanceResult, inspectionsResult] = await Promise.all(queries);

  if (residentsResult.error) {
    console.error('Residents count error:', residentsResult.error);
    return res.status(500).json({ error: 'Failed to count residents' });
  }
  if (maintenanceResult.error) {
    console.error('Maintenance count error:', maintenanceResult.error);
    return res.status(500).json({ error: 'Failed to count maintenance' });
  }
  if (inspectionsResult.error) {
    console.error('Inspections count error:', inspectionsResult.error);
    return res.status(500).json({ error: 'Failed to count inspections' });
  }

  const totalResidents = residentsResult.count || 0;
  const occupancyRate = totalCapacity > 0
    ? Math.round((totalResidents / totalCapacity) * 100)
    : 0;

  res.status(200).json({
    total_properties: totalProperties,
    total_capacity: totalCapacity,
    total_residents: totalResidents,
    occupancy_rate: occupancyRate,
    pending_maintenance_count: maintenanceResult.count || 0,
    overdue_inspections_count: inspectionsResult.count || 0,
    properties_by_type: propertiesByType,
  });
}

// ─── POST Handlers ───────────────────────────────────────────────────────────

async function handleCreateProperty(req, res) {
  const {
    name, address, suburb, state, postcode,
    property_type, capacity, property_manager, contact_phone, notes,
  } = req.body || {};

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Missing required field: name' });
  }
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing required field: address' });
  }
  if (!property_type || !VALID_PROPERTY_TYPES.includes(property_type)) {
    return res.status(400).json({ error: `Invalid property_type. Must be one of: ${VALID_PROPERTY_TYPES.join(', ')}` });
  }
  if (capacity === undefined || capacity === null || typeof capacity !== 'number' || capacity < 1) {
    return res.status(400).json({ error: 'Missing or invalid field: capacity (must be a positive number)' });
  }

  const { data: property, error } = await supabase
    .from('properties')
    .insert({
      name: name.trim(),
      address: address.trim(),
      suburb: suburb?.trim() || null,
      state: state?.trim() || null,
      postcode: postcode?.trim() || null,
      property_type,
      capacity,
      status: 'active',
      property_manager: property_manager?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Property create error:', error);
    return res.status(500).json({ error: 'Failed to create property' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'create',
    resource_type: 'property',
    resource_id: property.id,
    resource_name: property.name,
    details: { address: property.address, property_type: property.property_type, capacity: property.capacity },
  });

  res.status(201).json(property);
}

async function handleAddResident(req, res) {
  const {
    property_id, participant_name, ndis_number,
    room_number, move_in_date, support_level, notes,
  } = req.body || {};

  if (!property_id) {
    return res.status(400).json({ error: 'Missing required field: property_id' });
  }
  if (!participant_name || typeof participant_name !== 'string') {
    return res.status(400).json({ error: 'Missing required field: participant_name' });
  }

  // Verify property exists
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, name, capacity')
    .eq('id', property_id)
    .single();

  if (propError) {
    if (propError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Property not found' });
    }
    return res.status(500).json({ error: 'Failed to verify property' });
  }

  // Check capacity
  const { count: currentResidents, error: countError } = await supabase
    .from('property_residents')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', property_id)
    .eq('status', 'active');

  if (countError) {
    console.error('Resident count error:', countError);
    return res.status(500).json({ error: 'Failed to check capacity' });
  }

  if (currentResidents >= property.capacity) {
    return res.status(409).json({ error: `Property "${property.name}" is at full capacity (${property.capacity})` });
  }

  const { data: resident, error } = await supabase
    .from('property_residents')
    .insert({
      property_id,
      participant_name: participant_name.trim(),
      ndis_number: ndis_number?.trim() || null,
      room_number: room_number?.trim() || null,
      move_in_date: move_in_date || null,
      status: 'active',
      support_level: support_level?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Resident create error:', error);
    return res.status(500).json({ error: 'Failed to add resident' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'create',
    resource_type: 'property_resident',
    resource_id: resident.id,
    resource_name: resident.participant_name,
    details: { property_id, property_name: property.name, ndis_number: resident.ndis_number },
  });

  res.status(201).json(resident);
}

async function handleAddMaintenance(req, res) {
  const {
    property_id, title, description, priority, reported_by,
  } = req.body || {};

  if (!property_id) {
    return res.status(400).json({ error: 'Missing required field: property_id' });
  }
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Missing required field: title' });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  // Verify property exists
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', property_id)
    .single();

  if (propError) {
    if (propError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Property not found' });
    }
    return res.status(500).json({ error: 'Failed to verify property' });
  }

  const { data: request, error } = await supabase
    .from('property_maintenance')
    .insert({
      property_id,
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || 'medium',
      status: 'pending',
      reported_by: reported_by?.trim() || null,
      reported_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) {
    console.error('Maintenance create error:', error);
    return res.status(500).json({ error: 'Failed to create maintenance request' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'create',
    resource_type: 'property_maintenance',
    resource_id: request.id,
    resource_name: request.title,
    details: { property_id, property_name: property.name, priority: request.priority },
  });

  res.status(201).json(request);
}

async function handleAddInspection(req, res) {
  const {
    property_id, inspection_type, inspection_date,
    inspector, result, notes, next_due_date,
  } = req.body || {};

  if (!property_id) {
    return res.status(400).json({ error: 'Missing required field: property_id' });
  }
  if (!inspection_type || typeof inspection_type !== 'string') {
    return res.status(400).json({ error: 'Missing required field: inspection_type' });
  }
  if (!inspection_date) {
    return res.status(400).json({ error: 'Missing required field: inspection_date' });
  }
  if (result && !VALID_INSPECTION_RESULTS.includes(result)) {
    return res.status(400).json({ error: `Invalid result. Must be one of: ${VALID_INSPECTION_RESULTS.join(', ')}` });
  }

  // Verify property exists
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', property_id)
    .single();

  if (propError) {
    if (propError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Property not found' });
    }
    return res.status(500).json({ error: 'Failed to verify property' });
  }

  const { data: inspection, error } = await supabase
    .from('property_inspections')
    .insert({
      property_id,
      inspection_type: inspection_type.trim(),
      inspection_date,
      inspector: inspector?.trim() || null,
      result: result || null,
      notes: notes?.trim() || null,
      next_due_date: next_due_date || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Inspection create error:', error);
    return res.status(500).json({ error: 'Failed to record inspection' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'create',
    resource_type: 'property_inspection',
    resource_id: inspection.id,
    resource_name: `${inspection.inspection_type} - ${property.name}`,
    details: { property_id, property_name: property.name, result: inspection.result, inspection_date },
  });

  res.status(201).json(inspection);
}

async function handleAddRiskAssessment(req, res) {
  const {
    property_id, assessment_date, assessor, status,
    overall_risk_level, items, general_notes, next_review_date,
  } = req.body || {};

  if (!property_id) {
    return res.status(400).json({ error: 'Missing required field: property_id' });
  }
  if (!assessment_date) {
    return res.status(400).json({ error: 'Missing required field: assessment_date' });
  }
  if (status && !VALID_RISK_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_RISK_STATUSES.join(', ')}` });
  }
  if (overall_risk_level && !VALID_RISK_LEVELS.includes(overall_risk_level)) {
    return res.status(400).json({ error: `Invalid risk level. Must be one of: ${VALID_RISK_LEVELS.join(', ')}` });
  }

  // Verify property exists
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', property_id)
    .single();

  if (propError) {
    if (propError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Property not found' });
    }
    return res.status(500).json({ error: 'Failed to verify property' });
  }

  const { data: assessment, error } = await supabase
    .from('property_risk_assessments')
    .insert({
      property_id,
      assessment_date,
      assessor: assessor?.trim() || null,
      status: status || 'draft',
      overall_risk_level: overall_risk_level || null,
      items: items || [],
      general_notes: general_notes?.trim() || null,
      next_review_date: next_review_date || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Risk assessment create error:', error);
    return res.status(500).json({ error: 'Failed to create risk assessment' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'create',
    resource_type: 'property_risk_assessment',
    resource_id: assessment.id,
    resource_name: `Risk Assessment - ${property.name}`,
    details: { property_id, property_name: property.name, status: assessment.status, assessment_date },
  });

  res.status(201).json(assessment);
}

// ─── Photo Handlers ─────────────────────────────────────────────────────────

async function handleUploadPhoto(req, res) {
  const { property_id, fileName, fileData, caption } = req.body || {};

  if (!property_id) return res.status(400).json({ error: 'Missing property_id' });
  if (!fileName || typeof fileName !== 'string') return res.status(400).json({ error: 'Missing fileName' });
  if (!fileData || typeof fileData !== 'string') return res.status(400).json({ error: 'Missing fileData (base64)' });

  // Verify property exists
  const { data: property, error: propError } = await supabase
    .from('properties').select('id, name').eq('id', property_id).single();
  if (propError) {
    return propError.code === 'PGRST116'
      ? res.status(404).json({ error: 'Property not found' })
      : res.status(500).json({ error: 'Failed to verify property' });
  }

  let buffer;
  try { buffer = Buffer.from(fileData, 'base64'); } catch {
    return res.status(400).json({ error: 'Invalid base64 fileData' });
  }
  if (buffer.length > MAX_FILE_SIZE) {
    return res.status(413).json({ error: `File too large. Max ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB` });
  }

  const sanitizedName = sanitizePath(fileName);
  if (!sanitizedName) return res.status(400).json({ error: 'Invalid fileName' });

  const timestamp = Date.now();
  const storagePath = `${property_id}/${timestamp}-${sanitizedName}`;
  const contentType = getMimeType(sanitizedName);
  const fileType = getFileType(sanitizedName);

  await ensureBucket();

  const { error: uploadError } = await supabase.storage
    .from('property-photos')
    .upload(storagePath, buffer, { contentType, upsert: false });

  if (uploadError) {
    console.error('Photo upload error:', uploadError);
    return res.status(500).json({ error: 'Failed to upload photo' });
  }

  // Build public URL
  const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(storagePath);
  const publicUrl = urlData?.publicUrl || null;

  const { data: photo, error: dbError } = await supabase
    .from('property_photos')
    .insert({
      property_id,
      storage_path: storagePath,
      file_name: sanitizedName,
      url: publicUrl,
      is_cover: false,
      caption: caption?.trim() || null,
    })
    .select()
    .single();

  if (dbError) {
    console.error('Photo DB insert error:', dbError);
    await supabase.storage.from('property-photos').remove([storagePath]);
    return res.status(500).json({ error: 'Failed to save photo metadata' });
  }

  await supabase.from('audit_log').insert({
    user_email: 'system', action: 'upload_photo', resource_type: 'property_photo',
    resource_id: photo.id, resource_name: sanitizedName,
    details: { property_id, property_name: property.name },
  });

  res.status(201).json(photo);
}

async function handleDeletePhoto(req, res) {
  const { photo_id } = req.body || {};
  if (!photo_id) return res.status(400).json({ error: 'Missing photo_id' });

  const { data: photo, error: fetchError } = await supabase
    .from('property_photos').select('*').eq('id', photo_id).single();

  if (fetchError) {
    return fetchError.code === 'PGRST116'
      ? res.status(404).json({ error: 'Photo not found' })
      : res.status(500).json({ error: 'Failed to fetch photo' });
  }

  if (photo.storage_path) {
    await supabase.storage.from('property-photos').remove([photo.storage_path]);
  }

  const { error: dbError } = await supabase.from('property_photos').delete().eq('id', photo_id);
  if (dbError) {
    return res.status(500).json({ error: 'Failed to delete photo record' });
  }

  await supabase.from('audit_log').insert({
    user_email: 'system', action: 'delete_photo', resource_type: 'property_photo',
    resource_id: photo_id, resource_name: photo.file_name,
    details: { property_id: photo.property_id },
  });

  res.status(200).json({ message: 'Photo deleted', id: photo_id });
}

async function handleSetCoverPhoto(req, res) {
  const { property_id, photo_id } = req.body || {};
  if (!property_id || !photo_id) return res.status(400).json({ error: 'Missing property_id or photo_id' });

  // Unset all covers for this property
  await supabase.from('property_photos').update({ is_cover: false }).eq('property_id', property_id);

  // Set the chosen photo as cover
  const { data: photo, error } = await supabase
    .from('property_photos').update({ is_cover: true }).eq('id', photo_id).select().single();

  if (error) {
    return res.status(500).json({ error: 'Failed to set cover photo' });
  }

  res.status(200).json(photo);
}

// ─── PATCH Handler ───────────────────────────────────────────────────────────

async function handleUpdate(req, res) {
  const { id, table, ...fields } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }
  if (!table || !VALID_TABLES.includes(table)) {
    return res.status(400).json({ error: `Missing or invalid field: table. Must be one of: ${VALID_TABLES.join(', ')}` });
  }

  const allowedFields = ALLOWED_FIELDS[table];

  // Filter to allowed fields only
  const updates = {};
  for (const key of allowedFields) {
    if (key in fields) {
      updates[key] = typeof fields[key] === 'string' ? fields[key].trim() : fields[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: `No valid fields to update for table "${table}". Allowed: ${allowedFields.join(', ')}` });
  }

  // Validate enum fields if present
  if (table === 'properties') {
    if (updates.property_type && !VALID_PROPERTY_TYPES.includes(updates.property_type)) {
      return res.status(400).json({ error: `Invalid property_type. Must be one of: ${VALID_PROPERTY_TYPES.join(', ')}` });
    }
    if (updates.status && !VALID_PROPERTY_STATUSES.includes(updates.status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_PROPERTY_STATUSES.join(', ')}` });
    }
  }
  if (table === 'property_residents') {
    if (updates.status && !VALID_RESIDENT_STATUSES.includes(updates.status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_RESIDENT_STATUSES.join(', ')}` });
    }
  }
  if (table === 'property_maintenance') {
    if (updates.priority && !VALID_PRIORITIES.includes(updates.priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }
    if (updates.status && !VALID_MAINTENANCE_STATUSES.includes(updates.status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_MAINTENANCE_STATUSES.join(', ')}` });
    }
  }
  if (table === 'property_inspections') {
    if (updates.result && !VALID_INSPECTION_RESULTS.includes(updates.result)) {
      return res.status(400).json({ error: `Invalid result. Must be one of: ${VALID_INSPECTION_RESULTS.join(', ')}` });
    }
  }
  if (table === 'property_risk_assessments') {
    if (updates.status && !VALID_RISK_STATUSES.includes(updates.status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_RISK_STATUSES.join(', ')}` });
    }
    if (updates.overall_risk_level && !VALID_RISK_LEVELS.includes(updates.overall_risk_level)) {
      return res.status(400).json({ error: `Invalid risk level. Must be one of: ${VALID_RISK_LEVELS.join(', ')}` });
    }
  }

  // Set updated_at for the properties table
  if (table === 'properties') {
    updates.updated_at = new Date().toISOString();
  }

  const { data: record, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`${table} update error:`, error);
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: `Record not found in ${table}` });
    }
    return res.status(500).json({ error: `Failed to update record in ${table}` });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'update',
    resource_type: table,
    resource_id: id,
    resource_name: record.name || record.participant_name || record.title || record.inspection_type || id,
    details: { updated_fields: Object.keys(updates).filter((k) => k !== 'updated_at') },
  });

  res.status(200).json(record);
}

// ─── DELETE Handler ──────────────────────────────────────────────────────────

async function handleDelete(req, res) {
  const { id, table } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }
  if (!table || !VALID_TABLES.includes(table)) {
    return res.status(400).json({ error: `Missing or invalid field: table. Must be one of: ${VALID_TABLES.join(', ')}` });
  }

  // Fetch record to confirm existence and get name for logging
  const { data: record, error: fetchError } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error(`${table} fetch error:`, fetchError);
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: `Record not found in ${table}` });
    }
    return res.status(500).json({ error: `Failed to fetch record from ${table}` });
  }

  // If deleting a property, also delete all related records + storage files
  if (table === 'properties') {
    // Clean up property photos from storage
    const { data: photos } = await supabase
      .from('property_photos')
      .select('storage_path')
      .eq('property_id', id);

    if (photos?.length) {
      const paths = photos.map((p) => p.storage_path).filter(Boolean);
      if (paths.length) {
        await supabase.storage.from('property-photos').remove(paths);
      }
    }

    const deleteQueries = [
      supabase.from('property_residents').delete().eq('property_id', id),
      supabase.from('property_maintenance').delete().eq('property_id', id),
      supabase.from('property_inspections').delete().eq('property_id', id),
      supabase.from('property_photos').delete().eq('property_id', id),
      supabase.from('property_risk_assessments').delete().eq('property_id', id),
    ];

    const results = await Promise.all(deleteQueries);
    for (const result of results) {
      if (result.error) {
        console.error('Cascade delete error:', result.error);
      }
    }
  }

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error(`${table} delete error:`, deleteError);
    return res.status(500).json({ error: `Failed to delete record from ${table}` });
  }

  const resourceName = record.name || record.participant_name || record.title || record.inspection_type || id;

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'delete',
    resource_type: table,
    resource_id: id,
    resource_name: resourceName,
    details: table === 'properties' ? { cascade: true } : {},
  });

  res.status(200).json({
    message: `Record "${resourceName}" deleted successfully from ${table}`,
    id,
    table,
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
        case 'dashboard':
          return await handleDashboard(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action query parameter. Valid GET actions: list, get, dashboard' });
      }
    }

    if (req.method === 'POST') {
      const bodyAction = req.body?.action || action;
      switch (bodyAction) {
        case 'create-property':
          return await handleCreateProperty(req, res);
        case 'add-resident':
          return await handleAddResident(req, res);
        case 'add-maintenance':
          return await handleAddMaintenance(req, res);
        case 'add-inspection':
          return await handleAddInspection(req, res);
        case 'add-risk-assessment':
          return await handleAddRiskAssessment(req, res);
        case 'upload-photo':
          return await handleUploadPhoto(req, res);
        case 'delete-photo':
          return await handleDeletePhoto(req, res);
        case 'set-cover-photo':
          return await handleSetCoverPhoto(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action. Valid POST actions: create-property, add-resident, add-maintenance, add-inspection, add-risk-assessment, upload-photo, delete-photo, set-cover-photo' });
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
    console.error('Properties handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
