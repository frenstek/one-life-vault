// node scripts/fetch-participant.mjs <participant-id>   (uses .env.pull from `vercel env pull`)
import fs from 'node:fs'
const raw = fs.readFileSync(new URL('../.env.pull', import.meta.url), 'utf8')
const env = {}
for (const line of raw.split('\n')) {
  const i = line.indexOf('='); if (i < 0) continue
  env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, '').split('\\n').join('').trim()
}
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
const id = process.argv[2]
const r = await fetch(`${url}/rest/v1/participants?id=eq.${id}&select=*`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
const j = await r.json()
const p = Array.isArray(j) ? j[0] : j
if (!p || p.message) { console.log(JSON.stringify(j).slice(0, 300)); process.exit(1) }
for (const [k, v] of Object.entries(p)) if (v !== null && v !== '' && v !== false && !(Array.isArray(v) && !v.length)) console.log(k, '=', (k === 'notes' ? v : JSON.stringify(v).slice(0, 200)))
