import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

const PAGE_W = 210, PAGE_H = 297;
const ML = 20, MR = 20;
const CW = PAGE_W - ML - MR;
const PW = 297, PH = 210; // landscape

const PARTICIPANT = { name: 'Nathan Gottaas', ndis: '430323224', address: '30 Curtin Avenue, Lalor VIC 3042' };

const PRABHJOT = {
  first_name: 'Prabhjot', last_name: 'Kaur',
  abn: null, phone: '0414237347', email: 'babbucheema017@gmail.com',
  bsb: '063788', bank_account: '10215745',
  weekday: 42, saturday: 50, sunday: 55, sleepover: 160,
};

// ─── Invoice Generator ──────────────────────────────────────────────────────

function labelValue(pdf, label, value, x, y) {
  pdf.setFont('helvetica', 'bold');
  pdf.text(label, x, y);
  const w = pdf.getTextWidth(label);
  pdf.setFont('helvetica', 'normal');
  pdf.text(value || '', x + w + 1, y);
}

function generateInvoice(staff, invoiceNum, invoiceDate, paymentDue, servicePeriod, shifts) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const staffName = `${staff.first_name} ${staff.last_name}`;
  let y = 22;

  // Title
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.setTextColor(0, 0, 0);
  pdf.text('SUPPORT WORKER INVOICE (7 DAY SHEET)', PAGE_W / 2, y, { align: 'center' });
  y += 3;
  pdf.setDrawColor(0, 50, 160); pdf.setLineWidth(0.7);
  pdf.line(ML, y, PAGE_W - MR, y);
  y += 14;

  // Support Worker Details
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Support Worker Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Name: ', staffName, ML, y); y += 6;
  if (staff.abn) { labelValue(pdf, 'ABN: ', staff.abn, ML, y); y += 6; }
  if (staff.phone) { labelValue(pdf, 'Phone: ', staff.phone, ML, y); y += 6; }
  labelValue(pdf, 'Email: ', staff.email, ML, y); y += 14;

  // Invoice To
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Invoice To', ML, y); y += 9;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text('One Life Foundation Pty Ltd (OLF)', ML + 2, y); y += 14;

  // Invoice Details
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Invoice Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Invoice Number: ', invoiceNum, ML, y); y += 6;
  labelValue(pdf, 'Invoice Date: ', invoiceDate, ML, y);
  labelValue(pdf, 'Payment Due: ', paymentDue, ML + 80, y); y += 14;

  // Participant Details
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Participant Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Participant Name: ', PARTICIPANT.name, ML, y); y += 6;
  labelValue(pdf, 'NDIS Number: ', PARTICIPANT.ndis, ML, y); y += 6;
  labelValue(pdf, 'Service Address: ', PARTICIPANT.address, ML, y); y += 12;

  // Service Period bar
  pdf.setFillColor(0, 0, 0);
  pdf.rect(ML, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(255, 255, 255);
  pdf.text(`Service Period: ${servicePeriod}`, ML + 3, y + 5);
  pdf.setTextColor(0, 0, 0);
  y += 9;

  // Table Header
  const colWidths = [24, 14, 28, 22, 22, 16, 20, CW - 146];
  const colPos = []; let cx = ML;
  for (const w of colWidths) { colPos.push(cx); cx += w; }
  const headers = ['Day', 'Date', 'Service Type', 'Start', 'End', 'Hours', 'Rate ($)', 'Total ($)'];

  pdf.setFillColor(220, 220, 220);
  pdf.rect(ML, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0);
  headers.forEach((h, i) => pdf.text(h, colPos[i] + 2, y + 5));
  y += 8;

  // Shift Rows
  let grandTotal = 0;
  for (const shift of shifts) {
    if (y > 262) { pdf.addPage(); y = 20; }
    const rate = shift.rateName === 'saturday' ? staff.saturday : shift.rateName === 'sunday' ? staff.sunday : staff.weekday;
    const total = shift.hours * rate;
    grandTotal += total;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0);
    pdf.text(shift.day, colPos[0] + 2, y + 4);
    pdf.text(shift.date, colPos[1] + 2, y + 4);
    pdf.text(shift.type, colPos[2] + 2, y + 4);
    pdf.text(shift.start, colPos[3] + 2, y + 4);
    pdf.text(shift.end, colPos[4] + 2, y + 4);
    pdf.text(String(shift.hours), colPos[5] + 2, y + 4);
    pdf.text(String(rate), colPos[6] + 2, y + 4);
    pdf.text(total.toFixed(2), colPos[7] + 2, y + 4);
    pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.15);
    pdf.line(ML, y + 6, ML + CW, y + 6);
    y += 7;
  }
  y += 6;

  // Payment Summary
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Payment Summary', ML, y); y += 10;
  pdf.setFontSize(10);

  let wkH = 0;
  for (const s of shifts) wkH += s.hours;

  pdf.setFont('helvetica', 'normal');
  const rX = PAGE_W - MR;
  pdf.text(`Weekday Hours: ${wkH} hrs x $${staff.weekday}/hr`, ML, y);
  pdf.text(`$${(wkH * staff.weekday).toFixed(2)}`, rX, y, { align: 'right' }); y += 6;

  y += 2;
  pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.5);
  pdf.line(ML, y, PAGE_W - MR, y); y += 7;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
  pdf.text('TOTAL:', ML, y);
  pdf.text(`$${grandTotal.toFixed(2)}`, rX, y, { align: 'right' }); y += 14;

  // Bank Details
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Bank Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Account Name: ', staffName, ML, y); y += 6;
  labelValue(pdf, 'BSB: ', staff.bsb, ML, y); y += 6;
  labelValue(pdf, 'Account Number: ', staff.bank_account, ML, y); y += 10;

  // Footer
  pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2);
  pdf.line(ML, y, PAGE_W - MR, y); y += 5;
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7.5); pdf.setTextColor(130, 130, 130);
  pdf.text('This invoice was generated through the One Life Foundation NDIS Contractor Portal (onelifefoundationndis.app)', PAGE_W / 2, y, { align: 'center' });

  return { pdf, total: grandTotal };
}

