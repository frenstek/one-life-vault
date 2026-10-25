/*  Humanity and Inclusion — Business Activity and Scope of Registration.
 *
 *  Attachment to the Keystone Allied Health Combined Professional Indemnity and Liability Renewal
 *  Proposal Form. The form's Business Activity box currently reads "Home Care 100%", which does not
 *  describe an NDIS provider registered for high intensity personal care, community nursing and the
 *  implementation of regulated restrictive practices. The form itself says "if there is insufficient
 *  space, please provide further details on your letterhead. All attached documents form part of
 *  this Proposal" — so this is the right way to disclose it.
 *
 *  Everything here is transcribed from the NDIS Certificate of Registration, Registration ID
 *  4-K7B0WDS, issued 18 November 2024 and in force from 1 November 2024 to 1 November 2027.
 *  Nothing is inferred except the Practice Standards modules, which follow from the registration
 *  groups and are labelled as such.
 *
 *    node generate-hai-insurance-attachment.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType, Header, Footer,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'HAI_Insurance_Attachment_Business_Activity_and_Registration_Scope.docx';
const logoBuffer = fs.readFileSync(path.join(__dirname, 'hai-logo.png'));

const NAVY = '001C4C', RED = 'D82221', WHITE = 'FFFFFF';
const INK = '1F2430', MUTED = '5A6270', LINE = 'D3D8E0', TINT = 'EAEEF6';

const cellBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: LINE }, left: { style: BorderStyle.SINGLE, size: 1, color: LINE }, right: { style: BorderStyle.SINGLE, size: 1, color: LINE } };
const run = (t, o = {}) => new TextRun({ text: t, size: 19, color: INK, font: 'Arial', ...o });
const h = (t) => new Paragraph({ spacing: { before: 320, after: 140 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: RED } }, children: [run(t, { bold: true, size: 24, color: NAVY })] });
const p = (t, o = {}) => new Paragraph({ spacing: { after: 130 }, children: [run(t, o)] });
const b = (t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 50 }, children: [run(t)] });
const cell = (t, o = {}) => new TableCell({ borders: cellBorders, width: { size: o.w || 20, type: WidthType.PERCENTAGE }, ...(o.shade ? { shading: { type: ShadingType.SOLID, color: o.shade } } : {}), verticalAlign: 'center', children: [new Paragraph({ children: [run(t, { size: o.size || 18, bold: !!o.bold, color: o.color || INK })] })] });
const kv = (rows) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(([l, v]) => new TableRow({ children: [cell(l, { w: 36, shade: NAVY, bold: true, color: WHITE }), cell(v, { w: 64 })] })) });
const grid = (head, rows, widths) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, { w: widths[i], shade: NAVY, bold: true, color: WHITE, size: 17 })) }),
  ...rows.map((r) => new TableRow({ children: r.map((t, i) => cell(t, { w: widths[i], size: 17 })) })),
] });

/* ── straight off the certificate ─────────────────────────────────────── */
const GROUPS = [
  ['0102', 'Assist Access/Maintain Employ', 'Assistance to access and maintain employment'],
  ['0104', 'Assist Personal Activities High', 'High intensity daily personal activities — see the table below'],
  ['0106', 'Assist-Life Stage, Transition', 'Life stage and transition assistance, including support connection'],
  ['0107', 'Assist-Personal Activities', 'Assistance with daily personal activities (self-care)'],
  ['0108', 'Assist-Travel/Transport', 'Assistance with travel and transport arrangements'],
  ['0114', 'Community Nursing Care', 'Community nursing care for participants with high care needs'],
  ['0115', 'Daily Tasks/Shared Living', 'Assistance with daily life tasks in a shared living arrangement (supported independent living)'],
  ['0116', 'Innov Community Participation', 'Innovative community participation'],
  ['0117', 'Development-Life Skills', 'Development of daily living and life skills'],
  ['0120', 'Household Tasks', 'Assistance with household tasks'],
  ['0125', 'Participate Community', 'Participation in community, social and civic activities'],
  ['0136', 'Group/Centre Activities', 'Group and centre based activities'],
];

const HIGH_INTENSITY = [
  'Complex bowel care',
  'Enteral feeding and management (naso-gastric tube, jejunum or duodenum)',
  'Urinary catheter management (in-dwelling, in-out and suprapubic catheter)',
  'Subcutaneous injections',
  'Complex wound management',
  'Severe dysphagia management',
];

const APPROVALS = [
  'Supporting participants with day to day management of medication',
  'Disposal of waste, and of infectious or hazardous substances',
  'Implementing regulated restrictive practices with the people supported',
];

const MODULES = [
  ['Core Module', 'All registered NDIS providers', 'Rights and responsibilities; governance and operational management; provision of supports; the support provision environment.'],
  ['Module 1 — High Intensity Daily Personal Activities', 'Registration group 0104', 'Applies to each of the six high intensity support types listed above. Includes the clinical supervision, competency and escalation requirements for those supports.'],
  ['Implementing Behaviour Support Plans (Module 2A)', 'Approval to implement regulated restrictive practices', 'Applies because the organisation is approved to implement restrictive practices. It does not develop behaviour support plans — registration group 0110 (Specialist Behaviour Support) is not held, so the full Specialist Behaviour Support module does not apply.'],
  ['Module 5A — Assistance with Supported Independent Living', 'Registration group 0115', 'Commenced 1 July 2026, after this certificate was issued. Four standards: supported decision-making, safeguarding, practice governance, and agreements about tenancy, housing and support arrangements.'],
];

