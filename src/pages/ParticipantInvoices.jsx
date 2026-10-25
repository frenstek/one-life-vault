import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiDocumentText,
  HiCurrencyDollar,
  HiClock,
  HiCheckCircle,
  HiPencilSquare,
  HiTrash,
  HiEye,
  HiArrowUpTray,
  HiXMark,
  HiChevronLeft,
  HiArrowDownTray,
  HiEnvelope,
} from 'react-icons/hi2';
import {
  fetchInvoices,
  fetchInvoice,
  fetchInvoiceStats,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  uploadInvoiceFile,
  fetchParticipants,
  getPublicFileUrl,
} from '../lib/api';
import {
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
  TabBar,
  FormInput,
  FormSelect,
  FormTextarea,
  FormRow,
  FormSection,
  FormDivider,
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
import NDISInvoiceGenerator from '../components/NDISInvoiceGenerator';
import { toLocalDate } from '../lib/dates';

const STATUS_FILTERS = ['All', 'Draft', 'Sent', 'Claimed', 'Paid', 'Rejected', 'Void'];

// Null-safe label — a missing status must never print "undefined"
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '--');

const STATUS_BADGE = {
  draft: 'default',
  sent: 'info',
  claimed: 'warning',
  paid: 'success',
  rejected: 'danger',
  void: 'default',
};

const CLAIM_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'irregular', label: 'Irregular' },
];

const UNIT_OPTIONS = ['hours', 'each', 'km', 'day', 'week'];

const NDIS_SIL_ITEMS = [
  { code: '01_801_0115_1_1', name: 'Weekday Daytime', rate: 70.23, isFlat: false },
  { code: '01_802_0115_1_1', name: 'Weekday Evening', rate: 74.37, isFlat: false },
  { code: '01_803_0115_1_1', name: 'Weekday Night', rate: 78.81, isFlat: false },
  { code: '01_804_0115_1_1', name: 'Saturday', rate: 98.82, isFlat: false },
  { code: '01_805_0115_1_1', name: 'Sunday', rate: 127.44, isFlat: false },
  { code: '01_806_0115_1_1', name: 'Public Holiday', rate: 156.03, isFlat: false },
  { code: '01_832_0115_1_1', name: 'Sleepover', rate: 297.60, isFlat: true },
];

const RATIO_OPTIONS = ['1:1', '1:2', '1:3', '1:4'];

function calcItemHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let s = sh * 60 + sm, e = eh * 60 + em;
  if (e <= s) e += 1440;
  return Math.round(((e - s) / 60) * 100) / 100;
}

function getRatioDiv(r) {
  return { '1:1': 1, '1:2': 2, '1:3': 3, '1:4': 4 }[r] || 3;
}

// Functions so default dates are computed when a form/line is created, not at module load.
const EMPTY_ITEM = () => ({
  support_item_number: '01_801_0115_1_1',
  support_item_name: 'Weekday Daytime',
  description: '',
  service_date: toLocalDate(),
  start_time: '06:00',
  end_time: '14:00',
  ratio: '1:3',
  quantity: 8,
  unit: 'hours',
  unit_price: 23.41,
  gst_applicable: false,
});

const INITIAL_FORM = () => ({
  invoice_date: toLocalDate(),
  due_date: '',
  service_period_start: '',
  service_period_end: '',
  claim_type: 'standard',
  claim_reference: '',
  bill_to: '',
  bill_to_email: '',
  notes: '',
  items: [EMPTY_ITEM()],
});

function formatCurrency(val) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(val) || 0);
}

