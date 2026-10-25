/*  SIL Service Agreement — Darrell James Twyford — WITH the Schedule of
 *  Supports completed and annexed inside the same document.
 *
 *  My Plan Manager wrote: "The Schedule of Supports attached to the Service
 *  Agreement appears to be incomplete." They were right. The template this was
 *  built from carried placeholders — [e.g. 01_011_0107_1_1], [e.g. 1:3 shared],
 *  [Weekly / Fortnightly / Monthly] — and pointed at an "Attachment A" that was
 *  never filled in. This version answers their four questions on the face of the
 *  document, in Annexure A, with no placeholders anywhere.
 *
 *  Every figure is reconciled from the eight invoices already issued to My Plan
 *  Manager (MPM-DT-001 … 008, 22 Jun – 16 Aug 2026, 200 line items, 841 hours).
 *  The weekly pattern is the current steady state, MPM-DT-007, 3–9 Aug 2026.
 *
 *  Unit rates are stated; weekly and annual totals deliberately are NOT. A
 *  schedule of supports states what may be claimed and at what rate — the amount
 *  claimed in a given week follows the hours actually delivered and belongs on
 *  the invoice.
 *
 *    node generate-darrell-service-agreement.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType, Header, Footer, PageBreak,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'Service_Agreement_Darrell_Twyford_SIL.docx';
const logo = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));

const BLUE = '309EDD', BLUE_DK = '1A7AB8', WHITE = 'FFFFFF',
      INK = '1A1A2E', GREY = '4A4A5A', LINE = 'D0D5DD', TINT = 'EAF5FC';
const bd = {
  top: { style: BorderStyle.SINGLE, size: 1, color: LINE },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE },
  left: { style: BorderStyle.SINGLE, size: 1, color: LINE },
  right: { style: BorderStyle.SINGLE, size: 1, color: LINE },
};
const r = (t, o = {}) => new TextRun({ text: t, size: 20, color: INK, font: 'Inter', ...o });
const h = (n, t) => new Paragraph({
  spacing: { before: 340, after: 150 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: BLUE } },
  children: [...(n ? [r(`${n}. `, { bold: true, size: 26, color: BLUE })] : []),
             r(t, { bold: true, size: 26, color: BLUE_DK })],
});
const sub = (t) => new Paragraph({ spacing: { before: 220, after: 90 }, children: [r(t, { bold: true, size: 22 })] });
const p = (t, o = {}) => new Paragraph({ spacing: { after: 140 }, children: [r(t, o)] });
const b = (t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [r(t)] });
const pb = () => new Paragraph({ children: [new PageBreak()] });
const cell = (t, o = {}) => new TableCell({
  borders: bd, width: { size: o.w || 20, type: WidthType.PERCENTAGE },
  ...(o.shade ? { shading: { type: ShadingType.SOLID, color: o.shade } } : {}),
  verticalAlign: 'center',
  children: [new Paragraph({
    alignment: o.right ? AlignmentType.RIGHT : o.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [r(t, { size: o.size || 18, bold: !!o.bold, color: o.color || INK })],
  })],
});
const tbl = (rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: rows.map(([l, v]) => new TableRow({
    children: [cell(l, { w: 34, shade: BLUE, bold: true, color: WHITE, size: 19 }), cell(v, { w: 66, size: 19 })],
  })),
});
const grid = (head, rows, w, o = {}) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ tableHeader: true, children: head.map((t, i) =>
      cell(t, { w: w[i], shade: BLUE, bold: true, color: WHITE, size: 17, right: (o.right || []).includes(i) })) }),
    ...rows.map((row, ri) => new TableRow({ children: row.map((t, i) =>
      cell(t, { w: w[i], size: 17, right: (o.right || []).includes(i),
                bold: o.boldLast && ri === rows.length - 1,
                shade: o.boldLast && ri === rows.length - 1 ? TINT : undefined })) })),
  ],
});
const money = (n) => '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── participant ─────────────────────────────────────────────────────── */
const P = {
  name: 'Darrell James Twyford', pref: 'Darrell', ndis: '431 576 804', dob: '12/10/1961',
  address: '59 Severn Street, Epping VIC 3076',
  phone: '0433 795 906', email: 'darrell1210@msn.com',
  plan: '29/11/2025 – 28/11/2027',
  pm: 'My Plan Manager', pmEmail: 'accounts@myplanmanager.com.au', pmPhone: '1800 861 272',
  sc: 'Aroshi Bandarawatte', scOrg: 'Western Coordination Plus', scPhone: '0424 101 065',
  ref: 'OLF-SA-DT-001', issue: '24 September 2026', version: '2.0',
};
const PROV = {
  name: 'One Life Foundation Pty Ltd', abn: '55 643 227 061', reg: '4050120437',
  addr: '23 Grammar Avenue, Donnybrook VIC 3064',
  email: 'support@olfndisservices.com.au', web: 'www.olfndisservices.com.au',
};

