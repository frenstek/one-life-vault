import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun,
  PageBreak, ShadingType, Header, Footer
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, 'SIL_Service_Agreement_Antonino_Fiorito.docx');
const downloadsPath = path.join('C:', 'Users', 'kevin', 'Downloads', 'SIL_Service_Agreement_Antonino_Fiorito.docx');
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

const pm = (runs) => new Paragraph({ spacing: { after: 150 }, children: runs.map(r => new TextRun({ size: 22, color: TEXT_PRIMARY, font: 'Inter', ...r })) });

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
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: '6-Week Trial Period', bold: true, size: 28, color: 'CC0000', font: 'Inter' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'NDIS Funded  |  Core Supports \u2014 Assistance with Daily Living', size: 22, color: TEXT_SECONDARY, font: 'Inter' })] }),

      tbl([
        ['Document Version', '1.0'],
        ['Date of Issue', '10/08/2026'],
        ['Agreement Reference', 'OLF-SIL-003'],
        ['Participant', 'Antonino Fiorito (Nino)'],
        ['Agreement Type', '6-Week Trial \u2014 11/08/2026 to 22/09/2026'],
        ['NDIS Plan Period', '29/05/2026 to 28/05/2027'],
      ]),

      // \u2500\u2500 1. PARTIES \u2500\u2500
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
        ['Full Name', 'Antonino Fiorito'],
        ['Preferred Name', 'Nino'],
        ['Date of Birth', '04/03/2005'],
        ['NDIS Number', '430 200 387'],
        ['Phone', '0409 338 853'],
        ['Address', '37 Bray Street, Reservoir VIC 3073'],
        ['Preferred Language', 'English'],
        ['Communication Needs', 'Limited verbal communication \u2014 uses single words, needs encouragement for full sentences. Requires simple, calm verbal requests. Transitioning to new communication device (speech pathology ongoing).'],
        ['Emergency Contact', 'Anastasia (Stacey) Fiorito \u2014 Mother \u2014 0409 338 853'],
      ]),

      sub('Authorised Representative / Nominee'),
      tbl([
        ['Full Name', 'Anastasia (Stacey) Fiorito'],
        ['Relationship', 'Mother / Authorised Decision Maker'],
        ['Authority Type', 'Authorised Representative'],
        ['Phone', '0409 338 853'],
        ['Email', 'john_stacey@bigpond.com'],
      ]),

      sub('Additional Emergency Contact'),
      tbl([
        ['Full Name', 'John Fiorito'],
        ['Relationship', 'Father'],
        ['Phone', '0409 338 852'],
        ['Address', '37 Bray Street, Reservoir VIC 3073'],
      ]),

      sub('Plan Management & Coordination'),
      tbl([
        ['Plan Management Type', '[To be confirmed]', true],
        ['Plan Manager', '[To be confirmed]', true],
        ['Support Coordinator', 'Sonia Muraca \u2014 Fundamentals'],
        ['Senior Support Coordinator', 'Obeida Abou-Eid \u2014 Team Leader/Senior NDIS Support Coordinator \u2014 0452 527 923'],
      ]),

      sub('Key Support Team'),
      tbl([
        ['GP', 'Dr Thanh-Thuan Nguyen \u2014 Alphington Medical Centre, 29-31 Station St, Fairfield VIC 3078 \u2014 03 9485 5100'],
        ['Prescribing GP', 'Dr Ahmed Memon \u2014 530-538 High St, Preston VIC 3072 \u2014 03 9092 2222'],
        ['Specialist', 'Dr Christos Symeonides (Paediatrician) \u2014 (03) 9383 7733'],
        ['Pharmacy', 'Night Owl Pharmacy \u2014 743a Gilbert Rd, Reservoir VIC 3073 \u2014 03 9478 4722'],
        ['Behaviour Support Practitioner', 'Avan Gupta (Proficient) \u2014 Bespoke Behaviour Pty Ltd \u2014 Supervisor: Natalie Salmond (Advanced)'],
        ['Previous BSP Practitioner', 'Raika Testai \u2014 Bespoke Behaviour Pty Ltd \u2014 0478 061 595'],
        ['Occupational Therapist', 'Ivy Trinh \u2014 Four Point Therapy \u2014 0451 077 789'],
        ['Speech Pathologist', 'Angela De Leon \u2014 PACE Health Management'],
        ['Previous Service Provider', 'Aruma \u2014 Service Lead: Diana Huxley \u2014 0438 841 726'],
      ]),

      // \u2500\u2500 2. PURPOSE & GOALS \u2500\u2500
      h('2', 'Purpose and Goals'),
      p('This is a 6-week trial Service Agreement under which One Life Foundation will deliver Supported Independent Living (SIL) supports to Antonino (Nino) Fiorito from 11 August 2026 to 22 September 2026. The trial period will allow both parties to assess the suitability of the arrangement before entering into a longer-term agreement.'),
      p('Nino is transitioning from Aruma disability services to One Life Foundation. He has Autism (primary), ADHD, and Intellectual Disability, with a secondary health condition of Idiopathic Generalised Epilepsy requiring emergency medication management. He has been approved for SDA (Improved Liveability) and SIL funding ($220,301.48/year) under his current NDIS plan.'),
      p('During the trial, One Life Foundation will deliver SIL supports and work with Nino, his family, and his support team to ensure a smooth and successful transition. At the conclusion of the 6-week trial, this agreement will be reviewed and, if both parties agree, replaced with a full-term Service Agreement.'),

      sub('Participant\'s NDIS Plan Goals (Plan: 29/05/2026 \u2013 28/05/2027)'),
      tbl([
        ['Goal 1', 'Emotional Regulation \u2014 Manage emotions by receiving adequate and routine supports throughout the week, to avoid hurting those he interacts with'],
        ['Goal 2', 'Increase Independence \u2014 Continue developing skills with daily activities to create positive routines and increase independence'],
        ['Goal 3', 'Communication \u2014 Continue building capacity to communicate needs to ensure he can be understood'],
        ['Goal 4', 'Transition to Independent Living \u2014 Experience time away from the family home and transition to suitable housing'],
        ['Goal 5', 'Community Participation \u2014 Increase participation in community activities independently of family, with the same social opportunities as peers'],
        ['Goal 6', 'Supported Employment \u2014 Continue working in supported employment to contribute to society, acquire new skills, and work towards financial independence'],
        ['Goal 7', 'Health and Sensory Regulation \u2014 Have opportunities to be more active to meet sensory needs and maintain health'],
      ]),

      // \u2500\u2500 3. AGREEMENT PERIOD \u2500\u2500
      h('3', 'Agreement Period'),
      tbl([
        ['Start Date', '11/08/2026 (Tuesday)'],
        ['End Date', '22/09/2026 (Tuesday)'],
        ['Total Duration', '6 weeks (trial period)'],
        ['NDIS Plan Period', '29/05/2026 to 28/05/2027'],
        ['Review Date', '22/09/2026 \u2014 end of trial review'],
      ]),
      p('This is a 6-week trial agreement. At the conclusion of the trial period on 22 September 2026, One Life Foundation and the participant (or their representative) will meet to review the arrangement. If both parties are satisfied, a full-term Service Agreement will be entered into. Either party may terminate this agreement during the trial period with 7 days\' written notice.'),
      p('During the trial, Nino will continue returning home to his family on Sunday evenings. This arrangement will remain unchanged unless otherwise agreed.'),

      // \u2500\u2500 4. PARTICIPANT PROFILE \u2500\u2500
      h('4', 'Participant Profile'),
      sub('Disabilities and Health'),
      tbl([
        ['Primary Disability', 'Autism Spectrum Disorder (ASD)'],
        ['Secondary Disabilities', 'ADHD, Intellectual Disability'],
        ['Key Health Condition', 'Idiopathic Generalised Epilepsy'],
        ['Weight', '100 kg'],
        ['Medicare Number', '3306 70906 8/4'],
        ['Pension Number', '307031909K (valid to 31/03/2027)'],
        ['Private Health', 'Medibank Private \u2014 257385667K'],
      ]),

      sub('Health Alerts'),
      pm([
        { text: 'EPILEPSY: ', bold: true, color: 'CC0000' },
        { text: 'Nino has Idiopathic Generalised Epilepsy. Emergency medication Midazolam 10mg must be administered BUCCAL (inner cheek) if a tonic-clonic seizure continues longer than 5 minutes. Call 000 immediately. Seizure types: (1) Generalised Tonic-Clonic \u2014 full body convulsion, 2-5 minutes, occurred 4 times in lifetime; (2) Unresponsive staring episodes \u2014 up to 5 minutes. No known triggers; illness and poor sleep increase risk. Pre-seizure signs: glazed/glaring, unusually docile. Post-seizure: confused/drowsy, may repeat sounds for comfort, recovery 30-60 minutes.' },
      ]),
      pm([
        { text: 'SWALLOWING RISK: ', bold: true, color: 'CC0000' },
        { text: 'Nino has nearly choked twice in 18 months (first aid back blows required). Must cut food into smaller pieces, one bite at a time, chew food thoroughly (16 times), swallow before drinking. Use Mealtime Checklist at dining table. Speech therapist engaged for swallowing assessment.' },
      ]),
      pm([
        { text: 'SAFETY: ', bold: true, color: 'CC0000' },
        { text: 'Nino must be in worker\'s line of sight at all times (has a tracker in his bag). Showers only (no baths) \u2014 cold tap on first, hot tap off first. No ladders, supervision with bike/scooter, helmet required. Swimming only in pool supervised by lifeguard.' },
      ]),

      sub('Medications'),
      p('Nino requires full assistance with all medication administration. Medications are stored in Nino\'s bag or at the support accommodation staff room in a locked cupboard.'),
      sub('Regular Medications'),
      tbl([
        ['Epilim (Sodium Valproate) 100mg + 500mg', 'Oral, twice daily (morning and before bed) \u2014 Epilepsy'],
        ['Intuniv (Guanfacine) 4mg', 'Oral, once daily after dinner (before bed) \u2014 ADHD'],
        ['Risperidone 0.5mg', 'Oral \u2014 AM: 1 tablet, PM: 2 tablets \u2014 Behavioural agitation'],
        ['Melatonin 2mg SR (Circadin)', 'Oral, once at bedtime \u2014 Sleep'],
      ]),
      sub('PRN (When Required) Medications'),
      tbl([
        ['Risperidone 0.5mg', 'Oral \u2014 PRN for agitation/meltdowns (extra dose)'],
        ['Midazolam 10mg (5mg/0.5ml)', 'BUCCAL \u2014 If seizure >5 minutes, call 000 immediately'],
        ['Paracetamol 500mg', 'Oral \u2014 1-2 tabs, 4-6 hourly, max 8/day \u2014 Pain/fever (>37.5\u00b0C)'],
        ['Ibuprofen 200mg', 'Oral \u2014 1-2 tabs \u2014 Pain/inflammation'],
        ['Bromhexine 8mg', 'Oral \u2014 1 tab, 3x per day \u2014 Chesty cough'],
        ['Movicol sachet', 'Oral \u2014 1 sachet \u2014 Constipation'],
        ['Promethazine 25mg', 'Oral \u2014 PRN \u2014 Sleep (if required)'],
      ]),

      // \u2500\u2500 5. BEHAVIOUR SUPPORT \u2500\u2500
      pb(),
      h('5', 'Behaviour Support'),
      p('Nino has a current Comprehensive Behaviour Support Plan (BSP) dated 16/07/2026 with a review date of 16/07/2027, developed by Avan Gupta (Proficient Practitioner) of Bespoke Behaviour Pty Ltd, supervised by Natalie Salmond (Advanced Practitioner). The BSP was endorsed and includes a Functional Behaviour Assessment (FBA) dated 08/06/2026. One Life Foundation will implement the BSP as outlined below.'),

      sub('Primary Behaviour of Concern'),
      p('Hand/thumb biting \u2014 generally low intensity, responds well to redirection.'),

      sub('Known Triggers'),
      b('Internet or TV not working'),
      b('Non-preferred task prompts'),
      b('Routine changes or schedule disruptions'),
      b('Activity delays'),
      b('Communication difficulties'),
      b('Being asked to stop watching TV or YouTube'),
      b('Electronic games (may bite hands)'),

      sub('Escalation Warning Signs'),
      b('Squinted eyes, lowered head'),
      b('Restless pacing'),
      b('Hand flapping'),
      b('Throat vocalisations ("uuhhhh" or "hhmmm")'),
      b('Repeating the same statement multiple times'),
      b('Jumping while flapping'),
      b('Pushing others\' hands away'),
      b('Becoming silent or withdrawn'),
      b('Covering ears'),
      b('Feigned crying'),

      sub('De-escalation and Support Strategies'),
      b('Give 15-30 minute visual warnings before transitions \u2014 avoid rushing'),
      b('Offer 2 realistic activity choices at a time and allow Nino to choose'),
      b('Use visual boards: "Who Is Supporting Me" (AM/PM/Night) and "My Daily Plan" (Minecraft themed)'),
      b('At first sign of frustration: acknowledge calmly, offer star jumps, hand squeezes, or shoulder rubs'),
      b('Prompt "Use your words" and honour requests to reinforce communication'),
      b('Break tension with silly faces, humour, or quotes from favourite movies (Madagascar)'),
      b('Instead of "Stop crying" say "I hear you, let\'s find a way"'),
      b('Instead of "No need to cry" say "You can tell me with your words"'),
      b('Keep voice low, neutral, and minimal during escalation'),
      b('Do not turn your back when Nino is heightened \u2014 remain standing, ready to move'),
      b('Use natural barriers (table, couch) for protection if needed'),
      b('If behaviours escalate beyond 15 minutes with no de-escalation: administer PRN as prescribed, document time/dosage/effect'),
      b('If all strategies fail and behaviour remains unsafe: call 000'),

      sub('Daily Structure (Behaviour Support)'),
      bb('Who Is Supporting Me Board: ', 'At the start of each day, staff sit with Nino and write staff names under AM, PM, and Night. Once comfortable, involve Nino in writing the names. Refer back if he asks who is coming or appears uncertain.'),
      bb('Daily Plan Board: ', 'At the beginning of AM and PM shifts, offer Nino two realistic activity choices at a time. Add choices to the board and cross each activity off once completed. Staff can say "What would you like first?" or "Let\'s check what\'s next."'),
      bb('Meal Planning: ', 'On Monday evening, show Nino the meals available for the week (including meals prepared by Stacey from Bray Street). Offer two choices at a time, allow him to select, and support him to write/add each choice to his weekly meal board. During the week, redirect to the board: "Let\'s see what Nino chose for dinner tonight."'),
      bb('Mealtime Checklist: ', 'Keep visible at the dining table. Go through with Nino during meals: one bite at a time, chewing, swallowing before drinking, placing dishes in the sink, then medication.'),
      bb('Afternoon Activities: ', 'Prioritise community outings and movement activities in the afternoon before dinner (gym, swimming, boxing, trampoline) to promote natural fatigue and better sleep.'),
      bb('Screen Time: ', 'Avoid extended passive screen time (>1 hour on tablet) \u2014 redirect to activities.'),

      // \u2500\u2500 6. SCHEDULE OF SUPPORTS \u2500\u2500
      pb(),
      h('6', 'Schedule of Supports'),
      p('A detailed Schedule of Supports is maintained as a separate document (Attachment A) and forms part of this agreement. The schedule below provides a summary of the types of supports delivered.'),

      sub('Supports Included'),
      b('Personal care (showering \u2014 help with water temperature regulation, prompting to wash body/hair; hair washing; shaving with electric shaver; oral/dental hygiene).'),
      b('Daily living tasks (meal preparation, cleaning, laundry, household tasks with prompting).'),
      b('Medication administration (full assistance required for all medications).'),
      b('Epilepsy management and Midazolam administration (staff must complete Midazolam training).'),
      b('Behaviour Support Plan implementation and de-escalation strategies.'),
      b('Skill building and capacity development to increase independence.'),
      b('Community access and social participation (bowling, movies, shopping, coffee outings, swimming, trampoline, Scienceworks).'),
      b('Overnight support (active night or sleepover as per assessed needs \u2014 someone trained in Basic Life Support must be present).'),
      b('Communication support (use of visual boards, supporting communication device transition).'),
      b('Mealtime supervision (swallowing risk management, Mealtime Checklist).'),
      b('Health and wellbeing support (appointments, exercise, health monitoring).'),
      b('Emergency response and on-call support.'),
      b('Transition planning and coordination with family and other providers.'),

      sub('Supports Not Included'),
      b('Accommodation, property management, or tenancy matters.'),
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

      sub('SIL Funding Breakdown (Approved by NDIA \u2014 $220,301.48/year)'),
      tbl([
        ['Individual Supports', '14 hours/week'],
        ['Other Supports (community/away from home)', '32 hours/week'],
        ['Inactive Sleepover (shared with 2 others)', '56 hours/week'],
        ['All Other Supports (shared with 2 others)', '66 hours/week'],
        ['Irregular Supports (sick days etc.)', '10 days/year'],
      ]),

      sub('SDA Approved'),
      tbl([
        ['Design Category', 'Improved Liveability'],
        ['Build Type', 'House'],
        ['Number of Residents', '3'],
        ['Location', 'VIC \u2014 Melbourne \u2014 North East'],
        ['Maximum Annual Budget', '$49,557 (2025/2026 FY)'],
      ]),

      sub('Support Roster'),
      p('A Roster of Care (RoC) has been proposed and shared with the support team. A final roster will be developed in consultation with Nino and his mother Stacey. At least 7 days\' notice will be provided for roster changes where practicable. Nino responds best to familiar, consistent staff.'),
      tbl([
        ['Support Ratio', '1:3 (shared with 2 other residents)'],
        ['Support Level', 'High'],
        ['Weekday Hours', '[Per Roster of Care]', true],
        ['Weekend Hours', '[Per Roster of Care]', true],
        ['Overnight Model', 'Inactive Sleepover (shared with 2 other residents)'],
        ['Sunday Arrangement', 'Nino returns home to family on Sunday evenings'],
      ]),

      sub('Personal Care Requirements'),
      tbl([
        ['Bathing/Showering', 'Assistance required \u2014 help regulating water temperature, prompting to wash body and hair. Showers only (no baths). Cold tap on first, hot tap off first.'],
        ['Shaving', 'Assistance may be required \u2014 electric shaver only'],
        ['Oral/Dental Hygiene', 'Assistance required \u2014 prompting and support'],
        ['Toileting', 'Independent \u2014 no assistance needed'],
        ['Dressing/Grooming', 'Independent \u2014 no assistance needed'],
      ]),

      // \u2500\u2500 7. FEES AND FUNDING \u2500\u2500
      h('7', 'Fees and Funding'),
      tbl([
        ['Support Category', 'Core Supports \u2014 Assistance with Daily Living'],
        ['Support Item Number(s)', '[To be confirmed per NDIS plan]', true],
        ['Billing Frequency', '[Weekly / Fortnightly / Monthly]', true],
        ['Plan Management Type', '[To be confirmed]', true],
      ]),

      p('All supports under this agreement are charged in accordance with the current NDIS Pricing Arrangements and Price Limits. Applicable rates are published in the NDIS Price Guide and may be updated from time to time by the NDIA. A detailed Schedule of Supports outlining specific support items, quantities, and corresponding line item numbers is maintained as a separate document (see Attachment A) and forms part of this agreement.'),

      b('One Life Foundation will not charge above the NDIS Price Limit for any support item.'),
      b('No gap fees, hidden charges, credit card surcharges, or administration fees beyond the NDIS-funded rate.'),
      b('At least 14 days\' written notice will be provided before any price change resulting from NDIS Price Guide updates.'),
      b('One Life Foundation will not charge for supports not delivered.'),
      b('Claims will only be made for supports delivered in accordance with this agreement.'),
      b('NDIS supports are GST-free per the A New Tax System (Goods and Services Tax) Act 1999.'),

      p('For NDIA-managed plans, claims are made through the NDIS portal. For plan-managed, invoices go to the plan manager. For self-managed, invoices and supporting documentation go directly to the participant. If SIL funding is approaching exhaustion, One Life Foundation will notify the participant and support coordinator at least 14 days in advance.'),

      // \u2500\u2500 8. PROVIDER OBLIGATIONS \u2500\u2500
      pb(),
      h('8', 'Provider Obligations'),
      b('Deliver supports in a person-centred, safe, and competent manner.'),
      b('Comply with the NDIS Act 2013 (Cth), NDIS Practice Standards, and NDIS Code of Conduct.'),
      b('Maintain current NDIS registration for the duration of this agreement.'),
      b('Ensure all workers hold a current NDIS Worker Screening Check clearance.'),
      b('Ensure workers are trained in disability support, manual handling, first aid, epilepsy management, Midazolam administration, medication management, and Nino\'s specific Behaviour Support Plan.'),
      b('Introduce new support workers to Nino before unsupervised shifts where practicable \u2014 Nino responds best to familiar, consistent staff.'),
      b('Maintain Public Liability Insurance (min. $20M), Professional Indemnity Insurance, and Workers Compensation Insurance. Certificates available on request.'),
      b('Comply with the Privacy Act 1988 (Cth) and Australian Privacy Principles.'),
      b('Develop and maintain an individual support plan, reviewed at least every 3 months.'),
      b('Implement Nino\'s Behaviour Support Plan and ensure all staff are trained in its strategies.'),
      b('Ensure at least one worker trained in Basic Life Support is present during overnight support.'),

      // \u2500\u2500 9. NDIS CODE OF CONDUCT \u2500\u2500
      h('9', 'NDIS Code of Conduct'),
      p('One Life Foundation and all workers are bound by the NDIS Code of Conduct (National Disability Insurance Scheme (Code of Conduct) Rules 2018). We will:'),
      bb('1. ', 'Act with respect for individual rights to freedom of expression, self-determination, and decision-making.'),
      bb('2. ', 'Respect the privacy of people with disability.'),
      bb('3. ', 'Provide supports in a safe and competent manner, with care and skill.'),
      bb('4. ', 'Act with integrity, honesty, and transparency.'),
      bb('5. ', 'Promptly raise and act on concerns about quality and safety of supports.'),
      bb('6. ', 'Take all reasonable steps to prevent and respond to violence, exploitation, neglect, and abuse.'),
      bb('7. ', 'Take all reasonable steps to prevent and respond to sexual misconduct.'),
      p('Code of Conduct concerns can be raised with One Life Foundation or the NDIS Commission on 1800 035 544.'),

      // \u2500\u2500 10. PARTICIPANT RIGHTS \u2500\u2500
      h('10', 'Participant Rights'),
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

      // \u2500\u2500 11. PARTICIPANT RESPONSIBILITIES \u2500\u2500
      h('11', 'Participant Responsibilities'),
      b('Treat support workers and other residents with respect.'),
      b('Provide accurate information relevant to the delivery of supports.'),
      b('Notify One Life Foundation of changes to your NDIS plan or personal circumstances.'),
      b('Give reasonable notice of absences (holidays, hospital stays) for roster adjustments.'),
      b('Participate in the development and review of your support plan and goals.'),
      b('Raise concerns about supports, staff, or quality with One Life Foundation.'),

      // \u2500\u2500 12. CANCELLATION POLICY \u2500\u2500
      h('12', 'Cancellation and Short Notice Policy'),
      p('In accordance with the NDIS Pricing Arrangements and Price Limits:'),
      b('Cancellations with 2+ clear business days\' notice \u2014 no cancellation fee.'),
      b('Short notice (less than 2 clear business days) or no-show \u2014 up to 100% of the agreed fee may be charged.'),
      b('One Life Foundation will attempt to reallocate the worker before charging a cancellation fee.'),
      b('No cancellation fee where the cancellation is due to circumstances beyond the participant\'s control (e.g. hospitalisation).'),
      b('If One Life Foundation cancels a support (e.g. staff illness), a replacement will be arranged where possible and no charge will apply for undelivered supports.'),
      p('The participant confirms these cancellation terms were explained before signing.'),

      // \u2500\u2500 13. INCIDENT MANAGEMENT \u2500\u2500
      h('13', 'Incident Management'),
      p('One Life Foundation manages incidents in accordance with the NDIS (Incident Management and Reportable Incidents) Rules 2018:'),
      b('All incidents are reported, recorded, investigated, and reviewed.'),
      b('The participant will be notified of any incident that affects them.'),
      b('Reportable incidents (death, serious injury, abuse/neglect, sexual misconduct, unauthorised restrictive practices) are reported to the NDIS Commission within 24 hours.'),

      sub('Restrictive Practices'),
      p('One Life Foundation does not use unauthorised restrictive practices. Nino\'s current BSP includes the following regulated restrictive practices (chemical restraint):'),
      bb('Risperidone (Routine): ', '0.5mg oral AM + 1mg oral PM (1.5mg/day) \u2014 for behavioural agitation'),
      bb('Risperidone (PRN): ', '0.5mg oral, up to 2x/day (1mg/day max) \u2014 for acute agitation/meltdowns'),
      p('These are authorised through the relevant state process, documented in Nino\'s current BSP by Avan Gupta (Bespoke Behaviour), prescribed by Dr Thanh-Thuan Nguyen (GP), and implemented only by trained staff. They are reviewed regularly with the goal of reduction and elimination through proactive strategies, improved communication, and increased independence.'),

      // \u2500\u2500 14. COMPLAINTS AND DISPUTES \u2500\u2500
      h('14', 'Complaints, Feedback, and Disputes'),
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

      // \u2500\u2500 15. PRIVACY AND CONFIDENTIALITY \u2500\u2500
      h('15', 'Privacy and Confidentiality'),
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
        ['GP (Dr Nguyen / Dr Memon)', '[Yes / No]', true],
        ['Specialist (Dr Symeonides)', '[Yes / No]', true],
        ['Behaviour Support (Raika Testai)', '[Yes / No]', true],
        ['Speech Pathologist', '[Yes / No]', true],
        ['Emergency Services', 'Yes (where required)'],
        ['Family (Stacey & John Fiorito)', '[Yes / No]', true],
        ['Previous Provider (Aruma)', '[Yes / No]', true],
      ]),
      p('Consent may be withdrawn at any time by notifying One Life Foundation in writing.'),

      // \u2500\u2500 16. TERMINATION AND TRANSITION \u2500\u2500
      pb(),
      h('16', 'Termination and Transition'),
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
      p('One Life Foundation will not cease supports abruptly without ensuring Nino\'s safety.'),

      // \u2500\u2500 17. REVIEW AND VARIATION \u2500\u2500
      h('17', 'Review and Variation'),
      b('Agreement reviewed at least annually, or when the NDIS plan is reviewed \u2014 whichever is earlier.'),
      b('Individual support plan reviewed at least every 3 months.'),
      b('Behaviour Support Plan reviewed by 16/07/2027 (or earlier if required).'),
      b('At least 14 days\' written notice for any proposed changes to fees, supports, or terms.'),
      b('Changes require written agreement from both parties.'),

      // \u2500\u2500 18. INFORMED CONSENT \u2500\u2500
      h('18', 'Informed Consent'),
      p('By signing, the participant (or representative) confirms:'),
      b('This agreement has been explained in a way they understand.'),
      b('They have had the opportunity to ask questions and seek independent advice.'),
      b('They understand the supports, costs, rights, and responsibilities.'),
      b('An easy-read version has been offered (available on request).'),
      b('They consent to supports being delivered by One Life Foundation.'),
      b('They may withdraw consent and end this agreement at any time.'),

      sub('Trial Period and Cooling-Off'),
      p('This is a 6-week trial agreement (11/08/2026 to 22/09/2026). The participant has a 7-day cooling-off period from signing. During this period, the agreement may be cancelled without penalty. As this is a trial arrangement, either party may terminate with 7 days\' written notice at any time during the trial. At the conclusion of the trial, this agreement will be reviewed and, if both parties are satisfied, replaced with a full-term Service Agreement.'),

      tbl([
        ['Consent Method', '[Written / Verbal (witnessed) / Via nominee]', true],
        ['Easy-Read Offered', '[Yes / No]', true],
        ['Interpreter Required', 'No'],
        ['Advocate Present', '[Yes / No]', true],
      ]),

      // \u2500\u2500 19. GOVERNING LAW \u2500\u2500
      h('19', 'Governing Law'),
      p('This agreement is governed by:'),
      b('National Disability Insurance Scheme Act 2013 (Cth)'),
      b('NDIS (Provider Registration and Practice Standards) Rules 2018'),
      b('NDIS (Code of Conduct) Rules 2018'),
      b('NDIS (Incident Management and Reportable Incidents) Rules 2018'),
      b('NDIS (Restrictive Practices and Behaviour Support) Rules 2018'),
      b('NDIS Pricing Arrangements and Price Limits (current edition)'),
      b('Privacy Act 1988 (Cth) and Australian Privacy Principles'),
      b('Australian Consumer Law (Competition and Consumer Act 2010)'),
      b('Applicable New South Wales and Victorian legislation'),
      p('Where this agreement conflicts with the NDIS Act or Rules, the Act and Rules prevail.'),

      // \u2500\u2500 20. SIGNATURES \u2500\u2500
      pb(),
      h('20', 'Agreement and Signatures'),
      p('By signing below, both parties confirm they have read, understood, and agree to this Service Agreement. The participant confirms they have received a copy.'),

      ...sig('Participant / Authorised Representative (Anastasia Fiorito)'),
      ...sig('One Life Foundation Representative'),
      ...sig('Witness (if required)'),

      sub('Acknowledgment of Receipt'),
      p('I confirm that I have received a signed copy of this Service Agreement, including all attachments.'),
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
console.log('SIL Service Agreement created:', outputPath);
console.log('Copied to Downloads:', downloadsPath);
