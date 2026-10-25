import { jsPDF } from 'jspdf';
import { writeFileSync, unlinkSync } from 'fs';

const PAGE_W = 210, PAGE_H = 297;
const ML = 18, MR = 18, MT = 18;
const CW = PAGE_W - ML - MR;
const PW = 297, PH = 210;

const PARTICIPANT = { name: 'Nathan Gottaas', ndis: '430323224', address: '30 Curtin Avenue, Lalor VIC 3042' };
const PRABHJOT = {
  first_name: 'Prabhjot', last_name: 'Kaur',
  phone: '0414237347', email: 'babbucheema017@gmail.com',
  bsb: '063788', bank_account: '10215745', weekday: 42,
};

const outDir = 'C:/Users/kevin/OneDrive/Desktop/nathan';
const SERVICE_TYPE = 'Community Participation';

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFTS
// ═══════════════════════════════════════════════════════════════════════════════

const SHIFTS_P1 = [
  { day: 'Monday',    date: '23/03', start: '10:00AM', end: '1:00PM',  hours: 3 },
  { day: 'Tuesday',   date: '24/03', start: '10:00AM', end: '1:00PM',  hours: 3 },
  { day: 'Wednesday', date: '25/03', start: '10:00AM', end: '1:00PM',  hours: 3 },
  { day: 'Thursday',  date: '26/03', start: '10:00AM', end: '1:00PM',  hours: 3 },
  { day: 'Friday',    date: '27/03', start: '10:00AM', end: '12:00PM', hours: 2 },
];

const SHIFTS_P2 = [
  { day: 'Tuesday', date: '31/03', start: '8:00AM', end: '4:00PM', hours: 8 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 1. INVOICES
// ═══════════════════════════════════════════════════════════════════════════════

function labelValue(pdf, label, value, x, y) {
  pdf.setFont('helvetica', 'bold'); pdf.text(label, x, y);
  pdf.setFont('helvetica', 'normal'); pdf.text(value || '', x + pdf.getTextWidth(label) + 1, y);
}

function generateInvoice(shifts, invoiceNum, invoiceDate, paymentDue, servicePeriod) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const IML = 20, ICW = PAGE_W - IML - 20;
  let y = 22;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.setTextColor(0, 0, 0);
  pdf.text('SUPPORT WORKER INVOICE (7 DAY SHEET)', PAGE_W / 2, y, { align: 'center' });
  y += 3; pdf.setDrawColor(0, 50, 160); pdf.setLineWidth(0.7); pdf.line(IML, y, PAGE_W - 20, y); y += 14;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Support Worker Details', IML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Name: ', `${PRABHJOT.first_name} ${PRABHJOT.last_name}`, IML, y); y += 6;
  labelValue(pdf, 'Phone: ', PRABHJOT.phone, IML, y); y += 6;
  labelValue(pdf, 'Email: ', PRABHJOT.email, IML, y); y += 14;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Invoice To', IML, y); y += 9;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.text('One Life Foundation Pty Ltd (OLF)', IML + 2, y); y += 14;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Invoice Details', IML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Invoice Number: ', invoiceNum, IML, y); y += 6;
  labelValue(pdf, 'Invoice Date: ', invoiceDate, IML, y);
  labelValue(pdf, 'Payment Due: ', paymentDue, IML + 80, y); y += 14;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Participant Details', IML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Participant Name: ', PARTICIPANT.name, IML, y); y += 6;
  labelValue(pdf, 'NDIS Number: ', PARTICIPANT.ndis, IML, y); y += 6;
  labelValue(pdf, 'Service Address: ', PARTICIPANT.address, IML, y); y += 12;

  pdf.setFillColor(0, 0, 0); pdf.rect(IML, y, ICW, 7, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(255, 255, 255);
  pdf.text(`Service Period: ${servicePeriod}`, IML + 3, y + 5);
  pdf.setTextColor(0, 0, 0); y += 9;

  const cWidths = [24, 14, 34, 22, 22, 16, 20, ICW - 152];
  const cp = []; let cx = IML; for (const w of cWidths) { cp.push(cx); cx += w; }
  pdf.setFillColor(220, 220, 220); pdf.rect(IML, y, ICW, 7, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
  ['Day', 'Date', 'Service Type', 'Start', 'End', 'Hours', 'Rate ($)', 'Total ($)'].forEach((h, i) => pdf.text(h, cp[i] + 2, y + 5));
  y += 8;

  let total = 0;
  for (const s of shifts) {
    const amt = s.hours * PRABHJOT.weekday;
    total += amt;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0);
    pdf.text(s.day, cp[0] + 2, y + 4);
    pdf.text(s.date, cp[1] + 2, y + 4);
    pdf.text(SERVICE_TYPE, cp[2] + 2, y + 4);
    pdf.text(s.start, cp[3] + 2, y + 4);
    pdf.text(s.end, cp[4] + 2, y + 4);
    pdf.text(String(s.hours), cp[5] + 2, y + 4);
    pdf.text(String(PRABHJOT.weekday), cp[6] + 2, y + 4);
    pdf.text(amt.toFixed(2), cp[7] + 2, y + 4);
    pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.15); pdf.line(IML, y + 6, IML + ICW, y + 6);
    y += 7;
  }
  y += 6;

  const totalHrs = shifts.reduce((s, x) => s + x.hours, 0);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Payment Summary', IML, y); y += 10;
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  const rX = PAGE_W - 20;
  pdf.text(`Weekday Hours: ${totalHrs} hrs x $${PRABHJOT.weekday}/hr`, IML, y);
  pdf.text(`$${total.toFixed(2)}`, rX, y, { align: 'right' }); y += 8;
  pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.5); pdf.line(IML, y, rX, y); y += 7;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
  pdf.text('TOTAL:', IML, y); pdf.text(`$${total.toFixed(2)}`, rX, y, { align: 'right' }); y += 14;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Bank Details', IML, y); y += 10;
  pdf.setFontSize(10);
  labelValue(pdf, 'Account Name: ', `${PRABHJOT.first_name} ${PRABHJOT.last_name}`, IML, y); y += 6;
  labelValue(pdf, 'BSB: ', PRABHJOT.bsb, IML, y); y += 6;
  labelValue(pdf, 'Account Number: ', PRABHJOT.bank_account, IML, y); y += 10;

  pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2); pdf.line(IML, y, rX, y); y += 5;
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7.5); pdf.setTextColor(130, 130, 130);
  pdf.text('This invoice was generated through the One Life Foundation NDIS Contractor Portal (onelifefoundationndis.app)', PAGE_W / 2, y, { align: 'center' });

  return { pdf, total };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ROSTER
