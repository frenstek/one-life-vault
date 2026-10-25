/**
 * create-meeting-template.mjs
 *
 * 1. Generates the OLF Meeting Minutes Template PDF (blank, printable).
 * 2. Uploads all 17 specified PDFs to Supabase Storage
 *    → bucket: documents / folder: "New Forms - For Review/"
 *
 * Usage: node scripts/create-meeting-template.mjs
 */

import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');
const DOWNLOADS = 'C:/Users/kevin/Downloads';
const OUTPUT_PATH = path.join(DOWNLOADS, 'OLF Meeting Minutes Template.pdf');

// ─── Supabase Config ────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://czdlemutsimvwfpwylxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk';
const BUCKET = 'documents';
const FOLDER = 'New Forms - For Review';

// ─── Colors ─────────────────────────────────────────────────────────────────
const OLF_GREEN = [14, 160, 62];       // #0ea03e
const DARK_TEXT = [30, 41, 59];         // #1e293b
const GREY_TEXT = [100, 116, 139];      // #64748b
const LIGHT_GREY_BG = [241, 245, 249]; // #f1f5f9
const WHITE = [255, 255, 255];
const TABLE_BORDER = [203, 213, 225];  // #cbd5e1
const TABLE_HEADER_BG = [240, 253, 244]; // very light green
const TABLE_HEADER_TEXT = [14, 120, 50]; // darker green for header text

// ─── Page dimensions ────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 18;
const MR = 18;
const MARGIN_T = 26;
const MARGIN_B = 18;
const CW = PAGE_W - ML - MR;

// ─── Logo ───────────────────────────────────────────────────────────────────
const logoPath = path.join(PROJECT, 'public', 'logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUrl = 'data:image/png;base64,' + logoBase64;

// ─── Document ───────────────────────────────────────────────────────────────
const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
let curY = MARGIN_T;
let pageNum = 0;

// ─── Header ─────────────────────────────────────────────────────────────────
function drawHeader() {
  // Logo small, left aligned
  try {
    doc.addImage(logoDataUrl, 'PNG', ML, 7, 20, 10);
  } catch (e) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...OLF_GREEN);
    doc.text('OLF', ML, 14);
  }

  // Title right-aligned
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text('Meeting Minutes', PAGE_W - MR, 14, { align: 'right' });

  // Thin green line underneath
  doc.setDrawColor(...OLF_GREEN);
  doc.setLineWidth(0.5);
  doc.line(ML, 20, PAGE_W - MR, 20);
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function drawFooter(pg, total) {
  const footerY = PAGE_H - 10;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('One Life Foundation Pty Ltd | ABN: 55 643 227 061', ML, footerY);
  doc.text(`Page ${pg} of ${total}`, PAGE_W - MR, footerY, { align: 'right' });
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function newPage() {
  doc.addPage();
  drawHeader();
  curY = MARGIN_T;
}

function ensureSpace(needed) {
  if (curY + needed > PAGE_H - MARGIN_B) {
    newPage();
  }
}

function sectionHeading(text) {
  ensureSpace(12);
  curY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...OLF_GREEN);
  doc.text(text, ML, curY);
  curY += 5;
}

/**
 * Draw a blank-form table for printing.
 * @param {string[]} headers
 * @param {Array<string[]>} rows - can include text or blank cells
 * @param {number[]} colWidths
 * @param {object} opts - { rowH: fixed row height, labelCol: index of grey bg col }
 */
