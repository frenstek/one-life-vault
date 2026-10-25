/**
 * create-audit-schedule.mjs
 *
 * Generates the One Life Foundation Internal Audit Schedule 2026 PDF.
 * Style: Clean SNG style (OLF Green headings, minimal header, clean table).
 *
 * 2 pages: Cover + Audit Schedule table.
 *
 * Saves to Downloads + uploads to Supabase (documents / New Forms - For Review).
 *
 * Usage: node scripts/create-audit-schedule.mjs
 */

import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPA_URL = 'https://czdlemutsimvwfpwylxh.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk';
const sb = createClient(SUPA_URL, SUPA_KEY);

const OUTPUT_PATH = 'C:/Users/kevin/Downloads/OLF Internal Audit Schedule 2026.pdf';
const BUCKET = 'documents';
const STORAGE_PATH = 'New Forms - For Review/OLF Internal Audit Schedule 2026.pdf';

// ─── Colors ──────────────────────────────────────────────────────────────────
const OLF_GREEN = [14, 160, 62];           // #0ea03e
const DARK_TEXT = [30, 41, 59];            // #1e293b
const GREY_TEXT = [100, 116, 139];         // #64748b
const LIGHT_GREY_BG = [248, 250, 252];    // #f8fafc
const WHITE = [255, 255, 255];
const TABLE_BORDER = [226, 232, 240];      // #e2e8f0
const TABLE_HEADER_BG = [240, 253, 244];   // #f0fdf4
const TABLE_HEADER_TEXT = [14, 120, 50];    // dark green text
const GREEN_BADGE_BG = [220, 252, 231];    // #dcfce7
const GREEN_BADGE_TEXT = [22, 101, 52];     // #166534
const BLUE_BADGE_BG = [219, 234, 254];     // #dbeafe
const BLUE_BADGE_TEXT = [30, 64, 175];      // #1e40af

// ─── Page dimensions ─────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 22;     // left margin
const MR = 20;     // right margin
const MARGIN_T = 30; // top margin below header
const MARGIN_B = 22; // bottom margin above footer
const CW = PAGE_W - ML - MR; // content width

// ─── Logo ────────────────────────────────────────────────────────────────────
const logoPath = path.join(PROJECT, 'public', 'logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUrl = 'data:image/png;base64,' + logoBase64;

// ─── Document ────────────────────────────────────────────────────────────────
const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
let curY = MARGIN_T;
let isCoverPage = true;
let currentPageNum = 1;

// ─── Header (small, clean) ──────────────────────────────────────────────────
function drawHeader() {
  if (isCoverPage) return;

  // Logo small, left aligned
  try {
    doc.addImage(logoDataUrl, 'PNG', ML, 8, 15, 7.5);
  } catch (e) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...OLF_GREEN);
    doc.text('OLF', ML, 14);
  }

  // Document title right-aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('Internal Audit Schedule 2026', PAGE_W - MR, 14, { align: 'right' });

  // Thin line underneath
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(ML, 20, PAGE_W - MR, 20);
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function drawFooter(pageNum) {
  if (pageNum === 1) return; // no footer on cover

  const footerY = PAGE_H - 12;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text(`${pageNum} | Page`, PAGE_W - MR, footerY, { align: 'right' });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function newPage() {
  doc.addPage();
  currentPageNum++;
  isCoverPage = false;
  drawHeader();
  curY = MARGIN_T;
}

function ensureSpace(needed) {
  if (curY + needed > PAGE_H - MARGIN_B) {
    newPage();
  }
}

function setBody() {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_TEXT);
}

/** Write wrapped body text */
function writeBody(text, indent = 0) {
  setBody();
  const maxW = CW - indent;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 5;

  for (const line of lines) {
    ensureSpace(lineH + 1);
    doc.text(line, ML + indent, curY);
    curY += lineH;
  }
  curY += 3;
}

/** Write a bullet point */
function writeBullet(text, indent = 4) {
  setBody();
  doc.setFontSize(9.5);
  const bulletX = ML + indent;
  const textX = bulletX + 4;
  const maxW = CW - indent - 4;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 4.8;

  ensureSpace(lines.length * lineH + 2);
  doc.setTextColor(...GREY_TEXT);
  doc.text('\u2022', bulletX, curY);
  doc.setTextColor(...DARK_TEXT);
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], textX, curY);
    curY += lineH;
  }
  curY += 1;
}

