/*  Roster of Care — Moira Sunai (Attachment B to OLF-SA-MS-001).
 *  Two workers only (Kawia and Bamidele Akinsola), 24-hour 1:1 cover from
 *  Saturday 5 September 2026. Fixed roles — with two people covering every
 *  hour there is no way to swap day/night without one of them working 24
 *  hours straight, so Kawia holds the day shift and Bamidele the night.
 *
 *    node generate-moira-roster.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, PageBreak, ShadingType, Header, Footer,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'Roster_of_Care_Moira_Sunai.docx';
const logoBuffer = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));

const P = { name: 'Moira Sunai', ndis: '431 040 053', ref: 'OLF-SA-MS-001', version: '1.0', issue: '09/09/2026' };
const DAY = { name: 'Kawia Akinsola', short: 'Kawia', phone: '0447 057 034' };
const NIGHT = { name: 'Bamidele Akinsola', short: 'Bamidele', phone: '0475 212 803' };
const START = new Date(2026, 8, 5);   // Sat 5 Sep 2026
const WEEKS = 4;

/* ── styling (OLF template) ───────────────────────────────────────────── */
const OLF_BLUE = '309EDD', OLF_BLUE_DARK = '1A7AB8', WHITE = 'FFFFFF', TEXT_PRIMARY = '1A1A2E', TEXT_SECONDARY = '4A4A5A', BORDER_COLOR = 'D0D5DD', SOFT = 'F5F7FA', WEEKEND = 'EAF4FB';
const cellBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } };
const noBorders = { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } };
const run = (text, o = {}) => new TextRun({ text, size: 22, color: TEXT_PRIMARY, font: 'Inter', ...o });
const h = (num, text) => new Paragraph({ spacing: { before: 400, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, children: [...(num ? [run(`${num}. `, { bold: true, size: 26, color: OLF_BLUE })] : []), run(text, { bold: true, size: 26, color: OLF_BLUE_DARK })] });
const p = (text, o = {}) => new Paragraph({ spacing: { after: 150 }, children: [run(text, o)] });
const b = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [run(text)] });
const sub = (text) => new Paragraph({ spacing: { before: 250, after: 100 }, children: [run(text, { bold: true })] });
const pb = () => new Paragraph({ children: [new PageBreak()] });
const cell = (text, o = {}) => new TableCell({ borders: cellBorders, width: { size: o.w || 50, type: WidthType.PERCENTAGE }, ...(o.shade ? { shading: { type: ShadingType.SOLID, color: o.shade } } : {}), children: [new Paragraph({ children: [run(text, { size: o.size || 20, bold: !!o.bold, color: o.color || TEXT_PRIMARY })] })] });
const tbl = (rows) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(([label, value]) => new TableRow({ children: [cell(label, { w: 38, shade: OLF_BLUE, bold: true, color: WHITE }), cell(value, { w: 62 })] })) });
const grid = (head, rows, widths, o = {}) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, { w: widths[i], shade: OLF_BLUE, bold: true, color: WHITE, size: 18 })) }),
  ...rows.map((r, ri) => new TableRow({ children: r.map((t, i) => cell(t, { w: widths[i], size: 18, bold: o.boldLast && ri === rows.length - 1, shade: o.shade?.(ri) })) })),
] });
const sig = (title) => [sub(title), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: ['Full Name', 'Signature', 'Date'].map((l) => new TableCell({ borders: noBorders, width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({ spacing: { after: 40 }, children: [run(l, { bold: true, size: 16, color: TEXT_SECONDARY, allCaps: true })] }), new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 200 }, children: [run(' ')] })] })) })] }), new Paragraph({ spacing: { after: 200 }, children: [] })];

/* ── calendar ─────────────────────────────────────────────────────────── */
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x };
const END = addDays(START, WEEKS * 7 - 1);
// Queensland public holidays in the roster window (none: King's Birthday QLD is 5 Oct 2026)
const PH = new Set([]);

/*  Shifts. The two workers rotate weekly so neither is stuck on nights.
 *  With two people covering every hour, a straight swap would force one of
 *  them to work 24 hours; the changeover day (each Saturday) is split into
 *  three 8-hour shifts instead, so both keep at least 8 hours' rest. */
