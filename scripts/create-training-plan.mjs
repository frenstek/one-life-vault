/**
 * create-training-plan.mjs
 *
 * Generates the One Life Foundation Staff Training and Development Plan 2026 PDF.
 * Style: Clean SNG style (OLF Green headings, minimal header, subtle tables).
 *
 * Saves to Downloads + uploads to Supabase (documents / New Forms - For Review).
 *
 * Usage: node scripts/create-training-plan.mjs
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

const OUTPUT_PATH = 'C:/Users/kevin/Downloads/OLF Staff Training Plan 2026.pdf';
const BUCKET = 'documents';
const STORAGE_PATH = 'New Forms - For Review/OLF Staff Training Plan 2026.pdf';

// ─── Colors ──────────────────────────────────────────────────────────────────
const OLF_GREEN = [14, 160, 62];           // #0ea03e
const DARK_TEXT = [30, 41, 59];            // #1e293b
const GREY_TEXT = [100, 116, 139];         // #64748b
const LIGHT_GREY_BG = [248, 250, 252];    // #f8fafc
const WHITE = [255, 255, 255];
const TABLE_BORDER = [226, 232, 240];      // #e2e8f0
const TABLE_HEADER_BG = [240, 253, 244];   // #f0fdf4
const TABLE_HEADER_TEXT = [14, 120, 50];    // dark green text

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
let isTocPage = false;

// Track section page numbers for TOC
const tocEntries = [];
let currentPageNum = 1;

// ─── Header (small, clean) ──────────────────────────────────────────────────
function drawHeader() {
  if (isCoverPage || isTocPage) return;

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
  doc.text('Staff Training and Development Plan 2026', PAGE_W - MR, 14, { align: 'right' });

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
  isTocPage = false;
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
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK_TEXT);
}

function setBold() {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK_TEXT);
}

/** Section heading: Large green text, numbered */
function sectionHeading(number, text) {
  ensureSpace(20);
  curY += 12;

  const fullText = `${number}. ${text}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...OLF_GREEN);
  doc.text(fullText, ML, curY);

  curY += 10;

  // Record for TOC
  tocEntries.push({ number, text, page: currentPageNum });
}

/** Sub-heading: Bold green text, slightly smaller */
function subHeading(text) {
  ensureSpace(16);
  curY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...OLF_GREEN);
  doc.text(text, ML, curY);
  curY += 7;
}

/** Write wrapped body text */
function writeBody(text, indent = 0) {
  setBody();
  const maxW = CW - indent;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 5.5;

  for (const line of lines) {
    ensureSpace(lineH + 1);
    doc.text(line, ML + indent, curY);
    curY += lineH;
  }
  curY += 3;
}

/** Write a bullet point */
function writeBullet(text, indent = 6) {
  setBody();
  const bulletX = ML + indent;
  const textX = bulletX + 4;
  const maxW = CW - indent - 4;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 5.5;

  ensureSpace(lines.length * lineH + 2);
  doc.setTextColor(...GREY_TEXT);
  doc.text('\u2022', bulletX, curY);
  doc.setTextColor(...DARK_TEXT);
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], textX, curY);
    curY += lineH;
  }
  curY += 1.5;
}

/** Write a bullet with bold label */
function writeBulletBold(label, desc, indent = 6) {
  const bulletX = ML + indent;
  const textX = bulletX + 4;
  const maxW = CW - indent - 4;
  const lineH = 5.5;

  const fullText = `${label}: ${desc}`;
  const lines = doc.splitTextToSize(fullText, maxW);

  ensureSpace(lines.length * lineH + 2);

  // Bullet
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('\u2022', bulletX, curY);

  // Bold label + normal desc
  doc.setTextColor(...DARK_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(label + ':', textX, curY);
  const labelW = doc.getTextWidth(label + ':');

  doc.setFont('helvetica', 'normal');
  doc.text(' ' + desc, textX + labelW, curY);

  if (lines.length === 1) {
    curY += lineH;
  } else {
    curY += lineH;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    for (let i = 1; i < lines.length; i++) {
      doc.text(lines[i], textX, curY);
      curY += lineH;
    }
  }
  curY += 1.5;
}

/** Draw a clean table with thin borders and subtle header */
function drawTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 8;
  const padding = 2.5;
  const fontSize = 8.5;

  function calcRowH(cells) {
    let maxLines = 1;
    doc.setFontSize(fontSize);
    cells.forEach((cell, i) => {
      const lines = doc.splitTextToSize(String(cell), colWidths[i] - padding * 2);
      if (lines.length > maxLines) maxLines = lines.length;
    });
    return Math.max(rowH, maxLines * 4.2 + 4);
  }

  // Header row
  ensureSpace(rowH + 5);
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
    const lines = doc.splitTextToSize(String(h), colWidths[i] - padding * 2);
    lines.forEach((line, li) => {
      doc.text(line, x + padding, curY + (li * 4.2));
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
      const cellText = String(cell);
      const lines = doc.splitTextToSize(cellText, colWidths[ci] - padding * 2);
      lines.forEach((line, li) => {
        doc.text(line, x + padding, curY + (li * 4.2));
      });
      x += colWidths[ci];
    });

    curY += rH - 2;
  });

  curY += 5;
}


// ═══════════════════════════════════════════════════════════════════════════════
// COVER PAGE
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
doc.text('Staff Training and Development Plan', PAGE_W / 2, curY, { align: 'center' });

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
  ['Approved By:', 'Harsimran Singh, Director'],
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
// TABLE OF CONTENTS (page 2)
// ═══════════════════════════════════════════════════════════════════════════════

doc.addPage();
currentPageNum = 2;
isCoverPage = false;
isTocPage = true;

// Header for TOC page
try {
  doc.addImage(logoDataUrl, 'PNG', ML, 8, 15, 7.5);
} catch (e) {}
doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...GREY_TEXT);
doc.text('Staff Training and Development Plan 2026', PAGE_W - MR, 14, { align: 'right' });
doc.setDrawColor(200, 200, 200);
doc.setLineWidth(0.3);
doc.line(ML, 20, PAGE_W - MR, 20);

curY = 38;
doc.setFont('helvetica', 'bold');
doc.setFontSize(20);
doc.setTextColor(...OLF_GREEN);
doc.text('Table of Contents', ML, curY);

curY += 15;

const tocStartY = curY;
const tocPageIdx = 1; // 0-indexed page


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Purpose
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeading(1, 'Purpose');

writeBody(
  'This Training and Development Plan establishes a structured framework for ensuring all One Life Foundation (OLF) staff maintain the knowledge, skills, and competencies required to deliver safe, high-quality NDIS support services.'
);

writeBody(
  'It supports compliance with NDIS Practice Standards (Standard 114 \u2014 Human Resource Management) and ensures staff are equipped to meet the complex care needs of OLF participants.'
);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: Scope
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(2, 'Scope');

writeBody(
  'This plan applies to all OLF staff \u2014 full-time, part-time, casual employees, and contractors. Training requirements apply from commencement of employment or engagement and continue throughout the duration of service.'
);

writeBody(
  'As at 1 January 2026, OLF employs 10 staff: 3 full-time employees, 2 casual employees, and 5 contractors working across Supported Independent Living (SIL), community participation, and high-intensity support roles.'
);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: Training Framework
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(3, 'Training Framework');

writeBody(
  'OLF uses a three-tier training framework to ensure staff receive structured, progressive training that aligns with both regulatory requirements and participant needs:'
);

writeBulletBold('Tier 1 \u2014 Mandatory (All Staff)', 'Required before commencing unsupervised work. Covers safety, compliance, and foundational NDIS knowledge.');
writeBulletBold('Tier 2 \u2014 Role-Specific', 'Required based on specific role and participant needs. Includes high-intensity clinical skills for support workers.');
writeBulletBold('Tier 3 \u2014 Professional Development', 'Ongoing learning and career progression opportunities supported by OLF.');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: Tier 1 — Mandatory Training (All Staff)
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(4, 'Tier 1 \u2014 Mandatory Training (All Staff)');

writeBody(
  'The following training must be completed by all OLF staff. Tier 1 training is required before a worker may commence unsupervised duties.'
);

drawTable(
  ['Training', 'Delivery', 'Frequency', 'Duration', 'Compliance'],
  [
    ['NDIS Worker Orientation Module', 'Online (NDIS Commission)', 'Once (at induction)', '90 min', 'Before first shift'],
    ['NDIS Code of Conduct', 'Online + in-house', 'Induction + annual refresher', '60 min', 'Signed acknowledgement'],
    ['OLF Policies and Procedures', 'In-house (induction)', 'Once + when updated', '2 hours', 'Documented in Form08'],
    ['Work Health and Safety', 'In-house', 'Induction + annual refresher', '2 hours', 'Documented'],
    ['Manual Handling / Safe Transfers', 'In-house practical', 'Induction + annual refresher', '3 hours', 'Competency assessment'],
    ['First Aid (HLTAID011)', 'External RTO', 'Every 3 years', '1 day', 'Certificate required'],
    ['CPR (HLTAID009)', 'External RTO', 'Annual', '3 hours', 'Certificate required'],
    ['Infection Control & Hand Hygiene', 'In-house / online', 'Induction + annual refresher', '1 hour', 'Documented'],
    ['Fire Safety & Emergency Procedures', 'In-house', 'Induction + 6-monthly drill', '1 hour', 'Drill attendance recorded'],
    ['Incident Reporting', 'In-house', 'Induction + annual refresher', '1 hour', 'Documented'],
    ['Abuse, Neglect & Exploitation Prevention', 'In-house / online', 'Induction + annual refresher', '2 hours', 'Documented'],
    ['Privacy and Confidentiality', 'In-house', 'At induction', '1 hour', 'Signed agreement'],
    ['Cultural Awareness', 'Online / in-house', 'Induction + annual refresher', '2 hours', 'Documented'],
  ],
  [40, 32, 32, 22, 42]
);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: Tier 2 — Role-Specific Training
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(5, 'Tier 2 \u2014 Role-Specific Training (Support Workers)');

writeBody(
  'Role-specific training applies based on the participant needs assigned to each worker. OLF delivers high-intensity supports including diabetes management, catheter care, and wound care \u2014 all requiring documented competency before unsupervised care.'
);

drawTable(
  ['Training', 'Who', 'Delivery', 'Frequency', 'Notes'],
  [
    ['Medication Administration', 'All support workers', 'External RTO + in-house', 'Annual competency', 'Certificate before administering'],
    ['Diabetes Management (BGL + Insulin)', 'Staff supporting diabetic participants', 'In-house + HI-003', 'At assignment, 6-monthly review', 'Competency assessed & documented'],
    ['Catheter Care (Suprapubic)', 'Staff supporting catheter participants', 'In-house + HI-001', 'At assignment, 6-monthly review', 'Competency assessed & documented'],
    ['Wound Care & Pressure Prevention', 'Staff supporting wound care participants', 'In-house + HI-002', 'At assignment, 6-monthly review', 'Competency assessed & documented'],
    ['Seizure Management', 'Staff supporting seizure participants', 'In-house / online', 'At assignment', 'Competency assessment'],
    ['Dysphagia / Mealtime Mgmt', 'Staff with swallowing-needs participants', 'In-house / allied health', 'At assignment', 'Speech pathologist guidance'],
    ['Positive Behaviour Support', 'Staff supporting BSP participants', 'External / BSP practitioner', 'At assignment, annual refresher', 'Aligned with individual BSP'],
    ['Restrictive Practices Awareness', 'Staff with BSP participants', 'In-house / BSP practitioner', 'Annual', 'Documented'],
    ['Hoist & Equipment Training', 'All SIL support workers', 'In-house practical', 'Induction + equipment changes', 'Competency on specific equipment'],
  ],
  [36, 32, 28, 32, 40]
);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: Tier 3 — Professional Development
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(6, 'Tier 3 \u2014 Professional Development');

writeBody(
  'OLF encourages and supports ongoing professional development for all staff. The following pathways are available and supported by OLF:'
);

writeBullet('Certificate III in Individual Support (Disability) \u2014 CHC33015');
writeBullet('Certificate IV in Disability \u2014 CHC43115');
writeBullet('Diploma of Community Services \u2014 CHC52015');
writeBullet('Mental Health First Aid');
writeBullet('Trauma-Informed Care');
writeBullet('Leadership and Supervision');
writeBullet('Food Safety Supervisor');

curY += 3;

subHeading('How OLF Supports Development');

writeBullet('Identifying training goals during regular supervision sessions');
writeBullet('Recording development plans in Form113 (Professional Development Policy)');
writeBullet('Providing study leave for approved courses');
writeBullet('Contributing to course fees where aligned with OLF service delivery needs');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: Induction Training Schedule (First 2 Weeks)
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(7, 'Induction Training Schedule');

writeBody(
  'All new staff complete a structured two-week induction program. The schedule below outlines the standard induction pathway, with role-specific modules added as required.'
);

drawTable(
  ['Day', 'Training Activity', 'Duration', 'Delivered By', 'Method'],
  [
    ['Day 1', 'Welcome, OLF overview, policies & procedures', '3 hours', 'GM / Ops Manager', 'In-house'],
    ['Day 1', 'NDIS Worker Orientation Module', '90 min', 'Self-directed', 'Online'],
    ['Day 1', 'Code of Conduct, privacy, confidentiality', '1 hour', 'GM', 'In-house'],
    ['Day 2', 'WHS, manual handling, infection control', '3 hours', 'GM / Ops Mgr', 'Practical'],
    ['Day 2', 'Fire safety, emergency procedures, site orientation', '2 hours', 'Ops Manager', 'On-site'],
    ['Day 3', 'Participant introduction, care plans review', '2 hours', 'Ops Manager', 'On-site'],
    ['Day 3', 'Medication management (if applicable)', '2 hours', 'Ops Manager', 'In-house'],
    ['Day 4\u20135', 'Buddy shifts (shadowing experienced worker)', 'Full shifts', 'Senior worker', 'On-site'],
    ['Week 2', 'Role-specific training (diabetes/catheter/wound if applicable)', 'As needed', 'Ops Mgr + guides', 'In-house'],
    ['Week 2', 'Competency assessments', 'As needed', 'GM / Ops Mgr', 'Practical'],
    ['End Wk 2', 'Induction checklist review (Form08)', '30 min', 'GM', 'In-house'],
  ],
  [20, 52, 22, 30, 22]  // = 146 but we have CW of 168
);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: Training Records and Compliance Tracking
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(8, 'Training Records and Compliance Tracking');

writeBody(
  'OLF maintains a robust system for tracking training completion and compliance:'
);

writeBullet('All training recorded in OLF Training Matrix (Form09)');
writeBullet('Individual training tracked in One Life Vault (staff profile \u2192 compliance tab)');
writeBullet('Certificates uploaded to staff files and verified before role commencement');
writeBullet('Expiry tracking with automated reminders (60-day, 30-day, 14-day alerts)');
writeBullet('Training compliance reviewed monthly by General Manager');
writeBullet('Non-compliance escalated to Director for immediate action');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: Annual Training Calendar 2026
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(9, 'Annual Training Calendar 2026');

writeBody(
  'The following calendar outlines scheduled training activities by quarter. Ad-hoc training sessions are arranged as needed for new staff or role changes.'
);

drawTable(
  ['Quarter', 'Training Activities'],
  [
    ['Q1 (Jan\u2013Mar)', 'Induction training for new staff, NDIS Orientation Modules, Manual Handling refresher, First Aid/CPR group booking'],
    ['Q2 (Apr\u2013Jun)', 'Fire drill (April), Abuse Prevention refresher, Medication competency assessments, Cultural awareness session'],
    ['Q3 (Jul\u2013Sep)', 'WHS refresher, Incident reporting refresher, High-intensity competency reviews, Fire drill (September)'],
    ['Q4 (Oct\u2013Dec)', 'Annual performance reviews (Form10), Professional development planning for next year, Code of Conduct refresher, Fire drill (December), First Aid/CPR renewals (if due)'],
  ],
  [30, 138]
);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: Responsibilities
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(10, 'Responsibilities');

writeBody(
  'The table below outlines training responsibilities across OLF roles.'
);

drawTable(
  ['Role', 'Training Responsibilities'],
  [
    ['Director', 'Approve training budget, oversee compliance at strategic level, review escalated non-compliance'],
    ['General Manager', 'Develop and maintain training plan, monitor compliance, conduct training sessions, maintain records, report to Director'],
    ['Operations Manager', 'Deliver on-site training, coordinate buddy shifts, conduct competency assessments, maintain training guides'],
    ['Support Workers', 'Complete all mandatory training, maintain current certifications, participate actively in development opportunities'],
  ],
  [38, 130]
);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11: Related Documents
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(11, 'Related Documents');

writeBullet('Form08 \u2014 Induction Checklist');
writeBullet('Form09 \u2014 Training Matrix');
writeBullet('Form10 \u2014 Worker Performance Assessment');
writeBullet('Form113 \u2014 Professional Development Policy');
writeBullet('Form122 \u2014 Staff Supervision and Support Policy');
writeBullet('OLF Training Guide HI-001 \u2014 Catheter Care');
writeBullet('OLF Training Guide HI-002 \u2014 Wound Care');
writeBullet('OLF Training Guide HI-003 \u2014 Diabetes Management');


// ═══════════════════════════════════════════════════════════════════════════════
// VERSION CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

curY += 8;
subHeading('Version Control');

drawTable(
  ['Version', 'Date', 'Author', 'Changes'],
  [
    ['1.0', '1 January 2026', 'Kevin Rae Geronimo', 'Initial release'],
  ],
  [20, 35, 45, 68]
);


// ═══════════════════════════════════════════════════════════════════════════════
// BUILD TOC
// ═══════════════════════════════════════════════════════════════════════════════

const totalPgs = doc.getNumberOfPages();

// Go back to TOC page and fill in entries
doc.setPage(2);
let tocY = tocStartY;

for (const entry of tocEntries) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_TEXT);

  const label = `${entry.number}. ${entry.text}`;
  doc.text(label, ML, tocY);

  // Page number right-aligned
  const pageStr = String(entry.page);
  doc.setTextColor(...GREY_TEXT);
  doc.text(pageStr, PAGE_W - MR, tocY, { align: 'right' });

  // Dot leaders
  const labelW = doc.getTextWidth(label);
  const pageW = doc.getTextWidth(pageStr);
  const dotStart = ML + labelW + 3;
  const dotEnd = PAGE_W - MR - pageW - 3;
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  let dotX = dotStart;
  while (dotX < dotEnd) {
    doc.text('.', dotX, tocY);
    dotX += 2.2;
  }

  tocY += 8;
}


// ═══════════════════════════════════════════════════════════════════════════════
// ADD FOOTERS TO ALL PAGES
// ═══════════════════════════════════════════════════════════════════════════════

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
