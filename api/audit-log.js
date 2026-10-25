import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  // POST — log an entry
  if (req.method === 'POST') {
    try {
      const { action, resource_type, resource_name, details } = req.body || {};
      if (!action) return res.status(400).json({ error: 'Missing action' });

      const { error: insertErr } = await supabase.from('audit_log').insert({
        user_email: 'system',
        action,
        resource_type: resource_type || 'system',
        resource_name: resource_name || null,
        details: details || null,
      });

      if (insertErr) {
        console.error('Audit log insert error:', insertErr);
        return res.status(500).json({ error: 'Failed to log entry' });
      }
      return res.status(201).json({ success: true });
    } catch (err) {
      console.error('Audit log POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      page = '1',
      limit = '50',
      action,
      resource_type,
      search,
      from,
      to,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Filters
    if (action) {
      query = query.eq('action', action);
    }
    if (resource_type) {
      query = query.eq('resource_type', resource_type);
    }
    if (search) {
      query = query.or(`resource_name.ilike.%${search}%,user_email.ilike.%${search}%`);
    }
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      // Add a day to make 'to' inclusive
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt('created_at', toDate.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Audit log query error:', error);
      return res.status(500).json({ error: 'Failed to fetch audit log' });
    }

    res.status(200).json({
      entries: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil((count || 0) / limitNum),
    });
  } catch (error) {
    console.error('Audit log handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