function formatDateShort(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ParticipantInvoices() {
  const { participantId } = useParams();
  const [participant, setParticipant] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('uploaded');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Create invoice modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);  // lazy initializer
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Upload invoice modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    invoice_date: toLocalDate(),
    service_period_start: '',
    service_period_end: '',
    total: '',
    claim_reference: '',
    notes: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Detail modal
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Attach file to existing invoice
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachInvoiceId, setAttachInvoiceId] = useState(null);
  const [attachFile, setAttachFile] = useState(null);
  const [attaching, setAttaching] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch unfiltered so the stat cards reflect every invoice; the status tab filters client-side
      const [invs, parts] = await Promise.all([
        fetchInvoices(undefined, participantId),
        fetchParticipants(),
      ]);
      setInvoices(Array.isArray(invs) ? invs : []);
      const p = parts.find(p => p.id === participantId);
      setParticipant(p || null);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtered invoices
  const filtered = invoices.filter(inv => {
    if (statusFilter !== 'All' && (inv.status || '') !== statusFilter.toLowerCase()) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.claim_reference?.toLowerCase().includes(q) ||
      inv.notes?.toLowerCase().includes(q)
    );
  });

  // Stats for this participant
  const pStats = {
    total: invoices.length,
    totalValue: invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0),
    outstanding: invoices.filter(i => i.status === 'sent' || i.status === 'claimed').reduce((sum, i) => sum + (Number(i.total) || 0), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.total) || 0), 0),
  };

  // ─── Create Invoice ───────────────────────────────────────────

  function openCreate() {
    setEditingInvoice(null);
    const billTo = participant
      ? participant.funding_type === 'Plan-managed' && participant.plan_manager_name
        ? `${participant.plan_manager_name}${participant.plan_manager_organisation ? ` (${participant.plan_manager_organisation})` : ''}`
        : participant.funding_type === 'NDIA-managed' ? 'NDIA'
        : participant.funding_type === 'Self-managed' ? `${participant.first_name} ${participant.last_name}`
        : ''
      : '';
    setForm({ ...INITIAL_FORM(), bill_to: billTo });
    setError('');
    setCreateModalOpen(true);
  }

  function openEdit(inv) {
    setEditingInvoice(inv);
    setForm({
      invoice_date: inv.invoice_date || '',
      due_date: inv.due_date || '',
      service_period_start: inv.service_period_start || '',
      service_period_end: inv.service_period_end || '',
      claim_type: inv.claim_type || 'standard',
      claim_reference: inv.claim_reference || '',
      bill_to: inv.bill_to || '',
      bill_to_email: inv.bill_to_email || '',
      notes: inv.notes || '',
      items: inv.items && inv.items.length > 0 ? inv.items.map(i => ({
        support_item_number: i.support_item_number || '',
        support_item_name: i.support_item_name || '',
        description: i.description || '',
        service_date: i.service_date || '',
        start_time: i.start_time || EMPTY_ITEM.start_time,
        end_time: i.end_time || EMPTY_ITEM.end_time,
        ratio: i.ratio || EMPTY_ITEM.ratio,
        quantity: i.quantity || 1,
        unit: i.unit || 'hours',
        unit_price: i.unit_price || '',
        gst_applicable: !!i.gst_applicable,
      })) : [EMPTY_ITEM()],
    });
    setError('');
    setCreateModalOpen(true);
  }

  function updateItem(idx, field, value) {
    setForm(f => {
      const items = [...f.items];
      const item = { ...items[idx], [field]: value };

      // Auto-recalculate when NDIS item, ratio, or time changes
      if (field === 'support_item_number') {
        const found = NDIS_SIL_ITEMS.find(i => i.code === value);
        if (found) {
          item.support_item_name = found.name;
          const unitPrice = Math.round((found.rate / getRatioDiv(item.ratio)) * 100) / 100;
          item.unit_price = unitPrice;
          item.unit = found.isFlat ? 'each' : 'hours';
          if (found.isFlat) {
            item.quantity = 1;
          } else {
            item.quantity = calcItemHours(item.start_time, item.end_time);
          }
        }
      }
      if (field === 'ratio') {
        const found = NDIS_SIL_ITEMS.find(i => i.code === item.support_item_number);
        if (found) {
          item.unit_price = Math.round((found.rate / getRatioDiv(value)) * 100) / 100;
        }
      }
      if (field === 'start_time' || field === 'end_time') {
        const found = NDIS_SIL_ITEMS.find(i => i.code === item.support_item_number);
        if (found && !found.isFlat) {
          item.quantity = calcItemHours(
            field === 'start_time' ? value : item.start_time,
            field === 'end_time' ? value : item.end_time
          );
        }
      }

      items[idx] = item;
      return { ...f, items };
    });
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, EMPTY_ITEM()] }));
  }

  function removeItem(idx) {
    setForm(f => {
      const items = f.items.filter((_, i) => i !== idx);
      return { ...f, items: items.length > 0 ? items : [EMPTY_ITEM()] };
    });
  }

  function calcTotals() {
    let subtotal = 0;
    let gst = 0;
    for (const item of form.items) {
      const line = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
      subtotal += line;
      if (item.gst_applicable) gst += line * 0.1;
    }
    return { subtotal, gst, total: subtotal + gst };
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.items.some(i => i.support_item_name && Number(i.unit_price) > 0)) {
      return setError('Add at least one line item with a name and price');
    }
    setSaving(true);
    setError('');
    try {
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, form);
      } else {
        await createInvoice({ ...form, participant_id: participantId });
      }
      setCreateModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Upload Existing Invoice ──────────────────────────────────

  function openUpload() {
    setUploadForm({
      file: null,
      invoice_date: toLocalDate(),
      service_period_start: '',
      service_period_end: '',
      total: '',
      claim_reference: '',
      notes: '',
    });
    setUploadError('');
    setUploadModalOpen(true);
  }

  async function handleUploadInvoice(e) {
    e.preventDefault();
    if (!uploadForm.file) return setUploadError('Please select a file');

    setUploading(true);
    setUploadError('');
    let inv = null;
    try {
      // First create the invoice record (the upload endpoint needs an invoice_id)
      inv = await createInvoice({
        participant_id: participantId,
        invoice_date: uploadForm.invoice_date,
        service_period_start: uploadForm.service_period_start || null,
        service_period_end: uploadForm.service_period_end || null,
        claim_reference: uploadForm.claim_reference || null,
        notes: uploadForm.notes || null,
        status: 'draft',
        items: uploadForm.total ? [{
          support_item_name: 'See attached invoice',
          quantity: 1,
          unit: 'each',
          unit_price: Number(uploadForm.total) || 0,
          gst_applicable: false,
        }] : [],
      });

      // Then upload the file to it. If this fails, remove the record we just made
      // so a retry does not leave a file-less duplicate behind.
      try {
        const fileData = await fileToBase64(uploadForm.file);
        await uploadInvoiceFile({
          invoice_id: inv.id,
          fileData,
          fileName: uploadForm.file.name,
        });
      } catch (uploadErr) {
        await deleteInvoice(inv.id).catch(() => {});
        throw uploadErr;
      }

      setUploadModalOpen(false);
      loadData();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  // ─── Detail View ──────────────────────────────────────────────

  async function openDetail(inv) {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const full = await fetchInvoice(inv.id);
      setDetailInvoice(full);
    } catch (err) {
      console.error('Error loading invoice:', err);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleStatusChange(inv, newStatus) {
    try {
      await updateInvoice(inv.id, { status: newStatus });
      loadData();
      if (detailInvoice?.id === inv.id) {
        setDetailInvoice(d => d ? { ...d, status: newStatus } : d);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  }

  function sendInvoiceEmail(inv) {
    const to = inv.bill_to_email || '';
    const pName = participant ? `${participant.first_name} ${participant.last_name}` : 'Participant';
    const ndis = participant?.ndis_number || '';
    const period = [inv.service_period_start, inv.service_period_end].filter(Boolean).map(d => new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })).join(' - ');
    const total = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(inv.total) || 0);

    const subject = encodeURIComponent(`NDIS Tax Invoice ${inv.invoice_number || ''} — ${pName}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease find attached the NDIS Tax Invoice for:\n\n` +
      `Participant: ${pName}\n` +
      `NDIS Number: ${ndis}\n` +
      `Invoice Number: ${inv.invoice_number || 'N/A'}\n` +
      `Service Period: ${period || 'N/A'}\n` +
      `Amount Due: ${total}\n\n` +
      `Please process this invoice at your earliest convenience.\n\n` +
      `Kind regards,\nOne Life Foundation Pty Ltd\nABN: 21 665 521 942\nPhone: 1300 ONE LIFE\nEmail: admin@onelifefoundation.com.au`
    );

    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self');

    // Also mark as sent
    handleStatusChange(inv, 'sent');
  }

  // ─── Delete ───────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteInvoice(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Attach file to existing invoice ──────────────────────────

  async function handleAttach(e) {
    e.preventDefault();
    if (!attachFile || !attachInvoiceId) return;
    setAttaching(true);
    try {
      const fileData = await fileToBase64(attachFile);
      await uploadInvoiceFile({
        invoice_id: attachInvoiceId,
        fileData,
        fileName: attachFile.name,
      });
      setAttachModalOpen(false);
      setAttachFile(null);
      setAttachInvoiceId(null);
      loadData();
    } catch (err) {
      console.error('Attach failed:', err);
    } finally {
      setAttaching(false);
    }
  }

  const totals = calcTotals();
  const pName = participant ? `${participant.first_name} ${participant.last_name}` : 'Participant';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/invoices" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors">
          <HiChevronLeft className="h-4 w-4" />
          Back to Participants
        </Link>
        <PageHeader
          title={`${pName} — Invoices`}
          subtitle={participant?.ndis_number ? `NDIS: ${participant.ndis_number} | ${participant.funding_type || 'Funding type not set'}` : 'Loading...'}
          actions={
            <div className="flex items-center gap-3">
              <NDISInvoiceGenerator
                participantId={participantId}
                participantName={pName}
                ndisNumber={participant?.ndis_number}
              />
              <button
                onClick={openUpload}
                className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-[#334766] px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
              >
                <HiArrowUpTray className="h-4 w-4" />
                Upload Invoice
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
              >
                <HiPlus className="h-4 w-4" />
                New Invoice
              </button>
            </div>
          }
        />
      </div>

      {/* Stats */}
      {!loading && invoices.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={HiDocumentText} label="Total Invoices" value={pStats.total} color="bg-brand-50 dark:bg-brand-900/20 text-brand-500" />
          <StatCard icon={HiCurrencyDollar} label="Total Value" value={formatCurrency(pStats.totalValue)} color="bg-green-50 dark:bg-green-900/20 text-green-500" />
          <StatCard icon={HiClock} label="Outstanding" value={formatCurrency(pStats.outstanding)} color="bg-amber-50 dark:bg-amber-900/20 text-amber-500" />
          <StatCard icon={HiCheckCircle} label="Paid" value={formatCurrency(pStats.paid)} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" />
        </div>
      )}

      {/* Tabs */}
      <TabBar
        tabs={[
          { id: 'uploaded', label: 'Uploaded Invoices', icon: HiArrowUpTray, count: invoices.filter(i => !!i.file_name).length },
          { id: 'created', label: 'Created Invoices', icon: HiDocumentText, count: invoices.filter(i => !i.file_name).length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ═══ UPLOADED INVOICES TAB ═══ */}
      {activeTab === 'uploaded' && (
        <>
          {loading ? (
            <SkeletonGrid rows={3} />
          ) : (() => {
            const uploaded = filtered.filter(i => !!i.file_name);
            return uploaded.length === 0 ? (
              <EmptyState
                icon={HiArrowUpTray}
                title="No uploaded invoices"
                description="Upload existing invoices (PDF, Word, Excel) for this participant"
                action={
                  <button onClick={openUpload} className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600">
                    <HiArrowUpTray className="h-4 w-4" /> Upload Invoice
                  </button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {uploaded.map(inv => (
                  <div key={inv.id} className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5 transition-shadow hover:shadow-lg">
                    {/* File preview header */}
                    <div className="flex items-start justify-between">
                      <a
                        href={getPublicFileUrl(inv.storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 min-w-0 group"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                          <HiDocumentText className="h-5 w-5 text-brand-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                            {inv.file_name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{inv.invoice_number}</p>
                        </div>
                      </a>
                      <Badge variant={STATUS_BADGE[inv.status] || 'default'}>
                        {capitalize(inv.status)}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-[#263554] pt-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Invoice Date</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatDateShort(inv.invoice_date)}</span>
                      </div>
                      {inv.service_period_start && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Service Period</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {formatDateShort(inv.service_period_start)} - {formatDateShort(inv.service_period_end)}
                          </span>
                        </div>
                      )}
                      {Number(inv.total) > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Total</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(inv.total)}</span>
                        </div>
                      )}
                      {inv.claim_reference && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Claim Ref</span>
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{inv.claim_reference}</span>
                        </div>
                      )}
                      {inv.notes && (
                        <div className="pt-2 border-t border-slate-100 dark:border-[#263554] mt-2">
                          <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Notes</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-3">{inv.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-[#263554] pt-4">
                      <div className="flex items-center gap-1">
                        {inv.status === 'draft' && (
                          <button onClick={() => sendInvoiceEmail(inv)} className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600">
                            <HiEnvelope className="h-3.5 w-3.5" /> Send Email
                          </button>
                        )}
                        {inv.status === 'sent' && (
                          <button onClick={() => handleStatusChange(inv, 'claimed')} className="text-xs font-semibold text-amber-500 hover:text-amber-600">Mark Claimed</button>
                        )}
                        {inv.status === 'claimed' && (
                          <button onClick={() => handleStatusChange(inv, 'paid')} className="text-xs font-semibold text-green-500 hover:text-green-600">Mark Paid</button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={getPublicFileUrl(inv.storage_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-brand-500"
                          title="Open file"
                        >
                          <HiEye className="h-4 w-4" />
                        </a>
                        <button onClick={() => setDeleteId(inv.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500" title="Delete">
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      {/* ═══ CREATED INVOICES TAB ═══ */}
      {activeTab === 'created' && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    statusFilter === s
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#263554]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 sm:w-64"
              />
            </div>
          </div>

          {loading ? (
            <SkeletonGrid rows={5} />
          ) : (() => {
            const created = filtered.filter(i => !i.file_name);
            return created.length === 0 ? (
              <EmptyState
                icon={HiDocumentText}
                title="No created invoices"
                description="Create a new invoice with NDIS line items"
                action={
                  <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600">
                    <HiPlus className="h-4 w-4" /> New Invoice
                  </button>
                }
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#1a2744]">
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Invoice #</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Service Period</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                      {created.map(inv => (
                        <tr key={inv.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-[#1a2744]">
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{inv.invoice_number}</span>
                            {inv.notes && (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{inv.notes}</p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDateShort(inv.invoice_date)}</td>
                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {inv.service_period_start && inv.service_period_end
                              ? `${formatDateShort(inv.service_period_start)} - ${formatDateShort(inv.service_period_end)}`
                              : '--'}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(inv.total)}</span>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={STATUS_BADGE[inv.status] || 'default'}>
                              {capitalize(inv.status)}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openDetail(inv)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-brand-500" title="View">
                                <HiEye className="h-4 w-4" />
                              </button>
                              <button onClick={() => openEdit(inv)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-brand-500" title="Edit">
                                <HiPencilSquare className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setAttachInvoiceId(inv.id); setAttachModalOpen(true); }} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-brand-500" title="Attach file">
                                <HiArrowUpTray className="h-4 w-4" />
                              </button>
                              {inv.status === 'draft' && (
                                <button onClick={() => sendInvoiceEmail(inv)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-accent-500" title="Send via Email">
                                  <HiEnvelope className="h-4 w-4" />
                                </button>
                              )}
                              <button onClick={() => setDeleteId(inv.id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500" title="Delete">
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
          })()}
        </>
      )}

      {/* ═══ Upload Existing Invoice Modal ═══ */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Existing Invoice"
        icon={HiArrowUpTray}
        size="lg"
      >
        <form onSubmit={handleUploadInvoice}>
          <ModalBody>
            <div className="space-y-6">
              <ModalError message={uploadError} />

              <p className="text-sm text-slate-600 dark:text-slate-300">
                Upload a previously created invoice (PDF, Word, Excel, or image).
              </p>

              {/* File picker */}
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Invoice File <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
                    onChange={e => setUploadForm(f => ({ ...f, file: e.target.files[0] || null }))}
                    className="w-full text-sm"
                  />
                </div>
                {uploadForm.file && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {uploadForm.file.name} ({(uploadForm.file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <FormDivider />

              <FormRow>
                <FormInput
                  label="Invoice Date"
                  type="date"
                  required
                  value={uploadForm.invoice_date}
                  onChange={e => setUploadForm(f => ({ ...f, invoice_date: e.target.value }))}
                />
                <FormInput
                  label="Total Amount ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={uploadForm.total}
                  onChange={e => setUploadForm(f => ({ ...f, total: e.target.value }))}
                  hint="Optional — enter the invoice total for tracking"
                />
              </FormRow>

              <FormRow>
                <FormInput
                  label="Service Period Start"
                  type="date"
                  value={uploadForm.service_period_start}
                  onChange={e => setUploadForm(f => ({ ...f, service_period_start: e.target.value }))}
                />
                <FormInput
                  label="Service Period End"
                  type="date"
                  value={uploadForm.service_period_end}
                  onChange={e => setUploadForm(f => ({ ...f, service_period_end: e.target.value }))}
                />
              </FormRow>

              <FormInput
                label="Claim Reference"
                placeholder="NDIS claim reference number"
                value={uploadForm.claim_reference}
                onChange={e => setUploadForm(f => ({ ...f, claim_reference: e.target.value }))}
              />

              <FormTextarea
                label="Notes"
                rows={2}
                placeholder="Any notes about this invoice..."
                value={uploadForm.notes}
                onChange={e => setUploadForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setUploadModalOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={uploading} disabled={!uploadForm.file}>
              Upload Invoice
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ═══ Create/Edit Invoice Modal ═══ */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={editingInvoice ? `Edit Invoice ${editingInvoice.invoice_number}` : 'New Invoice'}
        icon={HiDocumentText}
        size="xl"
      >
        <form onSubmit={handleSave}>
          <ModalBody>
            <div className="space-y-6">
              <ModalError message={error} />

              <FormSection title="Invoice Details">
                <FormRow>
                  <FormInput
                    label="Invoice Date"
                    type="date"
                    required
                    value={form.invoice_date}
                    onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))}
                  />
                  <FormInput
                    label="Due Date"
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  />
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Service Period Start"
                    type="date"
                    value={form.service_period_start}
                    onChange={e => setForm(f => ({ ...f, service_period_start: e.target.value }))}
                  />
                  <FormInput
                    label="Service Period End"
                    type="date"
                    value={form.service_period_end}
                    onChange={e => setForm(f => ({ ...f, service_period_end: e.target.value }))}
                  />
                </FormRow>
                <FormSelect
                  label="Claim Type"
                  value={form.claim_type}
                  onChange={e => setForm(f => ({ ...f, claim_type: e.target.value }))}
                >
                  {CLAIM_TYPES.map(ct => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </FormSelect>
              </FormSection>

              <FormDivider />

              <FormSection title="Billing">
                <FormRow>
                  <FormInput
                    label="Bill To"
                    placeholder="Plan manager, NDIA, or participant"
                    value={form.bill_to}
                    onChange={e => setForm(f => ({ ...f, bill_to: e.target.value }))}
                  />
                  <FormInput
                    label="Bill To Email"
                    type="email"
                    placeholder="billing@example.com"
                    value={form.bill_to_email}
                    onChange={e => setForm(f => ({ ...f, bill_to_email: e.target.value }))}
                  />
                </FormRow>
                <FormInput
                  label="Claim Reference"
                  placeholder="NDIS claim reference number"
                  value={form.claim_reference}
                  onChange={e => setForm(f => ({ ...f, claim_reference: e.target.value }))}
                />
              </FormSection>

              <FormDivider />

              {/* Line Items */}
              <FormSection title="Line Items">
                <div className="space-y-4">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1b2e] p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Item {idx + 1}</span>
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="rounded-lg p-1 text-slate-400 hover:text-red-500">
                            <HiXMark className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {/* Support Item dropdown */}
                        <div>
                          <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Support Item <span className="text-red-500">*</span></label>
                          <select
                            value={item.support_item_number}
                            onChange={e => updateItem(idx, 'support_item_number', e.target.value)}
                            className="w-full text-sm"
                          >
                            {NDIS_SIL_ITEMS.map(si => (
                              <option key={si.code} value={si.code}>
                                {si.name} — ${si.rate.toFixed(2)}/hr [{si.code}]
                              </option>
                            ))}
                          </select>
                        </div>

                        <FormRow cols={3}>
                          {/* Service Date */}
                          <FormInput
                            label="Service Date"
                            type="date"
                            value={item.service_date}
                            onChange={e => updateItem(idx, 'service_date', e.target.value)}
                          />
                          {/* Ratio */}
                          <div>
                            <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Support Ratio</label>
                            <select
                              value={item.ratio || '1:3'}
                              onChange={e => updateItem(idx, 'ratio', e.target.value)}
                              className="w-full text-sm"
                            >
                              {RATIO_OPTIONS.map(r => (
                                <option key={r} value={r}>{r} {r === '1:1' ? '(full rate)' : `(÷${r.split(':')[1]})`}</option>
                              ))}
                            </select>
                          </div>
                          {/* Unit Price (auto-calculated, editable) */}
                          <FormInput
                            label="Unit Price ($)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                          />
                        </FormRow>

                        {/* Time fields (hidden for sleepover) */}
                        {!NDIS_SIL_ITEMS.find(si => si.code === item.support_item_number)?.isFlat && (
                          <FormRow cols={3}>
                            <div>
                              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Start Time</label>
                              <input
                                type="time"
                                value={item.start_time || '06:00'}
                                onChange={e => updateItem(idx, 'start_time', e.target.value)}
                                className="w-full text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">End Time</label>
                              <input
                                type="time"
                                value={item.end_time || '14:00'}
                                onChange={e => updateItem(idx, 'end_time', e.target.value)}
                                className="w-full text-sm"
                              />
                            </div>
                            <FormInput
                              label="Hours"
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', e.target.value)}
                            />
                          </FormRow>
                        )}

                        {/* Description */}
                        <FormInput
                          label="Description"
                          placeholder="Optional notes for this line item"
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                        />

                        {/* Line total */}
                        <div className="flex items-center justify-between rounded-lg bg-teal-50 dark:bg-teal-900/10 px-4 py-2.5">
                          <span className="text-xs text-teal-700 dark:text-teal-400">
                            {item.support_item_name} &middot; {item.ratio || '1:3'} ratio
                            {!NDIS_SIL_ITEMS.find(si => si.code === item.support_item_number)?.isFlat && (
                              <span> &middot; {item.start_time || '06:00'}-{item.end_time || '14:00'} ({item.quantity}hrs)</span>
                            )}
                          </span>
                          <span className="font-mono text-sm font-bold text-teal-700 dark:text-teal-400">
                            {formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-[#334766] py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 transition-colors hover:border-brand-400 hover:text-brand-500"
                  >
                    <HiPlus className="h-4 w-4" />
                    Add Line Item
                  </button>
                </div>
              </FormSection>

              <FormDivider />

              {/* Totals */}
              <div className="rounded-xl bg-slate-50 dark:bg-[#0f1b2e] p-5">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.gst > 0 && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>GST (10%)</span>
                      <span className="font-mono font-semibold">{formatCurrency(totals.gst)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 dark:border-[#263554] pt-2">
                    <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
                      <span>Total</span>
                      <span className="font-mono">{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <FormTextarea
                label="Notes"
                rows={3}
                placeholder="Internal notes..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setCreateModalOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>
              {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ═══ Detail Modal ═══ */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailInvoice(null); }}
        title={detailInvoice ? `Invoice ${detailInvoice.invoice_number}` : 'Invoice Details'}
        icon={HiDocumentText}
        size="xl"
      >
        <ModalBody>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-brand-500" />
            </div>
          ) : detailInvoice ? (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Status</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={STATUS_BADGE[detailInvoice.status] || 'default'}>
                      {capitalize(detailInvoice.status)}
                    </Badge>
                    {detailInvoice.status === 'draft' && (
                      <button onClick={() => sendInvoiceEmail(detailInvoice)} className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600">
                        <HiEnvelope className="h-3.5 w-3.5" /> Send Email
                      </button>
                    )}
                    {detailInvoice.status === 'sent' && (
                      <button onClick={() => handleStatusChange(detailInvoice, 'claimed')} className="text-xs font-semibold text-amber-500 hover:text-amber-600">Mark Claimed</button>
                    )}
                    {detailInvoice.status === 'claimed' && (
                      <button onClick={() => handleStatusChange(detailInvoice, 'paid')} className="text-xs font-semibold text-green-500 hover:text-green-600">Mark Paid</button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Claim Type</p>
                  <p className="mt-1 text-sm capitalize text-slate-900 dark:text-white">{detailInvoice.claim_type || '--'}</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Invoice Date</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">{formatDateShort(detailInvoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Due Date</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">{formatDateShort(detailInvoice.due_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Service Period</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">
                    {detailInvoice.service_period_start
                      ? `${formatDateShort(detailInvoice.service_period_start)} - ${formatDateShort(detailInvoice.service_period_end)}`
                      : '--'}
                  </p>
                </div>
              </div>

              {(detailInvoice.bill_to || detailInvoice.claim_reference) && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {detailInvoice.bill_to && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">Bill To</p>
                      <p className="mt-1 text-sm text-slate-900 dark:text-white">{detailInvoice.bill_to}</p>
                      {detailInvoice.bill_to_email && <p className="text-xs text-slate-500">{detailInvoice.bill_to_email}</p>}
                    </div>
                  )}
                  {detailInvoice.claim_reference && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">Claim Reference</p>
                      <p className="mt-1 font-mono text-sm text-slate-900 dark:text-white">{detailInvoice.claim_reference}</p>
                    </div>
                  )}
                </div>
              )}

              <FormDivider />

              {/* Line Items */}
              {detailInvoice.items && detailInvoice.items.length > 0 && (
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Line Items</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#263554]">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#1a2744]">
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Item</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Date</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500 text-right">Qty</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500 text-right">Rate</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                        {detailInvoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900 dark:text-white">{item.support_item_name}</div>
                              {item.support_item_number && <div className="font-mono text-xs text-slate-400">{item.support_item_number}</div>}
                              {item.description && <div className="text-xs text-slate-500">{item.description}</div>}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDateShort(item.service_date)}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">{item.quantity} {item.unit}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(item.line_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="rounded-xl bg-slate-50 dark:bg-[#0f1b2e] p-5">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold">{formatCurrency(detailInvoice.subtotal)}</span>
                  </div>
                  {Number(detailInvoice.gst) > 0 && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>GST</span>
                      <span className="font-mono font-semibold">{formatCurrency(detailInvoice.gst)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 dark:border-[#263554] pt-2">
                    <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white">
                      <span>Total</span>
                      <span className="font-mono">{formatCurrency(detailInvoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {detailInvoice.file_name && (
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Attached File</p>
                  <a
                    href={getPublicFileUrl(detailInvoice.storage_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-4 py-3 transition-colors hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/10"
                  >
                    <HiDocumentText className="h-5 w-5 text-brand-500" />
                    <span className="text-sm font-medium text-brand-600 dark:text-brand-400">{detailInvoice.file_name}</span>
                    <HiArrowDownTray className="ml-auto h-4 w-4 text-slate-400" />
                  </a>
                </div>
              )}

              {detailInvoice.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Notes</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{detailInvoice.notes}</p>
                </div>
              )}
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => { setDetailModalOpen(false); setDetailInvoice(null); }}>Close</ButtonSecondary>
          {detailInvoice && (
            <ButtonPrimary onClick={() => { setDetailModalOpen(false); openEdit(detailInvoice); }}>
              Edit Invoice
            </ButtonPrimary>
          )}
        </ModalFooter>
      </Modal>

      {/* ═══ Attach File Modal ═══ */}
      <Modal
        isOpen={attachModalOpen}
        onClose={() => { setAttachModalOpen(false); setAttachFile(null); setAttachInvoiceId(null); }}
        title="Attach File to Invoice"
        icon={HiArrowUpTray}
        size="sm"
      >
        <form onSubmit={handleAttach}>
          <ModalBody>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              Attach a PDF or document to this invoice.
            </p>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
              onChange={e => setAttachFile(e.target.files[0] || null)}
              className="w-full text-sm"
            />
            {attachFile && (
              <p className="mt-2 text-xs text-slate-500">
                {attachFile.name} ({(attachFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => { setAttachModalOpen(false); setAttachFile(null); }}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={attaching} disabled={!attachFile}>Upload</ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ═══ Delete Confirmation ═══ */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Invoice"
        icon={HiTrash}
        iconColor="text-red-500"
        size="sm"
      >
        <ModalBody>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete this invoice? This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteId(null)}>Cancel</ButtonSecondary>
          <ButtonDanger onClick={handleDelete} loading={deleting}>Delete</ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}
