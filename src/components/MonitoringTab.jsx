import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  HiPlus, HiTrash, HiCog6Tooth, HiChartBar,
  HiCheckCircle, HiXMark, HiPencilSquare, HiArrowDownTray,
} from 'react-icons/hi2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ButtonDanger, ModalError } from './ui/Modal';
import { FormInput, FormSelect, FormTextarea, FormRow } from './ui/FormComponents';
import { useAuth } from '../contexts/AuthContext';
import { toLocalDate, toLocalDatetime } from '../lib/dates';

// ─── Chart Type Definitions ──────────────────────────────────────────────────

const CHART_TYPES = {
  bgl: {
    label: 'Blood Glucose (BGL)',
    unit: 'mmol/L',
    color: '#8b5cf6',
    icon: '🩸',
    low: 4.0,
    high: 10.0,
    description: 'Blood glucose level monitoring',
    numeric: true,
  },
  blood_pressure: {
    label: 'Blood Pressure',
    unit: 'mmHg',
    color: '#ef4444',
    icon: '❤️',
    description: 'Systolic/diastolic blood pressure',
    numeric: true,
  },
  weight: {
    label: 'Weight',
    unit: 'kg',
    color: '#3b82f6',
    icon: '⚖️',
    description: 'Body weight tracking',
    numeric: true,
  },
  temperature: {
    label: 'Temperature',
    unit: '°C',
    color: '#f59e0b',
    icon: '🌡️',
    low: 36.0,
    high: 37.5,
    description: 'Body temperature monitoring',
    numeric: true,
  },
  catheter: {
    label: 'Catheter Management',
    unit: '',
    color: '#06b6d4',
    icon: '🏥',
    description: 'Catheter changes, output, and observations',
    numeric: false,
  },
  bowel: {
    label: 'Bowel Chart',
    unit: '',
    color: '#84cc16',
    icon: '📋',
    description: 'Bowel movement tracking (Bristol scale)',
    numeric: false,
  },
  seizure: {
    label: 'Seizure Monitoring',
    unit: '',
    color: '#a855f7',
    icon: '⚡',
    description: 'Seizure events, duration, and triggers',
    numeric: false,
  },
  fluid_intake: {
    label: 'Fluid Intake',
    unit: 'mL',
    color: '#0ea5e9',
    icon: '💧',
    description: 'Daily fluid intake tracking',
    numeric: true,
  },
  fluid_balance: {
    label: 'Fluid Balance',
    unit: 'mL',
    color: '#0284c7',
    icon: '💧',
    description: 'Fluid intake vs output with running balance (for fluid-restricted participants)',
    numeric: true,
    isFluidBalance: true,
  },
  pain: {
    label: 'Pain Scale',
    unit: '/10',
    color: '#f43f5e',
    icon: '😣',
    low: 0,
    high: 3,
    description: 'Pain level monitoring (0-10 scale)',
    numeric: true,
  },
  oxygen: {
    label: 'Oxygen Saturation',
    unit: '%',
    color: '#14b8a6',
    icon: '🫁',
    low: 95,
    high: 100,
    description: 'SpO2 levels',
    numeric: true,
  },
  adl: {
    label: 'ADL Tracking',
    unit: '',
    color: '#ec4899',
    icon: '🧴',
    description: 'Activities of Daily Living — shower, hygiene, meals, dressing, etc.',
    numeric: false,
    isADL: true,
  },
  repositioning: {
    label: 'Repositioning Chart',
    unit: '',
    color: '#7c3aed',
    icon: '🔄',
    description: 'Track repositioning schedule to prevent pressure injuries — position, skin check, staff initials',
    numeric: false,
    isRepositioning: true,
  },
};

// ─── API Functions ───────────────────────────────────────────────────────────

async function fetchMonitoring(participantId) {
  const res = await fetch(`/api/features?action=monitoring-charts&participant_id=${encodeURIComponent(participantId)}`);
  if (!res.ok) throw new Error('Failed to fetch monitoring config');
  return res.json();
}

async function toggleChart(participantId, chartType, enabled) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'monitoring-toggle', participant_id: participantId, chart_type: chartType, enabled }),
  });
  if (!res.ok) throw new Error('Failed to update chart');
  return res.json();
}

