#!/usr/bin/env node
/**
 * Regenerate John Eric Ross Care Plans — 9 June 2026
 *
 * Updates:
 *   - OT: "Belinda Huynh" → "Melissa"
 *   - GP added: Dr Shahzad Ahmed, Plenty Valley Medical Centre, 03 9436 9677
 *   - Pharmacy added: Terry White Pharmacy, South Morang, 94083222
 *   - SC email added: gulsun@interconnectionservices.com.au
 *   - PM email added: planmanagers@distinctability.or.au
 *   - Funding Ratio added: 1:1
 *   - Date: "Revised: 9 June 2026" (original effective date 21 May 2026 retained)
 *
 * Generates 3 PDFs via jsPDF and uploads to Supabase Storage.
 */

import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Supabase ──────────────────────────────────────────────────────────────
const SB_URL = 'https://czdlemutsimvwfpwylxh.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk';
const sb = createClient(SB_URL, SB_KEY);
const BUCKET = 'participant-files';
const PARTICIPANT_ID = '5450d33e-860e-4427-958e-dba91479c001';

// ─── File records to update ────────────────────────────────────────────────
const FILE_RECORDS = {
  diabetes: {
    id: '49aab1be-bc24-484f-b07d-c419a141d39c',
    storage_path: '5450d33e-860e-4427-958e-dba91479c001/1779363700880_John_Ross_-_Diabetes_Management_Plan.pdf',
    file_name: 'John Ross - Diabetes Management Plan.pdf',
  },
  catheter: {
    id: 'ae7cf422-4f85-4624-9045-085e8a6b7e61',
    storage_path: '5450d33e-860e-4427-958e-dba91479c001/1779363731169_John_Ross_-_Catheter_Management_Care_Plan.pdf',
    file_name: 'John Ross - Catheter Management Care Plan.pdf',
  },
  wound: {
    id: '14c431a4-0214-4185-adce-a3921443fe9a',
    storage_path: '5450d33e-860e-4427-958e-dba91479c001/1779364092525_John_Ross_-_Wound_Management_Care_Plan.pdf',
    file_name: 'John Ross - Wound Management Care Plan.pdf',
  },
};

// ─── Participant Details ───────────────────────────────────────────────────
const P = {
  fullName: 'John Eric Ross',
  preferredName: 'John',
  dob: '30 December 1961',
  age: 64,
  ndis: '574 479 496',
  address: '59 Severn Street, Epping VIC 3076',
  phone: '0488 700 146',
  email: 'johnrross1@bigpond.com',
  fundingType: 'Plan-managed',
  supportLevel: 'High',
  fundingRatio: '1:1',
  primaryDisability: 'Severe Diabetic Peripheral Neuropathy',
  secondary: 'Type 2 Diabetes Mellitus, ESKD (haemodialysis 3x/week), bowel/bladder incontinence, SPC in situ, wheelchair dependent',
  mobility: 'Non-ambulant, 2-person assist, hoist, transit wheelchair',
  diet: 'Regular with 1L/day fluid restriction (ESKD)',
  emergencyContact: 'Beverly Ross (Wife)',
  emergencyPhone: '0416 104 301',
  gp: 'Dr Shahzad Ahmed',
  gpClinic: 'Plenty Valley Medical Centre',
  gpPhone: '03 9436 9677',
  sc: 'Gulsun Ali',
  scPhone: '0407 346 180',
  scOrg: 'Interconnection Support Services',
  scEmail: 'gulsun@interconnectionservices.com.au',
  ot: 'Melissa',
  pm: 'Distinctability Services',
  pmEmail: 'planmanagers@distinctability.or.au',
  pharmacy: 'Terry White Pharmacy',
  pharmacyLocation: 'South Morang',
  pharmacyPhone: '94083222',
};

const DOC_DATE = '21 May 2026';
const REVISED_DATE = '9 June 2026';

// ─── Brand Colors (RGB arrays) ────────────────────────────────────────────
const NAVY = [15, 82, 138];
const WHITE = [255, 255, 255];
const DARK_TEXT = [30, 41, 59];
const MEDIUM_TEXT = [71, 85, 105];
const LIGHT_TEXT = [148, 163, 184];
const BORDER_COLOR = [226, 232, 240];
const RED_BG = [254, 242, 242];
const RED_BORDER = [239, 68, 68];
const RED_TEXT = [153, 27, 27];
const AMBER_BG = [255, 251, 235];
const AMBER_BORDER = [245, 158, 11];
const AMBER_TEXT = [146, 64, 14];
const BLUE_BG = [239, 246, 255];
const BLUE_TEXT = [30, 64, 175];
const GREEN_BG = [240, 253, 244];
const GREEN_TEXT = [22, 101, 52];
const LABEL_BG = [245, 247, 250];
const TABLE_BORDER = [203, 213, 225];

// ─── PDF Constants ─────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 16;
const MARGIN_R = 16;
const MARGIN_T = 8;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const HEADER_BAR_H = 8;
const FOOTER_H = 12;
const BODY_TOP = MARGIN_T + HEADER_BAR_H + 6;
const BODY_BOTTOM = PAGE_H - FOOTER_H - 10;

// ─── Load Logo ─────────────────────────────────────────────────────────────
function loadLogo() {
  try {
    const logoPath = resolve(__dirname, '..', 'public', 'logo.png');
    const buf = readFileSync(logoPath);
    return 'data:image/png;base64,' + buf.toString('base64');
  } catch {
    return null;
  }
}

const LOGO_DATA = loadLogo();

// ═══════════════════════════════════════════════════════════════════════════
// PDF BUILDER CLASS
// ═══════════════════════════════════════════════════════════════════════════
class CarePlanPDF {
  constructor(docTitle, refLine) {
    this.pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.pageNum = 1;
    this.y = BODY_TOP;
    this.docTitle = docTitle;
    this.refLine = refLine || `OLF-${docTitle.replace(/\s+/g, '-')}-JR`;
    this.drawHeader();
  }

  // ─── Header ────────────────────────────────────────────────────────────
  drawHeader() {
    this.pdf.setFillColor(...NAVY);
    this.pdf.rect(0, 0, PAGE_W, MARGIN_T + HEADER_BAR_H, 'F');
    if (LOGO_DATA) {
      try { this.pdf.addImage(LOGO_DATA, 'PNG', MARGIN_L - 2, 1, 22, 11); } catch {}
    }
    // Header text (right-aligned)
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(6);
    this.pdf.setTextColor(...WHITE);
    this.pdf.text(`One Life Foundation  |  ${this.docTitle}  |  ${P.fullName}  |  NDIS: ${P.ndis}`, PAGE_W - MARGIN_R, 10, { align: 'right' });
  }

