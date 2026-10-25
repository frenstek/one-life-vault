/*  SIL Service Agreement — Antonino (Nino) Fiorito — full-term agreement that
 *  follows his SIL trial at OLF, with the Schedule of Supports annexed inside
 *  the same document (Annexure A). Mirrors generate-darrell-service-agreement.mjs.
 *
 *  SOURCES (read-only, OLF vault via hcs-journal/api/_lib/db.js):
 *    participants 6d9cdc02-…  name, DOB, NDIS no., plan 29/05/2026–28/05/2027,
 *                             SC Sonia Muraca (Fundamentals), BSP Avan Gupta,
 *                             mother Anastasia (Stacey) Fiorito 0409 338 853,
 *                             funding_ratio 1:3, plan_manager_* = NULL
 *    participant_files        "Home and Living Outcome_Antonino FIORITO_HaL Letter.pdf"
 *                             (NDIA, 1 June 2026) — the APPROVED SIL supports:
 *                               14 h/wk individual · 32 h/wk "Other" (community)
 *                               56 h/wk inactive sleepover shared with 2 others
 *                               66 h/wk all other supports shared with 2 others
 *                               10 days/yr irregular supports · total $220,301.48
 *    support_plans            trial plan 11/08/2026 – 22/09/2026 ("trial period of 6 weeks")
 *    property_residents       Nino active at Severn, Epping (3 active residents)
 *    trial agreement          generate-nino-service-agreement.mjs, OLF-SIL-003,
 *                             "6-Week Trial — 11/08/2026 to 22/09/2026"
 *
 *  Start = the day after the documented trial end (22/09/2026) = 23/09/2026.
 *  Anything the data does not establish is printed as a highlighted TO CONFIRM.
 *
 *  Rates: the 1:1 2026-27 national rates are the ones used in Darrell's schedule.
 *  The 1:3 rate is the 1:1 rate divided by three, the same rule that makes
 *  Darrell's 1:2 rates exactly half (and that OLF's 2025-26 1:3 claims follow,
 *  e.g. Saturday $98.82 → $32.94).
 *
 *    node generate-antonino-service-agreement.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType, Header, Footer, PageBreak,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'Service_Agreement_Antonino_Fiorito_SIL.docx';
const logo = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));   // 522 × 267

const BLUE = '309EDD', BLUE_DK = '1A7AB8', WHITE = 'FFFFFF',
      INK = '1A1A2E', GREY = '4A4A5A', LINE = 'D0D5DD', TINT = 'EAF5FC';
const bd = {
  top: { style: BorderStyle.SINGLE, size: 1, color: LINE },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE },
  left: { style: BorderStyle.SINGLE, size: 1, color: LINE },
  right: { style: BorderStyle.SINGLE, size: 1, color: LINE },
};
/* any text carrying "TO CONFIRM" is bold + yellow-highlighted so it cannot be missed */
const r = (t, o = {}) => new TextRun({ text: t, size: 20, color: INK, font: 'Inter', ...o,
  ...(/TO CONFIRM/.test(t) ? { highlight: 'yellow', bold: true, color: INK } : {}) });
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
const TBC = (what) => `[${what} — TO CONFIRM]`;

/* ── participant ─────────────────────────────────────────────────────── */
const P = {
  name: 'Antonino Fiorito', pref: 'Nino', ndis: '430 200 387', dob: '04/03/2005',
  address: '59 Severn Street, Epping VIC 3076',
  rep: 'Anastasia (Stacey) Fiorito', repRel: 'Mother', repPhone: '0409 338 853', repEmail: 'john_stacey@bigpond.com',
  plan: '29/05/2026 – 28/05/2027',
  sc: 'Sonia Muraca', scOrg: 'Fundamentals',
  bsp: 'Avan Gupta, Bespoke Behaviour Pty Ltd',
  ref: 'OLF-SA-AF-001', issue: '23 September 2026', version: '1.0',
  trialRef: 'OLF-SIL-003', trial: '11/08/2026 – 22/09/2026',
  start: '23 September 2026',   // day after the documented trial end, 22/09/2026
  end: '28 May 2027',           // end of the current NDIS plan
};
const PROV = {
  name: 'One Life Foundation Pty Ltd', abn: '55 643 227 061', reg: '4050120437',
  addr: '9C Grasslands Avenue, Craigieburn VIC 3064',
  email: 'support@olfndisservices.com.au', web: 'www.olfndisservices.com.au',
};

