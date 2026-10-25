/**
 * create-bcp.mjs
 *
 * Generates the One Life Foundation Business Continuity Plan (Form103) PDF.
 * Saves to Downloads and uploads to Supabase Storage.
 *
 * Usage: node scripts/create-bcp.mjs
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
const BLUE = [30, 90, 138];       // #1E5A8A
const WHITE = [255, 255, 255];
const DARK_TEXT = [30, 41, 59];    // #1E293B
const DARK_GREY = [51, 51, 51];
const MED_GREY = [102, 102, 102];
const LIGHT_GREY = [240, 240, 240];
const TABLE_HEADER_BG = [30, 90, 138];
const TABLE_ALT_ROW = [248, 249, 250];
const ALERT_BG = [254, 242, 242];
const ALERT_BORDER = [220, 38, 38];
const INFO_BG = [239, 246, 255];
const INFO_BORDER = [59, 130, 246];
const AMBER_BG = [255, 251, 235];
const AMBER_BORDER = [217, 119, 6];

// ─── Page dimensions ─────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 18;     // left margin
const MR = 18;     // right margin
const MARGIN_T = 45; // top margin below header
const MARGIN_B = 22; // bottom margin above footer
const CW = PAGE_W - ML - MR; // content width

// ─── Logo ────────────────────────────────────────────────────────────────────
const logoPath = path.join(PROJECT, 'public', 'logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUrl = 'data:image/png;base64,' + logoBase64;

// ─── Document ────────────────────────────────────────────────────────────────
const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
let curY = MARGIN_T;
let totalPages = 0;

// ─── Header ──────────────────────────────────────────────────────────────────
function drawHeader() {
  // Blue banner full width, 22mm height
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PAGE_W, 22, 'F');

  // Logo
  try {
    doc.addImage(logoDataUrl, 'PNG', 15, 4, 28, 14);
  } catch (e) {
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('OLF', 15, 12);
  }

  // "One Life Foundation" white bold 14pt
  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('One Life Foundation', 46, 10);

  // ABN line
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('ABN: 55 643 227 061  |  NDIS Registered Provider', 46, 15);

  // Category on right side
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Policy & Procedure', PAGE_W - MR, 9, { align: 'right' });
  doc.setFontSize(8);
  doc.text('Business Continuity', PAGE_W - MR, 14, { align: 'right' });

  // Grey metadata row below banner
  doc.setFillColor(...LIGHT_GREY);
  doc.rect(0, 22, PAGE_W, 10, 'F');

  const metaY = 28.5;
  const metaItems = [
    { label: 'DOC NO:', value: 'Form103' },
    { label: 'VERSION:', value: '1.0' },
    { label: 'EFFECTIVE DATE:', value: '1 January 2026' },
    { label: 'REVIEW DATE:', value: '1 January 2027' },
  ];

  const colW = CW / 4;
  doc.setFontSize(7);
  metaItems.forEach((item, i) => {
    const x = ML + (i * colW);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MED_GREY);
    doc.text(item.label, x, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GREY);
    doc.text(' ' + item.value, x + doc.getTextWidth(item.label), metaY);
  });

  // Thin line below metadata
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(0, 32, PAGE_W, 32);
}

// ─── Footer (applied at end) ─────────────────────────────────────────────────
function drawFooter(pageNum, totalPgs) {
  const footerY = PAGE_H - 10;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(ML, footerY - 3, PAGE_W - MR, footerY - 3);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MED_GREY);

  doc.text('One Life Foundation Pty Ltd  |  ABN: 55 643 227 061  |  9C Grasslands Avenue, Craigieburn VIC 3064', ML, footerY);
  doc.text('Copyright One Life Foundation 2026', PAGE_W / 2, footerY + 4, { align: 'center' });
  doc.text(`Page ${pageNum} of ${totalPgs}`, PAGE_W - MR, footerY, { align: 'right' });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function setBody() {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_TEXT);
}

function setBold() {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_TEXT);
}

/** Section heading: bold 13pt blue with underline */
function sectionHeading(text) {
  ensureSpace(16);
  curY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BLUE);
  doc.text(text, ML, curY);

  const tw = doc.getTextWidth(text);
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.5);
  doc.line(ML, curY + 1.5, ML + tw, curY + 1.5);
  curY += 8;
}

/** Sub-heading: bold 11pt, 6mm before */
function subHeading(text) {
  ensureSpace(12);
  curY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_TEXT);
  doc.text(text, ML, curY);
  curY += 6;
}

/** Write wrapped body text, returns new Y */
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
  return curY;
}

/** Write a bullet point */
function writeBullet(text, indent = 8) {
  setBody();
  const bulletX = ML + indent;
  const textX = bulletX + 4;
  const maxW = CW - indent - 4;
  const lines = doc.splitTextToSize(text, maxW);
  const lineH = 5;

  ensureSpace(lines.length * lineH + 2);
  doc.text('\u2022', bulletX, curY);
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], textX, curY);
    curY += lineH;
  }
  curY += 0.5;
}