// ─── Roster Generator ────────────────────────────────────────────────────────

const NAVY = [26, 42, 58];
const WHITE = [255, 255, 255];
const DARK = [30, 41, 59];
const MED = [100, 116, 139];
const BORDER = [226, 232, 240];
const AMBER = [245, 158, 11];
const RML = 12, RMR = 12, RMT = 8;
const RCW = PW - RML - RMR;

function generateRoster(shifts1, shifts2) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = RMT + 6;

  // Title
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(26, 42, 58);
  pdf.text('Roster Schedule ', RML, y + 8);
  pdf.setTextColor(...AMBER);
  pdf.text('March 2026', RML + pdf.getTextWidth('Roster Schedule '), y + 8);

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MED);
  pdf.text('Nathan Gottaas  |  NDIS: 430323224  |  23 March \u2013 27 March 2026', RML, y + 14);

  const rX = PW - RMR;
  pdf.setFontSize(8); pdf.setTextColor(...MED);
  pdf.text('One Life Foundation Pty Ltd', rX, y, { align: 'right' });
  pdf.text('1300 ONE LIFE', rX, y + 5, { align: 'right' });

  y += 22;

  // Week header
  pdf.setFillColor(...NAVY);
  pdf.roundedRect(RML, y, RCW, 8, 1, 1, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...WHITE);
  pdf.text('Weekly Participant Schedule', RML + 4, y + 5.5);
  pdf.text('23 \u2013 27 March 2026', rX - 4, y + 5.5, { align: 'right' });
  y += 10;

  // Table header
  const cols = [RML, RML + 18, RML + 34, RML + 92, RML + 150, RML + 230];
  const colW = [18, 16, 58, 58, 80, 43];
  const hdrs = ['Date', 'Day', 'Staff', 'Shift Times', 'Service Type', 'Notes'];

  pdf.setFillColor(...NAVY);
  for (let i = 0; i < cols.length; i++) pdf.rect(cols[i], y, colW[i], 10, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(...WHITE);
  hdrs.forEach((h, i) => pdf.text(h, cols[i] + 2, y + 6.5));
  y += 10;

  // Rows
  function drawRosterRow(yy, data) {
    pdf.setFillColor(...WHITE);
    for (let i = 0; i < cols.length; i++) {
      pdf.rect(cols[i], yy, colW[i], 12, 'FD');
      pdf.setDrawColor(...BORDER); pdf.setLineWidth(0.2);
      pdf.rect(cols[i], yy, colW[i], 12, 'S');
    }
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...DARK);
    pdf.text(data.date, cols[0] + 2, yy + 7);
    pdf.text(data.day, cols[1] + 2, yy + 7);
    pdf.text(data.staff, cols[2] + 2, yy + 7);
    pdf.text(data.times, cols[3] + 2, yy + 7);
    pdf.text(data.type, cols[4] + 2, yy + 7);
    pdf.setFont('helvetica', 'italic'); pdf.setFontSize(6); pdf.setTextColor(...MED);
    pdf.text(data.notes || '', cols[5] + 2, yy + 7);
    return yy + 12;
  }

  for (const s of shifts1) y = drawRosterRow(y, s);

  y += 15;

  // Page 2 header for 30-31 March
  if (y > 150) { pdf.addPage(); y = RMT + 6; }

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(26, 42, 58);
  pdf.text('Roster Schedule ', RML, y + 8);
  pdf.setTextColor(...AMBER);
  pdf.text('March 2026', RML + pdf.getTextWidth('Roster Schedule '), y + 8);

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MED);
  pdf.text('Nathan Gottaas  |  NDIS: 430323224  |  30 March \u2013 31 March 2026', RML, y + 14);

  pdf.setFontSize(8); pdf.setTextColor(...MED);
  pdf.text('One Life Foundation Pty Ltd', rX, y, { align: 'right' });
  pdf.text('1300 ONE LIFE', rX, y + 5, { align: 'right' });

  y += 22;

  // Week header
  pdf.setFillColor(...NAVY);
  pdf.roundedRect(RML, y, RCW, 8, 1, 1, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...WHITE);
  pdf.text('Weekly Participant Schedule', RML + 4, y + 5.5);
  pdf.text('30 \u2013 31 March 2026', rX - 4, y + 5.5, { align: 'right' });
  y += 10;

  // Table header again
  pdf.setFillColor(...NAVY);
  for (let i = 0; i < cols.length; i++) pdf.rect(cols[i], y, colW[i], 10, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(...WHITE);
  hdrs.forEach((h, i) => pdf.text(h, cols[i] + 2, y + 6.5));
  y += 10;

  for (const s of shifts2) y = drawRosterRow(y, s);

  // Footer
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(...MED);
  pdf.text('Roster Schedule \u2014 Nathan Gottaas \u2014 Prabhjot Kaur \u2014 March 2026 | One Life Foundation Pty Ltd', PW / 2, PH - 6, { align: 'center' });

  return pdf;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE ALL DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const outDir = 'C:/Users/kevin/OneDrive/Desktop/nathan';

// ─── Period 1: 23/03 - 27/03 (14 hrs = 4+4+6) ─────────────────────────────
const shifts_p1 = [
  { day: 'Monday',    date: '23/03', type: 'At home care', start: '9:00AM',  end: '1:00PM',  hours: 4 },
  { day: 'Wednesday', date: '25/03', type: 'At home care', start: '9:00AM',  end: '1:00PM',  hours: 4 },
  { day: 'Friday',    date: '27/03', type: 'At home care', start: '8:00AM',  end: '2:00PM',  hours: 6 },
];

// ─── Period 2: 30/03 - 31/03 (14 hrs = 4+4+6) ─────────────────────────────
const shifts_p2 = [
  { day: 'Monday',  date: '30/03', type: 'At home care', start: '8:00AM',  end: '12:00PM', hours: 4 },
  { day: 'Monday',  date: '30/03', type: 'At home care', start: '12:00PM', end: '4:00PM',  hours: 4 },
  { day: 'Tuesday', date: '31/03', type: 'At home care', start: '8:00AM',  end: '2:00PM',  hours: 6 },
];

// Invoice 1: 23/03 - 27/03
const inv1 = generateInvoice(PRABHJOT, 'PK-001', '28/03/2026', '04/04/2026', '23 March \u2013 27 March 2026', shifts_p1);
writeFileSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar23-27.pdf`, Buffer.from(inv1.pdf.output('arraybuffer')));
console.log(`Invoice 1 (23-27 Mar): $${inv1.total.toFixed(2)}`);

// Invoice 2: 30/03 - 31/03
const inv2 = generateInvoice(PRABHJOT, 'PK-002', '01/04/2026', '08/04/2026', '30 March \u2013 31 March 2026', shifts_p2);
writeFileSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar30-31.pdf`, Buffer.from(inv2.pdf.output('arraybuffer')));
console.log(`Invoice 2 (30-31 Mar): $${inv2.total.toFixed(2)}`);

