import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchROCs,
  fetchROCStats,
  createROC,
  deleteROC,
  duplicateROC,
  fetchProperties,
  fetchParticipants,
} from '../lib/api';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from '../components/ui/Modal';
import { PageHeader, Badge, EmptyState, FormInput, FormSelect, FormTextarea, FormRow, StatCard } from '../components/ui/FormComponents';
import {
  HiOutlineClipboardDocumentList,
  HiOutlinePlus,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineUserGroup,
  HiOutlineTrash,
  HiOutlineDocumentDuplicate,
  HiOutlineFunnel,
  HiOutlineCheckCircle,
  HiOutlinePencilSquare,
  HiOutlineClock,
  HiOutlineRectangleStack,
} from 'react-icons/hi2';

const STATUS_BADGES = {
  draft: { variant: 'warning', label: 'Draft' },
  active: { variant: 'success', label: 'Active' },
  archived: { variant: 'default', label: 'Archived' },
};

export default function RosterOfCare() {
  const navigate = useNavigate();
  const [rocs, setRocs] = useState([]);
  const [stats, setStats] = useState({ total: 0, draft: 0, active: 0, archived: 0 });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [rocsData, statsData, propsData] = await Promise.all([
        fetchROCs(propertyFilter || undefined, statusFilter || undefined),
        fetchROCStats(),
        fetchProperties('active'),
      ]);
      setRocs(rocsData);
      setStats(statsData);
      setProperties(propsData.filter(p => (p.resident_count || 0) > 0));
    } catch (err) {
      console.error('Failed to load ROC data:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyFilter, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    const created = await createROC(data);
    setShowCreateModal(false);
    navigate(`/roster-of-care/${created.id}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this Roster of Care? This cannot be undone.')) return;
    try {
      await deleteROC(id);
      setRocs(prev => prev.filter(r => r.id !== id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDuplicate = async (id) => {
    setDuplicatingId(id);
    try {
      const created = await duplicateROC(id);
      navigate(`/roster-of-care/${created.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-56" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-full">
      <PageHeader
        title="Roster of Care"
        subtitle={`${stats.total} rosters · ${stats.active} active`}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Create ROC
          </button>
        }
      />

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={HiOutlineClipboardDocumentList}
          label="Total Rosters"
          value={stats.total}
          color="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
        />
        <StatCard
          icon={HiOutlineCheckCircle}
          label="Active"
          value={stats.active}
          color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          borderColor="border-l-green-500"
        />
        <StatCard
          icon={HiOutlinePencilSquare}
          label="Draft"
          value={stats.draft}
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
          borderColor="border-l-amber-500"
        />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] text-slate-700 dark:text-slate-200"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <HiOutlineBuildingOffice2 className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <HiOutlineFunnel className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ROC Cards */}
      <div className="mt-6">
        {rocs.length === 0 ? (
          <EmptyState
            icon={HiOutlineClipboardDocumentList}
            title="No Rosters of Care"
            description="Create your first ROC to start mapping participant support schedules"
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-sm font-medium text-accent-500 hover:text-accent-600"
              >
                Create one now
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {rocs.map((roc) => {
              const statusCfg = STATUS_BADGES[roc.status] || STATUS_BADGES.draft;
              return (
                <div
                  key={roc.id}
                  onClick={() => navigate(`/roster-of-care/${roc.id}`)}
                  className="group rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5 cursor-pointer transition-all hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{roc.roc_number}</p>
                      <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {roc.name}
                      </h3>
                    </div>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-2.5">
                    {roc.property && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{roc.property.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <HiOutlineCalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{fmtDate(roc.effective_from)}{roc.effective_to ? ` — ${fmtDate(roc.effective_to)}` : ' — Ongoing'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <HiOutlineUserGroup className="w-3.5 h-3.5" />
                        <span>{roc.participant_count || 0} participants</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        <span>{roc.time_block_count || 0} blocks</span>
                      </div>
                    </div>
                    {roc.version > 1 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <HiOutlineRectangleStack className="w-3.5 h-3.5" />
                        <span>Version {roc.version}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e2d4a] flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicate(roc.id); }}
                      disabled={duplicatingId === roc.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                    >
                      <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
                      {duplicatingId === roc.id ? 'Duplicating...' : 'Duplicate'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(roc.id); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateROCModal
          properties={properties}
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// ─── Create ROC Modal ────────────────────────────────────────────────────────

function CreateROCModal({ properties, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    property_id: '',
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.property_id) { setError('Property is required'); return; }
    if (!form.effective_from) { setError('Effective from date is required'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        effective_to: form.effective_to || null,
        notes: form.notes || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Modal isOpen onClose={onClose} title="Create Roster of Care" icon={HiOutlineClipboardDocumentList} size="md">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <ModalError message={error} />

            <FormInput
              label="Roster Name"
              required
              value={form.name}
              onChange={updateField('name')}
              placeholder="e.g., Week Commencing 14 Apr 2026"
            />

            <FormSelect
              label="Property"
              required
              value={form.property_id}
              onChange={updateField('property_id')}
            >
              <option value="">Select property...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </FormSelect>

            <FormRow>
              <FormInput
                label="Effective From"
                type="date"
                required
                value={form.effective_from}
                onChange={updateField('effective_from')}
              />
              <FormInput
                label="Effective To"
                type="date"
                value={form.effective_to}
                onChange={updateField('effective_to')}
                hint="Leave blank for ongoing"
              />
            </FormRow>

            <FormTextarea
              label="Notes"
              rows={3}
              value={form.notes}
              onChange={updateField('notes')}
              placeholder="Optional notes about this roster..."
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" loading={saving}>Create ROC</ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
