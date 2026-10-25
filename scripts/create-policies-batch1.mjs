/**
 * create-policies-batch1.mjs
 *
 * Generates 3 NDIS Policy PDFs for One Life Foundation:
 *   1. Form115 — Privacy and Information Management Policy
 *   2. Form116 — Complaints and Feedback Management Policy
 *   3. Form117 — Incident Management Policy
 *
 * Saves each to C:/Users/kevin/Downloads/ AND uploads to Supabase Storage
 * at documents/Forms Updated/[filename].
 *
 * Usage: node scripts/create-policies-batch1.mjs
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
// SHARED HELPERS
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
// DOCUMENT 1: Form115 — Privacy and Information Management Policy
// ═══════════════════════════════════════════════════════════════════════════════

function buildForm115() {
  const pdf = new PDFBuilder({
    docNo: 'Form115',
    title: 'Privacy and Information Management Policy',
    categoryLine1: 'Policy & Procedure',
    categoryLine2: 'Information Management',
  });

  // ─── COVER PAGE ──────────────────────────────────────────────────────────
  pdf.drawCoverPage(
    'Privacy and Information Management Policy',
    'Protecting personal and health information of participants, staff, and stakeholders in compliance with Australian privacy legislation and NDIS Practice Standards',
    [
      ['Document Number', 'Form115'],
      ['Version', '1.0'],
      ['Effective Date', '1 January 2026'],
      ['Review Date', '1 January 2027'],
      ['Document Owner', 'Kevin Rae Geronimo, General Manager'],
      ['Approved By', 'Harsimran Singh, Director'],
      ['Applies To', 'All staff, contractors, and volunteers'],
      ['Related Legislation', 'Privacy Act 1988 (Cth), Health Records Act 2001 (Vic), NDIS Act 2013, Australian Privacy Principles'],
      ['NDIS Practice Standard', 'Standard 117 — Information Management'],
    ]
  );

  // ─── 1. PURPOSE ──────────────────────────────────────────────────────────
  pdf.newPage();
  pdf.sectionHeading('1. Purpose');
  pdf.writeBody(
    'The purpose of this policy is to establish a comprehensive framework for the protection, management, and appropriate use of personal and health information held by One Life Foundation Pty Ltd (OLF). This policy ensures compliance with the Privacy Act 1988 (Cth), the Health Records Act 2001 (Vic), the NDIS Act 2013, and the Australian Privacy Principles (APPs).'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'OLF is committed to protecting the privacy and confidentiality of all personal information collected in the course of delivering NDIS supports. This commitment extends to participants, families, guardians, staff, contractors, volunteers, and all stakeholders. The policy is aligned with NDIS Practice Standards, particularly Standard 117 — Information Management, which requires that each participant\'s information is managed to ensure that it is identifiable, accurately recorded, current, and confidential.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'This policy outlines the principles, procedures, and responsibilities that govern how OLF collects, stores, uses, discloses, and disposes of personal information, ensuring that all information management practices are lawful, transparent, and respectful of individual rights.'
  );

  // ─── 2. SCOPE ────────────────────────────────────────────────────────────
  pdf.sectionHeading('2. Scope');
  pdf.writeBody('This policy applies to:');
  pdf.writeBullet('All employees, contractors, volunteers, and agents of One Life Foundation');
  pdf.writeBullet('All personal information, health information, and sensitive information collected, stored, used, or disclosed by OLF');
  pdf.writeBullet('All formats of information including digital records, physical documents, verbal communications, photographs, and audio/video recordings');
  pdf.writeBullet('All OLF service delivery locations including Supported Independent Living (SIL) houses, the head office at 9C Grasslands Avenue, Craigieburn VIC 3064, and the SIL property at 59 Severn Street, Epping VIC 3076');
  pdf.writeBullet('All OLF digital systems including the One Life Vault document management system, email, cloud storage, and mobile devices');

  // ─── 3. DEFINITIONS ─────────────────────────────────────────────────────
  pdf.sectionHeading('3. Definitions');
  pdf.drawTable(
    ['Term', 'Definition'],
    [
      ['Personal Information', 'Information or an opinion about an identified individual, or an individual who is reasonably identifiable, whether true or not and whether recorded in a material form or not (s 6 Privacy Act 1988).'],
      ['Health Information', 'Personal information about an individual\'s health, disability, or health service, including information collected in the provision of a health service or disability service.'],
      ['Sensitive Information', 'A subset of personal information including racial/ethnic origin, political opinions, religious beliefs, sexual orientation, criminal record, biometric information, and health information.'],
      ['Data Breach', 'Unauthorised access to, or disclosure, loss, or theft of personal information that is likely to result in serious harm to affected individuals.'],
      ['Consent', 'Voluntary agreement given by an individual (or their authorised representative) for the collection, use, or disclosure of their personal information for a stated purpose.'],
      ['APP', 'Australian Privacy Principles — the 13 principles set out in Schedule 1 of the Privacy Act 1988 that regulate the handling of personal information.'],
      ['OAIC', 'Office of the Australian Information Commissioner — the independent national regulator for privacy and freedom of information.'],
    ],
    [55, CW - 55]
  );

  // ─── 4. AUSTRALIAN PRIVACY PRINCIPLES ───────────────────────────────────
  pdf.sectionHeading('4. Australian Privacy Principles (APPs) Compliance');
  pdf.writeBody(
    'OLF is committed to complying with all 13 Australian Privacy Principles. The following outlines how OLF implements each principle in the context of NDIS service delivery:'
  );
  pdf.curY += 3;

  pdf.subHeading('APP 1 — Open and Transparent Management');
  pdf.writeBody('OLF maintains this Privacy Policy and makes it available to all participants, staff, and stakeholders. The policy is published on the One Life Vault portal and provided to participants at the commencement of services. OLF has clear procedures for handling personal information and responds to privacy enquiries promptly.');

  pdf.subHeading('APP 2 — Anonymity and Pseudonymity');
  pdf.writeBody('Where lawful and practicable, individuals may deal with OLF anonymously or using a pseudonym. However, in most cases, identification is necessary to deliver NDIS supports and fulfil contractual and legislative obligations.');

  pdf.subHeading('APP 3 — Collection of Solicited Personal Information');
  pdf.writeBody('OLF only collects personal information that is reasonably necessary for, or directly related to, the provision of NDIS supports. Collection methods include intake forms, service agreements, care plans, progress notes, incident reports, and direct conversations with participants and their support networks.');

  pdf.subHeading('APP 4 — Dealing with Unsolicited Personal Information');
  pdf.writeBody('If OLF receives personal information that was not solicited and is not reasonably necessary for service delivery, the information will be destroyed or de-identified as soon as practicable, unless it would be lawful to retain it.');

  pdf.subHeading('APP 5 — Notification of Collection');
  pdf.writeBody('At or before the time of collecting personal information, OLF notifies individuals of: the purpose of collection, the types of third parties to whom information may be disclosed, how the individual can access and correct their information, and the consequences (if any) of not providing the information.');

  pdf.subHeading('APP 6 — Use and Disclosure');
  pdf.writeBody('Personal information is used and disclosed only for the primary purpose for which it was collected, or a directly related secondary purpose that the individual would reasonably expect. Exceptions apply where:');
  pdf.writeBullet('The individual has consented to the use or disclosure');
  pdf.writeBullet('The use or disclosure is required or authorised by law (e.g., mandatory reporting)');
  pdf.writeBullet('OLF reasonably believes disclosure is necessary to prevent a serious threat to the life, health, or safety of any individual');
  pdf.writeBullet('The NDIS Quality and Safeguards Commission requests the information');

  pdf.subHeading('APP 7 — Direct Marketing');
  pdf.writeBody('OLF does not use participant personal information for direct marketing purposes. OLF may use staff and stakeholder contact details for organisational communications directly related to OLF services and operations.');

  pdf.subHeading('APP 8 — Cross-Border Disclosure');
  pdf.writeBody('OLF does not routinely disclose personal information to overseas recipients. Where OLF uses cloud-based services, it ensures that data hosting complies with Australian privacy standards. The One Life Vault system uses Supabase with Australian-region data hosting. Vercel is used for application deployment with appropriate security measures.');

  pdf.subHeading('APP 9 — Adoption, Use, or Disclosure of Government-Related Identifiers');
  pdf.writeBody('OLF records NDIS participant numbers and other government-related identifiers only as necessary for service delivery and NDIS claims. These identifiers are not used as OLF\'s own identifier for participants and are stored securely.');

  pdf.subHeading('APP 10 — Quality of Personal Information');
  pdf.writeBody('OLF takes reasonable steps to ensure that personal information collected, used, or disclosed is accurate, up-to-date, complete, and relevant. Participant records are reviewed during care plan reviews and service agreement renewals. Staff are trained to verify and update information regularly.');

  pdf.subHeading('APP 11 — Security of Personal Information');
  pdf.writeBody('OLF implements robust security measures to protect personal information from misuse, interference, loss, unauthorised access, modification, or disclosure:');
  pdf.writeBullet('Digital records are stored in the One Life Vault system with role-based access controls and encryption');
  pdf.writeBullet('Physical records are secured in locked filing cabinets at the head office with restricted access');
  pdf.writeBullet('Strong password policies are enforced for all OLF systems');
  pdf.writeBullet('Staff are prohibited from storing participant information on personal devices');
  pdf.writeBullet('Regular security audits are conducted to identify and address vulnerabilities');

  pdf.subHeading('APP 12 — Access to Personal Information');
  pdf.writeBody('Participants and staff have the right to request access to their personal information held by OLF. Access requests can be made verbally or in writing to the General Manager. OLF will respond within 30 calendar days. Access may be refused in limited circumstances (e.g., if access would pose a serious threat to safety, or where legally exempt).');

  pdf.subHeading('APP 13 — Correction of Personal Information');
  pdf.writeBody('Individuals may request correction of personal information that is inaccurate, out-of-date, incomplete, irrelevant, or misleading. OLF will correct the information within 30 calendar days of the request. If OLF refuses to correct the information, the individual will be provided with written reasons and informed of their right to lodge a complaint.');

  // ─── 5. COLLECTION ──────────────────────────────────────────────────────
  pdf.sectionHeading('5. Collection of Personal Information');
  pdf.writeBody('OLF collects personal information to deliver high-quality NDIS supports. The following principles govern collection:');
  pdf.curY += 2;

  pdf.subHeading('5.1 What We Collect');
  pdf.writeBullet('Participant details: full name, date of birth, address, contact details, NDIS number, emergency contacts');
  pdf.writeBullet('Health information: medical conditions, medications, allergies, disability support needs, care plans, risk assessments');
  pdf.writeBullet('Support records: progress notes, daily logs, incident reports, shift handover notes');
  pdf.writeBullet('Financial information: NDIS plan details, service agreement pricing, invoicing records');
  pdf.writeBullet('Staff information: employment records, qualifications, training records, working with children checks, NDIS Worker Screening checks');

  pdf.subHeading('5.2 How We Collect');
  pdf.writeBullet('Directly from the individual (preferred method)');
  pdf.writeBullet('From authorised representatives, guardians, or nominees');
  pdf.writeBullet('From other service providers with consent (e.g., Support Coordinators, GPs, allied health professionals)');
  pdf.writeBullet('From government agencies where authorised (e.g., NDIA, NDIS Commission)');

  pdf.subHeading('5.3 Consent');
  pdf.writeBody('OLF obtains informed consent before collecting personal information. Consent is documented in the service agreement and specific consent forms. Participants are informed of their right to withdraw consent at any time, noting that withdrawal may affect OLF\'s ability to deliver supports.');

  // ─── 6. STORAGE AND SECURITY ────────────────────────────────────────────
  pdf.sectionHeading('6. Storage and Security');

  pdf.subHeading('6.1 Digital Storage');
  pdf.writeBullet('One Life Vault (primary document management system) — hosted on Supabase with encrypted database, role-based access controls, and audit logging');
  pdf.writeBullet('Email communications via organisational email accounts with appropriate security settings');
  pdf.writeBullet('Cloud deployment via Vercel with HTTPS encryption and secure API endpoints');
  pdf.writeBullet('All digital systems require multi-factor authentication where available');

  pdf.subHeading('6.2 Physical Storage');
  pdf.writeBullet('Physical records are stored in locked filing cabinets at the head office (9C Grasslands Avenue, Craigieburn VIC 3064)');
  pdf.writeBullet('Access to physical records is restricted to authorised personnel only');
  pdf.writeBullet('SIL house files contain only essential current care information; historical records are held at head office');
  pdf.writeBullet('Visitor access to record storage areas is supervised at all times');

  pdf.subHeading('6.3 Password and Access Controls');
  pdf.writeBullet('All staff must use unique, complex passwords (minimum 12 characters, combination of upper/lower case, numbers, and symbols)');
  pdf.writeBullet('Passwords must be changed every 90 days');
  pdf.writeBullet('Shared accounts or passwords are strictly prohibited');
  pdf.writeBullet('Access permissions are reviewed quarterly and revoked immediately upon cessation of employment');

  pdf.subHeading('6.4 Personal Devices');
  pdf.writeBody('Staff must not store participant personal information on personal devices (phones, tablets, laptops, USB drives). All work-related information must be accessed through OLF\'s approved systems. Any incidental information received on personal devices (e.g., text messages from participants) must be transferred to OLF systems and deleted from the personal device.');

  // ─── 7. USE AND DISCLOSURE ──────────────────────────────────────────────
  pdf.sectionHeading('7. Use and Disclosure');
  pdf.writeBody('OLF uses and discloses personal information only for the primary purpose for which it was collected, subject to the following:');
  pdf.curY += 2;

  pdf.subHeading('7.1 Permitted Uses');
  pdf.writeBullet('Delivering NDIS supports and services as outlined in the participant\'s service agreement');
  pdf.writeBullet('Care coordination with other providers involved in the participant\'s support network (with consent)');
  pdf.writeBullet('NDIS claims and invoicing through the NDIA portal');
  pdf.writeBullet('Internal quality assurance, training, and continuous improvement activities (de-identified where possible)');
  pdf.writeBullet('Compliance with legislative and regulatory requirements');

  pdf.subHeading('7.2 Disclosure Without Consent');
  pdf.writeBody('OLF may disclose personal information without consent in the following circumstances:');
  pdf.writeBullet('Where required by law (e.g., mandatory reporting of abuse or neglect)');
  pdf.writeBullet('Where necessary to prevent a serious threat to life, health, or safety');
  pdf.writeBullet('Where requested by the NDIS Quality and Safeguards Commission during audits or investigations');
  pdf.writeBullet('Where required by a court order or law enforcement authority');
  pdf.writeBullet('Where necessary to locate a missing person');

  pdf.subHeading('7.3 Sharing with Other Providers');
  pdf.writeBody('Information sharing with other NDIS providers, health professionals, or Support Coordinators requires participant consent, which is documented in the service agreement or a specific consent form. OLF shares only the minimum information necessary for the stated purpose.');

  // ─── 8. DATA BREACHES ───────────────────────────────────────────────────
  pdf.sectionHeading('8. Data Breaches');

  pdf.subHeading('8.1 Notifiable Data Breaches Scheme');
  pdf.writeBody('OLF complies with the Notifiable Data Breaches (NDB) scheme under Part IIIC of the Privacy Act 1988. A data breach occurs when personal information is accessed, disclosed, or lost without authorisation, and is likely to result in serious harm to affected individuals.');

  pdf.subHeading('8.2 Response Procedure');
  pdf.writeBullet('Step 1: Staff member who identifies or suspects a breach reports immediately to the General Manager');
  pdf.writeBullet('Step 2: The General Manager contains the breach (e.g., disabling access, changing passwords, recovering lost documents)');
  pdf.writeBullet('Step 3: Assessment is conducted within 30 days to determine if the breach is an "eligible data breach" (i.e., likely to result in serious harm)');
  pdf.writeBullet('Step 4: If the breach is eligible, OLF notifies the OAIC and affected individuals as soon as practicable');
  pdf.writeBullet('Step 5: An internal incident report (Form04) is completed documenting the breach, response actions, and preventive measures');
  pdf.writeBullet('Step 6: Corrective actions are implemented and documented in the Continuous Improvement Register (Form59)');

  pdf.subHeading('8.3 Notification Content');
  pdf.writeBody('Notifications to the OAIC and affected individuals must include: the identity and contact details of OLF, a description of the breach, the type of information involved, and recommended steps individuals should take in response.');

  // ─── 9. PARTICIPANT RIGHTS ──────────────────────────────────────────────
  pdf.sectionHeading('9. Participant Rights');
  pdf.writeBody('Participants have the following rights in relation to their personal information:');
  pdf.curY += 2;

  pdf.writeBullet('Right to access: Participants may request access to their personal information held by OLF at any time. OLF will respond within 30 calendar days.');
  pdf.writeBullet('Right to correction: Participants may request correction of inaccurate, out-of-date, incomplete, irrelevant, or misleading information. OLF will make corrections within 30 calendar days.');
  pdf.writeBullet('Right to complain: Participants may lodge a complaint about OLF\'s handling of their personal information. Complaints are managed in accordance with Form116 — Complaints and Feedback Management Policy.');
  pdf.writeBullet('Right to withdraw consent: Participants may withdraw consent for the collection, use, or disclosure of their information at any time. OLF will inform the participant of any consequences of withdrawal.');
  pdf.writeBullet('Right to be informed: Participants are entitled to know what information OLF holds about them, why it is held, and who it has been shared with.');

  pdf.curY += 2;
  pdf.writeBody('If a participant is dissatisfied with OLF\'s response to a privacy complaint, they may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au or phone 1300 363 992.');

  // ─── 10. RETENTION AND DISPOSAL ─────────────────────────────────────────
  pdf.sectionHeading('10. Retention and Disposal');

  pdf.subHeading('10.1 Retention Period');
  pdf.writeBody('OLF retains personal information for a minimum of 7 years from the date of last service delivery, in accordance with NDIS requirements and the Health Records Act 2001 (Vic). Records relating to children are retained until the individual reaches 25 years of age or 7 years after last service (whichever is longer).');

  pdf.subHeading('10.2 Secure Disposal');
  pdf.writeBody('When personal information is no longer required and the retention period has expired, OLF ensures secure destruction:');
  pdf.writeBullet('Physical documents: cross-cut shredding, with disposal documented in a destruction register');
  pdf.writeBullet('Digital records: permanent deletion from all systems including backups, with deletion logged');
  pdf.writeBullet('Disposal is authorised by the General Manager and documented with the date, type of record, and method of destruction');

  // ─── 11. STAFF OBLIGATIONS ──────────────────────────────────────────────
  pdf.sectionHeading('11. Staff Obligations');
  pdf.writeBody('All OLF staff, contractors, and volunteers are bound by the following obligations:');
  pdf.curY += 2;

  pdf.writeBullet('Sign the Privacy and Confidentiality Agreement (Form19) and the Employee Confidentiality Agreement prior to commencing duties');
  pdf.writeBullet('Complete privacy and information management training during induction, with annual refresher training');
  pdf.writeBullet('Access only the personal information necessary for their role and duties');
  pdf.writeBullet('Do not discuss participant information in public or with unauthorised persons');
  pdf.writeBullet('Report suspected privacy breaches immediately to the General Manager');
  pdf.writeBullet('Do not share login credentials or access OLF systems from unsecured networks');
  pdf.writeBullet('Ensure all physical documents are secured at the end of each shift');
  pdf.writeBullet('Return all OLF records, keys, and access credentials upon cessation of employment');

  pdf.curY += 2;
  pdf.writeBody('Breach of this policy may result in disciplinary action, including termination of employment, and may constitute a breach of law subject to penalties under the Privacy Act 1988.');

  // ─── 12. RELATED DOCUMENTS ──────────────────────────────────────────────
  pdf.sectionHeading('12. Related Documents');
  pdf.drawTable(
    ['Document', 'Reference'],
    [
      ['Privacy and Confidentiality Agreement', 'Form19'],
      ['OLF Employee Confidentiality Agreement', 'Employment Pack'],
      ['Incident Report', 'Form04'],
      ['Complaint Report Form', 'Form02'],
      ['Continuous Improvement Register', 'Form59'],
      ['Service Agreement (SIL)', 'SIL Service Agreement'],
      ['Complaints and Feedback Management Policy', 'Form116'],
      ['Privacy Act 1988 (Cth)', 'Commonwealth Legislation'],
      ['Health Records Act 2001 (Vic)', 'Victorian Legislation'],
      ['NDIS Practice Standards', 'Standard 117 — Information Management'],
    ],
    [100, CW - 100]
  );

  // ─── 13. STAFF ACKNOWLEDGEMENT ──────────────────────────────────────────
  pdf.drawSignatureTable(8);

  return pdf.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT 2: Form116 — Complaints and Feedback Management Policy
// ═══════════════════════════════════════════════════════════════════════════════

function buildForm116() {
  const pdf = new PDFBuilder({
    docNo: 'Form116',
    title: 'Complaints and Feedback Management Policy',
    categoryLine1: 'Policy & Procedure',
    categoryLine2: 'Complaints Management',
  });

  // ─── COVER PAGE ──────────────────────────────────────────────────────────
  pdf.drawCoverPage(
    'Complaints and Feedback Management Policy',
    'Ensuring an accessible, fair, and transparent process for receiving and resolving complaints and feedback, aligned with NDIS Practice Standards',
    [
      ['Document Number', 'Form116'],
      ['Version', '1.0'],
      ['Effective Date', '1 January 2026'],
      ['Review Date', '1 January 2027'],
      ['Document Owner', 'Swosthani Thapa, Operations Manager'],
      ['Approved By', 'Harsimran Singh, Director'],
      ['Applies To', 'All participants, families, staff, and stakeholders'],
      ['Related Legislation', 'NDIS Act 2013, NDIS Practice Standards'],
      ['NDIS Practice Standard', 'Standard 118 — Feedback and Complaints'],
    ]
  );

  // ─── 1. PURPOSE ──────────────────────────────────────────────────────────
  pdf.newPage();
  pdf.sectionHeading('1. Purpose');
  pdf.writeBody(
    'The purpose of this policy is to establish a clear, accessible, and effective framework for receiving, managing, and resolving complaints and feedback at One Life Foundation Pty Ltd (OLF). This policy ensures that all participants, families, guardians, advocates, staff, and stakeholders can raise concerns, provide feedback, or make complaints with confidence that they will be heard, treated fairly, and that their concerns will be addressed in a timely manner.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'This policy is aligned with the NDIS Practice Standards, specifically Standard 118 — Feedback and Complaints, which requires that each participant is made aware of and has access to the provider\'s complaints management and resolution system, including how complaints can be made, how they will be dealt with, and how to access external complaints mechanisms.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'OLF views complaints and feedback as valuable opportunities for learning and continuous improvement. All complaints are treated seriously, investigated thoroughly, and used to enhance the quality and safety of services delivered to NDIS participants.'
  );

  // ─── 2. SCOPE ────────────────────────────────────────────────────────────
  pdf.sectionHeading('2. Scope');
  pdf.writeBody('This policy applies to:');
  pdf.writeBullet('All complaints, feedback, suggestions, and compliments received by OLF');
  pdf.writeBullet('All NDIS participants receiving supports from OLF');
  pdf.writeBullet('Families, guardians, nominees, and advocates of participants');
  pdf.writeBullet('All OLF employees, contractors, and volunteers');
  pdf.writeBullet('External stakeholders including Support Coordinators, other service providers, NDIA, and regulatory bodies');
  pdf.writeBullet('All service delivery locations including SIL houses, the head office, and any community-based settings');

  // ─── 3. DEFINITIONS ─────────────────────────────────────────────────────
  pdf.sectionHeading('3. Definitions');
  pdf.drawTable(
    ['Term', 'Definition'],
    [
      ['Complaint', 'An expression of dissatisfaction about the quality or delivery of OLF\'s services, the behaviour of staff, or the handling of personal information, where a response or resolution is sought.'],
      ['Feedback', 'Information provided by participants, families, or stakeholders about their experience with OLF services, which may be positive, negative, or neutral and does not necessarily seek a specific resolution.'],
      ['Compliment', 'A positive statement about the quality of OLF\'s services, the performance of staff, or the impact of supports on a participant\'s life.'],
      ['Grievance', 'A formal complaint raised by an employee regarding workplace conditions, treatment by colleagues or management, or breach of employment terms.'],
      ['Resolution', 'The outcome achieved through investigation and response to a complaint, which may include corrective action, apology, service improvement, or referral.'],
      ['Escalation', 'The process of referring a complaint to a more senior level within OLF or to an external body when initial resolution is unsatisfactory or the matter is serious.'],
    ],
    [45, CW - 45]
  );

  // ─── 4. PRINCIPLES ──────────────────────────────────────────────────────
  pdf.sectionHeading('4. Principles');
  pdf.writeBody('OLF\'s complaints and feedback management process is guided by the following principles:');
  pdf.curY += 2;

  pdf.subHeading('4.1 Accessible');
  pdf.writeBody('The complaints process is easy to access and available through multiple channels. OLF provides easy-read materials, interpreter services, and support for participants with communication needs. Complaints can be made verbally, in writing, online, or through an advocate.');

  pdf.subHeading('4.2 Fair');
  pdf.writeBody('All complaints are investigated impartially and objectively. All parties are given the opportunity to present their perspective (natural justice). Decisions are based on evidence and made without bias or conflict of interest.');

  pdf.subHeading('4.3 Transparent');
  pdf.writeBody('The complaints process is clearly communicated to all participants at the commencement of services and is available on request. Complainants are informed of the progress of their complaint and the outcome of the investigation.');

  pdf.subHeading('4.4 Timely');
  pdf.writeBody('Complaints are acknowledged within 24 hours of receipt. OLF aims to resolve all complaints within 21 business days. Where an investigation requires additional time, the complainant is informed of the expected timeframe and the reasons for the delay.');

  pdf.subHeading('4.5 Confidential');
  pdf.writeBody('All complaint information is treated confidentially and shared only on a need-to-know basis. Complaint records are stored securely in accordance with Form115 — Privacy and Information Management Policy.');

  pdf.subHeading('4.6 No Retaliation');
  pdf.writeBody('OLF is committed to ensuring that no person suffers adverse consequences as a result of making a complaint or providing feedback. Any staff member found to have retaliated against a complainant will face disciplinary action, which may include termination of employment.');

  // ─── 5. HOW TO MAKE A COMPLAINT ─────────────────────────────────────────
  pdf.sectionHeading('5. How to Make a Complaint');
  pdf.writeBody('Participants, families, and stakeholders can make a complaint or provide feedback through any of the following channels:');
  pdf.curY += 3;

  pdf.drawTable(
    ['Method', 'Details'],
    [
      ['Verbal', 'Speak directly to any OLF staff member, the Operations Manager, or the General Manager. Staff will assist in documenting the complaint if needed.'],
      ['Written', 'Complete the Complaint Report Form (Form02) and submit to the Operations Manager. Forms are available at the head office and SIL houses.'],
      ['Email', 'Send details to support@olfndisservices.com.au or directly to the Operations Manager or General Manager.'],
      ['Online', 'Submit feedback through the One Life Vault participant portal.'],
      ['Anonymous', 'Complaints may be submitted without providing a name. OLF will investigate to the extent possible, noting that anonymous complaints may limit the ability to investigate fully or provide a response.'],
      ['Via an Advocate', 'Participants have the right to have an advocate, family member, guardian, or support person assist them in making and progressing a complaint. OLF will engage with the nominated representative with the participant\'s consent.'],
    ],
    [35, CW - 35]
  );

  // ─── 6. COMPLAINTS PROCESS ──────────────────────────────────────────────
  pdf.sectionHeading('6. Complaints Process');
  pdf.writeBody('All complaints are managed through the following structured process:');
  pdf.curY += 3;

  pdf.subHeading('Step 1: Receive');
  pdf.writeBody('The complaint is received through any of the channels outlined in Section 5. The receiving staff member records the complaint details including the date, complainant\'s name (if provided), nature of the complaint, and the desired outcome. The complaint is immediately logged in the Complaint Register (Form12).');

  pdf.subHeading('Step 2: Acknowledge');
  pdf.writeBody('The complainant is acknowledged within 24 hours of receipt. Acknowledgement may be verbal or written and includes confirmation that the complaint has been received, the name and contact details of the person managing the complaint, an estimated timeline for resolution, and information about the complaints process.');

  pdf.subHeading('Step 3: Assess');
  pdf.writeBody('The complaint is assessed to determine the severity level (see Section 7), the appropriate investigator, whether immediate action is required to ensure safety, and whether the complaint must be reported to external bodies (e.g., NDIS Commission).');

  pdf.subHeading('Step 4: Investigate');
  pdf.writeBody('An investigation is commenced within 48 hours of receipt. The investigation includes gathering all relevant facts and documentation, interviewing the complainant, respondent, and any witnesses, reviewing relevant policies, procedures, and participant records, and identifying the root cause and contributing factors. The investigation is completed within 10 business days unless the complexity of the matter requires an extension.');

  pdf.subHeading('Step 5: Resolve');
  pdf.writeBody('Based on the investigation findings, the investigator determines the appropriate outcome, which may include an apology, corrective action to address the issue, changes to policies, procedures, or practices, disciplinary action where staff conduct is a factor, referral to external agencies where appropriate, or additional supports for the participant.');

  pdf.subHeading('Step 6: Notify');
  pdf.writeBody('The complainant is notified of the outcome within 21 business days. The notification includes a summary of the investigation findings, the actions taken or planned, an invitation to provide feedback on the resolution, and information about escalation options if the complainant is not satisfied with the outcome.');

  pdf.subHeading('Step 7: Review');
  pdf.writeBody('A follow-up review is conducted within 4 weeks of the resolution to ensure that the complainant is satisfied with the outcome, all corrective actions have been implemented, the issue has not recurred, and any systemic improvements have been actioned.');

  pdf.subHeading('Step 8: Close');
  pdf.writeBody('Once the review is complete and all actions have been verified, the complaint is formally closed. The final outcome is documented in the Complaint Register (Form12) and any continuous improvement actions are recorded in the CI Register (Form59).');

  // ─── 7. SEVERITY LEVELS ─────────────────────────────────────────────────
  pdf.sectionHeading('7. Severity Levels');
  pdf.writeBody('Complaints are categorised by severity to determine the appropriate response and investigation level:');
  pdf.curY += 3;

  pdf.drawTable(
    ['Level', 'Description', 'Examples', 'Response', 'Timeframe'],
    [
      ['Low', 'Minor service issue', 'Scheduling changes, minor communication issues, preferences not met', 'Frontline staff member resolves directly', '48 hours'],
      ['Medium', 'Recurring issue or significant concern', 'Repeated lateness, staff attitude, service quality below expectations', 'Operations Manager investigates', '10 business days'],
      ['High', 'Serious allegation or safety concern', 'Allegations of abuse, neglect, exploitation, discrimination, significant safety risk', 'Director investigates, reported to NDIS Commission', '21 business days'],
      ['Critical', 'Immediate risk to safety', 'Imminent threat to life or safety, criminal conduct, serious harm occurred', 'Emergency response activated, NDIS Commission notified within 24 hours', 'Immediate + 24h notification'],
    ],
    [22, 32, 40, 40, 40]
  );

  // ─── 8. ESCALATION ──────────────────────────────────────────────────────
  pdf.sectionHeading('8. Escalation');
  pdf.writeBody('If a complainant is not satisfied with the outcome of the complaints process, or if the complaint involves serious allegations, the following escalation pathways are available:');
  pdf.curY += 3;

  pdf.subHeading('8.1 Internal Escalation');
  pdf.writeBody('Complaints may be escalated through the following internal hierarchy:');
  pdf.writeBullet('Level 1: Direct Support Worker or staff member (initial resolution)');
  pdf.writeBullet('Level 2: Swosthani Thapa, Operations Manager');
  pdf.writeBullet('Level 3: Kevin Rae Geronimo, General Manager');
  pdf.writeBullet('Level 4: Harsimran Singh, Director');

  pdf.subHeading('8.2 External Escalation');
  pdf.writeBody('Complainants may at any time contact the following external bodies:');
  pdf.curY += 2;

  pdf.drawTable(
    ['Organisation', 'Contact Details', 'Role'],
    [
      ['NDIS Quality and Safeguards Commission', '1800 035 544\nwww.ndiscommission.gov.au', 'National regulator for NDIS providers — investigates complaints about NDIS services'],
      ['Victorian Disability Worker Commission', '1800 497 132\nwww.vdwc.vic.gov.au', 'Regulates disability workers in Victoria — handles complaints about worker conduct'],
      ['Office of the Public Advocate', '1300 309 337\nwww.publicadvocate.vic.gov.au', 'Advocates for people with disability — can assist with complaints and decision-making'],
      ['Commonwealth Ombudsman', '1300 362 072\nwww.ombudsman.gov.au', 'Investigates complaints about Australian Government agencies and NDIS'],
    ],
    [50, 55, 69]
  );

  // ─── 9. FEEDBACK AND COMPLIMENTS ────────────────────────────────────────
  pdf.sectionHeading('9. Feedback and Compliments');
  pdf.writeBody('OLF actively encourages feedback and compliments from participants, families, and stakeholders. All feedback is valued and used to improve services.');
  pdf.curY += 2;

  pdf.subHeading('9.1 How Feedback is Used');
  pdf.writeBullet('Positive feedback and compliments are shared with relevant staff to recognise good practice and encourage continued excellence');
  pdf.writeBullet('Suggestions for improvement are reviewed by the management team and actioned where feasible');
  pdf.writeBullet('All feedback is logged in the Complaint Register (Form12) for tracking and analysis');
  pdf.writeBullet('Feedback data is reviewed at quarterly management meetings to identify trends and opportunities for improvement');

  pdf.subHeading('9.2 Feedback Collection');
  pdf.writeBody('OLF collects feedback through participant satisfaction surveys (conducted annually), informal conversations during service delivery, care plan review meetings, family and stakeholder meetings, and the One Life Vault online portal.');

  // ─── 10. RECORD KEEPING ──────────────────────────────────────────────────
  pdf.sectionHeading('10. Record Keeping');
  pdf.writeBody('All complaints, feedback, and compliments are recorded and maintained in accordance with the following requirements:');
  pdf.curY += 2;

  pdf.writeBullet('Complaint Report Form (Form02): completed for all formal complaints, documenting the complaint details, investigation steps, findings, and resolution');
  pdf.writeBullet('Complaint Register (Form12): central register of all complaints, feedback, and compliments received, including severity level, status, and outcome');
  pdf.writeBullet('All complaint records are retained for a minimum of 7 years in accordance with NDIS record-keeping requirements');
  pdf.writeBullet('Records are stored securely in the One Life Vault system with access restricted to authorised personnel');
  pdf.writeBullet('De-identified complaint data is used for continuous improvement reporting');

  // ─── 11. CONTINUOUS IMPROVEMENT ──────────────────────────────────────────
  pdf.sectionHeading('11. Continuous Improvement');
  pdf.writeBody('Complaints and feedback are a key driver of continuous improvement at OLF. The following activities ensure that complaints contribute to service enhancement:');
  pdf.curY += 2;

  pdf.writeBullet('Complaints data is reviewed at monthly management meetings to identify emerging issues and track resolution rates');
  pdf.writeBullet('Quarterly trend analysis is conducted to identify systemic issues, recurring themes, and patterns across service locations');
  pdf.writeBullet('Root cause analysis of serious complaints informs changes to policies, procedures, and staff training');
  pdf.writeBullet('All continuous improvement actions arising from complaints are documented in the CI Register (Form59) with assigned responsibilities and due dates');
  pdf.writeBullet('Annual reporting on complaints and feedback outcomes is included in OLF\'s internal audit and management review processes');
  pdf.writeBullet('Participants and families are informed about improvements made as a result of their feedback ("closing the loop")');

  // ─── 12. TRAINING ────────────────────────────────────────────────────────
  pdf.sectionHeading('12. Training');
  pdf.writeBody('OLF ensures that all staff are equipped to handle complaints and feedback effectively:');
  pdf.curY += 2;

  pdf.writeBullet('All new staff receive complaints handling training during induction, covering this policy, the complaints process, documentation requirements, and communication skills');
  pdf.writeBullet('Annual refresher training is provided to all staff, incorporating lessons learned from recent complaints and updated regulatory requirements');
  pdf.writeBullet('Targeted training is provided for managers and team leaders on investigation techniques, conflict resolution, and serious complaint management');
  pdf.writeBullet('Staff are trained to support participants in understanding and accessing the complaints process, including providing information in accessible formats');

  // ─── 13. RELATED DOCUMENTS ──────────────────────────────────────────────
  pdf.sectionHeading('13. Related Documents');
  pdf.drawTable(
    ['Document', 'Reference'],
    [
      ['Complaint Report Form', 'Form02'],
      ['Complaint Register', 'Form12'],
      ['Improvement Report Form', 'Form03'],
      ['Continuous Improvement Register', 'Form59'],
      ['Privacy and Information Management Policy', 'Form115'],
      ['Incident Management Policy', 'Form117'],
      ['Complaints Process Flowchart', 'Displayed at all OLF locations'],
      ['NDIS Practice Standards', 'Standard 118 — Feedback and Complaints'],
      ['NDIS Act 2013', 'Commonwealth Legislation'],
    ],
    [100, CW - 100]
  );

  // ─── 14. STAFF ACKNOWLEDGEMENT ──────────────────────────────────────────
  pdf.drawSignatureTable(8);

  return pdf.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT 3: Form117 — Incident Management Policy
// ═══════════════════════════════════════════════════════════════════════════════

function buildForm117() {
  const pdf = new PDFBuilder({
    docNo: 'Form117',
    title: 'Incident Management Policy',
    categoryLine1: 'Policy & Procedure',
    categoryLine2: 'Incident Management',
  });

  // ─── COVER PAGE ──────────────────────────────────────────────────────────
  pdf.drawCoverPage(
    'Incident Management Policy',
    'Preventing, identifying, responding to, reporting, and learning from incidents to protect participant safety and wellbeing in compliance with NDIS Practice Standards',
    [
      ['Document Number', 'Form117'],
      ['Version', '1.0'],
      ['Effective Date', '1 January 2026'],
      ['Review Date', '1 January 2027'],
      ['Document Owner', 'Kevin Rae Geronimo, General Manager'],
      ['Approved By', 'Harsimran Singh, Director'],
      ['Applies To', 'All staff, contractors, and volunteers'],
      ['Related Legislation', 'NDIS (Incident Management and Reportable Incidents) Rules 2018, NDIS Act 2013'],
      ['NDIS Practice Standard', 'Standard 120 — Incident Management'],
    ]
  );

  // ─── 1. PURPOSE ──────────────────────────────────────────────────────────
  pdf.newPage();
  pdf.sectionHeading('1. Purpose');
  pdf.writeBody(
    'The purpose of this policy is to establish a comprehensive framework for the prevention, identification, response, reporting, and review of incidents at One Life Foundation Pty Ltd (OLF). This policy ensures that all incidents involving NDIS participants, staff, visitors, and property are managed effectively to protect the safety, health, and wellbeing of all persons.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'This policy is aligned with the NDIS Practice Standards, particularly Standard 120 — Incident Management, which requires that providers have a system in place for managing incidents that is responsive to the needs of participants and upholds the rights, safety, and dignity of each participant. The policy also ensures compliance with the NDIS (Incident Management and Reportable Incidents) Rules 2018, which set out mandatory reporting obligations for registered NDIS providers.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'OLF is committed to a culture of safety where incidents are reported without fear of reprisal, thoroughly investigated, and used as opportunities for learning and continuous improvement. Every incident, including near misses, provides valuable information that can prevent future harm and improve the quality of supports delivered to NDIS participants.'
  );

  // ─── 2. SCOPE ────────────────────────────────────────────────────────────
  pdf.sectionHeading('2. Scope');
  pdf.writeBody('This policy applies to:');
  pdf.writeBullet('All incidents involving NDIS participants during the delivery of OLF supports');
  pdf.writeBullet('All staff, contractors, and volunteers of OLF');
  pdf.writeBullet('All visitors and other persons present at OLF service delivery locations');
  pdf.writeBullet('All OLF sites including the head office (9C Grasslands Avenue, Craigieburn VIC 3064), SIL houses (including 59 Severn Street, Epping VIC 3076), and any community locations where supports are delivered');
  pdf.writeBullet('All types of incidents including reportable incidents, serious incidents, workplace injuries, near misses, and property-related events');
  pdf.writeBullet('Incidents that occur during any OLF-funded activity, whether on-site or in the community');

  // ─── 3. DEFINITIONS ─────────────────────────────────────────────────────
  pdf.sectionHeading('3. Definitions');
  pdf.drawTable(
    ['Term', 'Definition'],
    [
      ['Incident', 'Any event or circumstance that causes, or has the potential to cause, harm to a person, damage to property, or disruption to the delivery of services.'],
      ['Near Miss', 'An event or circumstance that could have resulted in harm to a person or damage to property but, through chance or timely intervention, did not. Near misses are treated as valuable learning opportunities.'],
      ['Reportable Incident', 'An incident that must be reported to the NDIS Commission under section 73Z of the NDIS Act 2013. This includes: (a) the death of an NDIS participant, (b) serious injury of a participant, (c) abuse or neglect of a participant, (d) unlawful sexual or physical contact with a participant, or (e) the unauthorised use of a restrictive practice.'],
      ['Serious Incident', 'An incident that requires an immediate management response due to the severity of harm or risk, including but not limited to reportable incidents, hospital admissions, missing participants, and criminal activity.'],
      ['Restrictive Practice', 'Any practice or intervention that has the effect of restricting the rights or freedom of movement of a person with disability, including seclusion, chemical restraint, physical restraint, mechanical restraint, and environmental restraint.'],
      ['Root Cause Analysis', 'A systematic investigation method used to identify the fundamental cause(s) of an incident, rather than just the symptoms, to develop effective preventive measures.'],
    ],
    [45, CW - 45]
  );

  // ─── 4. INCIDENT CATEGORIES ─────────────────────────────────────────────
  pdf.sectionHeading('4. Incident Categories');
  pdf.writeBody('Incidents are categorised by type, severity, and reporting requirements as follows:');
  pdf.curY += 3;

  pdf.drawTable(
    ['Category', 'Examples', 'Severity', 'Reporting'],
    [
      ['Death of Participant', 'Any death of an NDIS participant during or related to service delivery', 'Critical', 'NDIS Commission within 24 hours, Police, Coroner'],
      ['Serious Injury', 'Hospital admission, fracture, head injury, serious laceration, significant medical event', 'Critical', 'NDIS Commission within 24 hours'],
      ['Abuse or Neglect', 'Physical, sexual, emotional, psychological, or financial abuse; neglect of care duties', 'Critical', 'NDIS Commission within 24 hours, Police if criminal'],
      ['Restrictive Practice', 'Unauthorised use of any form of restraint or seclusion, or use beyond authorised scope', 'High', 'NDIS Commission monthly reporting'],
      ['Medication Error', 'Wrong dose, missed dose, wrong medication, wrong person, adverse reaction', 'High', 'Internal report, GP notification, pharmacy notification'],
      ['Missing Participant', 'Participant\'s whereabouts unknown, failure to return from community access', 'Critical', 'Police immediately, NDIS Commission within 24 hours'],
      ['Property Damage/Theft', 'Damage to or theft of participant property, OLF property, or third-party property', 'Medium', 'Internal report, Police if criminal'],
      ['Workplace Injury', 'Staff injury occurring during the course of work duties', 'Medium', 'Internal report, WorkSafe Victoria if serious'],
      ['Near Miss', 'Event that could have resulted in harm but did not (e.g., slip without injury, medication near-miss)', 'Low', 'Internal report and review'],
    ],
    [35, 48, 23, 68]
  );

  // ─── 5. REPORTING OBLIGATIONS ───────────────────────────────────────────
  pdf.sectionHeading('5. Reporting Obligations');
  pdf.writeBody('OLF has mandatory reporting obligations to multiple external bodies depending on the nature and severity of the incident:');
  pdf.curY += 3;

  pdf.subHeading('5.1 NDIS Quality and Safeguards Commission');
  pdf.writeBody('All reportable incidents (as defined in section 73Z of the NDIS Act 2013) must be reported to the NDIS Commission:');
  pdf.writeBullet('Initial notification: within 24 hours of OLF becoming aware of the incident');
  pdf.writeBullet('Detailed 5-day report: within 5 business days, including investigation findings and immediate actions taken');
  pdf.writeBullet('Final 60-day report: within 60 calendar days, including the completed investigation, root cause analysis, and corrective/preventive actions');
  pdf.writeBullet('Monthly reporting for any use of restrictive practices (authorised or unauthorised)');

  pdf.subHeading('5.2 Victoria Police');
  pdf.writeBody('OLF must immediately contact Victoria Police (000) when:');
  pdf.writeBullet('There is an immediate threat to life or safety');
  pdf.writeBullet('A criminal offence has occurred or is suspected (e.g., assault, sexual abuse, theft)');
  pdf.writeBullet('A participant is missing and their safety is at risk');
  pdf.writeBullet('A death has occurred in circumstances that require police investigation');

  pdf.subHeading('5.3 WorkSafe Victoria');
  pdf.writeBody('OLF must notify WorkSafe Victoria of serious workplace incidents, including:');
  pdf.writeBullet('Death of any person at the workplace');
  pdf.writeBullet('Serious injury or illness requiring immediate medical treatment or hospital admission');
  pdf.writeBullet('Dangerous incidents that expose a person to serious risk, even if no injury occurs');
  pdf.writeBullet('Notification must be made immediately by phone (13 23 60) and in writing within 48 hours');

  pdf.subHeading('5.4 Coroner');
  pdf.writeBody('All deaths of NDIS participants must be reported to the Victorian Coroner, regardless of the circumstances, as participants receiving disability services are within the Coroner\'s jurisdiction.');

  pdf.subHeading('5.5 Internal Reporting');
  pdf.writeBody('All incidents, regardless of severity, must be reported internally:');
  pdf.writeBullet('Immediately: staff member verbally notifies the on-call manager or the most senior person available');
  pdf.writeBullet('Within 24 hours: the Incident Report Form (Form04) is completed by the reporting staff member');
  pdf.writeBullet('Within 48 hours: the manager reviews the incident report, assigns severity, and initiates investigation if required');

  // ─── 6. INCIDENT RESPONSE PROCEDURE ─────────────────────────────────────
  pdf.sectionHeading('6. Incident Response Procedure');
  pdf.writeBody('The following procedure must be followed for all incidents. The safety of all persons is the overriding priority at every stage.');
  pdf.curY += 3;

  pdf.subHeading('Step 1: Immediate Response — Ensure Safety');
  pdf.writeBody('The first priority is the safety of all persons involved. Actions include:');
  pdf.writeBullet('Assess the situation for ongoing danger and remove persons from harm if safe to do so');
  pdf.writeBullet('Provide first aid as trained and appropriate');
  pdf.writeBullet('Call 000 (emergency services) if there is immediate risk to life or safety');
  pdf.writeBullet('Do not move seriously injured persons unless they are in immediate danger');
  pdf.writeBullet('Remain calm and reassure participants and other persons present');

  pdf.subHeading('Step 2: Contain — Prevent Further Harm');
  pdf.writeBody('Once immediate safety is established:');
  pdf.writeBullet('Secure the scene to prevent further harm or contamination of evidence');
  pdf.writeBullet('Isolate affected areas if necessary (e.g., chemical spill, biohazard)');
  pdf.writeBullet('Separate persons involved in an altercation');
  pdf.writeBullet('Preserve any physical evidence that may be relevant to investigation');

  pdf.subHeading('Step 3: Report — Notify Management');
  pdf.writeBody('The staff member involved or present must:');
  pdf.writeBullet('Notify the on-call manager immediately by phone');
  pdf.writeBullet('Provide a verbal summary including: what happened, who is involved, what actions have been taken, and whether emergency services have been called');
  pdf.writeBullet('Complete the Incident Report Form (Form04) within 24 hours with full details including date, time, location, persons involved, description of the incident, witnesses, and immediate actions taken');

  pdf.subHeading('Step 4: Notify — External Reporting');
  pdf.writeBody('The General Manager or Director is responsible for external notifications:');
  pdf.writeBullet('Report to the NDIS Commission via the portal (www.ndiscommission.gov.au) within 24 hours if the incident is a reportable incident');
  pdf.writeBullet('Contact the participant\'s family/guardian to inform them of the incident and actions taken');
  pdf.writeBullet('Notify the participant\'s Support Coordinator');
  pdf.writeBullet('Notify Victoria Police if criminal conduct is involved or suspected');
  pdf.writeBullet('Notify WorkSafe Victoria if the incident involves a serious workplace injury');

  pdf.subHeading('Step 5: Investigate — Root Cause Analysis');
  pdf.writeBody('An investigation is commenced to understand the causes and contributing factors:');
  pdf.writeBullet('The Director or General Manager assigns an investigator (who must not have been directly involved in the incident)');
  pdf.writeBullet('The investigation commences within 48 hours of the incident');
  pdf.writeBullet('All relevant evidence is collected and preserved, including physical evidence, photographs, documents, and electronic records');
  pdf.writeBullet('Statements are taken from all involved parties, witnesses, and relevant staff');
  pdf.writeBullet('Root cause analysis is conducted to identify the fundamental cause(s) of the incident, not just the immediate trigger');
  pdf.writeBullet('Contributing factors are identified (e.g., training gaps, environmental hazards, procedural deficiencies, staffing issues)');

  pdf.subHeading('Step 6: Action — Corrective and Preventive Measures');
  pdf.writeBody('Based on the investigation findings:');
  pdf.writeBullet('Corrective actions are identified and documented to address the immediate cause of the incident');
  pdf.writeBullet('Preventive actions are identified to reduce the risk of recurrence');
  pdf.writeBullet('Participant care plans and risk assessments are updated as necessary');
  pdf.writeBullet('Environmental modifications are made if the physical environment contributed to the incident');
  pdf.writeBullet('Policies and procedures are reviewed and updated if systemic issues are identified');
  pdf.writeBullet('Affected staff receive additional training or supervision as required');
  pdf.writeBullet('Each action is assigned to a responsible person with a due date');

  pdf.subHeading('Step 7: Review — Management Oversight');
  pdf.writeBody('The management team reviews the incident to ensure:');
  pdf.writeBullet('The investigation was thorough and the findings are sound');
  pdf.writeBullet('All corrective and preventive actions are appropriate and sufficient');
  pdf.writeBullet('The risk register (Form01) is updated to reflect new or changed risks');
  pdf.writeBullet('Similar incidents across OLF services are identified and systemic issues addressed');
  pdf.writeBullet('All reporting obligations have been fulfilled (NDIS Commission, Police, WorkSafe, Coroner)');
  pdf.writeBullet('The participant and their family have been kept informed throughout the process');

  pdf.subHeading('Step 8: Close — Documentation and Learning');
  pdf.writeBody('The incident is formally closed when:');
  pdf.writeBullet('The final investigation report is completed, reviewed, and approved by the Director or General Manager');
  pdf.writeBullet('All corrective and preventive actions have been implemented and verified');
  pdf.writeBullet('The NDIS Commission 60-day final report has been submitted (if a reportable incident)');
  pdf.writeBullet('Lessons learned are documented and shared with relevant staff');
  pdf.writeBullet('The Continuous Improvement Register (Form59) is updated with improvement actions');
  pdf.writeBullet('The Incident Register (Form11) is updated with the final outcome and closure date');

  // ─── 7. INVESTIGATION PROCESS ───────────────────────────────────────────
  pdf.sectionHeading('7. Investigation Process');
  pdf.writeBody('OLF conducts thorough investigations of all serious incidents. The investigation process is as follows:');
  pdf.curY += 3;

  pdf.subHeading('7.1 Assignment');
  pdf.writeBody('All serious incidents are investigated by the Director (Harsimran Singh) or General Manager (Kevin Rae Geronimo). The investigator must not have been directly involved in the incident and must not have a conflict of interest. External investigators may be engaged for particularly complex or sensitive matters.');

  pdf.subHeading('7.2 Commencement');
  pdf.writeBody('The investigation commences within 48 hours of OLF becoming aware of the incident. Initial steps include reviewing the Incident Report Form (Form04), identifying all persons involved and potential witnesses, and developing an investigation plan.');

  pdf.subHeading('7.3 Evidence Collection');
  pdf.writeBody('All relevant evidence is collected and preserved, including:');
  pdf.writeBullet('Written statements from involved persons and witnesses');
  pdf.writeBullet('Photographs of the incident scene, injuries, or damage');
  pdf.writeBullet('Relevant documents: care plans, risk assessments, shift handover notes, medication charts, roster records');
  pdf.writeBullet('CCTV footage (if available and relevant)');
  pdf.writeBullet('Electronic records: system logs, emails, communication records');
  pdf.writeBullet('Expert opinions (medical, clinical, environmental) where relevant');

  pdf.subHeading('7.4 Root Cause Analysis');
  pdf.writeBody('Root cause analysis is conducted to identify the fundamental cause(s) of the incident. The analysis considers:');
  pdf.writeBullet('What happened? — Detailed sequence of events');
  pdf.writeBullet('Why did it happen? — Immediate causes and contributing factors');
  pdf.writeBullet('What can be done to prevent recurrence? — Systemic, procedural, and environmental factors');
  pdf.writeBullet('Were existing controls adequate? — Assessment of risk mitigation measures in place at the time');

  pdf.subHeading('7.5 Findings and Actions');
  pdf.writeBody('The investigation report documents the findings of the investigation, including the root cause(s), contributing factors, and recommended corrective and preventive actions. Each action is assigned to a responsible person with a due date. The Director reviews and approves all investigation findings and actions.');

  pdf.subHeading('7.6 Follow-Up');
  pdf.writeBody('The investigator follows up to confirm that all corrective and preventive actions have been implemented, assesses whether the actions have been effective in reducing risk, and closes the investigation when all actions are verified as complete.');

  // ─── 8. NDIS COMMISSION REPORTING ───────────────────────────────────────
  pdf.sectionHeading('8. NDIS Commission Reporting');
  pdf.writeBody('OLF is required to report all reportable incidents to the NDIS Quality and Safeguards Commission. The reporting process is as follows:');
  pdf.curY += 3;

  pdf.subHeading('8.1 Reporting Portal');
  pdf.writeBody('Reports are submitted through the NDIS Commission\'s online portal at www.ndiscommission.gov.au/providers/incident-management. The General Manager or Director is responsible for submitting all reports.');

  pdf.subHeading('8.2 Contact Information');
  pdf.drawTable(
    ['Method', 'Details'],
    [
      ['Online Portal', 'www.ndiscommission.gov.au/providers/incident-management'],
      ['Phone', '1800 035 544'],
      ['Email', 'reportableincidents@ndiscommission.gov.au'],
      ['Hours', 'Monday to Friday, 9:00 AM to 4:30 PM AEST'],
    ],
    [50, CW - 50]
  );

  pdf.subHeading('8.3 Reporting Timeframes');
  pdf.drawTable(
    ['Report Type', 'Timeframe', 'Content'],
    [
      ['Initial Notification', 'Within 24 hours of becoming aware', 'Basic details: incident type, date, persons involved, immediate actions, whether emergency services were contacted'],
      ['5-Day Report', 'Within 5 business days', 'Detailed account including investigation progress, actions taken, support provided to affected persons'],
      ['60-Day Final Report', 'Within 60 calendar days', 'Complete investigation findings, root cause analysis, corrective/preventive actions taken, outcomes for affected persons'],
      ['Restrictive Practice', 'Monthly', 'Details of all uses of restrictive practices, whether authorised or unauthorised, including type, duration, and circumstances'],
    ],
    [40, 45, 89]
  );

  // ─── 9. RECORD KEEPING ──────────────────────────────────────────────────
  pdf.sectionHeading('9. Record Keeping');
  pdf.writeBody('Comprehensive records are maintained for all incidents:');
  pdf.curY += 2;

  pdf.writeBullet('Incident Report Form (Form04): completed for every incident, documenting the full details, investigation, and outcome');
  pdf.writeBullet('Incident Register (Form11): central register of all incidents, maintained by the Operations Manager, including incident type, severity, date, persons involved, status, and outcome');
  pdf.writeBullet('Investigation reports: detailed reports for all serious incidents, including evidence, analysis, and findings');
  pdf.writeBullet('NDIS Commission reports: copies of all reports submitted to the NDIS Commission');
  pdf.writeBullet('All incident records are retained for a minimum of 7 years in accordance with NDIS record-keeping requirements');
  pdf.writeBullet('Records are stored securely in the One Life Vault system with access restricted to authorised personnel');
  pdf.writeBullet('Records are available for review by the NDIS Commission, auditors, and other authorised bodies upon request');

  // ─── 10. STAFF TRAINING ──────────────────────────────────────────────────
  pdf.sectionHeading('10. Staff Training');
  pdf.writeBody('OLF ensures all staff are competent in incident management through a comprehensive training program:');
  pdf.curY += 2;

  pdf.subHeading('10.1 Induction Training');
  pdf.writeBody('All new staff receive incident management training during induction, covering:');
  pdf.writeBullet('This Incident Management Policy and associated procedures');
  pdf.writeBullet('How to recognise and report incidents, including near misses');
  pdf.writeBullet('Completing the Incident Report Form (Form04)');
  pdf.writeBullet('Emergency response procedures, including calling 000');
  pdf.writeBullet('First aid responsibilities and location of first aid equipment');
  pdf.writeBullet('Understanding reportable incidents and mandatory reporting obligations');

  pdf.subHeading('10.2 Annual Refresher Training');
  pdf.writeBody('All staff complete annual refresher training that covers updates to this policy and relevant legislation, lessons learned from incidents that occurred during the preceding year, scenario-based training using real-world examples (de-identified), and assessment of staff competency in incident identification, response, and reporting.');

  pdf.subHeading('10.3 Specialised Training');
  pdf.writeBody('Additional training is provided for:');
  pdf.writeBullet('Managers and team leaders: investigation techniques, root cause analysis, NDIS Commission reporting');
  pdf.writeBullet('Staff working with participants who have complex needs: de-escalation techniques, positive behaviour support, restrictive practice awareness');
  pdf.writeBullet('First aiders: first aid certification (renewed every 3 years), CPR certification (renewed annually)');

  // ─── 11. SUPPORT FOR AFFECTED PERSONS ───────────────────────────────────
  pdf.sectionHeading('11. Support for Affected Persons');
  pdf.writeBody('OLF is committed to providing appropriate support to all persons affected by an incident:');
  pdf.curY += 2;

  pdf.subHeading('11.1 Participant Support');
  pdf.writeBullet('Immediate medical attention as required');
  pdf.writeBullet('Referral to advocacy services (e.g., Office of the Public Advocate, disability advocacy organisations)');
  pdf.writeBullet('Counselling and psychological support referrals');
  pdf.writeBullet('Regular communication with the participant and their family throughout the investigation and resolution');
  pdf.writeBullet('Review and update of the participant\'s care plan and risk assessment to address identified risks');
  pdf.writeBullet('Support with making a complaint to external bodies if the participant wishes');

  pdf.subHeading('11.2 Staff Support');
  pdf.writeBullet('Immediate debriefing with the manager following the incident');
  pdf.writeBullet('Referral to the Employee Assistance Program (EAP) for counselling support');
  pdf.writeBullet('Time off work if required due to physical injury or psychological impact');
  pdf.writeBullet('Workers\' compensation support for workplace injuries');
  pdf.writeBullet('Protection from victimisation for reporting incidents in good faith');
  pdf.writeBullet('Follow-up welfare check within one week of the incident');

  // ─── 12. CONTINUOUS IMPROVEMENT ──────────────────────────────────────────
  pdf.sectionHeading('12. Continuous Improvement');
  pdf.writeBody('All incidents are used as opportunities for learning and continuous improvement:');
  pdf.curY += 2;

  pdf.writeBullet('All incidents are reviewed at monthly management meetings, with a focus on trends, severity patterns, and resolution effectiveness');
  pdf.writeBullet('Quarterly trend analysis is conducted to identify systemic issues across all OLF services, including recurring incident types, locations, time periods, and staff groups');
  pdf.writeBullet('Root cause analysis findings inform changes to policies, procedures, training, and the physical environment');
  pdf.writeBullet('All improvement actions arising from incidents are recorded in the Continuous Improvement Register (Form59) with assigned responsibilities, due dates, and completion status');
  pdf.writeBullet('Annual incident management review is conducted as part of OLF\'s internal audit program, assessing compliance with this policy, the effectiveness of incident management processes, and progress on improvement actions');
  pdf.writeBullet('Lessons learned from incidents are shared with all staff through team meetings, training sessions, and safety alerts');
  pdf.writeBullet('Benchmarking against industry data (where available) to compare OLF\'s incident rates and identify areas for improvement');

  // ─── 13. RELATED DOCUMENTS ──────────────────────────────────────────────
  pdf.sectionHeading('13. Related Documents');
  pdf.drawTable(
    ['Document', 'Reference'],
    [
      ['Incident Report Form', 'Form04'],
      ['Incident Register', 'Form11'],
      ['Risk Register', 'Form01'],
      ['Improvement Report Form', 'Form03'],
      ['Continuous Improvement Register', 'Form59'],
      ['Complaints and Feedback Management Policy', 'Form116'],
      ['Privacy and Information Management Policy', 'Form115'],
      ['NDIS (Incident Management and Reportable Incidents) Rules 2018', 'Commonwealth Rules'],
      ['NDIS Practice Standards', 'Standard 120 — Incident Management'],
      ['NDIS Act 2013', 'Commonwealth Legislation'],
    ],
    [100, CW - 100]
  );

  // ─── 14. STAFF ACKNOWLEDGEMENT ──────────────────────────────────────────
  pdf.drawSignatureTable(8);

  return pdf.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — Generate all 3 PDFs, save to disk, upload to Supabase
// ═══════════════════════════════════════════════════════════════════════════════

async function savePdf(buffer, filename) {
  const localPath = path.join(DOWNLOADS, filename);
  fs.writeFileSync(localPath, buffer);
  console.log(`  [OK] Saved locally: ${localPath}`);

  const storagePath = `${STORAGE_FOLDER}/${filename}`;
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.error(`  [ERROR] Upload failed for ${storagePath}:`, error.message);
  } else {
    console.log(`  [OK] Uploaded to Supabase: ${BUCKET}/${storagePath}`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  One Life Foundation — Policy Batch 1 Generator');
  console.log('═══════════════════════════════════════════════════════\n');

  const documents = [
    {
      name: 'Form115.Privacy and Information Management Policy.pdf',
      build: buildForm115,
    },
    {
      name: 'Form116.Complaints and Feedback Management Policy.pdf',
      build: buildForm116,
    },
    {
      name: 'Form117.Incident Management Policy.pdf',
      build: buildForm117,
    },
  ];

  for (const doc of documents) {
    console.log(`\n▸ Generating: ${doc.name}`);
    const buffer = doc.build();
    const pageCount = new jsPDF().getNumberOfPages ? '?' : '?';
    console.log(`  [OK] PDF generated (${(buffer.length / 1024).toFixed(1)} KB)`);
    await savePdf(buffer, doc.name);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  All 3 policies generated successfully!');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