/** Draw a table with status badges */
function drawAuditTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const baseRowH = 8;
  const padding = 2.5;
  const fontSize = 8;

  function calcRowH(cells) {
    let maxLines = 1;
    doc.setFontSize(fontSize);
    cells.forEach((cell, i) => {
      const text = typeof cell === 'object' ? cell.text : String(cell);
      const lines = doc.splitTextToSize(text, colWidths[i] - padding * 2);
      if (lines.length > maxLines) maxLines = lines.length;
    });
    return Math.max(baseRowH, maxLines * 4 + 5);
  }

  // Header row
  ensureSpace(baseRowH + 5);
  let x = ML;
  const headerH = calcRowH(headers);

  // Subtle green header background
  doc.setFillColor(...TABLE_HEADER_BG);
  doc.rect(x, curY - 4.5, totalW, headerH, 'F');

  // Header border
  doc.setDrawColor(...TABLE_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(x, curY - 4.5, totalW, headerH, 'S');

  // Vertical cell separators in header
  let hx = ML;
  for (let ci = 0; ci < headers.length - 1; ci++) {
    hx += colWidths[ci];
    doc.line(hx, curY - 4.5, hx, curY - 4.5 + headerH);
  }

  // Header text
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TABLE_HEADER_TEXT);

  headers.forEach((h, i) => {
    const text = typeof h === 'object' ? h.text : String(h);
    const lines = doc.splitTextToSize(text, colWidths[i] - padding * 2);
    lines.forEach((line, li) => {
      doc.text(line, x + padding, curY + (li * 4));
    });
    x += colWidths[i];
  });
  curY += headerH - 2;

  // Data rows
  rows.forEach((row, ri) => {
    const rH = calcRowH(row);
    ensureSpace(rH + 2);

    x = ML;

    // Alternating background
    if (ri % 2 === 0) {
      doc.setFillColor(...LIGHT_GREY_BG);
      doc.rect(x, curY - 4.5, totalW, rH, 'F');
    }

    // Row border
    doc.setDrawColor(...TABLE_BORDER);
    doc.setLineWidth(0.2);
    doc.rect(x, curY - 4.5, totalW, rH, 'S');

    // Vertical cell separators
    let vx = ML;
    for (let ci = 0; ci < row.length - 1; ci++) {
      vx += colWidths[ci];
      doc.line(vx, curY - 4.5, vx, curY - 4.5 + rH);
    }

    // Cell text
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);

    row.forEach((cell, ci) => {
      if (typeof cell === 'object' && cell.badge) {
        // Draw a status badge
        const badgeText = cell.text;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const tw = doc.getTextWidth(badgeText);
        const badgeW = tw + 5;
        const badgeH = 5;
        const bx = x + padding;
        const by = curY - 3.5;

        if (cell.badge === 'green') {
          doc.setFillColor(...GREEN_BADGE_BG);
          doc.roundedRect(bx, by, badgeW, badgeH, 1.5, 1.5, 'F');
          doc.setTextColor(...GREEN_BADGE_TEXT);
        } else if (cell.badge === 'blue') {
          doc.setFillColor(...BLUE_BADGE_BG);
          doc.roundedRect(bx, by, badgeW, badgeH, 1.5, 1.5, 'F');
          doc.setTextColor(...BLUE_BADGE_TEXT);
        }

        doc.text(badgeText, bx + 2.5, by + 3.5);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'normal');
      } else {
        const cellText = typeof cell === 'object' ? cell.text : String(cell);
        const lines = doc.splitTextToSize(cellText, colWidths[ci] - padding * 2);
        doc.setTextColor(...DARK_TEXT);
        lines.forEach((line, li) => {
          doc.text(line, x + padding, curY + (li * 4));
        });
      }
      x += colWidths[ci];
    });

    curY += rH - 2;
  });

  curY += 5;
}


// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1: COVER
// ═══════════════════════════════════════════════════════════════════════════════

isCoverPage = true;
currentPageNum = 1;

// Logo centered top
try {
  doc.addImage(logoDataUrl, 'PNG', PAGE_W / 2 - 22, 35, 44, 22);
} catch (e) {
  // fallback
}

// Company name
curY = 78;
doc.setFont('helvetica', 'bold');
doc.setFontSize(28);
doc.setTextColor(...DARK_TEXT);
doc.text('ONE LIFE FOUNDATION', PAGE_W / 2, curY, { align: 'center' });

curY += 10;
doc.setFont('helvetica', 'normal');
doc.setFontSize(12);
doc.setTextColor(...GREY_TEXT);
doc.text('Pty Ltd', PAGE_W / 2, curY, { align: 'center' });

