import { jsPDF } from 'jspdf';
import { writeFileSync, unlinkSync } from 'fs';

const PAGE_W = 210, PAGE_H = 297;
const ML = 18, MR = 18, MT = 18;
const CW = PAGE_W - ML - MR;
const PW = 297, PH = 210;

const PARTICIPANT = { name: 'Nathan Gottaas', ndis: '430323224', address: '30 Curtin Avenue, Lalor VIC 3042' };
const STAFF = 'Prabhjot Kaur';

const PRABHJOT = {
  first_name: 'Prabhjot', last_name: 'Kaur',
  abn: null, phone: '0414237347', email: 'babbucheema017@gmail.com',
  bsb: '063788', bank_account: '10215745',
  weekday: 42,
};

const outDir = 'C:/Users/kevin/OneDrive/Desktop/nathan';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. INVOICE — Mar 31 only (14 hrs)
// ═══════════════════════════════════════════════════════════════════════════════

function labelValue(pdf, label, value, x, y) {
  pdf.setFont('helvetica', 'bold'); pdf.text(label, x, y);
  const w = pdf.getTextWidth(label);
  pdf.setFont('helvetica', 'normal'); pdf.text(value || '', x + w + 1, y);
}

function generateInvoice() {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const staffName = `${PRABHJOT.first_name} ${PRABHJOT.last_name}`;
  let y = 22;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.setTextColor(0, 0, 0);
  pdf.text('SUPPORT WORKER INVOICE (7 DAY SHEET)', PAGE_W / 2, y, { align: 'center' });
  y += 3; pdf.setDrawColor(0, 50, 160); pdf.setLineWidth(0.7); pdf.line(ML, y, PAGE_W - MR, y); y += 14;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Support Worker Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Name: ', staffName, ML, y); y += 6;
  labelValue(pdf, 'Phone: ', PRABHJOT.phone, ML, y); y += 6;
  labelValue(pdf, 'Email: ', PRABHJOT.email, ML, y); y += 14;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Invoice To', ML, y); y += 9;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text('One Life Foundation Pty Ltd (OLF)', ML + 2, y); y += 14;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Invoice Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Invoice Number: ', 'PK-002', ML, y); y += 6;
  labelValue(pdf, 'Invoice Date: ', '01/04/2026', ML, y);
  labelValue(pdf, 'Payment Due: ', '08/04/2026', ML + 80, y); y += 14;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Participant Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Participant Name: ', PARTICIPANT.name, ML, y); y += 6;
  labelValue(pdf, 'NDIS Number: ', PARTICIPANT.ndis, ML, y); y += 6;
  labelValue(pdf, 'Service Address: ', PARTICIPANT.address, ML, y); y += 12;

  pdf.setFillColor(0, 0, 0); pdf.rect(ML, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(255, 255, 255);
  pdf.text('Service Period: 31 March 2026', ML + 3, y + 5);
  pdf.setTextColor(0, 0, 0); y += 9;

  const colWidths = [24, 14, 28, 22, 22, 16, 20, CW - 146];
  const colPos = []; let cx = ML;
  for (const w of colWidths) { colPos.push(cx); cx += w; }
  const headers = ['Day', 'Date', 'Service Type', 'Start', 'End', 'Hours', 'Rate ($)', 'Total ($)'];

  pdf.setFillColor(220, 220, 220); pdf.rect(ML, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0);
  headers.forEach((h, i) => pdf.text(h, colPos[i] + 2, y + 5)); y += 8;

  // Single row: Tuesday 31/03, 6AM-8PM, 14 hrs
  const rate = PRABHJOT.weekday;
  const total = 14 * rate;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0);
  pdf.text('Tuesday', colPos[0] + 2, y + 4);
  pdf.text('31/03', colPos[1] + 2, y + 4);
  pdf.text('At home care', colPos[2] + 2, y + 4);
  pdf.text('6:00AM', colPos[3] + 2, y + 4);
  pdf.text('8:00PM', colPos[4] + 2, y + 4);
  pdf.text('14', colPos[5] + 2, y + 4);
  pdf.text(String(rate), colPos[6] + 2, y + 4);
  pdf.text(total.toFixed(2), colPos[7] + 2, y + 4);
  pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.15);
  pdf.line(ML, y + 6, ML + CW, y + 6); y += 13;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Payment Summary', ML, y); y += 10;
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  const rX = PAGE_W - MR;
  pdf.text(`Weekday Hours: 14 hrs x $${rate}/hr`, ML, y);
  pdf.text(`$${total.toFixed(2)}`, rX, y, { align: 'right' }); y += 8;

  pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.5); pdf.line(ML, y, PAGE_W - MR, y); y += 7;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
  pdf.text('TOTAL:', ML, y); pdf.text(`$${total.toFixed(2)}`, rX, y, { align: 'right' }); y += 14;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Bank Details', ML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Account Name: ', staffName, ML, y); y += 6;
  labelValue(pdf, 'BSB: ', PRABHJOT.bsb, ML, y); y += 6;
  labelValue(pdf, 'Account Number: ', PRABHJOT.bank_account, ML, y); y += 10;

  pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2); pdf.line(ML, y, PAGE_W - MR, y); y += 5;
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7.5); pdf.setTextColor(130, 130, 130);
  pdf.text('This invoice was generated through the One Life Foundation NDIS Contractor Portal (onelifefoundationndis.app)', PAGE_W / 2, y, { align: 'center' });

  return pdf;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ROSTER — Period 1 (23-27) unchanged + Period 2 only Mar 31
