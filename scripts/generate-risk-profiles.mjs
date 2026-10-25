import { createClient } from '@supabase/supabase-js';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel } from 'docx';

const sb = createClient(
  'https://czdlemutsimvwfpwylxh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGxlbXV0c2ltdndmcHd5bHhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjQ3NCwiZXhwIjoyMDkwMjQyNDc0fQ.ZueFz5cozYoC_TNUH_wX5Ak5G2PAdBMzJyrr_0gzPHk'
);

const BUCKET = 'auditor-portal';
const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0 };
  return { top: none, bottom: none, left: none, right: none };
}

function thinBorders() {
  const b = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  return { top: b, bottom: b, left: b, right: b };
}

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    borders: thinBorders(),
    shading: { fill: '309EDD', color: 'FFFFFF' },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })], spacing: { before: 60, after: 60 }, indent: { left: 80 } })],
  });
}

function cell(text, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    borders: thinBorders(),
    shading: opts.fill ? { fill: opts.fill } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text: text || '—', size: 20, font: 'Arial', bold: opts.bold, color: opts.color })],
      spacing: { before: 40, after: 40 },
      indent: { left: 80 },
    })],
  });
}

function riskColor(level) {
  if (level === 'Critical') return { fill: 'FEE2E2', color: 'DC2626' };
  if (level === 'High') return { fill: 'FEF3C7', color: 'D97706' };
  if (level === 'Medium') return { fill: 'FEF9C3', color: '92400E' };
  return { fill: 'DCFCE7', color: '166534' };
}

function riskRow(category, risk, likelihood, consequence, level, controls) {
  const rc = riskColor(level);
  return new TableRow({
    children: [
      cell(category, 12, { bold: true }),
      cell(risk, 25),
      cell(likelihood, 10),
      cell(consequence, 10),
      cell(level, 10, { bold: true, ...rc }),
      cell(controls, 33),
    ],
  });
}

function heading(text, level = HeadingLevel.HEADING_2) {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, bold: true, size: 26, font: 'Arial', color: '1E3A5F' })],
    spacing: { before: 300, after: 120 },
  });
}

function para(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: 'Arial' })],
    spacing: { before: 60, after: 60 },
  });
}

function labelValue(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: label + ': ', bold: true, size: 20, font: 'Arial' }),
      new TextRun({ text: value || '—', size: 20, font: 'Arial' }),
    ],
    spacing: { before: 40, after: 40 },
  });
}

