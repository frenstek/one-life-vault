/*  Claims Management and Fee Agreement — One Life Foundation Pty Ltd pays
 *  Heartfelt Care Services a flat monthly fee to lodge the NDIS claims for
 *  the supports OLF delivers under the Subcontracting Agreement
 *  (OLF-SUB-HCS-001). Heartfelt claims weekly, remits weekly, passes through
 *  100% of what it claims, and may not take the client.
 *
 *    node generate-hcs-claims-fee-agreement.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, PageBreak, ShadingType, Header, Footer,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'Claims_Management_Fee_Agreement_OLF_Heartfelt.docx';
const outputPath = path.join(__dirname, FILE);
const downloadsPath = path.join('C:', 'Users', 'kevin', 'Downloads', FILE);
const logoBuffer = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));

const OLF = { name: 'One Life Foundation Pty Ltd', short: 'One Life Foundation', abn: '55 643 227 061', reg: '405 012 0437', address: '23 Grammar Avenue, Donnybrook VIC 3064', phone: '0420 652 270', email: 'support@olfndisservices.com.au', rep: 'Kevin Rae Geronimo, General Manager' };
const HCS = { name: 'Heartfelt Care Services', abn: '81 672 597 054', acn: '672 597 054', reg: '405 016 3370', address: 'Suite 480, Level 2, 66 Victor Crescent, Narre Warren VIC 3805', phone: '+61 478 190 968', email: 'admin@heartfeltcareservices.com.au', rep: 'Cyril De Asis, Director' };
const REF = 'OLF-FEE-HCS-001';
const SUB_REF = 'OLF-SUB-HCS-001';
const ISSUE = '09/09/2026';
const START = '05/09/2026';
const FEE = '$1,500.00 per month';

/* ── styling (OLF template) ───────────────────────────────────────────── */
const OLF_BLUE = '309EDD', OLF_BLUE_DARK = '1A7AB8', WHITE = 'FFFFFF', TEXT_PRIMARY = '1A1A2E', TEXT_SECONDARY = '4A4A5A', BORDER_COLOR = 'D0D5DD';
const noBorders = { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } };
const cellBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } };
const run = (text, o = {}) => new TextRun({ text, size: 22, color: TEXT_PRIMARY, font: 'Inter', ...o });
const h = (num, text) => new Paragraph({ spacing: { before: 400, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, children: [...(num ? [run(`${num}. `, { bold: true, size: 26, color: OLF_BLUE })] : []), run(text, { bold: true, size: 26, color: OLF_BLUE_DARK })] });
const p = (text, o = {}) => new Paragraph({ spacing: { after: 150 }, children: [run(text, o)] });
const n = (num, text) => new Paragraph({ spacing: { after: 120 }, indent: { left: 560, hanging: 560 }, children: [run(`${num}\t`, { bold: true }), run(text)] });
const sub = (text) => new Paragraph({ spacing: { before: 250, after: 100 }, children: [run(text, { bold: true })] });
const pb = () => new Paragraph({ children: [new PageBreak()] });
const cell = (text, o = {}) => new TableCell({ borders: cellBorders, width: { size: o.w || 50, type: WidthType.PERCENTAGE }, ...(o.shade ? { shading: { type: ShadingType.SOLID, color: o.shade } } : {}), children: [new Paragraph({ children: [run(text, { size: o.size || 20, bold: !!o.bold, color: o.color || TEXT_PRIMARY })] })] });
const tbl = (rows) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(([label, value]) => new TableRow({ children: [cell(label, { w: 38, shade: OLF_BLUE, bold: true, color: WHITE }), cell(value, { w: 62 })] })) });
const sig = (title) => [sub(title), new Paragraph({ spacing: { before: 100 }, children: [] }), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: ['Full Name', 'Position', 'Signature', 'Date'].map((l) => new TableCell({ borders: noBorders, width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ spacing: { after: 40 }, children: [run(l, { bold: true, size: 16, color: TEXT_SECONDARY, allCaps: true })] }), new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 200 }, children: [run(' ')] })] })) })] }), new Paragraph({ spacing: { after: 200 }, children: [] })];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Inter', size: 22, color: TEXT_PRIMARY } } } },
  sections: [{
    properties: { page: { margin: { top: 1134, right: 1020, bottom: 1134, left: 1020 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: OLF_BLUE } }, spacing: { after: 100 }, children: [new ImageRun({ data: logoBuffer, transformation: { width: 160, height: 82 }, type: 'png' }), run('\t'), run('One Life Foundation', { bold: true, size: 28, color: OLF_BLUE_DARK })] })] }) },
    footers: { default: new Footer({ children: [
      new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, spacing: { before: 100 }, children: [run(OLF.name, { bold: true, size: 16, color: OLF_BLUE_DARK }), run(`  |  ABN ${OLF.abn}  |  NDIS Registered Provider ${OLF.reg}`, { size: 16, color: TEXT_SECONDARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run(`Claims Management and Fee Agreement  |  ${OLF.short} and ${HCS.name}  |  ${REF}`, { size: 16, color: TEXT_SECONDARY })] }),
    ] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 80 }, children: [run('Claims Management and Fee Agreement', { bold: true, size: 36, color: OLF_BLUE_DARK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [run(`Companion to the NDIS Subcontracting Agreement ${SUB_REF}`, { size: 22, color: TEXT_SECONDARY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [run(`Reference ${REF}  ·  Issued ${ISSUE}  ·  Version 1.0`, { size: 18, color: TEXT_SECONDARY })] }),

      h('1', 'Parties'),
      sub('One Life Foundation (OLF)'),
      tbl([['Legal Name', OLF.name], ['ABN', OLF.abn], ['NDIS Registration', OLF.reg], ['Address', OLF.address], ['Contact', `${OLF.phone}  ·  ${OLF.email}`], ['Authorised Representative', OLF.rep]]),
      sub('Heartfelt Care Services (Heartfelt)'),
      tbl([['Legal Name', HCS.name], ['ABN / ACN', `ABN ${HCS.abn}  ·  ACN ${HCS.acn}`], ['NDIS Registration', HCS.reg], ['Address', HCS.address], ['Contact', `${HCS.phone}  ·  ${HCS.email}`], ['Authorised Representative', HCS.rep]]),

      h('2', 'Background'),
      n('2.1', `Under the NDIS Subcontracting Agreement ${SUB_REF} (the Subcontracting Agreement), Heartfelt is the head provider of record for the Participants listed in its Schedule 1 and OLF delivers the supports to those Participants.`),
      n('2.2', 'The Participants were introduced to Heartfelt by OLF. OLF holds the relationship with each Participant, their representative and their support team, and delivers all of the supports.'),
      n('2.3', 'Heartfelt’s role is limited to lodging and managing the NDIS claims for those supports and passing the proceeds to OLF. This Agreement sets out the fee OLF pays Heartfelt for that service, how the claim proceeds flow, and Heartfelt’s undertaking not to take the Participants.'),
      n('2.4', 'Where this Agreement and the Subcontracting Agreement deal with the same matter, this Agreement prevails in relation to fees, payment flow and the protection of the Participant relationship.'),

      h('3', 'Claims Services Provided by Heartfelt'),
      p('Heartfelt will:'),
      n('3.1', 'lodge claims for the supports OLF delivers, with the NDIA or the Participant’s plan manager, weekly, within two Business Days of receiving OLF’s shift records for the week;'),
      n('3.2', 'claim every support at the correct NDIS support item and the price limit current on the day of service, including any short-notice cancellation, travel or other charge permitted under the NDIS Pricing Arrangements and the Participant Agreement;'),
      n('3.3', 'remit to OLF one hundred percent (100%) of every amount received for OLF’s supports, without deduction, set-off or withholding of any kind, weekly and within two Business Days of receiving the funds;'),
      n('3.4', 'give OLF a remittance statement with each payment showing the Participant, dates, support items, hours, amount claimed and amount received, and a monthly reconciliation of claims lodged, paid, rejected and outstanding;'),
      n('3.5', 'tell OLF within one Business Day of any claim being rejected, reduced or queried, and resubmit corrected claims within two Business Days of OLF providing the corrected information;'),
      n('3.6', 'keep the funds it receives for OLF’s supports separate from its own funds until remitted, and hold them on trust for OLF; and'),
      n('3.7', 'maintain the Participant Agreements, its NDIS registration and its plan-manager and NDIA relationships in good standing so that claims can be lodged without interruption.'),

      h('4', 'Fee'),
      n('4.1', `OLF will pay Heartfelt a fee of ${FEE} (the Fee) for the claims services in clause 3, exclusive of GST if applicable.`),
      n('4.2', 'The Fee is a flat monthly amount. It does not vary with the number of claims, hours or Participants unless the parties agree a change in writing under clause 5.'),
      n('4.3', 'OLF will pay the Fee weekly, in instalments of $346.15 per week (being $1,500.00 × 12 ÷ 52), each Friday by electronic funds transfer to the account nominated in writing by Heartfelt. Heartfelt will issue a monthly statement or tax invoice reconciling the weekly instalments to the monthly Fee.'),
      n('4.4', 'Heartfelt must not deduct the Fee, or any other amount, from the claim proceeds it remits to OLF under clause 3.3. The Fee is payable only against Heartfelt’s invoice.'),
      n('4.5', 'For any part-week at the start or end of this Agreement, the weekly instalment is pro-rated by calendar days.'),

      h('5', 'Frequency and Review'),
      n('5.1', 'Everything under this Agreement runs weekly: Heartfelt claims weekly and remits weekly under clause 3, and OLF pays the Fee weekly under clause 4. This weekly frequency remains until the parties agree otherwise in writing.'),
      n('5.2', 'Either party may ask for the Fee, the frequency or any other term of this Agreement to be reviewed at any time. The parties will meet within ten Business Days of a request and discuss it in good faith. No change takes effect unless it is recorded in writing and signed by both parties.'),
      n('5.3', 'The parties will in any case review this Agreement together three months after the Start Date, and annually after that.'),

      h('6', 'Protection of the Participant Relationship'),
      n('6.1', 'Heartfelt acknowledges that each Participant is a client introduced by OLF, that OLF holds the relationship with the Participant and their representative, and that Heartfelt’s role is limited to claiming as provider of record.'),
      n('6.2', 'Heartfelt will not, during the term of this Agreement and for twelve (12) months after it ends, directly or through a related entity, employee, contractor or agent:'),
      n('(a)', 'solicit, approach or encourage a Participant or their representative to receive supports from Heartfelt or any other provider instead of OLF;'),
      n('(b)', 'provide, or offer to provide, supports to a Participant other than through OLF under the Subcontracting Agreement;'),
      n('(c)', 'use a Participant’s personal information, plan or contact details for any purpose other than lodging claims and meeting its legal obligations as provider of record;'),
      n('(d)', 'contact a Participant, their representative, plan manager or support coordinator about the delivery of supports, other than as needed to lodge a claim or as required by law, without first telling OLF; or'),
      n('(e)', 'solicit for employment or engagement any OLF worker involved in the supports.'),
      n('6.3', 'Nothing in this clause limits a Participant’s right to choose their providers. If a Participant, of their own initiative and without any approach from Heartfelt, asks Heartfelt to provide supports directly, Heartfelt will tell OLF in writing within two Business Days and will not accept the request until OLF has had the opportunity to speak with the Participant.'),
      n('6.4', 'If this Agreement or the Subcontracting Agreement ends, Heartfelt will do everything reasonably required to move the Participant’s service agreement to OLF or a provider nominated by OLF without a gap in supports, including signing any release, exit or transfer document and giving OLF the Participant records it holds.'),
      n('6.5', 'Heartfelt acknowledges that a breach of this clause would cause OLF loss that is difficult to quantify, and agrees that OLF may seek an injunction to restrain a breach in addition to any other remedy.'),

      h('7', 'Records and Audit'),
      n('7.1', 'Heartfelt will keep complete records of every claim lodged and every amount received and remitted for OLF’s supports, for at least seven years, and give OLF access to them on request.'),
      n('7.2', 'OLF may, on five Business Days’ notice and not more than once a quarter (or at any time if it reasonably suspects an error), have the claims and remittance records reviewed by itself or an accountant it appoints. Heartfelt will correct any shortfall in remittance within five Business Days of it being identified.'),
      n('7.3', 'Each party will keep the other’s confidential information confidential and handle Participant information in accordance with the Privacy Act 1988 (Cth) and the NDIS Act 2013 (Cth).'),

      h('8', 'Term and Termination'),
      n('8.1', `This Agreement starts on ${START} and continues while the Subcontracting Agreement is in force, unless ended earlier under this clause.`),
      n('8.2', 'Either party may end this Agreement on four weeks’ written notice.'),
      n('8.3', 'OLF may end this Agreement immediately by written notice if Heartfelt fails to remit claim proceeds when due and does not remedy the failure within five Business Days of notice, breaches clause 6, loses or has suspended its NDIS registration, or becomes insolvent.'),
      n('8.4', 'On termination Heartfelt will lodge all outstanding claims for supports delivered up to the end date, remit all proceeds as they are received, provide a final reconciliation within ten Business Days, and comply with clause 6.4. OLF will pay the weekly instalments pro-rated to the end date.'),
      n('8.5', 'Clauses 3.3, 3.6, 6, 7 and 8.4 survive termination.'),

      h('9', 'General'),
      n('9.1', 'This Agreement is governed by the law of Victoria and the parties submit to the non-exclusive jurisdiction of its courts.'),
      n('9.2', 'A dispute under this Agreement is dealt with under the dispute resolution clause of the Subcontracting Agreement. Heartfelt must continue to lodge claims and remit proceeds while a dispute is being resolved.'),
      n('9.3', 'This Agreement may be varied only in writing signed by both parties. Notices may be given by email to the addresses in clause 1.'),
      n('9.4', 'Nothing in this Agreement creates a partnership, joint venture, agency or employment relationship between the parties.'),

      h('', 'Schedule — Participants Covered'),
      tbl([
        ['Participant', 'Moira Sunai — NDIS 431 040 053'],
        ['Plan Manager', 'Hemera Plans — admin@hemeraplans.com.au'],
        ['Supports', 'As set out in Schedule 1 of the Subcontracting Agreement (1:1 Core supports, 24 hours a day)'],
        ['Claims Frequency', 'Weekly'],
        ['Remittance to OLF', 'Weekly — 100% of proceeds, within two Business Days of receipt'],
        ['Fee Payable by OLF', `${FEE}, paid weekly in instalments of $346.15 each Friday`],
        ['Start Date', START],
        ['Additional Participants', 'Added by written variation signed by both parties; the Fee stays the same unless varied under clause 5'],
      ]),

      pb(),
      h('', 'Execution'),
      p('Signed for and on behalf of the parties by their authorised representatives.'),
      ...sig(`${OLF.name}`),
      ...sig(`${HCS.name}`),
      sub('Witness'),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: ['Witness Name', 'Signature', 'Date'].map((l) => new TableCell({ borders: noBorders, width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({ spacing: { after: 40 }, children: [run(l, { bold: true, size: 16, color: TEXT_SECONDARY, allCaps: true })] }), new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 200 }, children: [run(' ')] })] })) })] }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buf);
fs.copyFileSync(outputPath, downloadsPath);
console.log('written', outputPath, '\ncopied to', downloadsPath);
