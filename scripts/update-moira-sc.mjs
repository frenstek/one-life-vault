// Moira Sunai: record Ines De Luca as Support Coordinator (8 Sep 2026).
import fs from 'node:fs'

const BS_N = String.fromCharCode(92) + 'n'
const raw = fs.readFileSync(new URL('../.env.pull', import.meta.url), 'utf8')
const env = {}
for (const line of raw.split(/\r?\n/)) {
  const i = line.indexOf('=')
  if (i < 0) continue
  env[line.slice(0, i).trim()] = line.slice(i + 1).trim().split(BS_N).join('').replace(/"/g, '')
}
const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_KEY
const H = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }
const ID = 'f94c85b9-76e7-46c7-a211-d615094af0ba'

const rows = await (await fetch(`${url}/rest/v1/participants?id=eq.${ID}&select=*`, { headers: H })).json()
const row = rows[0]
if (!row) { console.error('GET failed', rows); process.exit(1) }

const patch = {}
const SC = 'Ines De Luca (Support Coordination L2) - ines@acclaimedcss.com.au'
for (const k of ['support_coordinator', 'support_coordinator_name', 'sc_name']) if (k in row) patch[k] = 'Ines De Luca'
for (const k of ['support_coordinator_email', 'sc_email']) if (k in row) patch[k] = 'ines@acclaimedcss.com.au'
for (const k of ['support_coordinator_contact', 'sc_contact']) if (k in row) patch[k] = 'ines@acclaimedcss.com.au'
for (const [k, v] of Object.entries(row)) {
  if (typeof v === 'string' && v.includes('Incoming SC not yet named.'))
    patch[k] = v.replace('Incoming SC not yet named.', `Support Coordinator: ${SC} (SA v1.1, 8 Sep 2026).`)
}
if (!Object.keys(patch).length) { console.log('no matching columns; columns are:', Object.keys(row).join(', ')); process.exit(0) }
const r = await fetch(`${url}/rest/v1/participants?id=eq.${ID}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(patch) })
console.log(r.status, Object.keys(patch).join(', '))
