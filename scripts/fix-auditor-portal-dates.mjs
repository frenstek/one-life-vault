/**
 * Copy updated PDFs from 'documents' bucket to 'auditor-portal' bucket.
 * These are the same files that were patched in fix-olf-dates.mjs.
 */

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://czdlemutsimvwfpwylxh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk'
);

const SRC = 'documents';
const DST = 'auditor-portal';

// Map: source path in 'documents' bucket → destination folder in 'auditor-portal' bucket
const COPIES = [
  // Module 1 folder (bd49260a)
  ['Policies and Procedures/Core 1 - Rights & Responsibilities/Form111.OLF Code of Conduct.pdf', 'bd49260a-30be-4689-ba20-d60f1146bd95'],
  ['Policies and Procedures/Core 1 - Rights & Responsibilities/Participant Handbook V02 - June 2026.pdf', 'bd49260a-30be-4689-ba20-d60f1146bd95'],

  // Module 3 folder (4298ed63)
  ['Policies and Procedures/Core 2 - Governance & Operations/Form100.Organisation Chart.pdf', '4298ed63-bb7d-4b93-85e0-9ae063030880'],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form104.Digital Compliance Monitoring Policy.pdf', '4298ed63-bb7d-4b93-85e0-9ae063030880'],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form105.Digital Registers Management Policy.pdf', '4298ed63-bb7d-4b93-85e0-9ae063030880'],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form107.Policy Document Register.pdf', '4298ed63-bb7d-4b93-85e0-9ae063030880'],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form108.NDIS Policy Manual Addendum V02.pdf', '4298ed63-bb7d-4b93-85e0-9ae063030880'],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form112.Insurance Register.pdf', '4298ed63-bb7d-4b93-85e0-9ae063030880'],

  // High Intensity folder (cfa8179f)
  ['Policies and Procedures/Module 1 - High Intensity/Form110.Clinical Governance Framework.pdf', 'cfa8179f-d329-423d-8da4-4161e6f1e42b'],

  // Participant Files folder (6240dc5b)
  ['Policies and Procedures/Core 4 - Support Environment/Form106.SIL House Accommodation Audit Checklist.pdf', '6240dc5b-3dc2-4dda-95e0-89f730f78da2'],

  // Also check for the other docs that might be in other module folders
  // Module 6 (d491d546) — Worker Screening, Prof Dev, Performance Mgmt, Worker Handbook
  ['Policies and Procedures/Core 2 - Governance & Operations/Form109.Worker Screening and Recruitment Procedure.pdf', 'd491d546-c2d2-45bd-8561-0795493ec768'],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form113.Professional Development Policy.pdf', 'd491d546-c2d2-45bd-8561-0795493ec768'],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form114.Performance Management Procedure.pdf', 'd491d546-c2d2-45bd-8561-0795493ec768'],
  ['Policies and Procedures/Core 2 - Governance & Operations/Worker Handbook V02 - June 2026.pdf', 'd491d546-c2d2-45bd-8561-0795493ec768'],

  // Module 7 (efc3c35b) — Business Continuity Plan
  ['Policies and Procedures/Core 2 - Governance & Operations/Form103.Business Continuity Plan.pdf', 'efc3c35b-597b-4fc2-9828-f87f5b076799'],

  // High Intensity folder — Training Guides
  ['Training Resources/OLF-TG-HI-001 Urinary Catheter Care Guide.pdf', 'cfa8179f-d329-423d-8da4-4161e6f1e42b'],
  ['Training Resources/OLF-TG-HI-002 Wound Care Guide.pdf', 'cfa8179f-d329-423d-8da4-4161e6f1e42b'],
  ['Training Resources/OLF-TG-HI-003 Diabetes Management Guide.pdf', 'cfa8179f-d329-423d-8da4-4161e6f1e42b'],

  // Module 3 — Form25 (meeting minutes, not date-changed but should still be the same copy)
  ['Policies and Procedures/Core 2 - Governance & Operations/Form25.Management Review Meeting Minutes - June 2026.pdf', '4298ed63-bb7d-4b93-85e0-9ae063030880'],
];

let ok = 0, fail = 0;

async function copy(src, destFolder) {
  const fileName = src.split('/').pop();
  try {
    const { data, error } = await sb.storage.from(SRC).download(src);
    if (error) throw error;
    const buf = Buffer.from(await data.arrayBuffer());
    const { error: upErr } = await sb.storage.from(DST).upload(
      destFolder + '/' + fileName, buf,
      { contentType: 'application/pdf', upsert: true }
    );
    if (upErr) throw upErr;
    ok++;
    process.stdout.write('.');
  } catch (e) {
    fail++;
    console.error('\nFAIL: ' + src + ' => ' + e.message);
  }
}

console.log('Copying ' + COPIES.length + ' updated files to auditor-portal...');

for (let i = 0; i < COPIES.length; i += 5) {
  const batch = COPIES.slice(i, i + 5);
  await Promise.all(batch.map(([src, dst]) => copy(src, dst)));
}

console.log('\nDone! ' + ok + ' copied, ' + fail + ' failed');
