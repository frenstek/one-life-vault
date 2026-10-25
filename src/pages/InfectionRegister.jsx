import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiEye,
  HiTrash,
  HiArrowDownTray,
  HiBeaker,
} from 'react-icons/hi2';
import {
  fetchInfectionRegister,
  fetchInfectionStats,
  createInfectionEntry,
  updateInfectionEntry,
  deleteInfectionEntry,
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
import { SkeletonStatCard } from '../components/ui/Skeleton';
import { exportRegisterPdf } from '../lib/registerPdfExport';
import { toLocalDate } from '../lib/dates';

// ─── Constants ──────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  gastroenteritis: 'Gastroenteritis',
  respiratory: 'Respiratory',
  wound: 'Wound Infection',
  blood_body_fluid: 'Blood/Body Fluid',
  skin: 'Skin Infection',
  covid: 'COVID-19',
  other: 'Other',
};

const TYPE_COLORS = {
  gastroenteritis: 'warning',
  respiratory: 'info',
  wound: 'danger',
  blood_body_fluid: 'danger',
  skin: 'warning',
  covid: 'purple',
  other: 'default',
};

const AFFECTED_LABELS = {
  participant: 'Participant',
  staff: 'Staff',
  both: 'Both',
  visitor: 'Visitor',
};

const STATUS_COLORS = {
  active: 'danger',
  monitoring: 'warning',
  resolved: 'success',
  closed: 'default',
};

const STATUS_FILTERS = ['All', 'Active', 'Monitoring', 'Resolved', 'Closed'];
const TYPE_FILTERS = ['All', 'Gastroenteritis', 'Respiratory', 'Wound', 'Blood/Body Fluid', 'Skin', 'COVID-19', 'Other'];

