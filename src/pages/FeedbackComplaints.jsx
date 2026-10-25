import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiChatBubbleLeftRight,
  HiExclamationTriangle,
  HiPencilSquare,
  HiEye,
  HiTrash,
  HiHandThumbUp,
  HiCheckCircle,
  HiArrowDownTray,
} from 'react-icons/hi2';
import {
  fetchFCRegister,
  fetchFCStats,
  createFCEntry,
  updateFCEntry,
  deleteFCEntry,
  fetchParticipants,
  formatDate,
} from '../lib/api';
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
import { exportRegisterPdf } from '../lib/registerPdfExport';
import { toLocalDate } from '../lib/dates';

// ─── Constants ──────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  feedback: 'Feedback',
  complaint: 'Complaint',
  compliment: 'Compliment',
  suggestion: 'Suggestion',
};

const TYPE_COLORS = {
  feedback: 'info',
  complaint: 'danger',
  compliment: 'success',
  suggestion: 'purple',
};

const SOURCE_LABELS = {
  participant: 'Participant',
  family: 'Family',
  staff: 'Staff',
  external: 'External',
  anonymous: 'Anonymous',
};

const CATEGORY_LABELS = {
  service_quality: 'Service Quality',
  staff_conduct: 'Staff Conduct',
  safety: 'Safety',
  communication: 'Communication',
  facilities: 'Facilities',
  policy: 'Policy',
  other: 'Other',
};

