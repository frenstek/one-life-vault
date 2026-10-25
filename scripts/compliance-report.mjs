import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import pkg from 'jspdf';
const { jsPDF } = pkg;

const sb = createClient(
  'https://czdlemutsimvwfpwylxh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk'
);

const REQUIRED = [
  'NDIS Worker Screening Check',
  'First Aid Certificate',
  'CPR Certificate',
  "Driver's License",
  'Manual Handling Certificate',
  'Medication Administration Certificate',
  'COVID-19 Vaccination',
  'Right to Work',
  'Signed Code of Conduct',
];

const PAGE_W = 210, PAGE_H = 297;
const ML = 15, MR = 15, MT = 15;
const CW = PAGE_W - ML - MR;
const HEADER_H = 26;
const FOOTER_H = 10;
const BODY_TOP = MT + HEADER_H + 4;
const BODY_BOTTOM = PAGE_H - MT - FOOTER_H;

const BLUE = [30, 90, 138];
const OLF_BLUE = [48, 158, 221];
const DARK = [30, 41, 59];
const MED = [100, 116, 139];
const RED = [220, 38, 38];
const AMBER = [217, 119, 6];
const GREEN = [22, 163, 74];
const WHITE = [255, 255, 255];
const LIGHT_BG = [248, 250, 252];
const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

// Load logo
let logoData = null;
try {
  const logoBuf = readFileSync('public/logo.png');
  logoData = 'data:image/png;base64,' + logoBuf.toString('base64');
} catch {}

let pdf, pageNum, y;

function newPdf() {
  pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  pageNum = 1;
  y = BODY_TOP;
}

function drawHeader() {
  // Blue bar
  pdf.setFillColor(...BLUE);
  pdf.rect(0, 0, PAGE_W, MT + HEADER_H, 'F');

  // Logo
  if (logoData) {
    try { pdf.addImage(logoData, 'PNG', ML, MT + 2, 28, 14); } catch {}
  }

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...WHITE);
  pdf.text('Staff Compliance Report', logoData ? ML + 32 : ML, MT + 9);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('One Life Foundation — NDIS Human Resource Management', logoData ? ML + 32 : ML, MT + 15);

  // Metadata row
  pdf.setFillColor(240, 244, 248);
  pdf.rect(ML, MT + HEADER_H, CW, 7, 'F');
  pdf.setFontSize(7);
  pdf.setTextColor(...MED);
  pdf.text('DOC NO: Compliance Report', ML + 2, MT + HEADER_H + 4.5);
  pdf.text('GENERATED: ' + today, ML + 60, MT + HEADER_H + 4.5);
  pdf.text('CONFIDENTIAL — Internal Use Only', ML + CW - 2, MT + HEADER_H + 4.5, { align: 'right' });

  return MT + HEADER_H + 10;
}

function drawFooter() {
  pdf.setFontSize(7);
  pdf.setTextColor(...MED);
  pdf.text('One Life Foundation | Staff Compliance Report | Confidential', ML, PAGE_H - 6);
  pdf.text('Page ' + pageNum, PAGE_W - MR, PAGE_H - 6, { align: 'right' });
}

function checkPage(needed) {
  if (y + needed > BODY_BOTTOM) {
    drawFooter();
    pdf.addPage();
    pageNum++;
    y = drawHeader();
  }
}

function sectionTitle(text) {
  checkPage(10);
  pdf.setFillColor(...BLUE);
  pdf.rect(ML, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...WHITE);
  pdf.text(text, ML + 3, y + 5);
  y += 9;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Main ──

const { data: staff } = await sb.from('staff').select('id, first_name, last_name, role, status, position_type').eq('status', 'active').order('first_name');
const { data: allDocs } = await sb.from('staff_documents').select('staff_id, document_type, document_name, expiry_date, status, created_at');

// Calculate stats
const staffData = staff.map(s => {
  const docs = (allDocs || []).filter(d => d.staff_id === s.id);
  const docTypes = docs.map(d => d.document_type);
  const missing = REQUIRED.filter(r => !docTypes.includes(r));
  const uploaded = REQUIRED.filter(r => docTypes.includes(r));
  const expired = docs.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date());
  const expiring = docs.filter(d => {
    if (!d.expiry_date) return false;
    const days = Math.ceil((new Date(d.expiry_date) - Date.now()) / 86400000);
    return days > 0 && days <= 30;
  });
  return { ...s, docs, missing, uploaded, expired, expiring, total: REQUIRED.length };
});

