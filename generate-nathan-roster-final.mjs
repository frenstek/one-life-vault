import { jsPDF } from 'jspdf';
import { writeFileSync, unlinkSync } from 'fs';

const PW = 297, PH = 210;
const ML = 12, MR = 12, MT = 8;
const CW = PW - ML - MR;
const PAGE_W = 210, PAGE_H = 297;

const NAVY = [26, 42, 58], WHITE = [255, 255, 255], DARK = [30, 41, 59];
const MED = [100, 116, 139], BORDER = [226, 232, 240], AMBER = [245, 158, 11];

const outDir = 'C:/Users/kevin/OneDrive/Desktop/nathan';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. COMBINED ROSTER (4 pages)
// ═══════════════════════════════════════════════════════════════════════════════

const roster = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
const rX = PW - MR;

function drawTitle(y, monthYear, dateRange) {
  roster.setFont('helvetica', 'bold'); roster.setFontSize(20); roster.setTextColor(26, 42, 58);
  roster.text('Roster Schedule ', ML, y);
  roster.setTextColor(...AMBER);
  roster.text(monthYear, ML + roster.getTextWidth('Roster Schedule '), y);
  roster.setFont('helvetica', 'normal'); roster.setFontSize(9); roster.setTextColor(...MED);
  roster.text(`Nathan Gottaas  |  NDIS: 430323224  |  ${dateRange}`, ML, y + 6);
  roster.setFontSize(8);
  roster.text('One Life Foundation Pty Ltd', rX, y - 8, { align: 'right' });
}

function drawWeekHeader(y, label) {
  roster.setFillColor(...NAVY); roster.roundedRect(ML, y, CW, 8, 1, 1, 'F');
  roster.setFont('helvetica', 'bold'); roster.setFontSize(9); roster.setTextColor(...WHITE);
  roster.text('Weekly Participant Schedule', ML + 4, y + 5.5);
  roster.text(label, rX - 4, y + 5.5, { align: 'right' });
  return y + 10;
}

const cols = [ML, ML + 18, ML + 34, ML + 92, ML + 150, ML + 230];
const colW = [18, 16, 58, 58, 80, 43];

function drawTableHeader(y) {
  roster.setFillColor(...NAVY);
  for (let i = 0; i < cols.length; i++) roster.rect(cols[i], y, colW[i], 10, 'F');
  roster.setFont('helvetica', 'bold'); roster.setFontSize(6.5); roster.setTextColor(...WHITE);
  ['DATE', 'DAY', 'STAFF', 'SHIFT TIMES', 'SERVICE TYPE', 'PN'].forEach((h, i) => roster.text(h, cols[i] + 2, y + 6.5));
  return y + 10;
}

function drawRow(y, d) {
  roster.setFillColor(...WHITE);
  for (let i = 0; i < cols.length; i++) { roster.rect(cols[i], y, colW[i], 12, 'FD'); roster.setDrawColor(...BORDER); roster.setLineWidth(0.2); roster.rect(cols[i], y, colW[i], 12, 'S'); }
  const vals = [d.date, d.day, d.staff, d.times, d.type || 'At home care', d.pn || 'Complete'];
  for (let i = 0; i < vals.length; i++) {
    if (i === 5) { roster.setFont('helvetica', 'italic'); roster.setFontSize(6); roster.setTextColor(...MED); }
    else { roster.setFont('helvetica', 'normal'); roster.setFontSize(7); roster.setTextColor(...DARK); }
    roster.text(vals[i], cols[i] + 2, y + 7.5);
  }
  return y + 12;
}

function drawFooter(label) {
  roster.setFont('helvetica', 'normal'); roster.setFontSize(6); roster.setTextColor(...MED);
  roster.text(label, PW / 2, PH - 6, { align: 'center' });
}