/** Draw a table with blue header row and alternating grey rows */
function drawTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 7;
  const padding = 2;
  const fontSize = 7.5;

  // Calculate row heights based on text wrapping
  function calcRowH(cells) {
    let maxLines = 1;
    doc.setFontSize(fontSize);
    cells.forEach((cell, i) => {
      const lines = doc.splitTextToSize(String(cell), colWidths[i] - padding * 2);
      if (lines.length > maxLines) maxLines = lines.length;
    });
    return Math.max(rowH, maxLines * 4 + 3);
  }

  // Header row
  ensureSpace(rowH + 5);
  let x = ML;
  const headerH = calcRowH(headers);

  // Header background
  doc.setFillColor(...TABLE_HEADER_BG);
  doc.rect(x, curY - 4, totalW, headerH, 'F');

  // Header text
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);

  headers.forEach((h, i) => {
    const lines = doc.splitTextToSize(String(h), colWidths[i] - padding * 2);
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
    if (ri % 2 === 1) {
      doc.setFillColor(...TABLE_ALT_ROW);
      doc.rect(x, curY - 4, totalW, rH, 'F');
    }

    // Cell borders
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    let bx = ML;
    for (let ci = 0; ci <= row.length; ci++) {
      doc.line(bx, curY - 4, bx, curY - 4 + rH);
      bx += (colWidths[ci] || 0);
    }
    doc.line(ML, curY - 4, ML + totalW, curY - 4);
    doc.line(ML, curY - 4 + rH, ML + totalW, curY - 4 + rH);

    // Cell text
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);

    row.forEach((cell, ci) => {
      const cellText = String(cell);
      const lines = doc.splitTextToSize(cellText, colWidths[ci] - padding * 2);
      lines.forEach((line, li) => {
        doc.text(line, x + padding, curY + (li * 4));
      });
      x += colWidths[ci];
    });

    curY += rH - 2;
  });

  curY += 4;
}

/** Draw a callout / alert box */
function drawCallout(type, title, bodyLines) {
  let bgColor, borderColor;
  if (type === 'alert') {
    bgColor = ALERT_BG;
    borderColor = ALERT_BORDER;
  } else if (type === 'info') {
    bgColor = INFO_BG;
    borderColor = INFO_BORDER;
  } else {
    bgColor = AMBER_BG;
    borderColor = AMBER_BORDER;
  }

  // Estimate height
  doc.setFontSize(8.5);
  let totalLines = 0;
  if (title) totalLines += doc.splitTextToSize(title, CW - 12).length;
  for (const line of bodyLines) {
    totalLines += doc.splitTextToSize(line, CW - 12).length;
  }
  const boxH = totalLines * 4.5 + 8;

  ensureSpace(boxH + 4);

  // Background
  doc.setFillColor(...bgColor);
  doc.roundedRect(ML, curY - 2, CW, boxH, 1.5, 1.5, 'F');

  // Left border accent
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(1.2);
  doc.line(ML, curY - 2, ML, curY - 2 + boxH);

  // Title
  if (title) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...borderColor);
    const titleLines = doc.splitTextToSize(title, CW - 12);
    for (const tl of titleLines) {
      doc.text(tl, ML + 5, curY + 2);
      curY += 4.5;
    }
    curY += 1;
  }

  // Body
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK_TEXT);
  for (const bl of bodyLines) {
    const bLines = doc.splitTextToSize(bl, CW - 12);
    for (const line of bLines) {
      doc.text(line, ML + 5, curY + 2);
      curY += 4.5;
    }
  }

  curY += 4;
}


// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1: COVER / METADATA
// ═══════════════════════════════════════════════════════════════════════════════

drawHeader();
curY = MARGIN_T + 5;

// Title
doc.setFont('helvetica', 'bold');
doc.setFontSize(22);
doc.setTextColor(...BLUE);
doc.text('Business Continuity Plan', PAGE_W / 2, curY, { align: 'center' });
curY += 12;

// Subtitle
doc.setFont('helvetica', 'normal');
doc.setFontSize(11);
doc.setTextColor(...MED_GREY);
const subtitle = 'Ensuring continuity of NDIS supports and participant safety during disruption events';
const subLines = doc.splitTextToSize(subtitle, CW - 20);
for (const sl of subLines) {
  doc.text(sl, PAGE_W / 2, curY, { align: 'center' });
  curY += 6;
}
curY += 6;

// Decorative line
doc.setDrawColor(...BLUE);
doc.setLineWidth(0.8);
doc.line(ML + 30, curY, PAGE_W - MR - 30, curY);
curY += 12;

