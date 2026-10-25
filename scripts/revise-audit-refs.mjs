#!/usr/bin/env node
/**
 * revise-audit-refs.mjs
 *
 * Regenerates 3 OLF policy PDFs to remove all DNV audit references:
 *   1. Form107.Policy Document Register.pdf
 *   2. Form25.Management Review Meeting Minutes - June 2026.pdf
 *   3. Form108.NDIS Policy Manual Addendum V02.pdf
 *
 * Uploads to Supabase Storage (documents + auditor-portal buckets)
 * and saves copies to C:/Users/kevin/Downloads/
 */

import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Supabase ──────────────────────────────────────────────────────────────
const SB_URL = 'https://czdlemutsimvwfpwylxh.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk';
const sb = createClient(SB_URL, SB_KEY);

const DOWNLOADS = 'C:/Users/kevin/Downloads';

// ─── Brand Colors ──────────────────────────────────────────────────────────
const NAVY = [15, 82, 138];      // #0F528A
const WHITE = [255, 255, 255];
const DARK_TEXT = [30, 41, 59];
const MEDIUM_TEXT = [71, 85, 105];
const LIGHT_TEXT = [148, 163, 184];
const BORDER_COLOR = [226, 232, 240];
const TABLE_BORDER = [203, 213, 225];
const LABEL_BG = [245, 247, 250];
const BLUE_HEADER = [30, 90, 138];  // Slightly different blue for table headers

// ─── PDF Constants ─────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 16;
const MARGIN_R = 16;
const MARGIN_T = 8;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const HEADER_BAR_H = 8;
const FOOTER_H = 12;
const BODY_TOP = MARGIN_T + HEADER_BAR_H + 22; // Extra space for metadata row
const BODY_BOTTOM = PAGE_H - FOOTER_H - 10;

// ─── Load Logo ─────────────────────────────────────────────────────────────
function loadLogo() {
  try {
    const logoPath = resolve(__dirname, '..', 'public', 'logo.png');
    const buf = readFileSync(logoPath);
    return 'data:image/png;base64,' + buf.toString('base64');
  } catch {
    console.warn('WARNING: Could not load logo.png');
    return null;
  }
}

const LOGO_DATA = loadLogo();

// ═══════════════════════════════════════════════════════════════════════════
// PDF BUILDER CLASS (reusable for all three documents)
// ═══════════════════════════════════════════════════════════════════════════
class OLFDocument {
  constructor(opts) {
    this.pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.pageNum = 1;
    this.y = BODY_TOP;
    this.docNo = opts.docNo || '';
    this.docTitle = opts.docTitle || '';
    this.version = opts.version || '1.0';
    this.effectiveDate = opts.effectiveDate || '1 January 2026';
    this.reviewDate = opts.reviewDate || '1 January 2027';
    this.drawHeader();
    this.drawMetadataRow();
  }

