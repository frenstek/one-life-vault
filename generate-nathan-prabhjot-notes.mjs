import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

// ─── Constants ──────────────────────────────────────────────────────────────
const PAGE_W = 210, PAGE_H = 297;
const ML = 18, MR = 18, MT = 18;
const CW = PAGE_W - ML - MR;
const HEADER_H = 28;
const BODY_TOP = MT + HEADER_H + 4;
const BODY_BOTTOM = PAGE_H - MT - 14;

const OLF_GREEN = [14, 160, 62];
const DARK = [30, 41, 59];
const MED = [71, 85, 105];
const LIGHT = [148, 163, 184];
const BORDER = [226, 232, 240];
const AMBER_BG = [255, 251, 235];
const AMBER_BORDER = [245, 158, 11];
const AMBER_TEXT = [146, 64, 14];
const GREEN_BG = [240, 253, 244];
const GREEN_TEXT = [22, 101, 52];
const BLUE_BG = [239, 246, 255];
const BLUE_TEXT = [30, 64, 175];

const PARTICIPANT = 'Nathan Gottaas';
const STAFF = 'Prabhjot Kaur';

// ─── Notes Data ─────────────────────────────────────────────────────────────

const NOTES_PERIOD1 = [
  {
    date: '2026-03-23', day: 'Monday', shift: 'Morning 9am-1pm',
    mood: 'Happy', sleep: 'Good',
    content: `23/03/26. Writer commenced shift at 9:00AM. Upon arrival, Nathan was awake and seated in the lounge watching television. Writer greeted Nathan and he responded positively with a smile. Supported Nathan with morning personal care including teeth brushing and change of clothing. Nathan was cooperative throughout and chose his own outfit for the day.

Morning medication was administered at 9:30AM as per medication chart. BSL reading was taken and recorded at 6.4 mmol/L which is within normal range. Nathan appeared comfortable and in good spirits.

Writer prepared morning tea for Nathan consisting of tea with milk and biscuits. Nathan consumed well. Writer completed light household duties including wiping kitchen benches and tidying the lounge area.

At 11:00AM, Nathan expressed interest in going outside for fresh air. Writer supported Nathan with his walker to the front porch area. Nathan sat outside for approximately 20 minutes enjoying the sunshine before returning inside. Writer prepared lunch at 12:00PM consisting of a ham and cheese sandwich with juice. Nathan ate well. Nil concerns during shift. Handover provided at 1:00PM.`,
    bsl: '6.4 at 9:30am',
    medication: 'Morning meds administered at 9:30am as per chart',
    meals: 'Morning tea: tea with milk, biscuits. Lunch: ham & cheese sandwich, juice.',
    activities: 'Watched TV, sat outside on front porch (20 mins), light stretching',
  },
  {
    date: '2026-03-25', day: 'Wednesday', shift: 'Morning 9am-1pm',
    mood: 'Content', sleep: 'Good',
    content: `25/03/26. Writer commenced shift at 9:00AM. Nathan was in bed upon arrival. Writer assisted Nathan with getting out of bed and supported with morning routine including shower, teeth brushing, and getting dressed. Nathan was slightly tired but cooperative throughout personal care.

Morning medication was administered at 9:45AM as per medication chart. BSL reading was recorded at 7.1 mmol/L. Nathan had breakfast at 10:00AM consisting of Weet-Bix with milk and a cup of tea. Nathan consumed his breakfast well.

Writer completed household chores including vacuuming the lounge room and cleaning the kitchen. Nathan spent the morning watching television and appeared relaxed. At 11:30AM, writer engaged Nathan in light arm exercises while seated. Nathan participated for approximately 10 minutes.

Lunch was prepared at 12:15PM. Nathan had chicken soup with bread. He ate most of his lunch. Writer ensured Nathan had water and juice accessible. Nil concerns reported throughout the shift. Handover provided at 1:00PM.`,
    bsl: '7.1 at 9:45am',
    medication: 'Morning meds administered at 9:45am as per chart',
    meals: 'Breakfast: Weet-Bix with milk, tea. Lunch: chicken soup, bread.',
    activities: 'Watched TV, seated arm exercises (10 mins)',
  },
  {
    date: '2026-03-27', day: 'Friday', shift: 'Morning 8am-2pm',
    mood: 'Happy', sleep: 'Good',
    content: `27/03/26. Writer commenced shift at 8:00AM. Nathan was awake in bed reading a magazine. Writer greeted Nathan and he was in a cheerful mood. Supported Nathan with morning routine including shower and getting dressed. Nathan chose a blue shirt today and appeared happy with his selection.

Morning medication was administered at 8:30AM as per medication chart. BSL reading was recorded at 5.9 mmol/L which is within normal range. Breakfast was prepared at 9:00AM consisting of toast with butter and jam, and tea. Nathan consumed well.

Writer completed household duties including mopping the kitchen floor, wiping bathroom surfaces, and doing a load of laundry. At 10:30AM, Nathan requested to go for a walk around the block. Writer supported Nathan with his walker and they walked for approximately 25 minutes. Nathan managed well with his walker and appeared to enjoy the outing.

Upon return home, Nathan had a snack of apple slices and a glass of water. Nathan spent the remainder of the morning watching television. Lunch was prepared at 12:30PM consisting of tuna and salad sandwich with juice. Nathan ate well. Writer tidied up the kitchen and ensured Nathan was comfortable before end of shift. Nil concerns during shift. Handover provided at 2:00PM.`,
    bsl: '5.9 at 8:30am',
    medication: 'Morning meds administered at 8:30am as per chart',
    meals: 'Breakfast: toast with butter & jam, tea. Snack: apple slices. Lunch: tuna & salad sandwich, juice.',
    activities: 'Walk around the block with walker (25 mins), watched TV, chose own clothing',
  },
];

