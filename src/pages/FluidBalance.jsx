import { useState, useEffect, useMemo } from 'react';
import {
  HiPlus,
  HiTrash,
  HiCalendarDays,
  HiUserGroup,
  HiArrowPath,
  HiDocumentArrowDown,
  HiBeaker,
} from 'react-icons/hi2';
import { fetchParticipants } from '../lib/api';
import { toLocalDate } from '../lib/dates';
import {
  PageHeader,
  EmptyState,
} from '../components/ui/FormComponents';
import Modal, {
  ModalBody,
  ModalFooter,
  ButtonPrimary,
  ButtonSecondary,
  ButtonDanger,
  ModalError,
} from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = '/api/fluid-balance';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return toLocalDate();
}

function nowTime() {
  return new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(d) {
  if (!d) return '--';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FluidBalance() {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);

  // Quick-add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    time: nowTime(),
    type: 'intake', // intake or output
    description: '',
    amount_ml: '',
    staff_initials: '',
  });

  // Load participants on mount
  useEffect(() => {
    fetchParticipants().then((data) => {
      if (data && Array.isArray(data)) setParticipants(data);
    });
  }, []);

  // Load entries when participant/date changes
  useEffect(() => {
    if (!selectedParticipant) return;
    loadEntries();
  }, [selectedParticipant, selectedDate]);

  async function loadEntries() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_BASE}?participant_id=${selectedParticipant}&date=${selectedDate}`
      );
      if (!res.ok) throw new Error('Failed to load entries');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEntry(e) {
    e.preventDefault();
    if (!newEntry.description.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: selectedParticipant,
          date: selectedDate,
          time: newEntry.time,
          type: newEntry.type,
          description: newEntry.description.trim(),
          amount_ml: newEntry.amount_ml ? parseInt(newEntry.amount_ml) : null,
          staff_initials: newEntry.staff_initials.trim() || user?.name?.split(' ').map(n => n[0]).join('') || '',
        }),
      });
      if (!res.ok) throw new Error('Failed to save entry');
      // Reset form & reload
      setNewEntry({ time: nowTime(), type: 'intake', description: '', amount_ml: '', staff_initials: '' });
      setShowAddForm(false);
      await loadEntries();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API_BASE}?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setDeleteModal(null);
      await loadEntries();
    } catch (err) {
      setError(err.message);
    }
  }

  // ─── Totals ─────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const intake = entries
      .filter((e) => e.type === 'intake')
      .reduce((sum, e) => sum + (e.amount_ml || 0), 0);
    const output = entries
      .filter((e) => e.type === 'output')
      .reduce((sum, e) => sum + (e.amount_ml || 0), 0);
    return { intake, output, balance: intake - output };
  }, [entries]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fluid Balance Chart"
        subtitle="Record fluid intake and output for participants"
        icon={HiBeaker}
      />

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Participant select */}
          <div>
            <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              <HiUserGroup className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Participant
            </label>
            <select
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              className="w-full"
            >
              <option value="">Select participant...</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              <HiCalendarDays className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex items-end gap-3">
            <button
              onClick={loadEntries}
              disabled={!selectedParticipant}
              className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors disabled:opacity-40"
            >
              <HiArrowPath className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                setNewEntry({ ...newEntry, time: nowTime() });
                setShowAddForm(true);
              }}
              disabled={!selectedParticipant}
              className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-3 text-sm font-semibold text-white hover:bg-accent-600 transition-colors disabled:opacity-40"
            >
              <HiPlus className="h-4 w-4" />
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* No participant selected */}
      {!selectedParticipant && (
        <EmptyState
          icon={HiBeaker}
          title="Select a participant"
          description="Choose a participant above to view or add fluid balance entries."
        />
      )}

      {/* Loading */}
      {selectedParticipant && loading && (
        <div className="grid grid-cols-1 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Content */}
      {selectedParticipant && !loading && (
        <>
          {/* Totals bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Total Intake</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono">{totals.intake} ml</p>
            </div>
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Total Output</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono">{totals.output} ml</p>
            </div>
            <div className={`rounded-xl border p-5 text-center ${
              totals.balance >= 0
                ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20'
                : 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                totals.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>Balance</p>
              <p className={`text-2xl font-bold font-mono ${
                totals.balance >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>{totals.balance >= 0 ? '+' : ''}{totals.balance} ml</p>
            </div>
          </div>

          {/* Entries table */}
          <div className="rounded-xl border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#334766] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Entries for {formatDate(selectedDate)}
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No entries for this date. Click "Add Entry" to start recording.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#334766] bg-slate-50 dark:bg-[#1a2844]">
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Time</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Type</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Description</th>
                      <th className="px-5 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Amount (ml)</th>
                      <th className="px-5 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">Staff</th>
                      <th className="px-5 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-slate-50 dark:border-[#253552] hover:bg-slate-50/50 dark:hover:bg-[#1e2d4a]/50 transition-colors"
                      >
                        <td className="px-5 py-4 font-mono text-slate-700 dark:text-slate-200">{entry.time}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            entry.type === 'intake'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          }`}>
                            {entry.type === 'intake' ? 'IN' : 'OUT'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{entry.description}</td>
                        <td className="px-5 py-4 text-right font-mono text-slate-700 dark:text-slate-200">
                          {entry.amount_ml ? `${entry.amount_ml}` : '—'}
                        </td>
                        <td className="px-5 py-4 text-center text-slate-500 dark:text-slate-400 font-medium">
                          {entry.staff_initials || '—'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setDeleteModal(entry)}
                            className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <HiTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Add Entry Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add Fluid Entry"
        size="md"
      >
        <form onSubmit={handleAddEntry}>
          <ModalBody>
            {error && <ModalError message={error} />}

            <div className="space-y-5">
              {/* Time */}
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Time
                </label>
                <input
                  type="time"
                  value={newEntry.time}
                  onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })}
                  className="w-full"
                  required
                />
              </div>

              {/* Type toggle */}
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewEntry({ ...newEntry, type: 'intake' })}
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                      newEntry.type === 'intake'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-[#334766] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                    }`}
                  >
                    Intake (IN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntry({ ...newEntry, type: 'output' })}
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                      newEntry.type === 'output'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        : 'border-slate-200 dark:border-[#334766] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                    }`}
                  >
                    Output (OUT)
                  </button>
                </div>
              </div>

              {/* Description (free text) */}
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <input
                  type="text"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder={newEntry.type === 'intake' ? 'e.g. Water, Tea, Juice, Thickened fluids...' : 'e.g. Urine, Vomit, Drain output...'}
                  className="w-full"
                  required
                  autoFocus
                />
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  Free text — write whatever describes the fluid
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Amount (ml)
                </label>
                <input
                  type="number"
                  value={newEntry.amount_ml}
                  onChange={(e) => setNewEntry({ ...newEntry, amount_ml: e.target.value })}
                  placeholder="e.g. 200"
                  className="w-full"
                  min="0"
                  step="10"
                />
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  Optional — leave blank if amount is unknown
                </p>
              </div>

              {/* Staff initials */}
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Staff Initials
                </label>
                <input
                  type="text"
                  value={newEntry.staff_initials}
                  onChange={(e) => setNewEntry({ ...newEntry, staff_initials: e.target.value.toUpperCase() })}
                  placeholder="e.g. JB"
                  className="w-full uppercase"
                  maxLength={5}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setShowAddForm(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add Entry'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── Delete Confirmation ─────────────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Entry"
        size="sm"
      >
        <ModalBody>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Delete this entry? ({deleteModal?.time} — {deleteModal?.description})
          </p>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteModal(null)}>Cancel</ButtonSecondary>
          <ButtonDanger onClick={() => handleDelete(deleteModal.id)}>Delete</ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}
