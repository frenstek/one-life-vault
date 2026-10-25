/*  NDIS Service Agreement — Moira Sunai (1:1 Core Supports).
 *  Built on the same OLF template as the John Ross / Nino agreements.
 *  Every [bracketed, italic] value is NOT yet known — fill from source
 *  documents, never guess (see memory: moira_sunai_participant).
 *
 *    node generate-moira-service-agreement.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun,
  PageBreak, ShadingType, Header, Footer,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'NDIS_Service_Agreement_Moira_Sunai.docx';
const outputPath = path.join(__dirname, FILE);
const downloadsPath = path.join('C:', 'Users', 'kevin', 'Downloads', FILE);
const logoBuffer = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));

/* ── the participant, from her plan (budget breakdown dated 7 Oct 2025) ── */
const P = {
  name: 'Moira Sunai',
  first: 'Moira',
  ndis: '431 040 053',
  planDate: '07/10/2025',
  planTotal: '$5,830,325.70',
  planYears: '5 years (60 months)',
  funding: 'Plan-Managed',
  ratio: '1:1 (all direct supports funded individually, not shared)',
  core: '$5,269,794.50',
  community: '$465,304.40',
  transport: '$8,920.00',
  issue: '08/09/2026',
  version: '1.1',
  ref: 'OLF-SA-MS-001',
};
const TBC = (t) => [t, true];   // renders italic grey — a value still to be confirmed

/* ── styling (unchanged from the OLF template) ────────────────────────── */
const OLF_BLUE = '309EDD', OLF_BLUE_DARK = '1A7AB8', WHITE = 'FFFFFF', TEXT_PRIMARY = '1A1A2E', TEXT_SECONDARY = '4A4A5A', BORDER_COLOR = 'D0D5DD';
const noBorders = { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } };
const cellBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } };
const run = (text, o = {}) => new TextRun({ text, size: 22, color: TEXT_PRIMARY, font: 'Inter', ...o });
const h = (num, text) => new Paragraph({ spacing: { before: 400, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, children: [...(num ? [run(`${num}. `, { bold: true, size: 26, color: OLF_BLUE })] : []), run(text, { bold: true, size: 26, color: OLF_BLUE_DARK })] });
const p = (text, o = {}) => new Paragraph({ spacing: { after: 150 }, children: [run(text, o)] });
const b = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [run(text)] });
const bb = (bold, rest) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [run(bold, { bold: true }), run(rest)] });
const sub = (text) => new Paragraph({ spacing: { before: 250, after: 100 }, children: [run(text, { bold: true })] });
const pb = () => new Paragraph({ children: [new PageBreak()] });
const cell = (text, o = {}) => new TableCell({ borders: cellBorders, width: { size: o.w || 50, type: WidthType.PERCENTAGE }, ...(o.shade ? { shading: { type: ShadingType.SOLID, color: o.shade } } : {}), children: [new Paragraph({ children: [run(text, { size: o.size || 20, bold: !!o.bold, color: o.color || TEXT_PRIMARY, italics: !!o.ph })] })] });
const tbl = (rows) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(([label, value, ph]) => new TableRow({ children: [cell(label, { w: 38, shade: OLF_BLUE, bold: true, color: WHITE }), cell(value, { w: 62, color: ph ? '999999' : TEXT_PRIMARY, ph })] })) });
const grid = (head, rows, widths) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, { w: widths[i], shade: OLF_BLUE, bold: true, color: WHITE, size: 18 })) }),
  ...rows.map((r) => new TableRow({ children: r.map((t, i) => cell(t, { w: widths[i], size: 18 })) })),
] });
const sig = (title) => [sub(title), new Paragraph({ spacing: { before: 100 }, children: [] }), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: ['Full Name', 'Signature', 'Date'].map((l) => new TableCell({ borders: noBorders, width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({ spacing: { after: 40 }, children: [run(l, { bold: true, size: 16, color: TEXT_SECONDARY, allCaps: true })] }), new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 200 }, children: [run(' ')] })] })) })] }), new Paragraph({ spacing: { after: 200 }, children: [] })];