const K = DAY.short, B = NIGHT.short;
function shiftsFor(dayIndex) {
  const week = Math.floor(dayIndex / 7);
  const dow = dayIndex % 7;                  // 0 = the Saturday the roster starts on
  const dayWorker = week % 2 === 0 ? K : B;  // even weeks Kawia days, odd weeks Bamidele days
  const nightWorker = dayWorker === K ? B : K;
  if (dow === 0 && week > 0) {
    // changeover: the outgoing night worker keeps the evening, the incoming day worker takes morning + overnight
    const prevDay = nightWorker, prevNight = dayWorker;
    return [
      { w: prevDay, t: '06:00 – 14:00', h: 8 },
      { w: prevNight, t: '14:00 – 22:00', h: 8 },
      { w: prevDay, t: '22:00 – 06:00', h: 8 },
    ];
  }
  return [{ w: dayWorker, t: '06:00 – 18:00', h: 12 }, { w: nightWorker, t: '18:00 – 06:00', h: 12 }];
}
const cellFor = (shifts, w) => shifts.filter((x) => x.w === w).map((x) => x.t).join('  +  ') || '—';
const hoursFor = (shifts, w) => shifts.filter((x) => x.w === w).reduce((a, x) => a + x.h, 0);

const weekRows = (w) => {
  const rows = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(START, w * 7 + i);
    const sh = shiftsFor(w * 7 + i);
    rows.push([`${DOW[d.getDay()].slice(0, 3)} ${fmt(d)}`, cellFor(sh, K), cellFor(sh, B)]);
  }
  return rows;
};
const isWeekendRow = (rows) => (ri) => /^(Sat|Sun)/.test(rows[ri][0]) ? WEEKEND : undefined;

/* ── document: the roster tables and nothing else ─────────────────────── */
const children = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 80 }, children: [run('Roster of Care', { bold: true, size: 36, color: OLF_BLUE_DARK })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [run(`${P.name}  ·  NDIS ${P.ndis}  ·  1:1, 24 hours a day  ·  ${fmt(START)} to ${fmt(END)}`, { size: 20, color: TEXT_SECONDARY })] }),
];

const weekTotals = [];
for (let w = 0; w < WEEKS; w++) {
  const rows = weekRows(w);
  let kh = 0, bh = 0;
  for (let i = 0; i < 7; i++) { const sh = shiftsFor(w * 7 + i); kh += hoursFor(sh, K); bh += hoursFor(sh, B); }
  weekTotals.push([`Week ${w + 1}`, `${fmt(addDays(START, w * 7))} – ${fmt(addDays(START, w * 7 + 6))}`, String(kh), String(bh)]);
  children.push(sub(`Week ${w + 1}  ·  ${fmt(addDays(START, w * 7))} to ${fmt(addDays(START, w * 7 + 6))}`));
  children.push(grid(['Date', DAY.name, NIGHT.name], rows, [24, 38, 38], { shade: isWeekendRow(rows) }));
  children.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
}

const doc = new Document({
  styles: { default: { document: { run: { font: 'Inter', size: 22, color: TEXT_PRIMARY } } } },
  sections: [{
    properties: { page: { margin: { top: 1134, right: 1020, bottom: 1134, left: 1020 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: OLF_BLUE } }, spacing: { after: 100 }, children: [new ImageRun({ data: logoBuffer, transformation: { width: 160, height: 82 }, type: 'png' }), run('\t'), run('One Life Foundation', { bold: true, size: 28, color: OLF_BLUE_DARK })] })] }) },
    footers: { default: new Footer({ children: [
      new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, spacing: { before: 100 }, children: [run('One Life Foundation Pty Ltd', { bold: true, size: 16, color: OLF_BLUE_DARK }), run('  |  ABN 55 643 227 061  |  NDIS Registered Provider 405 012 0437', { size: 16, color: TEXT_SECONDARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run('0420 652 270  |  support@olfndisservices.com.au  |  www.olfndisservices.com.au', { size: 16, color: TEXT_SECONDARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run(`Roster of Care  |  ${P.name}  |  NDIS ${P.ndis}`, { size: 16, color: TEXT_SECONDARY })] }),
    ] }) },
    children,
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(path.join(__dirname, FILE), buf);
console.log('written', FILE);
