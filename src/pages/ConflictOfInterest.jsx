import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiUserGroup,
  HiExclamationTriangle,
  HiPencilSquare,
  HiEye,
  HiTrash,
  HiCheckCircle,
  HiShieldCheck,
  HiArrowDownTray,
} from 'react-icons/hi2';
import {
  fetchConflictOfInterest,
  fetchConflictStats,
  createConflictEntry,
  updateConflictEntry,
  deleteConflictEntry,
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
  ModalError,
} from '../components/ui/Modal';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';
import { exportRegisterPdf } from '../lib/registerPdfExport';
import { toLocalDate } from '../lib/dates';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  personal: 'Personal',
  financial: 'Financial',
  professional: 'Professional',
  familial: 'Familial',
  other: 'Other',
};

const TYPE_COLORS = {
  personal: 'info',
  financial: 'warning',
  professional: 'default',
  familial: 'danger',
  other: 'default',
};

const RISK_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const RISK_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

const STATUS_LABELS = {
  declared: 'Declared',
  under_review: 'Under Review',
  managed: 'Managed',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS = {
  declared: 'info',
  under_review: 'warning',
  managed: 'success',
  resolved: 'success',
  closed: 'default',
};

const STATUS_FILTERS = ['All', 'Declared', 'Under Review', 'Managed', 'Resolved', 'Closed'];

function filterToStatus(label) {
  const map = {
    'Declared': 'declared',
    'Under Review': 'under_review',
    'Managed': 'managed',
    'Resolved': 'resolved',
    'Closed': 'closed',
  };
  return map[label] || label.toLowerCase();
}

// ─── Initial Form ─────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  declared_by: '',
  position: '',
  conflict_type: 'personal',
  description: '',
  related_party: '',
  relationship: '',
  date_declared: toLocalDate(),
  risk_level: 'low',
  management_plan: '',
  mitigation_actions: '',
  reviewed_by: '',
  review_date: '',
  next_review_date: '',
  outcome: '',
  notes: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConflictOfInterest() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Data Loading ─────────────────────────────────────────────────────────

  function loadData() {
    setLoading(true);
    setError(null);
    const status = statusFilter === 'All' ? undefined : filterToStatus(statusFilter);
    Promise.all([fetchConflictOfInterest(status), fetchConflictStats()])
      .then(([data, statsData]) => {
        setEntries(Array.isArray(data) ? data : []);
        setStats(statsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Client-side search
  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (e.declared_by || '').toLowerCase().includes(q) ||
      (e.reference_number || '').toLowerCase().includes(q) ||
      (e.related_party || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q) ||
      (TYPE_LABELS[e.conflict_type] || '').toLowerCase().includes(q)
    );
  });

  // Stats
  const totalEntries = stats?.total || entries.length;
  const activeCount = stats?.declared || 0;
  const underReviewCount = stats?.under_review || 0;
  const highRiskCount = stats?.high_risk || 0;

  // ─── Create / Edit ──────────────────────────────────────────────────────

  function openFormModal(entry = null) {
    if (entry) {
      setForm({
        declared_by: entry.declared_by || '',
        position: entry.position || '',
        conflict_type: entry.conflict_type || 'personal',
        description: entry.description || '',
        related_party: entry.related_party || '',
        relationship: entry.relationship || '',
        date_declared: entry.date_declared || '',
        risk_level: entry.risk_level || 'low',
        management_plan: entry.management_plan || '',
        mitigation_actions: entry.mitigation_actions || '',
        reviewed_by: entry.reviewed_by || '',
        review_date: entry.review_date || '',
        next_review_date: entry.next_review_date || '',
        outcome: entry.outcome || '',
        notes: entry.notes || '',
      });
      setIsEditing(true);
      setSelectedEntry(entry);
    } else {
      setForm(INITIAL_FORM);
      setIsEditing(false);
      setSelectedEntry(null);
    }
    setFormError(null);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setForm(INITIAL_FORM);
    setFormError(null);
    setIsEditing(false);
    setSelectedEntry(null);
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.declared_by.trim()) return setFormError('Declared By is required.');
    if (!form.description.trim()) return setFormError('Description is required.');

    setSaving(true);
    try {
      const payload = { ...form };
      if (isEditing && selectedEntry) {
        payload.status = selectedEntry.status;
        await updateConflictEntry(selectedEntry.id, payload);
      } else {
        await createConflictEntry(payload);
      }
      closeFormModal();
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── View Modal ───────────────────────────────────────────────────────────

  function openViewModal(entry) {
    setSelectedEntry(entry);
    setViewModalOpen(true);
  }

  function closeViewModal() {
    setViewModalOpen(false);
    setSelectedEntry(null);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteConflictEntry(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Conflict of Interest Register"
        subtitle="Declare, review, and manage conflicts of interest"
        actions={
          <>
            <button
              onClick={() => exportRegisterPdf({
                title: 'Conflict of Interest Register',
                columns: ['Declared By', 'Position', 'Type', 'Description', 'Related Party', 'Management Plan', 'Risk', 'Status', 'Date'],
                rows: filtered.map((e) => [
                  e.declared_by || '',
                  e.position || '',
                  TYPE_LABELS[e.conflict_type] || e.conflict_type || '',
                  e.description || '',
                  e.related_party || '',
                  e.management_plan || '',
                  RISK_LABELS[e.risk_level] || e.risk_level || '',
                  STATUS_LABELS[e.status] || e.status || '',
                  e.date_declared ? formatDate(e.date_declared) : '',
                ]),
                orientation: 'landscape',
                filename: 'OLF-Conflict-Of-Interest-Register.pdf',
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
              Add Declaration
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
              icon={HiUserGroup}
              label="Total Declarations"
              value={totalEntries}
              color="bg-blue-50 dark:bg-blue-900/30 text-brand-500"
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="Declared"
              value={activeCount}
              color="bg-amber-50 dark:bg-amber-900/30 text-amber-500"
            />
            <StatCard
              icon={HiShieldCheck}
              label="Under Review"
              value={underReviewCount}
              color="bg-purple-50 dark:bg-purple-900/30 text-purple-500"
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="High Risk"
              value={highRiskCount}
              color={
                highRiskCount > 0
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                  : 'bg-green-50 dark:bg-green-900/30 text-accent-500'
              }
            />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="relative w-full max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search declarations..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
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
          icon={HiUserGroup}
          title={search || statusFilter !== 'All' ? 'No declarations match your filters.' : 'No declarations recorded yet.'}
          description="Use the Add Declaration button to log a new conflict of interest."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#263554]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ref #</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Declared By</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Related Party</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Risk Level</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date Declared</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-medium text-brand-500">
                        {entry.reference_number || `COI-${String(entry.id).slice(0, 6).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{entry.declared_by}</span>
                        {entry.position && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{entry.position}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={TYPE_COLORS[entry.conflict_type] || 'default'}>
                        {TYPE_LABELS[entry.conflict_type] || entry.conflict_type || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">
                      {entry.related_party || '--'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={RISK_COLORS[entry.risk_level] || 'default'}>
                        {RISK_LABELS[entry.risk_level] || entry.risk_level || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_COLORS[entry.status] || 'default'}>
                        {STATUS_LABELS[entry.status] || entry.status || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(entry.date_declared)}
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

      {/* ─── Create / Edit Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        title={isEditing ? 'Edit Declaration' : 'Add Declaration'}
        icon={HiUserGroup}
        iconColor="text-blue-500"
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-6">
              <ModalError message={formError} />

              <FormRow>
                <FormInput
                  label="Declared By"
                  required
                  value={form.declared_by}
                  onChange={(e) => handleFormChange('declared_by', e.target.value)}
                  placeholder="Name of person declaring"
                />
                <FormInput
                  label="Position / Role"
                  value={form.position}
                  onChange={(e) => handleFormChange('position', e.target.value)}
                  placeholder="e.g. Support Worker, Manager"
                />
              </FormRow>

              <FormRow>
                <FormSelect
                  label="Conflict Type"
                  required
                  value={form.conflict_type}
                  onChange={(e) => handleFormChange('conflict_type', e.target.value)}
                >
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Risk Level"
                  required
                  value={form.risk_level}
                  onChange={(e) => handleFormChange('risk_level', e.target.value)}
                >
                  {Object.entries(RISK_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </FormSelect>
              </FormRow>

              <FormRow>
                <FormInput
                  label="Related Party"
                  value={form.related_party}
                  onChange={(e) => handleFormChange('related_party', e.target.value)}
                  placeholder="Person or organisation involved"
                />
                <FormInput
                  label="Relationship"
                  value={form.relationship}
                  onChange={(e) => handleFormChange('relationship', e.target.value)}
                  placeholder="e.g. Family member, Business partner"
                />
              </FormRow>

              <FormTextarea
                label="Description of Conflict"
                required
                rows={4}
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe the nature of the conflict of interest..."
              />

              <FormTextarea
                label="Management Plan"
                rows={3}
                value={form.management_plan}
                onChange={(e) => handleFormChange('management_plan', e.target.value)}
                placeholder="How will this conflict be managed?"
              />

              <FormTextarea
                label="Mitigation Actions"
                rows={3}
                value={form.mitigation_actions}
                onChange={(e) => handleFormChange('mitigation_actions', e.target.value)}
                placeholder="Specific actions to mitigate the conflict..."
              />

              <FormRow>
                <FormInput
                  label="Date Declared"
                  type="date"
                  required
                  value={form.date_declared}
                  onChange={(e) => handleFormChange('date_declared', e.target.value)}
                />
                <FormInput
                  label="Reviewed By"
                  value={form.reviewed_by}
                  onChange={(e) => handleFormChange('reviewed_by', e.target.value)}
                  placeholder="Name of reviewer"
                />
              </FormRow>

              <FormRow>
                <FormInput
                  label="Review Date"
                  type="date"
                  value={form.review_date}
                  onChange={(e) => handleFormChange('review_date', e.target.value)}
                />
                <FormInput
                  label="Next Review Date"
                  type="date"
                  value={form.next_review_date}
                  onChange={(e) => handleFormChange('next_review_date', e.target.value)}
                />
              </FormRow>

              <FormTextarea
                label="Outcome"
                rows={2}
                value={form.outcome}
                onChange={(e) => handleFormChange('outcome', e.target.value)}
                placeholder="Outcome of the review..."
              />

              <FormTextarea
                label="Notes"
                rows={2}
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Any additional notes..."
              />

              {/* Status (edit only) */}
              {isEditing && (
                <FormSelect
                  label="Status"
                  value={selectedEntry?.status || 'declared'}
                  onChange={(e) => {
                    setSelectedEntry((prev) => ({ ...prev, status: e.target.value }));
                  }}
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </FormSelect>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={closeFormModal} disabled={saving}>
              Cancel
            </ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Declaration' : 'Add Declaration'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── View Modal ───────────────────────────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={selectedEntry ? `Declaration: ${selectedEntry.reference_number || selectedEntry.declared_by}` : 'Declaration Details'}
        icon={HiEye}
        iconColor="text-brand-500"
        size="xl"
      >
        {selectedEntry && (
          <>
            <ModalBody>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailRow label="Declared By" value={selectedEntry.declared_by} />
                  <DetailRow
                    label="Ref #"
                    value={selectedEntry.reference_number || `COI-${String(selectedEntry.id).slice(0, 6).toUpperCase()}`}
                    mono
                  />
                  <DetailRow label="Position" value={selectedEntry.position || '--'} />
                  <DetailRow label="Related Party" value={selectedEntry.related_party || '--'} />
                  <DetailRow label="Relationship" value={selectedEntry.relationship || '--'} />
                  <DetailRow label="Date Declared" value={formatDate(selectedEntry.date_declared)} />
                  <DetailRow label="Reviewed By" value={selectedEntry.reviewed_by || '--'} />
                  <DetailRow label="Review Date" value={formatDate(selectedEntry.review_date)} />
                  <DetailRow label="Next Review" value={formatDate(selectedEntry.next_review_date)} />
                  <DetailRow label="Created" value={formatDate(selectedEntry.created_at)} />
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Type:</span>
                    <Badge variant={TYPE_COLORS[selectedEntry.conflict_type] || 'default'}>
                      {TYPE_LABELS[selectedEntry.conflict_type] || selectedEntry.conflict_type}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Risk:</span>
                    <Badge variant={RISK_COLORS[selectedEntry.risk_level] || 'default'}>
                      {RISK_LABELS[selectedEntry.risk_level] || selectedEntry.risk_level}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Status:</span>
                    <Badge variant={STATUS_COLORS[selectedEntry.status] || 'default'}>
                      {STATUS_LABELS[selectedEntry.status] || selectedEntry.status}
                    </Badge>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-[#263554]" />

                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedEntry.description || '--'}
                  </p>
                </div>

                {selectedEntry.management_plan && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Management Plan</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedEntry.management_plan}
                    </p>
                  </div>
                )}

                {selectedEntry.mitigation_actions && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Mitigation Actions</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedEntry.mitigation_actions}
                    </p>
                  </div>
                )}

                {selectedEntry.outcome && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Outcome</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedEntry.outcome}
                    </p>
                  </div>
                )}

                {selectedEntry.notes && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Notes</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedEntry.notes}
                    </p>
                  </div>
                )}

                {(selectedEntry.status === 'resolved' || selectedEntry.status === 'closed') && (
                  <>
                    <hr className="border-slate-200 dark:border-[#263554]" />
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 p-4">
                      <h4 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">
                        {selectedEntry.status === 'resolved' ? 'Resolved' : 'Closed'}
                      </h4>
                      {selectedEntry.updated_at && (
                        <p className="text-xs text-green-600 dark:text-green-500">
                          Last updated: {formatDate(selectedEntry.updated_at)}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary onClick={closeViewModal}>Close</ButtonSecondary>
              <ButtonPrimary onClick={() => { closeViewModal(); openFormModal(selectedEntry); }}>
                Edit Declaration
              </ButtonPrimary>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* ─── Delete Confirmation ───────────────────────────────────────────── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-[#162036] p-8 shadow-xl animate-modal-in border border-transparent dark:border-[#263554]">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <HiExclamationTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Declaration</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete the declaration by{' '}
              <strong>{deleteConfirm.declared_by}</strong>?
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
                {deleting ? 'Deleting...' : (
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

// ─── Detail Row (View Modal) ──────────────────────────────────────────────────

function DetailRow({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm text-slate-800 dark:text-slate-200 ${mono ? 'font-mono font-medium text-brand-500' : ''}`}>
        {value || '--'}
      </p>
    </div>
  );
}
