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

const ML = 15; // margin left
const MR = 15;
const MT = 15;
const PW = 210; // A4 width
const PH = 297;
const CW = PW - ML - MR; // content width

const participant = {
  name: 'Antonino Fiorito',
  preferred: 'Nino',
  ndis: '430200387',
  dob: '04/03/2005',
  age: '21',
  plan_start: '29/05/2026',
  plan_end: '28/05/2027',
  support_level: 'High',
  funding_ratio: '1:3',
  primary_disability: 'Autism Spectrum Disorder (ASD)',
  secondary: 'ADHD, Intellectual Disability',
  sc: 'Sonia Muraca',
};

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
let y = MT;

// ─── Helpers ────────────────────────────────────────────────────────────
function addLogo() {
  try {
    const logoPath = path.resolve('public/logo.png');
    const logoData = fs.readFileSync(logoPath).toString('base64');
    doc.addImage('data:image/png;base64,' + logoData, 'PNG', ML, y, 30, 30);
    return true;
  } catch { return false; }
}

function checkPage(needed = 20) {
  if (y + needed > PH - 25) {
    addFooter();
    doc.addPage();
    y = MT;
    addTopBar();
    return true;
  }
  return false;
}

function addTopBar() {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PW, 8, 'F');
}

function addFooter() {
  const pageNum = doc.internal.getNumberOfPages();
  doc.setFontSize(7);
  doc.setTextColor(...DARK_GREY);
  doc.text(`One Life Foundation | Behaviour & Support Summary | ${participant.name} | NDIS: ${participant.ndis}`, ML, PH - 8);
  doc.text(`Page ${pageNum}`, PW - MR, PH - 8, { align: 'right' });
}

function sectionHeading(title) {
  checkPage(18);
  doc.setFillColor(...NAVY);
  doc.rect(ML, y, CW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(title.toUpperCase(), ML + 4, y + 5.5);
  y += 12;
}

function redSectionHeading(title) {
  checkPage(18);
  doc.setFillColor(...RED);
  doc.rect(ML, y, CW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(title.toUpperCase(), ML + 4, y + 5.5);
  y += 12;
}

function subHeading(title) {
  checkPage(12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(title, ML, y);
  y += 6;
}

function bodyText(text, indent = 0) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  const lines = doc.splitTextToSize(text, CW - indent);
  for (const line of lines) {
    checkPage(5);
    doc.text(line, ML + indent, y);
    y += 4.5;
  }
  y += 1;
}

function bulletPoint(text, indent = 4) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  const lines = doc.splitTextToSize(text, CW - indent - 4);
  checkPage(5);
  doc.text('•', ML + indent, y);
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) checkPage(5);
    doc.text(lines[i], ML + indent + 4, y);
    y += 4.5;
  }
}

function infoTable(rows) {
  for (const [label, value] of rows) {
    checkPage(8);
    // Label cell
    doc.setFillColor(...GREY_BG);
    doc.rect(ML, y - 3.5, 45, 7, 'F');
    doc.setDrawColor(...LIGHT_BORDER);
    doc.rect(ML, y - 3.5, 45, 7, 'S');
    doc.rect(ML + 45, y - 3.5, CW - 45, 7, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK_GREY);
    doc.text(label, ML + 2, y);
    // Value cell
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(String(value || '—'), ML + 47, y);
    y += 7;
  }
  y += 3;
}

function alertBox(text) {
  checkPage(20);
  const lines = doc.splitTextToSize(text, CW - 12);
  const boxH = lines.length * 4.5 + 6;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.4);
  doc.roundedRect(ML, y, CW, boxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...RED);
  y += 5;
  for (const line of lines) {
    doc.text(line, ML + 6, y);
    y += 4.5;
  }
  y += 4;
}

// ─── PAGE 1: Cover / Header ─────────────────────────────────────────────
addTopBar();
y = 12;

const hasLogo = addLogo();
const titleX = hasLogo ? ML + 35 : ML;

doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.setTextColor(...NAVY);
doc.text('BEHAVIOUR & SUPPORT SUMMARY', titleX, y + 8);

doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(...DARK_GREY);
doc.text(`Prepared by One Life Foundation PTY LTD`, titleX, y + 15);
doc.text(`Date: ${new Date().toLocaleDateString('en-AU')}`, titleX, y + 20);

y = 50;

// ─── PARTICIPANT DETAILS ─────────────────────────────────────────────────
sectionHeading('Participant Details');
infoTable([
  ['Full Name', participant.name],
  ['Preferred Name', participant.preferred],
  ['Date of Birth', `${participant.dob} (Age ${participant.age})`],
  ['NDIS Number', participant.ndis],
  ['Primary Disability', participant.primary_disability],
  ['Secondary Conditions', participant.secondary],
  ['Current Support Level', participant.support_level],
  ['Current Funding Ratio', participant.funding_ratio],
  ['NDIS Plan Period', `${participant.plan_start} — ${participant.plan_end}`],
  ['Support Coordinator', participant.sc],
  ['SIL Provider', 'One Life Foundation PTY LTD'],
  ['SIL Property', 'Severn, Epping — 59 Severn Street, Epping VIC 3076'],
]);

// ─── BACKGROUND ──────────────────────────────────────────────────────────
sectionHeading('Background');
bodyText(
  `${participant.name} (preferred name: "${participant.preferred}") is a 21-year-old male with a primary diagnosis of Autism Spectrum Disorder (ASD), ` +
  `along with ADHD and Intellectual Disability. ${participant.preferred} presents with limited verbal communication — he uses single words and short phrases, ` +
  `and does not readily comprehend language without adjusted, simple instructions. He requires full assistance with medication administration, including a complex ` +
  `regime of regular and PRN medications for epilepsy, behavioural management, ADHD, and sleep. ${participant.preferred} has a documented swallowing risk, ` +
  `having nearly choked twice in 18 months requiring back blows. He is independently mobile but is described by his mother as "fearless," requiring constant ` +
  `supervision near heights and roads.`
);
y += 2;
bodyText(
  `${participant.preferred} recently transitioned to One Life Foundation's SIL property in Epping, Victoria. Since his commencement, staff have documented ` +
  `consistent patterns of behaviour that require intensive, often 1:1 supervision. The evidence outlined below is drawn directly from daily progress notes ` +
  `recorded by support workers during the period 11 August – 31 August 2026.`
);

// ─── OBSERVED BEHAVIOURS ─────────────────────────────────────────────────
checkPage(30);
redSectionHeading('Behaviours of Concern — Observed Patterns');

subHeading('1. Self-Injurious Behaviour (Hand Biting)');
bodyText(
  `${participant.preferred} has been observed biting his own hand on multiple occasions. This behaviour appears to be linked to sensory overload, ` +
  `frustration, or unmet needs. Staff have documented the following episodes:`
);
bulletPoint(
  '20 August 2026 — "Nino was started biting his hand. Staff tried to distract him." (Divya Karki). The behaviour occurred during a period of waiting before his Community Participation worker arrived.'
);
bulletPoint(
  '16 August 2026 — "Around 10:40am client began agitating, screaming, and biting his hand. Staff attempted to distract client, but behaviours continued. ' +
  'PRN medication (Risperidone) was administered as per care plan at 10:50am. Following PRN, client settled." (Divya Karki). This episode required pharmacological intervention to manage.'
);
y += 2;

subHeading('2. Vocal Escalation & Agitation');
bodyText(
  `${participant.preferred} displays episodes of vocal escalation including screaming and loud vocalisations. These episodes can occur unpredictably and require immediate staff response to prevent further escalation:`
);
bulletPoint(
  '16 August 2026 — "Client began agitating, screaming, and biting his hand." This episode escalated to the point of requiring PRN medication administration.'
);
bulletPoint(
  '17 August 2026 — "Nino was running around, few times he was loud." Staff noted the behaviour but no aggressive actions occurred on this occasion, indicating variability in escalation.'
);