/* ── NDIA-approved SIL supports (Home and Living letter, 1 June 2026) ─── */
const FUNDED = [
  ['Individual supports', '1:1', 14],
  ['"Other" supports — community, or when not in the home', TBC('ratio not stated in NDIA letter'), 32],
  ['Inactive sleepover supports', '1:3 — shared with 2 other people', 56],
  ['All other supports', '1:3 — shared with 2 other people', 66],
];
const HOURS = FUNDED.reduce((s, f) => s + f[2], 0);   // 168

/* ── items and rates: Darrell's 2026-27 national 1:1 rates; 1:3 = 1:1 ÷ 3 ─ */
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
  styles: { default: { document: { run: { font: 'Inter', size: 20, color: INK } } } },
  sections: [{
    properties: { page: { margin: { top: 1100, right: 720, bottom: 640, left: 720 } } },
    headers: { default: new Header({ children: [new Paragraph({
      spacing: { after: 60 },
      children: [new ImageRun({ data: logo, type: 'png', transformation: { width: 118, height: 60 } })],
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
        ['Document version', `${P.version}`],
        ['Date of issue', P.issue],
        ['Agreement reference', P.ref],
        ['Follows', `Trial service agreement ${P.trialRef}, ${P.trial}`],
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
        ['Contact', `Through his mother, ${P.rep} — ${P.repPhone} — ${P.repEmail}`],
      ]),
      sub('Participant\'s representative'),
      tbl([
        ['Full name', P.rep],
        ['Relationship', P.repRel],
        ['Authority', 'Authorised Representative'],
        ['Phone', P.repPhone],
        ['Email', P.repEmail],
      ]),
      sub('Plan management and coordination'),
      tbl([
        ['Plan management type', 'Plan-managed'],
        ['Plan manager', 'Awesome Plan Management — email and phone [to confirm]'],
        ['Support coordinator', `${P.sc}, ${P.scOrg}`],
        ['Behaviour support practitioner', P.bsp],
      ]),

      h('2', 'Purpose and goals'),
      p(`This agreement is made under the National Disability Insurance Scheme Act 2013 (Cth) and sets out the Supported Independent Living supports that ${PROV.name} will deliver to ${P.pref}, and the basis on which those supports are claimed.`),
      p(`${P.pref} moved into the shared supported living home at ${P.address} for a trial period under agreement ${P.trialRef} (${P.trial}). This agreement continues his supports on an ongoing basis now that the trial has ended. His NDIS plan includes Supported Independent Living, as confirmed in the NDIA's Home and Living letter of 1 June 2026. The supports in Annexure A are directed at:`),
      b('Settling into and maintaining his home in a shared supported living arrangement, with consistent staff and a predictable daily routine.'),
      b('Building independence in daily living tasks, with prompting reduced over time.'),
      b('Safe personal care, mealtime support in line with his Mealtime Checklist, and full assistance with medication.'),
      b('Implementing his Behaviour Support Plan, prepared by his behaviour support practitioner.'),
      b('Supporting his communication, including the transition to his new communication device.'),
      b('Community access and maintaining his relationships with family.'),
      b('Overnight safety, including the response set out in his health and emergency plans.'),

      h('3', 'Agreement period'),
      tbl([
        ['Agreement start', `${P.start} — the day after the trial period ended (${P.trial})`],
        ['Agreement end', `${P.end} — end of the current NDIS plan`],
        ['NDIS plan period', P.plan],
        ['Review', 'At each plan review, on any change to assessed need or living arrangement, and on any NDIS price update.'],
      ]),

      pb(),
      h('4', 'Schedule of Supports'),
      p('The Schedule of Supports is set out in full at Annexure A to this agreement and forms part of it. It is not a separate document.'),
      p('Annexure A states the support ratio approved by the NDIA, the hours funded each week, the NDIS support items and the unit rate applicable to each item at each ratio, and the basis of claiming.'),
      sub('Supports included'),
      b('Personal care — showering (including water temperature), hair washing, shaving and oral hygiene, with prompting.'),
      b('Daily living — meal preparation, cleaning, laundry and household tasks, with prompting.'),
      b('Mealtime support in line with his Mealtime Checklist.'),
      b('Medication support — full assistance with all medication, in accordance with his medication plan.'),
      b('Implementation of his Behaviour Support Plan and de-escalation strategies.'),
      b('Overnight support in line with the approved sleepover arrangement.'),
      b('Health support — monitoring, emergency response in line with his health plans, and attendance at appointments.'),
      b('Community access, social participation and maintaining family relationships.'),
      b('Communication support, including visual boards and his communication device.'),
      sub('Supports not included'),
      b('Accommodation, rent, tenancy matters and property maintenance, including Specialist Disability Accommodation.'),
      b('Allied health and therapy services, which are funded separately.'),
      b('Support coordination and behaviour support, which are funded separately.'),
      b('Day-to-day living costs — food, utilities, medication and personal items.'),

      h('5', 'Fees, claiming and funding'),
      tbl([
        ['Support category', 'Core Supports — Assistance with Daily Living'],
        ['Support items', '01_801 / 01_802 / 01_803 / 01_804 / 01_805 _0138_1_1, and the inactive sleepover item (see Annexure A)'],
        ['Basis of claiming', 'Hourly, against each support item at the rate applicable to the ratio delivered'],
        ['Weekly allocation', 'Not applicable — supports are not claimed as a weekly allocation'],
        ['Invoices to', 'Awesome Plan Management (plan manager)'],
        ['GST', 'NDIS supports under this agreement are GST-free'],
      ]),
      b('Supports are claimed hourly. The amount claimed in any week is the hours actually delivered at the applicable rate, and is itemised on the invoice by date, service period, ratio, hours and support item.'),
      b('Rates are the NDIS Pricing Arrangements and Price Limits in force at the time of delivery. Where the NDIA updates price limits, the updated limit applies from its effective date.'),
      b(`${PROV.name} will not charge above the NDIS price limit for any support item.`),
      b('No gap fees, administration fees or surcharges are charged.'),
      b('Supports not delivered are not claimed, including time Nino spends at his family home or with another provider.'),
      b('Where funding is approaching exhaustion, the participant, his representative and his support coordinator will be notified at least 14 days in advance.'),

      h('6', 'Provider obligations'),
      b('Deliver supports in a person-centred, safe and competent manner.'),
      b('Comply with the NDIS Act 2013 (Cth), the NDIS Practice Standards and the NDIS Code of Conduct.'),
      b('Maintain NDIS registration for the duration of this agreement.'),
      b('Ensure workers hold current NDIS Worker Screening clearances and the training his support plans require, including his Behaviour Support Plan and emergency medication.'),
      b('Maintain accurate records of supports delivered, and issue itemised invoices.'),
      b('Consult the participant and his representative on rostering, and give at least 7 days\' notice of roster changes where practicable. Nino responds best to familiar, consistent staff.'),
      b('Communicate openly with the participant, his representative, his support coordinator, his behaviour support practitioner and his plan manager, Awesome Plan Management.'),

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
      b('To give notice of cancellations, and of planned time at the family home, in accordance with clause 9.'),

      h('9', 'Cancellation and short notice'),
      p('Short notice cancellation is governed by the NDIS Pricing Arrangements and Price Limits in force at the time. Where a cancellation falls within the short notice period defined by the NDIA, the provider may claim in accordance with those rules. Where it does not, no claim is made.'),

      h('10', 'Ending this agreement'),
      p('Either party may end this agreement by giving 28 days\' written notice. Either party may end it immediately where there is a serious breach, a risk to health or safety, or where the participant\'s circumstances change such that the supports can no longer be safely delivered. The provider will support a planned transition to another provider and will transfer records on request.'),

      h('11', 'Incidents, complaints and feedback'),
      b('Incidents are managed under the provider\'s incident management system and reportable incidents are notified to the NDIS Quality and Safeguards Commission within the required timeframes.'),
      b('Any restrictive practice is used only as authorised and documented in his Behaviour Support Plan, and is reported as required.'),
      b(`Complaints may be made to ${PROV.name} at ${PROV.email}, and will be acknowledged within 2 business days.`),
      b('Complaints may be made directly to the NDIS Quality and Safeguards Commission on 1800 035 544 or at ndiscommission.gov.au at any time.'),

      h('12', 'Privacy'),
      p('Personal and health information is collected, used and stored in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles, and is disclosed only as required to deliver supports, to meet legal obligations, or with consent.'),

      h('13', 'Governing law'),
      p('This agreement is governed by the laws of the State of Victoria and the Commonwealth of Australia.'),

      h('14', 'Agreement'),
      p('The parties agree to the supports set out in Annexure A, on the terms of this agreement.'),
      grid(['', 'Participant', 'Participant\'s representative', 'Provider'], [
        ['Name', P.name, P.rep, 'Kevin Rae Geronimo'],
        ['Position', 'Participant', `${P.repRel} / authorised representative`, 'General Manager'],
        ['Signature', '', '', ''],
        ['Date', '', '', ''],
      ], [13, 29, 29, 29]),
      p('Where the participant is supported to sign, or his representative signs on his behalf, the name and relationship of that person is recorded above.', { size: 17, color: GREY }),

      /* ───────────────────────── ANNEXURE A ───────────────────────── */
      pb(),
      new Paragraph({ spacing: { after: 60 }, children: [r('ANNEXURE A', { bold: true, size: 30, color: BLUE_DK })] }),
      new Paragraph({ spacing: { after: 160 }, children: [r('Schedule of Supports', { bold: true, size: 26, color: INK })] }),
      p(`Forming part of Service Agreement ${P.ref} between ${PROV.name} and ${P.name} (NDIS ${P.ndis}).`,
        { size: 19, color: GREY }),

      h('A1', 'Summary'),
      grid(['Matter', 'Position'], [
        ['Support ratio', 'Shared 1:3 (with two other residents), with 14 hours each week of individual 1:1 support — see A2'],
        ['Support hours each week', `${HOURS} hours — 24-hour supported independent living, as approved by the NDIA (A2)`],
        ['Support category', 'Core Supports — Assistance with Daily Living'],
        ['Support items and rates', 'See A3 — item, ratio and applicable unit rate'],
        ['Basis of claiming', 'Hourly against each item. Not a weekly allocation.'],
      ], [26, 74]),

      h('A2', 'Approved support ratio and funded hours'),
      p(`${P.pref} lives in a shared supported independent living arrangement with two other residents. The NDIA's Home and Living letter of 1 June 2026 approves the following Supported Independent Living supports in his plan:`),
      grid(['Support type (NDIA letter)', 'Ratio', 'Hrs/wk'],
        [...FUNDED.map(([t, rt, hr]) => [t, rt, String(hr)]), ['Total', '', String(HOURS)]],
        [52, 34, 14], { right: [2], boldLast: true }),
      p('The plan also includes 10 days a year of irregular supports in the home, for days he cannot attend his usual activities, for example when unwell. These are claimed only when used.', { size: 19 }),

      h('A3', 'Support items and rates'),
      grid(['Support item', 'Support', 'Ratio', 'Applicable rate'],
        RATES.map(([item, band, ratio, rate]) => [item, `Assistance With Self-Care Activities — Standard — ${band}`, ratio, rate]),
        [24, 46, 10, 20], { right: [3] }),
      p('Rates are the unit price per hour for each item at the ratio delivered, per the 2026-27 NDIS Pricing Arrangements and Price Limits. The 1:3 rate is one third of the 1:1 rate. The amount claimed in any week is the hours actually delivered at these rates, itemised on the invoice.',
        { size: 18, color: GREY }),

      pb(),
      h('A4', 'Weekly roster'),
      p(`The split of the ${HOURS} funded hours across weekday daytime, evening, overnight, Saturday and Sunday, and the specific hours delivered 1:1, will be set out in his roster of care. ${TBC('standing weekly roster — no roster of care for Nino is recorded in the vault yet')}`),
      p('Time Nino spends at his family home, or with a community support worker from another provider, is not delivered by One Life Foundation and is not claimed.'),

      h('A5', 'Basis of claiming'),
      b('Supports are claimed hourly against the items in A3, at the rate applicable to the ratio at which each hour is delivered.'),
      b('They are not claimed as a weekly supported independent living allocation and are not quoted as a fixed weekly sum.'),
      b(`Invoices are issued to Awesome Plan Management, the plan manager, itemised by date, service period, ratio, hours and support item.`),
      b('All supports are GST-free. No travel, non-face-to-face or provider travel claims are made under this schedule.'),
      b('Supports not delivered are not claimed.'),

      h('A6', 'Review'),
      p(`This schedule reflects the supports approved in the NDIA's Home and Living letter of 1 June 2026. It will be reviewed once the standing roster is confirmed, on any change to ${P.pref}'s assessed need or living arrangement, on any NDIS price update, and at each plan review.`),
      p(`Prepared and approved by Kevin Rae Geronimo, General Manager, ${PROV.name} — ${P.issue}.`,
        { size: 19, color: GREY }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(path.join(__dirname, FILE), buf);
try { fs.writeFileSync(path.join('C:', 'Users', 'kevin', 'Downloads', FILE), buf); } catch (e) { const alt = FILE.replace('.docx', '-v3.docx'); fs.writeFileSync(path.join('C:', 'Users', 'kevin', 'Downloads', alt), buf); console.log('  Downloads copy locked (' + e.code + ') — saved as ' + alt); }
console.log(FILE);
console.log(`  funded: ${HOURS} h/week across ${FUNDED.length} NDIA support types; rate lines: ${RATES.length}`);
