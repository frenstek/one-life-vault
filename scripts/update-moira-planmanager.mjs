// Moira Sunai: record Hemera Plans as plan manager (8 Sep 2026).
//   npx vercel env pull .env.pull --environment=production --yes && node scripts/update-moira-planmanager.mjs
import fs from 'node:fs'

const BS_N = String.fromCharCode(92) + 'n' // the literal two characters "\n" that vercel env pull leaves on values
const raw = fs.readFileSync(new URL('../.env.pull', import.meta.url), 'utf8')
const env = {}
for (const line of raw.split(/\r?\n/)) {
  const i = line.indexOf('=')
  if (i < 0) continue
  env[line.slice(0, i).trim()] = line.slice(i + 1).trim().split(BS_N).join('').replace(/"/g, '')
}
const url = env.SUPABASE_URL
const key = env.SUPABASE_SERVICE_KEY
const H = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }
const ID = 'f94c85b9-76e7-46c7-a211-d615094af0ba'

const res = await fetch(`${url}/rest/v1/participants?id=eq.${ID}&select=*`, { headers: H })
const rows = await res.json()
if (!Array.isArray(rows) || !rows[0]) { console.error('GET failed', res.status, rows); process.exit(1) }
const row = rows[0]

const patch = { funding_type: 'Plan-managed (Hemera Plans)' }
for (const [k, v] of Object.entries(row)) {
  if (typeof v === 'string' && v.includes('Plan manager and Speech Pathologist not yet named')) {
    patch[k] = v.replace('Plan manager and Speech Pathologist not yet named.', 'Plan manager: Hemera Plans (SA v1.1, 8 Sep 2026). Speech Pathologist not yet named.')
  }
}
for (const k of ['plan_manager', 'plan_manager_name']) if (k in row) patch[k] = 'Hemera Plans'

const r = await fetch(`${url}/rest/v1/participants?id=eq.${ID}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(patch) })
const out = await r.json()
console.log(r.status, Object.keys(patch).join(', '), '->', out[0]?.funding_type)
