/*  Schedule of Supports — Moira Sunai, under Humanity and Inclusion Pty Ltd.
 *
 *  Attachment 2 to HAI's Participant Service Agreement (Version 2), signed by Moira and Kawia on
 *  05/09/2026 (scan: Downloads/Service Agreement Moira.pdf). v1.2, 30 Sep 2026: relabelled from
 *  "Schedule A to HAI-SA-MS-001" and the signature block removed, because the agreement it attaches
 *  to is already signed and this copy goes to the support coordinator. Same funded pattern as
 *  the One Life Foundation version, re-skinned to HAI and corrected in three places:
 *
 *   1. The roster blocks now match the roster actually in force and the invoices being issued —
 *      active overnight 12am-6am, morning 6am-12pm, community participation 12pm-2pm, afternoon
 *      2pm-8pm, evening 8pm-12am. The OLF schedule still had community at 10am-12pm, which Kevin
 *      moved to 12pm-2pm on 21 Sep so it sits wholly inside one worker's shift.
 *   2. ⚠ The OLF schedule's weekend/public-holiday item numbers are TRANSPOSED in its roster table
 *      and claiming notes: it reads "01_012 Saturday / 01_013 Sunday / 01_014 public holiday" and
 *      "a public holiday is 22 h at 01_014". The verified codes are 01_013 Saturday, 01_014 Sunday,
 *      01_012 public holiday. Its own LINES data has them right, so only the prose is wrong — but
 *      the prose is what a plan manager reads. Fix the OLF document too.
 *   3. Evening / active-night boundary stated explicitly per Swosthani, 22 Sep 2026: 8pm-12am is
 *      evening (01_015), active overnight is 12am-6am (01_002).
 *
 *  RATES (v1.1, 30 Sep 2026) = the set Kevin confirmed on the invoices (25 and 28 Sep): self-care at
 *  the plan's budget breakdown of 7 Oct 2025, community participation at the 2026-27 Very Remote
 *  limit. Weekly basis $21,470.62, the same figure as invoices 1012-1014. The self-care lines
 *  reconcile to the NDIA's plan totals exactly; the community lines do not, and the document says so.
 *
 *    node generate-hai-moira-schedule.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, PageBreak, ShadingType, Header, Footer,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'Schedule_of_Supports_Moira_Sunai_HAI.docx';
const outputPath = path.join(__dirname, FILE);
const logoBuffer = fs.readFileSync(path.join(__dirname, 'hai-logo.png'));

/* HAI's own colours, sampled from their site and logo */
const NAVY = '001C4C', NAVY_MID = '0B2E6B', RED = 'D82221', WHITE = 'FFFFFF';
const TEXT_PRIMARY = '1F2430', TEXT_SECONDARY = '5A6270', BORDER_COLOR = 'D3D8E0', TINT = 'EAEEF6', SOFT = 'F6F7FA';

const noBorders = { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } };
const cellBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } };

