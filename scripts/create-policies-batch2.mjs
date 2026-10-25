/**
 * create-policies-batch2.mjs
 *
 * Generates 3 NDIS Policy PDFs for One Life Foundation:
 *   1. Form118 — Workplace Health and Safety Policy
 *   2. Form119 — Medication Management Policy
 *   3. Form120 — Abuse Neglect and Exploitation Prevention Policy
 *
 * Saves each to C:/Users/kevin/Downloads/ AND uploads to Supabase Storage
 * at documents/Forms Updated/[filename].
 *
 * Usage: node scripts/create-policies-batch2.mjs
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

const BUCKET = 'documents';
const STORAGE_FOLDER = 'Forms Updated';
const DOWNLOADS = 'C:/Users/kevin/Downloads';

// ─── Colors ──────────────────────────────────────────────────────────────────
const BLUE = [30, 90, 138];        // #1E5A8A
const WHITE = [255, 255, 255];
const DARK_TEXT = [30, 41, 59];     // #1E293B
const DARK_GREY = [51, 51, 51];
const MED_GREY = [102, 102, 102];
const LIGHT_GREY = [240, 240, 240];
const TABLE_HEADER_BG = [30, 90, 138];
const TABLE_ALT_ROW = [248, 249, 250];

// ─── Page dimensions ─────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 18;
const MR = 18;
const MARGIN_T = 45;
const MARGIN_B = 22;
const CW = PAGE_W - ML - MR;

// ─── Logo ────────────────────────────────────────────────────────────────────
const logoPath = path.join(PROJECT, 'public', 'logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUrl = 'data:image/png;base64,' + logoBase64;


// ═══════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS (copied from create-policies-batch1.mjs)
// ═══════════════════════════════════════════════════════════════════════════════

class PDFBuilder {
  constructor({ docNo, title, categoryLine1, categoryLine2 }) {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.curY = MARGIN_T;
    this.docNo = docNo;
    this.title = title;
    this.categoryLine1 = categoryLine1;
    this.categoryLine2 = categoryLine2;
  }

  // ─── Header ──────────────────────────────────────────────────────────────
  drawHeader() {
    const { doc } = this;

    // Blue banner
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, PAGE_W, 22, 'F');

    // Logo
    try {
      doc.addImage(logoDataUrl, 'PNG', 15, 4, 28, 14);
    } catch {
      doc.setTextColor(...WHITE);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('OLF', 15, 12);
    }

    // "One Life Foundation"
    doc.setTextColor(...WHITE);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('One Life Foundation', 46, 10);

    // ABN line
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('ABN: 55 643 227 061  |  NDIS Registered Provider', 46, 15);

    // Category right-aligned
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(this.categoryLine1, PAGE_W - MR, 9, { align: 'right' });
    doc.setFontSize(8);
    doc.text(this.categoryLine2, PAGE_W - MR, 14, { align: 'right' });

    // Grey metadata row
    doc.setFillColor(...LIGHT_GREY);
    doc.rect(0, 22, PAGE_W, 10, 'F');

    const metaY = 28.5;
    const metaItems = [
      { label: 'DOC NO:', value: this.docNo },
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

  // ─── Footer ──────────────────────────────────────────────────────────────
  drawFooter(pageNum, totalPgs) {
    const { doc } = this;
    const footerY = PAGE_H - 10;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(ML, footerY - 3, PAGE_W - MR, footerY - 3);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MED_GREY);

    doc.text('One Life Foundation Pty Ltd  |  ABN: 55 643 227 061  |  9C Grasslands Avenue, Craigieburn VIC 3064', ML, footerY);
    doc.text('\u00A9 One Life Foundation 2026. All rights reserved.', PAGE_W / 2, footerY + 4, { align: 'center' });
    doc.text(`Page ${pageNum} of ${totalPgs}`, PAGE_W - MR, footerY, { align: 'right' });
  }

  // ─── Page management ─────────────────────────────────────────────────────
  newPage() {
    this.doc.addPage();
    this.drawHeader();
    this.curY = MARGIN_T;
  }

  ensureSpace(needed) {
    if (this.curY + needed > PAGE_H - MARGIN_B) {
      this.newPage();
    }
  }

  // ─── Text helpers ─────────────────────────────────────────────────────────
  setBody() {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...DARK_TEXT);
  }

  setBold() {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...DARK_TEXT);
  }

  /** Section heading: bold 13pt blue with underline */
  sectionHeading(text) {
    this.ensureSpace(16);
    this.curY += 10;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(...BLUE);
    this.doc.text(text, ML, this.curY);

    const tw = this.doc.getTextWidth(text);
    this.doc.setDrawColor(...BLUE);
    this.doc.setLineWidth(0.5);
    this.doc.line(ML, this.curY + 1.5, ML + tw, this.curY + 1.5);
    this.curY += 8;
  }

  /** Sub-heading: bold 11pt, 6mm before */
  subHeading(text) {
    this.ensureSpace(12);
    this.curY += 6;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(...DARK_TEXT);
    this.doc.text(text, ML, this.curY);
    this.curY += 6;
  }

  /** Write wrapped body text */
  writeBody(text, indent = 0) {
    this.setBody();
    const maxW = CW - indent;
    const lines = this.doc.splitTextToSize(text, maxW);
    const lineH = 5;

    for (const line of lines) {
      this.ensureSpace(lineH + 1);
      this.doc.text(line, ML + indent, this.curY);
      this.curY += lineH;
    }
  }

  /** Write a bullet point */
  writeBullet(text, indent = 8) {
    this.setBody();
    const bulletX = ML + indent;
    const textX = bulletX + 4;
    const maxW = CW - indent - 4;
    const lines = this.doc.splitTextToSize(text, maxW);
    const lineH = 5;

    this.ensureSpace(lines.length * lineH + 2);
    this.doc.text('\u2022', bulletX, this.curY);
    for (let i = 0; i < lines.length; i++) {
      this.doc.text(lines[i], textX, this.curY);
      this.curY += lineH;
    }
    this.curY += 0.5;
  }

  /** Write a sub-bullet (indented further) */
  writeSubBullet(text, indent = 16) {
    this.setBody();
    const bulletX = ML + indent;
    const textX = bulletX + 4;
    const maxW = CW - indent - 4;
    const lines = this.doc.splitTextToSize(text, maxW);
    const lineH = 5;

    this.ensureSpace(lines.length * lineH + 2);
    this.doc.setFontSize(9);
    this.doc.text('\u2013', bulletX, this.curY);
    this.doc.setFontSize(10);
    for (let i = 0; i < lines.length; i++) {
      this.doc.text(lines[i], textX, this.curY);
      this.curY += lineH;
    }
    this.curY += 0.5;
  }

  /** Draw a table with blue header row and alternating grey rows */
  drawTable(headers, rows, colWidths) {
    const { doc } = this;
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    const rowH = 7;
    const padding = 2;
    const fontSize = 7.5;

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
    this.ensureSpace(rowH + 5);
    let x = ML;
    const headerH = calcRowH(headers);

    doc.setFillColor(...TABLE_HEADER_BG);
    doc.rect(x, this.curY - 4, totalW, headerH, 'F');

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);

    headers.forEach((h, i) => {
      const lines = doc.splitTextToSize(String(h), colWidths[i] - padding * 2);
      lines.forEach((line, li) => {
        doc.text(line, x + padding, this.curY + (li * 4));
      });
      x += colWidths[i];
    });
    this.curY += headerH - 2;

    // Data rows
    rows.forEach((row, ri) => {
      const rH = calcRowH(row);
      this.ensureSpace(rH + 2);

      x = ML;
      if (ri % 2 === 1) {
        doc.setFillColor(...TABLE_ALT_ROW);
        doc.rect(x, this.curY - 4, totalW, rH, 'F');
      }

      // Cell borders
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      let bx = ML;
      for (let ci = 0; ci <= row.length; ci++) {
        doc.line(bx, this.curY - 4, bx, this.curY - 4 + rH);
        bx += (colWidths[ci] || 0);
      }
      doc.line(ML, this.curY - 4, ML + totalW, this.curY - 4);
      doc.line(ML, this.curY - 4 + rH, ML + totalW, this.curY - 4 + rH);

      // Cell text
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK_TEXT);

      row.forEach((cell, ci) => {
        const cellText = String(cell);
        const lines = doc.splitTextToSize(cellText, colWidths[ci] - padding * 2);
        lines.forEach((line, li) => {
          doc.text(line, x + padding, this.curY + (li * 4));
        });
        x += colWidths[ci];
      });

      this.curY += rH - 2;
    });

    this.curY += 4;
  }

  /** Draw staff acknowledgement signature table */
  drawSignatureTable(rowCount = 8) {
    this.sectionHeading('Staff Acknowledgement');
    this.writeBody('By signing below, I acknowledge that I have read and understood this policy and agree to comply with its requirements.');
    this.curY += 3;

    const headers = ['Name', 'Position', 'Signature', 'Date'];
    const colWidths = [45, 40, 52, 37];
    const rows = [];
    for (let i = 0; i < rowCount; i++) {
      rows.push(['', '', '', '']);
    }
    this.drawTable(headers, rows, colWidths);
  }

  /** Cover page with title and metadata table */
  drawCoverPage(titleText, subtitleText, metaRows) {
    this.drawHeader();
    this.curY = MARGIN_T + 5;

    // Title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(22);
    this.doc.setTextColor(...BLUE);
    const titleLines = this.doc.splitTextToSize(titleText, CW - 10);
    for (const line of titleLines) {
      this.doc.text(line, PAGE_W / 2, this.curY, { align: 'center' });
      this.curY += 10;
    }
    this.curY += 4;

    // Subtitle
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(...MED_GREY);
    const subLines = this.doc.splitTextToSize(subtitleText, CW - 20);
    for (const sl of subLines) {
      this.doc.text(sl, PAGE_W / 2, this.curY, { align: 'center' });
      this.curY += 6;
    }
    this.curY += 10;

    // Metadata table
    const metaHeaders = ['Field', 'Details'];
    this.drawTable(metaHeaders, metaRows, [50, CW - 50]);
  }

  /** Apply footers to all pages and return buffer */
  finalize() {
    const totalPgs = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPgs; i++) {
      this.doc.setPage(i);
      this.drawFooter(i, totalPgs);
    }
    return Buffer.from(this.doc.output('arraybuffer'));
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT 1: Form118 — Workplace Health and Safety Policy
// ═══════════════════════════════════════════════════════════════════════════════

