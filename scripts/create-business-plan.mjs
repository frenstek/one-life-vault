/**
 * create-business-plan.mjs
 *
 * Generates the One Life Foundation Strategic Business Plan 2026-2028 PDF.
 * Style: Clean & professional (matching Secure Nation Group Business Plan).
 *
 * Usage: node scripts/create-business-plan.mjs
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

const OUTPUT_PATH = 'C:/Users/kevin/Downloads/Form05.Business Plan 2026-2028.pdf';
const STORAGE_PATH = 'Policies and Procedures/Core 2 - Governance & Operations/Form05.Business Plan 2026-2028.pdf';
const BUCKET = 'auditor-portal';

// ─── Colors ──────────────────────────────────────────────────────────────────
const OLF_GREEN = [14, 160, 62];       // #0ea03e
const OLF_BLUE = [48, 158, 221];       // #309edd
const DARK_TEXT = [30, 41, 59];         // #1e293b
const GREY_TEXT = [100, 116, 139];      // #64748b
const LIGHT_GREY_BG = [241, 245, 249]; // #f1f5f9
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
const TABLE_BORDER = [203, 213, 225];  // #cbd5e1
const TABLE_HEADER_BG = [240, 253, 244]; // very light green
const TABLE_HEADER_TEXT = [14, 120, 50]; // darker green for header text

// ─── Page dimensions ─────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 20;     // left margin
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
let pageCount = 0;
let isCoverPage = true;
let isTocPage = false;

// Track section page numbers for TOC
const tocEntries = [];
let currentPageNum = 1;

// ─── Header (small, clean — NOT heavy bar) ───────────────────────────────────
function drawHeader() {
  if (isCoverPage || isTocPage) return;

  // Logo small, left aligned
  try {
    doc.addImage(logoDataUrl, 'PNG', ML, 8, 18, 9);
  } catch (e) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...OLF_GREEN);
    doc.text('OLF', ML, 14);
  }

  // "Business Plan" right-aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('Business Plan', PAGE_W - MR, 14, { align: 'right' });

  // Thin line underneath
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(ML, 20, PAGE_W - MR, 20);
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function drawFooter(pageNum, totalPgs) {
  if (pageNum === 1) return; // no footer on cover

  const footerY = PAGE_H - 12;

  // Page number right aligned
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
  doc.setFontSize(11);
  doc.setTextColor(...DARK_TEXT);
}

function setBold() {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_TEXT);
}

/** Section heading: Large green text, numbered */
function sectionHeading(number, text) {
  ensureSpace(18);
  curY += 10;

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
  ensureSpace(14);
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
  curY += 2.5;
}

/** Write a bullet point */
function writeBullet(text, indent = 6) {
  setBody();
  const bulletX = ML + indent;
  const textX = bulletX + 4;
  const maxW = CW - indent - 4;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 5.2;

  ensureSpace(lines.length * lineH + 2);
  doc.setTextColor(...GREY_TEXT);
  doc.text('\u2022', bulletX, curY);
  doc.setTextColor(...DARK_TEXT);
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], textX, curY);
    curY += lineH;
  }
  curY += 1.2;
}

/** Write a bullet with bold label */
function writeBulletBold(label, desc, indent = 6) {
  const bulletX = ML + indent;
  const textX = bulletX + 4;
  const maxW = CW - indent - 4;
  const lineH = 5.2;

  // Measure full text to get wrapping
  const fullText = `${label} \u2014 ${desc}`;
  const lines = doc.splitTextToSize(fullText, maxW);

  ensureSpace(lines.length * lineH + 2);

  // Bullet
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('\u2022', bulletX, curY);

  // For first line, render bold label + normal desc
  doc.setTextColor(...DARK_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(label, textX, curY);
  const labelW = doc.getTextWidth(label);

  doc.setFont('helvetica', 'normal');
  doc.text(` \u2014 ${desc}`, textX + labelW, curY);

  // Check if single line fits or we need wrap
  const testLines = doc.splitTextToSize(fullText, maxW);
  if (testLines.length === 1) {
    curY += lineH;
  } else {
    // Multiline: render remaining lines as normal text
    curY += lineH;
    for (let i = 1; i < testLines.length; i++) {
      doc.text(testLines[i], textX, curY);
      curY += lineH;
    }
  }
  curY += 1;
}

/** Draw a clean table with thin borders and subtle header */
function drawTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 8;
  const padding = 2.5;
  const fontSize = 8.5;

  // Calculate row heights based on text wrapping
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

  // Header borders
  doc.setDrawColor(...TABLE_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(x, curY - 4.5, totalW, headerH, 'S');

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
  doc.addImage(logoDataUrl, 'PNG', PAGE_W / 2 - 20, 35, 40, 20);
} catch (e) {
  // fallback
}

// Company name
curY = 75;
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
curY += 25;
doc.setFont('helvetica', 'normal');
doc.setFontSize(16);
doc.setTextColor(...DARK_TEXT);
doc.text('Strategic Business Plan 2026\u20132028', PAGE_W / 2, curY, { align: 'center' });

// Horizontal line
curY += 10;
doc.setDrawColor(...OLF_GREEN);
doc.setLineWidth(0.8);
doc.line(ML + 30, curY, PAGE_W - MR - 30, curY);

// Confidential label
curY += 12;
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...OLF_GREEN);
doc.text('Confidential Business Plan', PAGE_W / 2, curY, { align: 'center' });