// Subtitle
curY += 22;
doc.setFont('helvetica', 'bold');
doc.setFontSize(20);
doc.setTextColor(...OLF_GREEN);
doc.text('Internal Audit Schedule', PAGE_W / 2, curY, { align: 'center' });

curY += 10;
doc.setFontSize(14);
doc.setTextColor(...GREY_TEXT);
doc.setFont('helvetica', 'normal');
doc.text('2026', PAGE_W / 2, curY, { align: 'center' });

// Horizontal line
curY += 12;
doc.setDrawColor(...OLF_GREEN);
doc.setLineWidth(0.8);
doc.line(ML + 30, curY, PAGE_W - MR - 30, curY);

// Confidential label
curY += 12;
doc.setFont('helvetica', 'italic');
doc.setFontSize(10);
doc.setTextColor(...GREY_TEXT);
doc.text('Confidential \u2014 Internal Use Only', PAGE_W / 2, curY, { align: 'center' });

// Metadata block
curY += 25;
const metaX = ML + 30;
const metaValX = ML + 72;

doc.setFontSize(10);
const metaItems = [
  ['Document Owner:', 'Kevin Rae Geronimo, General Manager'],
  ['Version:', '1.0'],
  ['Effective Date:', '1 January 2026'],
];

for (const [label, value] of metaItems) {
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREY_TEXT);
  doc.text(label, metaX, curY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK_TEXT);
  doc.text(value, metaValX, curY);
  curY += 7;
}

// Contact info at bottom
curY = PAGE_H - 45;
doc.setDrawColor(200, 200, 200);
doc.setLineWidth(0.3);
doc.line(ML + 30, curY, PAGE_W - MR - 30, curY);

curY += 8;
doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...GREY_TEXT);
doc.text('support@olfndisservices.com.au  |  ABN: 55 643 227 061', PAGE_W / 2, curY, { align: 'center' });
curY += 5;
doc.text('9C Grasslands Avenue, Craigieburn VIC 3064', PAGE_W / 2, curY, { align: 'center' });


// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2: AUDIT SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

// Section heading
curY += 2;
doc.setFont('helvetica', 'bold');
doc.setFontSize(16);
doc.setTextColor(...OLF_GREEN);
doc.text('Internal Audit Schedule 2026', ML, curY);
curY += 10;

// Intro paragraph
writeBody(
  'This schedule outlines the planned internal audit program for One Life Foundation for 2026. Internal audits are conducted by the General Manager and Operations Manager to assess compliance with NDIS Practice Standards, identify improvement opportunities, and maintain audit readiness. Findings are documented in Internal Audit Reports (Form15) and actioned through the Continuous Improvement Register (Form59).'
);

curY += 2;

// Auditors
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...OLF_GREEN);
doc.text('Auditors', ML, curY);
curY += 6;

setBody();
doc.setFontSize(9.5);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...DARK_TEXT);
doc.text('GM', ML + 4, curY);
doc.setFont('helvetica', 'normal');
doc.text(' \u2014 Kevin Rae Geronimo, General Manager', ML + 4 + doc.getTextWidth('GM'), curY);
curY += 5;

doc.setFont('helvetica', 'bold');
doc.text('OM', ML + 4, curY);
doc.setFont('helvetica', 'normal');
doc.text(' \u2014 Swosthani Thapa, Operations Manager', ML + 4 + doc.getTextWidth('OM'), curY);
curY += 8;

// Main audit schedule table
// Columns: Quarter | Audit Area | NDIS Modules | Auditor | Planned Date | Status
const tableHeaders = ['Quarter', 'Audit Area', 'NDIS Modules', 'Auditor', 'Planned Date', 'Status'];
const colWidths = [18, 50, 28, 16, 24, 22]; // total = 158 (fits in CW ~168)

