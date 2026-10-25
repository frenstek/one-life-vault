/**
 * fix-olf-dates.mjs
 *
 * Downloads OLF policy/procedure PDFs from Supabase Storage,
 * updates date fields to:
 *   - Effective Date: 1 January 2026
 *   - Review Date:    1 January 2027
 * then re-uploads to Supabase and saves copies to Downloads.
 *
 * Uses pdf-lib to white-out old date text and draw new dates on top.
 * Uses pdfjs-dist to locate exact text positions for each date occurrence.
 */

import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

const sb = createClient(
  'https://czdlemutsimvwfpwylxh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk'
);

const DOWNLOADS = 'C:/Users/kevin/Downloads';

// ─── Document manifest ──────────────────────────────────────────────────────

const DOCUMENTS = [
  // Type A: Standard header with DOC NO./VERSION/EFFECTIVE DATE/REVIEW DATE
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form109.Worker Screening and Recruitment Procedure.pdf', type: 'A' },
  { path: 'Policies and Procedures/Core 1 - Rights & Responsibilities/Form111.OLF Code of Conduct.pdf', type: 'A' },
  { path: 'Policies and Procedures/Module 1 - High Intensity/Form110.Clinical Governance Framework.pdf', type: 'A' },
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form113.Professional Development Policy.pdf', type: 'A' },
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form114.Performance Management Procedure.pdf', type: 'A' },
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form112.Insurance Register.pdf', type: 'A' }, // review was "8 September 2026"

  // Type B: Title-style, version history on last page, footer with dates
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form100.Organisation Chart.pdf', type: 'B' },
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form103.Business Continuity Plan.pdf', type: 'B' },
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form104.Digital Compliance Monitoring Policy.pdf', type: 'B' },
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form105.Digital Registers Management Policy.pdf', type: 'B' },

  // Type C: Addendum and Register — many date occurrences throughout all pages
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form107.Policy Document Register.pdf', type: 'C' },
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form108.NDIS Policy Manual Addendum V02.pdf', type: 'C' },

  // Type E: Handbooks — "Date: June 2026" on many pages
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Worker Handbook V02 - June 2026.pdf', type: 'E' },
  { path: 'Policies and Procedures/Core 1 - Rights & Responsibilities/Participant Handbook V02 - June 2026.pdf', type: 'E' },

  // Type F: Training Guides — "1.0 — June 2026" and review date
  { path: 'Training Resources/OLF-TG-HI-001 Urinary Catheter Care Guide.pdf', type: 'F' },
  { path: 'Training Resources/OLF-TG-HI-002 Wound Care Guide.pdf', type: 'F' },
  { path: 'Training Resources/OLF-TG-HI-003 Diabetes Management Guide.pdf', type: 'F' },

  // Type G: Form106 — small header at top-right
  { path: 'Policies and Procedures/Core 4 - Support Environment/Form106.SIL House Accommodation Audit Checklist.pdf', type: 'G' },

  // Form25: Meeting minutes — SKIP date changes
  { path: 'Policies and Procedures/Core 2 - Governance & Operations/Form25.Management Review Meeting Minutes - June 2026.pdf', type: 'SKIP' },
];

// ─── Helper: scan PDF for text items matching patterns ──────────────────────

async function findTextItems(pdfBytes, patterns) {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) }).promise;
  const results = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const vp = page.getViewport({ scale: 1.0 });
    const pageHeight = vp.height;

    for (const item of tc.items) {
      const text = item.str || '';
      if (!text.trim()) continue;

      for (const pat of patterns) {
        if (pat.regex.test(text)) {
          const x = item.transform[4];
          const y = item.transform[5]; // pdfjs y (from bottom)
          const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]);
          const width = item.width;

          results.push({
            page: p,
            x, y, fontSize, width,
            text,
            patternId: pat.id,
            replacement: pat.replacement,
            replFontSize: pat.replFontSize,
          });
        }
      }
    }
  }

  return results;
}

// ─── Helper: white-out and redraw ──────────────────────────────────────────