// ═══════════════════════════════════════════════════════════════════════════════

function generateRoster() {
  const NAVY = [26, 42, 58], WHITE = [255, 255, 255], DARK = [30, 41, 59];
  const MED = [100, 116, 139], BORDER = [226, 232, 240], AMBER = [245, 158, 11];
  const RML = 12, RMR = 12, RMT = 8, RCW = PW - RML - RMR;

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const rX = PW - RMR;

  function drawPage(title, dateRange, weekLabel, shifts) {
    let y = RMT + 6;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(26, 42, 58);
    pdf.text('Roster Schedule ', RML, y + 8);
    pdf.setTextColor(...AMBER);
    pdf.text('March 2026', RML + pdf.getTextWidth('Roster Schedule '), y + 8);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MED);
    pdf.text(`Nathan Gottaas  |  NDIS: 430323224  |  ${dateRange}`, RML, y + 14);
    pdf.setFontSize(8);
    pdf.text('One Life Foundation Pty Ltd', rX, y, { align: 'right' });
    pdf.text('1300 ONE LIFE', rX, y + 5, { align: 'right' });
    y += 22;

    pdf.setFillColor(...NAVY); pdf.roundedRect(RML, y, RCW, 8, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...WHITE);
    pdf.text('Weekly Participant Schedule', RML + 4, y + 5.5);
    pdf.text(weekLabel, rX - 4, y + 5.5, { align: 'right' }); y += 10;

    const cols = [RML, RML + 18, RML + 34, RML + 92, RML + 150, RML + 230];
    const colW = [18, 16, 58, 58, 80, 43];
    const hdrs = ['Date', 'Day', 'Staff', 'Shift Times', 'Service Type', 'Notes'];
    pdf.setFillColor(...NAVY);
    for (let i = 0; i < cols.length; i++) pdf.rect(cols[i], y, colW[i], 10, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(...WHITE);
    hdrs.forEach((h, i) => pdf.text(h, cols[i] + 2, y + 6.5)); y += 10;

    for (const s of shifts) {
      pdf.setFillColor(...WHITE);
      for (let i = 0; i < cols.length; i++) {
        pdf.rect(cols[i], y, colW[i], 12, 'FD');
        pdf.setDrawColor(...BORDER); pdf.setLineWidth(0.2); pdf.rect(cols[i], y, colW[i], 12, 'S');
      }
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...DARK);
      pdf.text(s.date, cols[0] + 2, y + 7);
      pdf.text(s.day, cols[1] + 2, y + 7);
      pdf.text(s.staff, cols[2] + 2, y + 7);
      pdf.text(s.times, cols[3] + 2, y + 7);
      pdf.text(s.type, cols[4] + 2, y + 7);
      pdf.setFont('helvetica', 'italic'); pdf.setFontSize(6); pdf.setTextColor(...MED);
      pdf.text(s.notes || '', cols[5] + 2, y + 7);
      y += 12;
    }

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(...MED);
    pdf.text('Roster Schedule \u2014 Nathan Gottaas \u2014 Prabhjot Kaur \u2014 March 2026 | One Life Foundation Pty Ltd', PW / 2, PH - 6, { align: 'center' });
  }

  // Page 1: 23-27 Mar
  drawPage('Roster', '23 March \u2013 27 March 2026', '23 \u2013 27 March 2026', [
    { date: '23/03', day: 'Mon', staff: 'Prabhjot Kaur', times: '9:00AM \u2013 1:00PM', type: 'At home care (4 hrs)', notes: 'Complete' },
    { date: '25/03', day: 'Wed', staff: 'Prabhjot Kaur', times: '9:00AM \u2013 1:00PM', type: 'At home care (4 hrs)', notes: 'Complete' },
    { date: '27/03', day: 'Fri', staff: 'Prabhjot Kaur', times: '8:00AM \u2013 2:00PM', type: 'At home care (6 hrs)', notes: 'Complete' },
  ]);

  // Page 2: 31 Mar ONLY (no 30th)
  pdf.addPage();
  drawPage('Roster', '31 March 2026', '31 March 2026', [
    { date: '31/03', day: 'Tue', staff: 'Prabhjot Kaur', times: '6:00AM \u2013 8:00PM', type: 'At home care (14 hrs)', notes: 'Complete' },
  ]);

  return pdf;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PROGRESS NOTES — Period 1 unchanged + Only Mar 31 (14 hr shift)