subHeading('3. Participant-to-Participant Conflict');
bodyText(
  `${participant.preferred} has been involved in an altercation with another participant at the SIL property. This incident highlights the need for close supervision in shared living environments:`
);
bulletPoint(
  '11 August 2026 — "At 9:20pm, writer heard noises. Writer went out and saw Nino was running with a bag, Darrell was after him. Darrell thought that was his bag. ' +
  'Nino held Darrell\'s both hands. Both staff encouraged Darrell and Nino to leave each other. Situation was controlled." (Gurpreet Kaur). ' +
  'This physical altercation required two staff members to intervene and de-escalate. The incident occurred when one staff member was briefly unavailable (using the bathroom), ' +
  'demonstrating the risk of reduced supervision ratios.'
);
y += 2;

subHeading('4. Impulsive & Unpredictable Behaviour');
bodyText(
  `${participant.preferred} demonstrates impulsive behaviour patterns consistent with his ADHD and ASD diagnoses. He can become suddenly excited, begin running around the home, ` +
  `and his mood can shift rapidly. His mother has described him as "fearless," requiring constant supervision near heights and roads. These behaviours are documented across multiple shifts:`
);
bulletPoint(
  '11 August 2026 — "Nino was running with a bag, Darrell was after him… Nino held Darrell\'s both hands." (Gurpreet Kaur). Impulsive behaviour triggered a physical altercation with another participant.'
);
bulletPoint(
  '17 August 2026 — "Nino was running around, few times he was loud." (Gurpreet Kaur). Running and vocal behaviours occurred during the evening period.'
);
bulletPoint(
  '11 August 2026 — "Observed to get excited many times" while watching TV. (Gurpreet Kaur). Excitement can escalate unpredictably and requires staff monitoring.'
);
y += 2;

subHeading('5. Non-Compliance & Task Refusal');
bodyText(
  `${participant.preferred} intermittently refuses staff directions, particularly around personal care tasks. While he generally follows simple instructions well, ` +
  `there are documented instances where he declines to comply or does not respond to staff prompts:`
);
bulletPoint(
  '16 August 2026 — "Staff encouraged client to change clothes, but client declined and did not change." (Divya Karki). Nino refused to get dressed despite repeated prompting by staff.'
);
bulletPoint(
  '16 August 2026 — "Staff asked client to come eat breakfast. Client was watching TV and did not respond initially. After 10 minutes client came to the table." (Divya Karki). ' +
  'Delayed response to mealtime instructions, requiring staff to wait and re-prompt. Given his swallowing risk, timely mealtime supervision is critical.'
);
y += 2;

subHeading('6. Toileting & Hygiene Concerns');
bodyText(
  `${participant.preferred} requires ongoing supervision and support with toileting hygiene. Staff have documented concerning hygiene findings that indicate he is not ` +
  `independently managing his toileting needs to an acceptable standard:`
);
bulletPoint(
  '16 August 2026 — "Staff cleaned client bathroom. Bathroom was found messy with bowel open in pan area." (Divya Karki). This indicates Nino requires active prompting and supervision ' +
  'for toileting to maintain hygiene standards in the shared living environment.'
);
y += 2;

subHeading('7. Sensory-Seeking Behaviour');
bodyText(
  `${participant.preferred} demonstrates sensory-seeking patterns consistent with his ASD diagnosis. These behaviours include volume escalation on electronic devices ` +
  `and heightened physical excitement during stimulating activities:`
);
bulletPoint(
  '19 August 2026 — "Nino watched TV and put the volume up few times. Writer gently asked Nino to put the volume down. Nino did that." (Gurpreet Kaur). ' +
  'Repeated volume escalation in a shared living environment impacts other residents and requires ongoing staff redirection.'
);
bulletPoint(
  '11 August 2026 — "Observed to get excited many times" during TV watching. (Gurpreet Kaur). Physical excitement and arousal states require monitoring to prevent escalation ' +
  'into more disruptive behaviours.'
);

