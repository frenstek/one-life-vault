import { useState, Fragment } from 'react';
import jsPDF from 'jspdf';
import {
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineBanknotes,
  HiOutlineDocumentArrowDown,
  HiOutlineCalendarDays,
  HiOutlineMoon,
  HiChevronDown,
  HiChevronUp,
} from 'react-icons/hi2';
import { fetchPayslipData } from '../lib/api';
import { toLocalDate } from '../lib/dates';
import { PageHeader, StatCard, EmptyState } from '../components/ui/FormComponents';

function formatCurrency(val) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(val) || 0);
}

function formatDateAU(d) {
  if (!d) return '--';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime12(t) {
  if (!t) return '--';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getDayName(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short' });
}

// ─── Fortnight helpers ──────────────────────────────────────────────────────
// Anchor: Monday of the current fortnight
function getFortnightDates(offset = 0) {
  const today = new Date();
  const day = today.getDay();
  // Days since last Monday (0=Sun -> 6, 1=Mon -> 0, etc.)
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysSinceMonday);

  // Use a 2-week cycle anchored to an epoch Monday (2026-01-05 is a Monday)
  const epoch = new Date(2026, 0, 5); // Mon 5 Jan 2026
  const diffDays = Math.floor((thisMonday - epoch) / 86400000);
  const fortnightOffset = Math.floor(diffDays / 14);
  const fortnightStart = new Date(epoch);
  fortnightStart.setDate(epoch.getDate() + (fortnightOffset + offset) * 14);

  const fortnightEnd = new Date(fortnightStart);
  fortnightEnd.setDate(fortnightStart.getDate() + 13);

  return {
    start: toLocalDate(fortnightStart),
    end: toLocalDate(fortnightEnd),
  };
}

// ─── PDF Generator ──────────────────────────────────────────────────────────

const OLF_GREEN = [14, 160, 62];
const DARK_TEXT = [30, 41, 59];
const MEDIUM_TEXT = [71, 85, 105];
const LIGHT_TEXT = [148, 163, 184];
const BORDER_COLOR = [226, 232, 240];
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 18;
const MARGIN_R = 18;
const MARGIN_T = 18;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const HEADER_H = 28;
const FOOTER_H = 14;
const BODY_TOP = MARGIN_T + HEADER_H + 4;
const BODY_BOTTOM = PAGE_H - MARGIN_T - FOOTER_H;

function generatePayslipPDF(entry, startDate, endDate) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let pageNum = 1;
  let y = BODY_TOP;

  const staff = entry.staff;
  const staffName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim();

  function drawHeader() {
    pdf.setFillColor(...OLF_GREEN);
    pdf.rect(0, 0, PAGE_W, MARGIN_T + HEADER_H, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Staff Payslip', MARGIN_L, MARGIN_T + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255, 200);
    pdf.text(`Period: ${formatDateAU(startDate)} - ${formatDateAU(endDate)}`, MARGIN_L, MARGIN_T + 18);
    const generated = `Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    pdf.text(generated, PAGE_W - MARGIN_R, MARGIN_T + 18, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('One Life Foundation Pty Ltd', PAGE_W - MARGIN_R, MARGIN_T + 10, { align: 'right' });
  }

  function drawFooter() {
    const footerY = PAGE_H - MARGIN_T;
    pdf.setDrawColor(...BORDER_COLOR);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_L, footerY - 4, PAGE_W - MARGIN_R, footerY - 4);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...LIGHT_TEXT);
    pdf.text('One Life Foundation Pty Ltd  |  1300 ONE LIFE  |  onelifefoundation.com.au', MARGIN_L, footerY);
    pdf.text(`Page ${pageNum}`, PAGE_W - MARGIN_R, footerY, { align: 'right' });
  }

  function newPage() {
    drawFooter();
    pdf.addPage();
    pageNum++;
    drawHeader();
    y = BODY_TOP;
  }

  function ensureSpace(needed) {
    if (y + needed > BODY_BOTTOM) newPage();
  }

  drawHeader();

  // ─── Worker Details ──────────────────────────────────────────────────────
  ensureSpace(30);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(MARGIN_L, y, CONTENT_W, 22, 1.5, 1.5, 'F');
  pdf.setFillColor(...OLF_GREEN);
  pdf.rect(MARGIN_L, y, 1.2, 22, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...DARK_TEXT);
  pdf.text(staffName, MARGIN_L + 6, y + 7);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...MEDIUM_TEXT);
  const detailLine = [];
  if (staff.role) detailLine.push(staff.role);
  if (staff.position_type) detailLine.push(staff.position_type);
  if (staff.email) detailLine.push(staff.email);
  pdf.text(detailLine.join('  |  '), MARGIN_L + 6, y + 13);

  if (staff.abn) {
    pdf.text(`ABN: ${staff.abn}`, MARGIN_L + 6, y + 18);
  }
  y += 28;

  // ─── Shift Table ─────────────────────────────────────────────────────────
  ensureSpace(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...DARK_TEXT);
  pdf.text('Shift Details', MARGIN_L, y + 5);
  y += 10;

  // Table header
  const colX = [MARGIN_L, MARGIN_L + 28, MARGIN_L + 52, MARGIN_L + 72, MARGIN_L + 92, MARGIN_L + 120];
  ensureSpace(8);
  pdf.setFillColor(248, 250, 252);
  pdf.rect(MARGIN_L, y, CONTENT_W, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(...MEDIUM_TEXT);
  pdf.text('DATE', colX[0] + 2, y + 5);
  pdf.text('DAY', colX[1] + 2, y + 5);
  pdf.text('TYPE', colX[2] + 2, y + 5);
  pdf.text('START', colX[3] + 2, y + 5);
  pdf.text('END', colX[4] + 2, y + 5);
  pdf.text('HOURS', colX[5] + 2, y + 5);
  y += 8;

  for (const shift of entry.shifts) {
    ensureSpace(6);
    const isSleep = shift.shift_type === 'sleepover';
    const [sh, sm] = (shift.start_time || '0:0').split(':').map(Number);
    const [eh, em] = (shift.end_time || '0:0').split(':').map(Number);
    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins <= startMins) endMins += 24 * 60;
    const hours = isSleep ? '--' : ((endMins - startMins) / 60).toFixed(1);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...DARK_TEXT);
    pdf.text(formatDateAU(shift.shift_date), colX[0] + 2, y + 4);
    pdf.text(getDayName(shift.shift_date), colX[1] + 2, y + 4);
    pdf.text((shift.shift_type || 'shift').charAt(0).toUpperCase() + (shift.shift_type || 'shift').slice(1), colX[2] + 2, y + 4);
    pdf.text(formatTime12(shift.start_time), colX[3] + 2, y + 4);
    pdf.text(formatTime12(shift.end_time), colX[4] + 2, y + 4);
    pdf.text(String(hours), colX[5] + 2, y + 4);

    // Subtle row line
    pdf.setDrawColor(240, 240, 240);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN_L, y + 5.5, MARGIN_L + CONTENT_W, y + 5.5);
    y += 6;
  }

  y += 6;

  // ─── Payment Summary ────────────────────────────────────────────────────
  ensureSpace(50);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...DARK_TEXT);
  pdf.text('Payment Summary', MARGIN_L, y + 5);
  y += 10;

  const summaryX = MARGIN_L + 4;
  const summaryValX = MARGIN_L + CONTENT_W - 4;
  const summaryRows = [
    { label: `Weekday Hours (${entry.weekday_hours.toFixed(1)} hrs x ${formatCurrency(staff.pay_rate_weekday || 0)}/hr)`, value: formatCurrency(entry.weekday_pay) },
    { label: `Saturday Hours (${entry.saturday_hours.toFixed(1)} hrs x ${formatCurrency(staff.pay_rate_saturday || 0)}/hr)`, value: formatCurrency(entry.saturday_pay) },
    { label: `Sunday Hours (${entry.sunday_hours.toFixed(1)} hrs x ${formatCurrency(staff.pay_rate_sunday || 0)}/hr)`, value: formatCurrency(entry.sunday_pay) },
    { label: `Sleepovers (${entry.sleepover_count} x ${formatCurrency(staff.sleepover_rate || 0)})`, value: formatCurrency(entry.sleepover_pay) },
  ];

  for (const row of summaryRows) {
    ensureSpace(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...DARK_TEXT);
    pdf.text(row.label, summaryX, y + 4);
    pdf.text(row.value, summaryValX, y + 4, { align: 'right' });
    pdf.setDrawColor(240, 240, 240);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN_L, y + 6, MARGIN_L + CONTENT_W, y + 6);
    y += 7;
  }

  // Total
  ensureSpace(10);
  pdf.setFillColor(248, 250, 252);
  pdf.rect(MARGIN_L, y, CONTENT_W, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...OLF_GREEN);
  pdf.text('TOTAL GROSS PAY', summaryX, y + 6);
  pdf.text(formatCurrency(entry.total_pay), summaryValX, y + 6, { align: 'right' });
  y += 14;

  // ─── Bank Details ────────────────────────────────────────────────────────
  if (staff.bsb || staff.bank_account) {
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...DARK_TEXT);
    pdf.text('Bank Details', MARGIN_L, y + 5);
    y += 9;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...MEDIUM_TEXT);
    if (staff.bsb) {
      pdf.text(`BSB: ${staff.bsb}`, MARGIN_L + 4, y + 4);
      y += 5;
    }
    if (staff.bank_account) {
      pdf.text(`Account: ${staff.bank_account}`, MARGIN_L + 4, y + 4);
      y += 5;
    }
  }

  drawFooter();
  return pdf;
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function StaffPayslips() {
  const currentFortnight = getFortnightDates(0);
  const [startDate, setStartDate] = useState(currentFortnight.start);
  const [endDate, setEndDate] = useState(currentFortnight.end);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  async function handleGenerate() {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    setExpandedRow(null);
    try {
      const result = await fetchPayslipData(startDate, endDate);
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickSelect(offset) {
    const dates = getFortnightDates(offset);
    setStartDate(dates.start);
    setEndDate(dates.end);
  }

  function handleDownloadPDF(entry) {
    const pdf = generatePayslipPDF(entry, startDate, endDate);
    const name = `${entry.staff.first_name}-${entry.staff.last_name}`.replace(/[^a-zA-Z0-9-]/g, '');
    pdf.save(`OLF-Payslip-${name}-${startDate}-to-${endDate}.pdf`);
  }

  // Compute totals
  const totals = data
    ? data.reduce(
        (acc, e) => ({
          staff: acc.staff + 1,
          hours: acc.hours + e.weekday_hours + e.saturday_hours + e.sunday_hours,
          sleepovers: acc.sleepovers + e.sleepover_count,
          pay: acc.pay + e.total_pay,
        }),
        { staff: 0, hours: 0, sleepovers: 0, pay: 0 },
      )
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Staff Payslips"
        subtitle="Generate payslips from roster data"
      />

      {/* Date Range Controls */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickSelect(0)}
              className="rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0f1a2e] px-3 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1a2844] hover:text-slate-900 dark:hover:text-white"
            >
              Current Fortnight
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(-1)}
              className="rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0f1a2e] px-3 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1a2844] hover:text-slate-900 dark:hover:text-white"
            >
              Previous Fortnight
            </button>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !startDate || !endDate}
            className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {startDate && endDate && (
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            Period: {formatDateAU(startDate)} - {formatDateAU(endDate)}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-5 py-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats Row */}
      {totals && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={HiOutlineUsers}
            label="Total Staff"
            value={totals.staff}
            color="bg-brand-50 dark:bg-brand-900/20 text-brand-500"
          />
          <StatCard
            icon={HiOutlineClock}
            label="Total Hours"
            value={totals.hours.toFixed(1)}
            color="bg-blue-50 dark:bg-blue-900/20 text-blue-500"
          />
          <StatCard
            icon={HiOutlineMoon}
            label="Total Sleepovers"
            value={totals.sleepovers}
            color="bg-purple-50 dark:bg-purple-900/20 text-purple-500"
          />
          <StatCard
            icon={HiOutlineBanknotes}
            label="Total Pay"
            value={formatCurrency(totals.pay)}
            color="bg-green-50 dark:bg-green-900/20 text-green-500"
          />
        </div>
      )}

      {/* Summary Table */}
      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 dark:bg-[#1a2744] text-left">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Staff Name</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Weekday Hrs</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Sat Hrs</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Sun Hrs</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Sleepovers</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Gross Pay</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                {data.map((entry) => {
                  const staffId = entry.staff.id;
                  const isExpanded = expandedRow === staffId;
                  const staffName = `${entry.staff.first_name || ''} ${entry.staff.last_name || ''}`.trim();
                  const totalHours = entry.weekday_hours + entry.saturday_hours + entry.sunday_hours;

                  return (
                    <Fragment key={staffId}>
                      <tr
                        className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                        onClick={() => setExpandedRow(isExpanded ? null : staffId)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30 text-xs font-bold text-teal-700 dark:text-teal-400">
                              {(entry.staff.first_name || '?')[0]}{(entry.staff.last_name || '?')[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{staffName}</p>
                              <p className="text-xs text-slate-400">{entry.staff.role || 'Staff'}</p>
                            </div>
                            {isExpanded ? (
                              <HiChevronUp className="ml-1 h-4 w-4 text-slate-400" />
                            ) : (
                              <HiChevronDown className="ml-1 h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-slate-700 dark:text-slate-300">{entry.weekday_hours.toFixed(1)}</td>
                        <td className="px-5 py-4 text-right font-mono text-slate-700 dark:text-slate-300">{entry.saturday_hours.toFixed(1)}</td>
                        <td className="px-5 py-4 text-right font-mono text-slate-700 dark:text-slate-300">{entry.sunday_hours.toFixed(1)}</td>
                        <td className="px-5 py-4 text-right font-mono text-slate-700 dark:text-slate-300">{entry.sleepover_count}</td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(entry.total_pay)}</td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(entry);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                            title="Download PDF payslip"
                          >
                            <HiOutlineDocumentArrowDown className="h-3.5 w-3.5" />
                            PDF
                          </button>
                        </td>
                      </tr>

                      {/* Expanded shift details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-slate-50/50 dark:bg-[#0f1a2e] px-5 py-4">
                            <div className="mb-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {entry.shifts.length} shift{entry.shifts.length !== 1 ? 's' : ''} | {totalHours.toFixed(1)} total hours
                              </span>
                              {entry.staff.pay_rate_weekday > 0 && (
                                <span>Weekday: {formatCurrency(entry.staff.pay_rate_weekday)}/hr</span>
                              )}
                              {entry.staff.pay_rate_saturday > 0 && (
                                <span>Sat: {formatCurrency(entry.staff.pay_rate_saturday)}/hr</span>
                              )}
                              {entry.staff.pay_rate_sunday > 0 && (
                                <span>Sun: {formatCurrency(entry.staff.pay_rate_sunday)}/hr</span>
                              )}
                              {entry.staff.sleepover_rate > 0 && (
                                <span>Sleepover: {formatCurrency(entry.staff.sleepover_rate)}</span>
                              )}
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#263554]">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-stone-50 dark:bg-[#1a2744]">
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400">Date</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400">Day</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400">Type</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400">Start</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400">End</th>
                                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400">Hours</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400">Property</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                                  {entry.shifts.map((shift) => {
                                    const isSleep = shift.shift_type === 'sleepover';
                                    const [sh2, sm2] = (shift.start_time || '0:0').split(':').map(Number);
                                    const [eh2, em2] = (shift.end_time || '0:0').split(':').map(Number);
                                    let s2 = sh2 * 60 + sm2;
                                    let e2 = eh2 * 60 + em2;
                                    if (e2 <= s2) e2 += 1440;
                                    const hrs = isSleep ? '--' : ((e2 - s2) / 60).toFixed(1);

                                    return (
                                      <tr key={shift.id} className="hover:bg-slate-50 dark:hover:bg-[#162036]">
                                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{formatDateAU(shift.shift_date)}</td>
                                        <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{getDayName(shift.shift_date)}</td>
                                        <td className="px-4 py-2">
                                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                            isSleep
                                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                          }`}>
                                            {(shift.shift_type || 'shift').charAt(0).toUpperCase() + (shift.shift_type || 'shift').slice(1)}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 font-mono text-slate-700 dark:text-slate-300">{formatTime12(shift.start_time)}</td>
                                        <td className="px-4 py-2 font-mono text-slate-700 dark:text-slate-300">{formatTime12(shift.end_time)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-slate-700 dark:text-slate-300">{hrs}</td>
                                        <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{shift.property_name || '--'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Payment breakdown */}
                            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <div className="rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-3">
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Weekday Pay</p>
                                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(entry.weekday_pay)}</p>
                              </div>
                              <div className="rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-3">
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Saturday Pay</p>
                                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(entry.saturday_pay)}</p>
                              </div>
                              <div className="rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-3">
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Sunday Pay</p>
                                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(entry.sunday_pay)}</p>
                              </div>
                              <div className="rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-3">
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Sleepover Pay</p>
                                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(entry.sleepover_pay)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}

                {/* Totals row */}
                <tr className="bg-stone-50 dark:bg-[#1a2744] font-semibold">
                  <td className="px-5 py-4 text-slate-900 dark:text-white">Totals ({data.length} staff)</td>
                  <td className="px-5 py-4 text-right font-mono text-slate-900 dark:text-white">
                    {data.reduce((s, e) => s + e.weekday_hours, 0).toFixed(1)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-900 dark:text-white">
                    {data.reduce((s, e) => s + e.saturday_hours, 0).toFixed(1)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-900 dark:text-white">
                    {data.reduce((s, e) => s + e.sunday_hours, 0).toFixed(1)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-900 dark:text-white">
                    {data.reduce((s, e) => s + e.sleepover_count, 0)}
                  </td>
                  <td className="px-5 py-4 text-right text-teal-600 dark:text-teal-400">
                    {formatCurrency(data.reduce((s, e) => s + e.total_pay, 0))}
                  </td>
                  <td className="px-5 py-4" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state — only after generation */}
      {data && data.length === 0 && (
        <EmptyState
          icon={HiOutlineCalendarDays}
          title="No shifts found"
          description="No roster shifts were found for the selected date range. Try adjusting the dates."
        />
      )}

      {/* Initial state — before generation */}
      {!data && !loading && !error && (
        <EmptyState
          icon={HiOutlineBanknotes}
          title="Select a date range and click Generate"
          description="Payslip data will be calculated from shift roster entries."
        />
      )}
    </div>
  );
}

