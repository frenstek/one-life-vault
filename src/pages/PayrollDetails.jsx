import { useState, useEffect } from 'react';
import {
  HiBanknotes,
  HiPencilSquare,
  HiPlus,
  HiTrash,
  HiDocumentArrowDown,
  HiUserGroup,
  HiMagnifyingGlass,
  HiArrowsRightLeft,
  HiArrowUpTray,
  HiDocumentText,
  HiCloudArrowUp,
  HiArchiveBox,
  HiArrowUturnLeft,
} from 'react-icons/hi2';
import { PageHeader } from '../components/ui/FormComponents';
import { FormInput, FormSelect, FormRow, FormDivider, FormTextarea } from '../components/ui/FormComponents';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';

// ─── SCHADS Award Rates (Effective 1 October 2025) ───────────────────────────
// Source: SCHADS Award Pay Rate Reference Guide — One Life Foundation
// Base = FT/PT hourly rate, Casual = base × 1.25
const SCHADS_RATES = {
  'L1 PP1': { base: 26.30, casual: '32.88' },
  'L1 PP2': { base: 27.15, casual: '33.94' },
  'L1 PP3': { base: 28.12, casual: '35.15' },
  'L2 PP1': { base: 34.58, casual: '43.23' },
  'L2 PP2': { base: 35.67, casual: '44.59' },
  'L2 PP3': { base: 36.75, casual: '45.94' },
  'L2 PP4': { base: 37.73, casual: '47.16' },
  'L3 PP1': { base: 38.63, casual: '48.31' },
  'L3 PP2': { base: 39.77, casual: '49.71' },
  'L3 PP3': { base: 40.62, casual: '50.78' },
  'L3 PP4': { base: 41.45, casual: '51.81' },
  'L4 PP1': { base: 44.58, casual: '55.73' },
  'L4 PP2': { base: 45.75, casual: '57.19' },
  'L4 PP3': { base: 46.93, casual: '58.66' },
  'L4 PP4': { base: 47.97, casual: '59.96' },
  'L5 PP1': { base: 51.00, casual: '63.75' },
  'L5 PP2': { base: 52.10, casual: '65.13' },
  'L5 PP3': { base: 53.31, casual: '66.64' },
  'L6 PP1': { base: 55.72, casual: '69.65' },
  'L6 PP2': { base: 56.95, casual: '71.19' },
  'L6 PP3': { base: 58.19, casual: '72.74' },
  'L7 PP1': { base: 60.27, casual: '75.34' },
  'L7 PP2': { base: 61.53, casual: '76.91' },
  'L7 PP3': { base: 62.79, casual: '78.49' },
  'L8 PP1': { base: 65.39, casual: '81.74' },
  'L8 PP2': { base: 66.67, casual: '83.34' },
  'L8 PP3': { base: 67.96, casual: '84.95' },
};

// ─── PDF Report Generation ───────────────────────────────────────────────────

const OLF_NAVY = [15, 82, 138];
const OLF_GREEN = [14, 160, 62];
const WHITE = [255, 255, 255];
const DARK = [30, 41, 59];
const MED = [71, 85, 105];
const LIGHT = [148, 163, 184];
const BORDER = [226, 232, 240];
const LABEL_BG = [245, 247, 250];
const PAGE_W = 297; // A4 landscape
const PAGE_H = 210;
const ML = 12;
const MR = 12;
const CW = PAGE_W - ML - MR;