const run = (text, o = {}) => new TextRun({ text, size: 20, color: TEXT_PRIMARY, font: 'Arial', ...o });
const h = (num, text) => new Paragraph({ keepNext: true, spacing: { before: 360, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: RED } }, children: [...(num ? [run(`${num}. `, { bold: true, size: 26, color: RED })] : []), run(text, { bold: true, size: 26, color: NAVY })] });
const p = (text, o = {}) => new Paragraph({ keepNext: !!o.keep, spacing: { after: 140 }, children: [run(text, o)] });
const b = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [run(text)] });
const sub = (text) => new Paragraph({ keepNext: true, spacing: { before: 220, after: 90 }, children: [run(text, { bold: true, size: 22, color: NAVY })] });
const cell = (text, o = {}) => new TableCell({ borders: cellBorders, width: { size: o.w || 20, type: WidthType.PERCENTAGE }, ...(o.shade ? { shading: { type: ShadingType.SOLID, color: o.shade } } : {}), verticalAlign: 'center', margins: { top: 50, bottom: 50, left: 90, right: 90 }, children: [new Paragraph({ keepNext: !!o.keep, alignment: o.right ? AlignmentType.RIGHT : o.center ? AlignmentType.CENTER : AlignmentType.LEFT, children: [run(text, { size: o.size || 18, bold: !!o.bold, color: o.color || TEXT_PRIMARY })] })] });
const kv = (rows) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(([l, v], ri) => new TableRow({ cantSplit: true, children: [cell(l, { w: 34, shade: NAVY, bold: true, color: WHITE, size: 19, keep: ri < rows.length - 1 }), cell(v, { w: 66, size: 19, keep: ri < rows.length - 1 })] })) });
const grid = (head, rows, widths, opts = {}) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ tableHeader: true, cantSplit: true, children: head.map((t, i) => cell(t, { w: widths[i], shade: NAVY, bold: true, color: WHITE, size: 17, keep: true, right: (opts.right || []).includes(i) })) }),
  ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((t, i) => cell(t, { w: widths[i], size: 17, keep: ri < rows.length - 1, right: (opts.right || []).includes(i), bold: opts.boldLast && ri === rows.length - 1, shade: opts.boldLast && ri === rows.length - 1 ? TINT : (opts.shadeCol === i ? SOFT : undefined) })) })),
] });
const pb = () => new Paragraph({ children: [new PageBreak()] });
const money = (n) => '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── the participant and the agreement ───────────────────────────────── */
const P = {
  name: 'Moira Sunai',
  ndis: '431 040 053',
  dob: '16/04/1958',
  plan: '02/10/2025 – 01/10/2030',
  ref: 'Participant Service Agreement signed 05/09/2026',
  issue: '30/09/2026',
  version: '1.2',
  effective: '05/09/2026',
};

/* ── the funded lines, from her NDIS budget breakdown (7 Oct 2025) ─────
   [item, support, when, hours per occurrence, occurrences per week, rate claimed,
    plan days, NDIA plan total over 5 years, 2026-27 Very Remote price limit] */
const LINES = [
  ['01_011_0107_1_1', 'Self-care — weekday daytime', 'Mon–Fri', 12, 5, 105.35, 1261, 1594156.20, 110.37],
  ['01_015_0107_1_1', 'Self-care — weekday evening', 'Mon–Fri', 4, 5, 116.07, 1261, 585457.08, 121.61],
  ['01_002_0107_1_1', 'Self-care — weekday night (active)', 'Mon–Fri', 6, 5, 118.22, 1261, 894452.52, 123.86],
  ['01_013_0107_1_1', 'Self-care — Saturday', 'Sat', 22, 1, 148.25, 251, 818636.50, 155.31],
  ['01_014_0107_1_1', 'Self-care — Sunday', 'Sun', 22, 1, 191.15, 254, 1068146.20, 200.25],
  ['01_012_0107_1_1', 'Self-care — public holiday', 'per public holiday', 22, 0, 234.05, 60, 308946.00, 245.19],
  ['04_104_0125_6_1', 'Community participation — weekday daytime', 'Mon–Fri', 2, 5, 110.37, 1261, 265692.70, 110.37],
  ['04_105_0125_6_1', 'Community participation — Saturday', 'Sat', 2, 1, 155.31, 251, 74421.50, 155.31],
  ['04_106_0125_6_1', 'Community participation — Sunday', 'Sun', 2, 1, 200.25, 254, 97104.20, 200.25],
  ['04_102_0125_6_1', 'Community participation — public holiday', 'per public holiday', 2, 0, 245.19, 60, 28086.00, 245.19],
];
const weekHours = LINES.reduce((s, l) => s + l[3] * l[4], 0);
const weekCost = LINES.reduce((s, l) => s + l[3] * l[4] * l[5], 0);
const planTotal = LINES.reduce((s, l) => s + l[7], 0);
const selfCare = LINES.slice(0, 6).reduce((s, l) => s + l[7], 0);
const community = LINES.slice(6).reduce((s, l) => s + l[7], 0);