// Metadata table
drawTable(
  ['Field', 'Details'],
  [
    ['Document Owner', 'Kevin Rae Geronimo, General Manager'],
    ['Approved By', 'Harsimran Singh, Director'],
    ['Applies To', 'All OLF staff, contractors, and operations'],
    ['Related Standards', 'NDIS Practice Standards Element 15 (Continuity of Supports), ISO 22301'],
    ['Classification', 'Confidential \u2014 Internal Use Only'],
  ],
  [50, CW - 50]
);

curY += 8;

// Organisation details box
drawCallout('info', 'Organisation Overview', [
  'One Life Foundation Pty Ltd (ABN: 55 643 227 061)',
  'Head Office: 9C Grasslands Avenue, Craigieburn VIC 3064',
  'SIL Accommodation: 59 Severn Street, Epping VIC 3076',
  'NDIS Registered Provider \u2014 SIL, Community Participation, High Intensity Daily Personal Activities',
  'Director: Harsimran Singh  |  General Manager: Kevin Rae Geronimo  |  Operations Manager: Swosthani Thapa',
]);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: PURPOSE
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeading('1. Purpose');

writeBody('This Business Continuity Plan (BCP) establishes the framework for One Life Foundation Pty Ltd (OLF) to maintain critical NDIS support services during disruption events. It ensures participant safety, continuity of care, and organisational resilience.');
curY += 3;
writeBody('OLF provides 24/7 Supported Independent Living (SIL) to participants with complex medical needs. Any disruption to services poses a direct risk to participant health and safety. This plan outlines the strategies, procedures, and responsibilities necessary to:');
curY += 2;
writeBullet('Identify and assess potential threats to service continuity');
writeBullet('Establish clear response procedures for various disruption scenarios');
writeBullet('Protect the health, safety, and wellbeing of participants at all times');
writeBullet('Maintain compliance with NDIS Practice Standards (Element 15: Continuity of Supports)');
writeBullet('Enable rapid recovery and restoration of normal operations');
writeBullet('Ensure all staff understand their roles and responsibilities during a disruption event');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: SCOPE
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading('2. Scope');

writeBody('This BCP applies to all OLF operations, sites, services, and personnel, including:');
curY += 2;

writeBullet('Head Office: 9C Grasslands Avenue, Craigieburn VIC 3064');
writeBullet('SIL Accommodation: 59 Severn Street, Epping VIC 3076');
writeBullet('All staff (full-time employees, casual employees, and independent contractors)');
writeBullet('All participants and their support networks');
writeBullet('Critical third-party services (dialysis transport, pharmacy, medical teams)');
writeBullet('IT systems (One Life Vault document management, communication platforms)');
writeBullet('Administrative and financial operations');

curY += 3;
drawCallout('amber', 'Current Operations Scope', [
  'OLF currently supports 1 active participant (John Eric Ross) requiring 24/7 SIL support with complex medical needs',
  'including wheelchair dependency, haemodialysis 3x/week, diabetes management (insulin-dependent), catheter care, and',
  'wound monitoring. Staff complement: 10 active (5 contractors, 3 full-time, 2 casual).',
]);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: KEY PERSONNEL AND CONTACTS
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading('3. Key Personnel and Emergency Contacts');

subHeading('3.1 OLF Management Team');

drawTable(
  ['Role', 'Name', 'Email', 'Backup'],
  [
    ['Director', 'Harsimran Singh', 'harrychattha1313@gmail.com', 'Kevin Rae Geronimo'],
    ['General Manager', 'Kevin Rae Geronimo', 'kevinraegeronimo@yahoo.com', 'Swosthani Thapa'],
    ['Operations Manager', 'Swosthani Thapa', 'swos@olfndisservices.com.au', 'Kevin Rae Geronimo'],
  ],
  [35, 40, 55, 44]
);

subHeading('3.2 Emergency Services and Key External Contacts');

drawTable(
  ['Service', 'Contact Number', 'Notes'],
  [
    ['Emergency Services (Police, Fire, Ambulance)', '000', 'Life-threatening emergencies'],
    ['Northern Hospital Emergency Department', '(03) 8405 8000', 'Nearest hospital to SIL house (Epping)'],
    ['NDIS Quality & Safeguards Commission', '1800 035 544', 'Reportable incidents, complaints'],
    ['WorkSafe Victoria', '1800 136 089', 'Workplace incidents, OHS matters'],
    ['Poison Information Centre', '13 11 26', '24-hour poison advice line'],
    ['Participant Emergency Contact (Beverly Ross)', '0416 104 301', 'John Eric Ross \u2014 mother / NOK'],
    ['GP \u2014 Dr Shahzad Ahmed', '(03) 9436 9677', 'Primary GP for participant'],
    ['Northern Health Urology', '(03) 8405 2537', 'Catheter specialist team'],
    ['OLF General Email', 'support@olfndisservices.com.au', 'For non-urgent communication'],
  ],
  [60, 40, 74]
);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: BUSINESS IMPACT ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeading('4. Business Impact Analysis');

