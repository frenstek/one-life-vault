import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HiBanknotes,
  HiDocumentText,
  HiClock,
  HiArrowTopRightOnSquare,
  HiArrowDownTray,
  HiMagnifyingGlass,
  HiXMark,
  HiPhoto,
  HiPlus,
  HiArrowUpTray,
  HiTrash,
  HiPencilSquare,
} from 'react-icons/hi2';
import {
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
  TabBar,
} from '../components/ui/FormComponents';
import { SkeletonStatCard } from '../components/ui/Skeleton';
import {
  fetchHubExpenses,
  fetchHubInvoices,
  fetchHubStats,
  createHubInvoice,
  updateHubInvoice,
  deleteHubInvoice,
} from '../lib/api';
import { toLocalDate } from '../lib/dates';

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

/** Build last 6 months as YYYY-MM strings */
function getMonthOptions() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }
  return months;
}

function getMonthLabel(monthValue) {
  if (!monthValue) return 'All Time';
  const [y, m] = monthValue.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

// Status badge mapping for expenses
const EXPENSE_STATUS_BADGE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  reimbursed: 'info',
};

// Status badge mapping for invoices
const INVOICE_STATUS_BADGE = {
  unpaid: 'warning',
  paid: 'success',
  overdue: 'danger',
};

// Category labels (same as ExpenseTracker)
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