function drawFormTable(headers, rows, colWidths, opts = {}) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const headerH = opts.headerH || 7;
  const rowH = opts.rowH || 9;
  const padding = 2.5;
  const fontSize = opts.fontSize || 8;
  const labelCol = opts.labelCol ?? -1;

  // ─ Header row ─
  ensureSpace(headerH + rowH * 2);
  let x = ML;

  doc.setFillColor(...TABLE_HEADER_BG);
  doc.rect(x, curY, totalW, headerH, 'F');
  doc.setDrawColor(...TABLE_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(x, curY, totalW, headerH, 'S');

  // Vertical separators in header
  let hx = ML;
  for (let ci = 0; ci < headers.length - 1; ci++) {
    hx += colWidths[ci];
    doc.line(hx, curY, hx, curY + headerH);
  }

  // Header text
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TABLE_HEADER_TEXT);

  headers.forEach((h, i) => {
    const align = opts.centerCols?.includes(i) ? 'center' : 'left';
    const tx = align === 'center' ? x + colWidths[i] / 2 : x + padding;
    doc.text(h, tx, curY + headerH / 2 + 1, { align });
    x += colWidths[i];
  });

  curY += headerH;

  // ─ Data rows ─
  rows.forEach((row, ri) => {
    ensureSpace(rowH + 2);
    x = ML;

    // Grey background for label column
    if (labelCol >= 0) {
      let lx = ML;
      for (let k = 0; k < labelCol; k++) lx += colWidths[k];
      doc.setFillColor(...LIGHT_GREY_BG);
      doc.rect(lx, curY, colWidths[labelCol], rowH, 'F');
    }

    // Row border
    doc.setDrawColor(...TABLE_BORDER);
    doc.setLineWidth(0.2);
    doc.rect(x, curY, totalW, rowH, 'S');

    // Vertical separators
    let vx = ML;
    for (let ci = 0; ci < colWidths.length - 1; ci++) {
      vx += colWidths[ci];
      doc.line(vx, curY, vx, curY + rowH);
    }

    // Cell text
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);

    row.forEach((cell, ci) => {
      if (cell && cell.trim()) {
        const align = opts.centerCols?.includes(ci) ? 'center' : 'left';
        const tx = align === 'center' ? x + colWidths[ci] / 2 : x + padding;
        // Handle multiline text in cells (for checkboxes etc)
        const lines = doc.splitTextToSize(cell, colWidths[ci] - padding * 2);
        const startYOff = lines.length > 1 ? (rowH / 2 - (lines.length * 3.2) / 2 + 2) : (rowH / 2 + 1);
        lines.forEach((line, li) => {
          doc.text(line, tx, curY + startYOff + li * 3.2, { align });
        });
      }
      x += colWidths[ci];
    });

    curY += rowH;
  });

  curY += 2;
}

/**
 * Draw a 2-column form table (label | value) with grey label column.
 */
function drawDetailsTable(items, labelW, valueW, opts = {}) {
  const rowH = opts.rowH || 9;
  const totalW = labelW + valueW;
  const padding = 2.5;
  const fontSize = opts.fontSize || 8;

  items.forEach(([label, value]) => {
    ensureSpace(rowH + 2);
    const x = ML;

    // Grey label bg
    doc.setFillColor(...LIGHT_GREY_BG);
    doc.rect(x, curY, labelW, rowH, 'F');

    // Row border
    doc.setDrawColor(...TABLE_BORDER);
    doc.setLineWidth(0.2);
    doc.rect(x, curY, totalW, rowH, 'S');
    doc.line(x + labelW, curY, x + labelW, curY + rowH);

    // Label text
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text(label, x + padding, curY + rowH / 2 + 1);

    // Value text (lighter, for blanks)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY_TEXT);
    if (value && value.trim()) {
      const lines = doc.splitTextToSize(value, valueW - padding * 2);
      const startYOff = lines.length > 1 ? (rowH / 2 - (lines.length * 3.2) / 2 + 2) : (rowH / 2 + 1);
      lines.forEach((line, li) => {
        doc.text(line, x + labelW + padding, curY + startYOff + li * 3.2);
      });
    }

    curY += rowH;
  });

  curY += 2;
}


// ═════════════════════════════════════════════════════════════════════════════
// PAGE 1
// ═════════════════════════════════════════════════════════════════════════════

drawHeader();
curY = 24;

// ─── Meeting Details ────────────────────────────────────────────────────────
sectionHeading('Meeting Details');

const detailLabelW = 32;
const detailValueW = CW - detailLabelW;

const detailItems = [
  ['Meeting Title', '_________________________'],
  ['Date', '____/____/________'],
  ['Time', '________ to ________'],
  ['Location', '_________________________'],
  ['Chair', '_________________________'],
  ['Minute Taker', '_________________________'],
];

drawDetailsTable(detailItems, detailLabelW, detailValueW, { rowH: 7 });

// Meeting Type row (taller, with checkboxes)
ensureSpace(12);
const mtLabelW = 32;
const mtValueW = CW - mtLabelW;
const mtRowH = 10;
const mtX = ML;

