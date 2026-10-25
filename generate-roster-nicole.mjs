import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
const PW = 297, PH = 210;
const ML = 12, MR = 12, MT = 8;
const CW = PW - ML - MR;

// Colors
const NAVY = [26, 42, 58];
const WHITE = [255, 255, 255];
const DARK = [30, 41, 59];
const MED = [100, 116, 139];
const LIGHT_BG = [248, 250, 252];
const BORDER = [226, 232, 240];
const GREEN = [34, 197, 94];
const AMBER = [245, 158, 11];

function drawTitle(y) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(26, 42, 58);
  pdf.text('Roster Schedule ', ML, y);
  pdf.setTextColor(245, 158, 11);
  pdf.text('March 2026', ML + pdf.getTextWidth('Roster Schedule '), y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...MED);
  pdf.text('Nicole Elizabeth Knight  |  6 March \u2013 29 March 2026', ML, y + 6);

  // Right side
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...MED);
  const rX = PW - MR;
  pdf.text('One Life Foundation Pty Ltd', rX, y - 8, { align: 'right' });
  pdf.text('1300 ONE LIFE', rX, y - 3, { align: 'right' });
  pdf.text('Generated: 29 April 2026', rX, y + 2, { align: 'right' });
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

// Column positions (landscape A4 = 297mm wide, 12mm margins = 273mm usable)
const cols = [
  ML,           // Date (18mm)
  ML + 18,      // Day (16mm)
  ML + 34,      // 6am-12pm (44mm)
  ML + 78,      // 12pm-4pm (44mm)
  ML + 122,     // 4pm-8pm (42mm)
  ML + 164,     // 8pm-10pm (40mm)
  ML + 204,     // Sleepover (44mm)
  ML + 248,     // Notes (25mm)
];
const colWidths = [18, 16, 44, 44, 42, 40, 44, 25];

