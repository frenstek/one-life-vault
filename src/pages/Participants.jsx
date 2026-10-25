import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  HiPlus, HiMagnifyingGlass, HiUserGroup, HiPhone, HiEnvelope,
  HiCheckCircle, HiXCircle, HiArrowRightOnRectangle, HiChevronDown,
} from 'react-icons/hi2';
import { fetchParticipants, deleteParticipant, updateParticipant } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonGrid } from '../components/ui/Skeleton';
import ParticipantModal from '../components/ParticipantModal';

const STATUS_FILTERS = ['All', 'active', 'inactive', 'exited'];

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-50 dark:bg-green-900/20 text-accent-500', icon: HiCheckCircle },
  inactive: { label: 'Inactive', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', icon: HiXCircle },
  exited: { label: 'Exited', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400', icon: HiArrowRightOnRectangle },
};

export default function Participants() {
  const { isAdmin, isManager } = useAuth();
  const isAdminOrManager = isAdmin || isManager;
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(isAdminOrManager ? 'All' : 'active');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    const status = filter === 'All' ? undefined : filter;
    fetchParticipants(status, search || undefined)
      .then(data => setParticipants(Array.isArray(data) ? data : []))
      .catch(() => setParticipants([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]);

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteParticipant(id);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await updateParticipant(id, { status: newStatus });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  const activeCount = participants.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Participants</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {participants.length} total — {activeCount} active
          </p>
        </div>
        {isAdminOrManager && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
          >
            <HiPlus className="h-4 w-4" />
            Add Participant
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or NDIS number..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </form>
        {isAdminOrManager && (
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  filter === s
                    ? 'bg-accent-500 text-white'
                    : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                }`}
              >
                {s === 'All' ? 'All' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Delete <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong> and all their notes and files? This cannot be undone.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleDelete(deleteConfirm.id)}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="rounded-lg border border-slate-300 dark:border-[#334766] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Participant Cards */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : participants.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <HiUserGroup className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {search || filter !== 'All' ? 'No participants match your filters' : 'No participants yet'}
          </p>
          {isAdminOrManager && (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-500 hover:text-accent-600"
            >
              <HiPlus className="h-4 w-4" />
              Add your first participant
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {participants.map(p => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={p.id}
                className="group rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <Link to={`/participants/${p.id}`} className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold">
                      {(p.first_name?.[0] || '')}{(p.last_name?.[0] || '')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {p.first_name} {p.last_name}
                      </p>
                      {p.ndis_number && (
                        <p className="mt-0.5 font-mono text-xs text-slate-400">{p.ndis_number}</p>
                      )}
                    </div>
                  </Link>
                  {isAdminOrManager ? (
                    <StatusDropdown
                      status={p.status || 'active'}
                      config={cfg}
                      icon={StatusIcon}
                      onChange={newStatus => handleStatusChange(p.id, newStatus)}
                    />
                  ) : (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {p.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <HiPhone className="h-3.5 w-3.5" />
                      {p.phone}
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <HiEnvelope className="h-3.5 w-3.5" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  {p.support_level && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      Support: <span className="font-medium text-slate-700 dark:text-slate-300">{p.support_level}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-[#263554] pt-4">
                  <Link
                    to={`/participants/${p.id}`}
                    className="text-xs font-medium text-brand-500 hover:text-brand-600"
                  >
                    View Profile
                  </Link>
                  {isAdminOrManager && (
                    <button
                      onClick={() => setDeleteConfirm(p)}
                      className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Participant Modal */}
      <ParticipantModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />
    </div>
  );
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ status, config, icon: Icon, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const statuses = ['active', 'inactive', 'exited'];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all hover:ring-2 hover:ring-slate-200 dark:hover:ring-[#334766] ${config.color}`}
        title="Change status"
      >
        <Icon className="h-3 w-3" />
        {config.label}
        <HiChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-1 shadow-xl">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Change Status
          </p>
          {statuses.map(s => {
            const cfg = STATUS_CONFIG[s];
            const SIcon = cfg.icon;
            const isActive = s === status;
            return (
              <button
                key={s}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isActive) onChange(s);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? 'bg-slate-50 dark:bg-[#1e2d4a] font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                }`}
              >
                <SIcon className={`h-3.5 w-3.5 ${
                  s === 'active' ? 'text-green-500' : s === 'inactive' ? 'text-amber-500' : 'text-slate-400'
                }`} />
                {cfg.label}
                {isActive && (
                  <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">Current</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
