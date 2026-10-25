import { useState, useCallback } from 'react';
import {
  HiShieldCheck,
  HiPlus,
  HiChevronDown,
  HiCheckCircle,
  HiXCircle,
  HiMinusCircle,
  HiArrowDownTray,
  HiPencilSquare,
  HiTrash,
  HiArrowLeft,
  HiCalendar,
  HiUser,
  HiClock,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import {
  addRiskAssessment,
  updatePropertyRecord,
  deletePropertyRecord,
} from '../lib/api';

// ─── Risk Assessment Categories & Items ──────────────────────────────────────

const RISK_CATEGORIES = [
  {
    category: 'Fire Safety & Emergency',
    items: [
      'Smoke alarms installed and operational in all required areas',
      'Fire extinguisher(s) accessible and within service date',
      'Fire blanket available in the kitchen',
      'Emergency evacuation plan displayed and current',
      'Emergency exits clearly marked and unobstructed',
      'Emergency contact numbers displayed prominently',
      'Staff trained in emergency procedures',
    ],
  },
  {
    category: 'Electrical Safety',
    items: [
      'Powerpoints in good condition (no cracks, scorch marks)',
      'No overloaded power boards or double adapters',
      'Electrical cords in good condition (no fraying or damage)',
      'RCD/safety switch installed and tested',
      'Appliances in good working condition and tagged if required',
    ],
  },
  {
    category: 'Falls & Trip Hazards',
    items: [
      'Floor surfaces in good condition and non-slip',
      'Rugs secured or removed to prevent tripping',
      'Adequate lighting in all areas including hallways and stairs',
      'Handrails installed on stairs and secure',
      'Step edges clearly marked where applicable',
      'Clutter-free walkways and common areas',
    ],
  },
  {
    category: 'Bathroom Safety',
    items: [
      'Grab rails installed near toilet and shower/bath',
      'Non-slip mats or surfaces in wet areas',
      'Hot water temperature regulated (max 50\u00B0C)',
      'Adequate drainage \u2014 no pooling water',
      'Shower chair/bench available if required',
    ],
  },
  {
    category: 'Kitchen Safety',
    items: [
      'Stove/oven in safe working condition with knob guards if needed',
      'Sharp objects stored safely',
      'Cleaning chemicals stored securely and labelled',
      'Food storage appropriate (fridge temp checked)',
      'Adequate ventilation (rangehood operational)',
    ],
  },
  {
    category: 'Bedroom Safety',
    items: [
      'Bed at appropriate height for participant',
      'Adequate lighting (bedside and overhead)',
      'Clear path from bed to door (no obstructions)',
      'Call bell / alert system accessible from bed',
      'Bed rails fitted and secure if required',
    ],
  },
  {
    category: 'External Areas & Access',
    items: [
      'Pathways clear and in good repair',
      'External lighting adequate for safe access',
      'Fencing and gates secure',
      'Garden/yard free of hazards',
      'Vehicle access / parking area safe',
      'Wheelchair ramp in good condition (if applicable)',
    ],
  },
  {
    category: 'Security',
    items: [
      'All external doors have functioning locks',
      'Windows have functioning locks',
      'Security screen doors installed on external entries',
      'Intercom or peephole on front door',
      'Keys accounted for and securely managed',
    ],
  },
  {
    category: 'Hazardous Materials & Storage',
    items: [
      'Cleaning chemicals stored in locked or secured area',
      'Medications stored securely (locked if required)',
      'Sharps disposed of safely (sharps container if needed)',
      'First aid kit stocked and accessible',
      'Material Safety Data Sheets (MSDS) available',
    ],
  },
  {
    category: 'Accessibility & Mobility',
    items: [
      'Doorways wide enough for wheelchair access (min 850mm)',
      'Hallways clear and unobstructed',
      'Light switches and powerpoints at accessible height',
      'Accessible bathroom facilities',
      'Assistive equipment in good working order',
    ],
  },
];

const TOTAL_ITEMS = RISK_CATEGORIES.reduce((sum, c) => sum + c.items.length, 0);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDateShort = (d) => {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function buildInitialItems() {
  const items = [];
  for (const cat of RISK_CATEGORIES) {
    for (const item of cat.items) {
      items.push({
        category: cat.category,
        item,
        status: 'not_assessed',
        notes: '',
        action_required: '',
      });
    }
  }
  return items;
}

function getItemsForCategory(items, categoryName) {
  return items.filter((i) => i.category === categoryName);
}

function getCategorySummary(items, categoryName) {
  const catItems = getItemsForCategory(items, categoryName);
  const compliant = catItems.filter((i) => i.status === 'compliant').length;
  const nonCompliant = catItems.filter((i) => i.status === 'non_compliant').length;
  const na = catItems.filter((i) => i.status === 'na').length;
  const notAssessed = catItems.filter((i) => i.status === 'not_assessed').length;
  return { total: catItems.length, compliant, nonCompliant, na, notAssessed };
}

function getAssessedCount(items) {
  return items.filter((i) => i.status !== 'not_assessed').length;
}

const riskLevelConfig = {
  low: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  medium: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  high: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
  critical: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
};

const statusConfig = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
};

// ─── PDF Generation ──────────────────────────────────────────────────────────

async function generatePDF(assessment, property) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const OLF_GREEN = '#0ea03e';
  const DARK_TEXT = '#1e293b';
  const MED_TEXT = '#475569';
  const LIGHT_TEXT = '#94a3b8';

  const statusColors = {
    compliant: { r: 22, g: 163, b: 74 },
    non_compliant: { r: 220, g: 38, b: 38 },
    na: { r: 148, g: 163, b: 184 },
    not_assessed: { r: 203, g: 213, b: 225 },
  };

  const statusLabels = {
    compliant: 'COMPLIANT',
    non_compliant: 'NON-COMPLIANT',
    na: 'N/A',
    not_assessed: 'NOT ASSESSED',
  };

  function checkPage(needed) {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  }

  function drawFooter() {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `One Life Foundation | Home Risk Assessment | ${property.name}`,
        margin,
        pageHeight - 8
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  }

  // --- Header with logo attempt ---
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = '/logo.png';
    });
    doc.addImage(img, 'PNG', margin, y, 30, 30);
    y += 5;
  } catch {
    // No logo available, continue without
  }

  // Title
  doc.setFontSize(20);
  doc.setTextColor(14, 160, 62);
  doc.text('Home Risk Assessment Report', margin + 35, y + 8);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('One Life Foundation', margin + 35, y + 15);
  y += 35;

  // Divider
  doc.setDrawColor(14, 160, 62);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Property info
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(property.name, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const fullAddress = [property.address, property.suburb, property.state, property.postcode].filter(Boolean).join(', ');
  doc.text(fullAddress, margin, y);
  y += 10;

  // Assessment details box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  const detailY = y + 6;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Assessment Date', margin + 5, detailY);
  doc.text('Assessor', margin + 50, detailY);
  doc.text('Overall Risk Level', margin + 100, detailY);
  doc.text('Next Review', margin + 150, detailY);

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(formatDateShort(assessment.assessment_date), margin + 5, detailY + 7);
  doc.text(assessment.assessor || '--', margin + 50, detailY + 7);

  const rl = assessment.overall_risk_level || '--';
  const rlColor = statusColors[rl === 'low' ? 'compliant' : rl === 'critical' ? 'non_compliant' : 'na'] || { r: 30, g: 41, b: 59 };
  doc.setTextColor(rlColor.r, rlColor.g, rlColor.b);
  doc.text(rl.toUpperCase(), margin + 100, detailY + 7);

  doc.setTextColor(30, 41, 59);
  doc.text(formatDateShort(assessment.next_review_date), margin + 150, detailY + 7);

  y += 30;

  // General notes
  if (assessment.general_notes) {
    checkPage(20);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('General Notes:', margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const noteLines = doc.splitTextToSize(assessment.general_notes, contentWidth - 5);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 6;
  }

  // Categories
  const items = assessment.items || [];

  for (const cat of RISK_CATEGORIES) {
    const catItems = items.filter((i) => i.category === cat.category);
    if (catItems.length === 0) continue;

    checkPage(30);

    // Category header
    doc.setFillColor(14, 160, 62);
    doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(cat.category.toUpperCase(), margin + 4, y + 5.5);

    const compliantCount = catItems.filter((i) => i.status === 'compliant').length;
    const ncCount = catItems.filter((i) => i.status === 'non_compliant').length;
    doc.text(`${compliantCount}/${catItems.length} Compliant${ncCount > 0 ? ` | ${ncCount} Non-Compliant` : ''}`, pageWidth - margin - 4, y + 5.5, { align: 'right' });
    y += 12;

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Item', margin + 3, y + 4);
    doc.text('Status', margin + contentWidth * 0.65, y + 4);
    doc.text('Notes / Actions', margin + contentWidth * 0.78, y + 4);
    y += 8;

    for (const ci of catItems) {
      const sc = statusColors[ci.status] || statusColors.not_assessed;
      const sl = statusLabels[ci.status] || 'NOT ASSESSED';

      // Estimate row height
      const itemLines = doc.splitTextToSize(ci.item, contentWidth * 0.6);
      let notesText = '';
      if (ci.notes) notesText += ci.notes;
      if (ci.action_required) notesText += (notesText ? ' | ACTION: ' : 'ACTION: ') + ci.action_required;
      const noteLines = notesText ? doc.splitTextToSize(notesText, contentWidth * 0.2) : [];
      const rowHeight = Math.max(itemLines.length * 3.5, noteLines.length * 3.5, 5) + 3;

      checkPage(rowHeight + 2);

      // Alternate row bg
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(itemLines, margin + 3, y + 3);

      // Status
      doc.setTextColor(sc.r, sc.g, sc.b);
      doc.setFontSize(7);
      doc.text(sl, margin + contentWidth * 0.65, y + 3);

      // Notes
      if (noteLines.length > 0) {
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(6.5);
        doc.text(noteLines, margin + contentWidth * 0.78, y + 3);
      }

      // Separator line
      y += rowHeight;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 1.5;
    }

    y += 6;
  }

  // Summary
  checkPage(40);
  y += 4;
  doc.setDrawColor(14, 160, 62);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(14, 160, 62);
  doc.text('Assessment Summary', margin, y);
  y += 8;

  const totalAssessed = items.filter((i) => i.status !== 'not_assessed').length;
  const totalCompliant = items.filter((i) => i.status === 'compliant').length;
  const totalNC = items.filter((i) => i.status === 'non_compliant').length;
  const totalNA = items.filter((i) => i.status === 'na').length;

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Items: ${items.length}`, margin, y); y += 5;
  doc.text(`Items Assessed: ${totalAssessed}/${items.length}`, margin, y); y += 5;

  doc.setTextColor(22, 163, 74);
  doc.text(`Compliant: ${totalCompliant}`, margin, y); y += 5;
  doc.setTextColor(220, 38, 38);
  doc.text(`Non-Compliant: ${totalNC}`, margin, y); y += 5;
  doc.setTextColor(148, 163, 184);
  doc.text(`Not Applicable: ${totalNA}`, margin, y); y += 12;

  // Sign-off area
  checkPage(35);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Staff Sign-Off', margin + 5, y + 7);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Assessor Name: ___________________________', margin + 5, y + 15);
  doc.text('Signature: ___________________________', margin + contentWidth / 2, y + 15);
  doc.text('Date: _______________', margin + 5, y + 23);
  doc.text('Manager Signature: ___________________________', margin + contentWidth / 2, y + 23);

  drawFooter();

  doc.save(`Risk_Assessment_${property.name.replace(/\s+/g, '_')}_${assessment.assessment_date}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RiskAssessmentTab({ property, onRefresh }) {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [downloading, setDownloading] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    assessment_date: todayISO(),
    assessor: '',
    overall_risk_level: '',
    next_review_date: '',
    general_notes: '',
    items: buildInitialItems(),
  });

  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});

  const riskAssessments = property.risk_assessments || [];

  const startNew = useCallback(() => {
    setEditingAssessment(null);
    setFormData({
      assessment_date: todayISO(),
      assessor: '',
      overall_risk_level: '',
      next_review_date: '',
      general_notes: '',
      items: buildInitialItems(),
    });
    setExpandedCategories({});
    setExpandedNotes({});
    setView('form');
  }, []);

  const startEdit = useCallback((assessment) => {
    setEditingAssessment(assessment);
    // Merge saved items with template to catch any new items added after the assessment was created
    const savedItems = assessment.items || [];
    const templateItems = buildInitialItems();
    const merged = templateItems.map((ti) => {
      const existing = savedItems.find((si) => si.category === ti.category && si.item === ti.item);
      return existing || ti;
    });
    setFormData({
      assessment_date: assessment.assessment_date || todayISO(),
      assessor: assessment.assessor || '',
      overall_risk_level: assessment.overall_risk_level || '',
      next_review_date: assessment.next_review_date || '',
      general_notes: assessment.general_notes || '',
      items: merged,
    });
    setExpandedCategories({});
    setExpandedNotes({});
    setView('form');
  }, []);

  const toggleCategory = useCallback((cat) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const toggleNotes = useCallback((key) => {
    setExpandedNotes((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateItemStatus = useCallback((category, item, status) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.category === category && i.item === item ? { ...i, status } : i
      ),
    }));
  }, []);

  const updateItemField = useCallback((category, item, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.category === category && i.item === item ? { ...i, [field]: value } : i
      ),
    }));
  }, []);

  async function handleSave(asCompleted = false) {
    setSaving(true);
    try {
      const payload = {
        property_id: property.id,
        assessment_date: formData.assessment_date,
        assessor: formData.assessor,
        status: asCompleted ? 'completed' : 'draft',
        overall_risk_level: formData.overall_risk_level || null,
        items: formData.items,
        general_notes: formData.general_notes,
        next_review_date: formData.next_review_date || null,
      };

      if (editingAssessment) {
        await updatePropertyRecord('property_risk_assessments', editingAssessment.id, payload);
      } else {
        await addRiskAssessment(payload);
      }

      setView('list');
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(assessmentId) {
    if (!confirm('Delete this risk assessment? This cannot be undone.')) return;
    setDeleting(assessmentId);
    try {
      await deletePropertyRecord('property_risk_assessments', assessmentId);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleDownloadPDF(assessment) {
    setDownloading(assessment.id);
    try {
      await generatePDF(assessment, property);
    } catch (err) {
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setDownloading(null);
    }
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Risk Assessments
            </h2>
            {riskAssessments.length > 0 && (
              <span className="rounded-full bg-slate-100 dark:bg-[#1e2d4a] px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                {riskAssessments.length}
              </span>
            )}
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 rounded-lg bg-[#0ea03e] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b8532]"
          >
            <HiPlus className="h-4 w-4" /> New Assessment
          </button>
        </div>

        {riskAssessments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8 text-center">
            <HiShieldCheck className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No risk assessments recorded</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Click "New Assessment" to begin a home risk assessment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {riskAssessments.map((ra) => {
              const items = ra.items || [];
              const assessed = getAssessedCount(items);
              const rlc = riskLevelConfig[ra.overall_risk_level] || {};
              const sc = statusConfig[ra.status] || statusConfig.draft;
              const overdue = ra.next_review_date && isOverdue(ra.next_review_date);
              const nonCompliantCount = items.filter((i) => i.status === 'non_compliant').length;

              return (
                <div
                  key={ra.id}
                  className={`rounded-xl border bg-white dark:bg-[#162036] p-6 transition-all ${
                    overdue ? 'border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-900' : 'border-slate-200 dark:border-[#263554]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1e2d4a] flex-shrink-0">
                        <HiShieldCheck className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900 dark:text-white">Risk Assessment</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${sc}`}>
                            {ra.status || 'draft'}
                          </span>
                          {ra.overall_risk_level && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${rlc.badge || 'bg-slate-100 text-slate-500'}`}>
                              {ra.overall_risk_level}
                            </span>
                          )}
                          {overdue && (
                            <span className="rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                              OVERDUE
                            </span>
                          )}
                          {nonCompliantCount > 0 && (
                            <span className="rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                              {nonCompliantCount} non-compliant
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <HiCalendar className="h-3 w-3" /> {formatDateShort(ra.assessment_date)}
                          </span>
                          {ra.assessor && (
                            <span className="flex items-center gap-1">
                              <HiUser className="h-3 w-3" /> {ra.assessor}
                            </span>
                          )}
                          {ra.next_review_date && (
                            <span className={`flex items-center gap-1 font-medium ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              <HiClock className="h-3 w-3" /> Next review: {formatDateShort(ra.next_review_date)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            {assessed}/{items.length} items assessed
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {ra.status === 'completed' && (
                        <button
                          onClick={() => handleDownloadPDF(ra)}
                          disabled={downloading === ra.id}
                          className="rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#1e2d4a] px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263554] disabled:opacity-50"
                        >
                          {downloading === ra.id ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 inline-block" />
                          ) : (
                            <HiArrowDownTray className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(ra)}
                        className="rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#1e2d4a] px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263554]"
                      >
                        <HiPencilSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ra.id)}
                        disabled={deleting === ra.id}
                        className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-[#1e2d4a] px-2.5 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        {deleting === ra.id ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-600 inline-block" />
                        ) : (
                          <HiTrash className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── FORM VIEW ─────────────────────────────────────────────────────────

  const assessedCount = getAssessedCount(formData.items);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => setView('list')}
        className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
      >
        <HiArrowLeft className="h-4 w-4" /> Back to Assessments
      </button>

      {/* Header info card */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-5">
          {editingAssessment ? 'Edit Risk Assessment' : 'New Risk Assessment'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Assessment Date */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Assessment Date *
            </label>
            <input
              type="date"
              value={formData.assessment_date}
              onChange={(e) => setFormData((f) => ({ ...f, assessment_date: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#0c1425] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#0ea03e] focus:ring-1 focus:ring-[#0ea03e] outline-none"
            />
          </div>

          {/* Assessor */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Assessor
            </label>
            <input
              type="text"
              value={formData.assessor}
              onChange={(e) => setFormData((f) => ({ ...f, assessor: e.target.value }))}
              placeholder="Assessor name"
              className="w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#0c1425] px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-[#0ea03e] focus:ring-1 focus:ring-[#0ea03e] outline-none"
            />
          </div>

          {/* Next Review Date */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Next Review Date
            </label>
            <input
              type="date"
              value={formData.next_review_date}
              onChange={(e) => setFormData((f) => ({ ...f, next_review_date: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#0c1425] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#0ea03e] focus:ring-1 focus:ring-[#0ea03e] outline-none"
            />
          </div>

          {/* Overall Risk Level */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Overall Risk Level
            </label>
            <div className="flex gap-2">
              {['low', 'medium', 'high', 'critical'].map((level) => {
                const isActive = formData.overall_risk_level === level;
                const colors = {
                  low: isActive ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-[#0c1425] text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20',
                  medium: isActive ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-[#0c1425] text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20',
                  high: isActive ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-[#0c1425] text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20',
                  critical: isActive ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-[#0c1425] text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20',
                };
                return (
                  <button
                    key={level}
                    onClick={() => setFormData((f) => ({ ...f, overall_risk_level: f.overall_risk_level === level ? '' : level }))}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${colors[level]}`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* General Notes */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            General Notes
          </label>
          <textarea
            value={formData.general_notes}
            onChange={(e) => setFormData((f) => ({ ...f, general_notes: e.target.value }))}
            rows={2}
            placeholder="General observations or notes about this assessment..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#0c1425] px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-[#0ea03e] focus:ring-1 focus:ring-[#0ea03e] outline-none resize-none"
          />
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 dark:bg-[#1e2d4a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0ea03e] rounded-full transition-all duration-300"
              style={{ width: `${(assessedCount / TOTAL_ITEMS) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">
            {assessedCount}/{TOTAL_ITEMS} assessed
          </span>
        </div>
      </div>

      {/* Category Accordions */}
      {RISK_CATEGORIES.map((cat) => {
        const isExpanded = expandedCategories[cat.category] ?? false;
        const summary = getCategorySummary(formData.items, cat.category);

        return (
          <div
            key={cat.category}
            className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(cat.category)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
            >
              <div className="flex items-center gap-3">
                <HiShieldCheck className="h-5 w-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{cat.category}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {summary.compliant > 0 && (
                      <span className="text-xs text-green-600 dark:text-green-400">{summary.compliant} compliant</span>
                    )}
                    {summary.nonCompliant > 0 && (
                      <span className="text-xs text-red-600 dark:text-red-400">{summary.nonCompliant} non-compliant</span>
                    )}
                    {summary.na > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">{summary.na} N/A</span>
                    )}
                    {summary.notAssessed > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">{summary.notAssessed} remaining</span>
                    )}
                  </div>
                </div>
              </div>
              <HiChevronDown className={`h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Category Items */}
            {isExpanded && (
              <div className="border-t border-slate-200 dark:border-[#263554]">
                {cat.items.map((itemText, idx) => {
                  const itemData = formData.items.find(
                    (i) => i.category === cat.category && i.item === itemText
                  ) || { status: 'not_assessed', notes: '', action_required: '' };

                  const noteKey = `${cat.category}::${itemText}`;
                  const showNotes = expandedNotes[noteKey] || itemData.status === 'non_compliant';

                  return (
                    <div
                      key={idx}
                      className={`px-6 py-4 ${idx < cat.items.length - 1 ? 'border-b border-slate-100 dark:border-[#1e2d4a]' : ''}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Item text */}
                        <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 min-w-0">
                          {itemText}
                        </p>

                        {/* Status buttons */}
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => updateItemStatus(cat.category, itemText, 'compliant')}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              itemData.status === 'compliant'
                                ? 'bg-green-600 text-white'
                                : 'bg-white dark:bg-[#0c1425] text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                          >
                            <HiCheckCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Compliant</span>
                          </button>
                          <button
                            onClick={() => updateItemStatus(cat.category, itemText, 'non_compliant')}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              itemData.status === 'non_compliant'
                                ? 'bg-red-600 text-white'
                                : 'bg-white dark:bg-[#0c1425] text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                          >
                            <HiXCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Non-Compliant</span>
                          </button>
                          <button
                            onClick={() => updateItemStatus(cat.category, itemText, 'na')}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              itemData.status === 'na'
                                ? 'bg-slate-500 text-white'
                                : 'bg-white dark:bg-[#0c1425] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                            }`}
                          >
                            <HiMinusCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">N/A</span>
                          </button>
                          {/* Toggle notes */}
                          <button
                            onClick={() => toggleNotes(noteKey)}
                            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors border ${
                              showNotes
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                : 'bg-white dark:bg-[#0c1425] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                            }`}
                            title="Add notes"
                          >
                            Notes
                          </button>
                        </div>
                      </div>

                      {/* Notes & Action Required */}
                      {showNotes && (
                        <div className="mt-3 space-y-2 pl-0 sm:pl-0">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</label>
                            <textarea
                              value={itemData.notes}
                              onChange={(e) => updateItemField(cat.category, itemText, 'notes', e.target.value)}
                              rows={2}
                              placeholder="Add notes..."
                              className="w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0c1425] px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-[#0ea03e] focus:ring-1 focus:ring-[#0ea03e] outline-none resize-none"
                            />
                          </div>
                          {itemData.status === 'non_compliant' && (
                            <div>
                              <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                                <HiExclamationTriangle className="h-3 w-3 inline mr-1" />
                                Action Required
                              </label>
                              <textarea
                                value={itemData.action_required}
                                onChange={(e) => updateItemField(cat.category, itemText, 'action_required', e.target.value)}
                                rows={2}
                                placeholder="Describe the corrective action required..."
                                className="w-full rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-red-300 dark:placeholder:text-red-700 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none resize-none"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Save buttons */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {assessedCount}/{TOTAL_ITEMS} items assessed
          {formData.items.filter((i) => i.status === 'non_compliant').length > 0 && (
            <span className="ml-2 text-red-500 dark:text-red-400 font-medium">
              ({formData.items.filter((i) => i.status === 'non_compliant').length} non-compliant)
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setView('list')}
            disabled={saving}
            className="rounded-lg border border-slate-200 dark:border-[#263554] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50"
          >
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#0ea03e] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b8532] disabled:opacity-50"
          >
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            Complete Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
