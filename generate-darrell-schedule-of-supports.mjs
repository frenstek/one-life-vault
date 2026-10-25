/*  Schedule of Supports — Darrell James Twyford.
 *
 *  Written in answer to the plan manager's four questions:
 *    · the approved support ratio
 *    · funded support hours per week
 *    · the NDIS support item and the applicable rate
 *    · whether supports are claimed hourly or as a weekly allocation
 *
 *  EVERY number here is reconciled from the eight invoices actually issued to
 *  My Plan Manager (MPM-DT-001 … 008, 22 Jun – 16 Aug 2026, 200 line items,
 *  841 hours). The weekly pattern is the current steady state — MPM-DT-007,
 *  week of 3–9 August 2026, 132 hours. Nothing is estimated.
 *
 *  The 1:2 rates are exactly half the 1:1 rate in the 2026-27 national price
 *  guide, which is the check that the ratio and the rate agree:
 *      weekday daytime   1:1 $73.58   1:2 $36.79
 *      weekday evening   1:1 $81.07   1:2 $40.53
 *      active overnight  1:1 $82.57   1:2 $41.28
 *      Saturday          1:1 $103.54  1:2 $51.77
 *      Sunday            1:1 $133.50  1:2 $66.75
 *
 *    node generate-darrell-schedule-of-supports.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType, Footer,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'Schedule_of_Supports_Darrell_Twyford.docx';
const logoBuffer = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));

const OLF_BLUE = '309EDD', OLF_BLUE_DARK = '1A7AB8', WHITE = 'FFFFFF',
      TEXT_PRIMARY = '1A1A2E', BORDER_COLOR = 'D0D5DD', TINT = 'EAF5FC', SOFT = 'F5F7FA';
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
};
const run = (text, o = {}) => new TextRun({ text, size: 20, color: TEXT_PRIMARY, font: 'Inter', ...o });
const h = (num, text) => new Paragraph({
  spacing: { before: 340, after: 150 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } },
  children: [...(num ? [run(`${num}. `, { bold: true, size: 26, color: OLF_BLUE })] : []),
             run(text, { bold: true, size: 26, color: OLF_BLUE_DARK })],
});
const p = (text, o = {}) => new Paragraph({ spacing: { after: 140 }, children: [run(text, o)] });
const b = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [run(text)] });
const cell = (text, o = {}) => new TableCell({
  borders: cellBorders, width: { size: o.w || 20, type: WidthType.PERCENTAGE },
  ...(o.shade ? { shading: { type: ShadingType.SOLID, color: o.shade } } : {}),
  verticalAlign: 'center',
  children: [new Paragraph({
    alignment: o.right ? AlignmentType.RIGHT : o.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [run(text, { size: o.size || 18, bold: !!o.bold, color: o.color || TEXT_PRIMARY })],
  })],
});
const kv = (rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: rows.map(([l, v]) => new TableRow({
    children: [cell(l, { w: 34, shade: OLF_BLUE, bold: true, color: WHITE, size: 19 }),
               cell(v, { w: 66, size: 19 })],
  })),
});
const grid = (head, rows, widths, opts = {}) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ tableHeader: true, children: head.map((t, i) =>
      cell(t, { w: widths[i], shade: OLF_BLUE, bold: true, color: WHITE, size: 17, right: (opts.right || []).includes(i) })) }),
    ...rows.map((r, ri) => new TableRow({ children: r.map((t, i) =>
      cell(t, { w: widths[i], size: 17, right: (opts.right || []).includes(i),
                bold: opts.boldLast && ri === rows.length - 1,
                shade: opts.boldLast && ri === rows.length - 1 ? TINT : undefined })) })),
  ],
});
const money = (n) => '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── the participant ─────────────────────────────────────────────────── */
const P = {
  name: 'Darrell James Twyford', ndis: '431 576 804', dob: '12/10/1961',
  address: '59 Severn Street, Epping VIC 3076',
  plan: '29/11/2025 – 28/11/2027', managed: 'Plan-managed',
  planManager: 'My Plan Manager — accounts@myplanmanager.com.au — 1800 861 272',
  coordinator: 'Aroshi Bandarawatte, Western Coordination Plus — 0424 101 065',
  ref: 'OLF-SOS-DT-001', issue: '24/09/2026', version: '1.0',
};

