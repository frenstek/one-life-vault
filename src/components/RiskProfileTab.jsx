import { useState, useEffect } from 'react';
import {
  HiShieldExclamation, HiPlus, HiPencilSquare, HiTrash,
  HiCheckCircle, HiXMark, HiSparkles, HiExclamationTriangle,
  HiArrowPath, HiArrowDownTray,
} from 'react-icons/hi2';
import { createRiskProfile, updateRiskProfile, deleteRiskProfile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toLocalDate } from '../lib/dates';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = ['Health', 'Safety', 'Behavioural', 'Communication', 'Medication', 'Environmental', 'Social', 'Sensory'];
const LIKELIHOODS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
const CONSEQUENCES = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const CATEGORY_COLORS = {
  Health: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  Safety: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  Behavioural: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  Communication: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  Medication: 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  Environmental: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Social: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  Sensory: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
};

const RISK_LEVEL_COLORS = {
  Critical: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800',
  High: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
  Medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800',
  Low: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800',
};

const OVERALL_LEVEL_STYLES = {
  Critical: 'bg-red-600 text-white',
  High: 'bg-amber-500 text-white',
  Medium: 'bg-yellow-400 text-yellow-900',
  Low: 'bg-green-500 text-white',
};

// ─── Risk Level Matrix ───────────────────────────────────────────────────────

function calculateRiskLevel(likelihood, consequence) {
  const l = LIKELIHOODS.indexOf(likelihood);
  const c = CONSEQUENCES.indexOf(consequence);
  if (l < 0 || c < 0) return 'Low';

  // 5x5 matrix: rows = likelihood (0=Rare..4=Almost Certain), cols = consequence (0=Insignificant..4=Catastrophic)
  const matrix = [
    // Insignificant, Minor, Moderate, Major, Catastrophic
    ['Low',    'Low',    'Low',    'Medium', 'Medium'],   // Rare
    ['Low',    'Low',    'Medium', 'Medium', 'High'],     // Unlikely
    ['Low',    'Medium', 'Medium', 'High',   'High'],     // Possible
    ['Medium', 'Medium', 'High',   'High',   'Critical'], // Likely
    ['Medium', 'High',   'High',   'Critical','Critical'],// Almost Certain
  ];
  return matrix[l][c];
}

function calculateOverallRiskLevel(risks) {
  if (!risks || risks.length === 0) return 'Low';
  const order = { Critical: 3, High: 2, Medium: 1, Low: 0 };
  let max = 0;
  for (const r of risks) {
    const v = order[r.risk_level] || 0;
    if (v > max) max = v;
  }
  return RISK_LEVELS[max] || 'Low';
}

// ─── Auto-generate Risks ─────────────────────────────────────────────────────