async function generatePayrollReport(records) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const genDate = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

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

  let pageNum = 1;
  const HEADER_H = 22;
  const MT = 10;
  const BODY_TOP = MT + HEADER_H + 4;
  const BODY_BOTTOM = PAGE_H - 16;

  function drawHeader() {
    pdf.setFillColor(...OLF_NAVY);
    pdf.rect(0, 0, PAGE_W, MT + HEADER_H, 'F');
    let textX = ML;
    if (logoData) {
      try { pdf.addImage(logoData, 'PNG', ML, MT + 1, 22, 11); } catch {}
      textX = ML + 26;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(...WHITE);
    pdf.text('PAYROLL DETAILS REPORT', textX, MT + 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('One Life Foundation', textX, MT + 14);
    pdf.text(`Generated: ${genDate}`, textX, MT + 19);
    pdf.setFontSize(7);
    pdf.text('CONFIDENTIAL', PAGE_W - MR, MT + 8, { align: 'right' });
    pdf.text(`Page ${pageNum}`, PAGE_W - MR, MT + 14, { align: 'right' });
  }

  function newPage() {
    pdf.addPage();
    pageNum++;
    drawHeader();
    return BODY_TOP;
  }

  drawHeader();
  let y = BODY_TOP;

  // ── Summary Table ──
  const tfnRecords = records.filter(r => r.employment_type === 'tfn');
  const abnRecords = records.filter(r => r.employment_type === 'abn');

  // Summary header
  pdf.setFillColor(...OLF_GREEN);
  pdf.rect(ML, y, CW, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...WHITE);
  pdf.text('SUMMARY', ML + 3, y + 5);
  y += 9;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...DARK);
  pdf.text(`Total Staff: ${records.length}    |    TFN Employees: ${tfnRecords.length}    |    ABN Contractors: ${abnRecords.length}`, ML + 3, y + 4);
  y += 8;

  // ── Helper to render a staff section ──
  function renderStaffSection(sectionRecords, sectionTitle, barColor) {
    if (sectionRecords.length === 0) return;

    // Section divider
    if (y + 15 > BODY_BOTTOM) y = newPage();
    pdf.setFillColor(...OLF_NAVY);
    pdf.rect(ML, y, CW, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...WHITE);
    pdf.text(`${sectionTitle} (${sectionRecords.length})`, ML + 3, y + 5.5);
    y += 11;

    for (const record of sectionRecords) {
      if (y + 55 > BODY_BOTTOM) y = newPage();

      // Staff name bar with position
      pdf.setFillColor(...barColor);
      pdf.rect(ML, y, CW, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...WHITE);
      const posLabel = record.position ? `  |  ${record.position}` : '';
      pdf.text(`${record.staff_name}${posLabel}`, ML + 3, y + 5);
      y += 8;

      // Build rows
      const rows = [];
      const isTfn = record.employment_type === 'tfn';
      if (record.bsb) rows.push(['BSB', record.bsb]);
      if (record.account_number) rows.push(['Account Number', record.account_number]);
      if (record.account_name) rows.push(['Account Name', record.account_name]);
      if (record.bank_name) rows.push(['Bank', record.bank_name]);

      if (isTfn) {
      const statusLabels = { full_time: 'Full Time', part_time: 'Part Time', casual: 'Casual' };
      rows.push(['Employment Status', statusLabels[record.employment_status] || 'Casual']);
      if (record.schads_level) rows.push(['SCHADS Level', record.schads_level]);
      if (record.tax_file_number) rows.push(['Tax File Number', record.tax_file_number]);
      rows.push(['Tax-Free Threshold', record.tax_free_threshold ? 'Yes' : 'No']);
      rows.push(['HELP/HECS Debt', record.help_debt ? 'Yes' : 'No']);
      if (record.is_salaried) {
        const sal = parseFloat(record.annual_salary) || 0;
        const fuel = parseFloat(record.fuel_allowance) || 0;
        if (sal) rows.push(['Annual Salary', `$${sal.toLocaleString()}`]);
        if (fuel) rows.push(['Fuel Allowance', `$${fuel.toLocaleString()}/year ($${(fuel / 26).toFixed(2)}/fortnight)`]);
        if (sal) {
          rows.push(['Fortnightly Gross', `$${((sal + fuel) / 26).toFixed(2)}`]);
          rows.push(['Hourly Equivalent', `$${(sal / 52.18 / 38).toFixed(2)}/hr`]);
        }
      }
      if (!record.is_salaried && record.rate_base) rows.push(['Hourly Pay Rate', `$${record.rate_base}/hr`]);
      if (record.rate_saturday) rows.push(['Saturday', `$${record.rate_saturday}/hr`]);
      if (record.rate_sunday) rows.push(['Sunday', `$${record.rate_sunday}/hr`]);
      if (record.rate_public_holiday) rows.push(['Public Holiday', `$${record.rate_public_holiday}/hr`]);
      if (record.rate_afternoon) rows.push(['Afternoon Shift', `$${record.rate_afternoon}/hr`]);
      if (record.rate_night) rows.push(['Night Shift', `$${record.rate_night}/hr`]);
      if (record.rate_overtime) rows.push(['Overtime (first 2hrs)', `$${record.rate_overtime}/hr`]);
      if (record.rate_sleepover) rows.push(['Sleepover Allowance', `$${record.rate_sleepover}`]);
      if (record.super_fund_name) rows.push(['Super Fund', record.super_fund_name]);
      if (record.super_member_number) rows.push(['Super Member No.', record.super_member_number]);
      if (record.super_usi) rows.push(['Super USI', record.super_usi]);
    } else {
      if (record.abn) rows.push(['ABN', record.abn]);
      if (record.business_name) rows.push(['Business Name', record.business_name]);
      rows.push(['GST Registered', record.gst_registered ? 'Yes' : 'No']);
      if (record.abn_rate_weekday) rows.push(['Mon–Fri', `$${record.abn_rate_weekday}/hr`]);
      if (record.abn_rate_saturday) rows.push(['Saturday', `$${record.abn_rate_saturday}/hr`]);
      if (record.abn_rate_sunday) rows.push(['Sunday', `$${record.abn_rate_sunday}/hr`]);
      if (record.abn_rate_public_holiday) rows.push(['Public Holiday', `$${record.abn_rate_public_holiday}/hr`]);
      if (record.abn_sleepover) rows.push(['Sleepover Support', `$${record.abn_sleepover} flat`]);
      if (record.abn_active_overnight) rows.push(['Active Overnight', `$${record.abn_active_overnight} flat`]);
      if (record.abn_inactive_overnight) rows.push(['Inactive Overnight', `$${record.abn_inactive_overnight} flat`]);
    }
      if (record.pay_frequency) rows.push(['Pay Frequency', record.pay_frequency.charAt(0).toUpperCase() + record.pay_frequency.slice(1)]);
      if (record.employment_start_date) rows.push(['Start Date', new Date(record.employment_start_date + 'T00:00:00').toLocaleDateString('en-AU')]);
      if (record.notes) rows.push(['Notes', record.notes]);

      // Draw as 2-column table (label | value), 2 pairs per row for compactness
      const COL_W = CW / 2;
      const LABEL_W = 38;

      for (let i = 0; i < rows.length; i += 2) {
        if (y + 6 > BODY_BOTTOM) y = newPage();
        const rowH = 6;

        for (let col = 0; col < 2; col++) {
          const idx = i + col;
          if (idx >= rows.length) break;
          const [label, value] = rows[idx];
          const ox = ML + col * COL_W;

          pdf.setFillColor(...LABEL_BG);
          pdf.rect(ox, y, LABEL_W, rowH, 'F');
          pdf.setDrawColor(...BORDER);
          pdf.setLineWidth(0.2);
          pdf.rect(ox, y, COL_W, rowH, 'S');
          pdf.line(ox + LABEL_W, y, ox + LABEL_W, y + rowH);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7);
          pdf.setTextColor(...MED);
          pdf.text(label, ox + 2, y + 4);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor(...DARK);
          const valText = pdf.splitTextToSize(String(value || '—'), COL_W - LABEL_W - 4);
          pdf.text(valText[0] || '—', ox + LABEL_W + 2, y + 4);
        }

        y += rowH;
      }

      y += 5;
    }
  }

  // Only include active staff in report
  const activeTfn = tfnRecords.filter(r => r.status !== 'inactive');
  const activeAbn = abnRecords.filter(r => r.status !== 'inactive');
  renderStaffSection(activeTfn, 'TFN — EMPLOYEES', [59, 130, 246]);
  renderStaffSection(activeAbn, 'ABN — CONTRACTORS', [217, 119, 6]);

  // Footer on last page
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.3);
  pdf.line(ML, BODY_BOTTOM + 2, PAGE_W - MR, BODY_BOTTOM + 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(...LIGHT);
  pdf.text('One Life Foundation  |  Payroll Details Report  |  CONFIDENTIAL', ML, BODY_BOTTOM + 6);
  pdf.text(`Page ${pageNum}`, PAGE_W - MR, BODY_BOTTOM + 6, { align: 'right' });

  pdf.save(`OLF_Payroll_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

const API_BASE = '/api/payroll';

const EMPTY_RECORD = {
  staff_name: '',
  employment_type: 'tfn', // 'tfn' or 'abn'
  // Bank details
  bsb: '',
  account_number: '',
  account_name: '',
  bank_name: '',
  // TFN fields
  employment_status: 'casual', // 'full_time', 'part_time', 'casual'
  schads_level: '',
  tax_file_number: '',
  tax_free_threshold: true,
  help_debt: false, // HECS/HELP
  // SCHADS rates
  rate_base: '',
  rate_saturday: '',
  rate_sunday: '',
  rate_public_holiday: '',
  rate_afternoon: '',
  rate_night: '',
  rate_overtime: '',
  rate_sleepover: '',
  // Salary fields
  is_salaried: false,
  annual_salary: '',
  fuel_allowance: '',
  super_fund_name: '',
  super_member_number: '',
  super_usi: '',
  // ABN fields
  abn: '',
  business_name: '',
  gst_registered: false,
  // ABN rates
  abn_rate_weekday: '42.00',
  abn_rate_saturday: '50.00',
  abn_rate_sunday: '60.00',
  abn_rate_public_holiday: '80.00',
  abn_sleepover: '160.00',
  abn_active_overnight: '220.00',
  abn_inactive_overnight: '160.00',
  // Common
  status: 'active', // 'active' or 'inactive'
  position: '',
  pay_rate: '',
  pay_frequency: 'fortnightly',
  employment_start_date: '',
  notes: '',
};

export default function PayrollDetails() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_RECORD);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);

  // File upload state
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewFile, setViewFile] = useState(null);

  useEffect(() => {
    loadRecords();
    loadFiles();
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to load payroll records:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    setForm(EMPTY_RECORD);
    setEditId(null);
    setError('');
    setEditing(true);
  }

  function handleEdit(record) {
    setForm({ ...EMPTY_RECORD, ...record });
    setEditId(record.id);
    setError('');
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.staff_name.trim()) {
      setError('Staff name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const method = editId ? 'PATCH' : 'POST';
      const body = editId ? { ...form, id: editId } : form;
      const res = await fetch(API_BASE, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
      setEditing(false);
      await loadRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(record) {
    const newStatus = record.status === 'inactive' ? 'active' : 'inactive';
    try {
      await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, status: newStatus }),
      });
      await loadRecords();
    } catch {}
  }

  async function handleSwapType(record) {
    const newType = record.employment_type === 'tfn' ? 'abn' : 'tfn';
    try {
      const res = await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, employment_type: newType }),
      });
      if (!res.ok) throw new Error('Failed to update');
      await loadRecords();
    } catch (err) {
      console.error('Swap failed:', err);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API_BASE}?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setDeleteModal(null);
      await loadRecords();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  async function loadFiles() {
    try {
      const res = await fetch('/api/payroll-files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch {}
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('label', file.name);
      const res = await fetch('/api/payroll-files', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      await loadFiles();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDeleteFile(id) {
    try {
      const res = await fetch(`/api/payroll-files?id=${id}`, { method: 'DELETE' });
      /*  fetch only rejects on a network failure — a 500 resolves normally, so
       *  without this check a server-side delete failure was reported as
       *  success and the file stayed in the list. */
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      await loadFiles();
    } catch (err) {
      setError(err.message || 'Could not delete that file.');
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  const searched = records.filter((r) =>
    r.staff_name?.toLowerCase().includes(search.toLowerCase())
  );
  const filtered = searched.filter(r => r.status !== 'inactive');
  const inactive = searched.filter(r => r.status === 'inactive');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Details"
        subtitle="Staff payment and tax information"
        icon={HiBanknotes}
      />

      {/* Actions bar */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full pl-9"
            />
          </div>
          <div className="flex items-center gap-3">
            {records.length > 0 && (
              <button
                onClick={() => generatePayrollReport(filtered)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
              >
                <HiDocumentArrowDown className="h-4 w-4" />
                Download Report
              </button>
            )}
            <button
              onClick={handleNew}
              className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-3 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
            >
              <HiPlus className="h-4 w-4" />
              Add Staff
            </button>
          </div>
        </div>
      </div>

      {/* Records */}
      {loading ? (
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] p-12 text-center">
          <HiBanknotes className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No payroll records</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Click "Add Staff" to create a payroll record.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TFN Employees Table */}
          {filtered.filter(r => r.employment_type === 'tfn').length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-[#334766] bg-blue-50/50 dark:bg-blue-900/10">
                <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  TFN — Employees ({filtered.filter(r => r.employment_type === 'tfn').length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#334766] bg-slate-50 dark:bg-[#1a2844]">
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Name</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Position</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Status</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Pay Frequency</th>
                      <th className="px-5 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.filter(r => r.employment_type === 'tfn').map((record) => (
                      <tr key={record.id} className="border-b border-slate-50 dark:border-[#253552] hover:bg-slate-50/50 dark:hover:bg-[#1e2d4a]/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-slate-800 dark:text-white">{record.staff_name}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{record.position || '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            record.employment_status === 'full_time' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : record.employment_status === 'part_time' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-300'
                          }`}>
                            {record.employment_status === 'full_time' ? 'Full Time' : record.employment_status === 'part_time' ? 'Part Time' : 'Casual'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 capitalize">{record.pay_frequency || '—'}</td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleSwapType(record)} title={`Move to ${record.employment_type === 'tfn' ? 'ABN' : 'TFN'}`} className="rounded-lg p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                              <HiArrowsRightLeft className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleEdit(record)} className="rounded-lg p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-[#263554] transition-colors">
                              <HiPencilSquare className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleToggleStatus(record)} title="Mark inactive" className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#263554] transition-colors">
                              <HiArchiveBox className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteModal(record)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <HiTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABN Contractors Table */}
          {filtered.filter(r => r.employment_type === 'abn').length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-[#334766] bg-amber-50/50 dark:bg-amber-900/10">
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  ABN — Contractors ({filtered.filter(r => r.employment_type === 'abn').length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#334766] bg-slate-50 dark:bg-[#1a2844]">
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Name</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Position</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Pay Frequency</th>
                      <th className="px-5 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">GST</th>
                      <th className="px-5 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.filter(r => r.employment_type === 'abn').map((record) => (
                      <tr key={record.id} className="border-b border-slate-50 dark:border-[#253552] hover:bg-slate-50/50 dark:hover:bg-[#1e2d4a]/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-slate-800 dark:text-white">{record.staff_name}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{record.position || '—'}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 capitalize">{record.pay_frequency || '—'}</td>
                        <td className="px-5 py-4 text-center">
                          {record.gst_registered ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300">Yes</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs">No</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleSwapType(record)} title={`Move to ${record.employment_type === 'tfn' ? 'ABN' : 'TFN'}`} className="rounded-lg p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                              <HiArrowsRightLeft className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleEdit(record)} className="rounded-lg p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-[#263554] transition-colors">
                              <HiPencilSquare className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleToggleStatus(record)} title="Mark inactive" className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#263554] transition-colors">
                              <HiArchiveBox className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteModal(record)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <HiTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Inactive Staff ═══ */}
      {inactive.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] overflow-hidden opacity-70">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#334766] bg-slate-50 dark:bg-[#1a2844]">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <HiArchiveBox className="h-4 w-4" />
              Inactive ({inactive.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#334766] bg-slate-50 dark:bg-[#1a2844]">
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Name</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Position</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Type</th>
                  <th className="px-5 py-3 text-center font-semibold text-slate-500 dark:text-slate-400 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inactive.map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 dark:border-[#253552]">
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{record.staff_name}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{record.position || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        record.employment_type === 'tfn'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400'
                          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400'
                      }`}>
                        {record.employment_type === 'tfn' ? 'TFN' : 'ABN'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleToggleStatus(record)} title="Reactivate" className="rounded-lg p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                          <HiArrowUturnLeft className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteModal(record)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Payroll Reports Upload ═══ */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#334766] flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <HiDocumentText className="h-4 w-4 text-brand-500" />
            Payroll Reports
          </h3>
          <label className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors ${
            uploading ? 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-400' : 'bg-accent-500 text-white hover:bg-accent-600'
          }`}>
            <HiCloudArrowUp className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Report'}
            <input
              type="file"
              accept=".pdf,.xlsx,.xls,.csv,.docx,.doc"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {files.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No payroll reports uploaded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-[#253552]">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-[#1e2d4a]/30 transition-colors">
                <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <HiDocumentText className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{file.label || file.file_name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {formatFileSize(file.file_size)} &middot; {new Date(file.uploaded_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setViewFile(file)}
                  className="rounded-lg p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-[#263554] transition-colors"
                  title="View"
                >
                  <HiDocumentText className="h-4 w-4" />
                </button>
                <a
                  href={file.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-[#263554] transition-colors"
                  title="Download"
                >
                  <HiDocumentArrowDown className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete"
                >
                  <HiTrash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Edit/Add Modal ═══ */}
      <Modal
        isOpen={editing}
        onClose={() => setEditing(false)}
        title={editId ? 'Edit Payroll Details' : 'Add Staff Payroll'}
        icon={HiBanknotes}
        size="xl"
      >
        <form onSubmit={handleSave}>
          <ModalBody>
            {error && <ModalError message={error} />}
            <div className="space-y-8">
              {/* Staff Info */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Staff Information</p>
                <div className="space-y-6">
                  <FormRow>
                    <FormInput label="Staff Name" required value={form.staff_name} onChange={e => setForm(f => ({ ...f, staff_name: e.target.value }))} placeholder="Full name" />
                    <FormSelect label="Position / Role" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}>
                      <option value="">Select role...</option>
                      <option value="Support Worker">Support Worker</option>
                      <option value="Senior Support Worker">Senior Support Worker</option>
                      <option value="Team Leader">Team Leader</option>
                      <option value="Coordinator">Coordinator</option>
                      <option value="Operations Manager">Operations Manager</option>
                      <option value="Admin Officer">Admin Officer</option>
                      <option value="Director">Director</option>
                    </FormSelect>
                  </FormRow>
                  <FormInput label="Employment Start Date" type="date" value={form.employment_start_date} onChange={e => setForm(f => ({ ...f, employment_start_date: e.target.value }))} />

                  {/* Employment type toggle */}
                  <div>
                    <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Employment Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, employment_type: 'tfn' }))}
                        className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                          form.employment_type === 'tfn'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-[#334766] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${form.employment_type === 'tfn' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>TFN (Employee)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tax File Number — PAYG employee</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, employment_type: 'abn' }))}
                        className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                          form.employment_type === 'abn'
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-slate-200 dark:border-[#334766] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${form.employment_type === 'abn' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}`}>ABN (Contractor)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Australian Business Number — invoices</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <FormDivider />

              {/* Bank Details */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Bank Details</p>
                <div className="space-y-6">
                  <FormRow>
                    <FormInput label="BSB" value={form.bsb} onChange={e => setForm(f => ({ ...f, bsb: e.target.value }))} placeholder="000-000" maxLength={7} />
                    <FormInput label="Account Number" value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} placeholder="12345678" />
                  </FormRow>
                  <FormRow>
                    <FormInput label="Account Name" value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} placeholder="Name on account" />
                    <FormInput label="Bank Name" value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="e.g. Commonwealth Bank, ANZ" />
                  </FormRow>
                </div>
              </div>

              <FormDivider />

              {/* TFN Fields */}
              {form.employment_type === 'tfn' && (
                <div>
                  <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-4">Employment & Tax (TFN)</p>
                  <div className="space-y-6">
                    {/* Employment Status */}
                    <div>
                      <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Employment Status</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'full_time', label: 'Full Time' },
                          { value: 'part_time', label: 'Permanent Part Time' },
                          { value: 'casual', label: 'Casual' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const newStatus = opt.value;
                              setForm(f => {
                                const rates = SCHADS_RATES[f.schads_level];
                                if (!rates) return { ...f, employment_status: newStatus };
                                const isCasual = newStatus === 'casual';
                                const base = rates.base;
                                return {
                                  ...f,
                                  employment_status: newStatus,
                                  rate_base: isCasual ? rates.casual : base.toFixed(2),
                                  rate_saturday: isCasual ? (base * 1.75).toFixed(2) : (base * 1.5).toFixed(2),
                                  rate_sunday: isCasual ? (base * 2.25).toFixed(2) : (base * 2.0).toFixed(2),
                                  rate_public_holiday: isCasual ? (base * 2.75).toFixed(2) : (base * 2.5).toFixed(2),
                                  rate_afternoon: isCasual ? (base * 1.25 + base * 0.125).toFixed(2) : (base * 1.125).toFixed(2),
                                  rate_night: isCasual ? (base * 1.25 + base * 0.15).toFixed(2) : (base * 1.15).toFixed(2),
                                  rate_overtime: isCasual ? (base * 1.75).toFixed(2) : (base * 1.5).toFixed(2),
                                  rate_sleepover: '60.02',
                                };
                              });
                            }}
                            className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                              form.employment_status === opt.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'border-slate-200 dark:border-[#334766] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Salaried toggle */}
                    <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-200 dark:border-[#334766] px-4 py-3">
                      <input
                        type="checkbox"
                        checked={form.is_salaried}
                        onChange={e => setForm(f => ({ ...f, is_salaried: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Salaried Employee</span>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Annual salary instead of SCHADS hourly rates</p>
                      </div>
                    </label>

                    {/* Salary fields */}
                    {form.is_salaried && (
                      <>
                        <FormRow>
                          <FormInput label="Annual Salary ($)" value={form.annual_salary} onChange={e => setForm(f => ({ ...f, annual_salary: e.target.value }))} placeholder="e.g. 110000" type="number" step="1000" />
                          <FormInput label="Fuel Allowance ($/year)" value={form.fuel_allowance} onChange={e => setForm(f => ({ ...f, fuel_allowance: e.target.value }))} placeholder="e.g. 3000" type="number" step="100" />
                        </FormRow>
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 space-y-1">
                          {(() => {
                            const sal = parseFloat(form.annual_salary) || 0;
                            const fuel = parseFloat(form.fuel_allowance) || 0;
                            const total = sal + fuel;
                            const fortnightly = total / 26;
                            const salFn = sal / 26;
                            const fuelFn = fuel / 26;
                            return (
                              <>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                  Hourly equivalent: <strong>${sal ? (sal / 52.18 / 38).toFixed(2) : '0.00'}/hr</strong> (38hrs/week × 52.18 weeks)
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                  Fortnightly gross: <strong>${fortnightly ? `$${fortnightly.toFixed(2)}` : '$0.00'}</strong>
                                  {fuel > 0 && <span> (Salary ${salFn.toFixed(2)} + Fuel ${fuelFn.toFixed(2)})</span>}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </>
                    )}

                    <FormRow>
                      <FormInput label="Tax File Number" value={form.tax_file_number} onChange={e => setForm(f => ({ ...f, tax_file_number: e.target.value }))} placeholder="123 456 789" maxLength={11} />
                      {!form.is_salaried && <FormSelect label="SCHADS Level & Pay Point" value={form.schads_level} onChange={e => {
                        const val = e.target.value;
                        const rates = SCHADS_RATES[val];
                        if (rates) {
                          const isCasual = form.employment_status === 'casual';
                          const base = rates.base;
                          setForm(f => ({
                            ...f,
                            schads_level: val,
                            rate_base: isCasual ? rates.casual : base.toFixed(2),
                            rate_saturday: isCasual ? (base * 1.75).toFixed(2) : (base * 1.5).toFixed(2),
                            rate_sunday: isCasual ? (base * 2.25).toFixed(2) : (base * 2.0).toFixed(2),
                            rate_public_holiday: isCasual ? (base * 2.75).toFixed(2) : (base * 2.5).toFixed(2),
                            rate_afternoon: isCasual ? (base * 1.25 + base * 0.125).toFixed(2) : (base * 1.125).toFixed(2),
                            rate_night: isCasual ? (base * 1.25 + base * 0.15).toFixed(2) : (base * 1.15).toFixed(2),
                            rate_overtime: isCasual ? (base * 1.75).toFixed(2) : (base * 1.5).toFixed(2),
                            rate_sleepover: '60.02',
                          }));
                        } else {
                          setForm(f => ({ ...f, schads_level: val }));
                        }
                      }}>
                        <option value="">Select level...</option>
                        <optgroup label="Level 1 — Entry Level (No qualifications)">
                          <option value="L1 PP1">Level 1, PP 1 — $26.30/hr</option>
                          <option value="L1 PP2">Level 1, PP 2 — $27.15/hr</option>
                          <option value="L1 PP3">Level 1, PP 3 — $28.12/hr</option>
                        </optgroup>
                        <optgroup label="Level 2 — Qualified / Cert III or equivalent">
                          <option value="L2 PP1">Level 2, PP 1 — $34.58/hr</option>
                          <option value="L2 PP2">Level 2, PP 2 — $35.67/hr</option>
                          <option value="L2 PP3">Level 2, PP 3 — $36.75/hr</option>
                          <option value="L2 PP4">Level 2, PP 4 — $37.73/hr</option>
                        </optgroup>
                        <optgroup label="Level 3 — Experienced / Cert III + experience / Cert IV">
                          <option value="L3 PP1">Level 3, PP 1 — $38.63/hr</option>
                          <option value="L3 PP2">Level 3, PP 2 — $39.77/hr</option>
                          <option value="L3 PP3">Level 3, PP 3 — $40.62/hr</option>
                          <option value="L3 PP4">Level 3, PP 4 — $41.45/hr</option>
                        </optgroup>
                        <optgroup label="Level 4 — Senior / Team Leader / Coordinator">
                          <option value="L4 PP1">Level 4, PP 1 — $44.58/hr</option>
                          <option value="L4 PP2">Level 4, PP 2 — $45.75/hr</option>
                          <option value="L4 PP3">Level 4, PP 3 — $46.93/hr</option>
                          <option value="L4 PP4">Level 4, PP 4 — $47.97/hr</option>
                        </optgroup>
                        <optgroup label="Level 5 — Advanced / Specialist">
                          <option value="L5 PP1">Level 5, PP 1 — $51.00/hr</option>
                          <option value="L5 PP2">Level 5, PP 2 — $52.10/hr</option>
                          <option value="L5 PP3">Level 5, PP 3 — $53.31/hr</option>
                        </optgroup>
                        <optgroup label="Level 6 — Senior Specialist / Manager">
                          <option value="L6 PP1">Level 6, PP 1 — $55.72/hr</option>
                          <option value="L6 PP2">Level 6, PP 2 — $56.95/hr</option>
                          <option value="L6 PP3">Level 6, PP 3 — $58.19/hr</option>
                        </optgroup>
                        <optgroup label="Level 7 — Senior Management">
                          <option value="L7 PP1">Level 7, PP 1 — $60.27/hr</option>
                          <option value="L7 PP2">Level 7, PP 2 — $61.53/hr</option>
                          <option value="L7 PP3">Level 7, PP 3 — $62.79/hr</option>
                        </optgroup>
                        <optgroup label="Level 8 — Executive / Director">
                          <option value="L8 PP1">Level 8, PP 1 — $65.39/hr</option>
                          <option value="L8 PP2">Level 8, PP 2 — $66.67/hr</option>
                          <option value="L8 PP3">Level 8, PP 3 — $67.96/hr</option>
                        </optgroup>
                      </FormSelect>}
                    </FormRow>

                    {!form.is_salaried && (
                      <>
                        <FormDivider />
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">SCHADS Award — Pay Rates ($/hr)</p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <FormInput label="Hourly Pay Rate" value={form.rate_base} onChange={e => setForm(f => ({ ...f, rate_base: e.target.value }))} placeholder="0.00" type="number" step="0.01" />
                          <FormInput label="Saturday" value={form.rate_saturday} onChange={e => setForm(f => ({ ...f, rate_saturday: e.target.value }))} placeholder="0.00" type="number" step="0.01" />
                          <FormInput label="Sunday" value={form.rate_sunday} onChange={e => setForm(f => ({ ...f, rate_sunday: e.target.value }))} placeholder="0.00" type="number" step="0.01" />
                          <FormInput label="Public Holiday" value={form.rate_public_holiday} onChange={e => setForm(f => ({ ...f, rate_public_holiday: e.target.value }))} placeholder="0.00" type="number" step="0.01" />
                          <FormInput label="Afternoon Shift" value={form.rate_afternoon} onChange={e => setForm(f => ({ ...f, rate_afternoon: e.target.value }))} placeholder="0.00" type="number" step="0.01" />
                          <FormInput label="Night Shift" value={form.rate_night} onChange={e => setForm(f => ({ ...f, rate_night: e.target.value }))} placeholder="0.00" type="number" step="0.01" />
                          <FormInput label="Overtime (first 2hrs)" value={form.rate_overtime} onChange={e => setForm(f => ({ ...f, rate_overtime: e.target.value }))} placeholder="0.00" type="number" step="0.01" />
                          <FormInput label="Sleepover (flat)" value={form.rate_sleepover} onChange={e => setForm(f => ({ ...f, rate_sleepover: e.target.value }))} placeholder="60.02" type="number" step="0.01" />
                        </div>

                        {form.employment_status === 'casual' && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Casual loading (25%) should be included in the rates above.</p>
                        )}
                      </>
                    )}

                    <FormRow>
                      <FormSelect label="Pay Frequency" value={form.pay_frequency} onChange={e => setForm(f => ({ ...f, pay_frequency: e.target.value }))}>
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                      </FormSelect>
                      <div />
                    </FormRow>

                    {/* Checkboxes */}
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.tax_free_threshold}
                          onChange={e => setForm(f => ({ ...f, tax_free_threshold: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Claiming tax-free threshold</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.help_debt}
                          onChange={e => setForm(f => ({ ...f, help_debt: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">HELP/HECS debt</span>
                      </label>
                    </div>

                    <FormDivider />

                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Superannuation</p>
                    <FormRow>
                      <FormInput label="Super Fund Name" value={form.super_fund_name} onChange={e => setForm(f => ({ ...f, super_fund_name: e.target.value }))} placeholder="e.g. AustralianSuper, REST, Hostplus" />
                      <FormInput label="Member Number" value={form.super_member_number} onChange={e => setForm(f => ({ ...f, super_member_number: e.target.value }))} placeholder="Member/account number" />
                    </FormRow>
                    <FormInput label="USI (Unique Superannuation Identifier)" value={form.super_usi} onChange={e => setForm(f => ({ ...f, super_usi: e.target.value }))} placeholder="e.g. STA0100AU" />
                  </div>
                </div>
              )}

              {/* ABN Fields */}
              {form.employment_type === 'abn' && (
                <div>
                  <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-4">Business Details (ABN)</p>
                  <div className="space-y-6">
                    <FormRow>
                      <FormInput label="ABN" value={form.abn} onChange={e => setForm(f => ({ ...f, abn: e.target.value }))} placeholder="00 000 000 000" maxLength={14} />
                      <FormInput label="Business/Trading Name" value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} placeholder="If different from staff name" />
                    </FormRow>
                    <FormSelect label="Pay Frequency" value={form.pay_frequency} onChange={e => setForm(f => ({ ...f, pay_frequency: e.target.value }))}>
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                      <option value="monthly">Monthly</option>
                      <option value="per-invoice">Per Invoice</option>
                    </FormSelect>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.gst_registered}
                        onChange={e => setForm(f => ({ ...f, gst_registered: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">GST Registered</span>
                    </label>

                    <FormDivider />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Rates of Payment</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <FormInput label="Mon–Fri ($/hr)" value={form.abn_rate_weekday} onChange={e => setForm(f => ({ ...f, abn_rate_weekday: e.target.value }))} placeholder="42.00" type="number" step="0.01" />
                      <FormInput label="Saturday ($/hr)" value={form.abn_rate_saturday} onChange={e => setForm(f => ({ ...f, abn_rate_saturday: e.target.value }))} placeholder="50.00" type="number" step="0.01" />
                      <FormInput label="Sunday ($/hr)" value={form.abn_rate_sunday} onChange={e => setForm(f => ({ ...f, abn_rate_sunday: e.target.value }))} placeholder="60.00" type="number" step="0.01" />
                      <FormInput label="Public Holiday ($/hr)" value={form.abn_rate_public_holiday} onChange={e => setForm(f => ({ ...f, abn_rate_public_holiday: e.target.value }))} placeholder="80.00" type="number" step="0.01" />
                    </div>

                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 mt-6">Overnight Rates (Flat)</p>
                    <div className="grid grid-cols-3 gap-4">
                      <FormInput label="Sleepover ($)" value={form.abn_sleepover} onChange={e => setForm(f => ({ ...f, abn_sleepover: e.target.value }))} placeholder="160.00" type="number" step="1" />
                      <FormInput label="Active Overnight ($)" value={form.abn_active_overnight} onChange={e => setForm(f => ({ ...f, abn_active_overnight: e.target.value }))} placeholder="220.00" type="number" step="1" />
                      <FormInput label="Inactive Overnight ($)" value={form.abn_inactive_overnight} onChange={e => setForm(f => ({ ...f, abn_inactive_overnight: e.target.value }))} placeholder="160.00" type="number" step="1" />
                    </div>
                  </div>
                </div>
              )}

              <FormDivider />

              {/* Notes */}
              <FormTextarea label="Notes" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional payroll notes..." />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setEditing(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>
              {editId ? 'Update' : 'Save'} Record
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ═══ Delete Confirmation ═══ */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Record"
        size="sm"
      >
        <ModalBody>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Delete payroll record for <strong>{deleteModal?.staff_name}</strong>? This cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteModal(null)}>Cancel</ButtonSecondary>
          <ButtonPrimary
            onClick={() => handleDelete(deleteModal.id)}
            className="!bg-red-600 hover:!bg-red-700"
          >
            Delete
          </ButtonPrimary>
        </ModalFooter>
      </Modal>

      {/* ═══ File Viewer ═══ */}
      {viewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewFile(null)}>
          <div className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-[#162036] rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-[#334766]">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{viewFile.label || viewFile.file_name}</p>
              <div className="flex items-center gap-2">
                <a
                  href={viewFile.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#334766] hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => setViewFile(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#263554] transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <iframe
              src={viewFile.public_url}
              className="w-full h-[calc(90vh-48px)]"
              title={viewFile.file_name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