  // ─── Blue Header Bar ──────────────────────────────────────────────────
  drawHeader() {
    this.pdf.setFillColor(...NAVY);
    this.pdf.rect(0, 0, PAGE_W, MARGIN_T + HEADER_BAR_H, 'F');
    if (LOGO_DATA) {
      try { this.pdf.addImage(LOGO_DATA, 'PNG', MARGIN_L - 2, 1, 22, 11); } catch {}
    }
    // Right side: org name and ABN
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...WHITE);
    this.pdf.text('One Life Foundation', PAGE_W - MARGIN_R, 7, { align: 'right' });
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(6.5);
    this.pdf.text('ABN: 55 643 227 061  |  NDIS Registered Provider', PAGE_W - MARGIN_R, 11.5, { align: 'right' });
  }

  // ─── Metadata Row (below header bar) ─────────────────────────────────
  drawMetadataRow() {
    const metaY = MARGIN_T + HEADER_BAR_H + 2;
    this.pdf.setFillColor(245, 247, 250);
    this.pdf.rect(MARGIN_L, metaY, CONTENT_W, 8, 'F');
    this.pdf.setDrawColor(...BORDER_COLOR);
    this.pdf.setLineWidth(0.3);
    this.pdf.rect(MARGIN_L, metaY, CONTENT_W, 8);

    // 4 columns: DOC NO. | VERSION | EFFECTIVE | REVIEW
    const colW = CONTENT_W / 4;
    for (let i = 1; i < 4; i++) {
      this.pdf.line(MARGIN_L + colW * i, metaY, MARGIN_L + colW * i, metaY + 8);
    }

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(6);
    this.pdf.setTextColor(...MEDIUM_TEXT);

    const labels = ['DOC NO.', 'VERSION', 'EFFECTIVE DATE', 'REVIEW DATE'];
    const values = [this.docNo, this.version, this.effectiveDate, this.reviewDate];

    for (let i = 0; i < 4; i++) {
      const x = MARGIN_L + colW * i + 3;
      this.pdf.text(labels[i], x, metaY + 3.2);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(...DARK_TEXT);
      this.pdf.text(values[i], x, metaY + 6.5);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(6);
      this.pdf.setTextColor(...MEDIUM_TEXT);
    }
  }

  // ─── Footer ──────────────────────────────────────────────────────────
  drawFooter() {
    const footerY = PAGE_H - 8;
    this.pdf.setDrawColor(...BORDER_COLOR);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(MARGIN_L, footerY - 4, PAGE_W - MARGIN_R, footerY - 4);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(6.5);
    this.pdf.setTextColor(...LIGHT_TEXT);
    this.pdf.text(`One Life Foundation  |  ${this.docTitle}  |  Confidential`, MARGIN_L, footerY);
    this.pdf.text(`Page ${this.pageNum}`, PAGE_W - MARGIN_R, footerY, { align: 'right' });
  }

  // ─── New Page ────────────────────────────────────────────────────────
  newPage() {
    this.drawFooter();
    this.pdf.addPage();
    this.pageNum++;
    this.drawHeader();
    this.drawMetadataRow();
    this.y = BODY_TOP;
  }

  ensureSpace(needed) {
    if (this.y + needed > BODY_BOTTOM) this.newPage();
  }

  // ─── Document Title (large, centered) ────────────────────────────────
  title(text) {
    this.ensureSpace(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(...NAVY);
    this.pdf.text(text, PAGE_W / 2, this.y + 8, { align: 'center' });
    this.y += 16;
  }

  // ─── Section Heading (navy bar) ──────────────────────────────────────
  sectionHeading(text) {
    if (this.y > BODY_TOP + 5) {
      this.ensureSpace(20);
      this.y += 4;
    } else {
      this.ensureSpace(14);
    }
    this.pdf.setFillColor(...NAVY);
    this.pdf.rect(MARGIN_L, this.y, CONTENT_W, 8, 'F');
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(...WHITE);
    this.pdf.text(text.toUpperCase(), MARGIN_L + 4, this.y + 5.8);
    this.y += 12;
  }

  // ─── Sub Heading ─────────────────────────────────────────────────────
  subHeading(text) {
    this.ensureSpace(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9.5);
    this.pdf.setTextColor(...NAVY);
    this.pdf.text(text, MARGIN_L + 2, this.y + 3);
    this.y += 5;
    this.pdf.setDrawColor(...NAVY);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(MARGIN_L + 2, this.y, MARGIN_L + 2 + Math.min(this.pdf.getTextWidth(text) + 4, CONTENT_W - 4), this.y);
    this.y += 5;
  }

  // ─── Body Paragraph ──────────────────────────────────────────────────
  paragraph(text, opts = {}) {
    this.pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    this.pdf.setFontSize(opts.size || 9);
    this.pdf.setTextColor(...(opts.color || DARK_TEXT));
    const lines = this.pdf.splitTextToSize(text, CONTENT_W - 4);
    const lineH = (opts.size || 9) * 0.42;
    this.ensureSpace(lines.length * lineH + 4);
    this.pdf.text(lines, MARGIN_L + 2, this.y + 3);
    this.y += lines.length * lineH + 4;
  }

  // ─── Bullet List ─────────────────────────────────────────────────────
  bulletList(items, opts = {}) {
    for (const item of items) {
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(opts.size || 8.5);
      this.pdf.setTextColor(...DARK_TEXT);
      const lines = this.pdf.splitTextToSize(item, CONTENT_W - 14);
      const lineH = (opts.size || 8.5) * 0.42;
      this.ensureSpace(lines.length * lineH + 3);
      // Bullet
      this.pdf.setFillColor(...NAVY);
      this.pdf.circle(MARGIN_L + 5, this.y + 2.2, 0.8, 'F');
      this.pdf.text(lines, MARGIN_L + 9, this.y + 3);
      this.y += lines.length * lineH + 3;
    }
    this.y += 2;
  }

  // ─── Info Table (label-value pairs) ──────────────────────────────────
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

  // ─── Data Table (multi-column with header) ───────────────────────────
  dataTable(headers, rows, colWidths, opts = {}) {
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    const headerH = 7;

    // Header row
    this.ensureSpace(headerH + 10);
    let x = MARGIN_L;
    this.pdf.setFillColor(...NAVY);
    this.pdf.rect(MARGIN_L, this.y, totalW, headerH, 'F');
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(...WHITE);
    for (let i = 0; i < headers.length; i++) {
      this.pdf.text(headers[i], x + 2, this.y + 4.8);
      x += colWidths[i];
    }
    this.y += headerH;

    // Data rows
    let rowIdx = 0;
    for (const row of rows) {
      // Calculate row height based on text wrapping
      let maxH = 7;
      const cellTexts = [];
      for (let i = 0; i < row.length; i++) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(7);
        const lines = this.pdf.splitTextToSize(String(row[i] || ''), colWidths[i] - 4);
        cellTexts.push(lines);
        maxH = Math.max(maxH, lines.length * 3.2 + 3);
      }

      this.ensureSpace(maxH + 1);

      // Alternating row background
      if (rowIdx % 2 === 1) {
        this.pdf.setFillColor(249, 250, 251);
        this.pdf.rect(MARGIN_L, this.y, totalW, maxH, 'F');
      }

      x = MARGIN_L;
      this.pdf.setDrawColor(...TABLE_BORDER);
      this.pdf.setLineWidth(0.15);
      this.pdf.rect(MARGIN_L, this.y, totalW, maxH);

      for (let i = 0; i < row.length; i++) {
        if (i > 0) this.pdf.line(x, this.y, x, this.y + maxH);
        this.pdf.setFont('helvetica', opts.firstColBold && i === 0 ? 'bold' : 'normal');
        this.pdf.setFontSize(7);
        this.pdf.setTextColor(...DARK_TEXT);
        this.pdf.text(cellTexts[i], x + 2, this.y + 3.5);
        x += colWidths[i];
      }
      this.y += maxH;
      rowIdx++;
    }
    this.y += 3;
  }

  // ─── Spacer ──────────────────────────────────────────────────────────
  space(mm = 4) {
    this.y += mm;
  }

  // ─── Finalize and return PDF bytes ───────────────────────────────────
  finalize() {
    this.drawFooter();
    return Buffer.from(this.pdf.output('arraybuffer'));
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT 1: Form107 — Policy Document Register
// ═══════════════════════════════════════════════════════════════════════════
function generateForm107() {
  console.log('  Generating Form107.Policy Document Register...');

  const doc = new OLFDocument({
    docNo: 'Form107',
    docTitle: 'Policy Document Register',
    version: '2.0',
    effectiveDate: '1 January 2026',
    reviewDate: '1 January 2027',
  });

  doc.title('Policy Document Register');
  doc.space(2);

  doc.sectionHeading('1. Purpose');
  doc.paragraph(
    'This Policy Document Register provides a comprehensive record of all policies, procedures, handbooks, and operational documents maintained by One Life Foundation as part of its Quality Management System (QMS). The register ensures document currency, supports version control, and facilitates regular review cycles in accordance with the NDIS Practice Standards and Quality Indicators.'
  );

  doc.sectionHeading('2. Scope');
  doc.paragraph(
    'This register covers all controlled documents across One Life Foundation\'s operations, including but not limited to: governance policies, operational procedures, participant handbooks, worker resources, compliance frameworks, and clinical governance documentation. All documents listed are subject to scheduled review and continuous improvement processes.'
  );

  doc.sectionHeading('3. Document Control');
  doc.infoTable([
    ['Document Owner', 'Harsimran Singh, Director'],
    ['Maintained By', 'Kevin Rae Geronimo, General Manager'],
    ['Review Frequency', 'Annually, or as required following legislative/regulatory changes'],
    ['Distribution', 'Internal — available to all OLF staff via the Document Vault'],
    ['Classification', 'Confidential — Internal Use Only'],
  ]);

  doc.sectionHeading('4. Policy Document Register');
  doc.paragraph(
    'The following table lists all controlled documents within the One Life Foundation Quality Management System. Each document is assigned a unique form number, version, and review cycle.'
  );
  doc.space(2);

  // Register table — all 28 documents
  const registerEntries = [
    ['Form01', 'Risk Register', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form02', 'Complaint Report Form', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form03', 'Improvement Report Form', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form04', 'Incident Report', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form05', 'Business Plan 2026\u20132028', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form06', 'Worker Information Form', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form07', 'Job Descriptions', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form08', 'Induction Checklist', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form09', 'Training Matrix', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form10', 'Worker Performance Assessment', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form15', 'Internal Audit Report', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form16', 'Internal Audit Schedule', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form22', 'Service Agreement', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form25', 'Management Review Meeting Minutes', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form100', 'Organisation Chart', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form103', 'Business Continuity Plan', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form104', 'Digital Compliance Monitoring Policy', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form105', 'Digital Registers Management Policy', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form107', 'Policy Document Register', '2.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form108', 'NDIS Policy Manual Addendum V02', '2.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form109', 'Worker Screening and Recruitment Procedure', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form110', 'Clinical Governance Framework', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form111', 'OLF Code of Conduct', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form112', 'Insurance Register', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form113', 'Professional Development Policy', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['Form114', 'Performance Management Procedure', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['1-NDIS Manual', 'NDIS Manual (Policies and Procedures)', '1.0', '1 January 2026', '1 January 2027', 'Current'],
    ['2-Worker Handbook', 'Worker Handbook', '2.0', '1 January 2026', '1 January 2027', 'Current'],
    ['3-Participant Handbook', 'Participant Handbook', '2.0', '1 January 2026', '1 January 2027', 'Current'],
  ];

  const colWidths = [22, 58, 12, 28, 28, 18];
  // Total = 166 but CONTENT_W = 178, adjust
  const adjustedColWidths = [24, 56, 14, 30, 30, 24];

  doc.dataTable(
    ['DOC NO.', 'DOCUMENT TITLE', 'VER.', 'EFFECTIVE DATE', 'REVIEW DATE', 'STATUS'],
    registerEntries,
    adjustedColWidths,
    { firstColBold: true }
  );

  doc.sectionHeading('5. Review and Approval');
  doc.paragraph(
    'This register is reviewed at each scheduled management review meeting and updated as new policies are developed or existing policies are revised. Any changes to controlled documents are recorded in the version history of the individual document and reflected in this register.'
  );
  doc.space(2);

  doc.infoTable([
    ['Prepared By', 'Kevin Rae Geronimo, General Manager'],
    ['Reviewed By', 'Swosthani Thapa, Operations Manager'],
    ['Approved By', 'Harsimran Singh, Director'],
    ['Approval Date', '1 January 2026'],
  ]);

  doc.sectionHeading('6. Version History');
  doc.dataTable(
    ['VERSION', 'DATE', 'DESCRIPTION', 'AUTHOR'],
    [
      ['1.0', '1 July 2024', 'Initial register created', 'Kevin Rae Geronimo'],
      ['2.0', '1 January 2026', 'Comprehensive update — additional policies added, review dates standardised across all documents', 'Kevin Rae Geronimo'],
    ],
    [20, 30, 90, 38],
  );

  return doc.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT 2: Form25 — Management Review Meeting Minutes
// ═══════════════════════════════════════════════════════════════════════════
function generateForm25() {
  console.log('  Generating Form25.Management Review Meeting Minutes - June 2026...');

  const doc = new OLFDocument({
    docNo: 'Form25',
    docTitle: 'Management Review Meeting Minutes',
    version: '1.0',
    effectiveDate: '1 June 2026',
    reviewDate: '1 June 2027',
  });

  doc.title('Management Review Meeting Minutes');
  doc.space(2);

  // Meeting details
  doc.sectionHeading('Meeting Details');
  doc.infoTable([
    ['Meeting Type', 'Quarterly Management Review'],
    ['Date', '1 June 2026'],
    ['Time', '10:00 AM \u2013 12:30 PM'],
    ['Location', '9C Grasslands Avenue, Craigieburn VIC 3064 (Head Office)'],
    ['Chair', 'Harsimran Singh, Director'],
    ['Minutes Taken By', 'Marrion Isabel Ramos, HR/Admin'],
  ]);

  doc.subHeading('Attendees');
  doc.dataTable(
    ['NAME', 'ROLE', 'ATTENDANCE'],
    [
      ['Harsimran Singh', 'Director', 'Present'],
      ['Kevin Rae Geronimo', 'General Manager', 'Present'],
      ['Swosthani Thapa', 'Operations Manager', 'Present'],
      ['Marrion Isabel Ramos', 'HR/Admin Officer', 'Present'],
    ],
    [50, 60, 30],
  );

  // ─── Agenda Item 1 ───────────────────────────────────────────────────
  doc.sectionHeading('1. Review of Previous Meeting Action Items');
  doc.paragraph(
    'The Chair opened the meeting and reviewed the action items from the previous management review meeting held in March 2026. The following updates were noted:'
  );
  doc.bulletList([
    'Worker Handbook V02 has been finalised and distributed to all staff via the Document Vault. All current workers have acknowledged receipt.',
    'Participant Handbook V02 has been updated and provided to all current participants and their nominees.',
    'The internal audit schedule (Form16) has been completed for Q1 2026. Findings were minor and have been addressed through the continuous improvement register.',
    'Staff training compliance rates have improved from 87% to 94% following the March review.',
  ]);

  // ─── Agenda Item 2 ───────────────────────────────────────────────────
  doc.sectionHeading('2. Quality Management System Performance');
  doc.paragraph(
    'The General Manager presented an overview of the Quality Management System (QMS) performance for the period January to May 2026.'
  );
  doc.subHeading('Policy Compliance');
  doc.bulletList([
    'All 29 controlled documents in the Policy Document Register (Form107) are current and within their review cycle.',
    'The NDIS Policy Manual Addendum V02 (Form108) has been implemented, documenting additional policies developed to strengthen the QMS.',
    'Digital Compliance Monitoring Policy (Form104) and Digital Registers Management Policy (Form105) are operating effectively.',
    'No policy non-conformances identified during the reporting period.',
  ]);
  doc.subHeading('Document Currency');
  doc.bulletList([
    'All policies have been reviewed and carry an effective date of 1 January 2026 with review dates of 1 January 2027.',
    'Version control is maintained through the Document Vault system with full audit trail.',
    'The Organisation Chart (Form100) has been updated to reflect current staffing structure.',
  ]);

  // ─── Agenda Item 3 ───────────────────────────────────────────────────
  doc.sectionHeading('3. Staff Training and Development');
  doc.paragraph(
    'The Operations Manager presented the staff training and development update for the current period.'
  );
  doc.subHeading('NDIS Worker Screening');
  doc.bulletList([
    'All current workers hold valid NDIS Worker Screening Checks. The Worker Screening and Recruitment Procedure (Form109) is being followed consistently.',
    'Two new workers onboarded in Q2 2026 — both completed screening checks prior to commencement of duties.',
    'Worker screening expiry dates are tracked in the Training Matrix (Form09) and monitored monthly.',
  ]);
  doc.subHeading('Mandatory Training Completion');
  doc.dataTable(
    ['TRAINING MODULE', 'COMPLETION RATE', 'NOTES'],
    [
      ['NDIS Worker Orientation Module', '100%', 'All workers completed'],
      ['Infection Prevention & Control', '96%', '1 worker due for refresh (scheduled)'],
      ['Manual Handling / Safe Transfers', '100%', 'Refresher completed April 2026'],
      ['Medication Management', '100%', 'All SIL staff certified'],
      ['Fire Safety & Emergency Response', '94%', '2 casual workers to complete by end June'],
      ['First Aid / CPR', '100%', 'All current certificates valid'],
      ['Restrictive Practices Awareness', '100%', 'Module 1 staff completed'],
    ],
    [58, 30, 90],
  );
  doc.paragraph(
    'The Professional Development Policy (Form113) continues to guide investment in staff capability. Two staff members have commenced Certificate IV in Disability Support, funded by OLF.'
  );

  // ─── Agenda Item 4 ───────────────────────────────────────────────────
  doc.sectionHeading('4. Participant Outcomes');
  doc.subHeading('Support Plan Reviews');
  doc.bulletList([
    'All participant support plans are current and have been reviewed within the required timeframes.',
    'Goal plans (Form26) have been updated for all participants following their most recent NDIS plan reviews.',
    'Progress notes compliance is at 98% \u2014 daily notes are completed for all SIL participants via the Document Vault system.',
  ]);
  doc.subHeading('Incident Trends');
  doc.bulletList([
    'Total incidents reported (Jan\u2013May 2026): 7 (down from 12 in the same period 2025).',
    'Categories: 3 minor medication errors (all resolved, no participant harm), 2 behavioural incidents (BSP followed), 1 property damage, 1 near-miss (manual handling).',
    'All incidents were reported within required timeframes. NDIS Commission notifications were made where required.',
    'Root cause analysis was completed for all incidents and corrective actions documented in the Improvement Register (Form59).',
  ]);

  // ─── Agenda Item 5 ───────────────────────────────────────────────────
  doc.sectionHeading('5. Risk Management');
  doc.paragraph(
    'The General Manager reviewed the current risk register (Form01) and hazard register.'
  );
  doc.bulletList([
    'Risk Register (Form01): 14 risks identified across operational, clinical, financial, and WHS categories. 2 rated High (participant falls, medication error), remainder Medium or Low. All controls are in place and operating effectively.',
    'Hazard Register: HSE Inspection Checklists (Form63) have been completed monthly for the Epping SIL house. No outstanding hazards.',
    'WHS: Zero lost-time injuries for the period. Workers are encouraged to report hazards through the online reporting system.',
    'Risk-Assessed Roles Register (Form61) has been updated to reflect current positions and associated risk levels.',
  ]);

  // ─── Agenda Item 6 ───────────────────────────────────────────────────
  doc.sectionHeading('6. Operational Performance');
  doc.subHeading('SIL House Operations');
  doc.bulletList([
    '59 Severn Street, Epping VIC 3076 \u2014 operating at full capacity with 3 participants.',
    'All participants are engaged in their support plans and report satisfaction with services provided.',
    'The SIL House Accommodation Audit Checklist (Form106) was completed in April 2026 with no non-conformances identified.',
  ]);
  doc.subHeading('Staffing and Roster Coverage');
  doc.bulletList([
    'Current workforce: 12 active workers (4 full-time, 3 part-time, 5 casual).',
    'Roster coverage is maintained at 100% \u2014 no unfilled shifts in the reporting period.',
    'Rostering Schedule (Form60) is reviewed weekly by the Operations Manager.',
    'Staff retention rate: 92% (above industry average for disability services).',
  ]);

  // ─── Agenda Item 7 ───────────────────────────────────────────────────
  doc.sectionHeading('7. Continuous Improvement');
  doc.subHeading('Improvement Register');
  doc.bulletList([
    'The Continuous Improvement Register (Form59) contains 11 active improvement items for 2026.',
    '6 items completed (closed), 4 in progress, 1 planned.',
    'Key improvements implemented: enhanced medication administration procedures, updated emergency contact displays at SIL house, streamlined participant progress note template.',
  ]);
  doc.subHeading('Feedback and Complaints');
  doc.bulletList([
    'Complaints received (Jan\u2013May 2026): 1 \u2014 resolved within 5 business days. Complaint related to rostering preferences (participant). Outcome documented in Complaint Register (Form12).',
    'Positive feedback received: 4 compliments from participants/families regarding quality of support.',
    'Participant satisfaction surveys (Form31) are being distributed quarterly. Most recent survey results show 94% satisfaction rate.',
  ]);

  // ─── Agenda Item 8 ───────────────────────────────────────────────────
  doc.sectionHeading('8. Financial Overview');
  doc.bulletList([
    'NDIS funding utilisation for Q1\u2013Q2 2026 is tracking within budget parameters.',
    'Insurance Register (Form112) has been reviewed \u2014 all policies are current and coverage levels are appropriate.',
    'Business Plan 2026\u20132028 (Form05) objectives are on track \u2014 service expansion planning is underway for potential additional SIL properties.',
    'No financial risks identified that require immediate action.',
  ]);

  // ─── Agenda Item 9 ───────────────────────────────────────────────────
  doc.sectionHeading('9. Property and Maintenance');
  doc.paragraph(
    'The Operations Manager provided an update on the Epping SIL house property and maintenance items.'
  );
  doc.bulletList([
    'Routine maintenance is on schedule \u2014 quarterly pest control, air conditioning servicing, and fire safety equipment checks completed.',
    'Minor repair completed in April: replacement of bathroom grab rail (participant request).',
    'Garden maintenance is ongoing fortnightly.',
    'Emergency and Disaster Management Plan (Form82) for the Epping property has been reviewed and updated. Emergency drill was conducted in March 2026 (Form81).',
    'COVID-19 Response Plan (Form102) remains in place and is reviewed quarterly.',
  ]);

  // ─── Agenda Item 10 ──────────────────────────────────────────────────
  doc.sectionHeading('10. Action Items and Next Meeting');
  doc.dataTable(
    ['#', 'ACTION ITEM', 'RESPONSIBLE', 'DUE DATE'],
    [
      ['1', 'Complete fire safety training for 2 remaining casual workers', 'Swosthani Thapa', '30 June 2026'],
      ['2', 'Distribute Q2 participant satisfaction surveys', 'Marrion Ramos', '15 June 2026'],
      ['3', 'Review and update Business Continuity Plan (Form103)', 'Kevin Geronimo', '30 June 2026'],
      ['4', 'Progress SIL expansion feasibility assessment', 'Harsimran Singh', '1 September 2026'],
      ['5', 'Schedule next internal audit cycle (Form16)', 'Kevin Geronimo', '1 July 2026'],
      ['6', 'Update Training Matrix for Q2 completions', 'Swosthani Thapa', '15 July 2026'],
      ['7', 'Review Clinical Governance Framework (Form110)', 'Kevin Geronimo', '1 August 2026'],
    ],
    [8, 80, 38, 30],
  );

  doc.space(4);
  doc.paragraph('Next Management Review Meeting: 1 September 2026', { bold: true });
  doc.space(6);

  // Sign-off
  doc.sectionHeading('Meeting Sign-Off');
  doc.infoTable([
    ['Chair', 'Harsimran Singh, Director'],
    ['Signature', ''],
    ['Date', '1 June 2026'],
  ]);

  doc.space(4);
  doc.infoTable([
    ['Minutes Prepared By', 'Marrion Isabel Ramos, HR/Admin Officer'],
    ['Signature', ''],
    ['Date', '1 June 2026'],
  ]);

  return doc.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT 3: Form108 — NDIS Policy Manual Addendum V02
// ═══════════════════════════════════════════════════════════════════════════
function generateForm108() {
  console.log('  Generating Form108.NDIS Policy Manual Addendum V02...');

  const doc = new OLFDocument({
    docNo: 'Form108',
    docTitle: 'NDIS Policy Manual Addendum V02',
    version: '2.0',
    effectiveDate: '1 January 2026',
    reviewDate: '1 January 2027',
  });

  doc.title('NDIS Policy Manual Addendum');
  doc.paragraph('Version 02', { bold: true, size: 11, color: NAVY });
  doc.space(2);

  // ─── Section 1: Introduction ─────────────────────────────────────────
  doc.sectionHeading('1. Introduction');
  doc.paragraph(
    'As part of One Life Foundation\'s commitment to continuous improvement and excellence in service delivery, this addendum supplements the core NDIS Policy Manual (1-NDIS Manual) with additional policies, procedures, and operational enhancements developed since the original manual was established.'
  );
  doc.paragraph(
    'This addendum was developed to address identified gaps in documentation and operational practice, strengthen governance arrangements, and ensure comprehensive alignment with the NDIS Practice Standards and Quality Indicators. The additional documents listed herein represent One Life Foundation\'s proactive approach to quality management and regulatory compliance.'
  );

  // ─── Section 2: Purpose ──────────────────────────────────────────────
  doc.sectionHeading('2. Purpose');
  doc.bulletList([
    'Document additional policies and procedures that supplement the core NDIS Policy Manual.',
    'Provide a centralised reference for all supplementary governance, operational, and clinical documents.',
    'Demonstrate One Life Foundation\'s commitment to continuous improvement in quality and safeguarding.',
    'Ensure all operational enhancements are formally recorded, version-controlled, and accessible to staff.',
    'Support alignment with the NDIS Practice Standards across all Core Modules and Supplementary Modules.',
  ]);

  // ─── Section 3: Scope ───────────────────────────────────────────────
  doc.sectionHeading('3. Scope');
  doc.paragraph(
    'This addendum applies to all One Life Foundation operations, including Supported Independent Living (SIL), community access, and all registered NDIS support categories. It is applicable to all workers, management, and contracted personnel engaged by One Life Foundation.'
  );

  // ─── Section 4: Supplementary Documents ──────────────────────────────
  doc.sectionHeading('4. Supplementary Documents');
  doc.paragraph(
    'The following documents have been developed and implemented to enhance One Life Foundation\'s Quality Management System. Each document is aligned with specific NDIS Practice Standard modules and quality indicators.'
  );
  doc.space(2);

  doc.subHeading('4.1 Governance and Operations');
  doc.dataTable(
    ['DOC NO.', 'DOCUMENT TITLE', 'PRACTICE STANDARD ALIGNMENT', 'STATUS'],
    [
      ['Form100', 'Organisation Chart', 'Core Module 3 \u2014 Governance & Operational Management', 'Implemented'],
      ['Form103', 'Business Continuity Plan', 'Core Module 3 / Module 7 \u2014 Continuity of Supports', 'Implemented'],
      ['Form104', 'Digital Compliance Monitoring Policy', 'Core Module 3 / Module 5 \u2014 Quality Management', 'Implemented'],
      ['Form105', 'Digital Registers Management Policy', 'Core Module 3 / Module 5 \u2014 Quality Management', 'Implemented'],
      ['Form107', 'Policy Document Register', 'Core Module 3 / Module 5 \u2014 Quality Management', 'Implemented'],
      ['Form112', 'Insurance Register', 'Core Module 3 \u2014 Governance & Operational Management', 'Implemented'],
    ],
    [22, 52, 72, 24],
    { firstColBold: true }
  );

  doc.subHeading('4.2 Human Resources and Worker Management');
  doc.dataTable(
    ['DOC NO.', 'DOCUMENT TITLE', 'PRACTICE STANDARD ALIGNMENT', 'STATUS'],
    [
      ['Form109', 'Worker Screening and Recruitment Procedure', 'Core Module 6 \u2014 Human Resource Management', 'Implemented'],
      ['Form111', 'OLF Code of Conduct', 'Core Module 1 \u2014 Rights & Responsibilities', 'Implemented'],
      ['Form113', 'Professional Development Policy', 'Core Module 6 \u2014 Human Resource Management', 'Implemented'],
      ['Form114', 'Performance Management Procedure', 'Core Module 6 \u2014 Human Resource Management', 'Implemented'],
    ],
    [22, 52, 72, 24],
    { firstColBold: true }
  );

  doc.subHeading('4.3 Clinical Governance');
  doc.dataTable(
    ['DOC NO.', 'DOCUMENT TITLE', 'PRACTICE STANDARD ALIGNMENT', 'STATUS'],
    [
      ['Form110', 'Clinical Governance Framework', 'Supplementary Module \u2014 High Intensity Daily Personal Activities', 'Implemented'],
    ],
    [22, 52, 72, 24],
    { firstColBold: true }
  );

  doc.subHeading('4.4 Participant and Worker Handbooks');
  doc.dataTable(
    ['DOC NO.', 'DOCUMENT TITLE', 'PRACTICE STANDARD ALIGNMENT', 'STATUS'],
    [
      ['2-Worker Handbook', 'Worker Handbook (V02)', 'Core Module 6 \u2014 Human Resource Management', 'Implemented'],
      ['3-Participant Handbook', 'Participant Handbook (V02)', 'Core Module 1 \u2014 Rights & Responsibilities', 'Implemented'],
    ],
    [22, 52, 72, 24],
    { firstColBold: true }
  );

  doc.subHeading('4.5 Business Planning');
  doc.dataTable(
    ['DOC NO.', 'DOCUMENT TITLE', 'PRACTICE STANDARD ALIGNMENT', 'STATUS'],
    [
      ['Form05', 'Business Plan 2026\u20132028', 'Core Module 3 \u2014 Governance & Operational Management', 'Implemented'],
    ],
    [22, 52, 72, 24],
    { firstColBold: true }
  );

  // ─── Section 5: Implementation ──────────────────────────────────────
  doc.sectionHeading('5. Implementation and Communication');
  doc.paragraph(
    'All supplementary documents listed in this addendum have been:'
  );
  doc.bulletList([
    'Reviewed and approved by the Director, Harsimran Singh.',
    'Communicated to all relevant staff through team meetings, the Document Vault, and individual induction processes.',
    'Made available to all workers via the One Life Foundation Document Vault (online portal).',
    'Incorporated into the staff induction process for all new workers.',
    'Recorded in the Policy Document Register (Form107) with assigned version numbers and review dates.',
  ]);

  // ─── Section 6: Alignment with NDIS Practice Standards ──────────────
  doc.sectionHeading('6. Alignment with NDIS Practice Standards');
  doc.paragraph(
    'The supplementary documents in this addendum address quality indicators across the following NDIS Practice Standard modules:'
  );
  doc.dataTable(
    ['PRACTICE STANDARD MODULE', 'RELEVANT DOCUMENTS'],
    [
      ['Core Module 1 \u2014 Rights & Responsibilities', 'Form111 (Code of Conduct), Participant Handbook V02'],
      ['Core Module 3 \u2014 Governance & Operational Management', 'Form100, Form103, Form104, Form105, Form107, Form112, Form05'],
      ['Core Module 5 \u2014 Quality Management', 'Form104, Form105, Form107, this Addendum (Form108)'],
      ['Core Module 6 \u2014 Human Resource Management', 'Form109, Form113, Form114, Worker Handbook V02'],
      ['Core Module 7 \u2014 Continuity of Supports', 'Form103 (Business Continuity Plan)'],
      ['Supplementary Module \u2014 High Intensity', 'Form110 (Clinical Governance Framework)'],
    ],
    [62, 116],
  );

  // ─── Section 7: Continuous Improvement ──────────────────────────────
  doc.sectionHeading('7. Continuous Improvement');
  doc.paragraph(
    'One Life Foundation is committed to the ongoing development and refinement of its policies and procedures. This addendum will be reviewed annually as part of the scheduled management review process, and updated as needed to reflect:'
  );
  doc.bulletList([
    'Changes to NDIS legislation, Practice Standards, or Quality Indicators.',
    'Findings from internal audits and external reviews.',
    'Feedback from participants, families, workers, and stakeholders.',
    'Identified gaps in documentation or operational practice.',
    'Lessons learned from incidents, complaints, and near-misses.',
  ]);

  // ─── Section 8: Document Control ────────────────────────────────────
  doc.sectionHeading('8. Document Control');
  doc.infoTable([
    ['Document Owner', 'Harsimran Singh, Director'],
    ['Maintained By', 'Kevin Rae Geronimo, General Manager'],
    ['Review Frequency', 'Annually, or as required following legislative/regulatory changes'],
    ['Distribution', 'Internal \u2014 available to all OLF staff via the Document Vault'],
    ['Classification', 'Confidential \u2014 Internal Use Only'],
  ]);

  doc.sectionHeading('9. Version History');
  doc.dataTable(
    ['VERSION', 'DATE', 'DESCRIPTION', 'AUTHOR'],
    [
      ['1.0', '1 July 2024', 'Initial addendum created', 'Kevin Rae Geronimo'],
      ['2.0', '1 January 2026', 'Major update \u2014 additional policies documented, alignment with NDIS Practice Standards updated, all review dates standardised', 'Kevin Rae Geronimo'],
    ],
    [20, 30, 90, 38],
  );

  doc.sectionHeading('10. Approval');
  doc.infoTable([
    ['Prepared By', 'Kevin Rae Geronimo, General Manager'],
    ['Reviewed By', 'Swosthani Thapa, Operations Manager'],
    ['Approved By', 'Harsimran Singh, Director'],
    ['Approval Date', '1 January 2026'],
  ]);

  return doc.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD AND SAVE
// ═══════════════════════════════════════════════════════════════════════════
async function uploadAndSave(pdfBytes, fileName, storagePath, auditPortalFolders) {
  // 1. Upload to documents bucket
  const { error: docErr } = await sb.storage.from('documents').upload(
    storagePath, pdfBytes,
    { contentType: 'application/pdf', upsert: true }
  );
  if (docErr) throw new Error(`documents upload failed: ${docErr.message}`);
  console.log(`    -> Uploaded to documents/${storagePath}`);

  // 2. Upload to auditor-portal bucket folders
  for (const folder of auditPortalFolders) {
    const { error: apErr } = await sb.storage.from('auditor-portal').upload(
      `${folder}/${fileName}`, pdfBytes,
      { contentType: 'application/pdf', upsert: true }
    );
    if (apErr) {
      console.error(`    -> FAILED auditor-portal/${folder}/${fileName}: ${apErr.message}`);
    } else {
      console.log(`    -> Uploaded to auditor-portal/${folder}/${fileName}`);
    }
  }

  // 3. Save local copy
  const localPath = `${DOWNLOADS}/${fileName}`;
  writeFileSync(localPath, pdfBytes);
  console.log(`    -> Saved to ${localPath}`);
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═'.repeat(60));
  console.log('Regenerating 3 OLF PDFs (audit references removed)');
  console.log('═'.repeat(60));

  const AUDIT_PORTAL_M3 = '4298ed63-bb7d-4b93-85e0-9ae063030880'; // Core Module 3
  const AUDIT_PORTAL_M5 = 'ac10614b-9215-4185-a125-3a05606e0d33'; // Core Module 5

  let ok = 0;

  try {
    // 1. Form107
    console.log('\n[1/3] Form107.Policy Document Register');
    const form107 = generateForm107();
    console.log(`  Generated: ${(form107.length / 1024).toFixed(0)} KB`);
    await uploadAndSave(
      form107,
      'Form107.Policy Document Register.pdf',
      'Policies and Procedures/Core 2 - Governance & Operations/Form107.Policy Document Register.pdf',
      [AUDIT_PORTAL_M3]
    );
    ok++;

    // 2. Form25
    console.log('\n[2/3] Form25.Management Review Meeting Minutes - June 2026');
    const form25 = generateForm25();
    console.log(`  Generated: ${(form25.length / 1024).toFixed(0)} KB`);
    await uploadAndSave(
      form25,
      'Form25.Management Review Meeting Minutes - June 2026.pdf',
      'Policies and Procedures/Core 2 - Governance & Operations/Form25.Management Review Meeting Minutes - June 2026.pdf',
      [AUDIT_PORTAL_M3]
    );
    ok++;

    // 3. Form108
    console.log('\n[3/3] Form108.NDIS Policy Manual Addendum V02');
    const form108 = generateForm108();
    console.log(`  Generated: ${(form108.length / 1024).toFixed(0)} KB`);
    await uploadAndSave(
      form108,
      'Form108.NDIS Policy Manual Addendum V02.pdf',
      'Policies and Procedures/Core 2 - Governance & Operations/Form108.NDIS Policy Manual Addendum V02.pdf',
      [AUDIT_PORTAL_M3, AUDIT_PORTAL_M5]
    );
    ok++;

  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`Done! ${ok}/3 documents regenerated and uploaded.`);
  console.log('═'.repeat(60));
}

main();
