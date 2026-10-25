import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

// ─── GET: Fetch all active checklist templates ──────────────────────────────

async function handleGetTemplates(req, res) {
  const { data: templates, error } = await supabase
    .from('onboarding_checklist_templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Templates fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }

  res.status(200).json(templates || []);
}

// ─── GET: Fetch onboarding progress for a staff member ──────────────────────

async function handleGetProgress(req, res) {
  const { staffId } = req.query;

  if (!staffId) {
    return res.status(400).json({ error: 'Missing required query parameter: staffId' });
  }

  // Fetch all active templates
  const { data: templates, error: templatesError } = await supabase
    .from('onboarding_checklist_templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (templatesError) {
    console.error('Templates fetch error:', templatesError);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }

  // Fetch progress rows for this staff member
  const { data: progressRows, error: progressError } = await supabase
    .from('staff_onboarding_progress')
    .select('*')
    .eq('staff_id', staffId);

  if (progressError) {
    console.error('Progress fetch error:', progressError);
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }

  // Fetch staff documents for auto-complete checks
  const { data: staffDocs, error: docsError } = await supabase
    .from('staff_documents')
    .select('*')
    .eq('staff_id', staffId);

  if (docsError) {
    console.error('Staff documents fetch error:', docsError);
    return res.status(500).json({ error: 'Failed to fetch staff documents' });
  }

  // Index progress by template_id for quick lookup
  const progressByTemplate = {};
  for (const row of progressRows || []) {
    progressByTemplate[row.template_id] = row;
  }

  // Index documents by document_type for auto-complete lookup
  const docsByType = {};
  for (const doc of staffDocs || []) {
    docsByType[doc.document_type] = doc;
  }

  // Build items list
  let completed = 0;
  const items = (templates || []).map((template) => {
    const progress = progressByTemplate[template.id];
    let isCompleted = false;
    let isAutoCompleted = false;
    let completedAt = null;
    let completedBy = null;
    let notes = null;

    // Check auto-complete first
    if (template.auto_complete_doc_type && docsByType[template.auto_complete_doc_type]) {
      isCompleted = true;
      isAutoCompleted = true;
      completedAt = docsByType[template.auto_complete_doc_type].created_at || null;
    } else if (progress && progress.completed) {
      // Manual completion
      isCompleted = true;
      isAutoCompleted = false;
      completedAt = progress.completed_at;
      completedBy = progress.completed_by;
      notes = progress.notes;
    }

    if (isCompleted) completed++;

    return {
      template_id: template.id,
      label: template.label,
      category: template.category,
      sort_order: template.sort_order,
      completed: isCompleted,
      auto_completed: isAutoCompleted,
      completed_at: completedAt,
      completed_by: completedBy,
      notes: notes,
      auto_complete_doc_type: template.auto_complete_doc_type,
    };
  });

  const total = items.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  res.status(200).json({
    items,
    summary: { completed, total, percent },
  });
}

// ─── GET: Bulk progress for multiple staff ──────────────────────────────────

async function handleBulkProgress(req, res) {
  const { staffIds } = req.query;

  if (!staffIds) {
    return res.status(400).json({ error: 'Missing required query parameter: staffIds' });
  }

  const ids = staffIds.split(',').map((id) => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    return res.status(400).json({ error: 'staffIds must contain at least one ID' });
  }

  // Fetch all active templates
  const { data: templates, error: templatesError } = await supabase
    .from('onboarding_checklist_templates')
    .select('*')
    .eq('is_active', true);

  if (templatesError) {
    console.error('Templates fetch error:', templatesError);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }

  const total = (templates || []).length;

  // Fetch all progress rows for these staff members
  const { data: progressRows, error: progressError } = await supabase
    .from('staff_onboarding_progress')
    .select('*')
    .in('staff_id', ids);

  if (progressError) {
    console.error('Progress fetch error:', progressError);
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }

  // Fetch all staff documents for these staff members (for auto-complete)
  const { data: staffDocs, error: docsError } = await supabase
    .from('staff_documents')
    .select('staff_id, document_type, created_at')
    .in('staff_id', ids);

  if (docsError) {
    console.error('Staff documents fetch error:', docsError);
    return res.status(500).json({ error: 'Failed to fetch staff documents' });
  }

  // Group progress by staff_id → template_id
  const progressByStaff = {};
  for (const row of progressRows || []) {
    if (!progressByStaff[row.staff_id]) progressByStaff[row.staff_id] = {};
    progressByStaff[row.staff_id][row.template_id] = row;
  }

  // Group docs by staff_id → document_type
  const docsByStaff = {};
  for (const doc of staffDocs || []) {
    if (!docsByStaff[doc.staff_id]) docsByStaff[doc.staff_id] = {};
    docsByStaff[doc.staff_id][doc.document_type] = doc;
  }

  // Compute summary for each staff member
  const result = {};
  for (const staffId of ids) {
    const staffProgress = progressByStaff[staffId] || {};
    const staffDocsByType = docsByStaff[staffId] || {};
    let completed = 0;

    for (const template of templates || []) {
      let isCompleted = false;

      if (template.auto_complete_doc_type && staffDocsByType[template.auto_complete_doc_type]) {
        isCompleted = true;
      } else if (staffProgress[template.id]?.completed) {
        isCompleted = true;
      }

      if (isCompleted) completed++;
    }

    result[staffId] = {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  res.status(200).json(result);
}

// ─── PATCH: Toggle a checklist item ─────────────────────────────────────────

async function handleToggle(req, res) {
  const { staffId, templateId, completed, completedBy } = req.body || {};

  if (!staffId) {
    return res.status(400).json({ error: 'Missing required field: staffId' });
  }
  if (!templateId) {
    return res.status(400).json({ error: 'Missing required field: templateId' });
  }
  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Missing or invalid field: completed (must be boolean)' });
  }

  const upsertData = {
    staff_id: staffId,
    template_id: templateId,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
    completed_by: completed ? (completedBy || null) : null,
  };

  const { data, error } = await supabase
    .from('staff_onboarding_progress')
    .upsert(upsertData, { onConflict: 'staff_id,template_id' })
    .select()
    .single();

  if (error) {
    console.error('Toggle error:', error);
    return res.status(500).json({ error: 'Failed to toggle checklist item' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: completedBy || 'system',
    action: completed ? 'complete' : 'uncomplete',
    resource_type: 'onboarding_item',
    resource_id: templateId,
    resource_name: `Onboarding item for staff ${staffId}`,
    details: { staff_id: staffId, template_id: templateId, completed },
  });

  res.status(200).json(data);
}

// ─── POST: Create a new template item (admin) ──────────────────────────────

async function handleCreateTemplate(req, res) {
  const { label, category, sort_order, auto_complete_doc_type } = req.body || {};

  if (!label || typeof label !== 'string') {
    return res.status(400).json({ error: 'Missing required field: label' });
  }

  const insertData = {
    label: label.trim(),
    category: category?.trim() || null,
    sort_order: typeof sort_order === 'number' ? sort_order : 0,
    auto_complete_doc_type: auto_complete_doc_type?.trim() || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('onboarding_checklist_templates')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Template create error:', error);
    return res.status(500).json({ error: 'Failed to create template' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'create',
    resource_type: 'onboarding_template',
    resource_id: data.id,
    resource_name: data.label,
    details: { category: data.category, sort_order: data.sort_order },
  });

  res.status(201).json(data);
}

// ─── PATCH: Update a template item (admin) ──────────────────────────────────

async function handleUpdateTemplate(req, res) {
  const { id, label, category, sort_order, is_active, auto_complete_doc_type } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  const updates = {};
  if (label !== undefined) updates.label = label.trim();
  if (category !== undefined) updates.category = category?.trim() || null;
  if (sort_order !== undefined) updates.sort_order = sort_order;
  if (is_active !== undefined) updates.is_active = is_active;
  if (auto_complete_doc_type !== undefined) updates.auto_complete_doc_type = auto_complete_doc_type?.trim() || null;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('onboarding_checklist_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Template update error:', error);
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Template not found' });
    }
    return res.status(500).json({ error: 'Failed to update template' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'update',
    resource_type: 'onboarding_template',
    resource_id: data.id,
    resource_name: data.label,
    details: { updated_fields: Object.keys(updates).filter((k) => k !== 'updated_at') },
  });

  res.status(200).json(data);
}

// ─── DELETE: Soft-delete a template item (admin) ────────────────────────────

async function handleDeleteTemplate(req, res) {
  const id = req.query?.id || req.body?.id;

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id (provide as query param or in JSON body)' });
  }

  const { data, error } = await supabase
    .from('onboarding_checklist_templates')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Template soft-delete error:', error);
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Template not found' });
    }
    return res.status(500).json({ error: 'Failed to deactivate template' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'system',
    action: 'deactivate',
    resource_type: 'onboarding_template',
    resource_id: data.id,
    resource_name: data.label,
    details: {},
  });

  res.status(200).json({ message: `Template "${data.label}" deactivated successfully`, id });
}

// ─── Main Router ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const { action } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        case 'templates':
          return await handleGetTemplates(req, res);
        case 'progress':
          return await handleGetProgress(req, res);
        case 'bulk-progress':
          return await handleBulkProgress(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action query parameter. Valid GET actions: templates, progress, bulk-progress' });
      }
    }

    if (req.method === 'POST') {
      switch (action) {
        case 'template':
          return await handleCreateTemplate(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action query parameter. Valid POST actions: template' });
      }
    }

    if (req.method === 'PATCH') {
      switch (action) {
        case 'toggle':
          return await handleToggle(req, res);
        case 'template':
          return await handleUpdateTemplate(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action query parameter. Valid PATCH actions: toggle, template' });
      }
    }

    if (req.method === 'DELETE') {
      switch (action) {
        case 'template':
          return await handleDeleteTemplate(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action query parameter. Valid DELETE actions: template' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Onboarding handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
