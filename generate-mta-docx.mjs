import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel, ImageRun,
  PageBreak, ShadingType, TabStopType, TabStopPosition,
  UnderlineType, Header, Footer
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, 'MTA_Service_Agreement_One_Life_Foundation.docx');
const downloadsPath = path.join('C:', 'Users', 'kevin', 'Downloads', 'MTA_Service_Agreement_One_Life_Foundation.docx');
const logoPath = path.join(__dirname, 'public', 'logo.png');
const logoBuffer = fs.readFileSync(logoPath);

// Colors
const OLF_BLUE = '309EDD';
const OLF_BLUE_DARK = '1A7AB8';
const OLF_GREEN = '0EA03E';
const OLF_GREEN_DARK = '0A7A2E';
const RED = 'D92D20';
const RED_DARK = 'B42318';
const WHITE = 'FFFFFF';
const TEXT_PRIMARY = '1A1A2E';
const TEXT_SECONDARY = '4A4A5A';
const BORDER_COLOR = 'D0D5DD';
const BG_SECTION = 'EEF6FD';
const BG_INCLUDED = 'EDF7F0';
const BG_EXCLUDED = 'FEF3F2';
const BG_ALERT = 'FEF2F2';
const BG_GREY = 'F5F7FA';

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
};

function sectionHeading(num, text) {
  return new Paragraph({
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } },
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 26, color: OLF_BLUE, font: 'Inter' }),
      new TextRun({ text, bold: true, size: 26, color: OLF_BLUE_DARK, font: 'Inter' }),
    ],
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 150 },
    children: [
      new TextRun({ text, size: 22, color: TEXT_PRIMARY, font: 'Inter', ...opts }),
    ],
  });
}

function bodyTextMulti(runs) {
  return new Paragraph({
    spacing: { after: 150 },
    children: runs.map(r => new TextRun({ size: 22, color: TEXT_PRIMARY, font: 'Inter', ...r })),
  });
}

function bulletItem(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, color: TEXT_PRIMARY, font: 'Inter' })],
  });
}

function bulletItemBold(boldPart, rest) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: boldPart, bold: true, size: 22, color: TEXT_PRIMARY, font: 'Inter' }),
      new TextRun({ text: rest, size: 22, color: TEXT_PRIMARY, font: 'Inter' }),
    ],
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
            children: [new Paragraph({
              children: [new TextRun({ text: label, bold: true, size: 20, color: WHITE, font: 'Inter' })],
            })],
          }),
          new TableCell({
            width: { size: 62, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            children: [new Paragraph({
              children: [new TextRun({
                text: value,
                size: 20,
                color: isPlaceholder ? '999999' : TEXT_PRIMARY,
                italics: !!isPlaceholder,
                font: 'Inter',
              })],
            })],
          }),
        ],
      })
    ),
  });
}

function subHeading(text) {
  return new Paragraph({
    spacing: { before: 250, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: TEXT_PRIMARY, font: 'Inter' })],
  });
}

function signatureBlock(title) {
  return [
    subHeading(title),
    new Paragraph({ spacing: { before: 100 }, children: [] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ['Full Name', 'Signature', 'Date'].map(label =>
            new TableCell({
              borders: noBorders,
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { after: 40 },
                  children: [new TextRun({ text: label, bold: true, size: 16, color: TEXT_SECONDARY, font: 'Inter', allCaps: true })],
                }),
                new Paragraph({
                  border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } },
                  spacing: { after: 200 },
                  children: [new TextRun({ text: ' ', size: 22 })],
                }),
              ],
            })
          ),
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  ];
}

