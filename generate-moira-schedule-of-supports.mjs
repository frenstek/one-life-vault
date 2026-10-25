/*  Schedule of Supports — Moira Sunai. Attached to Service Agreement OLF-SA-MS-001.
 *  Every number comes from her NDIS budget breakdown (7 Oct 2025); the weekly
 *  pattern is 22 h/day of 1:1 self-care plus 2 h/day of 1:1 community
 *  participation = 24-hour 1:1 support, every day of the plan.
 *
 *    node generate-moira-schedule-of-supports.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, PageBreak, ShadingType, Header, Footer, PageOrientation,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'Schedule_of_Supports_Moira_Sunai.docx';
const outputPath = path.join(__dirname, FILE);
const downloadsPath = path.join('C:', 'Users', 'kevin', 'Downloads', FILE);
const logoBuffer = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));

const OLF_BLUE = '309EDD', OLF_BLUE_DARK = '1A7AB8', WHITE = 'FFFFFF', TEXT_PRIMARY = '1A1A2E', TEXT_SECONDARY = '4A4A5A', BORDER_COLOR = 'D0D5DD', TINT = 'EAF5FC', SOFT = 'F5F7FA';
const noBorders = { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } };
const cellBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } };
const run = (text, o = {}) => new TextRun({ text, size: 20, color: TEXT_PRIMARY, font: 'Inter', ...o });
const h = (num, text) => new Paragraph({ spacing: { before: 360, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, children: [...(num ? [run(`${num}. `, { bold: true, size: 26, color: OLF_BLUE })] : []), run(text, { bold: true, size: 26, color: OLF_BLUE_DARK })] });
const p = (text, o = {}) => new Paragraph({ spacing: { after: 140 }, children: [run(text, o)] });
const b = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [run(text)] });
const sub = (text) => new Paragraph({ spacing: { before: 220, after: 90 }, children: [run(text, { bold: true, size: 22 })] });
const cell = (text, o = {}) => new TableCell({ borders: cellBorders, width: { size: o.w || 20, type: WidthType.PERCENTAGE }, ...(o.shade ? { shading: { type: ShadingType.SOLID, color: o.shade } } : {}), verticalAlign: 'center', children: [new Paragraph({ alignment: o.right ? AlignmentType.RIGHT : o.center ? AlignmentType.CENTER : AlignmentType.LEFT, children: [run(text, { size: o.size || 18, bold: !!o.bold, color: o.color || TEXT_PRIMARY, italics: !!o.ph })] })] });
const kv = (rows) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(([l, v, ph]) => new TableRow({ children: [cell(l, { w: 34, shade: OLF_BLUE, bold: true, color: WHITE, size: 19 }), cell(v, { w: 66, size: 19, color: ph ? '999999' : TEXT_PRIMARY, ph })] })) });
const grid = (head, rows, widths, opts = {}) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, { w: widths[i], shade: OLF_BLUE, bold: true, color: WHITE, size: 17, right: (opts.right || []).includes(i) })) }),
  ...rows.map((r, ri) => new TableRow({ children: r.map((t, i) => cell(t, { w: widths[i], size: 17, right: (opts.right || []).includes(i), bold: opts.boldLast && ri === rows.length - 1, shade: opts.boldLast && ri === rows.length - 1 ? TINT : (opts.shadeCol === i ? SOFT : undefined) })) })),
] });
const pb = () => new Paragraph({ children: [new PageBreak()] });
const money = (n) => '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── the plan, as the NDIA built it (budget breakdown 7 Oct 2025) ─────── */
const P = { name: 'Moira Sunai', ndis: '431 040 053', plan: '02/10/2025 – 01/10/2030', ref: 'OLF-SA-MS-001', issue: '12/09/2026', version: '1.3' };
//  [item, support, when, hours per occurrence, occurrences per week, plan rate, plan days, plan total]
const LINES = [
  ['01_011_0107_1_1', 'Self-care — weekday daytime', 'Mon–Fri', 12, 5, 110.37, 1261, 1594156.20],
  ['01_015_0107_1_1', 'Self-care — weekday evening', 'Mon–Fri', 4, 5, 121.61, 1261, 585457.08],
  ['01_002_0107_1_1', 'Self-care — weekday night (active)', 'Mon–Fri', 6, 5, 123.86, 1261, 894452.52],
  ['01_013_0107_1_1', 'Self-care — Saturday', 'Sat', 22, 1, 155.31, 251, 818636.50],
  ['01_014_0107_1_1', 'Self-care — Sunday', 'Sun', 22, 1, 200.25, 254, 1068146.20],
  ['01_012_0107_1_1', 'Self-care — public holiday', 'per public holiday', 22, 0, 245.19, 60, 308946.00],
  ['04_104_0125_6_1', 'Community participation — weekday daytime', 'Mon–Fri', 2, 5, 110.37, 1261, 265692.70],
  ['04_105_0125_6_1', 'Community participation — Saturday', 'Sat', 2, 1, 155.31, 251, 74421.50],
  ['04_106_0125_6_1', 'Community participation — Sunday', 'Sun', 2, 1, 200.25, 254, 97104.20],
  ['04_102_0125_6_1', 'Community participation — public holiday', 'per public holiday', 2, 0, 245.19, 60, 28086.00],
];
const weekHours = LINES.reduce((s, l) => s + l[3] * l[4], 0);
const weekCost = LINES.reduce((s, l) => s + l[3] * l[4] * l[5], 0);
const planTotal = LINES.reduce((s, l) => s + l[7], 0);
const selfCare = LINES.slice(0, 6).reduce((s, l) => s + l[7], 0);
const community = LINES.slice(6).reduce((s, l) => s + l[7], 0);