writeBody('The following analysis identifies OLF\'s critical business functions, the maximum tolerable period of disruption for each function, the impact of disruption, and the recovery priority. This analysis directly informs the response strategies detailed in Section 5.');
curY += 4;

drawTable(
  ['Critical Function', 'Max Downtime', 'Impact if Disrupted', 'Priority'],
  [
    ['24/7 SIL participant support', '0 hours', 'Life-threatening \u2014 participant requires continuous care, cannot be left unsupervised', 'CRITICAL'],
    ['Medication administration (insulin, BGL monitoring)', '0 hours', 'Immediate health risk \u2014 hypoglycaemia, diabetic ketoacidosis (DKA), or hyperglycaemia', 'CRITICAL'],
    ['Haemodialysis transport (Mon/Wed/Fri)', '0 hours (on dialysis days)', 'Kidney failure risk \u2014 toxin build-up, fluid overload, cardiovascular complications', 'CRITICAL'],
    ['Catheter care and wound monitoring', '4 hours', 'Infection risk, catheter tract closure requiring surgical reinsertion', 'HIGH'],
    ['Staff rostering and coordination', '8 hours', 'Service gaps, participant safety risk from understaffing or unskilled coverage', 'HIGH'],
    ['Participant records and care plans', '24 hours', 'Care quality risk \u2014 medication errors, missed clinical tasks, loss of continuity', 'MEDIUM'],
    ['Payroll and administration', '72 hours', 'Staff dissatisfaction but no immediate safety risk to participants', 'LOW'],
    ['Training and development', '1 week', 'Compliance risk but no immediate impact on current participant care', 'LOW'],
  ],
  [38, 28, 68, 20] // adjusted widths to fit
);

curY += 2;
drawCallout('alert', 'CRITICAL NOTE', [
  'Any disruption to the three CRITICAL functions above (24/7 care, medication, dialysis transport) poses an',
  'immediate and direct risk to participant life. These functions have zero tolerance for downtime and must be',
  'maintained or alternative arrangements enacted immediately upon any disruption event.',
]);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: RISK SCENARIOS AND RESPONSE PLANS
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeading('5. Risk Scenarios and Response Plans');

writeBody('This section outlines the specific disruption scenarios most relevant to OLF\'s operations, together with detailed response procedures for each scenario. All staff should be familiar with these response plans.');
curY += 4;

// ─── 5.1 Staff Shortage ─────────────────────────────────────────────────────

subHeading('5.1 Staff Shortage / Pandemic');

setBold();
doc.text('Trigger:', ML, curY);
setBody();
doc.text(' 50%+ staff unavailable due to illness, pandemic, or industrial action', ML + doc.getTextWidth('Trigger: '), curY);
curY += 7;

setBold();
doc.text('Response Procedures:', ML, curY);
curY += 5;

writeBullet('Immediately activate backup staff roster \u2014 maintain a current list of available casual staff, agency staff, and partner providers who can provide emergency coverage');
writeBullet('Director and General Manager to provide direct participant support if professional staff are unavailable \u2014 both hold NDIS Worker Screening Checks and are trained in participant-specific care');
writeBullet('Contact partner NDIS providers and disability support agencies for emergency staff sharing or temporary secondment arrangements');
writeBullet('Prioritise critical care functions: medication administration (insulin, BGL monitoring), personal care (catheter, hygiene, transfers), and dialysis transport above all non-essential activities');
writeBullet('Suspend community access and non-critical activities until safe staffing levels are restored');
writeBullet('Notify Support Coordinator, participant\'s family (Beverly Ross), and relevant medical team of the situation and any changes to the support schedule');
writeBullet('If unable to maintain a safe staffing ratio for 24/7 care: arrange emergency hospital admission at Northern Hospital or temporary alternative SIL/respite accommodation');
writeBullet('Document all staffing decisions, risk assessments, and communications during the event');

curY += 3;
drawCallout('info', 'Pandemic-Specific Measures', [
  'During a declared pandemic, OLF will implement infection control protocols including PPE requirements, staff cohorting,',
  'symptom screening before shifts, and isolation procedures as directed by the Department of Health. Telehealth',
  'consultations with GP and specialists will be arranged where face-to-face appointments cannot safely proceed.',
]);


// ─── 5.2 Natural Disaster ───────────────────────────────────────────────────

newPage();

subHeading('5.2 Natural Disaster (Fire, Flood, Storm, Earthquake)');

setBold();
doc.text('Trigger:', ML, curY);
setBody();
doc.text(' SIL house at 59 Severn Street, Epping becomes uninhabitable or unsafe', ML + doc.getTextWidth('Trigger: '), curY);
curY += 7;

