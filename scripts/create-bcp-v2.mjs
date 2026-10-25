/**
 * create-bcp-v2.mjs
 *
 * Generates the One Life Foundation Business Continuity Plan (Form103) PDF.
 * Style: Clean & professional (matching Secure Nation Group document style).
 *
 * Usage: node scripts/create-bcp-v2.mjs
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

const OUTPUT_PATH = 'C:/Users/kevin/Downloads/Form103.Business Continuity Plan.pdf';
const STORAGE_PATH = 'Policies and Procedures/Core 2 - Governance & Operations/Form103.Business Continuity Plan.pdf';
const BUCKET = 'auditor-portal';

// ─── Colors ──────────────────────────────────────────────────────────────────
const OLF_GREEN = [14, 160, 62];           // #0ea03e
const OLF_BLUE = [48, 158, 221];           // #309edd
const DARK_TEXT = [30, 41, 59];             // #1e293b
const GREY_TEXT = [100, 116, 139];          // #64748b
const LIGHT_GREY_BG = [248, 250, 252];     // #f8fafc
const WHITE = [255, 255, 255];
const TABLE_BORDER = [226, 232, 240];       // #e2e8f0
const TABLE_HEADER_BG = [240, 253, 244];    // #f0fdf4
const TABLE_HEADER_TEXT = [14, 120, 50];     // dark green text
const ALERT_RED_BG = [254, 242, 242];       // light red
const ALERT_RED_BORDER = [220, 38, 38];     // red
const ALERT_AMBER_BG = [255, 251, 235];     // light amber
const ALERT_AMBER_BORDER = [217, 119, 6];   // amber
const ALERT_BLUE_BG = [239, 246, 255];      // light blue
const ALERT_BLUE_BORDER = [59, 130, 246];   // blue
const ALERT_GREEN_BG = [240, 253, 244];     // light green
const ALERT_GREEN_BORDER = [14, 160, 62];   // OLF green

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

  // "Business Continuity Plan" right-aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('Business Continuity Plan', PAGE_W - MR, 14, { align: 'right' });

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

/** Draw a callout / alert box with thin left border accent */
function drawCallout(text, borderColor = ALERT_GREEN_BORDER, bgColor = ALERT_GREEN_BG) {
  setBody();
  const boxML = ML + 1;
  const textML = ML + 7;
  const maxW = CW - 8;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 5.5;
  const boxH = lines.length * lineH + 6;

  ensureSpace(boxH + 3);

  // Background
  doc.setFillColor(...bgColor);
  doc.roundedRect(ML, curY - 4, CW, boxH, 1.5, 1.5, 'F');

  // Left accent border
  doc.setFillColor(...borderColor);
  doc.rect(ML, curY - 4, 2.5, boxH, 'F');

  // Text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK_TEXT);
  for (const line of lines) {
    doc.text(line, textML, curY);
    curY += lineH;
  }
  curY += 5;
}

/** Draw a numbered step */
function writeNumberedStep(num, text, indent = 6) {
  setBody();
  const numX = ML + indent;
  const textX = numX + 7;
  const maxW = CW - indent - 7;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 5.5;

  ensureSpace(lines.length * lineH + 2);

  // Number
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...OLF_GREEN);
  doc.text(`${num}.`, numX, curY);

  // Text
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK_TEXT);
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], textX, curY);
    curY += lineH;
  }
  curY += 1.5;
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
doc.text('Business Continuity Plan', PAGE_W / 2, curY, { align: 'center' });

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
  ['Prepared By:', 'One Life Foundation Pty Ltd'],
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
doc.text('Business Continuity Plan', PAGE_W - MR, 14, { align: 'right' });
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

writeBody('This Business Continuity Plan (BCP) establishes the framework for One Life Foundation Pty Ltd (OLF) to maintain critical NDIS support services during disruption events. OLF provides 24/7 Supported Independent Living to participants with complex medical needs. Any disruption to services poses a direct risk to participant health and safety.');