doc.setFillColor(...LIGHT_GREY_BG);
doc.rect(mtX, curY, mtLabelW, mtRowH, 'F');
doc.setDrawColor(...TABLE_BORDER);
doc.setLineWidth(0.2);
doc.rect(mtX, curY, mtLabelW + mtValueW, mtRowH, 'S');
doc.line(mtX + mtLabelW, curY, mtX + mtLabelW, curY + mtRowH);

doc.setFontSize(7.5);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...DARK_TEXT);
doc.text('Meeting Type', mtX + 2.5, curY + mtRowH / 2 + 0.5);

doc.setFont('helvetica', 'normal');
doc.setTextColor(...DARK_TEXT);
doc.setFontSize(7);
const checkboxLine1 = '\u2610 Management Review    \u2610 Staff Meeting    \u2610 WHS Committee    \u2610 Care Review';
const checkboxLine2 = '\u2610 CI Review    \u2610 Other: _______________________';
doc.text(checkboxLine1, mtX + mtLabelW + 2.5, curY + 3.5);
doc.text(checkboxLine2, mtX + mtLabelW + 2.5, curY + 7.5);

curY += mtRowH + 2;

// ─── Attendees ──────────────────────────────────────────────────────────────
sectionHeading('Attendees');

const attHeaders = ['Name', 'Role', 'Present (\u2713)'];
const attColW3 = 22;
const attColW2 = (CW - attColW3) * 0.55;
const attColW1 = CW - attColW3 - attColW2;
const attWidths = [attColW1, attColW2, attColW3];
const attRows = Array.from({ length: 8 }, () => ['', '', '']);

drawFormTable(attHeaders, attRows, attWidths, { rowH: 6.5, centerCols: [2] });

// ─── Apologies ──────────────────────────────────────────────────────────────
ensureSpace(14);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(...OLF_GREEN);
doc.text('Apologies:', ML, curY);
curY += 3;

doc.setDrawColor(...TABLE_BORDER);
doc.setLineWidth(0.2);
doc.line(ML + 18, curY, ML + CW, curY);
curY += 5;

// ─── Agenda Items & Discussion ──────────────────────────────────────────────
sectionHeading('Agenda Items & Discussion');

const agHeaders = ['#', 'Agenda Item', 'Discussion / Key Points', 'Decision / Outcome'];
const agCol1 = 8;
const agCol4 = 40;
const agCol2 = (CW - agCol1 - agCol4) * 0.4;
const agCol3 = CW - agCol1 - agCol2 - agCol4;
const agWidths = [agCol1, agCol2, agCol3, agCol4];
const agRows = Array.from({ length: 6 }, (_, i) => [String(i + 1), '', '', '']);

drawFormTable(agHeaders, agRows, agWidths, { rowH: 13, centerCols: [0] });


// ═════════════════════════════════════════════════════════════════════════════
// PAGE 2
// ═════════════════════════════════════════════════════════════════════════════

newPage();
curY = 24;

// ─── Action Items ───────────────────────────────────────────────────────────
sectionHeading('Action Items');

const actHeaders = ['#', 'Action Required', 'Responsible', 'Due Date', 'Status'];
const actCol1 = 8;
const actCol3 = 28;
const actCol4 = 22;
const actCol5 = 20;
const actCol2 = CW - actCol1 - actCol3 - actCol4 - actCol5;
const actWidths = [actCol1, actCol2, actCol3, actCol4, actCol5];
const actRows = Array.from({ length: 8 }, (_, i) => [String(i + 1), '', '', '', '']);

drawFormTable(actHeaders, actRows, actWidths, { rowH: 9, centerCols: [0] });

// ─── Review of Previous Action Items ────────────────────────────────────────
sectionHeading('Review of Previous Action Items');

const revHeaders = ['Action', 'Owner', 'Status', 'Notes'];
const revCol1 = (CW) * 0.3;
const revCol2 = 28;
const revCol3 = 52;
const revCol4 = CW - revCol1 - revCol2 - revCol3;
const revWidths = [revCol1, revCol2, revCol3, revCol4];

const statusText = '\u2610 Complete  \u2610 In Progress  \u2610 Overdue';
const revRows = Array.from({ length: 4 }, () => ['', '', statusText, '']);

drawFormTable(revHeaders, revRows, revWidths, { rowH: 9, fontSize: 7 });