// Metadata block
curY += 25;
const metaX = ML + 35;
const metaValX = ML + 75;

doc.setFontSize(10);
const metaItems = [
  ['Prepared For:', 'Internal Stakeholders & NDIS Quality Assurance'],
  ['Prepared By:', 'One Life Foundation Pty Ltd'],
  ['Industry:', 'NDIS Disability Support Services'],
  ['Version:', '2026 Strategic Plan'],
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

// Small header for TOC
try {
  doc.addImage(logoDataUrl, 'PNG', ML, 8, 18, 9);
} catch (e) {}
doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...GREY_TEXT);
doc.text('Business Plan', PAGE_W - MR, 14, { align: 'right' });
doc.setDrawColor(200, 200, 200);
doc.setLineWidth(0.3);
doc.line(ML, 20, PAGE_W - MR, 20);

curY = 38;
doc.setFont('helvetica', 'bold');
doc.setFontSize(20);
doc.setTextColor(...OLF_GREEN);
doc.text('Table of Contents', ML, curY);

curY += 15;

// We'll draw TOC entries later after we know page numbers.
// For now, store the TOC Y position and page reference.
const tocStartY = curY;
const tocPageIdx = 1; // 0-indexed page (second page)

// Placeholder — we'll come back and fill this in


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Executive Summary
// ═══════════════════════════════════════════════════════════════════════════════

newPage(); // page 3
sectionHeading(1, 'Executive Summary');

writeBody('One Life Foundation Pty Ltd (OLF) is a Victorian-based NDIS registered provider delivering Supported Independent Living (SIL), community participation, and high-intensity daily personal activities to people with disability. Established in 2024, OLF provides person-centred, culturally sensitive, and clinically informed support services.');

writeBody('OLF operates from its head office in Craigieburn, Victoria, and delivers 24/7 SIL accommodation support. The organisation specialises in supporting participants with complex needs including chronic health conditions, high-intensity clinical care requirements, and participants transitioning from hospital to community living.');

writeBody('This Strategic Business Plan outlines OLF\u2019s strategic direction for 2026\u20132028, including growth objectives, service delivery priorities, workforce development, quality assurance, and financial sustainability. The plan supports OLF\u2019s commitment to continuous improvement and compliance with the NDIS Practice Standards.');

curY += 3;
subHeading('Key Strategic Priorities');

writeBullet('Maintain NDIS registration and achieve full recertification');
writeBullet('Expand SIL accommodation capacity from 1 to 3 properties by end of 2027');
writeBullet('Develop a skilled, compliant workforce through structured training and professional development');
writeBullet('Implement digital quality management systems (One Life Vault) for real-time compliance monitoring');
writeBullet('Build sustainable partnerships with support coordinators, allied health providers, and SDA operators');
writeBullet('Achieve financial sustainability through efficient service delivery and strategic growth');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: Company Overview
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(2, 'Company Overview');

subHeading('About Us');

writeBody('One Life Foundation Pty Ltd was established in 2024 as a specialist NDIS disability support provider in Victoria, Australia. Operating from our head office at 9C Grasslands Avenue, Craigieburn, OLF was founded with the vision of delivering exceptional, person-centred support to individuals with disability who require Supported Independent Living and complex clinical care.');