// Page 1: Dec 29 – Jan 1
let y = MT + 6;
drawTitle(y + 8, 'December 2025', '29 December 2025 \u2013 1 January 2026');
y += 20; y = drawWeekHeader(y, 'WE 1 January 2026'); y = drawTableHeader(y);
y = drawRow(y, { date: '29/12', day: 'Mon', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 8:00PM' });
y = drawRow(y, { date: '30/12', day: 'Tue', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 8:00PM' });
y = drawRow(y, { date: '31/12', day: 'Wed', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 4:30PM' });
y = drawRow(y, { date: '01/01', day: 'Thu (PH)', staff: 'Sukhsimran Kaur', times: '9:00AM \u2013 4:00PM' });
drawFooter('Roster Schedule \u2014 Nathan Gottaas \u2014 29 Dec 2025 to 1 Jan 2026 | One Life Foundation Pty Ltd');

// Page 2: Mar 23–27 (Prabhjot)
roster.addPage(); y = MT + 6;
drawTitle(y + 8, 'March 2026', '23 March \u2013 27 March 2026');
y += 20; y = drawWeekHeader(y, '23 \u2013 27 March 2026'); y = drawTableHeader(y);
y = drawRow(y, { date: '23/03', day: 'Mon', staff: 'Prabhjot Kaur', times: '9:00AM \u2013 1:00PM', type: 'At home care (4 hrs)' });
y = drawRow(y, { date: '25/03', day: 'Wed', staff: 'Prabhjot Kaur', times: '9:00AM \u2013 1:00PM', type: 'At home care (4 hrs)' });
y = drawRow(y, { date: '27/03', day: 'Fri', staff: 'Prabhjot Kaur', times: '8:00AM \u2013 2:00PM', type: 'At home care (6 hrs)' });
drawFooter('Roster Schedule \u2014 Nathan Gottaas \u2014 23\u201327 March 2026 | One Life Foundation Pty Ltd');

// Page 3: Mar 30 (Afrah + Vishali)
roster.addPage(); y = MT + 6;
drawTitle(y + 8, 'March 2026', '30 March 2026');
y += 20; y = drawWeekHeader(y, '30 March 2026'); y = drawTableHeader(y);
y = drawRow(y, { date: '30/03', day: 'Mon', staff: 'Afrah Najmeh', times: '6:00AM \u2013 2:00PM' });
y = drawRow(y, { date: '30/03', day: 'Mon', staff: 'Vishali Gill', times: '2:00PM \u2013 10:00PM' });
drawFooter('Roster Schedule \u2014 Nathan Gottaas \u2014 30 March 2026 | One Life Foundation Pty Ltd');

// Page 4: Mar 31 (Prabhjot — 8 hrs)
roster.addPage(); y = MT + 6;
drawTitle(y + 8, 'March 2026', '31 March 2026');
y += 20; y = drawWeekHeader(y, '31 March 2026'); y = drawTableHeader(y);
y = drawRow(y, { date: '31/03', day: 'Tue', staff: 'Prabhjot Kaur', times: '8:00AM \u2013 4:00PM', type: 'At home care (8 hrs)' });
drawFooter('Roster Schedule \u2014 Nathan Gottaas \u2014 31 March 2026 | One Life Foundation Pty Ltd');

// Delete old and save
try { unlinkSync(`${outDir}/Roster_Nathan_Gottaas_All_Periods.pdf`); } catch {}
writeFileSync(`${outDir}/Roster_Nathan_Gottaas_All_Periods.pdf`, Buffer.from(roster.output('arraybuffer')));
console.log('Roster saved (4 pages) — Mar 31 = 8 hrs');

// ═══════════════════════════════════════════════════════════════════════════════
// 2. INVOICE — Mar 31 (8 hrs @ $42)
// ═══════════════════════════════════════════════════════════════════════════════

function labelValue(pdf, label, value, x, y) {
  pdf.setFont('helvetica', 'bold'); pdf.text(label, x, y);
  pdf.setFont('helvetica', 'normal'); pdf.text(value || '', x + pdf.getTextWidth(label) + 1, y);
}

const inv = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const IML = 20, IMR = 20, ICW = PAGE_W - IML - IMR;
let iy = 22;

inv.setFont('helvetica', 'bold'); inv.setFontSize(15); inv.setTextColor(0, 0, 0);
inv.text('SUPPORT WORKER INVOICE (7 DAY SHEET)', PAGE_W / 2, iy, { align: 'center' });
iy += 3; inv.setDrawColor(0, 50, 160); inv.setLineWidth(0.7); inv.line(IML, iy, PAGE_W - IMR, iy); iy += 14;

inv.setFont('helvetica', 'bold'); inv.setFontSize(11); inv.text('Support Worker Details', IML, iy); iy += 10;
inv.setFontSize(10);
labelValue(inv, 'Name: ', 'Prabhjot Kaur', IML, iy); iy += 6;
labelValue(inv, 'Phone: ', '0414237347', IML, iy); iy += 6;
labelValue(inv, 'Email: ', 'babbucheema017@gmail.com', IML, iy); iy += 14;

inv.setFont('helvetica', 'bold'); inv.setFontSize(11); inv.text('Invoice To', IML, iy); iy += 9;
inv.setFont('helvetica', 'normal'); inv.setFontSize(10); inv.text('One Life Foundation Pty Ltd (OLF)', IML + 2, iy); iy += 14;

inv.setFont('helvetica', 'bold'); inv.setFontSize(11); inv.text('Invoice Details', IML, iy); iy += 10;
inv.setFontSize(10);
labelValue(inv, 'Invoice Number: ', 'PK-002', IML, iy); iy += 6;
labelValue(inv, 'Invoice Date: ', '01/04/2026', IML, iy);
labelValue(inv, 'Payment Due: ', '08/04/2026', IML + 80, iy); iy += 14;

inv.setFont('helvetica', 'bold'); inv.setFontSize(11); inv.text('Participant Details', IML, iy); iy += 10;
inv.setFontSize(10);
labelValue(inv, 'Participant Name: ', 'Nathan Gottaas', IML, iy); iy += 6;
labelValue(inv, 'NDIS Number: ', '430323224', IML, iy); iy += 6;
labelValue(inv, 'Service Address: ', '30 Curtin Avenue, Lalor VIC 3042', IML, iy); iy += 12;

inv.setFillColor(0, 0, 0); inv.rect(IML, iy, ICW, 7, 'F');
inv.setFont('helvetica', 'bold'); inv.setFontSize(9); inv.setTextColor(255, 255, 255);
inv.text('Service Period: 31 March 2026', IML + 3, iy + 5);
inv.setTextColor(0, 0, 0); iy += 9;

const cw2 = [24, 14, 28, 22, 22, 16, 20, ICW - 146];
const cp = []; let cx2 = IML; for (const w of cw2) { cp.push(cx2); cx2 += w; }
inv.setFillColor(220, 220, 220); inv.rect(IML, iy, ICW, 7, 'F');
inv.setFont('helvetica', 'bold'); inv.setFontSize(8); inv.setTextColor(0, 0, 0);
['Day', 'Date', 'Service Type', 'Start', 'End', 'Hours', 'Rate ($)', 'Total ($)'].forEach((h, i) => inv.text(h, cp[i] + 2, iy + 5));
iy += 8;

inv.setFont('helvetica', 'normal'); inv.setFontSize(9);
inv.text('Tuesday', cp[0] + 2, iy + 4); inv.text('31/03', cp[1] + 2, iy + 4);
inv.text('At home care', cp[2] + 2, iy + 4); inv.text('8:00AM', cp[3] + 2, iy + 4);
inv.text('4:00PM', cp[4] + 2, iy + 4); inv.text('8', cp[5] + 2, iy + 4);
inv.text('42', cp[6] + 2, iy + 4); inv.text('336.00', cp[7] + 2, iy + 4);
inv.setDrawColor(200, 200, 200); inv.setLineWidth(0.15); inv.line(IML, iy + 6, IML + ICW, iy + 6);
iy += 13;

inv.setFont('helvetica', 'bold'); inv.setFontSize(11); inv.text('Payment Summary', IML, iy); iy += 10;
inv.setFontSize(10); inv.setFont('helvetica', 'normal');
const irX = PAGE_W - IMR;
inv.text('Weekday Hours: 8 hrs x $42/hr', IML, iy); inv.text('$336.00', irX, iy, { align: 'right' }); iy += 8;
inv.setDrawColor(0, 0, 0); inv.setLineWidth(0.5); inv.line(IML, iy, irX, iy); iy += 7;
inv.setFont('helvetica', 'bold'); inv.setFontSize(12);
inv.text('TOTAL:', IML, iy); inv.text('$336.00', irX, iy, { align: 'right' }); iy += 14;

inv.setFont('helvetica', 'bold'); inv.setFontSize(11); inv.text('Bank Details', IML, iy); iy += 10;
inv.setFontSize(10);
labelValue(inv, 'Account Name: ', 'Prabhjot Kaur', IML, iy); iy += 6;
labelValue(inv, 'BSB: ', '063788', IML, iy); iy += 6;
labelValue(inv, 'Account Number: ', '10215745', IML, iy); iy += 10;

inv.setDrawColor(200, 200, 200); inv.setLineWidth(0.2); inv.line(IML, iy, irX, iy); iy += 5;
inv.setFont('helvetica', 'italic'); inv.setFontSize(7.5); inv.setTextColor(130, 130, 130);
inv.text('This invoice was generated through the One Life Foundation NDIS Contractor Portal (onelifefoundationndis.app)', PAGE_W / 2, iy, { align: 'center' });

try { unlinkSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar30-31.pdf`); } catch {}
try { unlinkSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar31.pdf`); } catch {}
writeFileSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar31.pdf`, Buffer.from(inv.output('arraybuffer')));
console.log('Invoice Mar 31: 8 hrs @ $42 = $336.00');

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PROGRESS NOTES — Mar 31 only (8 hr shift)
// ═══════════════════════════════════════════════════════════════════════════════

const OLF_GREEN = [14, 160, 62];
const LIGHT = [148, 163, 184];
const AMBER_BG = [255, 251, 235], AMBER_BORDER = [245, 158, 11], AMBER_TEXT = [146, 64, 14];
const GREEN_BG = [240, 253, 244], GREEN_TEXT = [22, 101, 52];
const BLUE_BG = [239, 246, 255], BLUE_TEXT = [30, 64, 175];
const HEADER_H = 28, NML = 18, NMR = 18, NMT = 18;
const NCW = PAGE_W - NML - NMR;
const BODY_TOP = NMT + HEADER_H + 4, BODY_BOTTOM = PAGE_H - NMT - 14;

const npdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
let ny = BODY_TOP;

// Header
npdf.setFillColor(...OLF_GREEN); npdf.rect(0, 0, PAGE_W, NMT + HEADER_H, 'F');
npdf.setFont('helvetica', 'bold'); npdf.setFontSize(18); npdf.setTextColor(255, 255, 255);
npdf.text('Progress Notes Report', NML, NMT + 10);
npdf.setFont('helvetica', 'normal'); npdf.setFontSize(9);
npdf.text('Nathan Gottaas  |  From: 31 Mar 2026  |  To: 31 Mar 2026', NML, NMT + 18);
npdf.text(`Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, PAGE_W - NMR, NMT + 18, { align: 'right' });
npdf.setFont('helvetica', 'bold'); npdf.setFontSize(9);
npdf.text('1 note', PAGE_W - NMR, NMT + 10, { align: 'right' });

// Date header
npdf.setFillColor(248, 250, 252); npdf.roundedRect(NML, ny, NCW, 8, 1.5, 1.5, 'F');
npdf.setFillColor(...OLF_GREEN); npdf.rect(NML, ny, 1.2, 8, 'F');
npdf.setFont('helvetica', 'bold'); npdf.setFontSize(9); npdf.setTextColor(...DARK);
npdf.text('Tuesday 31 March 2026', NML + 6, ny + 5.5);
npdf.setFont('helvetica', 'normal'); npdf.setFontSize(7); npdf.setTextColor(...LIGHT);
npdf.text('1 note', PAGE_W - NMR - 4, ny + 5.5, { align: 'right' }); ny += 12;

// Note header
npdf.setFont('helvetica', 'bold'); npdf.setFontSize(9); npdf.setTextColor(...DARK);
npdf.text('Nathan Gottaas', NML + 6, ny + 5);
let bx = NML + 6 + npdf.getTextWidth('Nathan Gottaas') + 4;
npdf.setFillColor(239, 246, 255);
const shiftLabel = '8am-4pm';
npdf.roundedRect(bx, ny + 0.5, npdf.getTextWidth(shiftLabel) + 6, 6, 1, 1, 'F');
npdf.setFont('helvetica', 'normal'); npdf.setFontSize(6.5); npdf.setTextColor(...BLUE_TEXT);
npdf.text(shiftLabel, bx + 3, ny + 4.5); bx += npdf.getTextWidth(shiftLabel) + 9;
npdf.setFillColor(...GREEN_BG); npdf.roundedRect(bx, ny + 0.5, npdf.getTextWidth('Happy') + 6, 6, 1, 1, 'F');
npdf.setTextColor(...GREEN_TEXT); npdf.text('Happy', bx + 3, ny + 4.5); ny += 8;

npdf.setFont('helvetica', 'normal'); npdf.setFontSize(7); npdf.setTextColor(...LIGHT);
npdf.text('Sleep: Good', NML + 6, ny + 3);
npdf.text('Staff: Prabhjot Kaur  \u00b7  Tuesday', NML + 40, ny + 3); ny += 7;

// Content
const noteContent = `31/03/26. Writer commenced shift at 8:00AM. Nathan was awake and lying in bed upon arrival. Writer greeted Nathan and he appeared well-rested and in good spirits. Supported Nathan with morning personal care including shower, teeth brushing, and getting dressed. Nathan was cooperative throughout and chose his own clothing for the day.

Morning medication was administered at 8:30AM as per medication chart. BSL reading was taken and recorded at 6.2 mmol/L which is within normal range. Breakfast was prepared at 9:00AM consisting of scrambled eggs on toast with a cup of tea. Nathan ate most of his breakfast and reported that he enjoyed the eggs.

Writer completed household chores including wiping the kitchen, cleaning the bathroom, vacuuming the lounge and bedroom, and taking out the rubbish bins. At 10:00AM, Nathan requested to sit outside on the front porch. Writer assisted Nathan with his walker to the porch area. Nathan sat outside for approximately 30 minutes. The weather was pleasant and Nathan appeared to enjoy being outdoors.

At 11:00AM, Nathan had a snack of banana and water. Writer engaged Nathan in conversation about his family and Nathan shared stories which he appeared to enjoy. Nathan spent the late morning watching a cooking show on television.

Lunch was prepared at 12:30PM consisting of chicken and vegetable stir fry with rice. Nathan ate well. After lunch Nathan rested in his room for approximately one hour. At 2:30PM Nathan was awake and writer assisted him back to the lounge. Nathan had afternoon tea consisting of tea with milk and a biscuit. Writer completed remaining household duties including folding laundry and wiping kitchen surfaces. Nathan was comfortable and settled watching television. Nil concerns during the shift. Handover provided at 4:00PM.`;

npdf.setFont('helvetica', 'normal'); npdf.setFontSize(8); npdf.setTextColor(...MED);
const lines = npdf.splitTextToSize(noteContent, NCW - 16);
for (const line of lines) { npdf.text(line, NML + 6, ny); ny += 3.5; }
ny += 4;

// Info boxes
function drawInfoBox(label, text, bgColor, borderColor, textColor, labelColor) {
  npdf.setFont('helvetica', 'normal'); npdf.setFontSize(8);
  const blines = npdf.splitTextToSize(text, NCW - 24);
  const boxH = 6 + blines.length * 3.5 + 4;
  npdf.setFillColor(...bgColor); npdf.roundedRect(NML + 4, ny, NCW - 8, boxH, 1.5, 1.5, 'F');
  npdf.setFillColor(...borderColor); npdf.rect(NML + 4, ny, 1.2, boxH, 'F');
  npdf.setFont('helvetica', 'bold'); npdf.setFontSize(7); npdf.setTextColor(...labelColor); npdf.text(label.toUpperCase(), NML + 10, ny + 5);
  npdf.setFont('helvetica', 'normal'); npdf.setFontSize(8); npdf.setTextColor(...textColor); npdf.text(blines, NML + 10, ny + 9.5);
  ny += boxH + 2;
}

drawInfoBox('BSL Reading', '6.2 at 8:30am', AMBER_BG, AMBER_BORDER, AMBER_TEXT, AMBER_TEXT);
drawInfoBox('Medication', 'Morning meds administered at 8:30am as per chart', BLUE_BG, [59, 130, 246], BLUE_TEXT, BLUE_TEXT);
drawInfoBox('Meals', 'Breakfast: scrambled eggs on toast, tea. Snack: banana. Lunch: chicken & vegetable stir fry, rice. Afternoon tea: tea, biscuit.', GREEN_BG, OLF_GREEN, GREEN_TEXT, GREEN_TEXT);
drawInfoBox('Activities', 'Sat outside on front porch (30 mins), watched cooking show, conversation about family, afternoon rest', [248, 250, 252], BORDER, MED, DARK);

// Footer
const fy = PAGE_H - NMT;
npdf.setDrawColor(...BORDER); npdf.setLineWidth(0.3); npdf.line(NML, fy - 4, PAGE_W - NMR, fy - 4);
npdf.setFont('helvetica', 'normal'); npdf.setFontSize(7); npdf.setTextColor(...LIGHT);
npdf.text('One Life Foundation Pty Ltd  |  1300 ONE LIFE  |  onelifefoundation.com.au', NML, fy);
npdf.text('Page 1', PAGE_W - NMR, fy, { align: 'right' });

try { unlinkSync(`${outDir}/OLF-Progress-Notes-Nathan-Gottaas-2026-03-30-to-2026-03-31.pdf`); } catch {}
try { unlinkSync(`${outDir}/OLF-Progress-Notes-Nathan-Gottaas-2026-03-31-to-2026-03-31.pdf`); } catch {}
writeFileSync(`${outDir}/OLF-Progress-Notes-Nathan-Gottaas-2026-03-31-to-2026-03-31.pdf`, Buffer.from(npdf.output('arraybuffer')));
console.log('Progress Notes Mar 31: 8am-4pm (8 hrs)');

console.log('\nAll done. Summary:');
console.log('  Roster: Dec 29-Jan 1 + Mar 23-27 + Mar 30 + Mar 31 (combined)');
console.log('  Invoice Mar 23-27: 14 hrs @ $42 = $588 (unchanged)');
console.log('  Invoice Mar 31: 8 hrs @ $42 = $336');
console.log('  Notes Mar 23-27: 3 notes (unchanged)');
console.log('  Notes Mar 31: 1 note (8am-4pm)');