const tableRows = [
  ['Q3', 'Rights & Responsibilities, Service Agreements', '101, 104', 'GM', 'Jul 2026', { text: 'Planned', badge: 'blue' }],
  ['Q3', 'Human Resource Management (staff files, screening, training)', '114', 'OM', 'Aug 2026', { text: 'Planned', badge: 'blue' }],
  ['Q3', 'Governance & Operations, Quality Management', '106, 108', 'GM', 'Sep 2026', { text: 'Planned', badge: 'blue' }],
  ['Q4', 'Risk Management, Emergency & Disaster Management', '107, 116', 'OM', 'Oct 2026', { text: 'Planned', badge: 'blue' }],
  ['Q4', 'Information Management, Feedback & Complaints, Incident Management', '117, 118, 120', 'GM', 'Nov 2026', { text: 'Planned', badge: 'blue' }],
  ['Q4', 'Support Planning, Provision of Supports, Transitions', '125, 128, 131, 136', 'OM', 'Nov 2026', { text: 'Planned', badge: 'blue' }],
  ['Q1 2027', 'Continuity of Supports, High Intensity (Module 1)', '115, Mod 1', 'GM', 'Jan 2027', { text: 'Planned', badge: 'blue' }],
  ['Q1 2027', 'Full compliance review (all modules) — annual review', 'All', 'GM + OM', 'Mar 2027', { text: 'Planned', badge: 'blue' }],
];

drawAuditTable(tableHeaders, tableRows, colWidths);

// Notes
curY += 2;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...OLF_GREEN);
doc.text('Notes', ML, curY);
curY += 6;

writeBullet('Internal audits use Form15 (Internal Audit Report) for findings and Form16 (Internal Audit Schedule) for tracking');
writeBullet('Non-conformances and observations are recorded and actioned through Form59 (Continuous Improvement Register)');
writeBullet('Audit results are presented at the next scheduled Management Review Meeting (Form25)');
writeBullet('High-risk areas or areas with previous non-conformances may be audited more frequently');
writeBullet('This schedule is reviewed annually and updated as needed');

// Version Control
curY += 5;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...OLF_GREEN);
doc.text('Version Control', ML, curY);
curY += 6;

// Simple version table
const vHeaders = ['Version', 'Date', 'Author'];
const vWidths = [25, 40, 60];
const vRows = [['1.0', '1 January 2026', 'Kevin Rae Geronimo']];

const vTotalW = vWidths.reduce((a, b) => a + b, 0);
const vPadding = 2.5;
const vFontSize = 8.5;
const vRowH = 7;

// Header
let vx = ML;
doc.setFillColor(...TABLE_HEADER_BG);
doc.rect(vx, curY - 4, vTotalW, vRowH, 'F');
doc.setDrawColor(...TABLE_BORDER);
doc.setLineWidth(0.3);
doc.rect(vx, curY - 4, vTotalW, vRowH, 'S');

let vhx = ML;
for (let ci = 0; ci < vHeaders.length - 1; ci++) {
  vhx += vWidths[ci];
  doc.line(vhx, curY - 4, vhx, curY - 4 + vRowH);
}

doc.setFontSize(vFontSize);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...TABLE_HEADER_TEXT);
vHeaders.forEach((h, i) => {
  doc.text(h, vx + vPadding, curY);
  vx += vWidths[i];
});
curY += vRowH - 1.5;

// Row
vx = ML;
doc.setDrawColor(...TABLE_BORDER);
doc.setLineWidth(0.2);
doc.rect(vx, curY - 4, vTotalW, vRowH, 'S');

vhx = ML;
for (let ci = 0; ci < vRows[0].length - 1; ci++) {
  vhx += vWidths[ci];
  doc.line(vhx, curY - 4, vhx, curY - 4 + vRowH);
}

doc.setFontSize(vFontSize);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...DARK_TEXT);
vRows[0].forEach((cell, ci) => {
  doc.text(cell, vx + vPadding, curY);
  vx += vWidths[ci];
});


// ═══════════════════════════════════════════════════════════════════════════════
// ADD FOOTERS TO ALL PAGES
// ═══════════════════════════════════════════════════════════════════════════════

const totalPgs = doc.getNumberOfPages();

for (let i = 1; i <= totalPgs; i++) {
  doc.setPage(i);
  drawFooter(i);
}


// ═══════════════════════════════════════════════════════════════════════════════
// SAVE & UPLOAD
// ═══════════════════════════════════════════════════════════════════════════════

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

// Save to Downloads
fs.writeFileSync(OUTPUT_PATH, pdfBuffer);
console.log(`Saved PDF to: ${OUTPUT_PATH}`);
console.log(`   Pages: ${totalPgs}`);
console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

// Upload to Supabase
const { error } = await sb.storage.from(BUCKET).upload(STORAGE_PATH, pdfBuffer, {
  contentType: 'application/pdf',
  upsert: true,
});

if (error) {
  console.error('Supabase upload failed:', error.message);
  process.exit(1);
} else {
  console.log(`Uploaded to Supabase: ${BUCKET}/${STORAGE_PATH}`);
}