function buildRiskProfile(p) {
  const name = `${p.first_name} ${p.last_name}`;
  const age = p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth)) / 31557600000) : 'Unknown';

  // Determine risks based on participant data
  const risks = [];

  // Health risks
  if (p.primary_disability) {
    risks.push(['Health', `Primary disability: ${p.primary_disability.split('(')[0].trim()}`, 'Likely', 'Major', 'High',
      'Individual support plan, regular health reviews, staff trained in disability-specific support, liaison with GP and specialists']);
  }
  if (p.secondary_disability) {
    const conditions = p.secondary_disability.split(';').map(s => s.trim()).filter(Boolean);
    risks.push(['Health', `Multiple comorbidities: ${conditions.slice(0, 3).join(', ')}${conditions.length > 3 ? ' + others' : ''}`, 'Likely', 'Major', 'High',
      'Comprehensive health management plan, regular monitoring, medication management support, specialist referrals maintained']);
  }

  // Medication risks
  if (p.medications_summary) {
    const complex = p.medications_summary.toLowerCase().includes('complex') || p.medications_summary.toLowerCase().includes('insulin') || p.medications_summary.toLowerCase().includes('multiple');
    risks.push(['Medication', 'Complex medication regimen requiring support', complex ? 'Almost Certain' : 'Likely', 'Major', complex ? 'Critical' : 'High',
      'Webster packs, medication administration support, staff trained in medication management, BGL monitoring as required, pharmacy liaison']);
  }

  // Mobility risks
  if (p.mobility && (p.mobility.toLowerCase().includes('wheelchair') || p.mobility.toLowerCase().includes('non-ambulant') || p.mobility.toLowerCase().includes('hoist'))) {
    risks.push(['Safety', 'Falls and mobility-related injury', 'Likely', 'Major', 'High',
      'Manual handling protocols, hoist and sling use, regular repositioning, mobility aids maintained, staff trained in safe transfers']);
  } else if (p.mobility && p.mobility.toLowerCase().includes('variable')) {
    risks.push(['Safety', 'Variable mobility — falls risk', 'Possible', 'Moderate', 'Medium',
      'Mobility aids available, staff awareness of fluctuating mobility, environmental hazards assessed']);
  }

  // Behavioral/mental health risks
  if (p.notes && (p.notes.toLowerCase().includes('self-harm') || p.notes.toLowerCase().includes('suicidal'))) {
    risks.push(['Behavioural', 'Self-harm and suicidal ideation', 'Possible', 'Catastrophic', 'Critical',
      'Mental health safety plan, crisis contacts documented, trauma-informed care approach, counsellor/psychologist engaged, staff trained in mental health first aid']);
  }
  if (p.notes && p.notes.toLowerCase().includes('dysregulation')) {
    risks.push(['Behavioural', 'Emotional dysregulation and verbal outbursts', 'Likely', 'Moderate', 'High',
      'Positive behaviour support plan, consistent routines, advance notice of changes, de-escalation strategies, BSP practitioner engaged']);
  }
  if (p.bio && p.bio.toLowerCase().includes('seizure')) {
    risks.push(['Health', 'Seizure activity requiring active monitoring', 'Likely', 'Major', 'High',
      'Seizure management plan, active overnight monitoring, post-seizure protocol, emergency contacts accessible, staff trained in seizure response']);
  }

  // Communication risks
  if (p.communication_needs && (p.communication_needs.toLowerCase().includes('difficulty') || p.communication_needs.toLowerCase().includes('struggle'))) {
    risks.push(['Communication', 'Intermittent communication difficulty', 'Possible', 'Moderate', 'Medium',
      'Communication plan documented, alternative communication methods available, staff trained in participant communication preferences']);
  }

  // Sensory risks
  if (p.notes && p.notes.toLowerCase().includes('sensory')) {
    risks.push(['Sensory', 'Severe sensory sensitivities causing distress', 'Likely', 'Moderate', 'High',
      'Sensory profile documented, environmental modifications in place, staff aware of triggers, quiet spaces available, OT consultation']);
  }

  // Environmental/housing risks
  if (p.location && p.location.toLowerCase().includes('epping')) {
    risks.push(['Environmental', 'SIL accommodation safety and emergency evacuation', 'Unlikely', 'Major', 'Medium',
      'Fire safety plan, emergency evacuation procedure, regular fire drills, emergency contacts posted, property inspections current']);
  }

  // Skin integrity / pressure injury
  if (p.secondary_disability && (p.secondary_disability.toLowerCase().includes('wound') || p.secondary_disability.toLowerCase().includes('pressure'))) {
    risks.push(['Health', 'Pressure injury and wound management', 'Almost Certain', 'Major', 'Critical',
      'Wound care plan, regular repositioning schedule, pressure area care protocol, wound assessment charts, nursing oversight']);
  }

  // Dietary risks
  if (p.dietary_requirements && (p.dietary_requirements.toLowerCase().includes('bgl') || p.dietary_requirements.toLowerCase().includes('diabetes') || p.dietary_requirements.toLowerCase().includes('fluid restriction'))) {
    risks.push(['Health', 'Dietary management and nutritional risks', 'Likely', 'Moderate', 'High',
      'Dietary plan documented, fluid restriction chart (if applicable), BGL monitoring, meal assistance as required, dietitian referral']);
  }

  // Infection risk
  if (p.secondary_disability && p.secondary_disability.toLowerCase().includes('cellulitis')) {
    risks.push(['Health', 'Infection risk (cellulitis history)', 'Possible', 'Major', 'High',
      'Skin integrity monitoring, wound care protocols, infection control measures, early escalation to GP if signs of infection']);
  }

  // Dialysis risk
  if (p.secondary_disability && p.secondary_disability.toLowerCase().includes('dialysis')) {
    risks.push(['Health', 'Haemodialysis management and transport', 'Almost Certain', 'Major', 'Critical',
      'Dialysis schedule documented, transport arrangements confirmed, post-dialysis monitoring, emergency contact for renal unit']);
  }

  // Gambling/substance
  if (p.notes && p.notes.toLowerCase().includes('gambling')) {
    risks.push(['Behavioural', 'Impulsive gambling and alcohol use as coping', 'Possible', 'Moderate', 'Medium',
      'Financial safeguarding awareness, support worker guidance, counsellor engaged for coping strategies']);
  }

  // Isolation risk
  if (p.notes && p.notes.toLowerCase().includes('housebound')) {
    risks.push(['Social', 'Social isolation and reduced community participation', 'Likely', 'Moderate', 'High',
      'Community access goals in support plan, regular social activities scheduled, family contact maintained']);
  }

  // Default risk if few identified
  if (risks.length < 3) {
    risks.push(['General', 'Inadequate or inconsistent support delivery', 'Possible', 'Moderate', 'Medium',
      'Individual support plan reviewed regularly, staff supervision, incident reporting protocols, participant feedback mechanisms']);
    risks.push(['General', 'Privacy and confidentiality breach', 'Unlikely', 'Moderate', 'Low',
      'Privacy policy, staff confidentiality agreements, secure records management, data minimisation']);
  }

  const sections = [];

  // Title
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'INDIVIDUAL RISK PROFILE', bold: true, size: 36, font: 'Arial', color: '1E3A5F' })],
    spacing: { after: 60 },
  }));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'One Life Foundation — NDIS Support Services', size: 22, font: 'Arial', color: '309EDD' })],
    spacing: { after: 200 },
  }));

  // Participant details
  sections.push(heading('Participant Details'));
  sections.push(labelValue('Full Name', name));
  sections.push(labelValue('Preferred Name', p.preferred_name || p.first_name));
  sections.push(labelValue('Date of Birth', p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) + ` (${age} years)` : '—'));
  sections.push(labelValue('NDIS Number', p.ndis_number));
  sections.push(labelValue('Address', p.location));
  sections.push(labelValue('Status', (p.status || 'active').charAt(0).toUpperCase() + (p.status || 'active').slice(1)));
  sections.push(labelValue('Support Level', p.support_level));
  sections.push(labelValue('Funding Ratio', p.funding_ratio));
  sections.push(labelValue('Primary Disability', p.primary_disability));
  if (p.secondary_disability) sections.push(labelValue('Secondary Conditions', p.secondary_disability));

  // Emergency contacts
  sections.push(heading('Emergency Contacts'));
  if (p.emergency_contact_name) {
    sections.push(labelValue('Emergency Contact', `${p.emergency_contact_name} (${p.emergency_contact_relationship || 'N/A'}) — ${p.emergency_contact_phone || 'N/A'}`));
  }
  sections.push(labelValue('GP', `${p.gp_name || '—'} — ${p.gp_clinic || ''} ${p.gp_phone || ''}`));
  if (p.support_coordinator_name) sections.push(labelValue('Support Coordinator', `${p.support_coordinator_name} — ${p.support_coordinator_organisation || ''} ${p.support_coordinator_phone || ''}`));
  if (p.bsp_name) sections.push(labelValue('Behaviour Support', `${p.bsp_name} — ${p.bsp_organisation || ''} ${p.bsp_phone || ''}`));
  if (p.pharmacy_name) sections.push(labelValue('Pharmacy', `${p.pharmacy_name} — ${p.pharmacy_address || ''} ${p.pharmacy_phone || ''}`));

  // Risk Assessment Table
  sections.push(heading('Risk Assessment'));
  sections.push(para('The following risks have been identified based on the participant\'s profile, health needs, and support requirements. Risk ratings use the standard likelihood x consequence matrix.'));

  const riskTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          headerCell('Category', 12),
          headerCell('Risk Description', 25),
          headerCell('Likelihood', 10),
          headerCell('Consequence', 10),
          headerCell('Risk Level', 10),
          headerCell('Control Measures', 33),
        ],
      }),
      ...risks.map(r => riskRow(...r)),
    ],
  });
  sections.push(riskTable);

  // Risk Matrix Legend
  sections.push(heading('Risk Matrix', HeadingLevel.HEADING_3));
  sections.push(para('Likelihood: Rare | Unlikely | Possible | Likely | Almost Certain'));
  sections.push(para('Consequence: Insignificant | Minor | Moderate | Major | Catastrophic'));
  sections.push(para('Risk Level: Low (green) | Medium (yellow) | High (amber) | Critical (red)'));

  // Key support needs
  sections.push(heading('Key Support Requirements'));
  if (p.communication_needs) sections.push(labelValue('Communication', p.communication_needs));
  if (p.mobility) sections.push(labelValue('Mobility', p.mobility));
  if (p.dietary_requirements) sections.push(labelValue('Dietary', p.dietary_requirements));
  if (p.medications_summary) sections.push(labelValue('Medications', p.medications_summary));
  if (p.allergies) sections.push(labelValue('Allergies / Sensitivities', p.allergies));

  // Review
  sections.push(heading('Review'));
  sections.push(para(`This risk profile was generated on ${today} and should be reviewed:`));
  sections.push(para('- At minimum every 12 months'));
  sections.push(para('- Following any significant incident'));
  sections.push(para('- When participant needs or circumstances change'));
  sections.push(para('- As part of support plan review'));

  // Signatures
  sections.push(heading('Acknowledgement'));
  sections.push(new Paragraph({ children: [], spacing: { before: 200 } }));
  sections.push(labelValue('Prepared by', 'One Life Foundation'));
  sections.push(labelValue('Date', today));
  sections.push(new Paragraph({ children: [], spacing: { before: 200 } }));
  sections.push(para('Staff Signature: ___________________________    Date: _______________'));
  sections.push(new Paragraph({ children: [], spacing: { before: 100 } }));
  sections.push(para('Manager Signature: _________________________    Date: _______________'));

  return new Document({
    sections: [{ children: sections }],
  });
}

// Main
const { data: participants } = await sb.from('participants').select('*').order('first_name');
const { data: folders } = await sb.from('auditor_folders').select('id, name').is('parent_id', null);
const partFolder = folders.find(f => f.name === 'Participant Files');

if (!partFolder) {
  console.error('Participant Files folder not found in audit portal');
  process.exit(1);
}

await sb.storage.createBucket(BUCKET, { public: false }).catch(() => {});

for (const p of participants) {
  const name = `${p.first_name} ${p.last_name}`;
  console.log(`Generating risk profile for ${name}...`);

  const doc = buildRiskProfile(p);
  const buffer = await Packer.toBuffer(doc);
  const fileName = `Risk Profile — ${name}.docx`;

  const { error } = await sb.storage.from(BUCKET).upload(
    `${partFolder.id}/${fileName}`,
    buffer,
    { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', upsert: true }
  );

  if (error) {
    console.error(`  FAILED: ${error.message}`);
  } else {
    console.log(`  Uploaded: ${fileName} (${(buffer.length / 1024).toFixed(0)} KB)`);
  }
}

console.log('Done!');