writeBody('This plan ensures:');

writeBullet('Participant safety is maintained as the highest priority during any disruption');
writeBullet('Critical support services continue with minimal interruption');
writeBullet('Staff understand their roles and responsibilities during disruption events');
writeBullet('Recovery from disruption is structured, efficient, and documented');
writeBullet('Compliance with NDIS Practice Standards Element 15 (Continuity of Supports)');

drawCallout('OLF delivers 24/7 care to participants with complex medical needs. Any disruption to services may create an immediate and serious risk to participant health and safety. This plan must be treated as a critical operational document.', ALERT_RED_BORDER, ALERT_RED_BG);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: Scope
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(2, 'Scope');

writeBody('This Business Continuity Plan applies to:');

writeBullet('All OLF operations, accommodation sites, and community-based services');
writeBullet('All staff, including employees and contractors');
writeBullet('All participants and their support networks');
writeBullet('Critical third-party services (medical, pharmacy, transport, allied health)');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: Key Personnel and Emergency Contacts
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(3, 'Key Personnel and Emergency Contacts');

subHeading('Key Personnel');

drawTable(
  ['Role', 'Name', 'Contact', 'Backup Person'],
  [
    ['Director', 'Harsimran Singh', 'harrychattha1313@gmail.com', 'Kevin Rae Geronimo'],
    ['General Manager', 'Kevin Rae Geronimo', 'kevinraegeronimo@yahoo.com', 'Swosthani Thapa'],
    ['Operations Manager', 'Swosthani Thapa', 'swos@olfndisservices.com.au', 'Kevin Rae Geronimo'],
  ],
  [35, 38, 52, 43]
);

subHeading('Emergency Services');

drawTable(
  ['Service', 'Contact Number'],
  [
    ['Emergency Services (Police, Fire, Ambulance)', '000'],
    ['Poison Information Centre', '13 11 26'],
    ['NDIS Quality & Safeguards Commission', '1800 035 544'],
    ['WorkSafe Victoria', '1800 136 089'],
  ],
  [105, 63]
);

drawCallout('All staff must have emergency contact numbers readily accessible. These numbers should be displayed at each OLF accommodation site and saved in staff mobile phones.', ALERT_BLUE_BORDER, ALERT_BLUE_BG);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: Business Impact Analysis
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(4, 'Business Impact Analysis');

writeBody('The following table identifies OLF\u2019s critical business functions, the maximum tolerable period of disruption (MTPD), the impact of disruption, and the priority level assigned to each function.');

drawTable(
  ['Critical Function', 'Max Downtime', 'Impact if Disrupted', 'Priority'],
  [
    ['24/7 participant support', '0 hours', 'Life-threatening', 'CRITICAL'],
    ['Medication administration', '0 hours', 'Immediate health risk', 'CRITICAL'],
    ['Medical transport (e.g. dialysis)', '0 hours (on scheduled days)', 'Organ failure risk', 'CRITICAL'],
    ['Catheter / wound care', '4 hours', 'Infection risk', 'HIGH'],
    ['Staff rostering', '8 hours', 'Service gaps', 'HIGH'],
    ['Participant records access', '24 hours', 'Care quality risk', 'MEDIUM'],
    ['Payroll & administration', '72 hours', 'No immediate safety impact', 'LOW'],
    ['Training & development', '1 week', 'Compliance risk', 'LOW'],
  ],
  [40, 32, 48, 48]
);

drawCallout('Functions marked CRITICAL have zero tolerance for disruption. If these cannot be maintained, participants must be transferred to hospital or alternative care immediately.', ALERT_RED_BORDER, ALERT_RED_BG);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: Risk Scenarios and Response Plans
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(5, 'Risk Scenarios and Response Plans');

writeBody('The following scenarios represent the most likely disruption events affecting OLF operations. Each scenario includes specific response actions.');