const NOT_HELD = [
  ['0103 / Module 5', 'Specialist Disability Accommodation', 'Not registered. The organisation does not provide SDA housing.'],
  ['0110 / Module 2', 'Specialist Behaviour Support', 'Not registered. Behaviour support plans are developed by external practitioners and implemented by this organisation.'],
  ['0118 / Module 3', 'Early Childhood Supports', 'Not registered.'],
  ['0132 / Module 4', 'Specialist Support Coordination', 'Not registered.'],
];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Arial', size: 19, color: INK } } } },
  sections: [{
    properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: RED } }, spacing: { after: 120 }, children: [new ImageRun({ data: logoBuffer, transformation: { width: 190, height: 43 }, type: 'png' })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: RED } }, spacing: { before: 100 }, children: [run('Humanity and Inclusion Pty Ltd  |  ABN 27 659 576 968  |  ACN 659 576 968  |  NDIS Registration ID 4-K7B0WDS', { size: 15, color: MUTED })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 120, after: 40 }, children: [run('Business Activity and Scope of Registration', { bold: true, size: 30, color: NAVY })] }),
      new Paragraph({ spacing: { after: 220 }, children: [run('Attachment to the Keystone Allied Health Combined Professional Indemnity and Liability Renewal Proposal Form', { size: 19, color: MUTED })] }),

      p('This attachment sets out the insured\'s business activity in full. The Business Activity section of the proposal form does not provide sufficient space to describe the scope of an NDIS provider registration, and the form provides for further detail to be attached on the insured\'s letterhead.', { color: MUTED }),

      h('1.  The insured'),
      kv([
        ['Legal name', 'Humanity and Inclusion Pty Ltd'],
        ['Trading name', 'HUMANITY AND INCLUSION PTY LTD'],
        ['ABN / ACN', '27 659 576 968  /  659 576 968'],
        ['NDIS Registration ID', '4-K7B0WDS'],
        ['Registered provider since', '1 November 2024'],
        ['Registration in force until', '1 November 2027'],
        ['Midterm audit', 'Scheduled start 2 May 2026'],
        ['Primary address / head office (per NDIS certificate)', '9 Vantage Green, Beveridge VIC 3753'],
        ['Address shown on the proposal form', '47 Station Road, Deer Park VIC 3023 — see note 6'],
        ['States of operation', 'Registered to provide throughout Australia; operations currently Victoria'],
      ]),

      h('2.  What the business actually does'),
      p('Humanity and Inclusion Pty Ltd is a registered NDIS provider delivering disability supports to participants in their own homes, in shared supported accommodation and in the community. The supports delivered are broader than domestic assistance and include clinical and high intensity personal care.'),
      p('The description "Home Care" does not capture the activity. The registration includes high intensity daily personal activities, community nursing care, assistance with daily life in shared living arrangements, and approval to implement regulated restrictive practices. These carry a materially different risk profile from domestic home care and are disclosed in full below.', { bold: true }),

      h('3.  Classes of support registered'),
      p('Twelve registration groups, as listed on the Certificate of Registration.', { color: MUTED }),
      grid(['Group', 'Class of support', 'What it covers'], GROUPS.map((g) => [g[0], g[1], g[2]]), [10, 30, 60]),

      h('4.  High intensity supports delivered under registration group 0104'),
      p('Each of these is a clinical or high intensity support delivered by trained and assessed workers, under the High Intensity Skills Descriptors and with clinical oversight.', { color: MUTED }),
      ...HIGH_INTENSITY.map(b),
      new Paragraph({ spacing: { before: 160, after: 90 }, children: [run('The organisation is additionally approved for:', { bold: true })] }),
      ...APPROVALS.map(b),

      h('5.  NDIS Practice Standards that apply'),
      p('The applicable modules follow from the registration groups above. These are the standards the organisation is audited against.', { color: MUTED }),
      grid(['Module', 'Applies because', 'Scope'], MODULES, [26, 22, 52]),
      new Paragraph({ spacing: { before: 200, after: 90 }, children: [run('Modules that do NOT apply, for completeness:', { bold: true })] }),
      grid(['Group / module', 'Name', 'Position'], NOT_HELD, [20, 28, 52]),

      h('6.  Matters the insurer should note'),
      b('The Certificate of Registration records the primary address and head office as 9 Vantage Green, Beveridge VIC 3753. The proposal form records 47 Station Road, Deer Park VIC 3023. Both addresses should be disclosed and the policy should record every location from which services are delivered or administered.'),
      b('Community nursing care (0114) and the six high intensity supports at item 4 are clinical activities. Cover should be confirmed as extending to them, not only to domestic assistance.'),
      b('The organisation implements regulated restrictive practices. It does not author behaviour support plans; these are prepared by external specialist practitioners.'),
      b('Supported independent living is delivered under registration group 0115. Module 5A of the NDIS Practice Standards commenced on 1 July 2026, after this Certificate of Registration was issued and after the scheduled midterm audit date, and will apply at the next audit.'),
      b('The turnover split in the Business Activity section should be restated against the classes of support above rather than as a single "Home Care" line.'),

      new Paragraph({ spacing: { before: 320 }, children: [run('Prepared from the NDIS Certificate of Registration, Registration ID 4-K7B0WDS, issued 18 November 2024, in force from 1 November 2024. The registration groups, high intensity support types and approvals are transcribed from that certificate. The Practice Standards modules at item 5 follow from those registration groups.', { size: 16, color: MUTED })] }),
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
console.log('delivered', delivered);
console.log(`  ${GROUPS.length} registration groups · ${HIGH_INTENSITY.length} high intensity supports · ${APPROVALS.length} approvals · ${MODULES.length} modules apply, ${NOT_HELD.length} do not`);