function buildForm118() {
  const pdf = new PDFBuilder({
    docNo: 'Form118',
    title: 'Workplace Health and Safety Policy',
    categoryLine1: 'Policy & Procedure',
    categoryLine2: 'WHS',
  });

  // ─── COVER PAGE ──────────────────────────────────────────────────────────
  pdf.drawCoverPage(
    'Workplace Health and Safety Policy',
    'Providing a safe and healthy working environment for all staff, contractors, participants, and visitors in compliance with Victorian OHS legislation and NDIS Practice Standards',
    [
      ['Document Number', 'Form118'],
      ['Version', '1.0'],
      ['Effective Date', '1 January 2026'],
      ['Review Date', '1 January 2027'],
      ['Document Owner', 'Kevin Rae Geronimo, General Manager'],
      ['Approved By', 'Harsimran Singh, Director'],
      ['Applies To', 'All staff, contractors, visitors'],
      ['Related Legislation', 'OHS Act 2004 (Vic), OHS Regulations 2017 (Vic), Workplace Injury Rehabilitation and Compensation Act 2013'],
      ['NDIS Practice Standard', 'Standards 107/116'],
    ]
  );

  // ─── 1. PURPOSE ──────────────────────────────────────────────────────────
  pdf.newPage();
  pdf.sectionHeading('1. Purpose');
  pdf.writeBody(
    'The purpose of this policy is to establish a comprehensive framework for workplace health and safety (WHS) management at One Life Foundation Pty Ltd (OLF). OLF is committed to providing and maintaining a safe and healthy working environment for all employees, contractors, participants, and visitors, in accordance with the Occupational Health and Safety Act 2004 (Vic), the Occupational Health and Safety Regulations 2017 (Vic), and the NDIS Practice Standards.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'This policy outlines the principles, responsibilities, and procedures that govern the identification, assessment, and control of workplace hazards and risks. OLF recognises that effective health and safety management is essential to protecting the wellbeing of staff and the participants we support, and is integral to the delivery of high-quality NDIS services.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'OLF is committed to continuous improvement in WHS performance and to fostering a culture where safety is everyone\'s responsibility. This policy applies to all OLF workplaces, including the head office at 9C Grasslands Avenue, Craigieburn VIC 3064, all Supported Independent Living (SIL) properties, and any location where OLF staff deliver services.'
  );

  // ─── 2. SCOPE ────────────────────────────────────────────────────────────
  pdf.sectionHeading('2. Scope');
  pdf.writeBody('This policy applies to:');
  pdf.writeBullet('All employees of One Life Foundation (full-time, part-time, and casual)');
  pdf.writeBullet('All contractors, subcontractors, and agency staff engaged by OLF');
  pdf.writeBullet('All volunteers working under OLF direction');
  pdf.writeBullet('All NDIS participants receiving supports in OLF workplaces');
  pdf.writeBullet('All visitors to OLF premises, including family members, guardians, allied health professionals, and auditors');
  pdf.writeBullet('All OLF workplaces, including head office, SIL properties, and community settings where services are delivered');

  // ─── 3. LEGISLATION ──────────────────────────────────────────────────────
  pdf.sectionHeading('3. Legislation and Standards');
  pdf.writeBody('This policy is developed in accordance with the following legislation and standards:');
  pdf.curY += 2;

  pdf.drawTable(
    ['Legislation / Standard', 'Relevance'],
    [
      ['Occupational Health and Safety Act 2004 (Vic)', 'Primary WHS legislation in Victoria — establishes duties of employers, employees, and others in relation to workplace health and safety'],
      ['Occupational Health and Safety Regulations 2017 (Vic)', 'Provides detailed requirements for specific hazards including manual handling, hazardous substances, noise, and workplace facilities'],
      ['Workplace Injury Rehabilitation and Compensation Act 2013 (Vic)', 'Governs workers\' compensation, injury management, and return-to-work obligations for Victorian employers'],
      ['NDIS Practice Standards — Module 107', 'Human Resource Management — requires providers to maintain a safe working environment for workers'],
      ['NDIS Practice Standards — Module 116', 'Continuity of Supports — requires providers to manage risks that may impact service delivery'],
      ['NDIS Code of Conduct', 'Requires workers to act with integrity, honesty, and transparency, and to provide supports in a safe and competent manner'],
    ],
    [60, CW - 60]
  );

  // ─── 4. EMPLOYER DUTIES ──────────────────────────────────────────────────
  pdf.sectionHeading('4. Employer Duties');
  pdf.writeBody(
    'Under Section 21 of the OHS Act 2004 (Vic), OLF as an employer has a duty to provide and maintain, so far as is reasonably practicable, a working environment that is safe and without risks to health. This includes:'
  );
  pdf.curY += 2;
  pdf.writeBullet('Providing and maintaining safe plant, equipment, and systems of work');
  pdf.writeBullet('Making arrangements for ensuring safety and the absence of risks to health in connection with the use, handling, storage, or transport of substances');
  pdf.writeBullet('Maintaining the workplace in a condition that is safe and without risks to health, including safe means of access to and egress from the workplace');
  pdf.writeBullet('Providing adequate facilities for the welfare of employees at the workplace');
  pdf.writeBullet('Providing such information, instruction, training, and supervision to employees as is necessary to enable them to perform their work in a manner that is safe and without risks to health');
  pdf.writeBullet('Monitoring the health of employees and the conditions at the workplace for the purpose of preventing illness or injury');
  pdf.writeBullet('Consulting with employees and their representatives on matters relating to health and safety at the workplace');
  pdf.writeBullet('Keeping information and records relating to the health and safety of employees');
  pdf.curY += 3;
  pdf.writeBody(
    'The Director (Harsimran Singh) holds overall accountability for WHS at OLF. The General Manager (Kevin Rae Geronimo) is responsible for the day-to-day implementation of this policy. The Operations Manager (Swosthani Thapa) is responsible for ensuring compliance at the operational level, including SIL properties.'
  );

  // ─── 5. WORKER DUTIES ────────────────────────────────────────────────────
  pdf.sectionHeading('5. Worker Duties');
  pdf.writeBody(
    'Under Sections 25 and 26 of the OHS Act 2004 (Vic), employees have duties to:'
  );
  pdf.curY += 2;
  pdf.writeBullet('Take reasonable care for their own health and safety');
  pdf.writeBullet('Take reasonable care that their acts or omissions do not adversely affect the health and safety of other persons');
  pdf.writeBullet('Cooperate with the employer with respect to any action taken to comply with OHS legislation');
  pdf.writeBullet('Not intentionally or recklessly interfere with or misuse anything provided at the workplace in the interests of health, safety, or welfare');
  pdf.writeBullet('Report any hazards, incidents, injuries, or near-misses to management immediately');
  pdf.writeBullet('Use personal protective equipment (PPE) provided by OLF in accordance with training and instructions');
  pdf.writeBullet('Participate in WHS training, induction, and toolbox talks as required');
  pdf.writeBullet('Follow all OLF policies, procedures, and safe work instructions');
  pdf.curY += 3;
  pdf.writeBody(
    'Failure to comply with WHS obligations may result in disciplinary action, including verbal or written warnings, additional training requirements, or termination of employment for serious or repeated breaches.'
  );

  // ─── 6. HAZARD IDENTIFICATION ────────────────────────────────────────────
  pdf.sectionHeading('6. Hazard Identification');
  pdf.writeBody(
    'OLF uses a proactive and systematic approach to hazard identification. Hazards are identified through the following mechanisms:'
  );
  pdf.curY += 2;
  pdf.writeBullet('Regular workplace inspections: Monthly HSE (Health, Safety and Environment) inspections are conducted at all OLF properties using Form63 — HSE Workplace Inspection Checklist. Inspections cover physical environment, equipment, chemical storage, emergency equipment, and general housekeeping.');
  pdf.writeBullet('Staff reporting: All staff are encouraged and required to report hazards as soon as they are identified. Hazards may be reported verbally to a supervisor, in writing, or through the OLF reporting system. OLF maintains a hazard register to track identified hazards and control measures.');
  pdf.writeBullet('Incident analysis: All incidents, injuries, and near-misses are analysed to identify contributing hazards and systemic issues. Incident data from Form04 — Incident Report is reviewed to identify trends and recurring hazards.');
  pdf.writeBullet('Participant risk assessments: Risks specific to participants (e.g., mobility limitations, challenging behaviours, medical conditions) are identified during intake and care planning processes and documented in individual risk profiles.');
  pdf.writeBullet('Change management: Hazard assessments are conducted when changes occur in the workplace, including new participants, new staff, changes to procedures, new equipment, or building modifications.');
  pdf.writeBullet('Consultation: Workers are consulted during the hazard identification process and their input is actively sought during workplace inspections, team meetings, and management reviews.');

  // ─── 7. RISK ASSESSMENT ──────────────────────────────────────────────────
  pdf.sectionHeading('7. Risk Assessment');
  pdf.writeBody(
    'Once a hazard has been identified, OLF conducts a risk assessment to determine the level of risk and the appropriate control measures. Risk assessment involves evaluating the likelihood of harm occurring and the potential consequence (severity) of that harm.'
  );
  pdf.curY += 3;

  pdf.subHeading('7.1 Risk Matrix');
  pdf.writeBody('OLF uses the following risk matrix to assess and prioritise risks:');
  pdf.curY += 2;

  pdf.drawTable(
    ['Likelihood / Consequence', 'Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'],
    [
      ['Almost Certain', 'High', 'High', 'Extreme', 'Extreme', 'Extreme'],
      ['Likely', 'Medium', 'High', 'High', 'Extreme', 'Extreme'],
      ['Possible', 'Low', 'Medium', 'High', 'Extreme', 'Extreme'],
      ['Unlikely', 'Low', 'Low', 'Medium', 'High', 'Extreme'],
      ['Rare', 'Low', 'Low', 'Medium', 'High', 'High'],
    ],
    [34, 28, 28, 28, 28, 28]
  );

  pdf.subHeading('7.2 Risk Assessment Process');
  pdf.writeBullet('Step 1: Identify the hazard (what could cause harm?)');
  pdf.writeBullet('Step 2: Identify who might be harmed and how');
  pdf.writeBullet('Step 3: Assess the likelihood and consequence using the risk matrix');
  pdf.writeBullet('Step 4: Determine the risk rating (Low / Medium / High / Extreme)');
  pdf.writeBullet('Step 5: Identify and implement control measures using the hierarchy of controls');
  pdf.writeBullet('Step 6: Document the risk assessment and control measures');
  pdf.writeBullet('Step 7: Monitor and review the effectiveness of controls');

  // ─── 8. RISK CONTROL HIERARCHY ───────────────────────────────────────────
  pdf.sectionHeading('8. Hierarchy of Risk Controls');
  pdf.writeBody(
    'OLF applies the hierarchy of controls to manage workplace risks. Controls are implemented from the most effective (elimination) to the least effective (PPE). Higher-order controls are always preferred.'
  );
  pdf.curY += 3;

  pdf.drawTable(
    ['Level', 'Control Type', 'Example'],
    [
      ['1 (Most effective)', 'Elimination', 'Remove the hazard entirely — e.g., replace a broken piece of equipment rather than repairing it'],
      ['2', 'Substitution', 'Replace the hazard with something less hazardous — e.g., use low-toxicity cleaning products instead of harsh chemicals'],
      ['3', 'Isolation', 'Separate the hazard from people — e.g., lock chemical storage rooms, use barriers around wet floors'],
      ['4', 'Engineering Controls', 'Reduce exposure through physical changes — e.g., install mechanical hoists for participant transfers, improve ventilation'],
      ['5', 'Administrative Controls', 'Change the way work is done — e.g., safe work procedures, job rotation, training, signage, shift scheduling to prevent fatigue'],
      ['6 (Least effective)', 'Personal Protective Equipment (PPE)', 'Provide PPE as a last resort — e.g., gloves, masks, goggles, non-slip footwear. PPE does not eliminate the hazard but reduces exposure'],
    ],
    [30, 35, CW - 65]
  );

  pdf.curY += 2;
  pdf.writeBody(
    'A combination of controls may be required to adequately manage a risk. OLF reviews control measures regularly to ensure they remain effective and makes adjustments where necessary.'
  );

  // ─── 9. MANUAL HANDLING ──────────────────────────────────────────────────
  pdf.sectionHeading('9. Manual Handling');
  pdf.writeBody(
    'Manual handling is one of the most significant workplace hazards in disability support services. OLF is committed to minimising the risk of musculoskeletal injuries through safe manual handling practices.'
  );
  pdf.curY += 2;

  pdf.subHeading('9.1 General Principles');
  pdf.writeBullet('Avoid manual handling where reasonably practicable by using mechanical aids (e.g., hoists, slide sheets, transfer belts)');
  pdf.writeBullet('Where manual handling cannot be avoided, apply safe lifting techniques: bend at the knees, keep the load close to the body, avoid twisting the spine');
  pdf.writeBullet('Assess the load before lifting — consider weight, size, shape, grip, and distance');
  pdf.writeBullet('Ask for assistance when the task exceeds one person\'s safe capacity');

  pdf.subHeading('9.2 Participant Transfers');
  pdf.writeBullet('All participant transfer requirements are documented in individual care plans with specific methods and equipment identified');
  pdf.writeBullet('Mechanical hoists must be used for participants who are non-weight-bearing or require full lifting assistance');
  pdf.writeBullet('Two-person assists are required for all high-dependency transfers where mechanical hoists are not available or appropriate');
  pdf.writeBullet('No manual lifting policy applies for high-dependency participants — mechanical aids must be used');
  pdf.writeBullet('Hoist slings must be checked for wear and damage before each use and replaced as required');
  pdf.writeBullet('Staff must be trained and assessed as competent in hoist operation before using equipment independently');

  pdf.subHeading('9.3 Training');
  pdf.writeBullet('All staff receive manual handling training during induction');
  pdf.writeBullet('Refresher training is provided annually or when changes occur (e.g., new equipment, new participant needs)');
  pdf.writeBullet('Training covers: body mechanics, safe lifting techniques, use of mechanical aids, individual participant transfer plans');

  // ─── 10. INFECTION CONTROL ───────────────────────────────────────────────
  pdf.sectionHeading('10. Infection Control');
  pdf.writeBody(
    'OLF maintains robust infection prevention and control practices to protect the health of staff, participants, and visitors. Detailed infection control procedures are set out in Form123 — Infection Control Policy. The following key principles apply:'
  );
  pdf.curY += 2;

  pdf.subHeading('10.1 Hand Hygiene');
  pdf.writeBullet('Hand hygiene is the single most effective measure for preventing the spread of infection');
  pdf.writeBullet('Staff must wash hands with soap and water or use alcohol-based hand sanitiser: before and after providing personal care, before preparing or serving food, after using the toilet, after contact with body fluids or contaminated surfaces, before and after wearing gloves');
  pdf.writeBullet('Hand hygiene posters are displayed at all handwashing stations in OLF properties');

  pdf.subHeading('10.2 Personal Protective Equipment (PPE)');
  pdf.writeBullet('Gloves: worn for contact with body fluids, broken skin, mucous membranes, or contaminated surfaces — changed between tasks and between participants');
  pdf.writeBullet('Aprons/gowns: worn when there is risk of clothing contamination (e.g., during personal care involving incontinence management)');
  pdf.writeBullet('Masks: worn when there is risk of airborne transmission or when a participant or staff member has respiratory symptoms');
  pdf.writeBullet('Eye protection: worn when there is risk of splash or spray of body fluids');

  pdf.subHeading('10.3 Sharps Disposal');
  pdf.writeBullet('All sharps (needles, lancets, razors) must be disposed of immediately after use in an approved yellow sharps container');
  pdf.writeBullet('Sharps containers must not be filled beyond the marked fill line');
  pdf.writeBullet('Used sharps containers are collected by an approved waste contractor');
  pdf.writeBullet('Staff must never recap, bend, or break needles');

  pdf.subHeading('10.4 Cleaning Protocols');
  pdf.writeBullet('Routine cleaning of all OLF properties is conducted in accordance with cleaning schedules');
  pdf.writeBullet('Spills of blood or body fluids are cleaned immediately using the spill kit procedure');
  pdf.writeBullet('High-touch surfaces (door handles, light switches, taps, handrails) are cleaned and disinfected daily');
  pdf.writeBullet('Laundry contaminated with body fluids is washed separately on a hot wash cycle');

  // ─── 11. EMERGENCY MANAGEMENT ────────────────────────────────────────────
  pdf.sectionHeading('11. Emergency Management');
  pdf.writeBody(
    'OLF maintains emergency management procedures to ensure the safety of all persons at OLF workplaces. Detailed emergency procedures are documented in Form82 — Emergency Management Plan.'
  );
  pdf.curY += 2;

  pdf.subHeading('11.1 Fire Safety');
  pdf.writeBullet('All OLF properties are equipped with smoke detectors, fire extinguishers, and fire blankets');
  pdf.writeBullet('Fire evacuation plans are displayed in prominent locations at all properties');
  pdf.writeBullet('Fire drills are conducted every six months at all SIL properties, with results documented');
  pdf.writeBullet('Staff are trained in the use of fire extinguishers and fire blankets during induction');

  pdf.subHeading('11.2 Evacuation Procedures');
  pdf.writeBullet('Each OLF property has a documented Personal Emergency Evacuation Plan (PEEP) for each participant, considering their individual mobility and communication needs');
  pdf.writeBullet('Assembly points are designated for each property');
  pdf.writeBullet('Staff are trained in evacuation procedures, including assisting participants with mobility impairments');
  pdf.writeBullet('Evacuation practice drills are documented using the emergency drill record');

  pdf.subHeading('11.3 First Aid');
  pdf.writeBullet('First aid kits are maintained at all OLF properties, checked monthly, and restocked as required');
  pdf.writeBullet('At least one staff member per shift must hold a current first aid certificate (HLTAID011 Provide First Aid)');
  pdf.writeBullet('All staff are required to maintain current first aid and CPR certification');

  pdf.subHeading('11.4 Emergency Contacts');
  pdf.writeBullet('Emergency contact lists are displayed at all OLF properties, including: 000 (emergency services), Poisons Information Centre (13 11 26), local hospital, OLF management contacts');
  pdf.writeBullet('Each participant\'s emergency contacts are documented in their care plan and readily accessible to on-shift staff');

  // ─── 12. INCIDENT & INJURY REPORTING ─────────────────────────────────────
  pdf.sectionHeading('12. Incident and Injury Reporting');
  pdf.writeBody(
    'All workplace incidents, injuries, near-misses, and hazards must be reported and documented. OLF\'s incident management procedures ensure that incidents are responded to promptly, investigated thoroughly, and that corrective actions are implemented to prevent recurrence.'
  );
  pdf.curY += 2;

  pdf.subHeading('12.1 Reporting Requirements');
  pdf.writeBullet('All incidents (including near-misses) must be reported to the on-shift supervisor immediately and documented using Form04 — Incident Report within 24 hours');
  pdf.writeBullet('The Incident Register (Form11) is maintained by the Operations Manager and reviewed monthly');
  pdf.writeBullet('Serious incidents are escalated to the Director and General Manager immediately');

  pdf.subHeading('12.2 WorkSafe Notification');
  pdf.writeBody('OLF must notify WorkSafe Victoria immediately (as soon as practicable) when the following occur:');
  pdf.writeBullet('Death of any person at the workplace');
  pdf.writeBullet('Serious injury requiring immediate medical treatment (e.g., amputation, serious burns, spinal injury, loss of consciousness)');
  pdf.writeBullet('Dangerous incidents (e.g., collapse of a structure, uncontrolled explosion, electric shock)');
  pdf.curY += 2;
  pdf.writeBody('WorkSafe notification is made by the Director or General Manager. The incident scene must be preserved until a WorkSafe inspector advises otherwise, unless preservation would cause further risk to any person.');

  pdf.subHeading('12.3 Workers Compensation');
  pdf.writeBullet('OLF maintains current workers\' compensation insurance as required by the Workplace Injury Rehabilitation and Compensation Act 2013');
  pdf.writeBullet('Injured workers are provided with a Workers\' Compensation Claim Form within 3 business days of being notified of the injury');
  pdf.writeBullet('OLF supports injured workers through return-to-work programs, including suitable duties and gradual return where appropriate');
  pdf.writeBullet('The General Manager coordinates return-to-work plans in consultation with the treating medical practitioner and the worker');

  // ─── 13. WORKPLACE INSPECTIONS ───────────────────────────────────────────
  pdf.sectionHeading('13. Workplace Inspections');
  pdf.writeBody(
    'Regular workplace inspections are essential to identifying hazards and ensuring compliance with WHS standards. OLF conducts the following inspections:'
  );
  pdf.curY += 2;

  pdf.drawTable(
    ['Inspection Type', 'Frequency', 'Conducted By', 'Documentation'],
    [
      ['HSE Workplace Inspection', 'Monthly', 'Operations Manager / House Supervisor', 'Form63 — HSE Workplace Inspection Checklist'],
      ['Annual Property Inspection', 'Annually', 'General Manager', 'Property Inspection Report'],
      ['Fire Safety Equipment Check', 'Monthly', 'House Supervisor', 'Fire Equipment Register'],
      ['First Aid Kit Check', 'Monthly', 'On-shift staff', 'First Aid Kit Checklist'],
      ['Emergency Equipment Check', 'Quarterly', 'Operations Manager', 'Emergency Equipment Register'],
    ],
    [38, 24, 42, CW - 104]
  );

  pdf.curY += 2;
  pdf.writeBody(
    'Inspection findings are documented and actioned promptly. Hazards identified during inspections are recorded in the hazard register with assigned responsibility and target completion dates. Critical hazards are actioned immediately.'
  );

  // ─── 14. TRAINING ────────────────────────────────────────────────────────
  pdf.sectionHeading('14. Training');
  pdf.writeBody(
    'OLF provides WHS training to ensure all staff are competent and informed about their safety responsibilities.'
  );
  pdf.curY += 2;

  pdf.subHeading('14.1 Induction Training');
  pdf.writeBody('All new staff receive WHS induction training before commencing duties, covering:');
  pdf.writeBullet('OLF WHS policy and procedures');
  pdf.writeBullet('Hazard identification and reporting');
  pdf.writeBullet('Emergency procedures (fire, evacuation, first aid)');
  pdf.writeBullet('Manual handling and safe lifting techniques');
  pdf.writeBullet('Infection control and PPE use');
  pdf.writeBullet('Incident reporting procedures');
  pdf.writeBullet('Worker rights and responsibilities under OHS legislation');

  pdf.subHeading('14.2 Ongoing Training');
  pdf.writeBullet('Manual handling training: provided at induction and refreshed annually');
  pdf.writeBullet('First aid and CPR: all staff must maintain current certification (renewed every 3 years for first aid, annually for CPR)');
  pdf.writeBullet('Fire safety and emergency procedures: refreshed annually and after any emergency incident');
  pdf.writeBullet('Infection control: refreshed annually');
  pdf.writeBullet('Specific competencies: additional training for specialised tasks (e.g., hoist operation, medication administration, behaviour support)');

  pdf.subHeading('14.3 Training Records');
  pdf.writeBody('All training is documented in the staff training register (Form35 — Training Register). Training records are maintained in the One Life Vault system and include the training topic, date, provider, and staff attendance.');

  // ─── 15. CONSULTATION ────────────────────────────────────────────────────
  pdf.sectionHeading('15. Consultation');
  pdf.writeBody(
    'OLF is committed to consulting with workers on WHS matters as required by Part 7 of the OHS Act 2004 (Vic). Consultation occurs through the following mechanisms:'
  );
  pdf.curY += 2;
  pdf.writeBullet('WHS matters are a standing agenda item at monthly management review meetings');
  pdf.writeBullet('Workers are consulted when changes that may affect their health and safety are proposed (e.g., new procedures, new equipment, building modifications)');
  pdf.writeBullet('Workers are encouraged to raise WHS concerns at any time, without fear of reprisal');
  pdf.writeBullet('Worker input is sought on safety improvements, including during workplace inspections');
  pdf.writeBullet('Feedback on WHS matters is considered and actioned, with outcomes communicated to workers');
  pdf.writeBullet('Where a health and safety representative (HSR) is elected, OLF supports the HSR in performing their functions, including providing access to training');

  // ─── 16. RELATED DOCUMENTS ───────────────────────────────────────────────
  pdf.sectionHeading('16. Related Documents');
  pdf.drawTable(
    ['Document', 'Reference'],
    [
      ['Workplace Health & Safety Declaration', 'Form01'],
      ['Incident Report', 'Form04'],
      ['Incident Register', 'Form11'],
      ['Staff Induction Manual', 'Form14'],
      ['Training Register', 'Form35'],
      ['HSE Workplace Inspection Checklist', 'Form63'],
      ['Emergency Management Plan', 'Form82'],
      ['Infection Control Policy', 'Form123'],
      ['OHS Act 2004 (Vic)', 'Victorian Legislation'],
      ['OHS Regulations 2017 (Vic)', 'Victorian Legislation'],
      ['Workplace Injury Rehabilitation and Compensation Act 2013', 'Victorian Legislation'],
    ],
    [100, CW - 100]
  );

  // ─── 17. STAFF ACKNOWLEDGEMENT ───────────────────────────────────────────
  pdf.drawSignatureTable(8);

  return pdf.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT 2: Form119 — Medication Management Policy
// ═══════════════════════════════════════════════════════════════════════════════

function buildForm119() {
  const pdf = new PDFBuilder({
    docNo: 'Form119',
    title: 'Medication Management Policy',
    categoryLine1: 'Policy & Procedure',
    categoryLine2: 'Clinical Governance',
  });

  // ─── COVER PAGE ──────────────────────────────────────────────────────────
  pdf.drawCoverPage(
    'Medication Management Policy',
    'Ensuring the safe, effective, and accountable management of medications for NDIS participants in accordance with Victorian legislation and NDIS Practice Standards',
    [
      ['Document Number', 'Form119'],
      ['Version', '1.0'],
      ['Effective Date', '1 January 2026'],
      ['Review Date', '1 January 2027'],
      ['Document Owner', 'Swosthani Thapa, Operations Manager'],
      ['Approved By', 'Harsimran Singh, Director'],
      ['Applies To', 'All staff administering or assisting with medications'],
      ['Related Legislation', 'Drugs Poisons and Controlled Substances Act 1981 (Vic), Health Practitioner Regulation National Law'],
      ['NDIS Practice Standard', 'Module 1 — Rights and Responsibilities'],
    ]
  );

  // ─── 1. PURPOSE ──────────────────────────────────────────────────────────
  pdf.newPage();
  pdf.sectionHeading('1. Purpose');
  pdf.writeBody(
    'The purpose of this policy is to ensure the safe, effective, and accountable management of medications for NDIS participants supported by One Life Foundation Pty Ltd (OLF). Medication management is a critical component of high-quality care, and errors in medication administration can have serious and potentially life-threatening consequences.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'This policy establishes the standards, procedures, and responsibilities for all aspects of medication management, including storage, administration, documentation, incident response, and disposal. OLF is committed to ensuring that all medication practices comply with the Drugs, Poisons and Controlled Substances Act 1981 (Vic), the Health Practitioner Regulation National Law, and the NDIS Practice Standards.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'OLF recognises that participants have the right to receive their prescribed medications safely and on time, and that staff who administer or assist with medications must be appropriately trained and assessed as competent.'
  );

  // ─── 2. SCOPE ────────────────────────────────────────────────────────────
  pdf.sectionHeading('2. Scope');
  pdf.writeBody('This policy applies to:');
  pdf.writeBullet('All OLF employees who administer, assist with, or prompt participants to take medications');
  pdf.writeBullet('All medications prescribed or recommended for participants, including prescription medications, over-the-counter medications, complementary medicines, and supplements');
  pdf.writeBullet('All OLF service delivery locations, including SIL properties, head office, and community settings');
  pdf.writeBullet('All forms of medication, including oral, topical, inhaled, injected, and transdermal medications');
  pdf.writeBullet('All controlled substances (Schedule 8 medications) administered at OLF properties');

  // ─── 3. DEFINITIONS ──────────────────────────────────────────────────────
  pdf.sectionHeading('3. Definitions');
  pdf.drawTable(
    ['Term', 'Definition'],
    [
      ['Administer', 'To give a medication to a person, including preparing the dose and ensuring it is taken. Requires a medication administration certificate.'],
      ['Assist', 'To help a person take their medication when they are unable to do so independently (e.g., opening a Webster pack, placing medication in the person\'s hand). Requires training but not necessarily a medication certificate.'],
      ['Prompt', 'To remind a person to take their medication. The person is able to self-administer but may need a verbal or visual reminder. Does not require a medication certificate.'],
      ['PRN', 'Pro Re Nata (Latin for "as needed") — medications prescribed to be taken only when specific conditions or symptoms occur, rather than on a regular schedule.'],
      ['Schedule 8 (S8)', 'Controlled drugs (e.g., opioids, benzodiazepines, stimulants) that are subject to additional legal controls under the Drugs, Poisons and Controlled Substances Act 1981. Require a separate locked storage compartment and a dedicated register.'],
      ['Webster Pack', 'A dose administration aid (blister pack) prepared by a pharmacist that organises medications by day and time of administration.'],
      ['Standing Orders', 'Written instructions from a medical practitioner that authorise the administration of specified medications under defined circumstances without the need for a new prescription each time.'],
      ['Medication Chart', 'A document listing all of a participant\'s current medications, dosages, routes, and times of administration. Must be signed by the prescribing doctor.'],
    ],
    [40, CW - 40]
  );

  // ─── 4. LEGISLATION ──────────────────────────────────────────────────────
  pdf.sectionHeading('4. Legislation');
  pdf.writeBody('This policy is developed in accordance with the following legislation:');
  pdf.curY += 2;
  pdf.writeBullet('Drugs, Poisons and Controlled Substances Act 1981 (Vic) — governs the manufacture, supply, storage, and administration of drugs and poisons in Victoria');
  pdf.writeBullet('Drugs, Poisons and Controlled Substances Regulations 2017 (Vic) — provides detailed requirements for the handling of scheduled substances');
  pdf.writeBullet('Health Practitioner Regulation National Law — regulates the practice of health professionals, including nurses and pharmacists');
  pdf.writeBullet('NDIS Practice Standards — Module 1 (Rights and Responsibilities) — requires providers to ensure participants receive safe and appropriate supports');
  pdf.writeBullet('NDIS Code of Conduct — requires workers to provide supports in a safe and competent manner');

  // ─── 5. STAFF COMPETENCY ─────────────────────────────────────────────────
  pdf.sectionHeading('5. Staff Competency');
  pdf.writeBody(
    'OLF requires all staff involved in medication administration to demonstrate and maintain competency. The following requirements apply:'
  );
  pdf.curY += 2;

  pdf.subHeading('5.1 Medication Administration Certificate');
  pdf.writeBullet('All staff who administer medications must hold a current medication administration certificate (e.g., HLTHPS006 Assist Clients with Medication or equivalent)');
  pdf.writeBullet('The certificate must be obtained before the staff member is permitted to administer medications independently');
  pdf.writeBullet('A copy of the certificate is filed in the staff member\'s personnel record and recorded in the training register (Form35)');

  pdf.subHeading('5.2 Annual Competency Reassessment');
  pdf.writeBullet('All staff who administer medications must undergo an annual competency reassessment');
  pdf.writeBullet('Reassessment includes a practical observation of medication administration and a knowledge assessment covering the 7 Rights, storage requirements, and incident response');
  pdf.writeBullet('Staff who do not pass the competency reassessment are prohibited from administering medications until retraining is completed and competency is demonstrated');

  pdf.subHeading('5.3 Specific Competencies');
  pdf.writeBullet('Insulin administration and BGL monitoring: staff must complete specific training in blood glucose level (BGL) monitoring and insulin injection before administering insulin to any participant');
  pdf.writeBullet('Schedule 8 medications: staff must complete specific training in the handling, administration, documentation, and disposal of S8 medications');
  pdf.writeBullet('Specialist medications: for any medication requiring specialised knowledge (e.g., buccal midazolam for seizures), staff must receive individual training from a qualified health professional and be assessed as competent before administration');

  // ─── 6. THE 7 RIGHTS ─────────────────────────────────────────────────────
  pdf.sectionHeading('6. The 7 Rights of Medication Administration');
  pdf.writeBody(
    'OLF staff must verify all 7 Rights before every medication administration. Failure to check any of the 7 Rights constitutes a medication error and must be reported.'
  );
  pdf.curY += 3;

  pdf.drawTable(
    ['Right', 'Description', 'Verification Method'],
    [
      ['1. Right Person', 'The medication is given to the correct participant', 'Check the participant\'s name on the medication chart and Webster pack. Confirm identity verbally or visually.'],
      ['2. Right Medication', 'The correct medication is selected', 'Compare the medication name on the Webster pack / bottle to the medication chart. Check spelling carefully.'],
      ['3. Right Dose', 'The correct dose is administered', 'Verify the dose on the medication chart. Do not alter the dose without medical authority.'],
      ['4. Right Route', 'The medication is given via the correct route', 'Check the medication chart for the prescribed route (oral, topical, sublingual, inhaled, injected, etc.).'],
      ['5. Right Time', 'The medication is given at the correct time', 'Administer within 30 minutes of the prescribed time (unless otherwise directed). Check the medication chart for timing.'],
      ['6. Right Reason', 'The reason for the medication is understood', 'Staff must know the purpose of each medication being administered. Refer to the care plan and medication chart.'],
      ['7. Right Documentation', 'Administration is documented immediately', 'Record in the daily medication administration record immediately after giving. Never pre-sign.'],
    ],
    [28, 42, CW - 70]
  );

  // ─── 7. MEDICATION STORAGE ───────────────────────────────────────────────
  pdf.sectionHeading('7. Medication Storage');
  pdf.writeBody(
    'Proper storage of medications is essential to maintain their efficacy and safety. OLF maintains the following storage requirements:'
  );
  pdf.curY += 2;

  pdf.subHeading('7.1 General Storage');
  pdf.writeBullet('All medications must be stored in a locked medication cabinet, accessible only to authorised staff');
  pdf.writeBullet('The medication cabinet must be maintained at room temperature (15\u201325\u00B0C) and away from direct sunlight, moisture, and heat');
  pdf.writeBullet('Each participant\'s medications must be clearly labelled and separated from other participants\' medications');
  pdf.writeBullet('Medications must be stored in their original packaging with the pharmacy label intact');

  pdf.subHeading('7.2 Refrigerated Medications');
  pdf.writeBullet('Medications requiring refrigeration (e.g., insulin, certain antibiotics) must be stored in a dedicated medication fridge or a clearly designated section of the household fridge');
  pdf.writeBullet('The fridge temperature must be maintained between 2\u20138\u00B0C and monitored daily');
  pdf.writeBullet('A fridge temperature log must be maintained and reviewed weekly by the house supervisor');

  pdf.subHeading('7.3 Schedule 8 (Controlled Substances) Storage');
  pdf.writeBullet('S8 medications must be stored in a separate locked compartment within the medication cabinet (a lock within a lock)');
  pdf.writeBullet('Only authorised staff may access S8 medications');
  pdf.writeBullet('A dedicated S8 register must be maintained, recording every receipt, administration, and disposal of S8 medications');
  pdf.writeBullet('S8 stock must be counted at each shift handover and any discrepancy reported immediately to management');

  pdf.subHeading('7.4 Expiry Date Checks');
  pdf.writeBullet('Expiry dates must be checked monthly by the house supervisor during the medication cabinet audit');
  pdf.writeBullet('Expired medications must be removed from the cabinet immediately and returned to the pharmacy for disposal');
  pdf.writeBullet('Staff must check the expiry date before every administration');

  // ─── 8. ADMINISTRATION PROCEDURE ─────────────────────────────────────────
  pdf.sectionHeading('8. Administration Procedure');
  pdf.writeBody(
    'The following step-by-step procedure must be followed for every medication administration:'
  );
  pdf.curY += 2;

  pdf.writeBullet('Step 1: Wash hands and prepare a clean surface');
  pdf.writeBullet('Step 2: Retrieve the participant\'s medication chart and check for any changes or updates');
  pdf.writeBullet('Step 3: Retrieve the participant\'s medications from the locked cabinet');
  pdf.writeBullet('Step 4: Verify the 7 Rights — right person, right medication, right dose, right route, right time, right reason, right documentation');
  pdf.writeBullet('Step 5: Prepare the medication (e.g., pop the blister, measure the liquid, draw up the injection)');
  pdf.writeBullet('Step 6: Administer the medication to the participant and ensure it is taken (e.g., observe the participant swallowing oral medications)');
  pdf.writeBullet('Step 7: Document the administration immediately in the daily medication administration record — record the date, time, medication, dose, route, and the staff member\'s signature');
  pdf.writeBullet('Step 8: Observe the participant for any adverse effects for an appropriate period following administration');
  pdf.writeBullet('Step 9: Return remaining medications to the locked cabinet and secure');
  pdf.writeBullet('Step 10: If any adverse effect is observed, follow the medication incident procedure (Section 11)');

  // ─── 9. PRN MEDICATIONS ──────────────────────────────────────────────────
  pdf.sectionHeading('9. PRN (As Needed) Medications');
  pdf.writeBody(
    'PRN medications require additional considerations to ensure they are administered appropriately and safely.'
  );
  pdf.curY += 2;

  pdf.writeBullet('The criteria for administering each PRN medication must be clearly documented in the participant\'s care plan (e.g., "Paracetamol 500mg PRN for headache or temperature above 38\u00B0C")');
  pdf.writeBullet('The maximum number of doses per 24-hour period must be documented on the medication chart (e.g., "maximum 4 doses in 24 hours")');
  pdf.writeBullet('The minimum time interval between doses must be documented and observed (e.g., "minimum 4 hours between doses")');
  pdf.writeBullet('Before administering a PRN medication, staff must assess the participant\'s condition and determine whether the criteria for administration are met');
  pdf.writeBullet('The reason for each PRN administration must be documented in the medication administration record (e.g., "participant complained of headache, pain rated 6/10")');
  pdf.writeBullet('Staff must record the effectiveness of the PRN medication after an appropriate interval (e.g., "30 minutes post-administration: participant reports headache resolved, pain 0/10")');
  pdf.writeBullet('If a PRN medication is being administered frequently (more than 3 times per week on a regular basis), staff must report this to the house supervisor for review by the GP');
  pdf.writeBullet('PRN administration is recorded in the PRN Medication Register (Form107)');

  // ─── 10. INSULIN AND BGL MANAGEMENT ──────────────────────────────────────
  pdf.sectionHeading('10. Insulin and BGL Management');
  pdf.writeBody(
    'Insulin administration and blood glucose level (BGL) monitoring require specific skills and carry significant risk if performed incorrectly. OLF applies the following procedures:'
  );
  pdf.curY += 2;

  pdf.subHeading('10.1 BGL Monitoring');
  pdf.writeBullet('BGL monitoring is performed in accordance with the participant\'s individual Diabetes Management Plan');
  pdf.writeBullet('Staff must be trained and assessed as competent in BGL monitoring before performing the procedure');
  pdf.writeBullet('BGL results are documented in the participant\'s daily record and on the BGL monitoring chart');
  pdf.writeBullet('Abnormal BGL results (below 4 mmol/L or above 15 mmol/L) must be escalated according to the participant\'s Diabetes Management Plan');

  pdf.subHeading('10.2 Insulin Administration');
  pdf.writeBullet('Insulin is administered only by staff who have completed specific insulin administration training');
  pdf.writeBullet('The insulin dose is determined by the BGL result and the participant\'s Diabetes Management Plan (sliding scale or fixed dose as prescribed)');
  pdf.writeBullet('Insulin must be administered using the correct device (insulin pen or syringe as prescribed)');
  pdf.writeBullet('Injection sites must be rotated as per the care plan to prevent lipodystrophy');
  pdf.writeBullet('Used insulin needles/lancets are disposed of in the sharps container immediately');

  pdf.subHeading('10.3 Hypoglycaemia and Hyperglycaemia Protocols');
  pdf.writeBody('Hypoglycaemia (BGL below 4 mmol/L):');
  pdf.writeBullet('If conscious: give fast-acting sugar immediately (e.g., jelly beans, juice, glucose tablets) — recheck BGL in 15 minutes');
  pdf.writeBullet('If unconscious: place in recovery position, call 000, do NOT give food or drink by mouth');
  pdf.writeBullet('Document the episode and notify the GP and management');
  pdf.curY += 2;
  pdf.writeBody('Hyperglycaemia (BGL above 15 mmol/L):');
  pdf.writeBullet('Follow the participant\'s Diabetes Management Plan for corrective action');
  pdf.writeBullet('Encourage fluid intake (water)');
  pdf.writeBullet('Monitor for signs of diabetic ketoacidosis (nausea, vomiting, fruity breath, confusion)');
  pdf.writeBullet('If BGL remains above 20 mmol/L or symptoms of DKA are present, call 000');
  pdf.writeBullet('Document and notify the GP and management');

  // ─── 11. MEDICATION INCIDENTS ────────────────────────────────────────────
  pdf.sectionHeading('11. Medication Incidents');
  pdf.writeBody(
    'A medication incident is any event involving medication that deviates from the prescribed regimen. All medication incidents must be reported and investigated. Examples include:'
  );
  pdf.curY += 2;

  pdf.drawTable(
    ['Incident Type', 'Description', 'Immediate Action'],
    [
      ['Missed Dose', 'A scheduled medication was not administered at the required time', 'Administer if within safe timeframe (check chart/pharmacist). If not, document as missed and notify GP.'],
      ['Wrong Dose', 'An incorrect dose was administered (too much or too little)', 'Observe for adverse effects. Contact Poisons Info (13 11 26) or 000 if overdose. Notify GP and management.'],
      ['Wrong Medication', 'The wrong medication was given to the participant', 'Contact Poisons Info (13 11 26) immediately. Monitor for adverse effects. Call 000 if symptoms develop. Notify GP and management.'],
      ['Wrong Person', 'A medication was given to the wrong participant', 'Contact Poisons Info (13 11 26) immediately. Monitor both participants. Notify GP and management. Call 000 if adverse effects.'],
      ['Adverse Reaction', 'The participant experiences an unexpected reaction to a medication', 'Attend to participant. Call 000 if anaphylaxis or severe reaction. Notify GP. Do not administer further doses until reviewed.'],
      ['Refusal', 'The participant refuses to take a prescribed medication', 'Document refusal. Do not force. Inform GP if critical medication or repeated refusal. Notify management.'],
    ],
    [28, 52, CW - 80]
  );

  pdf.curY += 2;
  pdf.writeBody('For all medication incidents:');
  pdf.writeBullet('Complete Form41 — Medication Incident Report immediately');
  pdf.writeBullet('Notify the house supervisor and the Operations Manager');
  pdf.writeBullet('Notify the participant\'s GP as soon as practicable');
  pdf.writeBullet('Review the incident to identify root causes and implement corrective actions');
  pdf.writeBullet('Record the incident in the Incident Register (Form11)');

  // ─── 12. DISPOSAL ────────────────────────────────────────────────────────
  pdf.sectionHeading('12. Medication Disposal');
  pdf.writeBody(
    'Safe disposal of medications is essential to prevent misuse, accidental ingestion, and environmental harm.'
  );
  pdf.curY += 2;

  pdf.writeBullet('Unused, expired, or discontinued medications must be returned to the pharmacy for safe disposal — staff must not dispose of medications in household waste or flush down the drain');
  pdf.writeBullet('Sharps (needles, lancets, insulin pens with needles) must be placed in an approved yellow sharps container immediately after use');
  pdf.writeBullet('Full sharps containers are collected and disposed of by an approved waste management contractor');
  pdf.writeBullet('Schedule 8 medications: disposal must be witnessed by two staff members, with both signing the S8 register to record the date, medication name, quantity disposed, method of disposal, and reason');
  pdf.writeBullet('A record of all medication disposals is maintained, including the pharmacy receipt or disposal certificate where available');

  // ─── 13. MEDICATION REVIEWS ──────────────────────────────────────────────
  pdf.sectionHeading('13. Medication Reviews');
  pdf.writeBody(
    'Regular medication reviews are essential to ensure that the participant\'s medication regimen remains appropriate, effective, and safe.'
  );
  pdf.curY += 2;

  pdf.writeBullet('A GP or pharmacist review of all medications must occur at a minimum annually');
  pdf.writeBullet('A medication review must be requested following any hospital admission or discharge');
  pdf.writeBullet('A medication review must occur following any medication incident');
  pdf.writeBullet('A medication review should be considered whenever a participant\'s health condition changes significantly');
  pdf.writeBullet('OLF staff support medication reviews by providing accurate records of medication administration, PRN usage patterns, and any observed side effects');
  pdf.writeBullet('Outcomes of medication reviews are documented and the participant\'s medication chart is updated accordingly');
  pdf.writeBullet('Staff are informed of any changes resulting from medication reviews during shift handover');

  // ─── 14. DOCUMENTATION ───────────────────────────────────────────────────
  pdf.sectionHeading('14. Documentation');
  pdf.writeBody(
    'Accurate and timely documentation is essential for safe medication management. The following documentation must be maintained:'
  );
  pdf.curY += 2;

  pdf.drawTable(
    ['Document', 'Purpose', 'Maintained By'],
    [
      ['Medication Chart', 'Lists all current medications, doses, routes, and times — signed by prescribing doctor', 'House Supervisor / GP'],
      ['Daily Administration Record', 'Records each medication administered, with date, time, dose, route, and staff signature', 'Administering Staff'],
      ['PRN Medication Register (Form107)', 'Records each PRN administration with reason, dose, time, and effectiveness', 'Administering Staff'],
      ['S8 Register', 'Records receipt, administration, and disposal of all Schedule 8 medications', 'Administering Staff'],
      ['Medication Incident Report (Form41)', 'Documents any medication error, near-miss, or adverse reaction', 'Administering Staff / Supervisor'],
      ['Medication Risk Assessment (Form108)', 'Assesses risks related to the participant\'s medication regimen', 'Operations Manager'],
      ['Fridge Temperature Log', 'Daily record of medication fridge temperature', 'On-shift Staff'],
      ['Diabetes Management Plan', 'Individual plan for BGL monitoring and insulin administration', 'GP / Nurse'],
    ],
    [45, 62, CW - 107]
  );

  // ─── 15. RELATED DOCUMENTS ───────────────────────────────────────────────
  pdf.sectionHeading('15. Related Documents');
  pdf.drawTable(
    ['Document', 'Reference'],
    [
      ['Medication Incident Report', 'Form41'],
      ['PRN Medication Register', 'Form107'],
      ['Medication Risk Assessment', 'Form108'],
      ['Incident Report', 'Form04'],
      ['Incident Register', 'Form11'],
      ['Training Register', 'Form35'],
      ['Individual Care Plans', 'Participant Files'],
      ['Diabetes Management Plans', 'Participant Files'],
      ['Drugs Poisons and Controlled Substances Act 1981 (Vic)', 'Victorian Legislation'],
      ['NDIS Practice Standards Module 1', 'NDIS Commission'],
    ],
    [100, CW - 100]
  );

  // ─── 16. STAFF ACKNOWLEDGEMENT ───────────────────────────────────────────
  pdf.drawSignatureTable(8);

  return pdf.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT 3: Form120 — Abuse Neglect and Exploitation Prevention Policy
// ═══════════════════════════════════════════════════════════════════════════════

function buildForm120() {
  const pdf = new PDFBuilder({
    docNo: 'Form120',
    title: 'Abuse, Neglect and Exploitation Prevention Policy',
    categoryLine1: 'Policy & Procedure',
    categoryLine2: 'Safeguarding',
  });

  // ─── COVER PAGE ──────────────────────────────────────────────────────────
  pdf.drawCoverPage(
    'Abuse, Neglect and Exploitation Prevention Policy',
    'One Life Foundation has zero tolerance for abuse, neglect, and exploitation of NDIS participants. This policy establishes the framework for prevention, identification, reporting, and response.',
    [
      ['Document Number', 'Form120'],
      ['Version', '1.0'],
      ['Effective Date', '1 January 2026'],
      ['Review Date', '1 January 2027'],
      ['Document Owner', 'Kevin Rae Geronimo, General Manager'],
      ['Approved By', 'Harsimran Singh, Director'],
      ['Applies To', 'All staff, contractors, volunteers, visitors'],
      ['Related Legislation', 'NDIS Act 2013, NDIS Code of Conduct, Disability Act 2006 (Vic), Crimes Act 1958 (Vic)'],
      ['NDIS Practice Standard', 'Standard 101 — Rights and Responsibilities'],
    ]
  );

  // ─── 1. PURPOSE ──────────────────────────────────────────────────────────
  pdf.newPage();
  pdf.sectionHeading('1. Purpose');
  pdf.writeBody(
    'One Life Foundation Pty Ltd (OLF) has an absolute zero tolerance for any form of abuse, neglect, or exploitation of NDIS participants. The safety, dignity, and wellbeing of participants is the highest priority in all aspects of OLF\'s service delivery.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'The purpose of this policy is to establish a comprehensive framework for the prevention, early identification, reporting, and response to abuse, neglect, and exploitation. This policy ensures that OLF meets its obligations under the NDIS Act 2013, the NDIS Code of Conduct, the NDIS Practice Standards (Standard 101 — Rights and Responsibilities), the Disability Act 2006 (Vic), and the Crimes Act 1958 (Vic).'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'OLF recognises that people with disability are at greater risk of experiencing abuse, neglect, and exploitation due to factors including dependence on others for support, communication barriers, social isolation, and power imbalances in support relationships. This policy reflects OLF\'s commitment to proactively addressing these risks through robust safeguarding measures, staff training, participant empowerment, and a culture of transparency and accountability.'
  );

  // ─── 2. SCOPE ────────────────────────────────────────────────────────────
  pdf.sectionHeading('2. Scope');
  pdf.writeBody('This policy applies to:');
  pdf.writeBullet('All employees of One Life Foundation (full-time, part-time, and casual)');
  pdf.writeBullet('All contractors, subcontractors, and agency staff engaged by OLF');
  pdf.writeBullet('All volunteers working under OLF direction');
  pdf.writeBullet('All visitors to OLF premises, including family members, guardians, and allied health professionals');
  pdf.writeBullet('Any person who comes into contact with NDIS participants during the delivery of OLF services');
  pdf.curY += 2;
  pdf.writeBody(
    'This policy applies to all OLF service delivery environments, including SIL properties, the head office, community settings, and any other location where OLF supports are provided.'
  );

  // ─── 3. DEFINITIONS ──────────────────────────────────────────────────────
  pdf.sectionHeading('3. Definitions');
  pdf.writeBody(
    'The following definitions are provided to ensure a shared understanding of the types of abuse, neglect, and exploitation addressed by this policy. Each definition includes examples to assist staff in recognising concerning behaviour.'
  );
  pdf.curY += 3;

  pdf.subHeading('3.1 Physical Abuse');
  pdf.writeBody('Any act or threat of physical force that causes or is likely to cause physical pain, injury, or other physical suffering. Examples include:');
  pdf.writeBullet('Hitting, slapping, punching, kicking, or pushing a participant');
  pdf.writeBullet('Rough handling during personal care or transfers');
  pdf.writeBullet('Inappropriate use of physical restraint (including holding a person down, blocking their movement, or confining them to a room)');
  pdf.writeBullet('Force-feeding or withholding food as punishment');
  pdf.writeBullet('Administering medication forcibly without proper authorisation');

  pdf.subHeading('3.2 Sexual Abuse');
  pdf.writeBody('Any sexual contact or behaviour that occurs without informed, freely given consent. Examples include:');
  pdf.writeBullet('Any sexual contact with a participant, including touching of a sexual nature');
  pdf.writeBullet('Sexual harassment, including unwanted sexual comments, jokes, or gestures');
  pdf.writeBullet('Indecent exposure or deliberate exposure of a participant');
  pdf.writeBullet('Showing a participant pornographic material');
  pdf.writeBullet('Taking intimate or inappropriate photographs of a participant');
  pdf.writeBullet('Coercing or grooming a participant for sexual purposes');

  pdf.subHeading('3.3 Emotional / Psychological Abuse');
  pdf.writeBody('Any act that may diminish a person\'s sense of identity, dignity, or self-worth. Examples include:');
  pdf.writeBullet('Intimidation, threats, or verbal aggression');
  pdf.writeBullet('Humiliation, belittling, or name-calling');
  pdf.writeBullet('Deliberate social isolation — preventing a participant from seeing family, friends, or support network');
  pdf.writeBullet('Gaslighting — manipulating a person into doubting their own perceptions or memory');
  pdf.writeBullet('Ignoring a participant\'s attempts to communicate or dismissing their expressed preferences');
  pdf.writeBullet('Using controlling behaviour to restrict a participant\'s choices or autonomy');

  pdf.subHeading('3.4 Financial Abuse');
  pdf.writeBody('The illegal or improper use of a person\'s funds, property, or assets. Examples include:');
  pdf.writeBullet('Theft of money, belongings, or valuables');
  pdf.writeBullet('Misuse of a participant\'s bank account, credit card, or NDIS funds');
  pdf.writeBullet('Coercion or undue influence regarding the participant\'s financial decisions');
  pdf.writeBullet('Borrowing money from a participant');
  pdf.writeBullet('Forging a participant\'s signature on financial documents');
  pdf.writeBullet('Overcharging or billing for services not provided');

  pdf.subHeading('3.5 Neglect');
  pdf.writeBody('The failure to provide the necessary care, support, or supervision, resulting in harm or risk of harm. Examples include:');
  pdf.writeBullet('Failure to provide adequate food, water, clothing, or shelter');
  pdf.writeBullet('Failure to administer prescribed medications or provide medical care');
  pdf.writeBullet('Failure to provide adequate hygiene and personal care');
  pdf.writeBullet('Failure to provide adequate supervision, resulting in harm or risk of harm');
  pdf.writeBullet('Failure to respond to a participant\'s distress or requests for assistance');
  pdf.writeBullet('Leaving a participant in soiled clothing or bedding for extended periods');

  pdf.subHeading('3.6 Exploitation');
  pdf.writeBody('Taking advantage of a person for personal gain or benefit. Examples include:');
  pdf.writeBullet('Using a participant\'s labour without fair compensation or consent');
  pdf.writeBullet('Manipulating a participant to change their will or power of attorney');
  pdf.writeBullet('Using a participant\'s personal information for personal gain');
  pdf.writeBullet('Using the support relationship to gain personal advantage');

  pdf.subHeading('3.7 Restrictive Practices');
  pdf.writeBody('Any practice or intervention that has the effect of restricting the rights or freedom of movement of a person with disability. Types include:');
  pdf.writeBullet('Seclusion: confining a person alone in a room or area from which they cannot leave freely');
  pdf.writeBullet('Chemical restraint: use of medication primarily to control behaviour (not for treatment of a diagnosed condition)');
  pdf.writeBullet('Mechanical restraint: use of a device to restrict movement (not for therapeutic or safety purposes prescribed by a health professional)');
  pdf.writeBullet('Physical restraint: use of physical force to restrict movement');
  pdf.writeBullet('Environmental restraint: restricting a person\'s access to the environment (e.g., locking external doors, removing items from the person\'s environment)');
  pdf.curY += 2;
  pdf.writeBody(
    'Note: OLF does not use unauthorised restrictive practices. Any restrictive practice must be authorised by the NDIS Commission, included in a registered behaviour support plan, and used only as a last resort when there is an immediate risk of harm.'
  );

  // ─── 4. PREVENTION STRATEGIES ────────────────────────────────────────────
  pdf.sectionHeading('4. Prevention Strategies');
  pdf.writeBody(
    'OLF implements a range of proactive strategies to prevent abuse, neglect, and exploitation. Prevention is the most effective safeguarding measure.'
  );
  pdf.curY += 2;

  pdf.subHeading('4.1 NDIS Worker Screening');
  pdf.writeBullet('All staff must hold a valid NDIS Worker Screening Check clearance before commencing work with participants');
  pdf.writeBullet('Screening clearances are verified before employment begins and monitored for ongoing validity');
  pdf.writeBullet('Staff must disclose any criminal charges or findings that occur during their employment');
  pdf.writeBullet('Working with Children Checks (WWCC) are also required where applicable');

  pdf.subHeading('4.2 Staff Training');
  pdf.writeBullet('All staff complete mandatory training in abuse recognition, prevention, and reporting as part of induction');
  pdf.writeBullet('Training covers: types of abuse and indicators, reporting obligations, NDIS Code of Conduct, trauma-informed care, human rights framework');
  pdf.writeBullet('Annual refresher training is provided to all staff');
  pdf.writeBullet('Training records are maintained in the staff training register (Form35)');

  pdf.subHeading('4.3 Staff Supervision and Support');
  pdf.writeBullet('All staff receive regular supervision (formal supervision at least quarterly)');
  pdf.writeBullet('Supervisors conduct unannounced visits to SIL properties');
  pdf.writeBullet('Staff have access to debriefing after critical incidents');
  pdf.writeBullet('Workplace culture promotes open communication and psychological safety');
  pdf.writeBullet('Staff experiencing personal difficulties that may affect their work are supported through EAP and reasonable adjustments');

  pdf.subHeading('4.4 Participant Empowerment');
  pdf.writeBullet('Participants are informed of their rights at the commencement of services and regularly thereafter');
  pdf.writeBullet('Participants receive information about the complaints process in accessible formats');
  pdf.writeBullet('Participants are provided with contact details for advocacy services (e.g., VALID — phone 1800 655 570, Office of the Public Advocate)');
  pdf.writeBullet('Participants are supported to express their views, make choices, and exercise control over their lives');
  pdf.writeBullet('Participants are supported to maintain relationships with family, friends, and community');

  pdf.subHeading('4.5 Environmental Design');
  pdf.writeBullet('CCTV may be installed in common areas of SIL properties where appropriate and with the informed consent of all participants — CCTV is never placed in private areas (bedrooms, bathrooms)');
  pdf.writeBullet('Adequate lighting is maintained in all OLF properties, including external areas');
  pdf.writeBullet('Participants have access to private spaces where they can speak confidentially with advocates, family, or support workers');
  pdf.writeBullet('The physical environment is maintained to a safe and dignified standard');

  pdf.subHeading('4.6 Cultural Safety');
  pdf.writeBullet('OLF provides culturally responsive and inclusive services that respect participants\' cultural, linguistic, and religious backgrounds');
  pdf.writeBullet('Staff receive cultural awareness training as part of induction');
  pdf.writeBullet('Interpreters are arranged when required to ensure effective communication');
  pdf.writeBullet('Traditional practices and preferences are respected and accommodated wherever possible');
  pdf.writeBullet('OLF actively works to prevent discrimination on the basis of race, ethnicity, gender, sexuality, disability, age, or religion');

  // ─── 5. RECOGNISING ABUSE AND NEGLECT ────────────────────────────────────
  pdf.sectionHeading('5. Recognising Abuse and Neglect');
  pdf.writeBody(
    'Staff must be vigilant in recognising the signs and indicators of abuse and neglect. The following table provides guidance, noting that the presence of signs does not necessarily confirm abuse but should always be reported and investigated.'
  );
  pdf.curY += 3;

  pdf.drawTable(
    ['Type', 'Physical Signs', 'Behavioural Signs'],
    [
      ['Physical Abuse', 'Unexplained bruises, burns, welts, or fractures; injuries in various stages of healing; injuries inconsistent with the explanation given; marks in shape of objects', 'Flinching when touched or approached; fearfulness around certain people; withdrawal or avoidance; reluctance to go home or return to the care environment'],
      ['Sexual Abuse', 'Genital or anal injuries; sexually transmitted infections; torn, stained, or bloodied underclothing; difficulty walking or sitting', 'Sexualised behaviour inappropriate to developmental stage; fear of specific people or places; sleep disturbance or nightmares; sudden mood changes or regression'],
      ['Emotional / Psychological Abuse', 'Weight loss or gain; sleep disturbance; physical complaints without medical cause (headaches, stomach aches)', 'Anxiety, depression, or withdrawal; low self-esteem; self-harm or suicidal ideation; excessive compliance or people-pleasing; emotional outbursts'],
      ['Financial Abuse', 'Missing money, belongings, or valuables; unpaid bills despite adequate income; sudden changes to financial documents', 'Confusion or anxiety about finances; new "friends" who show unusual interest in assets; reluctance to discuss money; living conditions inconsistent with income'],
      ['Neglect', 'Poor hygiene; malnutrition or dehydration; untreated medical conditions or injuries; inappropriate clothing for weather; pressure sores', 'Withdrawn or resigned behaviour; hoarding food; reluctance to accept help; learned helplessness; apathy'],
    ],
    [28, 58, 88]
  );

  // ─── 6. RESPONDING TO ALLEGATIONS OR CONCERNS ────────────────────────────
  pdf.sectionHeading('6. Responding to Allegations or Concerns');
  pdf.writeBody(
    'When a staff member witnesses, suspects, or receives a disclosure of abuse, neglect, or exploitation, the following steps must be taken immediately:'
  );
  pdf.curY += 3;

  pdf.subHeading('Step 1: Ensure Immediate Safety');
  pdf.writeBody('Ensure the immediate safety of the participant. If the participant is in danger, take reasonable action to protect them. Separate the participant from the alleged perpetrator if safe to do so.');

  pdf.subHeading('Step 2: If Emergency — Call 000');
  pdf.writeBody('If the participant requires emergency medical attention or is in immediate danger, call 000 (Triple Zero) for police and/or ambulance. Do not delay medical treatment to complete documentation or make reports.');

  pdf.subHeading('Step 3: Report to Management Immediately');
  pdf.writeBody('Report the concern to the Director (Harsimran Singh) or General Manager (Kevin Rae Geronimo) immediately. If neither is available, contact the Operations Manager (Swosthani Thapa). If the allegation involves a member of management, report to the next most senior person or directly to the NDIS Commission.');

  pdf.subHeading('Step 4: Document Concerns');
  pdf.writeBody('Document the concerns as soon as practicable, using the following guidelines:');
  pdf.writeBullet('Record factual observations only — do not include opinions or interpretations');
  pdf.writeBullet('Use the participant\'s own words where they have made a disclosure (use quotation marks)');
  pdf.writeBullet('Record the date, time, and location of the incident or disclosure');
  pdf.writeBullet('Record who was present and who was involved');
  pdf.writeBullet('Complete Form04 — Incident Report');

  pdf.subHeading('Step 5: Do NOT Investigate');
  pdf.writeBody('Staff must NOT investigate the allegation themselves. Do NOT confront or question the alleged perpetrator. Do NOT interview or repeatedly question the participant or witnesses. Investigation is the responsibility of management, the NDIS Commission, and/or police.');

  pdf.subHeading('Step 6: Management Determines Reporting Obligations');
  pdf.writeBody('Management (Director or General Manager) will determine the appropriate reporting actions based on the nature and severity of the allegation. See Section 7 — Mandatory Reporting.');

  // ─── 7. MANDATORY REPORTING ──────────────────────────────────────────────
  pdf.sectionHeading('7. Mandatory Reporting');
  pdf.writeBody(
    'OLF has mandatory reporting obligations under the NDIS Act 2013, the Disability Act 2006 (Vic), the Children, Youth and Families Act 2005 (Vic), and the Crimes Act 1958 (Vic). The following reporting obligations apply:'
  );
  pdf.curY += 3;

  pdf.drawTable(
    ['Authority', 'Contact', 'When to Report'],
    [
      ['NDIS Quality and Safeguards Commission', '1800 035 544\nreportableincident@ndiscommission.gov.au', 'Reportable incidents must be reported within 24 hours. Includes: death, serious injury, abuse or neglect, unlawful sexual or physical contact, unauthorised restrictive practice.'],
      ['Victoria Police', '000 (emergency)\nLocal police station (non-emergency)', 'Criminal matters including assault, sexual assault, theft, fraud. Call 000 for immediate danger.'],
      ['DFFH Child Protection', '1300 664 977', 'If a child (under 18) is involved or at risk of abuse or neglect.'],
      ['Office of the Public Advocate', '1300 309 337', 'Concerns about adults under guardianship or administration, or where decision-making capacity is in question.'],
      ['WorkSafe Victoria', '1800 136 089', 'Workplace incidents resulting in death, serious injury, or dangerous occurrences.'],
    ],
    [48, 52, CW - 100]
  );

  pdf.curY += 2;
  pdf.writeBody(
    'Reports to the NDIS Commission must include: the nature of the incident, the participant(s) involved, the actions taken to ensure the participant\'s safety, and any other information required. A follow-up report with investigation findings must be submitted within 5 business days.'
  );

  // ─── 8. INTERNAL INVESTIGATION ───────────────────────────────────────────
  pdf.sectionHeading('8. Internal Investigation');
  pdf.writeBody(
    'Following a report of alleged abuse, neglect, or exploitation, OLF conducts an internal investigation in accordance with the following principles:'
  );
  pdf.curY += 2;

  pdf.subHeading('8.1 Interim Measures');
  pdf.writeBullet('The alleged perpetrator may be suspended from duties or reassigned to a role with no participant contact, pending the outcome of the investigation');
  pdf.writeBullet('This action is a precautionary measure and does not presume guilt');
  pdf.writeBullet('The safety of the participant remains the paramount consideration in all decisions');

  pdf.subHeading('8.2 Investigation Process');
  pdf.writeBullet('The investigation is conducted by the Director or an appointed external investigator where appropriate (e.g., where the allegation involves senior management or is particularly serious)');
  pdf.writeBullet('The investigation is conducted in a timely manner, with the aim of completion within 30 days');
  pdf.writeBullet('All relevant evidence is gathered, including witness statements, documentation, CCTV footage (where available), and any physical evidence');
  pdf.writeBullet('The investigation does not interfere with any concurrent police investigation');

  pdf.subHeading('8.3 Natural Justice');
  pdf.writeBullet('Natural justice principles are applied throughout the investigation — all parties are treated fairly');
  pdf.writeBullet('The alleged perpetrator is informed of the allegation (unless doing so would compromise the investigation or the participant\'s safety)');
  pdf.writeBullet('The alleged perpetrator is given the opportunity to respond to the allegation');
  pdf.writeBullet('The alleged perpetrator may have a support person present during interviews');

  pdf.subHeading('8.4 Investigation Outcomes');
  pdf.writeBody('Possible outcomes of the investigation include:');
  pdf.writeBullet('No case to answer — the allegation is not substantiated');
  pdf.writeBullet('Counselling and additional training or supervision');
  pdf.writeBullet('Formal written warning');
  pdf.writeBullet('Reassignment of duties');
  pdf.writeBullet('Termination of employment');
  pdf.writeBullet('Referral to Victoria Police for criminal investigation');
  pdf.writeBullet('Report to the NDIS Commission as a reportable incident');
  pdf.writeBullet('Report to the relevant professional registration body (if applicable)');

  // ─── 9. SUPPORT FOR PARTICIPANTS ─────────────────────────────────────────
  pdf.sectionHeading('9. Support for Participants');
  pdf.writeBody(
    'OLF is committed to providing comprehensive support to any participant who has experienced or is alleged to have experienced abuse, neglect, or exploitation.'
  );
  pdf.curY += 2;

  pdf.writeBullet('Advocacy services are offered immediately — participants are provided with contact details for independent advocacy organisations including VALID (1800 655 570) and the Office of the Public Advocate (1300 309 337)');
  pdf.writeBullet('Counselling referral: OLF arranges access to professional counselling services, including trauma-informed counselling, at no cost to the participant');
  pdf.writeBullet('A safety plan is developed in consultation with the participant (and their advocate/guardian where appropriate), identifying measures to ensure their ongoing safety');
  pdf.writeBullet('Regular welfare checks are conducted to monitor the participant\'s wellbeing during and after the investigation');
  pdf.writeBullet('The participant\'s family or guardian is notified (unless the family member/guardian is the alleged perpetrator, in which case legal advice is sought)');
  pdf.writeBullet('The participant is kept informed of the progress of the investigation to the extent possible and appropriate');
  pdf.writeBullet('The participant\'s care plan is reviewed and updated to address any additional support needs arising from the incident');

  // ─── 10. SUPPORT FOR STAFF REPORTERS ─────────────────────────────────────
  pdf.sectionHeading('10. Support for Staff Reporters');
  pdf.writeBody(
    'OLF recognises that reporting concerns of abuse or neglect can be difficult and stressful for staff. The following support and protections apply to all staff who make reports in good faith:'
  );
  pdf.curY += 2;

  pdf.subHeading('10.1 Whistleblower Protection');
  pdf.writeBullet('Staff who make reports of abuse, neglect, or exploitation are protected under the Public Interest Disclosures Act 2012 (Vic) and relevant whistleblower protections');
  pdf.writeBullet('No retaliation or adverse action (including dismissal, demotion, harassment, or discrimination) will be taken against any staff member who makes a report in good faith');
  pdf.writeBullet('Any person who retaliates against a reporter will be subject to disciplinary action, which may include termination of employment');

  pdf.subHeading('10.2 Confidentiality');
  pdf.writeBullet('The identity of the reporter is kept confidential as far as is reasonably possible');
  pdf.writeBullet('Information about the report is shared only with those who need to know for the purposes of the investigation and participant safety');

  pdf.subHeading('10.3 Support Services');
  pdf.writeBullet('Employee Assistance Program (EAP) referral is available to staff who are distressed as a result of making a report or being involved in an investigation');
  pdf.writeBullet('Staff may access debriefing with their supervisor or an independent counsellor');
  pdf.writeBullet('Management will check in with the reporter to ensure they are not experiencing any adverse effects');

  // ─── 11. STAFF OBLIGATIONS ───────────────────────────────────────────────
  pdf.sectionHeading('11. Staff Obligations');
  pdf.writeBody(
    'All OLF staff have the following obligations in relation to the prevention and reporting of abuse, neglect, and exploitation:'
  );
  pdf.curY += 2;

  pdf.writeBullet('Duty to report: All staff have an obligation to report any concerns, suspicions, or disclosures of abuse, neglect, or exploitation immediately. Failure to report is a breach of the NDIS Code of Conduct and may result in disciplinary action, including termination of employment.');
  pdf.writeBullet('Mandatory training: All staff must complete mandatory training in abuse prevention and recognition during induction and annually thereafter.');
  pdf.writeBullet('NDIS Code of Conduct: All staff must comply with the NDIS Code of Conduct at all times, including acting with respect for individual rights to freedom of expression, self-determination, and decision-making in accordance with applicable laws and conventions.');
  pdf.writeBullet('Criminal charges: All staff must declare any criminal charges, findings of guilt, or adverse findings by a professional body that occur during their employment with OLF. Failure to disclose may result in termination of employment.');
  pdf.writeBullet('Boundaries: Staff must maintain appropriate professional boundaries at all times. This includes not accepting gifts of significant value from participants, not entering into personal relationships with participants, and not sharing personal contact details with participants (except where required for work purposes and approved by management).');
  pdf.writeBullet('Observation: Staff must be observant and attentive to changes in participant behaviour, physical condition, or emotional state that may indicate abuse or neglect.');

  // ─── 12. RELATED DOCUMENTS ───────────────────────────────────────────────
  pdf.sectionHeading('12. Related Documents');
  pdf.drawTable(
    ['Document', 'Reference'],
    [
      ['Incident Report', 'Form04'],
      ['Incident Register', 'Form11'],
      ['OLF Code of Conduct', 'Form111'],
      ['Training Register', 'Form35'],
      ['Complaints and Feedback Management Policy', 'Form116'],
      ['NDIS Code of Conduct', 'NDIS Commission'],
      ['NDIS Worker Screening', 'NDIS Commission'],
      ['NDIS Act 2013', 'Commonwealth Legislation'],
      ['Disability Act 2006 (Vic)', 'Victorian Legislation'],
      ['Crimes Act 1958 (Vic)', 'Victorian Legislation'],
      ['Public Interest Disclosures Act 2012 (Vic)', 'Victorian Legislation'],
    ],
    [100, CW - 100]
  );

  // ─── 13. STAFF ACKNOWLEDGEMENT ───────────────────────────────────────────
  pdf.drawSignatureTable(8);

  return pdf.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — Generate all 3 PDFs and upload
// ═══════════════════════════════════════════════════════════════════════════════

const DOCS = [
  { fn: buildForm118, filename: 'Form118.Workplace Health and Safety Policy.pdf' },
  { fn: buildForm119, filename: 'Form119.Medication Management Policy.pdf' },
  { fn: buildForm120, filename: 'Form120.Abuse Neglect and Exploitation Prevention Policy.pdf' },
];

async function main() {
  console.log('=== One Life Foundation — Policy PDF Generator (Batch 2) ===\n');

  for (const { fn, filename } of DOCS) {
    console.log(`Building ${filename}...`);
    const buf = fn();

    // Save locally
    const localPath = path.join(DOWNLOADS, filename);
    fs.writeFileSync(localPath, buf);
    console.log(`  -> Saved to ${localPath}`);

    // Upload to Supabase Storage
    const storagePath = `${STORAGE_FOLDER}/${filename}`;
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, buf, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error(`  !! Upload failed for ${filename}:`, error.message);
    } else {
      console.log(`  -> Uploaded to ${BUCKET}/${storagePath}`);
    }
  }

  console.log('\nDone! All 3 policies generated and uploaded.');
}

main().catch(console.error);
