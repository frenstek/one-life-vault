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
const BORDER = [226, 232, 240];
const GREEN = [34, 197, 94];

function drawTitle(y) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(26, 42, 58);
  pdf.text('Roster Schedule ', ML, y);
  pdf.setTextColor(245, 158, 11);
  pdf.text('April 2026', ML + pdf.getTextWidth('Roster Schedule '), y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...MED);
  pdf.text('Nicole Elizabeth Knight  |  6 April \u2013 12 April 2026', ML, y + 6);

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

// Column positions
const cols = [
  ML,           // Date (18mm)
  ML + 18,      // Day (16mm)
  ML + 34,      // Morning (52mm)
  ML + 86,      // Afternoon (52mm)
  ML + 138,     // Evening (42mm)
  ML + 180,     // Sleepover (48mm)
  ML + 228,     // PN (45mm)
];
const colWidths = [18, 16, 52, 52, 42, 48, 45];

function drawTableHeader(y) {
  pdf.setFillColor(...NAVY);
  const rowH = 14;
  for (let i = 0; i < cols.length; i++) {
    pdf.rect(cols[i], y, colWidths[i], rowH, 'F');
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(...WHITE);

  const headers = [
    { top: 'DATE', bottom: '' },
    { top: 'DAY', bottom: '' },
    { top: 'MORNING', bottom: '6:00AM \u2013 12:00PM' },
    { top: 'AFTERNOON', bottom: '4:00PM \u2013 8:00PM' },
    { top: 'EVENING', bottom: '8:00PM \u2013 10:00PM' },
    { top: 'SLEEPOVER', bottom: '10:00PM \u2013 6:00AM' },
    { top: 'PN', bottom: '' },
  ];

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (h.bottom) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text(h.top, cols[i] + colWidths[i] / 2, y + 5.5, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.text(h.bottom, cols[i] + colWidths[i] / 2, y + 10, { align: 'center' });
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text(h.top, cols[i] + colWidths[i] / 2, y + 8, { align: 'center' });
    }
  }
  return y + rowH;
}

function drawRow(y, data, rowH = 12) {
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.2);
  for (let i = 0; i < cols.length; i++) {
    pdf.setFillColor(...WHITE);
    pdf.rect(cols[i], y, colWidths[i], rowH, 'FD');
  }

  const values = [data.date, data.day, data.morning, data.afternoon, data.evening, data.sleepover, data.pn || ''];

  for (let i = 0; i < values.length; i++) {
    const val = values[i] || '\u2014';

    if (i === 6 && val === 'Complete') {
      // PN column - green bold
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(...GREEN);
      pdf.text(val, cols[i] + colWidths[i] / 2, y + (rowH / 2) + 1.5, { align: 'center' });
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...DARK);

      if (val.includes('\n')) {
        const lines = val.split('\n');
        const startY = y + (rowH / 2) - ((lines.length - 1) * 1.75) + 1;
        for (let l = 0; l < lines.length; l++) {
          pdf.text(lines[l], cols[i] + colWidths[i] / 2, startY + l * 3.5, { align: 'center' });
        }
      } else {
        pdf.text(val, cols[i] + colWidths[i] / 2, y + (rowH / 2) + 1.5, { align: 'center' });
      }
    }
  }
  return y + rowH;
}

function drawFooter() {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(...MED);
  pdf.text(
    'Roster Schedule \u2014 Nicole Elizabeth Knight \u2014 6 to 12 April 2026 | One Life Foundation Pty Ltd',
    PW / 2, PH - 6, { align: 'center' }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1
// ═══════════════════════════════════════════════════════════════════════════════

let y = MT + 6;
drawTitle(y + 8);
y += 20;

y = drawWeekHeader(y, 'WE 12 April 2026');
y = drawTableHeader(y);

y = drawRow(y, {
  date: '06/04', day: 'Mon',
  morning: 'Pawandeep Kaur',
  afternoon: 'Avneet Kaur',
  evening: 'Avneet Kaur',
  sleepover: 'Vishali Gill',
  pn: 'Complete',
});

y = drawRow(y, {
  date: '07/04', day: 'Tue',
  morning: 'Vishali Gill',
  afternoon: 'Gurpreet Kaur',
  evening: 'Gurpreet Kaur',
  sleepover: 'Vishali Gill',
  pn: 'Complete',
});

y = drawRow(y, {
  date: '08/04', day: 'Wed',
  morning: 'Gurpreet Kaur',
  afternoon: 'Avneet Kaur',
  evening: 'Avneet Kaur',
  sleepover: 'Avneet Kaur',
  pn: 'Complete',
});

y = drawRow(y, {
  date: '09/04', day: 'Thu',
  morning: '\u2014',
  afternoon: 'Vishali Gill',
  evening: 'Vishali Gill',
  sleepover: 'Vishali Gill',
  pn: 'Complete',
});

y = drawRow(y, {
  date: '10/04', day: 'Fri',
  morning: 'Vishali Gill\nGurpreet Kaur',
  afternoon: 'Avneet Kaur',
  evening: 'Avneet Kaur',
  sleepover: 'Avneet Kaur',
  pn: 'Complete',
}, 14);

y = drawRow(y, {
  date: '11/04', day: 'Sat',
  morning: 'Vishali Gill',
  afternoon: 'Prabhjot Kaur',
  evening: 'Avneet Kaur',
  sleepover: 'Avneet Kaur',
  pn: 'Complete',
});

y = drawRow(y, {
  date: '12/04', day: 'Sun',
  morning: 'Avneet Kaur\nVishali Gill',
  afternoon: 'Prabhjot Kaur',
  evening: 'Avneet Kaur',
  sleepover: 'Avneet Kaur',
  pn: 'Complete',
}, 14);

drawFooter();

// ─── Save ────────────────────────────────────────────────────────────────────
const outPath = 'C:/Users/kevin/OneDrive/Desktop/INVOICES NICOLE/NICOLE APR 6-12/Nicole_Roster_WE_12_April_2026.pdf';
const buf = Buffer.from(pdf.output('arraybuffer'));
writeFileSync(outPath, buf);
console.log('Saved:', outPath);