writeBody('Our culturally diverse and experienced team brings together professionals from healthcare, disability support, and community services backgrounds. OLF\u2019s leadership team combines strategic governance expertise with hands-on operational experience in NDIS service delivery, ensuring both quality care and organisational compliance.');

writeBody('As a growing provider, OLF is uniquely positioned to offer personalised, responsive support that larger organisations often cannot. Our size allows us to build genuine relationships with participants, families, and support coordinators while maintaining the clinical governance framework required for complex care delivery.');

subHeading('NDIS Registration');

drawTable(
  ['Registration Detail', 'Information'],
  [
    ['Registration Status', 'Registered NDIS Provider'],
    ['Registration Groups', '115 (Daily Personal Activities), 120 (Supported Independent Living)'],
    ['Modules', 'Core Module, Module 1 (High Intensity Daily Personal Activities)'],
    ['Certification Body', 'DNV GL'],
    ['ABN', '55 643 227 061'],
    ['Operating State', 'Victoria'],
  ],
  [55, CW - 55]
);

subHeading('Our Services');

writeBulletBold('Supported Independent Living (SIL)', '24/7 care in shared or individual SDA-enrolled accommodation');
writeBulletBold('Community Participation', 'Supported access to social and community activities');
writeBulletBold('High Intensity Daily Personal Activities', 'Complex health support including diabetes management, catheter care, wound monitoring, medication administration, and seizure management');

subHeading('Our Approach');

writeBullet('Person-centred care \u2014 every support plan is tailored to individual goals and preferences');
writeBullet('Culturally responsive practice \u2014 respecting diverse backgrounds and cultural needs');
writeBullet('Trauma-informed support \u2014 creating safe, predictable environments');
writeBullet('Evidence-based clinical care \u2014 following best-practice clinical guidelines');
writeBullet('Family and stakeholder engagement \u2014 collaborative care with all people involved');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: Vision, Mission & Core Values
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(3, 'Vision, Mission & Core Values');

subHeading('Our Vision');

doc.setFont('helvetica', 'bolditalic');
doc.setFontSize(11);
doc.setTextColor(...OLF_GREEN);
const visionText = '\u201CEmpowering individuals with disability to live fulfilling, independent lives through exceptional care and community connection.\u201D';
const visionLines = doc.splitTextToSize(visionText, CW - 10);
for (const line of visionLines) {
  ensureSpace(6);
  doc.text(line, ML + 5, curY);
  curY += 6;
}
curY += 5;

subHeading('Our Mission');

doc.setFont('helvetica', 'bolditalic');
doc.setFontSize(11);
doc.setTextColor(...OLF_GREEN);
const missionText = '\u201CTo deliver high-quality, person-centred NDIS support services that promote independence, dignity, and wellbeing for every participant.\u201D';
const missionLines = doc.splitTextToSize(missionText, CW - 10);
for (const line of missionLines) {
  ensureSpace(6);
  doc.text(line, ML + 5, curY);
  curY += 6;
}
curY += 5;

subHeading('Core Values');

writeBody('Our core values underpin every decision, interaction, and service we deliver. These values are embedded in our policies, staff training, and performance management framework.');

writeBulletBold('Dignity & Respect', 'Honouring each person\u2019s choices, culture, and identity. We recognise that every participant is an individual with unique preferences, goals, and lived experiences. Our support workers are trained to promote autonomy and self-determination in all interactions.');
writeBulletBold('Excellence', 'Commitment to the highest standards of care and service delivery. We continuously review and improve our practices, invest in staff development, and benchmark against industry best practices to ensure exceptional outcomes.');
writeBulletBold('Integrity', 'Honest, transparent, and ethical in everything we do. We maintain open communication with participants, families, and stakeholders, and hold ourselves to the highest standards of professional conduct.');
writeBulletBold('Inclusion', 'Creating environments where every person belongs. We celebrate diversity and ensure our services are accessible, culturally safe, and responsive to the needs of all participants regardless of background.');
writeBulletBold('Compassion', 'Caring deeply about participant outcomes and wellbeing. Our team is motivated by a genuine desire to make a positive difference in the lives of the people we support.');
writeBulletBold('Accountability', 'Taking responsibility for our actions and outcomes. We maintain transparent governance, robust quality systems, and clear lines of accountability at every level of the organisation.');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: Organisational Structure & Leadership
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(4, 'Organisational Structure & Leadership');

