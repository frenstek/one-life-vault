import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun,
  PageBreak, ShadingType, Header, Footer
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, 'SIL_Service_Agreement_John_Ross.docx');
const downloadsPath = path.join('C:', 'Users', 'kevin', 'Downloads', 'SIL_Service_Agreement_John_Ross.docx');
const logoPath = path.join(__dirname, 'public', 'logo.png');
const logoBuffer = fs.readFileSync(logoPath);

const OLF_BLUE = '309EDD';
const OLF_BLUE_DARK = '1A7AB8';
const WHITE = 'FFFFFF';
const TEXT_PRIMARY = '1A1A2E';
const TEXT_SECONDARY = '4A4A5A';
const BORDER_COLOR = 'D0D5DD';

const noBorders = { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } };
const cellBorders = { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } };

const h = (num, text) => new Paragraph({
  spacing: { before: 400, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } },
  children: [
    ...(num ? [new TextRun({ text: `${num}. `, bold: true, size: 26, color: OLF_BLUE, font: 'Inter' })] : []),
    new TextRun({ text, bold: true, size: 26, color: OLF_BLUE_DARK, font: 'Inter' }),
  ],
});

const p = (text, opts = {}) => new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text, size: 22, color: TEXT_PRIMARY, font: 'Inter', ...opts })] });

const b = (text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text, size: 22, color: TEXT_PRIMARY, font: 'Inter' })] });

const bb = (bold, rest) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: bold, bold: true, size: 22, color: TEXT_PRIMARY, font: 'Inter' }), new TextRun({ text: rest, size: 22, color: TEXT_PRIMARY, font: 'Inter' })] });

const sub = (text) => new Paragraph({ spacing: { before: 250, after: 100 }, children: [new TextRun({ text, bold: true, size: 22, color: TEXT_PRIMARY, font: 'Inter' })] });

const tbl = (rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: rows.map(([label, value, ph]) => new TableRow({
    children: [
      new TableCell({ width: { size: 38, type: WidthType.PERCENTAGE }, borders: cellBorders, shading: { type: ShadingType.SOLID, color: OLF_BLUE }, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: WHITE, font: 'Inter' })] })] }),
      new TableCell({ width: { size: 62, type: WidthType.PERCENTAGE }, borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, color: ph ? '999999' : TEXT_PRIMARY, italics: !!ph, font: 'Inter' })] })] }),
    ],
  })),
});

const sig = (title) => [
  sub(title),
  new Paragraph({ spacing: { before: 100 }, children: [] }),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: ['Full Name', 'Signature', 'Date'].map(l => new TableCell({
        borders: noBorders, width: { size: 33, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: l, bold: true, size: 16, color: TEXT_SECONDARY, font: 'Inter', allCaps: true })] }),
          new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 200 }, children: [new TextRun({ text: ' ', size: 22 })] }),
        ],
      })),
    })],
  }),
  new Paragraph({ spacing: { after: 200 }, children: [] }),
];

const pb = () => new Paragraph({ children: [new PageBreak()] });

