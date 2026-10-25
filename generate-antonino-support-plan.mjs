import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const NAVY = [15, 82, 138];
const RED = [220, 38, 38];
const GREY_BG = [245, 247, 250];
const WHITE = [255, 255, 255];
const BLACK = [30, 30, 30];
const DARK_GREY = [80, 80, 80];
const LIGHT_BORDER = [200, 210, 220];
const GREEN = [14, 160, 62];

const ML = 15;
const MR = 15;
const MT = 15;
const PW = 210;
const PH = 297;
const CW = PW - ML - MR;

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
let y = MT;
let pageNum = 1;

// ─── Helpers ────────────────────────────────────────────────────────────
function addLogo() {
  try {
    const logoPath = path.resolve('public/logo.png');
    const logoData = fs.readFileSync(logoPath).toString('base64');
    doc.addImage('data:image/png;base64,' + logoData, 'PNG', (PW - 30) / 2, y, 30, 30);
    y += 34;
    return true;
  } catch { return false; }
}

function addFooter() {
  doc.setFillColor(...NAVY);
  doc.rect(0, PH - 12, PW, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('One Life Foundation | Support Plan | Antonino Fiorito | NDIS: 430200387', ML, PH - 5);
  doc.text(`Page ${pageNum}`, PW - MR, PH - 5, { align: 'right' });
  doc.setTextColor(...BLACK);
}

function addTopBar() {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PW, 8, 'F');
}

function newPage() {
  addFooter();
  doc.addPage();
  pageNum++;
  addTopBar();
  y = MT + 5;
}

function checkPage(needed = 20) {
  if (y + needed > PH - 25) {
    newPage();
  }
}

function sectionHeader(title) {
  checkPage(15);
  doc.setFillColor(...NAVY);
  doc.rect(ML, y, CW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), ML + 4, y + 5.5);
  doc.setTextColor(...BLACK);
  y += 12;
}

function redSectionHeader(title) {
  checkPage(15);
  doc.setFillColor(...RED);
  doc.rect(ML, y, CW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), ML + 4, y + 5.5);
  doc.setTextColor(...BLACK);
  y += 12;
}

function greenSectionHeader(title) {
  checkPage(15);
  doc.setFillColor(...GREEN);
  doc.rect(ML, y, CW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), ML + 4, y + 5.5);
  doc.setTextColor(...BLACK);
  y += 12;
}

function infoTable(rows, labelWidth = 55) {
  const valWidth = CW - labelWidth;
  for (const [label, value] of rows) {
    const lines = doc.splitTextToSize(String(value || '—'), valWidth - 6);
    const rowH = Math.max(7, lines.length * 4.5 + 3);
    checkPage(rowH + 2);
    // Label cell
    doc.setFillColor(...GREY_BG);
    doc.rect(ML, y, labelWidth, rowH, 'F');
    doc.setDrawColor(...LIGHT_BORDER);
    doc.rect(ML, y, labelWidth, rowH, 'S');
    doc.rect(ML + labelWidth, y, valWidth, rowH, 'S');
    // Label text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK_GREY);
    doc.text(label, ML + 3, y + 5);
    // Value text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text(lines, ML + labelWidth + 3, y + 5);
    y += rowH;
  }
  y += 4;
}

function alertBox(text, color = RED) {
  const bgColor = color === RED ? [254, 242, 242] : [240, 253, 244];
  const borderColor = color;
  const lines = doc.splitTextToSize(text, CW - 16);
  const boxH = lines.length * 4.5 + 8;
  checkPage(boxH + 4);
  doc.setFillColor(...bgColor);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, y, CW, boxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...borderColor);
  doc.text(lines, ML + 8, y + 6);
  doc.setTextColor(...BLACK);
  doc.setLineWidth(0.2);
  y += boxH + 4;
}

function bodyText(text) {
  const lines = doc.splitTextToSize(text, CW - 4);
  for (let i = 0; i < lines.length; i++) {
    checkPage(6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK_GREY);
    doc.text(lines[i], ML + 2, y + 4);
    y += 4.5;
  }
  y += 3;
}

