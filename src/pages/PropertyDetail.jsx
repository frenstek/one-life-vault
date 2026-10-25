import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft,
  HiPencilSquare,
  HiTrash,
  HiPlus,
  HiUsers,
  HiWrenchScrewdriver,
  HiClipboardDocumentCheck,
  HiExclamationTriangle,
  HiPhone,
  HiUser,
  HiCalendar,
  HiChevronDown,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiMapPin,
  HiCurrencyDollar,
  HiHome,
  HiShieldCheck,
} from 'react-icons/hi2';
import {
  fetchProperty,
  updatePropertyRecord,
  deletePropertyRecord,
} from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AddResidentModal from '../components/AddResidentModal';
import AddMaintenanceModal from '../components/AddMaintenanceModal';
import AddInspectionModal from '../components/AddInspectionModal';
import PropertyProfileTab from '../components/PropertyProfileTab';
import RiskAssessmentTab from '../components/RiskAssessmentTab';
import EditPropertyModal from '../components/EditPropertyModal';
import { toLocalDate } from '../lib/dates';

const formatDateShort = (d) => {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  // Compare calendar days in local time; due today is not overdue yet
  return String(dateStr).slice(0, 10) < toLocalDate();
};

export default function PropertyDetail() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [addResidentOpen, setAddResidentOpen] = useState(false);
  const [addMaintenanceOpen, setAddMaintenanceOpen] = useState(false);
  const [addInspectionOpen, setAddInspectionOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeparted, setShowDeparted] = useState(false);
  const [editingMaint, setEditingMaint] = useState(null);
  const [updatingMaint, setUpdatingMaint] = useState(null);

  function loadProperty() {
    setLoading(true);
    setError(null);
    fetchProperty(propertyId)
      .then((data) => setProperty(data.property || data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  async function handleDeleteProperty() {
    setDeleting(true);
    try {
      await deletePropertyRecord('properties', propertyId);
      navigate('/properties', { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  async function handleRemoveResident(residentId) {
    if (!confirm('Remove this resident from the property?')) return;
    try {
      await updatePropertyRecord('property_residents', residentId, { status: 'departed', move_out_date: toLocalDate() });
      loadProperty();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleUpdateMaintStatus(maintId, newStatus, cost) {
    setUpdatingMaint(maintId);
    try {
      const updates = { status: newStatus };
      if (newStatus === 'completed' && cost) updates.cost = Number(cost);
      if (newStatus === 'completed') updates.completed_date = toLocalDate();
      await updatePropertyRecord('property_maintenance', maintId, updates);
      setEditingMaint(null);
      loadProperty();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingMaint(null);
    }
  }

  async function handleDeleteMaintenance(maintId) {
    if (!confirm('Delete this maintenance request?')) return;
    try {
      await deletePropertyRecord('property_maintenance', maintId);
      loadProperty();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <LoadingSpinner message="Loading property..." />;
  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/properties')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <HiArrowLeft className="h-4 w-4" /> Back to Properties
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  if (!property) return null;

  const p = property;
  const residents = p.residents || [];
  const maintenance = p.maintenance || [];
  const inspections = p.inspections || [];
  const riskAssessments = p.risk_assessments || [];

  const currentResidents = residents.filter((r) => r.status === 'active' || !r.status);
  const departedResidents = residents.filter((r) => r.status === 'departed');

  // Sort maintenance by priority weight then date
  const priorityWeight = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sortedMaint = [...maintenance].sort((a, b) => {
    const pa = priorityWeight[a.priority] ?? 4;
    const pb = priorityWeight[b.priority] ?? 4;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const sortedInspections = [...inspections].sort(
    (a, b) => new Date(b.inspection_date || 0) - new Date(a.inspection_date || 0)
  );

  const typeColors = {
    SIL: 'bg-green-50 text-[#0ea03e]',
    SDA: 'bg-blue-50 text-[#309edd]',
    'SIL/SDA': 'bg-purple-50 text-purple-600',
  };

  const statusColors = {
    active: 'bg-green-50 text-[#0ea03e]',
    inactive: 'bg-slate-100 text-slate-500',
    maintenance: 'bg-amber-50 text-amber-600',
  };

  const photos = p.photos || [];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: HiHome, count: photos.length },
    { id: 'residents', label: 'Residents', icon: HiUsers, count: currentResidents.length },
    { id: 'maintenance', label: 'Maintenance', icon: HiWrenchScrewdriver, count: maintenance.filter((m) => m.status !== 'completed' && m.status !== 'cancelled').length },
    { id: 'inspections', label: 'Inspections', icon: HiClipboardDocumentCheck, count: inspections.length },
    { id: 'risk-assessment', label: 'Risk Assessment', icon: HiShieldCheck, count: riskAssessments.length },
  ];

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/properties')}
        className="flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <HiArrowLeft className="h-4 w-4" /> Back to Properties
      </button>

      {/* Property Header */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{p.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[p.property_type] || 'bg-slate-100 text-slate-500'}`}>
                {p.property_type || 'SIL'}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[p.status] || statusColors.active}`}>
                {p.status || 'active'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
              <HiMapPin className="h-4 w-4 flex-shrink-0" />
              <span>
                {p.address}
                {p.suburb ? `, ${p.suburb}` : ''}
                {p.state ? ` ${p.state}` : ''}
                {p.postcode ? ` ${p.postcode}` : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <HiPencilSquare className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <HiTrash className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>

        {/* Manager info */}
        {(p.property_manager || p.contact_phone) && (
          <div className="mt-5 flex flex-wrap items-center gap-5 rounded-lg bg-slate-50 dark:bg-[#1e2d4a] px-5 py-4">
            {p.property_manager && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <HiUser className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{p.property_manager}</span>
              </div>
            )}
            {p.contact_phone && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <HiPhone className="h-4 w-4 text-slate-400" />
                <span>{p.contact_phone}</span>
              </div>
            )}
            {p.capacity && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <HiUsers className="h-4 w-4 text-slate-400" />
                <span>{currentResidents.length}/{p.capacity} beds occupied</span>
              </div>
            )}
          </div>
        )}

        {p.notes && (
          <div className="mt-4 rounded-lg bg-slate-50 dark:bg-[#1e2d4a] px-5 py-4">
            <p className="text-xs font-medium text-slate-500">Notes</p>
            <p className="mt-1 text-sm text-slate-700">{p.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-[#263554]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-[#0ea03e] text-[#0ea03e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${isActive ? 'bg-green-50 text-[#0ea03e]' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <PropertyProfileTab property={p} onRefresh={loadProperty} />
      )}

      {activeTab === 'residents' && (
        <ResidentsSection
          currentResidents={currentResidents}
          departedResidents={departedResidents}
          showDeparted={showDeparted}
          setShowDeparted={setShowDeparted}
          onAddResident={() => setAddResidentOpen(true)}
          onRemoveResident={handleRemoveResident}
        />
      )}

      {activeTab === 'maintenance' && (
        <MaintenanceSection
          maintenance={sortedMaint}
          editingMaint={editingMaint}
          setEditingMaint={setEditingMaint}
          updatingMaint={updatingMaint}
          onUpdateStatus={handleUpdateMaintStatus}
          onDelete={handleDeleteMaintenance}
          onAddMaintenance={() => setAddMaintenanceOpen(true)}
        />
      )}

      {activeTab === 'inspections' && (
        <InspectionsSection
          inspections={sortedInspections}
          onAddInspection={() => setAddInspectionOpen(true)}
        />
      )}

      {activeTab === 'risk-assessment' && (
        <RiskAssessmentTab property={p} onRefresh={loadProperty} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(false); }}
        >
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-[#162036] p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <HiExclamationTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Delete Property</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete <strong>{p.name}</strong>?
              All residents, maintenance records, and inspections will also be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProperty}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </>
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

      {/* Modals */}
      <AddResidentModal
        isOpen={addResidentOpen}
        onClose={() => setAddResidentOpen(false)}
        propertyId={propertyId}
        onCreated={() => {
          setAddResidentOpen(false);
          loadProperty();
        }}
      />
      <AddMaintenanceModal
        isOpen={addMaintenanceOpen}
        onClose={() => setAddMaintenanceOpen(false)}
        propertyId={propertyId}
        onCreated={() => {
          setAddMaintenanceOpen(false);
          loadProperty();
        }}
      />
      <AddInspectionModal
        isOpen={addInspectionOpen}
        onClose={() => setAddInspectionOpen(false)}
        propertyId={propertyId}
        onCreated={() => {
          setAddInspectionOpen(false);
          loadProperty();
        }}
      />
      <EditPropertyModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        property={p}
        onUpdated={() => {
          setEditOpen(false);
          loadProperty();
        }}
      />
    </div>
  );
}

/* ─── Residents Section ──────────────────────────────────────────────── */

function ResidentsSection({ currentResidents, departedResidents, showDeparted, setShowDeparted, onAddResident, onRemoveResident }) {
  const supportColors = {
    Low: 'bg-green-50 text-[#0ea03e]',
    Medium: 'bg-blue-50 text-[#309edd]',
    High: 'bg-amber-50 text-amber-600',
    Complex: 'bg-red-50 text-red-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Current Residents ({currentResidents.length})
        </h2>
        <button
          onClick={onAddResident}
          className="flex items-center gap-1.5 rounded-lg bg-[#0ea03e] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b8532]"
        >
          <HiPlus className="h-4 w-4" /> Add Resident
        </button>
      </div>

      {currentResidents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <HiUsers className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">No current residents</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">Name</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">NDIS Number</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">Room</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">Move-in</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">Support Level</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-4 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentResidents.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-medium text-slate-900">{r.participant_name}</td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">{r.ndis_number || '--'}</td>
                    <td className="px-5 py-4 text-slate-600">{r.room_number || '--'}</td>
                    <td className="px-5 py-4 text-slate-500">{formatDateShort(r.move_in_date)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${supportColors[r.support_level] || 'bg-slate-100 text-slate-500'}`}>
                        {r.support_level || 'Medium'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-[#0ea03e]">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onRemoveResident(r.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departed Residents */}
      {departedResidents.length > 0 && (
        <div>
          <button
            onClick={() => setShowDeparted(!showDeparted)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <HiChevronDown className={`h-4 w-4 transition-transform ${showDeparted ? 'rotate-180' : ''}`} />
            Departed Residents ({departedResidents.length})
          </button>
          {showDeparted && (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white/80">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-4 text-left font-semibold text-slate-500">Name</th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-500">NDIS Number</th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-500">Room</th>
                      <th className="px-5 py-4 text-left font-semibold text-slate-500">Move-out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departedResidents.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0 text-slate-400">
                        <td className="px-5 py-4">{r.participant_name}</td>
                        <td className="px-5 py-4 font-mono text-xs">{r.ndis_number || '--'}</td>
                        <td className="px-5 py-4">{r.room_number || '--'}</td>
                        <td className="px-5 py-4">{formatDateShort(r.move_out_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Maintenance Section ────────────────────────────────────────────── */

function MaintenanceSection({ maintenance, editingMaint, setEditingMaint, updatingMaint, onUpdateStatus, onDelete, onAddMaintenance }) {
  const priorityColors = {
    urgent: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
    low: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500', badge: 'bg-slate-100 text-slate-600' },
  };

  const statusBadges = {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-[#0ea03e]',
    cancelled: 'bg-slate-100 text-slate-500',
  };

  const statusLabels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Maintenance Requests</h2>
        <button
          onClick={onAddMaintenance}
          className="flex items-center gap-1.5 rounded-lg bg-[#0ea03e] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b8532]"
        >
          <HiPlus className="h-4 w-4" /> New Request
        </button>
      </div>

      {maintenance.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <HiWrenchScrewdriver className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">No maintenance requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {maintenance.map((m) => {
            const pc = priorityColors[m.priority] || priorityColors.medium;
            const isEditing = editingMaint === m.id;
            const isUpdating = updatingMaint === m.id;

            return (
              <div
                key={m.id}
                className={`rounded-xl border ${pc.border} ${pc.bg} p-6 transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{m.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${pc.badge}`}>
                        {m.priority}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadges[m.status] || statusBadges.pending}`}>
                        {statusLabels[m.status] || m.status}
                      </span>
                    </div>
                    {m.description && (
                      <p className="mt-1.5 text-sm text-slate-600">{m.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {m.reported_by && (
                        <span className="flex items-center gap-1">
                          <HiUser className="h-3 w-3" /> {m.reported_by}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <HiCalendar className="h-3 w-3" /> {formatDateShort(m.created_at)}
                      </span>
                      {m.cost && (
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <HiCurrencyDollar className="h-3 w-3" /> ${Number(m.cost).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {m.status !== 'completed' && m.status !== 'cancelled' && (
                      <button
                        onClick={() => setEditingMaint(isEditing ? null : m.id)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Update
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(m.id)}
                      className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      <HiTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick update panel */}
                {isEditing && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-white/80 dark:bg-[#0c1425]/50 p-4 border border-slate-200 dark:border-[#263554]">
                    <span className="text-xs font-medium text-slate-600 mr-1">Set status:</span>
                    {['in_progress', 'completed', 'cancelled'].map((s) => (
                      <button
                        key={s}
                        disabled={isUpdating}
                        onClick={() => {
                          if (s === 'completed') {
                            const cost = prompt('Enter cost (optional):');
                            onUpdateStatus(m.id, s, cost);
                          } else {
                            onUpdateStatus(m.id, s);
                          }
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${statusBadges[s]} hover:opacity-80`}
                      >
                        {isUpdating ? '...' : statusLabels[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Inspections Section ────────────────────────────────────────────── */

function InspectionsSection({ inspections, onAddInspection }) {
  const resultConfig = {
    pass: { badge: 'bg-green-100 text-[#0ea03e]', icon: HiCheckCircle, iconColor: 'text-[#0ea03e]' },
    fail: { badge: 'bg-red-100 text-red-600', icon: HiXCircle, iconColor: 'text-red-500' },
    needs_attention: { badge: 'bg-amber-100 text-amber-700', icon: HiExclamationTriangle, iconColor: 'text-amber-500' },
  };

  const resultLabels = {
    pass: 'Pass',
    fail: 'Fail',
    needs_attention: 'Needs Attention',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Inspections</h2>
        <button
          onClick={onAddInspection}
          className="flex items-center gap-1.5 rounded-lg bg-[#0ea03e] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b8532]"
        >
          <HiPlus className="h-4 w-4" /> Record Inspection
        </button>
      </div>

      {inspections.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <HiClipboardDocumentCheck className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">No inspections recorded</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((insp) => {
            const rc = resultConfig[insp.result] || resultConfig.pass;
            const ResultIcon = rc.icon;
            const overdue = insp.next_due_date && isOverdue(insp.next_due_date);

            return (
              <div
                key={insp.id}
                className={`rounded-xl border bg-white dark:bg-[#162036] p-6 transition-all ${
                  overdue ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${rc.badge.split(' ')[0]}`}>
                      <ResultIcon className={`h-5 w-5 ${rc.iconColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{insp.inspection_type}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rc.badge}`}>
                          {resultLabels[insp.result] || insp.result}
                        </span>
                        {overdue && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <HiCalendar className="h-3 w-3" /> {formatDateShort(insp.inspection_date)}
                        </span>
                        {insp.inspector && (
                          <span className="flex items-center gap-1">
                            <HiUser className="h-3 w-3" /> {insp.inspector}
                          </span>
                        )}
                        {insp.next_due_date && (
                          <span className={`flex items-center gap-1 font-medium ${overdue ? 'text-red-500' : 'text-slate-500'}`}>
                            <HiClock className="h-3 w-3" /> Next due: {formatDateShort(insp.next_due_date)}
                          </span>
                        )}
                      </div>
                      {insp.notes && (
                        <p className="mt-2 text-sm text-slate-600">{insp.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