  // ─── Footer ────────────────────────────────────────────────────────────
  drawFooter() {
    const footerY = PAGE_H - 8;
    this.pdf.setDrawColor(...BORDER_COLOR);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(MARGIN_L, footerY - 4, PAGE_W - MARGIN_R, footerY - 4);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(6.5);
    this.pdf.setTextColor(...LIGHT_TEXT);
    this.pdf.text(`One Life Foundation  |  ${this.docTitle}  |  ${P.fullName}  |  NDIS: ${P.ndis}`, MARGIN_L, footerY);
    this.pdf.text(`Page ${this.pageNum}`, PAGE_W - MARGIN_R, footerY, { align: 'right' });
    // Reference line
    this.pdf.setFontSize(5.5);
    this.pdf.text(`Ref: ${this.refLine}  |  Effective: ${DOC_DATE}  |  Revised: ${REVISED_DATE}`, MARGIN_L, footerY + 3.5);
  }

  // ─── New Page ──────────────────────────────────────────────────────────
  newPage() {
    this.drawFooter();
    this.pdf.addPage();
    this.pageNum++;
    this.drawHeader();
    this.y = BODY_TOP;
  }

  ensureSpace(needed) {
    if (this.y + needed > BODY_BOTTOM) this.newPage();
  }

  // ─── Section Heading (navy bar) ────────────────────────────────────────
  sectionHeading(title, color = NAVY) {
    if (this.y > BODY_TOP + 5) {
      this.ensureSpace(20);
      this.pdf.setDrawColor(...BORDER_COLOR);
      this.pdf.setLineWidth(0.3);
      this.pdf.line(MARGIN_L, this.y, PAGE_W - MARGIN_R, this.y);
      this.y += 6;
    } else {
      this.ensureSpace(14);
    }
    this.pdf.setFillColor(...color);
    this.pdf.rect(MARGIN_L, this.y, CONTENT_W, 8, 'F');
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(...WHITE);
    this.pdf.text(title.toUpperCase(), MARGIN_L + 4, this.y + 5.8);
    this.y += 12;
  }

  // ─── Sub Heading ───────────────────────────────────────────────────────
  subHeading(title) {
    this.ensureSpace(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9.5);
    this.pdf.setTextColor(...NAVY);
    this.pdf.text(title, MARGIN_L + 2, this.y + 3);
    this.y += 5;
    this.pdf.setDrawColor(...NAVY);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(MARGIN_L + 2, this.y, MARGIN_L + 2 + Math.min(this.pdf.getTextWidth(title) + 4, CONTENT_W - 4), this.y);
    this.y += 4;
  }

  // ─── Info Table (label-value pairs) ────────────────────────────────────
  infoTable(rows, colSplit = 52) {
    for (const [label, value] of rows) {
      const valText = value || '--';
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      const valLines = this.pdf.splitTextToSize(String(valText), CONTENT_W - colSplit - 6);
      const rowH = Math.max(6, valLines.length * 3.8 + 2);
      this.ensureSpace(rowH + 1);

      this.pdf.setFillColor(...LABEL_BG);
      this.pdf.rect(MARGIN_L, this.y, colSplit, rowH, 'F');
      this.pdf.setDrawColor(...TABLE_BORDER);
      this.pdf.setLineWidth(0.2);
      this.pdf.rect(MARGIN_L, this.y, CONTENT_W, rowH);
      this.pdf.line(MARGIN_L + colSplit, this.y, MARGIN_L + colSplit, this.y + rowH);

      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(...DARK_TEXT);
      this.pdf.text(label, MARGIN_L + 3, this.y + 4.2);

      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(...DARK_TEXT);
      this.pdf.text(valLines, MARGIN_L + colSplit + 3, this.y + 4.2);

      this.y += rowH;
    }
    this.y += 3;
  }