const doc = new Document({
  styles: { default: { document: { run: { font: 'Inter', size: 22, color: TEXT_PRIMARY } } } },
  sections: [{
    properties: { page: { margin: { top: 1134, right: 1020, bottom: 1134, left: 1020 } } },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: OLF_BLUE } },
          spacing: { after: 100 },
          children: [
            new ImageRun({ data: logoBuffer, transformation: { width: 160, height: 82 }, type: 'png' }),
            new TextRun({ text: '\t', size: 22 }),
            new TextRun({ text: 'One Life Foundation', bold: true, size: 28, color: OLF_BLUE_DARK, font: 'Inter' }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, spacing: { before: 100 }, children: [
            new TextRun({ text: 'One Life Foundation Pty Ltd', bold: true, size: 16, color: OLF_BLUE_DARK, font: 'Inter' }),
            new TextRun({ text: '  |  ABN 55 643 227 061  |  NDIS Registered Provider', size: 16, color: TEXT_SECONDARY, font: 'Inter' }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '0420 652 270  |  support@olfndisservices.com.au  |  www.olfndisservices.com.au', size: 16, color: TEXT_SECONDARY, font: 'Inter' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '23 Grammar Avenue, Donnybrook VIC 3064', size: 16, color: TEXT_SECONDARY, font: 'Inter' })] }),
        ],
      }),
    },
    children: [
      // TITLE
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 80 }, children: [new TextRun({ text: 'Supported Independent Living (SIL)', bold: true, size: 36, color: OLF_BLUE_DARK, font: 'Inter' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: 'Service Agreement', bold: true, size: 36, color: OLF_BLUE_DARK, font: 'Inter' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'NDIS Funded  |  Core Supports \u2014 Assistance with Daily Living', size: 22, color: TEXT_SECONDARY, font: 'Inter' })] }),

      tbl([
        ['Document Version', '1.0'],
        ['Date of Issue', '10/08/2026'],
        ['Agreement Reference', 'OLF-SIL-001'],
      ]),

      // 1. PARTIES
      h('1', 'Parties to This Agreement'),
      sub('SIL Support Provider'),
      tbl([
        ['Provider Name', 'One Life Foundation Pty Ltd'],
        ['ABN', '55 643 227 061'],
        ['NDIS Registration No.', '405 012 0437'],
        ['Address', '23 Grammar Avenue, Donnybrook VIC 3064'],
        ['Phone', '0420 652 270'],
        ['Email', 'support@olfndisservices.com.au'],
      ]),

      sub('Participant'),
      tbl([
        ['Full Name', 'John Eric Ross'],
        ['Date of Birth', '30/12/1961'],
        ['NDIS Number', '574 479 496'],
        ['Phone', '0488 700 146'],
        ['Preferred Language', 'English'],
        ['Communication Needs', 'None'],
        ['Emergency Contact', 'Beverly Ross \u2014 Wife \u2014 0416 104 301'],
      ]),

      sub('Authorised Representative / Nominee (if applicable)'),
      tbl([
        ['Full Name', 'Beverly Ross'],
        ['Relationship', 'Wife'],
        ['Authority Type', 'Authorised Representative'],
        ['Phone', '0416 104 301'],
      ]),

      sub('Plan Management & Coordination'),
      tbl([
        ['Plan Management Type', 'Plan-Managed'],
        ['Plan Manager', 'Distinctability Services \u2014 planmanagers@distinctability.or.au'],
        ['Support Coordinator', 'Gulsun Ali \u2014 Interconnection Support Services \u2014 0407 346 180 \u2014 gulsun@interconnectionservices.com.au'],
      ]),

      // 2. PURPOSE & GOALS
      h('2', 'Purpose and Goals'),
      p('This agreement sets out the terms under which One Life Foundation will deliver Supported Independent Living (SIL) supports to John Eric Ross. This agreement replaces the previous MTA Service Agreement (25/05/2026 \u2013 23/08/2026) and covers ongoing SIL supports.'),

      sub('Participant\'s Goals'),
      tbl([
        ['Goal 1', 'Establish a consistent daily routine that supports health, dignity, and wellbeing'],
        ['Goal 2', 'Maintain stable health through consistent support and medical appointment attendance'],
        ['Goal 3', 'Prevent hospital readmissions through proactive health management'],
        ['Goal 4', 'Rebuild and maintain family relationships'],
        ['Goal 5', 'Maximise physical function and comfort'],
      ]),

      // 3. AGREEMENT PERIOD
      h('3', 'Agreement Period'),
      tbl([
        ['Start Date', '24/08/2026'],
        ['End Date', '[Per NDIS plan review]', true],
        ['Previous Agreement', 'MTA Service Agreement \u2014 25/05/2026 to 23/08/2026'],
      ]),
      p('This agreement commences following the conclusion of the MTA Service Agreement and remains in effect until the end date or until terminated by either party in accordance with Section 13. The agreement will be reviewed at least annually or when John\'s NDIS plan is reviewed, whichever occurs first.'),

      // 4. SCHEDULE OF SUPPORTS
      h('4', 'Schedule of Supports'),
      p('A detailed Schedule of Supports is maintained as a separate document and forms part of this agreement. The schedule below provides a summary of the types of supports delivered.'),

      sub('Supports Included'),
      b('Personal care (showering, toileting, grooming, dressing, oral hygiene).'),
      b('Daily living tasks (meal preparation, cleaning, laundry, household tasks).'),
      b('Overnight support (active night or sleepover as per assessed needs).'),
      b('Medication prompting and/or administration as per medication management plan.'),
      b('Health and wellbeing support (appointments, exercise, health monitoring).'),
      b('Community access, social participation, and relationship building.'),
      b('Communication and decision-making support.'),
      b('Emergency response and on-call support.'),
      b('Coordination with other service providers.'),

      sub('Supports Not Included'),
      b('Accommodation, property management, or tenancy matters (managed by SDA provider).'),
      b('Transport not directly related to support delivery (funded separately).'),
      b('Allied health services (funded separately).'),
      b('Support coordination (funded separately).'),

      sub('Participant-Funded Expenses'),
      p('The following costs are the responsibility of the participant and are not covered by One Life Foundation or NDIS SIL funding:'),
      b('Medications \u2014 all prescription and over-the-counter medications.'),
      b('Food and groceries \u2014 all meals, beverages, and personal grocery items.'),
      b('Utilities \u2014 electricity, gas, water, and internet.'),

      sub('Shared Household Costs'),
      p('Utilities and shared household expenses are split equally among all residents at the property. When the property is at full capacity (3 residents), each participant is responsible for approximately 33% of shared costs (75% total shared across 3 participants). If fewer than 3 residents are present, the 75% shared portion is divided among the remaining residents.'),

      sub('Support Roster'),
      p('A roster will be developed in consultation with John. At least 7 days\' notice will be provided for roster changes where practicable.'),
      tbl([
        ['Weekday Hours', '[Per Roster of Care]', true],
        ['Weekend Hours', '[Per Roster of Care]', true],
        ['Overnight Model', '[Active Night / Sleepover]', true],
        ['Support Ratio', '[Per Roster of Care]', true],
      ]),

      // 5. FEES AND FUNDING
      h('5', 'Fees and Funding'),
      tbl([
        ['Support Category', 'Core Supports \u2014 Assistance with Daily Living'],
        ['Billing Frequency', '[Weekly / Fortnightly / Monthly]', true],
        ['Plan Management Type', 'Plan-Managed \u2014 Distinctability Services'],
      ]),

      p('All supports under this agreement are charged in accordance with the current NDIS Pricing Arrangements and Price Limits.'),

      b('One Life Foundation will not charge above the NDIS Price Limit for any support item.'),
      b('No gap fees, hidden charges, credit card surcharges, or administration fees beyond the NDIS-funded rate.'),
      b('At least 14 days\' written notice will be provided before any price change resulting from NDIS Price Guide updates.'),
      b('One Life Foundation will not charge for supports not delivered.'),
      b('Claims will only be made for supports delivered in accordance with this agreement.'),
      b('NDIS supports are GST-free per the A New Tax System (Goods and Services Tax) Act 1999.'),

      // 6. PROVIDER OBLIGATIONS
      h('6', 'Provider Obligations'),
      b('Deliver supports in a person-centred, safe, and competent manner.'),
      b('Comply with the NDIS Act 2013 (Cth), NDIS Practice Standards, and NDIS Code of Conduct.'),
      b('Maintain current NDIS registration for the duration of this agreement.'),
      b('Ensure all workers hold a current NDIS Worker Screening Check clearance.'),
      b('Ensure workers are trained in disability support, manual handling, first aid, medication management, and any participant-specific requirements.'),
      b('Introduce new support workers to John before unsupervised shifts where practicable.'),
      b('Maintain Public Liability Insurance (min. $20M), Professional Indemnity Insurance, and Workers Compensation Insurance. Certificates available on request.'),
      b('Comply with the Privacy Act 1988 (Cth) and Australian Privacy Principles.'),
      b('Develop and maintain an individual support plan, reviewed at least every 3 months.'),

      // 7. NDIS CODE OF CONDUCT
      h('7', 'NDIS Code of Conduct'),
      p('One Life Foundation and all workers are bound by the NDIS Code of Conduct. We will:'),
      bb('1. ', 'Act with respect for individual rights to freedom of expression, self-determination, and decision-making.'),
      bb('2. ', 'Respect the privacy of people with disability.'),
      bb('3. ', 'Provide supports in a safe and competent manner, with care and skill.'),
      bb('4. ', 'Act with integrity, honesty, and transparency.'),
      bb('5. ', 'Promptly raise and act on concerns about quality and safety of supports.'),
      bb('6. ', 'Take all reasonable steps to prevent and respond to violence, exploitation, neglect, and abuse.'),
      bb('7. ', 'Take all reasonable steps to prevent and respond to sexual misconduct.'),
      p('Code of Conduct concerns can be raised with One Life Foundation or the NDIS Commission on 1800 035 544.'),

      // 8. PARTICIPANT RIGHTS
      h('8', 'Participant Rights'),
      p('As set out in the NDIS Act 2013 and the UN Convention on the Rights of Persons with Disabilities:'),
      b('Be treated with dignity, respect, and fairness at all times.'),
      b('Exercise informed choice and control over your supports.'),
      b('Dignity of risk \u2014 make your own choices even when others may disagree.'),
      b('Privacy and confidentiality of your personal information.'),
      b('Services free from violence, abuse, neglect, exploitation, and discrimination.'),
      b('Access an advocate or support person at any time.'),
      b('Choose and change your support provider at any time without penalty.'),
      b('Have your cultural identity, values, and beliefs respected.'),
      b('Be supported to understand this agreement in your preferred format.'),
      b('Give feedback or complain without fear of reprisal.'),
      b('Be involved in decisions about your roster, staffing, and supports.'),

      // 9. PARTICIPANT RESPONSIBILITIES
      h('9', 'Participant Responsibilities'),
      b('Treat support workers and other residents with respect.'),
      b('Provide accurate information relevant to the delivery of supports.'),
      b('Notify One Life Foundation of changes to your NDIS plan or personal circumstances.'),
      b('Give reasonable notice of absences (holidays, hospital stays) for roster adjustments.'),
      b('Participate in the development and review of your support plan and goals.'),
      b('Raise concerns about supports, staff, or quality with One Life Foundation.'),

      // 10. CANCELLATION POLICY
      h('10', 'Cancellation and Short Notice Policy'),
      p('In accordance with the NDIS Pricing Arrangements and Price Limits:'),
      b('Cancellations with 2+ clear business days\' notice \u2014 no cancellation fee.'),
      b('Short notice (less than 2 clear business days) or no-show \u2014 up to 100% of the agreed fee may be charged.'),
      b('One Life Foundation will attempt to reallocate the worker before charging a cancellation fee.'),
      b('No cancellation fee where the cancellation is due to circumstances beyond the participant\'s control (e.g. hospitalisation).'),
      b('If One Life Foundation cancels a support (e.g. staff illness), a replacement will be arranged where possible and no charge will apply for undelivered supports.'),
      p('The participant confirms these cancellation terms were explained before signing.'),

      // 11. INCIDENT MANAGEMENT
      h('11', 'Incident Management'),
      p('One Life Foundation manages incidents in accordance with the NDIS (Incident Management and Reportable Incidents) Rules 2018:'),
      b('All incidents are reported, recorded, investigated, and reviewed.'),
      b('The participant will be notified of any incident that affects them.'),
      b('Reportable incidents (death, serious injury, abuse/neglect, sexual misconduct, unauthorised restrictive practices) are reported to the NDIS Commission within 24 hours.'),

      // 12. COMPLAINTS AND DISPUTES
      h('12', 'Complaints, Feedback, and Disputes'),
      p('Making a complaint will not affect your supports or this agreement. To raise a concern:'),
      bb('Step 1: ', 'Raise the matter with your support worker or team leader.'),
      bb('Step 2: ', 'If unresolved, formal complaint to 0420 652 270 or support@olfndisservices.com.au.'),
      bb('Step 3: ', 'Acknowledged within 2 business days, resolved within 14 business days.'),
      bb('Step 4: ', 'If unsatisfied, escalate to the NDIS Commission (1800 035 544) or NSW Ombudsman (1800 451 524).'),
      p('The participant may involve an independent advocate at any time via disabilityadvocacyfinder.dss.gov.au or 1800 800 110.'),

      sub('Dispute Resolution'),
      b('Direct negotiation within 7 business days.'),
      b('Mediation by an independent mediator if unresolved.'),
      b('Referral to the NDIS Commission if still unresolved.'),
      p('Supports continue during disputes unless there is an immediate safety risk.'),

      // 13. PRIVACY AND CONFIDENTIALITY
      pb(),
      h('13', 'Privacy and Confidentiality'),
      p('One Life Foundation manages personal information in accordance with the Privacy Act 1988 (Cth) and Australian Privacy Principles.'),
      b('Information is collected only as necessary and stored securely.'),
      b('Information is not shared without written consent, except where required by law, to prevent serious harm, for NDIS Commission reporting, or for NDIA claims.'),
      b('You may access and correct your personal information at any time.'),
      b('Data breaches are reported to affected individuals and the OAIC under the Notifiable Data Breaches scheme.'),
      b('Confidentiality obligations survive termination of this agreement.'),

      sub('Consent to Share Information'),
      tbl([
        ['NDIA / Plan Manager', '[Yes / No]', true],
        ['Support Coordinator', '[Yes / No]', true],
        ['Medical Practitioners', '[Yes / No]', true],
        ['Emergency Services', 'Yes (where required)'],
        ['Family', '[Yes / No]', true],
        ['Other Providers', '[Yes / No \u2014 specify]', true],
      ]),
      p('Consent may be withdrawn at any time by notifying One Life Foundation in writing.'),

      // 14. TERMINATION AND TRANSITION
      h('14', 'Termination and Transition'),
      sub('Participant-Initiated'),
      b('End this agreement at any time with no more than 14 days\' notice. No exit fees.'),
      b('Right to change support provider at any time without penalty.'),

      sub('Provider-Initiated'),
      p('One Life Foundation may terminate with minimum 14 days\' notice if:'),
      b('Serious or repeated breach of participant responsibilities that cannot be resolved.'),
      b('Immediate and ongoing safety risk to workers, residents, or the participant.'),
      b('NDIS funding is exhausted, withdrawn, or not renewed.'),

      sub('Continuity of Supports'),
      b('Supports continue during the notice period.'),
      b('With consent, a comprehensive handover is provided to the incoming provider.'),
      b('Claims cease after the termination date.'),
      b('Records are retained securely per legal requirements.'),
      p('One Life Foundation will not cease supports abruptly without ensuring John\'s safety.'),

      // 15. REVIEW AND VARIATION
      h('15', 'Review and Variation'),
      b('Agreement reviewed at least annually, or when the NDIS plan is reviewed \u2014 whichever is earlier.'),
      b('Individual support plan reviewed at least every 3 months.'),
      b('At least 14 days\' written notice for any proposed changes to fees, supports, or terms.'),
      b('Changes require written agreement from both parties.'),

      // 16. INFORMED CONSENT
      h('16', 'Informed Consent'),
      p('By signing, the participant (or representative) confirms:'),
      b('This agreement has been explained in a way they understand.'),
      b('They have had the opportunity to ask questions and seek independent advice.'),
      b('They understand the supports, costs, rights, and responsibilities.'),
      b('An easy-read version has been offered (available on request).'),
      b('They consent to supports being delivered by One Life Foundation.'),
      b('They may withdraw consent and end this agreement at any time.'),

      sub('Cooling-Off Period'),
      p('The participant has a 7-day cooling-off period from signing. During this period, the agreement may be cancelled without penalty. After this, the standard termination provisions in Section 14 apply.'),

      tbl([
        ['Consent Method', '[Written / Verbal (witnessed) / Via nominee]', true],
        ['Easy-Read Offered', '[Yes / No]', true],
        ['Interpreter Required', 'No'],
        ['Advocate Present', '[Yes / No]', true],
      ]),

      // 17. GOVERNING LAW
      h('17', 'Governing Law'),
      p('This agreement is governed by:'),
      b('National Disability Insurance Scheme Act 2013 (Cth)'),
      b('NDIS (Provider Registration and Practice Standards) Rules 2018'),
      b('NDIS (Code of Conduct) Rules 2018'),
      b('NDIS (Incident Management and Reportable Incidents) Rules 2018'),
      b('NDIS Pricing Arrangements and Price Limits (current edition)'),
      b('Privacy Act 1988 (Cth) and Australian Privacy Principles'),
      b('Australian Consumer Law (Competition and Consumer Act 2010)'),
      b('Applicable Victorian legislation'),
      p('Where this agreement conflicts with the NDIS Act or Rules, the Act and Rules prevail.'),

      // 18. SIGNATURES
      pb(),
      h('18', 'Agreement and Signatures'),
      p('By signing below, both parties confirm they have read, understood, and agree to this Service Agreement. The participant confirms they have received a copy.'),

      ...sig('Participant / Authorised Representative'),
      ...sig('One Life Foundation Representative'),
      ...sig('Witness (if required)'),

      sub('Acknowledgment of Receipt'),
      p('I confirm that I have received a signed copy of this Service Agreement.'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({
          children: ['Participant / Representative Name', 'Signature', 'Date'].map(l => new TableCell({
            borders: noBorders, width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: l, bold: true, size: 16, color: TEXT_SECONDARY, font: 'Inter', allCaps: true })] }),
              new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 200 }, children: [new TextRun({ text: ' ', size: 22 })] }),
            ],
          })),
        })],
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buf);
fs.copyFileSync(outputPath, downloadsPath);
console.log('SIL Service Agreement (John Ross) created:', outputPath);
console.log('Copied to Downloads:', downloadsPath);
