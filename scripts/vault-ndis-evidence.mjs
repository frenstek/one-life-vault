// Vault everything OLF has already sent for NDIS payment reviews, per participant, under the
// "NDIS Review" file category, so the record of what went to the NDIA lives with the participant.
//
//   node scripts/vault-ndis-evidence.mjs            (dry run: prints what it would upload)
//   node scripts/vault-ndis-evidence.mjs --go       (uploads + inserts; skips anything already vaulted)
//
// Sources are the submission zips / folders as they were sent (see SUBMISSIONS). Files are never
// altered. Each row's notes say which review, which response and when it was sent.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import AdmZip from 'adm-zip'

const envFile = 'C:/Users/kevin/OneDrive/Desktop/CLAUDE/hcs-journal/.env'
for (const l of readFileSync(envFile, 'utf8').split('\n')) { const i = l.indexOf('='); if (i > 0) process.env[l.slice(0, i).trim()] ||= l.slice(i + 1).trim().replace(/^"|"$/g, '').replace(/\\n/g, '').trim() }
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY
const H = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }
const GO = process.argv.includes('--go')

const P = {
  nathan: '1941cb8e-575f-473f-a4ee-a7f676dbc9e7',
  nicole: '71660d0d-84fc-410b-b15a-89843d624c9b',
  darrell: '2b566861-d73f-428f-9283-05d51096c056',
  john: '5450d33e-860e-4427-958e-dba91479c001',
}
const DL = 'C:/Users/kevin/Downloads/', DESK = 'C:/Users/kevin/OneDrive/Desktop/'

// who a file in a mixed zip belongs to, from its name; null = both Nathan and Nicole
function owner(name) {
  const n = name.toLowerCase()
  if (/nathan|gottaas|gottas/.test(n)) return ['nathan']
  if (/nicole|knight|nk|_nk\./.test(n)) return ['nicole']
  if (/darrell|twyford|dt-/.test(n)) return ['darrell']
  if (/john|ross|rosjr/.test(n)) return ['john']
  return null
}

// [label, sent, source, kind, fixed owner or null (= by filename, both if unknown)]
const SUBMISSIONS = [
  ['IPML0346 · Response 2 · sent ~5 Jun 2026', '2026-06-05', DL + 'Nicole Elizabeth Knight.zip', 'zip', ['nicole']],
  ['IPML0346 · Response 2 · sent 28 Jun 2026', '2026-06-28', DESK + 'Nathan_Gottaas_NDIS_Submission.zip', 'zip', ['nathan']],
  ['IPML0346 · Response 3 · sent 24 Jul 2026 · week 29 Dec – 1 Jan', '2026-07-24', DL + 'IPML0346_Dec29-Jan1.zip', 'zip', ['nathan']],
  ['IPML0346 · Response 3 · sent 24 Jul 2026 · week 16–22 Mar', '2026-07-24', DL + 'IPML0346_Week_16-22_March_2026.zip', 'zip', null],
  ['IPML0346 · Response 3 · sent 24 Jul 2026 · week 23–31 Mar', '2026-07-24', DL + 'IPML0346_Week_23-31_March_2026.zip', 'zip', null],
  ['IPML0346 · Response 3 · sent 24 Jul 2026 · response letter', '2026-07-24', DL + 'IPML0346_Response_Letter.pdf', 'file', ['nathan', 'nicole']],
  ['IPML0346 · Response 4 · sent 14 Aug 2026', '2026-08-14', DL + 'IPML0346_Nathan_Gottaas_Evidence.zip', 'zip', ['nathan']],
  ['IPML0346 · Response 4 · sent 14 Aug 2026', '2026-08-14', DL + 'IPML0346_Nicole_Knight_Evidence.zip', 'zip', ['nicole']],
  ['Claim evidence pack · Jun–Jul 2026 (invoices, notes, rosters as sent)', '2026-07-31', DESK + 'NDIS EVIDENCES NEW', 'dir', null],
]

const CT = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png' }
const slug = (s) => s.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/_+/g, '_')

function entries(src, kind) {
  if (kind === 'file') return [{ name: basename(src), buf: readFileSync(src) }]
  if (kind === 'zip') return new AdmZip(src).getEntries().filter((e) => !e.isDirectory).map((e) => ({ name: basename(e.entryName), buf: e.getData() }))
  const out = []
  const walk = (d, rel) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p, rel + '/' + f) : out.push({ name: f, buf: readFileSync(p), folder: rel }) } }
  walk(src, ''); return out
}

const existing = new Set()
{
  const r = await fetch(`${url}/rest/v1/participant_files?select=storage_path&category=eq.NDIS%20Review&limit=2000`, { headers: H })
  for (const row of await r.json()) existing.add(row.storage_path)
}

let planned = 0, uploaded = 0, skipped = 0, failed = 0
for (const [label, sent, src, kind, fixed] of SUBMISSIONS) {
  const batch = slug(basename(src).replace(/\.zip$/i, ''))
  for (const { name, buf, folder } of entries(src, kind)) {
    const who = fixed ?? (folder ? owner(folder) : null) ?? owner(name) ?? ['nathan', 'nicole']
    for (const k of who) {
      const path = `${P[k]}/ndis-review/${batch}/${slug(name)}`
      if (existing.has(path)) { skipped++; continue }
      planned++
      const notes = `Sent to NDIA — ${label}. Source: ${basename(src)}. Vaulted 1 Oct 2026 as sent, unaltered.`
      if (!GO) { console.log(`  would vault  ${k.padEnd(7)} ${name}  ← ${label}`); continue }
      const ext = extname(name).slice(1).toLowerCase()
      const up = await fetch(`${url}/storage/v1/object/participant-files/${path}`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': CT[ext] || 'application/octet-stream', 'x-upsert': 'true' }, body: buf })
      if (!up.ok) { failed++; console.log('  UPLOAD FAIL', name, up.status, (await up.text()).slice(0, 120)); continue }
      const ins = await fetch(`${url}/rest/v1/participant_files`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ participant_id: P[k], file_name: name, category: 'NDIS Review', storage_path: path, file_type: ext, size: buf.length, notes, uploaded_by: 'Kevin Rae Geronimo', created_at: `${sent}T09:00:00+10:00` }) })
      if (!ins.ok) { failed++; console.log('  INSERT FAIL', name, ins.status, (await ins.text()).slice(0, 120)); continue }
      uploaded++; existing.add(path); console.log(`  vaulted  ${k.padEnd(7)} ${name}`)
    }
  }
}
console.log(GO ? `\nuploaded ${uploaded}, already there ${skipped}, failed ${failed}` : `\nplanned ${planned}, already vaulted ${skipped}  (run with --go to upload)`)
