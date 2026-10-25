/**
 * create-meeting-calendar.mjs
 *
 * Generates the One Life Foundation Meeting Calendar 2026 PDF.
 * Style: Clean SNG style — cover page, minimal headers, OLF Green accents.
 *
 * Usage: node scripts/create-meeting-calendar.mjs
 */

import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');

const OUTPUT_PATH = 'C:/Users/kevin/Downloads/OLF Meeting Calendar 2026.pdf';

// ─── Colors ──────────────────────────────────────────────────────────────────
const OLF_GREEN = [14, 160, 62];       // #0ea03e
const DARK_TEXT = [30, 41, 59];         // #1e293b
const GREY_TEXT = [100, 116, 139];      // #64748b
const LIGHT_GREY_BG = [241, 245, 249]; // #f1f5f9
const WHITE = [255, 255, 255];
const TABLE_BORDER = [203, 213, 225];  // #cbd5e1
const TABLE_HEADER_BG = [240, 253, 244]; // very light green
const TABLE_HEADER_TEXT = [14, 120, 50]; // darker green for header text
const CHECK_GREEN = [14, 160, 62];      // checkmark color

// ─── Page dimensions ─────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 18;     // left margin
const MR = 18;     // right margin
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

// ─── Header (small, clean — for content pages only) ─────────────────────────
function drawHeader() {
  if (isCoverPage) return;

  // Logo small, left aligned
  try {
    doc.addImage(logoDataUrl, 'PNG', ML, 8, 18, 9);
  } catch (e) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...OLF_GREEN);
    doc.text('OLF', ML, 14);
  }

  // Title right-aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('Meeting Calendar 2026', PAGE_W - MR, 14, { align: 'right' });

  // Thin line underneath
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(ML, 20, PAGE_W - MR, 20);
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function drawFooter(pageNum, totalPgs) {
  if (pageNum === 1) return; // no footer on cover

  const footerY = PAGE_H - 12;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text(`${pageNum} | ${totalPgs}`, PAGE_W - MR, footerY, { align: 'right' });

  // Left: doc name
  doc.text('One Life Foundation \u2014 Meeting Calendar 2026', ML, footerY);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function newPage() {
  doc.addPage();
  isCoverPage = false;
  drawHeader();
  curY = MARGIN_T;
}

function ensureSpace(needed) {
  if (curY + needed > PAGE_H - MARGIN_B) {
    newPage();
  }
}

/** Section heading: Green text */
function sectionHeading(text) {
  ensureSpace(16);
  curY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...OLF_GREEN);
  doc.text(text, ML, curY);
  curY += 8;
}

/** Sub-heading */
function subHeading(text) {
  ensureSpace(12);
  curY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...OLF_GREEN);
  doc.text(text, ML, curY);
  curY += 6;
}

/** Write a bullet point */
function writeBullet(text, indent = 4) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK_TEXT);

  const bulletX = ML + indent;
  const textX = bulletX + 3.5;
  const maxW = CW - indent - 3.5;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 4.5;

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

/**
 * Draw a table with text wrapping support.
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {number[]} colWidths
 * @param {object} opts - { centerCols: number[] } columns to center-align
 */
