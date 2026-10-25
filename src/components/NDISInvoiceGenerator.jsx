import { useState } from 'react';
import jsPDF from 'jspdf';
import { HiDocumentText, HiBolt, HiArrowDownTray } from 'react-icons/hi2';
import { fetchNDISInvoiceData, createInvoice } from '../lib/api';
import { toLocalDate } from '../lib/dates';
import Modal, {
  ModalBody,
  ModalFooter,
  ButtonPrimary,
  ButtonSecondary,
} from './ui/Modal';

// ─── OLF Brand Colors for PDF ────────────────────────────────────────────────
const OLF_GREEN = [14, 160, 62];
const DARK_TEXT = [30, 41, 59];
const MEDIUM_TEXT = [71, 85, 105];
const LIGHT_TEXT = [148, 163, 184];
const BORDER_COLOR = [226, 232, 240];
const YELLOW_BG = [250, 204, 21]; // #facc15

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 16;
const MARGIN_R = 16;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

function formatCurrency(val) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(val) || 0);
}

function formatDateShort(d) {
  if (!d) return '--';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateLong(d) {
  if (!d) return '--';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── PDF Generator ───────────────────────────────────────────────────────────

function generateNDISInvoicePDF(invoiceData, logoImg) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 16;

  const { participant, line_items, subtotal, gst, total, start_date, end_date } = invoiceData;
  const invoiceDate = toLocalDate();
  const dueDate = toLocalDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const invoiceNum = `NDIS-${toLocalDate().slice(0, 7).replace('-', '')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;

  // ─── Header ─────────────────────────────────────────────────────────────────

  // Logo (top-left)
  if (logoImg) {
    try {
      pdf.addImage(logoImg, 'PNG', MARGIN_L, y, 40, 16);
    } catch {
      // If logo fails, just use text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(...OLF_GREEN);
      pdf.text('One Life Foundation', MARGIN_L, y + 10);
    }
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(...OLF_GREEN);
    pdf.text('One Life Foundation', MARGIN_L, y + 10);
  }

  // Company details (top-right)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...MEDIUM_TEXT);
  const companyDetails = [
    'One Life Foundation Pty Ltd',
    'ABN: 21 665 521 942',
    'Phone: 1300 ONE LIFE',
    'Email: admin@onelifefoundation.com.au',
    'Web: onelifefoundation.com.au',
  ];
  for (let i = 0; i < companyDetails.length; i++) {
    pdf.text(companyDetails[i], PAGE_W - MARGIN_R, y + 3 + i * 3.8, { align: 'right' });
  }

  y += 24;

  // ─── TAX INVOICE Title ──────────────────────────────────────────────────────

  pdf.setFillColor(...OLF_GREEN);
  pdf.rect(MARGIN_L, y, CONTENT_W, 10, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text('TAX INVOICE', PAGE_W / 2, y + 7.5, { align: 'center' });
  y += 16;

  // ─── Invoice Details Grid ──────────────────────────────────────────────────

  const leftCol = MARGIN_L;
  const rightCol = PAGE_W / 2 + 10;
  const labelStyle = () => { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...MEDIUM_TEXT); };
  const valueStyle = () => { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...DARK_TEXT); };

  // Left column
  labelStyle(); pdf.text('Invoice To:', leftCol, y);
  valueStyle(); pdf.text('NDIA (via Bulk Payment Upload)', leftCol, y + 4.5);

  labelStyle(); pdf.text('Service User:', leftCol, y + 12);
  valueStyle(); pdf.text(participant.name, leftCol, y + 16.5);

  labelStyle(); pdf.text('NDIS Number:', leftCol, y + 24);
  valueStyle(); pdf.text(participant.ndis_number || 'N/A', leftCol, y + 28.5);

  // Right column
  labelStyle(); pdf.text('Invoice Number:', rightCol, y);
  valueStyle(); pdf.text(invoiceNum, rightCol, y + 4.5);

  labelStyle(); pdf.text('Invoice Date:', rightCol, y + 12);
  valueStyle(); pdf.text(formatDateLong(invoiceDate), rightCol, y + 16.5);

  labelStyle(); pdf.text('Due Date:', rightCol, y + 24);
  valueStyle(); pdf.text(formatDateLong(dueDate), rightCol, y + 28.5);

  labelStyle(); pdf.text('Period:', rightCol, y + 36);
  valueStyle(); pdf.text(`${formatDateLong(start_date)} - ${formatDateLong(end_date)}`, rightCol, y + 40.5);

  labelStyle(); pdf.text('Support Ratio:', leftCol, y + 36);
  valueStyle(); pdf.text(participant.funding_ratio || '1:3', leftCol, y + 40.5);

  y += 50;

  // ─── Line Items Table ─────────────────────────────────────────────────────

  // Table header (yellow)
  pdf.setFillColor(...YELLOW_BG);
  pdf.rect(MARGIN_L, y, CONTENT_W, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...DARK_TEXT);

  const colDesc = MARGIN_L + 2;
  const colQty = MARGIN_L + CONTENT_W - 70;
  const colUnit = MARGIN_L + CONTENT_W - 46;
  const colTotal = MARGIN_L + CONTENT_W - 2;

  pdf.text('Description', colDesc, y + 5.5);
  pdf.text('Qty', colQty, y + 5.5, { align: 'right' });
  pdf.text('Unit $', colUnit, y + 5.5, { align: 'right' });
  pdf.text('Total $', colTotal, y + 5.5, { align: 'right' });

  y += 10;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);

  let currentDate = '';
  for (const item of line_items) {
    // Check if we need a new page
    if (y > PAGE_H - 60) {
      // Footer on current page
      drawFooter(pdf);
      pdf.addPage();
      y = 20;
    }

    // Date group separator
    if (item.date !== currentDate) {
      currentDate = item.date;
      // Light separator line
      pdf.setDrawColor(...BORDER_COLOR);
      pdf.setLineWidth(0.3);
      pdf.line(MARGIN_L, y, MARGIN_L + CONTENT_W, y);
      y += 1;
    }

    // Wrap description
    pdf.setTextColor(...DARK_TEXT);
    const maxDescW = colQty - colDesc - 12;
    const descLines = pdf.splitTextToSize(item.description, maxDescW);
    const rowH = Math.max(descLines.length * 3.5, 5);

    // Alternate row background
    const rowIdx = line_items.indexOf(item);
    if (rowIdx % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(MARGIN_L, y - 0.5, CONTENT_W, rowH + 1.5, 'F');
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...DARK_TEXT);
    pdf.text(descLines, colDesc, y + 3);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text(String(item.qty), colQty, y + 3, { align: 'right' });
    pdf.text(formatCurrency(item.unit_price).replace('$', ''), colUnit, y + 3, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(item.total).replace('$', ''), colTotal, y + 3, { align: 'right' });

    y += rowH + 2;
  }

  // Bottom line
  pdf.setDrawColor(...BORDER_COLOR);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN_L, y, MARGIN_L + CONTENT_W, y);
  y += 6;

  // ─── Totals ────────────────────────────────────────────────────────────────

  const totalsX = MARGIN_L + CONTENT_W - 80;
  const totalsValX = MARGIN_L + CONTENT_W - 2;

  // Subtotal
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...MEDIUM_TEXT);
  pdf.text('TOTAL EXCLUDING GST', totalsX, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DARK_TEXT);
  pdf.text(formatCurrency(subtotal), totalsValX, y, { align: 'right' });
  y += 6;

  // GST
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...MEDIUM_TEXT);
  pdf.text('GST TOTAL', totalsX, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DARK_TEXT);
  pdf.text(formatCurrency(gst), totalsValX, y, { align: 'right' });
  y += 2;

  // Divider
  pdf.setDrawColor(...OLF_GREEN);
  pdf.setLineWidth(0.8);
  pdf.line(totalsX, y, MARGIN_L + CONTENT_W, y);
  y += 6;

  // Amount Due
  pdf.setFillColor(...OLF_GREEN);
  pdf.rect(totalsX - 4, y - 5, CONTENT_W - totalsX + MARGIN_L + 6, 10, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text('AMOUNT DUE', totalsX, y + 1);
  pdf.text(formatCurrency(total), totalsValX, y + 1, { align: 'right' });

  y += 16;

  // ─── Payment Note ──────────────────────────────────────────────────────────

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...LIGHT_TEXT);
  pdf.text('This invoice is GST-free as NDIS supports are exempt under Division 38 of the GST Act.', MARGIN_L, y);
  y += 5;
  pdf.text('Payment is claimed via NDIS Bulk Payment Upload through the myplace provider portal.', MARGIN_L, y);

  // ─── Footer ────────────────────────────────────────────────────────────────
  drawFooter(pdf);

  return { pdf, invoiceNum, invoiceDate, dueDate };
}

function drawFooter(pdf) {
  const footerY = PAGE_H - 12;
  pdf.setDrawColor(...BORDER_COLOR);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_L, footerY - 4, PAGE_W - MARGIN_R, footerY - 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(...LIGHT_TEXT);
  pdf.text('One Life Foundation Pty Ltd  |  ABN: 21 665 521 942  |  1300 ONE LIFE  |  admin@onelifefoundation.com.au', PAGE_W / 2, footerY, { align: 'center' });
}

// ─── NDIS Rate Data (mirrored from backend for calculator) ──────────────────

const NDIS_LINE_ITEMS = [
  { code: '01_801_0115_1_1', name: 'Weekday Daytime', rate: 70.23, unit: 'hour' },
  { code: '01_802_0115_1_1', name: 'Weekday Evening', rate: 74.37, unit: 'hour' },
  { code: '01_803_0115_1_1', name: 'Weekday Night', rate: 78.81, unit: 'hour' },
  { code: '01_804_0115_1_1', name: 'Saturday', rate: 98.82, unit: 'hour' },
  { code: '01_805_0115_1_1', name: 'Sunday', rate: 127.44, unit: 'hour' },
  { code: '01_806_0115_1_1', name: 'Public Holiday', rate: 156.03, unit: 'hour' },
  { code: '01_832_0115_1_1', name: 'Sleepover', rate: 297.60, unit: 'each', isFlat: true },
];

const RATIO_OPTIONS = ['1:1', '1:2', '1:3', '1:4'];

function getRatioDiv(ratio) {
  const map = { '1:1': 1, '1:2': 2, '1:3': 3, '1:4': 4 };
  return map[ratio] || 3;
}

function calcHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60;
  return Math.round(((endMins - startMins) / 60) * 100) / 100;
}

// ─── Quick Date Helpers ──────────────────────────────────────────────────────

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return toLocalDate(date);
}

function getSunday(mondayStr) {
  const d = new Date(mondayStr + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return toLocalDate(d);
}

// ─── Main Component ──────────────────────────────────────────────────────────

const CALC_INITIAL = {
  date: toLocalDate(),
  lineItem: '01_801_0115_1_1',
  startTime: '06:00',
  endTime: '14:00',
  ratio: '1:3',
};

export default function NDISInvoiceGenerator({ participantId, participantName, ndisNumber }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('calculator'); // 'calculator' | 'roster'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Manual calculator state
  const [calcForm, setCalcForm] = useState(CALC_INITIAL);
  const [calcItems, setCalcItems] = useState([]);

  // Calculator helpers
  const selectedItem = NDIS_LINE_ITEMS.find(i => i.code === calcForm.lineItem) || NDIS_LINE_ITEMS[0];
  const calcHrs = selectedItem.isFlat ? 1 : calcHours(calcForm.startTime, calcForm.endTime);
  const calcUnitPrice = Math.round((selectedItem.rate / getRatioDiv(calcForm.ratio)) * 100) / 100;
  const calcLineTotal = Math.round(calcUnitPrice * calcHrs * 100) / 100;

  function addCalcItem() {
    const item = {
      id: Date.now(),
      date: calcForm.date,
      item_code: selectedItem.code,
      item_name: selectedItem.name,
      description: `${selectedItem.name} — ${calcForm.ratio} ratio${selectedItem.isFlat ? '' : ` — ${calcForm.startTime} to ${calcForm.endTime} (${calcHrs}hrs)`}`,
      qty: calcHrs,
      unit: selectedItem.isFlat ? 'each' : 'hour',
      unit_price: calcUnitPrice,
      total: calcLineTotal,
    };
    setCalcItems(prev => [...prev, item]);
  }

  function removeCalcItem(id) {
    setCalcItems(prev => prev.filter(i => i.id !== id));
  }

  const calcSubtotal = calcItems.reduce((sum, i) => sum + i.total, 0);
  const calcGst = 0; // NDIS is GST-free
  const calcTotal = calcSubtotal;

  function buildCalcInvoiceData() {
    if (calcItems.length === 0) return null;
    const dates = calcItems.map(i => i.date).sort();
    return {
      participant: { name: participantName, ndis_number: ndisNumber, funding_ratio: calcItems[0]?.description?.match(/\d:\d/)?.[0] || '1:3' },
      property: null,
      line_items: calcItems,
      subtotal: calcSubtotal,
      gst: calcGst,
      total: calcTotal,
      start_date: dates[0],
      end_date: dates[dates.length - 1],
    };
  }

  function handleOpen() {
    // Default to last week (Mon-Sun)
    const today = new Date();
    const lastMonday = new Date(today);
    const dayOfWeek = today.getDay();
    lastMonday.setDate(today.getDate() - dayOfWeek - 6);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    setStartDate(toLocalDate(lastMonday));
    setEndDate(toLocalDate(lastSunday));
    setInvoiceData(null);
    setError('');
    setSaved(false);
    setCalcForm(CALC_INITIAL);
    setCalcItems([]);
    setOpen(true);
  }

  async function handleGenerate() {
    if (!startDate || !endDate) {
      setError('Please select a date range');
      return;
    }
    setLoading(true);
    setError('');
    setInvoiceData(null);
    setSaved(false);
    try {
      const data = await fetchNDISInvoiceData(participantId, startDate, endDate);
      setInvoiceData(data);
      if (data.line_items.length === 0) {
        setError('No shifts found for this participant in the selected date range. Make sure the participant is assigned to a property and shifts are rostered.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate invoice data');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    const data = mode === 'calculator' ? buildCalcInvoiceData() : invoiceData;
    if (!data || data.line_items.length === 0) return;
    // Use 'data' below instead of 'invoiceData'
    const invoiceDataForPDF = data;

    try {
      // Load logo
      let logoImg = null;
      try {
        const response = await fetch('/logo.png');
        const blob = await response.blob();
        logoImg = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch {
        // Logo failed, proceed without
      }

      const { pdf } = generateNDISInvoicePDF(invoiceDataForPDF, logoImg);
      const pName = (invoiceDataForPDF.participant.name || 'Participant').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
      const sd = invoiceDataForPDF.start_date || startDate;
      const ed = invoiceDataForPDF.end_date || endDate;
      pdf.save(`NDIS-Invoice-${pName}-${sd}-to-${ed}.pdf`);
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message);
    }
  }

  async function handleCreateInvoice() {
    const data = mode === 'calculator' ? buildCalcInvoiceData() : invoiceData;
    if (!data || data.line_items.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const items = data.line_items.map(li => ({
        support_item_number: li.item_code,
        support_item_name: li.item_name,
        description: li.description,
        service_date: li.date,
        quantity: li.qty,
        unit: li.unit,
        unit_price: li.unit_price,
        gst_applicable: false,
      }));

      await createInvoice({
        participant_id: participantId,
        invoice_date: toLocalDate(),
        due_date: toLocalDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        service_period_start: data.start_date || startDate,
        service_period_end: data.end_date || endDate,
        claim_type: 'standard',
        bill_to: 'NDIA (Bulk Payment Upload)',
        notes: `NDIS SIL invoice for ${data.participant.name} (${data.participant.funding_ratio} ratio)`,
        items,
      });

      setSaved(true);
    } catch (err) {
      setError('Failed to save invoice: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function setQuickRange(type) {
    const today = new Date();
    if (type === 'this-week') {
      const monday = getMonday(today);
      setStartDate(monday);
      setEndDate(getSunday(monday));
    } else if (type === 'last-week') {
      const thisMonday = getMonday(today);
      const lastMonday = new Date(thisMonday + 'T00:00:00');
      lastMonday.setDate(lastMonday.getDate() - 7);
      const lm = toLocalDate(lastMonday);
      setStartDate(lm);
      setEndDate(getSunday(lm));
    } else if (type === 'last-fortnight') {
      const thisMonday = getMonday(today);
      const twoWeeksAgo = new Date(thisMonday + 'T00:00:00');
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const lm = toLocalDate(twoWeeksAgo);
      const lastSunday = new Date(thisMonday + 'T00:00:00');
      lastSunday.setDate(lastSunday.getDate() - 1);
      setStartDate(lm);
      setEndDate(toLocalDate(lastSunday));
    } else if (type === 'this-month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(toLocalDate(firstDay));
      setEndDate(toLocalDate(lastDay));
    } else if (type === 'last-month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(toLocalDate(firstDay));
      setEndDate(toLocalDate(lastDay));
    }
    setInvoiceData(null);
    setSaved(false);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
      >
        <HiBolt className="h-4 w-4" />
        Generate NDIS Invoice
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Generate NDIS Tax Invoice"
        icon={HiDocumentText}
        iconColor="text-teal-500"
        size="xl"
      >
        <ModalBody>
          <div className="space-y-6">
            {/* Participant info */}
            <div className="rounded-lg border border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1b2e] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{participantName}</p>
                  {ndisNumber && (
                    <p className="mt-0.5 text-xs font-mono text-slate-500 dark:text-slate-400">NDIS: {ndisNumber}</p>
                  )}
                </div>
                <span className="rounded-full bg-teal-100 dark:bg-teal-900/30 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
                  SIL Provider
                </span>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="flex rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-100 dark:bg-[#0f1b2e] p-1">
              <button
                type="button"
                onClick={() => { setMode('calculator'); setSaved(false); setError(''); }}
                className={`flex-1 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${mode === 'calculator' ? 'bg-white dark:bg-[#1e2d4a] text-teal-700 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Calculator
              </button>
              <button
                type="button"
                onClick={() => { setMode('roster'); setSaved(false); setError(''); }}
                className={`flex-1 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${mode === 'roster' ? 'bg-white dark:bg-[#1e2d4a] text-teal-700 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                From Roster
              </button>
            </div>

            {/* ── CALCULATOR MODE ────────────────────────────────────── */}
            {mode === 'calculator' && (
              <div className="space-y-5">
                {/* Line Item selector */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Support Item</label>
                  <select
                    value={calcForm.lineItem}
                    onChange={e => setCalcForm(f => ({ ...f, lineItem: e.target.value }))}
                    className="w-full text-sm"
                  >
                    {NDIS_LINE_ITEMS.map(item => (
                      <option key={item.code} value={item.code}>
                        {item.name} — {formatCurrency(item.rate)}/hr [{item.code}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Date */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Date</label>
                    <input type="date" value={calcForm.date} onChange={e => setCalcForm(f => ({ ...f, date: e.target.value }))} className="w-full text-sm" />
                  </div>

                  {/* Ratio */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Support Ratio</label>
                    <select
                      value={calcForm.ratio}
                      onChange={e => setCalcForm(f => ({ ...f, ratio: e.target.value }))}
                      className="w-full text-sm"
                    >
                      {RATIO_OPTIONS.map(r => (
                        <option key={r} value={r}>{r} ({r === '1:1' ? 'full rate' : `÷${r.split(':')[1]}`})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Time (hidden for sleepover) */}
                {!selectedItem.isFlat && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Start Time</label>
                      <input type="time" value={calcForm.startTime} onChange={e => setCalcForm(f => ({ ...f, startTime: e.target.value }))} className="w-full text-sm" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">End Time</label>
                      <input type="time" value={calcForm.endTime} onChange={e => setCalcForm(f => ({ ...f, endTime: e.target.value }))} className="w-full text-sm" />
                    </div>
                  </div>
                )}

                {/* Live calculation preview */}
                <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-teal-700 dark:text-teal-400">
                        <span className="font-semibold">{selectedItem.name}</span>
                        <span className="ml-1 font-mono text-[10px] text-teal-500">[{selectedItem.code}]</span>
                      </p>
                      <p className="text-xs text-teal-600 dark:text-teal-500">
                        {formatCurrency(selectedItem.rate)} base ÷ {getRatioDiv(calcForm.ratio)} ({calcForm.ratio})
                        = {formatCurrency(calcUnitPrice)}/{selectedItem.isFlat ? 'ea' : 'hr'}
                        {!selectedItem.isFlat && <span> × {calcHrs} hrs</span>}
                      </p>
                    </div>
                    <p className="text-lg font-bold font-mono text-teal-700 dark:text-teal-400">{formatCurrency(calcLineTotal)}</p>
                  </div>
                </div>

                {/* Add button */}
                <button
                  type="button"
                  onClick={addCalcItem}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                >
                  + Add Line Item
                </button>

                {/* Added items list */}
                {calcItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#263554]">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-[#263554] bg-yellow-50 dark:bg-yellow-900/10">
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">Date</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">Item</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">Qty</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">Unit$</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">Total$</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                          {calcItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#1a2744]">
                              <td className="px-3 py-2 text-xs whitespace-nowrap text-slate-600 dark:text-slate-300">{formatDateShort(item.date)}</td>
                              <td className="px-3 py-2 text-xs">
                                <span className="font-medium text-slate-900 dark:text-white">{item.item_name}</span>
                                <span className="ml-1 font-mono text-[10px] text-slate-400">[{item.item_code}]</span>
                              </td>
                              <td className="px-3 py-2 text-xs text-right font-mono text-slate-900 dark:text-white">{item.qty} {item.unit === 'each' ? '' : 'hrs'}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono text-slate-900 dark:text-white">{formatCurrency(item.unit_price)}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(item.total)}</td>
                              <td className="px-1 py-2">
                                <button onClick={() => removeCalcItem(item.id)} className="rounded p-1 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="rounded-lg bg-slate-50 dark:bg-[#0f1b2e] p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                          <span>Total (GST-free)</span>
                          <span className="font-mono font-semibold">{formatCurrency(calcSubtotal)}</span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-[#263554] pt-2">
                          <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white">
                            <span>Amount Due</span>
                            <span className="font-mono text-teal-700 dark:text-teal-400">{formatCurrency(calcTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ROSTER MODE ────────────────────────────────────────── */}
            {mode === 'roster' && (
              <div className="space-y-5">
                {/* Date range */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Service Period
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">From</label>
                      <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setInvoiceData(null); setSaved(false); }} className="w-full text-sm" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">To</label>
                      <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setInvoiceData(null); setSaved(false); }} className="w-full text-sm" />
                    </div>
                  </div>

                  {/* Quick selectors */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { label: 'This Week', type: 'this-week' },
                      { label: 'Last Week', type: 'last-week' },
                      { label: 'Last Fortnight', type: 'last-fortnight' },
                      { label: 'This Month', type: 'this-month' },
                      { label: 'Last Month', type: 'last-month' },
                    ].map(preset => (
                      <button key={preset.type} type="button" onClick={() => setQuickRange(preset.type)}
                        className="rounded-md border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0f1a2e] px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1a2844] hover:text-slate-900 dark:hover:text-white">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate button */}
                <button onClick={handleGenerate} disabled={loading || !startDate || !endDate}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Generating...</>
                  ) : (
                    <><HiBolt className="h-4 w-4" /> Generate Invoice Preview</>
                  )}
                </button>

                {/* Preview */}
                {invoiceData && invoiceData.line_items.length > 0 && (
                  <div className="space-y-4">
                    {invoiceData.property && (
                      <div className="rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-slate-400">Property</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">{invoiceData.property.name}</p>
                        {invoiceData.property.address && <p className="text-xs text-slate-500 dark:text-slate-400">{invoiceData.property.address}</p>}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Support Ratio:</span>
                      <span className="rounded-full bg-teal-100 dark:bg-teal-900/30 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:text-teal-400">{invoiceData.participant.funding_ratio || '1:3'}</span>
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{invoiceData.line_items.length} line items</span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#263554]">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-[#263554] bg-yellow-50 dark:bg-yellow-900/10">
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">Date</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">Description</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">Qty</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">Unit$</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">Total$</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                          {invoiceData.line_items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#1a2744]">
                              <td className="px-3 py-2.5 text-xs whitespace-nowrap text-slate-600 dark:text-slate-300">{formatDateShort(item.date)}</td>
                              <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                                <span className="font-medium text-slate-900 dark:text-white">{item.item_name}</span>
                                <span className="ml-1.5 font-mono text-[10px] text-slate-400">[{item.item_code}]</span>
                              </td>
                              <td className="px-3 py-2.5 text-xs text-right font-mono text-slate-900 dark:text-white">{item.qty} {item.unit === 'each' ? '' : 'hrs'}</td>
                              <td className="px-3 py-2.5 text-xs text-right font-mono text-slate-900 dark:text-white">{formatCurrency(item.unit_price)}</td>
                              <td className="px-3 py-2.5 text-xs text-right font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded-lg bg-slate-50 dark:bg-[#0f1b2e] p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                          <span>Total Excluding GST</span>
                          <span className="font-mono font-semibold">{formatCurrency(invoiceData.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                          <span>GST</span>
                          <span className="font-mono font-semibold">{formatCurrency(invoiceData.gst)}</span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-[#263554] pt-2">
                          <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white">
                            <span>Amount Due</span>
                            <span className="font-mono text-teal-700 dark:text-teal-400">{formatCurrency(invoiceData.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Success */}
            {saved && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                Invoice saved successfully! It will appear in the Created Invoices tab.
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setOpen(false)}>Close</ButtonSecondary>
          {((mode === 'calculator' && calcItems.length > 0) || (mode === 'roster' && invoiceData && invoiceData.line_items.length > 0)) && (
            <>
              {!saved && (
                <button
                  onClick={handleCreateInvoice}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg border border-teal-600 bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-semibold text-teal-700 dark:text-teal-400 transition-colors hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-50"
                >
                  {saving ? (
                    <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-300 border-t-teal-600" /> Saving...</>
                  ) : (
                    <><HiDocumentText className="h-4 w-4" /> Save to Invoices</>
                  )}
                </button>
              )}
              <ButtonPrimary onClick={handleDownloadPDF}>
                <HiArrowDownTray className="h-4 w-4 mr-1.5" />
                Download PDF
              </ButtonPrimary>
            </>
          )}
        </ModalFooter>
      </Modal>
    </>
  );
}
