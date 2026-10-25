import { jsPDF } from 'jspdf';
import { writeFileSync, unlinkSync } from 'fs';

const PAGE_W = 210, PAGE_H = 297;
const ML = 30;
const CW = PAGE_W - ML - 30;
const RATE = 45;
const outDir = 'C:/Users/kevin/OneDrive/Desktop/nathan';

const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
let y = 35;

pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.setTextColor(0, 0, 0);
pdf.text('INVOICE', PAGE_W / 2, y, { align: 'center' }); y += 20;

pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
pdf.text('Invoice From:', ML, y); y += 6;
pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
pdf.text('Prabhjot Kaur', ML, y); y += 5;
pdf.text('Worker Screening No: 16150305', ML, y); y += 5;
pdf.text('Email: Babbucheema017@gmail.com', ML, y); y += 5;
pdf.text('Phone: 0414237347', ML, y); y += 10;

pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
pdf.text('Bank Details:', ML, y); y += 6;
pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
pdf.text('Account Name: Prabhjot Kaur', ML, y); y += 5;
pdf.text('BSB: 063788', ML, y); y += 5;
pdf.text('Account Number: 10215745', ML, y); y += 10;

pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
pdf.text('Invoice To:', ML, y); y += 6;
pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
pdf.text('One Life Foundation Pty Ltd', ML, y); y += 5;
pdf.text('Email: support@olfndisservices.com.au', ML, y); y += 10;

pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
pdf.text('Participant:', ML, y); y += 6;
pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
pdf.text('Nathan Gottaas', ML, y); y += 5;
pdf.text('NDIS No: 430323224', ML, y); y += 14;

// Table
const tableX = ML + 15;
const colDate = tableX, colShift = tableX + 30, colAmount = tableX + 100;
const tableW = 130, rowH = 7;

pdf.setFillColor(180, 180, 180);
pdf.rect(colDate, y, tableW, rowH, 'F');
pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.3);
pdf.rect(colDate, y, 30, rowH, 'S');
pdf.rect(colShift, y, 70, rowH, 'S');
pdf.rect(colAmount, y, 30, rowH, 'S');
pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
pdf.text('Date', colDate + 2, y + 5);
pdf.text('Shift Time', colShift + 2, y + 5);
pdf.text('Amount ($)', colAmount + 2, y + 5);
y += rowH;

const shifts = [
  { date: '23.03', shift: '10:00 AM \u2013 1:00 PM',  hrs: 3 },
  { date: '24.03', shift: '10:00 AM \u2013 1:00 PM',  hrs: 3 },
  { date: '25.03', shift: '10:00 AM \u2013 1:00 PM',  hrs: 3 },
  { date: '26.03', shift: '10:00 AM \u2013 1:00 PM',  hrs: 3 },
  { date: '27.03', shift: '10:00 AM \u2013 12:00 PM', hrs: 2 },
  { date: '31.03', shift: '8:00 AM \u2013 4:00 PM',   hrs: 8 },
];

let total = 0;
pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
for (const s of shifts) {
  const amt = s.hrs * RATE;
  total += amt;
  pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.3);
  pdf.rect(colDate, y, 30, rowH, 'S');
  pdf.rect(colShift, y, 70, rowH, 'S');
  pdf.rect(colAmount, y, 30, rowH, 'S');
  pdf.text(s.date, colDate + 2, y + 5);
  pdf.text(s.shift, colShift + 2, y + 5);
  pdf.text(amt.toFixed(2), colAmount + 2, y + 5);
  y += rowH;
}

y += 12;
pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
pdf.text(`Total Amount Payable: $${total.toFixed(2)}`, ML, y); y += 10;
pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
pdf.text('Payment Terms: 7 days', ML, y);

// Save
try { unlinkSync(`${outDir}/NDISInvoice_Prabhjot_Kaur_Nathan_Mar23-31.pdf`); } catch {}
writeFileSync(`${outDir}/NDISInvoice_Prabhjot_Kaur_Nathan_Mar23-31.pdf`, Buffer.from(pdf.output('arraybuffer')));
console.log('Saved: NDISInvoice_Prabhjot_Kaur_Nathan_Mar23-31.pdf');
console.log(`Rate: $${RATE}/hr (weekday) — matches previous submission`);
console.log(`Total: $${total.toFixed(2)} (22 hrs)`);
