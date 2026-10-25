/*  Schedule of Supports — Antonino (Nino) Fiorito. Mirrors
 *  generate-darrell-schedule-of-supports.mjs and answers the plan manager's
 *  four questions:
 *    · the approved support ratio
 *    · funded support hours per week
 *    · the NDIS support item and the applicable rate
 *    · whether supports are claimed hourly or as a weekly allocation
 *
 *  Ratio and hours come from the NDIA's Home and Living letter of 1 June 2026
 *  (vault participant_files, "Home and Living Outcome_Antonino FIORITO_HaL Letter.pdf"):
 *    14 h/wk individual · 32 h/wk "Other" (community / not in the home)
 *    56 h/wk inactive sleepover shared with 2 others · 66 h/wk all other shared with 2 others
 *    10 days/yr irregular supports · total SIL $220,301.48
 *  This agrees with participants.funding_ratio = 1:3.
 *
 *  Unlike Darrell, Nino has NO invoices and NO roster of care in the vault, so the
 *  split of hours across day/evening/overnight/weekend bands is left TO CONFIRM
 *  rather than invented.
 *
 *  Rates: Darrell's 2026-27 national 1:1 rates; 1:3 = 1:1 ÷ 3 (the same rule that
 *  makes Darrell's 1:2 rates exactly half):
 *      weekday daytime   1:1 $73.58   1:3 $24.53
 *      weekday evening   1:1 $81.07   1:3 $27.02
 *      active overnight  1:1 $82.57   1:3 $27.52
 *      Saturday          1:1 $103.54  1:3 $34.51
 *      Sunday            1:1 $133.50  1:3 $44.50
 *  Inactive sleepover is not in Darrell's item set — item and rate TO CONFIRM.
 *
 *    node generate-antonino-schedule-of-supports.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType, Footer,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'Schedule_of_Supports_Antonino_Fiorito.docx';
const logoBuffer = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));   // 522 × 267

const OLF_BLUE = '309EDD', OLF_BLUE_DARK = '1A7AB8', WHITE = 'FFFFFF',
      TEXT_PRIMARY = '1A1A2E', BORDER_COLOR = 'D0D5DD', TINT = 'EAF5FC';
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
};
/* any text carrying "TO CONFIRM" is bold + yellow-highlighted */
const run = (text, o = {}) => new TextRun({ text, size: 20, color: TEXT_PRIMARY, font: 'Inter', ...o,
  ...(/TO CONFIRM/.test(text) ? { highlight: 'yellow', bold: true, color: TEXT_PRIMARY } : {}) });
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
const TBC = (what) => `[${what} — TO CONFIRM]`;

/* ── the participant ─────────────────────────────────────────────────── */
const P = {
  name: 'Antonino Fiorito', pref: 'Nino', ndis: '430 200 387', dob: '04/03/2005',
  address: '59 Severn Street, Epping VIC 3076',
  plan: '29/05/2026 – 28/05/2027',
  coordinator: 'Sonia Muraca, Fundamentals',
  rep: 'Anastasia (Stacey) Fiorito (mother), Authorised Representative — 0409 338 853',
  ref: 'OLF-SOS-AF-001', agreement: 'OLF-SA-AF-001', issue: '23/09/2026', version: '1.0',
  start: '23/09/2026',   // day after the documented trial end, 22/09/2026
};

/* ── NDIA-approved SIL supports (Home and Living letter, 1 June 2026) ─── */
const FUNDED = [
  ['Individual supports', '1:1', 14],
  ['"Other" supports — community, or when not in the home', TBC('ratio not stated in NDIA letter'), 32],
  ['Inactive sleepover supports', '1:3 — shared with 2 other people', 56],
  ['All other supports', '1:3 — shared with 2 other people', 66],
];
const HOURS = FUNDED.reduce((s, f) => s + f[2], 0);   // 168