subHeading('Management Team');

writeBody('OLF\u2019s leadership team provides a blend of strategic governance, operational expertise, and frontline disability support experience. The lean management structure enables rapid decision-making and direct accountability for participant outcomes.');

drawTable(
  ['Role', 'Name', 'Responsibilities'],
  [
    ['Director', 'Harsimran Singh', 'Strategic oversight, governance, stakeholder relationships, financial management'],
    ['General Manager', 'Kevin Rae Geronimo', 'Day-to-day operations, compliance, IT systems, staff management, quality assurance'],
    ['Operations Manager', 'Swosthani Thapa', 'Rostering, participant care coordination, SIL house operations, incident response'],
    ['HR / Administration', 'Marrion Isabel Ramos', 'Human resources, onboarding, payroll, administration, records management'],
  ],
  [30, 35, CW - 65]
);

subHeading('Workforce Profile');

drawTable(
  ['Category', 'Details'],
  [
    ['Total Staff', '10 team members'],
    ['Employment Types', '3 full-time employees, 2 casual employees, 5 contractors'],
    ['Key Roles', 'Director, General Manager, Operations Manager, HR/Admin, Disability Support Workers'],
    ['Screening', 'All staff hold NDIS Worker Screening clearance'],
    ['Mandatory Training', 'First Aid, CPR, Manual Handling, Medication Administration, NDIS Orientation Module'],
  ],
  [40, CW - 40]
);

writeBody('OLF maintains a mixed workforce model with core permanent staff supplemented by experienced contractors. This approach provides operational flexibility during the growth phase while ensuring consistent quality of care through standardised training and competency frameworks.');

subHeading('Staff Development');

writeBody('OLF is committed to developing a highly skilled and compliant workforce through:');

writeBullet('Structured onboarding program for all new staff, including NDIS orientation and OLF-specific training');
writeBullet('Annual competency assessments for all support workers, with additional clinical competencies for high-intensity roles');
writeBullet('Regular professional development opportunities including external training, workshops, and industry conferences');
writeBullet('Performance review framework with six-monthly formal reviews and ongoing informal feedback');
writeBullet('Supervision and support structures including buddy systems for new staff and regular team meetings');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: Services Overview
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(5, 'Services Overview');

subHeading('Supported Independent Living (SIL)');

writeBody('SIL is OLF\u2019s core service offering, providing 24/7 support in SDA-enrolled accommodation for participants with significant disability support needs. Our SIL service model encompasses:');

writeBullet('Personal care assistance including hygiene, dressing, and grooming support');
writeBullet('Meal preparation and nutrition management');
writeBullet('Medication support and administration');
writeBullet('Community access and social participation');
writeBullet('Active overnight support for participants with complex needs');
writeBullet('Support ratios determined by individual NDIS plans (1:1 to 1:3)');
writeBullet('Individualised support plans developed in collaboration with participants, families, and allied health professionals');

subHeading('High Intensity Daily Personal Activities');

writeBody('OLF specialises in delivering high-intensity clinical supports that require specific staff competencies and clinical governance. Our high-intensity services include:');

writeBullet('Diabetes management \u2014 blood glucose level monitoring, insulin administration');
writeBullet('Catheter care \u2014 suprapubic catheter management and maintenance');
writeBullet('Wound monitoring and pressure injury prevention');
writeBullet('Complex medication management, including Schedule 8 medications');
writeBullet('Seizure management and emergency response');
writeBullet('Enteral feeding support');

writeBody('All staff delivering high-intensity supports are required to complete specific competency assessments for each support type, verified by qualified health professionals.');

subHeading('Community Participation');

writeBody('OLF supports participants to engage meaningfully with their community through:');

writeBullet('Supported access to community activities, social events, and recreational programs');
writeBullet('Skills development for daily living and independence');
writeBullet('Transport to medical appointments including haemodialysis');
writeBullet('Building social connections and community networks');
writeBullet('Goal-oriented support aligned with NDIS plan objectives');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: Market Analysis
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(6, 'Market Analysis');

subHeading('Industry Overview');

writeBody('The National Disability Insurance Scheme (NDIS) supports over 600,000 participants nationally and continues to grow. Supported Independent Living is one of the highest-value support categories within the NDIS, with demand consistently outpacing supply, particularly for participants with complex care needs.');