/* ── the schedule of supports, straight from the plan ─────────────────── */
const SCHEDULE = [
  ['01_011_0107_1_1', 'Assistance with self-care activities — weekday daytime', '12 h/day, Mon–Fri', '60 h', '$105.35'],
  ['01_015_0107_1_1', 'Assistance with self-care activities — weekday evening', '4 h/day, Mon–Fri', '20 h', '$116.07'],
  ['01_002_0107_1_1', 'Assistance with self-care activities — night (active overnight)', '6 h/night, Mon–Fri', '30 h', '$118.22'],
  ['01_012_0107_1_1', 'Assistance with self-care activities — Saturday', '22 h', '22 h', '$148.25'],
  ['01_013_0107_1_1', 'Assistance with self-care activities — Sunday', '22 h', '22 h', '$191.15'],
  ['01_014_0107_1_1', 'Assistance with self-care activities — public holiday', '22 h per public holiday', 'as they fall', '$234.05'],
  ['04_104_0125_6_1', 'Access community, social and recreational activities — weekday daytime', '2 h/day', '10 h', '$105.35'],
  ['04_105_0125_6_1', 'Access community, social and recreational activities — Saturday', '2 h', '2 h', '$148.25'],
  ['04_106_0125_6_1', 'Access community, social and recreational activities — Sunday', '2 h', '2 h', '$191.15'],
  ['04_102_0125_6_1', 'Access community, social and recreational activities — public holiday', '2 h per public holiday', 'as they fall', '$234.05'],
];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Inter', size: 22, color: TEXT_PRIMARY } } } },
  sections: [{
    properties: { page: { margin: { top: 1134, right: 1020, bottom: 1134, left: 1020 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: OLF_BLUE } }, spacing: { after: 100 }, children: [new ImageRun({ data: logoBuffer, transformation: { width: 160, height: 82 }, type: 'png' }), run('\t'), run('One Life Foundation', { bold: true, size: 28, color: OLF_BLUE_DARK })] })] }) },
    footers: { default: new Footer({ children: [
      new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, spacing: { before: 100 }, children: [run('One Life Foundation Pty Ltd', { bold: true, size: 16, color: OLF_BLUE_DARK }), run('  |  ABN 55 643 227 061  |  NDIS Registered Provider 405 012 0437', { size: 16, color: TEXT_SECONDARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run('0420 652 270  |  support@olfndisservices.com.au  |  www.olfndisservices.com.au', { size: 16, color: TEXT_SECONDARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run(`Service Agreement  |  ${P.name}  |  NDIS ${P.ndis}`, { size: 16, color: TEXT_SECONDARY })] }),
    ] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 80 }, children: [run('NDIS Service Agreement', { bold: true, size: 36, color: OLF_BLUE_DARK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [run('Core Supports  |  Assistance with Daily Living and Community Participation  |  1:1', { size: 22, color: TEXT_SECONDARY })] }),
      tbl([['Document Version', P.version], ['Date of Issue', P.issue], ['Agreement Reference', P.ref]]),

      h('1', 'Parties to This Agreement'),
      sub('Provider'),
      tbl([
        ['Provider Name', 'One Life Foundation Pty Ltd'], ['ABN', '55 643 227 061'], ['NDIS Registration No.', '405 012 0437'],
        ['Address', '23 Grammar Avenue, Donnybrook VIC 3064'], ['Phone', '0420 652 270'], ['Email', 'support@olfndisservices.com.au'],
      ]),
      sub('Participant'),
      tbl([
        ['Full Name', P.name], ['Date of Birth', '16/04/1958'], ['NDIS Number', P.ndis],
        ['Home', 'Her own home in Seisia QLD 4876 (street address to confirm)'],
        ['Postal (per NDIA plan)', '13 Blair Ct, Aitkenvale QLD 4814'],
        ['Phone', 'Via her Guardian, Kawia Akinsola (Moira is deafblind and non-verbal)'], ['Email', 'Via her Guardian, Kawia Akinsola'],
        ['Cultural Identity', 'Torres Strait Islander woman'],
        ['Disability', 'Deafblind (deaf and blind), non-verbal; Type II Diabetes'],
        ['Communication Needs', 'All interactions through the established communication methods known to her regular team. Consistency of approach is essential. Speech Pathology is funded.'],
        ['Mobility', 'Walking frame'],
        ['Emergency Contact', 'Kawia Akinsola — niece and Guardian — +61 447 057 034'],
        ['Health Service', 'Bamaga Primary Health Care Centre (QLD Health)'],
      ]),
      sub('Authorised Representative / Nominee (if applicable)'),
      tbl([
        ['Guardian (personal matters)', 'Kawia Akinsola — niece — Guardian under QCAT interim order dated 23 September 2021'],
        ['Administrator (financial matters)', 'The Public Trustee of Queensland — appointed 27 February 2025 — client no. PTQ20907790'],
        ['Guardian Phone', '+61 447 057 034'],
        ['Note', 'QCAT (ref G45235) is reviewing both appointments at a hearing on 21 September 2026. If the appointments change, Section 1 is updated by variation under Section 16.'],
      ]),
      sub('Plan Management & Coordination'),
      tbl([
        ['Plan Management Type', 'Plan-Managed'],
        ['Plan Manager', 'Hemera Plans (registered plan manager) — invoices are sent to Hemera Plans for payment from the Core budget'],
        ['Support Coordinator', 'Ines De Luca (Support Coordination Level 2) — ines@acclaimedcss.com.au'],
        ['Occupational Therapist', 'Matthew Firth — Do It OT — 0438 149 050 — matt@doitot.com.au'],
        ['Speech Pathologist', ...TBC('[To be confirmed]')],
        ['My NDIS Contact', 'Nicole Q — 1800 800 110 — enquiries@ndis.gov.au'],
      ]),

      h('2', 'Purpose and Goals'),
      p(`This agreement sets out the terms under which One Life Foundation will deliver NDIS-funded Core Supports to ${P.name} under her NDIS plan dated ${P.planDate}. Moira's plan funds all direct supports at a 1:1 ratio: assistance with daily living for 22 hours a day, and daily community participation. One Life Foundation is the provider of those supports.`),
      sub('Participant\'s Goals'),
      p('From Moira\'s NDIS plan, in her own words:'),
      tbl([
        ['Goal 1', 'During this plan, I would like to improve my communication so I can tell others what I want and need.'],
        ['Goal 2', 'During this plan, I would like to get out of the house more and increase my social and community participation.'],
        ['Goal 3', 'During this plan, I would like more funded supports to ensure my safety and basic needs are met.'],
      ]),
      sub('About Moira'),
      p('Moira is a Torres Strait Islander woman living in her own home in Seisia, back on Country. Her family is very important to her and she enjoys having them around, and she now likes to do things with the staff who support her daily. She enjoys personal-care time such as having her hair maintained and shaving cream on her hands and legs, being outside, drives to the park and beach, walks, good food, being around people, taking life slowly with her own time and naps, new clothes and toiletries, and touching things that feel good. In her culture Moira is a "clever person", a valued role in her community.'),

      h('3', 'Agreement Period'),
      tbl([['Start Date', '05/09/2026'], ['End Date', '01/10/2030 (plan reassessment date)'], ['NDIS Plan Period', '02/10/2025 to 01/10/2030'], ['Plan Duration', P.planYears]]),
      p('This agreement remains in effect until the end date or until terminated by either party in accordance with Section 14. It will be reviewed at least annually, and whenever Moira\'s NDIS plan is reviewed or her needs change.'),

      h('4', 'Schedule of Supports'),
      p('The supports below are drawn directly from Moira\'s NDIS plan. Hours are the funded hours per week; the roster (Section 5) sets out when they are delivered. A Roster of Care is maintained as a separate document and forms part of this agreement.'),
      grid(['NDIS Item', 'Support (all 1:1)', 'Funded', 'Per week'], SCHEDULE.map((r) => r.slice(0, 4)), [22, 48, 18, 12]),
      sub('Funding This Agreement Draws On'),
      tbl([
        ['Core — Assistance with Daily Life', `${P.core} over the plan`],
        ['Core — Social & Community Participation', `${P.community} over the plan`],
        ['Recurring — Transport', `${P.transport} is self-managed and paid to Moira directly ($68.32 a fortnight). It is not claimed by One Life Foundation.`],
        ['Plan Total (all budgets)', `${P.planTotal} over ${P.planYears}`],
      ]),
      sub('Supports Included'),
      b('Personal care: showering, toileting, continence care, grooming, dressing, oral hygiene.'),
      b('Daily living: meal preparation and mealtime assistance, cleaning, laundry, household tasks.'),
      b('Active overnight support (6 hours, weekdays) and 22-hour 1:1 cover on Saturdays, Sundays and public holidays.'),
      b('Medication prompting and administration in line with Moira\'s medication management plan.'),
      b('Health and wellbeing: attendance at appointments, exercise, health monitoring, and following clinical plans set by her OT and Speech Pathologist (e.g. mealtime management, communication supports).'),
      b('Community access and social participation, 2 hours a day, including transport by the worker where needed: drives to the park and beach, walks, and connection to family, community and Country.'),
      b('Communication in the established methods known to her regular team (deafblind and non-verbal), with the same workers wherever possible.'),
      b('Diabetes care as directed by Bamaga Primary Health, including diet and monitoring prompts.'),
      b('Communication and decision-making support.'),
      b('Emergency response and coordination with other providers, her Support Coordinator and family.'),
      sub('Supports Not Included (funded separately in the plan)'),
      b('Support Coordination (Level 2) — delivered by Moira\'s Support Coordinator.'),
      b('Occupational Therapy and Speech Pathology (Improved Daily Living).'),
      b('Plan management (Choice and Control).'),
      b('Assistive technology purchase, repairs and maintenance, and consumables.'),
      sub('Participant-Funded Expenses'),
      p('The following are Moira\'s own costs and are not covered by this agreement or NDIS funding:'),
      b('Medications — prescription and over-the-counter.'),
      b('Food, groceries and personal items.'),
      b('Entry fees, tickets and personal spending during community activities (the worker\'s time and transport are funded; Moira\'s own costs are not).'),
      b('Utilities and household bills.'),

      h('5', 'Support Roster'),
      p('Moira\'s plan funds 1:1 support 22 hours a day, every day. The roster is built with Moira and her representative and reviewed at least every 3 months. At least 7 days\' notice is given for roster changes where practicable.'),
      tbl([
        ['Weekdays', '12 h daytime + 4 h evening + 6 h active night = 22 h'],
        ['Saturday, Sunday, public holidays', '22 h'],
        ['Community participation', '2 h per day, 1:1'],
        ['Overnight model', 'Active night (worker awake and on duty)'],
        ['Support ratio', '1:1 for every support'],
        ['Roster of Care', 'Attachment A — Schedule of Supports v1.1 (24-hour 1:1 roster). The named-worker roster is held in the OLF Vault and reviewed with the Guardian at least every 3 months.'],
      ]),

      h('6', 'Fees and Funding'),
      tbl([['Support Categories', 'Core — Assistance with Daily Life; Core — Social & Community Participation; Transport'], ['Billing Frequency', 'Fortnightly, in arrears, itemised by support item number, date, hours and rate'], ['Invoices Sent To', 'Hemera Plans — admin@hemeraplans.com.au']]),
      p('All supports under this agreement are charged in accordance with the NDIS Pricing Arrangements and Price Limits current at the time the support is delivered. Price limits change on 1 July each year; the item numbers in Section 4 identify each support.'),
      b('Supports are delivered in Seisia QLD (Modified Monash Model 7, Very Remote) and are claimed at the Very Remote price limit, being 150% of the national price limit, as the Pricing Arrangements allow for MMM 7 areas.'),
      b('One Life Foundation will not charge above the applicable NDIS Price Limit for any support item.'),
      b('No gap fees, hidden charges, surcharges or administration fees beyond the NDIS-funded rate.'),
      b('Evening, night, weekend and public-holiday supports are claimed at the applicable rate for that time of day.'),
      b('Recurring transport is paid to Moira directly by the NDIA and is not claimed by One Life Foundation. Worker-driven travel during a funded community support is claimed as activity-based transport from Core only where the Pricing Arrangements allow.'),
      b('At least 14 days\' written notice will be provided before any price change resulting from NDIS Price Guide updates.'),
      b('Claims are made only for supports actually delivered in accordance with this agreement.'),
      b('NDIS supports are GST-free under the A New Tax System (Goods and Services Tax) Act 1999.'),

      h('7', 'Provider Obligations'),
      b('Deliver supports in a person-centred, safe and competent manner, with continuity of workers wherever possible.'),
      b('Comply with the NDIS Act 2013 (Cth), NDIS Practice Standards and NDIS Code of Conduct, and maintain NDIS registration for the life of this agreement.'),
      b('Ensure every worker holds a current NDIS Worker Screening Check clearance and is trained in disability support, manual handling, first aid, medication management, mealtime management and any Moira-specific requirements.'),
      b('Introduce new support workers to Moira before unsupervised shifts where practicable.'),
      b('Maintain Public Liability Insurance (min. $20M), Professional Indemnity Insurance and Workers Compensation Insurance; certificates available on request.'),
      b('Comply with the Privacy Act 1988 (Cth) and the Australian Privacy Principles.'),
      b('Develop and maintain an individual support plan and Roster of Care, reviewed at least every 3 months.'),
      b('Follow the plans of Moira\'s treating clinicians and keep them informed of relevant changes.'),

      h('8', 'NDIS Code of Conduct'),
      p('One Life Foundation and all workers are bound by the NDIS Code of Conduct. We will:'),
      bb('1. ', 'Act with respect for individual rights to freedom of expression, self-determination and decision-making.'),
      bb('2. ', 'Respect the privacy of people with disability.'),
      bb('3. ', 'Provide supports in a safe and competent manner, with care and skill.'),
      bb('4. ', 'Act with integrity, honesty and transparency.'),
      bb('5. ', 'Promptly raise and act on concerns about the quality and safety of supports.'),
      bb('6. ', 'Take all reasonable steps to prevent and respond to violence, exploitation, neglect and abuse.'),
      bb('7. ', 'Take all reasonable steps to prevent and respond to sexual misconduct.'),
      p('Code of Conduct concerns can be raised with One Life Foundation or the NDIS Commission on 1800 035 544.'),

      h('9', 'Participant Rights'),
      p('As set out in the NDIS Act 2013 and the UN Convention on the Rights of Persons with Disabilities, Moira has the right to:'),
      b('Be treated with dignity, respect and fairness at all times.'),
      b('Exercise informed choice and control over her supports, including who supports her and when.'),
      b('Dignity of risk — make her own choices even when others may disagree.'),
      b('Privacy and confidentiality of her personal information.'),
      b('Services free from violence, abuse, neglect, exploitation and discrimination.'),
      b('Access an advocate, family member or support person at any time.'),
      b('Choose and change her support provider at any time without penalty.'),
      b('Have her cultural identity, language, values and beliefs respected.'),
      b('Be supported to understand this agreement in her preferred format.'),
      b('Give feedback or make a complaint without fear of reprisal.'),

      h('10', 'Participant Responsibilities'),
      b('Treat support workers with respect.'),
      b('Provide accurate information relevant to the delivery of supports, including health changes.'),
      b('Notify One Life Foundation of changes to the NDIS plan, plan manager, or personal circumstances.'),
      b('Give reasonable notice of absences (holidays, hospital stays) so the roster can be adjusted.'),
      b('Take part in the development and review of the support plan and goals.'),
      b('Raise any concerns about supports, staff or quality with One Life Foundation.'),

      h('11', 'Cancellation and Short Notice Policy'),
      p('In accordance with the NDIS Pricing Arrangements and Price Limits:'),
      b('Cancellations with 2 or more clear business days\' notice — no cancellation fee.'),
      b('Short notice (less than 2 clear business days) or no-show — up to 100% of the agreed fee for that support may be charged.'),
      b('One Life Foundation will try to reallocate the worker before charging any cancellation fee.'),
      b('No cancellation fee where the cancellation is due to circumstances beyond Moira\'s control, such as hospitalisation.'),
      b('If One Life Foundation cancels a support (e.g. staff illness), a replacement worker will be arranged; no charge applies for supports not delivered.'),
      p('The participant or representative confirms these cancellation terms were explained before signing.'),

      h('12', 'Incident Management'),
      p('One Life Foundation manages incidents in accordance with the NDIS (Incident Management and Reportable Incidents) Rules 2018:'),
      b('All incidents are reported, recorded, investigated and reviewed.'),
      b('Moira and her representative will be notified of any incident that affects her.'),
      b('Reportable incidents (death, serious injury, abuse or neglect, sexual misconduct, unauthorised restrictive practices) are reported to the NDIS Commission within 24 hours.'),

      h('13', 'Complaints, Feedback and Disputes'),
      p('Making a complaint will not affect Moira\'s supports or this agreement. To raise a concern:'),
      bb('Step 1: ', 'Raise the matter with the support worker or team leader.'),
      bb('Step 2: ', 'If unresolved, make a formal complaint to 0420 652 270 or support@olfndisservices.com.au.'),
      bb('Step 3: ', 'Complaints are acknowledged within 2 business days and resolved within 14 business days.'),
      bb('Step 4: ', 'If unsatisfied, escalate to the NDIS Quality and Safeguards Commission on 1800 035 544, or the Queensland Office of the Public Guardian on 1300 653 187.'),
      p('Moira may involve an independent advocate at any time (disabilityadvocacyfinder.dss.gov.au or 1800 800 110).'),
      sub('Dispute Resolution'),
      b('Direct negotiation within 7 business days.'),
      b('Mediation by an independent mediator if unresolved.'),
      b('Referral to the NDIS Commission if still unresolved.'),
      p('Supports continue during a dispute unless there is an immediate safety risk.'),

      pb(),
      h('14', 'Privacy and Confidentiality'),
      p('One Life Foundation manages personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles.'),
      b('Information is collected only as necessary and stored securely.'),
      b('Information is not shared without written consent, except where required by law, to prevent serious harm, for NDIS Commission reporting, or for NDIA claims.'),
      b('Moira may access and correct her personal information at any time.'),
      b('Data breaches are reported to affected individuals and the OAIC under the Notifiable Data Breaches scheme.'),
      b('Confidentiality obligations survive termination of this agreement.'),
      sub('Consent to Share Information'),
      tbl([['NDIA / Plan Manager', 'Yes — NDIA and Hemera Plans'], ['Support Coordinator', 'Yes — Ines De Luca'], ['Occupational Therapist (Matthew Firth) and Speech Pathologist', 'Yes'], ['Public Trustee of Queensland (financial matters)', 'Yes — financial matters only'], ['Medical Practitioners', 'Yes — Bamaga Primary Health Care Centre and treating clinicians'], ['Emergency Services', 'Yes (where required)'], ['Family', 'Yes — Kawia Akinsola (niece and Guardian)'], ['Other Providers', 'Only providers named in Moira\'s NDIS plan, and only what they need to deliver their support']]),
      p('Consent may be withdrawn at any time by notifying One Life Foundation in writing.'),

      h('15', 'Termination and Transition'),
      sub('Participant-Initiated'),
      b('End this agreement at any time with no more than 14 days\' notice. No exit fees.'),
      b('Change support provider at any time without penalty.'),
      sub('Provider-Initiated'),
      p('One Life Foundation may terminate with a minimum of 14 days\' notice if:'),
      b('There is a serious or repeated breach of participant responsibilities that cannot be resolved.'),
      b('There is an immediate and ongoing safety risk to workers or to Moira.'),
      b('NDIS funding is exhausted, withdrawn or not renewed.'),
      sub('Continuity of Supports'),
      b('Supports continue during the notice period.'),
      b('With consent, a comprehensive handover is provided to the incoming provider.'),
      b('Claims cease after the termination date; records are retained securely as required by law.'),
      p('Given the 22-hour daily support Moira relies on, One Life Foundation will never cease supports abruptly without ensuring her safety and a handover.'),

      h('16', 'Review and Variation'),
      b('This agreement is reviewed at least annually, or when the NDIS plan is reviewed — whichever is earlier.'),
      b('The individual support plan and Roster of Care are reviewed at least every 3 months.'),
      b('At least 14 days\' written notice is given for any proposed change to fees, supports or terms.'),
      b('Changes require written agreement from both parties.'),

      h('17', 'Informed Consent'),
      p('By signing, the participant (or her representative) confirms:'),
      b('This agreement has been explained in a way they understand.'),
      b('They have had the opportunity to ask questions and seek independent advice.'),
      b('They understand the supports, costs, rights and responsibilities.'),
      b('An easy-read version has been offered (available on request).'),
      b('They consent to supports being delivered by One Life Foundation.'),
      b('They may withdraw consent and end this agreement at any time.'),
      sub('Cooling-Off Period'),
      p('There is a 7-day cooling-off period from signing during which the agreement may be cancelled without penalty. After this, the termination provisions in Section 15 apply.'),
      tbl([['Consent Method', 'Written, via nominee — signed by Kawia Akinsola as Guardian under the QCAT interim order of 23 September 2021'], ['Easy-Read Offered', 'Yes — the agreement was explained to Moira through her established communication methods with her Guardian present'], ['Interpreter Required', 'No spoken-language interpreter. Moira is deafblind and non-verbal; communication is through the methods known to her regular team'], ['Advocate Present', 'Guardian present; an independent advocate may be requested at any time']]),

      h('18', 'Governing Law'),
      p('This agreement is governed by:'),
      b('National Disability Insurance Scheme Act 2013 (Cth)'),
      b('NDIS (Provider Registration and Practice Standards) Rules 2018'),
      b('NDIS (Code of Conduct) Rules 2018'),
      b('NDIS (Incident Management and Reportable Incidents) Rules 2018'),
      b('NDIS Pricing Arrangements and Price Limits (current edition)'),
      b('Privacy Act 1988 (Cth) and Australian Privacy Principles'),
      b('Australian Consumer Law (Competition and Consumer Act 2010)'),
      b('Applicable Queensland legislation, including the Guardianship and Administration Act 2000 (Qld) in respect of decisions made by Moira\'s Guardian and Administrator'),
      p('Where this agreement conflicts with the NDIS Act or Rules, the Act and Rules prevail.'),

      pb(),
      h('19', 'Agreement and Signatures'),
      p('By signing below, both parties confirm they have read, understood and agree to this Service Agreement. The participant confirms she has received a copy.'),
      ...sig('Guardian for Moira Sunai (Kawia Akinsola) / Participant'),
      ...sig('One Life Foundation Representative'),
      ...sig('Witness (if required)'),
      sub('Acknowledgment of Receipt'),
      p('I confirm that I have received a signed copy of this Service Agreement.'),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: ['Participant / Representative Name', 'Signature', 'Date'].map((l) => new TableCell({ borders: noBorders, width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({ spacing: { after: 40 }, children: [run(l, { bold: true, size: 16, color: TEXT_SECONDARY, allCaps: true })] }), new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 200 }, children: [run(' ')] })] })) })] }),
    ],
  }],
});

function TBC_ROW(label) { return [label, '[To be confirmed]', true] }

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buf);
fs.copyFileSync(outputPath, downloadsPath);
console.log('written', outputPath, '\ncopied to', downloadsPath);