const third = (x) => Math.round((x / 3) * 100) / 100;
const BANDS = [
  ['01_801_0138_1_1', 'Weekday Daytime',  73.58],
  ['01_802_0138_1_1', 'Weekday Evening',  81.07],
  ['01_803_0138_1_1', 'Active Overnight', 82.57],
  ['01_804_0138_1_1', 'Saturday',         103.54],
  ['01_805_0138_1_1', 'Sunday',           133.50],
];
const RATES = BANDS.flatMap(([item, band, one]) => [
  [item, band, '1:1', money(one)],
  [item, band, '1:3', money(third(one))],
]).concat([[TBC('item'), 'Inactive Sleepover (per night)', '1:3', TBC('rate')]]);

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
        new ImageRun({ data: logoBuffer, type: 'png', transformation: { width: 150, height: 77 } })] }),
      new Paragraph({ spacing: { after: 40 }, children: [
        run('SCHEDULE OF SUPPORTS', { bold: true, size: 36, color: OLF_BLUE_DARK })] }),
      p(`Attached to and forming part of Service Agreement ${P.agreement} between One Life Foundation Pty Ltd and the participant named below.`,
        { size: 19, color: '4A4A5A' }),

      h(1, 'Participant and plan'),
      kv([
        ['Participant', `${P.name} (known as ${P.pref})`],
        ['NDIS number', P.ndis],
        ['Date of birth', P.dob],
        ['Address where supports are delivered', P.address],
        ['Participant\'s representative', P.rep],
        ['NDIS plan period', P.plan],
        ['Plan management', 'Plan-managed — Awesome Plan Management (email and phone [to confirm])'],
        ['Support coordinator', P.coordinator],
        ['Provider', 'One Life Foundation Pty Ltd, 9C Grasslands Avenue, Craigieburn VIC 3064'],
        ['Provider ABN / NDIS registration', 'ABN 55 643 227 061 / Registration 4050120437'],
        ['Schedule reference', `${P.ref} — version ${P.version}, issued ${P.issue}, effective ${P.start}`],
      ]),

      h(2, 'Summary — the four matters requested'),
      grid(['Matter', 'Position'], [
        ['Approved support ratio',
         'Shared support at 1:3 (with two other residents), with 14 hours each week of individual 1:1 support. See section 3.'],
        ['Funded support hours each week',
         `${HOURS} hours per week (24-hour supported independent living), as approved by the NDIA. Plus 10 days a year of irregular supports.`],
        ['Support category and items',
         'Core — Assistance with Daily Living. Items 01_801 / 01_802 / 01_803 / 01_804 / 01_805 _0138_1_1, and the inactive sleepover item, each at the rate applicable to the ratio delivered (section 4).'],
        ['Basis of claiming',
         'Hourly, against each support item at the applicable ratio rate. Not a weekly allocation.'],
      ], [30, 70]),

      h(3, 'Support ratio and funded hours'),
      p(`${P.name} lives in a shared supported independent living arrangement at ${P.address} with two other residents. The NDIA's Home and Living letter of 1 June 2026 approves the following Supported Independent Living supports in his plan:`),
      grid(['Support type (NDIA letter)', 'Ratio', 'Hrs/wk'],
        [...FUNDED.map(([t, rt, hr]) => [t, rt, String(hr)]), ['Total', '', String(HOURS)]],
        [52, 34, 14], { right: [2], boldLast: true }),
      p('Shared supports are delivered and claimed at 1:3, at the published 1:3 rate, which is one third of the corresponding 1:1 rate. The 14 hours of individual support each week are delivered and claimed at the 1:1 rate.'),
      p('The plan also includes 10 days a year of irregular supports in the home, for days he cannot attend his usual activities, for example when unwell. These are claimed only when used.', { size: 19 }),

      h(4, 'Support items and rates'),
      p('Rates are the 2026-27 NDIS price limits and are stated GST-free; NDIS supports of this type are GST-free.'),
      grid(['Support item', 'Support', 'Ratio', 'Applicable rate'],
        RATES.map(([item, band, ratio, rate]) => [item, band, ratio, rate]),
        [26, 40, 12, 22], { right: [3] }),
      p('Rates shown are the unit price per hour applicable to each item at the ratio delivered. A schedule of supports states the items and the applicable rates; the amount claimed in any week is whatever hours were actually delivered, and appears on the invoice.',
        { size: 18, color: '4A4A5A' }),

      h(5, 'Weekly roster'),
      p(`The split of the ${HOURS} funded hours across weekday daytime, evening, overnight, Saturday and Sunday, and the specific periods delivered 1:1, will be set out in his roster of care and attached to this schedule.`),
      p(TBC('standing weekly roster — no roster of care, shift roster or invoice for Nino is recorded in the vault')),
      p('Time Nino spends at his family home, or with a community support worker from another provider, is not delivered by One Life Foundation and is not claimed.'),

      h(6, 'Basis of claiming'),
      b('Supports are claimed hourly against the support items listed in section 4, at the rate applicable to the ratio at which each hour is delivered.'),
      b('They are not claimed as a weekly supported independent living allocation and are not quoted as a fixed weekly sum.'),
      b(`Invoices are issued to Awesome Plan Management, the plan manager, itemised by date, service period, ratio, hours and support item.`),
      b('All supports are GST-free. No travel, non-face-to-face or provider travel claims are made against this schedule.'),
      b('Where a support is not delivered it is not claimed.'),

      h(7, 'Review'),
      p(`This schedule reflects the supports approved in the NDIA's Home and Living letter of 1 June 2026 and takes effect on ${P.start}, the day after Nino's SIL trial ended. It will be reviewed once the standing roster is confirmed, on any change to the participant's assessed need, the shared living arrangement or the NDIS price limits, and in any case at the participant's plan review.`),
      p(`Prepared by Kevin Rae Geronimo, General Manager, One Life Foundation Pty Ltd — ${P.issue}.`,
        { size: 19, color: '4A4A5A' }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(path.join(__dirname, FILE), buf);
fs.writeFileSync(path.join('C:', 'Users', 'kevin', 'Downloads', FILE), buf);
console.log(`${FILE}`);
console.log(`  ${HOURS} funded hours/week · ${RATES.length} rate lines`);
