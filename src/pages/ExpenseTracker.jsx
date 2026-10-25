import { useState, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiEye,
  HiPencilSquare,
  HiTrash,
  HiBanknotes,
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiArrowTrendingUp,
  HiCamera,
  HiXMark,
  HiArrowPath,
  HiChevronDown,
  HiArrowUpTray,
  HiDocumentDuplicate,
  HiBookmarkSquare,
  HiTableCells,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import {
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
  FormInput,
  FormSelect,
  FormTextarea,
  FormRow,
} from '../components/ui/FormComponents';
import Modal, {
  ModalBody,
  ModalFooter,
  ButtonPrimary,
  ButtonSecondary,
  ButtonDanger,
  ModalError,
} from '../components/ui/Modal';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';
import {
  fetchExpenses,
  fetchExpenseStats,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
} from '../lib/api';
import { toLocalDate } from '../lib/dates';

// ─── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  'office-supplies': 'Office Supplies',
  utilities: 'Utilities',
  rent: 'Rent',
  maintenance: 'Maintenance',
  'medical-supplies': 'Medical Supplies',
  'food-grocery': 'Food & Grocery',
  transport: 'Transport',
  training: 'Training',
  insurance: 'Insurance',
  equipment: 'Equipment',
  subscriptions: 'Subscriptions',
  cleaning: 'Cleaning',
  IT: 'IT',
  uniforms: 'Uniforms',
  general: 'General',
  other: 'Other',
};

const PAYMENT_METHOD_LABELS = {
  card: 'Card',
  cash: 'Cash',
  'bank-transfer': 'Bank Transfer',
  'petty-cash': 'Petty Cash',
};

const STATUS_BADGE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  reimbursed: 'info',
};

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Reimbursed'];

// Function so the default date is computed when the form opens, not at module load.
const INITIAL_FORM = () => ({
  title: '',
  category: 'general',
  amount: '',
  date: toLocalDate(),
  paid_by: '',
  payment_method: 'card',
  receipt_ref: '',
  supplier: '',
  description: '',
  status: 'pending',
  notes: '',
  imageData: null,
  imagePreview: null,
  image_url: '',
  removeImage: false,
});

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(v) {
  if (!v && v !== 0) return '--';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(v);
}

function capitalize(str) {
  if (!str) return '--';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    options.push({ value: val, label });
  }
  return options;
}

// ─── Receipt Text Parser ─────────────────────────────────────────────────────────

