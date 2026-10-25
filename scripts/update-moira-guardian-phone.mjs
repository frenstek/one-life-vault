// Moira Sunai: record Guardian Kawia Sunai's phone (+61 447 057 034), 9 Sep 2026.
import fs from 'node:fs'
const BS_N = String.fromCharCode(92) + 'n'
const raw = fs.readFileSync(new URL('../.env.pull', import.meta.url), 'utf8')
const env = {}
for (const line of raw.split(/\r?\n/)) { const i = line.indexOf('='); if (i < 0) continue; env[line.slice(0, i).trim()] = line.slice(i + 1).trim().split(BS_N).join('').replace(/"/g, '') }
const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_KEY
const H = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }
const ID = 'f94c85b9-76e7-46c7-a211-d615094af0ba'
const PHONE = '+61 447 057 034'
const rows = await (await fetch(`${url}/rest/v1/participants?id=eq.${ID}&select=*`, { headers: H })).json()
const row = rows[0]; if (!row) { console.error('GET failed', rows); process.exit(1) }
const patch = {}
for (const k of ['emergency_contact_phone', 'emergency_phone', 'guardian_phone', 'nominee_phone', 'representative_phone']) if (k in row) patch[k] = PHONE
for (const k of ['emergency_contact', 'emergency_contact_name']) if (k in row && (!row[k] || /kawia/i.test(row[k]))) patch[k] = 'Kawia Sunai (niece, Guardian)'
for (const [k, v] of Object.entries(row)) if (typeof v === 'string' && /Kawia'?s phone|phone to confirm/i.test(v)) patch[k] = v.replace(/Kawia'?s phone[^.;]*/i, `Kawia's phone ${PHONE}`).replace(/phone to confirm/i, PHONE)
if (!Object.keys(patch).length) { console.log('no matching columns; columns are:', Object.keys(row).join(', ')); process.exit(0) }
const r = await fetch(`${url}/rest/v1/participants?id=eq.${ID}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(patch) })
console.log(r.status, Object.keys(patch).join(', '))
