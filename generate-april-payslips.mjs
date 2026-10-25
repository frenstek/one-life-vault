import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

const PAGE_W = 210, PAGE_H = 297;
const ML = 20, MR = 20;
const CW = PAGE_W - ML - MR;

const SERVICE_PERIOD = '6 April \u2013 12 April 2026';
const INVOICE_DATE = '14/04/2026';
const PAYMENT_DUE = '21/04/2026';

const staffList = [
  {
    first_name: 'Vishali', last_name: 'Gill',
    abn: '57 741 014 908', phone: '0413451807', email: 'vishaligill85409@gmail.com',
    bsb: '733161', bank_account: '614665',
    weekday: 42, saturday: 50, sunday: 55, sleepover: 160,
    invoice_number: '002',
    shifts: [
      { day: 'Monday', date: '06/04', type: 'Sleepover', start: '10:00PM', end: '6:00AM', hours: 1, isSleep: true },
      { day: 'Tuesday', date: '07/04', type: 'At home care', start: '6:00AM', end: '12:00PM', hours: 6, isSleep: false },
      { day: '', date: '07/04', type: 'Sleepover', start: '10:00PM', end: '6:00AM', hours: 1, isSleep: true },
      { day: 'Thursday', date: '09/04', type: 'At home care', start: '4:00PM', end: '10:00PM', hours: 6, isSleep: false },
      { day: '', date: '09/04', type: 'Sleepover', start: '10:00PM', end: '6:00AM', hours: 1, isSleep: true },
      { day: 'Friday', date: '10/04', type: 'At home care', start: '6:00AM', end: '7:30AM', hours: 1.5, isSleep: false },
      { day: 'Saturday', date: '11/04', type: 'At home care', start: '6:00AM', end: '12:00PM', hours: 6, isSleep: false, rateName: 'saturday' },
      { day: 'Sunday', date: '12/04', type: 'At home care', start: '9:00AM', end: '12:00PM', hours: 3, isSleep: false, rateName: 'sunday' },
    ],
  },
  {
    first_name: 'Avneet', last_name: 'Kaur',
    abn: '78 641 104 046', phone: '0457414007', email: 'avneetdeol80582@gmail.com',
    bsb: '063241', bank_account: '11013817',
    weekday: 42, saturday: 50, sunday: 55, sleepover: 160,
    invoice_number: '003',
    shifts: [
      { day: 'Monday', date: '06/04', type: 'At home care', start: '4:00PM', end: '10:00PM', hours: 6, isSleep: false },
      { day: 'Wednesday', date: '08/04', type: 'At home care', start: '4:00PM', end: '10:00PM', hours: 6, isSleep: false },
      { day: '', date: '08/04', type: 'Sleepover', start: '10:00PM', end: '6:00AM', hours: 1, isSleep: true },
      { day: 'Friday', date: '10/04', type: 'At home care', start: '4:00PM', end: '10:00PM', hours: 6, isSleep: false },
      { day: '', date: '10/04', type: 'Sleepover', start: '10:00PM', end: '6:00AM', hours: 1, isSleep: true },
      { day: 'Saturday', date: '11/04', type: 'At home care', start: '8:00PM', end: '10:00PM', hours: 2, isSleep: false, rateName: 'saturday' },
      { day: '', date: '11/04', type: 'Sleepover', start: '10:00PM', end: '6:00AM', hours: 1, isSleep: true },
      { day: 'Sunday', date: '12/04', type: 'At home care', start: '6:00AM', end: '9:00AM', hours: 3, isSleep: false, rateName: 'sunday' },
      { day: '', date: '12/04', type: 'At home care', start: '8:00PM', end: '10:00PM', hours: 2, isSleep: false, rateName: 'sunday' },
      { day: '', date: '12/04', type: 'Sleepover', start: '10:00PM', end: '6:00AM', hours: 1, isSleep: true },
    ],
  },
  {
    first_name: 'Gurpreet', last_name: 'Kaur',
    abn: '58 216 593 022', phone: '0422858159', email: 'preet.auss@gmail.com',
    bsb: '014111', bank_account: '661872121',
    weekday: 44, saturday: 54, sunday: 64, sleepover: 160,
    invoice_number: '002',
    shifts: [
      { day: 'Tuesday', date: '07/04', type: 'At home care', start: '4:00PM', end: '10:00PM', hours: 6, isSleep: false },
      { day: 'Wednesday', date: '08/04', type: 'At home care', start: '6:00AM', end: '12:00PM', hours: 6, isSleep: false },
      { day: 'Friday', date: '10/04', type: 'At home care', start: '7:30AM', end: '12:00PM', hours: 4.5, isSleep: false },
    ],
  },
  {
    first_name: 'Pawandeep', last_name: 'Kaur',
    abn: '12 416 688 198', phone: '', email: 'deep09014@gmail.com',
    bsb: '083520', bank_account: '249042329',
    weekday: 42, saturday: 50, sunday: 55, sleepover: 160,
    invoice_number: '002',
    shifts: [
      { day: 'Monday', date: '06/04', type: 'At home care', start: '6:00AM', end: '12:00PM', hours: 6, isSleep: false },
    ],
  },
  {
    first_name: 'Prabhjot', last_name: 'Kaur',
    abn: null, phone: '0414237347', email: 'babbucheema017@gmail.com',
    bsb: '063788', bank_account: '10215745',
    weekday: 42, saturday: 50, sunday: 55, sleepover: 160,
    invoice_number: '001',
    shifts: [
      { day: 'Saturday', date: '11/04', type: 'At home care', start: '4:00PM', end: '8:00PM', hours: 4, isSleep: false, rateName: 'saturday' },
      { day: 'Sunday', date: '12/04', type: 'At home care', start: '4:00PM', end: '8:00PM', hours: 4, isSleep: false, rateName: 'sunday' },
    ],
  },
];

