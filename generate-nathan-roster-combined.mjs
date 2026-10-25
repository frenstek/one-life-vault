import { jsPDF } from 'jspdf';
import { writeFileSync, unlinkSync } from 'fs';

const PW = 297, PH = 210;
const ML = 12, MR = 12, MT = 8;
const CW = PW - ML - MR;

const NAVY = [26, 42, 58];
const WHITE = [255, 255, 255];
const DARK = [30, 41, 59];
const MED = [100, 116, 139];
const BORDER = [226, 232, 240];
const AMBER = [245, 158, 11];

const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
const rX = PW - MR;

// ─── Shared drawing functions ───────────────────────────────────────────────

function drawTitle(y, monthYear, dateRange) {
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(26, 42, 58);
  pdf.text('Roster Schedule ', ML, y);
  pdf.setTextColor(...AMBER);
  pdf.text(monthYear, ML + pdf.getTextWidth('Roster Schedule '), y);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MED);
  pdf.text(`Nathan Gottaas  |  NDIS: 430323224  |  ${dateRange}`, ML, y + 6);
  pdf.setFontSize(8);
  pdf.text('One Life Foundation Pty Ltd', rX, y - 8, { align: 'right' });
}

function drawWeekHeader(y, weekLabel) {
  pdf.setFillColor(...NAVY);
  pdf.roundedRect(ML, y, CW, 8, 1, 1, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...WHITE);
  pdf.text('Weekly Participant Schedule', ML + 4, y + 5.5);
  pdf.text(weekLabel, rX - 4, y + 5.5, { align: 'right' });
  return y + 10;
}

const cols = [ML, ML + 18, ML + 34, ML + 92, ML + 150, ML + 230];
const colW = [18, 16, 58, 58, 80, 43];

function drawTableHeader(y) {
  const hdrs = ['DATE', 'DAY', 'STAFF', 'SHIFT TIMES', 'SERVICE TYPE', 'PN'];
  pdf.setFillColor(...NAVY);
  for (let i = 0; i < cols.length; i++) pdf.rect(cols[i], y, colW[i], 10, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(...WHITE);
  hdrs.forEach((h, i) => pdf.text(h, cols[i] + 2, y + 6.5));
  return y + 10;
}

function drawRow(y, data, rowH = 12) {
  pdf.setFillColor(...WHITE);
  for (let i = 0; i < cols.length; i++) {
    pdf.rect(cols[i], y, colW[i], rowH, 'FD');
    pdf.setDrawColor(...BORDER); pdf.setLineWidth(0.2);
    pdf.rect(cols[i], y, colW[i], rowH, 'S');
  }
  const vals = [data.date, data.day, data.staff, data.times, data.type || 'At home care', data.pn || 'Complete'];
  for (let i = 0; i < vals.length; i++) {
    if (i === 5) {
      pdf.setFont('helvetica', 'italic'); pdf.setFontSize(6); pdf.setTextColor(...MED);
    } else {
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...DARK);
    }
    pdf.text(vals[i], cols[i] + 2, y + (rowH / 2) + 1.5);
  }
  return y + rowH;
}

