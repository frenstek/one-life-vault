/*  Humanity and Inclusion — answer sheet for the Keystone Allied Health Combined Professional
 *  Indemnity and Liability Renewal Proposal Form (2026).
 *
 *  Purpose is acceptance of the indemnity application. An underwriter declines or loads a risk it
 *  cannot see, and voids a claim on a risk it was not told about, so the approach here is full
 *  disclosure with the detail attached rather than short answers in small boxes.
 *
 *  Answers are one of three kinds and are labelled as such:
 *    ANSWER    — determinable from the NDIS Certificate of Registration (4-K7B0WDS) or the form
 *    HAI       — only Humanity and Inclusion can answer; the note says what it turns on
 *    DISCLOSE  — the answer is probably yes and the detail belongs on page 5
 *
 *  ⚠ Nothing in the claims, convictions, bankruptcy or regulatory-notice block is answered here.
 *  Those are declarations of fact by the insured and must not be pre-filled by anyone else.
 *
 *    node generate-hai-insurance-answers.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType, Header, Footer,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'HAI_Insurance_Renewal_ANSWER_SHEET.docx';
const logoBuffer = fs.readFileSync(path.join(__dirname, 'hai-logo.png'));

const NAVY = '001C4C', RED = 'D82221', WHITE = 'FFFFFF';
const INK = '1F2430', MUTED = '5A6270', LINE = 'D3D8E0';
const GREEN = '1E6B45', AMBER = '9A6410';

const cb = { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } };
const run = (t, o = {}) => new TextRun({ text: t, size: 18, color: INK, font: 'Arial', ...o });
const h = (t) => new Paragraph({ spacing: { before: 300, after: 130 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: RED } }, children: [run(t, { bold: true, size: 23, color: NAVY })] });
const p = (t, o = {}) => new Paragraph({ spacing: { after: 120 }, children: [run(t, o)] });
const b = (t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [run(t)] });
const cell = (t, o = {}) => new TableCell({ borders: cb, width: { size: o.w || 20, type: WidthType.PERCENTAGE }, ...(o.shade ? { shading: { type: ShadingType.SOLID, color: o.shade } } : {}), verticalAlign: 'top', margins: { top: 70, bottom: 70, left: 100, right: 100 }, children: [new Paragraph({ children: [run(t, { size: o.size || 17, bold: !!o.bold, color: o.color || INK })] })] });

const TAG = { ANSWER: GREEN, HAI: RED, DISCLOSE: AMBER };
const qtable = (rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ tableHeader: true, children: ['Question on the form', 'Answer', 'Why / what it turns on'].map((t, i) => cell(t, { w: [38, 14, 48][i], shade: NAVY, bold: true, color: WHITE })) }),
    ...rows.map(([q, kind, a, why]) => new TableRow({
      children: [
        cell(q, { w: 38 }),
        new TableCell({ borders: cb, width: { size: 14, type: WidthType.PERCENTAGE }, margins: { top: 70, bottom: 70, left: 100, right: 100 }, children: [
          new Paragraph({ children: [run(a, { size: 17, bold: true, color: TAG[kind] })] }),
          new Paragraph({ children: [run(kind === 'HAI' ? 'HAI to answer' : kind === 'DISCLOSE' ? 'disclose on p.5' : 'from the record', { size: 13, color: MUTED })] }),
        ] }),
        cell(why, { w: 48 }),
      ],
    })),
  ],
});

const GENERAL = [
  ['Proposed Insured name (all entities)', 'ANSWER', 'Humanity and Inclusion Pty Ltd', 'ABN 27 659 576 968, ACN 659 576 968. No subsidiaries identified. If any related entity is to be covered it must be named here.'],
  ['Street address', 'DISCLOSE', 'Both', 'The form shows 47 Station Road, Deer Park VIC 3023. The NDIS Certificate of Registration records the primary address and head office as 9 Vantage Green, Beveridge VIC 3753. Disclose both and identify which is the operating office.'],
  ['Business activity and turnover %', 'ANSWER', 'See attachment', 'Currently reads "Home Care 100%". Replace with the classes of support in the attached Business Activity and Scope of Registration, and split turnover across them.'],
  ['Turnover last year / expected current year', 'HAI', '$ —', 'Accounting figures. Note the NSW small business test at page 6 turns on aggregated turnover under $2 million, but that only matters if there is NSW turnover.'],
  ['Turnover % by state', 'ANSWER', 'Victoria 100%', 'Already completed and consistent with operations. The registration permits delivery throughout Australia, so if that changes the insurer must be told.'],
  ['Number of full time equivalent employees', 'HAI', '—', 'Payroll figure. Count support workers, nursing staff and administration separately if the split is material.'],
  ['Number of principals, partners or directors', 'HAI', '—', 'Per ASIC. Puninder Kaur is the contact named on the NDIS certificate.'],
  ['Income or activities outside Australia', 'ANSWER', 'No', 'Operations are Victorian.'],
  ['Income from the United States of America', 'ANSWER', 'No', ''],
  ['Substantial change in the business in the past 12 months', 'HAI', '—', 'Turns on whether the services delivered, the classes of support used, the locations, or the scale of the operation changed materially during the year. A change to the risk is better disclosed than discovered.'],
  ['Substantial change anticipated in the next 12 months', 'HAI', '—', 'Turns on plans for growth, new registration groups, or new service locations. Any application to vary registration counts.'],
  ['Insurance renewal declined or policy cancelled in the last 5 years', 'HAI', '—', 'Declaration of fact by the insured.'],
  ['Any principal ever declared bankrupt', 'HAI', '—', 'Declaration of fact by the insured.'],
  ['Any principal ever convicted of a criminal offence', 'HAI', '—', 'Declaration of fact by the insured.'],
  ['Does the insured engage labour hire personnel', 'HAI', '—', 'Turns on whether any workers are supplied through a labour hire agency rather than employed directly. If yes, give the agency and the roles on page 5.'],
  ['Manufacture, alter, repair, repackage or import products', 'ANSWER', 'No', ''],
];

const RISK = [
  ['Does the insured obtain medical history or client information in all cases', 'ANSWER', 'Yes', 'Required of a registered NDIS provider. Each participant has a support plan, health information and, where applicable, a behaviour support plan prepared by an external practitioner.'],
  ['Does the insured maintain accurate and descriptive records of all services rendered', 'ANSWER', 'Yes', 'Progress notes are kept for every shift and are a condition of registration under section 73Q of the NDIS Act and the record keeping requirements of the NDIS Practice Standards.'],
  ['If contractors or subcontractors are engaged, do they carry their own malpractice insurance', 'HAI', 'Yes / N/A', 'If none are engaged, answer N/A. If any are, hold a current certificate of currency for professional indemnity and public liability before answering yes, and check the limits are no lower than this policy. Answering yes without holding the certificate is the answer most likely to be tested at claim time.'],
];

const CLAIMS = [
  ['Claims in the last 5 years which were or could have been covered', 'HAI', '—', 'Declaration of fact. "Could have been covered" is broader than claims actually made — include anything notified or threatened.'],
  ['Aware of any facts or circumstances which might result in a future claim', 'HAI', '—', 'Declaration of fact, and the question with the longest tail. It captures incidents, near misses and complaints that have not yet become claims. Check the incident register before answering.'],
  ['Subject of any complaint, suit, inquiry or notice of hearing from any regulatory body in the last 5 years', 'HAI', '—', 'Includes the NDIS Quality and Safeguards Commission, not only courts. Reportable incidents notified to the Commission, and any Commission inquiry, are captured.'],
  ['Any fine, penalty, infringement, improvement or prohibition notice or enforcement order in the last 5 years', 'HAI', '—', 'Includes WorkSafe and any state regulator, not only the NDIS Commission.'],
];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Arial', size: 18, color: INK } } } },
  sections: [{
    properties: { page: { margin: { top: 850, right: 800, bottom: 850, left: 800 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: RED } }, spacing: { after: 110 }, children: [new ImageRun({ data: logoBuffer, transformation: { width: 175, height: 40 }, type: 'png' })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: RED } }, spacing: { before: 90 }, children: [run('Humanity and Inclusion Pty Ltd  |  ABN 27 659 576 968  |  NDIS Registration ID 4-K7B0WDS  |  Internal working paper — not for the insurer', { size: 14, color: MUTED })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 100, after: 40 }, children: [run('Insurance Renewal — Answer Sheet', { bold: true, size: 28, color: NAVY })] }),
      new Paragraph({ spacing: { after: 200 }, children: [run('Keystone Allied Health Combined Professional Indemnity and Liability Renewal Proposal Form, 2026', { size: 18, color: MUTED })] }),

      p('This is a working paper for completing the proposal form. It is not sent to the insurer. Green answers are determinable from the NDIS Certificate of Registration or from the form itself. Red answers can only be given by Humanity and Inclusion. Amber answers are probably yes and need detail on page 5 of the form.'),
      p('The objective is acceptance. An underwriter prices what it can see, declines what it cannot, and declines a claim on what it was never told. On a renewal the duty of disclosure runs to everything a prudent insurer would want to know, so the approach taken here is to disclose fully and attach the detail rather than to give short answers in small boxes.', { bold: true }),

      h('1.  General details and business activity'),
      qtable(GENERAL),

      h('2.  Risk management'),
      qtable(RISK),

      h('3.  Claims and regulatory history'),
      p('None of these is answered here. Each is a declaration of fact by the insured and must be answered by Humanity and Inclusion after making the enquiries the declaration requires.', { color: MUTED }),
      qtable(CLAIMS),

      h('4.  What to write on page 5, Additional Information'),
      p('Page 5 is where a "yes" is explained. Two items belong there, plus anything answered yes in sections 1 to 3.'),
      b('Business activity. "The insured is a registered NDIS provider, Registration ID 4-K7B0WDS, registered for twelve classes of support including high intensity daily personal activities, community nursing care and assistance with daily life in shared living arrangements. Full detail is set out in the attached Business Activity and Scope of Registration."'),
      b('Addresses. Both the registered head office and the operating office, identifying which is which.'),

      h('5.  Two conditions in the policy wording to note'),
      b('The policy requires immediate notice of the cancellation, suspension, termination or imposition of conditions on the insured\'s statutory registration. NDIS registration is that statutory registration. It runs to 1 November 2027 and a renewal application must be made before then; section 73K continues the registration in force while an application is being decided.'),
      b('Claims arising from conduct occurring after a statutory registration is cancelled, suspended or terminated are excluded from indemnity. Registration status is therefore a live condition of cover, not background.'),

      h('6.  Attach to the proposal'),
      b('Business Activity and Scope of Registration (prepared separately, on letterhead).'),
      b('NDIS Certificate of Registration, Registration ID 4-K7B0WDS.'),
      b('A certificate of currency for any contractor engaged, if that question is answered yes.'),

      new Paragraph({ spacing: { before: 300 }, children: [run('Signing. The form accepts a physical signature, a digital signature, or an email from the insured to the broker containing the exact words: "I, [full name] as [position], confirm the contents of the attached proposal form are true and correct."', { size: 16, color: MUTED })] }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(path.join(__dirname, FILE), buf);
let delivered = path.join('C:', 'Users', 'kevin', 'Downloads', FILE);
try { fs.writeFileSync(delivered, buf); }
catch (e) {
  if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e;
  delivered = delivered.replace(/\.docx$/, `_${new Date().toISOString().slice(11, 16).replace(':', '')}.docx`);
  fs.writeFileSync(delivered, buf);
}
const all = [...GENERAL, ...RISK, ...CLAIMS];
const count = (k) => all.filter((r) => r[1] === k).length;
console.log('delivered', delivered);
console.log(`  ${all.length} questions · ${count('ANSWER')} answerable from the record · ${count('DISCLOSE')} need disclosure detail · ${count('HAI')} only HAI can answer`);
