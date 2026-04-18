import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiLightBulb,
  HiArrowTrendingUp,
  HiPencilSquare,
  HiEye,
  HiTrash,
  HiCheckCircle,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import {
  fetchCIRegister,
  fetchCIStats,
  createCIEntry,
  updateCIEntry,
  deleteCIEntry,
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

const SOURCE_LABELS = {
  audit: 'Audit',
  feedback: 'Feedback',
  incident: 'Incident',
  internal_review: 'Internal Review',
  staff_suggestion: 'Staff Suggestion',
  complaint: 'Complaint',
  other: 'Other',
};

const CATEGORY_LABELS = {
  service_delivery: 'Service Delivery',
  safety: 'Safety',
  compliance: 'Compliance',
  operations: 'Operations',
  training: 'Training',
  communication: 'Communication',
  other: 'Other',
};

const PRIORITY_BADGE = {
  low: 'default',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

const STATUS_BADGE = {
  identified: 'info',
  in_progress: 'warning',
  implemented: 'success',
  reviewed: 'purple',
  closed: 'default',
};

const STATUS_FILTERS = ['All', 'Identified', 'In Progress', 'Implemented', 'Reviewed', 'Closed'];

const STATUS_LABELS = {
  identified: 'Identified',
  in_progress: 'In Progress',
  implemented: 'Implemented',
  reviewed: 'Reviewed',
  closed: 'Closed',
};

const INITIAL_FORM = {
  title: '',
  description: '',
  source: 'internal_review',
  category: 'operations',
  priority: 'medium',
  identified_by: '',
  identified_date: new Date().toISOString().split('T')[0],
  action_plan: '',
  responsible_person: '',
  target_date: '',
  completion_date: '',
  outcome: '',
  evidence: '',
  review_notes: '',
};

export default function ContinuousImprovement() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function loadData() {
    setLoading(true);
    setError(null);
    const status = statusFilter === 'All' ? undefined : statusFilter.toLowerCase().replace(' ', '_');
    Promise.all([fetchCIRegister(status), fetchCIStats()])
      .then(([ciData, statsData]) => {
        setItems(Array.isArray(ciData) ? ciData : ciData.items || ciData.entries || []);
        setStats(statsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Client-side search filtering
  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (item.title || '').toLowerCase().includes(q) ||
      (item.ci_number || item.ref_number || '').toLowerCase().includes(q) ||
      (item.identified_by || '').toLowerCase().includes(q) ||
      (item.responsible_person || '').toLowerCase().includes(q) ||
      (SOURCE_LABELS[item.source] || '').toLowerCase().includes(q) ||
      (CATEGORY_LABELS[item.category] || '').toLowerCase().includes(q)
    );
  });

  // Stats calculations
  const totalItems = stats?.total || items.length;
  const inProgressCount = stats?.in_progress || items.filter((i) => i.status === 'in_progress').length;
  const implementedCount = stats?.implemented || items.filter((i) => i.status === 'implemented').length;
  const highPriorityCount =
    stats?.high_priority ||
    items.filter(
      (i) =>
        (i.priority === 'high' || i.priority === 'critical') &&
        i.status !== 'closed'
    ).length;

  // ─── Create / Edit ──────────────────────────────────────────────────

  function openFormModal(item = null) {
    if (item) {
      setForm({
        title: item.title || '',
        description: item.description || '',
        source: item.source || 'internal_review',
        category: item.category || 'operations',
        priority: item.priority || 'medium',
        identified_by: item.identified_by || '',
        identified_date: item.identified_date || '',
        action_plan: item.action_plan || '',
        responsible_person: item.responsible_person || '',
        target_date: item.target_date || '',
        completion_date: item.completion_date || '',
        outcome: item.outcome || '',
        evidence: item.evidence || '',
        review_notes: item.review_notes || '',
        status: item.status || 'identified',
      });
      setIsEditing(true);
      setSelectedItem(item);
    } else {
      setForm(INITIAL_FORM);
      setIsEditing(false);
      setSelectedItem(null);
    }
    setFormError(null);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setForm(INITIAL_FORM);
    setFormError(null);
    setIsEditing(false);
    setSelectedItem(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.description.trim()) return setFormError('Description is required.');
    if (!form.identified_by.trim()) return setFormError('Identified By is required.');
    if (!form.identified_date) return setFormError('Identified Date is required.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        target_date: form.target_date || null,
        completion_date: form.completion_date || null,
      };

      if (isEditing && selectedItem) {
        await updateCIEntry(selectedItem.id, payload);
      } else {
        await createCIEntry(payload);
      }
      closeFormModal();
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── View ──────────────────────────────────────────────────────────

  function openViewModal(item) {
    setSelectedItem(item);
    setViewModalOpen(true);
  }

  function closeViewModal() {
    setViewModalOpen(false);
    setSelectedItem(null);
  }

  // ─── Delete ────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteCIEntry(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  function getRefNumber(item) {
    return item.ci_number || item.ref_number || `CI-${String(item.id).slice(0, 6).toUpperCase()}`;
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || (status || 'identified').charAt(0).toUpperCase() + (status || 'identified').slice(1);
  }

  function getPriorityLabel(priority) {
    return (priority || 'medium').charAt(0).toUpperCase() + (priority || 'medium').slice(1);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Continuous Improvement"
        subtitle="Track and manage improvement initiatives"
        actions={
          <button
            onClick={() => openFormModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
          >
            <HiPlus className="h-4 w-4" />
            New Improvement
          </button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={HiLightBulb}
              label="Total Items"
              value={totalItems}
              color="bg-blue-50 dark:bg-blue-900/30 text-brand-500"
            />
            <StatCard
              icon={HiArrowTrendingUp}
              label="In Progress"
              value={inProgressCount}
              color="bg-amber-50 dark:bg-amber-900/30 text-amber-500"
            />
            <StatCard
              icon={HiCheckCircle}
              label="Implemented"
              value={implementedCount}
              color="bg-green-50 dark:bg-green-900/30 text-emerald-500"
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="High Priority"
              value={highPriorityCount}
              color={
                highPriorityCount > 0
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                  : 'bg-green-50 dark:bg-green-900/30 text-accent-500'
              }
            />
          </>
        )}
      </div>

      {/* Filters */}
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
            placeholder="Search improvements..."
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
          icon={HiLightBulb}
          title={search || statusFilter !== 'All' ? 'No improvements match your filters.' : 'No improvement items recorded yet.'}
          description="Use the New Improvement button to log an improvement initiative."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden shadow-sm">
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
                    Source
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Category
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Priority
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Identified
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Target Date
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-medium text-brand-500">
                        {getRefNumber(item)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {item.title}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {SOURCE_LABELS[item.source] || item.source || '--'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="default">
                        {CATEGORY_LABELS[item.category] || item.category || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={PRIORITY_BADGE[item.priority] || 'default'}
                        className={item.priority === 'critical' ? 'font-bold' : ''}
                      >
                        {getPriorityLabel(item.priority)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_BADGE[item.status] || 'default'}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(item.identified_date)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(item.target_date)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(item)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500"
                          title="View"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openFormModal(item)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item)}
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
        title={isEditing ? 'Edit Improvement' : 'New Improvement'}
        icon={HiLightBulb}
        iconColor="text-accent-500"
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-6">
              <ModalError message={formError} />

              {/* Row 1: Title (full width) */}
              <FormInput
                label="Title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief description of the improvement"
              />

              {/* Row 2: Source, Category */}
              <FormRow>
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
              </FormRow>

              {/* Row 3: Priority, Identified By */}
              <FormRow>
                <FormSelect
                  label="Priority"
                  required
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </FormSelect>
                <FormInput
                  label="Identified By"
                  required
                  value={form.identified_by}
                  onChange={(e) => setForm({ ...form, identified_by: e.target.value })}
                  placeholder="Name of person who identified this"
                />
              </FormRow>

              {/* Row 4: Identified Date, Target Date */}
              <FormRow>
                <FormInput
                  label="Identified Date"
                  required
                  type="date"
                  value={form.identified_date}
                  onChange={(e) => setForm({ ...form, identified_date: e.target.value })}
                />
                <FormInput
                  label="Target Date"
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                />
              </FormRow>

              {/* Row 5: Description */}
              <FormTextarea
                label="Description"
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the improvement opportunity or issue identified..."
              />

              {/* Row 6: Action Plan */}
              <FormTextarea
                label="Action Plan"
                rows={3}
                value={form.action_plan}
                onChange={(e) => setForm({ ...form, action_plan: e.target.value })}
                placeholder="What actions will be taken to implement this improvement?"
              />

              {/* Row 7: Responsible Person, Completion Date */}
              <FormRow>
                <FormInput
                  label="Responsible Person"
                  value={form.responsible_person}
                  onChange={(e) => setForm({ ...form, responsible_person: e.target.value })}
                  placeholder="Person responsible for implementation"
                />
                <FormInput
                  label="Completion Date"
                  type="date"
                  value={form.completion_date}
                  onChange={(e) => setForm({ ...form, completion_date: e.target.value })}
                />
              </FormRow>

              {/* Row 8: Outcome */}
              <FormTextarea
                label="Outcome"
                rows={3}
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                placeholder="What was the result of the improvement?"
              />

              {/* Row 9: Evidence, Review Notes */}
              <FormRow>
                <FormTextarea
                  label="Evidence"
                  rows={3}
                  value={form.evidence}
                  onChange={(e) => setForm({ ...form, evidence: e.target.value })}
                  placeholder="Supporting evidence or documentation..."
                />
                <FormTextarea
                  label="Review Notes"
                  rows={3}
                  value={form.review_notes}
                  onChange={(e) => setForm({ ...form, review_notes: e.target.value })}
                  placeholder="Notes from review process..."
                />
              </FormRow>

              {/* Status (only when editing) */}
              {isEditing && (
                <FormSelect
                  label="Status"
                  value={form.status || 'identified'}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="identified">Identified</option>
                  <option value="in_progress">In Progress</option>
                  <option value="implemented">Implemented</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="closed">Closed</option>
                </FormSelect>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={closeFormModal} disabled={saving}>
              Cancel
            </ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Improvement' : 'Create Improvement'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── View Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={selectedItem ? `Improvement: ${getRefNumber(selectedItem)}` : 'Improvement Details'}
        icon={HiEye}
        iconColor="text-brand-500"
        size="xl"
      >
        {selectedItem && (
          <>
            <ModalBody>
              <div className="space-y-6">
                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailRow label="Title" value={selectedItem.title} />
                  <DetailRow label="Ref #" value={getRefNumber(selectedItem)} />
                  <DetailRow label="Source" value={SOURCE_LABELS[selectedItem.source] || selectedItem.source || '--'} />
                  <DetailRow label="Category" value={CATEGORY_LABELS[selectedItem.category] || selectedItem.category || '--'} />
                  <DetailRow label="Identified By" value={selectedItem.identified_by || '--'} />
                  <DetailRow label="Identified Date" value={formatDate(selectedItem.identified_date)} />
                  <DetailRow label="Responsible Person" value={selectedItem.responsible_person || '--'} />
                  <DetailRow label="Target Date" value={formatDate(selectedItem.target_date)} />
                  <DetailRow label="Completion Date" value={formatDate(selectedItem.completion_date)} />
                </div>

                {/* Badges */}
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Priority:</span>
                    <Badge
                      variant={PRIORITY_BADGE[selectedItem.priority] || 'default'}
                      className={selectedItem.priority === 'critical' ? 'font-bold' : ''}
                    >
                      {getPriorityLabel(selectedItem.priority)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Status:</span>
                    <Badge variant={STATUS_BADGE[selectedItem.status] || 'default'}>
                      {getStatusLabel(selectedItem.status)}
                    </Badge>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-[#263554]" />

                {/* Description */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedItem.description || '--'}
                  </p>
                </div>

                {/* Action Plan */}
                {selectedItem.action_plan && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Action Plan</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.action_plan}
                    </p>
                  </div>
                )}

                {/* Outcome */}
                {selectedItem.outcome && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Outcome</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.outcome}
                    </p>
                  </div>
                )}

                {/* Evidence */}
                {selectedItem.evidence && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Evidence</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.evidence}
                    </p>
                  </div>
                )}

                {/* Review Notes */}
                {selectedItem.review_notes && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Review Notes</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.review_notes}
                    </p>
                  </div>
                )}

                {/* Implemented/Reviewed/Closed info */}
                {(selectedItem.status === 'implemented' || selectedItem.status === 'reviewed' || selectedItem.status === 'closed') && selectedItem.completion_date && (
                  <>
                    <hr className="border-slate-200 dark:border-[#263554]" />
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 p-4">
                      <h4 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">
                        Completion Details
                      </h4>
                      <div className="flex gap-6 text-xs text-green-600 dark:text-green-500">
                        {selectedItem.responsible_person && (
                          <span>Responsible: {selectedItem.responsible_person}</span>
                        )}
                        {selectedItem.completion_date && (
                          <span>Completed: {formatDate(selectedItem.completion_date)}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary onClick={closeViewModal}>
                Close
              </ButtonSecondary>
              <ButtonPrimary onClick={() => { closeViewModal(); openFormModal(selectedItem); }}>
                Edit
              </ButtonPrimary>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* ─── Delete Confirmation ───────────────────────────────────────────── */}
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
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Improvement</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete the improvement{' '}
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
