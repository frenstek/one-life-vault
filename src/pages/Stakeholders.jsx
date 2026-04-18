import { useState, useEffect } from 'react';
import {
  HiBookOpen,
  HiPlus,
  HiMagnifyingGlass,
  HiPhone,
  HiEnvelope,
  HiMapPin,
  HiGlobeAlt,
  HiPencilSquare,
  HiTrash,
  HiEllipsisVertical,
  HiBuildingOffice,
  HiUser,
} from 'react-icons/hi2';
import { SkeletonGrid } from '../components/ui/Skeleton';
import StakeholderModal from '../components/StakeholderModal';
import Modal, { ModalFooter, ModalError, ButtonDanger, ButtonSecondary } from '../components/ui/Modal';

const TYPE_COLORS = {
  'Support Coordinator': 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  'SDA Provider': 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  'Plan Manager': 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  'Allied Health': 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300',
  'Behaviour Support Practitioner': 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300',
  'Occupational Therapist': 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
  'Speech Pathologist': 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300',
  'Psychologist': 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300',
  'Physiotherapist': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  'Dietitian': 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300',
  'GP / Medical': 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  'NDIS LAC': 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300',
  'Transport Provider': 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  'Equipment Supplier': 'bg-stone-50 dark:bg-stone-900/20 text-stone-700 dark:text-stone-300',
  'Other': 'bg-slate-50 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300',
};

export default function Stakeholders() {
  const [stakeholders, setStakeholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  function loadStakeholders() {
    setLoading(true);
    setError(null);
    fetch('/api/stakeholders?action=list')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed: ${r.status}`);
        return r.json();
      })
      .then((data) => setStakeholders(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStakeholders();
  }, []);

  // Close menu when clicking elsewhere
  useEffect(() => {
    if (!openMenu) return;
    function close() { setOpenMenu(null); }
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenu]);

  const filtered = stakeholders.filter((s) => {
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.organization || '').toLowerCase().includes(q) ||
      (s.contact_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.type || '').toLowerCase().includes(q)
    );
  });

  // Get unique types that exist in data for the filter
  const activeTypes = [...new Set(stakeholders.map((s) => s.type))].sort();

  // Stats
  const total = stakeholders.length;
  const typeCount = activeTypes.length;

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/stakeholders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Delete failed: ${res.status}`);
      }
      setDeleteTarget(null);
      loadStakeholders();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stakeholder Directory</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Support coordinators, SDA providers, allied health & external contacts
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
        >
          <HiPlus className="h-4 w-4" />
          Add Stakeholder
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-5 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-brand-500">
            <HiBookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total Contacts</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-5 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-500">
            <HiBuildingOffice className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{typeCount}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Categories</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-5 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30 text-accent-500">
            <HiUser className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{filtered.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Showing</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              typeFilter === 'all'
                ? 'bg-accent-500 text-white'
                : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
            }`}
          >
            All
          </button>
          {activeTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-accent-500 text-white'
                  : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stakeholders..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadStakeholders} className="mt-2 text-sm font-medium text-red-600 underline">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <HiBookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {search || typeFilter !== 'all' ? 'No stakeholders matching your filters.' : 'No stakeholders yet. Add your first contact.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StakeholderCard
              key={s.id}
              stakeholder={s}
              menuOpen={openMenu === s.id}
              onMenuToggle={(e) => { e.stopPropagation(); setOpenMenu(openMenu === s.id ? null : s.id); }}
              onEdit={() => { setEditTarget(s); setModalOpen(true); setOpenMenu(null); }}
              onDelete={() => { setDeleteTarget(s); setDeleteError(null); setOpenMenu(null); }}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <StakeholderModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSaved={loadStakeholders}
        stakeholder={editTarget}
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Stakeholder"
        icon={HiTrash}
        iconColor="text-red-600"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>?
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
          <div className="mt-4">
            <ModalError message={deleteError} />
          </div>
        </div>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</ButtonSecondary>
          <ButtonDanger onClick={handleDelete} loading={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function StakeholderCard({ stakeholder: s, menuOpen, onMenuToggle, onEdit, onDelete }) {
  const typeColor = TYPE_COLORS[s.type] || TYPE_COLORS['Other'];

  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-500 font-semibold text-sm">
            {(s.name || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{s.name}</p>
            {s.organization && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.organization}</p>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600"
          >
            <HiEllipsisVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] py-1 shadow-lg">
              <button
                onClick={onEdit}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#263554]"
              >
                <HiPencilSquare className="h-4 w-4" /> Edit
              </button>
              <button
                onClick={onDelete}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <HiTrash className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Type badge */}
      <div className="mt-3">
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${typeColor}`}>
          {s.type}
        </span>
      </div>

      {/* Contact info */}
      <div className="mt-4 space-y-2">
        {s.contact_name && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HiUser className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{s.contact_name}</span>
          </div>
        )}
        {s.phone && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HiPhone className="h-3.5 w-3.5 flex-shrink-0" />
            <a href={`tel:${s.phone}`} className="truncate hover:text-brand-500 transition-colors">{s.phone}</a>
          </div>
        )}
        {s.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HiEnvelope className="h-3.5 w-3.5 flex-shrink-0" />
            <a href={`mailto:${s.email}`} className="truncate hover:text-brand-500 transition-colors">{s.email}</a>
          </div>
        )}
        {s.address && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HiMapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{s.address}</span>
          </div>
        )}
        {s.website && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HiGlobeAlt className="h-3.5 w-3.5 flex-shrink-0" />
            <a href={s.website} target="_blank" rel="noopener noreferrer" className="truncate hover:text-brand-500 transition-colors">
              {s.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Notes preview */}
      {s.notes && (
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 line-clamp-2 border-t border-slate-100 dark:border-[#263554] pt-3">
          {s.notes}
        </p>
      )}
    </div>
  );
}
