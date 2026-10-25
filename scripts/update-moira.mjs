// One-off: fill Moira Sunai's vault profile from source documents (8 Sep 2026).
// Sources: NDIA plan approval 02/10/2025, budget breakdown 07/10/2025, QCAT
// amended notice of hearing 03/09/2026, outgoing Support Coordinator handover.
import fs from 'node:fs'
const raw = fs.readFileSync(new URL('../.env.pull', import.meta.url), 'utf8')
const env = {}
for (const line of raw.split('\n')) { const i = line.indexOf('='); if (i < 0) continue; env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, '').split('\\n').join('').trim() }
const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_KEY
const H = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }
const ID = 'f94c85b9-76e7-46c7-a211-d615094af0ba'

const patch = {
  preferred_name: 'Moira',
  date_of_birth: '1958-04-16',
  state: 'QLD',
  location: 'Own home in Seisia QLD 4876 (street address to confirm). NDIA postal address on plan: 13 Blair Ct, Aitkenvale QLD 4814.',
  plan_start_date: '2025-10-02',
  plan_end_date: '2030-10-01',
  funding_type: 'Plan-managed',
  funding_ratio: '1:1',
  support_level: 'Complex',
  primary_disability: 'Deafblind (deaf and blind); non-verbal',
  secondary_disability: 'Type II Diabetes',
  communication_needs: 'Deafblind and non-verbal. All interactions through the established communication methods known to her regular team; consistency of approach is essential to her safety and engagement. Speech Pathology and hearing-related AT are funded in the plan.',
  mobility: 'Walking frame (AT repairs and maintenance funded in plan).',
  dietary_requirements: 'Type II Diabetes (NDSS card 9580443). Confirm dietary plan with Bamaga Primary Health.',
  cultural_considerations: 'Torres Strait Islander woman. Deliver services in a culturally safe, respectful, person-centred way; supporting her connection to family, community and Country is a priority. Moira is a "clever person" in her culture (able to see and cleanse spirits), a valued role in her community. Family is very important to her; she sees them about every 2 months and enjoys doing things with the staff who support her daily.',
  gp_clinic: 'Bamaga Primary Health Care Centre (QLD Health)',
  emergency_contact_name: 'Kawia Sunai',
  emergency_contact_relationship: 'Niece; current Guardian (QCAT interim order 23 Sep 2021)',
  occupational_therapist: 'Matthew Firth, Do It OT, 0438 149 050, matt@doitot.com.au, PO Box 152 Cooktown QLD 4895 (completed FCA review, submitted to NDIS planner Kate)',
  bio: 'From her NDIS plan (in her words): I live in my own home in Seisia. My family is very important to me and I enjoy having them around, but now I like to do things more with the staff who support me daily. I enjoy spending time with staff on personal care such as maintaining my hair and putting shaving cream on my hands and legs. I enjoy being outside and developing trust to access the community, going for drives to the park and beach and going for walks. I like to find items around the house that feel good. I enjoy good food and being around people; I like to take life slow and enjoy my own time and naps. I love receiving new clothes and toiletries and I really enjoy touching things.\n\nGoals: (1) improve my communication so I can tell others what I want and need; (2) get out of the house more and increase my social and community participation; (3) more funded supports to ensure my safety and basic needs are met.',
  notes: [
    'NDIS PLAN 02/10/2025 - 01/10/2030 (60 months), total $5,830,325.70. My NDIS contact: Nicole Q (1800 800 110). Plan approval letter and budget breakdown (7.10.2025) on file.',
    'CORE (plan-managed, $5,736,048.90 total; ~$95,584.98 per month): Assistance with Daily Life $5,269,794.50 - self-care 1:1 at 12h weekday day ($105.35), 4h weekday evening ($116.07), 6h weekday night ($118.22), 22h Saturday ($148.25), 22h Sunday ($191.15), 22h public holiday ($234.05). Social & community participation $465,304.40 (2h/day 1:1). Consumables $950 (low-cost AT incl. hearing $500).',
    'CAPACITY BUILDING: Plan management $6,267 ($104.45/mo); Improved Daily Living $45,394.44 (OT 32h yr1 then 15h/yr; Speech 30h yr1 then 6h/yr; other professional 10h); Support Coordination L2 $32,445.36 (60h yr1, 48h yr2, 36h/yr after). CAPITAL: AT repairs $1,250 (walking frame). RECURRING transport $8,920 is SELF-MANAGED and paid to Moira ($68.32/fortnight) - not claimable by providers.',
    'LEGAL: Guardian - Kawia Sunai (niece) under QCAT interim order 23 Sep 2021. Administrator - The Public Trustee of Queensland (since 27 Feb 2025), client no. PTQ20907790. QCAT hearing 21 Sep 2026 10:45am, Townsville Supreme and District Courts, ref G45235: review of guardian and administrator appointments and Kawia Sunai applications to be appointed guardian and administrator. Case manager Hayden Burrow 1300 753 228, QCATHURDHPT@justice.qld.gov.au. Other person notified: Krys Bickley (role not stated).',
    'HEALTH: most recent hospital admission was an ear infection requiring surgery; recovered, no ongoing concerns at SC handover. Type II Diabetes. Bamaga Primary Health (QLD Health) attends 3-5 times a year.',
    'SUPPORT COORDINATION: previous SC handed over (5 years of support; Moira returning to Country). Incoming SC not yet named. Plan manager and Speech Pathologist not yet named.',
    'CONFLICT OF INTEREST - TO RESOLVE: Kawia Sunai is Moira niece, daily informal support and legal guardian. OLF support worker Kawia Akinsola (onboarded 4 Sep 2026) lives at 4 Sunai Street, Seisia and uses ksunai02@gmail.com. If these are the same person, she is both the guardian who signs on Moira behalf and an OLF employee who could be rostered to her; record in the COI register and decide who signs and who is rostered before services start. Not assumed - confirm.',
  ].join('\n\n'),
}
const r = await fetch(`${url}/rest/v1/participants?id=eq.${ID}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(patch) })
const j = await r.json(); console.log('participant PATCH', r.status, Array.isArray(j) ? 'ok' : JSON.stringify(j).slice(0, 300))

// files: plan approval + QCAT notice (the budget breakdown was filed on 4 Sep)
const files = [
  ['C:/Users/kevin/Downloads/02.10.2025 Moira Sunai Plan Approval.pdf', '02.10.2025 Moira Sunai Plan Approval.pdf', 'NDIS Plan', 'NDIS plan approval letter and full plan, 02/10/2025 - 01/10/2030, $5,830,325.70. Goals, supports, funding periods.'],
  ['C:/Users/kevin/Downloads/G45235 QCAT-Notice v2-01 03-SEP-2026 (1).pdf', 'G45235 QCAT Amended Notice of Hearing 03-09-2026.pdf', 'Legal', 'QCAT amended notice of hearing 21 Sep 2026 10:45am Townsville: review/appointment of guardian and administrator. Applicant Kawia Sunai.'],
]
for (const [src, name, category, notes] of files) {
  const buf = fs.readFileSync(src)
  const path = `${ID}/${Date.now()}_${name.replace(/[^a-z0-9.]/gi, '_')}`
  const up = await fetch(`${url}/storage/v1/object/participant-files/${path}`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/pdf', 'x-upsert': 'false' }, body: buf })
  console.log('upload', name, up.status, up.ok ? '' : (await up.text()).slice(0, 200))
  if (!up.ok) continue
  for (const cat of [category, 'General']) {
    const ins = await fetch(`${url}/rest/v1/participant_files`, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify({ participant_id: ID, file_name: name, category: cat, storage_path: path, file_type: 'pdf', size: buf.length, notes, uploaded_by: 'Staff' }) })
    const t = await ins.text(); console.log('  row', cat, ins.status, ins.ok ? '' : t.slice(0, 160))
    if (ins.ok) break
  }
}