// ═══════════════════════════════════════════════════════════════════════════════

function generateRoster() {
  const NAVY = [26, 42, 58], WHITE = [255, 255, 255], DARK = [30, 41, 59];
  const MED = [100, 116, 139], BORDER = [226, 232, 240], AMBER = [245, 158, 11];
  const RML = 12, RCW = PW - RML - 12, rX = PW - 12;

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  function drawPage(dateRange, weekLabel, shifts) {
    let y = 14;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(26, 42, 58);
    pdf.text('Roster Schedule ', RML, y + 8);
    pdf.setTextColor(...AMBER); pdf.text('March 2026', RML + pdf.getTextWidth('Roster Schedule '), y + 8);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MED);
    pdf.text(`Nathan Gottaas  |  NDIS: 430323224  |  ${dateRange}`, RML, y + 14);
    pdf.setFontSize(8); pdf.text('One Life Foundation Pty Ltd', rX, y, { align: 'right' });
    y += 22;

    pdf.setFillColor(...NAVY); pdf.roundedRect(RML, y, RCW, 8, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...WHITE);
    pdf.text('Weekly Participant Schedule', RML + 4, y + 5.5);
    pdf.text(weekLabel, rX - 4, y + 5.5, { align: 'right' }); y += 10;

    const cols = [RML, RML + 18, RML + 34, RML + 92, RML + 150, RML + 230];
    const colW = [18, 16, 58, 58, 80, 43];
    pdf.setFillColor(...NAVY);
    for (let i = 0; i < cols.length; i++) pdf.rect(cols[i], y, colW[i], 10, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(...WHITE);
    ['DATE', 'DAY', 'STAFF', 'SHIFT TIMES', 'SERVICE TYPE', 'PN'].forEach((h, i) => pdf.text(h, cols[i] + 2, y + 6.5));
    y += 10;

    for (const s of shifts) {
      pdf.setFillColor(...WHITE);
      for (let i = 0; i < cols.length; i++) { pdf.rect(cols[i], y, colW[i], 12, 'FD'); pdf.setDrawColor(...BORDER); pdf.setLineWidth(0.2); pdf.rect(cols[i], y, colW[i], 12, 'S'); }
      const vals = [s.date, s.day, s.staff, s.times, s.type, s.pn || 'Complete'];
      for (let i = 0; i < vals.length; i++) {
        if (i === 5) { pdf.setFont('helvetica', 'italic'); pdf.setFontSize(6); pdf.setTextColor(...MED); }
        else { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...DARK); }
        pdf.text(vals[i], cols[i] + 2, y + 7.5);
      }
      y += 12;
    }

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(...MED);
    pdf.text('Roster Schedule \u2014 Nathan Gottaas \u2014 Prabhjot Kaur \u2014 March 2026 | One Life Foundation Pty Ltd', PW / 2, PH - 6, { align: 'center' });
  }

  // Page 1: 23-27 Mar
  drawPage('23 March \u2013 27 March 2026', '23 \u2013 27 March 2026', [
    { date: '23/03', day: 'Mon', staff: 'Prabhjot Kaur', times: '10:00AM \u2013 1:00PM', type: `${SERVICE_TYPE} (3 hrs)` },
    { date: '24/03', day: 'Tue', staff: 'Prabhjot Kaur', times: '10:00AM \u2013 1:00PM', type: `${SERVICE_TYPE} (3 hrs)` },
    { date: '25/03', day: 'Wed', staff: 'Prabhjot Kaur', times: '10:00AM \u2013 1:00PM', type: `${SERVICE_TYPE} (3 hrs)` },
    { date: '26/03', day: 'Thu', staff: 'Prabhjot Kaur', times: '10:00AM \u2013 1:00PM', type: `${SERVICE_TYPE} (3 hrs)` },
    { date: '27/03', day: 'Fri', staff: 'Prabhjot Kaur', times: '10:00AM \u2013 12:00PM', type: `${SERVICE_TYPE} (2 hrs)` },
  ]);

  // Page 2: 31 Mar
  pdf.addPage();
  drawPage('31 March 2026', '31 March 2026', [
    { date: '31/03', day: 'Tue', staff: 'Prabhjot Kaur', times: '8:00AM \u2013 4:00PM', type: `${SERVICE_TYPE} (8 hrs)` },
  ]);

  return pdf;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PROGRESS NOTES