// ═══════════════════════════════════════════════════════════════════════════════

function generateNotesPDF(notes, fromDate, toDate) {
  const OLF_GREEN = [14, 160, 62];
  const DARK = [30, 41, 59], MED = [71, 85, 105], LIGHT = [148, 163, 184];
  const BORDER = [226, 232, 240];
  const AMBER_BG = [255, 251, 235], AMBER_BORDER = [245, 158, 11], AMBER_TEXT = [146, 64, 14];
  const GREEN_BG = [240, 253, 244], GREEN_TEXT = [22, 101, 52];
  const BLUE_BG = [239, 246, 255], BLUE_TEXT = [30, 64, 175];
  const HEADER_H = 28;
  const BODY_TOP = MT + HEADER_H + 4;
  const BODY_BOTTOM = PAGE_H - MT - 14;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let pageNum = 1, y = BODY_TOP;

  function drawHeader() {
    pdf.setFillColor(...OLF_GREEN); pdf.rect(0, 0, PAGE_W, MT + HEADER_H, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(255, 255, 255);
    pdf.text('Progress Notes Report', ML, MT + 10);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.text(`${PARTICIPANT.name}  |  From: ${fromDate}  |  To: ${toDate}`, ML, MT + 18);
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, PAGE_W - MR, MT + 18, { align: 'right' });
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
    pdf.text(`${notes.length} note${notes.length !== 1 ? 's' : ''}`, PAGE_W - MR, MT + 10, { align: 'right' });
  }
  function drawFooter() {
    const fy = PAGE_H - MT;
    pdf.setDrawColor(...BORDER); pdf.setLineWidth(0.3); pdf.line(ML, fy - 4, PAGE_W - MR, fy - 4);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...LIGHT);
    pdf.text('One Life Foundation Pty Ltd  |  1300 ONE LIFE  |  onelifefoundation.com.au', ML, fy);
    pdf.text(`Page ${pageNum}`, PAGE_W - MR, fy, { align: 'right' });
  }
  function newPage() { drawFooter(); pdf.addPage(); pageNum++; drawHeader(); y = BODY_TOP; }
  function ensureSpace(n) { if (y + n > BODY_BOTTOM) newPage(); }
  function drawInfoBox(label, text, bgColor, borderColor, textColor, labelColor) {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
    const lines = pdf.splitTextToSize(text, CW - 24);
    const boxH = 6 + lines.length * 3.5 + 4;
    ensureSpace(boxH + 2);
    pdf.setFillColor(...bgColor); pdf.roundedRect(ML + 4, y, CW - 8, boxH, 1.5, 1.5, 'F');
    pdf.setFillColor(...borderColor); pdf.rect(ML + 4, y, 1.2, boxH, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...labelColor); pdf.text(label.toUpperCase(), ML + 10, y + 5);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...textColor); pdf.text(lines, ML + 10, y + 9.5);
    y += boxH + 2;
  }

  drawHeader();

  for (const note of notes) {
    ensureSpace(12);
    pdf.setFillColor(248, 250, 252); pdf.roundedRect(ML, y, CW, 8, 1.5, 1.5, 'F');
    pdf.setFillColor(...OLF_GREEN); pdf.rect(ML, y, 1.2, 8, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...DARK);
    const dateStr = new Date(note.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    pdf.text(dateStr, ML + 6, y + 5.5);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...LIGHT);
    pdf.text('1 note', PAGE_W - MR - 4, y + 5.5, { align: 'right' }); y += 12;

    ensureSpace(20);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...DARK);
    pdf.text(PARTICIPANT.name, ML + 6, y + 5);
    let bx = ML + 6 + pdf.getTextWidth(PARTICIPANT.name) + 4;

    pdf.setFillColor(239, 246, 255);
    const shiftW = pdf.getTextWidth(note.shift) + 6;
    pdf.roundedRect(bx, y + 0.5, shiftW, 6, 1, 1, 'F');
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(...BLUE_TEXT);
    pdf.text(note.shift, bx + 3, y + 4.5); bx += shiftW + 3;

    pdf.setFillColor(...GREEN_BG);
    const moodW = pdf.getTextWidth(note.mood) + 6;
    pdf.roundedRect(bx, y + 0.5, moodW, 6, 1, 1, 'F');
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(...GREEN_TEXT);
    pdf.text(note.mood, bx + 3, y + 4.5); y += 8;

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...LIGHT);
    pdf.text(`Sleep: ${note.sleep}`, ML + 6, y + 3);
    pdf.text(`Staff: ${STAFF}  \u00b7  ${note.day}`, ML + 40, y + 3); y += 7;

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MED);
    const contentLines = pdf.splitTextToSize(note.content, CW - 16);
    for (const line of contentLines) { ensureSpace(4); pdf.text(line, ML + 6, y); y += 3.5; }
    y += 4;

    if (note.bsl) drawInfoBox('BSL Reading', note.bsl, AMBER_BG, AMBER_BORDER, AMBER_TEXT, AMBER_TEXT);
    if (note.medication) drawInfoBox('Medication', note.medication, BLUE_BG, [59, 130, 246], BLUE_TEXT, BLUE_TEXT);
    if (note.meals) drawInfoBox('Meals', note.meals, GREEN_BG, OLF_GREEN, GREEN_TEXT, GREEN_TEXT);
    if (note.activities) drawInfoBox('Activities', note.activities, [248, 250, 252], BORDER, MED, DARK);
    y += 6;
  }
  drawFooter();
  return pdf;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE
// ═══════════════════════════════════════════════════════════════════════════════

// Delete old clashing files
try { unlinkSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar30-31.pdf`); } catch {}
try { unlinkSync(`${outDir}/Roster_Nathan_Gottaas_Prabhjot_Mar23-31.pdf`); } catch {}
try { unlinkSync(`${outDir}/OLF-Progress-Notes-Nathan-Gottaas-2026-03-30-to-2026-03-31.pdf`); } catch {}

// Invoice — Mar 31 only, 14 hrs
const invPdf = generateInvoice();
writeFileSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar31.pdf`, Buffer.from(invPdf.output('arraybuffer')));
console.log('Invoice Mar 31: 14 hrs @ $42 = $588.00');

// Roster — 23-27 + 31 only (no 30th)
const rosterPdf = generateRoster();
writeFileSync(`${outDir}/Roster_Nathan_Gottaas_Prabhjot_Mar23-27_and_Mar31.pdf`, Buffer.from(rosterPdf.output('arraybuffer')));
console.log('Roster: 23-27 Mar + 31 Mar (no 30th)');

// Progress notes Period 1 — unchanged (already generated, keep it)
console.log('Progress Notes 23-27 Mar: already saved (3 notes, no changes needed)');

// Progress notes Period 2 — Mar 31 only (14 hr shift)
const notes31 = [{
  date: '2026-03-31', day: 'Tuesday', shift: '6am-8pm', mood: 'Happy', sleep: 'Good',
  content: `31/03/26. Writer commenced shift at 6:00AM. Nathan was asleep upon arrival. Writer prepared the house for the morning including opening curtains and preparing the kitchen area. Nathan woke at approximately 6:45AM. Writer supported Nathan with morning routine including shower, teeth brushing, and getting dressed. Nathan was cooperative and appeared well-rested.

Morning medication was administered at 7:15AM as per medication chart. BSL reading was taken and recorded at 6.5 mmol/L which is within normal range. Breakfast was prepared at 7:30AM consisting of Weet-Bix with milk and a cup of tea. Nathan consumed well.

Writer completed household duties throughout the morning including cleaning the bathroom, vacuuming all rooms, mopping the kitchen and laundry, and doing two loads of laundry. Nathan spent the morning watching television and appeared relaxed.

At 10:00AM, Nathan had a snack of biscuits and water. Writer engaged Nathan in light seated exercises including arm stretches and ankle rotations. Nathan participated for approximately 15 minutes.

At 11:30AM, writer supported Nathan with a short walk around the block using his walker. Nathan managed well and appeared to enjoy the outing. Returned home at approximately 12:00PM.

Lunch was prepared at 12:30PM consisting of chicken and salad wrap with juice. Nathan ate well. After lunch, Nathan requested to rest in bed. Writer assisted Nathan to his room and he rested for approximately one and a half hours.

At 2:30PM, Nathan was awake and writer assisted him to the lounge. Nathan had afternoon tea consisting of tea with milk and fruit. Nathan spent the afternoon watching television and appeared comfortable.

At 4:00PM, writer completed further household chores including folding and putting away laundry, wiping kitchen surfaces, and preparing items for dinner. At 5:00PM, writer supported Nathan with personal care including change of clothing and freshening up before dinner.

Dinner was prepared at 6:00PM. Nathan had spaghetti bolognese with garlic bread. Nathan ate most of his dinner and reported that he enjoyed the meal. Evening medication was administered at 6:30PM as per medication chart. BSL reading taken at 7:00PM recorded at 7.3 mmol/L.

Nathan watched television for the remainder of the evening. At 7:30PM, Nathan had a cup of tea and a biscuit. Writer supported Nathan with nighttime routine at 7:45PM including teeth brushing and getting changed into pyjamas. Nathan settled into bed at approximately 8:00PM. Writer ensured the house was tidy, all doors and windows were locked, and lights were turned off. Nil concerns throughout the shift. Handover notes prepared for next support worker.`,
  bsl: '6.5 at 7:15am, 7.3 at 7pm',
  medication: 'Morning meds at 7:15am, evening meds at 6:30pm — both as per chart',
  meals: 'Breakfast: Weet-Bix, milk, tea. Snack: biscuits. Lunch: chicken & salad wrap, juice. Afternoon tea: tea, fruit. Dinner: spaghetti bolognese, garlic bread. Supper: tea, biscuit.',
  activities: 'Seated exercises (15 mins), walk around block with walker (30 mins), afternoon rest, watched TV, chose own activities',
}];

const notesPdf = generateNotesPDF(notes31, '31 Mar 2026', '31 Mar 2026');
writeFileSync(`${outDir}/OLF-Progress-Notes-Nathan-Gottaas-2026-03-31-to-2026-03-31.pdf`, Buffer.from(notesPdf.output('arraybuffer')));
console.log('Progress Notes Mar 31: 1 note (6AM-8PM, 14 hrs)');

console.log('\nDone. No Mar 30 in any Prabhjot docs.');