const INITIAL_FORM = {
  event_date: toLocalDate(),
  property_location: '',
  infection_type: 'other',
  description: '',
  persons_affected: 'participant',
  number_affected: 1,
  actions_taken: '',
  ppe_used: '',
  cleaning_completed: false,
  notification_required: false,
  notified_to: '',
  notification_date: '',
  reported_by: '',
  outcome: '',
  resolution_date: '',
  follow_up_required: false,
  follow_up_date: '',
  follow_up_notes: '',
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function capitalize(str) {
  if (!str) return '--';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function InfectionRegister() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
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
  const [form, setForm] = useState(INITIAL_FORM);
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
    const type = typeFilter === 'All' ? undefined : TYPE_FILTERS.indexOf(typeFilter) > 0
      ? Object.keys(TYPE_LABELS)[TYPE_FILTERS.indexOf(typeFilter) - 1]
      : undefined;
    Promise.all([
      fetchInfectionRegister(status, type),
      fetchInfectionStats(),
    ])
      .then(([entryData, statsData]) => {
        setEntries(Array.isArray(entryData) ? entryData : []);
        setStats(statsData);
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
      (entry.description || '').toLowerCase().includes(q) ||
      (entry.reference_number || '').toLowerCase().includes(q) ||
      (entry.reported_by || '').toLowerCase().includes(q) ||
      (entry.property_location || '').toLowerCase().includes(q) ||
      (TYPE_LABELS[entry.infection_type] || '').toLowerCase().includes(q)
    );
  });

  // ─── Create / Edit ──────────────────────────────────────────────────────────

  function openFormModal(entry = null) {
    if (entry) {
      setForm({
        event_date: entry.event_date || '',
        property_location: entry.property_location || '',
        infection_type: entry.infection_type || 'other',
        description: entry.description || '',
        persons_affected: entry.persons_affected || 'participant',
        number_affected: entry.number_affected || 1,
        actions_taken: entry.actions_taken || '',
        ppe_used: entry.ppe_used || '',
        cleaning_completed: entry.cleaning_completed || false,
        notification_required: entry.notification_required || false,
        notified_to: entry.notified_to || '',
        notification_date: entry.notification_date || '',
        reported_by: entry.reported_by || '',
        outcome: entry.outcome || '',
        resolution_date: entry.resolution_date || '',
        follow_up_required: entry.follow_up_required || false,
        follow_up_date: entry.follow_up_date || '',
        follow_up_notes: entry.follow_up_notes || '',
      });
      setSelectedEntry(entry);
      setIsEditing(true);
    } else {
      setForm(INITIAL_FORM);
      setSelectedEntry(null);
      setIsEditing(false);
    }
    setFormError(null);
    setFormModalOpen(true);
  }

  async function handleSave() {
    if (!form.description.trim()) return setFormError('Description is required');
    if (!form.reported_by.trim()) return setFormError('Reported by is required');
    if (!form.property_location.trim()) return setFormError('Property location is required');

    setSaving(true);
    setFormError(null);
    try {
      if (isEditing && selectedEntry) {
        await updateInfectionEntry(selectedEntry.id, form);
      } else {
        await createInfectionEntry(form);
      }
      setFormModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── View ─────────────────────────────────────────────────────────────────────

  function openViewModal(entry) {
    setSelectedEntry(entry);
    setViewModalOpen(true);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteInfectionEntry(deleteConfirm.id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Update Status from View ──────────────────────────────────────────────────

  async function handleStatusUpdate(newStatus) {
    if (!selectedEntry) return;
    try {
      await updateInfectionEntry(selectedEntry.id, { status: newStatus });
      setViewModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infection Register"
        subtitle="Track and manage infection control events"
        actions={
          <>
            <button
              onClick={() => exportRegisterPdf({
                title: 'Infection Control Register',
                columns: ['Ref #', 'Date', 'Location', 'Type', 'Affected', 'Status', 'Reported By', 'Description', 'Actions Taken', 'Outcome/Resolution'],
                rows: filtered.map((e) => [
                  e.reference_number || '',
                  e.event_date ? formatDate(e.event_date) : '',
                  e.property_location || '',
                  TYPE_LABELS[e.infection_type] || e.infection_type || '',
                  AFFECTED_LABELS[e.persons_affected] || e.persons_affected || '',
                  capitalize(e.status || 'active'),
                  e.reported_by || '',
                  e.description || '',
                  e.actions_taken || 'N/A',
                  (e.outcome || 'N/A') + (e.resolution_date ? ` (Resolved: ${formatDate(e.resolution_date)})` : ''),
                ]),
                orientation: 'landscape',
                columnWidths: [7, 6, 8, 7, 6, 5, 8, 20, 18, 15],
                filename: 'OLF-Infection-Register.pdf',
              })}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <HiArrowDownTray className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => openFormModal()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <HiPlus className="h-4 w-4" />
              New Entry
            </button>
          </>
        }
      />

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={HiBeaker} label="Total Events" value={stats?.total || entries.length} color="bg-blue-50 dark:bg-blue-900/30 text-blue-500" />
          <StatCard icon={HiBeaker} label="Active" value={stats?.active || entries.filter(e => e.status === 'active').length} color="bg-red-50 dark:bg-red-900/30 text-red-500" />
          <StatCard icon={HiBeaker} label="Monitoring" value={stats?.monitoring || entries.filter(e => e.status === 'monitoring').length} color="bg-amber-50 dark:bg-amber-900/30 text-amber-500" />
          <StatCard icon={HiBeaker} label="Resolved" value={stats?.resolved || entries.filter(e => e.status === 'resolved').length} color="bg-green-50 dark:bg-green-900/30 text-green-500" />
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded bg-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HiBeaker}
          title="No infection events"
          description="No entries match your current filters."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ref #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Affected</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reported By</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{entry.reference_number || '--'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{entry.event_date ? formatDate(entry.event_date) : '--'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{entry.property_location || '--'}</td>
                  <td className="px-4 py-3"><Badge variant={TYPE_COLORS[entry.infection_type] || 'default'}>{TYPE_LABELS[entry.infection_type] || entry.infection_type}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{AFFECTED_LABELS[entry.persons_affected] || entry.persons_affected}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_COLORS[entry.status] || 'default'}>{capitalize(entry.status)}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{entry.reported_by || '--'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openViewModal(entry)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><HiEye className="h-4 w-4" /></button>
                      <button onClick={() => openFormModal(entry)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"><HiPencilSquare className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteConfirm(entry)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"><HiTrash className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Create/Edit Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} title={isEditing ? 'Edit Entry' : 'New Infection Event'} size="lg">
        <ModalBody>
          {formError && <ModalError message={formError} />}
          <div className="space-y-4">
            <FormRow>
              <FormInput label="Event Date" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
              <FormInput label="Property/Location" value={form.property_location} onChange={(e) => setForm({ ...form, property_location: e.target.value })} required placeholder="e.g. Epping Property" />
            </FormRow>
            <FormRow>
              <FormSelect label="Infection Type" value={form.infection_type} onChange={(e) => setForm({ ...form, infection_type: e.target.value })} required>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </FormSelect>
              <FormSelect label="Persons Affected" value={form.persons_affected} onChange={(e) => setForm({ ...form, persons_affected: e.target.value })} required>
                {Object.entries(AFFECTED_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </FormSelect>
            </FormRow>
            <FormRow>
              <FormInput label="Number Affected" type="number" min="1" value={form.number_affected} onChange={(e) => setForm({ ...form, number_affected: parseInt(e.target.value) || 1 })} />
              <FormInput label="Reported By" value={form.reported_by} onChange={(e) => setForm({ ...form, reported_by: e.target.value })} required placeholder="Staff name" />
            </FormRow>
            <FormTextarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} placeholder="What happened..." />
            <FormTextarea label="Actions Taken" value={form.actions_taken} onChange={(e) => setForm({ ...form, actions_taken: e.target.value })} rows={3} placeholder="Cleaning, isolation, notification..." />
            <FormRow>
              <FormInput label="PPE Used" value={form.ppe_used} onChange={(e) => setForm({ ...form, ppe_used: e.target.value })} placeholder="Gloves, apron, mask..." />
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.cleaning_completed} onChange={(e) => setForm({ ...form, cleaning_completed: e.target.checked })} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  Cleaning Completed
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.notification_required} onChange={(e) => setForm({ ...form, notification_required: e.target.checked })} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  Notification Required
                </label>
              </div>
            </FormRow>
            {form.notification_required && (
              <FormRow>
                <FormInput label="Notified To" value={form.notified_to} onChange={(e) => setForm({ ...form, notified_to: e.target.value })} placeholder="e.g. Department of Health" />
                <FormInput label="Notification Date" type="date" value={form.notification_date} onChange={(e) => setForm({ ...form, notification_date: e.target.value })} />
              </FormRow>
            )}
            {isEditing && (
              <>
                <FormTextarea label="Outcome" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} rows={2} placeholder="Resolution outcome..." />
                <FormRow>
                  <FormInput label="Resolution Date" type="date" value={form.resolution_date} onChange={(e) => setForm({ ...form, resolution_date: e.target.value })} />
                  <div className="flex items-center gap-2 pt-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.follow_up_required} onChange={(e) => setForm({ ...form, follow_up_required: e.target.checked })} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      Follow-up Required
                    </label>
                  </div>
                </FormRow>
                {form.follow_up_required && (
                  <FormRow>
                    <FormInput label="Follow-up Date" type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
                    <FormInput label="Follow-up Notes" value={form.follow_up_notes} onChange={(e) => setForm({ ...form, follow_up_notes: e.target.value })} placeholder="What needs to be done..." />
                  </FormRow>
                )}
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setFormModalOpen(false)}>Cancel</ButtonSecondary>
          <ButtonPrimary onClick={handleSave} loading={saving}>{isEditing ? 'Update' : 'Create'}</ButtonPrimary>
        </ModalFooter>
      </Modal>

      {/* ─── View Modal ────────────────────────────────────────────────────────── */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Infection Event Details" size="lg">
        {selectedEntry && (
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs font-medium text-slate-500">Reference</span><p className="text-sm font-mono">{selectedEntry.reference_number || '--'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Date</span><p className="text-sm">{selectedEntry.event_date ? formatDate(selectedEntry.event_date) : '--'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Location</span><p className="text-sm">{selectedEntry.property_location}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Type</span><p className="text-sm"><Badge variant={TYPE_COLORS[selectedEntry.infection_type]}>{TYPE_LABELS[selectedEntry.infection_type]}</Badge></p></div>
                <div><span className="text-xs font-medium text-slate-500">Persons Affected</span><p className="text-sm">{AFFECTED_LABELS[selectedEntry.persons_affected]} ({selectedEntry.number_affected})</p></div>
                <div><span className="text-xs font-medium text-slate-500">Status</span><p className="text-sm"><Badge variant={STATUS_COLORS[selectedEntry.status]}>{capitalize(selectedEntry.status)}</Badge></p></div>
                <div><span className="text-xs font-medium text-slate-500">Reported By</span><p className="text-sm">{selectedEntry.reported_by}</p></div>
                <div><span className="text-xs font-medium text-slate-500">PPE Used</span><p className="text-sm">{selectedEntry.ppe_used || '--'}</p></div>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500">Description</span>
                <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{selectedEntry.description}</p>
              </div>
              {selectedEntry.actions_taken && (
                <div>
                  <span className="text-xs font-medium text-slate-500">Actions Taken</span>
                  <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{selectedEntry.actions_taken}</p>
                </div>
              )}
              {selectedEntry.outcome && (
                <div>
                  <span className="text-xs font-medium text-slate-500">Outcome</span>
                  <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{selectedEntry.outcome}</p>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs text-slate-500">Cleaning: {selectedEntry.cleaning_completed ? '✓ Completed' : '✗ Pending'}</span>
                {selectedEntry.notification_required && (
                  <span className="text-xs text-slate-500">Notified: {selectedEntry.notified_to || 'Yes'} {selectedEntry.notification_date ? `(${formatDate(selectedEntry.notification_date)})` : ''}</span>
                )}
              </div>
              {selectedEntry.follow_up_required && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs font-medium text-amber-800">Follow-up Required{selectedEntry.follow_up_date ? ` by ${formatDate(selectedEntry.follow_up_date)}` : ''}</p>
                  {selectedEntry.follow_up_notes && <p className="mt-1 text-xs text-amber-700">{selectedEntry.follow_up_notes}</p>}
                </div>
              )}
            </div>
          </ModalBody>
        )}
        <ModalFooter>
          {selectedEntry && selectedEntry.status === 'active' && (
            <ButtonPrimary onClick={() => handleStatusUpdate('monitoring')}>Mark Monitoring</ButtonPrimary>
          )}
          {selectedEntry && (selectedEntry.status === 'active' || selectedEntry.status === 'monitoring') && (
            <ButtonPrimary onClick={() => handleStatusUpdate('resolved')}>Resolve</ButtonPrimary>
          )}
          <ButtonSecondary onClick={() => setViewModalOpen(false)}>Close</ButtonSecondary>
        </ModalFooter>
      </Modal>

      {/* ─── Delete Confirm ────────────────────────────────────────────────────── */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Entry" size="sm">
        <ModalBody>
          <p className="text-sm text-slate-600">Are you sure you want to delete <strong>{deleteConfirm?.reference_number}</strong>? This cannot be undone.</p>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteConfirm(null)}>Cancel</ButtonSecondary>
          <ButtonDanger onClick={handleDelete} loading={deleting}>Delete</ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}
