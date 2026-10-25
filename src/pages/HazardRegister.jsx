import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiFire,
  HiExclamationTriangle,
  HiPencilSquare,
  HiEye,
  HiTrash,
  HiCheckCircle,
  HiShieldCheck,
  HiArrowDownTray,
} from 'react-icons/hi2';
import {
  fetchHazardRegister,
  fetchHazardStats,
  createHazardEntry,
  updateHazardEntry,
  deleteHazardEntry,
  fetchProperties,
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

const HAZARD_TYPE_LABELS = {
  slip_trip_fall: 'Slip/Trip/Fall',
  manual_handling: 'Manual Handling',
  chemical: 'Chemical',
  electrical: 'Electrical',
  biological: 'Biological',
  ergonomic: 'Ergonomic',
  psychosocial: 'Psychosocial',
  fire: 'Fire',
  vehicle: 'Vehicle',
  other: 'Other',
};

const RISK_LEVEL_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  extreme: 'danger',
};

const STATUS_COLORS = {
  identified: 'info',
  controls_in_place: 'warning',
  monitoring: 'purple',
  resolved: 'success',
  closed: 'default',
};

const STATUS_LABELS = {
  identified: 'Identified',
  controls_in_place: 'Controls in Place',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_FILTERS = ['All', 'Identified', 'Controls in Place', 'Monitoring', 'Resolved', 'Closed'];

const INITIAL_FORM = {
  title: '',
  description: '',
  property_id: '',
  location: '',
  hazard_type: 'other',
  reported_by: '',
  date_identified: toLocalDate(),
  risk_level_before: 'medium',
  controls_implemented: '',
  risk_level_after: 'low',
  responsible_person: '',
  review_date: '',
  notes: '',
};

// Map display filter labels back to DB status keys
function filterToStatus(filter) {
  const map = {
    'Identified': 'identified',
    'Controls in Place': 'controls_in_place',
    'Monitoring': 'monitoring',
    'Resolved': 'resolved',
    'Closed': 'closed',
  };
  return map[filter] || undefined;
}

export default function HazardRegister() {
  const [hazards, setHazards] = useState([]);
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);
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
    const status = statusFilter === 'All' ? undefined : filterToStatus(statusFilter);
    Promise.all([
      fetchHazardRegister(status),
      fetchHazardStats(),
      fetchProperties(),
    ])
      .then(([hazardData, statsData, propertyData]) => {
        setHazards(Array.isArray(hazardData) ? hazardData : hazardData.hazards || []);
        setStats(statsData);
        setProperties(Array.isArray(propertyData) ? propertyData : propertyData.properties || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Client-side search filtering
  const filtered = hazards.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (h.title || '').toLowerCase().includes(q) ||
      (h.hazard_number || '').toLowerCase().includes(q) ||
      (h.location || '').toLowerCase().includes(q) ||
      (h.reported_by || '').toLowerCase().includes(q) ||
      (HAZARD_TYPE_LABELS[h.hazard_type] || '').toLowerCase().includes(q)
    );
  });

  // Stats calculations
  const totalHazards = stats?.total || hazards.length;
  const openCount =
    stats?.open ||
    hazards.filter(
      (h) =>
        h.status === 'identified' ||
        h.status === 'controls_in_place' ||
        h.status === 'monitoring'
    ).length;
  const extremeOpen =
    stats?.extreme_open ||
    hazards.filter(
      (h) =>
        (h.risk_level_before === 'extreme' || h.risk_level_before === 'high') &&
        h.status !== 'resolved' &&
        h.status !== 'closed'
    ).length;
  const resolvedCount =
    stats?.resolved || hazards.filter((h) => h.status === 'resolved').length;

  // ─── Create / Edit ──────────────────────────────────────────────────

  function openFormModal(hazard = null) {
    if (hazard) {
      setForm({
        title: hazard.title || '',
        description: hazard.description || '',
        property_id: hazard.property_id || '',
        location: hazard.location || '',
        hazard_type: hazard.hazard_type || 'other',
        reported_by: hazard.reported_by || '',
        date_identified: hazard.date_identified || '',
        risk_level_before: hazard.risk_level_before || 'medium',
        controls_implemented: hazard.controls_implemented || '',
        risk_level_after: hazard.risk_level_after || 'low',
        responsible_person: hazard.responsible_person || '',
        review_date: hazard.review_date || '',
        notes: hazard.notes || '',
      });
      setIsEditing(true);
      setSelectedHazard(hazard);
    } else {
      setForm(INITIAL_FORM);
      setIsEditing(false);
      setSelectedHazard(null);
    }
    setFormError(null);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setForm(INITIAL_FORM);
    setFormError(null);
    setIsEditing(false);
    setSelectedHazard(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.date_identified) return setFormError('Date identified is required.');
    if (!form.reported_by.trim()) return setFormError('Reported By is required.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        property_id: form.property_id || null,
        review_date: form.review_date || null,
      };

      if (isEditing && selectedHazard) {
        // Include status when editing
        if (form.status) payload.status = form.status;
        await updateHazardEntry(selectedHazard.id, payload);
      } else {
        await createHazardEntry(payload);
      }
      closeFormModal();
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── View ───────────────────────────────────────────────────────────

  function openViewModal(hazard) {
    setSelectedHazard(hazard);
    setViewModalOpen(true);
  }

  function closeViewModal() {
    setViewModalOpen(false);
    setSelectedHazard(null);
  }

  // ─── Delete ─────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteHazardEntry(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────

  function getPropertyName(id) {
    if (!id) return '--';
    const p = properties.find((p) => p.id === id);
    return p?.name || p?.address || '--';
  }

  function capitalize(str) {
    if (!str) return '--';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Hazard Register"
        subtitle="Identify, assess, and control workplace hazards"
        actions={
          <>
            <button
              onClick={() => exportRegisterPdf({
                title: 'Hazard Register',
                columns: ['Ref #', 'Title', 'Type', 'Location', 'Risk Before', 'Risk After', 'Status', 'Date'],
                rows: filtered.map((h) => [
                  h.hazard_number || '',
                  h.title || '',
                  HAZARD_TYPE_LABELS[h.hazard_type] || h.hazard_type || '',
                  h.location || '',
                  capitalize(h.risk_level_before),
                  capitalize(h.risk_level_after),
                  STATUS_LABELS[h.status] || capitalize(h.status),
                  h.date_identified ? formatDate(h.date_identified) : '',
                ]),
                filename: 'OLF-Hazard-Register.pdf',
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
              Add Hazard
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
              icon={HiFire}
              label="Total Hazards"
              value={totalHazards}
              color="bg-blue-50 dark:bg-blue-900/30 text-brand-500"
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="Open Hazards"
              value={openCount}
              color="bg-amber-50 dark:bg-amber-900/30 text-amber-500"
            />
            <StatCard
              icon={HiShieldCheck}
              label="High / Extreme Open"
              value={extremeOpen}
              color={
                extremeOpen > 0
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                  : 'bg-green-50 dark:bg-green-900/30 text-accent-500'
              }
            />
            <StatCard
              icon={HiCheckCircle}
              label="Resolved"
              value={resolvedCount}
              color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500"
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
            placeholder="Search hazards..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Hazards Table */}
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
          icon={HiFire}
          title={search || statusFilter !== 'All' ? 'No hazards match your filters.' : 'No hazards recorded yet.'}
          description="Use the Add Hazard button to log a new hazard."
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
                    Hazard Type
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Location
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Risk Before
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Risk After
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Date Identified
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-medium text-brand-500">
                        {h.hazard_number || `HAZ-${String(h.id).slice(0, 6).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {h.title}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="default">
                        {HAZARD_TYPE_LABELS[h.hazard_type] || h.hazard_type || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {h.location || '--'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={RISK_LEVEL_COLORS[h.risk_level_before] || 'default'}
                        className={h.risk_level_before === 'extreme' ? 'font-bold' : ''}
                      >
                        {capitalize(h.risk_level_before)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={RISK_LEVEL_COLORS[h.risk_level_after] || 'default'}>
                        {capitalize(h.risk_level_after)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_COLORS[h.status] || 'default'}>
                        {STATUS_LABELS[h.status] || capitalize(h.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(h.date_identified)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(h)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500"
                          title="View"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openFormModal(h)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(h)}
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

      {/* ─── Create / Edit Hazard Modal ──────────────────────────────────── */}
      <Modal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        title={isEditing ? 'Edit Hazard' : 'Add Hazard'}
        icon={HiFire}
        iconColor="text-amber-500"
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-6">
              <ModalError message={formError} />

              {/* Row 1: Title */}
              <FormInput
                label="Title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief description of the hazard"
              />

              {/* Row 2: Hazard Type + Property */}
              <FormRow>
                <FormSelect
                  label="Hazard Type"
                  required
                  value={form.hazard_type}
                  onChange={(e) => setForm({ ...form, hazard_type: e.target.value })}
                >
                  {Object.entries(HAZARD_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Property"
                  value={form.property_id}
                  onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                >
                  <option value="">-- None --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.address || 'Unknown'}
                    </option>
                  ))}
                </FormSelect>
              </FormRow>

              {/* Row 3: Location + Reported By */}
              <FormRow>
                <FormInput
                  label="Location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Where is the hazard located?"
                />
                <FormInput
                  label="Reported By"
                  required
                  value={form.reported_by}
                  onChange={(e) => setForm({ ...form, reported_by: e.target.value })}
                  placeholder="Name of person reporting"
                />
              </FormRow>

              {/* Row 4: Date Identified + Risk Level Before */}
              <FormRow>
                <FormInput
                  label="Date Identified"
                  required
                  type="date"
                  value={form.date_identified}
                  onChange={(e) => setForm({ ...form, date_identified: e.target.value })}
                />
                <FormSelect
                  label="Risk Level Before"
                  required
                  value={form.risk_level_before}
                  onChange={(e) => setForm({ ...form, risk_level_before: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="extreme">Extreme</option>
                </FormSelect>
              </FormRow>

              {/* Row 5: Description */}
              <FormTextarea
                label="Description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the hazard in detail..."
              />

              {/* Row 6: Controls Implemented */}
              <FormTextarea
                label="Controls Implemented"
                rows={3}
                value={form.controls_implemented}
                onChange={(e) => setForm({ ...form, controls_implemented: e.target.value })}
                placeholder="What controls have been put in place?"
              />

              {/* Row 7: Risk Level After + Responsible Person */}
              <FormRow>
                <FormSelect
                  label="Risk Level After"
                  value={form.risk_level_after}
                  onChange={(e) => setForm({ ...form, risk_level_after: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="extreme">Extreme</option>
                </FormSelect>
                <FormInput
                  label="Responsible Person"
                  value={form.responsible_person}
                  onChange={(e) => setForm({ ...form, responsible_person: e.target.value })}
                  placeholder="Who is responsible for managing this hazard?"
                />
              </FormRow>

              {/* Row 8: Review Date */}
              <FormInput
                label="Review Date"
                type="date"
                value={form.review_date}
                onChange={(e) => setForm({ ...form, review_date: e.target.value })}
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
                  value={form.status || selectedHazard?.status || 'identified'}
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
              {saving ? 'Saving...' : isEditing ? 'Update Hazard' : 'Add Hazard'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── View Hazard Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={selectedHazard ? `Hazard: ${selectedHazard.hazard_number || selectedHazard.title}` : 'Hazard Details'}
        icon={HiEye}
        iconColor="text-brand-500"
        size="xl"
      >
        {selectedHazard && (
          <>
            <ModalBody>
              <div className="space-y-6">
                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailRow label="Title" value={selectedHazard.title} />
                  <DetailRow
                    label="Ref #"
                    value={selectedHazard.hazard_number || `HAZ-${String(selectedHazard.id).slice(0, 6).toUpperCase()}`}
                  />
                  <DetailRow label="Hazard Type" value={HAZARD_TYPE_LABELS[selectedHazard.hazard_type] || selectedHazard.hazard_type || '--'} />
                  <DetailRow label="Property" value={getPropertyName(selectedHazard.property_id)} />
                  <DetailRow label="Location" value={selectedHazard.location || '--'} />
                  <DetailRow label="Reported By" value={selectedHazard.reported_by || '--'} />
                  <DetailRow label="Date Identified" value={formatDate(selectedHazard.date_identified)} />
                  <DetailRow label="Responsible Person" value={selectedHazard.responsible_person || '--'} />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Risk Before:</span>
                    <Badge
                      variant={RISK_LEVEL_COLORS[selectedHazard.risk_level_before] || 'default'}
                      className={selectedHazard.risk_level_before === 'extreme' ? 'font-bold' : ''}
                    >
                      {capitalize(selectedHazard.risk_level_before)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Risk After:</span>
                    <Badge variant={RISK_LEVEL_COLORS[selectedHazard.risk_level_after] || 'default'}>
                      {capitalize(selectedHazard.risk_level_after)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Status:</span>
                    <Badge variant={STATUS_COLORS[selectedHazard.status] || 'default'}>
                      {STATUS_LABELS[selectedHazard.status] || capitalize(selectedHazard.status)}
                    </Badge>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-[#263554]" />

                {/* Description */}
                {selectedHazard.description && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedHazard.description}
                    </p>
                  </div>
                )}

                {/* Controls Implemented */}
                {selectedHazard.controls_implemented && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Controls Implemented
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedHazard.controls_implemented}
                    </p>
                  </div>
                )}

                {/* Review Date */}
                {selectedHazard.review_date && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Review Date</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(selectedHazard.review_date)}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedHazard.notes && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Notes</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedHazard.notes}
                    </p>
                  </div>
                )}

                {/* Resolved info */}
                {(selectedHazard.status === 'resolved' || selectedHazard.status === 'closed') && (
                  <>
                    <hr className="border-slate-200 dark:border-[#263554]" />
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 p-4">
                      <h4 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">
                        Resolution
                      </h4>
                      <div className="flex gap-6 text-xs text-green-600 dark:text-green-500">
                        {selectedHazard.resolved_by && (
                          <span>Resolved by: {selectedHazard.resolved_by}</span>
                        )}
                        {selectedHazard.resolved_at && (
                          <span>Resolved: {formatDate(selectedHazard.resolved_at)}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Timestamps */}
                <hr className="border-slate-200 dark:border-[#263554]" />
                <div className="flex gap-6 text-xs text-slate-400 dark:text-slate-500">
                  {selectedHazard.created_at && (
                    <span>Created: {formatDate(selectedHazard.created_at)}</span>
                  )}
                  {selectedHazard.updated_at && (
                    <span>Updated: {formatDate(selectedHazard.updated_at)}</span>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary onClick={closeViewModal}>
                Close
              </ButtonSecondary>
              <ButtonPrimary onClick={() => { closeViewModal(); openFormModal(selectedHazard); }}>
                Edit Hazard
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
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Hazard</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete the hazard{' '}
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
