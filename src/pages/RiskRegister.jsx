import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiShieldExclamation,
  HiExclamationTriangle,
  HiPencilSquare,
  HiEye,
  HiTrash,
  HiCheckCircle,
  HiArrowDownTray,
} from 'react-icons/hi2';
import {
  fetchRiskRegister,
  fetchRiskStats,
  createRiskEntry,
  updateRiskEntry,
  deleteRiskEntry,
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

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  operational: 'Operational',
  financial: 'Financial',
  clinical: 'Clinical',
  compliance: 'Compliance',
  reputational: 'Reputational',
  safety: 'Safety',
  environmental: 'Environmental',
  other: 'Other',
};

const LIKELIHOOD_LABELS = {
  rare: 'Rare',
  unlikely: 'Unlikely',
  possible: 'Possible',
  likely: 'Likely',
  almost_certain: 'Almost Certain',
};

const CONSEQUENCE_LABELS = {
  insignificant: 'Insignificant',
  minor: 'Minor',
  moderate: 'Moderate',
  major: 'Major',
  catastrophic: 'Catastrophic',
};

const RATING_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  extreme: 'danger',
};

const STATUS_COLORS = {
  active: 'info',
  monitoring: 'warning',
  mitigated: 'success',
  closed: 'default',
};

const STATUS_FILTERS = ['All', 'Active', 'Monitoring', 'Mitigated', 'Closed'];
const RATING_FILTERS = ['All', 'Extreme', 'High', 'Medium', 'Low'];

// ─── Risk Matrix ──────────────────────────────────────────────────────────────

const RISK_MATRIX = {
  rare:           { insignificant: 'low', minor: 'low',    moderate: 'medium', major: 'medium',  catastrophic: 'high' },
  unlikely:       { insignificant: 'low', minor: 'low',    moderate: 'medium', major: 'high',    catastrophic: 'high' },
  possible:       { insignificant: 'low', minor: 'medium', moderate: 'medium', major: 'high',    catastrophic: 'extreme' },
  likely:         { insignificant: 'medium', minor: 'medium', moderate: 'high', major: 'extreme', catastrophic: 'extreme' },
  almost_certain: { insignificant: 'medium', minor: 'high', moderate: 'high',  major: 'extreme', catastrophic: 'extreme' },
};

function calculateRating(likelihood, consequence) {
  return RISK_MATRIX[likelihood]?.[consequence] || 'medium';
}