// ─── SUPPORT NEEDS ───────────────────────────────────────────────────────
sectionHeading('Intensity of Support Required');

subHeading('Medication Management');
bodyText(
  `${participant.preferred} requires full assistance with all medication administration. He is prescribed multiple regular and PRN medications including ` +
  `Epilim (epilepsy), Intuniv (ADHD), Risperidone (behavioural — regular AND PRN), Melatonin (sleep), and Midazolam 10mg buccal for seizures >5 minutes. ` +
  `Staff must be trained in buccal Midazolam administration for seizure emergencies. The PRN Risperidone for meltdowns has been required during the reporting period ` +
  `(documented 16 August 2026), confirming the active use of pharmacological intervention for behavioural management.`
);

subHeading('Personal Care');
bodyText(
  `${participant.preferred} requires 2x staff support for showering and dressing (documented 19 August 2026). He requires prompting and supervision for all personal hygiene tasks ` +
  `including bathroom use, face washing, and changing clothes. On some occasions, he declines to change clothes when prompted (documented 16 August 2026).`
);

subHeading('Mealtime Supervision');
alertBox(
  `SWALLOWING RISK — ${participant.preferred} has nearly choked twice in 18 months (back blows required). Must cut food into smaller pieces, one bite at a time, chew 16 times, ` +
  `swallow before drinking. Speech therapist engaged for swallowing assessment. Mealtime Checklist must be used at the dining table.`
);
bodyText(
  `Given the documented swallowing risk, ${participant.preferred} requires direct 1:1 supervision during all meals. Staff must actively monitor his eating pace, food size, ` +
  `and swallowing. This cannot be done while simultaneously supporting other participants.`
);

subHeading('Overnight Support');
bodyText(
  `${participant.preferred}'s sleep has been documented as "Restless" (11 August 2026). He requires overnight supervision due to seizure risk (Midazolam protocol), ` +
  `and his medications include a bedtime Melatonin dose and PRN Promethazine for sleep. The participant-to-participant conflict on 11 August occurred at 9:20pm, ` +
  `demonstrating that behavioural risks extend into evening and overnight periods.`
);

// ─── POSITIVES ───────────────────────────────────────────────────────────
sectionHeading('Positive Observations & Functional Capacity');
bodyText(
  `It is important to note that ${participant.preferred} also demonstrates significant strengths and positive engagement when adequately supported:`
);
y += 1;
bulletPoint(
  'Follows instructions well — When staff provide clear, simple verbal requests, Nino consistently follows through. Multiple progress notes document him following instructions to wash his face, change clothes, put laundry on, put dishes in the dishwasher, and take medications.'
);
bulletPoint(
  'Independent mobility — Nino is independently mobile and can complete physical tasks such as making his bed, putting laundry in the washing machine, and dressing himself when prompted.'
);
bulletPoint(
  'Positive mood and social engagement — Staff frequently note Nino is in a "happy mood" and "calm." He engages well with familiar staff and his Community Support Worker (CSW). He enjoys watching TV, particularly getting excited during programs.'
);
bulletPoint(
  'Community participation — Nino regularly attends community access with his external support worker (9am–4pm daily), which supports regulation and positive engagement. His BSP (Avan) is actively involved in his support.'
);
bulletPoint(
  'Meal preparation involvement — Nino can express food preferences and makes consistent choices (toasted bread with butter and vegetables, pizza). He participates in meal routines when prompted.'
);
bulletPoint(
  'Responds to de-escalation — While behaviours of concern occur, Nino does respond to staff intervention and distraction techniques. After PRN administration on 16 August, he settled and returned to baseline within a reasonable timeframe.'
);

// ─── SHARED SUPPORT BEHAVIOUR ANALYSIS ──────────────────────────────────
sectionHeading('Shared Support — Behaviour Correlation');
bodyText(
  `${participant.preferred} is currently approved on a 1:3 (staff to client) funding ratio within the shared SIL property. ` +
  `A clear behavioural pattern has emerged over the reporting period that directly correlates the number of co-residents present in the home ` +
  `with the frequency and severity of ${participant.preferred}'s behaviours of concern.`
);
y += 2;