async function patchPdf(pdfBytes, patches) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const patch of patches) {
    const pageIdx = patch.page - 1;
    if (pageIdx < 0 || pageIdx >= pages.length) continue;
    const page = pages[pageIdx];

    // Calculate white-out dimensions
    // pdfjs y == pdf-lib y (both from bottom of page)
    const whiteOutX = patch.x - 1;
    const whiteOutY = patch.y - 2;
    const whiteOutWidth = (patch.width || 120) + 4;
    const whiteOutHeight = (patch.fontSize || 10) + 4;

    // Draw white rectangle over old text
    page.drawRectangle({
      x: whiteOutX,
      y: whiteOutY,
      width: whiteOutWidth,
      height: whiteOutHeight,
      color: rgb(1, 1, 1), // white
      borderWidth: 0,
    });

    // Draw new text
    const font = patch.bold ? helveticaBold : helvetica;
    const size = patch.replFontSize || patch.fontSize || 9;
    page.drawText(patch.replacement, {
      x: patch.x,
      y: patch.y,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}

// ─── Process each document type ─────────────────────────────────────────────

async function processTypeA(pdfBytes) {
  // Standard header: EFFECTIVE DATE value at ~x=310.5 y=698.9, REVIEW DATE value at ~x=433.5 y=698.9
  // Also version history on last page: "8 June 2026"
  // Also "8 June 2027" for review date in header
  const patterns = [
    { id: 'eff_value', regex: /^8 June 2026$/, replacement: '1 January 2026', replFontSize: null },
    { id: 'rev_value', regex: /^8 June 2027$/, replacement: '1 January 2027', replFontSize: null },
    { id: 'rev_value_sept', regex: /^8 September 2026$/, replacement: '1 January 2027', replFontSize: null },
  ];

  const items = await findTextItems(pdfBytes, patterns);
  return patchPdf(pdfBytes, items);
}

async function processTypeB(pdfBytes) {
  // Title-style docs: dates in version history and footer only
  // "8 June 2026" in version history table
  // "Version 1.0 — June 2026" in footer
  // "Version 1.0 — June\n2026" (split across lines in footer)
  const patterns = [
    { id: 'date_full', regex: /^8 June 2026$/, replacement: '1 January 2026', replFontSize: null },
    { id: 'footer_version', regex: /^Version 1\.0 — June$/, replacement: 'Version 1.0 — January', replFontSize: null },
    { id: 'footer_year', regex: /^2026$/, replacement: '2026', replFontSize: null }, // year stays 2026, just for the footer line
  ];

  const items = await findTextItems(pdfBytes, patterns);

  // For footer items "2026" — only patch if there's a corresponding "Version 1.0 — June" nearby
  // Actually "2026" appears in many contexts. Let's be smarter — only patch "2026" items that are
  // on the same page and near x position of a "Version 1.0 — June" item
  const versionItems = items.filter(i => i.patternId === 'footer_version');
  const filteredItems = items.filter(i => {
    if (i.patternId === 'footer_year') {
      // Only keep if near a footer_version item on the same page
      return versionItems.some(v => v.page === i.page && Math.abs(v.x - i.x) < 5);
    }
    return true;
  });

  return patchPdf(pdfBytes, filteredItems);
}

async function processTypeC(pdfBytes) {
  // Form107 and Form108 have many "8 June 2026" and "EFFECTIVE DATE" / "8 June 2026" pairs throughout
  // Need to replace ALL instances of "8 June 2026" with "1 January 2026"
  // Also replace "8 June 2027" with "1 January 2027"
  // And "Effective: 8 June 2026" in headers
  // And "Review Date: 8 June 2026" → "Review Date: 1 January 2026" (but this is a label, not the value)
  // And "Next Review Date: 8 June 2027" → "Next Review Date: 1 January 2027"
  // Also footers with "• 8 June 2026"
  // And "Version 01 • 8 June 2026" on Form25... wait no, that's meeting minutes
  const patterns = [
    { id: 'date_full', regex: /^8 June 2026$/, replacement: '1 January 2026' },
    { id: 'date_full27', regex: /^8 June 2027$/, replacement: '1 January 2027' },
    { id: 'effective_header', regex: /^Effective: 8 June 2026$/, replacement: 'Effective: 1 January 2026' },
    { id: 'review_date_val', regex: /^Review Date: 8 June 2026$/, replacement: 'Review Date: 1 January 2026' },
    { id: 'next_review', regex: /^Next Review Date: 8 June 2027$/, replacement: 'Next Review Date: 1 January 2027' },
  ];

  const items = await findTextItems(pdfBytes, patterns);

  // Also need to handle footer text that contains the date inline
  // e.g., "One Life Foundation Pty Ltd • Form108 • NDIS Policy Manual Review Addendum Version 02 • 8 June 2026"
  // and "One Life Foundation Pty Ltd • Form107 • Version 01 • 8 June 2026"
  // These are single text items that contain "8 June 2026" as part of a longer string
  // We need to handle those specially
  const additionalPatterns = [
    { id: 'footer_inline', regex: /•\s*8 June 2026/, replacement: null }, // handled specially below
  ];

  const footerItems = await findTextItems(pdfBytes, additionalPatterns);

  // For footer items, we need to redraw the entire text with the date changed
  for (const item of footerItems) {
    item.replacement = item.text.replace('8 June 2026', '1 January 2026');
  }

  const allItems = [...items, ...footerItems];
  return patchPdf(pdfBytes, allItems);
}

async function processTypeE(pdfBytes) {
  // Handbooks: "Date: June 2026" on headers, cover page dates, footer text
  const patterns = [
    { id: 'header_date', regex: /^Date: June 2026$/, replacement: 'Date: January 2026' },
    { id: 'cover_version', regex: /^Version 02 — June 2026$/, replacement: 'Version 02 — January 2026' },
    { id: 'cover_date', regex: /^Date: June 2026$/, replacement: 'Date: January 2026' },
    { id: 'staff_welcome', regex: /^Staff Welcome Pack — Version 02$/, replacement: 'Staff Welcome Pack — Version 02' }, // no change needed
  ];

  let items = await findTextItems(pdfBytes, patterns);

  // Also handle inline footer text and body text containing "June 2026"
  // Worker Handbook footer: "Worker Handbook — Version 02 — June 2026 • CONFIDENTIAL — Internal Use Only"
  // Participant Handbook footer: "Participant Handbook — Version 02 — June 2026"
  // Body text: "Worker Handbook (Version 02, June 2026)"
  // "Next review: June 2027"
  const inlinePatterns = [
    { id: 'footer_inline', regex: /Handbook — Version 02 — June 2026/, replacement: null },
    { id: 'body_handbook', regex: /Worker Handbook \(Version 02, June 2026\)/, replacement: null },
    { id: 'next_review', regex: /Next review: June 2027/, replacement: null },
    { id: 'version_inline', regex: /^Version 02 — June 2026$/, replacement: 'Version 02 — January 2026' },
  ];

  const inlineItems = await findTextItems(pdfBytes, inlinePatterns);
  for (const item of inlineItems) {
    if (!item.replacement) {
      item.replacement = item.text
        .replace('June 2026', 'January 2026')
        .replace('June 2027', 'January 2027');
    }
  }

  const allItems = [...items, ...inlineItems];
  // Deduplicate by page + x + y
  const seen = new Set();
  const dedupedItems = allItems.filter(item => {
    const key = `${item.page}_${item.x.toFixed(0)}_${item.y.toFixed(0)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return patchPdf(pdfBytes, dedupedItems);
}

async function processTypeF(pdfBytes) {
  // Training Guides: "1.0 — June 2026" version, "December 2026" review date
  // Change version to "1.0 — January 2026" and review to "January 2027 (or sooner if care plan changes)"
  const patterns = [
    { id: 'version', regex: /^1\.0 — June 2026$/, replacement: '1.0 — January 2026' },
    { id: 'review_catheter', regex: /^December 2026 \(or sooner if care plan changes\)$/, replacement: 'January 2027 (or sooner if care plan changes)' },
    { id: 'review_wound', regex: /^December 2026 \(or sooner if wound care plan changes\)$/, replacement: 'January 2027 (or sooner if wound care plan changes)' },
    { id: 'review_diabetes', regex: /^December 2026 \(or sooner if diabetes management plan changes\)$/, replacement: 'January 2027 (or sooner if diabetes management plan changes)' },
  ];

  const items = await findTextItems(pdfBytes, patterns);

  // Also check for footer text and inline date references
  const inlinePatterns = [
    { id: 'footer_version', regex: /OLF-TG-HI-\d{3} v1\.0/, replacement: null },
  ];
  // These footers don't contain dates so we can skip them

  return patchPdf(pdfBytes, items);
}

async function processTypeG(pdfBytes) {
  // Form106: Small header at top-right
  // "08 Jun 2026" → "01 Jan 2026"
  // "08 Jun 2027" → "01 Jan 2027"
  const patterns = [
    { id: 'eff', regex: /^08 Jun 2026$/, replacement: '01 Jan 2026' },
    { id: 'rev', regex: /^08 Jun 2027$/, replacement: '01 Jan 2027' },
  ];

  const items = await findTextItems(pdfBytes, patterns);
  return patchPdf(pdfBytes, items);
}

// ─── Main ───────────────────────────────────────────────────────────────────

let ok = 0, fail = 0, skip = 0;

for (const doc of DOCUMENTS) {
  const fileName = doc.path.split('/').pop();
  console.log(`\n${'─'.repeat(60)}`);

  if (doc.type === 'SKIP') {
    console.log(`SKIP: ${fileName} (meeting minutes — dates preserved)`);
    skip++;
    continue;
  }

  console.log(`Processing: ${fileName} [Type ${doc.type}]`);

  try {
    // 1. Download
    const { data, error } = await sb.storage.from('documents').download(doc.path);
    if (error) throw new Error(`Download failed: ${error.message}`);
    const pdfBytes = Buffer.from(await data.arrayBuffer());
    console.log(`  Downloaded: ${(pdfBytes.length / 1024).toFixed(0)} KB`);

    // 2. Process based on type
    let updatedBytes;
    switch (doc.type) {
      case 'A': updatedBytes = await processTypeA(pdfBytes); break;
      case 'B': updatedBytes = await processTypeB(pdfBytes); break;
      case 'C': updatedBytes = await processTypeC(pdfBytes); break;
      case 'E': updatedBytes = await processTypeE(pdfBytes); break;
      case 'F': updatedBytes = await processTypeF(pdfBytes); break;
      case 'G': updatedBytes = await processTypeG(pdfBytes); break;
      default: throw new Error(`Unknown type: ${doc.type}`);
    }

    console.log(`  Patched: ${(updatedBytes.length / 1024).toFixed(0)} KB`);

    // 3. Verify the changes by scanning the updated PDF
    const verifyItems = await findTextItems(updatedBytes, [
      { id: 'old_eff', regex: /^8 June 2026$/ },
      { id: 'old_rev', regex: /^8 June 2027$/ },
      { id: 'new_eff', regex: /1 January 2026/ },
      { id: 'new_rev', regex: /1 January 2027/ },
      { id: 'old_sep', regex: /8 September 2026/ },
    ]);

    const oldDates = verifyItems.filter(i => ['old_eff', 'old_rev', 'old_sep'].includes(i.patternId));
    const newDates = verifyItems.filter(i => ['new_eff', 'new_rev'].includes(i.patternId));
    console.log(`  Verification: ${newDates.length} new dates found, ${oldDates.length} old dates remaining`);

    if (oldDates.length > 0) {
      console.log(`  WARNING: Some old dates still present:`);
      oldDates.forEach(d => console.log(`    p${d.page} "${d.text}" @ x=${d.x.toFixed(1)} y=${d.y.toFixed(1)}`));
    }

    // 4. Upload to Supabase
    const updatedBuf = Buffer.from(updatedBytes);
    const { error: uploadErr } = await sb.storage.from('documents').upload(
      doc.path, updatedBuf,
      { contentType: 'application/pdf', upsert: true }
    );
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
    console.log(`  Uploaded to Supabase ✓`);

    // 5. Save local copy
    const localPath = path.join(DOWNLOADS, fileName);
    fs.writeFileSync(localPath, updatedBuf);
    console.log(`  Saved locally: ${localPath}`);

    ok++;
  } catch (e) {
    fail++;
    console.error(`  FAILED: ${e.message}`);
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`Done! ${ok} updated, ${fail} failed, ${skip} skipped`);
console.log('═'.repeat(60));
