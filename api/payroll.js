import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    // GET — list all payroll records
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('payroll_details')
        .select('*')
        .order('staff_name', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ records: data || [] });
    }

    // POST — create new record
    if (req.method === 'POST') {
      const { staff_name, ...rest } = req.body;
      if (!staff_name) return res.status(400).json({ error: 'staff_name required' });

      const { data, error } = await supabase
        .from('payroll_details')
        .insert({ staff_name, ...rest })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // PATCH — update existing record
    if (req.method === 'PATCH') {
      const { id, ...rest } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });

      const { data, error } = await supabase
        .from('payroll_details')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    // DELETE
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });

      const { error } = await supabase
        .from('payroll_details')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Payroll API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