// ─── Next Meeting ───────────────────────────────────────────────────────────
ensureSpace(24);
curY += 2;
sectionHeading('Next Meeting');

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(...DARK_TEXT);
doc.text('Date: ____/____/________      Time: ________      Location: _________________________', ML, curY);
curY += 8;

// ─── Meeting Closed ─────────────────────────────────────────────────────────
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(...DARK_TEXT);
doc.text('Meeting Closed:', ML, curY);
doc.setFont('helvetica', 'normal');
doc.text('________ (time)', ML + 28, curY);
curY += 10;

// ─── Minutes Prepared By ────────────────────────────────────────────────────
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(...DARK_TEXT);
doc.text('Minutes Prepared By:', ML, curY);
doc.setFont('helvetica', 'normal');
doc.text('_________________________      Date: ____/____/________', ML + 36, curY);

// ═════════════════════════════════════════════════════════════════════════════
// ADD FOOTERS TO ALL PAGES
// ═════════════════════════════════════════════════════════════════════════════

const totalPgs = doc.getNumberOfPages();

for (let i = 1; i <= totalPgs; i++) {
  doc.setPage(i);
  drawFooter(i, totalPgs);
}

// ═════════════════════════════════════════════════════════════════════════════
// SAVE PDF
// ═════════════════════════════════════════════════════════════════════════════

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(OUTPUT_PATH, pdfBuffer);

console.log(`\u2705 Saved Meeting Minutes Template to: ${OUTPUT_PATH}`);
console.log(`   Pages: ${totalPgs}`);
console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);


// ═════════════════════════════════════════════════════════════════════════════
// UPLOAD ALL PDFs TO SUPABASE STORAGE
// ═════════════════════════════════════════════════════════════════════════════

const FILES_TO_UPLOAD = [
  'OLF Meeting Calendar 2026.pdf',
  'OLF Meeting Minutes Template.pdf',
  'Form103.Business Continuity Plan.pdf',
  'Form05.Business Plan 2026-2028.pdf',
  'Form115.Privacy and Information Management Policy.pdf',
  'Form116.Complaints and Feedback Management Policy.pdf',
  'Form117.Incident Management Policy.pdf',
  'Form118.Workplace Health and Safety Policy.pdf',
  'Form119.Medication Management Policy.pdf',
  'Form120.Abuse Neglect and Exploitation Prevention Policy.pdf',
  'Form121.Participant Transition and Exit Policy.pdf',
  'Form122.Staff Supervision and Support Policy.pdf',
  'Form123.Infection Control Policy.pdf',
  'Form124.Restrictive Practices Policy.pdf',
  'OLF Employee Confidentiality Agreement.pdf',
  'OLF Pre-Existing Health and Injury Declaration Form.pdf',
  'OLF Staff Compliance Report - June 2026.pdf',
];

async function uploadFile(fileName) {
  const filePath = path.join(DOWNLOADS, fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`\u274c MISSING: ${fileName}`);
    return false;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const storagePath = `${FOLDER}/${fileName}`;

  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(storagePath)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  if (res.ok) {
    const sizeKB = (fileBuffer.length / 1024).toFixed(1);
    console.log(`\u2705 Uploaded: ${fileName} (${sizeKB} KB)`);
    return true;
  } else {
    const errText = await res.text();
    console.error(`\u274c FAILED: ${fileName} — ${res.status} ${errText}`);
    return false;
  }
}

async function uploadAll() {
  console.log(`\n\u2500\u2500\u2500 Uploading ${FILES_TO_UPLOAD.length} files to Supabase Storage \u2500\u2500\u2500`);
  console.log(`Bucket: ${BUCKET} / Folder: ${FOLDER}\n`);

  let success = 0;
  let failed = 0;

  for (const fileName of FILES_TO_UPLOAD) {
    const ok = await uploadFile(fileName);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n\u2500\u2500\u2500 Upload Summary \u2500\u2500\u2500`);
  console.log(`\u2705 Success: ${success}/${FILES_TO_UPLOAD.length}`);
  if (failed > 0) console.log(`\u274c Failed: ${failed}/${FILES_TO_UPLOAD.length}`);
}

uploadAll().catch(err => {
  console.error('Upload error:', err);
  process.exit(1);
});