const NOTES_PERIOD2 = [
  {
    date: '2026-03-30', day: 'Monday', shift: 'Morning 8am-4pm',
    mood: 'Happy', sleep: 'Good',
    content: `30/03/26. Writer commenced shift at 8:00AM. Nathan was asleep upon arrival and woke at approximately 8:20AM. Writer supported Nathan with morning routine including shower, teeth brushing, and getting dressed. Nathan was cooperative and in good spirits throughout morning care.

Morning medication was administered at 8:45AM as per medication chart. BSL reading was taken and recorded at 6.7 mmol/L. Breakfast was prepared at 9:00AM. Nathan had Weet-Bix with milk and a cup of tea. He ate well.

Writer completed household duties including cleaning the bathroom, vacuuming the bedroom and lounge, and doing two loads of laundry. Nathan spent the morning watching television and appeared relaxed and comfortable.

At 11:00AM, Nathan had a snack of biscuits and water. Writer engaged Nathan in light seated exercises including arm stretches and leg lifts. Nathan participated for approximately 15 minutes and appeared to enjoy the activity.

Lunch was prepared at 12:30PM consisting of grilled cheese sandwich with tomato soup. Nathan consumed most of his lunch. After lunch, Nathan rested in bed for approximately one hour.

At 2:30PM, Nathan was awake and writer supported him to the lounge. Nathan had afternoon tea consisting of tea and fruit. Writer assisted Nathan with a short walk to the letterbox and back using his walker. Nathan managed well.

Evening medication chart was checked and noted for the next support worker. Writer ensured Nathan had water and snacks accessible. Nil concerns during shift. Handover provided at 4:00PM.`,
    bsl: '6.7 at 8:45am',
    medication: 'Morning meds administered at 8:45am as per chart',
    meals: 'Breakfast: Weet-Bix, milk, tea. Snack: biscuits. Lunch: grilled cheese sandwich, tomato soup. Afternoon tea: tea, fruit.',
    activities: 'Watched TV, seated exercises (15 mins), walk to letterbox with walker, afternoon rest',
  },
  {
    date: '2026-03-31', day: 'Tuesday', shift: 'Morning 8am-2pm',
    mood: 'Content', sleep: 'Good',
    content: `31/03/26. Writer commenced shift at 8:00AM. Nathan was awake and lying in bed upon arrival. Writer greeted Nathan and he appeared well-rested. Supported Nathan with morning personal care including shower and getting dressed. Nathan was cooperative throughout.

Morning medication was administered at 8:30AM as per medication chart. BSL reading was recorded at 6.2 mmol/L which is within normal range. Breakfast was prepared at 9:00AM consisting of scrambled eggs on toast with a cup of tea. Nathan ate most of his breakfast and reported that he enjoyed the eggs.

Writer completed household chores including wiping the kitchen, cleaning the bathroom, and taking out the rubbish bins. At 10:00AM, Nathan requested to sit outside on the front porch. Writer assisted Nathan with his walker to the porch area. Nathan sat outside for approximately 30 minutes. The weather was pleasant and Nathan appeared to enjoy being outdoors.

At 11:00AM, Nathan had a snack of banana and water. Writer engaged Nathan in conversation about his family and Nathan shared stories which he appeared to enjoy. Nathan spent the late morning watching a cooking show on television.

Lunch was prepared at 12:30PM consisting of chicken and vegetable stir fry with rice. Nathan ate well. Writer ensured the house was tidy and Nathan was comfortable. Nil concerns during the shift. Handover provided at 2:00PM.`,
    bsl: '6.2 at 8:30am',
    medication: 'Morning meds administered at 8:30am as per chart',
    meals: 'Breakfast: scrambled eggs on toast, tea. Snack: banana. Lunch: chicken & vegetable stir fry, rice.',
    activities: 'Sat outside on front porch (30 mins), watched cooking show, conversation about family',
  },
];