// Roster
const rosterShifts1 = [
  { date: '23/03', day: 'Mon', staff: 'Prabhjot Kaur', times: '9:00AM \u2013 1:00PM', type: 'At home care (4 hrs)', notes: 'Complete' },
  { date: '25/03', day: 'Wed', staff: 'Prabhjot Kaur', times: '9:00AM \u2013 1:00PM', type: 'At home care (4 hrs)', notes: 'Complete' },
  { date: '27/03', day: 'Fri', staff: 'Prabhjot Kaur', times: '8:00AM \u2013 2:00PM', type: 'At home care (6 hrs)', notes: 'Complete' },
];

const rosterShifts2 = [
  { date: '30/03', day: 'Mon', staff: 'Prabhjot Kaur', times: '8:00AM \u2013 4:00PM', type: 'At home care (8 hrs)', notes: 'Complete' },
  { date: '31/03', day: 'Tue', staff: 'Prabhjot Kaur', times: '8:00AM \u2013 2:00PM', type: 'At home care (6 hrs)', notes: 'Complete' },
];

const rosterPdf = generateRoster(rosterShifts1, rosterShifts2);
writeFileSync(`${outDir}/Roster_Nathan_Gottaas_Prabhjot_Mar23-31.pdf`, Buffer.from(rosterPdf.output('arraybuffer')));
console.log('Roster saved');

console.log(`\nTotal both periods: $${(inv1.total + inv2.total).toFixed(2)} (${14+14} hrs @ $42/hr)`);