function drawFooter(label) {
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(...MED);
  pdf.text(label, PW / 2, PH - 6, { align: 'center' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1: December 29, 2025 – January 1, 2026 (Sukhsimran)
// ═══════════════════════════════════════════════════════════════════════════════

let y = MT + 6;
drawTitle(y + 8, 'December 2025', '29 December 2025 \u2013 1 January 2026');
y += 20;
y = drawWeekHeader(y, 'WE 1 January 2026');
y = drawTableHeader(y);

y = drawRow(y, { date: '29/12', day: 'Mon', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 8:00PM' });
y = drawRow(y, { date: '30/12', day: 'Tue', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 8:00PM' });
y = drawRow(y, { date: '31/12', day: 'Wed', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 4:30PM' });
y = drawRow(y, { date: '01/01', day: 'Thu (PH)', staff: 'Sukhsimran Kaur', times: '9:00AM \u2013 4:00PM' });

drawFooter('Roster Schedule \u2014 Nathan Gottaas \u2014 29 Dec 2025 to 1 Jan 2026 | One Life Foundation Pty Ltd');

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2: March 23–27, 2026 (Prabhjot)
// ═══════════════════════════════════════════════════════════════════════════════

pdf.addPage();
y = MT + 6;
drawTitle(y + 8, 'March 2026', '23 March \u2013 27 March 2026');
y += 20;
y = drawWeekHeader(y, '23 \u2013 27 March 2026');
y = drawTableHeader(y);

y = drawRow(y, { date: '23/03', day: 'Mon', staff: 'Prabhjot Kaur', times: '9:00AM \u2013 1:00PM', type: 'At home care (4 hrs)' });
y = drawRow(y, { date: '25/03', day: 'Wed', staff: 'Prabhjot Kaur', times: '9:00AM \u2013 1:00PM', type: 'At home care (4 hrs)' });
y = drawRow(y, { date: '27/03', day: 'Fri', staff: 'Prabhjot Kaur', times: '8:00AM \u2013 2:00PM', type: 'At home care (6 hrs)' });

drawFooter('Roster Schedule \u2014 Nathan Gottaas \u2014 23\u201327 March 2026 | One Life Foundation Pty Ltd');

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 3: March 30, 2026 (Afrah + Vishali)
// ═══════════════════════════════════════════════════════════════════════════════

pdf.addPage();
y = MT + 6;
drawTitle(y + 8, 'March 2026', '30 March 2026');
y += 20;
y = drawWeekHeader(y, '30 March 2026');
y = drawTableHeader(y);

y = drawRow(y, { date: '30/03', day: 'Mon', staff: 'Afrah Najmeh', times: '6:00AM \u2013 2:00PM' });
y = drawRow(y, { date: '30/03', day: 'Mon', staff: 'Vishali Gill', times: '2:00PM \u2013 10:00PM' });

drawFooter('Roster Schedule \u2014 Nathan Gottaas \u2014 30 March 2026 | One Life Foundation Pty Ltd');

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 4: March 31, 2026 (Prabhjot)
// ═══════════════════════════════════════════════════════════════════════════════

pdf.addPage();
y = MT + 6;
drawTitle(y + 8, 'March 2026', '31 March 2026');
y += 20;
y = drawWeekHeader(y, '31 March 2026');
y = drawTableHeader(y);

y = drawRow(y, { date: '31/03', day: 'Tue', staff: 'Prabhjot Kaur', times: '6:00AM \u2013 8:00PM', type: 'At home care (14 hrs)' });

drawFooter('Roster Schedule \u2014 Nathan Gottaas \u2014 31 March 2026 | One Life Foundation Pty Ltd');

// ═══════════════════════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════════════════════

const outDir = 'C:/Users/kevin/OneDrive/Desktop/nathan';

// Delete old separate files
try { unlinkSync(`${outDir}/Roster_Nathan_Gottaas_Dec29-Jan1_and_Mar30.pdf`); console.log('Deleted old roster (Dec29-Jan1 + Mar30)'); } catch {}
try { unlinkSync(`${outDir}/Roster_Nathan_Gottaas_Prabhjot_Mar23-27_and_Mar31.pdf`); console.log('Deleted old separate Prabhjot roster'); } catch {}

// Save combined
const outPath = `${outDir}/Roster_Nathan_Gottaas_Dec29-Jan1_Mar23-31.pdf`;
writeFileSync(outPath, Buffer.from(pdf.output('arraybuffer')));
console.log('\nSaved combined roster (4 pages):');
console.log('  Page 1: Dec 29 - Jan 1 (Sukhsimran)');
console.log('  Page 2: Mar 23-27 (Prabhjot — 4+4+6 = 14 hrs)');
console.log('  Page 3: Mar 30 (Afrah + Vishali)');
console.log('  Page 4: Mar 31 (Prabhjot — 14 hrs)');