const doc = new Document({
  styles: { default: { document: { run: { font: 'Inter', size: 20, color: TEXT_PRIMARY } } } },
  sections: [{
    properties: { page: { margin: { top: 1000, right: 900, bottom: 1000, left: 900 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: OLF_BLUE } }, spacing: { after: 100 }, children: [new ImageRun({ data: logoBuffer, transformation: { width: 140, height: 72 }, type: 'png' }), run('\t'), run('One Life Foundation', { bold: true, size: 26, color: OLF_BLUE_DARK })] })] }) },
    footers: { default: new Footer({ children: [
      new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, spacing: { before: 100 }, children: [run('One Life Foundation Pty Ltd', { bold: true, size: 16, color: OLF_BLUE_DARK }), run('  |  ABN 55 643 227 061  |  NDIS Registered Provider 405 012 0437', { size: 16, color: TEXT_SECONDARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run(`Schedule of Supports  |  ${P.name}  |  NDIS ${P.ndis}  |  Attachment to Service Agreement ${P.ref}`, { size: 16, color: TEXT_SECONDARY })] }),
    ] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 }, children: [run('Schedule of Supports', { bold: true, size: 36, color: OLF_BLUE_DARK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [run('Attachment A to the NDIS Service Agreement  |  Core Supports, 1:1', { size: 20, color: TEXT_SECONDARY })] }),
      kv([
        ['Participant', `${P.name}  —  NDIS ${P.ndis}`],
        ['NDIS Plan', `${P.plan}  (5 years)`],
        ['Service Agreement', `${P.ref}  —  this schedule forms part of that agreement`],
        ['Location / pricing zone', 'Seisia QLD 4876, Northern Peninsula Area — Modified Monash Model 7, Very Remote. Every rate in this schedule is the Very Remote price limit (national price limit × 1.5).'],
        ['Funding', 'Plan-managed by Hemera Plans. All supports 1:1. Charged at the Very Remote NDIS price limit current on the day of service.'],
        ['Version / Issued', `${P.version}  /  ${P.issue}`],
        ['Effective From', '05/09/2026 — first day of One Life Foundation supports', false],
      ]),

      h('1', 'The Pattern in One Line'),
      p('Moira is funded for 1:1 support every hour of every day: 22 hours of assistance with self-care plus 2 hours of community participation each day, on weekdays, weekends and public holidays. There are no shared or 1:2 supports in her plan.'),
      grid(['', 'Self-care (1:1)', 'Community participation (1:1)', 'Total 1:1 hours'], [
        ['Weekday (Mon–Fri)', '22 h  (12 day + 4 evening + 6 active night)', '2 h', '24 h'],
        ['Saturday', '22 h', '2 h', '24 h'],
        ['Sunday', '22 h', '2 h', '24 h'],
        ['Public holiday', '22 h', '2 h', '24 h'],
        ['Per week', '154 h', '14 h', `${weekHours} h`],
      ], [22, 34, 26, 18], { boldLast: true }),

      h('2', 'Daily Roster Pattern'),
      p('The 2 hours of community participation sit inside the day, at the time that suits Moira (drives to the park and beach, walks, shopping, family and community). Exact block times are set with Moira and her Guardian and can move week to week; the hours claimed per item do not change.'),
      sub('Weekdays (Monday to Friday)'),
      grid(['Block', 'Time', 'Support item', 'Hours', 'Notes'], [
        ['Night (active)', '00:00 – 06:00', '01_002 Self-care — weekday night', '6', 'Worker awake and on duty. Continence care, repositioning, safety checks.'],
        ['Morning', '06:00 – 10:00', '01_011 Self-care — weekday daytime', '4', 'Personal care, breakfast, medication prompts, diabetes routine.'],
        ['Community', '10:00 – 12:00', '04_104 Community participation — weekday', '2', 'Out of the house: park, beach, walks, shops, family, community. Moveable within the day.'],
        ['Day', '12:00 – 20:00', '01_011 Self-care — weekday daytime', '8', 'Lunch, rest, personal-care time she enjoys, household tasks, appointments.'],
        ['Evening', '20:00 – 24:00', '01_015 Self-care — weekday evening', '4', 'Dinner, evening routine, settling for the night.'],
        ['', '', 'Total', '24', ''],
      ], [16, 16, 34, 8, 26], { right: [3], boldLast: true }),
      sub('Saturday, Sunday and public holidays'),
      grid(['Block', 'Time', 'Support item', 'Hours', 'Notes'], [
        ['All day', '00:00 – 24:00 less the community block', '01_012 Saturday / 01_013 Sunday / 01_014 public holiday — self-care', '22', 'One continuous 1:1 line of support across the day, night included (active).'],
        ['Community', '2 h within the day', '04_105 Saturday / 04_106 Sunday / 04_102 public holiday — community participation', '2', 'Same as weekdays; timed to Moira and to community and family events.'],
        ['', '', 'Total', '24', ''],
      ], [16, 20, 38, 8, 18], { right: [3], boldLast: true }),
      p('Shift handovers: workers hand over in person at each block change using Moira\'s established communication methods; the same small team is rostered wherever possible because consistency is essential for her (deafblind, non-verbal).', { size: 19, color: TEXT_SECONDARY }),

      pb(),
      h('3', 'Supports, Hours and Funding'),
      p('Hours per week are the funded hours. Moira lives in Seisia (MMM 7, Very Remote), so every support is priced at the Very Remote price limit: the national price limit multiplied by 1.5, as the NDIS Pricing Arrangements set for MMM 7 areas. Earlier versions of this schedule carried the rates the plan was built on (budget breakdown, 7 Oct 2025), which reflected the previous provider in Townsville at the 2025–26 limits. Moira now lives in Seisia, so from this version "Very Remote rate" is the current Very Remote price limit: NDIS Pricing Arrangements and Price Limits 2026–27, Schedule 1, Disability Support Worker Level 1. One Life Foundation claims at the Very Remote price limit current on the day of service, never above it. Plan totals are the NDIA\'s own line totals for the five-year plan.'),
      grid(['NDIS item', 'Support (all 1:1)', 'When', 'h/occ.', 'per week', 'National limit', 'Very Remote rate (×1.5)', 'Weekly basis', 'Plan total (5 yrs)'],
        [
          ...LINES.map((l) => [l[0], l[1], l[2], String(l[3]), l[4] ? `${l[3] * l[4]} h` : 'as they fall', money(l[5] / 1.5), money(l[5]), l[4] ? money(l[3] * l[4] * l[5]) : `${l[6]} days over the plan`, money(l[7])]),
          ['', 'Total', '', '', `${weekHours} h`, '', '', money(weekCost), money(planTotal)],
        ], [14, 22, 9, 6, 8, 9, 10, 10, 12], { right: [3, 4, 5, 6, 7, 8], boldLast: true }),
      p('Very Remote loading: the NDIS Pricing Arrangements and Price Limits allow supports delivered in Modified Monash Model 7 areas to be claimed at 150% of the national price limit. Seisia and the Northern Peninsula Area are MMM 7. The same loading applies to every self-care and community participation line above, on every day of the week.', { size: 18, color: TEXT_SECONDARY }),
      p('Weekly basis excludes public holidays, which are claimed at the public-holiday item on the days they fall (the plan allows for 60 across the five years). The weekly basis is a guide for the plan manager, not a fixed charge: only hours actually delivered are claimed.', { size: 18, color: TEXT_SECONDARY }),
      sub('Where this schedule sits in the plan'),
      kv([
        ['Core — Assistance with Daily Life (self-care lines)', money(selfCare)],
        ['Core — Social & Community Participation', money(community)],
        ['Total drawn by this schedule', `${money(planTotal)} over 5 years  (≈ ${money(planTotal / 60)} a month)`],
        ['Core Flexible budget in the plan', '$5,736,048.90 over 5 years (also covers consumables $950)'],
        ['Not in this schedule', 'Support Coordination, OT and Speech Pathology, plan management, AT repairs, recurring transport (self-managed, paid to Moira)'],
      ]),

      h('4', 'How Supports Are Claimed'),
      b('One claim line per item per day, matching the roster blocks above; night hours at the active-night item, not sleepover.'),
      b('A public holiday replaces the weekday or weekend items for that day: 22 h at 01_014 plus 2 h at 04_102.'),
      b('If a community block does not happen on a given day (weather, health), those 2 hours are delivered and claimed as self-care instead; the total stays 24 h.'),
      b('Worker travel with Moira during the community block is part of that support. Recurring transport is paid to Moira by the NDIA and is never claimed by One Life Foundation.'),
      b('Short-notice cancellations follow Section 11 of the Service Agreement; hospital stays are not charged.'),
      b('Invoices go to the plan manager, Hemera Plans, at the frequency set in the Service Agreement, listing item number, date, hours and rate.'),

      h('5', 'Review'),
      b('This schedule is reviewed with Moira and her Guardian at least every 3 months, and whenever her needs, her plan or the NDIS Pricing Arrangements change.'),
      b('A change to block times needs no new schedule; a change to funded hours or items does, issued as a new version and signed by both parties.'),
      kv([['Next review due', '05/12/2026 (3-monthly), or earlier at plan review or change of need', false], ['Roster of Care', 'Attached — Roster of Care, Moira Sunai (Attachment B)', false]]),

      h('6', 'Agreement to this Schedule'),
      p('By signing, both parties agree that these are the supports, hours and items One Life Foundation will deliver and claim under the Service Agreement.'),
      ...['Guardian for Moira Sunai (Kawia Akinsola) / Participant', 'One Life Foundation Representative'].flatMap((title) => [
        sub(title),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: ['Full Name', 'Signature', 'Date'].map((l) => new TableCell({ borders: noBorders, width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({ spacing: { after: 40 }, children: [run(l, { bold: true, size: 16, color: TEXT_SECONDARY, allCaps: true })] }), new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 200 }, children: [run(' ')] })] })) })] }),
      ]),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buf);
fs.copyFileSync(outputPath, downloadsPath);
console.log('written', outputPath, '\ncopied to', downloadsPath, `\nweekly ${weekHours} h ${money(weekCost)}; plan total ${money(planTotal)}`);