const SEVERITY_COLORS = {
  low: 'default',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

const STATUS_COLORS = {
  received: 'info',
  acknowledged: 'default',
  investigating: 'warning',
  resolved: 'success',
  closed: 'default',
};

const STATUS_FILTERS = ['All', 'Received', 'Acknowledged', 'Investigating', 'Resolved', 'Closed'];
const TYPE_FILTERS = ['All', 'Feedback', 'Complaint', 'Compliment', 'Suggestion'];

const SATISFACTION_LABELS = {
  satisfied: 'Satisfied',
  partially_satisfied: 'Partially Satisfied',
  unsatisfied: 'Unsatisfied',
  na: 'N/A',
};

// Function so the default date is computed when the form opens, not at module load.
const INITIAL_FORM = () => ({
  title: '',
  description: '',
  type: 'feedback',
  source: 'participant',
  participant_id: '',
  lodged_by: '',
  lodged_date: toLocalDate(),
  category: 'service_quality',
  severity: 'low',
  assigned_to: '',
  resolution: '',
  resolution_date: '',
  follow_up_required: false,
  follow_up_date: '',
  follow_up_notes: '',
  satisfaction_outcome: 'na',
});

// ─── Helpers ────────────────────────────────────────────────────────────────────

function capitalize(str) {
  if (!str) return '--';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function FeedbackComplaints() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form
  const [form, setForm] = useState(INITIAL_FORM);  // lazy initializer
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Data Loading ───────────────────────────────────────────────────────────

  function loadData() {
    setLoading(true);
    setError(null);
    const status = statusFilter === 'All' ? undefined : statusFilter.toLowerCase();
    const type = typeFilter === 'All' ? undefined : typeFilter.toLowerCase();
    Promise.all([
      fetchFCRegister(status, type),
      fetchFCStats(),
      fetchParticipants(),
    ])
      .then(([entryData, statsData, participantData]) => {
        setEntries(Array.isArray(entryData) ? entryData : entryData.entries || []);
        setStats(statsData);
        setParticipants(Array.isArray(participantData) ? participantData : participantData.participants || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter]);

  // ─── Client-Side Search ─────────────────────────────────────────────────────

  const filtered = entries.filter((entry) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (entry.title || '').toLowerCase().includes(q) ||
      (entry.ref_number || '').toLowerCase().includes(q) ||
      (entry.lodged_by || '').toLowerCase().includes(q) ||
      (entry.assigned_to || '').toLowerCase().includes(q) ||
      (CATEGORY_LABELS[entry.category] || '').toLowerCase().includes(q) ||
      (TYPE_LABELS[entry.type] || '').toLowerCase().includes(q) ||
      (SOURCE_LABELS[entry.source] || '').toLowerCase().includes(q)
    );
  });

  // ─── Stats Calculations ─────────────────────────────────────────────────────

  const totalEntries = stats?.total || entries.length;
  const openCount =
    stats?.open ||
    entries.filter(
      (e) => e.status === 'received' || e.status === 'acknowledged' || e.status === 'investigating'
    ).length;
  const complaintsCount =
    stats?.complaints || entries.filter((e) => e.type === 'complaint').length;
  const resolvedCount =
    stats?.resolved || entries.filter((e) => e.status === 'resolved').length;

  // ─── Create / Edit ──────────────────────────────────────────────────────────

  function openFormModal(entry = null) {
    if (entry) {
      setForm({
        title: entry.title || '',
        description: entry.description || '',
        type: entry.type || 'feedback',
        source: entry.source || 'participant',
        participant_id: entry.participant_id || '',
        lodged_by: entry.lodged_by || '',
        lodged_date: entry.lodged_date || '',
        category: entry.category || 'service_quality',
        severity: entry.severity || 'low',
        assigned_to: entry.assigned_to || '',
        resolution: entry.resolution || '',
        resolution_date: entry.resolution_date || '',
        follow_up_required: entry.follow_up_required || false,
        follow_up_date: entry.follow_up_date || '',
        follow_up_notes: entry.follow_up_notes || '',
        satisfaction_outcome: entry.satisfaction_outcome || 'na',
        status: entry.status || 'received',
      });
      setIsEditing(true);
      setSelectedEntry(entry);
    } else {
      setForm(INITIAL_FORM());
      setIsEditing(false);
      setSelectedEntry(null);
    }
    setFormError(null);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setForm(INITIAL_FORM());
    setFormError(null);
    setIsEditing(false);
    setSelectedEntry(null);
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.description.trim()) return setFormError('Description is required.');
    if (!form.lodged_by.trim()) return setFormError('Lodged By is required.');
    if (!form.lodged_date) return setFormError('Lodged Date is required.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        participant_id: form.participant_id || null,
        follow_up_date: form.follow_up_required ? form.follow_up_date || null : null,
        follow_up_notes: form.follow_up_required ? form.follow_up_notes : '',
        resolution_date: form.resolution_date || null,
      };

      if (isEditing && selectedEntry) {
        await updateFCEntry(selectedEntry.id, payload);
      } else {
        await createFCEntry(payload);
      }
      closeFormModal();
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // View modal inline-edit state
  const [viewStatus, setViewStatus] = useState('');
  const [viewResolution, setViewResolution] = useState('');
  const [viewResolutionDate, setViewResolutionDate] = useState('');
  const [viewFollowUpRequired, setViewFollowUpRequired] = useState(false);
  const [viewFollowUpDate, setViewFollowUpDate] = useState('');
  const [viewFollowUpNotes, setViewFollowUpNotes] = useState('');
  const [viewSatisfaction, setViewSatisfaction] = useState('na');
  const [viewError, setViewError] = useState(null);
  const [viewUpdating, setViewUpdating] = useState(false);

  // ─── View ───────────────────────────────────────────────────────────────────

  function openViewModal(entry) {
    setSelectedEntry(entry);
    setViewStatus(entry.status || 'received');
    setViewResolution(entry.resolution || '');
    setViewResolutionDate(entry.resolution_date || '');
    setViewFollowUpRequired(entry.follow_up_required || false);
    setViewFollowUpDate(entry.follow_up_date || '');
    setViewFollowUpNotes(entry.follow_up_notes || '');
    setViewSatisfaction(entry.satisfaction_outcome || 'na');
    setViewError(null);
    setViewModalOpen(true);
  }

  function closeViewModal() {
    setViewModalOpen(false);
    setSelectedEntry(null);
    setViewError(null);
  }

  async function handleViewUpdate() {
    if (!selectedEntry) return;
    setViewError(null);
    setViewUpdating(true);
    try {
      await updateFCEntry(selectedEntry.id, {
        status: viewStatus,
        resolution: viewResolution || null,
        resolution_date: viewResolutionDate || null,
        follow_up_required: viewFollowUpRequired,
        follow_up_date: viewFollowUpRequired ? viewFollowUpDate || null : null,
        follow_up_notes: viewFollowUpRequired ? viewFollowUpNotes : '',
        satisfaction_outcome: viewSatisfaction,
      });
      closeViewModal();
      loadData();
    } catch (err) {
      setViewError(err.message);
    } finally {
      setViewUpdating(false);
    }
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteFCEntry(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function getParticipantName(id) {
    if (!id) return '--';
    const p = participants.find((p) => p.id === id);
    if (!p) return '--';
    return `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || '--';
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Feedback & Complaints Register"
        subtitle="Track and manage feedback, complaints, compliments and suggestions"
        actions={
          <>
            <button
              onClick={() => exportRegisterPdf({
                title: 'Feedback & Complaints Register',
                columns: ['Ref #', 'Title', 'Type', 'Source', 'Severity', 'Status', 'Date', 'Description', 'Resolution'],
                rows: filtered.map((e) => [
                  e.reference_number || e.ref_number || '',
                  e.title || '',
                  TYPE_LABELS[e.type] || e.type || '',
                  SOURCE_LABELS[e.source] || e.source || '',
                  capitalize(e.severity || 'low'),
                  capitalize(e.status || 'received'),
                  e.lodged_date ? formatDate(e.lodged_date) : '',
                  e.description || '',
                  e.resolution || 'N/A',
                ]),
                orientation: 'landscape',
                columnWidths: [8, 12, 6, 7, 6, 6, 7, 24, 24],
                filename: 'OLF-Feedback-Complaints-Register.pdf',
              })}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <HiArrowDownTray className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => openFormModal()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
            >
              <HiPlus className="h-4 w-4" />
              New Entry
            </button>
          </>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={HiChatBubbleLeftRight}
              label="Total Entries"
              value={totalEntries}
              color="bg-blue-50 dark:bg-blue-900/30 text-brand-500"
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="Open"
              value={openCount}
              color="bg-amber-50 dark:bg-amber-900/30 text-amber-500"
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="Complaints"
              value={complaintsCount}
              color={
                complaintsCount > 0
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                  : 'bg-green-50 dark:bg-green-900/30 text-accent-500'
              }
            />
            <StatCard
              icon={HiCheckCircle}
              label="Resolved"
              value={resolvedCount}
              color="bg-green-50 dark:bg-green-900/30 text-emerald-500"
            />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === opt
                    ? 'bg-accent-500 text-white'
                    : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full max-w-xs">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Type pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Type:</span>
          {TYPE_FILTERS.map((opt) => (
            <button
              key={opt}
              onClick={() => setTypeFilter(opt)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === opt
                  ? 'bg-accent-500 text-white'
                  : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
          icon={HiChatBubbleLeftRight}
          title={
            search || statusFilter !== 'All' || typeFilter !== 'All'
              ? 'No entries match your filters.'
              : 'No feedback or complaints recorded yet.'
          }
          description="Use the New Entry button to log feedback, a complaint, compliment or suggestion."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#263554]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ref #
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Title
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Type
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Source
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Category
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Severity
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Lodged Date
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-medium text-brand-500 text-sm">
                        {entry.ref_number || `FC-${String(entry.id).slice(0, 6).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {entry.title}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={TYPE_COLORS[entry.type] || 'default'}>
                        {TYPE_LABELS[entry.type] || capitalize(entry.type)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-800 dark:text-slate-200">
                        {SOURCE_LABELS[entry.source] || capitalize(entry.source)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-800 dark:text-slate-200">
                        {CATEGORY_LABELS[entry.category] || capitalize(entry.category)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={SEVERITY_COLORS[entry.severity] || 'default'}
                        className={entry.severity === 'critical' ? 'font-bold' : ''}
                      >
                        {capitalize(entry.severity || 'low')}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_COLORS[entry.status] || 'default'}>
                        {capitalize(entry.status || 'received')}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(entry.lodged_date)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(entry)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500"
                          title="View"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openFormModal(entry)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(entry)}
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

      {/* ─── Create / Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        title={isEditing ? 'Edit Entry' : 'New Feedback / Complaint'}
        icon={HiChatBubbleLeftRight}
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
                placeholder="Brief summary of the feedback or complaint"
              />

              {/* Row 2: Type, Source */}
              <FormRow>
                <FormSelect
                  label="Type"
                  required
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Source"
                  required
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                >
                  {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
              </FormRow>

              {/* Row 3: Category, Severity */}
              <FormRow>
                <FormSelect
                  label="Category"
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Severity"
                  required
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </FormSelect>
              </FormRow>

              {/* Row 4: Lodged By, Lodged Date */}
              <FormRow>
                <FormInput
                  label="Lodged By"
                  required
                  value={form.lodged_by}
                  onChange={(e) => setForm({ ...form, lodged_by: e.target.value })}
                  placeholder="Name of person lodging"
                />
                <FormInput
                  label="Lodged Date"
                  required
                  type="date"
                  value={form.lodged_date}
                  onChange={(e) => setForm({ ...form, lodged_date: e.target.value })}
                />
              </FormRow>

              {/* Row 5: Participant */}
              <FormSelect
                label="Participant"
                value={form.participant_id}
                onChange={(e) => setForm({ ...form, participant_id: e.target.value })}
              >
                <option value="">-- None --</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Unknown'}
                  </option>
                ))}
              </FormSelect>

              {/* Row 6: Description */}
              <FormTextarea
                label="Description"
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Provide a detailed description of the feedback or complaint..."
              />

              {/* Row 7: Assigned To */}
              <FormInput
                label="Assigned To"
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                placeholder="Person responsible for handling this entry"
              />

              {/* Editing-only fields */}
              {isEditing && (
                <>
                  <hr className="border-slate-200 dark:border-[#263554]" />

                  <FormSelect
                    label="Status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="received">Received</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </FormSelect>

                  <FormTextarea
                    label="Resolution"
                    rows={3}
                    value={form.resolution}
                    onChange={(e) => setForm({ ...form, resolution: e.target.value })}
                    placeholder="Describe the resolution or outcome..."
                  />

                  <FormInput
                    label="Resolution Date"
                    type="date"
                    value={form.resolution_date}
                    onChange={(e) => setForm({ ...form, resolution_date: e.target.value })}
                  />

                  <div className="flex items-center gap-3">
                    <input
                      id="follow_up_required"
                      type="checkbox"
                      checked={form.follow_up_required}
                      onChange={(e) => setForm({ ...form, follow_up_required: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-accent-500 focus:ring-accent-500"
                    />
                    <label
                      htmlFor="follow_up_required"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Follow-up Required
                    </label>
                  </div>

                  {form.follow_up_required && (
                    <div className="space-y-6 pl-7">
                      <FormInput
                        label="Follow-up Date"
                        type="date"
                        value={form.follow_up_date}
                        onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                      />
                      <FormTextarea
                        label="Follow-up Notes"
                        rows={2}
                        value={form.follow_up_notes}
                        onChange={(e) => setForm({ ...form, follow_up_notes: e.target.value })}
                        placeholder="Notes about follow-up actions..."
                      />
                    </div>
                  )}

                  <FormSelect
                    label="Satisfaction Outcome"
                    value={form.satisfaction_outcome}
                    onChange={(e) => setForm({ ...form, satisfaction_outcome: e.target.value })}
                  >
                    {Object.entries(SATISFACTION_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </FormSelect>
                </>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={closeFormModal} disabled={saving}>
              Cancel
            </ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Entry' : 'Submit Entry'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── View Modal ──────────────────────────────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={
          selectedEntry
            ? `${TYPE_LABELS[selectedEntry.type] || 'Entry'}: ${selectedEntry.ref_number || selectedEntry.title}`
            : 'Entry Details'
        }
        icon={HiEye}
        iconColor="text-brand-500"
        size="xl"
      >
        {selectedEntry && (
          <>
            <ModalBody>
              <div className="space-y-6">
                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailRow label="Title" value={selectedEntry.title} />
                  <DetailRow
                    label="Ref #"
                    value={selectedEntry.ref_number || `FC-${String(selectedEntry.id).slice(0, 6).toUpperCase()}`}
                  />
                  <DetailRow label="Lodged By" value={selectedEntry.lodged_by || '--'} />
                  <DetailRow label="Lodged Date" value={formatDate(selectedEntry.lodged_date)} />
                  <DetailRow label="Source" value={SOURCE_LABELS[selectedEntry.source] || capitalize(selectedEntry.source)} />
                  <DetailRow label="Assigned To" value={selectedEntry.assigned_to || '--'} />
                  <DetailRow label="Participant" value={getParticipantName(selectedEntry.participant_id)} />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Type:</span>
                    <Badge variant={TYPE_COLORS[selectedEntry.type] || 'default'}>
                      {TYPE_LABELS[selectedEntry.type] || capitalize(selectedEntry.type)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Severity:</span>
                    <Badge
                      variant={SEVERITY_COLORS[selectedEntry.severity] || 'default'}
                      className={selectedEntry.severity === 'critical' ? 'font-bold' : ''}
                    >
                      {capitalize(selectedEntry.severity || 'low')}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Category:</span>
                    <Badge variant="default">
                      {CATEGORY_LABELS[selectedEntry.category] || capitalize(selectedEntry.category)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Status:</span>
                    <Badge variant={STATUS_COLORS[selectedEntry.status] || 'default'}>
                      {capitalize(selectedEntry.status || 'received')}
                    </Badge>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-[#263554]" />

                {/* Description */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedEntry.description || '--'}
                  </p>
                </div>

                <hr className="border-slate-200 dark:border-[#263554]" />

                {/* ─── Update Section ─────────────────────────────────── */}
                <ModalError message={viewError} />

                <FormSelect
                  label="Status"
                  value={viewStatus}
                  onChange={(e) => setViewStatus(e.target.value)}
                >
                  <option value="received">Received</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </FormSelect>

                <FormTextarea
                  label="Resolution / Completion Notes"
                  rows={3}
                  value={viewResolution}
                  onChange={(e) => setViewResolution(e.target.value)}
                  placeholder="Describe the resolution or outcome..."
                />

                {(viewStatus === 'resolved' || viewStatus === 'closed') && (
                  <FormInput
                    label="Resolution Date"
                    type="date"
                    value={viewResolutionDate}
                    onChange={(e) => setViewResolutionDate(e.target.value)}
                  />
                )}

                <div className="flex items-center gap-3">
                  <input
                    id="view_follow_up_required"
                    type="checkbox"
                    checked={viewFollowUpRequired}
                    onChange={(e) => setViewFollowUpRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-accent-500 focus:ring-accent-500"
                  />
                  <label
                    htmlFor="view_follow_up_required"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Follow-up Required
                  </label>
                </div>

                {viewFollowUpRequired && (
                  <div className="space-y-6 pl-7">
                    <FormInput
                      label="Follow-up Date"
                      type="date"
                      value={viewFollowUpDate}
                      onChange={(e) => setViewFollowUpDate(e.target.value)}
                    />
                    <FormTextarea
                      label="Follow-up Notes"
                      rows={2}
                      value={viewFollowUpNotes}
                      onChange={(e) => setViewFollowUpNotes(e.target.value)}
                      placeholder="Notes about follow-up actions..."
                    />
                  </div>
                )}

                <FormSelect
                  label="Satisfaction Outcome"
                  value={viewSatisfaction}
                  onChange={(e) => setViewSatisfaction(e.target.value)}
                >
                  {Object.entries(SATISFACTION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>

                {/* Timestamps */}
                <hr className="border-slate-200 dark:border-[#263554]" />
                <div className="flex gap-6 text-xs text-slate-400 dark:text-slate-500">
                  {selectedEntry.created_at && (
                    <span>Created: {formatDate(selectedEntry.created_at)}</span>
                  )}
                  {selectedEntry.updated_at && (
                    <span>Updated: {formatDate(selectedEntry.updated_at)}</span>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary onClick={closeViewModal} disabled={viewUpdating}>Close</ButtonSecondary>
              <ButtonPrimary onClick={handleViewUpdate} loading={viewUpdating}>
                {viewUpdating ? 'Saving...' : 'Save Update'}
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
                <HiExclamationTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Entry</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete{' '}
              <strong>{deleteConfirm.title}</strong>?
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