// ═══════════════════════════════════════════════════════════════════════════════

const NOTES = [
  {
    date: '2026-03-23', day: 'Monday', shift: '10am-1pm', mood: 'Happy', sleep: 'Good',
    content: `23/03/26. Writer commenced shift at 10:00AM for community participation support. Nathan was awake and in the lounge. Writer discussed outing plans with Nathan and he chose to go to the local shopping centre. Writer supported Nathan with getting ready for the outing including shoes and jacket.\n\nAt 10:30AM, writer supported Nathan with his walker to the car. Drove to Epping Plaza shopping centre. Nathan walked through the centre using his walker and browsed several shops. Nathan purchased a magazine from the newsagent. Nathan appeared to enjoy the outing and engaged in conversation with writer about items in the shops.\n\nAt 12:00PM, Nathan and writer had lunch at the food court. Nathan chose a chicken wrap and juice. Nathan ate well and appeared happy. Returned home at approximately 12:45PM. Nathan settled in the lounge. Nil concerns. Shift ended at 1:00PM.`,
    meals: 'Lunch: chicken wrap, juice (food court outing).',
    activities: 'Community access \u2014 Epping Plaza shopping centre, browsed shops, purchased magazine, lunch at food court (2.5 hrs)',
  },
  {
    date: '2026-03-24', day: 'Tuesday', shift: '10am-1pm', mood: 'Content', sleep: 'Good',
    content: `24/03/26. Writer commenced shift at 10:00AM for community participation support. Nathan was watching television upon arrival. Writer discussed activity options with Nathan. Nathan expressed interest in going to the park.\n\nAt 10:30AM, writer supported Nathan to get ready and drove to Edwardes Lake Park in Reservoir. Nathan walked along the path using his walker for approximately 20 minutes. Nathan appeared to enjoy the fresh air and scenery. Sat on a bench near the lake and watched the ducks.\n\nAt 11:30AM, Nathan requested a coffee. Writer and Nathan drove to a nearby cafe. Nathan had a flat white and a blueberry muffin. Nathan engaged in conversation and was in good spirits throughout.\n\nReturned home at approximately 12:40PM. Nathan settled back in the lounge comfortably. Nil concerns during the outing. Shift ended at 1:00PM.`,
    meals: 'Snack: flat white coffee, blueberry muffin (cafe outing).',
    activities: 'Community access \u2014 Edwardes Lake Park walk with walker (20 mins), cafe visit, watched ducks at the lake (2.5 hrs)',
  },
  {
    date: '2026-03-25', day: 'Wednesday', shift: '10am-1pm', mood: 'Happy', sleep: 'Good',
    content: `25/03/26. Writer commenced shift at 10:00AM for community participation support. Nathan was in the lounge and appeared in good spirits. Writer discussed options for the day and Nathan wanted to go to the library and then get some fresh air.\n\nAt 10:20AM, writer supported Nathan to the car and drove to Lalor Library. Nathan browsed the shelves and selected two books to borrow. Nathan appeared to enjoy choosing his books and showed them to writer. Spent approximately 40 minutes at the library.\n\nAt 11:15AM, drove to a nearby park. Nathan sat on a bench and read one of his new books for approximately 20 minutes. Writer and Nathan had a snack that writer had prepared consisting of apple slices and water.\n\nAt 12:00PM, writer drove Nathan to Woolworths Lalor. Nathan walked through the store with his walker and purchased some snacks and a drink for home. Nathan was cooperative and engaged throughout.\n\nReturned home at approximately 12:45PM. Nathan was happy with his outing. Nil concerns. Shift ended at 1:00PM.`,
    meals: 'Snack: apple slices, water.',
    activities: 'Community access \u2014 Lalor Library (borrowed 2 books, 40 mins), park visit, Woolworths shopping (2.5 hrs)',
  },
  {
    date: '2026-03-26', day: 'Thursday', shift: '10am-1pm', mood: 'Content', sleep: 'Good',
    content: `26/03/26. Writer commenced shift at 10:00AM for community participation support. Nathan was resting in bed and stated he was feeling a bit tired today. Writer encouraged Nathan to get ready for a shorter outing. Nathan agreed and got dressed with minimal assistance.\n\nAt 10:40AM, writer supported Nathan to the car and drove to Thomastown Recreation and Aquatic Centre. Nathan sat in the cafe area and watched other people in the facility. Nathan had a cup of tea and a biscuit. Writer engaged Nathan in conversation about his interests and family.\n\nAt 11:45AM, Nathan and writer went for a short walk around the facility grounds. Nathan used his walker and managed well for approximately 15 minutes.\n\nAt 12:15PM, drove to the local shops. Nathan purchased a newspaper and a drink. Returned home at approximately 12:45PM. Nathan appeared more energised after the outing. Nil concerns. Shift ended at 1:00PM.`,
    meals: 'Snack: tea, biscuit (rec centre cafe). Purchased drink from shops.',
    activities: 'Community access \u2014 Thomastown Rec Centre cafe visit, short walk around grounds (15 mins), local shops (2 hrs)',
  },
  {
    date: '2026-03-27', day: 'Friday', shift: '10am-12pm', mood: 'Happy', sleep: 'Good',
    content: `27/03/26. Writer commenced shift at 10:00AM for community participation support. Nathan was in good spirits and ready to go out. Writer supported Nathan to get ready quickly.\n\nAt 10:15AM, writer and Nathan drove to the Lalor shops. Nathan walked through the shops using his walker. Nathan purchased a pie from the bakery and ate it while sitting on a bench outside. Nathan engaged in conversation with writer and appeared to enjoy the short outing.\n\nAt 11:15AM, drove to a nearby park for a short walk. Nathan walked for approximately 10 minutes along a flat path. Weather was pleasant. Returned home at approximately 11:50AM. Nathan settled in the lounge. Nil concerns. Shift ended at 12:00PM.`,
    meals: 'Snack: meat pie from bakery.',
    activities: 'Community access \u2014 Lalor shops, bakery, short park walk (10 mins) (2 hrs)',
  },
  {
    date: '2026-03-31', day: 'Tuesday', shift: '8am-4pm', mood: 'Happy', sleep: 'Good',
    content: `31/03/26. Writer commenced shift at 8:00AM for community participation support. Nathan was awake and in bed. Writer supported Nathan with morning routine including shower, teeth brushing, and getting dressed for the day out.\n\nMorning medication was administered at 8:30AM as per medication chart. BSL reading was taken and recorded at 6.2 mmol/L which is within normal range. Breakfast was prepared at 9:00AM consisting of scrambled eggs on toast with tea. Nathan ate well.\n\nAt 9:45AM, writer and Nathan left the house. Drove to Westfield Plenty Valley shopping centre in Mill Park. Nathan walked through the centre using his walker. Nathan browsed JB Hi-Fi and looked at DVDs. Nathan purchased two DVDs. Nathan appeared engaged and happy.\n\nAt 11:30AM, Nathan and writer had morning tea at a cafe in the centre. Nathan had a cappuccino and a slice of banana bread. Nathan was chatty and in very good spirits.\n\nAt 12:15PM, drove to Bundoora Park. Nathan walked along the path for approximately 25 minutes using his walker. Writer supported Nathan and they sat on a bench to rest. Nathan appeared to enjoy being outdoors.\n\nLunch was at 1:00PM at a nearby takeaway shop. Nathan had a chicken burger and chips. Nathan ate most of his lunch. After lunch, Nathan rested in the car for approximately 15 minutes before the next activity.\n\nAt 2:00PM, drove to Northland shopping centre. Nathan walked through the centre and browsed several shops. Nathan purchased a new t-shirt from Target. Nathan appeared to enjoy choosing clothing.\n\nAt 3:15PM, Nathan reported he was getting tired and wanted to go home. Writer drove Nathan home. Nathan settled in the lounge. Writer supported Nathan with a change of clothing and ensured he was comfortable. Nil concerns throughout the day. Shift ended at 4:00PM.`,
    bsl: '6.2 at 8:30am',
    medication: 'Morning meds administered at 8:30am as per chart',
    meals: 'Breakfast: scrambled eggs on toast, tea. Morning tea: cappuccino, banana bread (cafe). Lunch: chicken burger, chips (takeaway). Afternoon: water.',
    activities: 'Community access \u2014 Westfield Plenty Valley (JB Hi-Fi, bought 2 DVDs), cafe, Bundoora Park walk (25 mins), Northland (Target, bought t-shirt) \u2014 full day outing (6 hrs out)',
  },
];