setBold();
doc.text('Response Procedures:', ML, curY);
curY += 5;

writeBullet('Evacuate participant(s) immediately following the Emergency Evacuation Plan (Form82) \u2014 ensure wheelchair, medications, and essential medical equipment are secured');
writeBullet('Transport participant to the following locations in priority order:');

// Sub-bullets for relocation
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...DARK_TEXT);
const subIndent = 16;
const subText = 4;
ensureSpace(20);
doc.text('1.', ML + subIndent, curY);
doc.text('Family home \u2014 Beverly Ross (0416 104 301)', ML + subIndent + subText + 2, curY);
curY += 5;
doc.text('2.', ML + subIndent, curY);
doc.text('Alternative SIL or respite accommodation (pre-identified partner providers)', ML + subIndent + subText + 2, curY);
curY += 5;
doc.text('3.', ML + subIndent, curY);
doc.text('Northern Hospital (03 8405 8000) \u2014 if medical care is required', ML + subIndent + subText + 2, curY);
curY += 6;

writeBullet('Secure all medications (especially insulin \u2014 cold chain storage), medical equipment (CPAP, electric bed controls), and original care plan documents');
writeBullet('Call 000 for emergency services if the situation poses an immediate threat to life');
writeBullet('Notify NDIS Quality & Safeguards Commission (1800 035 544) within 24 hours as a reportable incident');
writeBullet('Notify Support Coordinator and participant\'s family immediately');
writeBullet('Relocate administrative operations to backup site (Head Office at Craigieburn) or enable remote coordination via mobile phones and cloud systems');
writeBullet('Recovery phase: assess property damage, engage insurance, arrange temporary or permanent alternative accommodation, update risk register');


// ─── 5.3 IT System Failure ──────────────────────────────────────────────────

subHeading('5.3 IT System / Digital Platform Failure');

setBold();
doc.text('Trigger:', ML, curY);
setBody();
doc.text(' One Life Vault, communication systems, internet, or cloud services outage', ML + doc.getTextWidth('Trigger: '), curY);
curY += 7;

setBold();
doc.text('Response Procedures:', ML, curY);
curY += 5;

writeBullet('Maintain hard copies of all critical documents at the SIL house at all times: current medication charts, care plans (diabetes, catheter, wound management), emergency contacts list, and daily progress note templates');
writeBullet('Staff continue providing all care using physical documentation \u2014 digital systems are a support tool, not a dependency for frontline care delivery');
writeBullet('General Manager coordinates response and staff communication via mobile phone calls and SMS group messages');
writeBullet('Progress notes and incident reports are completed on paper and transcribed to digital systems once restored');
writeBullet('Restore systems from Supabase database backups and Vercel deployment history');
writeBullet('Conduct a full review of records once systems are restored to ensure no data loss or gaps in documentation');
writeBullet('If outage exceeds 48 hours: engage IT support to investigate root cause and implement redundancy measures');


// ─── 5.4 Key Person Unavailability ──────────────────────────────────────────

newPage();

subHeading('5.4 Key Person Unavailability');

setBold();
doc.text('Trigger:', ML, curY);
setBody();
doc.text(' Director, General Manager, or Operations Manager is unexpectedly unavailable', ML + doc.getTextWidth('Trigger: '), curY);
curY += 7;

setBold();
doc.text('Succession Chain:', ML, curY);
curY += 5;

doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...DARK_TEXT);
ensureSpace(25);
doc.text('1.  Director (Harsimran Singh)', ML + 8, curY); curY += 5;
doc.text('2.  General Manager (Kevin Rae Geronimo)', ML + 8, curY); curY += 5;
doc.text('3.  Operations Manager (Swosthani Thapa)', ML + 8, curY); curY += 5;
doc.text('4.  Senior Support Worker (most experienced on-shift worker)', ML + 8, curY); curY += 7;

setBold();
doc.text('Response Procedures:', ML, curY);
curY += 5;

writeBullet('The succession chain above operates automatically \u2014 the next available person assumes decision-making authority without requiring formal handover during emergencies');
writeBullet('All key personnel maintain documented handover notes including: current participant status, active issues, upcoming medical appointments, rostering considerations, and pending administrative matters');
writeBullet('Critical access credentials (Supabase, Vercel, email accounts, medication management system) are stored securely and accessible to at least two management personnel at all times');
writeBullet('Participant care plans and medication charts are accessible to all rostered staff \u2014 no single person is a gatekeeper to critical care information');
writeBullet('If the unavailability is expected to exceed 2 weeks, the Board/Director will appoint a temporary replacement or engage external management support');


// ─── 5.5 Utility Failure ────────────────────────────────────────────────────

subHeading('5.5 Utility Failure (Power, Water, Gas)');

