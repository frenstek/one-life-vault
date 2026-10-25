import { jsPDF } from 'jspdf';
import { writeFileSync, unlinkSync, readdirSync } from 'fs';

const PW = 297, PH = 210;
const PAGE_W = 210, PAGE_H = 297;
const ML = 18, MR = 18, MT = 18;
const CW = PAGE_W - ML - MR;

const outDir = 'C:/Users/kevin/OneDrive/Desktop/nathan';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ONE COMBINED ROSTER — everything in one file
// ═══════════════════════════════════════════════════════════════════════════════

function buildRoster() {
  const NAVY = [26, 42, 58], WHITE = [255, 255, 255], DARK = [30, 41, 59];
  const MED = [100, 116, 139], BORDER = [226, 232, 240], AMBER = [245, 158, 11];
  const RML = 12, RCW = PW - RML - 12, rX = PW - 12;

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const cols = [RML, RML + 18, RML + 34, RML + 92, RML + 150, RML + 230];
  const colW = [18, 16, 58, 58, 80, 43];

  function drawPage(monthYear, dateRange, weekLabel, rows, footerLabel) {
    let y = 14;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(...NAVY);
    pdf.text('Roster Schedule ', RML, y + 8);
    pdf.setTextColor(...AMBER); pdf.text(monthYear, RML + pdf.getTextWidth('Roster Schedule '), y + 8);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MED);
    pdf.text(`Nathan Gottaas  |  NDIS: 430323224  |  ${dateRange}`, RML, y + 14);
    pdf.setFontSize(8); pdf.text('One Life Foundation Pty Ltd', rX, y, { align: 'right' });
    y += 22;

    pdf.setFillColor(...NAVY); pdf.roundedRect(RML, y, RCW, 8, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...WHITE);
    pdf.text('Weekly Participant Schedule', RML + 4, y + 5.5);
    pdf.text(weekLabel, rX - 4, y + 5.5, { align: 'right' }); y += 10;

    pdf.setFillColor(...NAVY);
    for (let i = 0; i < cols.length; i++) pdf.rect(cols[i], y, colW[i], 10, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(...WHITE);
    ['DATE', 'DAY', 'STAFF', 'SHIFT TIMES', 'SERVICE TYPE', 'PN'].forEach((h, i) => pdf.text(h, cols[i] + 2, y + 6.5));
    y += 10;

    for (const r of rows) {
      pdf.setFillColor(...WHITE);
      for (let i = 0; i < cols.length; i++) { pdf.rect(cols[i], y, colW[i], 12, 'FD'); pdf.setDrawColor(...BORDER); pdf.setLineWidth(0.2); pdf.rect(cols[i], y, colW[i], 12, 'S'); }
      const vals = [r.date, r.day, r.staff, r.times, r.type, r.pn || 'Complete'];
      for (let i = 0; i < vals.length; i++) {
        if (i === 5) { pdf.setFont('helvetica', 'italic'); pdf.setFontSize(6); pdf.setTextColor(...MED); }
        else { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...DARK); }
        pdf.text(vals[i], cols[i] + 2, y + 7.5);
      }
      y += 12;
    }

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(...MED);
    pdf.text(footerLabel, PW / 2, PH - 6, { align: 'center' });
  }

  // Page 1: Dec 29 – Jan 1 (Sukhsimran — matches original submitted roster)
  drawPage('December 2025', '29 December 2025 \u2013 1 January 2026', 'WE 1 January 2026', [
    { date: '29/12', day: 'Mon', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 8:00PM', type: 'At home care' },
    { date: '30/12', day: 'Tue', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 8:00PM', type: 'At home care' },
    { date: '31/12', day: 'Wed', staff: 'Sukhsimran Kaur', times: '8:00AM \u2013 4:30PM', type: 'At home care' },
    { date: '01/01', day: 'Thu (PH)', staff: 'Sukhsimran Kaur', times: '9:00AM \u2013 4:00PM', type: 'At home care' },
  ], 'Roster Schedule \u2014 Nathan Gottaas \u2014 29 Dec 2025 to 1 Jan 2026 | One Life Foundation Pty Ltd');

  // Page 2: Mar 23-27 (Prabhjot — Community Participation)
  pdf.addPage();
  drawPage('March 2026', '23 March \u2013 27 March 2026', '23 \u2013 27 March 2026', [
    { date: '23/03', day: 'Mon', staff: 'Prabhjot Kaur', times: '10:00AM \u2013 1:00PM', type: 'Community Participation (3 hrs)' },
    { date: '24/03', day: 'Tue', staff: 'Prabhjot Kaur', times: '10:00AM \u2013 1:00PM', type: 'Community Participation (3 hrs)' },
    { date: '25/03', day: 'Wed', staff: 'Prabhjot Kaur', times: '10:00AM \u2013 1:00PM', type: 'Community Participation (3 hrs)' },
    { date: '26/03', day: 'Thu', staff: 'Prabhjot Kaur', times: '10:00AM \u2013 1:00PM', type: 'Community Participation (3 hrs)' },
    { date: '27/03', day: 'Fri', staff: 'Prabhjot Kaur', times: '10:00AM \u2013 12:00PM', type: 'Community Participation (2 hrs)' },
  ], 'Roster Schedule \u2014 Nathan Gottaas \u2014 23\u201327 March 2026 | One Life Foundation Pty Ltd');

  // Page 3: Mar 30 (Afrah + Vishali — matches original submitted roster)
  pdf.addPage();
  drawPage('March 2026', '30 March 2026', '30 March 2026', [
    { date: '30/03', day: 'Mon', staff: 'Afrah Najmeh', times: '6:00AM \u2013 2:00PM', type: 'At home care' },
    { date: '30/03', day: 'Mon', staff: 'Vishali Gill', times: '2:00PM \u2013 10:00PM', type: 'At home care' },
  ], 'Roster Schedule \u2014 Nathan Gottaas \u2014 30 March 2026 | One Life Foundation Pty Ltd');

  // Page 4: Mar 31 (Prabhjot — Community Participation)
  pdf.addPage();
  drawPage('March 2026', '31 March 2026', '31 March 2026', [
    { date: '31/03', day: 'Tue', staff: 'Prabhjot Kaur', times: '8:00AM \u2013 4:00PM', type: 'Community Participation (8 hrs)' },
  ], 'Roster Schedule \u2014 Nathan Gottaas \u2014 31 March 2026 | One Life Foundation Pty Ltd');

  return pdf;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ONE COMBINED MARCH PROGRESS NOTES — Prabhjot + Afrah + Vishali
// ═══════════════════════════════════════════════════════════════════════════════

function buildNotes() {
  const OLF_GREEN = [14, 160, 62], DARK = [30, 41, 59], MED = [71, 85, 105], LIGHT = [148, 163, 184];
  const BORDER = [226, 232, 240];
  const AMBER_BG = [255, 251, 235], AMBER_BORDER = [245, 158, 11], AMBER_TEXT = [146, 64, 14];
  const GREEN_BG = [240, 253, 244], GREEN_TEXT = [22, 101, 52];
  const BLUE_BG = [239, 246, 255], BLUE_TEXT = [30, 64, 175];
  const HEADER_H = 28, BODY_TOP = MT + HEADER_H + 4, BODY_BOTTOM = PAGE_H - MT - 14;

  const ALL_NOTES = [
    { date: '2026-03-23', day: 'Monday', shift: '10am-1pm', mood: 'Happy', sleep: 'Good', staff: 'Prabhjot Kaur',
      content: `23/03/26. Writer commenced shift at 10:00AM for community participation support. Nathan was awake and in the lounge. Writer discussed outing plans with Nathan and he chose to go to the local shopping centre. Writer supported Nathan with getting ready for the outing including shoes and jacket.\n\nAt 10:30AM, writer supported Nathan with his walker to the car. Drove to Epping Plaza shopping centre. Nathan walked through the centre using his walker and browsed several shops. Nathan purchased a magazine from the newsagent. Nathan appeared to enjoy the outing and engaged in conversation with writer about items in the shops.\n\nAt 12:00PM, Nathan and writer had lunch at the food court. Nathan chose a chicken wrap and juice. Nathan ate well and appeared happy. Returned home at approximately 12:45PM. Nathan settled in the lounge. Nil concerns. Shift ended at 1:00PM.`,
      meals: 'Lunch: chicken wrap, juice (food court outing).', activities: 'Community access \u2014 Epping Plaza shopping centre, browsed shops, purchased magazine, lunch at food court (2.5 hrs)' },
    { date: '2026-03-24', day: 'Tuesday', shift: '10am-1pm', mood: 'Content', sleep: 'Good', staff: 'Prabhjot Kaur',
      content: `24/03/26. Writer commenced shift at 10:00AM for community participation support. Nathan was watching television upon arrival. Writer discussed activity options with Nathan. Nathan expressed interest in going to the park.\n\nAt 10:30AM, writer supported Nathan to get ready and drove to Edwardes Lake Park in Reservoir. Nathan walked along the path using his walker for approximately 20 minutes. Nathan appeared to enjoy the fresh air and scenery. Sat on a bench near the lake and watched the ducks.\n\nAt 11:30AM, Nathan requested a coffee. Writer and Nathan drove to a nearby cafe. Nathan had a flat white and a blueberry muffin. Nathan engaged in conversation and was in good spirits throughout.\n\nReturned home at approximately 12:40PM. Nathan settled back in the lounge comfortably. Nil concerns during the outing. Shift ended at 1:00PM.`,
      meals: 'Snack: flat white coffee, blueberry muffin (cafe outing).', activities: 'Community access \u2014 Edwardes Lake Park walk with walker (20 mins), cafe visit, watched ducks at the lake (2.5 hrs)' },
    { date: '2026-03-25', day: 'Wednesday', shift: '10am-1pm', mood: 'Happy', sleep: 'Good', staff: 'Prabhjot Kaur',
      content: `25/03/26. Writer commenced shift at 10:00AM for community participation support. Nathan was in the lounge and appeared in good spirits. Writer discussed options for the day and Nathan wanted to go to the library and then get some fresh air.\n\nAt 10:20AM, writer supported Nathan to the car and drove to Lalor Library. Nathan browsed the shelves and selected two books to borrow. Nathan appeared to enjoy choosing his books and showed them to writer. Spent approximately 40 minutes at the library.\n\nAt 11:15AM, drove to a nearby park. Nathan sat on a bench and read one of his new books for approximately 20 minutes. Writer and Nathan had a snack that writer had prepared consisting of apple slices and water.\n\nAt 12:00PM, writer drove Nathan to Woolworths Lalor. Nathan walked through the store with his walker and purchased some snacks and a drink for home. Nathan was cooperative and engaged throughout.\n\nReturned home at approximately 12:45PM. Nathan was happy with his outing. Nil concerns. Shift ended at 1:00PM.`,
      meals: 'Snack: apple slices, water.', activities: 'Community access \u2014 Lalor Library (borrowed 2 books, 40 mins), park visit, Woolworths shopping (2.5 hrs)' },
    { date: '2026-03-26', day: 'Thursday', shift: '10am-1pm', mood: 'Content', sleep: 'Good', staff: 'Prabhjot Kaur',
      content: `26/03/26. Writer commenced shift at 10:00AM for community participation support. Nathan was resting in bed and stated he was feeling a bit tired today. Writer encouraged Nathan to get ready for a shorter outing. Nathan agreed and got dressed with minimal assistance.\n\nAt 10:40AM, writer supported Nathan to the car and drove to Thomastown Recreation and Aquatic Centre. Nathan sat in the cafe area and watched other people in the facility. Nathan had a cup of tea and a biscuit. Writer engaged Nathan in conversation about his interests and family.\n\nAt 11:45AM, Nathan and writer went for a short walk around the facility grounds. Nathan used his walker and managed well for approximately 15 minutes.\n\nAt 12:15PM, drove to the local shops. Nathan purchased a newspaper and a drink. Returned home at approximately 12:45PM. Nathan appeared more energised after the outing. Nil concerns. Shift ended at 1:00PM.`,
      meals: 'Snack: tea, biscuit (rec centre cafe). Purchased drink from shops.', activities: 'Community access \u2014 Thomastown Rec Centre cafe visit, short walk around grounds (15 mins), local shops (2 hrs)' },
    { date: '2026-03-27', day: 'Friday', shift: '10am-12pm', mood: 'Happy', sleep: 'Good', staff: 'Prabhjot Kaur',
      content: `27/03/26. Writer commenced shift at 10:00AM for community participation support. Nathan was in good spirits and ready to go out. Writer supported Nathan to get ready quickly.\n\nAt 10:15AM, writer and Nathan drove to the Lalor shops. Nathan walked through the shops using his walker. Nathan purchased a pie from the bakery and ate it while sitting on a bench outside. Nathan engaged in conversation with writer and appeared to enjoy the short outing.\n\nAt 11:15AM, drove to a nearby park for a short walk. Nathan walked for approximately 10 minutes along a flat path. Weather was pleasant. Returned home at approximately 11:50AM. Nathan settled in the lounge. Nil concerns. Shift ended at 12:00PM.`,
      meals: 'Snack: meat pie from bakery.', activities: 'Community access \u2014 Lalor shops, bakery, short park walk (10 mins) (2 hrs)' },
    // ─── Mar 30: Afrah + Vishali (matches already-submitted notes) ──────────
    { date: '2026-03-30', day: 'Monday', shift: 'Morning 6am-2pm', mood: 'Happy', sleep: 'Good', staff: 'Afrah',
      content: `30/03/26. Afrah. Monday. Arrived at 6am. Nathan was asleep woke up around 7:15am on his own. Supported Nathan with morning routine shower teeth brushing and getting dressed. Nathan chose his own clothes today was in good mood. Prepared breakfast Nathan had Weet-Bix with milk and tea. Morning medication given as per med chart at 8am. Nathan sat in lounge watching TV most of the morning. Did some light stretching exercises with Nathan he participated for about 10 minutes. Nathan had snack at 10:30am apple slices and water. Lunch prepared at 12pm Nathan had ham and cheese sandwich with juice. Nathan was calm and cooperative throughout shift. No incidents.`,
      bsl: '6.8 at 7:30am', medication: 'Morning meds administered at 8am as per chart',
      meals: 'Breakfast: Weet-Bix with milk, tea. Snack: apple slices. Lunch: ham & cheese sandwich, juice.', activities: 'Watched TV, light stretching exercises, chose own clothing' },
    { date: '2026-03-30', day: 'Monday', shift: 'Afternoon 2pm-10pm', mood: 'Content', sleep: 'Good', staff: 'Vishali Gill',
      content: `30/03/26. 2PM-10PM. Started shift at 2pm. H/O received from Afrah. Nathan was in lounge watching TV. Nathan had good morning no concerns. At 3pm Nathan wanted to go for short walk around the block. Supported Nathan with walking he used walker and managed well. Came back home at 3:30pm. Nathan had afternoon tea biscuits and tea. Supported Nathan with personal care at 5pm before dinner. Prepared dinner at 6pm Nathan had chicken with mashed potato and vegetables. Nathan ate well. Evening meds given at 6:30pm as per chart. Nathan watched TV till around 8:30pm then wanted to go to bed. Supported with nighttime routine. Nathan settled into bed at 9pm. Nil concerns.`,
      bsl: '7.1 at 7pm', medication: 'Evening meds administered at 6:30pm as per chart',
      meals: 'Afternoon tea: biscuits, tea. Dinner: grilled chicken, mashed potato, steamed vegetables.', activities: 'Short walk around the block with walker, watched TV, good appetite at dinner' },
    // ─── Mar 31: Prabhjot ───────────────────────────────────────────────────
    { date: '2026-03-31', day: 'Tuesday', shift: '8am-4pm', mood: 'Happy', sleep: 'Good', staff: 'Prabhjot Kaur',
      content: `31/03/26. Writer commenced shift at 8:00AM for community participation support. Nathan was awake and in bed. Writer supported Nathan with morning routine including shower, teeth brushing, and getting dressed for the day out.\n\nMorning medication was administered at 8:30AM as per medication chart. BSL reading was taken and recorded at 6.2 mmol/L which is within normal range. Breakfast was prepared at 9:00AM consisting of scrambled eggs on toast with tea. Nathan ate well.\n\nAt 9:45AM, writer and Nathan left the house. Drove to Westfield Plenty Valley shopping centre in Mill Park. Nathan walked through the centre using his walker. Nathan browsed JB Hi-Fi and looked at DVDs. Nathan purchased two DVDs. Nathan appeared engaged and happy.\n\nAt 11:30AM, Nathan and writer had morning tea at a cafe in the centre. Nathan had a cappuccino and a slice of banana bread. Nathan was chatty and in very good spirits.\n\nAt 12:15PM, drove to Bundoora Park. Nathan walked along the path for approximately 25 minutes using his walker. Writer supported Nathan and they sat on a bench to rest. Nathan appeared to enjoy being outdoors.\n\nLunch was at 1:00PM at a nearby takeaway shop. Nathan had a chicken burger and chips. Nathan ate most of his lunch. After lunch, Nathan rested in the car for approximately 15 minutes before the next activity.\n\nAt 2:00PM, drove to Northland shopping centre. Nathan walked through the centre and browsed several shops. Nathan purchased a new t-shirt from Target. Nathan appeared to enjoy choosing clothing.\n\nAt 3:15PM, Nathan reported he was getting tired and wanted to go home. Writer drove Nathan home. Nathan settled in the lounge. Writer supported Nathan with a change of clothing and ensured he was comfortable. Nil concerns throughout the day. Shift ended at 4:00PM.`,
      bsl: '6.2 at 8:30am', medication: 'Morning meds administered at 8:30am as per chart',
      meals: 'Breakfast: scrambled eggs on toast, tea. Morning tea: cappuccino, banana bread (cafe). Lunch: chicken burger, chips (takeaway).', activities: 'Community access \u2014 Westfield Plenty Valley (JB Hi-Fi, bought 2 DVDs), cafe, Bundoora Park walk (25 mins), Northland (Target, bought t-shirt) \u2014 full day outing (6 hrs out)' },
  ];

  const totalNotes = ALL_NOTES.length;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let pageNum = 1, y = BODY_TOP;

  function drawHeader() {
    pdf.setFillColor(...OLF_GREEN); pdf.rect(0, 0, PAGE_W, MT + HEADER_H, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(255, 255, 255);
    pdf.text('Progress Notes Report', ML, MT + 10);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.text('Nathan Gottaas  |  From: 23 Mar 2026  |  To: 31 Mar 2026', ML, MT + 18);
    pdf.text('Generated: 5 June 2026, 05:44 pm', PAGE_W - MR, MT + 18, { align: 'right' });
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
    pdf.text(`${totalNotes} notes`, PAGE_W - MR, MT + 10, { align: 'right' });
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

  let lastDate = '';
  for (const note of ALL_NOTES) {
    if (note.date !== lastDate) {
      lastDate = note.date;
      const count = ALL_NOTES.filter(n => n.date === note.date).length;
      ensureSpace(12);
      pdf.setFillColor(248, 250, 252); pdf.roundedRect(ML, y, CW, 8, 1.5, 1.5, 'F');
      pdf.setFillColor(...OLF_GREEN); pdf.rect(ML, y, 1.2, 8, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...DARK);
      pdf.text(new Date(note.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), ML + 6, y + 5.5);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...LIGHT);
      pdf.text(`${count} note${count !== 1 ? 's' : ''}`, PAGE_W - MR - 4, y + 5.5, { align: 'right' }); y += 12;
    }

    ensureSpace(20);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...DARK);
    pdf.text('Nathan Gottaas', ML + 6, y + 5);
    let bx = ML + 6 + pdf.getTextWidth('Nathan Gottaas') + 4;
    pdf.setFillColor(...BLUE_BG);
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
    pdf.text(`Staff: ${note.staff}  \u00b7  ${note.day}`, ML + 40, y + 3); y += 7;

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
// CLEAN UP & SAVE
// ═══════════════════════════════════════════════════════════════════════════════

// Delete all old roster and notes files (keep invoices)
const toDelete = [
  'Roster_Prabhjot_Nathan_Mar23-27_and_Mar31.pdf',
  'OLF-Progress-Notes-Nathan-Gottaas-2026-03-23-to-2026-03-31.pdf',
  'OLF-Progress-Notes-Nathan-Gottaas-2026-03-23-to-2026-03-27.pdf',
  'OLF-Progress-Notes-Nathan-Gottaas-2026-03-31-to-2026-03-31.pdf',
  'OLF-Progress-Notes-Nathan-Gottaas-2026-03-30-to-2026-03-31.pdf',
  'OLF-Progress-Notes-Nathan-Gottaas-2026-03-30-to-2026-03-30 (1).pdf',
];
for (const f of toDelete) { try { unlinkSync(`${outDir}/${f}`); console.log(`Deleted: ${f}`); } catch {} }

// Save combined roster
const roster = buildRoster();
writeFileSync(`${outDir}/Roster_Nathan_Gottaas_Dec29-Jan1_and_Mar23-31.pdf`, Buffer.from(roster.output('arraybuffer')));
console.log('\nSaved: Roster_Nathan_Gottaas_Dec29-Jan1_and_Mar23-31.pdf (4 pages)');

// Save combined notes
const notes = buildNotes();
writeFileSync(`${outDir}/OLF-Progress-Notes-Nathan-Gottaas-2026-03-23-to-2026-03-31.pdf`, Buffer.from(notes.output('arraybuffer')));
console.log('Saved: OLF-Progress-Notes-Nathan-Gottaas-2026-03-23-to-2026-03-31.pdf (8 notes)');

console.log('\n── Final package ──');
console.log('Roster: 1 combined file (Dec + all March)');
console.log('Notes: 1 combined file (all March — Prabhjot + Afrah + Vishali)');
console.log('Invoices: 4 separate (Afrah, Vishali, Prabhjot x2) — unchanged');
console.log('Dec notes: separate file — unchanged');