// Separate employees (TFN) and contractors (ABN)
const employees = staffData.filter(s => s.position_type === 'Full-Time' || s.position_type === 'Casual' || s.position_type === 'Part-Time');
const contractors = staffData.filter(s => s.position_type === 'Contract');

const totalStaff = staffData.length;
const fullyCompliant = staffData.filter(s => s.missing.length === 0 && s.expired.length === 0).length;
const nonCompliant = totalStaff - fullyCompliant;
const complianceRate = totalStaff > 0 ? Math.round((fullyCompliant / totalStaff) * 100) : 0;
const totalMissing = staffData.reduce((sum, s) => sum + s.missing.length, 0);
const totalExpired = staffData.reduce((sum, s) => sum + s.expired.length, 0);

newPdf();
y = drawHeader();

// ── Executive Summary ──
sectionTitle('1. EXECUTIVE SUMMARY');

checkPage(30);
pdf.setFont('helvetica', 'normal');
pdf.setFontSize(9);
pdf.setTextColor(...DARK);
pdf.text('This report provides an overview of staff compliance with mandatory documentation requirements', ML + 2, y + 4);
pdf.text('under the NDIS Practice Standards (Module 114 — Human Resource Management).', ML + 2, y + 8);
y += 14;

// Summary boxes
const boxW = CW / 4;
const summaryItems = [
  { label: 'Total Staff', value: String(totalStaff), color: OLF_BLUE },
  { label: 'Compliant', value: String(fullyCompliant), color: GREEN },
  { label: 'Non-Compliant', value: String(nonCompliant), color: RED },
  { label: 'Compliance Rate', value: complianceRate + '%', color: complianceRate >= 80 ? GREEN : complianceRate >= 50 ? AMBER : RED },
];

checkPage(18);
summaryItems.forEach((item, i) => {
  const bx = ML + i * boxW + 1;
  pdf.setFillColor(...item.color);
  pdf.roundedRect(bx, y, boxW - 2, 14, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...WHITE);
  pdf.text(item.value, bx + (boxW - 2) / 2, y + 7.5, { align: 'center' });
  pdf.setFontSize(6.5);
  pdf.text(item.label, bx + (boxW - 2) / 2, y + 12, { align: 'center' });
});
y += 18;

// Additional stats
checkPage(12);
pdf.setFontSize(8);
pdf.setTextColor(...DARK);
pdf.setFont('helvetica', 'normal');
pdf.text('Total missing documents across all staff: ' + totalMissing, ML + 2, y + 4);
pdf.text('Total expired documents: ' + totalExpired, ML + 2, y + 8);
y += 12;

// ── Required Documents ──
sectionTitle('2. REQUIRED COMPLIANCE DOCUMENTS');
checkPage(8);
pdf.setFontSize(8);
pdf.setTextColor(...DARK);
pdf.text('The following documents are required for all staff members under NDIS Practice Standards:', ML + 2, y + 4);
y += 7;

REQUIRED.forEach((doc, i) => {
  checkPage(5);
  pdf.setFontSize(8);
  pdf.setTextColor(...DARK);
  pdf.text((i + 1) + '.  ' + doc, ML + 4, y + 3.5);
  y += 4.5;
});
y += 3;