setBold();
doc.text('Trigger:', ML, curY);
setBody();
doc.text(' Extended utility outage at the SIL house, 59 Severn Street, Epping', ML + doc.getTextWidth('Trigger: '), curY);
curY += 7;

setBold();
doc.text('Response Procedures:', ML, curY);
curY += 5;

writeBullet('Ensure backup power arrangements for essential medical equipment: CPAP machine, electric bed (positioning for pressure relief and transfers), and insulin refrigeration');
writeBullet('Contact utility provider immediately to obtain estimated restoration timeframe and lodging priority status as a medical/disability support residence');
writeBullet('If power outage exceeds 4 hours: relocate participant to alternative accommodation (see Section 5.2 relocation hierarchy) \u2014 insulin storage, electric bed dependency, and CPAP use cannot be safely interrupted beyond this timeframe');
writeBullet('Maintain adequate water supply for medication preparation, personal hygiene, and catheter care irrigation \u2014 keep a minimum 20L emergency water supply at the SIL house');
writeBullet('Contact City of Whittlesea Council emergency services (9217 2170) if the utility failure is part of a wider area event');
writeBullet('Monitor participant condition closely during any utility outage \u2014 increased frequency of BGL checks, skin integrity checks, and comfort assessments');


// ─── 5.6 Supply Chain Disruption ────────────────────────────────────────────

newPage();

subHeading('5.6 Supply Chain Disruption');

setBold();
doc.text('Trigger:', ML, curY);
setBody();
doc.text(' Critical medication, medical supplies, or continence products unavailable', ML + doc.getTextWidth('Trigger: '), curY);
curY += 7;

setBold();
doc.text('Response Procedures:', ML, curY);
curY += 5;

writeBullet('Maintain a minimum 2-week supply buffer of all critical medications and consumables at the SIL house at all times \u2014 Operations Manager to check stock levels weekly');
writeBullet('Alternative pharmacy contacts:');

// Sub-items
setBody();
ensureSpace(12);
doc.text('\u2014  Terry White Chemmart South Morang: (03) 9408 3222', ML + 16, curY); curY += 5;
doc.text('\u2014  Chemist Warehouse Epping: (03) 9401 1811', ML + 16, curY); curY += 5;
doc.text('\u2014  Amcal Pharmacy Mill Park: (03) 9404 7766', ML + 16, curY); curY += 6;

writeBullet('For insulin and diabetes supplies: contact GP (Dr Shahzad Ahmed: 03 9436 9677) for emergency prescription. If GP unavailable, attend Northern Hospital ED for emergency insulin supply');
writeBullet('For catheter supplies and urology consumables: contact Northern Health Urology (03 8405 2537) for emergency supply or alternative product recommendation');
writeBullet('For continence products: maintain backup supply from Epping Medical Supplies. OLF petty cash can be used for emergency purchases if regular supplier is unavailable');
writeBullet('Document all supply disruptions and actions taken in the incident register (Form11)');


// ─── 5.7 Death of a Participant ─────────────────────────────────────────────

subHeading('5.7 Death of a Participant');

drawCallout('alert', 'CRITICAL \u2014 IMMEDIATE ACTIONS REQUIRED', [
  'The death of a participant is a reportable incident under the NDIS Act. The following steps must be',
  'followed immediately and without exception. All staff must be trained in this procedure.',
]);

curY += 2;

setBold();
doc.text('Response Procedures:', ML, curY);
curY += 5;

writeBullet('Call 000 immediately \u2014 request ambulance and police attendance');
writeBullet('Do NOT disturb the scene. Do not move the participant or clean the area until authorised by Police/Coroner');
writeBullet('Notify Director (Harsimran Singh) and General Manager (Kevin Rae Geronimo) immediately by phone');
writeBullet('Notify the participant\'s family/emergency contact (Beverly Ross: 0416 104 301)');
writeBullet('Report to the NDIS Quality & Safeguards Commission within 24 hours via the online portal and by phone (1800 035 544) \u2014 this is a mandatory reportable incident');
writeBullet('Provide immediate support to all staff who were present or on duty \u2014 arrange debriefing, Employee Assistance Program (EAP) referral, and time off as needed');
writeBullet('Cooperate fully with Victoria Police, the Coroner, and any other investigating authority');
writeBullet('Conduct an internal review within 7 days \u2014 review all care records, incident reports, and circumstances leading to the death');
writeBullet('Preserve all documentation (progress notes, medication charts, incident reports) for a minimum of 7 years as required by the NDIS Act');
writeBullet('Notify WorkSafe Victoria (1800 136 089) if the death occurred in circumstances that may constitute a workplace incident');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: COMMUNICATION PLAN
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeading('6. Communication Plan');

writeBody('Effective communication is essential during any disruption event. The following table outlines the notification responsibilities, methods, and timeframes for each stakeholder group.');
curY += 4;