// 5.1
subHeading('5.1 Staff Shortage / Pandemic');

writeBody('A significant reduction in available workforce due to illness, pandemic, or mass resignation.');

writeBullet('Activate backup staff roster and on-call personnel');
writeBullet('Director and General Manager provide direct support if needed');
writeBullet('Contact partner providers for emergency staffing arrangements');
writeBullet('Prioritise critical care tasks over non-essential activities');
writeBullet('Notify Support Coordinators and participant families of any service changes');
writeBullet('If unable to maintain safe staffing levels: arrange emergency hospital admission for affected participants');

// 5.2
subHeading('5.2 Natural Disaster (Fire, Flood, Storm)');

writeBody('An event that renders one or more OLF accommodation sites unsafe or inaccessible.');

writeBullet('Evacuate participants following the Emergency Evacuation Plan (Form82)');
writeBullet('Relocation hierarchy: 1) Family or guardian home, 2) Alternative SIL or respite accommodation, 3) Hospital');
writeBullet('Secure medications, essential equipment, and care plans during evacuation');
writeBullet('Notify emergency services, NDIS Commission, Support Coordinators, and families');
writeBullet('Recovery phase: assess damage, lodge insurance claim, arrange temporary accommodation');

// 5.3
ensureSpace(50);
subHeading('5.3 IT System Failure');

writeBody('Loss of access to digital systems including participant records, rostering, and communication platforms.');

writeBullet('Maintain hard copies of critical documents at each site (medication charts, care plans, emergency contacts)');
writeBullet('Staff continue participant care using physical documentation');
writeBullet('Coordinate via mobile phones and direct communication');
writeBullet('Restore systems from cloud backups as soon as possible');

// 5.4
subHeading('5.4 Key Person Unavailability');

writeBody('Extended absence or sudden unavailability of a senior staff member.');

writeBullet('Succession order: Director \u2192 General Manager \u2192 Operations Manager \u2192 Senior Support Worker');
writeBullet('Documented handover notes maintained by all key personnel');
writeBullet('Critical credentials and access details stored securely with designated backup person');

// 5.5
subHeading('5.5 Utility Failure (Power, Water)');

writeBody('Extended loss of essential utilities at an OLF accommodation site.');

writeBullet('Ensure backup power is available for essential medical equipment');
writeBullet('If utility failure extends beyond 4 hours: relocate participant to an alternative safe site');
writeBullet('Contact utility provider and local council emergency services');

// 5.6
subHeading('5.6 Supply Chain Disruption (Medications, Supplies)');

writeBody('Inability to obtain critical medications or consumable supplies.');

writeBullet('Maintain a minimum 2-week supply buffer of critical medications and consumables at each site');
writeBullet('Alternative pharmacy contacts maintained and reviewed quarterly');
writeBullet('Emergency GP scripts arranged if standard supply chain fails');

// 5.7
subHeading('5.7 Death of a Participant');

writeBody('The death of a participant at an OLF accommodation site or while receiving OLF services.');

writeBullet('Call 000 immediately; do not disturb the scene');
writeBullet('Notify Director and General Manager immediately');
writeBullet('Notify family and emergency contact');
writeBullet('Report to NDIS Quality & Safeguards Commission within 24 hours');
writeBullet('Provide staff support including debriefing and access to Employee Assistance Program (EAP)');
writeBullet('Cooperate fully with Coroner and/or Police as required');
writeBullet('Conduct internal review and update risk register');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: Communication Plan
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(6, 'Communication Plan');

writeBody('During any disruption event, timely and accurate communication with stakeholders is essential. The following table outlines the communication chain.');

