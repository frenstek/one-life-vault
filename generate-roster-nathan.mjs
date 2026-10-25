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
const AMBER = [245, 158, 11];

function drawTitle(y) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(26, 42, 58);
  pdf.text('Roster Schedule ', ML, y);
  pdf.setTextColor(...AMBER);
  pdf.text('March 2026', ML + pdf.getTextWidth('Roster Schedule '), y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...MED);
  pdf.text('Nathan Gottaas  |  NDIS: 430323224  |  23 March \u2013 29 March 2026', ML, y + 6);

  const rX = PW - MR;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...MED);
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

// Columns: Date, Day, Morning, Afternoon, Evening 8-10pm, Sleepover, Notes
const cols = [
  ML,           // Date (18mm)
  ML + 18,      // Day (16mm)
  ML + 34,      // Morning (58mm)
  ML + 92,      // Afternoon (58mm)
  ML + 150,     // Evening 8-10pm (36mm)
  ML + 186,     // Sleepover (44mm)
  ML + 230,     // Notes (43mm)
];
const colWidths = [18, 16, 58, 58, 36, 44, 43];

function drawTableHeader(y) {
  pdf.setFillColor(...NAVY);
  const rowH = 14;
  for (let i = 0; i < cols.length; i++) {
    pdf.rect(cols[i], y, colWidths[i], rowH, 'F');
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(...WHITE);
  const headers = ['Date', 'Day', 'Morning', 'Afternoon', 'Evening\n8PM\u201310PM', 'Sleepover\n10PM\u20136AM', 'Notes'];
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

function drawRow(y, data, rowH = 14) {
  pdf.setFillColor(...WHITE);
  for (let i = 0; i < cols.length; i++) {
    pdf.rect(cols[i], y, colWidths[i], rowH, 'FD');
  }
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.2);
  for (let i = 0; i < cols.length; i++) {
    pdf.rect(cols[i], y, colWidths[i], rowH, 'S');
  }

  const values = [data.date, data.day, data.morning, data.afternoon, data.evening, data.sleepover, data.notes || ''];

  for (let i = 0; i < values.length; i++) {
    const val = values[i] || '\u2014';
    if (i === 6) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(5.5);
      pdf.setTextColor(...MED);
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(...DARK);
    }

    if (val.includes('\n')) {
      const lines = val.split('\n');
      for (let l = 0; l < lines.length; l++) {
        pdf.text(lines[l], cols[i] + 2, y + 4.5 + l * 3.2);
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
    'Roster Schedule \u2014 Nathan Gottaas \u2014 March 2026 | One Life Foundation Pty Ltd',
    PW / 2, PH - 6, { align: 'center' }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1
// ═══════════════════════════════════════════════════════════════════════════════

let y = MT + 6;
drawTitle(y + 8);
y += 20;

// WE 29 March
y = drawWeekHeader(y, 'WE 29 March 2026');
y = drawTableHeader(y);

y = drawRow(y, {
  date: '23/03', day: 'Mon',
  morning: 'Sukhsimran Kaur\n6:00AM\u20134:00PM',
  afternoon: 'Sukhsimran Kaur\n4:00PM\u20138:00PM',
  evening: '\u2014',
  sleepover: 'Sukhsimran Kaur',
});

y = drawRow(y, {
  date: '24/03', day: 'Tue',
  morning: 'Sukhsimran Kaur 8:00\u201310:00AM\nAfraa Najmeh 10:00AM\u201312:00PM',
  afternoon: 'Afraa Najmeh 12:00\u20133:00PM\nSukhsimran Kaur 3:00\u20138:00PM',
  evening: 'Sukhsimran Kaur',
  sleepover: 'Afraa Najmeh',
});

y = drawRow(y, {
  date: '25/03', day: 'Wed',
  morning: 'Sukhsimran Kaur 8:00\u201311:00AM\nGurpreet Kaur 11:00AM\u201312:00PM',
  afternoon: 'Gurpreet Kaur 12:00\u20133:30PM\nSukhsimran Kaur 3:30\u20138:00PM',
  evening: 'Sukhsimran Kaur',
  sleepover: 'Sukhsimran Kaur',
});

y = drawRow(y, {
  date: '26/03', day: 'Thu',
  morning: 'Sukhsimran Kaur\n7:00AM\u201312:00PM',
  afternoon: 'Sukhsimran Kaur\n12:00PM\u20138:00PM',
  evening: 'Sukhsimran Kaur',
  sleepover: 'Sukhsimran Kaur',
});

y = drawRow(y, {
  date: '27/03', day: 'Fri',
  morning: 'Sukhsimran Kaur 7:00\u20138:00AM\nAfraa Najmeh 8:00AM\u201312:00PM',
  afternoon: 'Gurpreet Kaur 11:45AM\u20132:45PM\nSukhsimran Kaur 3:00\u20138:00PM',
  evening: '\u2014',
  sleepover: 'Afraa Najmeh',
});

y = drawRow(y, {
  date: '28/03', day: 'Sat',
  morning: 'Sukhsimran Kaur\n8:00AM\u201312:00PM',
  afternoon: 'Afraa Najmeh 12:00\u20136:00PM\nGurpreet Kaur 2:30\u20137:25PM',
  evening: '\u2014',
  sleepover: 'Afraa Najmeh',
});

y = drawRow(y, {
  date: '29/03', day: 'Sun',
  morning: 'Sukhsimran Kaur\n8:00AM\u201312:00PM',
  afternoon: 'Sukhsimran Kaur\n12:00PM\u20138:00PM',
  evening: '\u2014',
  sleepover: 'Sukhsimran Kaur',
});

drawFooter();

// Save
const outPath = 'C:/Users/kevin/OneDrive/Desktop/INVOICES NICOLE/NATHAN/Roster Schedule 2026 - Nathan G (WE 29.03.26).pdf';
const buf = Buffer.from(pdf.output('arraybuffer'));
writeFileSync(outPath, buf);
console.log('Saved:', outPath);