drawTable(
  ['Stakeholder', 'Who Notifies', 'Method', 'Timeframe'],
  [
    ['Participants and families', 'Operations Manager', 'Phone call (primary), SMS (backup)', 'Immediate'],
    ['All OLF staff', 'General Manager', 'Phone call + SMS group message', 'Within 1 hour'],
    ['NDIS Quality & Safeguards Commission', 'Director', 'Online portal + phone (1800 035 544)', 'Within 24 hours'],
    ['Support Coordinators', 'General Manager', 'Phone call + follow-up email', 'Within 4 hours'],
    ['Medical team (GP, hospital, specialists)', 'On-shift support worker', 'Phone call', 'Immediate (if health-related)'],
    ['WorkSafe Victoria', 'Director', 'Phone (1800 136 089) + online report', 'As per OHS legislation'],
    ['Insurance provider', 'General Manager', 'Phone + written notification', 'Within 48 hours (if property/asset damage)'],
    ['Pharmacy / medical suppliers', 'Operations Manager', 'Phone call', 'As soon as supply impact identified'],
  ],
  [38, 32, 50, 54]
);

curY += 4;
drawCallout('info', 'Communication Principles', [
  '\u2022  All communications during a disruption event must be factual, calm, and solution-focused',
  '\u2022  Participant safety and privacy must be maintained in all external communications',
  '\u2022  A communication log must be maintained during any disruption event (who was contacted, when, what was communicated)',
  '\u2022  The Director is the sole spokesperson for any media or external enquiries',
]);


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: RECOVERY PROCEDURES
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading('7. Recovery Procedures');

writeBody('Following any disruption event, OLF will undertake the following recovery procedures to restore normal operations and capture lessons learned:');
curY += 3;

writeBullet('Assess the full extent of the disruption, including impact on participant care, staffing, property, systems, and documentation');
writeBullet('Prioritise restoration of critical services \u2014 participant care functions must be fully restored before administrative recovery begins');
writeBullet('Document all actions taken during the disruption, including decisions made, resources deployed, and any deviations from standard operating procedures');
writeBullet('Conduct a formal post-incident review within 7 days of the disruption event, involving all management personnel and key frontline staff');
writeBullet('Identify root causes and contributing factors for the disruption');
writeBullet('Update this Business Continuity Plan based on lessons learned and any new risks identified during the event');
writeBullet('Update the OLF Risk Register (Form01) with any newly identified risks or revised risk ratings');
writeBullet('Report to the NDIS Quality & Safeguards Commission as required for reportable incidents');
writeBullet('Debrief all staff involved in the response \u2014 provide support, recognise contributions, and address any concerns');
writeBullet('Communicate recovery status and any ongoing changes to participants, families, and Support Coordinators');
writeBullet('Archive all disruption event records for a minimum of 7 years');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: TESTING AND REVIEW
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeading('8. Testing and Review');

writeBody('To ensure this BCP remains effective and current, OLF commits to the following testing and review schedule:');
curY += 4;

drawTable(
  ['Activity', 'Frequency', 'Responsible', 'Details'],
  [
    ['Full BCP review', 'Annually (or after any activation)', 'General Manager', 'Complete review of all sections, risk scenarios, and contact details. Updated version issued to all staff.'],
    ['Desktop exercise', 'Annually', 'Management team', 'Scenario walkthrough with management team \u2014 test decision-making, communication chains, and resource allocation for a simulated disruption event.'],
    ['Emergency contact list verification', 'Quarterly', 'Operations Manager', 'Verify all phone numbers, email addresses, and contact details in Section 3 are current and correct.'],
    ['Staff awareness training', 'At induction + annual refresher', 'Operations Manager', 'All new staff are briefed on the BCP during induction. Annual refresher training for all existing staff.'],
    ['Emergency drill', 'Annually', 'General Manager', 'Practical emergency drill at SIL house (evacuation, communication, medical emergency response). Documented in Form81.'],
    ['Supply stock audit', 'Monthly', 'On-shift support worker', 'Verify 2-week supply buffer of critical medications and consumables is maintained.'],
  ],
  [35, 35, 32, 72]
);

curY += 4;
writeBody('Test results, review outcomes, and any corrective actions are documented and filed in the OLF Quality Management System. The General Manager is responsible for ensuring all scheduled activities are completed on time.');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: RELATED DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading('9. Related Documents');

writeBody('This Business Continuity Plan should be read in conjunction with the following OLF documents:');
curY += 3;

