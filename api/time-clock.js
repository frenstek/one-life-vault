import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

const SUMMARY_MAX_DAYS = 31;
const SUMMARY_ENTRY_LIMIT = 10000;

async function getOpenEntry(staffId, fields = 'id') {
  const { data, error } = await supabase
    .from('time_entries')
    .select(fields)
    .eq('staff_id', staffId)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const { method } = req;

    // ─── GET ───
    if (method === 'GET') {
      const { action, staff_id, start_date, end_date } = req.query;

      // All-staff weekly summary
      if (action === 'summary') {
        if (!start_date || !end_date) {
          return res.status(400).json({ error: 'start_date and end_date required' });
        }

        // Guard against unbounded ranges — endpoint is for weekly summaries.
        const startMs = Date.parse(start_date);
        const endMs = Date.parse(end_date);
        if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
          return res.status(400).json({ error: 'Invalid start_date or end_date' });
        }
        const rangeDays = Math.floor((endMs - startMs) / 86400000);
        if (rangeDays < 0 || rangeDays > SUMMARY_MAX_DAYS) {
          return res
            .status(400)
            .json({ error: `Date range must be between 0 and ${SUMMARY_MAX_DAYS} days` });
        }

        // Fetch active staff and entries in parallel.
        const [staffResult, entriesResult] = await Promise.all([
          supabase
            .from('staff')
            .select('id, first_name, last_name, role, status')
            .eq('status', 'active')
            .order('last_name', { ascending: true }),
          supabase
            .from('time_entries')
            .select('staff_id, clock_in, clock_out, break_minutes, break_start')
            .gte('clock_in', start_date)
            .lte('clock_in', end_date + 'T23:59:59.999Z')
            .limit(SUMMARY_ENTRY_LIMIT),
        ]);
        if (staffResult.error) throw staffResult.error;
        if (entriesResult.error) throw entriesResult.error;

        const staffList = staffResult.data;
        const entries = entriesResult.data;

        // Group entries by staff_id once — O(entries) instead of O(staff × entries).
        const entriesByStaff = new Map();
        for (const e of entries) {
          let bucket = entriesByStaff.get(e.staff_id);
          if (!bucket) {
            bucket = [];
            entriesByStaff.set(e.staff_id, bucket);
          }
          bucket.push(e);
        }

        const summary = staffList.map((s) => {
          const staffEntries = entriesByStaff.get(s.id) || [];
          let totalMs = 0;
          let sessions = 0;
          let active = false;
          let onBreak = false;
          for (const e of staffEntries) {
            if (e.clock_out) {
              sessions += 1;
              const ms =
                new Date(e.clock_out) - new Date(e.clock_in) - (e.break_minutes || 0) * 60000;
              if (ms > 0) totalMs += ms;
            } else {
              active = true;
              if (e.break_start) onBreak = true;
            }
          }
          return {
            id: s.id,
            first_name: s.first_name,
            last_name: s.last_name,
            role: s.role,
            sessions,
            total_ms: totalMs,
            active,
            on_break: onBreak,
          };
        });

        return res.json(summary);
      }

      // Currently clocked-in entries
      if (action === 'active') {
        const { data, error } = await supabase
          .from('time_entries')
          .select('*, staff:staff_id(id, first_name, last_name)')
          .is('clock_out', null)
          .order('clock_in', { ascending: false });

        if (error) throw error;

        if (staff_id) {
          return res.json(data.filter((e) => e.staff_id === staff_id));
        }
        return res.json(data);
      }

      // Shift handovers
      if (action === 'handovers') {
        const { property_id, date } = req.query;
        let q = supabase.from('shift_handovers').select('*').order('shift_date', { ascending: false }).order('created_at', { ascending: false }).limit(50);
        if (property_id) q = q.eq('property_id', property_id);
        if (date) q = q.eq('shift_date', date);
        const { data, error } = await q;
        if (error) throw error;
        return res.json(data);
      }

      // Roster
      if (action === 'roster') {
        const { property_id: rPropId } = req.query;
        if (!start_date || !end_date) return res.status(400).json({ error: 'start_date and end_date required' });
        let q = supabase.from('shift_roster').select('*').gte('shift_date', start_date).lte('shift_date', end_date).order('shift_date').order('start_time');
        if (rPropId) q = q.eq('property_id', rPropId);
        const { data, error } = await q;
        if (error) throw error;
        return res.json(data);
      }

      // List entries
      let query = supabase
        .from('time_entries')
        .select('*, staff:staff_id(id, first_name, last_name)')
        .order('clock_in', { ascending: false });

      if (staff_id) query = query.eq('staff_id', staff_id);
      if (start_date) query = query.gte('clock_in', start_date);
      if (end_date) query = query.lte('clock_in', end_date + 'T23:59:59.999Z');

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return res.json(data);
    }

    // ─── POST ───
    if (method === 'POST') {
      const { action, staff_id, notes } = req.body;

      if (action === 'clock-in') {
        if (!staff_id) return res.status(400).json({ error: 'staff_id required' });

        const existing = await getOpenEntry(staff_id);
        if (existing) {
          return res.status(400).json({ error: 'Already clocked in. Clock out first.' });
        }

        const { data, error } = await supabase
          .from('time_entries')
          .insert({ staff_id, notes })
          .select('*, staff:staff_id(id, first_name, last_name)')
          .single();

        if (error) throw error;
        return res.json(data);
      }

      if (action === 'clock-out') {
        if (!staff_id) return res.status(400).json({ error: 'staff_id required' });

        const entry = await getOpenEntry(staff_id, 'id, notes, break_start, break_minutes');
        if (!entry) {
          return res.status(400).json({ error: 'Not clocked in.' });
        }

        // If still on break, end the break first
        let breakMinutes = entry.break_minutes || 0;
        if (entry.break_start) {
          const extra = Math.round((Date.now() - new Date(entry.break_start).getTime()) / 60000);
          if (extra > 0) breakMinutes += extra;
        }

        // Append (don't overwrite) notes
        let combinedNotes = entry.notes || null;
        if (notes) {
          combinedNotes = combinedNotes ? `${combinedNotes} | ${notes}` : notes;
        }

        const { data, error } = await supabase
          .from('time_entries')
          .update({
            clock_out: new Date().toISOString(),
            notes: combinedNotes,
            break_minutes: breakMinutes,
            break_start: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', entry.id)
          .select('*, staff:staff_id(id, first_name, last_name)')
          .single();

        if (error) throw error;
        return res.json(data);
      }

      if (action === 'start-break') {
        if (!staff_id) return res.status(400).json({ error: 'staff_id required' });

        const open = await getOpenEntry(staff_id, 'id, break_start');
        if (!open) {
          return res.status(400).json({ error: 'Not clocked in.' });
        }
        if (open.break_start) {
          return res.status(400).json({ error: 'Already on break.' });
        }

        const { data, error } = await supabase
          .from('time_entries')
          .update({ break_start: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', open.id)
          .select('*, staff:staff_id(id, first_name, last_name)')
          .single();

        if (error) throw error;
        return res.json(data);
      }

      if (action === 'end-break') {
        if (!staff_id) return res.status(400).json({ error: 'staff_id required' });

        const open = await getOpenEntry(staff_id, 'id, break_start, break_minutes');
        if (!open) {
          return res.status(400).json({ error: 'Not clocked in.' });
        }
        if (!open.break_start) {
          return res.status(400).json({ error: 'Not on break.' });
        }

        const extraMins = Math.max(
          1,
          Math.round((Date.now() - new Date(open.break_start).getTime()) / 60000),
        );
        const newBreakMinutes = (open.break_minutes || 0) + extraMins;

        const { data, error } = await supabase
          .from('time_entries')
          .update({
            break_start: null,
            break_minutes: newBreakMinutes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', open.id)
          .select('*, staff:staff_id(id, first_name, last_name)')
          .single();

        if (error) throw error;
        return res.json(data);
      }

      // ── Shift Handovers ──
      if (action === 'create-handover') {
        const { staff_id: hStaffId, staff_name, property_id, property_name, shift_date, shift_type, participant_notes, maintenance_notes, general_notes, flagged_items } = req.body;
        if (!general_notes) return res.status(400).json({ error: 'general_notes required' });
        const { data, error } = await supabase
          .from('shift_handovers')
          .insert({ staff_id: hStaffId, staff_name: staff_name || 'Staff', property_id, property_name, shift_date: shift_date || new Date().toISOString().split('T')[0], shift_type: shift_type || 'morning', participant_notes, maintenance_notes, general_notes, flagged_items })
          .select()
          .single();
        if (error) throw error;
        return res.json(data);
      }

      // ── Roster Shifts ──
      if (action === 'create-roster-shift') {
        const { staff_id: rStaffId, staff_name: rName, property_id: rPropId, property_name: rPropName, shift_date: rDate, shift_type: rType, start_time, end_time, notes: rNotes } = req.body;
        if (!rStaffId || !rDate || !start_time || !end_time) return res.status(400).json({ error: 'staff_id, shift_date, start_time, end_time required' });
        const { data, error } = await supabase
          .from('shift_roster')
          .insert({ staff_id: rStaffId, staff_name: rName || 'Staff', property_id: rPropId, property_name: rPropName, shift_date: rDate, shift_type: rType || 'morning', start_time, end_time, notes: rNotes })
          .select()
          .single();
        if (error) throw error;
        return res.json(data);
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    // ─── PATCH ───
    if (method === 'PATCH') {
      const { id, action: patchAction, clock_in, clock_out, break_minutes, notes } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });

      // Update roster shift
      if (patchAction === 'update-roster') {
        const { staff_id: rsId, staff_name: rsName, property_id: rsPropId, property_name: rsPropName, shift_date: rsDate, shift_type: rsType, start_time: rsStart, end_time: rsEnd, notes: rsNotes, status: rsStatus } = req.body;
        const rosterUpdates = { updated_at: new Date().toISOString() };
        if (rsId !== undefined) rosterUpdates.staff_id = rsId;
        if (rsName !== undefined) rosterUpdates.staff_name = rsName;
        if (rsPropId !== undefined) rosterUpdates.property_id = rsPropId;
        if (rsPropName !== undefined) rosterUpdates.property_name = rsPropName;
        if (rsDate !== undefined) rosterUpdates.shift_date = rsDate;
        if (rsType !== undefined) rosterUpdates.shift_type = rsType;
        if (rsStart !== undefined) rosterUpdates.start_time = rsStart;
        if (rsEnd !== undefined) rosterUpdates.end_time = rsEnd;
        if (rsNotes !== undefined) rosterUpdates.notes = rsNotes;
        if (rsStatus !== undefined) rosterUpdates.status = rsStatus;
        const { data, error } = await supabase.from('shift_roster').update(rosterUpdates).eq('id', id).select().single();
        if (error) throw error;
        return res.json(data);
      }

      const updates = { updated_at: new Date().toISOString() };
      if (clock_in !== undefined) updates.clock_in = clock_in;
      if (clock_out !== undefined) updates.clock_out = clock_out;
      if (break_minutes !== undefined) updates.break_minutes = break_minutes;
      if (notes !== undefined) updates.notes = notes;

      const { data, error } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', id)
        .select('*, staff:staff_id(id, first_name, last_name)')
        .single();

      if (error) throw error;
      return res.json(data);
    }

    // ─── DELETE ───
    if (method === 'DELETE') {
      const { id, action: delAction } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });

      if (delAction === 'delete-roster') {
        const { error } = await supabase.from('shift_roster').delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
      }

      const { error } = await supabase.from('time_entries').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('time-clock error:', err);
    res.status(500).json({ error: err.message });
  }
}