async function fetchEntries(participantId, chartType, limit = 60) {
  const res = await fetch(`/api/features?action=monitoring-entries&participant_id=${encodeURIComponent(participantId)}&chart_type=${encodeURIComponent(chartType)}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch entries');
  return res.json();
}

async function addEntry(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'monitoring-add', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add entry');
  }
  return res.json();
}

async function deleteEntry(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'monitoring-delete', id }),
  });
  if (!res.ok) throw new Error('Failed to delete entry');
  return res.json();
}

// ─── PDF Export Helper ──────────────────────────────────────────────────────

function generateChartPDF({ title, participantName, ndisNumber, columns, rows, totalsRow, dateRange }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, ML = 14, MR = 14, CW = W - ML - MR;
  let y = 14;

  // Green header bar
  pdf.setFillColor(14, 160, 62);
  pdf.rect(0, 0, W, 8, 'F');

  // Logo text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(14, 160, 62);
  pdf.text('One Life Foundation', ML, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(120, 130, 150);
  pdf.text('ABN: 21 665 521 942  |  1300 ONE LIFE  |  admin@onelifefoundation.com.au', W - MR, y + 6, { align: 'right' });
  y += 14;

  // Title
  pdf.setFillColor(14, 160, 62);
  pdf.rect(ML, y, CW, 9, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(255, 255, 255);
  pdf.text(title, W / 2, y + 6.5, { align: 'center' });
  y += 14;

  // Participant info
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Participant:', ML, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(30, 41, 59);
  pdf.text(participantName || 'N/A', ML + 25, y);

  if (ndisNumber) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('NDIS:', ML + 90, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    pdf.text(ndisNumber, ML + 102, y);
  }

  if (dateRange) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Period:', W - MR - 60, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    pdf.text(dateRange, W - MR - 46, y);
  }

  y += 4;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Generated:', ML, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 41, 59);
  pdf.text(new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), ML + 25, y);
  y += 8;

  // Table header
  const colWidths = columns.map(c => c.width || (CW / columns.length));
  pdf.setFillColor(241, 245, 249);
  pdf.rect(ML, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  let cx = ML;
  columns.forEach((col, i) => {
    pdf.text(col.header, cx + 2, y + 5, col.align === 'right' ? { align: 'right', maxWidth: colWidths[i] - 4 } : undefined);
    if (col.align === 'right') cx += colWidths[i];
    else cx += colWidths[i];
  });
  y += 8;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  for (const row of rows) {
    if (y > 275) {
      pdf.addPage();
      y = 14;
    }
    // Alternate bg
    if (rows.indexOf(row) % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(ML, y - 1, CW, 6, 'F');
    }
    cx = ML;
    columns.forEach((col, i) => {
      const val = row[col.key] ?? '';
      const textColor = col.colorFn ? col.colorFn(val, row) : [30, 41, 59];
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', col.bold ? 'bold' : 'normal');
      if (col.align === 'right') {
        pdf.text(String(val), cx + colWidths[i] - 2, y + 3, { align: 'right' });
      } else {
        const lines = pdf.splitTextToSize(String(val), colWidths[i] - 4);
        pdf.text(lines[0] || '', cx + 2, y + 3);
      }
      cx += colWidths[i];
    });
    y += 6;
  }

  // Totals row
  if (totalsRow) {
    pdf.setDrawColor(14, 160, 62);
    pdf.setLineWidth(0.5);
    pdf.line(ML, y, ML + CW, y);
    y += 2;
    pdf.setFillColor(236, 253, 245);
    pdf.rect(ML, y - 1, CW, 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    cx = ML;
    columns.forEach((col, i) => {
      const val = totalsRow[col.key] ?? '';
      pdf.setTextColor(30, 41, 59);
      if (col.align === 'right') {
        pdf.text(String(val), cx + colWidths[i] - 2, y + 4, { align: 'right' });
      } else {
        pdf.text(String(val), cx + 2, y + 4);
      }
      cx += colWidths[i];
    });
  }

  // Footer
  const footerY = 290;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(ML, footerY - 4, W - MR, footerY - 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('One Life Foundation Pty Ltd  |  ABN: 21 665 521 942  |  1300 ONE LIFE', W / 2, footerY, { align: 'center' });

  return pdf;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MonitoringTab({ participantId, isAdmin, participantName = '', ndisNumber = '' }) {
  const [enabledCharts, setEnabledCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [activeChart, setActiveChart] = useState(null);

  async function loadCharts() {
    setLoading(true);
    try {
      const data = await fetchMonitoring(participantId);
      const charts = (data.charts || []).filter(c => c.enabled);
      setEnabledCharts(charts);
      if (charts.length > 0 && !activeChart) {
        setActiveChart(charts[0].chart_type);
      }
    } catch { /* silently fail */ }
    setLoading(false);
  }

  useEffect(() => { loadCharts(); }, [participantId]);

  async function handleToggle(chartType, enabled) {
    try {
      await toggleChart(participantId, chartType, enabled);
      await loadCharts();
    } catch { /* */ }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-[#1e2d4a]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header with config button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {enabledCharts.length === 0 ? 'No monitoring charts configured' : `${enabledCharts.length} active chart${enabledCharts.length !== 1 ? 's' : ''}`}
        </p>
        {isAdmin && (
          <button
            onClick={() => setConfigOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
          >
            <HiCog6Tooth className="h-4 w-4" />
            Configure Charts
          </button>
        )}
      </div>

      {/* Empty state */}
      {enabledCharts.length === 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <HiChartBar className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No monitoring charts enabled for this participant</p>
          {isAdmin && (
            <button
              onClick={() => setConfigOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
            >
              <HiPlus className="h-4 w-4" />
              Add Charts
            </button>
          )}
        </div>
      )}

      {/* Chart tabs */}
      {enabledCharts.length > 0 && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {enabledCharts.map(c => {
              const config = CHART_TYPES[c.chart_type];
              if (!config) return null;
              return (
                <button
                  key={c.chart_type}
                  onClick={() => setActiveChart(c.chart_type)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeChart === c.chart_type
                      ? 'bg-white dark:bg-[#162036] border border-slate-200 dark:border-[#334766] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1e2d4a]'
                  }`}
                >
                  <span>{config.icon}</span>
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Active chart panel */}
          {activeChart && (
            activeChart === 'fluid_balance' ? (
              <FluidBalancePanel key={activeChart} participantId={participantId} participantName={participantName} ndisNumber={ndisNumber} />
            ) : (
              <ChartPanel key={activeChart} participantId={participantId} chartType={activeChart} participantName={participantName} ndisNumber={ndisNumber} />
            )
          )}
        </>
      )}

      {/* Config Modal */}
      <Modal isOpen={configOpen} onClose={() => setConfigOpen(false)} title="Configure Monitoring Charts" icon={HiCog6Tooth} size="md">
        <ModalBody>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Enable the charts relevant to this participant's conditions.
          </p>
          <div className="space-y-2">
            {Object.entries(CHART_TYPES).map(([key, config]) => {
              const isEnabled = enabledCharts.some(c => c.chart_type === key);
              return (
                <button
                  key={key}
                  onClick={() => handleToggle(key, !isEnabled)}
                  className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                    isEnabled
                      ? 'border-accent-300 dark:border-accent-700 bg-accent-50/50 dark:bg-accent-900/10'
                      : 'border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                  }`}
                >
                  <span className="text-xl">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{config.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
                  </div>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    isEnabled ? 'bg-accent-500 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                  }`}>
                    {isEnabled && <HiCheckCircle className="h-4 w-4" />}
                  </div>
                </button>
              );
            })}
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonPrimary onClick={() => setConfigOpen(false)}>Done</ButtonPrimary>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── Chart Panel ─────────────────────────────────────────────────────────────

function ChartPanel({ participantId, chartType, participantName = '', ndisNumber = '' }) {
  const config = CHART_TYPES[chartType];
  const { profile } = useAuth();
  const staffName = profile?.full_name || profile?.email || '';
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ value: '', value_text: '', notes: '', recorded_by: staffName, recorded_at: toLocalDatetime(), adl_activity: '', adl_support: '', adl_completed: 'Yes', adl_mood: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchEntries(participantId, chartType);
      setEntries(data.entries || []);
    } catch { /* */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [participantId, chartType]);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let valueText = !config.numeric ? form.value_text : null;

      // For ADL, build structured value_text from adl fields
      if (config.isADL) {
        valueText = JSON.stringify({
          activity: form.adl_activity || '',
          support_level: form.adl_support || '',
          completed: form.adl_completed || '',
          mood: form.adl_mood || '',
        });
      }

      // For Repositioning, build structured value_text
      if (config.isRepositioning) {
        valueText = JSON.stringify({
          position: form.repo_position || '',
          skin_condition: form.repo_skin || '',
          pressure_areas: form.repo_pressure || '',
          comfort: form.repo_comfort || '',
          frequency: form.repo_frequency || '',
        });
      }

      await addEntry({
        participant_id: participantId,
        chart_type: chartType,
        value: config.numeric ? parseFloat(form.value) : null,
        value_text: valueText,
        notes: form.notes,
        recorded_by: form.recorded_by,
        recorded_at: form.recorded_at ? new Date(form.recorded_at).toISOString() : undefined,
      });
      setAddOpen(false);
      setForm({ value: '', value_text: '', notes: '', recorded_by: staffName, recorded_at: toLocalDatetime(), adl_activity: '', adl_support: '', adl_completed: 'Yes', adl_mood: '', repo_position: '', repo_skin: '', repo_pressure: '', repo_comfort: '', repo_frequency: '2h' });
      load();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteEntry(deleteId);
      setDeleteId(null);
      load();
    } catch { /* */ }
    setDeleting(false);
  }

  const chartData = [...entries].reverse().map(e => ({
    date: new Date(e.recorded_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    time: new Date(e.recorded_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
    value: e.value,
    notes: e.notes,
  }));

  return (
    <div className="space-y-4">
      {/* Chart header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">{config.label}</h3>
          {config.unit && <span className="text-xs text-slate-400">({config.unit})</span>}
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <button
              onClick={() => {
                const fmt = (d) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
                const fmtTime = (d) => new Date(d).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
                const cols = [
                  { key: 'datetime', header: 'Date / Time', width: 35 },
                  { key: 'reading', header: config.numeric ? `Reading (${config.unit})` : 'Details', width: 40, bold: true },
                  { key: 'notes', header: 'Notes', width: 55 },
                  { key: 'by', header: 'Recorded By', width: 32 },
                ];
                const rows = entries.map(e => ({
                  datetime: `${fmt(e.recorded_at)} ${fmtTime(e.recorded_at)}`,
                  reading: config.numeric ? `${e.value} ${config.unit}` : (e.value_text || '--'),
                  notes: e.notes || '--',
                  by: e.recorded_by || '--',
                }));
                const dates = entries.map(e => e.recorded_at).sort();
                const pdf = generateChartPDF({
                  title: `${config.label} — Monitoring Report`,
                  participantName, ndisNumber, columns: cols, rows,
                  dateRange: dates.length ? `${fmt(dates[0])} — ${fmt(dates[dates.length - 1])}` : '',
                });
                pdf.save(`${config.label.replace(/\s+/g, '_')}_${participantName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
            >
              <HiArrowDownTray className="h-4 w-4" />
              PDF
            </button>
          )}
          <button
            onClick={() => {
              setAddOpen(true);
              setError(null);
              setForm({ value: '', value_text: '', notes: '', recorded_by: staffName, recorded_at: toLocalDatetime(), adl_activity: '', adl_support: '', adl_completed: 'Yes', adl_mood: '', repo_position: '', repo_skin: '', repo_pressure: '', repo_comfort: '', repo_frequency: '2h' });
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
          >
            <HiPlus className="h-4 w-4" />
            Add Reading
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-[#1e2d4a]" />
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <p className="text-sm text-slate-400">No readings recorded yet</p>
        </div>
      ) : (
        <>
          {/* Line chart for numeric data */}
          {config.numeric && chartData.length > 1 && (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334766" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#162036', border: '1px solid #334766', borderRadius: '8px', fontSize: '13px' }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: config.color }}
                    formatter={(val) => [`${val} ${config.unit}`, config.label]}
                  />
                  {config.low != null && (
                    <ReferenceLine y={config.low} stroke="#22c55e" strokeDasharray="4 4" label={{ value: `Low (${config.low})`, fill: '#22c55e', fontSize: 10 }} />
                  )}
                  {config.high != null && (
                    <ReferenceLine y={config.high} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `High (${config.high})`, fill: '#ef4444', fontSize: 10 }} />
                  )}
                  <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} dot={{ r: 4, fill: config.color }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Entries table/log */}
          <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e]">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date/Time</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {config.isRepositioning ? 'Position / Skin' : config.isADL ? 'Activity' : config.numeric ? 'Reading' : 'Details'}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recorded By</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                  {entries.map(entry => {
                    const dt = new Date(entry.recorded_at);
                    const isHigh = config.numeric && config.high != null && entry.value > config.high;
                    const isLow = config.numeric && config.low != null && entry.value < config.low;
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-[#1e2d4a]/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-400">
                            {dt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          {config.isRepositioning ? (() => {
                            let repo = {};
                            try { repo = JSON.parse(entry.value_text || '{}'); } catch { repo = { position: entry.value_text }; }
                            const skinColor = repo.skin_condition === 'Intact' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : repo.skin_condition === 'Redness' || repo.skin_condition === 'Blanching' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                              : repo.skin_condition === 'Non-Blanching' || repo.skin_condition === 'Broken' ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500';
                            const freqLabel = { '1h': 'Every 1h', '2h': 'Every 2h', '3h': 'Every 3h', '4h': 'Every 4h', 'prn': 'PRN' };
                            return (
                              <div className="space-y-1">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{repo.position || '--'}</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {repo.frequency && (
                                    <span className="rounded-md bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">{freqLabel[repo.frequency] || repo.frequency}</span>
                                  )}
                                  {repo.skin_condition && (
                                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${skinColor}`}>{repo.skin_condition}</span>
                                  )}
                                  {repo.pressure_areas && (
                                    <span className="rounded-md bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">{repo.pressure_areas}</span>
                                  )}
                                  {repo.comfort && (
                                    <span className="rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">{repo.comfort}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })() : config.isADL ? (() => {
                            let adl = {};
                            try { adl = JSON.parse(entry.value_text || '{}'); } catch { adl = { activity: entry.value_text }; }
                            const completedColor = adl.completed === 'Yes' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : adl.completed === 'Partial' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                              : adl.completed === 'Refused' ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500';
                            return (
                              <div className="space-y-1">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{adl.activity || '--'}</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {adl.support_level && (
                                    <span className="rounded-md bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 text-[10px] font-semibold text-pink-600 dark:text-pink-400">{adl.support_level}</span>
                                  )}
                                  {adl.completed && (
                                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${completedColor}`}>{adl.completed}</span>
                                  )}
                                  {adl.mood && (
                                    <span className="rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">{adl.mood}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })() : config.numeric ? (
                            <span className={`text-sm font-semibold ${
                              isHigh ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-slate-900 dark:text-white'
                            }`}>
                              {entry.value} {config.unit}
                              {isHigh && <span className="ml-1.5 text-[10px] font-bold text-red-500 uppercase">High</span>}
                              {isLow && <span className="ml-1.5 text-[10px] font-bold text-amber-500 uppercase">Low</span>}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-700 dark:text-slate-300">{entry.value_text || '--'}</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{entry.notes || '--'}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-slate-500 dark:text-slate-400">{entry.recorded_by || '--'}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setDeleteId(entry.id)}
                            className="rounded p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <HiTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Entry Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title={`Add ${config.label} Reading`} icon={HiPlus} size="md">
        <form onSubmit={handleAdd}>
          <ModalBody>
            <ModalError message={error} />
            <div className="space-y-5">
              <FormInput
                label="Date & Time"
                required
                type="datetime-local"
                value={form.recorded_at}
                onChange={e => setForm(f => ({ ...f, recorded_at: e.target.value }))}
              />
              {config.isADL ? (
                <>
                  <FormSelect
                    label="Activity"
                    required
                    value={form.adl_activity}
                    onChange={e => setForm(f => ({ ...f, adl_activity: e.target.value }))}
                  >
                    <option value="">Select activity...</option>
                    <option value="Shower">Shower</option>
                    <option value="Sponge Bath">Sponge Bath</option>
                    <option value="Oral Hygiene">Oral Hygiene (teeth/dentures)</option>
                    <option value="Hair Care">Hair Care (wash/brush/style)</option>
                    <option value="Skin Care">Skin Care (moisturiser/cream)</option>
                    <option value="Nail Care">Nail Care</option>
                    <option value="Shaving">Shaving</option>
                    <option value="Dressing">Dressing / Undressing</option>
                    <option value="Toileting">Toileting</option>
                    <option value="Continence">Continence Management</option>
                    <option value="Meal Prep">Meal Preparation</option>
                    <option value="Eating">Eating / Feeding</option>
                    <option value="Mobility">Mobility / Transfers</option>
                    <option value="Laundry">Laundry</option>
                    <option value="Cleaning">Light Cleaning</option>
                    <option value="Other">Other</option>
                  </FormSelect>
                  <FormRow>
                    <FormSelect
                      label="Level of Support"
                      required
                      value={form.adl_support}
                      onChange={e => setForm(f => ({ ...f, adl_support: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option value="Independent">Independent</option>
                      <option value="Verbal Prompt">Verbal Prompt</option>
                      <option value="Physical Assist">Physical Assist</option>
                      <option value="Full Assist">Full Assist</option>
                      <option value="Refused">Refused</option>
                    </FormSelect>
                    <FormSelect
                      label="Completed?"
                      value={form.adl_completed}
                      onChange={e => setForm(f => ({ ...f, adl_completed: e.target.value }))}
                    >
                      <option value="Yes">Yes</option>
                      <option value="Partial">Partial</option>
                      <option value="No">No</option>
                      <option value="Refused">Refused</option>
                    </FormSelect>
                  </FormRow>
                  <FormSelect
                    label="Mood / Behaviour"
                    value={form.adl_mood}
                    onChange={e => setForm(f => ({ ...f, adl_mood: e.target.value }))}
                  >
                    <option value="">Select (optional)...</option>
                    <option value="Happy">Happy</option>
                    <option value="Content">Content</option>
                    <option value="Cooperative">Cooperative</option>
                    <option value="Anxious">Anxious</option>
                    <option value="Agitated">Agitated</option>
                    <option value="Resistant">Resistant</option>
                    <option value="Upset">Upset</option>
                    <option value="Neutral">Neutral</option>
                  </FormSelect>
                </>
              ) : config.isRepositioning ? (
                <>
                  <FormSelect
                    label="Frequency"
                    required
                    value={form.repo_frequency}
                    onChange={e => setForm(f => ({ ...f, repo_frequency: e.target.value }))}
                  >
                    <option value="1h">Every 1 hour</option>
                    <option value="2h">Every 2 hours</option>
                    <option value="3h">Every 3 hours</option>
                    <option value="4h">Every 4 hours</option>
                    <option value="prn">PRN (as needed)</option>
                  </FormSelect>
                  <FormRow>
                    <FormSelect
                      label="Position"
                      required
                      value={form.repo_position}
                      onChange={e => setForm(f => ({ ...f, repo_position: e.target.value }))}
                    >
                      <option value="">Select position...</option>
                      <option value="Left Side">Left Side</option>
                      <option value="Right Side">Right Side</option>
                      <option value="Back">Back (Supine)</option>
                      <option value="Elevated Back">Elevated Back (30°)</option>
                      <option value="Sitting Upright">Sitting Upright</option>
                      <option value="Prone">Prone (Stomach)</option>
                      <option value="Semi-Fowler">Semi-Fowler (45°)</option>
                    </FormSelect>
                    <FormSelect
                      label="Skin Condition"
                      required
                      value={form.repo_skin}
                      onChange={e => setForm(f => ({ ...f, repo_skin: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option value="Intact">Intact — No concerns</option>
                      <option value="Redness">Redness / Discolouration</option>
                      <option value="Blanching">Blanching (returns to normal)</option>
                      <option value="Non-Blanching">Non-Blanching (does not return)</option>
                      <option value="Broken">Broken Skin / Wound</option>
                      <option value="Dry">Dry / Flaky</option>
                      <option value="Moisture">Moisture Damage</option>
                    </FormSelect>
                  </FormRow>
                  <FormRow>
                    <FormSelect
                      label="Pressure Areas Checked"
                      value={form.repo_pressure}
                      onChange={e => setForm(f => ({ ...f, repo_pressure: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option value="Sacrum">Sacrum / Tailbone</option>
                      <option value="Heels">Heels</option>
                      <option value="Hips">Hips</option>
                      <option value="Shoulders">Shoulders</option>
                      <option value="Elbows">Elbows</option>
                      <option value="Ears">Ears</option>
                      <option value="Multiple">Multiple Areas</option>
                      <option value="All">All Areas Checked</option>
                    </FormSelect>
                    <FormSelect
                      label="Comfort Level"
                      value={form.repo_comfort}
                      onChange={e => setForm(f => ({ ...f, repo_comfort: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option value="Comfortable">Comfortable</option>
                      <option value="Settled">Settled after repositioning</option>
                      <option value="Mild Discomfort">Mild Discomfort</option>
                      <option value="Pain">Pain — reported or observed</option>
                      <option value="Refused">Refused repositioning</option>
                      <option value="Asleep">Asleep — minimal disturbance</option>
                    </FormSelect>
                  </FormRow>
                </>
              ) : config.numeric ? (
                <FormInput
                  label={`Reading (${config.unit})`}
                  required
                  type="number"
                  step="0.1"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={`e.g. ${chartType === 'bgl' ? '6.5' : chartType === 'weight' ? '72' : chartType === 'temperature' ? '36.8' : '120'}`}
                />
              ) : (
                <FormTextarea
                  label="Details"
                  required
                  value={form.value_text}
                  onChange={e => setForm(f => ({ ...f, value_text: e.target.value }))}
                  rows={3}
                  placeholder={
                    chartType === 'catheter' ? 'e.g. Catheter changed, 400mL output, clear urine'
                    : chartType === 'bowel' ? 'e.g. Type 4, normal amount, no concerns'
                    : chartType === 'seizure' ? 'e.g. Tonic-clonic, 2 min duration, trigger unknown'
                    : 'Describe the observation...'
                  }
                />
              )}
              <FormTextarea
                label="Notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Additional notes (optional)"
              />
              <FormInput
                label="Recorded By"
                value={form.recorded_by}
                onChange={e => setForm(f => ({ ...f, recorded_by: e.target.value }))}
                placeholder="Staff name"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setAddOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>Save Reading</ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Entry" icon={HiTrash} iconColor="text-red-500" size="sm">
        <ModalBody>
          <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete this entry? This cannot be undone.</p>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteId(null)}>Cancel</ButtonSecondary>
          <ButtonDanger onClick={handleDelete} loading={deleting}>Delete</ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── Fluid Balance Panel ────────────────────────────────────────────────────

const INTAKE_TYPES = ['Oral', 'IV', 'Tube Feed', 'Other'];
const OUTPUT_TYPES = ['Urine (Catheter)', 'Urine (Void)', 'Vomit', 'Drain', 'Other'];

function FluidBalancePanel({ participantId, participantName = '', ndisNumber = '' }) {
  const { profile } = useAuth();
  const staffName = profile?.full_name || profile?.email || '';
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ direction: 'intake', fluid_type: 'Oral', amount: '', notes: '', recorded_by: staffName, recorded_at: toLocalDatetime() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toLocalDate());

  async function load() {
    setLoading(true);
    try {
      const data = await fetchEntries(participantId, 'fluid_balance', 200);
      setEntries(data.entries || []);
    } catch { /* */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [participantId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { setError('Amount must be greater than 0'); return; }
    setSaving(true);
    setError(null);
    try {
      await addEntry({
        participant_id: participantId,
        chart_type: 'fluid_balance',
        value: Number(form.amount),
        value_text: `${form.direction}|${form.fluid_type}`,
        notes: form.notes,
        recorded_by: form.recorded_by,
        recorded_at: form.recorded_at ? new Date(form.recorded_at).toISOString() : undefined,
      });
      setAddOpen(false);
      setForm({ direction: 'intake', fluid_type: 'Oral', amount: '', notes: '', recorded_by: staffName, recorded_at: toLocalDatetime() });
      load();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try { await deleteEntry(deleteId); setDeleteId(null); load(); } catch { /* */ }
    setDeleting(false);
  }

  // Parse entries
  const parsedEntries = entries.map(e => {
    const [dir, fluidType] = (e.value_text || 'intake|Oral').split('|');
    return { ...e, direction: dir, fluid_type: fluidType || '' };
  });

  // Filter by selected date (local timezone)
  const dayEntries = parsedEntries.filter(e => toLocalDate(new Date(e.recorded_at)) === selectedDate)
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

  const totalIntake = dayEntries.filter(e => e.direction === 'intake').reduce((s, e) => s + (e.value || 0), 0);
  const totalOutput = dayEntries.filter(e => e.direction === 'output').reduce((s, e) => s + (e.value || 0), 0);
  const balance = totalIntake - totalOutput;

  // Unique dates (local timezone)
  const allDates = [...new Set(parsedEntries.map(e => toLocalDate(new Date(e.recorded_at))))].sort().reverse();
  if (!allDates.includes(selectedDate)) allDates.unshift(selectedDate);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Fluid Balance Chart</h3>
        </div>
        <div className="flex items-center gap-2">
          {dayEntries.length > 0 && (
            <button
              onClick={() => {
                const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
                const fmtTime = (d) => new Date(d).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
                const cols = [
                  { key: 'time', header: 'Time', width: 22 },
                  { key: 'type', header: 'Type', width: 30 },
                  { key: 'intake', header: 'IN (mL)', width: 22, align: 'right', bold: true, colorFn: (v) => v ? [37, 99, 235] : [200, 200, 200] },
                  { key: 'output', header: 'OUT (mL)', width: 22, align: 'right', bold: true, colorFn: (v) => v ? [217, 119, 6] : [200, 200, 200] },
                  { key: 'notes', header: 'Notes', width: 40 },
                  { key: 'by', header: 'By', width: 26 },
                ];
                const rows = dayEntries.map(e => ({
                  time: fmtTime(e.recorded_at),
                  type: e.fluid_type,
                  intake: e.direction === 'intake' ? String(e.value) : '',
                  output: e.direction === 'output' ? String(e.value) : '',
                  notes: e.notes || '',
                  by: e.recorded_by || '',
                }));
                const totals = { time: 'TOTAL', type: '', intake: String(totalIntake), output: String(totalOutput), notes: `Balance: ${balance >= 0 ? '+' : ''}${balance} mL`, by: '' };
                const pdf = generateChartPDF({
                  title: `Fluid Balance Chart — ${fmt(selectedDate)}`,
                  participantName, ndisNumber, columns: cols, rows, totalsRow: totals,
                  dateRange: fmt(selectedDate),
                });
                pdf.save(`Fluid_Balance_${participantName.replace(/\s+/g, '_')}_${selectedDate}.pdf`);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
            >
              <HiArrowDownTray className="h-4 w-4" /> PDF
            </button>
          )}
          <button onClick={() => { setAddOpen(true); setError(null); setForm(f => ({ ...f, recorded_by: staffName, recorded_at: toLocalDatetime() })); }}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 transition-colors">
            <HiPlus className="h-4 w-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* Date selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm" />
        <div className="flex gap-1 overflow-x-auto">
          {allDates.slice(0, 7).map(d => (
            <button key={d} onClick={() => setSelectedDate(d)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${selectedDate === d ? 'bg-accent-500 text-white' : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}>
              {d === toLocalDate() ? 'Today' : new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Intake</p>
          <p className="mt-1 text-xl font-bold font-mono text-blue-700 dark:text-blue-400">{totalIntake}<span className="text-xs font-normal ml-0.5">mL</span></p>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Output</p>
          <p className="mt-1 text-xl font-bold font-mono text-amber-700 dark:text-amber-400">{totalOutput}<span className="text-xs font-normal ml-0.5">mL</span></p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${balance > 1000 ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${balance > 1000 ? 'text-red-500' : 'text-emerald-500'}`}>Balance</p>
          <p className={`mt-1 text-xl font-bold font-mono ${balance > 1000 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {balance >= 0 ? '+' : ''}{balance}<span className="text-xs font-normal ml-0.5">mL</span>
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-[#1e2d4a]" /> : dayEntries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8 text-center">
          <p className="text-sm text-slate-400">No entries for this date</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-blue-500">IN (mL)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-amber-500">OUT (mL)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">By</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
              {dayEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-[#1e2d4a]/50">
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {new Date(entry.recorded_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      entry.direction === 'intake' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                    }`}>{entry.fluid_type}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {entry.direction === 'intake' ? entry.value : ''}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {entry.direction === 'output' ? entry.value : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{entry.notes || '--'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{entry.recorded_by || '--'}</td>
                  <td className="px-2 py-3">
                    <button onClick={() => setDeleteId(entry.id)} className="rounded p-1 text-slate-400 hover:text-red-500"><HiTrash className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-[#0f1a2e] border-t-2 border-slate-200 dark:border-[#334766]">
                <td colSpan={2} className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Daily Total</td>
                <td className="px-4 py-3 text-right font-mono text-sm font-bold text-blue-700 dark:text-blue-400">{totalIntake}</td>
                <td className="px-4 py-3 text-right font-mono text-sm font-bold text-amber-700 dark:text-amber-400">{totalOutput}</td>
                <td colSpan={3} className="px-4 py-3 text-right">
                  <span className={`font-mono text-sm font-bold ${balance > 1000 ? 'text-red-600' : 'text-emerald-600'}`}>
                    Balance: {balance >= 0 ? '+' : ''}{balance} mL
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Fluid Entry" icon={HiPlus} size="md">
        <form onSubmit={handleAdd}>
          <ModalBody>
            <ModalError message={error} />
            <div className="space-y-5">
              <div>
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Direction</label>
                <div className="flex rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-100 dark:bg-[#0f1b2e] p-1">
                  <button type="button" onClick={() => setForm(f => ({ ...f, direction: 'intake', fluid_type: 'Oral' }))}
                    className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${form.direction === 'intake' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500'}`}>
                    Intake (IN)
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, direction: 'output', fluid_type: 'Urine (Catheter)' }))}
                    className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${form.direction === 'output' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'}`}>
                    Output (OUT)
                  </button>
                </div>
              </div>
              <FormSelect label="Fluid Type" value={form.fluid_type} onChange={e => setForm(f => ({ ...f, fluid_type: e.target.value }))}>
                {(form.direction === 'intake' ? INTAKE_TYPES : OUTPUT_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
              </FormSelect>
              <FormInput label="Amount (mL)" required type="number" min="1" step="1" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 200" />
              <FormInput label="Date & Time" required type="datetime-local" value={form.recorded_at}
                onChange={e => setForm(f => ({ ...f, recorded_at: e.target.value }))} />
              <FormTextarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="e.g. Water, juice, catheter emptied..." />
              <FormInput label="Recorded By" value={form.recorded_by} onChange={e => setForm(f => ({ ...f, recorded_by: e.target.value }))}
                placeholder="Staff name" />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setAddOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>Save Entry</ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Entry" icon={HiTrash} iconColor="text-red-500" size="sm">
        <ModalBody><p className="text-sm text-slate-600 dark:text-slate-300">Delete this fluid entry? This cannot be undone.</p></ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteId(null)}>Cancel</ButtonSecondary>
          <ButtonDanger onClick={handleDelete} loading={deleting}>Delete</ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}
