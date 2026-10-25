/*  NDIS Subcontracting Agreement — Heartfelt Care Services (Head Provider)
 *  engages One Life Foundation Pty Ltd (Subcontractor) to deliver supports.
 *  Heartfelt holds the participant's service agreement and makes the claims;
 *  OLF delivers the supports and invoices Heartfelt.
 *
 *    node generate-hcs-subcontract-agreement.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, PageBreak, ShadingType, Header, Footer,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'NDIS_Subcontracting_Agreement_Heartfelt_OLF.docx';
const outputPath = path.join(__dirname, FILE);
const downloadsPath = path.join('C:', 'Users', 'kevin', 'Downloads', FILE);
const logoBuffer = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));

const HP = {   // head provider
  name: 'Heartfelt Care Services', abn: '81 672 597 054', acn: '672 597 054',
  address: 'Suite 480, Level 2, 66 Victor Crescent, Narre Warren VIC 3805',
  phone: '+61 478 190 968', email: 'admin@heartfeltcareservices.com.au', rep: 'Cyril De Asis, Director', reg: '405 016 3370',
};
const SC = {   // subcontractor
  name: 'One Life Foundation Pty Ltd', short: 'One Life Foundation', abn: '55 643 227 061', reg: '405 012 0437',
  address: '23 Grammar Avenue, Donnybrook VIC 3064', phone: '0420 652 270', email: 'support@olfndisservices.com.au',
};
const REF = 'OLF-SUB-HCS-001';
const ISSUE = '12/09/2026';
const START = '05/09/2026';
const TBC = (t) => [t, true];

/* ── styling (OLF template) ───────────────────────────────────────────── */
const OLF_BLUE = '309EDD', OLF_BLUE_DARK = '1A7AB8', WHITE = 'FFFFFF', TEXT_PRIMARY = '1A1A2E', TEXT_SECONDARY = '4A4A5A', BORDER_COLOR = 'D0D5DD';
const noBorders = { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } };
const cellBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } };
const run = (text, o = {}) => new TextRun({ text, size: 22, color: TEXT_PRIMARY, font: 'Inter', ...o });
const h = (num, text) => new Paragraph({ spacing: { before: 400, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, children: [...(num ? [run(`${num}. `, { bold: true, size: 26, color: OLF_BLUE })] : []), run(text, { bold: true, size: 26, color: OLF_BLUE_DARK })] });
const p = (text, o = {}) => new Paragraph({ spacing: { after: 150 }, children: [run(text, o)] });
const n = (num, text) => new Paragraph({ spacing: { after: 120 }, indent: { left: 560, hanging: 560 }, children: [run(`${num}\t`, { bold: true }), run(text)] });
const b = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [run(text)] });
const sub = (text) => new Paragraph({ spacing: { before: 250, after: 100 }, children: [run(text, { bold: true })] });
const pb = () => new Paragraph({ children: [new PageBreak()] });
const cell = (text, o = {}) => new TableCell({ borders: cellBorders, width: { size: o.w || 50, type: WidthType.PERCENTAGE }, ...(o.shade ? { shading: { type: ShadingType.SOLID, color: o.shade } } : {}), children: [new Paragraph({ children: [run(text, { size: o.size || 20, bold: !!o.bold, color: o.color || TEXT_PRIMARY, italics: !!o.ph })] })] });
const tbl = (rows) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(([label, value, ph]) => new TableRow({ children: [cell(label, { w: 38, shade: OLF_BLUE, bold: true, color: WHITE }), cell(value, { w: 62, color: ph ? '999999' : TEXT_PRIMARY, ph })] })) });
const grid = (head, rows, widths) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, { w: widths[i], shade: OLF_BLUE, bold: true, color: WHITE, size: 18 })) }),
  ...rows.map((r) => new TableRow({ children: r.map((t, i) => cell(t, { w: widths[i], size: 18 })) })),
] });
const sig = (title) => [sub(title), new Paragraph({ spacing: { before: 100 }, children: [] }), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: ['Full Name', 'Position', 'Signature', 'Date'].map((l) => new TableCell({ borders: noBorders, width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ spacing: { after: 40 }, children: [run(l, { bold: true, size: 16, color: TEXT_SECONDARY, allCaps: true })] }), new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 200 }, children: [run(' ')] })] })) })] }), new Paragraph({ spacing: { after: 200 }, children: [] })];