subHeading('Week 1 (11–17 August 2026) — Three Clients in Residence');
bodyText(
  `During the first week, all three SIL participants were residing in the property simultaneously. During this period, ${participant.preferred} ` +
  `displayed significantly heightened behaviours:`
);
bulletPoint(
  '11 August — Physical altercation with co-resident Darrell over a bag. Nino held Darrell\'s both hands. Required 2x staff intervention to de-escalate. ' +
  'Incident occurred at 9:20pm when one staff member was momentarily unavailable (Gurpreet Kaur).'
);
bulletPoint(
  '16 August — Screaming, agitation, and hand biting escalated to the point of requiring PRN Risperidone administration at 10:50am. ' +
  'Staff distraction was ineffective. Pharmacological intervention required (Divya Karki).'
);
bulletPoint(
  '17 August — Running around the home, loud vocalisations throughout the evening. While no aggressive behaviour was observed, ' +
  'the elevated arousal state required continuous staff monitoring (Gurpreet Kaur).'
);
y += 2;

subHeading('Weeks 2–3 (19–31 August 2026) — One Client Hospitalised (Two Clients in Residence)');
bodyText(
  `During weeks 2 and 3, one of the co-residents was admitted to hospital, reducing the number of participants in the home to two. ` +
  `During this period, ${participant.preferred}'s behaviours notably decreased in frequency and intensity:`
);
bulletPoint(
  '19 August — "Nino looked calm." Nil concerns noted. Staff supported shower with 2x staff. No behavioural incidents (Gurpreet Kaur).'
);
bulletPoint(
  '20 August — Followed all instructions. Some hand biting occurred but staff redirected successfully without PRN. CP staff took him out at 9am (Divya Karki).'
);
bulletPoint(
  '23–27 August — Consistently documented as "nil concerns," "happy mood," following instructions, no aggressive behaviours across multiple shifts (Gurpreet Kaur, Divya Karki).'
);
bulletPoint(
  '30 August — Some running and hand biting observed but staff successfully redirected by providing TV remote. ' +
  'No PRN required. Nino was described as "dancing and appeared in a happy mood" (Divya Karki).'
);
bulletPoint(
  '31 August — Shouting and hand biting observed "many times" but staff diverted attention by talking. ' +
  'Nino was distracted and stopped. No PRN required (Gurpreet Kaur).'
);
y += 2;

alertBox(
  'PATTERN IDENTIFIED: When 3 clients are present, Nino demonstrates heightened behaviours including physical altercations, ' +
  'PRN-requiring meltdowns, and sustained vocal escalation. When the environment is reduced to 2 clients, ' +
  'behaviours significantly decrease in frequency and severity, and can be managed through staff redirection alone without pharmacological intervention.'
);
y += 2;

bodyText(
  `This pattern strongly suggests that the current 1:3 staffing ratio is insufficient to manage ${participant.preferred}'s complex behavioural needs ` +
  `in a shared environment. The sensory demands of multiple co-residents — shared spaces, competing noise levels, interpersonal proximity, ` +
  `and shared staff attention — directly contribute to ${participant.preferred}'s behavioural escalation.`
);

// ─── PROVIDER FEEDBACK ─────────────────────────────────────────────────
sectionHeading('Provider Feedback — Recommendation for 1:1 Support');
bodyText(
  `Based on three weeks of direct service delivery and documented observations, One Life Foundation provides the following provider feedback ` +
  `regarding ${participant.preferred}'s support requirements:`
);
y += 2;

subHeading('Behaviour Management Requires Dedicated Staff');
bodyText(
  `${participant.preferred}'s behaviours of concern — including self-injurious behaviour (hand biting), vocal escalation, ` +
  `participant-to-participant conflict, impulsive running, and non-compliance — require immediate, dedicated staff response. ` +
  `When staff are simultaneously supporting other participants, response times are delayed and escalation risks increase significantly. ` +
  `The altercation on 11 August occurred precisely because one staff member was momentarily unavailable.`
);

