import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiExclamationTriangle,
  HiClock,
  HiShieldExclamation,
  HiPencilSquare,
  HiEye,
  HiTrash,
  HiArrowDownTray,
} from 'react-icons/hi2';
import {
  fetchIncidents,
  fetchIncidentStats,
  createIncident,
  updateIncident,
  deleteIncident,
  fetchParticipants,
  fetchProperties,
} from '../lib/api';
import { downloadIncidentPDF } from '../components/IncidentReportPDF';
import { exportRegisterPdf } from '../lib/registerPdfExport';
import { toLocalDate } from '../lib/dates';
import {
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
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
  ModalError,
} from '../components/ui/Modal';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';

const STATUS_FILTERS = ['All', 'Open', 'Investigating', 'Resolved', 'Closed'];
const SEVERITY_FILTERS = ['All', 'Low', 'Medium', 'High', 'Critical'];

const CATEGORY_LABELS = {
  injury: 'Injury',
  medication: 'Medication Error',
  behaviour: 'Behaviour of Concern',
  property_damage: 'Property Damage',
  abuse_neglect: 'Abuse/Neglect',
  missing_person: 'Missing Person',
  fall: 'Fall',
  aggression: 'Aggression',
  other: 'Other',
};

const SEVERITY_BADGE = {
  low: 'default',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

const STATUS_BADGE = {
  open: 'info',
  investigating: 'purple',
  resolved: 'success',
  closed: 'default',
};

// Function so the default date is computed when the form opens, not at module load.
const INITIAL_FORM = () => ({
  title: '',
  severity: 'medium',
  category: 'injury',
  incident_date: toLocalDate(),
  incident_time: '',
  location: '',
  participant_id: '',
  property_id: '',
  description: '',
  immediate_actions: '',
  witnesses: '',
  follow_up_required: false,
  follow_up_actions: '',
  follow_up_date: '',
  reported_by: '',
});

function formatDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form
  const [form, setForm] = useState(INITIAL_FORM);  // lazy initializer
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // View/Edit modal state
  const [editStatus, setEditStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvedBy, setResolvedBy] = useState('');
  const [viewError, setViewError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Success toast
  const [successMsg, setSuccessMsg] = useState(null);

  function loadData() {
    setLoading(true);
    setError(null);
    const status = statusFilter === 'All' ? undefined : statusFilter.toLowerCase();
    const severity = severityFilter === 'All' ? undefined : severityFilter.toLowerCase();
    Promise.all([
      fetchIncidents(status, severity),
      fetchIncidentStats(),
      fetchParticipants(),
      fetchProperties('active'),
    ])
      .then(([incidentData, statsData, participantData, propertyData]) => {
        setIncidents(Array.isArray(incidentData) ? incidentData : incidentData.incidents || []);
        setStats(statsData);
        setParticipants(Array.isArray(participantData) ? participantData : participantData.participants || []);
        setProperties(Array.isArray(propertyData) ? propertyData : propertyData.properties || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [statusFilter, severityFilter]);

  // Client-side search filtering
  const filtered = incidents.filter((inc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (inc.title || '').toLowerCase().includes(q) ||
      (inc.incident_number || '').toLowerCase().includes(q) ||
      (inc.participant_name || '').toLowerCase().includes(q) ||
      (inc.reported_by || '').toLowerCase().includes(q) ||
      (CATEGORY_LABELS[inc.category] || '').toLowerCase().includes(q)
    );
  });

  // Stats calculations
  const totalIncidents = stats?.total || incidents.length;
  const openCount = stats?.open || incidents.filter((i) => i.status === 'open').length;
  const investigatingCount = stats?.investigating || incidents.filter((i) => i.status === 'investigating').length;
  const criticalHighCount =
    stats?.critical_high ||
    incidents.filter(
      (i) =>
        (i.severity === 'critical' || i.severity === 'high') &&
        (i.status === 'open' || i.status === 'investigating')
    ).length;

  // ─── Report Incident ──────────────────────────────────────────────────

  function openReportModal(incident = null) {
    if (incident) {
      setForm({
        title: incident.title || '',
        severity: incident.severity || 'medium',
        category: incident.category || 'injury',
        incident_date: incident.incident_date || '',
        incident_time: incident.incident_time || '',
        location: incident.location || '',
        participant_id: incident.participant_id || '',
        property_id: incident.property_id || '',
        description: incident.description || '',
        immediate_actions: incident.immediate_actions || '',
        witnesses: incident.witnesses || '',
        follow_up_required: incident.follow_up_required || false,
        follow_up_actions: incident.follow_up_actions || '',
        follow_up_date: incident.follow_up_date || '',
        reported_by: incident.reported_by || '',
      });
      setIsEditing(true);
      setSelectedIncident(incident);
    } else {
      setForm(INITIAL_FORM());
      setIsEditing(false);
      setSelectedIncident(null);
    }
    setFormError(null);
    setReportModalOpen(true);
  }

  function closeReportModal() {
    setReportModalOpen(false);
    setForm(INITIAL_FORM());
    setFormError(null);
    setIsEditing(false);
    setSelectedIncident(null);
  }

  async function handleSubmitReport(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.incident_date) return setFormError('Incident date is required.');
    if (!form.description.trim()) return setFormError('Description is required.');
    if (!form.reported_by.trim()) return setFormError('Reported By is required.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        participant_id: form.participant_id || null,
        property_id: form.property_id || null,
        follow_up_date: form.follow_up_required ? form.follow_up_date || null : null,
        follow_up_actions: form.follow_up_required ? form.follow_up_actions : '',
      };

      if (isEditing && selectedIncident) {
        await updateIncident(selectedIncident.id, payload);
        setSuccessMsg('Incident updated successfully');
      } else {
        await createIncident(payload);
        setSuccessMsg('Incident reported successfully');
      }
      closeReportModal();
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── View / Edit Incident ─────────────────────────────────────────────

  function openViewModal(incident) {
    setSelectedIncident(incident);
    setEditStatus(incident.status || 'open');
    setResolutionNotes(incident.resolution_notes || '');
    setResolvedBy(incident.resolved_by || '');
    setViewError(null);
    setViewModalOpen(true);
  }

  function closeViewModal() {
    setViewModalOpen(false);
    setSelectedIncident(null);
    setViewError(null);
  }

  async function handleUpdateStatus() {
    if (!selectedIncident) return;
    setViewError(null);
    setUpdating(true);
    try {
      const payload = {
        status: editStatus,
        resolution_notes: resolutionNotes,
      };
      if (editStatus === 'resolved' || editStatus === 'closed') {
        payload.resolved_by = resolvedBy;
        payload.resolved_at = new Date().toISOString();
      }
      await updateIncident(selectedIncident.id, payload);
      setSuccessMsg(`Status updated to "${editStatus}"`);
      closeViewModal();
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setViewError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteIncident(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  function getParticipantName(id) {
    if (!id) return '--';
    const p = participants.find((p) => p.id === id);
    if (!p) return '--';
    return `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || '--';
  }

  function getPropertyName(id) {
    if (!id) return '--';
    const p = properties.find((p) => p.id === id);
    return p?.name || p?.address || '--';
  }

  return (
    <div className="space-y-8">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-20 right-6 z-[60] flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-[slideIn_0.3s_ease-out]">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
          {successMsg}
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Incident Register"
        subtitle="NDIS incident reporting and tracking"
        actions={
          <>
            <button
              onClick={() => exportRegisterPdf({
                title: 'Incident Register',
                columns: ['#', 'Date', 'Title', 'Description', 'Severity', 'Category', 'Immediate Actions', 'Follow-up Actions', 'Status'],
                rows: filtered.map((inc) => [
                  inc.incident_number || '',
                  inc.incident_date ? new Date(inc.incident_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
                  inc.title || '',
                  inc.description || '',
                  (inc.severity || '').charAt(0).toUpperCase() + (inc.severity || '').slice(1),
                  CATEGORY_LABELS[inc.category] || inc.category || '',
                  inc.immediate_actions || '',
                  inc.follow_up_actions || '',
                  (inc.status || '').charAt(0).toUpperCase() + (inc.status || '').slice(1),
                ]),
                orientation: 'landscape',
                filename: 'OLF-Incident-Register.pdf',
              })}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <HiArrowDownTray className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => openReportModal()}
              className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
            >
              <HiPlus className="h-4 w-4" />
              Report Incident
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
              icon={HiExclamationTriangle}
              label="Total Incidents"
              value={totalIncidents}
              color="bg-blue-50 dark:bg-blue-900/30 text-brand-500"
            />
            <StatCard
              icon={HiClock}
              label="Open"
              value={openCount}
              color="bg-amber-50 dark:bg-amber-900/30 text-amber-500"
            />
            <StatCard
              icon={HiMagnifyingGlass}
              label="Investigating"
              value={investigatingCount}
              color="bg-purple-50 dark:bg-purple-900/30 text-purple-500"
            />
            <StatCard
              icon={HiShieldExclamation}
              label="Critical / High"
              value={criticalHighCount}
              color={
                criticalHighCount > 0
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
              placeholder="Search incidents..."
              className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Severity pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Severity:</span>
          {SEVERITY_FILTERS.map((opt) => (
            <button
              key={opt}
              onClick={() => setSeverityFilter(opt)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                severityFilter === opt
                  ? 'bg-accent-500 text-white'
                  : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table */}
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
          icon={HiExclamationTriangle}
          title={search || statusFilter !== 'All' || severityFilter !== 'All' ? 'No incidents match your filters.' : 'No incidents recorded yet.'}
          description="Use the Report Incident button to log a new incident."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#263554]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Incident #
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Date
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Title
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Severity
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Category
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Participant
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inc) => (
                  <tr
                    key={inc.id}
                    className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200">
                        {inc.incident_number || `INC-${String(inc.id).slice(0, 6).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(inc.incident_date)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {inc.title}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={SEVERITY_BADGE[inc.severity] || 'default'}
                        className={inc.severity === 'critical' ? 'font-bold' : ''}
                      >
                        {(inc.severity || 'low').charAt(0).toUpperCase() + (inc.severity || 'low').slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="default">
                        {CATEGORY_LABELS[inc.category] || inc.category || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {inc.participant_id ? (
                        <Link
                          to={`/participants/${inc.participant_id}`}
                          className="text-sm font-medium text-brand-500 hover:text-brand-400 hover:underline transition-colors"
                        >
                          {inc.participant_name || getParticipantName(inc.participant_id)}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-500">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_BADGE[inc.status] || 'default'}>
                        {(inc.status || 'open').charAt(0).toUpperCase() + (inc.status || 'open').slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(inc)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500"
                          title="View"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadIncidentPDF(inc, inc.participant_name || getParticipantName(inc.participant_id), getPropertyName(inc.property_id))}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600"
                          title="Download PDF Report"
                        >
                          <HiArrowDownTray className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openReportModal(inc)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(inc)}
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

      {/* ─── Report / Edit Incident Modal ──────────────────────────────────── */}
      <Modal
        isOpen={reportModalOpen}
        onClose={closeReportModal}
        title={isEditing ? 'Edit Incident' : 'Report Incident'}
        icon={HiExclamationTriangle}
        iconColor="text-red-500"
        size="xl"
      >
        <form onSubmit={handleSubmitReport}>
          <ModalBody>
            <div className="space-y-6">
              <ModalError message={formError} />

              <FormRow>
                <FormInput
                  label="Title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Brief description of the incident"
                />
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
                <FormInput
                  label="Date"
                  required
                  type="date"
                  value={form.incident_date}
                  onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                />
              </FormRow>

              <FormRow>
                <FormInput
                  label="Time"
                  type="time"
                  value={form.incident_time}
                  onChange={(e) => setForm({ ...form, incident_time: e.target.value })}
                />
                <FormInput
                  label="Location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Where did the incident occur?"
                />
              </FormRow>

              <FormRow>
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

              <FormTextarea
                label="Description"
                required
                rows={6}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Provide a detailed account of what happened..."
              />

              <FormTextarea
                label="Immediate Actions Taken"
                rows={3}
                value={form.immediate_actions}
                onChange={(e) => setForm({ ...form, immediate_actions: e.target.value })}
                placeholder="What actions were taken immediately after the incident?"
              />

              <FormInput
                label="Witnesses"
                value={form.witnesses}
                onChange={(e) => setForm({ ...form, witnesses: e.target.value })}
                placeholder="Names of any witnesses"
              />

              <FormDivider />

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
                  <FormTextarea
                    label="Follow-up Actions"
                    rows={3}
                    value={form.follow_up_actions}
                    onChange={(e) => setForm({ ...form, follow_up_actions: e.target.value })}
                    placeholder="What follow-up actions are needed?"
                  />
                  <FormInput
                    label="Follow-up Date"
                    type="date"
                    value={form.follow_up_date}
                    onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                  />
                </div>
              )}

              <FormInput
                label="Reported By"
                required
                value={form.reported_by}
                onChange={(e) => setForm({ ...form, reported_by: e.target.value })}
                placeholder="Name of person reporting"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={closeReportModal} disabled={saving}>
              Cancel
            </ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Incident' : 'Submit Report'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── View / Edit Incident Modal ────────────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={selectedIncident ? `Incident: ${selectedIncident.incident_number || selectedIncident.title}` : 'Incident Details'}
        icon={HiEye}
        iconColor="text-brand-500"
        size="xl"
      >
        {selectedIncident && (
          <>
            <ModalBody>
              <div className="space-y-6">
                <ModalError message={viewError} />

                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailRow label="Title" value={selectedIncident.title} />
                  <DetailRow
                    label="Incident #"
                    value={selectedIncident.incident_number || `INC-${String(selectedIncident.id).slice(0, 6).toUpperCase()}`}
                  />
                  <DetailRow label="Date" value={formatDate(selectedIncident.incident_date)} />
                  <DetailRow label="Time" value={selectedIncident.incident_time || '--'} />
                  <DetailRow label="Location" value={selectedIncident.location || '--'} />
                  <DetailRow label="Reported By" value={selectedIncident.reported_by || '--'} />
                  <DetailRow label="Participant">
                    {selectedIncident.participant_id ? (
                      <Link
                        to={`/participants/${selectedIncident.participant_id}`}
                        className="text-sm font-medium text-brand-500 hover:underline"
                      >
                        {selectedIncident.participant_name || getParticipantName(selectedIncident.participant_id)}
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-400">--</span>
                    )}
                  </DetailRow>
                  <DetailRow label="Property" value={getPropertyName(selectedIncident.property_id)} />
                </div>

                {/* Badges */}
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Severity:</span>
                    <Badge
                      variant={SEVERITY_BADGE[selectedIncident.severity] || 'default'}
                      className={selectedIncident.severity === 'critical' ? 'font-bold' : ''}
                    >
                      {(selectedIncident.severity || 'low').charAt(0).toUpperCase() + (selectedIncident.severity || 'low').slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Category:</span>
                    <Badge variant="default">
                      {CATEGORY_LABELS[selectedIncident.category] || selectedIncident.category || '--'}
                    </Badge>
                  </div>
                </div>

                <FormDivider />

                {/* Description */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedIncident.description || '--'}
                  </p>
                </div>

                {selectedIncident.immediate_actions && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Immediate Actions Taken
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedIncident.immediate_actions}
                    </p>
                  </div>
                )}

                {selectedIncident.witnesses && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Witnesses</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {selectedIncident.witnesses}
                    </p>
                  </div>
                )}

                {selectedIncident.follow_up_required && (
                  <>
                    <FormDivider />
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                        Follow-up Details
                      </h4>
                      {selectedIncident.follow_up_actions && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-2">
                          {selectedIncident.follow_up_actions}
                        </p>
                      )}
                      {selectedIncident.follow_up_date && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Follow-up Date: {formatDate(selectedIncident.follow_up_date)}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Resolution info if resolved/closed */}
                {(selectedIncident.status === 'resolved' || selectedIncident.status === 'closed') && (
                  <>
                    <FormDivider />
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 p-4">
                      <h4 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">
                        Resolution
                      </h4>
                      {selectedIncident.resolution_notes && (
                        <p className="text-sm text-green-700 dark:text-green-400 whitespace-pre-wrap mb-2">
                          {selectedIncident.resolution_notes}
                        </p>
                      )}
                      <div className="flex gap-6 text-xs text-green-600 dark:text-green-500">
                        {selectedIncident.resolved_by && (
                          <span>Resolved by: {selectedIncident.resolved_by}</span>
                        )}
                        {selectedIncident.resolved_at && (
                          <span>Resolved: {formatDateTime(selectedIncident.resolved_at)}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <FormDivider />

                {/* Update Status */}
                <FormSection title="Update Status">
                  <FormRow>
                    <FormSelect
                      label="Status"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </FormSelect>
                    {(editStatus === 'resolved' || editStatus === 'closed') && (
                      <FormInput
                        label="Resolved By"
                        value={resolvedBy}
                        onChange={(e) => setResolvedBy(e.target.value)}
                        placeholder="Name of person resolving"
                      />
                    )}
                  </FormRow>
                  <FormTextarea
                    label="Resolution Notes"
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add notes about the investigation or resolution..."
                  />
                </FormSection>
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary onClick={closeViewModal} disabled={updating}>
                Close
              </ButtonSecondary>
              <button
                onClick={() => downloadIncidentPDF(selectedIncident, selectedIncident.participant_name || getParticipantName(selectedIncident.participant_id), getPropertyName(selectedIncident.property_id))}
                className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-2.5 text-sm font-semibold text-green-700 dark:text-green-400 transition-colors hover:bg-green-100 dark:hover:bg-green-900/30"
              >
                <HiArrowDownTray className="h-4 w-4" />
                Download PDF
              </button>
              <ButtonPrimary onClick={handleUpdateStatus} loading={updating}>
                {updating ? 'Updating...' : 'Update Status'}
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
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Incident</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete the incident{' '}
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