function generateRisksFromParticipant(p) {
  if (!p) return [];
  const risks = [];
  const uuid = () => crypto.randomUUID();

  // Health risks
  if (p.primary_disability) {
    const short = p.primary_disability.split('(')[0].split(',')[0].trim();
    risks.push({
      id: uuid(), category: 'Health', title: short,
      description: `Health complications related to primary disability: ${p.primary_disability}`,
      likelihood: 'Possible', consequence: 'Moderate', risk_level: 'Medium',
      controls: 'Regular health monitoring, GP reviews, staff trained in disability-specific care needs',
    });
  }
  if (p.secondary_disability) {
    const conditions = p.secondary_disability.split(';').map(s => s.trim()).filter(Boolean);
    const short = conditions[0]?.split('(')[0]?.trim() || 'Secondary Conditions';
    risks.push({
      id: uuid(), category: 'Health', title: short,
      description: `Secondary condition management: ${p.secondary_disability}`,
      likelihood: 'Possible', consequence: 'Minor', risk_level: 'Medium',
      controls: 'Ongoing monitoring, specialist appointments maintained, care plan updated regularly',
    });
  }
  if (p.allergies) {
    risks.push({
      id: uuid(), category: 'Health', title: 'Allergies / Sensitivities',
      description: `Allergic reaction risk: ${p.allergies}`,
      likelihood: 'Unlikely', consequence: 'Major', risk_level: 'Medium',
      controls: 'Allergy information displayed in home, all staff informed, EpiPen accessible if prescribed, anaphylaxis plan in place',
    });
  }
  if (p.dietary_requirements) {
    risks.push({
      id: uuid(), category: 'Health', title: 'Dietary & Nutrition',
      description: `Dietary needs not met or choking risk: ${p.dietary_requirements}`,
      likelihood: 'Unlikely', consequence: 'Major', risk_level: 'Medium',
      controls: 'Dietary plan documented and displayed, staff trained in safe meal preparation, mealtime supervision as required',
    });
  }

  // Medication risks
  if (p.medications_summary) {
    risks.push({
      id: uuid(), category: 'Medication', title: 'Medication Management',
      description: 'Medication administration error, missed dose, or adverse reaction',
      likelihood: 'Unlikely', consequence: 'Major', risk_level: 'Medium',
      controls: 'Medication chart maintained, double-check protocol, staff trained in medication administration, pharmacy reviews',
    });
  }

  // Mobility / Safety risks
  if (p.mobility) {
    const mobilityLower = p.mobility.toLowerCase();
    const isHighRisk = mobilityLower.includes('wheelchair') || mobilityLower.includes('hoist') || mobilityLower.includes('limited');
    risks.push({
      id: uuid(), category: 'Safety', title: 'Falls & Mobility',
      description: `Falls or injury risk related to mobility: ${p.mobility}`,
      likelihood: isHighRisk ? 'Possible' : 'Unlikely',
      consequence: isHighRisk ? 'Major' : 'Moderate',
      risk_level: isHighRisk ? 'High' : 'Medium',
      controls: 'Mobility aids maintained, environment hazard-free, manual handling training for staff, OT recommendations followed',
    });
  }

  // Communication risks
  if (p.communication_needs) {
    risks.push({
      id: uuid(), category: 'Communication', title: 'Communication Breakdown',
      description: `Communication breakdown or inability to express needs: ${p.communication_needs}`,
      likelihood: 'Possible', consequence: 'Moderate', risk_level: 'Medium',
      controls: 'Communication aids available, staff trained in preferred communication methods, visual supports in place, speech pathologist review',
    });
  }

  // Behavioural risks (check bio/notes for keywords)
  const bioNotes = `${p.bio || ''} ${p.notes || ''}`.toLowerCase();
  if (bioNotes.includes('behaviour') || bioNotes.includes('aggress') || bioNotes.includes('self-harm') || bioNotes.includes('abscon') || bioNotes.includes('elopement')) {
    risks.push({
      id: uuid(), category: 'Behavioural', title: 'Behaviours of Concern',
      description: 'Behaviours of concern that may pose risk to self or others',
      likelihood: 'Possible', consequence: 'Major', risk_level: 'High',
      controls: 'BSP in place and followed, staff trained in positive behaviour support, de-escalation strategies, incident reporting',
    });
  }

  // Environmental risks
  risks.push({
    id: uuid(), category: 'Environmental', title: 'Home Environment Hazards',
    description: 'Hazards in the home environment (trip hazards, sharps, hot surfaces, unsecured items)',
    likelihood: 'Unlikely', consequence: 'Moderate', risk_level: 'Medium',
    controls: 'Regular home safety checks, hazard register maintained, maintenance requests actioned promptly',
  });

  // Social risks
  risks.push({
    id: uuid(), category: 'Social', title: 'Social Isolation',
    description: 'Social isolation, reduced community participation, or exploitation risk',
    likelihood: 'Possible', consequence: 'Moderate', risk_level: 'Medium',
    controls: 'Community access goals in support plan, regular social activities scheduled, safeguarding awareness training for staff',
  });

  // Sensory risks (if mentioned)
  if (bioNotes.includes('sensory') || bioNotes.includes('autism') || bioNotes.includes('asd') || bioNotes.includes('overstimulat')) {
    risks.push({
      id: uuid(), category: 'Sensory', title: 'Sensory Overload',
      description: 'Sensory overload or distress from environmental stimuli',
      likelihood: 'Possible', consequence: 'Moderate', risk_level: 'Medium',
      controls: 'Sensory profile documented, low-stimulation spaces available, staff aware of triggers and calming strategies',
    });
  }

  return risks;
}