function bulletPoint(text) {
  const lines = doc.splitTextToSize(text, CW - 12);
  checkPage(lines.length * 4.5 + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK_GREY);
  doc.text('•', ML + 3, y + 4);
  doc.text(lines, ML + 8, y + 4);
  y += lines.length * 4.5 + 1;
}

function subHeading(text) {
  checkPage(10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(text, ML + 2, y + 4);
  doc.setTextColor(...BLACK);
  y += 7;
}

// ─── BUILD THE DOCUMENT ────────────────────────────────────────────────

// Page 1: Cover
addTopBar();
y = MT + 5;
addLogo();

doc.setFont('helvetica', 'bold');
doc.setFontSize(22);
doc.setTextColor(...NAVY);
doc.text('SUPPORT PLAN', PW / 2, y, { align: 'center' });
y += 10;

doc.setFont('helvetica', 'normal');
doc.setFontSize(12);
doc.setTextColor(...DARK_GREY);
doc.text('Supported Independent Living (SIL)', PW / 2, y, { align: 'center' });
y += 14;

doc.setDrawColor(...NAVY);
doc.setLineWidth(0.5);
doc.line(ML + 30, y, PW - MR - 30, y);
y += 10;

infoTable([
  ['Participant', 'Antonino Fiorito (preferred: Nino)'],
  ['Date of Birth', '04/03/2005 (Age 21)'],
  ['NDIS Number', '430200387'],
  ['Plan Period', '29/05/2026 – 28/05/2027'],
  ['Support Level', 'High'],
  ['Current Funding Ratio', '1:3 (shared support)'],
  ['Primary Disability', 'Autism Spectrum Disorder (ASD)'],
  ['Secondary Conditions', 'ADHD, Intellectual Disability'],
  ['SIL Location', '37 Bray Street, Reservoir VIC 3073'],
  ['Plan Prepared By', 'One Life Foundation'],
  ['Date Prepared', '26 August 2026'],
  ['Plan Review Date', '26 November 2026 (3 months)'],
]);

// Page 2: Key Contacts
newPage();

sectionHeader('Key Contacts');
infoTable([
  ['Emergency Contact', 'Anastasia (Stacey) Fiorito — Mother'],
  ['Emergency Phone', '0409 338 853'],
  ['Support Coordinator', 'Sonia Muraca'],
  ['BSP Practitioner', 'Avan Gupta (Proficient) — Bespoke Behaviour Pty Ltd'],
  ['GP', 'Dr Thanh-Thuan Nguyen — Alphington Medical Centre, 29-31 Station St, Fairfield VIC 3078'],
  ['SIL Provider', 'One Life Foundation'],
]);

// Participant Background
sectionHeader('Participant Background');
bodyText('Antonino (Nino) is a 21-year-old male living in a Supported Independent Living (SIL) arrangement at 37 Bray Street, Reservoir. He has a diagnosis of Autism Spectrum Disorder (ASD), ADHD, and Intellectual Disability. Nino transitioned to SIL in August 2026 and is currently supported at a 1:3 ratio (shared support with other participants in the house).');
bodyText('Nino has limited verbal communication — he uses single words and short phrases but does not initiate social interaction. He responds well to calm, simple verbal instructions and is good with names and faces. He is currently transitioning to a new communication device with speech pathology support. When distressed, Nino may ask for a hug or become very quiet.');
bodyText('Nino is independently mobile with no aids required. However, he is described by his mother as "fearless" and requires supervision near heights and roads. A helmet is required for bike or scooter activities.');

// Daily Support Needs
sectionHeader('Daily Support Needs');

subHeading('Morning Routine (6:00 AM – 10:00 AM)');
bulletPoint('Wake Nino gently around 8:00–8:30 AM (or as per schedule). Say good morning, allow time to orient.');
bulletPoint('Prompt to use bathroom — wash face, use toilet. Nino can complete independently with verbal prompting.');
bulletPoint('Prompt to change from pyjamas into day clothes (pants, hoodie, shoes). Nino can dress independently when prompted.');
bulletPoint('Ask what he would like for breakfast. Common choices: toasted bread with butter and vegetables, Vegemite toast, cereal.');
bulletPoint('Serve breakfast with one glass of water. After eating, prompt Nino to place dishes in the dishwasher.');
bulletPoint('Administer morning medication as prescribed (see Medication section).');
bulletPoint('Prompt to put laundry in washing machine if needed.');
bulletPoint('CSW (Community Support Worker) typically arrives at 9:00 AM — provide handover including mood, sleep, any concerns.');

subHeading('Afternoon / Evening (4:00 PM – 10:00 PM)');
bulletPoint('Nino typically returns from community access with CSW around 3:30–4:00 PM. Receive handover from CSW.');
bulletPoint('Store Nino\'s bag and webster pack safely (locked cupboard or staff room).');
bulletPoint('Nino will generally watch TV. Monitor volume — he tends to increase it. Gently prompt to reduce volume.');
bulletPoint('Prepare and serve dinner. Common preferences: pizza, Greek food, schnitzel, chips, pasta, rice, cake.');
bulletPoint('Administer evening medication with dinner.');
bulletPoint('Offer evening snack: apple, milk and biscuits are favourites.');
bulletPoint('2x staff required for shower support and night suit dressing.');
bulletPoint('Encourage Nino to go to bed. Administer night medication (melatonin).');

subHeading('Overnight Support');
bulletPoint('Monitor throughout the night — Nino may have restless sleep.');
bulletPoint('Midazolam 10mg BUCCAL available PRN if seizure exceeds 5 minutes — call 000 immediately.');
bulletPoint('If Nino is awake and unsettled, use calm voice and gentle redirection.');

// Mealtime Safety
redSectionHeader('Mealtime Safety — Critical');
alertBox('SWALLOWING RISK: Nino has nearly choked twice in 18 months requiring back blows. All food MUST be cut into smaller pieces. One bite at a time. Chew food 16 times before swallowing. Swallow before drinking. Use Mealtime Checklist at dining table. Staff must supervise all meals.');
bodyText('Nino likes: pizza, Greek food, cake, toast, banana, apple, plain rice, schnitzel, chips, pasta. Dislikes: foods that are too chewy. Prefers a quiet environment during meals — not too noisy.');
bodyText('No known food or drug allergies.');

// Medication
newPage();
sectionHeader('Medication Management');
alertBox('Full assistance required for ALL medication administration. Nino cannot self-administer. Medications stored in bag or Quick St staff room locked cupboard. Weight: 100kg.');

subHeading('Regular Medications');
infoTable([
  ['Epilim (Sodium Valproate)', '100mg + 500mg twice daily — epilepsy management'],
  ['Intuniv (Guanfacine)', '4mg once daily after dinner — ADHD'],
  ['Risperidone 0.5mg', 'AM: 1 tablet, PM: 2 tablets — behavioural regulation'],
  ['Melatonin 2mg SR (Circadin)', 'Once at bedtime — sleep support'],
], 60);

subHeading('PRN (As Needed) Medications');
infoTable([
  ['Risperidone 0.5mg (PRN)', 'Extra dose for meltdowns/agitation — as per care plan'],
  ['Midazolam 10mg BUCCAL', 'If seizure >5 minutes — THEN CALL 000'],
  ['Paracetamol 500mg', '1-2 tabs, 4-6 hourly, max 8/day — pain'],
  ['Ibuprofen 200mg', '1-2 tabs — pain/inflammation'],
  ['Bromhexine 8mg', '1 tab, 3x/day — chesty cough'],
  ['Movicol', '1 sachet — constipation'],
  ['Promethazine 25mg', 'PRN for sleep if needed'],
], 60);

// Behaviour Support
sectionHeader('Behaviour Support');
bodyText('Nino\'s Behaviour Support Plan (BSP) is managed by Avan Gupta from Bespoke Behaviour Pty Ltd. The following behaviours have been observed and documented in progress notes from 11–24 August 2026:');

subHeading('1. Self-Injurious Behaviour — Hand Biting');
bodyText('Observed on 20 Aug and 16 Aug. Nino bites his hand, particularly when agitated or understimulated. On 16 Aug, hand biting escalated alongside screaming, requiring PRN Risperidone at 10:50 AM. On 20 Aug, staff attempted distraction but behaviour continued until CSW arrival.');
bulletPoint('Strategy: Distraction, sensory redirection. If escalating, administer PRN Risperidone as per care plan.');

subHeading('2. Vocal Escalation & Agitation');
bodyText('Observed on 16 Aug — screaming and agitation in the morning. Settled after PRN medication was administered. On 17 Aug, Nino was loud and running around but no aggressive behaviour was observed.');
bulletPoint('Strategy: Calm voice, reduce environmental stimuli, PRN if behaviour continues beyond 15 minutes.');

subHeading('3. Participant-to-Participant Conflict');
bodyText('On 11 Aug at 9:20 PM, Nino took a bag that another participant (Darrell) believed was his. Darrell pursued Nino, and Nino grabbed Darrell\'s both hands. Both staff intervened and de-escalated the situation successfully.');
bulletPoint('Strategy: Ensure personal belongings are clearly identified. Separate participants during escalation. Two staff required for physical intervention scenarios.');

subHeading('4. Sensory-Seeking Behaviour');
bodyText('TV volume escalation is frequent — Nino repeatedly increases volume. Staff gently prompt him to reduce it, and he complies. This is a sensory-seeking pattern consistent with ASD.');
bulletPoint('Strategy: Set TV volume limits. Offer alternative sensory input (fidget tools, weighted blanket, music).');

subHeading('5. Impulsive & Unpredictable Behaviour');
bodyText('Nino can be impulsive — running around the house, sudden movements, grabbing items. His mother describes him as "fearless." Requires constant supervision near heights, roads, and in the community.');
bulletPoint('Strategy: Maintain line of sight. Use clear, simple boundaries. Structured routine reduces impulsivity.');

// Communication
newPage();
sectionHeader('Communication & Social Interaction');
bodyText('Nino has limited verbal communication. He uses single words (e.g., "Coke", food preferences) and does not initiate social interaction. He is good with names and faces and responds to calm, simple verbal requests.');
bulletPoint('Use short, clear sentences. One instruction at a time.');
bulletPoint('Allow processing time — do not repeat immediately.');
bulletPoint('Nino may ask for a hug when upset — this is his way of communicating distress.');
bulletPoint('Currently transitioning to a new communication device — speech pathology ongoing.');
bulletPoint('Receptive language: does NOT readily comprehend without adjusted language.');
bulletPoint('Can notify others of pain — will be very quiet and ask for hugs, or tell you.');

// Community Access
sectionHeader('Community Access');
bodyText('Nino has a Community Support Worker (CSW) who takes him out daily, typically from 9:00 AM to 3:30–4:00 PM. Activities are coordinated by the CSW. On 23 Aug, the CSW did not arrive and Nino\'s mother was called to collect him.');
bulletPoint('Handover to CSW must include: medication status, mood, sleep quality, any incidents from overnight.');
bulletPoint('Handover from CSW must include: activities completed, any behaviours, food/drink intake.');
bulletPoint('If CSW does not arrive, inform Admin immediately and contact family.');
bulletPoint('BSP practitioner Avan visits regularly (observed on 17 Aug) for in-home sessions with Nino.');

// Goals
greenSectionHeader('Goals');

subHeading('Short-Term Goals (3 months)');
bulletPoint('Improve daily routine compliance — morning tasks (bathroom, dressing, breakfast) with minimal prompting.');
bulletPoint('Reduce hand-biting episodes through sensory alternatives and BSP strategies.');
bulletPoint('Establish consistent mealtime safety practices across all staff.');
bulletPoint('Transition to new communication device with speech pathology support.');
bulletPoint('Develop a weekly meal plan using the whiteboard system (as suggested by BSP Avan on 17 Aug).');

subHeading('Long-Term Goals (12 months)');
bulletPoint('Increase independent living skills — preparing simple meals, laundry, personal hygiene with reduced support.');
bulletPoint('Reduce frequency and intensity of behavioural incidents through consistent BSP implementation.');
bulletPoint('Build communication skills — progress from single words to short phrases/sentences using communication device.');
bulletPoint('Develop meaningful social connections in the SIL environment and community.');
bulletPoint('Explore vocational or day program options aligned with Nino\'s interests.');

// Risk Management
redSectionHeader('Risk Management');
alertBox('KEY RISKS: (1) Choking — swallowing difficulty, requires supervised meals with cut food. (2) Seizures — Midazolam PRN, call 000 if >5 min. (3) Self-injury — hand biting during agitation. (4) Impulsivity — fearless near heights/roads. (5) Participant conflict — physical altercation risk with housemates.');

subHeading('Seizure Protocol');
bulletPoint('If seizure occurs: time it immediately.');
bulletPoint('If seizure exceeds 5 minutes: administer Midazolam 10mg BUCCAL.');
bulletPoint('Call 000 immediately after administering Midazolam.');
bulletPoint('Place Nino in recovery position. Do not restrain. Clear area of hazards.');
bulletPoint('Contact mother Stacey on 0409 338 853.');

subHeading('Escalation Protocol');
bulletPoint('Level 1 — Mild agitation/loud vocalisations: calm voice, reduce stimuli, offer preferred activity.');
bulletPoint('Level 2 — Hand biting, screaming: attempt distraction, offer sensory tools. If continues >15 min, consider PRN Risperidone.');
bulletPoint('Level 3 — Physical conflict with participants: separate immediately, 2 staff required. Document incident. Notify Admin and BSP.');
bulletPoint('Level 4 — Seizure or medical emergency: follow seizure protocol. Call 000. Notify family.');

// Positive Observations
newPage();
greenSectionHeader('Positive Observations');
bodyText('The following positive patterns have been consistently documented across Nino\'s progress notes:');
bulletPoint('Nino follows verbal instructions well when delivered calmly and simply — he completed morning tasks (bathroom, dressing, laundry, dishes) independently with prompting on multiple occasions.');
bulletPoint('Nino has been generally happy and calm throughout the reporting period, with "nil concerns" noted on multiple shifts.');
bulletPoint('He enjoys watching TV and eating his preferred foods — these are effective positive reinforcement tools.');
bulletPoint('Nino responds positively to structured routine — days with consistent scheduling show fewer behavioural incidents.');
bulletPoint('Nino is good with names and faces and shows positive social engagement when comfortable.');
bulletPoint('The PRN Risperidone protocol is effective — when administered during agitation on 16 Aug, Nino settled and returned to watching TV.');

// Staff Acknowledgement
sectionHeader('Staff Acknowledgement');
bodyText('By signing below, I confirm that I have read, understood, and will follow this Support Plan for Antonino Fiorito.');
y += 4;

// Signature table
const cols = ['Name', 'Signature', 'Date', 'Initials'];
const colWidths = [50, 60, 40, CW - 150];
// Header
doc.setFillColor(...NAVY);
let tx = ML;
for (let i = 0; i < cols.length; i++) {
  doc.rect(tx, y, colWidths[i], 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(cols[i], tx + 3, y + 5);
  tx += colWidths[i];
}
y += 7;
doc.setTextColor(...BLACK);

// 8 blank rows
for (let r = 0; r < 8; r++) {
  checkPage(10);
  tx = ML;
  for (let i = 0; i < cols.length; i++) {
    doc.setDrawColor(...LIGHT_BORDER);
    doc.rect(tx, y, colWidths[i], 9, 'S');
    tx += colWidths[i];
  }
  y += 9;
}

// Final footer
addFooter();

// Save
const filename = 'Antonino_Fiorito_Support_Plan.pdf';
const buffer = doc.output('arraybuffer');
fs.writeFileSync(filename, Buffer.from(buffer));

// Copy to Downloads
const downloadsPath = path.join('C:', 'Users', 'kevin', 'Downloads', filename);
fs.copyFileSync(filename, downloadsPath);

console.log(`✓ Generated: ${filename}`);
console.log(`✓ Copied to: ${downloadsPath}`);