subHeading('Safety Monitoring Cannot Be Shared');
bodyText(
  `${participant.preferred} presents with multiple concurrent safety risks that each individually require close monitoring:`
);
bulletPoint(
  'Seizure risk — Midazolam 10mg buccal must be administered within minutes of a seizure exceeding 5 minutes. This requires a staff member who knows where the medication is, can access it immediately, and is trained in buccal administration. This staff member cannot simultaneously be attending to other participants.'
);
bulletPoint(
  'Swallowing/choking risk — Nino has nearly choked twice in 18 months requiring back blows. Mealtime supervision must be direct 1:1. A staff member supervising three participants eating simultaneously cannot adequately monitor Nino\'s food size, chewing, and swallowing.'
);
bulletPoint(
  'Impulsive behaviour near hazards — Described by his mother as "fearless," Nino requires constant supervision near heights and roads. His impulsive running behaviour (documented across multiple shifts) means a staff member must be available to respond immediately.'
);
y += 2;


// ─── FUNCTIONAL IMPACT ──────────────────────────────────────────────────
sectionHeading('Functional Impact Statement');
bodyText(
  `Based on the evidence documented during ${participant.preferred}'s first two weeks at One Life Foundation's SIL property, the following functional impacts are identified:`
);
y += 2;

bulletPoint(
  `Self-injurious behaviour (hand biting) occurs when ${participant.preferred} is agitated, overstimulated, or waiting, and requires immediate staff intervention to redirect and prevent injury. This behaviour has required PRN medication administration.`,
  4
);
bulletPoint(
  `Vocal escalation and screaming episodes can occur unpredictably throughout the day and evening, impacting co-residents and requiring dedicated staff attention to prevent further escalation.`,
  4
);
bulletPoint(
  `Physical altercation with another participant required 2x staff to intervene. This occurred when staffing was momentarily reduced (one staff in bathroom), demonstrating the critical need for adequate supervision ratios at all times.`,
  4
);
bulletPoint(
  `Non-compliance and task refusal — ${participant.preferred} intermittently refuses personal care directions and does not respond to mealtime prompts, requiring extended staff time and repeated redirection.`,
  4
);
bulletPoint(
  `Toileting hygiene concerns — bathroom found soiled, indicating ${participant.preferred} requires active supervision for toileting, adding to the constant 1:1 support burden.`,
  4
);
bulletPoint(
  `Sensory-seeking behaviour — repeated TV volume escalation and physical excitement states impact co-residents and require ongoing staff monitoring and redirection.`,
  4
);
bulletPoint(
  `The combination of epilepsy (seizure risk requiring emergency Midazolam), swallowing risk (choking history), behavioural complexity (ASD + ADHD + ID), and PRN medication requirements means that ${participant.preferred} cannot safely be left in a shared staffing ratio for extended periods.`,
  4
);
y += 3;

// Signature block
checkPage(30);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...NAVY);
doc.text('Prepared by:', ML, y);
y += 8;

infoTable([
  ['Organisation', 'One Life Foundation PTY LTD'],
  ['Role', 'SIL Provider'],
  ['Contact', 'support@olfndisservices.com.au'],
  ['Date', new Date().toLocaleDateString('en-AU')],
]);


// Add footers to all pages
const totalPages = doc.internal.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  addFooter();
}

// Save
const outPath = path.resolve('Antonino_Fiorito_Behaviour_Support_Summary.pdf');
const downloadPath = 'C:/Users/kevin/Downloads/Antonino_Fiorito_Behaviour_Support_Summary_v3.pdf';
fs.writeFileSync(outPath, Buffer.from(doc.output('arraybuffer')));
fs.copyFileSync(outPath, downloadPath);
console.log('PDF saved to:', outPath);
console.log('Copied to Downloads:', downloadPath);