writeBody('The disability support sector is undergoing significant transformation driven by the NDIS Quality and Safeguards Commission\u2019s increased regulatory oversight, participant expectations for higher-quality services, and a national workforce shortage in the care sector. These factors create both challenges and opportunities for specialist providers like OLF.');

subHeading('Victorian Market');

writeBullet('Growing demand for SIL services in northern Melbourne suburbs, particularly Hume and Whittlesea LGAs');
writeBullet('Limited providers specialising in high-intensity clinical support for complex health needs');
writeBullet('Increasing number of participants transitioning from hospital and aged care into community-based SIL');
writeBullet('Strong demand for culturally responsive providers serving multicultural communities');
writeBullet('Support coordinator networks actively seeking reliable, quality-focused SIL providers');

subHeading('Target Market');

writeBullet('Adults with physical disability requiring 24/7 Supported Independent Living');
writeBullet('Participants with complex health and medical needs (diabetes, renal failure, neurological conditions)');
writeBullet('Participants transitioning from hospital to community living');
writeBullet('Participants requiring high-intensity clinical daily support under NDIS Module 1');

subHeading('Competitive Advantages');

writeBulletBold('Clinical Specialisation', 'Focus on complex health and clinical care, not just standard SIL support');
writeBulletBold('Digital Quality Management', 'One Life Vault platform for real-time compliance monitoring and document management');
writeBulletBold('Cultural Diversity', 'Multilingual team with deep understanding of culturally responsive practice');
writeBulletBold('Clinical Governance', 'Robust framework for high-intensity support delivery and risk management');
writeBulletBold('Personalised Service', 'Small provider model enabling responsive, relationship-based care');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: Strategic Objectives 2026–2028
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(7, 'Strategic Objectives 2026\u20132028');

writeBody('The following strategic objectives guide OLF\u2019s growth and development over the 2026\u20132028 planning period. Each objective is linked to measurable key performance indicators and defined timelines.');

curY += 3;

drawTable(
  ['#', 'Objective', 'Target', 'Timeline', 'KPI'],
  [
    ['1', 'NDIS Recertification', 'Maintain full NDIS registration', 'Ongoing', 'Zero non-conformances at audit'],
    ['2', 'Service Expansion', 'Increase SIL properties from 1 to 3', 'By Dec 2027', '3 operational SIL houses'],
    ['3', 'Participant Growth', 'Increase active participants from 1 to 8', 'By Dec 2028', '8 active participants'],
    ['4', 'Workforce Development', 'Build team from 10 to 25 staff', 'By Dec 2028', '100% training compliance'],
    ['5', 'Digital Systems', 'Full implementation of One Life Vault QMS', 'By Jun 2026', 'All staff using platform'],
    ['6', 'Financial Sustainability', 'Achieve break-even by Q2 2027', 'By Jun 2027', 'Positive cash flow'],
    ['7', 'Quality & Safety', 'Maintain zero reportable incidents', 'Ongoing', 'Zero abuse/neglect incidents'],
    ['8', 'Stakeholder Relationships', 'Establish partnerships with 10+ support coordinators', 'By Dec 2027', '10+ active referral partners'],
  ],
  [8, 32, 40, 25, CW - 105]
);

subHeading('Strategic Priority Detail');

writeBody('Service Expansion: OLF\u2019s growth strategy is centred on expanding SIL accommodation capacity in the northern Melbourne corridor. The organisation will target SDA-enrolled properties in the Hume, Whittlesea, and Moreland local government areas, partnering with SDA investors and property providers to secure appropriate accommodation for participants with complex needs.');

writeBody('Workforce Development: Building a skilled, stable workforce is critical to OLF\u2019s growth. The organisation will invest in recruitment, retention, and training initiatives including competitive remuneration under the SCHADS Award, structured career pathways, and ongoing professional development. A targeted recruitment strategy will focus on attracting experienced disability support workers and clinical staff.');

writeBody('Digital Transformation: The One Life Vault quality management system represents a significant competitive advantage for OLF. Full implementation will enable real-time compliance monitoring, automated policy review reminders, digital incident reporting, and seamless audit preparation. This investment in technology will reduce administrative burden and improve the quality of participant care.');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: Quality & Compliance
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(8, 'Quality & Compliance');

writeBody('Quality and compliance are foundational to OLF\u2019s operations. The organisation maintains a comprehensive quality management system aligned with the NDIS Practice Standards and the NDIS Quality and Safeguards Commission requirements.');

