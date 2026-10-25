import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const env = {}; for (const l of readFileSync('../hcs-journal/.env', 'utf8').split('\n')) { const i = l.indexOf('='); if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, '').replace(/\n$/, ''); }
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const P = await sb.from('participants').select('*').ilike('last_name', '%fiorito%');
console.log('participants err:', P.error?.message, '| found:', (P.data || []).map(x => x.id + ' ' + x.first_name).join(' ; '));
const p = P.data?.[0]; if (!p) process.exit(1);
const I = await sb.from('incidents').select('*').or(`participant_id.eq.${p.id},title.ilike.%nino%,description.ilike.%nino%`).order('incident_date');
const N = await sb.from('progress_notes').select('*').or(`participant_id.eq.${p.id},participant_name.ilike.%fiorito%`).order('note_date');
console.log('incidents err:', I.error?.message, '| n:', (I.data || []).length, (I.data || []).map(i => i.incident_date + ':' + (i.category || '')).join(', '));
console.log('notes err:', N.error?.message, '| n:', (N.data || []).length, 'range', N.data?.[0]?.note_date, '->', N.data?.at(-1)?.note_date, '| with concerns:', (N.data || []).filter(n => n.concerns && n.concerns.trim()).length);
writeFileSync('scripts/nino_profile.json', JSON.stringify(p, null, 2)); writeFileSync('scripts/nino_incidents.json', JSON.stringify(I.data || [], null, 2)); writeFileSync('scripts/nino_notes.json', JSON.stringify(N.data || [], null, 2));