const MARGIN = 2.74;   // $/hour retained by the Head Provider = ~$2,000/month over 730.4 delivered h/month (Rates calculation, 12 Sep 2026)
const HOURS_MONTH = 730.4;
const money = (v) => '$' + v.toFixed(2);
const SUPPORTS = [
  ['01_011_0107_1_1', 'Assistance with self-care activities — weekday daytime', '60 h', 110.37],
  ['01_015_0107_1_1', 'Assistance with self-care activities — weekday evening', '20 h', 121.61],
  ['01_002_0107_1_1', 'Assistance with self-care activities — weekday night', '30 h', 123.86],
  ['01_013_0107_1_1', 'Assistance with self-care activities — Saturday', '22 h', 155.31],
  ['01_014_0107_1_1', 'Assistance with self-care activities — Sunday', '22 h', 200.25],
  ['01_012_0107_1_1', 'Assistance with self-care activities — public holiday', 'as they fall', 245.19],
  ['04_104_0125_6_1', 'Access community, social and recreational activities — weekday', '10 h', 110.37],
  ['04_105_0125_6_1', 'Access community, social and recreational activities — Saturday', '2 h', 155.31],
  ['04_106_0125_6_1', 'Access community, social and recreational activities — Sunday', '2 h', 200.25],
  ['04_102_0125_6_1', 'Access community, social and recreational activities — public holiday', 'as they fall', 245.19],
].map(([item, name, hrs, limit]) => [item, name, hrs, money(limit), money(MARGIN), money(limit - MARGIN)]);

