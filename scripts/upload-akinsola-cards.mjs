// Akinsola staff cards (8 Sep 2026): Bamidele's NDIS Worker Screening card and
// Kawia's Queensland driver licence -> staff-documents bucket + staff_documents rows,
// and Bamidele's screening number onto his staff record.
//   npx vercel env pull .env.pull --environment=production --yes && node scripts/upload-akinsola-cards.mjs
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
const H = { apikey: key, Authorization: `Bearer ${key}` }
const J = { ...H, 'content-type': 'application/json' }

const CARDS = [
  {
    staff_id: '4ad473da-87cc-4574-b2f0-72772ec9a9c1', // Bamidele
    file: 'C:/Users/kevin/Downloads/Screenshot 2026-09-08 133015.png',
    document_type: 'NDIS Worker Screening Check',
    document_name: 'Bamidele Akinsola - NDIS Worker Screening Card.png',
    issue_date: null,
    expiry_date: '2030-01-06',
    notes: 'NDIS Worker Screening number 52210988 (P = paid worker). Issued by Queensland Government. Expiry 06/01/2030.',
    staff_patch: { ndis_clearance_number: '52210988' },
  },
  {
    staff_id: '2b99005f-4806-4493-882a-6e170e992ac7', // Kawia
    file: 'C:/Users/kevin/Downloads/Screenshot 2026-09-08 133048.png',
    document_type: "Driver's License",
    document_name: 'Kawia Akinsola - Queensland Driver Licence.png',
    issue_date: '2026-04-02',
    expiry_date: '2027-04-06',
    notes: 'Queensland driver licence no. 078 835 024, class C, type O (open). Effective 02/04/2026, expiry 06/04/2027.',
    staff_patch: null,
  },
  {
    staff_id: '2b99005f-4806-4493-882a-6e170e992ac7', // Kawia
    file: 'C:/Users/kevin/Downloads/1000107814 (1).jpg',
    document_type: 'NDIS Worker Screening Check',
    document_name: 'Kawia Akinsola (Sunai) - NDIS Worker Screening Card.jpg',
    issue_date: null,
    expiry_date: '2027-05-09',
    notes: 'NDIS Worker Screening number 39740077 (P = paid worker), issued in her maiden name Kawia Sunai. Queensland Government. Expiry 09/05/2027.',
    staff_patch: { ndis_clearance_number: '39740077' },
  },
]

for (const c of CARDS) {
  const body = fs.readFileSync(c.file)
  const path = `${c.staff_id}/${c.document_type}/${c.document_name}`
  const up = await fetch(`${url}/storage/v1/object/staff-documents/${encodeURI(path)}`, {
    method: 'POST', headers: { ...H, 'content-type': c.file.endsWith('.jpg') ? 'image/jpeg' : 'image/png', 'x-upsert': 'true' }, body,
  })
  console.log('upload', c.document_name, up.status, up.ok ? '' : await up.text())
  if (!up.ok) continue

  // one row per document: replace any earlier row for the same path
  await fetch(`${url}/rest/v1/staff_documents?storage_path=eq.${encodeURIComponent(path)}`, { method: 'DELETE', headers: H })
  const row = {
    staff_id: c.staff_id, document_type: c.document_type, document_name: c.document_name, storage_path: path,
    file_type: c.file.endsWith('.jpg') ? 'jpg' : 'png', size: body.length, issue_date: c.issue_date, expiry_date: c.expiry_date, status: 'valid', notes: c.notes,
  }
  const ins = await fetch(`${url}/rest/v1/staff_documents`, { method: 'POST', headers: { ...J, Prefer: 'return=representation' }, body: JSON.stringify(row) })
  console.log('row', ins.status, ins.ok ? (await ins.json())[0].id : await ins.text())

  if (c.staff_patch) {
    const p = await fetch(`${url}/rest/v1/staff?id=eq.${c.staff_id}`, { method: 'PATCH', headers: { ...J, Prefer: 'return=representation' }, body: JSON.stringify(c.staff_patch) })
    console.log('staff patch', p.status, p.ok ? (await p.json())[0].ndis_clearance_number : await p.text())
  }
}