function drawTable(headers, rows, colWidths, opts = {}) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const baseRowH = 7;
  const padding = 2;
  const fontSize = 7.5;
  const lineH = 3.6;
  const centerCols = opts.centerCols || [];

  function calcRowH(cells) {
    let maxLines = 1;
    doc.setFontSize(fontSize);
    cells.forEach((cell, i) => {
      const lines = doc.splitTextToSize(String(cell), colWidths[i] - padding * 2);
      if (lines.length > maxLines) maxLines = lines.length;
    });
    return Math.max(baseRowH, maxLines * lineH + 3.5);
  }

  // Header row
  ensureSpace(baseRowH + 5);
  let x = ML;
  const headerH = calcRowH(headers);

  // Header background
  doc.setFillColor(...TABLE_HEADER_BG);
  doc.rect(x, curY - 4, totalW, headerH, 'F');

  // Header border
  doc.setDrawColor(...TABLE_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(x, curY - 4, totalW, headerH, 'S');

  // Vertical separators in header
  let hx = ML;
  for (let ci = 0; ci < headers.length - 1; ci++) {
    hx += colWidths[ci];
    doc.line(hx, curY - 4, hx, curY - 4 + headerH);
  }

  // Header text
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TABLE_HEADER_TEXT);

  headers.forEach((h, i) => {
    const lines = doc.splitTextToSize(String(h), colWidths[i] - padding * 2);
    if (centerCols.includes(i)) {
      const cellCenter = x + colWidths[i] / 2;
      lines.forEach((line, li) => {
        doc.text(line, cellCenter, curY + (li * lineH), { align: 'center' });
      });
    } else {
      lines.forEach((line, li) => {
        doc.text(line, x + padding, curY + (li * lineH));
      });
    }
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
      doc.rect(x, curY - 4, totalW, rH, 'F');
    }

    // Row border
    doc.setDrawColor(...TABLE_BORDER);
    doc.setLineWidth(0.2);
    doc.rect(x, curY - 4, totalW, rH, 'S');

    // Vertical cell separators
    let vx = ML;
    for (let ci = 0; ci < row.length - 1; ci++) {
      vx += colWidths[ci];
      doc.line(vx, curY - 4, vx, curY - 4 + rH);
    }

    // Cell text
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);

    row.forEach((cell, ci) => {
      const cellText = String(cell);
      const lines = doc.splitTextToSize(cellText, colWidths[ci] - padding * 2);

      if (centerCols.includes(ci)) {
        const cellCenter = x + colWidths[ci] / 2;
        // Check if it's a checkmark — render in green
        if (cellText.trim() === '\u2713') {
          doc.setTextColor(...CHECK_GREEN);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(cellText, cellCenter, curY + 0.5, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fontSize);
          doc.setTextColor(...DARK_TEXT);
        } else {
          lines.forEach((line, li) => {
            doc.text(line, cellCenter, curY + (li * lineH), { align: 'center' });
          });
        }
      } else {
        lines.forEach((line, li) => {
          doc.text(line, x + padding, curY + (li * lineH));
        });
      }
      x += colWidths[ci];
    });

    curY += rH - 2;
  });

  curY += 5;
}


// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1: COVER PAGE
// ═══════════════════════════════════════════════════════════════════════════════

isCoverPage = true;

// Logo centered top
try {
  doc.addImage(logoDataUrl, 'PNG', PAGE_W / 2 - 22, 40, 44, 22);
} catch (e) {
  // fallback
}

// Company name
curY = 82;
doc.setFont('helvetica', 'bold');
doc.setFontSize(28);
doc.setTextColor(...DARK_TEXT);
doc.text('ONE LIFE FOUNDATION', PAGE_W / 2, curY, { align: 'center' });

// Subtitle
curY += 18;
doc.setFont('helvetica', 'normal');
doc.setFontSize(18);
doc.setTextColor(...DARK_TEXT);
doc.text('Meeting Calendar 2026', PAGE_W / 2, curY, { align: 'center' });

// Green line
curY += 12;
doc.setDrawColor(...OLF_GREEN);
doc.setLineWidth(0.8);
doc.line(ML + 35, curY, PAGE_W - MR - 35, curY);

// Governance label
curY += 14;
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...OLF_GREEN);
doc.text('Governance & Quality Management', PAGE_W / 2, curY, { align: 'center' });

// Metadata block
curY += 30;
const metaX = ML + 40;
const metaValX = ML + 82;