function drawTableHeader(y) {
  pdf.setFillColor(...NAVY);
  const rowH = 14;
  for (let i = 0; i < cols.length; i++) {
    pdf.rect(cols[i], y, colWidths[i], rowH, 'F');
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(...WHITE);
  const headers = ['Date', 'Day', '6:00AM\u201312:00PM', '12:00PM\u20134:00PM\n(Other Provider)', '4:00PM\u20138:00PM', '8:00PM\u201310:00PM', 'Sleepover\n(10:00PM\u20136:00AM)', 'Notes'];
  for (let i = 0; i < headers.length; i++) {
    const lines = headers[i].split('\n');
    if (lines.length === 1) {
      pdf.text(lines[0], cols[i] + 2, y + 8);
    } else {
      pdf.text(lines[0], cols[i] + 2, y + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.text(lines[1], cols[i] + 2, y + 10);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
    }
  }
  return y + rowH;
}

function drawRow(y, data, rowH = 10) {
  // Alternating bg
  pdf.setFillColor(...WHITE);
  for (let i = 0; i < cols.length; i++) {
    pdf.rect(cols[i], y, colWidths[i], rowH, 'FD');
  }
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.2);
  for (let i = 0; i < cols.length; i++) {
    pdf.rect(cols[i], y, colWidths[i], rowH, 'S');
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(...DARK);

  const values = [data.date, data.day, data.morning, data.midday, data.afternoon, data.evening, data.sleepover, data.notes || ''];

  for (let i = 0; i < values.length; i++) {
    const val = values[i] || '\u2014';
    if (i === 7) {
      // Notes - smaller italic
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(5.5);
      pdf.setTextColor(...MED);
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(...DARK);
    }

    // Handle multi-line cells
    if (val.includes('\n')) {
      const lines = val.split('\n');
      for (let l = 0; l < lines.length; l++) {
        pdf.text(lines[l], cols[i] + 2, y + 4 + l * 3.5);
      }
    } else {
      pdf.text(val, cols[i] + 2, y + (rowH / 2) + 1.5);
    }
  }
  return y + rowH;
}

function drawFooter() {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(...MED);
  pdf.text(
    'Roster Schedule \u2014 Nicole Elizabeth Knight \u2014 6 to 29 March 2026 | One Life Foundation Pty Ltd',
    PW / 2, PH - 6, { align: 'center' }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1
// ═══════════════════════════════════════════════════════════════════════════════

let y = MT + 6;
drawTitle(y + 8);
y += 20;

// WE 08 March
y = drawWeekHeader(y, 'WE 08 March 2026');
y = drawTableHeader(y);
y = drawRow(y, { date: '06/03', day: 'Fri', morning: '\u2014', midday: '1:00PM\u201310:00PM\nGurpreet Kaur', afternoon: 'Gurpreet Kaur', evening: 'Gurpreet Kaur', sleepover: 'Gurpreet Kaur', notes: 'Support starts 1:00PM.\nGurpreet stayed for sleepover.' }, 12);
y = drawRow(y, { date: '07/03', day: 'Sat', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Prabhjot Kaur', evening: 'Prabhjot Kaur', sleepover: 'Prabhjot Kaur', notes: 'Prabhjot 4pm through sleepover' });
y = drawRow(y, { date: '08/03', day: 'Sun', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Prabhjot Kaur', evening: 'Prabhjot Kaur', sleepover: 'Prabhjot Kaur' });

y += 6;

// WE 15 March
y = drawWeekHeader(y, 'WE 15 March 2026');
y = drawTableHeader(y);
y = drawRow(y, { date: '09/03', day: 'Mon', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Pawandeep Kaur', evening: 'Pawandeep Kaur', sleepover: 'Pawandeep Kaur' });
y = drawRow(y, { date: '10/03', day: 'Tue', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Avneet Kaur /\nPawandeep Kaur' });
y = drawRow(y, { date: '11/03', day: 'Wed', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Avneet Kaur /\nPawandeep Kaur' });
y = drawRow(y, { date: '12/03', day: 'Thu', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Pawandeep Kaur' });
y = drawRow(y, { date: '13/03', day: 'Fri', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Avneet Kaur /\nPawandeep Kaur', notes: 'Pawandeep continued\nfrom sleepover' });
y = drawRow(y, { date: '14/03', day: 'Sat', morning: 'Avneet Kaur', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Avneet Kaur' });
y = drawRow(y, { date: '15/03', day: 'Sun', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Pawandeep Kaur', evening: 'Pawandeep Kaur', sleepover: 'Pawandeep Kaur', notes: 'Pawandeep continued\nfrom sleepover' });

drawFooter();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2
// ═══════════════════════════════════════════════════════════════════════════════

pdf.addPage();
y = MT + 4;

// WE 22 March — CORRECTED: Simran/Simmie → Sukhsimran
y = drawWeekHeader(y, 'WE 22 March 2026');
y = drawTableHeader(y);
y = drawRow(y, { date: '16/03', day: 'Mon', morning: 'Avneet Kaur', midday: 'Sukhsimran', afternoon: 'Pawandeep Kaur', evening: 'Pawandeep Kaur', sleepover: 'Pawandeep Kaur' });
y = drawRow(y, { date: '17/03', day: 'Tue', morning: 'Sukhsimran', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Avneet Kaur' });
y = drawRow(y, { date: '18/03', day: 'Wed', morning: 'Sukhsimran', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Sukhsimran' });
y = drawRow(y, { date: '19/03', day: 'Thu', morning: 'Gurpreet Kaur', midday: '\u2014', afternoon: 'Gurpreet Kaur', evening: 'Gurpreet Kaur', sleepover: 'Gurpreet Kaur' });
y = drawRow(y, { date: '20/03', day: 'Fri', morning: 'Gurpreet Kaur', midday: '\u2014', afternoon: 'Sukhsimran', evening: 'Sukhsimran', sleepover: 'Sukhsimran' });
y = drawRow(y, { date: '21/03', day: 'Sat', morning: 'Gurpreet Kaur', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Sukhsimran' });
y = drawRow(y, { date: '22/03', day: 'Sun', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Prabhjot Kaur', evening: 'Prabhjot Kaur', sleepover: 'Avneet Kaur' });

y += 6;

// WE 29 March — unchanged
y = drawWeekHeader(y, 'WE 29 March 2026');
y = drawTableHeader(y);
y = drawRow(y, { date: '23/03', day: 'Mon', morning: 'Avneet Kaur', midday: '\u2014', afternoon: 'Preet Kaur', evening: 'Preet Kaur', sleepover: 'Pawandeep Kaur', notes: 'Avneet continued\nfrom sleepover' });
y = drawRow(y, { date: '24/03', day: 'Tue', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Avneet Kaur' });
y = drawRow(y, { date: '25/03', day: 'Wed', morning: 'Vishall', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Avneet Kaur' });
y = drawRow(y, { date: '26/03', day: 'Thu', morning: 'Vishay', midday: '\u2014', afternoon: 'Preet Kaur', evening: '\u2014', sleepover: 'Preet Kaur' });
y = drawRow(y, { date: '27/03', day: 'Fri', morning: 'Pawandeep Kaur', midday: '\u2014', afternoon: 'Prabhjot Kaur', evening: 'Prabhjot Kaur', sleepover: 'Prabhjot Kaur' });
y = drawRow(y, { date: '28/03', day: 'Sat', morning: 'Prabhjot Kaur', midday: '\u2014', afternoon: 'Avneet Kaur', evening: 'Avneet Kaur', sleepover: 'Avneet Kaur', notes: 'Prabhjot continued\nfrom sleepover' });
y = drawRow(y, { date: '29/03', day: 'Sun', morning: 'Avneet Kaur', midday: '\u2014', afternoon: 'Prabhjot Kaur', evening: 'Avneet Kaur', sleepover: 'Avneet Kaur', notes: 'Avneet continued\nfrom sleepover' });

drawFooter();

// ─── Save ────────────────────────────────────────────────────────────────────
const outPath = 'C:/Users/kevin/OneDrive/Desktop/INVOICES NICOLE/NICOLE/Roster Schedule 2026 - NK (Corrected).pdf';
const buf = Buffer.from(pdf.output('arraybuffer'));
writeFileSync(outPath, buf);
console.log('Saved:', outPath);