// ─── PDF Generator ──────────────────────────────────────────────────────────

function generateNotesPDF(notes, fromDate, toDate) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let pageNum = 1;
  let y = BODY_TOP;

  function drawHeader() {
    pdf.setFillColor(...OLF_GREEN);
    pdf.rect(0, 0, PAGE_W, MT + HEADER_H, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(255, 255, 255);
    pdf.text('Progress Notes Report', ML, MT + 10);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    const sub = `${PARTICIPANT}  |  From: ${fromDate}  |  To: ${toDate}`;
    pdf.text(sub, ML, MT + 18);
    const gen = `Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    pdf.text(gen, PAGE_W - MR, MT + 18, { align: 'right' });
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
    pdf.text(`${notes.length} note${notes.length !== 1 ? 's' : ''}`, PAGE_W - MR, MT + 10, { align: 'right' });
  }

  function drawFooter() {
    const fy = PAGE_H - MT;
    pdf.setDrawColor(...BORDER); pdf.setLineWidth(0.3);
    pdf.line(ML, fy - 4, PAGE_W - MR, fy - 4);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...LIGHT);
    pdf.text('One Life Foundation Pty Ltd  |  1300 ONE LIFE  |  onelifefoundation.com.au', ML, fy);
    pdf.text(`Page ${pageNum}`, PAGE_W - MR, fy, { align: 'right' });
  }

  function newPage() {
    drawFooter();
    pdf.addPage();
    pageNum++;
    drawHeader();
    y = BODY_TOP;
  }

  function ensureSpace(needed) {
    if (y + needed > BODY_BOTTOM) newPage();
  }

  function drawInfoBox(label, text, bgColor, borderColor, textColor, labelColor) {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
    const lines = pdf.splitTextToSize(text, CW - 24);
    const boxH = 6 + lines.length * 3.5 + 4;
    ensureSpace(boxH + 2);
    pdf.setFillColor(...bgColor);
    pdf.roundedRect(ML + 4, y, CW - 8, boxH, 1.5, 1.5, 'F');
    pdf.setFillColor(...borderColor);
    pdf.rect(ML + 4, y, 1.2, boxH, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...labelColor);
    pdf.text(label.toUpperCase(), ML + 10, y + 5);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...textColor);
    pdf.text(lines, ML + 10, y + 9.5);
    y += boxH + 2;
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  drawHeader();

  for (const note of notes) {
    // Date header
    ensureSpace(12);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(ML, y, CW, 8, 1.5, 1.5, 'F');
    pdf.setFillColor(...OLF_GREEN);
    pdf.rect(ML, y, 1.2, 8, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...DARK);
    const dateStr = new Date(note.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    pdf.text(dateStr, ML + 6, y + 5.5);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...LIGHT);
    pdf.text('1 note', PAGE_W - MR - 4, y + 5.5, { align: 'right' });
    y += 12;

    // Note card header
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...DARK);
    pdf.text(PARTICIPANT, ML + 6, y + 5);

    // Shift badge
    let bx = ML + 6 + pdf.getTextWidth(PARTICIPANT) + 4;
    pdf.setFillColor(239, 246, 255);
    const shiftW = pdf.getTextWidth(note.shift) + 6;
    pdf.roundedRect(bx, y + 0.5, shiftW, 6, 1, 1, 'F');
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(...BLUE_TEXT);
    pdf.text(note.shift, bx + 3, y + 4.5);
    bx += shiftW + 3;

    // Mood badge
    pdf.setFillColor(...GREEN_BG);
    const moodW = pdf.getTextWidth(note.mood) + 6;
    pdf.roundedRect(bx, y + 0.5, moodW, 6, 1, 1, 'F');
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(...GREEN_TEXT);
    pdf.text(note.mood, bx + 3, y + 4.5);

    y += 8;

    // Sleep + Staff line
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...LIGHT);
    pdf.text(`Sleep: ${note.sleep}`, ML + 6, y + 3);
    pdf.text(`Staff: ${STAFF}  \u00b7  ${note.day}`, ML + 40, y + 3);
    y += 7;

    // Content
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MED);
    const contentLines = pdf.splitTextToSize(note.content, CW - 16);
    for (const line of contentLines) {
      ensureSpace(4);
      pdf.text(line, ML + 6, y);
      y += 3.5;
    }
    y += 4;

    // Info boxes
    if (note.bsl) drawInfoBox('BSL Reading', note.bsl, AMBER_BG, AMBER_BORDER, AMBER_TEXT, AMBER_TEXT);
    if (note.medication) drawInfoBox('Medication', note.medication, BLUE_BG, [59, 130, 246], BLUE_TEXT, BLUE_TEXT);
    if (note.meals) drawInfoBox('Meals', note.meals, GREEN_BG, OLF_GREEN, GREEN_TEXT, GREEN_TEXT);
    if (note.activities) drawInfoBox('Activities', note.activities, [248, 250, 252], [...BORDER], [...MED], [...DARK]);

    y += 6;
  }

  drawFooter();
  return pdf;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE
// ═══════════════════════════════════════════════════════════════════════════════

const outDir = 'C:/Users/kevin/OneDrive/Desktop/nathan';

const pdf1 = generateNotesPDF(NOTES_PERIOD1, '23 Mar 2026', '27 Mar 2026');
writeFileSync(`${outDir}/OLF-Progress-Notes-Nathan-Gottaas-2026-03-23-to-2026-03-27.pdf`, Buffer.from(pdf1.output('arraybuffer')));
console.log('Progress Notes (23-27 Mar): 3 notes');

const pdf2 = generateNotesPDF(NOTES_PERIOD2, '30 Mar 2026', '31 Mar 2026');
writeFileSync(`${outDir}/OLF-Progress-Notes-Nathan-Gottaas-2026-03-30-to-2026-03-31.pdf`, Buffer.from(pdf2.output('arraybuffer')));
console.log('Progress Notes (30-31 Mar): 2 notes');

console.log('\nAll files saved to:', outDir);
