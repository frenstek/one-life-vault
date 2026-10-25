import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiEye,
  HiPencilSquare,
  HiTrash,
  HiScale,
  HiCheckCircle,
  HiExclamationTriangle,
  HiArrowTopRightOnSquare,
  HiArrowDownTray,
} from 'react-icons/hi2';
import {
  fetchLegislation,
  fetchLegislationStats,
  createLegislation,
  updateLegislation,
  deleteLegislation,
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

const TYPE_LABELS = {
  act: 'Act',
  regulation: 'Regulation',
  standard: 'Standard',
  'code-of-practice': 'Code of Practice',
  guideline: 'Guideline',
  'policy-directive': 'Policy Directive',
  other: 'Other',
};

const TYPE_COLORS = {
  act: 'info',
  regulation: 'purple',
  standard: 'success',
  'code-of-practice': 'warning',
  guideline: 'default',
  'policy-directive': 'info',
  other: 'default',
};

const JURISDICTION_LABELS = {
  commonwealth: 'Commonwealth',
  victoria: 'Victoria',
  nsw: 'New South Wales',
  qld: 'Queensland',
  sa: 'South Australia',
  wa: 'Western Australia',
  tas: 'Tasmania',
  nt: 'Northern Territory',
  act: 'ACT',
  'multi-jurisdictional': 'Multi-Jurisdictional',
};

const COMPLIANCE_LABELS = {
  compliant: 'Compliant',
  'partially-compliant': 'Partially Compliant',
  'non-compliant': 'Non-Compliant',
  'under-review': 'Under Review',
  'not-applicable': 'Not Applicable',
};

const COMPLIANCE_COLORS = {
  compliant: 'success',
  'partially-compliant': 'warning',
  'non-compliant': 'danger',
  'under-review': 'info',
  'not-applicable': 'default',
};

const STATUS_LABELS = {
  active: 'Active',
  superseded: 'Superseded',
  repealed: 'Repealed',
  archived: 'Archived',
};

const STATUS_COLORS = {
  active: 'success',
  superseded: 'warning',
  repealed: 'danger',
  archived: 'default',
};

const TYPE_FILTERS = ['All', 'Act', 'Regulation', 'Standard', 'Code of Practice', 'Guideline', 'Policy Directive', 'Other'];
const COMPLIANCE_FILTERS = ['All', 'Compliant', 'Partially Compliant', 'Non-Compliant', 'Under Review', 'Not Applicable'];
const JURISDICTION_FILTERS = ['All', 'Commonwealth', 'Victoria', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT', 'Multi-Jurisdictional'];

// Map display filter labels back to DB keys
function filterToType(filter) {
  const map = {
    'Act': 'act',
    'Regulation': 'regulation',
    'Standard': 'standard',
    'Code of Practice': 'code-of-practice',
    'Guideline': 'guideline',
    'Policy Directive': 'policy-directive',
    'Other': 'other',
  };
  return map[filter] || undefined;
}

function filterToCompliance(filter) {
  const map = {
    'Compliant': 'compliant',
    'Partially Compliant': 'partially-compliant',
    'Non-Compliant': 'non-compliant',
    'Under Review': 'under-review',
    'Not Applicable': 'not-applicable',
  };
  return map[filter] || undefined;
}

function filterToJurisdiction(filter) {
  const map = {
    'Commonwealth': 'commonwealth',
    'Victoria': 'victoria',
    'NSW': 'nsw',
    'QLD': 'qld',
    'SA': 'sa',
    'WA': 'wa',
    'TAS': 'tas',
    'NT': 'nt',
    'ACT': 'act',
    'Multi-Jurisdictional': 'multi-jurisdictional',
  };
  return map[filter] || undefined;
}

// ─── Date Format ──────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Initial Form ─────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  title: '',
  legislation_type: 'act',
  jurisdiction: 'commonwealth',
  reference_number: '',
  administering_body: '',
  description: '',
  relevance: '',
  compliance_status: 'compliant',
  responsible_person: '',
  review_date: '',
  last_reviewed: '',
  effective_date: '',
  link: '',
  notes: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LegislationRegister() {
  const [legislation, setLegislation] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [complianceFilter, setComplianceFilter] = useState('All');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('All');
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

  // ─── Data Loading ─────────────────────────────────────────────────────────

  function loadData() {
    setLoading(true);
    setError(null);
    const type = typeFilter === 'All' ? undefined : filterToType(typeFilter);
    const compliance = complianceFilter === 'All' ? undefined : filterToCompliance(complianceFilter);
    const jurisdiction = jurisdictionFilter === 'All' ? undefined : filterToJurisdiction(jurisdictionFilter);
    Promise.all([fetchLegislation(type, compliance, jurisdiction), fetchLegislationStats()])
      .then(([legData, statsData]) => {
        setLegislation(Array.isArray(legData) ? legData : legData.legislation || []);
        setStats(statsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [typeFilter, complianceFilter, jurisdictionFilter]);

  // Client-side search filtering
  const filtered = legislation.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (l.title || '').toLowerCase().includes(q) ||
      (l.reference_number || '').toLowerCase().includes(q) ||
      (l.administering_body || '').toLowerCase().includes(q) ||
      (l.responsible_person || '').toLowerCase().includes(q)
    );
  });

  // Stats calculations
  const totalCount = stats?.total || legislation.length;
  const compliantCount =
    stats?.compliant || legislation.filter((l) => l.compliance_status === 'compliant').length;
  const partialCount =
    stats?.partially_compliant || legislation.filter((l) => l.compliance_status === 'partially-compliant').length;
  const nonCompliantCount =
    stats?.non_compliant || legislation.filter((l) => l.compliance_status === 'non-compliant').length;

  // ─── Create / Edit Modal ──────────────────────────────────────────────────

  function openFormModal(item = null) {
    if (item) {
      setForm({
        title: item.title || '',
        legislation_type: item.legislation_type || 'act',
        jurisdiction: item.jurisdiction || 'commonwealth',
        reference_number: item.reference_number || '',
        administering_body: item.administering_body || '',
        description: item.description || '',
        relevance: item.relevance || '',
        compliance_status: item.compliance_status || 'compliant',
        responsible_person: item.responsible_person || '',
        review_date: item.review_date || '',
        last_reviewed: item.last_reviewed || '',
        effective_date: item.effective_date || '',
        link: item.link || '',
        notes: item.notes || '',
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

    setSaving(true);
    try {
      const payload = {
        ...form,
        review_date: form.review_date || null,
        last_reviewed: form.last_reviewed || null,
        effective_date: form.effective_date || null,
      };

      if (isEditing && selectedItem) {
        if (form.status) payload.status = form.status;
        await updateLegislation(selectedItem.id, payload);
      } else {
        await createLegislation(payload);
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

  function openViewModal(item) {
    setSelectedItem(item);
    setViewModalOpen(true);
  }

  function closeViewModal() {
    setViewModalOpen(false);
    setSelectedItem(null);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteLegislation(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Legislation Register"
        subtitle="Track applicable legislation, regulations and compliance obligations"
        actions={
          <>
            <button
              onClick={() => exportRegisterPdf({
                title: 'Legislation Register',
                columns: ['Title', 'Type', 'Jurisdiction', 'Compliance', 'Responsible', 'Review Date'],
                rows: filtered.map((l) => [
                  l.title || '',
                  TYPE_LABELS[l.legislation_type] || l.legislation_type || '',
                  JURISDICTION_LABELS[l.jurisdiction] || l.jurisdiction || '',
                  COMPLIANCE_LABELS[l.compliance_status] || l.compliance_status || '',
                  l.responsible_person || '',
                  l.review_date ? formatDate(l.review_date) : '',
                ]),
                filename: 'OLF-Legislation-Register.pdf',
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
              Add Legislation
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
              icon={HiScale}
              label="Total Legislation"
              value={totalCount}
              color="bg-blue-50 dark:bg-blue-900/30 text-brand-500"
            />
            <StatCard
              icon={HiCheckCircle}
              label="Compliant"
              value={compliantCount}
              color="bg-green-50 dark:bg-green-900/30 text-emerald-500"
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="Partially Compliant"
              value={partialCount}
              color="bg-amber-50 dark:bg-amber-900/30 text-amber-500"
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="Non-Compliant"
              value={nonCompliantCount}
              color={
                nonCompliantCount > 0
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                  : 'bg-green-50 dark:bg-green-900/30 text-accent-500'
              }
            />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full max-w-xs">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search legislation..."
              className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Dropdown filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
            >
              {TYPE_FILTERS.map((opt) => (
                <option key={opt} value={opt}>{opt === 'All' ? 'All Types' : opt}</option>
              ))}
            </select>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
            >
              {COMPLIANCE_FILTERS.map((opt) => (
                <option key={opt} value={opt}>{opt === 'All' ? 'All Compliance' : opt}</option>
              ))}
            </select>
            <select
              value={jurisdictionFilter}
              onChange={(e) => setJurisdictionFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
            >
              {JURISDICTION_FILTERS.map((opt) => (
                <option key={opt} value={opt}>{opt === 'All' ? 'All Jurisdictions' : opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legislation Table */}
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
          icon={HiScale}
          title={search || typeFilter !== 'All' || complianceFilter !== 'All' || jurisdictionFilter !== 'All' ? 'No legislation matches your filters.' : 'No legislation recorded yet.'}
          description="Use the Add Legislation button to log a new legislation entry."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#263554]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Title
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Type
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Jurisdiction
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Compliance
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Responsible Person
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
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {l.title}
                      </span>
                      {l.reference_number && (
                        <span className="ml-2 text-xs font-mono text-slate-400">
                          {l.reference_number}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={TYPE_COLORS[l.legislation_type] || 'default'}>
                        {TYPE_LABELS[l.legislation_type] || l.legislation_type || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {JURISDICTION_LABELS[l.jurisdiction] || l.jurisdiction || '--'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={COMPLIANCE_COLORS[l.compliance_status] || 'default'}>
                        {COMPLIANCE_LABELS[l.compliance_status] || l.compliance_status || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {l.responsible_person || '--'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(l.review_date)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(l)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500"
                          title="View"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openFormModal(l)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(l)}
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

      {/* ─── Create / Edit Legislation Modal ──────────────────────────────────── */}
      <Modal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        title={isEditing ? 'Edit Legislation' : 'Add Legislation'}
        icon={HiScale}
        iconColor="text-brand-500"
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
                placeholder="Name of the legislation or regulation"
              />

              {/* Row 2: Type + Jurisdiction */}
              <FormRow>
                <FormSelect
                  label="Legislation Type"
                  required
                  value={form.legislation_type}
                  onChange={(e) => setForm({ ...form, legislation_type: e.target.value })}
                >
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Jurisdiction"
                  required
                  value={form.jurisdiction}
                  onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
                >
                  {Object.entries(JURISDICTION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
              </FormRow>

              {/* Row 3: Reference Number + Administering Body */}
              <FormRow>
                <FormInput
                  label="Reference Number"
                  value={form.reference_number}
                  onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                  placeholder="e.g. No. 20 of 2013"
                />
                <FormInput
                  label="Administering Body"
                  value={form.administering_body}
                  onChange={(e) => setForm({ ...form, administering_body: e.target.value })}
                  placeholder="e.g. NDIS Quality and Safeguards Commission"
                />
              </FormRow>

              {/* Row 4: Effective Date + Responsible Person */}
              <FormRow>
                <FormInput
                  label="Effective Date"
                  type="date"
                  value={form.effective_date}
                  onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                />
                <FormInput
                  label="Responsible Person"
                  value={form.responsible_person}
                  onChange={(e) => setForm({ ...form, responsible_person: e.target.value })}
                  placeholder="Person responsible for compliance"
                />
              </FormRow>

              {/* Row 5: Description (full width textarea) */}
              <FormTextarea
                label="Description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the legislation..."
              />

              {/* Row 6: Relevance (full width textarea) */}
              <FormTextarea
                label="Relevance"
                rows={3}
                value={form.relevance}
                onChange={(e) => setForm({ ...form, relevance: e.target.value })}
                placeholder="How does this apply to your organisation?"
              />

              {/* Row 7: Compliance Status + Review Date */}
              <FormRow>
                <FormSelect
                  label="Compliance Status"
                  required
                  value={form.compliance_status}
                  onChange={(e) => setForm({ ...form, compliance_status: e.target.value })}
                >
                  {Object.entries(COMPLIANCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
                <FormInput
                  label="Review Date"
                  type="date"
                  value={form.review_date}
                  onChange={(e) => setForm({ ...form, review_date: e.target.value })}
                />
              </FormRow>

              {/* Row 8: Link (full width) */}
              <FormInput
                label="Link"
                type="url"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://..."
              />

              {/* Row 9: Notes */}
              <FormTextarea
                label="Notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
              />

              {/* Status (edit only) */}
              {isEditing && (
                <FormSelect
                  label="Status"
                  value={form.status || selectedItem?.status || 'active'}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
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
              {saving ? 'Saving...' : isEditing ? 'Update Legislation' : 'Add Legislation'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── View Legislation Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={selectedItem ? `Legislation: ${selectedItem.title}` : 'Legislation Details'}
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
                  <DetailRow label="Reference Number" value={selectedItem.reference_number || '--'} mono />
                  <DetailRow label="Legislation Type" value={TYPE_LABELS[selectedItem.legislation_type] || selectedItem.legislation_type || '--'} />
                  <DetailRow label="Jurisdiction" value={JURISDICTION_LABELS[selectedItem.jurisdiction] || selectedItem.jurisdiction || '--'} />
                  <DetailRow label="Administering Body" value={selectedItem.administering_body || '--'} />
                  <DetailRow label="Responsible Person" value={selectedItem.responsible_person || '--'} />
                  <DetailRow label="Effective Date" value={formatDate(selectedItem.effective_date)} />
                  <DetailRow label="Review Date" value={formatDate(selectedItem.review_date)} />
                  <DetailRow label="Last Reviewed" value={formatDate(selectedItem.last_reviewed)} />
                  <DetailRow label="Created" value={formatDate(selectedItem.created_at)} />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Compliance:</span>
                    <Badge variant={COMPLIANCE_COLORS[selectedItem.compliance_status] || 'default'}>
                      {COMPLIANCE_LABELS[selectedItem.compliance_status] || selectedItem.compliance_status || '--'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Type:</span>
                    <Badge variant={TYPE_COLORS[selectedItem.legislation_type] || 'default'}>
                      {TYPE_LABELS[selectedItem.legislation_type] || selectedItem.legislation_type || '--'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Status:</span>
                    <Badge variant={STATUS_COLORS[selectedItem.status] || 'default'}>
                      {STATUS_LABELS[selectedItem.status || 'active'] || 'Active'}
                    </Badge>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-[#263554]" />

                {/* Description */}
                {selectedItem.description && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.description}
                    </p>
                  </div>
                )}

                {/* Relevance */}
                {selectedItem.relevance && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Relevance to Organisation
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.relevance}
                    </p>
                  </div>
                )}

                {/* Link */}
                {selectedItem.link && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">External Link</h4>
                    <a
                      href={selectedItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
                    >
                      <HiArrowTopRightOnSquare className="h-4 w-4" />
                      View Legislation
                    </a>
                  </div>
                )}

                {/* Notes */}
                {selectedItem.notes && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Notes</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.notes}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <hr className="border-slate-200 dark:border-[#263554]" />
                <div className="flex gap-6 text-xs text-slate-400 dark:text-slate-500">
                  {selectedItem.created_at && (
                    <span>Created: {formatDate(selectedItem.created_at)}</span>
                  )}
                  {selectedItem.updated_at && (
                    <span>Updated: {formatDate(selectedItem.updated_at)}</span>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary onClick={closeViewModal}>
                Close
              </ButtonSecondary>
              <ButtonPrimary onClick={() => { closeViewModal(); openFormModal(selectedItem); }}>
                Edit Legislation
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
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Legislation</h3>
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
