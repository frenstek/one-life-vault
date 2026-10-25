import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    // GET — list entries for a participant + date
    if (req.method === 'GET') {
      const { participant_id, date } = req.query;
      if (!participant_id || !date) {
        return res.status(400).json({ error: 'participant_id and date are required' });
      }

      const { data, error } = await supabase
        .from('fluid_balance_entries')
        .select('*')
        .eq('participant_id', participant_id)
        .eq('date', date)
        .order('time', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ entries: data || [] });
    }

    // POST — create new entry
    if (req.method === 'POST') {
      const { participant_id, date, time, type, description, amount_ml, staff_initials } = req.body;

      if (!participant_id || !date || !time || !type || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data, error } = await supabase
        .from('fluid_balance_entries')
        .insert({
          participant_id,
          date,
          time,
          type,
          description,
          amount_ml: amount_ml || null,
          staff_initials: staff_initials || null,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // DELETE — remove entry by id
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { error } = await supabase
        .from('fluid_balance_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Fluid balance API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