function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const lowerText = text.toLowerCase();

  // Extract amount — look for "total" line first, then largest dollar amount
  let amount = null;
  const totalMatch = text.match(/(?:total|amount\s*due|balance\s*due|grand\s*total|total\s*amount)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i);
  if (totalMatch) {
    amount = parseFloat(totalMatch[1].replace(/,/g, ''));
  } else {
    const amounts = [...text.matchAll(/\$\s*([\d,]+\.\d{2})/g)].map(m => parseFloat(m[1].replace(/,/g, '')));
    if (amounts.length) amount = Math.max(...amounts);
  }

  // Extract date (AU format DD/MM/YYYY first)
  let date = null;
  const datePatterns = [
    { re: /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/, parse: (m) => { const d = parseInt(m[1]), mo = parseInt(m[2]), y = parseInt(m[3]); return d <= 31 && mo <= 12 ? `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null; }},
    { re: /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})/, parse: (m) => { const d = parseInt(m[1]), mo = parseInt(m[2]), y = 2000+parseInt(m[3]); return d <= 31 && mo <= 12 ? `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null; }},
    { re: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i, parse: (m) => { const p = new Date(m[0]); return !isNaN(p) ? toLocalDate(p) : null; }},
    { re: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})/i, parse: (m) => { const p = new Date(m[0]); return !isNaN(p) ? toLocalDate(p) : null; }},
  ];
  for (const { re, parse } of datePatterns) {
    const m = text.match(re);
    if (m) { date = parse(m); if (date) break; }
  }

  // Extract supplier — first substantial line (skip short/numeric lines)
  let supplier = '';
  for (const line of lines.slice(0, 5)) {
    if (line.length >= 3 && !/^\d+$/.test(line) && !/^\$/.test(line) && !/^(total|subtotal|gst|tax|change|cash|card|eftpos|visa|master)/i.test(line) && !/^\d{1,2}[/\-.]/.test(line)) {
      supplier = line.replace(/[*#=\-_]{2,}/g, '').trim();
      break;
    }
  }

  // Extract receipt reference
  let receipt_ref = '';
  const refPatterns = [/(?:receipt|invoice|ref|order|trans(?:action)?)\s*[#:]\s*([\w-]+)/i, /#\s*(\d{3,})/, /INV[- ]?(\w+)/i];
  for (const p of refPatterns) { const m = text.match(p); if (m) { receipt_ref = m[1]; break; } }

  // Guess category
  let category = 'general';
  if (/woolworths|coles|aldi|iga|grocery|supermarket|food|bakery|butcher/i.test(lowerText)) category = 'food-grocery';
  else if (/bunnings|hardware|tool|mitre\s*10/i.test(lowerText)) category = 'maintenance';
  else if (/officeworks|office|stationery|paper|printer|ink|toner/i.test(lowerText)) category = 'office-supplies';
  else if (/pharmacy|chemist|medical|health|priceline|terry\s*white/i.test(lowerText)) category = 'medical-supplies';
  else if (/shell|bp|caltex|ampol|fuel|petrol|diesel|7.?eleven/i.test(lowerText)) category = 'transport';
  else if (/clean|janitor|detergent/i.test(lowerText)) category = 'cleaning';
  else if (/insurance|premium|allianz|nrma/i.test(lowerText)) category = 'insurance';
  else if (/uniform|workwear|clothing/i.test(lowerText)) category = 'uniforms';
  else if (/internet|phone|telstra|optus|vodafone|mobile/i.test(lowerText)) category = 'IT';
  else if (/electricity|gas|water|energy|utility|origin|agl/i.test(lowerText)) category = 'utilities';
  else if (/uber|taxi|cab|didi|ola/i.test(lowerText)) category = 'transport';

  return {
    title: supplier ? `${supplier} Purchase` : 'Scanned Receipt',
    amount,
    date,
    supplier,
    category,
    payment_method: 'card',
    receipt_ref,
    description: lines.slice(0, 5).join(', ').substring(0, 100),
  };
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  // Split by comma, respecting quoted fields
  const split = (line) => {
    const result = [];
    let current = '', inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };
  const headers = split(lines[0]);
  const rows = lines.slice(1).map(split).filter(r => r.length >= 2);
  return { headers, rows };
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [search, setSearch] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form
  const [form, setForm] = useState(INITIAL_FORM);  // lazy initializer
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Recurring
  const [recurring, setRecurring] = useState([]);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [recurringForm, setRecurringForm] = useState({ title: '', category: 'subscriptions', amount: '', frequency: 'monthly', supplier: '', description: '', next_due: '', payment_method: 'card', notes: '' });
  const [recurringFormError, setRecurringFormError] = useState(null);
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [deleteRecurringConfirm, setDeleteRecurringConfirm] = useState(null);

  // ─── Data Loading ───────────────────────────────────────────────────────────

  function loadRecurring() {
    fetchRecurring(true)
      .then(setRecurring)
      .catch(() => {});
  }

  function loadData() {
    setLoading(true);
    setError(null);
    const category = categoryFilter === 'All' ? undefined : categoryFilter;
    const status = statusFilter === 'All' ? undefined : statusFilter.toLowerCase();
    const month = monthFilter === 'all' ? undefined : monthFilter;
    Promise.all([
      fetchExpenses(category, status, month),
      fetchExpenseStats(month),
    ])
      .then(([expenseData, statsData]) => {
        const list = Array.isArray(expenseData) ? expenseData : expenseData.expenses || [];
        list.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
        setExpenses(list);
        setStats(statsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    loadRecurring();
  }, [categoryFilter, statusFilter, monthFilter]);

  // ─── Recurring Handlers ─────────────────────────────────────────────────────

  const recurringMonthlyTotal = recurring.reduce((sum, r) => {
    const amt = parseFloat(r.amount) || 0;
    if (r.frequency === 'weekly') return sum + amt * 4.33;
    if (r.frequency === 'fortnightly') return sum + amt * 2.17;
    if (r.frequency === 'quarterly') return sum + amt / 3;
    if (r.frequency === 'yearly') return sum + amt / 12;
    return sum + amt; // monthly
  }, 0);

  function openRecurringModal(item = null) {
    if (item) {
      setRecurringForm({ title: item.title || '', category: item.category || 'subscriptions', amount: item.amount ?? '', frequency: item.frequency || 'monthly', supplier: item.supplier || '', description: item.description || '', next_due: item.next_due || '', payment_method: item.payment_method || 'card', notes: item.notes || '' });
      setEditingRecurring(item);
    } else {
      setRecurringForm({ title: '', category: 'subscriptions', amount: '', frequency: 'monthly', supplier: '', description: '', next_due: '', payment_method: 'card', notes: '' });
      setEditingRecurring(null);
    }
    setRecurringFormError(null);
    setRecurringModalOpen(true);
  }

  async function handleSaveRecurring(e) {
    e.preventDefault();
    if (!recurringForm.title.trim()) return setRecurringFormError('Title is required');
    if (!recurringForm.amount) return setRecurringFormError('Amount is required');
    setSavingRecurring(true);
    setRecurringFormError(null);
    try {
      const payload = { ...recurringForm, amount: parseFloat(recurringForm.amount), next_due: recurringForm.next_due || null };
      if (editingRecurring) {
        await updateRecurring(editingRecurring.id, payload);
      } else {
        await createRecurring(payload);
      }
      setRecurringModalOpen(false);
      loadRecurring();
    } catch (err) {
      setRecurringFormError(typeof err === 'string' ? err : err?.message || String(err));
    } finally {
      setSavingRecurring(false);
    }
  }

  async function handleToggleRecurring(item) {
    try {
      await updateRecurring(item.id, { is_active: !item.is_active });
      loadRecurring();
    } catch (err) {
      setError(err.message || 'Could not change that recurring expense.');
    }
  }

  async function handleDeleteRecurring() {
    if (!deleteRecurringConfirm) return;
    try {
      await deleteRecurring(deleteRecurringConfirm.id);
      setDeleteRecurringConfirm(null);
      loadRecurring();
    } catch (err) {
      /*  On failure the confirm modal used to stay open with no message —
       *  the close was inside the try, so a failed delete left the UI stuck
       *  mid-action looking like nothing had happened at all. */
      setDeleteRecurringConfirm(null);
      setError(err.message || 'Could not delete that recurring expense.');
    }
  }

  // ─── Client-Side Search ─────────────────────────────────────────────────────

  const filtered = expenses.filter((exp) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (exp.title || '').toLowerCase().includes(q) ||
      (exp.supplier || '').toLowerCase().includes(q) ||
      (exp.receipt_ref || '').toLowerCase().includes(q)
    );
  });

  // ─── Stats Calculations ─────────────────────────────────────────────────────

  const totalSpent = stats?.total_spent ?? expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const pendingCount = stats?.pending ?? expenses.filter((e) => e.status === 'pending').length;
  const approvedCount = stats?.approved ?? expenses.filter((e) => e.status === 'approved').length;
  const totalCount = stats?.total ?? expenses.length;

  // ─── Create / Edit ──────────────────────────────────────────────────────────

  function openFormModal(expense = null) {
    if (expense) {
      setForm({
        title: expense.title || '',
        category: expense.category || 'general',
        amount: expense.amount ?? '',
        date: expense.date || '',
        paid_by: expense.paid_by || '',
        payment_method: expense.payment_method || 'card',
        receipt_ref: expense.receipt_ref || '',
        supplier: expense.supplier || '',
        description: expense.description || '',
        status: expense.status || 'pending',
        notes: expense.notes || '',
        imageData: null,
        imagePreview: expense.image_url || null,
        image_url: expense.image_url || '',
        removeImage: false,
      });
      setIsEditing(true);
      setSelectedExpense(expense);
    } else {
      setForm(INITIAL_FORM());
      setIsEditing(false);
      setSelectedExpense(null);
    }
    setFormError(null);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setForm(INITIAL_FORM());
    setFormError(null);
    setIsEditing(false);
    setSelectedExpense(null);
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.amount || Number(form.amount) <= 0) return setFormError('A valid amount is required.');
    if (!form.date) return setFormError('Date is required.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };
      // Remove preview field — not needed by API
      delete payload.imagePreview;
      // If user removed the image, clear the URL
      if (form.removeImage) payload.image_url = null;

      if (isEditing && selectedExpense) {
        await updateExpense(selectedExpense.id, payload);
      } else {
        await createExpense(payload);
      }
      closeFormModal();
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Image Handling ────────────────────────────────────────────────────────

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, imageData: reader.result, imagePreview: reader.result, removeImage: false }));
    };
    reader.readAsDataURL(file);
  }

  // ─── View ───────────────────────────────────────────────────────────────────

  function openViewModal(expense) {
    setSelectedExpense(expense);
    setViewModalOpen(true);
  }

  function closeViewModal() {
    setViewModalOpen(false);
    setSelectedExpense(null);
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteExpense(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Month Options ──────────────────────────────────────────────────────────

  const monthOptions = getMonthOptions();

  // ─── Receipt Scanning (Tesseract.js — free, runs in browser) ────────────────

  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');

  async function handleScanReceipt(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB');
      return;
    }

    setScanning(true);
    setScanProgress('Loading OCR engine...');
    try {
      // Read file as base64 for image preview
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Run Tesseract.js OCR in browser (no API key needed)
      const worker = await createWorker('eng', 1, {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            setScanProgress(`Scanning... ${Math.round((info.progress || 0) * 100)}%`);
          }
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();

      // Parse the raw OCR text into structured data
      const extracted = parseReceiptText(data.text);

      // Open form modal pre-filled with extracted data
      setForm({
        title: extracted.title || '',
        category: extracted.category || 'general',
        amount: extracted.amount ?? '',
        date: extracted.date || toLocalDate(),
        paid_by: '',
        payment_method: extracted.payment_method || 'card',
        receipt_ref: extracted.receipt_ref || '',
        supplier: extracted.supplier || '',
        description: extracted.description || '',
        status: 'pending',
        notes: 'Auto-scanned from receipt',
        imageData: base64,
        imagePreview: base64,
        image_url: '',
        removeImage: false,
      });
      setIsEditing(false);
      setSelectedExpense(null);
      setFormError(null);
      setFormModalOpen(true);
    } catch (err) {
      alert('Could not read receipt: ' + err.message);
    } finally {
      setScanning(false);
      setScanProgress('');
      e.target.value = '';
    }
  }

  // ─── CSV Import ───────────────────────────────────────────────────────────────

  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvData, setCsvData] = useState(null); // { headers, rows }
  const [csvMapping, setCsvMapping] = useState({ title: '', amount: '', date: '', supplier: '', category: '', description: '' });
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  function handleCsvFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSV(reader.result);
      setCsvData(parsed);
      // Auto-map columns by matching header names
      const map = { title: '', amount: '', date: '', supplier: '', category: '', description: '' };
      for (const h of parsed.headers) {
        const lower = h.toLowerCase();
        if (/title|description|memo|narration|detail/i.test(lower) && !map.title) map.title = h;
        else if (/amount|total|value|debit|credit/i.test(lower) && !map.amount) map.amount = h;
        else if (/date/i.test(lower) && !map.date) map.date = h;
        else if (/supplier|vendor|payee|merchant/i.test(lower) && !map.supplier) map.supplier = h;
        else if (/category|type/i.test(lower) && !map.category) map.category = h;
      }
      setCsvMapping(map);
      setCsvResult(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleCsvImport() {
    if (!csvData || !csvMapping.title || !csvMapping.amount) return;
    setCsvImporting(true);
    let imported = 0, failed = 0;
    try {
      const ti = csvData.headers.indexOf(csvMapping.title);
      const ai = csvData.headers.indexOf(csvMapping.amount);
      const di = csvMapping.date ? csvData.headers.indexOf(csvMapping.date) : -1;
      const si = csvMapping.supplier ? csvData.headers.indexOf(csvMapping.supplier) : -1;
      const ci = csvMapping.category ? csvData.headers.indexOf(csvMapping.category) : -1;
      const dsi = csvMapping.description ? csvData.headers.indexOf(csvMapping.description) : -1;

      for (const row of csvData.rows) {
        try {
          const rawAmt = (row[ai] || '').replace(/[^0-9.\-]/g, '');
          const amt = parseFloat(rawAmt);
          if (!row[ti] || isNaN(amt) || amt <= 0) { failed++; continue; }

          let dateVal = di >= 0 ? row[di] : '';
          // Try to parse AU date format
          if (dateVal) {
            const dm = dateVal.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
            if (dm) {
              const d = parseInt(dm[1]), mo = parseInt(dm[2]);
              const y = dm[3].length === 2 ? 2000 + parseInt(dm[3]) : parseInt(dm[3]);
              if (d <= 31 && mo <= 12) dateVal = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            }
          }

          await createExpense({
            title: row[ti],
            amount: Math.abs(amt),
            date: dateVal || toLocalDate(),
            supplier: si >= 0 ? row[si] || '' : '',
            category: ci >= 0 ? row[ci] || 'general' : 'general',
            description: dsi >= 0 ? row[dsi] || '' : '',
            payment_method: 'card',
            status: 'pending',
            notes: 'Imported from CSV',
          });
          imported++;
        } catch { failed++; }
      }
      setCsvResult({ imported, failed });
      if (imported > 0) loadData();
    } catch (err) {
      setCsvResult({ imported, failed: failed || csvData.rows.length, error: err.message });
    } finally {
      setCsvImporting(false);
    }
  }

  // ─── Quick Templates ──────────────────────────────────────────────────────────

  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [templates, setTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('olf_expense_templates') || '[]'); } catch { return []; }
  });

  function saveTemplate() {
    if (!form.title.trim()) return;
    const tpl = {
      id: Date.now(),
      title: form.title,
      category: form.category,
      amount: form.amount,
      supplier: form.supplier,
      payment_method: form.payment_method,
      description: form.description,
    };
    const updated = [...templates, tpl];
    setTemplates(updated);
    localStorage.setItem('olf_expense_templates', JSON.stringify(updated));
  }

  function deleteTemplate(id) {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('olf_expense_templates', JSON.stringify(updated));
  }

  function useTemplate(tpl) {
    setForm({
      ...INITIAL_FORM(),
      title: tpl.title || '',
      category: tpl.category || 'general',
      amount: tpl.amount || '',
      supplier: tpl.supplier || '',
      payment_method: tpl.payment_method || 'card',
      description: tpl.description || '',
    });
    setIsEditing(false);
    setSelectedExpense(null);
    setFormError(null);
    setTemplatesModalOpen(false);
    setFormModalOpen(true);
  }

  // ─── Duplicate Expense ────────────────────────────────────────────────────────

  function duplicateExpense(exp) {
    setForm({
      title: exp.title || '',
      category: exp.category || 'general',
      amount: exp.amount ?? '',
      date: toLocalDate(),
      paid_by: exp.paid_by || '',
      payment_method: exp.payment_method || 'card',
      receipt_ref: '',
      supplier: exp.supplier || '',
      description: exp.description || '',
      status: 'pending',
      notes: '',
      imageData: null,
      imagePreview: null,
      image_url: '',
      removeImage: false,
    });
    setIsEditing(false);
    setSelectedExpense(null);
    setFormError(null);
    setFormModalOpen(true);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Expenses"
        subtitle="Track and manage company purchases and expenses"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scan Receipt */}
            <label className={`flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors cursor-pointer ${scanning ? 'opacity-60 pointer-events-none' : ''}`}>
              {scanning ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-400/30 border-t-accent-500" />
              ) : (
                <HiCamera className="h-4 w-4" />
              )}
              {scanning ? (scanProgress || 'Scanning...') : 'Scan'}
              <input type="file" accept="image/*" className="hidden" onChange={handleScanReceipt} disabled={scanning} />
            </label>
            {/* CSV Import */}
            <button
              onClick={() => { setCsvData(null); setCsvResult(null); setCsvModalOpen(true); }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
            >
              <HiArrowUpTray className="h-4 w-4" />
              Import CSV
            </button>
            {/* Templates */}
            <button
              onClick={() => setTemplatesModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
            >
              <HiBookmarkSquare className="h-4 w-4" />
              Templates
            </button>
            {/* Add Expense */}
            <button
              onClick={() => openFormModal()}
              className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
            >
              <HiPlus className="h-4 w-4" />
              Add Expense
            </button>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={HiBanknotes}
              label="Total Spent"
              value={formatCurrency(totalSpent)}
              color="bg-blue-50 dark:bg-blue-900/30 text-brand-500"
            />
            <StatCard
              icon={HiClock}
              label="Pending Approval"
              value={pendingCount}
              color="bg-amber-50 dark:bg-amber-900/30 text-amber-500"
            />
            <StatCard
              icon={HiCheckCircle}
              label="Approved"
              value={approvedCount}
              color="bg-green-50 dark:bg-green-900/30 text-emerald-500"
            />
            <StatCard
              icon={HiArrowTrendingUp}
              label="Number of Expenses"
              value={totalCount}
              color="bg-purple-50 dark:bg-purple-900/30 text-purple-500"
            />
          </>
        )}
      </div>

      {/* ─── Recurring Charges Panel ─── */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
        <button
          onClick={() => setRecurringOpen(!recurringOpen)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30">
              <HiArrowPath className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Recurring Charges</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {recurring.length} active · {formatCurrency(recurringMonthlyTotal)}/mo
              </p>
            </div>
          </div>
          <HiChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${recurringOpen ? 'rotate-180' : ''}`} />
        </button>

        {recurringOpen && (
          <div className="border-t border-slate-200 dark:border-[#263554]">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50/50 dark:bg-[#0c1425]/50">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Subscriptions & Recurring</p>
              <button
                onClick={() => openRecurringModal()}
                className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-600 transition-colors"
              >
                <HiPlus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            {recurring.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">No recurring charges yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#263554]">
                {recurring.map((item) => {
                  const isDue = item.next_due && new Date(item.next_due) <= new Date();
                  return (
                    <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${isDue ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.supplier ? `${item.supplier} · ` : ''}{capitalize(item.frequency)}{item.next_due ? ` · Due ${formatDate(item.next_due)}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-semibold text-slate-800 dark:text-white tabular-nums">{formatCurrency(item.amount)}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openRecurringModal(item)} className="p-1 text-slate-400 hover:text-brand-500"><HiPencilSquare className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteRecurringConfirm(item)} className="p-1 text-slate-400 hover:text-red-500"><HiTrash className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="flex-1 w-full rounded-lg border border-slate-200 px-3 py-2 pl-10 text-sm dark:border-[#334766] dark:bg-[#162036] dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#334766] dark:bg-[#162036] dark:text-white"
        >
          <option value="All">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#334766] dark:bg-[#162036] dark:text-white"
        >
          {STATUS_FILTERS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'All' ? 'All Statuses' : opt}
            </option>
          ))}
        </select>

        {/* Month filter */}
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#334766] dark:bg-[#162036] dark:text-white"
        >
          <option value="all">All Time</option>
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <SkeletonGrid count={5} />
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadData} className="mt-2 text-sm font-medium text-red-600 underline">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HiBanknotes}
          title={
            search || categoryFilter !== 'All' || statusFilter !== 'All' || monthFilter !== getCurrentMonth()
              ? 'No expenses match your filters.'
              : 'No expenses recorded yet.'
          }
          description="Use the Add Expense button to log a new expense."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#263554]">
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp) => (
                  <tr
                    key={exp.id}
                    className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(exp.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {exp.title}
                        </span>
                        {exp.image_url && (
                          <HiCamera className="h-3.5 w-3.5 text-slate-400 shrink-0" title="Has receipt" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default">
                        {CATEGORY_LABELS[exp.category] || capitalize(exp.category)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {exp.supplier || '--'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {formatCurrency(exp.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {PAYMENT_METHOD_LABELS[exp.payment_method] || capitalize(exp.payment_method)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_BADGE[exp.status] || 'default'}>
                        {capitalize(exp.status || 'pending')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(exp)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500"
                          title="View"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => duplicateExpense(exp)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-accent-50 dark:hover:bg-accent-900/20 hover:text-accent-500"
                          title="Duplicate"
                        >
                          <HiDocumentDuplicate className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openFormModal(exp)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(exp)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                          title="Delete"
                        >
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

      {/* ─── Create / Edit Expense Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        title={isEditing ? 'Edit Expense' : 'Add Expense'}
        icon={HiBanknotes}
        iconColor="text-brand-500"
        size="xl"
      >
        <form onSubmit={handleSubmitForm}>
          <ModalBody>
            <div className="space-y-6">
              <ModalError message={formError} />

              {/* Row 1: Title */}
              <FormInput
                label="Title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief description of the expense"
              />

              {/* Row 2: Category, Amount */}
              <FormRow>
                <FormSelect
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
                <FormInput
                  label="Amount"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </FormRow>

              {/* Row 3: Date, Paid By */}
              <FormRow>
                <FormInput
                  label="Date"
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                <FormInput
                  label="Paid By"
                  value={form.paid_by}
                  onChange={(e) => setForm({ ...form, paid_by: e.target.value })}
                  placeholder="Name of person who paid"
                />
              </FormRow>

              {/* Row 4: Payment Method, Receipt Ref */}
              <FormRow>
                <FormSelect
                  label="Payment Method"
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
                <FormInput
                  label="Receipt Reference"
                  value={form.receipt_ref}
                  onChange={(e) => setForm({ ...form, receipt_ref: e.target.value })}
                  placeholder="Receipt or invoice number"
                />
              </FormRow>

              {/* Row 5: Supplier */}
              <FormInput
                label="Supplier"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="Supplier or vendor name"
              />

              {/* Row 6: Description */}
              <FormTextarea
                label="Description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Additional details about the expense..."
              />

              {/* Editing-only: Status & Notes */}
              {isEditing && (
                <>
                  <hr className="border-slate-200 dark:border-[#263554]" />
                  <FormSelect
                    label="Status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="reimbursed">Reimbursed</option>
                  </FormSelect>
                </>
              )}

              <FormTextarea
                label="Notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Internal notes..."
              />

              {/* Receipt Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Receipt Image</label>
                {(form.imagePreview || form.image_url) ? (
                  <div className="relative">
                    <img src={form.imagePreview || form.image_url} alt="Receipt" className="w-full max-h-48 object-contain rounded-lg border border-slate-200 dark:border-[#334766]" />
                    <button type="button" onClick={() => setForm({...form, imageData: null, imagePreview: null, image_url: null, removeImage: true})} className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600">
                      <HiXMark className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-[#334766] bg-slate-50 dark:bg-[#0c1425] p-6 hover:bg-slate-100 dark:hover:bg-[#162036] transition-colors">
                    <HiCamera className="h-8 w-8 text-slate-400" />
                    <span className="mt-2 text-sm text-slate-500">Click to upload receipt</span>
                    <span className="text-xs text-slate-400">JPG, PNG up to 5MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </label>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={closeFormModal} disabled={saving}>
              Cancel
            </ButtonSecondary>
            {!isEditing && form.title.trim() && (
              <button
                type="button"
                onClick={() => { saveTemplate(); }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#334766] px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
                title="Save as reusable template"
              >
                <HiBookmarkSquare className="h-3.5 w-3.5" /> Save Template
              </button>
            )}
            <ButtonPrimary type="submit" loading={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Expense' : 'Add Expense'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── View Expense Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={selectedExpense ? `Expense: ${selectedExpense.title}` : 'Expense Details'}
        icon={HiEye}
        iconColor="text-brand-500"
        size="xl"
      >
        {selectedExpense && (
          <>
            <ModalBody>
              <div className="space-y-6">
                {/* Receipt Image */}
                {selectedExpense.image_url && (
                  <div className="mb-4">
                    <img src={selectedExpense.image_url} alt="Receipt" className="w-full max-h-64 object-contain rounded-lg border border-slate-200 dark:border-[#334766]" />
                  </div>
                )}

                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailRow label="Title" value={selectedExpense.title} />
                  <DetailRow label="Date" value={formatDate(selectedExpense.date)} />
                  <DetailRow label="Category" value={CATEGORY_LABELS[selectedExpense.category] || capitalize(selectedExpense.category)} />
                  <DetailRow label="Supplier" value={selectedExpense.supplier || '--'} />
                  <DetailRow label="Amount" value={formatCurrency(selectedExpense.amount)} />
                  <DetailRow label="Payment Method" value={PAYMENT_METHOD_LABELS[selectedExpense.payment_method] || capitalize(selectedExpense.payment_method)} />
                  <DetailRow label="Paid By" value={selectedExpense.paid_by || '--'} />
                  <DetailRow label="Receipt Ref" value={selectedExpense.receipt_ref || '--'} />
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Status:</span>
                  <Badge variant={STATUS_BADGE[selectedExpense.status] || 'default'}>
                    {capitalize(selectedExpense.status || 'pending')}
                  </Badge>
                </div>

                <hr className="border-slate-200 dark:border-[#263554]" />

                {/* Description */}
                {selectedExpense.description && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedExpense.description}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedExpense.notes && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Notes</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedExpense.notes}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <hr className="border-slate-200 dark:border-[#263554]" />
                <div className="flex gap-6 text-xs text-slate-400 dark:text-slate-500">
                  {selectedExpense.created_at && (
                    <span>Created: {formatDate(selectedExpense.created_at)}</span>
                  )}
                  {selectedExpense.updated_at && (
                    <span>Updated: {formatDate(selectedExpense.updated_at)}</span>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary onClick={closeViewModal}>Close</ButtonSecondary>
              <ButtonPrimary
                onClick={() => {
                  closeViewModal();
                  openFormModal(selectedExpense);
                }}
              >
                Edit Expense
              </ButtonPrimary>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* ─── Delete Confirmation ─────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirm(null);
          }}
        >
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-[#162036] p-8 shadow-xl animate-modal-in border border-transparent dark:border-[#263554]">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <HiXCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Expense</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete{' '}
              <strong>{deleteConfirm.title}</strong>
              {deleteConfirm.amount ? ` (${formatCurrency(deleteConfirm.amount)})` : ''}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 dark:border-[#263554] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  'Deleting...'
                ) : (
                  <>
                    <HiTrash className="h-4 w-4" /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Recurring Modal ─── */}
      <Modal isOpen={recurringModalOpen} onClose={() => setRecurringModalOpen(false)} title={editingRecurring ? 'Edit Recurring Charge' : 'Add Recurring Charge'} icon={HiArrowPath} iconColor="text-purple-500">
        <form onSubmit={handleSaveRecurring}>
          <ModalBody>
            <ModalError message={recurringFormError} />
            <div className="space-y-5">
              <FormRow cols={2}>
                <FormInput label="Title" required value={recurringForm.title} onChange={(e) => setRecurringForm({ ...recurringForm, title: e.target.value })} placeholder="e.g. Microsoft 365" />
                <FormInput label="Amount" required type="number" step="0.01" min="0" value={recurringForm.amount} onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })} placeholder="0.00" />
              </FormRow>
              <FormRow cols={2}>
                <FormSelect label="Frequency" value={recurringForm.frequency} onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value })}>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </FormSelect>
                <FormSelect label="Category" value={recurringForm.category} onChange={(e) => setRecurringForm({ ...recurringForm, category: e.target.value })}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </FormSelect>
              </FormRow>
              <FormRow cols={2}>
                <FormInput label="Supplier" value={recurringForm.supplier} onChange={(e) => setRecurringForm({ ...recurringForm, supplier: e.target.value })} placeholder="e.g. Microsoft" />
                <FormInput label="Next Due Date" type="date" value={recurringForm.next_due} onChange={(e) => setRecurringForm({ ...recurringForm, next_due: e.target.value })} />
              </FormRow>
              <FormSelect label="Payment Method" value={recurringForm.payment_method} onChange={(e) => setRecurringForm({ ...recurringForm, payment_method: e.target.value })}>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </FormSelect>
              <FormTextarea label="Notes" rows={2} value={recurringForm.notes} onChange={(e) => setRecurringForm({ ...recurringForm, notes: e.target.value })} placeholder="Optional notes..." />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setRecurringModalOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={savingRecurring}>{editingRecurring ? 'Update' : 'Add'}</ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── CSV Import Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} title="Import Expenses from CSV" icon={HiArrowUpTray} iconColor="text-brand-500" size="xl">
        <ModalBody>
          <div className="space-y-5">
            {/* File Upload */}
            <div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-[#334766] bg-slate-50 dark:bg-[#0c1425] p-6 hover:bg-slate-100 dark:hover:bg-[#162036] transition-colors">
                <HiArrowUpTray className="h-8 w-8 text-slate-400" />
                <span className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Click to upload CSV file</span>
                <span className="text-xs text-slate-400">Bank statements, exported spreadsheets, etc.</span>
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvFile} />
              </label>
            </div>

            {csvData && (
              <>
                {/* Column Mapping */}
                <div className="rounded-lg border border-slate-200 dark:border-[#263554] p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Map Columns</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Match your CSV columns to expense fields. Title and Amount are required.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['title', 'amount', 'date', 'supplier', 'category', 'description'].map(field => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 capitalize">
                          {field} {(field === 'title' || field === 'amount') && <span className="text-red-500">*</span>}
                        </label>
                        <select
                          value={csvMapping[field]}
                          onChange={(e) => setCsvMapping(prev => ({ ...prev, [field]: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-[#334766] dark:bg-[#0c1425] dark:text-white"
                        >
                          <option value="">-- Skip --</option>
                          {csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-lg border border-slate-200 dark:border-[#263554] overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 dark:bg-[#0c1425]">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Preview ({csvData.rows.length} rows found)</p>
                  </div>
                  <div className="max-h-48 overflow-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#263554]">
                          {csvData.headers.map(h => (
                            <th key={h} className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 dark:border-[#263554]">
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvData.rows.length > 5 && (
                    <div className="px-4 py-1.5 text-xs text-slate-400 bg-slate-50 dark:bg-[#0c1425]">
                      ...and {csvData.rows.length - 5} more rows
                    </div>
                  )}
                </div>

                {/* Result */}
                {csvResult && (
                  <div className={`rounded-lg p-3 text-sm ${csvResult.error ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                    {csvResult.imported > 0 && <p>Successfully imported {csvResult.imported} expenses.</p>}
                    {csvResult.failed > 0 && <p>{csvResult.failed} rows skipped (missing title or invalid amount).</p>}
                    {csvResult.error && <p>Error: {csvResult.error}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setCsvModalOpen(false)}>Close</ButtonSecondary>
          {csvData && !csvResult?.imported && (
            <ButtonPrimary
              onClick={handleCsvImport}
              loading={csvImporting}
              disabled={!csvMapping.title || !csvMapping.amount}
            >
              Import {csvData.rows.length} Expenses
            </ButtonPrimary>
          )}
        </ModalFooter>
      </Modal>

      {/* ─── Templates Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={templatesModalOpen} onClose={() => setTemplatesModalOpen(false)} title="Quick Templates" icon={HiBookmarkSquare} iconColor="text-accent-500" size="lg">
        <ModalBody>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <HiBookmarkSquare className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No templates saved yet.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                When adding an expense, click "Save Template" to save it for reuse.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-[#263554] p-3 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
                  <button onClick={() => useTemplate(tpl)} className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{tpl.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tpl.supplier && `${tpl.supplier} · `}
                      {CATEGORY_LABELS[tpl.category] || tpl.category}
                      {tpl.amount ? ` · ${formatCurrency(tpl.amount)}` : ''}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteTemplate(tpl.id)}
                    className="ml-2 rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                    title="Delete template"
                  >
                    <HiTrash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setTemplatesModalOpen(false)}>Close</ButtonSecondary>
        </ModalFooter>
      </Modal>

      {/* ─── Delete Recurring Confirmation ─── */}
      {deleteRecurringConfirm && (
        <Modal isOpen onClose={() => setDeleteRecurringConfirm(null)} title="Delete Recurring Charge" icon={HiTrash} iconColor="text-red-500" size="sm">
          <ModalBody>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Delete <strong>{deleteRecurringConfirm.title}</strong> ({formatCurrency(deleteRecurringConfirm.amount)}/{deleteRecurringConfirm.frequency})? This cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setDeleteRecurringConfirm(null)}>Cancel</ButtonSecondary>
            <ButtonDanger onClick={handleDeleteRecurring}>Delete</ButtonDanger>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {children || (
        <p className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{value || '--'}</p>
      )}
    </div>
  );
}