subHeading('Compliance Framework');

writeBullet('Full compliance with NDIS Practice Standards across Core Module, Module 1 (High Intensity), and Module 2A (Behaviour Support implemented by others)');
writeBullet('Internal audit schedule conducted annually with corrective action tracking');
writeBullet('Continuous improvement framework (Form03 Feedback Register, Form59 Continuous Improvement Register)');
writeBullet('Policy review cycle \u2014 all policies and procedures reviewed annually or following significant changes');
writeBullet('Staff training and competency framework with documented evidence of completion');

subHeading('Incident & Risk Management');

writeBullet('Incident management and reporting system aligned with NDIS Commission requirements');
writeBullet('Mandatory reporting of reportable incidents within required timeframes');
writeBullet('Complaints and feedback management process with accessible complaint pathways');
writeBullet('Comprehensive risk management framework covering operational, clinical, and strategic risks');

subHeading('Digital Quality Assurance');

writeBody('OLF has invested in the development of One Life Vault, a purpose-built digital quality management system that provides:');

writeBullet('Centralised document management for policies, procedures, and participant records');
writeBullet('Real-time compliance monitoring and audit readiness dashboards');
writeBullet('Staff training tracking and competency verification');
writeBullet('Incident reporting and continuous improvement tracking');
writeBullet('Secure, cloud-based storage with role-based access controls');
writeBullet('Auditor portal for external audit access to controlled documentation');

subHeading('External Oversight');

writeBody('OLF operates under the regulatory oversight of the NDIS Quality and Safeguards Commission and maintains its registration through the DNV GL certification body. The organisation proactively engages with regulatory requirements and welcomes external scrutiny as an opportunity to demonstrate the quality of its services.');

writeBody('OLF\u2019s quality framework includes scheduled external audits, unannounced compliance checks, and regular engagement with the Commission\u2019s expectations. The organisation maintains a dedicated auditor portal through One Life Vault, providing certification auditors with secure, real-time access to all controlled documents, policies, and evidence of compliance.');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: Financial Overview
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(9, 'Financial Overview');

writeBody('OLF\u2019s financial model is built on sustainable NDIS plan funding across our three registered support categories. As a growth-phase organisation, OLF is focused on building service capacity while maintaining strict financial discipline.');

subHeading('Revenue Model');

writeBody('Revenue is generated through NDIS plan funding for:');

writeBullet('Supported Independent Living (SIL) \u2014 primary revenue stream, 24/7 support billing');
writeBullet('High Intensity Daily Personal Activities \u2014 premium rate clinical supports');
writeBullet('Community Participation \u2014 hourly support for community access activities');

subHeading('Revenue Projections');

drawTable(
  ['Financial Year', 'Projected Revenue', 'Participants', 'SIL Properties', 'Key Milestones'],
  [
    ['2026', '$600,000', '1', '1', 'Building capacity, staff recruitment, systems implementation'],
    ['2027', '$1,800,000', '4', '2', 'Second SIL property, break-even target achieved Q2'],
    ['2028', '$3,500,000', '8', '3', 'Full scale operations, financial sustainability achieved'],
  ],
  [25, 28, 22, 22, CW - 97]
);

subHeading('Key Cost Drivers');

writeBullet('Staff wages and on-costs (SCHADS Award) \u2014 approximately 70% of total costs');
writeBullet('SDA accommodation costs and property expenses');
writeBullet('Insurance portfolio (professional indemnity, public liability, workers compensation)');
writeBullet('Administrative overhead including IT systems, compliance, and professional services');

subHeading('Financial Strategies');

writeBullet('Efficient rostering to optimise support ratios and reduce unnecessary staffing costs');
writeBullet('Contractor model for operational flexibility during growth phase');
writeBullet('Technology investment to reduce administrative overhead and improve compliance efficiency');
writeBullet('Comprehensive insurance portfolio maintained across all risk categories');
writeBullet('Regular financial reporting and budget reviews to maintain fiscal discipline');

subHeading('Investment Priorities');

writeBody('OLF\u2019s capital investment strategy for 2026\u20132028 focuses on three key areas:');