// ── Helper: draw compliance table for a group ──
function drawComplianceTable(group) {
  checkPage(10);
  const cols = [0, 40, 70, 88, 103, 118, CW];
  pdf.setFillColor(...BLUE);
  pdf.rect(ML, y, CW, 6, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(...WHITE);
  ['Staff Member', 'Role', 'Uploaded', 'Missing', 'Expired', 'Status'].forEach((h, i) => {
    pdf.text(h, ML + cols[i] + 2, y + 4);
  });
  y += 7;

  group.forEach((s, idx) => {
    checkPage(7);
    if (idx % 2 === 0) {
      pdf.setFillColor(...LIGHT_BG);
      pdf.rect(ML, y, CW, 6, 'F');
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...DARK);
    pdf.text(s.first_name + ' ' + s.last_name, ML + cols[0] + 2, y + 4);
    pdf.text(s.role || '—', ML + cols[1] + 2, y + 4);
    pdf.text(s.uploaded.length + '/' + s.total, ML + cols[2] + 2, y + 4);

    pdf.setTextColor(...(s.missing.length > 5 ? RED : s.missing.length > 0 ? AMBER : GREEN));
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(s.missing.length), ML + cols[3] + 2, y + 4);

    pdf.setTextColor(...(s.expired.length > 0 ? RED : GREEN));
    pdf.text(String(s.expired.length), ML + cols[4] + 2, y + 4);

    const isCompliant = s.missing.length === 0 && s.expired.length === 0;
    const statusColor = isCompliant ? GREEN : s.missing.length > 5 ? RED : AMBER;
    const statusText = isCompliant ? 'COMPLIANT' : s.missing.length > 5 ? 'AT RISK' : 'PARTIAL';
    pdf.setFillColor(...statusColor);
    pdf.roundedRect(ML + cols[5] + 1, y + 0.5, 24, 5, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(...WHITE);
    pdf.text(statusText, ML + cols[5] + 13, y + 4, { align: 'center' });

    pdf.setDrawColor(226, 232, 240);
    pdf.line(ML, y + 6, ML + CW, y + 6);
    y += 7;
  });
  y += 4;
}

// ── Employees (TFN) — Compliance Matrix ──
sectionTitle('3. EMPLOYEES (TFN) — COMPLIANCE MATRIX');
checkPage(8);
pdf.setFont('helvetica', 'normal');
pdf.setFontSize(8);
pdf.setTextColor(...DARK);
pdf.text('Full-time, part-time, and casual employees on the OLF payroll.', ML + 2, y + 4);
y += 7;
drawComplianceTable(employees);

// ── Contractors (ABN) — Compliance Matrix ──
sectionTitle('4. CONTRACTORS (ABN) — COMPLIANCE MATRIX');
checkPage(8);
pdf.setFont('helvetica', 'normal');
pdf.setFontSize(8);
pdf.setTextColor(...DARK);
pdf.text('Independent contractors engaged under ABN arrangements.', ML + 2, y + 4);
y += 7;
drawComplianceTable(contractors);

// ── Individual Staff Detail — Employees ──
sectionTitle('5. EMPLOYEE COMPLIANCE DETAIL');

employees.forEach(s => {
  const name = s.first_name + ' ' + s.last_name;
  checkPage(20);

  // Staff name header
  pdf.setFillColor(240, 244, 248);
  pdf.rect(ML, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...DARK);
  pdf.text(name, ML + 3, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(...MED);
  pdf.text(s.role + ' (Employee — TFN) | ' + s.uploaded.length + '/' + s.total + ' documents', ML + CW - 3, y + 5, { align: 'right' });
  y += 9;

  REQUIRED.forEach(docType => {
    checkPage(5.5);
    const doc = s.docs.find(d => d.document_type === docType);
    const isUploaded = !!doc;
    const isExpired = doc?.expiry_date && new Date(doc.expiry_date) < new Date();

    // Status indicator
    let indicator, indColor;
    if (isExpired) { indicator = 'EXPIRED'; indColor = RED; }
    else if (isUploaded) { indicator = 'OK'; indColor = GREEN; }
    else { indicator = 'MISSING'; indColor = RED; }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...DARK);
    pdf.text(docType, ML + 5, y + 3.5);

    // Status
    pdf.setFillColor(...indColor);
    pdf.roundedRect(ML + CW - 22, y + 0.3, 18, 4.5, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(...WHITE);
    pdf.text(indicator, ML + CW - 13, y + 3.3, { align: 'center' });

    // Expiry date if exists
    if (doc?.expiry_date) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      pdf.setTextColor(...MED);
      pdf.text('Exp: ' + fmtDate(doc.expiry_date), ML + CW - 44, y + 3.5);
    }

    // Separator
    pdf.setDrawColor(240, 244, 248);
    pdf.line(ML + 3, y + 5, ML + CW - 1, y + 5);
    y += 5.5;
  });

  y += 5;
});

// ── Individual Staff Detail — Contractors ──
sectionTitle('6. CONTRACTOR COMPLIANCE DETAIL');

contractors.forEach(s => {
  const name = s.first_name + ' ' + s.last_name;
  checkPage(20);

  pdf.setFillColor(240, 244, 248);
  pdf.rect(ML, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...DARK);
  pdf.text(name, ML + 3, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(...MED);
  pdf.text(s.role + ' (Contractor — ABN) | ' + s.uploaded.length + '/' + s.total + ' documents', ML + CW - 3, y + 5, { align: 'right' });
  y += 9;

  REQUIRED.forEach(docType => {
    checkPage(5.5);
    const doc = s.docs.find(d => d.document_type === docType);
    const isUploaded = !!doc;
    const isExpired = doc?.expiry_date && new Date(doc.expiry_date) < new Date();

    let indicator, indColor;
    if (isExpired) { indicator = 'EXPIRED'; indColor = RED; }
    else if (isUploaded) { indicator = 'OK'; indColor = GREEN; }
    else { indicator = 'MISSING'; indColor = RED; }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...DARK);
    pdf.text(docType, ML + 5, y + 3.5);

    pdf.setFillColor(...indColor);
    pdf.roundedRect(ML + CW - 22, y + 0.3, 18, 4.5, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(...WHITE);
    pdf.text(indicator, ML + CW - 13, y + 3.3, { align: 'center' });

    if (doc?.expiry_date) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      pdf.setTextColor(...MED);
      pdf.text('Exp: ' + fmtDate(doc.expiry_date), ML + CW - 44, y + 3.5);
    }

    pdf.setDrawColor(240, 244, 248);
    pdf.line(ML + 3, y + 5, ML + CW - 1, y + 5);
    y += 5.5;
  });

  y += 5;
});

// ── Recommendations ──
sectionTitle('7. RECOMMENDATIONS');
checkPage(30);
pdf.setFont('helvetica', 'normal');
pdf.setFontSize(8);
pdf.setTextColor(...DARK);

const recs = [
  'Prioritise collection of NDIS Worker Screening Checks for all staff — this is a mandatory NDIS requirement.',
  'Ensure all support workers have current First Aid and CPR certificates — schedule group training if needed.',
  'Collect signed Code of Conduct acknowledgements from all staff members.',
  'Implement a 60-day advance reminder system for expiring documents.',
  'Schedule a compliance review meeting within 30 days to track progress.',
  'Upload all collected documents to One Life Vault for centralised tracking.',
];

recs.forEach((rec, i) => {
  checkPage(6);
  pdf.text((i + 1) + '.', ML + 3, y + 4);
  const lines = pdf.splitTextToSize(rec, CW - 12);
  lines.forEach((line, li) => {
    checkPage(4);
    pdf.text(line, ML + 8, y + 4 + li * 4);
  });
  y += lines.length * 4 + 2;
});

y += 4;

// ── Sign-off ──
sectionTitle('8. ACKNOWLEDGEMENT');
checkPage(25);
pdf.setFont('helvetica', 'normal');
pdf.setFontSize(8);
pdf.setTextColor(...DARK);
pdf.text('Prepared by: One Life Foundation — Quality Management System', ML + 3, y + 4);
pdf.text('Date: ' + today, ML + 3, y + 9);
y += 16;
pdf.text('Manager Signature: ___________________________    Date: _______________', ML + 3, y + 4);
y += 8;
pdf.text('Director Signature: ___________________________    Date: _______________', ML + 3, y + 4);

drawFooter();

// Save
const output = pdf.output('arraybuffer');
const buf = Buffer.from(output);
writeFileSync('C:/Users/kevin/Downloads/OLF Staff Compliance Report - June 2026.pdf', buf);
console.log('Saved to Downloads: OLF Staff Compliance Report - June 2026.pdf (' + (buf.length / 1024).toFixed(0) + 'KB)');

// Also upload to Supabase
const { error } = await sb.storage.from('documents').upload(
  'Policies and Procedures/Core 2 - Governance & Operations/OLF Staff Compliance Report - June 2026.pdf',
  buf,
  { contentType: 'application/pdf', upsert: true }
);
console.log(error ? 'Upload error: ' + error.message : 'Uploaded to Supabase');

console.log('Done!');
