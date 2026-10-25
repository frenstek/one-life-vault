// Moira Sunai: Guardian's surname is Akinsola (Kawia Akinsola, nee Sunai) - Kevin, 9 Sep 2026.
import fs from 'node:fs'
const BS_N = String.fromCharCode(92) + 'n'
const raw = fs.readFileSync(new URL('../.env.pull', import.meta.url), 'utf8')
const env = {}
for (const line of raw.split(/\r?\n/)) { const i = line.indexOf('='); if (i < 0) continue; env[line.slice(0, i).trim()] = line.slice(i + 1).trim().split(BS_N).join('').replace(/"/g, '') }
const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_KEY
const H = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }
const ID = 'f94c85b9-76e7-46c7-a211-d615094af0ba'
const rows = await (await fetch(`${url}/rest/v1/participants?id=eq.${ID}&select=*`, { headers: H })).json()
const row = rows[0]; if (!row) { console.error('GET failed', rows); process.exit(1) }
const patch = {}
for (const [k, v] of Object.entries(row)) {
  if (typeof v === 'string' && /Kawia Sunai/.test(v)) patch[k] = v.replace(/Kawia Sunai/g, 'Kawia Akinsola (nee Sunai)')
}
console.log('fields touched:', Object.keys(patch).join(', ') || 'none')
if (!Object.keys(patch).length) process.exit(0)
const r = await fetch(`${url}/rest/v1/participants?id=eq.${ID}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(patch) })
const out = await r.json(); console.log(r.status, 'emergency_contact_name =', out[0]?.emergency_contact_name)