  // ─── Multi-column data table ───────────────────────────────────────────
  dataTable(headers, rows, colWidths) {
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    const headerH = 7;
    const rowH = 8;

    // Header row
    this.ensureSpace(headerH + rowH * 2);
    let x = MARGIN_L;
    this.pdf.setFillColor(...NAVY);
    this.pdf.rect(MARGIN_L, this.y, totalW, headerH, 'F');
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(7.5);
    this.pdf.setTextColor(...WHITE);
    for (let i = 0; i < headers.length; i++) {
      this.pdf.text(headers[i], x + 3, this.y + 5);
      x += colWidths[i];
    }
    this.y += headerH;

    // Data rows
    for (const row of rows) {
      // Calculate row height based on text wrapping
      let maxH = rowH;
      const cellTexts = [];
      for (let i = 0; i < row.length; i++) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(7.5);
        const lines = this.pdf.splitTextToSize(String(row[i] || ''), colWidths[i] - 6);
        cellTexts.push(lines);
        maxH = Math.max(maxH, lines.length * 3.5 + 3);
      }

      this.ensureSpace(maxH + 1);
      x = MARGIN_L;
      this.pdf.setDrawColor(...TABLE_BORDER);
      this.pdf.setLineWidth(0.2);
      this.pdf.rect(MARGIN_L, this.y, totalW, maxH);

      for (let i = 0; i < row.length; i++) {
        if (i > 0) this.pdf.line(x, this.y, x, this.y + maxH);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(7.5);
        this.pdf.setTextColor(...DARK_TEXT);
        this.pdf.text(cellTexts[i], x + 3, this.y + 4);
        x += colWidths[i];
      }
      this.y += maxH;
    }
    this.y += 3;
  }

  // ─── Alert Box ─────────────────────────────────────────────────────────
  alertBox(title, text, type = 'red') {
    const colors = {
      red: { bg: RED_BG, border: RED_BORDER, text: RED_TEXT },
      amber: { bg: AMBER_BG, border: AMBER_BORDER, text: AMBER_TEXT },
      blue: { bg: BLUE_BG, border: [59, 130, 246], text: BLUE_TEXT },
      green: { bg: GREEN_BG, border: [34, 197, 94], text: GREEN_TEXT },
    };
    const c = colors[type] || colors.red;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    const lines = this.pdf.splitTextToSize(text, CONTENT_W - 14);
    const boxH = (title ? 6 : 0) + lines.length * 3.8 + 6;
    this.ensureSpace(boxH + 3);

    this.pdf.setFillColor(...c.bg);
    this.pdf.roundedRect(MARGIN_L, this.y, CONTENT_W, boxH, 1.5, 1.5, 'F');
    this.pdf.setDrawColor(...c.border);
    this.pdf.setLineWidth(0.6);
    this.pdf.roundedRect(MARGIN_L, this.y, CONTENT_W, boxH, 1.5, 1.5, 'S');
    this.pdf.setFillColor(...c.border);
    this.pdf.rect(MARGIN_L, this.y + 1.5, 2, boxH - 3, 'F');

    let textY = this.y + 4.5;
    if (title) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(8.5);
      this.pdf.setTextColor(...c.text);
      this.pdf.text(title, MARGIN_L + 7, textY);
      textY += 5;
    }
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...c.text);
    this.pdf.text(lines, MARGIN_L + 7, textY);
    this.y += boxH + 4;
  }

  // ─── Paragraph ─────────────────────────────────────────────────────────
  paragraph(text, indent = 0) {
    if (!text) return;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8.5);
    const lines = this.pdf.splitTextToSize(text, CONTENT_W - indent - 4);
    for (const line of lines) {
      this.ensureSpace(4.5);
      this.pdf.setTextColor(...DARK_TEXT);
      this.pdf.text(line, MARGIN_L + 2 + indent, this.y + 3);
      this.y += 3.8;
    }
    this.y += 2;
  }

  // ─── Bold Paragraph ────────────────────────────────────────────────────
  boldParagraph(text, indent = 0) {
    if (!text) return;
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(8.5);
    const lines = this.pdf.splitTextToSize(text, CONTENT_W - indent - 4);
    for (const line of lines) {
      this.ensureSpace(4.5);
      this.pdf.setTextColor(...DARK_TEXT);
      this.pdf.text(line, MARGIN_L + 2 + indent, this.y + 3);
      this.y += 3.8;
    }
    this.y += 2;
  }

  // ─── Bullet List ───────────────────────────────────────────────────────
  bulletList(items, indent = 4) {
    for (const item of items) {
      if (!item) continue;
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8.5);
      const lines = this.pdf.splitTextToSize(item, CONTENT_W - indent - 10);
      this.ensureSpace(lines.length * 3.8 + 2);
      this.pdf.setTextColor(...DARK_TEXT);
      this.pdf.text('\u2022', MARGIN_L + indent, this.y + 3);
      this.pdf.text(lines, MARGIN_L + indent + 5, this.y + 3);
      this.y += lines.length * 3.8 + 1;
    }
    this.y += 2;
  }

  // ─── Numbered List ─────────────────────────────────────────────────────
  numberedList(items, indent = 4) {
    for (let i = 0; i < items.length; i++) {
      if (!items[i]) continue;
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8.5);
      const lines = this.pdf.splitTextToSize(items[i], CONTENT_W - indent - 12);
      this.ensureSpace(lines.length * 3.8 + 2);
      this.pdf.setTextColor(...DARK_TEXT);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${i + 1}.`, MARGIN_L + indent, this.y + 3);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(lines, MARGIN_L + indent + 7, this.y + 3);
      this.y += lines.length * 3.8 + 1;
    }
    this.y += 2;
  }

  // ─── Participant Details Table ─────────────────────────────────────────
  participantDetails() {
    this.sectionHeading('1. Participant Details');
    this.infoTable([
      ['Full Name', P.fullName],
      ['Preferred Name', P.preferredName],
      ['Date of Birth', `${P.dob} (Age ${P.age})`],
      ['NDIS Number', P.ndis],
      ['Address', P.address],
      ['Phone', P.phone],
      ['Email', P.email],
      ['Funding Type', P.fundingType],
      ['Support Level', P.supportLevel],
      ['Funding Ratio', P.fundingRatio],
      ['Primary Disability', P.primaryDisability],
      ['Secondary Conditions', P.secondary],
      ['Mobility', P.mobility],
      ['Dietary Requirements', P.diet],
    ]);
  }

  // ─── Key Contacts Table ────────────────────────────────────────────────
  keyContacts(extras = []) {
    this.sectionHeading('2. Key Contacts');
    const contacts = [
      ['Emergency Contact', `${P.emergencyContact} — ${P.emergencyPhone}`],
      ['General Practitioner', `${P.gp}, ${P.gpClinic}, ${P.gpPhone}`],
      ['Support Coordinator', `${P.sc}, ${P.scOrg}, ${P.scPhone}, ${P.scEmail}`],
      ['Occupational Therapist', P.ot],
      ['Plan Manager', `${P.pm}, ${P.pmEmail}`],
      ['Pharmacy', `${P.pharmacy}, ${P.pharmacyLocation}, ${P.pharmacyPhone}`],
      ...extras,
    ];
    this.infoTable(contacts);
  }

  // ─── Staff Acknowledgement ─────────────────────────────────────────────
  staffAcknowledgement(planName) {
    this.sectionHeading('Staff Acknowledgement');
    this.paragraph(`By signing below, I acknowledge that I have read and understood this ${planName} for ${P.fullName}. I understand the care requirements, medical needs, critical alerts, and emergency procedures outlined in this document. I will follow these procedures during every shift and report any concerns to my Team Leader immediately.`);
    this.y += 4;

    const cols = [0, 52, 90, 135, 158];
    const colLabels = ['Staff Name', 'Signature', 'Date', 'Initials'];
    const tableW = CONTENT_W;
    const rowH = 10;
    const headerH = 7;

    this.ensureSpace(50);
    this.pdf.setFillColor(...NAVY);
    this.pdf.rect(MARGIN_L, this.y, tableW, headerH, 'F');
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(7.5);
    this.pdf.setTextColor(...WHITE);
    for (let i = 0; i < colLabels.length; i++) {
      this.pdf.text(colLabels[i], MARGIN_L + cols[i] + 3, this.y + 5);
    }
    this.y += headerH;

    for (let r = 0; r < 7; r++) {
      this.ensureSpace(rowH + 1);
      this.pdf.setDrawColor(...TABLE_BORDER);
      this.pdf.setLineWidth(0.2);
      this.pdf.rect(MARGIN_L, this.y, tableW, rowH);
      for (let c = 1; c < cols.length; c++) {
        this.pdf.line(MARGIN_L + cols[c], this.y, MARGIN_L + cols[c], this.y + rowH);
      }
      this.y += rowH;
    }
  }

  // ─── Finalize ──────────────────────────────────────────────────────────
  finalize() {
    this.drawFooter();
    return this.pdf.output('arraybuffer');
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// 1. DIABETES MANAGEMENT PLAN (7 pages)
// ═══════════════════════════════════════════════════════════════════════════
function generateDiabetesPlan() {
  const doc = new CarePlanPDF('Diabetes Management Plan', 'OLF-DMP-JR-2026');

  // ─── 1. Participant Details ──────────────────────────────────────────
  doc.participantDetails();

  // ─── 2. Key Contacts ─────────────────────────────────────────────────
  doc.keyContacts();

  // Date line
  doc.paragraph(`Effective Date: ${DOC_DATE}  |  Revised: ${REVISED_DATE}`);
  doc.y += 2;

  // ─── 3. Diabetes Overview ────────────────────────────────────────────
  doc.sectionHeading('3. Diabetes Overview');

  doc.paragraph('John has been diagnosed with Type 2 Diabetes Mellitus and is insulin-dependent. This is a lifelong condition requiring daily management by support workers.');

  doc.subHeading('Key Facts');
  doc.bulletList([
    'Type 2 Diabetes Mellitus — insulin-dependent',
    'Lifelong condition requiring daily monitoring and insulin administration',
    'Complicated by End Stage Kidney Disease (ESKD) — on haemodialysis 3 times per week',
    'Severe Diabetic Peripheral Neuropathy — reduced sensation in all limbs, high risk of unnoticed injury',
    'Blood glucose levels (BGL) must be monitored 4 times daily: morning, lunch, dinner, bedtime',
    'Haemodialysis 3 times per week at The Northern Hospital — dialysis affects blood sugar levels',
    'Strict fluid restriction of 1 litre per day due to ESKD — monitor and record ALL fluid intake',
    'John has impaired hand function and cannot self-administer insulin — support workers must administer all insulin injections',
  ]);

  // ─── 4. Insulin Regimen ──────────────────────────────────────────────
  doc.sectionHeading('4. Insulin Regimen');

  doc.dataTable(
    ['Insulin', 'Type', 'Dose', 'Timing', 'Notes'],
    [
      ['Novorapid', 'Rapid-acting', 'As prescribed', 'Before meals (3x daily)', 'Onset 10–20 min, peak 1–3 hrs. Must eat within 15 min of injection.'],
      ['Optisulin', 'Long-acting', 'As prescribed', 'Bedtime', 'Onset 1–2 hrs, no peak, lasts 24 hrs. Do not mix with other insulins.'],
      ['Protaphane', 'Intermediate-acting', 'As prescribed', 'As prescribed', 'Onset 1–2 hrs, peak 4–12 hrs. Gently roll pen before use — do not shake.'],
    ],
    [30, 28, 26, 34, 60],
  );

  doc.alertBox(
    'IMPORTANT — INSULIN SAFETY',
    'Never skip an insulin dose without medical advice. Always check BGL BEFORE administering insulin. If BGL is below 4.0 mmol/L, do NOT give insulin — follow the hypoglycaemia protocol first. Always ensure John eats within 15 minutes of receiving rapid-acting insulin (Novorapid).',
    'red',
  );

  // ─── 5. BGL Monitoring ──────────────────────────────────────────────
  doc.sectionHeading('5. BGL Monitoring');

  doc.subHeading('Monitoring Schedule');
  doc.infoTable([
    ['Morning (fasting)', 'Before breakfast and morning insulin'],
    ['Lunchtime', 'Before lunch and lunchtime Novorapid'],
    ['Dinner', 'Before dinner and dinner Novorapid'],
    ['Bedtime', 'Before Optisulin/Protaphane administration'],
    ['Additional checks', 'If John shows signs of hypo or hyper, or if feeling unwell'],
  ]);

  doc.subHeading('Target BGL Ranges');
  doc.infoTable([
    ['Fasting / Pre-meal', '4.0 – 8.0 mmol/L'],
    ['2 hours post-meal', '6.0 – 10.0 mmol/L'],
    ['Bedtime', '6.0 – 10.0 mmol/L'],
    ['LOW (Hypoglycaemia)', 'Below 4.0 mmol/L — TREAT IMMEDIATELY'],
    ['HIGH (Hyperglycaemia)', 'Above 15.0 mmol/L — ESCALATE'],
  ]);

  doc.subHeading('How to Perform BGL Check');
  doc.numberedList([
    'Wash hands (yours and John\'s) with warm soapy water and dry thoroughly.',
    'Insert a fresh test strip into the glucose meter.',
    'Use the lancet device to prick the side of John\'s fingertip (rotate fingers each time).',
    'Apply the blood drop to the test strip — ensure adequate sample.',
    'Wait for the meter to display the result.',
    'Record the BGL reading, date, time, and any relevant notes in the monitoring chart.',
    'Dispose of the lancet in the sharps container — never reuse.',
    'Report any reading below 4.0 or above 15.0 immediately.',
  ]);

  // ─── 6. Insulin Administration ───────────────────────────────────────
  doc.sectionHeading('6. Insulin Administration');

  doc.subHeading('Injection Procedure');
  doc.numberedList([
    'Wash hands thoroughly.',
    'Check the insulin type, dose, and expiry date. Confirm it matches the prescribed regimen.',
    'If using Protaphane (cloudy insulin), gently roll the pen between your palms 10 times — do NOT shake.',
    'Attach a new pen needle and prime the pen (dial 2 units, press — you should see a drop at the needle tip).',
    'Select the prescribed dose on the pen dial.',
    'Clean the injection site with an alcohol swab. Preferred sites: abdomen (2cm from navel), outer thigh. Rotate sites each time.',
    'Pinch the skin gently and insert the needle at a 90-degree angle. Press the injection button fully and hold for 10 seconds.',
    'Remove the needle, apply gentle pressure with a cotton ball. Do not rub. Dispose of the needle in the sharps container.',
  ]);

  doc.alertBox(
    'CRITICAL — INSULIN SAFETY',
    'NEVER mix different insulin types in the same syringe unless specifically instructed. NEVER shake insulin pens. NEVER inject into bruised, scarred, or lumpy skin. ALWAYS rotate injection sites. ALWAYS check the insulin label — wrong insulin type can be fatal.',
    'red',
  );

  doc.subHeading('Insulin Storage');
  doc.bulletList([
    'Unopened insulin: store in refrigerator (2–8°C) — NOT in the freezer.',
    'In-use insulin pens: can be kept at room temperature (below 25°C) for up to 28 days.',
    'Do not expose to direct sunlight or heat.',
    'Discard any insulin that has been open for more than 28 days.',
    'Check expiry dates regularly.',
  ]);

  // ─── 7. Hypoglycaemia ───────────────────────────────────────────────
  doc.sectionHeading('7. Hypoglycaemia (Low Blood Sugar)', [185, 28, 28]);

  doc.paragraph('Hypoglycaemia occurs when BGL drops below 4.0 mmol/L. This is a medical emergency that requires immediate treatment. John is at increased risk due to insulin therapy and ESKD (kidneys cannot regulate blood sugar effectively).');

  doc.subHeading('Signs of Hypoglycaemia');
  doc.bulletList([
    'Sweating, trembling, shaking',
    'Pallor (pale skin)',
    'Hunger, nausea',
    'Dizziness, light-headedness',
    'Confusion, difficulty concentrating, slurred speech',
    'Irritability, mood changes',
    'Weakness, fatigue',
    'Tingling lips or fingers',
    'Blurred vision',
    'In severe cases: seizures, loss of consciousness',
  ]);

  doc.subHeading('Treatment Protocol');
  doc.numberedList([
    'STOP everything and check BGL immediately.',
    'If BGL is below 4.0 mmol/L: Give fast-acting sugar — 6–7 jelly beans, OR 150ml fruit juice, OR 3 glucose tablets, OR 1 tablespoon of honey.',
    'Wait 15 minutes, then recheck BGL.',
    'If BGL is still below 4.0: repeat the fast-acting sugar and call One Life Foundation (0420 652 270). If after hours, call 000.',
    'Once BGL is above 4.0: give a longer-acting snack (sandwich, crackers with cheese, or a glass of milk) to prevent recurrence.',
  ]);

  doc.alertBox(
    'EMERGENCY — UNCONSCIOUS OR UNABLE TO SWALLOW',
    'If John becomes unconscious, has a seizure, or cannot swallow safely: DO NOT give food or drink (choking risk). Place John in the recovery position. Call 000 immediately. Stay with John until paramedics arrive. Report the incident to One Life Foundation and complete an incident report.',
    'red',
  );

  // ─── 8. Hyperglycaemia ──────────────────────────────────────────────
  doc.sectionHeading('8. Hyperglycaemia (High Blood Sugar)');

  doc.paragraph('Hyperglycaemia occurs when BGL rises above the target range. This can be caused by missed insulin, illness, infection, stress, or dietary changes.');

  doc.subHeading('Signs of Hyperglycaemia');
  doc.bulletList([
    'Increased thirst (but note John\'s fluid restriction)',
    'Frequent urination (monitor catheter output)',
    'Blurred vision',
    'Headache',
    'Fatigue, lethargy',
    'Nausea, vomiting (late sign)',
    'Fruity-smelling breath (sign of DKA — medical emergency)',
  ]);

  doc.subHeading('Action Levels');
  doc.dataTable(
    ['BGL Range', 'Action Required'],
    [
      ['10.1 – 15.0 mmol/L', 'Record and monitor. Recheck in 2 hours. Ensure insulin was given. Report if persistent.'],
      ['15.1 – 20.0 mmol/L', 'Record and notify One Life Foundation. Ensure adequate hydration (within fluid restriction). Recheck in 1 hour.'],
      ['Above 20.0 mmol/L', 'URGENT — Contact GP or call 000. Monitor for signs of DKA. Do not give additional insulin without medical advice.'],
    ],
    [40, CONTENT_W - 40],
  );

  doc.alertBox(
    'WARNING — DIABETIC KETOACIDOSIS (DKA)',
    'DKA is a life-threatening emergency. Signs include: nausea/vomiting, abdominal pain, rapid breathing, fruity-smelling breath, confusion, and drowsiness. If ANY of these signs are present with a BGL above 15 mmol/L, call 000 immediately. DKA can develop rapidly — do not delay seeking emergency help.',
    'red',
  );

  // ─── 9. Dietary Management ──────────────────────────────────────────
  doc.sectionHeading('9. Dietary Management');

  doc.bulletList([
    'Regular diet with consistent carbohydrate intake at each meal — do not skip meals when insulin has been administered.',
    'Strict fluid restriction: 1 litre per day due to ESKD. Monitor and record ALL fluid intake on the fluid balance chart. All fluids count — water, tea, coffee, juice, milk, soup, ice.',
    'Consistent meal times to match insulin regimen — breakfast, lunch, dinner at regular intervals.',
    'Encourage balanced meals with appropriate portions of protein, carbohydrates, and vegetables.',
    'Avoid excessive sugar and high-GI foods, but do not restrict all carbohydrates — John needs carbs for energy and to prevent hypoglycaemia.',
    'John has reduced hand function — assist with meal setup, opening packaging, cutting food. He can feed himself once food is prepared.',
    'Always have hypo treatment available: juice boxes, jelly beans, glucose tablets within easy reach at all times.',
  ]);

  // ─── 10. Dialysis Considerations ────────────────────────────────────
  doc.sectionHeading('10. Dialysis Considerations');

  doc.bulletList([
    'John attends haemodialysis 3 times per week at The Northern Hospital, Epping.',
    'Dialysis significantly affects blood glucose levels — BGL may be lower or more unstable on dialysis days.',
    'Always check BGL before and after dialysis sessions.',
    'Ensure John has eaten before dialysis to reduce hypoglycaemia risk during treatment.',
    'Post-dialysis: John may feel fatigued, dizzy, or nauseous — this is normal. Monitor closely for the first 2 hours after return.',
    'Fluid restriction is especially critical on dialysis days — ensure intake is recorded accurately.',
    'Coordinate insulin timing with dialysis schedule — consult with the renal team if insulin doses need adjustment on dialysis days.',
  ]);

  // ─── 11. Wound Care & Skin Integrity ────────────────────────────────
  doc.sectionHeading('11. Wound Care & Skin Integrity');

  doc.bulletList([
    'Diabetes causes poor circulation and slow wound healing — any cut, scratch, or skin breakdown must be treated seriously.',
    'Perform daily skin assessments during personal care — check feet, legs, sacrum, heels, elbows, and any known wound sites.',
    'Report any new wounds, redness, swelling, warmth, or changes to existing wounds immediately.',
    'Refer to the Wound Management Care Plan for detailed wound care protocols.',
    'Never apply heat packs or hot water bottles directly — reduced sensation means John cannot feel burns.',
    'Ensure pressure relief protocols are followed: reposition every 2–3 hours, use pressure-relieving mattress and cushions.',
  ]);

  // ─── 12. When to Contact Medical Team ───────────────────────────────
  doc.sectionHeading('12. When to Contact Medical Team');

  doc.bulletList([
    'BGL below 4.0 mmol/L that does not respond to treatment after 2 attempts',
    'BGL above 20.0 mmol/L',
    'Signs of DKA: nausea, vomiting, abdominal pain, rapid breathing, fruity breath',
    'John is unconscious or unresponsive',
    'Seizure activity',
    'Signs of infection: fever, redness, swelling, wound discharge, cloudy/foul-smelling urine',
    'Sudden changes in condition: confusion, difficulty breathing, chest pain, sudden weakness',
    'Catheter problems: no urine output, accidental dislodgement, pain, blood in urine',
    'New wound or significant deterioration of existing wounds',
    'John refuses insulin for more than one scheduled dose — notify SC and GP',
  ]);

  doc.alertBox(
    'CALL 000 IMMEDIATELY IF:',
    'John is unconscious and cannot be roused. John has a seizure. John has signs of DKA (vomiting, rapid breathing, fruity breath). John has chest pain or difficulty breathing. John has signs of stroke (facial droop, arm weakness, speech difficulty). Severe hypoglycaemia not responding to treatment.',
    'red',
  );

  // ─── 13. Equipment & Supplies ───────────────────────────────────────
  doc.sectionHeading('13. Equipment & Supplies');

  doc.dataTable(
    ['Item', 'Details', 'Resupply'],
    [
      ['Blood Glucose Meter', 'Digital meter with test strips', 'Order via pharmacy when low'],
      ['Test Strips', 'Compatible with meter', 'Order 1 box before running out'],
      ['Lancets', 'Single-use, for lancet device', 'Order with test strips'],
      ['Lancet Device', 'Spring-loaded finger prick device', 'Replace if faulty'],
      ['Insulin Pens', 'Novorapid, Optisulin, Protaphane', 'Prescription via GP, filled at pharmacy'],
      ['Pen Needles', 'Single-use, dispose after each injection', 'Order 1 box before running out'],
      ['Sharps Container', 'Yellow, approved sharps bin', 'Replace when 3/4 full — pharmacy disposal'],
      ['Hypo Kit', 'Juice boxes, jelly beans, glucose tablets', 'Restock after each use'],
      ['Alcohol Swabs', 'For cleaning injection sites', 'Order via pharmacy'],
      ['Fluid Balance Chart', 'Daily recording of fluid intake', 'Print from One Life Vault'],
      ['BGL Monitoring Chart', 'Daily recording of BGL readings', 'Print from One Life Vault'],
    ],
    [40, 72, 66],
  );

  // ─── 14. Staff Acknowledgement ──────────────────────────────────────
  doc.staffAcknowledgement('Diabetes Management Plan');

  return doc.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════
// 2. CATHETER MANAGEMENT CARE PLAN (5 pages)
// ═══════════════════════════════════════════════════════════════════════════
function generateCatheterPlan() {
  const doc = new CarePlanPDF('Catheter Management Care Plan', 'OLF-CMCP-JR-2026');

  // ─── 1. Participant Details ──────────────────────────────────────────
  doc.participantDetails();

  // ─── 2. Key Contacts ─────────────────────────────────────────────────
  doc.keyContacts([
    ['Northern Health Urology', 'The Northern Hospital, 185 Cooper Street, Epping VIC 3076, (03) 8405 8000'],
    ['Northern Hospital ED', 'Emergency Department, (03) 8405 8000'],
    ['Post-Acute Care', 'Northern Health, (03) 8405 8000'],
  ]);

  doc.paragraph(`Effective Date: ${DOC_DATE}  |  Revised: ${REVISED_DATE}`);
  doc.y += 2;

  // ─── 3. Catheter Overview ───────────────────────────────────────────
  doc.sectionHeading('3. Catheter Overview');

  doc.paragraph('John has a Suprapubic Cystostomy (SPC) — a catheter inserted through the abdominal wall directly into the bladder. This is a permanent (lifelong) catheter for bladder management due to his functional incontinence and limited mobility.');

  doc.subHeading('Key Information');
  doc.infoTable([
    ['Catheter Type', 'Suprapubic Cystostomy (SPC)'],
    ['Reason', 'Functional bladder incontinence, non-ambulant, unable to use toilet independently'],
    ['Duration', 'Lifelong — permanent catheter management'],
    ['Change Frequency', 'Every 6–8 weeks'],
    ['Change Day', 'Thursdays (booked through Bolton Clarke)'],
    ['Changed By', 'Bolton Clarke district nurse (note: Bolton Clarke will take over at age 65)'],
    ['Catheter Size', 'As per urology recommendations — confirm at each change'],
    ['Balloon Size', 'As per urology recommendations'],
  ]);

  // ─── 4. Daily Care ──────────────────────────────────────────────────
  doc.sectionHeading('4. Daily Catheter Care');

  doc.subHeading('Hygiene & Site Care');
  doc.bulletList([
    'Clean the catheter insertion site (stoma) daily during personal care with warm water and mild soap.',
    'Gently clean around the catheter where it enters the skin — remove any crusting or discharge.',
    'Pat dry gently — do not rub. Ensure the area is completely dry.',
    'Observe the site for signs of infection: redness, swelling, warmth, tenderness, purulent discharge.',
    'Do NOT apply antiseptic solutions unless directed by the nurse or GP.',
    'Ensure the catheter tubing is secured to John\'s leg or abdomen to prevent pulling or traction.',
    'NEVER pull, tug, or force the catheter.',
  ]);

  doc.subHeading('Drainage Bag Management');
  doc.infoTable([
    ['Daytime Bag', 'Conveen Active Drainage Bag (500ml) — attach in the morning, secure to leg'],
    ['Overnight Bag', 'Simpla S-3 Night Drainage Bag (2000ml) — connect at bedtime, hang below bladder level'],
    ['Bag Changes', 'Change bags weekly (or sooner if damaged, cloudy, or malodorous)'],
    ['Emptying', 'Empty daytime bag when half full. Empty overnight bag each morning.'],
    ['Positioning', 'Drainage bag must ALWAYS be below the level of the bladder — never lift above'],
  ]);

  doc.subHeading('Emptying Procedure');
  doc.numberedList([
    'Wash hands and wear gloves.',
    'Place a clean container or jug under the drainage tap.',
    'Open the tap and allow urine to drain completely.',
    'Close the tap securely.',
    'Measure and record the urine output on the fluid balance chart.',
    'Dispose of urine in the toilet.',
    'Clean the container, remove gloves, wash hands.',
  ]);

  doc.alertBox(
    'CRITICAL — FLUID RESTRICTION',
    'John has a strict fluid restriction of 1 litre per day due to End Stage Kidney Disease. Monitor and record both fluid intake AND urine output. This is essential for managing his kidney disease alongside catheter care. Report any significant changes in urine output to the GP or renal team.',
    'red',
  );

  // ─── 5. Catheter Change Schedule ────────────────────────────────────
  doc.sectionHeading('5. Catheter Change Schedule');

  doc.paragraph('The SPC catheter is changed every 6–8 weeks by a Bolton Clarke district nurse. Changes are scheduled on Thursdays.');

  doc.bulletList([
    'Ensure John is informed of the scheduled change date in advance.',
    'Have a clean, private space prepared for the nurse visit.',
    'Have spare catheter bags and supplies ready.',
    'Support workers should be available to assist with positioning during the change (2-person assist).',
    'Monitor for any complications after the change: pain, bleeding, urine leakage, signs of infection.',
    'Record the change date, catheter size, and any issues in the progress notes.',
  ]);

  doc.alertBox(
    'NOTE — BOLTON CLARKE TRANSITION',
    'Bolton Clarke will assume ongoing catheter management when John turns 65 (December 2026). Until then, catheter changes are managed through the current arrangement. Ensure referral is completed in advance.',
    'blue',
  );

  // ─── 6. Emergency — Accidental Removal ──────────────────────────────
  doc.sectionHeading('6. Emergency — Accidental Catheter Removal', [185, 28, 28]);

  doc.alertBox(
    'EMERGENCY — CATHETER FALLS OUT OR IS ACCIDENTALLY REMOVED',
    'This is a medical emergency. The SPC tract (hole) can close within hours, requiring surgical re-insertion.\n\n1. DO NOT PANIC. Apply a clean pad or dressing over the stoma site.\n2. Call Northern Health Urology or Northern Hospital ED immediately: (03) 8405 8000.\n3. Call 000 if there is significant bleeding or John is in severe pain.\n4. Do NOT attempt to re-insert the catheter.\n5. Keep John calm and comfortable.\n6. Call One Life Foundation: 0420 652 270.\n7. Call Beverly Ross (wife): 0416 104 301.\n8. Complete an incident report.',
    'red',
  );

  // ─── 7. Troubleshooting — No Urine Output ──────────────────────────
  doc.sectionHeading('7. Troubleshooting — No Urine Output');

  doc.paragraph('If there is no urine draining from the catheter for 4 or more hours (and John has had fluid intake), follow these steps:');

  doc.numberedList([
    'Check the catheter tubing for kinks, twists, or compression — straighten if found.',
    'Ensure the drainage bag is below the level of the bladder.',
    'Check the drainage tap is open.',
    'Check if the tubing is blocked with sediment — gently milk the tubing towards the bag.',
    'Check the catheter insertion site for leakage around the catheter.',
    'If urine is leaking around the catheter but not draining into the bag, the catheter may be blocked.',
    'If no output after checking all above: contact Bolton Clarke or the GP.',
    'If John complains of bladder pain, abdominal distension, or discomfort: seek urgent medical attention.',
  ]);

  // ─── 8. When to Contact Medical Team ────────────────────────────────
  doc.sectionHeading('8. When to Contact Medical Team');

  doc.bulletList([
    'No urine output for 4+ hours despite adequate fluid intake',
    'Accidental catheter removal or dislodgement',
    'Blood in urine (haematuria) — more than slight pinkish tinge',
    'Cloudy, foul-smelling, or dark urine — possible UTI',
    'Fever (38°C or above) with any catheter-related concern',
    'Pain, swelling, redness, or discharge at the catheter site',
    'Persistent urine leakage around the catheter',
    'John complaining of lower abdominal pain or bladder discomfort',
    'Catheter bag filling unusually quickly or slowly',
    'Any damage to the catheter or drainage system',
  ]);

  doc.alertBox(
    'CALL 000 IF:',
    'The catheter is accidentally removed and cannot be replaced. Significant bleeding from the catheter site. John shows signs of sepsis: high fever, confusion, rapid heartbeat, rapid breathing, cold/clammy skin. John is in severe pain.',
    'red',
  );

  // ─── 9. Equipment & Supplies ────────────────────────────────────────
  doc.sectionHeading('9. Equipment & Supplies');

  doc.dataTable(
    ['Item', 'Product / Details', 'Reorder'],
    [
      ['Daytime Drainage Bag', 'Conveen Active Drainage Bag 500ml (Ref: 5062)', 'Order via NDIS consumables'],
      ['Overnight Drainage Bag', 'Simpla S-3 Night Drainage Bag 2000ml (Ref: 370200)', 'Order via NDIS consumables'],
      ['Catheter Bag Straps', 'Leg straps for securing daytime bag', 'Order with bags'],
      ['Catheter Stand/Hook', 'Bedside hook for overnight bag', 'One-time purchase'],
      ['Spare Catheter', 'As per urology recommendation (size confirmed at last change)', 'Bolton Clarke supplies at change'],
      ['Sterile Gauze/Swabs', 'For cleaning catheter site', 'Order via pharmacy'],
      ['Clean Gloves', 'Non-sterile disposable gloves', 'Order in bulk — restock weekly'],
      ['Measuring Jug', 'For recording urine output', 'Keep clean — replace as needed'],
      ['Fluid Balance Chart', 'Daily recording of intake and output', 'Print from One Life Vault'],
    ],
    [40, 72, 66],
  );

  // ─── 10. Additional Considerations ──────────────────────────────────
  doc.sectionHeading('10. Additional Considerations');

  doc.bulletList([
    'John is at high risk of urinary tract infection (UTI) due to the indwelling catheter. Maintain strict hand hygiene before any catheter care.',
    'UTI signs: cloudy or foul-smelling urine, fever, confusion, increased pain. Report immediately.',
    'Encourage adequate fluid intake within the 1L/day restriction — do not restrict fluids further as this increases UTI and blockage risk.',
    'Catheter care should be performed as part of the regular personal care routine — morning and evening at minimum.',
    'If Bolton Clarke nurses identify any concerns during catheter changes, ensure their recommendations are documented and followed.',
    'All support workers must be trained in catheter care before commencing shifts with John.',
    'Maintain dignity and privacy during all catheter care procedures.',
  ]);

  // ─── 11. Staff Acknowledgement ──────────────────────────────────────
  doc.staffAcknowledgement('Catheter Management Care Plan');

  return doc.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════
// 3. WOUND MANAGEMENT CARE PLAN (5 pages)
// ═══════════════════════════════════════════════════════════════════════════
function generateWoundPlan() {
  const doc = new CarePlanPDF('Wound Management Care Plan', 'OLF-WMCP-JR-2026');

  // ─── 1. Participant Details ──────────────────────────────────────────
  doc.participantDetails();

  // ─── 2. Key Contacts ─────────────────────────────────────────────────
  doc.keyContacts();

  doc.paragraph(`Effective Date: ${DOC_DATE}  |  Revised: ${REVISED_DATE}`);
  doc.y += 2;

  // ─── 3. Wound Overview ──────────────────────────────────────────────
  doc.sectionHeading('3. Wound Overview');

  doc.infoTable([
    ['Wound Location', 'Lower limbs — bilateral (both legs)'],
    ['Wound Type', 'Chronic wounds related to severe diabetic peripheral neuropathy and poor circulation'],
    ['Wound Status', 'Ongoing management — wounds are chronic and slow-healing due to diabetes and ESKD'],
    ['Hospital Dressing', '3 times per week at The Northern Hospital (during haemodialysis appointments)'],
    ['OLF Role', 'Monitoring ONLY — One Life Foundation support workers do NOT perform dressing changes. All wound dressings are managed by hospital nursing staff.'],
    ['OT', P.ot],
  ]);

  // ─── 4. Staff Responsibilities ──────────────────────────────────────
  doc.sectionHeading('4. Staff Responsibilities — Monitoring Only');

  doc.alertBox(
    'IMPORTANT — OLF STAFF DO NOT CHANGE WOUND DRESSINGS',
    'Wound dressings are applied and changed by hospital nursing staff at The Northern Hospital during John\'s haemodialysis appointments (3 times per week). One Life Foundation support workers are responsible for MONITORING ONLY. Do NOT remove, change, or interfere with wound dressings unless instructed by a registered nurse.',
    'red',
  );

  doc.subHeading('Daily Monitoring');
  doc.bulletList([
    'Visually inspect all wound dressing sites during each personal care session.',
    'Check for: strikethrough (blood or exudate soaking through the dressing), dressing displacement, odour, swelling around the dressing edges.',
    'Record your wound observations in the progress notes — note any changes from previous observations.',
    'Ask John if he has any pain, discomfort, itching, or unusual sensations around his wound sites.',
    'Check skin surrounding the wound dressings for redness, warmth, or maceration (white, soggy skin from moisture).',
  ]);

  doc.subHeading('Bandage & Dressing Care');
  doc.bulletList([
    'Keep dressings clean and dry at all times.',
    'If a dressing becomes wet (from bathing or fluid), notify the Team Leader — it may need to be redone by a nurse.',
    'If a dressing falls off or becomes displaced, apply a clean, dry dressing pad over the wound and secure with tape or a bandage. Document and notify.',
    'Do NOT apply any creams, ointments, or solutions to the wound unless directed by the hospital wound care nurse.',
    'When assisting with personal care (sponge bath), take care to keep wound dressing sites dry.',
  ]);

  doc.subHeading('Positioning & Pressure Prevention');
  doc.bulletList([
    'John\'s lower limb wounds are worsened by prolonged pressure and poor blood flow.',
    'Reposition John every 2–3 hours to relieve pressure on wound sites.',
    'Use pressure-relieving cushions and supports for lower limbs when seated in the wheelchair.',
    'Elevate lower limbs when seated to promote blood flow and reduce swelling.',
    'Ensure pressure relief boots are worn as directed — these protect the feet and ankles from further pressure injury.',
    'When transferring, take care not to bump, scrape, or apply pressure to wound sites.',
  ]);

  // ─── 5. Hospital Dressing Schedule ──────────────────────────────────
  doc.sectionHeading('5. Hospital Dressing Schedule');

  doc.paragraph('Wound dressings are changed by nursing staff at The Northern Hospital during John\'s haemodialysis appointments. This ensures regular, specialist wound assessment and management.');

  doc.infoTable([
    ['Frequency', '3 times per week (aligned with haemodialysis schedule)'],
    ['Location', 'The Northern Hospital, 185 Cooper Street, Epping VIC 3076'],
    ['Performed By', 'Hospital nursing/wound care staff'],
    ['OLF Role', 'Transport coordination, monitoring between appointments, reporting any concerns to hospital staff'],
  ]);

  doc.paragraph('If John misses a dialysis appointment (and therefore a dressing change), notify the Team Leader immediately so alternative wound care arrangements can be made.');

  // ─── 6. Signs Requiring Immediate Escalation ───────────────────────
  doc.sectionHeading('6. Signs Requiring Immediate Escalation');

  doc.paragraph('Report ANY of the following to the Team Leader and GP/hospital immediately:');

  doc.bulletList([
    'Increased wound size or depth',
    'Increased or new discharge (exudate) — especially if purulent (thick, yellow/green)',
    'Foul or unusual odour from the wound',
    'Increased redness, warmth, or swelling around the wound',
    'Skin discolouration — darkening or blackening of wound edges (possible necrosis)',
    'Fever (38°C or above) — possible sign of wound infection becoming systemic',
    'Increased pain at the wound site (note: John has reduced sensation, so pain is a significant warning sign)',
    'Strikethrough — blood or exudate soaking through the dressing',
    'New wounds or skin breakdown anywhere on the body',
    'John reporting new or worsening tingling, numbness, or pain in his limbs',
  ]);

  doc.alertBox(
    'CRITICAL — SEPSIS WARNING SIGNS',
    'Wound infection can lead to sepsis (blood poisoning), which is life-threatening. Sepsis signs: high fever OR abnormally low temperature, confusion or disorientation, rapid heartbeat, rapid breathing, cold/clammy/mottled skin, extreme pain or discomfort. If ANY sepsis signs are present, CALL 000 IMMEDIATELY. Do not wait — sepsis can progress rapidly.',
    'red',
  );

  // ─── 7. Wound Healing & Diabetes Connection ────────────────────────
  doc.sectionHeading('7. Wound Healing & Diabetes Connection');

  doc.paragraph('John\'s wounds are directly related to his diabetes and associated complications. Understanding this connection is essential for all support workers:');

  doc.bulletList([
    'Diabetes causes poor blood circulation, especially in the extremities (legs and feet). This slows wound healing significantly.',
    'Diabetic peripheral neuropathy means John has reduced or absent sensation in his lower limbs — he may NOT feel pain from wounds, pressure, or injury.',
    'High blood glucose levels (hyperglycaemia) impair the immune system and slow wound healing. Maintaining stable BGLs is directly connected to wound outcomes.',
    'End Stage Kidney Disease (ESKD) further impairs healing due to protein loss, fluid imbalance, and reduced immunity.',
    'Haemodialysis affects blood clotting — John may bleed more easily and bruise more readily.',
    'The combination of diabetes, neuropathy, ESKD, and immobility makes John one of the highest-risk participants for wound complications.',
  ]);

  // ─── 8. Foot Care ──────────────────────────────────────────────────
  doc.sectionHeading('8. Foot Care');

  doc.bulletList([
    'Inspect both feet daily during personal care — check for redness, swelling, blisters, cracks, calluses, or new wounds.',
    'Wash feet gently with warm (NOT hot) water. Test water temperature with your elbow first — John cannot feel temperature accurately.',
    'Dry feet thoroughly, especially between the toes.',
    'Apply moisturising cream to feet (not between toes) to prevent dry, cracked skin.',
    'Ensure pressure relief boots are worn as directed.',
    'NEVER cut John\'s toenails — this should be done by a podiatrist only.',
    'NEVER use heat packs, hot water bottles, or electric blankets on John\'s feet or legs.',
    'Report ANY changes to the feet immediately — even small injuries can develop into serious wounds in diabetic patients.',
  ]);

  // ─── 9. Equipment & Supplies ────────────────────────────────────────
  doc.sectionHeading('9. Equipment & Supplies');

  doc.dataTable(
    ['Item', 'Details', 'Resupply'],
    [
      ['Wound Observation Chart', 'For daily monitoring documentation', 'Print from One Life Vault'],
      ['Clean Dressing Pads', 'Sterile, non-adherent pads for emergencies (dressing displacement)', 'Order via pharmacy'],
      ['Medical Tape / Bandage', 'For securing emergency dressings only', 'Keep small supply on hand'],
      ['Clean Gloves', 'Non-sterile disposable gloves', 'Order in bulk — restock weekly'],
      ['Pressure-Relieving Mattress', 'On hospital bed at all times', 'Check condition monthly'],
      ['Pressure Relief Boots', 'Worn to protect feet and ankles', 'Replace if worn or damaged'],
      ['Wheelchair Cushion', 'Pressure-relieving cushion for wheelchair', 'Check condition monthly'],
      ['Moisturising Cream', 'For foot care (not between toes)', 'Order via pharmacy'],
      ['Thermometer', 'For checking temperature if infection suspected', 'Keep in first aid kit'],
    ],
    [40, 72, 66],
  );

  // ─── 10. Staff Acknowledgement ──────────────────────────────────────
  doc.staffAcknowledgement('Wound Management Care Plan');

  return doc.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD & UPDATE
// ═══════════════════════════════════════════════════════════════════════════
async function uploadPDF(key, buffer) {
  const rec = FILE_RECORDS[key];
  const uint8 = new Uint8Array(buffer);

  console.log(`  Uploading ${rec.file_name} (${(uint8.length / 1024).toFixed(0)} KB)...`);

  // Upload to storage (upsert)
  const { error: uploadErr } = await sb.storage
    .from(BUCKET)
    .upload(rec.storage_path, uint8, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadErr) {
    console.error(`  UPLOAD FAILED: ${uploadErr.message}`);
    return false;
  }

  // Update file record
  const { error: updateErr } = await sb
    .from('participant_files')
    .update({
      size: uint8.length,
      notes: `Revised ${REVISED_DATE} — updated contacts (GP, Pharmacy, SC email, PM email, OT, funding ratio)`,
    })
    .eq('id', rec.id);

  if (updateErr) {
    console.error(`  DB UPDATE FAILED: ${updateErr.message}`);
    return false;
  }

  console.log(`  SUCCESS: ${rec.file_name}`);
  return true;
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== John Eric Ross — Care Plan Regeneration ===');
  console.log(`Revised: ${REVISED_DATE}`);
  console.log('');

  console.log('1. Generating Diabetes Management Plan...');
  const diabetesBuf = generateDiabetesPlan();
  await uploadPDF('diabetes', diabetesBuf);
  console.log('');

  console.log('2. Generating Catheter Management Care Plan...');
  const catheterBuf = generateCatheterPlan();
  await uploadPDF('catheter', catheterBuf);
  console.log('');

  console.log('3. Generating Wound Management Care Plan...');
  const woundBuf = generateWoundPlan();
  await uploadPDF('wound', woundBuf);
  console.log('');

  console.log('=== COMPLETE ===');
  console.log('All 3 care plans regenerated and uploaded to Supabase Storage.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