doc.setFontSize(10);
const metaItems = [
  ['Document Owner:', 'Kevin Rae Geronimo, General Manager'],
  ['Version:', '1.0'],
  ['Effective Date:', '1 January 2026'],
  ['Review Date:', '1 January 2027'],
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
// PAGE 2: RECURRING MEETINGS TABLE
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeading('Recurring Meeting Schedule');

curY += 2;

const recurHeaders = ['Meeting', 'Frequency', 'Day / Time', 'Chair', 'Attendees', 'Purpose'];
const recurWidths = [28, 18, 30, 24, 28, CW - 28 - 18 - 30 - 24 - 28]; // last col takes remainder

const recurRows = [
  [
    'Management Review Meeting',
    'Quarterly',
    '1st Monday of Jan, Apr, Jul, Oct \u2014 10:00 AM',
    'Harsimran Singh (Director)',
    'All management team',
    'Review QMS performance, compliance, strategic objectives, continuous improvement',
  ],
  [
    'Staff Team Meeting',
    'Monthly',
    '1st Wednesday of each month \u2014 9:00 AM',
    'Swosthani Thapa (Ops Manager)',
    'All rostered staff',
    'Operational updates, participant care, rostering, staff concerns',
  ],
  [
    'WHS Committee Meeting',
    'Quarterly',
    '2nd Monday of Feb, May, Aug, Nov \u2014 10:00 AM',
    'Kevin Rae Geronimo (GM)',
    'All management + staff rep',
    'Hazard review, incident trends, safety improvements',
  ],
  [
    'Participant Care Review',
    'Monthly',
    '3rd Wednesday of each month \u2014 2:00 PM',
    'Swosthani Thapa (Ops Manager)',
    'Relevant support workers + SC',
    'Individual participant progress, care plan review, goals',
  ],
  [
    'Continuous Improvement Review',
    'Quarterly',
    '3rd Monday of Mar, Jun, Sep, Dec \u2014 10:00 AM',
    'Kevin Rae Geronimo (GM)',
    'Management team',
    'CI register review, complaints/feedback trends, audit findings',
  ],
  [
    'Staff Supervision (Individual)',
    'Monthly',
    'Scheduled individually',
    'Kevin Rae Geronimo (GM)',
    'Individual staff member',
    'Performance, wellbeing, training needs, workload',
  ],
  [
    'Incident Review',
    'As needed (within 48h)',
    'As required',
    'Harsimran Singh (Director)',
    'Relevant staff + management',
    'Incident investigation, corrective actions',
  ],
];

drawTable(recurHeaders, recurRows, recurWidths);


// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 3: ANNUAL CALENDAR + NOTES
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeading('2026 Annual Calendar');

curY += 2;

const CHK = '\u2713'; // checkmark
const EMPTY = '';

const calHeaders = ['Month', 'Mgmt Review', 'Staff Meeting', 'WHS Committee', 'Care Review', 'CI Review', 'Notes'];
const calWidths = [22, 20, 20, 20, 20, 18, CW - 22 - 20 - 20 - 20 - 20 - 18];
const centerCols = [1, 2, 3, 4, 5]; // center checkmark columns

const calRows = [
  ['January',   CHK, CHK, EMPTY, CHK, EMPTY, 'New year planning'],
  ['February',  EMPTY, CHK, CHK, CHK, EMPTY, ''],
  ['March',     EMPTY, CHK, EMPTY, CHK, CHK, 'Q1 CI review'],
  ['April',     CHK, CHK, EMPTY, CHK, EMPTY, 'Q2 management review'],
  ['May',       EMPTY, CHK, CHK, CHK, EMPTY, ''],
  ['June',      EMPTY, CHK, EMPTY, CHK, CHK, 'Mid-year CI review'],
  ['July',      CHK, CHK, EMPTY, CHK, EMPTY, 'Q3 management review'],
  ['August',    EMPTY, CHK, CHK, CHK, EMPTY, ''],
  ['September', EMPTY, CHK, EMPTY, CHK, CHK, 'Q3 CI review'],
  ['October',   CHK, CHK, EMPTY, CHK, EMPTY, 'Q4 management review'],
  ['November',  EMPTY, CHK, CHK, CHK, EMPTY, ''],
  ['December',  EMPTY, CHK, EMPTY, CHK, CHK, 'Annual review + planning'],
];

drawTable(calHeaders, calRows, calWidths, { centerCols });

// ─── Notes Section ───────────────────────────────────────────────────────────

subHeading('Notes');

const notes = [
  'All meetings documented with minutes and action items.',
  'Management Review Meeting minutes stored in One Life Vault (Form25).',
  'Staff supervision logs maintained for each team member.',
  'Meeting records retained for minimum 7 years per NDIS requirements.',
  'Ad-hoc meetings may be convened as needed for urgent matters.',
];

for (const note of notes) {
  writeBullet(note);
}

// ─── Version Control ─────────────────────────────────────────────────────────

curY += 6;
ensureSpace(16);

// Thin line
doc.setDrawColor(200, 200, 200);
doc.setLineWidth(0.3);
doc.line(ML, curY, PAGE_W - MR, curY);

curY += 6;
doc.setFontSize(8);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...GREY_TEXT);
doc.text('Version Control', ML, curY);

curY += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...DARK_TEXT);
doc.text('Version 1.0  |  1 January 2026  |  Kevin Rae Geronimo', ML, curY);


// ═══════════════════════════════════════════════════════════════════════════════
// ADD FOOTERS TO ALL PAGES
// ═══════════════════════════════════════════════════════════════════════════════

const totalPgs = doc.getNumberOfPages();

for (let i = 1; i <= totalPgs; i++) {
  doc.setPage(i);
  drawFooter(i, totalPgs);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════════════════════

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

fs.writeFileSync(OUTPUT_PATH, pdfBuffer);
console.log(`\u2705 Saved PDF to: ${OUTPUT_PATH}`);
console.log(`   Pages: ${totalPgs}`);
console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