const doc = new Document({
  styles: { default: { document: { run: { font: 'Inter', size: 22, color: TEXT_PRIMARY } } } },
  sections: [{
    properties: { page: { margin: { top: 1134, right: 1020, bottom: 1134, left: 1020 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: OLF_BLUE } }, spacing: { after: 100 }, children: [new ImageRun({ data: logoBuffer, transformation: { width: 160, height: 82 }, type: 'png' }), run('\t'), run('One Life Foundation', { bold: true, size: 28, color: OLF_BLUE_DARK })] })] }) },
    footers: { default: new Footer({ children: [
      new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, spacing: { before: 100 }, children: [run(SC.name, { bold: true, size: 16, color: OLF_BLUE_DARK }), run(`  |  ABN ${SC.abn}  |  NDIS Registered Provider ${SC.reg}`, { size: 16, color: TEXT_SECONDARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run(`NDIS Subcontracting Agreement  |  ${HP.name} and ${SC.short}  |  ${REF}`, { size: 16, color: TEXT_SECONDARY })] }),
    ] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 80 }, children: [run('NDIS Subcontracting Agreement', { bold: true, size: 36, color: OLF_BLUE_DARK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [run('Delivery of NDIS supports by One Life Foundation on behalf of Heartfelt Care Services', { size: 22, color: TEXT_SECONDARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [run(`Reference ${REF}  ·  Issued ${ISSUE}  ·  Version 2.4`, { size: 18, color: TEXT_SECONDARY })] }),

      h('1', 'Parties'),
      sub('Head Provider'),
      tbl([['Legal Name', HP.name], ['ABN / ACN', `ABN ${HP.abn}  ·  ACN ${HP.acn}`], ['NDIS Registration', 'Registered NDIS provider 405 016 3370'], ['Address', HP.address], ['Contact', `${HP.phone}  ·  ${HP.email}`], ['Authorised Representative', HP.rep]]),
      sub('Subcontractor'),
      tbl([['Legal Name', SC.name], ['ABN', SC.abn], ['NDIS Registration', `Registered NDIS provider ${SC.reg}`], ['Address', SC.address], ['Contact', `${SC.phone}  ·  ${SC.email}`], ['Authorised Representative', 'Kevin Rae Geronimo, General Manager']]),

      h('2', 'Background'),
      n('2.1', `${HP.name} (the Head Provider) is a registered NDIS provider that holds, or will hold, a service agreement with each Participant listed in Schedule 1 to deliver the supports funded in that Participant’s NDIS plan.`),
      n('2.2', `${SC.name} (the Subcontractor) is a registered NDIS provider with the workforce, systems and experience to deliver those supports.`),
      n('2.3', 'The Head Provider wishes to engage the Subcontractor to deliver the Services to the Participants on its behalf, and the Subcontractor agrees to do so, on the terms of this Agreement.'),
      n('2.4', 'The Head Provider remains the provider of record for each Participant, is responsible to the Participant and to the NDIA for the Services, and will make all claims for the Services. The Subcontractor will invoice the Head Provider only, at the hourly Rates in Schedule 2, and must not claim the Participant’s NDIS plan for the same supports.'),

      h('3', 'Definitions'),
      tbl([
        ['Agreement', 'This Subcontracting Agreement, including its Schedules, as varied in writing from time to time.'],
        ['Participant', 'An NDIS participant listed in Schedule 1, and any participant added by a written variation signed by both parties.'],
        ['Participant Agreement', 'The service agreement between the Head Provider and a Participant (or their representative) for the Services.'],
        ['Services', 'The NDIS supports described in Schedule 1 for each Participant, delivered at the times and in the manner set out in the Roster of Care.'],
        ['Roster of Care', 'The roster prepared by the Subcontractor and approved by the Head Provider setting out the workers, shifts and support items for each Participant, as updated from time to time.'],
        ['Rates', 'The amounts payable by the Head Provider to the Subcontractor for the Services, being the rates agreed between the parties from time to time in accordance with Schedule 2.'],
        ['Price Limits', 'The NDIS Pricing Arrangements and Price Limits current on the day the support is delivered, including the Very Remote (Modified Monash Model 7) limits where they apply.'],
        ['Worker', 'An employee or contractor of the Subcontractor who delivers the Services.'],
        ['NDIS Commission', 'The NDIS Quality and Safeguards Commission.'],
        ['Business Day', 'A day other than a Saturday, Sunday or public holiday in Victoria.'],
      ]),

      h('4', 'Term'),
      n('4.1', `This Agreement commences on ${START} and continues until the end date of the Participant Agreement for the last remaining Participant in Schedule 1, unless ended earlier under clause 14.`),
      n('4.2', 'Where a Participant’s NDIS plan is reviewed or replaced, the Services for that Participant continue under this Agreement on the terms of the new plan once the Head Provider has entered into a new or varied Participant Agreement, and Schedule 1 is updated accordingly.'),
      n('4.3', 'The parties may add or remove Participants, or change the Services for a Participant, only by a written variation of Schedule 1 signed by both parties.'),

      h('5', 'Appointment and Scope'),
      n('5.1', 'The Head Provider appoints the Subcontractor, and the Subcontractor accepts the appointment, to deliver the Services to each Participant on a non-exclusive basis.'),
      n('5.2', 'The Subcontractor delivers the Services as an independent contractor. Nothing in this Agreement creates a partnership, joint venture, agency or employment relationship between the parties, and the Subcontractor has no authority to bind the Head Provider except as expressly set out in this Agreement.'),
      n('5.3', 'The Subcontractor will deliver the Services in the Participant’s home and community, at the times set out in the Roster of Care, using its own Workers, systems and equipment.'),
      n('5.4', 'The Subcontractor must not further subcontract the Services, in whole or part, without the prior written consent of the Head Provider.'),
      n('5.5', 'The Workers are, and remain, employees or contractors of the Subcontractor. The Subcontractor is solely responsible for their engagement, rostering, day-to-day direction, supervision, performance management, training, wages, superannuation, leave and workers compensation, and for compliance with the Fair Work Act 2009 (Cth) and the Social, Community, Home Care and Disability Services Industry Award 2010 in respect of them.'),
      n('5.6', 'The Head Provider will not direct or control individual Workers. Any instruction from the Head Provider about the Services is given to the Subcontractor’s Services Coordinator (Schedule 3), who directs the Workers. The parties agree that this Agreement is a contract for the delivery of services and is not a labour hire arrangement, and neither party will operate it as one unless the Subcontractor first holds a labour hire licence under the Labour Hire Licensing Act 2017 (Qld) and any other licence required where the Services are delivered.'),

      h('6', 'Head Provider Obligations'),
      p('The Head Provider will:'),
      b('hold and maintain a current Participant Agreement with each Participant that permits the Services to be delivered by a subcontractor, and give the Subcontractor a copy of the relevant parts of it;'),
      b('give the Subcontractor the information it reasonably needs to deliver the Services safely, including the Participant’s NDIS plan (or the relevant budget lines), goals, risk information, health and communication needs, and the details of the plan manager, support coordinator and other providers;'),
      b('be transparent with the Participant: tell the Participant and their representative, in the Participant Agreement and in plain language, that the Services are delivered by the Subcontractor under the Head Provider’s registration, and obtain and hold the Participant’s consent to that arrangement and to the sharing of their personal information with the Subcontractor;'),
      b('make all claims and payment requests for the Services to the NDIA, the Participant or the Participant’s plan manager, accurately and within the NDIS claiming rules, and pay the Subcontractor in accordance with clause 9 and Schedule 2;'),
      b('tell the Subcontractor within one Business Day of becoming aware of any change to a Participant’s plan, funding, plan management, representative or circumstances that affects the Services;'),
      b('remain responsible to the Participant and to the NDIA for the Services as the provider of record, including the Head Provider’s obligations under the NDIS Practice Standards in relation to the use of subcontractors; and'),
      b('enter into, and keep in force, its own Participant Agreement with each Participant in its own name, which names the Subcontractor as the provider delivering the Services, and register itself with the Participant’s plan manager as the provider of the Services;'),
      b('appoint a named Oversight Officer (Schedule 3) who is responsible for the Head Provider’s supervision of the Services;'),
      b('verify each Worker’s NDIS Worker Screening clearance in the NDIS Worker Screening Database as the registered provider engaging that Worker through this Agreement, before the Worker’s first shift and for as long as the Worker delivers the Services;'),
      b('approve the Roster of Care and the list of Workers before the Services commence and whenever they change;'),
      b('receive and review the Subcontractor’s progress notes weekly and its incident reports within 24 hours, hold a review meeting with the Subcontractor at least monthly (minuted), meet with each Participant or their representative to review the supports at least quarterly, and carry out a documented audit of the Services at least annually;'),
      b('operate its own incident management and complaints processes for the Services, and make any notification to the NDIS Commission that is required of it as the provider of record; and'),
      b('keep, for each claim it lodges, the roster, shift record and progress note that evidence the support, and lodge claims only for supports so evidenced.'),

      h('7', 'Subcontractor Obligations'),
      p('The Subcontractor will:'),
      b('deliver the Services to the standard required by the NDIS Practice Standards and Quality Indicators, the NDIS Code of Conduct, the NDIS Act 2013 (Cth) and Rules, and the Head Provider’s reasonable policies and procedures as provided to it in writing;'),
      b('ensure every Worker holds a current NDIS Worker Screening clearance, a Working with Children check where required, current First Aid and CPR, and the training and induction required for the Participant’s needs, before their first shift;'),
      b('prepare and maintain the Roster of Care for each Participant, provide it to the Head Provider before commencement and whenever it changes, and deliver the Services in accordance with it;'),
      b('keep accurate records of every shift (worker, start and finish times, support items delivered, and a progress note), retain them for at least seven years, and give the Head Provider the shift records it needs to claim, within two Business Days of the end of each fortnight;'),
      b('report any incident involving a Participant to the Head Provider within 24 hours (immediately for a reportable incident), cooperate with the Head Provider’s incident management process, and support the Head Provider to notify the NDIS Commission where required;'),
      b('not use restrictive practices unless authorised and included in a behaviour support plan, and comply with the NDIS (Restrictive Practices and Behaviour Support) Rules 2018;'),
      b('manage complaints about the Services under its own complaints process, inform the Head Provider of every complaint within two Business Days, and cooperate with the Head Provider’s complaints process;'),
      b('comply with work health and safety law, carry out and keep current a risk assessment of each Participant’s home and supports, and tell the Head Provider of any material risk;'),
      b('hold the insurances in clause 11 and give the Head Provider certificates of currency on request;'),
      b('cooperate with any NDIS Commission, NDIA or approved quality auditor review of the Head Provider that relates to the Services; and'),
      b('tell the Head Provider immediately if its NDIS registration is suspended, varied or revoked, or if it becomes unable to deliver the Services.'),

      h('8', 'Participants and Choice and Control'),
      n('8.1', 'Each Participant’s right to choice and control is not affected by this Agreement. A Participant may end their Participant Agreement with the Head Provider, or engage the Subcontractor or any other provider directly, at any time in accordance with the NDIS rules.'),
      n('8.2', 'During the term, neither party will actively solicit a Participant to move to the other party, or to a related entity, without the written agreement of the other party. This clause does not apply where the Participant, their representative or the NDIA initiates the change.'),
      n('8.3', 'Neither party will, during the term and for six months after it ends, solicit for employment or engagement a Worker or employee of the other party who has been involved in the Services, without the other party’s written consent.'),

      h('9', 'Rates, Invoicing and Payment'),
      n('9.1', 'The Head Provider will pay the Subcontractor the hourly Rate in Schedule 2 for every hour of Services delivered and evidenced by a shift record. The Rate for each support item is the NDIS price limit for that item less the Head Provider’s margin of $2.74 per hour, which the Head Provider retains for its claiming and provider-of-record obligations. The margin is calculated so that the Head Provider retains approximately $2,000 per month on an estimated 730.4 hours of Services delivered per month (730.4 hours × $2.74 ≈ $2,001.30 per month, approximately $24,000 per year); the amount actually retained depends on the hours delivered and billed.'),
      n('9.2', 'The Subcontractor will invoice the Head Provider weekly in arrears, itemised by Participant, date, support item, hours and Rate, with the shift records in clause 7 attached.'),
      n('9.3', 'The Head Provider will claim the Services from the NDIA or the Participant’s plan manager within two Business Days of receiving the Subcontractor’s weekly invoice and records, and will pay the Subcontractor’s invoice within seven days of its date, whether or not the Head Provider has yet been paid.'),
      n('9.4', 'If a claim is rejected or reduced for a reason attributable to the Subcontractor (for example an unsupported shift record), the parties will work together to correct and resubmit it. If the claim cannot be recovered, the Head Provider may withhold or recover the corresponding amount. A claim rejected for a reason attributable to the Head Provider or the NDIA does not reduce the amount payable to the Subcontractor.'),
      n('9.5', 'Short-notice cancellations, travel and other charges permitted under the Price Limits and the Participant Agreement are claimed by the Head Provider and passed on to the Subcontractor at the Rates, where the Subcontractor incurred the cost.'),
      n('9.6', 'The Rates are exclusive of GST. The Head Provider’s supplies to the Participant are intended to be GST-free supplies of NDIS supports under section 38-38 of the A New Tax System (Goods and Services Tax) Act 1999 (Cth). The parties acknowledge that the Subcontractor’s supplies under this Agreement are made to the Head Provider, not to the Participant, and may therefore be taxable supplies. If GST is payable on any supply under this Agreement, the recipient will pay it in addition to the amount otherwise payable, on receipt of a valid tax invoice, and the Subcontractor will issue tax invoices accordingly. Each party will obtain its own advice on the GST treatment of its supplies and will tell the other promptly if that treatment changes.'),
      n('9.7', 'Where the NDIA changes the Price Limits, the Rate for each item becomes the new price limit less the same $2.74 per hour margin from the date the new Price Limits apply, and Schedule 2 is taken to be updated accordingly.'),
      n('9.8', 'The Subcontractor must not, during the term or afterwards, lodge any claim against a Participant’s NDIS plan, or invoice the Participant or their plan manager, for supports covered by this Agreement. All claims for those supports are made by the Head Provider only.'),
      n('9.9', 'The Head Provider will claim only for supports that were actually delivered and are evidenced by a shift record signed off by the Subcontractor’s Services Coordinator, and only for Participants who have a current Participant Agreement with the Head Provider. Neither party will record, invoice or claim hours that were not delivered, other than short-notice cancellations permitted by the Price Limits and the Participant Agreement.'),
      n('9.10', 'Each month the parties will reconcile the supports claimed by the Head Provider against the supports invoiced by the Subcontractor, and correct any difference within five Business Days.'),
      n('9.11', 'The Rates, and the pass-through charges in clause 9.5, are the only payments between the parties in connection with the Services. Neither party will pay or receive any other fee, commission, rebate or benefit in connection with the Participants, the Services or the claiming of them.'),

      h('10', 'Privacy, Confidentiality and Records'),
      n('10.1', 'Each party will handle Participant and Worker personal information in accordance with the Privacy Act 1988 (Cth), the Australian Privacy Principles and the NDIS Act, and will use it only for the purpose of delivering, recording and claiming the Services.'),
      n('10.2', 'Each party will keep the terms of this Agreement and the other party’s confidential information confidential, except as required by law, by the NDIS Commission or NDIA, or with the other party’s written consent.'),
      n('10.3', 'The Subcontractor will give the Head Provider access to the Participant records it holds on reasonable notice, and both parties will give the Participant access to their own records in accordance with the Privacy Act.'),

      h('11', 'Insurance'),
      p('The Subcontractor will hold, for the term of this Agreement, public liability insurance of at least $20 million per claim, professional indemnity insurance of at least $5 million per claim, and workers compensation insurance as required by law, and will give the Head Provider certificates of currency before commencement and on each renewal.'),

      h('12', 'Liability and Indemnity'),
      n('12.1', 'Each party (the Indemnifying Party) indemnifies the other against loss, damage, cost or liability arising from the Indemnifying Party’s negligence, breach of this Agreement or breach of law, reduced to the extent the other party caused or contributed to it.'),
      n('12.2', 'Neither party is liable to the other for indirect or consequential loss, or for loss of profit or opportunity, arising under or in connection with this Agreement.'),
      n('12.3', 'Nothing in this Agreement limits either party’s obligations to a Participant under the NDIS Act, the NDIS Code of Conduct or the Australian Consumer Law.'),

      h('13', 'Compliance and Audit'),
      n('13.1', 'Each party will maintain its NDIS registration for the registration groups needed for the Services, and will comply with any conditions of registration that apply to it. The Services are Core supports delivered in the Participant’s own home and community under the support items in Schedule 1; they are not Supported Independent Living. If any Participant’s supports are, or become, Supported Independent Living, the parties will confirm that both hold the registration required for SIL before those supports are delivered under this Agreement.'),
      n('13.2', 'The Subcontractor will, on reasonable notice, allow the Head Provider or an auditor engaged by it to review the Subcontractor’s records, policies and Worker clearances relating to the Services, for the purpose of the Head Provider’s own audit and compliance obligations.'),
      n('13.3', 'The Head Provider is responsible for notifying the NDIS Commission of its use of subcontractors where and as required.'),
      n('13.4', 'Each party warrants that, before signing this Agreement, it has disclosed to the other in writing any current NDIA payment integrity or compliance review, any withholding of payments by the NDIA, any NDIS Commission compliance action, and any condition on its registration, that relates to it or to the Services. Each party will tell the other in writing within two Business Days if any such matter arises during the term.'),
      n('13.5', 'Each party consents to this Agreement, the Participant Agreements and the records of the Services being disclosed to the NDIA, the NDIS Commission, a Participant’s plan manager and any approved quality auditor, and will answer any enquiry from them about the arrangement truthfully and promptly.'),

      h('14', 'Termination and Transition'),
      n('14.1', 'Either party may end this Agreement, or the Services for a particular Participant, on four weeks’ written notice.'),
      n('14.2', 'Nothing in this Agreement limits the Participant’s right to change providers at any time in accordance with the NDIS rules.'),
      n('14.3', 'Either party may terminate this Agreement immediately and without notice if the other party:'),
      b('engages in serious misconduct;'),
      b('acts in serious breach of this Agreement;'),
      b('causes serious damage to a Participant or to the Participant’s premises;'),
      b('loses, or has suspended, its NDIS registration or becomes insolvent; and/or'),
      b('engages in conduct that places a Participant at risk of harm.'),
      n('14.4', 'This Agreement for a Participant ends automatically when that Participant’s Participant Agreement with the Head Provider ends, and the Head Provider will tell the Subcontractor as soon as it becomes aware.'),
      n('14.5', 'On termination for any reason, the parties will cooperate to ensure the Participant experiences no gap in supports: the Subcontractor will continue the Services during the notice period unless the Participant is at risk, hand over records and the Roster of Care, and the Head Provider will pay for all Services delivered up to the end date.'),

      h('15', 'Dispute Resolution'),
      n('15.1', 'A party with a dispute under this Agreement will give the other party written notice of it. The parties’ authorised representatives will meet within five Business Days and try in good faith to resolve it.'),
      n('15.2', 'If the dispute is not resolved within 20 Business Days of the notice, either party may refer it to mediation administered by the Resolution Institute (Victoria), the costs of which are shared equally, before commencing court proceedings other than for urgent relief.'),
      n('15.3', 'The Services to a Participant continue while a dispute is being resolved.'),

      h('16', 'General'),
      n('16.1', 'This Agreement is governed by the law of Victoria and the parties submit to the non-exclusive jurisdiction of its courts.'),
      n('16.2', 'This Agreement is the entire agreement between the parties about its subject matter and replaces all earlier arrangements. It may be varied only in writing signed by both parties.'),
      n('16.3', 'Neither party may assign this Agreement without the other party’s written consent. A notice under this Agreement may be given by email to the addresses in clause 1.'),
      n('16.4', 'If any part of this Agreement is invalid, the rest continues to apply. Clauses 8.3, 9.8, 9.11, 10, 12, 13.5 and 14.5 survive termination.'),
      n('16.5', 'Each party confirms it has had the opportunity to obtain independent legal advice about this Agreement before signing it.'),

      pb(),
      h('', 'Schedule 1 — Participants and Services'),
      sub('Participant 1'),
      tbl([
        ['Participant', 'Moira Sunai'], ['NDIS Number', '431 040 053'], ['Date of Birth', '16/04/1958'],
        ['Location of Services', 'The Participant’s own home in Seisia QLD 4876 and the surrounding community (Very Remote — MMM 7)'],
        ['NDIS Plan Period', '02/10/2025 to 01/10/2030'], ['Plan Management', 'Plan-managed — Hemera Plans, admin@hemeraplans.com.au'],
        ['Support Coordinator', 'Ines De Luca — ines@acclaimedcss.com.au'],
        ['Participant’s Representative', 'Kawia Akinsola — niece and Guardian — 0447 057 034'],
        ['Services Commence', START], ['Support Ratio', '1:1, 24 hours a day, every day (22 h self-care + 2 h community participation)'],
        ['Roster of Care', 'Prepared by the Subcontractor and approved by the Head Provider before commencement; two Workers on a rotating day/night roster; reviewed at least every three months'],
      ]),
      sub('Services (funded hours per week, all 1:1)'),
      grid(['NDIS Item', 'Support', 'Per week'], SUPPORTS.map((r) => r.slice(0, 3)), [24, 58, 18]),

      h('', 'Schedule 2 — Rates and Payment'),
      p('The Head Provider claims each support at the Price Limit current on the day of service (Very Remote — MMM 7 — for Services delivered in Seisia). The figures below are the Very Remote column of the NDIS Pricing Arrangements and Price Limits 2026–27, Schedule 1, Disability Support Worker Level 1; they move with each NDIA price update under clause 9.7. The Subcontractor is paid the hourly Rate below for every hour of Services delivered and evidenced by a shift record. The Rate is the Price Limit less the Head Provider’s margin of $2.74 per hour.'),
      grid(['NDIS Item', 'Support', 'Per week', 'Head Provider claims / h', 'Head Provider retains / h', 'Rate to Subcontractor / h'], SUPPORTS, [18, 34, 10, 13, 12, 13]),
      new Paragraph({ spacing: { after: 150 }, children: [] }),
      sub('Rate calculation basis'),
      p(`The margin is set so that the Head Provider retains approximately $2,000 per month. On an estimated ${HOURS_MONTH} delivered hours of Services per month (1:1, 24 hours a day), the required retention is $2.74 per delivered hour: ${HOURS_MONTH} hours × $2.74 ≈ $2,001.30 per month, approximately $24,000 per year. The amount actually retained depends on the hours of Services delivered and billed.`),
      grid(['Support period', 'Head Provider claims / h', 'Head Provider retains / h', 'Rate to Subcontractor / h'], [
        ['Weekday daytime', '$110.37', '$2.74', '$107.63'], ['Weekday evening', '$121.61', '$2.74', '$118.87'], ['Weekday night', '$123.86', '$2.74', '$121.12'],
        ['Saturday', '$155.31', '$2.74', '$152.57'], ['Sunday', '$200.25', '$2.74', '$197.51'], ['Public holiday', '$245.19', '$2.74', '$242.45'],
      ], [34, 22, 22, 22]),
      new Paragraph({ spacing: { after: 150 }, children: [] }),
      tbl([
        ['Head Provider Margin', '$2.74 per hour of Services delivered, retained by the Head Provider from the amount claimed (approximately $2,000 per month on 730.4 delivered hours per month)'],
        ['Invoicing', 'Weekly in arrears by the Subcontractor to the Head Provider, itemised by Participant, date, support item, hours and Rate, with shift records attached'],
        ['Payment Terms', 'Within 7 days of the date of the Subcontractor’s invoice, by EFT to the account shown on the invoice'],
        ['Claiming', 'By the Head Provider only, within 2 Business Days of receiving the weekly invoice and records. The Subcontractor must not claim the Participant’s plan for the same supports'],
        ['Cancellations and Travel', 'Claimed by the Head Provider under the Price Limits and the Participant Agreement and passed on to the Subcontractor at the Rate where the Subcontractor incurred the cost'],
        ['GST', 'Rates are exclusive of GST. If GST applies to the Subcontractor’s supplies to the Head Provider, it is added on a valid tax invoice (clause 9.6)'],
        ['Bank Account for Payment', 'As shown on each invoice issued by the Subcontractor'],
      ]),

      h('', 'Schedule 3 — Key Contacts'),
      grid(['Role', 'Head Provider', 'Subcontractor'], [
        ['Oversight Officer (Head Provider) / Services Coordinator (Subcontractor)', 'Eden Tolding, Oversight Officer — ' + HP.email + ' — ' + HP.phone, 'Kevin Rae Geronimo, General Manager — ' + SC.email + ' — ' + SC.phone],
        ['Agreement and rostering', HP.rep + ' — ' + HP.email, 'Kevin Rae Geronimo, General Manager — ' + SC.email + ' — ' + SC.phone],
        ['Claims and invoices', HP.email, SC.email],
        ['Incidents (24 hours, immediate if reportable)', HP.phone, SC.phone],
        ['Complaints', HP.email, SC.email],
        ['After-hours escalation', 'Eden Tolding — ' + HP.phone, 'Kevin Rae Geronimo — ' + SC.phone],
      ], [30, 35, 35]),

      pb(),
      h('', 'Schedule 4 — Notice to the Participant'),
      p('To be given to each Participant and their representative with the Head Provider’s Participant Agreement, explained in the Participant’s preferred communication method, and kept on both parties’ files.'),
      p('Dear Moira,'),
      p(`Your NDIS provider for the supports in your service agreement is ${HP.name}. ${HP.name} is responsible for your supports, lodges the claims with Hemera Plans, and is who you contact with any concern or complaint (${HP.phone}, ${HP.email}).`),
      p(`The support workers who come to your home each day are employed by ${SC.name}, which ${HP.name} has engaged to deliver your supports on its behalf. ${SC.name} organises the roster and supervises the workers. You can also raise anything with them directly (${SC.phone}, ${SC.email}).`),
      p('Both organisations share the information they need about you to deliver and record your supports, and keep it private. You can ask either of them for a copy of your records at any time. You can change providers at any time; this arrangement does not limit your choice.'),
      p('This notice is given to you by both organisations, signed below.'),
      ...sig(`${HP.name}`),
      ...sig(`${SC.name}`),
      pb(),
      h('', 'Execution'),
      p('Signed for and on behalf of the parties by their authorised representatives.'),
      ...sig(`${HP.name} (Head Provider)`),
      ...sig(`${SC.name} (Subcontractor)`),
      sub('Witness'),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: ['Witness Name', 'Signature', 'Date'].map((l) => new TableCell({ borders: noBorders, width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({ spacing: { after: 40 }, children: [run(l, { bold: true, size: 16, color: TEXT_SECONDARY, allCaps: true })] }), new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 200 }, children: [run(' ')] })] })) })] }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buf);
fs.copyFileSync(outputPath, downloadsPath);
console.log('written', outputPath, '\ncopied to', downloadsPath);