writeBullet('Technology and Systems \u2014 continued development of One Life Vault, staff rostering software, and clinical documentation tools to improve operational efficiency');
writeBullet('Workforce Capability \u2014 investment in staff training, recruitment, and retention programs to build a high-quality workforce capable of delivering complex care');
writeBullet('Service Infrastructure \u2014 SIL property fit-out, vehicle procurement for community access, and equipment for participant care delivery');

writeBody('Financial performance will be reviewed monthly by the General Manager and quarterly by the Director, with formal financial reports presented to stakeholders at each review period.');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: Risk Management
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(10, 'Risk Management');

writeBody('OLF maintains a proactive risk management approach that identifies, assesses, and mitigates key business risks. The risk management framework is integrated into daily operations and reviewed regularly by the leadership team.');

curY += 3;

drawTable(
  ['Risk', 'Likelihood', 'Impact', 'Mitigation Strategy'],
  [
    ['Workforce shortage', 'High', 'High', 'Active recruitment pipeline, competitive wages under SCHADS Award, established contractor network, staff retention initiatives'],
    ['Participant health emergency', 'Medium', 'Critical', 'Clinical governance framework, mandatory staff training, emergency response protocols, allied health partnerships'],
    ['NDIS funding changes', 'Medium', 'High', 'Diversified service mix across three registration groups, financial reserves, proactive engagement with NDIS pricing reviews'],
    ['Regulatory non-compliance', 'Low', 'Critical', 'Digital QMS (One Life Vault), internal audits, comprehensive policy framework, ongoing staff compliance training'],
    ['Reputational damage', 'Low', 'High', 'Quality service delivery, accessible complaints management, proactive incident management, stakeholder communication'],
    ['IT system failure', 'Low', 'Medium', 'Cloud-based systems (Supabase/Vercel), data backup procedures, business continuity plan, redundant communication channels'],
  ],
  [30, 22, 18, CW - 70]
);

writeBody('Risk assessments are conducted quarterly and following any significant incident or change in operating environment. The risk register is maintained by the General Manager and reviewed by the Director.');

subHeading('Business Continuity');

writeBody('OLF maintains a comprehensive Business Continuity Plan (BCP) that addresses service continuity during disruption events including natural disasters, pandemics, IT system failures, and key personnel unavailability. The BCP is reviewed annually and tested through desktop exercises.');

writeBody('Key continuity measures include backup communication systems, emergency rostering protocols, participant safety procedures during evacuations, and data recovery plans for critical IT systems. All staff are trained in emergency response procedures and understand their roles during disruption events.');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11: Implementation Roadmap
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(11, 'Implementation Roadmap');

writeBody('The following phased roadmap outlines the key milestones and activities for implementing this Strategic Business Plan over the 2026\u20132028 period.');

curY += 3;

subHeading('Phase 1: Foundation (January \u2013 June 2026)');
writeBullet('Complete NDIS recertification audit (DNV GL)');
writeBullet('Full deployment of One Life Vault digital quality management system');
writeBullet('Comprehensive policy and procedure framework established');
writeBullet('First SIL participant settled and receiving 24/7 support');
writeBullet('Staff induction and mandatory training program completed');
writeBullet('Clinical governance framework operational');

subHeading('Phase 2: Stabilisation (July \u2013 December 2026)');
writeBullet('All staff training and competency assessments completed');
writeBullet('Second participant intake commenced');
writeBullet('Quality systems fully operational with continuous improvement tracking');
writeBullet('Support coordinator relationship-building program launched');
writeBullet('First internal audit cycle completed');

subHeading('Phase 3: Growth (January \u2013 June 2027)');
writeBullet('Second SIL property secured and operational');
writeBullet('Workforce expanded to 15\u201318 staff');
writeBullet('Active partnerships with 5+ support coordinators');
writeBullet('Break-even financial target achieved');
writeBullet('Allied health referral network established');

subHeading('Phase 4: Scale (July 2027 \u2013 December 2028)');
writeBullet('Third SIL property secured and operational');
writeBullet('8 active participants across three properties');
writeBullet('Team of 25 staff (mix of permanent and contractors)');
writeBullet('Financial sustainability achieved');
writeBullet('10+ active support coordinator referral relationships');
writeBullet('Established reputation as specialist SIL/complex care provider in northern Melbourne');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12: Conclusion
// ═══════════════════════════════════════════════════════════════════════════════

newPage();
sectionHeading(12, 'Conclusion');