writeBullet('Form82 \u2014 Emergency and Disaster Management Plans');
writeBullet('Form81 \u2014 Emergency Drill Reporting Form');
writeBullet('Form01 \u2014 Risk Register');
writeBullet('Form04 \u2014 Incident Report');
writeBullet('Form11 \u2014 Incident Register');
writeBullet('Emergency Contacts \u2014 59 Severn Street, Epping (posted at SIL house)');
writeBullet('Participant Care Plans \u2014 Diabetes Management, Catheter Care, Wound Management');
writeBullet('NDIS Practice Standards \u2014 Element 15: Continuity of Supports');
writeBullet('Form111 \u2014 OLF Code of Conduct');
writeBullet('Form109 \u2014 Worker Screening and Recruitment Procedure');
writeBullet('ISO 22301 \u2014 Business Continuity Management Systems (reference standard)');


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: VERSION CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

sectionHeading('10. Version Control');

drawTable(
  ['Version', 'Date', 'Author', 'Changes'],
  [
    ['1.0', '1 January 2026', 'Kevin Rae Geronimo', 'Initial release \u2014 comprehensive BCP developed in alignment with NDIS Practice Standards Element 15 and ISO 22301 framework'],
  ],
  [20, 35, 45, 74]
);


// ═══════════════════════════════════════════════════════════════════════════════
// FINAL PAGE: STAFF ACKNOWLEDGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

newPage();

sectionHeading('Staff Acknowledgement');

writeBody('By signing below, I confirm that I have read, understood, and will comply with this Business Continuity Plan. I understand my responsibilities during a disruption event and know how to access the emergency contacts and procedures outlined in this document.');
curY += 8;

// Signature table
const sigHeaders = ['Staff Name', 'Position', 'Signature', 'Date'];
const sigColWidths = [45, 40, 50, 39];
const sigRows = [];

for (let i = 0; i < 10; i++) {
  sigRows.push(['', '', '', '']);
}

// Draw header
let sx = ML;
const sigRowH = 12;
const sigFontSize = 8;

doc.setFillColor(...TABLE_HEADER_BG);
doc.rect(sx, curY - 4, CW, sigRowH - 2, 'F');

doc.setFontSize(sigFontSize);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...WHITE);

sigHeaders.forEach((h, i) => {
  doc.text(h, sx + 2, curY + 1);
  sx += sigColWidths[i];
});
curY += sigRowH - 2;

// Draw empty rows
for (let r = 0; r < sigRows.length; r++) {
  ensureSpace(sigRowH + 2);

  sx = ML;
  if (r % 2 === 1) {
    doc.setFillColor(...TABLE_ALT_ROW);
    doc.rect(sx, curY - 4, CW, sigRowH, 'F');
  }

  // Cell borders
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  let bx = ML;
  for (let ci = 0; ci <= sigHeaders.length; ci++) {
    doc.line(bx, curY - 4, bx, curY - 4 + sigRowH);
    bx += (sigColWidths[ci] || 0);
  }
  doc.line(ML, curY - 4, ML + CW, curY - 4);
  doc.line(ML, curY - 4 + sigRowH, ML + CW, curY - 4 + sigRowH);

  curY += sigRowH;
}

curY += 10;

// Approval signatures
ensureSpace(50);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...BLUE);
doc.text('Document Approval', ML, curY);
curY += 10;

const colW = 75;
const col1X = ML;
const col2X = ML + colW + 24;

doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.3);

// Director signature
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(...DARK_TEXT);
doc.text('Prepared by:', col1X, curY);
doc.text('Approved by:', col2X, curY);
curY += 10;

doc.line(col1X, curY, col1X + colW, curY);
doc.line(col2X, curY, col2X + colW, curY);
curY += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...MED_GREY);
doc.text('Kevin Rae Geronimo, General Manager', col1X, curY);
doc.text('Harsimran Singh, Director', col2X, curY);
curY += 8;

doc.line(col1X, curY, col1X + colW, curY);
doc.line(col2X, curY, col2X + colW, curY);
curY += 5;
doc.text('Date', col1X, curY);
doc.text('Date', col2X, curY);


// ═══════════════════════════════════════════════════════════════════════════════
// ADD FOOTERS TO ALL PAGES
// ═══════════════════════════════════════════════════════════════════════════════

totalPages = doc.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  drawFooter(i, totalPages);
}


// ═══════════════════════════════════════════════════════════════════════════════
// SAVE AND UPLOAD
// ═══════════════════════════════════════════════════════════════════════════════

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

// Save locally
fs.writeFileSync(OUTPUT_PATH, pdfBuffer);
console.log(`PDF saved to: ${OUTPUT_PATH}`);
console.log(`Total pages: ${totalPages}`);

// Upload to Supabase Storage
async function upload() {
  const { data, error } = await sb.storage
    .from(BUCKET)
    .upload(STORAGE_PATH, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error.message);
    process.exit(1);
  }
  console.log(`Uploaded to Supabase: ${BUCKET}/${STORAGE_PATH}`);
}

await upload();
console.log('Done.');