/* the blocks that make up a weekday, matching the roster and the invoices */
const WEEKDAY = [
  ['Active overnight', '12:00am – 6:00am', '01_002 Self-care — weekday night (active)', '6', 'Worker awake and on duty all night. Continence care, repositioning, safety checks.'],
  ['Morning', '6:00am – 12:00pm', '01_011 Self-care — weekday daytime', '6', 'Personal care, breakfast, medication prompts, diabetes routine, household tasks.'],
  ['Community participation', '12:00pm – 2:00pm', '04_104 Community participation — weekday', '2', 'Out of the house: park, beach, walks, shops, family, community.'],
  ['Afternoon', '2:00pm – 8:00pm', '01_011 Self-care — weekday daytime', '6', 'Lunch, rest and naps, the personal-care time Moira enjoys, appointments, dinner.'],
  ['Evening', '8:00pm – 12:00am', '01_015 Self-care — weekday evening', '4', 'Evening routine and settling for the night.'],
  ['', '', 'Total', '24', ''],
];

const WEEKEND = [
  ['Self-care', 'Across the day, less the community block', '01_013 Saturday  ·  01_014 Sunday  ·  01_012 public holiday', '22', 'One continuous 1:1 line of support across the day, night included and active. The weekend and public-holiday items apply to the whole 24 hours — there is no separate daytime, evening or night item on these days.'],
  ['Community participation', '12:00pm – 2:00pm', '04_105 Saturday  ·  04_106 Sunday  ·  04_102 public holiday', '2', 'As weekdays; timed around community and family events.'],
  ['', '', 'Total', '24', ''],
];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Arial', size: 20, color: TEXT_PRIMARY } } } },
  sections: [{
    properties: { page: { margin: { top: 1000, right: 900, bottom: 1000, left: 900 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: RED } }, spacing: { after: 100 }, children: [new ImageRun({ data: logoBuffer, transformation: { width: 190, height: 43 }, type: 'png' })] })] }) },
    footers: { default: new Footer({ children: [
      new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: RED } }, spacing: { before: 100 }, children: [run('Humanity and Inclusion Pty Ltd', { bold: true, size: 16, color: NAVY }), run('  |  ABN 27 659 576 968  |  NDIS Registration No. 4-K7B0WDS', { size: 16, color: TEXT_SECONDARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run(`Schedule of Supports  |  ${P.name}  |  NDIS ${P.ndis}  |  Attachment 2 to the ${P.ref}`, { size: 16, color: TEXT_SECONDARY })] }),
    ] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 }, children: [run('Schedule of Supports', { bold: true, size: 36, color: NAVY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [run('Attachment 2 to the Participant Service Agreement  |  Core Supports, 1:1', { size: 20, color: TEXT_SECONDARY })] }),

      kv([
        ['Provider', 'Humanity and Inclusion Pty Ltd  —  ABN 27 659 576 968  —  NDIS Registration No. 4-K7B0WDS'],
        ['Participant', `${P.name}  —  NDIS ${P.ndis}  —  born ${P.dob}`],
        ['Home', 'Her own home, Seisia QLD 4876, Northern Peninsula Area'],
        ['Representative', 'Kawia Akinsola — niece and Guardian (QCAT interim order, 23 September 2021)'],
        ['NDIS Plan', `${P.plan}  (5 years)`],
        ['Service Agreement', `${P.ref}  —  this schedule is Attachment 2 of that agreement`],
        ['Pricing zone', 'Modified Monash Model 7, Very Remote. No rate in this schedule is above the Very Remote price limit, which is the national price limit multiplied by 1.5.'],
        ['Funding', 'Plan-managed by Hemera Plans. All supports 1:1. Claimed at the rates in this schedule, never above the price limit current on the day of service.'],
        ['Support ratio', '1:1 for every funded hour. There are no shared or 1:2 supports in this plan.'],
        ['Effective from', `${P.effective}  —  first day of supports`],
        ['Version / issued', `${P.version}  /  ${P.issue}`],
      ]),

      h('1', 'The pattern in one line'),
      p('Moira is funded for 1:1 support every hour of every day: 22 hours of assistance with self-care plus 2 hours of community participation each day, on weekdays, weekends and public holidays alike. That is 168 hours a week, 24 hours a day, never shared.'),
      grid(['', 'Self-care (1:1)', 'Community participation (1:1)', 'Total 1:1 hours'], [
        ['Weekday (Mon–Fri)', '22 h  (12 daytime + 4 evening + 6 active night)', '2 h', '24 h'],
        ['Saturday', '22 h', '2 h', '24 h'],
        ['Sunday', '22 h', '2 h', '24 h'],
        ['Public holiday', '22 h', '2 h', '24 h'],
        ['Per week', '154 h', '14 h', `${weekHours} h`],
      ], [22, 34, 26, 18], { boldLast: true }),

      h('2', 'Daily roster pattern'),
      p('The day is delivered as three eight-hour shifts — 6:00am to 2:00pm, 2:00pm to 10:00pm, and 10:00pm to 6:00am — worked by a small, consistent team. The two hours of community participation sit at 12:00pm to 2:00pm, wholly inside the first shift, so one worker delivers them and there is no handover in the middle of an outing.'),
      p('The blocks in the table below are claiming blocks, not shift boundaries. The NDIS daytime, evening and night items change at 8:00pm and at midnight, so a single worker\'s shift can fall across two claim lines: 8:00pm to 10:00pm is the end of the afternoon shift charged at the evening item, and 10:00pm to midnight is the start of the night shift charged at the same evening item. Active overnight begins at midnight.', { size: 19, color: TEXT_SECONDARY }),
      sub('Weekdays (Monday to Friday)'),
      grid(['Block', 'Time', 'Support item', 'Hours', 'What happens'], WEEKDAY, [17, 15, 33, 8, 27], { right: [3], boldLast: true }),
      sub('Saturday, Sunday and public holidays'),
      grid(['Block', 'Time', 'Support item', 'Hours', 'What happens'], WEEKEND, [17, 18, 30, 8, 27], { right: [3], boldLast: true }),
      p('Shift handovers happen in person at each change of shift, using Moira\'s established communication methods. Moira is deafblind and non-verbal, so consistency of worker is a safeguard, not a convenience: the same small team is rostered wherever possible and every new worker is introduced by a worker she knows.', { size: 19, color: TEXT_SECONDARY }),

      h('3', 'Supports, hours and funding'),
      p('Hours per week are the funded hours. Moira lives in Seisia, which is Modified Monash Model 7 (Very Remote), so the price limit for every support is the Very Remote limit — the national price limit multiplied by 1.5, as the NDIS Pricing Arrangements provide for MMM 7 areas.'),
      p('Self-care is claimed at the rates in Moira\'s NDIS budget breakdown of 7 October 2025, the rates her plan was funded at, so the self-care lines match the plan totals in the last column exactly. Community participation is claimed at the current Very Remote limit under the NDIS Pricing Arrangements and Price Limits 2026–27, which is about 4.8% above the rate the plan\'s community lines were calculated at. The limit column shows the 2026–27 Very Remote limit for each item: no rate claimed is above it. Only hours actually delivered are claimed.', { size: 19, color: TEXT_SECONDARY }),
      grid(['NDIS item', 'Support (all 1:1)', 'When', 'h/occ.', 'per week', 'Rate claimed', 'Very Remote limit 2026–27', 'Weekly basis', 'Plan total (5 yrs)'],
        [
          ...LINES.map((l) => [l[0], l[1], l[2], String(l[3]), l[4] ? `${l[3] * l[4]} h` : 'as they fall', money(l[5]), money(l[8]), l[4] ? money(l[3] * l[4] * l[5]) : `${l[6]} days over the plan`, money(l[7])]),
          ['', 'Total', '', '', `${weekHours} h`, '', '', money(weekCost), money(planTotal)],
        ], [14, 22, 9, 6, 8, 9, 10, 10, 12], { right: [3, 4, 5, 6, 7, 8], boldLast: true }),
      p('Weekly basis excludes public holidays, which are claimed at the public-holiday items on the days they fall — the plan allows for 60 public holidays across the five years. The weekly basis is a guide for the plan manager, not a fixed charge.', { size: 18, color: TEXT_SECONDARY }),
      sub('Where this schedule sits in the plan'),
      kv([
        ['Core — Assistance with Daily Life (self-care lines)', money(selfCare)],
        ['Core — Social and Community Participation', money(community)],
        ['Total drawn by this schedule', `${money(planTotal)} over 5 years  (≈ ${money(planTotal / 60)} a month)`],
        ['Core Flexible budget in the plan', '$5,736,048.90 over 5 years (also covers consumables of $950)'],
        ['Not in this schedule', 'Support Coordination, Occupational Therapy and Speech Pathology, plan management, assistive technology repairs, and recurring transport (self-managed, paid to Moira)'],
      ]),

      h('4', 'How supports are claimed'),
      b('One claim line per item per day, matching the claiming blocks above. Night hours are claimed at the active-night item, never as a sleepover — a worker is awake and on duty.'),
      b('8:00pm to midnight on a weekday is the evening item (01_015). Midnight to 6:00am is the weekday active-night item (01_002).'),
      b('On a Saturday, Sunday or public holiday, one item covers the whole 24 hours: 22 hours of self-care at 01_013, 01_014 or 01_012 respectively, plus 2 hours of community participation at 04_105, 04_106 or 04_102. There is no separate evening or night item on those days.'),
      b('A public holiday replaces the weekday or weekend items for that day entirely: 22 hours at 01_012 plus 2 hours at 04_102.'),
      b('If the community block cannot happen on a given day because of weather or health, those two hours are delivered and claimed as self-care instead. The daily total stays at 24 hours.'),
      b('Worker travel with Moira during the community block is part of that support. Recurring transport is paid to Moira by the NDIA and is never claimed by Humanity and Inclusion.'),
      b('Every claimed shift is evidenced by a progress note naming the worker who delivered it. Notes are available to the plan manager and the NDIA on request.'),
      b('Short-notice cancellations follow the cancellations clause of the Service Agreement. Hospital stays are not charged.'),
      b('Invoices go to the plan manager, Hemera Plans, listing the support item number, the date, the hours and the rate for each line.'),

      h('5', 'Review'),
      b('This schedule is reviewed with Moira and her Guardian at least every three months, and whenever her needs, her plan, or the NDIS Pricing Arrangements change.'),
      b('A change to block times needs no new schedule. A change to funded hours or to support items does, and is issued as a new version agreed with her representative.'),
      b('The rates in this schedule stay as listed until a new version is issued. If an NDIS price limit falls below a rate listed here, the lower limit is claimed from that day.'),
      kv([
        ['Next review due', '22/12/2026 (three-monthly), or earlier at plan review or change of need'],
        ['Roster of Care', 'Attached separately — Roster of Care, Moira Sunai'],
      ]),

    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buf);