// ─── Initial Form ─────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'operational',
  risk_owner: '',
  likelihood: 'possible',
  consequence: 'moderate',
  risk_rating: 'medium',
  existing_controls: '',
  additional_controls: '',
  review_date: '',
  notes: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RiskRegister() {
  const [risks, setRisks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
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
    const status = statusFilter === 'All' ? undefined : statusFilter.toLowerCase();
    const rating = ratingFilter === 'All' ? undefined : ratingFilter.toLowerCase();
    Promise.all([fetchRiskRegister(status, rating), fetchRiskStats()])
      .then(([riskData, statsData]) => {
        setRisks(Array.isArray(riskData) ? riskData : riskData.risks || []);
        setStats(statsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [statusFilter, ratingFilter]);

  // Client-side search filtering
  const filtered = risks.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.title || '').toLowerCase().includes(q) ||
      (r.risk_number || '').toLowerCase().includes(q) ||
      (r.risk_owner || '').toLowerCase().includes(q) ||
      (CATEGORY_LABELS[r.category] || '').toLowerCase().includes(q)
    );
  });

  // Stats calculations
  const totalRisks = stats?.total || risks.length;
  const activeCount = stats?.active || risks.filter((r) => r.status === 'active').length;
  const extremeCount =
    stats?.extreme || risks.filter((r) => r.risk_rating === 'extreme').length;
  const mitigatedCount =
    stats?.mitigated || risks.filter((r) => r.status === 'mitigated').length;

  // ─── Create / Edit Modal ──────────────────────────────────────────────────

  function openFormModal(risk = null) {
    if (risk) {
      setForm({
        title: risk.title || '',
        description: risk.description || '',
        category: risk.category || 'operational',
        risk_owner: risk.risk_owner || '',
        likelihood: risk.likelihood || 'possible',
        consequence: risk.consequence || 'moderate',
        risk_rating: risk.risk_rating || calculateRating(risk.likelihood || 'possible', risk.consequence || 'moderate'),
        existing_controls: risk.existing_controls || '',
        additional_controls: risk.additional_controls || '',
        review_date: risk.review_date || '',
        notes: risk.notes || '',
      });
      setIsEditing(true);
      setSelectedRisk(risk);
    } else {
      setForm(INITIAL_FORM);
      setIsEditing(false);
      setSelectedRisk(null);
    }
    setFormError(null);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setForm(INITIAL_FORM);
    setFormError(null);
    setIsEditing(false);
    setSelectedRisk(null);
  }

  function handleFormChange(field, value) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-recalculate risk rating when likelihood or consequence changes
      if (field === 'likelihood' || field === 'consequence') {
        updated.risk_rating = calculateRating(
          field === 'likelihood' ? value : prev.likelihood,
          field === 'consequence' ? value : prev.consequence
        );
      }
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.description.trim()) return setFormError('Description is required.');
    if (!form.risk_owner.trim()) return setFormError('Risk Owner is required.');

    setSaving(true);
    try {
      const payload = { ...form };
      if (isEditing && selectedRisk) {
        await updateRiskEntry(selectedRisk.id, payload);
      } else {
        await createRiskEntry(payload);
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

  function openViewModal(risk) {
    setSelectedRisk(risk);
    setViewModalOpen(true);
  }

  function closeViewModal() {
    setViewModalOpen(false);
    setSelectedRisk(null);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteRiskEntry(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Rating Badge helpers ────────────────────────────────────────────────

  function RatingBadge({ rating }) {
    if (rating === 'extreme') {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          {rating.charAt(0).toUpperCase() + rating.slice(1)}
        </span>
      );
    }
    return (
      <Badge variant={RATING_COLORS[rating] || 'default'}>
        {(rating || 'medium').charAt(0).toUpperCase() + (rating || 'medium').slice(1)}
      </Badge>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Risk Register"
        subtitle="Identify, assess, and manage organisational risks"
        actions={
          <>
            <button
              onClick={() => exportRegisterPdf({
                title: 'Risk Register',
                columns: ['Title', 'Description', 'Category', 'Rating', 'Existing Controls', 'Additional Controls', 'Owner', 'Status'],
                rows: filtered.map((r) => [
                  r.title || '',
                  r.description || '',
                  CATEGORY_LABELS[r.category] || r.category || '',
                  `${(r.risk_rating || '').toUpperCase()} (${LIKELIHOOD_LABELS[r.likelihood] || r.likelihood || ''} x ${CONSEQUENCE_LABELS[r.consequence] || r.consequence || ''})`,
                  r.existing_controls || '',
                  r.additional_controls || '',
                  r.risk_owner || '',
                  (r.status || '').charAt(0).toUpperCase() + (r.status || '').slice(1),
                ]),
                orientation: 'landscape',
                filename: 'OLF-Risk-Register.pdf',
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
              Add Risk
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
              icon={HiShieldExclamation}
              label="Total Risks"
              value={totalRisks}
              color="bg-blue-50 dark:bg-blue-900/30 text-brand-500"
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="Active"
              value={activeCount}
              color="bg-amber-50 dark:bg-amber-900/30 text-amber-500"
            />
            <StatCard
              icon={HiShieldExclamation}
              label="Extreme Rating"
              value={extremeCount}
              color={
                extremeCount > 0
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                  : 'bg-green-50 dark:bg-green-900/30 text-accent-500'
              }
            />
            <StatCard
              icon={HiCheckCircle}
              label="Mitigated"
              value={mitigatedCount}
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
              placeholder="Search risks..."
              className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Rating pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Rating:</span>
          {RATING_FILTERS.map((opt) => (
            <button
              key={opt}
              onClick={() => setRatingFilter(opt)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                ratingFilter === opt
                  ? 'bg-accent-500 text-white'
                  : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Risks Table */}
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
          icon={HiShieldExclamation}
          title={search || statusFilter !== 'All' || ratingFilter !== 'All' ? 'No risks match your filters.' : 'No risks recorded yet.'}
          description="Use the Add Risk button to log a new risk entry."
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
                    Category
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Likelihood
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Consequence
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Rating
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Review Date
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((risk) => (
                  <tr
                    key={risk.id}
                    className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-medium text-brand-500">
                        {risk.risk_number || `RSK-${String(risk.id).slice(0, 6).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {risk.title}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="default">
                        {CATEGORY_LABELS[risk.category] || risk.category || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">
                      {LIKELIHOOD_LABELS[risk.likelihood] || risk.likelihood || '--'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">
                      {CONSEQUENCE_LABELS[risk.consequence] || risk.consequence || '--'}
                    </td>
                    <td className="px-5 py-4">
                      <RatingBadge rating={risk.risk_rating} />
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_COLORS[risk.status] || 'default'}>
                        {(risk.status || 'active').charAt(0).toUpperCase() + (risk.status || 'active').slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(risk.review_date)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(risk)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500"
                          title="View"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openFormModal(risk)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(risk)}
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

      {/* ─── Create / Edit Risk Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        title={isEditing ? 'Edit Risk' : 'Add Risk'}
        icon={HiShieldExclamation}
        iconColor="text-red-500"
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
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Brief description of the risk"
              />

              {/* Row 2: Category, Risk Owner */}
              <FormRow>
                <FormSelect
                  label="Category"
                  required
                  value={form.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
                <FormInput
                  label="Risk Owner"
                  required
                  value={form.risk_owner}
                  onChange={(e) => handleFormChange('risk_owner', e.target.value)}
                  placeholder="Person responsible for managing this risk"
                />
              </FormRow>

              {/* Row 3: Likelihood, Consequence */}
              <FormRow>
                <FormSelect
                  label="Likelihood"
                  required
                  value={form.likelihood}
                  onChange={(e) => handleFormChange('likelihood', e.target.value)}
                >
                  {Object.entries(LIKELIHOOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Consequence"
                  required
                  value={form.consequence}
                  onChange={(e) => handleFormChange('consequence', e.target.value)}
                >
                  {Object.entries(CONSEQUENCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
              </FormRow>

              {/* Calculated Risk Rating */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Calculated Risk Rating:</span>
                <RatingBadge rating={form.risk_rating} />
              </div>

              {/* Row 4: Description */}
              <FormTextarea
                label="Description"
                required
                rows={4}
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe the risk in detail..."
              />

              {/* Row 5: Existing Controls */}
              <FormTextarea
                label="Existing Controls"
                rows={3}
                value={form.existing_controls}
                onChange={(e) => handleFormChange('existing_controls', e.target.value)}
                placeholder="What controls are currently in place?"
              />

              {/* Row 6: Additional Controls */}
              <FormTextarea
                label="Additional Controls"
                rows={3}
                value={form.additional_controls}
                onChange={(e) => handleFormChange('additional_controls', e.target.value)}
                placeholder="What additional controls are recommended?"
              />

              {/* Row 7: Review Date */}
              <FormInput
                label="Review Date"
                type="date"
                value={form.review_date}
                onChange={(e) => handleFormChange('review_date', e.target.value)}
              />

              {/* Row 8: Notes */}
              <FormTextarea
                label="Notes"
                rows={3}
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Any additional notes..."
              />

              {/* Status select (only when editing) */}
              {isEditing && (
                <FormSelect
                  label="Status"
                  value={selectedRisk?.status || 'active'}
                  onChange={(e) => {
                    setSelectedRisk((prev) => ({ ...prev, status: e.target.value }));
                    handleFormChange('status', e.target.value);
                  }}
                >
                  <option value="active">Active</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="mitigated">Mitigated</option>
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
              {saving ? 'Saving...' : isEditing ? 'Update Risk' : 'Add Risk'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── View Risk Modal ───────────────────────────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={selectedRisk ? `Risk: ${selectedRisk.risk_number || selectedRisk.title}` : 'Risk Details'}
        icon={HiEye}
        iconColor="text-brand-500"
        size="xl"
      >
        {selectedRisk && (
          <>
            <ModalBody>
              <div className="space-y-6">
                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailRow label="Title" value={selectedRisk.title} />
                  <DetailRow
                    label="Ref #"
                    value={selectedRisk.risk_number || `RSK-${String(selectedRisk.id).slice(0, 6).toUpperCase()}`}
                    mono
                  />
                  <DetailRow label="Category" value={CATEGORY_LABELS[selectedRisk.category] || selectedRisk.category || '--'} />
                  <DetailRow label="Risk Owner" value={selectedRisk.risk_owner || '--'} />
                  <DetailRow label="Likelihood" value={LIKELIHOOD_LABELS[selectedRisk.likelihood] || selectedRisk.likelihood || '--'} />
                  <DetailRow label="Consequence" value={CONSEQUENCE_LABELS[selectedRisk.consequence] || selectedRisk.consequence || '--'} />
                  <DetailRow label="Review Date" value={formatDate(selectedRisk.review_date)} />
                  <DetailRow label="Created" value={formatDate(selectedRisk.created_at)} />
                </div>

                {/* Badges */}
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Rating:</span>
                    <RatingBadge rating={selectedRisk.risk_rating} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Status:</span>
                    <Badge variant={STATUS_COLORS[selectedRisk.status] || 'default'}>
                      {(selectedRisk.status || 'active').charAt(0).toUpperCase() + (selectedRisk.status || 'active').slice(1)}
                    </Badge>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-[#263554]" />

                {/* Description */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedRisk.description || '--'}
                  </p>
                </div>

                {/* Existing Controls */}
                {selectedRisk.existing_controls && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Existing Controls
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedRisk.existing_controls}
                    </p>
                  </div>
                )}

                {/* Additional Controls */}
                {selectedRisk.additional_controls && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Additional Controls
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedRisk.additional_controls}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedRisk.notes && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Notes</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedRisk.notes}
                    </p>
                  </div>
                )}

                {/* Mitigated info */}
                {(selectedRisk.status === 'mitigated' || selectedRisk.status === 'closed') && (
                  <>
                    <hr className="border-slate-200 dark:border-[#263554]" />
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 p-4">
                      <h4 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">
                        {selectedRisk.status === 'mitigated' ? 'Mitigated' : 'Closed'}
                      </h4>
                      {selectedRisk.updated_at && (
                        <p className="text-xs text-green-600 dark:text-green-500">
                          Last updated: {formatDate(selectedRisk.updated_at)}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary onClick={closeViewModal}>
                Close
              </ButtonSecondary>
              <ButtonPrimary onClick={() => { closeViewModal(); openFormModal(selectedRisk); }}>
                Edit Risk
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
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Risk</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete the risk{' '}
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

// ─── Detail Row (View Modal) ──────────────────────────────────────────────────

function DetailRow({ label, value, children, mono }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {children || (
        <p className={`mt-0.5 text-sm text-slate-800 dark:text-slate-200 ${mono ? 'font-mono font-medium text-brand-500' : ''}`}>
          {value || '--'}
        </p>
      )}
    </div>
  );
}
