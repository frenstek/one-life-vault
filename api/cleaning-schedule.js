import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    // GET — list completions for a property + week
    if (req.method === 'GET') {
      const { week_start, property } = req.query;
      if (!week_start || !property) {
        return res.status(400).json({ error: 'week_start and property are required' });
      }

      const { data, error } = await supabase
        .from('cleaning_completions')
        .select('*')
        .eq('property', property)
        .eq('week_start', week_start);

      if (error) throw error;
      return res.status(200).json({ completions: data || [] });
    }

    // POST — mark a task as complete
    if (req.method === 'POST') {
      const { task_id, day, week_start, property, completed_by } = req.body;

      if (!task_id || !day || !week_start || !property) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data, error } = await supabase
        .from('cleaning_completions')
        .insert({
          task_id,
          day,
          week_start,
          property,
          completed_by: completed_by || 'Staff',
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // DELETE — uncomplete a task
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { error } = await supabase
        .from('cleaning_completions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Cleaning schedule API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