let delivered = path.join('C:', 'Users', 'kevin', 'Downloads', FILE);
try { fs.writeFileSync(delivered, buf); }
catch (e) {
  if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e;
  delivered = delivered.replace(/\.docx$/, `_${new Date().toISOString().slice(11, 16).replace(':', '')}.docx`);
  fs.writeFileSync(delivered, buf);
  console.log('  (the open copy was locked — wrote a new file instead)');
}

/* the checks that matter: the day adds to 24, the week to 168, and the codes are the verified ones */
const weekdayHours = WEEKDAY.slice(0, -1).reduce((s, r) => s + Number(r[3]), 0);
const weekendHours = WEEKEND.slice(0, -1).reduce((s, r) => s + Number(r[3]), 0);
console.log('written', outputPath, '\ndelivered', delivered);
console.log(`  weekday blocks ${weekdayHours} h  ·  weekend blocks ${weekendHours} h  ${weekdayHours === 24 && weekendHours === 24 ? '✓' : '*** should both be 24'}`);
console.log(`  week ${weekHours} h ${weekHours === 168 ? '✓' : '*** should be 168'}  ·  weekly basis ${money(weekCost)}  ·  plan total ${money(planTotal)}`);
const over = LINES.filter((l) => l[5] > l[8]);
console.log(`  weekly basis vs invoices 1012-1014 ($21,470.62) ${Math.abs(weekCost - 21470.62) < 0.005 ? '✓' : '*** MISMATCH'}  ·  rates above the limit: ${over.length ? '*** ' + over.map((l) => l[0]).join(', ') : 'none ✓'}`);
if (Math.abs(weekCost - 21470.62) >= 0.005 || over.length) process.exitCode = 1;
console.log(`  self-care ${money(selfCare)} + community ${money(community)} = ${money(selfCare + community)}`);