function getRate(staff, shift) {
  if (shift.isSleep) return staff.sleepover;
  if (shift.rateName === 'saturday') return staff.saturday;
  if (shift.rateName === 'sunday') return staff.sunday;
  return staff.weekday;
}

// Helper: draw bold label + normal value with proper spacing
function labelValue(pdf, label, value, x, y) {
  pdf.setFont('helvetica', 'bold');
  pdf.text(label, x, y);
  const labelW = pdf.getTextWidth(label);
  pdf.setFont('helvetica', 'normal');
  pdf.text(value, x + labelW + 1, y);
}

function generateInvoice(staff) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const staffName = `${staff.first_name} ${staff.last_name}`;
  let y = 22;

  // ── Title ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(0, 0, 0);
  pdf.text('SUPPORT WORKER INVOICE (7 DAY SHEET)', PAGE_W / 2, y, { align: 'center' });
  y += 3;
  pdf.setDrawColor(0, 50, 160);
  pdf.setLineWidth(0.7);
  pdf.line(ML, y, PAGE_W - MR, y);
  y += 14;

  // ── Support Worker Details ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Support Worker Details', ML, y);
  y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Name: ', staffName, ML, y); y += 6;
  if (staff.abn) { labelValue(pdf, 'ABN: ', staff.abn, ML, y); y += 6; }
  if (staff.phone) { labelValue(pdf, 'Phone: ', staff.phone, ML, y); y += 6; }
  labelValue(pdf, 'Email: ', staff.email, ML, y); y += 14;

  // ── Invoice To ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Invoice To', ML, y); y += 9;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('One Life Foundation Pty Ltd (OLF)', ML + 2, y); y += 14;

  // ── Invoice Details ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Invoice Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Invoice Number: ', staff.invoice_number, ML, y); y += 6;
  labelValue(pdf, 'Invoice Date: ', INVOICE_DATE, ML, y);
  labelValue(pdf, 'Payment Due: ', PAYMENT_DUE, ML + 80, y);
  y += 14;

  // ── Participant Details ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Participant Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Participant Name: ', 'Nicole Elizabeth Knight', ML, y); y += 6;
  labelValue(pdf, 'NDIS Number: ', '431301939', ML, y); y += 6;
  labelValue(pdf, 'Service Address: ', '59 Severn Street, Epping VIC 3076', ML, y); y += 12;

  // ── Service Period bar ──
  pdf.setFillColor(0, 0, 0);
  pdf.rect(ML, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Service Period: ${SERVICE_PERIOD}`, ML + 3, y + 5);
  pdf.setTextColor(0, 0, 0);
  y += 9;

  // ── Table Header ──
  const tX = ML;
  const colWidths = [24, 14, 28, 22, 22, 16, 20, CW - 146];
  const colPos = [];
  let cx = tX;
  for (const w of colWidths) { colPos.push(cx); cx += w; }
  const headers = ['Day', 'Date', 'Service Type', 'Start', 'End', 'Hours', 'Rate ($)', 'Total ($)'];

  pdf.setFillColor(220, 220, 220);
  pdf.rect(tX, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  headers.forEach((h, i) => pdf.text(h, colPos[i] + 2, y + 5));
  y += 8;

  // ── Shift Rows ──
  let grandTotal = 0;

  for (const shift of staff.shifts) {
    if (y > 262) { pdf.addPage(); y = 20; }

    const rate = getRate(staff, shift);
    const total = shift.isSleep ? rate : shift.hours * rate;
    grandTotal += total;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text(shift.day, colPos[0] + 2, y + 4);
    pdf.text(shift.date, colPos[1] + 2, y + 4);
    pdf.text(shift.type, colPos[2] + 2, y + 4);
    pdf.text(shift.start, colPos[3] + 2, y + 4);
    pdf.text(shift.end, colPos[4] + 2, y + 4);
    pdf.text(shift.isSleep ? '1' : String(shift.hours), colPos[5] + 2, y + 4);
    pdf.text(String(rate), colPos[6] + 2, y + 4);
    pdf.text(total.toFixed(2), colPos[7] + 2, y + 4);

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.15);
    pdf.line(tX, y + 6, tX + CW, y + 6);
    y += 7;
  }
  y += 6;

  // ── Payment Summary ──
  if (y > 235) { pdf.addPage(); y = 20; }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Payment Summary', ML, y); y += 10;

  let weekdayHrs = 0, satHrs = 0, sunHrs = 0, sleepCount = 0;
  for (const s of staff.shifts) {
    if (s.isSleep) { sleepCount++; continue; }
    if (s.rateName === 'saturday') satHrs += s.hours;
    else if (s.rateName === 'sunday') sunHrs += s.hours;
    else weekdayHrs += s.hours;
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const rightX = PAGE_W - MR;

  if (weekdayHrs > 0) {
    pdf.text(`Weekday Hours: ${weekdayHrs} hrs x $${staff.weekday}/hr`, ML, y);
    pdf.text(`$${(weekdayHrs * staff.weekday).toFixed(2)}`, rightX, y, { align: 'right' }); y += 6;
  }
  if (satHrs > 0) {
    pdf.text(`Saturday Hours: ${satHrs} hrs x $${staff.saturday}/hr`, ML, y);
    pdf.text(`$${(satHrs * staff.saturday).toFixed(2)}`, rightX, y, { align: 'right' }); y += 6;
  }
  if (sunHrs > 0) {
    pdf.text(`Sunday Hours: ${sunHrs} hrs x $${staff.sunday}/hr`, ML, y);
    pdf.text(`$${(sunHrs * staff.sunday).toFixed(2)}`, rightX, y, { align: 'right' }); y += 6;
  }
  if (sleepCount > 0) {
    pdf.text(`Sleepovers: ${sleepCount} x $${staff.sleepover}`, ML, y);
    pdf.text(`$${(sleepCount * staff.sleepover).toFixed(2)}`, rightX, y, { align: 'right' }); y += 6;
  }

  y += 2;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(ML, y, PAGE_W - MR, y);
  y += 7;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL:', ML, y);
  pdf.text(`$${grandTotal.toFixed(2)}`, rightX, y, { align: 'right' });
  y += 14;

  // ── Bank Details ──
  if (y > 260) { pdf.addPage(); y = 20; }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Bank Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Account Name: ', staffName, ML, y); y += 6;
  labelValue(pdf, 'BSB: ', staff.bsb, ML, y); y += 6;
  labelValue(pdf, 'Account Number: ', staff.bank_account, ML, y);

  // ── Footer note ──
  y += 10;
  if (y > 275) { pdf.addPage(); y = 20; }
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.2);
  pdf.line(ML, y, PAGE_W - MR, y);
  y += 5;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text('This invoice was generated through the One Life Foundation NDIS Contractor Portal (onelifefoundationndis.app)', PAGE_W / 2, y, { align: 'center' });

  return { pdf, staffName, total: grandTotal };
}

// ─── Generate all ───────────────────────────────────────────────────────────
const outDir = 'C:/Users/kevin/Downloads';
let grand = 0;

for (const staff of staffList) {
  const { pdf, staffName, total } = generateInvoice(staff);
  grand += total;
  const fn = `Payslip_${staff.first_name}_${staff.last_name}_Nicole_FN1_1-14_April.pdf`;
  writeFileSync(`${outDir}/${fn}`, Buffer.from(pdf.output('arraybuffer')));
  console.log(`${staffName.padEnd(20)} | $${total.toFixed(2).padStart(10)} | ${fn}`);
}

console.log(`\nGrand Total: $${grand.toFixed(2)}`);