writeBody('One Life Foundation is positioned for sustainable growth as a specialist NDIS provider in Victoria. Our focus on high-quality, person-centred care for participants with complex needs, combined with robust clinical governance and innovative digital systems, provides a strong foundation for the 2026\u20132028 strategic period.');

writeBody('This Business Plan reflects OLF\u2019s commitment to continuous improvement, regulatory compliance, and above all, exceptional outcomes for the people we support. By executing on the strategic objectives and implementation roadmap outlined in this plan, OLF will establish itself as a trusted, quality-focused provider in the northern Melbourne SIL market.');

writeBody('The leadership team is committed to regular review of this plan to ensure OLF remains responsive to participant needs, market conditions, and regulatory requirements. Progress against strategic objectives will be reported quarterly and the plan will be formally reviewed annually.');

writeBody('OLF\u2019s competitive strengths \u2014 clinical specialisation, digital quality management, cultural diversity, and personalised service \u2014 position the organisation well to capture growing demand in the northern Melbourne SIL market. With disciplined execution and unwavering commitment to participant outcomes, OLF will achieve its vision of empowering individuals with disability to live fulfilling, independent lives.');

subHeading('Acknowledgements');

writeBody('This Business Plan was developed with input from OLF\u2019s leadership team and reflects the collective vision for the organisation\u2019s future. OLF acknowledges the NDIS Quality and Safeguards Commission, DNV GL, and our network of support coordinators and allied health partners whose collaboration strengthens our service delivery.');

curY += 10;

// Version table
subHeading('Document Control');

drawTable(
  ['Version', 'Date', 'Author', 'Description'],
  [
    ['1.0', '1 January 2026', 'Kevin Rae Geronimo', 'Initial release'],
  ],
  [20, 30, 45, CW - 95]
);

curY += 10;

// End mark
doc.setFont('helvetica', 'italic');
doc.setFontSize(9);
doc.setTextColor(...GREY_TEXT);
doc.text('\u2014 End of Document \u2014', PAGE_W / 2, curY, { align: 'center' });


// ═══════════════════════════════════════════════════════════════════════════════
// NOW GO BACK AND FILL IN THE TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════════════════

const totalPgs = doc.getNumberOfPages();

// Draw TOC on page 2
doc.setPage(2);
let tocY = tocStartY;

const tocItems = [
  { num: '1', title: 'Executive Summary', page: null },
  { num: '2', title: 'Company Overview', page: null },
  { num: '3', title: 'Vision, Mission & Core Values', page: null },
  { num: '4', title: 'Organisational Structure & Leadership', page: null },
  { num: '5', title: 'Services Overview', page: null },
  { num: '6', title: 'Market Analysis', page: null },
  { num: '7', title: 'Strategic Objectives 2026\u20132028', page: null },
  { num: '8', title: 'Quality & Compliance', page: null },
  { num: '9', title: 'Financial Overview', page: null },
  { num: '10', title: 'Risk Management', page: null },
  { num: '11', title: 'Implementation Roadmap', page: null },
  { num: '12', title: 'Conclusion', page: null },
];

// Match TOC items with recorded entries
for (const item of tocItems) {
  const entry = tocEntries.find(e => String(e.number) === item.num);
  if (entry) item.page = entry.page;
}

for (const item of tocItems) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_TEXT);

  const label = `${item.num}.  ${item.title}`;
  doc.text(label, ML, tocY);

  // Page number right-aligned
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

// ═══════════════════════════════════════════════════════════════════════════════
// ADD FOOTERS TO ALL PAGES
// ═══════════════════════════════════════════════════════════════════════════════

for (let i = 1; i <= totalPgs; i++) {
  doc.setPage(i);
  drawFooter(i, totalPgs);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════════════════════

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

// Save to Downloads
fs.writeFileSync(OUTPUT_PATH, pdfBuffer);
console.log(`\u2705 Saved PDF to: ${OUTPUT_PATH}`);
console.log(`   Pages: ${totalPgs}`);
console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

// Upload to Supabase
const { error } = await sb.storage.from(BUCKET).upload(STORAGE_PATH, pdfBuffer, {
  contentType: 'application/pdf',
  upsert: true,
});

if (error) {
  console.error('\u274c Supabase upload failed:', error.message);
  process.exit(1);
} else {
  console.log(`\u2705 Uploaded to Supabase: ${BUCKET}/${STORAGE_PATH}`);
}
