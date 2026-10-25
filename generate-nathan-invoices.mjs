import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

const PAGE_W = 210, PAGE_H = 297;
const ML = 20, MR = 20;
const CW = PAGE_W - ML - MR;

const PARTICIPANT = { name: 'Nathan Gottaas', ndis: '430323224', address: '30 Curtin Avenue, Lalor VIC 3042' };

function labelValue(pdf, label, value, x, y) {
  pdf.setFont('helvetica', 'bold');
  pdf.text(label, x, y);
  const w = pdf.getTextWidth(label);
  pdf.setFont('helvetica', 'normal');
  pdf.text(value, x + w + 1, y);
}

function getRate(staff, shift) {
  if (shift.isSleep) return staff.sleepover;
  if (shift.rateName === 'saturday') return staff.saturday;
  if (shift.rateName === 'sunday') return staff.sunday;
  return staff.weekday;
}

function generateInvoice(staff, invoiceNum, invoiceDate, paymentDue, servicePeriod) {
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
  for (const shift of staff.shifts) {
    if (y > 262) { pdf.addPage(); y = 20; }
    const rate = getRate(staff, shift);
    const total = shift.isSleep ? rate : shift.hours * rate;
    grandTotal += total;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0);
    pdf.text(shift.day, colPos[0] + 2, y + 4);
    pdf.text(shift.date, colPos[1] + 2, y + 4);
    pdf.text(shift.type, colPos[2] + 2, y + 4);
    pdf.text(shift.start, colPos[3] + 2, y + 4);
    pdf.text(shift.end, colPos[4] + 2, y + 4);
    pdf.text(shift.isSleep ? '1' : String(shift.hours), colPos[5] + 2, y + 4);
    pdf.text(String(rate), colPos[6] + 2, y + 4);
    pdf.text(total.toFixed(2), colPos[7] + 2, y + 4);
    pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.15);
    pdf.line(ML, y + 6, ML + CW, y + 6);
    y += 7;
  }
  y += 6;

  // Payment Summary
  if (y > 235) { pdf.addPage(); y = 20; }
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Payment Summary', ML, y); y += 10;
  pdf.setFontSize(10);

  let wkH = 0, satH = 0, sunH = 0, slpC = 0;
  for (const s of staff.shifts) {
    if (s.isSleep) { slpC++; continue; }
    if (s.rateName === 'saturday') satH += s.hours;
    else if (s.rateName === 'sunday') sunH += s.hours;
    else wkH += s.hours;
  }

  pdf.setFont('helvetica', 'normal');
  const rX = PAGE_W - MR;
  if (wkH > 0) { pdf.text(`Weekday Hours: ${wkH} hrs x $${staff.weekday}/hr`, ML, y); pdf.text(`$${(wkH * staff.weekday).toFixed(2)}`, rX, y, { align: 'right' }); y += 6; }
  if (satH > 0) { pdf.text(`Saturday Hours: ${satH} hrs x $${staff.saturday}/hr`, ML, y); pdf.text(`$${(satH * staff.saturday).toFixed(2)}`, rX, y, { align: 'right' }); y += 6; }
  if (sunH > 0) { pdf.text(`Sunday Hours: ${sunH} hrs x $${staff.sunday}/hr`, ML, y); pdf.text(`$${(sunH * staff.sunday).toFixed(2)}`, rX, y, { align: 'right' }); y += 6; }
  if (slpC > 0) { pdf.text(`Sleepovers: ${slpC} x $${staff.sleepover}`, ML, y); pdf.text(`$${(slpC * staff.sleepover).toFixed(2)}`, rX, y, { align: 'right' }); y += 6; }

  y += 2;
  pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.5);
  pdf.line(ML, y, PAGE_W - MR, y); y += 7;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
  pdf.text('TOTAL:', ML, y);
  pdf.text(`$${grandTotal.toFixed(2)}`, rX, y, { align: 'right' }); y += 14;

  // Bank Details
  if (y > 260) { pdf.addPage(); y = 20; }
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Bank Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Account Name: ', staffName, ML, y); y += 6;
  labelValue(pdf, 'BSB: ', staff.bsb, ML, y); y += 6;
  labelValue(pdf, 'Account Number: ', staff.bank_account, ML, y); y += 10;

  // Footer
  if (y > 275) { pdf.addPage(); y = 20; }
  pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2);
  pdf.line(ML, y, PAGE_W - MR, y); y += 5;
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7.5); pdf.setTextColor(130, 130, 130);
  pdf.text('This invoice was generated through the One Life Foundation NDIS Contractor Portal (onelifefoundationndis.app)', PAGE_W / 2, y, { align: 'center' });

  return { pdf, staffName, total: grandTotal };
}