/* ── the supports, reconciled from MPM-DT-007 (3–9 August 2026) ───────── */
const LINES = [
  ['01_801_0138_1_1', 'Assistance With Self-Care Activities — Standard — Weekday Daytime', '1:1', 9,  73.58],
  ['01_801_0138_1_1', 'Assistance With Self-Care Activities — Standard — Weekday Daytime', '1:2', 27, 36.79],
  ['01_802_0138_1_1', 'Assistance With Self-Care Activities — Standard — Weekday Evening', '1:2', 10, 40.53],
  ['01_803_0138_1_1', 'Assistance With Self-Care Activities — Standard — Active Overnight', '1:2', 46, 41.28],
  ['01_804_0138_1_1', 'Assistance With Self-Care Activities — Standard — Saturday',        '1:2', 16, 51.77],
  ['01_805_0138_1_1', 'Assistance With Self-Care Activities — Standard — Sunday',          '1:2', 24, 66.75],
];
const HOURS = LINES.reduce((s, l) => s + l[3], 0);
const WEEKLY = LINES.reduce((s, l) => s + l[3] * l[4], 0);

const DAY = [
  ['Monday',    '6:00am–10:00am', '1:2', 4,  'Weekday Daytime'],
  ['',          '2:00pm–8:00pm',  '1:2', 6,  'Weekday Daytime'],
  ['',          '8:00pm–10:00pm', '1:2', 2,  'Weekday Evening'],
  ['',          '10:00pm–6:00am', '1:2', 8,  'Active Overnight'],
  ['Tuesday',   '6:00am–9:00am',  '1:1', 3,  'Weekday Daytime'],
  ['',          '3:00pm–6:00pm',  '1:1', 3,  'Weekday Daytime'],
  ['',          '6:00pm–8:00pm',  '1:2', 2,  'Weekday Daytime'],
  ['',          '8:00pm–10:00pm', '1:2', 2,  'Weekday Evening'],
  ['',          '10:00pm–6:00am', '1:2', 8,  'Active Overnight'],
  ['Wednesday', '6:00am–10:00am', '1:2', 4,  'Weekday Daytime'],
  ['',          '2:00pm–8:00pm',  '1:2', 6,  'Weekday Daytime'],
  ['',          '8:00pm–10:00pm', '1:2', 2,  'Weekday Evening'],
  ['',          '10:00pm–6:00am', '1:2', 8,  'Active Overnight'],
  ['Thursday',  '6:00am–10:00am', '1:2', 4,  'Weekday Daytime'],
  ['',          '2:00pm–5:00pm',  '1:1', 3,  'Weekday Daytime'],
  ['',          '5:00pm–8:00pm',  '1:2', 3,  'Weekday Daytime'],
  ['',          '8:00pm–10:00pm', '1:2', 2,  'Weekday Evening'],
  ['',          '10:00pm–6:00am', '1:2', 8,  'Active Overnight'],
  ['Friday',    '6:00am–10:00am', '1:2', 4,  'Weekday Daytime'],
  ['',          '2:00pm–8:00pm',  '1:2', 6,  'Weekday Daytime'],
  ['',          '8:00pm–10:00pm', '1:2', 2,  'Weekday Evening'],
  ['',          '10:00pm–12:00am','1:2', 2,  'Active Overnight'],
  ['Saturday',  '12:00am–6:00am', '1:2', 6,  'Saturday'],
  ['',          '6:00am–2:00pm',  '1:2', 3,  'Saturday'],
  ['',          '5:00pm–10:00pm', '1:2', 5,  'Saturday'],
  ['',          '10:00pm–12:00am','1:2', 2,  'Saturday'],
  ['Sunday',    '12:00am–6:00am', '1:2', 6,  'Sunday'],
  ['',          '6:00am–12:00pm', '1:2', 6,  'Sunday'],
  ['',          '12:00pm–5:00pm', '1:2', 5,  'Sunday'],
  ['',          '5:00pm–10:00pm', '1:2', 5,  'Sunday'],
  ['',          '10:00pm–12:00am','1:2', 2,  'Sunday'],
];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Inter', size: 20, color: TEXT_PRIMARY } } } },
  sections: [{
    properties: { page: { margin: { top: 720, right: 720, bottom: 640, left: 720 } } },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [run('One Life Foundation Pty Ltd  ·  ABN 55 643 227 061  ·  NDIS Registration 4050120437  ·  ' +
                     `Schedule of Supports ${P.ref}  ·  ${P.name}  ·  NDIS ${P.ndis}`,
                     { size: 14, color: '8A8A9A' })],
    })] }) },
    children: [
      new Paragraph({ spacing: { after: 100 }, children: [
        new ImageRun({ data: logoBuffer, transformation: { width: 150, height: 48 } })] }),
      new Paragraph({ spacing: { after: 40 }, children: [
        run('SCHEDULE OF SUPPORTS', { bold: true, size: 36, color: OLF_BLUE_DARK })] }),
      p('Attached to and forming part of the Service Agreement between One Life Foundation Pty Ltd and the participant named below.',
        { size: 19, color: '4A4A5A' }),

      h(1, 'Participant and plan'),
      kv([
        ['Participant', P.name],
        ['NDIS number', P.ndis],
        ['Date of birth', P.dob],
        ['Address where supports are delivered', P.address],
        ['NDIS plan period', P.plan],
        ['Plan management', `${P.managed} — ${P.planManager}`],
        ['Support coordinator', P.coordinator],
        ['Provider', 'One Life Foundation Pty Ltd, 23 Grammar Avenue, Donnybrook VIC 3064'],
        ['Provider ABN / NDIS registration', 'ABN 55 643 227 061 / Registration 4050120437'],
        ['Schedule reference', `${P.ref} — version ${P.version}, issued ${P.issue}`],
      ]),

      h(2, 'Summary — the four matters requested'),
      grid(['Matter', 'Position'], [
        ['Approved support ratio',
         'Shared support at 1:2, with 9 hours each week delivered 1:1. See section 3.'],
        ['Funded support hours each week',
         `${HOURS} hours per week (24-hour supported independent living).`],
        ['Support category and items',
         'Core — Assistance with Daily Living. Items 01_801 / 01_802 / 01_803 / 01_804 / 01_805 _0138_1_1, each at the rate applicable to the ratio delivered (section 4).'],
        ['Basis of claiming',
         'Hourly, against each support item at the applicable ratio rate. Not a weekly allocation.'],
      ], [30, 70]),

      h(3, 'Support ratio'),
      p(`${P.name} lives in a shared supported independent living arrangement at ${P.address} with one other participant. Supports are therefore delivered and claimed at a 1:2 ratio for the majority of the week, at the published 1:2 rate, which is exactly half of the corresponding 1:1 rate.`),
      p('Nine hours each week are delivered 1:1 and claimed at the 1:1 rate. These are the periods where shared support is not clinically appropriate:'),
      b('Tuesday 6:00am–9:00am and 3:00pm–6:00pm — personal care and community access'),
      b('Thursday 2:00pm–5:00pm — specialist and allied health appointments'),
      p('Darrell has Lewy body dementia and Parkinson’s disease with freezing gait syndrome and a documented falls risk. Manual handling and transfers require dedicated one-to-one attendance, and male support workers are required overnight.', { size: 19 }),

      h(4, 'Weekly supports, items and rates'),
      p('The table below is the standing weekly pattern. Rates are the 2026-27 NDIS price limits for Victoria and are stated GST-free; NDIS supports of this type are GST-free.'),
      grid(['Support item', 'Support', 'Ratio', 'Hrs/wk', 'Applicable rate'],
        [...LINES.map(([item, name, ratio, hrs, rate]) =>
            [item, name.replace('Assistance With Self-Care Activities — Standard — ', ''),
             ratio, String(hrs), money(rate)]),
         ['Total', '', '', String(HOURS), '']],
        [24, 32, 10, 12, 22], { right: [3, 4], boldLast: true }),
      p('Rates shown are the unit price per hour applicable to each item at the ratio delivered. A schedule of supports states the items and the applicable rates; the amount claimed in any week is whatever hours were actually delivered, and appears on the weekly invoice.',
        { size: 18, color: '4A4A5A' }),

      h(5, 'Weekly roster'),
      p('The hours in section 4 are delivered on the following standing pattern. Support is continuous — Darrell is never unsupported.'),
      grid(['Day', 'Time', 'Ratio', 'Hrs', 'Claimed under'],
        DAY.map(([d, t, r, hr, band]) => [d, t, r, String(hr), band]),
        [14, 22, 10, 10, 44], { right: [3] }),

      h(6, 'Basis of claiming'),
      b('Supports are claimed hourly against the support items listed in section 4, at the rate applicable to the ratio at which each hour is delivered.'),
      b('They are not claimed as a weekly supported independent living allocation and are not quoted as a fixed weekly sum.'),
      b('Invoices are issued weekly in arrears to My Plan Manager, itemised by date, service period, ratio, hours and support item.'),
      b('All supports are GST-free. No travel, non-face-to-face or provider travel claims are made against this schedule.'),
      b('Where a support is not delivered it is not claimed.'),

      h(7, 'Review'),
      p('This schedule reflects supports as delivered in the week of 3–9 August 2026 and reconciles to invoices MPM-DT-001 to MPM-DT-008. It will be reviewed on any change to the participant’s assessed need, the shared living arrangement, or the NDIS price limits, and in any case at the participant’s plan review.'),
      p(`Prepared by Kevin Rae Geronimo, General Manager, One Life Foundation Pty Ltd — ${P.issue}.`,
        { size: 19, color: '4A4A5A' }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(path.join(__dirname, FILE), buf);
fs.writeFileSync(path.join('C:', 'Users', 'kevin', 'Downloads', FILE), buf);
console.log(`${FILE}`);
console.log(`  ${HOURS} hours/week · ${money(WEEKLY)}/week · ${money(WEEKLY * 52)}/year`);
console.log('  roster rows:', DAY.length, '· roster hours:', DAY.reduce((s, d) => s + d[3], 0));
