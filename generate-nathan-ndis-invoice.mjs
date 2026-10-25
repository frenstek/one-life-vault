import { jsPDF } from 'jspdf';
import { writeFileSync, unlinkSync } from 'fs';

const PAGE_W = 210, PAGE_H = 297;
const ML = 30, MR = 30;
const CW = PAGE_W - ML - MR;

const outDir = 'C:/Users/kevin/OneDrive/Desktop/nathan';
const RATE = 42; // $/hr

function generateNDISInvoice(shifts, totalAmount) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 35;

  // Title
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.setTextColor(0, 0, 0);
  pdf.text('INVOICE', PAGE_W / 2, y, { align: 'center' });
  y += 20;

  // Invoice From
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Invoice From:', ML, y); y += 6;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text('Prabhjot Kaur', ML, y); y += 5;
  pdf.text('Worker Screening No: 16150305', ML, y); y += 5;
  pdf.text('Email: Babbucheema017@gmail.com', ML, y); y += 5;
  pdf.text('Phone: 0414237347', ML, y); y += 10;

  // Bank Details
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Bank Details:', ML, y); y += 6;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text('Account Name: Prabhjot Kaur', ML, y); y += 5;
  pdf.text('BSB: 063788', ML, y); y += 5;
  pdf.text('Account Number: 10215745', ML, y); y += 10;

  // Invoice To
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Invoice To:', ML, y); y += 6;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text('One Life Foundation Pty Ltd', ML, y); y += 5;
  pdf.text('Email: support@olfndisservices.com.au', ML, y); y += 10;

  // Participant
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('Participant:', ML, y); y += 6;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text('Nathan Gottaas', ML, y); y += 5;
  pdf.text('NDIS No: 430323224', ML, y); y += 14;

  // Table
  const tableX = ML + 15;
  const colDate = tableX;
  const colShift = tableX + 30;
  const colAmount = tableX + 100;
  const tableW = 130;
  const rowH = 7;

  // Header row
  pdf.setFillColor(180, 180, 180);
  pdf.rect(colDate, y, tableW, rowH, 'F');
  pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.3);
  pdf.rect(colDate, y, 30, rowH, 'S');
  pdf.rect(colShift, y, 70, rowH, 'S');
  pdf.rect(colAmount, y, 30, rowH, 'S');

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0);
  pdf.text('Date', colDate + 2, y + 5);
  pdf.text('Shift Time', colShift + 2, y + 5);
  pdf.text('Amount ($)', colAmount + 2, y + 5);
  y += rowH;

  // Data rows
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
  for (const s of shifts) {
    pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.3);
    pdf.rect(colDate, y, 30, rowH, 'S');
    pdf.rect(colShift, y, 70, rowH, 'S');
    pdf.rect(colAmount, y, 30, rowH, 'S');

    pdf.text(s.date, colDate + 2, y + 5);
    pdf.text(s.shift, colShift + 2, y + 5);
    pdf.text(s.amount.toFixed(2), colAmount + 2, y + 5);
    y += rowH;
  }

  y += 12;

  // Total
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text(`Total Amount Payable: $${totalAmount.toFixed(2)}`, ML, y);
  y += 10;

  // Payment Terms
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text('Payment Terms: 7 days', ML, y);

  return pdf;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE
// ═══════════════════════════════════════════════════════════════════════════════

// Period 1: 23-27 Mar (3+3+3+3+2 = 14 hrs)
const shifts1 = [
  { date: '23.03', shift: '10:00 AM \u2013 1:00 PM', amount: 3 * RATE },
  { date: '24.03', shift: '10:00 AM \u2013 1:00 PM', amount: 3 * RATE },
  { date: '25.03', shift: '10:00 AM \u2013 1:00 PM', amount: 3 * RATE },
  { date: '26.03', shift: '10:00 AM \u2013 1:00 PM', amount: 3 * RATE },
  { date: '27.03', shift: '10:00 AM \u2013 12:00 PM', amount: 2 * RATE },
];
const total1 = shifts1.reduce((s, x) => s + x.amount, 0);

// Period 2: 31 Mar (8 hrs)
const shifts2 = [
  { date: '31.03', shift: '8:00 AM \u2013 4:00 PM', amount: 8 * RATE },
];
const total2 = shifts2.reduce((s, x) => s + x.amount, 0);

// Combined into one invoice (like the existing one has multiple dates)
const allShifts = [...shifts1, ...shifts2];
const grandTotal = total1 + total2;

const pdf = generateNDISInvoice(allShifts, grandTotal);

// Delete old format invoices
try { unlinkSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar23-27.pdf`); console.log('Deleted old invoice 23-27'); } catch {}
try { unlinkSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar31.pdf`); console.log('Deleted old invoice 31'); } catch {}

writeFileSync(`${outDir}/NDISInvoice_Prabhjot_Kaur_Nathan_Mar23-31.pdf`, Buffer.from(pdf.output('arraybuffer')));
console.log(`\nSaved: NDISInvoice_Prabhjot_Kaur_Nathan_Mar23-31.pdf`);
console.log(`  6 shifts, Total: $${grandTotal.toFixed(2)}`);
console.log('  Matches format of previously submitted NDISInvoicePrabhjot_Kaur.pdf');