function generateNotesPDF() {
  const OLF_GREEN = [14, 160, 62], DARK = [30, 41, 59], MED = [71, 85, 105], LIGHT = [148, 163, 184];
  const BORDER = [226, 232, 240];
  const AMBER_BG = [255, 251, 235], AMBER_BORDER = [245, 158, 11], AMBER_TEXT = [146, 64, 14];
  const GREEN_BG = [240, 253, 244], GREEN_TEXT = [22, 101, 52];
  const BLUE_BG = [239, 246, 255], BLUE_TEXT = [30, 64, 175];
  const HEADER_H = 28, BODY_TOP = MT + HEADER_H + 4, BODY_BOTTOM = PAGE_H - MT - 14;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let pageNum = 1, y = BODY_TOP;

  function drawHeader() {
    pdf.setFillColor(...OLF_GREEN); pdf.rect(0, 0, PAGE_W, MT + HEADER_H, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(255, 255, 255);
    pdf.text('Progress Notes Report', ML, MT + 10);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.text('Nathan Gottaas  |  From: 23 Mar 2026  |  To: 31 Mar 2026', ML, MT + 18);
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, PAGE_W - MR, MT + 18, { align: 'right' });
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
    pdf.text(`${NOTES.length} notes`, PAGE_W - MR, MT + 10, { align: 'right' });
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

  for (const note of NOTES) {
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
    const sw = pdf.getTextWidth(note.shift) + 6;
    pdf.roundedRect(bx, y + 0.5, sw, 6, 1, 1, 'F');
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(...BLUE_TEXT);
    pdf.text(note.shift, bx + 3, y + 4.5); bx += sw + 3;
    pdf.setFillColor(...GREEN_BG);
    const mw = pdf.getTextWidth(note.mood) + 6;
    pdf.roundedRect(bx, y + 0.5, mw, 6, 1, 1, 'F');
    pdf.setTextColor(...GREEN_TEXT); pdf.text(note.mood, bx + 3, y + 4.5); y += 8;

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...LIGHT);
    pdf.text(`Sleep: ${note.sleep}`, ML + 6, y + 3);
    pdf.text(`Staff: Prabhjot Kaur  \u00b7  ${note.day}`, ML + 40, y + 3); y += 7;

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MED);
    const lines = pdf.splitTextToSize(note.content, CW - 16);
    for (const line of lines) { ensureSpace(4); pdf.text(line, ML + 6, y); y += 3.5; }
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
// GENERATE ALL
// ═══════════════════════════════════════════════════════════════════════════════

// Clean old Prabhjot files
const oldFiles = [
  'Invoice_Prabhjot_Nathan_Mar23-27.pdf',
  'Invoice_Prabhjot_Nathan_Mar31.pdf',
  'Roster_Nathan_Gottaas_All_Periods.pdf',
  'OLF-Progress-Notes-Nathan-Gottaas-2026-03-23-to-2026-03-27.pdf',
  'OLF-Progress-Notes-Nathan-Gottaas-2026-03-31-to-2026-03-31.pdf',
  'OLF-Progress-Notes-Nathan-Gottaas-2026-03-23-to-2026-03-31.pdf',
];
for (const f of oldFiles) { try { unlinkSync(`${outDir}/${f}`); console.log(`Deleted: ${f}`); } catch {} }

// Invoice 1: 23-27 Mar (14 hrs)
const inv1 = generateInvoice(SHIFTS_P1, 'PK-001', '28/03/2026', '04/04/2026', '23 March \u2013 27 March 2026');
writeFileSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar23-27.pdf`, Buffer.from(inv1.pdf.output('arraybuffer')));
console.log(`Invoice 23-27 Mar: ${SHIFTS_P1.reduce((s,x)=>s+x.hours,0)} hrs = $${inv1.total.toFixed(2)}`);

// Invoice 2: 31 Mar (8 hrs)
const inv2 = generateInvoice(SHIFTS_P2, 'PK-002', '01/04/2026', '08/04/2026', '31 March 2026');
writeFileSync(`${outDir}/Invoice_Prabhjot_Nathan_Mar31.pdf`, Buffer.from(inv2.pdf.output('arraybuffer')));
console.log(`Invoice 31 Mar: ${SHIFTS_P2.reduce((s,x)=>s+x.hours,0)} hrs = $${inv2.total.toFixed(2)}`);

// Roster (Prabhjot only — not touching existing vault roster)
const rosterPdf = generateRoster();
writeFileSync(`${outDir}/Roster_Prabhjot_Nathan_Mar23-27_and_Mar31.pdf`, Buffer.from(rosterPdf.output('arraybuffer')));
console.log('Roster saved (2 pages)');

// Combined progress notes (Prabhjot only — not touching vault notes)
const notesPdf = generateNotesPDF();
writeFileSync(`${outDir}/OLF-Progress-Notes-Nathan-Gottaas-2026-03-23-to-2026-03-31.pdf`, Buffer.from(notesPdf.output('arraybuffer')));
console.log(`Progress Notes: ${NOTES.length} notes`);

console.log('\nAll done. Service type: Community Participation');
console.log('Nothing in the vault was changed.');
