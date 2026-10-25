import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun,
  PageBreak, ShadingType, Header, Footer
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, 'Letter_of_Engagement_DSW_OLF.docx');
const logoBuffer = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));

const OLF_BLUE = '309EDD';
const OLF_BLUE_DARK = '1A7AB8';
const WHITE = 'FFFFFF';
const TEXT_PRIMARY = '1A1A2E';
const TEXT_SECONDARY = '4A4A5A';
const BORDER_COLOR = 'D0D5DD';
const FONT = 'Inter';

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
};
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

function heading(num, text) {
  return new Paragraph({
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } },
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 24, color: OLF_BLUE, font: FONT }),
      new TextRun({ text, bold: true, size: 24, color: OLF_BLUE_DARK, font: FONT }),
    ],
  });
}

function headingNoNum(text) {
  return new Paragraph({
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } },
    children: [
      new TextRun({ text, bold: true, size: 24, color: OLF_BLUE_DARK, font: FONT }),
    ],
  });
}

function subHeading(text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: TEXT_PRIMARY, font: FONT })],
  });
}

function para(text, opts = {}) {
  const runs = [];
  // Simple bold handling with **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, size: 22, color: TEXT_PRIMARY, font: FONT, ...opts }));
    } else {
      runs.push(new TextRun({ text: part, size: 22, color: TEXT_PRIMARY, font: FONT, ...opts }));
    }
  }
  return new Paragraph({ spacing: { after: 120 }, children: runs });
}

function bullet(text, level = 0) {
  const runs = [];
  const parts = text.split(/(\*\*.*?\*\*)/g);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, size: 22, color: TEXT_PRIMARY, font: FONT }));
    } else {
      runs.push(new TextRun({ text: part, size: 22, color: TEXT_PRIMARY, font: FONT }));
    }
  }
  return new Paragraph({ bullet: { level }, spacing: { after: 50 }, children: runs });
}

function numberedItem(text) {
  return new Paragraph({
    numbering: { reference: 'schedule-list', level: 0 },
    spacing: { after: 50 },
    children: [new TextRun({ text, size: 22, color: TEXT_PRIMARY, font: FONT })],
  });
}

function infoTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value, isPlaceholder]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 38, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { type: ShadingType.SOLID, color: OLF_BLUE },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: WHITE, font: FONT })] })],
          }),
          new TableCell({
            width: { size: 62, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, color: isPlaceholder ? '999999' : TEXT_PRIMARY, italics: !!isPlaceholder, font: FONT })] })],
          }),
        ],
      })
    ),
  });
}

function sigBlock(title) {
  return [
    subHeading(title),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: ['Full Name', 'Signature', 'Date'].map(l =>
          new TableCell({
            borders: noBorders,
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: l, bold: true, size: 16, color: TEXT_SECONDARY, font: FONT, allCaps: true })] }),
              new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } }, spacing: { after: 160 }, children: [new TextRun({ text: ' ', size: 22 })] }),
            ],
          })
        ),
      })],
    }),
    new Paragraph({ spacing: { after: 160 }, children: [] }),
  ];
}

