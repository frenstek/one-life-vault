import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');

const SUPA_URL = 'https://czdlemutsimvwfpwylxh.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk';
const sb = createClient(SUPA_URL, SUPA_KEY);

const DOWNLOADS = 'C:/Users/kevin/Downloads';

// ─── Auditor portal folder mapping ──────────────────────────────────────────
const FOLDERS = {
  m1: 'bd49260a-30be-4689-ba20-d60f1146bd95',  // Core Module 1
  m3: '4298ed63-bb7d-4b93-85e0-9ae063030880',  // Core Module 3
  m6: 'f969c9c3-47ed-41a2-bba3-24e9b4d7d59e',  // Module 6 (HR)
  m7: 'efc3c35b-597b-4fc2-9828-f87f5b076799',  // Module 7
  hi: 'cfa8179f-d329-423d-8da4-4161e6f1e42b',  // High Intensity
};

// ─── PDF files to fix ───────────────────────────────────────────────────────
// Each entry: [storagePath, layoutType, auditorFolder]
// Layout types:
//   'badge'   = blue header bar with OLF circle badge (Form109-114, Form110, Form111)
//   'text'    = text-only header "One Life Foundation" + ABN (Form103-105)
//   'title'   = centered title page (Form05)
//   'training'= teal header with badges (training guides)
const FILES = [
  ['Policies and Procedures/Core 2 - Governance & Operations/Form05.Business Plan 2026-2028.pdf', 'title', FOLDERS.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form103.Business Continuity Plan.pdf', 'text', FOLDERS.m7],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form104.Digital Compliance Monitoring Policy.pdf', 'text', FOLDERS.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form105.Digital Registers Management Policy.pdf', 'text', FOLDERS.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form109.Worker Screening and Recruitment Procedure.pdf', 'badge', FOLDERS.m6],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form112.Insurance Register.pdf', 'badge', FOLDERS.m3],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form113.Professional Development Policy.pdf', 'badge', FOLDERS.m6],
  ['Policies and Procedures/Core 2 - Governance & Operations/Form114.Performance Management Procedure.pdf', 'badge', FOLDERS.m6],
  ['Policies and Procedures/Core 1 - Rights & Responsibilities/Form111.OLF Code of Conduct.pdf', 'badge', FOLDERS.m1],
  ['Policies and Procedures/Module 1 - High Intensity/Form110.Clinical Governance Framework.pdf', 'badge', FOLDERS.hi],
  ['Training Resources/OLF-TG-HI-001 Urinary Catheter Care Guide.pdf', 'training', FOLDERS.hi],
  ['Training Resources/OLF-TG-HI-002 Wound Care Guide.pdf', 'training', FOLDERS.hi],
  ['Training Resources/OLF-TG-HI-003 Diabetes Management Guide.pdf', 'training', FOLDERS.hi],
];

// ─── Logo positioning per layout type ───────────────────────────────────────
// PDF coords: (0,0) = bottom-left, y increases upward
// A4 page: 595.92 x 842.88 points
// Header bar blue color from PDF streams: rgb(0.1804, 0.4588, 0.7137)
const HEADER_BLUE = rgb(0.1804, 0.4588, 0.7137);

function getLogoPosition(type, pageWidth, pageHeight, logoAspect) {
  switch (type) {
    case 'badge': {
      // Blue header bar with "OLF" circle badge on the left
      // Logo replaces the OLF circle badge area
      // Tested: x=62, y=759, w=50 covers the badge neatly
      const w = 50;
      const h = w / logoAspect;
      return { x: 62, y: 759, width: w, height: h, needsBlueBg: true };
    }
    case 'text': {
      // Header with just "One Life Foundation" text + ABN + address
      // Logo placed top-left above the text
      // Tested: x=40, y=842.88-15-h, w=120
      const w = 120;
      const h = w / logoAspect;
      return { x: 40, y: pageHeight - 15 - h, width: w, height: h };
    }
    case 'title': {
      // Centered title page - "One Life Foundation" in large text
      // Logo centered horizontally above the title
      // Tested: centered, y=842.88-100-h, w=150
      const w = 150;
      const h = w / logoAspect;
      const x = (pageWidth - w) / 2;
      return { x, y: pageHeight - 100 - h, width: w, height: h };
    }
    case 'training': {
      // Teal header bar with "TRAINING GUIDE" badge
      // Logo placed top-right near "One Life Foundation" text
      // Tested: x=pageWidth-40-w, y=842.88-54, w=85
      const w = 85;
      const h = w / logoAspect;
      return { x: pageWidth - 40 - w, y: pageHeight - 54, width: w, height: h };
    }
    default:
      throw new Error('Unknown layout type: ' + type);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
const logoBytes = fs.readFileSync(path.join(PROJECT, 'public', 'logo.png'));
let ok = 0, fail = 0;

console.log(`Processing ${FILES.length} PDFs...\n`);

for (const [storagePath, layoutType, auditorFolder] of FILES) {
  const fileName = storagePath.split('/').pop();
  process.stdout.write(`  ${fileName} (${layoutType})... `);

  try {
    // 1. Download from Supabase
    const { data, error } = await sb.storage.from('documents').download(storagePath);
    if (error) throw new Error('Download failed: ' + error.message);
    const pdfBytes = Buffer.from(await data.arrayBuffer());

    // 2. Load PDF and embed logo
    const pdf = await PDFDocument.load(pdfBytes);
    const logo = await pdf.embedPng(logoBytes);
    const logoAspect = logo.width / logo.height; // ~1.96

    // 3. Get page 1 and calculate position
    const page = pdf.getPage(0);
    const { width, height } = page.getSize();
    const pos = getLogoPosition(layoutType, width, height, logoAspect);

    // 4. Draw logo (with blue background for badge type to cover OLF text)
    if (pos.needsBlueBg) {
      page.drawRectangle({
        x: pos.x - 2,
        y: pos.y - 2,
        width: pos.width + 4,
        height: pos.height + 4,
        color: HEADER_BLUE,
      });
    }
    page.drawImage(logo, {
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
    });

    // 5. Save modified PDF
    const modifiedBytes = Buffer.from(await pdf.save());

    // 6. Upload back to documents bucket (remove first to bypass CDN cache)
    await sb.storage.from('documents').remove([storagePath]);
    const { error: upErr } = await sb.storage.from('documents').upload(
      storagePath, modifiedBytes,
      { contentType: 'application/pdf' }
    );
    if (upErr) throw new Error('Upload documents failed: ' + upErr.message);

    // 7. Upload to auditor-portal bucket (check if exists first)
    if (auditorFolder) {
      const portalPath = auditorFolder + '/' + fileName;
      // List files in folder to check if this file exists
      const { data: listing } = await sb.storage.from('auditor-portal').list(auditorFolder, { limit: 500 });
      const exists = listing?.some(f => f.name === fileName);
      if (exists) {
        await sb.storage.from('auditor-portal').remove([portalPath]);
        const { error: portalErr } = await sb.storage.from('auditor-portal').upload(
          portalPath, modifiedBytes,
          { contentType: 'application/pdf' }
        );
        if (portalErr) {
          console.log(`(auditor-portal upload failed: ${portalErr.message})`);
        } else {
          process.stdout.write('[portal] ');
        }
      } else {
        process.stdout.write('[not in portal] ');
      }
    }

    // 8. Save to Downloads
    fs.writeFileSync(path.join(DOWNLOADS, fileName), modifiedBytes);

    ok++;
    console.log('OK');
  } catch (e) {
    fail++;
    console.log('FAIL: ' + e.message);
  }
}

console.log(`\nDone! ${ok} succeeded, ${fail} failed.`);