function spacer(size = 100) {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

// ─────────────────────────────────────────────────
// BUILD DOCUMENT
// ─────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Inter', size: 22, color: TEXT_PRIMARY },
      },
    },
  },
  numbering: {
    config: [{
      reference: 'bullet-list',
      levels: [{
        level: 0,
        format: 'bullet',
        text: '\u2022',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1134, right: 1020, bottom: 1134, left: 1020 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: OLF_BLUE } },
            spacing: { after: 100 },
            children: [
              new ImageRun({ data: logoBuffer, transformation: { width: 160, height: 82 }, type: 'png' }),
              new TextRun({ text: '\t', size: 22 }),
              new TextRun({ text: 'One Life Foundation', bold: true, size: 28, color: OLF_BLUE_DARK, font: 'Inter' }),
              new TextRun({ text: '\n', size: 10 }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: OLF_BLUE } },
            spacing: { before: 100 },
            children: [
              new TextRun({ text: 'One Life Foundation Pty Ltd', bold: true, size: 16, color: OLF_BLUE_DARK, font: 'Inter' }),
              new TextRun({ text: '  |  ABN 55 643 227 061  |  NDIS Registered Provider', size: 16, color: TEXT_SECONDARY, font: 'Inter' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Phone: (04) 5222 7799  |  support@olfndisservices.com.au  |  www.olfndisservices.com.au', size: 16, color: TEXT_SECONDARY, font: 'Inter' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '40 1-15 Fontenoy Road, Macquarie Park NSW 2113', size: 16, color: TEXT_SECONDARY, font: 'Inter' }),
            ],
          }),
        ],
      }),
    },
    children: [
      // ═══════════════════════════════════════════
      // TITLE BLOCK
      // ═══════════════════════════════════════════
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({ text: 'Medium Term Accommodation (MTA)', bold: true, size: 36, color: OLF_BLUE_DARK, font: 'Inter' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Service Agreement', bold: true, size: 36, color: OLF_BLUE_DARK, font: 'Inter' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Up to 90 Days  |  NDIS Funded', size: 24, color: TEXT_SECONDARY, font: 'Inter' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'NDIS REGISTERED PROVIDER', bold: true, size: 18, color: OLF_BLUE, font: 'Inter', allCaps: true }),
        ],
      }),

      // Document version & date
      infoTable([
        ['Document Version', '2.0'],
        ['Date of Issue', '[DD/MM/YYYY]', true],
        ['Agreement Reference', 'OLF-MTA-[XXX]', true],
      ]),

      // ═══════════════════════════════════════════
      // SECTION 1 — PARTIES
      // ═══════════════════════════════════════════
      sectionHeading('1', 'Parties to This Agreement'),
      bodyText('This Service Agreement is made between the following parties:'),

      subHeading('Service Provider'),
      infoTable([
        ['Provider Name', 'One Life Foundation Pty Ltd'],
        ['ABN', '55 643 227 061'],
        ['NDIS Registration No.', '405 012 0437'],
        ['Address', '40 1-15 Fontenoy Road, Macquarie Park NSW 2113'],
        ['Phone', '(04) 5222 7799'],
        ['Email', 'support@olfndisservices.com.au'],
        ['Website', 'www.olfndisservices.com.au'],
      ]),

      subHeading('Participant'),
      infoTable([
        ['Full Name', '[Participant Full Name]', true],
        ['Date of Birth', '[DD/MM/YYYY]', true],
        ['NDIS Number', '[Insert NDIS Number]', true],
        ['Phone', '[Insert Phone Number]', true],
        ['Email', '[Insert Email Address]', true],
        ['Preferred Language', '[English / Other — specify]', true],
        ['Communication Needs', '[e.g. Easy Read, interpreter, Auslan, none]', true],
        ['Emergency Contact', '[Name, Relationship, Phone Number]', true],
      ]),

      subHeading('Authorised Representative / Nominee (if applicable)'),
      infoTable([
        ['Full Name', '[Representative Full Name]', true],
        ['Relationship to Participant', '[e.g. Guardian, Plan Nominee, Child Representative]', true],
        ['Phone', '[Insert Phone Number]', true],
        ['Email', '[Insert Email Address]', true],
        ['Authority Type', '[e.g. NDIS Plan Nominee, Legal Guardian, Authorised Representative]', true],
      ]),

      subHeading('Plan Management'),
      infoTable([
        ['Plan Management Type', '[NDIA-Managed / Plan-Managed / Self-Managed]', true],
        ['Plan Manager (if applicable)', '[Plan Manager Name and Contact Details]', true],
        ['Support Coordinator (if applicable)', '[Name, Organisation, Phone, Email]', true],
      ]),

      // ═══════════════════════════════════════════
      // SECTION 2 — ACCOMMODATION DETAILS
      // ═══════════════════════════════════════════
      sectionHeading('2', 'Accommodation Details'),
      infoTable([
        ['Property Address', '[Full Property Address]', true],
        ['Room / Unit', '[e.g. Room 2, Unit A]', true],
        ['Property Type', '[e.g. House, Unit, Villa — shared or sole occupancy]', true],
        ['Accessibility Features', '[e.g. Wheelchair accessible, modified bathroom, ground floor]', true],
        ['Agreement Start Date', '[DD/MM/YYYY]', true],
        ['Agreement End Date', '[DD/MM/YYYY] (maximum 90 days)', true],
        ['Total Duration', '[Number] days', true],
        ['Move-In Time', '[e.g. 10:00 AM]', true],
        ['Planned Move-Out Date', '[DD/MM/YYYY]', true],
      ]),

      bodyTextMulti([
        { text: 'A ', bold: false },
        { text: 'Property Condition Report', bold: true },
        { text: ' will be completed at move-in and move-out. Both parties will sign the condition report, and the participant will receive a copy. Any pre-existing damage will be noted on the condition report before the participant takes occupancy.', bold: false },
      ]),

      // ═══════════════════════════════════════════
      // SECTION 3 — PURPOSE
      // ═══════════════════════════════════════════
      sectionHeading('3', 'Purpose of This Agreement'),
      bodyText('This Service Agreement sets out the terms and conditions under which One Life Foundation will provide Medium Term Accommodation (MTA) to the participant, funded under the participant\'s NDIS plan.'),
      bodyText('MTA is transitional accommodation (up to 90 days) intended to bridge the gap between current living arrangements and a longer-term housing solution. It is funded under the participant\'s Core Supports budget — Assistance with Daily Living.'),
      bodyText('This agreement is not a standard residential tenancy agreement under the Residential Tenancies Act 2010 (NSW). However, One Life Foundation will ensure the accommodation meets all required safety, accessibility, and habitability standards.'),

      subHeading('Participant\'s Goals'),
      bodyText('The MTA arrangement will support the participant to work towards the following goals as identified in their NDIS plan:'),
      infoTable([
        ['Goal 1', '[Insert NDIS plan goal relevant to housing/accommodation]', true],
        ['Goal 2', '[Insert NDIS plan goal relevant to independence/community]', true],
        ['Goal 3', '[Insert additional goal if applicable]', true],
      ]),

      // ═══════════════════════════════════════════
      // SECTION 4 — SCHEDULE OF SUPPORTS
      // ═══════════════════════════════════════════
      sectionHeading('4', 'Schedule of Supports'),

      subHeading('What Is Included in This MTA Arrangement'),
      bulletItem('Furnished private room with access to shared common areas'),
      bulletItem('Electricity, water, and internet (unless otherwise stated)'),
      bulletItem('Basic household items including linen, towels, and kitchen essentials'),
      bulletItem('Regular property maintenance and cleaning of shared areas'),
      bulletItem('24/7 emergency contact support'),
      bulletItem('Assistance with transition planning to longer-term accommodation'),
      bulletItem('Safe, secure, and habitable accommodation maintained to required standards'),

      subHeading('What Is Not Included'),
      bulletItem('Personal support workers or daily living assistance (funded separately through your NDIS plan)'),
      bulletItem('Personal food and groceries'),
      bulletItem('Personal hygiene and care items'),
      bulletItem('Transport or travel costs'),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: '[Any other exclusions relevant to the property]', size: 22, color: '999999', italics: true, font: 'Inter' })],
      }),

      bodyText('Any additional services or supports not listed above will require a separate agreement and written consent from the participant.'),

      // ═══════════════════════════════════════════
      // SECTION 5 — FEES AND FUNDING
      // ═══════════════════════════════════════════
      sectionHeading('5', 'Fees and Funding'),
      infoTable([
        ['NDIS Support Item Number', '[e.g. 01_057_0115_1_1]', true],
        ['Support Category', 'Core Supports — Assistance with Daily Living'],
        ['Daily Rate', '$[Amount] per day (excl. GST)', true],
        ['Total Estimated Cost', '$[Amount] for [X] days', true],
        ['Funding Source', 'NDIS Core Supports Budget'],
        ['Billing Frequency', '[Weekly / Fortnightly / Monthly]', true],
        ['Plan Management Type', '[NDIA-Managed / Plan-Managed / Self-Managed]', true],
      ]),

      subHeading('Pricing Commitments'),
      bulletItem('All fees are in accordance with the current NDIS Pricing Arrangements and Price Limits.'),
      bulletItem('One Life Foundation will not charge above the NDIS Price Limit for any support item.'),
      bulletItem('There are no gap fees, hidden charges, credit card surcharges, or administration fees beyond the agreed NDIS-funded rate.'),
      bulletItem('If the NDIS Price Guide is updated, One Life Foundation will provide at least 14 days written notice before any rate change takes effect.'),
      bulletItem('One Life Foundation will not charge for supports not delivered.'),

      subHeading('GST'),
      bodyText('NDIS supports provided under this agreement are GST-free in accordance with the A New Tax System (Goods and Services Tax) Act 1999. One Life Foundation\'s ABN is displayed on this agreement and all invoices.'),

      subHeading('Invoicing'),
      bodyText('All charges will be claimed directly from the participant\'s NDIS plan where applicable. For plan-managed participants, invoices will be sent to the nominated plan manager. For self-managed participants, invoices will be provided directly to the participant. One Life Foundation will not charge amounts beyond what is funded in the participant\'s current NDIS plan without prior written agreement.'),

      // ═══════════════════════════════════════════
      // SECTION 6 — PROVIDER OBLIGATIONS
      // ═══════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading('6', 'Provider Obligations'),
      bodyText('One Life Foundation agrees to the following obligations under this agreement:'),

      subHeading('Service Delivery'),
      bulletItem('Deliver supports as described in this agreement and in line with the participant\'s NDIS plan.'),
      bulletItem('Provide supports in a safe, competent manner with care and skill.'),
      bulletItem('Act with integrity, honesty, and transparency in all dealings with the participant.'),
      bulletItem('Maintain the accommodation property to a safe, habitable, and accessible standard.'),
      bulletItem('Respond to maintenance requests within a reasonable timeframe.'),

      subHeading('Regulatory Compliance'),
      bulletItem('Comply with the National Disability Insurance Scheme Act 2013 (Cth) and all associated Rules and Regulations.'),
      bulletItem('Comply with the NDIS Practice Standards and Quality Indicators.'),
      bulletItem('Comply with the NDIS Code of Conduct (see Section 7).'),
      bulletItem('Maintain current NDIS registration for the duration of this agreement.'),
      bulletItem('Comply with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).'),
      bulletItem('Comply with all applicable state and territory legislation, including workplace health and safety laws.'),

      subHeading('Workforce'),
      bulletItem('Ensure all workers delivering supports hold a current NDIS Worker Screening Check clearance.'),
      bulletItem('Ensure all workers have completed required training including disability awareness, manual handling, and first aid (where applicable).'),
      bulletItem('Ensure workers are supervised and supported to deliver high-quality services.'),

      subHeading('Insurance'),
      bulletItem('Maintain current Public Liability Insurance (minimum $10 million).'),
      bulletItem('Maintain current Professional Indemnity Insurance.'),
      bulletItem('Maintain current Workers Compensation Insurance for all employees.'),
      bodyText('Copies of insurance certificates are available upon request.'),

      // ═══════════════════════════════════════════
      // SECTION 7 — NDIS CODE OF CONDUCT
      // ═══════════════════════════════════════════
      sectionHeading('7', 'NDIS Code of Conduct'),
      bodyText('One Life Foundation and all its workers are bound by the NDIS Code of Conduct as set out in the National Disability Insurance Scheme (Code of Conduct) Rules 2018. This means we will:'),

      bulletItemBold('1. ', 'Act with respect for individual rights to freedom of expression, self-determination, and decision-making in accordance with applicable laws and conventions.'),
      bulletItemBold('2. ', 'Respect the privacy of people with disability.'),
      bulletItemBold('3. ', 'Provide supports and services in a safe and competent manner, with care and skill.'),
      bulletItemBold('4. ', 'Act with integrity, honesty, and transparency.'),
      bulletItemBold('5. ', 'Promptly take steps to raise and act on concerns about matters that may impact the quality and safety of supports and services provided to people with disability.'),
      bulletItemBold('6. ', 'Take all reasonable steps to prevent and respond to all forms of violence against, and exploitation, neglect, and abuse of, people with disability.'),
      bulletItemBold('7. ', 'Take all reasonable steps to prevent and respond to sexual misconduct.'),

      bodyText('If the participant believes a breach of the Code of Conduct has occurred, they may raise the matter with One Life Foundation directly, or contact the NDIS Quality and Safeguards Commission on 1800 035 544 or at www.ndiscommission.gov.au.'),

      // ═══════════════════════════════════════════
      // SECTION 8 — PARTICIPANT RIGHTS
      // ═══════════════════════════════════════════
      sectionHeading('8', 'Participant Rights'),
      bodyText('One Life Foundation is committed to upholding the NDIS Practice Standards and the rights of all participants as set out in the NDIS Act 2013, the United Nations Convention on the Rights of Persons with Disabilities (UNCRPD), and the Australian Human Rights Commission Act 1986. You have the right to:'),

      bulletItem('Be treated with dignity, respect, and fairness at all times.'),
      bulletItem('Exercise informed choice and control over your supports and how they are delivered.'),
      bulletItem('Make decisions about your own life, including the dignity of risk — the right to make your own choices even when others may disagree.'),
      bulletItem('Privacy and confidentiality of your personal information.'),
      bulletItem('Receive services free from violence, abuse, neglect, exploitation, and discrimination.'),
      bulletItem('Access an advocate or support person of your choice at any time, including during complaints or reviews.'),
      bulletItem('Choose and change your service provider at any time without penalty.'),
      bulletItem('A safe, accessible, and well-maintained living environment.'),
      bulletItem('Be supported to understand this agreement in your preferred language or communication format.'),
      bulletItem('Provide feedback or make a complaint without fear of reprisal or impact on your services.'),
      bulletItem('Access your personal information held by One Life Foundation and request corrections.'),
      bulletItem('Participate in decisions about your transition and exit planning.'),

      // ═══════════════════════════════════════════
      // SECTION 9 — PARTICIPANT RESPONSIBILITIES
      // ═══════════════════════════════════════════
      sectionHeading('9', 'Participant Responsibilities'),
      bodyText('To ensure a safe and respectful environment for all, participants agree to:'),

      bulletItem('Treat staff, other residents, visitors, and property with respect.'),
      bulletItem('Follow the house rules provided at the time of move-in (see Attachment A).'),
      bulletItem('Not engage in any illegal activity on or around the property.'),
      bulletItem('Report any damage, maintenance issues, or safety concerns to One Life Foundation promptly.'),
      bulletItem('Give reasonable notice if planning to vacate early (minimum 7 days where possible).'),
      bulletItem('Keep personal areas clean and tidy.'),
      bulletItem('Not sublet, transfer, or allow unauthorised persons to stay at the property.'),
      bulletItem('Provide accurate and up-to-date information relevant to the delivery of supports.'),
      bulletItem('Notify One Life Foundation of any changes to your NDIS plan, funding, or personal circumstances that may affect this agreement.'),
      bulletItem('Pay any agreed costs that are the participant\'s responsibility (e.g. personal groceries, personal items).'),

      // ═══════════════════════════════════════════
      // SECTION 10 — PROPERTY AND HOUSE RULES
      // ═══════════════════════════════════════════
      sectionHeading('10', 'Property, House Rules, and Damage'),

      subHeading('Property Condition Report'),
      bodyText('A property condition report will be completed jointly by One Life Foundation and the participant (or their representative) at move-in and move-out. Both parties will receive a signed copy. Any pre-existing damage or issues will be documented before the participant takes occupancy.'),

      subHeading('House Rules'),
      bodyText('The participant will be provided with a copy of the property\'s house rules at move-in (Attachment A). House rules may include but are not limited to:'),
      bulletItem('Quiet hours and noise expectations'),
      bulletItem('Visitor policies and overnight guest rules'),
      bulletItem('Shared space usage and cleaning expectations'),
      bulletItem('Smoking, alcohol, and prohibited substance policies'),
      bulletItem('Pet policies'),
      bulletItem('Parking arrangements'),
      bulletItem('Waste disposal and recycling'),

      subHeading('Property Damage'),
      bodyText('The participant is responsible for any intentional damage to the property or its contents beyond reasonable wear and tear. One Life Foundation will:'),
      bulletItem('Document any damage with photographs and a written report.'),
      bulletItem('Discuss the damage with the participant before taking further action.'),
      bulletItem('Provide a reasonable opportunity for the participant to respond.'),
      bulletItem('Not deduct damage costs from NDIS funding without proper process and participant agreement.'),

      subHeading('Access and Inspections'),
      bodyText('One Life Foundation may access the property for maintenance, safety inspections, or emergency purposes. Except in an emergency, One Life Foundation will provide at least 48 hours written notice before any inspection or access.'),

      // ═══════════════════════════════════════════
      // SECTION 11 — CANCELLATION AND SHORT NOTICE
      // ═══════════════════════════════════════════
      sectionHeading('11', 'Cancellation and Short Notice Policy'),
      bodyText('This section outlines the cancellation terms in accordance with the NDIS Pricing Arrangements and Price Limits.'),

      subHeading('Cancellation by Participant'),
      bulletItem('The participant may cancel or end this agreement at any time with no more than 14 days\' notice.'),
      bulletItem('Where possible, 7 days\' notice is appreciated to allow for transition planning.'),
      bulletItem('No exit fees or penalties will apply beyond charges for services already delivered up to the date of departure.'),

      subHeading('Short Notice Cancellations (for scheduled supports)'),
      bodyText('If the participant cancels a scheduled support with less than the required notice period under the NDIS Pricing Arrangements:'),
      bulletItem('Short notice is defined as less than 2 clear business days for the relevant support type.'),
      bulletItem('One Life Foundation may charge up to 100% of the agreed fee for the cancelled activity, in accordance with the NDIS Pricing Arrangements.'),
      bulletItem('One Life Foundation will make reasonable efforts to find alternative work for the worker during the cancelled period before charging a cancellation fee.'),
      bulletItem('Cancellations will be recorded with the date, time, reason, and method of notification.'),

      bodyText('The participant confirms that the cancellation terms above were explained before this agreement was signed.'),

      // ═══════════════════════════════════════════
      // SECTION 12 — TRANSITION AND EXIT PLANNING
      // ═══════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading('12', 'Transition and Exit Planning'),
      bodyText('MTA is a short-term transitional support. One Life Foundation will work collaboratively with the participant, their support coordinator, and other relevant parties to plan the transition to longer-term housing. This includes:'),

      bulletItem('Identifying long-term housing options within the first two weeks of the agreement.'),
      bulletItem('Connecting with relevant housing services, SDA providers, community housing organisations, or private rental assistance.'),
      bulletItem('Regular check-ins on transition progress (at minimum fortnightly).'),
      bulletItem('A formal transition review at least 14 days before the agreement end date.'),
      bulletItem('Supporting the participant to access a new provider if they choose to change providers during the MTA period.'),

      infoTable([
        ['Planned Next Accommodation', '[Known destination or \'To be confirmed\']', true],
        ['Support Coordinator', '[Name, Organisation, Phone, Email]', true],
        ['Local Area Coordinator (LAC)', '[Name and contact, or \'N/A\']', true],
      ]),

      subHeading('Continuity of Supports'),
      bodyText('One Life Foundation will ensure continuity of supports during any transition period. If the agreement ends and the participant has not yet secured longer-term accommodation, One Life Foundation will:'),
      bulletItem('Make reasonable efforts to support the participant in finding alternative accommodation.'),
      bulletItem('With the participant\'s written consent, provide a handover of relevant information to the new provider.'),
      bulletItem('Not cease supports abruptly without ensuring the participant\'s safety and wellbeing.'),

      subHeading('Extension Beyond 90 Days'),
      bodyText('MTA is funded for a maximum of 90 days. If an extension is required, this must be approved by the NDIA through a plan review or reassessment. One Life Foundation will support the participant to request an extension if needed, but cannot guarantee approval.'),

      // ═══════════════════════════════════════════
      // SECTION 13 — TERMINATION
      // ═══════════════════════════════════════════
      sectionHeading('13', 'Agreement Termination'),

      subHeading('Participant-Initiated Termination'),
      bulletItem('The participant may end this agreement at any time by providing written or verbal notice.'),
      bulletItem('No more than 14 days\' notice is required from the participant.'),
      bulletItem('No exit fees or penalties will apply.'),
      bulletItem('Charges apply up to and including the date of departure only.'),

      subHeading('Provider-Initiated Termination'),
      bodyText('One Life Foundation may end this agreement with reasonable notice (minimum 14 days where practicable) if:'),
      bulletItem('There is a serious or repeated breach of house rules or participant responsibilities.'),
      bulletItem('The safety of staff, other residents, or the participant is at immediate risk.'),
      bulletItem('NDIS funding for MTA is exhausted, withdrawn, or not renewed.'),
      bulletItem('The property becomes unavailable due to circumstances beyond One Life Foundation\'s control (e.g. natural disaster, building safety issue).'),

      subHeading('Immediate Termination'),
      bodyText('In circumstances of immediate risk to safety, One Life Foundation may take immediate action to protect all parties. Even in urgent situations, One Life Foundation will:'),
      bulletItem('Make all reasonable efforts to ensure the participant\'s safety and wellbeing.'),
      bulletItem('Assist the participant to access emergency accommodation or alternative services.'),
      bulletItem('Notify the participant\'s support coordinator, nominee, or emergency contact.'),
      bulletItem('Document the circumstances and rationale for immediate termination.'),

      bodyText('In all cases, One Life Foundation will not terminate services without ensuring continuity of support for the participant to the greatest extent possible.'),

      // ═══════════════════════════════════════════
      // SECTION 14 — INCIDENT MANAGEMENT
      // ═══════════════════════════════════════════
      sectionHeading('14', 'Incident Management'),
      bodyText('One Life Foundation has an Incident Management System in accordance with the NDIS (Incident Management and Reportable Incidents) Rules 2018.'),

      subHeading('How Incidents Are Managed'),
      bulletItem('All incidents will be reported, recorded, and investigated in accordance with One Life Foundation\'s Incident Management Policy.'),
      bulletItem('The participant (or their representative) will be notified of any incident that affects them as soon as practicable.'),
      bulletItem('Incidents will be reviewed and learnings applied to prevent recurrence.'),

      subHeading('Reportable Incidents'),
      bodyText('One Life Foundation is required to report the following incidents to the NDIS Quality and Safeguards Commission within 24 hours:'),
      bulletItem('The death of a participant.'),
      bulletItem('Serious injury of a participant.'),
      bulletItem('Abuse or neglect of a participant.'),
      bulletItem('Sexual misconduct committed against, or in the presence of, a participant.'),
      bulletItem('The unauthorised use of a restrictive practice in relation to a participant.'),

      bodyText('One Life Foundation does not use restrictive practices. If the participant requires supports involving restrictive practices, these must be authorised through the appropriate state/territory process and documented in a Behaviour Support Plan.'),

      // ═══════════════════════════════════════════
      // SECTION 15 — COMPLAINTS AND FEEDBACK
      // ═══════════════════════════════════════════
      sectionHeading('15', 'Complaints, Feedback, and Dispute Resolution'),

      subHeading('Making a Complaint or Providing Feedback'),
      bodyText('One Life Foundation welcomes all feedback and takes every complaint seriously. Making a complaint will not affect the participant\'s supports or this agreement in any way. To raise a concern:'),

      bulletItemBold('Step 1: ', 'Raise the matter directly with your support worker or One Life Foundation staff.'),
      bulletItemBold('Step 2: ', 'If unresolved, submit a formal complaint by phone on (04) 5222 7799 or email to support@olfndisservices.com.au.'),
      bulletItemBold('Step 3: ', 'One Life Foundation will acknowledge the complaint within 2 business days and aim to resolve it within 14 business days.'),
      bulletItemBold('Step 4: ', 'If the participant is not satisfied with the outcome, they may escalate to the NDIS Quality and Safeguards Commission.'),

      subHeading('External Complaints'),
      bulletItemBold('NDIS Quality and Safeguards Commission: ', '1800 035 544 or www.ndiscommission.gov.au'),
      bulletItemBold('NDIS: ', '1800 800 110'),
      bulletItemBold('NSW Ombudsman: ', '1800 451 524'),

      subHeading('Advocacy'),
      bodyText('The participant has the right to involve an independent advocate at any time, including during the complaints process. Contact the National Disability Advocacy Program at disabilityadvocacyfinder.dss.gov.au or call 1800 800 110.'),

      subHeading('Dispute Resolution'),
      bodyText('If a dispute arises under this agreement, the parties agree to the following process:'),
      bulletItemBold('1. ', 'Direct negotiation between the participant and One Life Foundation within 7 business days.'),
      bulletItemBold('2. ', 'If unresolved, either party may request mediation through an independent mediator agreed to by both parties.'),
      bulletItemBold('3. ', 'If still unresolved, the matter may be referred to the NDIS Quality and Safeguards Commission or other relevant authority.'),
      bodyText('Supports will continue to be provided during any dispute resolution process, unless there is an immediate risk to safety.'),

      // ═══════════════════════════════════════════
      // SECTION 16 — PRIVACY AND CONFIDENTIALITY
      // ═══════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading('16', 'Privacy and Confidentiality'),
      bodyText('One Life Foundation collects, uses, stores, and discloses personal information in accordance with the Privacy Act 1988 (Cth), the Australian Privacy Principles (APPs), and the NDIS Practice Standards.'),

      subHeading('Collection and Use'),
      bulletItem('Personal information is collected only as necessary to deliver the agreed supports under this agreement.'),
      bulletItem('Information will be stored securely and accessed only by authorised staff on a need-to-know basis.'),

      subHeading('Disclosure'),
      bodyText('Your personal information will not be shared with third parties without your written consent, except:'),
      bulletItem('Where required by law (e.g. mandatory reporting, court orders).'),
      bulletItem('Where necessary to prevent a serious threat to life, health, or safety.'),
      bulletItem('To the NDIS Quality and Safeguards Commission for reportable incidents.'),
      bulletItem('To the NDIA for claims processing (where NDIA-managed).'),

      subHeading('Consent to Share Information'),
      bodyText('By signing this agreement, the participant consents to One Life Foundation sharing relevant information with the following parties for the purpose of delivering supports:'),
      infoTable([
        ['NDIA / Plan Manager', '[Yes / No]', true],
        ['Support Coordinator', '[Yes / No]', true],
        ['Other Service Providers', '[Yes / No — specify providers if Yes]', true],
        ['Emergency Services', 'Yes (where required for safety)'],
        ['Medical Practitioners', '[Yes / No]', true],
      ]),

      bodyText('The participant may withdraw or modify consent at any time by notifying One Life Foundation in writing.'),

      subHeading('Your Rights'),
      bulletItem('You have the right to access your personal information held by One Life Foundation at any time.'),
      bulletItem('You have the right to request corrections to your personal information.'),
      bulletItem('Contact support@olfndisservices.com.au to make a privacy-related request.'),

      subHeading('Data Breach'),
      bodyText('In the event of a data breach that is likely to result in serious harm, One Life Foundation will notify affected individuals and the Office of the Australian Information Commissioner (OAIC) as required under the Notifiable Data Breaches scheme.'),

      bodyText('Confidentiality obligations under this agreement survive the termination of the agreement.'),

      // ═══════════════════════════════════════════
      // SECTION 17 — REVIEW AND VARIATION
      // ═══════════════════════════════════════════
      sectionHeading('17', 'Review and Variation of This Agreement'),

      subHeading('Agreement Review'),
      bodyText('This agreement will be reviewed:'),
      bulletItem('At a minimum of every 90 days or at the end of the MTA period (whichever is earlier).'),
      bulletItem('When the participant\'s NDIS plan is reviewed, reassessed, or renewed.'),
      bulletItem('When there is a significant change in the participant\'s circumstances, needs, or goals.'),
      bulletItem('When the NDIS Pricing Arrangements and Price Limits are updated.'),
      bulletItem('At the request of either party at any time.'),

      subHeading('Variation'),
      bodyText('Any changes to this agreement must be agreed in writing by both parties. One Life Foundation will provide at least 14 days written notice of any proposed changes to fees, supports, or terms. A written addendum or updated agreement will be signed by both parties.'),

      // ═══════════════════════════════════════════
      // SECTION 18 — INFORMED CONSENT
      // ═══════════════════════════════════════════
      sectionHeading('18', 'Informed Consent'),
      bodyText('By signing this agreement, the participant (or their authorised representative) confirms that:'),

      bulletItem('This agreement has been explained in a way they understand, in their preferred language or communication format.'),
      bulletItem('They have had the opportunity to ask questions and seek independent advice before signing.'),
      bulletItem('They understand the supports, costs, conditions, and their rights and responsibilities under this agreement.'),
      bulletItem('They have been offered an easy-read version of this agreement (available upon request).'),
      bulletItem('They consent to the supports described in this agreement being delivered by One Life Foundation.'),
      bulletItem('They understand they may withdraw consent and end this agreement at any time.'),

      subHeading('Cooling-Off Period'),
      bodyText('The participant has a 7-day cooling-off period from the date of signing this agreement. During this period, the participant may cancel the agreement without penalty or cost. After the cooling-off period, the standard termination provisions in Section 13 apply.'),

      subHeading('How Consent Was Obtained'),
      infoTable([
        ['Consent Method', '[Written / Verbal (witnessed) / Through nominee or guardian]', true],
        ['Easy-Read Version Offered', '[Yes / No]', true],
        ['Interpreter Required', '[Yes / No — language if Yes]', true],
        ['Advocate Present', '[Yes / No — name if Yes]', true],
      ]),

      // ═══════════════════════════════════════════
      // SECTION 19 — GOVERNING LAW
      // ═══════════════════════════════════════════
      sectionHeading('19', 'Governing Law'),
      bodyText('This agreement is governed by and construed in accordance with:'),

      bulletItemBold('', 'National Disability Insurance Scheme Act 2013 (Cth)'),
      bulletItemBold('', 'NDIS (Provider Registration and Practice Standards) Rules 2018'),
      bulletItemBold('', 'NDIS (Code of Conduct) Rules 2018'),
      bulletItemBold('', 'NDIS (Incident Management and Reportable Incidents) Rules 2018'),
      bulletItemBold('', 'NDIS Pricing Arrangements and Price Limits (current edition)'),
      bulletItemBold('', 'Privacy Act 1988 (Cth) and Australian Privacy Principles'),
      bulletItemBold('', 'Australian Consumer Law (Competition and Consumer Act 2010)'),
      bulletItemBold('', 'Applicable New South Wales legislation'),

      bodyText('To the extent of any inconsistency between this agreement and the NDIS Act or Rules, the NDIS Act and Rules prevail.'),

      // ═══════════════════════════════════════════
      // SECTION 20 — SIGNATURES
      // ═══════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading('20', 'Agreement and Signatures'),
      bodyText('By signing below, both parties confirm they have read, understood, and agree to the terms and conditions of this Service Agreement. The participant confirms they have received a copy of this agreement.'),

      ...signatureBlock('Participant / Authorised Representative'),
      ...signatureBlock('One Life Foundation Representative'),
      ...signatureBlock('Witness (if required)'),

      // Acknowledgment of receipt
      subHeading('Acknowledgment of Receipt'),
      bodyText('I confirm that I have received a signed copy of this Service Agreement, including all attachments.'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ['Participant Name', 'Signature', 'Date'].map(label =>
              new TableCell({
                borders: noBorders,
                width: { size: 33, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    spacing: { after: 40 },
                    children: [new TextRun({ text: label, bold: true, size: 16, color: TEXT_SECONDARY, font: 'Inter', allCaps: true })],
                  }),
                  new Paragraph({
                    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEXT_PRIMARY } },
                    spacing: { after: 200 },
                    children: [new TextRun({ text: ' ', size: 22 })],
                  }),
                ],
              })
            ),
          }),
        ],
      }),

      spacer(300),
      new Paragraph({
        spacing: { before: 100 },
        children: [
          new TextRun({ text: 'This agreement is governed by applicable Australian laws and NDIS regulations.', italics: true, size: 20, color: TEXT_SECONDARY, font: 'Inter' }),
        ],
      }),

      // ═══════════════════════════════════════════
      // ATTACHMENTS LIST
      // ═══════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading('', 'Attachments and Schedules'),
      bodyText('The following documents form part of this Service Agreement:'),

      bulletItemBold('Attachment A: ', 'House Rules'),
      bulletItemBold('Attachment B: ', 'Property Condition Report (Move-In)'),
      bulletItemBold('Attachment C: ', 'NDIS Plan Goals Summary (relevant excerpts)'),
      bulletItemBold('Attachment D: ', 'Consent to Share Information Form'),
      bulletItemBold('Attachment E: ', 'One Life Foundation Complaints and Feedback Policy'),
      bulletItemBold('Attachment F: ', 'One Life Foundation Privacy Policy'),
      bulletItemBold('Attachment G: ', 'NDIS Code of Conduct Summary'),
      bulletItemBold('Attachment H: ', 'Emergency Contacts and Procedures'),
      bulletItemBold('Attachment I: ', 'Easy-Read Version of Service Agreement (if applicable)'),

      spacer(200),
      bodyText('If any attachment is not provided at the time of signing, One Life Foundation will provide it within 7 business days of the agreement commencement date.'),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buffer);
fs.copyFileSync(outputPath, downloadsPath);
console.log('DOCX created:', outputPath);
console.log('Copied to Downloads:', downloadsPath);