// ─── Empty Risk Template ─────────────────────────────────────────────────────

function emptyRisk() {
  return {
    id: crypto.randomUUID(),
    category: 'Health',
    title: '',
    description: '',
    likelihood: 'Possible',
    consequence: 'Moderate',
    risk_level: 'Medium',
    controls: '',
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RiskProfileTab({ participant, riskProfile, setRiskProfile }) {
  const { profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Form state
  const [risks, setRisks] = useState([]);
  const [reviewDate, setReviewDate] = useState('');
  const [nextReviewDate, setNextReviewDate] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [environmentalContext, setEnvironmentalContext] = useState('');

  // Editing a single risk inline
  const [editingRiskId, setEditingRiskId] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (riskProfile) {
      setRisks(riskProfile.risks || []);
      setReviewDate(riskProfile.review_date || '');
      setNextReviewDate(riskProfile.next_review_date || '');
      setReviewedBy(riskProfile.reviewed_by || '');
      setGeneralNotes(riskProfile.general_notes || '');
      setEnvironmentalContext(riskProfile.environmental_context || '');
    }
  }, [riskProfile]);

  // ── PDF Export ──
  async function handleExportPdf() {
    const rp = riskProfile;
    if (!rp) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const PAGE_W = 210, PAGE_H = 297;
      const ML = 15, MR = 15, MT = 15;
      const CW = PAGE_W - ML - MR;
      const FOOTER_H = 12;
      const BODY_BOTTOM = PAGE_H - MT - FOOTER_H;
      const OLF_BLUE = [48, 158, 221];
      const OLF_GREEN = [14, 160, 62];
      const DARK = [30, 41, 59];
      const MED = [100, 116, 139];
      const LIGHT_BG = [248, 250, 252];
      const WHITE = [255, 255, 255];

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let pageNum = 1;
      let y = MT;

      // Load logo
      let logoData = null;
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = '/logo.png'; });
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        logoData = c.toDataURL('image/png');
      } catch {}

      function drawHeader() {
        pdf.setFillColor(...OLF_BLUE);
        pdf.rect(0, 0, PAGE_W, MT + 24, 'F');
        if (logoData) try { pdf.addImage(logoData, 'PNG', ML, MT, 24, 12); } catch {}
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.setTextColor(255, 255, 255);
        pdf.text('INDIVIDUAL RISK PROFILE', logoData ? ML + 28 : ML, MT + 8);
        pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
        pdf.text('One Life Foundation — NDIS Support Services', logoData ? ML + 28 : ML, MT + 14);
        return MT + 30;
      }

      function drawFooter() {
        pdf.setFontSize(7); pdf.setTextColor(...MED);
        pdf.text('One Life Foundation — Individual Risk Profile — Confidential', ML, PAGE_H - 6);
        pdf.text(`Page ${pageNum}`, PAGE_W - MR, PAGE_H - 6, { align: 'right' });
      }

      function checkPage(needed) {
        if (y + needed > BODY_BOTTOM) {
          drawFooter(); pdf.addPage(); pageNum++; y = drawHeader();
        }
      }

      function sectionTitle(text) {
        checkPage(12);
        pdf.setFillColor(...LIGHT_BG);
        pdf.rect(ML, y, CW, 8, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...DARK);
        pdf.text(text, ML + 3, y + 5.5);
        y += 11;
      }

      function labelVal(label, value, indent = 0) {
        if (!value) return;
        checkPage(7);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...MED);
        pdf.text(label, ML + 3 + indent, y + 4);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...DARK);
        const lines = pdf.splitTextToSize(String(value), CW - 40 - indent);
        pdf.text(lines, ML + 38 + indent, y + 4);
        y += Math.max(6, lines.length * 4 + 2);
      }

      const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
      const name = `${participant.first_name} ${participant.last_name}`;

      // ── Page 1: Header ──
      y = drawHeader();

      // Participant details
      sectionTitle('PARTICIPANT DETAILS');
      labelVal('Name', name);
      labelVal('NDIS Number', participant.ndis_number);
      labelVal('Date of Birth', fmtDate(participant.date_of_birth));
      labelVal('Address', participant.location);
      labelVal('Primary Disability', participant.primary_disability);
      if (participant.secondary_disability) labelVal('Secondary', participant.secondary_disability);
      labelVal('Support Level', participant.support_level);
      labelVal('Funding Ratio', participant.funding_ratio);

      // Review info
      sectionTitle('REVIEW INFORMATION');
      labelVal('Review Date', fmtDate(rp.review_date));
      labelVal('Next Review', fmtDate(rp.next_review_date));
      labelVal('Reviewed By', rp.reviewed_by);
      labelVal('Overall Risk', rp.overall_risk_level);
      labelVal('Status', rp.status);
      if (rp.environmental_context) labelVal('Environment', rp.environmental_context);

      // Risk summary counts
      const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
      (rp.risks || []).forEach(r => { if (counts[r.risk_level] !== undefined) counts[r.risk_level]++; });

      checkPage(14);
      sectionTitle('RISK SUMMARY');
      const boxW = CW / 4;
      const colors = { Critical: [220, 38, 38], High: [217, 119, 6], Medium: [202, 138, 4], Low: [22, 163, 74] };
      Object.entries(counts).forEach(([level, count], i) => {
        const bx = ML + i * boxW;
        pdf.setFillColor(...(colors[level] || [100,100,100]));
        pdf.roundedRect(bx + 1, y, boxW - 2, 10, 1.5, 1.5, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(255, 255, 255);
        pdf.text(String(count), bx + boxW / 2, y + 5.5, { align: 'center' });
        pdf.setFontSize(6);
        pdf.text(level, bx + boxW / 2, y + 9, { align: 'center' });
      });
      y += 14;

      // Risk Register Table
      sectionTitle('RISK REGISTER');

      const allRisks = rp.risks || [];
      if (allRisks.length === 0) {
        pdf.setFont('helvetica', 'italic'); pdf.setFontSize(9); pdf.setTextColor(...MED);
        pdf.text('No risks recorded.', ML + 3, y + 4);
        y += 8;
      } else {
        // Table header
        checkPage(10);
        const cols = [0, 8, 28, 80, 110, 135, 155]; // x offsets from ML
        const colW = [8, 20, 52, 30, 25, 20, CW - 155];
        pdf.setFillColor(...OLF_BLUE);
        pdf.rect(ML, y, CW, 7, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(255, 255, 255);
        ['#', 'Category', 'Risk', 'Likelihood', 'Consequence', 'Level', 'Controls'].forEach((h, i) => {
          pdf.text(h, ML + cols[i] + 1.5, y + 4.5);
        });
        y += 8;

        // Table rows
        allRisks.forEach((risk, idx) => {
          const titleText = risk.title || '';
          const descText = risk.description || '';
          const controlText = risk.controls || '';
          const riskLines = pdf.splitTextToSize(titleText ? `${titleText}\n${descText}` : descText, colW[2] - 2);
          const ctrlLines = pdf.splitTextToSize(controlText, colW[6] - 2);
          const rowH = Math.max(8, Math.max(riskLines.length, ctrlLines.length) * 3.5 + 3);

          checkPage(rowH + 1);
          if (idx % 2 === 1) { pdf.setFillColor(...LIGHT_BG); pdf.rect(ML, y, CW, rowH, 'F'); }

          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(...DARK);
          pdf.text(String(idx + 1), ML + cols[0] + 1.5, y + 4);
          pdf.text(risk.category || '', ML + cols[1] + 1.5, y + 4);

          // Risk column — title bold, description normal
          let ry = y + 4;
          if (titleText) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(titleText, ML + cols[2] + 1.5, ry);
            ry += 3.5;
            pdf.setFont('helvetica', 'normal');
          }
          const descLines = pdf.splitTextToSize(descText, colW[2] - 2);
          descLines.slice(0, 4).forEach(line => { pdf.text(line, ML + cols[2] + 1.5, ry); ry += 3.5; });

          pdf.text(risk.likelihood || '', ML + cols[3] + 1.5, y + 4);
          pdf.text(risk.consequence || '', ML + cols[4] + 1.5, y + 4);

          // Risk level with color
          const lvlColors = { Critical: [220,38,38], High: [217,119,6], Medium: [202,138,4], Low: [22,163,74] };
          pdf.setTextColor(...(lvlColors[risk.risk_level] || DARK));
          pdf.setFont('helvetica', 'bold');
          pdf.text(risk.risk_level || '', ML + cols[5] + 1.5, y + 4);

          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...DARK);
          ctrlLines.slice(0, 5).forEach((line, li) => { pdf.text(line, ML + cols[6] + 1.5, y + 4 + li * 3.5); });

          // Row border
          pdf.setDrawColor(226, 232, 240);
          pdf.line(ML, y + rowH, ML + CW, y + rowH);
          y += rowH;
        });
      }

      // General notes
      if (rp.general_notes) {
        sectionTitle('GENERAL NOTES');
        checkPage(10);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...DARK);
        const noteLines = pdf.splitTextToSize(rp.general_notes, CW - 6);
        noteLines.forEach(line => { checkPage(5); pdf.text(line, ML + 3, y + 4); y += 4; });
        y += 4;
      }

      // End of report

      drawFooter();
      pdf.save(`Risk Profile — ${name}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      setError('Failed to export PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  function startEditing() {
    if (riskProfile) {
      setRisks(riskProfile.risks || []);
      setReviewDate(riskProfile.review_date || '');
      setNextReviewDate(riskProfile.next_review_date || '');
      setReviewedBy(riskProfile.reviewed_by || '');
      setGeneralNotes(riskProfile.general_notes || '');
      setEnvironmentalContext(riskProfile.environmental_context || '');
    } else {
      setRisks([]);
      setReviewDate(toLocalDate());
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      setNextReviewDate(toLocalDate(sixMonths));
      setReviewedBy(profile?.full_name || profile?.email || '');
      setGeneralNotes('');
      setEnvironmentalContext('');
    }
    setEditing(true);
    setError('');
    setEditingRiskId(null);
  }

  function cancelEditing() {
    setEditing(false);
    setError('');
    setEditingRiskId(null);
    // Reset to saved data
    if (riskProfile) {
      setRisks(riskProfile.risks || []);
      setReviewDate(riskProfile.review_date || '');
      setNextReviewDate(riskProfile.next_review_date || '');
      setReviewedBy(riskProfile.reviewed_by || '');
      setGeneralNotes(riskProfile.general_notes || '');
      setEnvironmentalContext(riskProfile.environmental_context || '');
    }
  }

  function addRisk() {
    const r = emptyRisk();
    setRisks(prev => [...prev, r]);
    setEditingRiskId(r.id);
  }

  function removeRisk(id) {
    setRisks(prev => prev.filter(r => r.id !== id));
    if (editingRiskId === id) setEditingRiskId(null);
  }

  function updateRisk(id, field, value) {
    setRisks(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      // Auto-calc risk level when likelihood or consequence changes
      if (field === 'likelihood' || field === 'consequence') {
        updated.risk_level = calculateRiskLevel(
          field === 'likelihood' ? value : r.likelihood,
          field === 'consequence' ? value : r.consequence,
        );
      }
      return updated;
    }));
  }

  function handleAutoGenerate() {
    const generated = generateRisksFromParticipant(participant);
    if (generated.length === 0) {
      setError('No risks could be generated from participant data. Add risks manually.');
      return;
    }
    setRisks(generated);
    setError('');
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const overall = calculateOverallRiskLevel(risks);
      const payload = {
        participant_id: participant.id,
        risks,
        review_date: reviewDate || null,
        next_review_date: nextReviewDate || null,
        reviewed_by: reviewedBy || null,
        overall_risk_level: overall,
        general_notes: generalNotes || null,
        environmental_context: environmentalContext || null,
        status: 'active',
      };

      let result;
      if (riskProfile?.id) {
        result = await updateRiskProfile(riskProfile.id, payload);
      } else {
        result = await createRiskProfile(payload);
      }
      setRiskProfile(result);
      setEditing(false);
      setEditingRiskId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!riskProfile?.id) return;
    setDeleting(true);
    setError('');
    try {
      await deleteRiskProfile(riskProfile.id);
      setRiskProfile(null);
      setRisks([]);
      setEditing(false);
      setDeleteConfirm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const rp = riskProfile;
  const overallLevel = rp?.overall_risk_level || calculateOverallRiskLevel(risks);
  const riskCounts = (rp?.risks || []).reduce((acc, r) => {
    acc[r.risk_level] = (acc[r.risk_level] || 0) + 1;
    return acc;
  }, {});

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HiShieldExclamation className="h-6 w-6 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Risk Profile</h2>
          {rp && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${OVERALL_LEVEL_STYLES[overallLevel] || OVERALL_LEVEL_STYLES.Low}`}>
              {overallLevel} Risk
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              {!rp ? (
                <button onClick={startEditing} className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors">
                  <HiPlus className="h-4 w-4" />
                  Create Risk Profile
                </button>
              ) : (
                <>
                  <button onClick={handleExportPdf} disabled={exporting} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors disabled:opacity-50">
                    {exporting ? <HiArrowPath className="h-4 w-4 animate-spin" /> : <HiArrowDownTray className="h-4 w-4" />}
                    {exporting ? 'Exporting...' : 'Export PDF'}
                  </button>
                  <button onClick={startEditing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
                    <HiPencilSquare className="h-4 w-4" />
                    Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(true)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <HiTrash className="h-4 w-4" />
                    Delete
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button onClick={handleAutoGenerate} className="inline-flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                <HiSparkles className="h-4 w-4" />
                Auto-Generate
              </button>
              <button onClick={cancelEditing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
                <HiXMark className="h-4 w-4" />
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50 transition-colors">
                {saving ? <HiArrowPath className="h-4 w-4 animate-spin" /> : <HiCheckCircle className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="mb-3 text-sm font-medium text-red-700 dark:text-red-400">
            Are you sure you want to delete this risk profile? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button onClick={() => setDeleteConfirm(false)} className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Edit Mode ─────────────────────────────────────────────────────────── */}
      {editing && (
        <div className="space-y-5">
          {/* Review Details */}
          <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Review Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Review Date</label>
                <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0f1a2e] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Next Review Date</label>
                <input type="date" value={nextReviewDate} onChange={e => setNextReviewDate(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0f1a2e] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Reviewed By</label>
                <input type="text" value={reviewedBy} onChange={e => setReviewedBy(e.target.value)} placeholder="Staff name" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0f1a2e] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Environmental Context</label>
              <textarea value={environmentalContext} onChange={e => setEnvironmentalContext(e.target.value)} rows={2} placeholder="Describe the participant's living environment, location, and any relevant environmental factors..." className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0f1a2e] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">General Notes</label>
              <textarea value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} rows={2} placeholder="Any general observations or notes about the risk profile..." className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0f1a2e] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>

          {/* Risks List (editable) */}
          <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Identified Risks ({risks.length})</h3>
              <button onClick={addRisk} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors">
                <HiPlus className="h-3.5 w-3.5" />
                Add Risk
              </button>
            </div>

            {risks.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-[#334766] p-8 text-center">
                <HiShieldExclamation className="mx-auto mb-2 h-8 w-8 text-slate-400 dark:text-slate-500" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No risks added yet.</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Click "Auto-Generate" to create risks from participant data, or add them manually.</p>
              </div>
            )}

            <div className="space-y-3">
              {risks.map((risk, idx) => (
                <div key={risk.id} className={`rounded-lg border ${editingRiskId === risk.id ? 'border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-900/10' : 'border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e]'} p-4`}>
                  {editingRiskId === risk.id ? (
                    /* Expanded edit form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Category</label>
                          <select value={risk.category} onChange={e => updateRisk(risk.id, 'category', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="flex items-end gap-2">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${RISK_LEVEL_COLORS[risk.risk_level] || RISK_LEVEL_COLORS.Low}`}>
                            {risk.risk_level}
                          </span>
                          <button onClick={() => setEditingRiskId(null)} className="ml-auto text-xs font-medium text-brand-500 hover:text-brand-600">Done</button>
                          <button onClick={() => removeRisk(risk.id)} className="text-xs font-medium text-red-500 hover:text-red-600">Remove</button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Title</label>
                        <input type="text" value={risk.title || ''} onChange={e => updateRisk(risk.id, 'title', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. Type 2 Diabetes, Falls Risk, Seizures..." />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Description</label>
                        <textarea value={risk.description} onChange={e => updateRisk(risk.id, 'description', e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Describe the risk in detail..." />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Likelihood</label>
                          <select value={risk.likelihood} onChange={e => updateRisk(risk.id, 'likelihood', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                            {LIKELIHOODS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Consequence</label>
                          <select value={risk.consequence} onChange={e => updateRisk(risk.id, 'consequence', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                            {CONSEQUENCES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Controls / Mitigation</label>
                        <textarea value={risk.controls} onChange={e => updateRisk(risk.id, 'controls', e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Describe controls and mitigation strategies..." />
                      </div>
                    </div>
                  ) : (
                    /* Collapsed row */
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-xs font-mono text-slate-400 dark:text-slate-500 w-5 shrink-0">{idx + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[risk.category] || CATEGORY_COLORS.Health}`}>{risk.category}</span>
                          {risk.title && <span className="text-sm font-semibold text-slate-900 dark:text-white">{risk.title}</span>}
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${RISK_LEVEL_COLORS[risk.risk_level] || RISK_LEVEL_COLORS.Low}`}>{risk.risk_level}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{risk.description || <span className="italic text-slate-400">No description</span>}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditingRiskId(risk.id)} className="rounded p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-[#1e2d4a] transition-colors">
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button onClick={() => removeRisk(risk.id)} className="rounded p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── View Mode ─────────────────────────────────────────────────────────── */}
      {!editing && rp && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {RISK_LEVELS.slice().reverse().map(level => (
              <div key={level} className={`rounded-xl border p-4 ${RISK_LEVEL_COLORS[level]}`}>
                <div className="text-2xl font-bold">{riskCounts[level] || 0}</div>
                <div className="text-xs font-semibold">{level}</div>
              </div>
            ))}
          </div>

          {/* Review Info */}
          <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Review Date</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {rp.review_date ? new Date(rp.review_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Next Review</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {rp.next_review_date ? new Date(rp.next_review_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Reviewed By</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{rp.reviewed_by || '--'}</span>
              </div>
            </div>
            {rp.environmental_context && (
              <div className="mt-4 border-t border-slate-100 dark:border-[#263554] pt-4">
                <span className="block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Environmental Context</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{rp.environmental_context}</p>
              </div>
            )}
            {rp.general_notes && (
              <div className="mt-4 border-t border-slate-100 dark:border-[#263554] pt-4">
                <span className="block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">General Notes</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{rp.general_notes}</p>
              </div>
            )}
          </div>

          {/* Risk Table */}
          <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
            <div className="border-b border-slate-200 dark:border-[#263554] px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Risk Register ({(rp.risks || []).length} risks)</h3>
            </div>

            {(!rp.risks || rp.risks.length === 0) ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No risks recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e]">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 w-8">#</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Category</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Risk</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Likelihood</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Consequence</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Level</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                    {(rp.risks || []).map((risk, idx) => (
                      <tr key={risk.id || idx} className="hover:bg-slate-50 dark:hover:bg-[#1a2744]">
                        <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_COLORS[risk.category] || CATEGORY_COLORS.Health}`}>{risk.category}</span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {risk.title && <p className="font-semibold text-slate-900 dark:text-white">{risk.title}</p>}
                          <span className="text-slate-600 dark:text-slate-400 line-clamp-3">{risk.description}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{risk.likelihood}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{risk.consequence}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${RISK_LEVEL_COLORS[risk.risk_level] || RISK_LEVEL_COLORS.Low}`}>{risk.risk_level}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs">
                          <span className="line-clamp-3">{risk.controls}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── No Profile Yet ────────────────────────────────────────────────────── */}
      {!editing && !rp && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-[#334766] bg-white dark:bg-[#162036] p-12 text-center">
          <HiShieldExclamation className="mx-auto mb-3 h-10 w-10 text-slate-400 dark:text-slate-500" />
          <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">No Risk Profile</h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Create a risk profile to document and track identified risks for this participant.
          </p>
          <button onClick={startEditing} className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors">
            <HiPlus className="h-4 w-4" />
            Create Risk Profile
          </button>
        </div>
      )}
    </div>
  );
}