const doc = new Document({
  numbering: {
    config: [{
      reference: 'schedule-list',
      levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 360 } } } }],
    }],
  },
  styles: { default: { document: { run: { font: FONT, size: 22, color: TEXT_PRIMARY } } } },
  sections: [{
    properties: {
      page: { margin: { top: 1134, right: 1020, bottom: 1134, left: 1020 } },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: OLF_BLUE } },
          spacing: { after: 100 },
          children: [
            new ImageRun({ data: logoBuffer, transformation: { width: 140, height: 72 }, type: 'png' }),
            new TextRun({ text: '\t', size: 22 }),
            new TextRun({ text: 'One Life Foundation', bold: true, size: 26, color: OLF_BLUE_DARK, font: FONT }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } }, spacing: { before: 80 }, children: [
            new TextRun({ text: 'One Life Foundation Pty Ltd', bold: true, size: 16, color: OLF_BLUE_DARK, font: FONT }),
            new TextRun({ text: '  |  ABN 55 643 227 061  |  NDIS Reg. 405 012 0437', size: 16, color: TEXT_SECONDARY, font: FONT }),
          ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: '(04) 5222 7799  |  support@olfndisservices.com.au  |  1343-1345 Donnybrook Rd, Woodstock, VIC', size: 16, color: TEXT_SECONDARY, font: FONT }),
          ] }),
        ],
      }),
    },
    children: [
      // Date & address
      para('Date: _______________'),
      para('To: ________________________________________'),
      para('Address: ________________________________________'),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      // Title
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
        new TextRun({ text: 'Letter of Engagement — Disability Support Worker', bold: true, size: 28, color: OLF_BLUE_DARK, font: FONT }),
      ] }),

      para('Dear _______________,'),
      para('We are pleased to offer you a position as a **Disability Support Worker** with **One Life Foundation Pty Ltd**. We believe your skills and experience will be a valuable addition to our team, and we look forward to working with you to deliver quality support to our participants.'),
      para('Please read the following terms and conditions carefully before signing.'),

      // 1
      heading('1', 'Position Details'),
      infoTable([
        ['Position Title', 'Disability Support Worker'],
        ['Employment Type', 'Casual'],
        ['Commencement Date', '[DD/MM/YYYY]', true],
        ['Reporting To', '[Manager Name / Title]', true],
        ['Primary Location', '[Site Address / Various as directed]', true],
        ['Award Classification', 'SCHCADS Award — Level [X], Pay Point [X]', true],
        ['Hourly Rate (Ordinary)', '$[Amount] per hour (incl. 25% casual loading)', true],
      ]),

      // 2
      heading('2', 'Nature of Casual Employment'),
      para('Your employment will be on a **casual basis** under section 15A of the Fair Work Act 2009 (Cth), commencing on the date specified above.'),
      para('As a casual employee:'),
      bullet('One Life Foundation makes no firm advance commitment to continuing and indefinite work according to an agreed work pattern.'),
      bullet('Work will be offered to you as it becomes available, and you may accept or decline each offer.'),
      bullet('You will be paid a casual loading in lieu of entitlements such as paid annual leave and paid personal/carer\'s leave.'),
      bullet('Each engagement stands alone — there is no guaranteed minimum number of hours per week.'),
      subHeading('Casual Conversion'),
      para('As a casual employee, you may have the right to request conversion to permanent employment under the Fair Work Act 2009. The general requirements are:'),
      bullet('You have been employed by One Life Foundation for at least 12 months;'),
      bullet('You have worked a regular pattern of hours for at least the last 6 months on an ongoing basis; and'),
      bullet('Those hours could reasonably continue as a permanent employee without significant change.'),
      para('If you believe you meet these requirements, you may submit a written request to your manager. One Life Foundation will respond within 21 days in accordance with its obligations under the Act.'),

      // 3
      heading('3', 'Duties and Responsibilities'),
      para('Your role as a Disability Support Worker will include, but is not limited to:'),
      bullet('Providing in-home and community-based support to NDIS participants with daily living tasks, including personal care (washing, dressing, showering, grooming), meal preparation, domestic assistance, and transport.'),
      bullet('Supporting participants with community access and social participation, including medical appointments, shopping, and recreational outings.'),
      bullet('Assisting participants to build self-confidence, independence, and social skills in line with their individual goals and support plans.'),
      bullet('Developing and implementing participant-specific programs in collaboration with coordinators and allied health professionals.'),
      bullet('Safely operating mobility equipment, including hoists, wheelchairs, and shower chairs, in accordance with training provided.'),
      bullet('Accurately completing shift notes, incident reports, and other documentation as required.'),
      bullet('Following all participant support plans, risk assessments, and behavioural support plans.'),
      bullet('Reporting any concerns regarding participant welfare, safety, or changes in condition to your supervisor promptly.'),
      para('You may also be required to perform other duties reasonably directed by One Life Foundation, having regard to your skills, training, and experience. You may be required to work at different locations as directed.'),

      // 4
      new Paragraph({ children: [new PageBreak()] }),
      heading('4', 'Terms and Conditions of Employment'),
      para('Unless more generous provisions are set out in this letter or the attached schedule, the terms and conditions of your employment will be those contained in the **Social, Community, Home Care and Disability Services Industry Award 2010** and applicable legislation, including the National Employment Standards (NES) in the Fair Work Act 2009 (Cth).'),
      para('You can access information about minimum terms and conditions from the **Fair Work Ombudsman** on **13 13 94** or at **www.fairwork.gov.au**.'),

      // 5
      heading('5', 'Pre-Employment Requirements'),
      para('**This offer of employment is conditional upon satisfactory completion of the following:**'),
      bullet('**NDIS Worker Screening Check** — You must hold a valid and current NDIS Worker Screening clearance prior to commencing work.'),
      bullet('**First Aid and CPR Certification** — A current First Aid and CPR certificate must be provided prior to your first shift.'),
      bullet('**Right to Work in Australia** — Evidence of your right to work in Australia (e.g., passport, visa, birth certificate).'),
      bullet('**Driver\'s Licence** — A current Australian driver\'s licence (where the role requires transport of participants).'),
      bullet('**Referee Checks** — Satisfactory completion of reference checks from two professional referees.'),
      para('Failure to provide the above documentation may result in the withdrawal of this offer or termination of employment.'),

      // 6
      heading('6', 'NDIS Code of Conduct'),
      para('As an employee delivering NDIS-funded supports, you are required to comply with the **NDIS Code of Conduct** at all times. This means you must:'),
      bullet('Act with respect for individual rights to freedom of expression, self-determination, and decision-making in accordance with applicable laws and conventions.'),
      bullet('Respect the privacy of people with disability.'),
      bullet('Provide supports and services in a safe and competent manner, with care and skill.'),
      bullet('Act with integrity, honesty, and transparency.'),
      bullet('Promptly take steps to raise and act on concerns about matters that may impact the quality and safety of supports and services.'),
      bullet('Take all reasonable steps to prevent and respond to all forms of violence against, and exploitation, neglect, and abuse of, people with disability.'),
      bullet('Take all reasonable steps to prevent and respond to sexual misconduct.'),
      para('A breach of the NDIS Code of Conduct may result in disciplinary action, including termination of employment, and may be reported to the NDIS Quality and Safeguards Commission.'),

      // 7
      heading('7', 'Work Health and Safety'),
      para('One Life Foundation is committed to providing a safe working environment. You are required to:'),
      bullet('Take reasonable care for your own health and safety and the health and safety of others.'),
      bullet('Comply with all workplace health and safety policies, procedures, and reasonable instructions.'),
      bullet('Use personal protective equipment (PPE) as required.'),
      bullet('Report all hazards, incidents, near misses, and injuries immediately to your supervisor.'),
      bullet('Not attend work while under the influence of drugs or alcohol.'),
      bullet('Participate in WHS training and inductions as required.'),

      // 8
      heading('8', 'Incident Reporting'),
      para('You are required to report all incidents, accidents, near misses, and allegations of abuse, neglect, or exploitation immediately to your supervisor and in accordance with One Life Foundation\'s Incident Management Policy. Reportable incidents must also be notified to the NDIS Quality and Safeguards Commission as required by law.'),

      // 9
      heading('9', 'Confidentiality and Privacy'),
      para('By accepting this offer, you acknowledge and agree that you will not, during or after your employment, except with the express written consent of One Life Foundation or as required by law or in the proper performance of your duties:'),
      bullet('Use or disclose any confidential information relating to One Life Foundation\'s business, including but not limited to participant details, support plans, medical information, operational data, trade secrets, pricing structures, and internal policies.'),
      bullet('Access, copy, or remove any records, documents, or data belonging to One Life Foundation or its participants except as necessary for your duties.'),
      para('You must comply with the Privacy Act 1988 (Cth) and the Australian Privacy Principles at all times. This obligation of confidentiality survives the termination of your employment.'),

      // 10
      heading('10', 'Conflict of Interest'),
      para('You must disclose to One Life Foundation any actual, potential, or perceived conflict of interest that may arise during your employment. You must not, without prior written approval, engage in any outside employment or activity that may conflict with your duties or with the interests of One Life Foundation or its participants.'),

      // 11
      new Paragraph({ children: [new PageBreak()] }),
      heading('11', 'Training and Professional Development'),
      para('You are required to:'),
      bullet('Complete all mandatory induction and orientation training prior to or upon commencement.'),
      bullet('Attend and complete ongoing training as directed, including refresher courses for First Aid, CPR, manual handling, and medication administration.'),
      bullet('Maintain current and valid certifications as required for your role (NDIS Worker Screening, First Aid/CPR).'),
      bullet('Participate in performance reviews and professional development discussions as scheduled.'),
      para('One Life Foundation will provide reasonable support and access to training opportunities relevant to your role.'),

      // 12
      heading('12', 'Drug and Alcohol Policy'),
      para('You must not attend work, or perform any duties on behalf of One Life Foundation, while under the influence of alcohol, illicit drugs, or any substance that may impair your ability to perform your duties safely. One Life Foundation reserves the right to conduct drug and alcohol testing in accordance with its policies and applicable law.'),

      // 13
      heading('13', 'Use of Property and Technology'),
      para('Any property, equipment, uniforms, keys, access cards, mobile devices, or technology provided to you by One Life Foundation remains the property of One Life Foundation and must be:'),
      bullet('Used only for authorised work purposes.'),
      bullet('Maintained in good condition.'),
      bullet('Returned immediately upon request or upon termination of employment.'),
      para('You must not use personal devices to photograph, record, or store participant information unless expressly authorised in writing.'),

      // 14
      heading('14', 'Termination of Employment'),
      para('As a casual employee, your employment may be terminated at any time by either party. One Life Foundation may cease offering you shifts without notice, and you may cease accepting shifts without notice.'),
      para('Notwithstanding the above, One Life Foundation may terminate your employment immediately (summary dismissal) in cases of serious misconduct, including but not limited to:'),
      bullet('Theft, fraud, or dishonesty.'),
      bullet('Serious breach of the NDIS Code of Conduct.'),
      bullet('Violence, harassment, or bullying.'),
      bullet('Being under the influence of drugs or alcohol while on duty.'),
      bullet('Serious or wilful neglect of duties.'),
      bullet('Any conduct that poses a risk to the safety or wellbeing of participants, staff, or the public.'),
      para('Upon termination, you must return all One Life Foundation property and cease using any confidential information.'),

      // 15
      heading('15', 'The Agreement'),
      para('The terms and conditions set out in this letter and the attached schedule constitute the complete terms of your engagement and replace any prior understanding, agreement, or representation between you and One Life Foundation.'),
      para('These terms may only be varied by a written agreement signed by both you and an authorised representative of One Life Foundation.'),
      subHeading('Attached Schedule'),
      numberedItem('Disability Support Worker — Position Description'),
      numberedItem('Fair Work Information Statement (National Employment Standards)'),
      numberedItem('Casual Employment Information Statement'),
      numberedItem('One Life Foundation Policies and Procedures (available via the staff portal)'),

      // 16
      heading('16', 'Contact'),
      para('If you have any questions about the terms and conditions of your employment, please do not hesitate to contact us:'),
      infoTable([
        ['Email', 'support@olfndisservices.com.au'],
        ['Phone', '(04) 5222 7799'],
      ]),
      para('We look forward to welcoming you to the One Life Foundation team and are confident you will make a positive contribution to the lives of the participants we support.'),
      para('Yours sincerely,'),

      // Employer sig
      ...sigBlock('General Manager — One Life Foundation Pty Ltd'),

      // Acceptance
      new Paragraph({ children: [new PageBreak()] }),
      headingNoNum('Acceptance of Offer'),
      para('I, the undersigned, confirm that I have read and understood the terms and conditions of employment set out in this letter and the attached schedule. I accept this offer of casual employment and acknowledge that:'),
      bullet('I understand the nature of casual employment as described in this letter.'),
      bullet('I agree to comply with the NDIS Code of Conduct at all times.'),
      bullet('I agree to comply with all One Life Foundation policies and procedures.'),
      bullet('I will maintain all required certifications and screening checks throughout my employment.'),
      bullet('I understand my obligations regarding confidentiality, privacy, and incident reporting.'),
      bullet('I have received and read the Fair Work Information Statement and the Casual Employment Information Statement.'),

      ...sigBlock('Employee'),
      ...sigBlock('Witness'),

      para('Please return the signed acceptance to One Life Foundation within 7 days of the date of this letter.', { italics: true, color: TEXT_SECONDARY }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buffer);
console.log('DOCX created:', outputPath);