/* ── Annexure A: the supports, from MPM-DT-007 (3–9 Aug 2026) ────────── */
const LINES = [
  ['01_801_0138_1_1', 'Weekday Daytime',  '1:1', 9,  73.58],
  ['01_801_0138_1_1', 'Weekday Daytime',  '1:2', 27, 36.79],
  ['01_802_0138_1_1', 'Weekday Evening',  '1:2', 10, 40.53],
  ['01_803_0138_1_1', 'Active Overnight', '1:2', 46, 41.28],
  ['01_804_0138_1_1', 'Saturday',         '1:2', 16, 51.77],
  ['01_805_0138_1_1', 'Sunday',           '1:2', 24, 66.75],
];
const HOURS = LINES.reduce((s, l) => s + l[3], 0);

const ROSTER = [
  ['Monday', '6:00am–10:00am', '1:2', 4, 'Weekday Daytime'], ['', '2:00pm–8:00pm', '1:2', 6, 'Weekday Daytime'],
  ['', '8:00pm–10:00pm', '1:2', 2, 'Weekday Evening'], ['', '10:00pm–6:00am', '1:2', 8, 'Active Overnight'],
  ['Tuesday', '6:00am–9:00am', '1:1', 3, 'Weekday Daytime'], ['', '3:00pm–6:00pm', '1:1', 3, 'Weekday Daytime'],
  ['', '6:00pm–8:00pm', '1:2', 2, 'Weekday Daytime'], ['', '8:00pm–10:00pm', '1:2', 2, 'Weekday Evening'],
  ['', '10:00pm–6:00am', '1:2', 8, 'Active Overnight'],
  ['Wednesday', '6:00am–10:00am', '1:2', 4, 'Weekday Daytime'], ['', '2:00pm–8:00pm', '1:2', 6, 'Weekday Daytime'],
  ['', '8:00pm–10:00pm', '1:2', 2, 'Weekday Evening'], ['', '10:00pm–6:00am', '1:2', 8, 'Active Overnight'],
  ['Thursday', '6:00am–10:00am', '1:2', 4, 'Weekday Daytime'], ['', '2:00pm–5:00pm', '1:1', 3, 'Weekday Daytime'],
  ['', '5:00pm–8:00pm', '1:2', 3, 'Weekday Daytime'], ['', '8:00pm–10:00pm', '1:2', 2, 'Weekday Evening'],
  ['', '10:00pm–6:00am', '1:2', 8, 'Active Overnight'],
  ['Friday', '6:00am–10:00am', '1:2', 4, 'Weekday Daytime'], ['', '2:00pm–8:00pm', '1:2', 6, 'Weekday Daytime'],
  ['', '8:00pm–10:00pm', '1:2', 2, 'Weekday Evening'], ['', '10:00pm–12:00am', '1:2', 2, 'Active Overnight'],
  ['Saturday', '12:00am–6:00am', '1:2', 6, 'Saturday'], ['', '6:00am–2:00pm', '1:2', 3, 'Saturday'],
  ['', '5:00pm–10:00pm', '1:2', 5, 'Saturday'], ['', '10:00pm–12:00am', '1:2', 2, 'Saturday'],
  ['Sunday', '12:00am–6:00am', '1:2', 6, 'Sunday'], ['', '6:00am–12:00pm', '1:2', 6, 'Sunday'],
  ['', '12:00pm–5:00pm', '1:2', 5, 'Sunday'], ['', '5:00pm–10:00pm', '1:2', 5, 'Sunday'],
  ['', '10:00pm–12:00am', '1:2', 2, 'Sunday'],
];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Inter', size: 20, color: INK } } } },
  sections: [{
    properties: { page: { margin: { top: 700, right: 720, bottom: 640, left: 720 } } },
    headers: { default: new Header({ children: [new Paragraph({
      spacing: { after: 60 },
      children: [new ImageRun({ data: logo, type: 'png', transformation: { width: 118, height: 38 } })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [r(`${PROV.name}  ·  ABN ${PROV.abn}  ·  NDIS Registration ${PROV.reg}  ·  ` +
                   `${P.ref} v${P.version}  ·  ${P.name}  ·  NDIS ${P.ndis}`, { size: 14, color: '8A8A9A' })],
    })] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 70 },
        children: [r('Supported Independent Living (SIL)', { bold: true, size: 34, color: BLUE_DK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 70 },
        children: [r('Service Agreement', { bold: true, size: 34, color: BLUE_DK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
        children: [r('NDIS funded  |  Core Supports — Assistance with Daily Living', { size: 21, color: GREY })] }),

      tbl([
        ['Document version', `${P.version} — supersedes version 1.0`],
        ['Date of issue', P.issue],
        ['Agreement reference', P.ref],
        ['Schedule of Supports', 'Annexure A to this agreement — complete, no separate attachment'],
      ]),

      h('1', 'Parties to this agreement'),
      sub('Provider'),
      tbl([
        ['Provider name', PROV.name], ['ABN', PROV.abn], ['NDIS registration number', PROV.reg],
        ['Address', PROV.addr], ['Email', PROV.email], ['Website', PROV.web],
      ]),
      sub('Participant'),
      tbl([
        ['Full name', P.name], ['Preferred name', P.pref], ['NDIS number', P.ndis],
        ['Date of birth', P.dob], ['Address where supports are delivered', P.address],
        ['Phone', P.phone], ['Email', P.email],
      ]),
      sub('Plan management and coordination'),
      tbl([
        ['Plan management type', 'Plan-managed'],
        ['Plan manager', `${P.pm} — ${P.pmEmail} — ${P.pmPhone}`],
        ['Support coordinator', `${P.sc}, ${P.scOrg} — ${P.scPhone}`],
      ]),

      h('2', 'Purpose and goals'),
      p(`This agreement is made under the National Disability Insurance Scheme Act 2013 (Cth) and sets out the Supported Independent Living supports that ${PROV.name} will deliver to ${P.pref}, and the basis on which those supports are claimed.`),
      p(`${P.pref} lives with Lewy body dementia and Parkinson's disease, with freezing gait syndrome and a documented falls risk. The supports in Annexure A are directed at:`),
      b('Maintaining his tenancy and daily living at his home in a shared supported living arrangement.'),
      b('Safe personal care, manual handling and transfers, with the staffing his assessed needs require.'),
      b('Medication support, health monitoring, and attendance at medical and allied health appointments.'),
      b('Community access and maintaining the relationships and interests that matter to him.'),
      b('Overnight safety, with active support available throughout the night.'),

      h('3', 'Agreement period'),
      tbl([
        ['Agreement start', '29 November 2025'],
        ['Agreement end', '28 November 2027'],
        ['NDIS plan period', P.plan],
        ['Review', 'At each plan review, on any change to assessed need or living arrangement, and on any NDIS price update.'],
      ]),

      pb(),
      h('4', 'Schedule of Supports'),
      p('The Schedule of Supports is set out in full at Annexure A to this agreement and forms part of it. It is not a separate document.'),
      p('Annexure A states, for every support delivered: the NDIS support item, the ratio at which it is delivered, the number of hours delivered each week, and the unit rate applicable to that item at that ratio. It also sets out the standing weekly roster and the basis of claiming.'),
      sub('Supports included'),
      b('Personal care — showering, toileting, grooming, dressing, oral hygiene, continence support.'),
      b('Manual handling and transfers, with the staffing ratio his assessed needs require.'),
      b('Daily living — meal preparation, cleaning, laundry and household tasks.'),
      b('Medication support in accordance with his medication management plan.'),
      b('Active overnight support throughout the night, every night.'),
      b('Health support — monitoring, and attendance at medical and allied health appointments.'),
      b('Community access, social participation and maintaining relationships.'),
      b('Falls prevention and implementation of allied health recommendations.'),
      sub('Supports not included'),
      b('Accommodation, rent, tenancy matters and property maintenance.'),
      b('Allied health and therapy services, which are funded separately.'),
      b('Support coordination, which is funded separately.'),
      b('Day-to-day living costs — food, utilities, personal items.'),

      h('5', 'Fees, claiming and funding'),
      tbl([
        ['Support category', 'Core Supports — Assistance with Daily Living'],
        ['Support items', '01_801 / 01_802 / 01_803 / 01_804 / 01_805 _0138_1_1 (see Annexure A)'],
        ['Basis of claiming', 'Hourly, against each support item at the rate applicable to the ratio delivered'],
        ['Weekly allocation', 'Not applicable — supports are not claimed as a weekly allocation'],
        ['Billing frequency', 'Weekly in arrears, to the plan manager'],
        ['GST', 'NDIS supports under this agreement are GST-free'],
      ]),
      b('Supports are claimed hourly. The amount claimed in any week is the hours actually delivered at the applicable rate, and is itemised on that week\'s invoice by date, service period, ratio, hours and support item.'),
      b('Rates are the NDIS Pricing Arrangements and Price Limits in force at the time of delivery. Where the NDIA updates price limits, the updated limit applies from its effective date.'),
      b(`${PROV.name} will not charge above the NDIS price limit for any support item.`),
      b('No gap fees, administration fees or surcharges are charged.'),
      b('Supports not delivered are not claimed.'),
      b('Where funding is approaching exhaustion, the participant and support coordinator will be notified at least 14 days in advance.'),

      h('6', 'Provider obligations'),
      b('Deliver supports in a person-centred, safe and competent manner.'),
      b('Comply with the NDIS Act 2013 (Cth), the NDIS Practice Standards and the NDIS Code of Conduct.'),
      b('Maintain NDIS registration for the duration of this agreement.'),
      b('Ensure workers hold current NDIS Worker Screening clearances and required training.'),
      b('Provide male support workers overnight, in accordance with the participant\'s documented preference and manual handling needs.'),
      b('Maintain accurate records of supports delivered, and issue itemised invoices.'),
      b('Consult the participant on rostering, and give at least 7 days\' notice of roster changes where practicable.'),
      b('Communicate openly with the participant, his support coordinator and his plan manager.'),

      h('7', 'Participant rights'),
      b('To be treated with dignity and respect, free from violence, abuse, neglect, exploitation and discrimination.'),
      b('To exercise choice and control over the supports he receives and who delivers them.'),
      b('To have his privacy respected and his personal information protected.'),
      b('To have a support person or advocate involved at any time.'),
      b('To give feedback or make a complaint without it affecting his supports.'),
      b('To access his own records on request.'),
      b('To end this agreement in accordance with clause 10.'),

      h('8', 'Participant responsibilities'),
      b('To tell the provider about changes to his needs, circumstances or NDIS plan.'),
      b('To treat workers with respect and provide a safe environment for support delivery.'),
      b('To give notice of cancellations in accordance with clause 9.'),

      h('9', 'Cancellation and short notice'),
      p('Short notice cancellation is governed by the NDIS Pricing Arrangements and Price Limits in force at the time. Where a cancellation falls within the short notice period defined by the NDIA, the provider may claim in accordance with those rules. Where it does not, no claim is made.'),

      h('10', 'Ending this agreement'),
      p('Either party may end this agreement by giving 28 days\' written notice. Either party may end it immediately where there is a serious breach, a risk to health or safety, or where the participant\'s circumstances change such that the supports can no longer be safely delivered. The provider will support a planned transition to another provider and will transfer records on request.'),

      h('11', 'Incidents, complaints and feedback'),
      b('Incidents are managed under the provider\'s incident management system and reportable incidents are notified to the NDIS Quality and Safeguards Commission within the required timeframes.'),
      b(`Complaints may be made to ${PROV.name} at ${PROV.email}, and will be acknowledged within 2 business days.`),
      b('Complaints may be made directly to the NDIS Quality and Safeguards Commission on 1800 035 544 or at ndiscommission.gov.au at any time.'),

      h('12', 'Privacy'),
      p('Personal and health information is collected, used and stored in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles, and is disclosed only as required to deliver supports, to meet legal obligations, or with consent.'),

      h('13', 'Governing law'),
      p('This agreement is governed by the laws of the State of Victoria and the Commonwealth of Australia.'),

      h('14', 'Agreement'),
      p('The parties agree to the supports set out in Annexure A, on the terms of this agreement.'),
      grid(['', 'Participant', 'Provider'], [
        ['Name', P.name, 'Kevin Rae Geronimo'],
        ['Position', 'Participant', 'General Manager'],
        ['Signature', '', ''],
        ['Date', '', ''],
      ], [16, 42, 42]),
      p('Where the participant is supported to sign, the name and relationship of the person providing that support should be recorded alongside.', { size: 17, color: GREY }),

      /* ───────────────────────── ANNEXURE A ───────────────────────── */
      pb(),
      new Paragraph({ spacing: { after: 60 }, children: [r('ANNEXURE A', { bold: true, size: 30, color: BLUE_DK })] }),
      new Paragraph({ spacing: { after: 160 }, children: [r('Schedule of Supports', { bold: true, size: 26, color: INK })] }),
      p(`Forming part of Service Agreement ${P.ref} between ${PROV.name} and ${P.name} (NDIS ${P.ndis}).`,
        { size: 19, color: GREY }),

      h('A1', 'Summary'),
      grid(['Matter', 'Position'], [
        ['Support ratio', 'Shared 1:2, with 9 hours each week delivered 1:1 — see A2'],
        ['Support hours each week', `${HOURS} hours — 24-hour supported independent living`],
        ['Support category', 'Core Supports — Assistance with Daily Living'],
        ['Support items and rates', 'See A3 — item, ratio, hours and applicable unit rate'],
        ['Basis of claiming', 'Hourly against each item. Not a weekly allocation.'],
      ], [26, 74]),

      h('A2', 'Support ratio'),
      p(`${P.pref} lives in a shared supported independent living arrangement with one other participant. Supports are therefore delivered and claimed at 1:2 for the majority of the week, at the published 1:2 rate, which is exactly half the corresponding 1:1 rate.`),
      p('Nine hours each week are delivered 1:1 and claimed at the 1:1 rate, being the periods where shared support is not appropriate to his assessed needs:'),
      b('Tuesday 6:00am–9:00am — personal care and manual handling'),
      b('Tuesday 3:00pm–6:00pm — community access'),
      b('Thursday 2:00pm–5:00pm — medical and allied health appointments'),
      p('Male support workers are required overnight for manual handling and transfers.', { size: 19 }),

      h('A3', 'Support items, hours and rates'),
      grid(['Support item', 'Support', 'Ratio', 'Hrs/wk', 'Applicable rate'],
        [...LINES.map(([item, name, ratio, hrs, rate]) =>
          [item, `Assistance With Self-Care Activities — Standard — ${name}`, ratio, String(hrs), money(rate)]),
         ['Total', '', '', String(HOURS), '']],
        [23, 33, 10, 12, 22], { right: [3, 4], boldLast: true }),
      p('Rates are the unit price per hour for each item at the ratio delivered, per the NDIS Pricing Arrangements and Price Limits. The amount claimed in any week is the hours actually delivered at these rates, itemised on that week\'s invoice.',
        { size: 18, color: GREY }),

      pb(),
      h('A4', 'Standing weekly roster'),
      p('The hours in A3 are delivered on the following pattern. Support is continuous — the participant is not left unsupported at any time.'),
      grid(['Day', 'Time', 'Ratio', 'Hrs', 'Claimed under'],
        ROSTER.map(([d, t, rt, hr, band]) => [d, t, rt, String(hr), band]),
        [14, 22, 10, 10, 44], { right: [3] }),

      h('A5', 'Basis of claiming'),
      b('Supports are claimed hourly against the items in A3, at the rate applicable to the ratio at which each hour is delivered.'),
      b('They are not claimed as a weekly supported independent living allocation and are not quoted as a fixed weekly sum.'),
      b('Invoices are issued weekly in arrears to the plan manager, itemised by date, service period, ratio, hours and support item.'),
      b('All supports are GST-free. No travel, non-face-to-face or provider travel claims are made under this schedule.'),
      b('Supports not delivered are not claimed.'),

      h('A6', 'Review'),
      p(`This schedule reflects supports as delivered in the week of 3–9 August 2026. It will be reviewed on any change to ${P.pref}'s assessed need or living arrangement, on any NDIS price update, and at each plan review.`),
      p(`Prepared and approved by Kevin Rae Geronimo, General Manager, ${PROV.name} — ${P.issue}.`,
        { size: 19, color: GREY }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(path.join(__dirname, FILE), buf);
fs.writeFileSync(path.join('C:', 'Users', 'kevin', 'Downloads', FILE), buf);
console.log(FILE);
console.log(`  Annexure A: ${HOURS} h/week across ${LINES.length} item/ratio lines`);
console.log(`  roster rows: ${ROSTER.length}, roster hours: ${ROSTER.reduce((s, x) => s + x[3], 0)}`);
console.log(`  placeholders remaining: ${/\[[A-Za-z ]/.test(JSON.stringify(LINES) + JSON.stringify(ROSTER)) ? 'YES' : 'none'}`);
