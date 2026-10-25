/**
 * create-policies-batch3.mjs
 *
 * Generates 4 NDIS Policy PDFs for One Life Foundation:
 *   1. Form121 — Participant Transition and Exit Policy
 *   2. Form122 — Staff Supervision and Support Policy
 *   3. Form123 — Infection Control Policy
 *   4. Form124 — Restrictive Practices Policy
 *
 * Saves each to C:/Users/kevin/Downloads/ AND uploads to Supabase Storage
 * at documents/Forms Updated/[filename].
 *
 * Usage: node scripts/create-policies-batch3.mjs
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
// SHARED HELPERS  (copied from create-policies-batch1.mjs)
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

  // ─── Text helpers ───────────────────────────────────────────────────────
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
// DOCUMENT 1: Form121 — Participant Transition and Exit Policy
// ═══════════════════════════════════════════════════════════════════════════════

function buildForm121() {
  const pdf = new PDFBuilder({
    docNo: 'Form121',
    title: 'Participant Transition and Exit Policy',
    categoryLine1: 'Policy & Procedure',
    categoryLine2: 'Participant Services',
  });

  // ─── COVER PAGE ──────────────────────────────────────────────────────────
  pdf.drawCoverPage(
    'Participant Transition and Exit Policy',
    'Ensuring smooth, supported transitions for participants entering, moving between, or exiting One Life Foundation services in accordance with NDIS Practice Standards',
    [
      ['Document Number', 'Form121'],
      ['Version', '1.0'],
      ['Effective Date', '1 January 2026'],
      ['Review Date', '1 January 2027'],
      ['Document Owner', 'Swosthani Thapa, Operations Manager'],
      ['Approved By', 'Harsimran Singh, Director'],
      ['Applies To', 'All staff involved in participant intake, transition, or exit'],
      ['Related Standard', 'NDIS Practice Standards Standard 136'],
    ]
  );

  // ─── 1. PURPOSE ──────────────────────────────────────────────────────────
  pdf.newPage();
  pdf.sectionHeading('1. Purpose');
  pdf.writeBody(
    'The purpose of this policy is to ensure smooth, supported, and well-documented transitions for all participants entering, moving between, or exiting One Life Foundation (OLF) services. This policy is developed in accordance with NDIS Practice Standards Standard 136 — Transitions to or from a Provider, which requires that each participant is supported to transition to or from the provider in a planned and coordinated way.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'OLF recognises that transitions can be a vulnerable time for participants and their families. Whether a participant is commencing services, transferring between OLF programs, or exiting to another provider, every transition must be managed with care, clear communication, and respect for participant choice and control. This policy outlines the processes, responsibilities, and documentation requirements that govern all transitions.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'OLF is committed to ensuring that no participant experiences a gap in supports during any transition, and that all transitions prioritise the participant\'s preferences, wellbeing, and continuity of care.'
  );

  // ─── 2. SCOPE ──────────────────────────────────────────────────────────
  pdf.sectionHeading('2. Scope');
  pdf.writeBody('This policy applies to all participant transitions managed by OLF, including:');
  pdf.writeBullet('Entry/Intake transitions — new participants commencing services with OLF');
  pdf.writeBullet('Internal transitions — participants moving between OLF services, accommodation sites, or support worker teams');
  pdf.writeBullet('Exit transitions — participants leaving OLF services, whether participant-initiated, provider-initiated, or funding-related');
  pdf.writeBullet('Emergency exits — situations requiring immediate relocation due to safety concerns');
  pdf.curY += 3;
  pdf.writeBody('This policy applies to all OLF employees, contractors, and volunteers involved in any aspect of participant intake, transition planning, service delivery, or exit management.');

  // ─── 3. PRINCIPLES ────────────────────────────────────────────────────
  pdf.sectionHeading('3. Principles');
  pdf.writeBody('All transitions at OLF are guided by the following principles:');
  pdf.curY += 2;
  pdf.writeBullet('Participant Choice and Control — the participant (and/or their nominee, guardian, or family) is central to all transition decisions. Their preferences, goals, and concerns are actively sought and respected throughout the process.');
  pdf.writeBullet('Dignity and Respect — all transitions are conducted in a manner that upholds the participant\'s dignity, privacy, and cultural needs. Participants are not pressured or rushed during transition periods.');
  pdf.writeBullet('Minimal Disruption — OLF takes all reasonable steps to minimise disruption to the participant\'s daily life, routines, and support arrangements during any transition.');
  pdf.writeBullet('Information Sharing with Consent — relevant information is shared between incoming and outgoing providers, support coordinators, and families only with the participant\'s informed written consent. OLF complies with the Privacy Act 1988 (Cth) and the Health Records Act 2001 (Vic).');
  pdf.writeBullet('Continuity of Care — OLF ensures that there is no gap in supports during transitions. Handover processes are thorough and timely, with clear communication between all parties.');
  pdf.writeBullet('Documentation — every transition is documented comprehensively, with clear records of decisions made, actions taken, and consent obtained.');

  // ─── 4. ENTRY / INTAKE TRANSITION ────────────────────────────────────
  pdf.sectionHeading('4. Entry / Intake Transition');
  pdf.writeBody('The intake process for new participants follows a structured pathway to ensure a safe and welcoming start to services:');
  pdf.curY += 3;

  pdf.subHeading('Step 1: Referral Received');
  pdf.writeBody('A referral is received from the NDIS, a support coordinator, the participant, their family, or another provider. The referral is documented using Form44 — Participant Referral Form. The Operations Manager reviews the referral within 2 business days to assess OLF\'s capacity and capability to meet the participant\'s needs.');

  pdf.subHeading('Step 2: Intake Assessment');
  pdf.writeBody('If OLF can potentially meet the participant\'s needs, an intake assessment is conducted using Form20 — Intake Assessment. This assessment includes a meeting with the participant (and their support network where appropriate), review of the participant\'s NDIS plan, identification of support needs, risks, and preferences, and a site visit to the proposed accommodation (for SIL participants).');

  pdf.subHeading('Step 3: Orientation and Welcome Pack');
  pdf.writeBody('Upon acceptance, the participant receives an orientation that covers OLF\'s services, policies, complaints process, rights and responsibilities, and introduction to their support team. A welcome pack is provided including key contact details, house rules (for SIL), and relevant policy summaries.');

  pdf.subHeading('Step 4: Support Plan Development');
  pdf.writeBody('An initial support plan is developed using Form27 — Initial Assessment and Support Plan, in collaboration with the participant, their family/nominee, and their support coordinator. The plan documents the participant\'s goals, preferences, daily routines, health needs, and risk management strategies.');

  pdf.subHeading('Step 5: Participant Settled');
  pdf.writeBody('The participant commences services with their assigned support team. Regular check-ins occur during the first two weeks to ensure the participant is settling in well and their needs are being met.');

  pdf.subHeading('Step 6: Two-Week Review');
  pdf.writeBody('A formal review is conducted two weeks after commencement to assess how the participant is adjusting, identify any issues or concerns, and adjust the support plan if needed. The review is documented and shared with the participant and their support coordinator.');

  // ─── 5. INTERNAL TRANSITION ──────────────────────────────────────────
  pdf.sectionHeading('5. Internal Transition');
  pdf.writeBody('Internal transitions occur when a participant moves between OLF services, accommodation sites, or support worker teams. These may be triggered by:');
  pdf.writeBullet('Change in participant needs or goals');
  pdf.writeBullet('Change in accommodation requirements');
  pdf.writeBullet('Staffing changes or team restructuring');
  pdf.writeBullet('Participant request');
  pdf.curY += 3;
  pdf.writeBody('The internal transition process includes:');
  pdf.writeBullet('Consultation with the participant — the participant is informed and consulted about the proposed change. Their preferences and concerns are documented and addressed.');
  pdf.writeBullet('Transition plan developed — a written transition plan is created outlining the timeline, actions, responsibilities, and support arrangements during the transition.');
  pdf.writeBullet('Handover between teams — a formal handover occurs between outgoing and incoming support workers/teams, including review of the participant\'s support plan, risk assessments, health needs, and communication preferences.');
  pdf.writeBullet('Documentation — all internal transitions are recorded in the participant\'s file, including the reasons for the transition, the participant\'s input, and the transition plan.');

  // ─── 6. EXIT PROCESS ─────────────────────────────────────────────────
  pdf.sectionHeading('6. Exit Process');
  pdf.writeBody('A participant may exit OLF services for a variety of reasons. OLF manages all exits with respect, transparency, and a focus on continuity of care.');
  pdf.curY += 3;

  pdf.subHeading('6.1 Participant-Initiated Exit');
  pdf.writeBody('OLF respects the participant\'s right to leave services at any time. When a participant chooses to exit:');
  pdf.writeBullet('The decision is respected without penalty or pressure to remain');
  pdf.writeBullet('The participant is invited to discuss their reasons (for quality improvement purposes), but this is voluntary');
  pdf.writeBullet('OLF offers to assist with the transition to a new provider if desired');
  pdf.writeBullet('The exit process outlined below is followed');

  pdf.subHeading('6.2 Provider-Initiated Exit');
  pdf.writeBody('OLF may initiate an exit only in exceptional circumstances, including:');
  pdf.writeBullet('Significant and sustained safety risks that cannot be managed despite all reasonable efforts');
  pdf.writeBullet('OLF\'s inability to meet the participant\'s support needs due to changes in their requirements beyond OLF\'s registration or capability');
  pdf.writeBullet('Sustained non-payment of fees (after all reasonable attempts to resolve)');
  pdf.curY += 2;
  pdf.writeBody('In all provider-initiated exits, OLF provides adequate notice (minimum 28 days where possible), documents the reasons, and works with the participant\'s support coordinator to find an alternative provider.');

  pdf.subHeading('6.3 Funding-Related Exit');
  pdf.writeBody('If a participant\'s NDIS plan is not renewed or their funding is reduced to the point where OLF cannot continue to provide services, OLF engages the participant\'s support coordinator immediately, assists the participant to request an NDIS plan review if appropriate, and supports the transition to alternative arrangements.');

  pdf.subHeading('6.4 Exit Process Steps');
  pdf.writeBody('Regardless of the reason for exit, the following steps are taken:');
  pdf.writeBullet('Notice Period — a minimum of 28 days written notice is provided where possible, by either party');
  pdf.writeBullet('Transition Plan — a transition plan is developed using Form23 — Transition Plan, in collaboration with the participant, their family/nominee, and their support coordinator');
  pdf.writeBullet('Handover to New Provider — OLF coordinates with the incoming provider to ensure a thorough handover of the participant\'s support needs, preferences, and relevant history');
  pdf.writeBullet('Exit Form — Form21 — Participant Exit Form is completed, documenting the reason for exit, the date of exit, and a summary of the transition arrangements');
  pdf.writeBullet('Exit Interview — the participant is offered an exit interview to provide feedback on their experience with OLF. This feedback is used for continuous improvement.');
  pdf.writeBullet('Records Transferred — participant records are provided to the new provider within 5 business days, subject to the participant\'s written consent');

  // ─── 7. EMERGENCY EXIT ───────────────────────────────────────────────
  pdf.sectionHeading('7. Emergency Exit');
  pdf.writeBody('In situations where a participant\'s safety is at immediate risk (e.g., family violence, critical health emergency, or environmental hazard), OLF may facilitate an emergency exit. The emergency exit process includes:');
  pdf.writeBullet('Immediate relocation to a safe environment — emergency accommodation is arranged in consultation with the participant, their family, and relevant authorities');
  pdf.writeBullet('Notification to the participant\'s support coordinator and NDIS Commission (if a reportable incident is involved)');
  pdf.writeBullet('Crisis support provided — including emotional support, connection to emergency services, and immediate care needs');
  pdf.writeBullet('Follow-up transition planning — once the immediate crisis is resolved, a formal transition plan is developed');
  pdf.writeBullet('Documentation — all emergency exit actions are documented in the participant\'s file and reported via Form04 — Incident Report');

  // ─── 8. RECORD TRANSFER ──────────────────────────────────────────────
  pdf.sectionHeading('8. Record Transfer');
  pdf.writeBody('When a participant exits OLF services, their records may be transferred to a new provider. The record transfer process is as follows:');
  pdf.writeBullet('Written consent is obtained from the participant (or their nominee/guardian) before any records are shared');
  pdf.writeBullet('Records are provided to the new provider within 5 business days of receiving written consent');
  pdf.writeBullet('A summary of care is prepared, including: current support plan, health needs and risk assessments, medication management details (if applicable), behavioural support information (if applicable), and any other information relevant to continuity of care');
  pdf.writeBullet('OLF retains a copy of all participant records in accordance with record-keeping obligations under the NDIS Act 2013 and Privacy Act 1988 (Cth) — minimum 7 years from the date of last service delivery');
  pdf.writeBullet('Records are transferred securely, with appropriate encryption for electronic records and registered mail for physical documents');

  // ─── 9. FOLLOW-UP ────────────────────────────────────────────────────
  pdf.sectionHeading('9. Follow-Up');
  pdf.writeBody('OLF is committed to ensuring that participants experience a positive transition, even after they have left our services. The follow-up process includes:');
  pdf.writeBullet('A 2-week post-exit check-in call is made to the participant and/or their family to ensure the transition has gone smoothly and the participant is receiving adequate supports');
  pdf.writeBullet('Feedback is requested on the participant\'s experience with OLF and the transition process');
  pdf.writeBullet('Any concerns raised during the follow-up are documented and escalated to the Operations Manager for review');
  pdf.writeBullet('If the participant is experiencing a gap in services, OLF will assist in connecting them with their support coordinator or relevant services');

  // ─── 10. DOCUMENTATION ───────────────────────────────────────────────
  pdf.sectionHeading('10. Documentation');
  pdf.writeBody('The following documents are used in the transition and exit process:');
  pdf.curY += 2;
  pdf.drawTable(
    ['Document', 'Purpose'],
    [
      ['Form44 — Participant Referral Form', 'Records the referral details and initial assessment of suitability'],
      ['Form20 — Intake Assessment', 'Comprehensive intake assessment covering needs, risks, and preferences'],
      ['Form27 — Initial Assessment and Support Plan', 'Detailed support plan developed with the participant at commencement'],
      ['Form23 — Transition Plan', 'Documents the transition plan for internal transfers or exits'],
      ['Form21 — Participant Exit Form', 'Records the reason for exit, date, and summary of transition arrangements'],
    ],
    [60, CW - 60]
  );

  // ─── 11. STAFF ACKNOWLEDGEMENT ───────────────────────────────────────
  pdf.drawSignatureTable(8);

  return pdf.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT 2: Form122 — Staff Supervision and Support Policy
// ═══════════════════════════════════════════════════════════════════════════════

function buildForm122() {
  const pdf = new PDFBuilder({
    docNo: 'Form122',
    title: 'Staff Supervision and Support Policy',
    categoryLine1: 'Policy & Procedure',
    categoryLine2: 'Human Resources',
  });

  // ─── COVER PAGE ──────────────────────────────────────────────────────────
  pdf.drawCoverPage(
    'Staff Supervision and Support Policy',
    'Ensuring all staff receive adequate supervision, support, and professional development to deliver safe, quality NDIS services in accordance with NDIS Practice Standards',
    [
      ['Document Number', 'Form122'],
      ['Version', '1.0'],
      ['Effective Date', '1 January 2026'],
      ['Review Date', '1 January 2027'],
      ['Document Owner', 'Kevin Rae Geronimo, General Manager'],
      ['Approved By', 'Harsimran Singh, Director'],
      ['Applies To', 'All employees and contractors'],
      ['Related Standard', 'NDIS Practice Standards Standard 114'],
    ]
  );

  // ─── 1. PURPOSE ──────────────────────────────────────────────────────────
  pdf.newPage();
  pdf.sectionHeading('1. Purpose');
  pdf.writeBody(
    'The purpose of this policy is to ensure that all One Life Foundation (OLF) staff receive adequate supervision, support, and professional development to deliver safe, quality services to NDIS participants. This policy is developed in accordance with NDIS Practice Standards Standard 114 — Human Resource Management, which requires that each worker is competent, has the necessary qualifications and experience, and is provided with adequate supervision and support.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'Effective supervision is essential to maintaining high-quality service delivery, identifying and addressing performance issues early, supporting staff wellbeing, and fostering a culture of continuous improvement. OLF is committed to providing a supportive work environment where staff feel valued, competent, and confident in their roles.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'This policy outlines the supervision framework, frequency, documentation requirements, performance review cycle, and support mechanisms available to all OLF staff.'
  );

  // ─── 2. SCOPE ──────────────────────────────────────────────────────────
  pdf.sectionHeading('2. Scope');
  pdf.writeBody('This policy applies to:');
  pdf.writeBullet('All OLF employees — full-time, part-time, and casual');
  pdf.writeBullet('All contractors engaged by OLF to provide direct or indirect participant supports');
  pdf.writeBullet('Volunteers (where applicable)');
  pdf.curY += 3;
  pdf.writeBody('This policy covers all forms of supervision, performance management, and support provided by OLF, including formal supervision, informal supervision, group supervision, clinical supervision, and performance reviews.');

  // ─── 3. SUPERVISION FRAMEWORK ────────────────────────────────────────
  pdf.sectionHeading('3. Supervision Framework');
  pdf.writeBody('OLF utilises a multi-layered supervision framework to ensure all staff receive appropriate guidance and support:');
  pdf.curY += 3;

  pdf.subHeading('3.1 Formal Supervision');
  pdf.writeBody('Formal supervision involves scheduled one-on-one meetings between a staff member and their direct supervisor. These sessions are structured, documented, and follow a consistent agenda. Formal supervision provides an opportunity to review workload, discuss participant outcomes, identify training needs, debrief incidents, and address any concerns or feedback.');

  pdf.subHeading('3.2 Informal Supervision');
  pdf.writeBody('Informal supervision occurs through day-to-day interactions, including check-ins at the start and end of shifts, observation of practice, real-time feedback, and ad hoc discussions about participant care. Informal supervision is an integral part of OLF\'s supportive culture and complements the formal supervision process.');

  pdf.subHeading('3.3 Group Supervision');
  pdf.writeBody('Group supervision takes the form of team meetings, case discussions, and collaborative problem-solving sessions. These sessions are scheduled regularly (at minimum monthly) and provide opportunities for staff to share knowledge, discuss complex cases, and learn from each other\'s experiences. Group supervision is facilitated by a senior staff member or the Operations Manager.');

  pdf.subHeading('3.4 Clinical Supervision');
  pdf.writeBody('Clinical supervision is provided for staff delivering high-intensity supports, including complex health care, behaviour support implementation, and medication administration. Clinical supervision is provided by a qualified professional (e.g., registered nurse, allied health professional) and focuses on clinical competence, safe practice, and professional development. Clinical supervision may be provided internally or through external arrangements.');

  // ─── 4. FREQUENCY ────────────────────────────────────────────────────
  pdf.sectionHeading('4. Supervision Frequency');
  pdf.writeBody('The frequency of formal supervision varies based on the staff member\'s experience and employment stage:');
  pdf.curY += 2;
  pdf.drawTable(
    ['Staff Category', 'Supervision Frequency', 'Notes'],
    [
      ['New staff (first 3 months)', 'Weekly', 'Close support during induction period to build competence and confidence'],
      ['Probation period staff', 'Fortnightly', 'Continued support and assessment of suitability for the role'],
      ['Established staff', 'Minimum monthly', 'Ongoing support, professional development, and performance review'],
      ['Contractors', 'Regular check-ins', 'As per engagement agreement; minimum quarterly formal review'],
    ],
    [45, 40, CW - 85]
  );
  pdf.curY += 2;
  pdf.writeBody('Additional supervision sessions may be arranged at any time at the request of the staff member or their supervisor, particularly following incidents, complaints, or significant changes in participant needs.');

  // ─── 5. SUPERVISION CONTENT ──────────────────────────────────────────
  pdf.sectionHeading('5. Supervision Content');
  pdf.writeBody('Each formal supervision session covers the following areas:');
  pdf.writeBullet('Workload Review — discussion of current caseload, shift patterns, and any workload concerns');
  pdf.writeBullet('Participant Outcomes — review of participant progress, goals, and any concerns about service delivery quality');
  pdf.writeBullet('Skill Development — identification of skills gaps and opportunities for growth, including feedback on observed practice');
  pdf.writeBullet('Incident Debrief — discussion of any incidents, near-misses, or complaints since the last session, including lessons learned and actions taken');
  pdf.writeBullet('Wellbeing Check — a genuine check-in on the staff member\'s physical and emotional wellbeing, including any signs of burnout, stress, or workplace concerns');
  pdf.writeBullet('Training Needs — identification of mandatory training requirements and professional development opportunities aligned with the staff member\'s goals and OLF\'s needs');
  pdf.writeBullet('Concerns and Feedback — an open discussion where the staff member can raise any concerns, provide feedback on OLF processes, or request additional support');

  // ─── 6. DOCUMENTATION ────────────────────────────────────────────────
  pdf.sectionHeading('6. Documentation');
  pdf.writeBody('All supervision is documented to ensure accountability and continuity:');
  pdf.writeBullet('A supervision log is completed after each formal supervision session, recording the date, attendees, topics discussed, and action items');
  pdf.writeBullet('Action items from each session are tracked and reviewed at the next session to ensure follow-through');
  pdf.writeBullet('Supervision logs are stored securely in the staff member\'s file within the One Life Vault document management system');
  pdf.writeBullet('Supervision records are confidential and accessed only by the staff member, their supervisor, and the General Manager or Director as required');
  pdf.writeBullet('Staff members receive a copy of their supervision log after each session');

  // ─── 7. PERFORMANCE REVIEW CYCLE ────────────────────────────────────
  pdf.sectionHeading('7. Performance Review Cycle');
  pdf.writeBody('OLF operates a structured performance review cycle to support staff development and maintain high standards of service delivery:');
  pdf.curY += 2;
  pdf.drawTable(
    ['Review Type', 'Timing', 'Tool', 'Purpose'],
    [
      ['Probation Review', '3 months', 'Form10', 'Assess suitability for ongoing employment, confirm role expectations, identify support needs'],
      ['Mid-Year Check-In', '6 months', 'Supervision log', 'Informal progress review, discuss goals, adjust development plan if needed'],
      ['Annual Performance Review', '12 months', 'Form10', 'Comprehensive review of performance, achievements, areas for improvement, and goal-setting for the next period'],
      ['Informal Feedback', 'Ongoing', 'Verbal/email', 'Real-time feedback on observed practice, positive recognition, and constructive guidance'],
    ],
    [38, 22, 30, CW - 90]
  );
  pdf.curY += 2;
  pdf.writeBody('Performance reviews are conducted collaboratively, with the staff member encouraged to self-reflect and contribute to their own development plan. Reviews are documented using Form10 — Worker Performance Assessment and stored in the staff member\'s file.');

  // ─── 8. SUPPORT AVAILABLE ────────────────────────────────────────────
  pdf.sectionHeading('8. Support Available');
  pdf.writeBody('OLF provides a range of support mechanisms to promote staff wellbeing and resilience:');
  pdf.curY += 3;

  pdf.subHeading('8.1 Employee Assistance Program (EAP)');
  pdf.writeBody('All OLF staff have access to confidential counselling and support services through the Employee Assistance Program. The EAP provides short-term counselling for personal and work-related issues, including stress, anxiety, relationship difficulties, grief, and financial concerns. EAP services are free for staff and their immediate family members.');

  pdf.subHeading('8.2 Critical Incident Debriefing');
  pdf.writeBody('Following serious incidents (e.g., participant harm, workplace violence, death of a participant, or other traumatic events), OLF arranges critical incident debriefing for all affected staff. Debriefing is facilitated by a qualified professional and aims to provide emotional support, normalise responses to trauma, and identify staff who may need additional support.');

  pdf.subHeading('8.3 Peer Support');
  pdf.writeBody('OLF operates a buddy system for new staff, pairing them with an experienced colleague during their induction period. The buddy provides informal guidance, answers questions, and helps the new staff member navigate the workplace culture and processes. Peer support is also encouraged through team meetings and social activities.');

  pdf.subHeading('8.4 Professional Development');
  pdf.writeBody('OLF invests in staff professional development through internal and external training opportunities, conference attendance, and study support. Staff can request professional development opportunities using Form113 — Professional Development Policy. OLF maintains a training calendar and ensures all mandatory training is completed on time.');

  // ─── 9. CAPABILITY DEVELOPMENT ───────────────────────────────────────
  pdf.sectionHeading('9. Capability Development');
  pdf.writeBody('OLF is committed to building and maintaining a skilled, competent workforce:');
  pdf.writeBullet('Training Matrix (Form09) — OLF maintains a comprehensive training matrix that tracks all mandatory and recommended training for each role. The matrix is reviewed quarterly and updated as requirements change.');
  pdf.writeBullet('Professional Development Plans — each staff member has a professional development plan that is reviewed during annual performance reviews. The plan identifies career goals, training needs, and development opportunities.');
  pdf.writeBullet('Mandatory Training Tracked — all mandatory training (including NDIS Worker Orientation Module, First Aid, CPR, Manual Handling, Medication Administration, and Infection Control) is tracked in the training matrix. Expiry dates are monitored and renewal arranged in advance.');
  pdf.writeBullet('Competency Assessments — for staff delivering high-intensity supports, competency assessments are conducted to ensure safe and effective practice. Assessments are conducted by a qualified professional and documented in the staff member\'s file.');

  // ─── 10. CONTRACTOR SUPERVISION ──────────────────────────────────────
  pdf.sectionHeading('10. Contractor Supervision');
  pdf.writeBody('Contractors engaged by OLF to provide participant supports are subject to the following supervision arrangements:');
  pdf.writeBullet('Regular quality checks — the Operations Manager or designated supervisor conducts regular quality checks on contractor performance, including observation of practice, review of documentation, and participant feedback');
  pdf.writeBullet('Participant feedback reviewed — feedback from participants and their families about contractor services is actively sought and reviewed as part of the supervision process');
  pdf.writeBullet('Compliance with OLF policies verified — contractors are required to comply with all relevant OLF policies and procedures. Compliance is verified through regular checks and annual review.');
  pdf.writeBullet('Engagement reviewed annually — contractor engagements are reviewed at least annually to assess performance, compliance, and ongoing suitability. The review considers participant outcomes, feedback, incident history, and compliance with contractual obligations.');

  // ─── 11. RELATED DOCUMENTS ───────────────────────────────────────────
  pdf.sectionHeading('11. Related Documents');
  pdf.drawTable(
    ['Document', 'Purpose'],
    [
      ['Form09 — Training Matrix', 'Tracks mandatory and recommended training for all staff'],
      ['Form10 — Worker Performance Assessment', 'Used for probation reviews and annual performance reviews'],
      ['Form113 — Professional Development Policy', 'Outlines professional development opportunities and request process'],
    ],
    [60, CW - 60]
  );

  // ─── 12. STAFF ACKNOWLEDGEMENT ───────────────────────────────────────
  pdf.drawSignatureTable(8);

  return pdf.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT 3: Form123 — Infection Control Policy
// ═══════════════════════════════════════════════════════════════════════════════

function buildForm123() {
  const pdf = new PDFBuilder({
    docNo: 'Form123',
    title: 'Infection Control Policy',
    categoryLine1: 'Policy & Procedure',
    categoryLine2: 'WHS',
  });

  // ─── COVER PAGE ──────────────────────────────────────────────────────────
  pdf.drawCoverPage(
    'Infection Control Policy',
    'Prevention and management of infections in One Life Foundation accommodation and community settings to protect participants, staff, and visitors',
    [
      ['Document Number', 'Form123'],
      ['Version', '1.0'],
      ['Effective Date', '1 January 2026'],
      ['Review Date', '1 January 2027'],
      ['Document Owner', 'Swosthani Thapa, Operations Manager'],
      ['Approved By', 'Harsimran Singh, Director'],
      ['Applies To', 'All staff, participants, and visitors'],
      ['Related Legislation', 'OHS Act 2004 (Vic), NDIS Practice Standards Module 1, AS/NZS 3816'],
    ]
  );

  // ─── 1. PURPOSE ──────────────────────────────────────────────────────────
  pdf.newPage();
  pdf.sectionHeading('1. Purpose');
  pdf.writeBody(
    'The purpose of this policy is to establish a comprehensive framework for the prevention, identification, and management of infections within One Life Foundation (OLF) accommodation settings, community-based service delivery environments, and all OLF workplaces. Effective infection control is essential to protecting the health and safety of participants, staff, visitors, and the broader community.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'This policy is developed in accordance with the Occupational Health and Safety Act 2004 (Vic), NDIS Practice Standards Module 1 — Rights and Responsibilities of Participants, and AS/NZS 3816 — Management of Clinical and Related Wastes. OLF is committed to implementing evidence-based infection prevention and control practices that meet or exceed regulatory requirements.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'The policy outlines standard precautions, hand hygiene practices, personal protective equipment (PPE) requirements, cleaning and disinfection procedures, outbreak management protocols, and staff health responsibilities.'
  );

  // ─── 2. SCOPE ──────────────────────────────────────────────────────────
  pdf.sectionHeading('2. Scope');
  pdf.writeBody('This policy applies to:');
  pdf.writeBullet('All OLF employees (full-time, part-time, casual), contractors, and volunteers');
  pdf.writeBullet('All NDIS participants receiving services from OLF');
  pdf.writeBullet('All visitors to OLF premises, including family members, health professionals, and tradespeople');
  pdf.writeBullet('All OLF premises including Supported Independent Living (SIL) accommodation, the head office at 9C Grasslands Avenue, Craigieburn VIC 3064, and community-based service delivery locations');
  pdf.writeBullet('All service delivery activities, including personal care, community access, and domestic tasks');

  // ─── 3. STANDARD PRECAUTIONS ─────────────────────────────────────────
  pdf.sectionHeading('3. Standard Precautions');
  pdf.writeBody('Standard precautions are the minimum infection prevention practices that apply to all care situations, regardless of suspected or confirmed infection status. OLF staff must apply standard precautions for every care activity and every interaction with participants.');
  pdf.curY += 3;
  pdf.writeBody('The key principle of standard precautions is to treat all blood, body fluids (excluding sweat), non-intact skin, and mucous membranes as potentially infectious. This means applying appropriate precautions at all times, not only when an infection is known or suspected.');
  pdf.curY += 3;
  pdf.writeBody('Standard precautions include:');
  pdf.writeBullet('Hand hygiene (see Section 4)');
  pdf.writeBullet('Use of personal protective equipment (PPE) appropriate to the task (see Section 5)');
  pdf.writeBullet('Safe handling and disposal of sharps (see Section 6)');
  pdf.writeBullet('Appropriate cleaning and disinfection of surfaces and equipment (see Section 7)');
  pdf.writeBullet('Safe handling and disposal of waste (see Section 7)');
  pdf.writeBullet('Respiratory hygiene and cough etiquette');
  pdf.writeBullet('Safe injection practices and aseptic technique where applicable');

  // ─── 4. HAND HYGIENE ─────────────────────────────────────────────────
  pdf.sectionHeading('4. Hand Hygiene');
  pdf.writeBody('Hand hygiene is the single most effective measure for preventing the spread of infections. OLF follows the World Health Organization (WHO) "5 Moments for Hand Hygiene" model:');
  pdf.curY += 2;
  pdf.writeBullet('Moment 1: Before touching a participant — clean hands before any direct contact with a participant');
  pdf.writeBullet('Moment 2: Before a clean/aseptic procedure — clean hands before performing any procedure that requires a clean or sterile environment (e.g., wound care, catheter care)');
  pdf.writeBullet('Moment 3: After body fluid exposure risk — clean hands immediately after any exposure or risk of exposure to body fluids (e.g., after personal care, handling soiled linen)');
  pdf.writeBullet('Moment 4: After touching a participant — clean hands after direct contact with a participant');
  pdf.writeBullet('Moment 5: After touching a participant\'s surroundings — clean hands after touching objects or surfaces in the participant\'s immediate environment');
  pdf.curY += 3;

  pdf.subHeading('Soap and Water vs Alcohol-Based Hand Rub');
  pdf.writeBody('Soap and water must be used when:');
  pdf.writeBullet('Hands are visibly soiled with dirt, blood, or body fluids');
  pdf.writeBullet('After using the toilet');
  pdf.writeBullet('Before and after preparing food');
  pdf.writeBullet('After caring for a participant with gastroenteritis (alcohol hand rub is not effective against some gastro-causing organisms, e.g., Clostridium difficile)');
  pdf.curY += 2;
  pdf.writeBody('Alcohol-based hand rub (ABHR) may be used when:');
  pdf.writeBullet('Hands are not visibly soiled');
  pdf.writeBullet('Soap and water are not immediately available');
  pdf.writeBullet('Between tasks with the same participant');
  pdf.curY += 2;
  pdf.writeBody('Hand hygiene technique: rub all surfaces of hands (palms, backs, between fingers, thumbs, fingertips, wrists) for at least 20 seconds with soap and water, or until dry with ABHR.');

  // ─── 5. PERSONAL PROTECTIVE EQUIPMENT (PPE) ─────────────────────────
  pdf.sectionHeading('5. Personal Protective Equipment (PPE)');
  pdf.writeBody('PPE provides a barrier between staff and infectious agents. OLF ensures that appropriate PPE is available at all service delivery locations and that staff are trained in correct use.');
  pdf.curY += 3;

  pdf.subHeading('5.1 Gloves');
  pdf.writeBody('Single-use gloves are worn when there is risk of contact with blood, body fluids, non-intact skin, or mucous membranes. Gloves must be changed between tasks and between participants. Gloves are removed and disposed of immediately after the task, followed by hand hygiene.');

  pdf.subHeading('5.2 Apron/Gown');
  pdf.writeBody('A disposable apron or gown is worn when there is a risk of splash or spray of blood or body fluids onto clothing, or during personal care activities where clothing contamination is likely.');

  pdf.subHeading('5.3 Face Mask');
  pdf.writeBody('A surgical face mask is worn when there is a risk of respiratory infection transmission (e.g., when a participant or staff member has respiratory symptoms) or during aerosol-generating procedures.');

  pdf.subHeading('5.4 Eye Protection');
  pdf.writeBody('Eye protection (safety glasses or face shield) is worn when there is a risk of splash or spray of blood or body fluids to the face.');

  pdf.subHeading('5.5 Donning and Doffing Sequence');
  pdf.writeBody('Correct donning (putting on) sequence:');
  pdf.writeBullet('Hand hygiene');
  pdf.writeBullet('Gown/apron');
  pdf.writeBullet('Mask');
  pdf.writeBullet('Eye protection');
  pdf.writeBullet('Gloves');
  pdf.curY += 2;
  pdf.writeBody('Correct doffing (removing) sequence:');
  pdf.writeBullet('Gloves (most contaminated item removed first)');
  pdf.writeBullet('Eye protection');
  pdf.writeBullet('Gown/apron');
  pdf.writeBullet('Mask');
  pdf.writeBullet('Hand hygiene');

  // ─── 6. SHARPS MANAGEMENT ────────────────────────────────────────────
  pdf.sectionHeading('6. Sharps Management');
  pdf.writeBody('Sharps (needles, lancets, broken glass, etc.) pose a significant risk of injury and infection transmission. OLF follows strict sharps management procedures:');
  pdf.writeBullet('Never recap, bend, or break needles after use');
  pdf.writeBullet('Dispose of sharps immediately after use into an approved sharps container (AS 4031 compliant)');
  pdf.writeBullet('Sharps containers must be located as close as practicable to the point of use');
  pdf.writeBullet('Sharps containers are replaced when three-quarters full — never overfilled');
  pdf.writeBullet('Replacement of sharps containers is tracked using Form58 — Waste Register');
  pdf.writeBullet('Full sharps containers are sealed and disposed of through a licensed clinical waste contractor');
  pdf.writeBullet('Any sharps injury (needlestick or sharps-related injury) is reported immediately via Form04 — Incident Report and treated as a medical emergency requiring first aid, risk assessment, and medical follow-up');

  // ─── 7. CLEANING AND DISINFECTION ────────────────────────────────────
  pdf.sectionHeading('7. Cleaning and Disinfection');

  pdf.subHeading('7.1 Routine Cleaning');
  pdf.writeBody('A clean environment is essential for infection prevention. OLF implements the following routine cleaning schedule:');
  pdf.writeBullet('High-touch surfaces (door handles, light switches, handrails, benchtops, taps, toilet flush buttons) — cleaned and disinfected daily');
  pdf.writeBullet('Bathrooms and toilets — cleaned and disinfected daily');
  pdf.writeBullet('Floors — vacuumed/mopped daily in high-traffic areas');
  pdf.writeBullet('Weekly deep clean — all rooms, including behind furniture, inside cupboards, and all surfaces');
  pdf.writeBullet('Cleaning is documented using the daily/weekly cleaning checklist');

  pdf.subHeading('7.2 Blood and Body Fluid Spills');
  pdf.writeBody('Spills of blood or body fluids are managed as follows:');
  pdf.writeBullet('Don PPE (gloves, apron, eye protection if splash risk)');
  pdf.writeBullet('Contain the spill — use absorbent material (paper towels, spill kit granules)');
  pdf.writeBullet('Clean the area with warm water and detergent');
  pdf.writeBullet('Disinfect the area with an appropriate hospital-grade disinfectant or 1000ppm sodium hypochlorite solution');
  pdf.writeBullet('Dispose of all contaminated material in a clinical waste bag');
  pdf.writeBullet('Remove PPE and perform hand hygiene');
  pdf.writeBullet('Document the spill and cleaning in the daily log');

  pdf.subHeading('7.3 Laundry');
  pdf.writeBody('Laundry practices at OLF accommodation sites follow infection control principles:');
  pdf.writeBullet('Wash linen and clothing at a minimum of 60\u00B0C to kill most pathogens');
  pdf.writeBullet('Separate soiled items from general laundry — handle soiled items with gloves and place in a designated laundry bag');
  pdf.writeBullet('Do not shake soiled linen (to avoid dispersing microorganisms)');
  pdf.writeBullet('Dry items thoroughly — use a dryer where possible');
  pdf.writeBullet('Staff wear PPE (gloves and apron) when handling soiled laundry');

  pdf.subHeading('7.4 Waste Management');
  pdf.writeBody('Waste is classified and disposed of appropriately:');
  pdf.writeBullet('General waste — non-contaminated household waste, disposed of in standard bins');
  pdf.writeBullet('Clinical waste — any waste contaminated with blood or body fluids, sharps containers, and used PPE from infection-related care. Disposed of in yellow clinical waste bags via licensed contractor.');
  pdf.writeBullet('Waste disposal is tracked using Form58 — Waste Register');

  // ─── 8. OUTBREAK MANAGEMENT ──────────────────────────────────────────
  pdf.sectionHeading('8. Outbreak Management');
  pdf.writeBody('An outbreak is defined as two or more linked cases of the same infection in a defined setting and time period. OLF\'s outbreak management protocol includes:');
  pdf.writeBullet('Isolation procedures — affected participants are isolated where possible and safe to do so, in consultation with their treating medical practitioner');
  pdf.writeBullet('Enhanced cleaning — increased frequency and intensity of cleaning and disinfection, particularly in affected areas');
  pdf.writeBullet('Notification to health authorities — the Victorian Department of Health is notified as required under the Public Health and Wellbeing Act 2008 (Vic)');
  pdf.writeBullet('Staff exclusion — symptomatic staff are excluded from work until they meet return-to-work criteria (see Section 11)');
  pdf.writeBullet('Communication plan — participants, families, and staff are informed of the outbreak, precautions being taken, and any changes to service delivery');
  pdf.writeBullet('Documentation — all outbreak-related actions are documented, including cases, timeline, actions taken, and outcomes');
  pdf.writeBullet('Post-outbreak review — a review is conducted after the outbreak is resolved to identify lessons learned and improve future response');

  // ─── 9. COVID-19 PROTOCOLS ───────────────────────────────────────────
  pdf.sectionHeading('9. COVID-19 Protocols');
  pdf.writeBody('OLF follows current Victorian and Commonwealth Government guidelines for COVID-19 management. Key protocols include:');
  pdf.writeBullet('Testing — staff and participants who develop respiratory symptoms are encouraged to test for COVID-19 using a Rapid Antigen Test (RAT). Positive results are managed in accordance with current public health advice.');
  pdf.writeBullet('Isolation — positive cases follow current isolation guidance. OLF supports participants to isolate safely within their accommodation, with appropriate care arrangements in place.');
  pdf.writeBullet('Vaccination — OLF encourages COVID-19 vaccination for all staff and participants. Vaccination records are maintained as part of staff health records.');
  pdf.writeBullet('PPE — enhanced PPE requirements may be implemented during periods of increased COVID-19 transmission, as directed by the Operations Manager or in accordance with public health orders.');
  pdf.writeBullet('Ventilation — OLF promotes good ventilation in all accommodation and service delivery settings, including opening windows and doors where safe and practicable.');

  // ─── 10. FOOD SAFETY ─────────────────────────────────────────────────
  pdf.sectionHeading('10. Food Safety');
  pdf.writeBody('Food safety practices in OLF accommodation and community settings are essential for preventing foodborne illness:');
  pdf.writeBullet('Kitchen hygiene — all food preparation areas are cleaned and sanitised before and after use. Separate chopping boards are used for raw meat and other foods.');
  pdf.writeBullet('Fridge temperature checks — fridge temperatures are checked and recorded daily. Fridges must be maintained at or below 5\u00B0C. Freezers must be maintained at or below -15\u00B0C.');
  pdf.writeBullet('Food handling — staff wear gloves when handling ready-to-eat food. Hand hygiene is performed before and after food preparation.');
  pdf.writeBullet('Food storage and labelling — all stored food is labelled with the date of preparation or opening. Leftovers are consumed within 2 days or discarded. Raw meat is stored below cooked/ready-to-eat food in the fridge to prevent cross-contamination.');
  pdf.writeBullet('Staff training — all staff involved in food preparation complete food safety training and are aware of allergen management requirements for each participant.');

  // ─── 11. STAFF HEALTH ────────────────────────────────────────────────
  pdf.sectionHeading('11. Staff Health');
  pdf.writeBody('Staff health is critical to infection prevention. OLF implements the following staff health measures:');
  pdf.writeBullet('Exclusion from work when symptomatic — staff must not attend work when experiencing symptoms of gastroenteritis (vomiting, diarrhoea), respiratory infection (fever, cough, sore throat), or other potentially infectious conditions. Staff must notify their supervisor immediately.');
  pdf.writeBullet('Immunisation records maintained — OLF maintains records of staff immunisations, including influenza, COVID-19, hepatitis B, and any other vaccinations relevant to their role. Staff are encouraged to maintain up-to-date immunisations.');
  pdf.writeBullet('Return to work clearance — staff who have been excluded due to illness must meet return-to-work criteria before resuming duties. For gastroenteritis: no symptoms for at least 48 hours. For COVID-19: as per current public health guidance. A medical clearance may be required for extended absences.');
  pdf.writeBullet('Sharps injuries and blood/body fluid exposures — any exposure incident is treated as a medical emergency. Staff receive immediate first aid, risk assessment, and referral to a medical practitioner. The incident is reported via Form04 — Incident Report.');

  // ─── 12. SPECIFIC CLINICAL CONSIDERATIONS ────────────────────────────
  pdf.sectionHeading('12. Specific Clinical Considerations');

  pdf.subHeading('12.1 Wound Care');
  pdf.writeBody('Standard precautions are applied during all wound monitoring and care activities. Staff wear gloves and any additional PPE appropriate to the wound type. Aseptic technique is used for dressing changes where within the staff member\'s scope of practice. All wound care activities are documented in the participant\'s health record, including wound assessment, treatment provided, and any concerns escalated to a health professional.');

  pdf.subHeading('12.2 Catheter Care');
  pdf.writeBody('Staff supporting participants with urinary catheters follow strict infection control procedures:');
  pdf.writeBullet('Hand hygiene is performed before and after any catheter-related care');
  pdf.writeBullet('Clean technique is used for catheter care, including cleaning around the insertion site with appropriate solution');
  pdf.writeBullet('The drainage bag is kept below the level of the bladder at all times and is not allowed to touch the floor');
  pdf.writeBullet('Staff monitor for signs of urinary tract infection (UTI), including cloudy or foul-smelling urine, fever, increased confusion, or pain, and escalate to the treating medical practitioner');

  pdf.subHeading('12.3 Diabetes and Insulin Management');
  pdf.writeBody('For participants requiring blood glucose monitoring or insulin administration:');
  pdf.writeBullet('Sharps disposal — all lancets and needles are disposed of immediately into an approved sharps container');
  pdf.writeBullet('Skin preparation — the injection site is cleaned with an alcohol swab before injection');
  pdf.writeBullet('Single-use equipment — blood glucose monitoring lancets and insulin pen needles are single-use only and never shared between participants');
  pdf.writeBullet('Blood spill management — any blood spills during monitoring are cleaned using standard precautions');

  // ─── 13. RELATED DOCUMENTS ───────────────────────────────────────────
  pdf.sectionHeading('13. Related Documents');
  pdf.drawTable(
    ['Document', 'Purpose'],
    [
      ['Form58 — Waste Register', 'Tracks clinical waste and sharps container disposal'],
      ['Form63 — HSE Inspection Checklist', 'Regular health, safety, and environment inspections'],
      ['Form118 — WHS Policy', 'Overarching workplace health and safety policy'],
      ['Form04 — Incident Report', 'Reporting of infection-related incidents, sharps injuries, and outbreaks'],
    ],
    [60, CW - 60]
  );

  // ─── 14. STAFF ACKNOWLEDGEMENT ───────────────────────────────────────
  pdf.drawSignatureTable(8);

  return pdf.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT 4: Form124 — Restrictive Practices Policy
// ═══════════════════════════════════════════════════════════════════════════════

function buildForm124() {
  const pdf = new PDFBuilder({
    docNo: 'Form124',
    title: 'Restrictive Practices Policy',
    categoryLine1: 'Policy & Procedure',
    categoryLine2: 'Behaviour Support',
  });

  // ─── COVER PAGE ──────────────────────────────────────────────────────────
  pdf.drawCoverPage(
    'Restrictive Practices Policy',
    'Ensuring restrictive practices are only used as a last resort, with appropriate safeguards and in accordance with legislation and NDIS Practice Standards',
    [
      ['Document Number', 'Form124'],
      ['Version', '1.0'],
      ['Effective Date', '1 January 2026'],
      ['Review Date', '1 January 2027'],
      ['Document Owner', 'Kevin Rae Geronimo, General Manager'],
      ['Approved By', 'Harsimran Singh, Director'],
      ['Applies To', 'All staff supporting participants with behaviour support plans'],
      ['Related Legislation', 'NDIS (Restrictive Practices and Behaviour Support) Rules 2018, Disability Act 2006 (Vic), NDIS Practice Standards Module 2A'],
    ]
  );

  // ─── 1. PURPOSE ──────────────────────────────────────────────────────────
  pdf.newPage();
  pdf.sectionHeading('1. Purpose');
  pdf.writeBody(
    'The purpose of this policy is to ensure that restrictive practices are only ever used as a last resort, for the shortest time necessary, and with appropriate safeguards in place to protect the rights, dignity, and safety of NDIS participants. This policy is developed in accordance with NDIS Practice Standards Module 2A — Behaviour Support, which requires providers to have systems in place to ensure restrictive practices are used only in accordance with relevant legislation and authorised behaviour support plans.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'One Life Foundation (OLF) is committed to positive behaviour support as the primary approach to understanding and responding to behaviours of concern. Restrictive practices are never used as a punishment, for the convenience of staff, or as a substitute for adequate staffing or training. OLF actively works to reduce and eliminate the use of restrictive practices over time.'
  );
  pdf.curY += 3;
  pdf.writeBody(
    'This policy outlines the definitions, guiding principles, legislative framework, authorisation requirements, implementation procedures, reporting obligations, and strategies for reducing and eliminating restrictive practices.'
  );

  // ─── 2. SCOPE ──────────────────────────────────────────────────────────
  pdf.sectionHeading('2. Scope');
  pdf.writeBody('This policy applies to:');
  pdf.writeBullet('All OLF employees, contractors, and volunteers who support participants who have behaviour support plans (BSPs) that include regulated restrictive practices');
  pdf.writeBullet('All OLF service delivery settings, including Supported Independent Living (SIL) accommodation and community-based services');
  pdf.writeBullet('All NDIS participants receiving OLF services who are subject to a behaviour support plan that authorises the use of restrictive practices');
  pdf.curY += 3;
  pdf.writeBody('This policy does not apply to practices that are not restrictive in nature, such as general behaviour management strategies, positive reinforcement, environmental modifications that enhance safety without restricting freedom, or reasonable conditions of service delivery agreed upon by the participant.');

  // ─── 3. DEFINITIONS ──────────────────────────────────────────────────
  pdf.sectionHeading('3. Definitions');
  pdf.drawTable(
    ['Term', 'Definition'],
    [
      ['Regulated Restrictive Practice', 'Any practice or intervention that has the effect of restricting the rights or freedom of movement of a person with disability, for the primary purpose of protecting the person or others from harm.'],
      ['Seclusion', 'The sole confinement of a person in a room or a physical space at any hour of the day or night where voluntary exit is prevented. This does not include a person choosing to be alone.'],
      ['Chemical Restraint', 'The use of medication or chemical substance for the primary purpose of influencing a person\'s behaviour, not including medication prescribed for the treatment of, or to enable treatment of, a diagnosed mental disorder, physical illness, or physical condition.'],
      ['Mechanical Restraint', 'The use of a device to prevent, restrict, or subdue a person\'s movement for the primary purpose of influencing a person\'s behaviour. This does not include the use of devices for therapeutic or non-behavioural purposes (e.g., wheelchair seatbelts for postural support).'],
      ['Physical Restraint', 'The use of a person\'s body to restrict movement of another person for the primary purpose of influencing the other person\'s behaviour.'],
      ['Environmental Restraint', 'Restricting a person\'s free access to all parts of their environment, including items and activities. Examples include locked doors, removed items, and restricted access to areas of the home.'],
    ],
    [50, CW - 50]
  );

  // ─── 4. GUIDING PRINCIPLES ───────────────────────────────────────────
  pdf.sectionHeading('4. Guiding Principles');
  pdf.writeBody('All decisions regarding the use of restrictive practices at OLF are governed by the following principles:');
  pdf.curY += 2;
  pdf.writeBullet('Least Restrictive Option — OLF must always seek less restrictive alternatives before considering any restrictive practice. This includes de-escalation, environmental modification, sensory strategies, communication adjustments, and removal of triggers.');
  pdf.writeBullet('Shortest Duration — when a restrictive practice is authorised and necessary, it must be used for the minimum time necessary to manage the immediate risk. The practice must cease as soon as the risk has been mitigated.');
  pdf.writeBullet('Dignity Preserved — the participant must be treated with respect and dignity at all times during and after the use of a restrictive practice. Staff must communicate calmly, explain what is happening and why, and provide reassurance.');
  pdf.writeBullet('Positive Behaviour Support is Primary — restrictive practices are a last resort. OLF\'s primary approach to behaviours of concern is positive behaviour support (PBS), which focuses on understanding the function of behaviour and implementing proactive strategies to improve quality of life and reduce behaviours of concern.');
  pdf.writeBullet('Participant Rights — participants (and their nominees/guardians) have the right to: be informed about any restrictive practices proposed or used; provide or withhold consent; access advocacy services; make a complaint about the use of restrictive practices; have restrictive practices reviewed and reduced over time.');

  // ─── 5. LEGISLATIVE FRAMEWORK ────────────────────────────────────────
  pdf.sectionHeading('5. Legislative Framework');
  pdf.writeBody('The use of restrictive practices in NDIS services is governed by a complex legislative framework. OLF complies with the following legislation:');
  pdf.curY += 2;
  pdf.writeBullet('NDIS Act 2013 (Cth) — establishes the National Disability Insurance Scheme and the rights of participants, including the right to dignity and freedom from abuse, neglect, and exploitation.');
  pdf.writeBullet('NDIS (Restrictive Practices and Behaviour Support) Rules 2018 — sets out the requirements for the use of restrictive practices by NDIS providers, including reporting obligations and the role of behaviour support practitioners.');
  pdf.writeBullet('Disability Act 2006 (Vic) — Victorian legislation governing the use of restrictive interventions for people with disabilities, including requirements for authorisation by the Senior Practitioner.');
  pdf.writeBullet('Senior Practitioner Act 2018 (Vic) — establishes the Office of the Senior Practitioner in Victoria, which oversees the use of restrictive practices and chemical restraint for people with disabilities.');
  pdf.writeBullet('NDIS Quality and Safeguards Commission — the national regulator that monitors compliance with NDIS Practice Standards, including the use of restrictive practices. OLF reports the use of restrictive practices to the NDIS Commission as required.');

  // ─── 6. AUTHORISATION REQUIREMENTS ───────────────────────────────────
  pdf.sectionHeading('6. Authorisation Requirements');
  pdf.writeBody('Restrictive practices must never be used without proper authorisation. The following requirements must be met before any restrictive practice is used:');
  pdf.curY += 2;
  pdf.writeBullet('Included in a Behaviour Support Plan (BSP) — the restrictive practice must be specifically included in a registered Behaviour Support Plan developed by an NDIS-registered behaviour support practitioner. The BSP must document the behaviour of concern, the function of the behaviour, proactive strategies, reactive strategies including the restrictive practice, and a plan to reduce and eliminate the practice.');
  pdf.writeBullet('Approved by the NDIS Commission — the BSP containing the restrictive practice must be lodged with and approved by the NDIS Quality and Safeguards Commission.');
  pdf.writeBullet('Consent obtained — informed consent must be obtained from the participant, or their guardian/nominee where the participant is unable to provide consent. Consent is documented using Form75 — Consent for Restrictive Practices. Consent must be freely given, informed, and specific to the practices described in the BSP.');
  pdf.writeBullet('Authorised by Victorian Senior Practitioner — for state-regulated practices in Victoria, authorisation must also be obtained from the Victorian Senior Practitioner (or delegate) as required under the Disability Act 2006 (Vic).');
  pdf.writeBullet('NOT used in the absence of an authorised BSP — under no circumstances may a restrictive practice be used if it is not authorised in a current, registered BSP. Any use outside of a BSP is an unauthorised use and a reportable incident (see Section 10).');

  // ─── 7. IMPLEMENTATION ───────────────────────────────────────────────
  pdf.sectionHeading('7. Implementation');
  pdf.writeBody('When a restrictive practice is authorised in a participant\'s BSP, the following implementation requirements apply:');
  pdf.curY += 2;
  pdf.writeBullet('Trained staff only — the restrictive practice may only be implemented by staff who have been specifically trained in the particular practice as described in the BSP. Training records are maintained in the staff member\'s file.');
  pdf.writeBullet('In accordance with the BSP — the practice must be implemented exactly as described in the BSP. Staff must not improvise, modify, or escalate the practice beyond what is authorised.');
  pdf.writeBullet('Documentation of every use — every use of a restrictive practice must be documented immediately or as soon as practicable. The documentation must include:');
  pdf.writeSubBullet('Date and time of use');
  pdf.writeSubBullet('Duration of the restrictive practice');
  pdf.writeSubBullet('Behaviour that triggered the use of the practice');
  pdf.writeSubBullet('Type of restrictive practice used');
  pdf.writeSubBullet('De-escalation strategies attempted prior to use');
  pdf.writeSubBullet('Staff members involved');
  pdf.writeSubBullet('Outcome — the participant\'s response and how the situation was resolved');
  pdf.writeSubBullet('Post-incident support provided to the participant');

  // ─── 8. REPORTING ────────────────────────────────────────────────────
  pdf.sectionHeading('8. Reporting');
  pdf.writeBody('OLF has strict reporting obligations regarding the use of restrictive practices:');
  pdf.curY += 2;
  pdf.writeBullet('Participant file and incident register — every use of a restrictive practice is recorded in the participant\'s file and in OLF\'s incident register.');
  pdf.writeBullet('Monthly reporting to NDIS Commission — OLF reports all uses of restrictive practices to the NDIS Quality and Safeguards Commission through the monthly reporting portal, as required by the NDIS (Restrictive Practices and Behaviour Support) Rules 2018.');
  pdf.writeBullet('Unauthorised use — any use of a restrictive practice that is not authorised in a current BSP is a reportable incident and must be reported to the NDIS Commission within 24 hours (see Section 10).');
  pdf.writeBullet('Reported to BSP practitioner — every use of a restrictive practice is reported to the participant\'s behaviour support practitioner. This information informs BSP reviews and the development of strategies to reduce and eliminate restrictive practices.');
  pdf.writeBullet('Internal reporting — all uses are reported to the Operations Manager and Director for review. Patterns and trends are analysed to identify opportunities for improvement.');

  // ─── 9. REDUCTION AND ELIMINATION ────────────────────────────────────
  pdf.sectionHeading('9. Reduction and Elimination');
  pdf.writeBody('OLF is committed to actively reducing and ultimately eliminating the use of all restrictive practices. Strategies to achieve this include:');
  pdf.curY += 2;
  pdf.writeBullet('Active reduction strategies — OLF works proactively with behaviour support practitioners, participants, and their support networks to implement positive behaviour support strategies that reduce the frequency, intensity, and duration of behaviours of concern, thereby reducing the need for restrictive practices.');
  pdf.writeBullet('BSP reviews — behaviour support plans are reviewed at a minimum of 12-monthly, or sooner following significant incidents, changes in the participant\'s circumstances, or at the request of the participant or their representative. Reviews focus on reducing and eliminating restrictive practices.');
  pdf.writeBullet('Data tracking — OLF tracks detailed data on each use of a restrictive practice, including frequency, duration, triggers, antecedents, and alternatives attempted. This data is analysed to identify trends and inform practice improvement.');
  pdf.writeBullet('Goal: elimination — the overarching goal for every participant subject to restrictive practices is the elimination of all restrictive practices where possible. This goal is documented in the BSP and progress is reviewed regularly.');
  pdf.writeBullet('Staff training in alternatives — OLF invests in ongoing training for staff in positive behaviour support, de-escalation, trauma-informed care, and sensory-based strategies to provide alternatives to restrictive practices.');

  // ─── 10. UNAUTHORISED USE ────────────────────────────────────────────
  pdf.sectionHeading('10. Unauthorised Use');
  pdf.writeBody('Any use of a restrictive practice that is not authorised in a current, registered behaviour support plan is an unauthorised use. Unauthorised use is a serious matter and is managed as follows:');
  pdf.curY += 2;
  pdf.writeBullet('Reportable incident — any unauthorised use is classified as a reportable incident under the NDIS (Incident Management and Reportable Incidents) Rules 2018.');
  pdf.writeBullet('Reported to NDIS Commission within 24 hours — the Director (or delegate) reports the unauthorised use to the NDIS Quality and Safeguards Commission within 24 hours of becoming aware of the incident.');
  pdf.writeBullet('Immediate investigation — the Director initiates an immediate investigation into the circumstances of the unauthorised use, including interviews with staff involved, review of documentation, and assessment of the participant\'s wellbeing.');
  pdf.writeBullet('Disciplinary action — depending on the findings of the investigation, disciplinary action may include additional training and supervision, formal warning, redeployment to a non-direct-support role, or termination of employment or engagement.');
  pdf.writeBullet('Support for the participant — the participant receives immediate support following any unauthorised use, including debriefing, access to advocacy, and review of their support arrangements.');
  pdf.writeBullet('Systemic review — each unauthorised use triggers a systemic review to identify any contributing factors (e.g., inadequate training, staffing issues, unclear BSP instructions) and implement corrective actions.');

  // ─── 11. STAFF TRAINING ──────────────────────────────────────────────
  pdf.sectionHeading('11. Staff Training');
  pdf.writeBody('All staff who support participants with behaviour support plans receive comprehensive training:');
  pdf.writeBullet('Positive Behaviour Support — foundational training in the principles and practices of positive behaviour support, including understanding the function of behaviour, proactive strategies, and person-centred approaches.');
  pdf.writeBullet('De-escalation Techniques — training in verbal and non-verbal de-escalation strategies to manage behaviours of concern without resorting to restrictive practices.');
  pdf.writeBullet('Specific Restrictive Practice Competency — where a staff member is required to implement a specific restrictive practice as described in a participant\'s BSP, they receive targeted training in that specific practice, including correct technique, safety considerations, and documentation requirements.');
  pdf.writeBullet('Trauma-Informed Care — training in trauma-informed approaches to understand how past trauma may influence behaviour and how to respond in ways that promote safety, trust, and recovery.');
  pdf.writeBullet('Annual Refresher — all training related to behaviour support and restrictive practices is refreshed annually. Training records are maintained in the staff member\'s file and tracked in the Training Matrix (Form09).');

  // ─── 12. RELATED DOCUMENTS ───────────────────────────────────────────
  pdf.sectionHeading('12. Related Documents');
  pdf.drawTable(
    ['Document', 'Purpose'],
    [
      ['Form75 — Consent for Restrictive Practices', 'Records informed consent from participant/guardian for authorised restrictive practices'],
      ['Form04 — Incident Report', 'Reporting of all uses of restrictive practices and unauthorised use incidents'],
      ['Individual Behaviour Support Plans (BSPs)', 'Participant-specific plans developed by NDIS-registered behaviour support practitioners'],
      ['Form42 — Behaviour Support Risk Assessment', 'Risk assessment for participants with behaviours of concern'],
      ['Form09 — Training Matrix', 'Tracks staff training in behaviour support and restrictive practices'],
    ],
    [60, CW - 60]
  );

  // ─── 13. STAFF ACKNOWLEDGEMENT ───────────────────────────────────────
  pdf.drawSignatureTable(8);

  return pdf.finalize();
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — Generate all 4 PDFs, save to disk, upload to Supabase
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
  console.log('  One Life Foundation — Policy Batch 3 Generator');
  console.log('═══════════════════════════════════════════════════════\n');

  const documents = [
    {
      name: 'Form121.Participant Transition and Exit Policy.pdf',
      build: buildForm121,
    },
    {
      name: 'Form122.Staff Supervision and Support Policy.pdf',
      build: buildForm122,
    },
    {
      name: 'Form123.Infection Control Policy.pdf',
      build: buildForm123,
    },
    {
      name: 'Form124.Restrictive Practices Policy.pdf',
      build: buildForm124,
    },
  ];

  for (const doc of documents) {
    console.log(`\n▸ Generating: ${doc.name}`);
    const buffer = doc.build();
    console.log(`  [OK] PDF generated (${(buffer.length / 1024).toFixed(1)} KB)`);
    await savePdf(buffer, doc.name);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  All 4 policies generated successfully!');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