drawTable(
  ['Stakeholder', 'Notified By', 'Method', 'Timeframe'],
  [
    ['Participants / families', 'Operations Manager', 'Phone call', 'Immediate'],
    ['All staff', 'General Manager', 'Phone / SMS', 'Within 1 hour'],
    ['NDIS Commission', 'Director', 'Portal + phone', 'Within 24 hours'],
    ['Support Coordinators', 'General Manager', 'Phone + email', 'Within 4 hours'],
    ['Medical team (GP, specialists)', 'On-shift worker', 'Phone', 'Immediate'],
    ['WorkSafe Victoria', 'Director', 'Phone + online portal', 'As per legislation'],
  ],
  [40, 38, 38, 52]
);

drawCallout('The Director is the primary spokesperson for OLF during any disruption event. All external communications (media, government, regulators) must be approved by the Director before release.', ALERT_AMBER_BORDER, ALERT_AMBER_BG);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: Recovery Procedures
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(7, 'Recovery Procedures');

writeBody('Following the resolution of a disruption event, OLF will implement the following recovery procedures to restore full operations and review the incident.');

writeNumberedStep(1, 'Assess the full extent of the disruption and confirm it is safe to resume normal operations');
writeNumberedStep(2, 'Prioritise restoration of critical services (participant care first, administration second)');
writeNumberedStep(3, 'Document all actions taken during the disruption, including decisions, timelines, and outcomes');
writeNumberedStep(4, 'Conduct a post-incident review within 7 days of the event');
writeNumberedStep(5, 'Update this BCP based on lessons learned from the incident');
writeNumberedStep(6, 'Report to NDIS Quality & Safeguards Commission as required');
writeNumberedStep(7, 'Debrief all involved staff and offer wellbeing support');
writeNumberedStep(8, 'Update the organisation\u2019s risk register with any new risks identified');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: Testing and Review
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(8, 'Testing and Review');

writeBody('This Business Continuity Plan must be regularly tested, reviewed, and updated to remain effective. The following schedule outlines the testing and review requirements.');

drawTable(
  ['Activity', 'Frequency', 'Responsible Person'],
  [
    ['Full BCP review and update', 'Annually (or after any activation)', 'General Manager'],
    ['Desktop exercise (tabletop walkthrough)', 'Annually', 'Director + General Manager'],
    ['Emergency contact verification', 'Quarterly', 'Operations Manager'],
    ['Staff BCP awareness training', 'At induction + annual refresher', 'General Manager'],
    ['Emergency drill (fire, evacuation)', '6-monthly', 'Operations Manager'],
    ['Critical supply audit', 'Quarterly', 'Operations Manager'],
  ],
  [56, 52, 60]
);

drawCallout('After any activation of this BCP, a formal review must be completed within 14 days. Review outcomes must be documented and any updates to this plan implemented immediately.', ALERT_GREEN_BORDER, ALERT_GREEN_BG);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: Related Documents
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(9, 'Related Documents');

writeBody('This Business Continuity Plan should be read in conjunction with the following OLF documents:');

writeBullet('Form82 \u2014 Emergency and Disaster Management Plans');
writeBullet('Form81 \u2014 Emergency Drill Reporting Form');
writeBullet('Form01 \u2014 Risk Register');
writeBullet('Form04 \u2014 Incident Report');
writeBullet('Form11 \u2014 Incident Register');
writeBullet('Participant Care Plans (individual)');
writeBullet('NDIS Practice Standards \u2014 Element 15: Continuity of Supports');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: Version Control
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading(10, 'Version Control');

drawTable(
  ['Version', 'Date', 'Author', 'Description'],
  [
    ['1.0', '1 January 2026', 'Kevin Rae Geronimo', 'Initial release'],
  ],
  [22, 35, 48, 63]
);


// ═══════════════════════════════════════════════════════════════════════════════
// STAFF ACKNOWLEDGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

curY += 5;
doc.setFont('helvetica', 'bold');
doc.setFontSize(16);
doc.setTextColor(...OLF_GREEN);
doc.text('Staff Acknowledgement', ML, curY);

curY += 10;
writeBody('By signing below, I acknowledge that I have read, understood, and will comply with the One Life Foundation Business Continuity Plan. I understand my role and responsibilities during disruption events and will follow the procedures outlined in this document.');