const MONTH_OPTIONS = getMonthOptions();

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ExpenseHub() {
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0]?.value || null);
  const [search, setSearch] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  useEffect(() => {
    loadData(selectedMonth);
  }, [selectedMonth]);

  async function loadData(month) {
    setLoading(true);
    try {
      const monthParam = month || undefined;
      const [expData, invData, statsData] = await Promise.all([
        fetchHubExpenses(monthParam),
        fetchHubInvoices(monthParam),
        fetchHubStats(monthParam),
      ]);
      setExpenses(expData || []);
      setInvoices(invData || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load expense hub data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Client-side search filter
  const filteredExpenses = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(
      (e) =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.supplier && e.supplier.toLowerCase().includes(q))
    );
  }, [expenses, search]);

  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
        (inv.supplier && inv.supplier.toLowerCase().includes(q))
    );
  }, [invoices, search]);

  const monthLabel = getMonthLabel(selectedMonth);

  const tabs = [
    { id: 'expenses', label: 'Expenses', icon: HiBanknotes, count: filteredExpenses.length },
    { id: 'invoices', label: 'Invoices', icon: HiDocumentText, count: filteredInvoices.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title="Expense Hub"
          subtitle="Expenses and supplier invoices"
        />
        <button
          onClick={() => { setActiveTab('invoices'); setShowUploadModal(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors whitespace-nowrap"
        >
          <HiPlus className="h-4 w-4" />
          Upload Invoice
        </button>
      </div>

      {/* ─── Stats ─── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={HiBanknotes}
            label={`${monthLabel} Expenses`}
            value={formatCurrency(stats.totalExpenseAmount)}
            color="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
            borderColor="border-l-brand-500"
          />
          <StatCard
            icon={HiDocumentText}
            label={`${monthLabel} Invoices`}
            value={formatCurrency(stats.totalInvoiceAmount)}
            color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            borderColor="border-l-blue-500"
          />
          <StatCard
            icon={HiClock}
            label="Pending / Unpaid"
            value={formatCurrency(stats.pendingAmount)}
            color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
            borderColor="border-l-amber-500"
          />
        </div>
      ) : null}

      {/* ─── Month Selector ─── */}
      <div className="flex flex-wrap items-center gap-2">
        {MONTH_OPTIONS.map((m) => (
          <button
            key={m.value}
            onClick={() => setSelectedMonth(m.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedMonth === m.value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#263554]'
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={() => setSelectedMonth(null)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            selectedMonth === null
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#263554]'
          }`}
        >
          All Time
        </button>
      </div>

      {/* ─── Search ─── */}
      <div className="relative">
        <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by title or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] py-2 pl-10 pr-10 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ─── Tabs ─── */}
      <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* ─── Content ─── */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-[#0ea03e]" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      ) : activeTab === 'expenses' ? (
        <ExpensesTable expenses={filteredExpenses} onPreviewImage={setPreviewImage} />
      ) : (
        <InvoicesTable
          invoices={filteredInvoices}
          onEdit={(inv) => setEditingInvoice(inv)}
          onDelete={async (id) => {
            if (!window.confirm('Delete this invoice?')) return;
            try {
              await deleteHubInvoice(id);
              loadData(selectedMonth);
            } catch (err) {
              alert('Failed to delete: ' + err.message);
            }
          }}
        />
      )}

      {/* ─── Image Preview Modal ─── */}
      {previewImage && (
        <ImagePreviewModal url={previewImage} onClose={() => setPreviewImage(null)} />
      )}

      {/* ─── Upload Invoice Modal ─── */}
      {showUploadModal && (
        <UploadInvoiceModal
          onClose={() => setShowUploadModal(false)}
          onCreated={() => {
            setShowUploadModal(false);
            loadData(selectedMonth);
          }}
        />
      )}

      {/* ─── Edit Invoice Modal ─── */}
      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSaved={() => {
            setEditingInvoice(null);
            loadData(selectedMonth);
          }}
        />
      )}
    </div>
  );
}

// ─── Image Preview Modal ────────────────────────────────────────────────────────

function ImagePreviewModal({ url, onClose }) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-lg"
        >
          <HiXMark className="h-5 w-5" />
        </button>
        <img
          src={url}
          alt="Receipt preview"
          className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
        />
        <div className="mt-3 flex justify-center">
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <HiArrowDownTray className="h-4 w-4" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses Table ─────────────────────────────────────────────────────────────

function ExpensesTable({ expenses, onPreviewImage }) {
  if (!expenses.length) {
    return (
      <EmptyState
        icon={HiBanknotes}
        title="No expenses from Finance Hub"
        description="Expenses submitted via Finance Hub will appear here."
      />
    );
  }

  return (
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
                Supplier
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                Category
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                Receipt
              </th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr
                key={exp.id}
                className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
              >
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(exp.date)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {exp.title || '--'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {exp.supplier || '--'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="default">
                    {CATEGORY_LABELS[exp.category] || capitalize(exp.category)}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatCurrency(exp.amount)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={EXPENSE_STATUS_BADGE[exp.status] || 'default'}>
                    {capitalize(exp.status || 'pending')}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  {exp.image_url ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPreviewImage(exp.image_url)}
                        className="h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-slate-200 dark:border-[#263554] hover:ring-2 hover:ring-brand-500/40 transition-all cursor-pointer"
                        title="Preview receipt"
                      >
                        <img
                          src={exp.image_url}
                          alt="Receipt"
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <a
                        href={exp.image_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-brand-500 transition-colors"
                        title="Download receipt"
                      >
                        <HiArrowDownTray className="h-4 w-4" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-400">
                      <HiPhoto className="h-4 w-4 opacity-30" />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Invoices Table ─────────────────────────────────────────────────────────────

function InvoicesTable({ invoices, onEdit, onDelete }) {
  if (!invoices.length) {
    return (
      <EmptyState
        icon={HiDocumentText}
        title="No supplier invoices"
        description="Upload an invoice using the button above."
      />
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#263554]">
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                Invoice #
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                Supplier
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                GST
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                Due Date
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                File
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">

              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {inv.invoice_number || '--'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {inv.supplier || '--'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatCurrency(inv.amount)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                    {inv.gst_amount ? formatCurrency(inv.gst_amount) : '--'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(inv.due_date)}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={INVOICE_STATUS_BADGE[inv.status] || 'default'}>
                    {capitalize(inv.status || 'unpaid')}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  {inv.file_url ? (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={inv.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-900/20 px-3 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                      >
                        <HiArrowTopRightOnSquare className="h-3.5 w-3.5" />
                        View
                      </a>
                      <a
                        href={inv.file_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-[#1e2d4a] px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#263554] transition-colors"
                      >
                        <HiArrowDownTray className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">--</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(inv)}
                      className="text-slate-400 hover:text-brand-500 transition-colors"
                      title="Edit invoice"
                    >
                      <HiPencilSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(inv.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete invoice"
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
  );
}

// ─── Upload Invoice Modal ──────────────────────────────────────────────────────

function UploadInvoiceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    invoice_number: '',
    supplier: '',
    amount: '',
    gst_amount: '',
    issue_date: toLocalDate(),
    due_date: '',
    status: 'unpaid',
    category: '',
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4.5 * 1024 * 1024) {
      setError('File too large (max 4.5 MB)');
      return;
    }
    setFile(f);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.supplier.trim()) { setError('Supplier is required'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Valid amount is required'); return; }

    setSaving(true);
    setError('');

    try {
      const payload = { ...form };

      if (file) {
        const reader = new FileReader();
        const fileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        payload.fileData = fileData;
        payload.fileName = file.name;
      }

      await createHubInvoice(payload);
      onCreated();
    } catch (err) {
      setError(err.message || 'Failed to upload invoice');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#0f1a2e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#263554] px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Upload Invoice
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Supplier *</label>
              <input
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                placeholder="e.g. Bunnings"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Invoice #</label>
              <input
                name="invoice_number"
                value={form.invoice_number}
                onChange={handleChange}
                placeholder="e.g. INV-001"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Amount (inc. GST) *</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>GST Amount</label>
              <input
                name="gst_amount"
                type="number"
                step="0.01"
                min="0"
                value={form.gst_amount}
                onChange={handleChange}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Issue Date</label>
              <input
                name="issue_date"
                type="date"
                value={form.issue_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select...</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Optional notes..."
              className={inputClass}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className={labelClass}>Attach Invoice File</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-[#263554] p-4 hover:border-brand-500 dark:hover:border-brand-500 transition-colors">
              <HiArrowUpTray className="h-6 w-6 text-slate-400" />
              <div className="flex-1">
                {file ? (
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {file.name}
                    <span className="ml-2 text-slate-400">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    PDF, image, or document (max 4.5 MB)
                  </span>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                onChange={handleFile}
                className="hidden"
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-1 text-xs text-red-500 hover:text-red-600"
              >
                Remove file
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 dark:border-[#263554] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Uploading...' : 'Upload Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Invoice Modal ────────────────────────────────────────────────────────

function EditInvoiceModal({ invoice, onClose, onSaved }) {
  const [form, setForm] = useState({
    invoice_number: invoice.invoice_number || '',
    supplier: invoice.supplier || '',
    amount: invoice.amount || '',
    gst_amount: invoice.gst_amount || '',
    issue_date: invoice.issue_date || '',
    due_date: invoice.due_date || '',
    status: invoice.status || 'unpaid',
    category: invoice.category || '',
    notes: invoice.notes || '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4.5 * 1024 * 1024) {
      setError('File too large (max 4.5 MB)');
      return;
    }
    setFile(f);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.supplier.trim()) { setError('Supplier is required'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Valid amount is required'); return; }

    setSaving(true);
    setError('');

    try {
      const payload = { id: invoice.id, ...form };

      if (file) {
        const reader = new FileReader();
        const fileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        payload.fileData = fileData;
        payload.fileName = file.name;
      }

      await updateHubInvoice(payload);
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#0f1a2e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#263554] px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Edit Invoice
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Supplier *</label>
              <input
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Invoice #</label>
              <input
                name="invoice_number"
                value={form.invoice_number}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Amount (inc. GST) *</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>GST Amount</label>
              <input
                name="gst_amount"
                type="number"
                step="0.01"
                min="0"
                value={form.gst_amount}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Issue Date</label>
              <input
                name="issue_date"
                type="date"
                value={form.issue_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select...</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className={inputClass}
            />
          </div>

          {/* Current file info */}
          {invoice.file_url && !file && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-[#1e2d4a] px-3 py-2">
              <HiDocumentText className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-300 truncate flex-1">
                {invoice.file_name || 'Attached file'}
              </span>
              <a
                href={invoice.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:text-brand-700"
              >
                View
              </a>
            </div>
          )}

          {/* Replace file */}
          <div>
            <label className={labelClass}>{invoice.file_url ? 'Replace File' : 'Attach File'}</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-[#263554] p-4 hover:border-brand-500 dark:hover:border-brand-500 transition-colors">
              <HiArrowUpTray className="h-6 w-6 text-slate-400" />
              <div className="flex-1">
                {file ? (
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {file.name}
                    <span className="ml-2 text-slate-400">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    PDF, image, or document (max 4.5 MB)
                  </span>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                onChange={handleFile}
                className="hidden"
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-1 text-xs text-red-500 hover:text-red-600"
              >
                Remove file
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 dark:border-[#263554] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
