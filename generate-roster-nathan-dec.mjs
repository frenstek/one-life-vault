import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
const PW = 297, PH = 210;
const ML = 12, MR = 12, MT = 8;
const CW = PW - ML - MR;

const NAVY = [26, 42, 58];
const WHITE = [255, 255, 255];
const DARK = [30, 41, 59];
const MED = [100, 116, 139];
const BORDER = [226, 232, 240];
const GREEN = [34, 197, 94];

function drawTitle(y, title, subtitle) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(26, 42, 58);
  pdf.text('Roster Schedule ', ML, y);
  pdf.setTextColor(245, 158, 11);
  pdf.text(title, ML + pdf.getTextWidth('Roster Schedule '), y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...MED);
  pdf.text(subtitle, ML, y + 6);

  const rX = PW - MR;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...MED);
  pdf.text('One Life Foundation Pty Ltd', rX, y - 8, { align: 'right' });
  pdf.text('0457 347 882', rX, y - 3, { align: 'right' });
}

function drawWeekHeader(y, weekLabel) {
  pdf.setFillColor(...NAVY);
  pdf.roundedRect(ML, y, CW, 8, 1, 1, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...WHITE);
  pdf.text('Weekly Participant Schedule', ML + 4, y + 5.5);
  pdf.text(weekLabel, PW - MR - 4, y + 5.5, { align: 'right' });
  return y + 10;
}

const cols = [ML, ML + 18, ML + 34, ML + 86, ML + 228];
const colWidths = [18, 16, 52, 142, 45];

function drawTableHeader(y) {
  pdf.setFillColor(...NAVY);
  const rowH = 14;
  for (let i = 0; i < cols.length; i++) {
    pdf.rect(cols[i], y, colWidths[i], rowH, 'F');
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(...WHITE);
  ['DATE', 'DAY', 'STAFF', 'SHIFT TIMES', 'PN'].forEach((h, i) => {
    pdf.text(h, cols[i] + colWidths[i] / 2, y + 8, { align: 'center' });
  });
  return y + rowH;
}

function drawRow(y, data, rowH = 12) {
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.2);
  for (let i = 0; i < cols.length; i++) {
    pdf.setFillColor(...WHITE);
    pdf.rect(cols[i], y, colWidths[i], rowH, 'FD');
  }
  const values = [data.date, data.day, data.staff, data.times, data.pn || ''];
  for (let i = 0; i < values.length; i++) {
    const val = values[i] || '\u2014';
    if (i === 4 && val === 'Complete') {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...GREEN);
    } else {
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...DARK);
    }
    pdf.text(val, cols[i] + colWidths[i] / 2, y + (rowH / 2) + 1.5, { align: 'center' });
  }
  return y + rowH;
}

function drawFooter(text) {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(...MED);
  pdf.text(text, PW / 2, PH - 6, { align: 'center' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — December 29 to January 1
// ═══════════════════════════════════════════════════════════════════════════════

let y = MT + 6;
drawTitle(y + 8, 'December 2025', 'Nathan Gottaas  |  NDIS: 430323224  |  29 December 2025 \u2013 1 January 2026');
y += 20;

y = drawWeekHeader(y, 'WE 1 January 2026');
y = drawTableHeader(y);

y = drawRow(y, { date: '29/12', day: 'Mon', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 8:00PM', pn: 'Complete' });
y = drawRow(y, { date: '30/12', day: 'Tue', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 8:00PM', pn: 'Complete' });
y = drawRow(y, { date: '31/12', day: 'Wed', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 4:30PM', pn: 'Complete' });
y = drawRow(y, { date: '01/01', day: 'Thu (PH)', staff: 'Sukhsimran Kaur', times: '9:00AM \u2013 4:00PM', pn: 'Complete' });

drawFooter('Roster Schedule \u2014 Nathan Gottaas \u2014 29 Dec 2025 to 1 Jan 2026 | One Life Foundation Pty Ltd');

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — March 30
// ═══════════════════════════════════════════════════════════════════════════════

pdf.addPage();
y = MT + 6;
drawTitle(y + 8, 'March 2026', 'Nathan Gottaas  |  NDIS: 430323224  |  30 March 2026');
y += 20;

y = drawWeekHeader(y, '30 March 2026');
y = drawTableHeader(y);

y = drawRow(y, { date: '30/03', day: 'Mon', staff: 'Afrah Najmeh', times: '6:00AM \u2013 2:00PM', pn: 'Complete' });
y = drawRow(y, { date: '30/03', day: 'Mon', staff: 'Vishali Gill', times: '2:00PM \u2013 10:00PM', pn: 'Complete' });

drawFooter('Roster Schedule \u2014 Nathan Gottaas \u2014 30 March 2026 | One Life Foundation Pty Ltd');

// ─── Save ───────────────────────────────────────────────────────────────────
const outPath = 'C:/Users/kevin/Downloads/Roster_Nathan_Gottaas_Dec29-Jan1_and_Mar30.pdf';
writeFileSync(outPath, Buffer.from(pdf.output('arraybuffer')));
console.log('Saved:', outPath);
