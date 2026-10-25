import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

// ─── GET Handlers ─────────────────────────────────────────────────────────────

async function handleList(req, res) {
  const { status, assigned_to, priority } = req.query;

  let query = supabase
    .from('tasks')
    .select('*, staff:assigned_to(id, first_name, last_name, photo_url)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (assigned_to) query = query.eq('assigned_to', assigned_to);
  if (priority) query = query.eq('priority', priority);

  const { data, error } = await query;

  if (error) {
    console.error('Tasks query error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }

  return res.status(200).json(data || []);
}

async function handleGet(req, res, id) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, staff:assigned_to(id, first_name, last_name, photo_url)')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Task not found' });
  }

  return res.status(200).json(data);
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

async function handleCreate(req, res) {
  const { title, description, status, priority, assigned_to, due_date, category, created_by } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description: description || null,
      status: status || 'todo',
      priority: priority || 'medium',
      assigned_to: assigned_to || null,
      due_date: due_date || null,
      category: category || null,
      created_by: created_by || null,
    })
    .select('*, staff:assigned_to(id, first_name, last_name, photo_url)')
    .single();

  if (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }

  return res.status(201).json(data);
}

// ─── PATCH Handler ────────────────────────────────────────────────────────────

async function handleUpdate(req, res, id) {
  const allowed = ['title', 'description', 'status', 'priority', 'assigned_to', 'due_date', 'category', 'follow_up_notes', 'completion_notes'];
  const updates = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select('*, staff:assigned_to(id, first_name, last_name, photo_url)')
    .single();

  if (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }

  return res.status(200).json(data);
}

// ─── DELETE Handler ───────────────────────────────────────────────────────────

async function handleDelete(req, res, id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }

  return res.status(200).json({ success: true });
}

// ─── Task Notes ──────────────────────────────────────────────────────────────

async function handleListNotes(req, res) {
  const { task_id } = req.query;
  if (!task_id) return res.status(400).json({ error: 'task_id required' });

  const { data, error } = await supabase
    .from('task_notes')
    .select('*')
    .eq('task_id', task_id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'Failed to fetch notes' });
  return res.status(200).json(data || []);
}

async function handleAddNote(req, res) {
  const { task_id, content, author } = req.body;
  if (!task_id || !content) return res.status(400).json({ error: 'task_id and content required' });

  const { data, error } = await supabase
    .from('task_notes')
    .insert({ task_id, content, author: author || 'Admin' })
    .select('*')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to add note' });
  return res.status(201).json(data);
}

async function handleDeleteNote(req, res) {
  const { note_id } = req.body;
  if (!note_id) return res.status(400).json({ error: 'note_id required' });

  const { error } = await supabase.from('task_notes').delete().eq('id', note_id);
  if (error) return res.status(500).json({ error: 'Failed to delete note' });
  return res.status(200).json({ success: true });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const { id, action } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        if (action === 'notes') return handleListNotes(req, res);
        return id ? handleGet(req, res, id) : handleList(req, res);
      case 'POST': {
        const bodyAction = req.body?.action;
        if (bodyAction === 'add-note') return handleAddNote(req, res);
        return handleCreate(req, res);
      }
      case 'PATCH':
        if (!id) return res.status(400).json({ error: 'Task ID required' });
        return handleUpdate(req, res, id);
      case 'DELETE': {
        const delAction = req.body?.action;
        if (delAction === 'delete-note') return handleDeleteNote(req, res);
        if (!id) return res.status(400).json({ error: 'Task ID required' });
        return handleDelete(req, res, id);
      }
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Tasks handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
