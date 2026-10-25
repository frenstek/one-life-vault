/**
 * create-hi-guides-batch2.mjs
 *
 * Generates:
 *   OLF-TG-HI-004 Medication Management Guide
 *   OLF-TG-HI-005 Waste Management Guide
 *
 * Same style as existing HI training guides (catheter, wound, diabetes).
 * Saves to Downloads + uploads to Supabase.
 *
 * Usage: node scripts/create-hi-guides-batch2.mjs
 */

import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');

const SUPA_URL = 'https://czdlemutsimvwfpwylxh.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk';
const sb = createClient(SUPA_URL, SUPA_KEY);

const BUCKET = 'documents';

// Colors
const OLF_GREEN = [14, 160, 62];
const DARK = [30, 41, 59];
const GREY = [100, 116, 139];
const LIGHT_BG = [248, 250, 252];
const WHITE = [255, 255, 255];
const TABLE_BORDER = [226, 232, 240];
const TH_BG = [240, 253, 244];
const TH_TEXT = [14, 120, 50];
const RED = [220, 38, 38];
const AMBER = [217, 119, 6];
const BLUE = [37, 99, 235];

const ML = 22, MR = 20, PW = 210, PH = 297, MT = 30, MB = 22;
const CW = PW - ML - MR;

const logoPath = path.join(PROJECT, 'public', 'logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUrl = 'data:image/png;base64,' + logoBase64;

function createGuide(config) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MT;
  let pageNum = 1;

  function header() {
    if (pageNum === 1) return;
    try { doc.addImage(logoDataUrl, 'PNG', ML, 8, 15, 7.5); } catch {}
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GREY);
    doc.text(config.title, PW - MR, 14, { align: 'right' });
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
    doc.line(ML, 20, PW - MR, 20);
  }

  function footer() {
    if (pageNum === 1) return;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GREY);
    doc.text(`${pageNum} | Page`, PW - MR, PH - 12, { align: 'right' });
    doc.setFontSize(7); doc.setTextColor(180, 180, 180);
    doc.text('One Life Foundation | ' + config.docId + ' | Version 1.0', ML, PH - 12);
  }

  function newPage() {
    footer();
    doc.addPage();
    pageNum++;
    header();
    y = MT;
  }

  function checkSpace(needed) {
    if (y + needed > PH - MB) newPage();
  }

  function sectionTitle(num, title) {
    checkSpace(14);
    doc.setFillColor(...OLF_GREEN);
    doc.roundedRect(ML, y, CW, 10, 1.5, 1.5, 'F');
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
    doc.text(`${num}. ${title}`, ML + 5, y + 7);
    y += 14;
  }

  function subTitle(text) {
    checkSpace(10);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...OLF_GREEN);
    doc.text(text, ML, y);
    y += 6;
  }

  function para(text) {
    checkSpace(8);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(text, CW);
    for (const line of lines) {
      checkSpace(5);
      doc.text(line, ML, y);
      y += 4.5;
    }
    y += 2;
  }

  function bullet(text) {
    checkSpace(6);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...OLF_GREEN);
    doc.text('•', ML + 3, y);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(text, CW - 10);
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) checkSpace(5);
      doc.text(lines[i], ML + 8, y);
      y += 4.5;
    }
  }

  function numberedItem(num, text, color) {
    checkSpace(8);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...(color || OLF_GREEN));
    doc.text(`${num}.`, ML + 3, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(text, CW - 12);
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) checkSpace(5);
      doc.text(lines[i], ML + 10, y);
      y += 4.5;
    }
    y += 1;
  }

  function warningBox(title, text) {
    checkSpace(20);
    const lines = doc.splitTextToSize(text, CW - 16);
    const boxH = 10 + lines.length * 4.5;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.5);
    doc.roundedRect(ML, y, CW, boxH, 1.5, 1.5, 'FD');
    doc.setLineWidth(1.5);
    doc.line(ML, y, ML, y + boxH);
    y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...RED);
    doc.text(title.toUpperCase(), ML + 6, y);
    y += 5;
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(153, 27, 27);
    for (const line of lines) { doc.text(line, ML + 6, y); y += 4.5; }
    y += 4;
  }

  function infoBox(title, text) {
    checkSpace(20);
    const lines = doc.splitTextToSize(text, CW - 16);
    const boxH = 10 + lines.length * 4.5;
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.roundedRect(ML, y, CW, boxH, 1.5, 1.5, 'FD');
    doc.setLineWidth(1.5);
    doc.line(ML, y, ML, y + boxH);
    y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE);
    doc.text(title.toUpperCase(), ML + 6, y);
    y += 5;
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 64, 175);
    for (const line of lines) { doc.text(line, ML + 6, y); y += 4.5; }
    y += 4;
  }

  function simpleTable(headers, rows) {
    checkSpace(10 + rows.length * 7);
    const colW = CW / headers.length;
    // Header
    doc.setFillColor(...TH_BG);
    doc.rect(ML, y, CW, 7, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...TH_TEXT);
    headers.forEach((h, i) => doc.text(h, ML + i * colW + 2, y + 5));
    y += 7;
    // Rows
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
    rows.forEach((row, ri) => {
      checkSpace(7);
      if (ri % 2 === 1) { doc.setFillColor(...LIGHT_BG); doc.rect(ML, y, CW, 7, 'F'); }
      doc.setDrawColor(...TABLE_BORDER); doc.line(ML, y + 7, ML + CW, y + 7);
      row.forEach((cell, ci) => {
        const lines = doc.splitTextToSize(String(cell), colW - 4);
        doc.text(lines[0] || '', ML + ci * colW + 2, y + 5);
      });
      y += 7;
    });
    y += 4;
  }

  // ═══════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════
  try { doc.addImage(logoDataUrl, 'PNG', PW / 2 - 15, 40, 30, 15); } catch {}

  doc.setFontSize(24); doc.setFont('helvetica', 'bold'); doc.setTextColor(...OLF_GREEN);
  doc.text(config.title, PW / 2, 80, { align: 'center' });

  doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GREY);
  doc.text('High Intensity Supports — Training Guide', PW / 2, 92, { align: 'center' });

  doc.setFontSize(10); doc.setTextColor(...DARK);
  doc.text(config.docId, PW / 2, 105, { align: 'center' });

  doc.setFillColor(...OLF_GREEN);
  doc.roundedRect(PW / 2 - 40, 115, 80, 30, 2, 2, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
  doc.text('Version 1.0', PW / 2, 124, { align: 'center' });
  doc.text('Effective: 1 January 2026', PW / 2, 130, { align: 'center' });
  doc.text('Review: 1 January 2027', PW / 2, 136, { align: 'center' });

  doc.setFontSize(9); doc.setTextColor(...GREY);
  doc.text('One Life Foundation', PW / 2, 160, { align: 'center' });
  doc.text('ABN: 12 345 678 901', PW / 2, 166, { align: 'center' });
  doc.text('NDIS Registered Provider', PW / 2, 172, { align: 'center' });

  // Build content
  newPage();
  config.buildContent({ sectionTitle, subTitle, para, bullet, numberedItem, warningBox, infoBox, simpleTable, checkSpace, newPage });

  footer();
  return doc;
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDICATION MANAGEMENT GUIDE
// ═══════════════════════════════════════════════════════════════════════════

const medGuide = {
  title: 'Medication Management Guide',
  docId: 'OLF-TG-HI-004',
  filename: 'OLF-TG-HI-004 Medication Management Guide.pdf',
  storagePath: 'Training & Development/OLF-TG-HI-004 Medication Management Guide.pdf',
  buildContent: ({ sectionTitle, subTitle, para, bullet, numberedItem, warningBox, infoBox, simpleTable, checkSpace, newPage }) => {

    sectionTitle(1, 'Purpose & Scope');
    para('This guide provides support workers with the knowledge and procedures required to safely assist participants with medication management under NDIS High Intensity Supports. Medication support is a high-risk activity that requires specific training, competency assessment, and strict adherence to protocols.');
    para('This guide covers: medication prompting, medication administration, medication storage, documentation, error management, and emergency procedures.');
    warningBox('Important', 'Support workers must NOT administer medication unless they have completed medication management training, been assessed as competent, and are authorised to do so under the participant\'s care plan. Administering medication without authorisation is a breach of NDIS Practice Standards and may constitute a criminal offence.');

    sectionTitle(2, 'Levels of Medication Support');
    simpleTable(
      ['Level', 'Description', 'Who Can Provide'],
      [
        ['Prompting', 'Reminding participant to take their own medication at the correct time', 'Any trained support worker'],
        ['Assisting', 'Helping participant access medication (opening bottles, reading labels, pouring liquids)', 'Trained support worker with competency sign-off'],
        ['Administering', 'Physically giving medication to participant (placing in mouth, applying topical, injections)', 'Support worker with medication administration training + competency assessment'],
        ['Managing', 'Ordering, collecting, storing, monitoring, and disposing of medications', 'Senior support worker / team leader under RN supervision'],
      ]
    );

    sectionTitle(3, 'The 7 Rights of Medication Administration');
    para('Before giving ANY medication, check ALL seven rights:');
    numberedItem(1, 'Right PERSON — Confirm the participant\'s identity. Check the medication chart matches the person in front of you.');
    numberedItem(2, 'Right MEDICATION — Read the label carefully. Check the medication name matches the chart. Do NOT rely on the colour or shape of the tablet.');
    numberedItem(3, 'Right DOSE — Check the dose on the chart. Count tablets. Measure liquids accurately using a syringe or medicine cup.');
    numberedItem(4, 'Right TIME — Administer at the correct scheduled time. Check if the medication is "before food", "with food", or "after food".');
    numberedItem(5, 'Right ROUTE — Oral (mouth), topical (skin), subcutaneous (injection), inhaled, eye drops, ear drops — confirm the route matches the chart.');
    numberedItem(6, 'Right DOCUMENTATION — Record immediately after administration. Never pre-sign or sign before giving.');
    numberedItem(7, 'Right to REFUSE — Participants have the right to refuse medication. Document the refusal, do not force, and report to the team leader and/or nurse.');
    warningBox('Never', 'Never crush, break, or mix medication with food unless specifically authorised in the medication chart by the prescribing doctor or pharmacist. Some medications are dangerous if crushed (e.g., slow-release, enteric-coated).');

    sectionTitle(4, 'Medication Administration Procedure');
    subTitle('Before Administering');
    numberedItem(1, 'Wash hands thoroughly with soap and water or alcohol-based hand rub');
    numberedItem(2, 'Collect the medication chart and the medication');
    numberedItem(3, 'Check the 7 Rights');
    numberedItem(4, 'Check the expiry date on the medication packaging');
    numberedItem(5, 'Check for any allergies listed on the medication chart');
    numberedItem(6, 'If using a Webster pack / dose administration aid (DAA), check the correct compartment for the day and time');

    subTitle('During Administration');
    numberedItem(1, 'Present the medication to the participant and explain what you are giving');
    numberedItem(2, 'Observe the participant taking the medication (do not leave medication unattended for self-administration unless care plan allows)');
    numberedItem(3, 'For liquid medications — measure using the provided syringe or cup, administer slowly');
    numberedItem(4, 'For eye/ear drops — follow the specific technique for the route');
    numberedItem(5, 'For insulin injections — follow the Diabetes Management Guide (OLF-TG-HI-003) and the participant\'s insulin administration plan');
    numberedItem(6, 'Offer water to assist with swallowing tablets/capsules');

    subTitle('After Administration');
    numberedItem(1, 'Sign the medication chart immediately — date, time, initials');
    numberedItem(2, 'Document in the participant\'s progress notes');
    numberedItem(3, 'Observe the participant for any adverse reactions for at least 15 minutes');
    numberedItem(4, 'Return medication to secure storage');
    numberedItem(5, 'Wash hands');

    sectionTitle(5, 'PRN (As Needed) Medications');
    para('PRN medications are only given when specific conditions are met (e.g., pain, nausea, anxiety). Before administering PRN medication:');
    bullet('Check the PRN protocol on the medication chart — what condition triggers it, maximum dose, minimum time between doses');
    bullet('Assess the participant\'s condition — ask them to describe their symptoms');
    bullet('Document the reason for giving the PRN medication');
    bullet('Monitor the participant after administration and document whether it was effective');
    bullet('If PRN medication is used frequently, report this to the team leader/nurse for review');

    sectionTitle(6, 'Medication Storage');
    bullet('Store all medications in a locked cupboard or cabinet at room temperature (15–25°C) unless the label states "keep refrigerated"');
    bullet('Refrigerated medications: store in a dedicated medication section of the fridge (2–8°C). Do NOT store in the freezer or door compartment');
    bullet('Keep medications in their original packaging with the label intact');
    bullet('Do NOT store medications in bathrooms (humidity) or in direct sunlight');
    bullet('Controlled substances (Schedule 8 — e.g., opioids, benzodiazepines): must be stored in a separate locked container within the locked cupboard. Count and document at every shift handover');
    bullet('Insulin: store unopened in the fridge. Once opened, store at room temperature for up to 28 days (check specific insulin instructions)');

    sectionTitle(7, 'Medication Errors');
    para('A medication error is any deviation from the prescribed medication order. This includes wrong dose, wrong time, wrong person, missed dose, or wrong medication.');
    subTitle('If a medication error occurs:');
    numberedItem(1, 'Ensure the participant is safe — assess for any immediate adverse effects', RED);
    numberedItem(2, 'If the participant shows signs of distress, difficulty breathing, allergic reaction, or loss of consciousness — CALL 000 IMMEDIATELY', RED);
    numberedItem(3, 'Contact Poison Information Centre on 13 11 26 for advice if unsure of severity', RED);
    numberedItem(4, 'Notify the team leader / on-call nurse immediately', RED);
    numberedItem(5, 'Notify the participant\'s GP', RED);
    numberedItem(6, 'Complete an Incident Report in the OLF system', RED);
    numberedItem(7, 'Document the error, actions taken, and participant\'s condition in progress notes', RED);
    numberedItem(8, 'Do NOT discard any evidence (packaging, remaining medication)', RED);
    warningBox('Never', 'Never try to hide a medication error. Early reporting saves lives. All errors are investigated to prevent recurrence — not to blame.');

    sectionTitle(8, 'Handover & Shift Change');
    para('At every shift change, the outgoing worker must hand over medication information to the incoming worker:');
    bullet('What medications were given during the shift (check the medication chart)');
    bullet('Any PRN medications given — reason, time, effectiveness');
    bullet('Any medications refused by the participant');
    bullet('Any changes to the medication chart (new medications, dose changes, ceased medications)');
    bullet('Any concerns or observations (side effects, allergic reactions, running low on supply)');
    bullet('Controlled substance count — both workers count and sign');

    sectionTitle(9, 'Emergency Contacts');
    simpleTable(
      ['Service', 'Number'],
      [
        ['Emergency (Police/Fire/Ambulance)', '000'],
        ['Poison Information Centre', '13 11 26'],
        ['One Life Foundation On-Call', 'As per roster'],
        ['Participant GP', 'As per care plan'],
        ['Pharmacy', 'As per medication chart'],
      ]
    );
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// WASTE MANAGEMENT GUIDE
// ═══════════════════════════════════════════════════════════════════════════

const wasteGuide = {
  title: 'Waste Management Guide',
  docId: 'OLF-TG-HI-005',
  filename: 'OLF-TG-HI-005 Waste Management Guide.pdf',
  storagePath: 'Training & Development/OLF-TG-HI-005 Waste Management Guide.pdf',
  buildContent: ({ sectionTitle, subTitle, para, bullet, numberedItem, warningBox, infoBox, simpleTable, checkSpace, newPage }) => {

    sectionTitle(1, 'Purpose & Scope');
    para('This guide provides support workers with the knowledge and procedures required to safely handle, segregate, and dispose of waste generated during high intensity support activities in participant homes and One Life Foundation properties.');
    para('Proper waste management protects support workers, participants, visitors, and the environment from infection, injury, and contamination. It is a requirement under the NDIS Practice Standards, Work Health and Safety legislation, and Environmental Protection regulations.');

    sectionTitle(2, 'Waste Categories');
    simpleTable(
      ['Category', 'Examples', 'Container', 'Disposal Method'],
      [
        ['General Waste', 'Food scraps, packaging, paper towels, non-contaminated gloves', 'Regular bin (black/green bag)', 'Normal council collection'],
        ['Clinical / Infectious Waste', 'Used wound dressings, blood-soaked materials, continence aids with blood, catheter bags', 'Yellow clinical waste bag or bin', 'Licensed clinical waste contractor'],
        ['Sharps', 'Needles, syringes, lancets, insulin pens, broken glass contaminated with blood', 'Yellow sharps container (AS 4031)', 'Sharps container returned to pharmacy or clinical waste contractor'],
        ['Pharmaceutical Waste', 'Expired medications, unused medications, cytotoxic drugs', 'Return to pharmacy', 'Pharmacy Return Unwanted Medicines (RUM) program'],
        ['Recyclable Waste', 'Clean cardboard, plastic bottles, aluminium cans, paper', 'Recycling bin (yellow lid)', 'Normal council recycling collection'],
        ['Chemical Waste', 'Cleaning chemicals, disinfectants (if bulk disposal needed)', 'Original container', 'Local council chemical collection or licensed disposal'],
      ]
    );

    sectionTitle(3, 'Waste Segregation — The Golden Rule');
    warningBox('Critical', 'NEVER mix clinical/infectious waste with general waste. NEVER put sharps in any bag or bin — ONLY in a sharps container. Getting this wrong puts cleaners, waste collectors, and the public at risk of needlestick injury and infection.');
    para('When in doubt about which category waste falls into, treat it as clinical waste. It is always safer to over-classify than under-classify.');

    sectionTitle(4, 'Sharps Management');
    subTitle('What is a Sharp?');
    bullet('Needles (insulin pens, injection needles)');
    bullet('Syringes with attached needles');
    bullet('Lancets (finger-prick devices for blood glucose testing)');
    bullet('Broken glass contaminated with blood or body fluids');
    bullet('Any item that could cut or puncture skin and is contaminated with blood/body fluids');

    subTitle('Sharps Container Rules');
    numberedItem(1, 'Use ONLY an approved AS 4031-compliant sharps container (yellow, puncture-resistant, with a secure lid)');
    numberedItem(2, 'Place the sharps container within arm\'s reach BEFORE starting the procedure');
    numberedItem(3, 'Immediately after use, place the sharp directly into the container — do NOT recap needles');
    numberedItem(4, 'Do NOT fill the container above the marked fill line (usually 3/4 full)');
    numberedItem(5, 'When the container reaches the fill line, seal it and arrange disposal (return to pharmacy or clinical waste contractor)');
    numberedItem(6, 'NEVER reach into a sharps container');
    numberedItem(7, 'NEVER transfer sharps from one container to another');
    numberedItem(8, 'Label the container with the participant\'s address and the date sealed');

    warningBox('Needlestick Injury — What To Do', '1. Allow the wound to bleed freely — do NOT squeeze\n2. Wash the area with soap and warm running water\n3. Apply antiseptic and a waterproof dressing\n4. Report to your supervisor IMMEDIATELY\n5. Seek medical attention (GP or hospital ED) within 1 hour\n6. Complete an Incident Report in the OLF system\n7. The source person (participant) may need to be tested — this requires consent and is managed by the treating doctor');

    sectionTitle(5, 'Clinical / Infectious Waste');
    subTitle('What counts as clinical waste?');
    bullet('Used wound dressings (with blood or body fluid)');
    bullet('Blood-soaked materials');
    bullet('Continence aids heavily soiled with blood');
    bullet('Used catheter bags and tubing');
    bullet('Used dialysis waste');
    bullet('PPE contaminated with blood or body fluids (gloves, aprons)');
    bullet('Any material that has been in contact with open wounds, blood, or infectious body fluids');

    subTitle('Handling Clinical Waste');
    numberedItem(1, 'Always wear appropriate PPE (gloves at minimum; apron and eye protection if splash risk)');
    numberedItem(2, 'Place clinical waste directly into a yellow clinical waste bag');
    numberedItem(3, 'Tie the bag securely when 3/4 full');
    numberedItem(4, 'Do NOT compress or compact clinical waste bags');
    numberedItem(5, 'Store sealed clinical waste bags in a designated area away from general waste, food, and public access');
    numberedItem(6, 'Arrange collection by a licensed clinical waste contractor (as per OLF contract)');

    infoBox('Note', 'Lightly soiled continence aids (urine only, no blood) can generally be disposed of as general waste in a sealed bag. If in doubt, treat as clinical waste.');

    sectionTitle(6, 'Pharmaceutical Waste — Medication Disposal');
    para('Medications must NEVER be disposed of in general waste, flushed down the toilet, or poured down the drain.');
    subTitle('How to dispose of medications:');
    numberedItem(1, 'Expired or ceased medications: Return to the participant\'s pharmacy through the RUM (Return Unwanted Medicines) program — this is a free service at all Australian pharmacies');
    numberedItem(2, 'Partially used Webster packs / dose administration aids: Return to pharmacy');
    numberedItem(3, 'Unused insulin pens / cartridges: Return to pharmacy');
    numberedItem(4, 'Cytotoxic medications (chemotherapy drugs): These are hazardous — handle with gloves, store separately, return to pharmacy or hospital. Do NOT place in general or clinical waste');
    numberedItem(5, 'Controlled substances (Schedule 8): Must be witnessed by two staff members when disposing. Document the disposal including drug name, quantity, date, and both witnesses\' signatures. Return to pharmacy.');

    sectionTitle(7, 'Personal Protective Equipment (PPE) for Waste Handling');
    simpleTable(
      ['Waste Type', 'Minimum PPE Required'],
      [
        ['General waste', 'Standard hand hygiene (wash hands after)'],
        ['Clinical / infectious waste', 'Disposable gloves + plastic apron. Add eye protection if splash risk.'],
        ['Sharps', 'Disposable gloves. Use sharps container — do NOT handle sharps with bare hands.'],
        ['Pharmaceutical waste', 'Disposable gloves. Double gloves for cytotoxic drugs.'],
        ['Chemical waste', 'Gloves appropriate for the chemical (check SDS). Eye protection if splash risk.'],
      ]
    );

    sectionTitle(8, 'Spill Management');
    subTitle('Blood / Body Fluid Spill:');
    numberedItem(1, 'Put on PPE (gloves, apron, eye protection if needed)');
    numberedItem(2, 'Cover the spill with paper towels or absorbent material');
    numberedItem(3, 'Apply hospital-grade disinfectant or a 1:10 bleach solution (1 part bleach to 9 parts water) — leave for 10 minutes');
    numberedItem(4, 'Wipe up with paper towels, working from the outside of the spill inward');
    numberedItem(5, 'Dispose of all materials in a yellow clinical waste bag');
    numberedItem(6, 'Clean the area again with detergent and water');
    numberedItem(7, 'Remove PPE and wash hands thoroughly');
    numberedItem(8, 'Document the spill in progress notes');

    subTitle('Chemical Spill:');
    numberedItem(1, 'Refer to the Safety Data Sheet (SDS) for the specific chemical');
    numberedItem(2, 'Ventilate the area (open windows)');
    numberedItem(3, 'Contain the spill with absorbent material');
    numberedItem(4, 'Do NOT mix chemicals');
    numberedItem(5, 'Report to supervisor');

    sectionTitle(9, 'Documentation & Reporting');
    bullet('Document any clinical waste generation in the participant\'s progress notes');
    bullet('Report any sharps injuries or blood/body fluid exposure as an incident immediately');
    bullet('Maintain a waste disposal log if the property generates regular clinical waste');
    bullet('Report any issues with waste collection, overflowing bins, or unavailable sharps containers to the team leader');

    sectionTitle(10, 'Key Contacts');
    simpleTable(
      ['Service', 'Number'],
      [
        ['Emergency (Police/Fire/Ambulance)', '000'],
        ['Poison Information Centre', '13 11 26'],
        ['One Life Foundation On-Call', 'As per roster'],
        ['Clinical Waste Contractor', 'As per OLF contract'],
        ['EPA Victoria (environmental incidents)', '1300 372 842'],
        ['WorkSafe Victoria (workplace injuries)', '1800 136 089'],
      ]
    );
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BUILD & UPLOAD
// ═══════════════════════════════════════════════════════════════════════════

async function buildAndUpload(config) {
  console.log(`Building ${config.docId} — ${config.title}...`);
  const pdfDoc = createGuide(config);
  const buf = Buffer.from(pdfDoc.output('arraybuffer'));

  // Save locally
  const outPath = `C:/Users/kevin/Downloads/${config.filename}`;
  fs.writeFileSync(outPath, buf);
  console.log(`  Saved: ${outPath}`);

  // Upload to Supabase
  const { error: upErr } = await sb.storage.from(BUCKET).upload(config.storagePath, buf, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (upErr) {
    console.log(`  Upload error: ${upErr.message}`);
  } else {
    console.log(`  Uploaded: ${config.storagePath}`);
  }
}

(async () => {
  await buildAndUpload(medGuide);
  await buildAndUpload(wasteGuide);
  console.log('\nDone! Both guides generated and uploaded.');
})();