// ─── Staff Data ─────────────────────────────────────────────────────────────

const sukhsimran = {
  first_name: 'Sukhsimran', last_name: 'Kaur Manhani',
  abn: '34 972 209 526', phone: '0479100014', email: 'sukhsimran4646@gmail.com',
  bsb: '063000', bank_account: '14372109',
  weekday: 44, saturday: 54, sunday: 64, sleepover: 160,
  shifts: [
    { day: 'Monday', date: '29/12', type: 'At home care', start: '6:00AM', end: '10:00PM', hours: 16, isSleep: false },
    { day: 'Wednesday', date: '31/12', type: 'At home care', start: '6:00AM', end: '10:00PM', hours: 16, isSleep: false },
    { day: 'Thursday', date: '01/01', type: 'At home care', start: '6:00AM', end: '10:00PM', hours: 16, isSleep: false },
    { day: 'Saturday', date: '03/01', type: 'At home care', start: '8:00AM', end: '6:00PM', hours: 10, isSleep: false, rateName: 'saturday' },
  ],
};

const eknoor = {
  first_name: 'Eknoor', last_name: 'Sawhney',
  abn: null, phone: '', email: '',
  bsb: '067872', bank_account: '12159322',
  weekday: 44, saturday: 54, sunday: 64, sleepover: 160,
  shifts: [
    { day: 'Tuesday', date: '30/12', type: 'At home care', start: '6:00AM', end: '10:00PM', hours: 16, isSleep: false },
    { day: 'Friday', date: '02/01', type: 'At home care', start: '8:00AM', end: '4:30PM', hours: 8.5, isSleep: false },
    { day: 'Sunday', date: '04/01', type: 'At home care', start: '8:00AM', end: '6:00PM', hours: 10, isSleep: false, rateName: 'sunday' },
  ],
};

// ─── Generate ───────────────────────────────────────────────────────────────
const outDir = 'C:/Users/kevin/Downloads';

const r1 = generateInvoice(sukhsimran, '003', '05/01/2026', '12/01/2026', '29 December 2025 \u2013 4 January 2026');
writeFileSync(`${outDir}/Payslip_Sukhsimran_Kaur_Nathan_Dec29-Jan4.pdf`, Buffer.from(r1.pdf.output('arraybuffer')));
console.log(`${r1.staffName.padEnd(25)} | $${r1.total.toFixed(2).padStart(10)} | Payslip_Sukhsimran_Kaur_Nathan_Dec29-Jan4.pdf`);

const r2 = generateInvoice(eknoor, '003', '05/01/2026', '12/01/2026', '29 December 2025 \u2013 4 January 2026');
writeFileSync(`${outDir}/Payslip_Eknoor_Sawhney_Nathan_Dec29-Jan4.pdf`, Buffer.from(r2.pdf.output('arraybuffer')));
console.log(`${r2.staffName.padEnd(25)} | $${r2.total.toFixed(2).padStart(10)} | Payslip_Eknoor_Sawhney_Nathan_Dec29-Jan4.pdf`);

console.log(`\nGrand Total: $${(r1.total + r2.total).toFixed(2)}`);