curY += 5;

// Signature table (8 rows)
const sigHeaders = ['Staff Name', 'Signature', 'Date'];
const sigColWidths = [56, 56, 56];
const sigRows = [];
for (let i = 0; i < 8; i++) {
  sigRows.push(['', '', '']);
}

const sigTotalW = sigColWidths.reduce((a, b) => a + b, 0);
const sigRowH = 12;
const sigPadding = 3;

// Header
let sx = ML;
doc.setFillColor(...TABLE_HEADER_BG);
doc.rect(sx, curY - 4.5, sigTotalW, 8, 'F');
doc.setDrawColor(...TABLE_BORDER);
doc.setLineWidth(0.3);
doc.rect(sx, curY - 4.5, sigTotalW, 8, 'S');

// Vertical lines in header
let vsx = ML;
for (let ci = 0; ci < sigHeaders.length - 1; ci++) {
  vsx += sigColWidths[ci];
  doc.line(vsx, curY - 4.5, vsx, curY - 4.5 + 8);
}

doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...TABLE_HEADER_TEXT);
sigHeaders.forEach((h, i) => {
  doc.text(h, sx + sigPadding, curY);
  sx += sigColWidths[i];
});
curY += 6;

// Rows
for (let ri = 0; ri < 8; ri++) {
  sx = ML;

  if (ri % 2 === 0) {
    doc.setFillColor(...LIGHT_GREY_BG);
    doc.rect(sx, curY - 4.5, sigTotalW, sigRowH, 'F');
  }

  doc.setDrawColor(...TABLE_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(sx, curY - 4.5, sigTotalW, sigRowH, 'S');

  // Vertical lines
  let vrx = ML;
  for (let ci = 0; ci < sigColWidths.length - 1; ci++) {
    vrx += sigColWidths[ci];
    doc.line(vrx, curY - 4.5, vrx, curY - 4.5 + sigRowH);
  }

  curY += sigRowH;
}

curY += 8;

// End note
doc.setFont('helvetica', 'italic');
doc.setFontSize(9);
doc.setTextColor(...GREY_TEXT);
const endNote = 'This document is the property of One Life Foundation Pty Ltd and is classified as confidential. Unauthorised distribution is prohibited.';
const endLines = doc.splitTextToSize(endNote, CW);
for (const line of endLines) {
  doc.text(line, ML, curY);
  curY += 4.5;
}


// ═══════════════════════════════════════════════════════════════════════════════
// FILL IN TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════════════════

const totalPgs = doc.getNumberOfPages();

doc.setPage(tocPageIdx + 1); // 1-indexed
let tocY = tocStartY;

for (const item of tocEntries) {
  const label = `${item.number}. ${item.text}`;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK_TEXT);
  doc.text(label, ML, tocY);

  const pageStr = String(item.page || '');
  doc.setTextColor(...GREY_TEXT);
  doc.text(pageStr, PAGE_W - MR, tocY, { align: 'right' });

  // Dotted leader line
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

  tocY += 10;
}

// Staff Acknowledgement entry (last content page)
doc.setFontSize(11);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...DARK_TEXT);
doc.text('Staff Acknowledgement', ML, tocY);

const ackPageStr = String(totalPgs);
doc.setTextColor(...GREY_TEXT);
doc.text(ackPageStr, PAGE_W - MR, tocY, { align: 'right' });

const ackLabelW = doc.getTextWidth('Staff Acknowledgement');
const ackPageW = doc.getTextWidth(ackPageStr);
const ackDotStart = ML + ackLabelW + 3;
const ackDotEnd = PAGE_W - MR - ackPageW - 3;
doc.setFontSize(9);
doc.setTextColor(180, 180, 180);
let ackDotX = ackDotStart;
while (ackDotX < ackDotEnd) {
  doc.text('.', ackDotX, tocY);
  ackDotX += 2.2;
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
