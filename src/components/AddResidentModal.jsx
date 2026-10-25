import { useState, useEffect, useRef } from 'react';
import { HiUserPlus, HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';
import { addResident, fetchParticipants } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

const SUPPORT_LEVELS = ['Low', 'Medium', 'High', 'Complex'];

const INITIAL = {
  participant_name: '',
  ndis_number: '',
  room_number: '',
  move_in_date: '',
  support_level: 'Medium',
  notes: '',
};

export default function AddResidentModal({ isOpen, onClose, propertyId, onCreated }) {
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Participant picker state
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL);
      setSaving(false);
      setError(null);
      setSearch('');
      setSelectedParticipant(null);
      setShowDropdown(false);
      loadParticipants();
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadParticipants() {
    setLoadingParticipants(true);
    try {
      const data = await fetchParticipants('active');
      setParticipants(data || []);
    } catch {
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    const ndis = (p.ndis_number || '').toLowerCase();
    return name.includes(q) || ndis.includes(q);
  });

  function selectParticipant(p) {
    setSelectedParticipant(p);
    setSearch('');
    setShowDropdown(false);
    setForm((f) => ({
      ...f,
      participant_name: `${p.first_name} ${p.last_name}`.trim(),
      ndis_number: p.ndis_number || '',
      support_level: p.support_level || f.support_level,
    }));
  }

  function clearSelection() {
    setSelectedParticipant(null);
    setForm((f) => ({ ...f, participant_name: '', ndis_number: '' }));
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.participant_name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await addResident({
        property_id: propertyId,
        participant_name: form.participant_name.trim(),
        ndis_number: form.ndis_number.trim() || undefined,
        room_number: form.room_number.trim() || undefined,
        move_in_date: form.move_in_date || undefined,
        support_level: form.support_level,
        notes: form.notes.trim() || undefined,
      });
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Resident" icon={HiUserPlus} iconColor="text-accent-500" size="lg">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ModalError message={error} />
          <div className="grid grid-cols-2 gap-6">
            {/* Participant Selector */}
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Select Participant <span className="text-red-500">*</span>
              </label>

              {selectedParticipant ? (
                <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-700 dark:bg-brand-900/20">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-800 dark:text-brand-300">
                    {selectedParticipant.first_name?.[0]}{selectedParticipant.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {selectedParticipant.first_name} {selectedParticipant.last_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      NDIS: {selectedParticipant.ndis_number || 'N/A'}
                      {selectedParticipant.support_level && ` · ${selectedParticipant.support_level} support`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="flex-shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-600 dark:hover:text-slate-300"
                  >
                    <HiXMark className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Search active participants by name or NDIS..."
                      className="!pl-10"
                    />
                  </div>

                  {showDropdown && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800">
                      {loadingParticipants ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-400">Loading participants...</div>
                      ) : filtered.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-400">
                          {search ? 'No matching participants' : 'No active participants found'}
                        </div>
                      ) : (
                        filtered.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectParticipant(p)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {p.first_name?.[0]}{p.last_name?.[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                {p.first_name} {p.last_name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {p.ndis_number || 'No NDIS'}
                                {p.support_level && ` · ${p.support_level}`}
                                {p.location && ` · ${p.location}`}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Room Number</label>
              <input type="text" value={form.room_number} onChange={onChange('room_number')} placeholder="e.g. Room 1" />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Move-in Date</label>
              <input type="date" value={form.move_in_date} onChange={onChange('move_in_date')} />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Support Level</label>
              <select value={form.support_level} onChange={onChange('support_level')}>
                {SUPPORT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">NDIS Number</label>
              <input
                type="text"
                value={form.ndis_number}
                onChange={onChange('ndis_number')}
                placeholder="Auto-filled from participant"
                readOnly={!!selectedParticipant}
                className={selectedParticipant ? 'opacity-60' : ''}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea value={form.notes} onChange={onChange('notes')} rows={3} placeholder="Optional notes about this resident..." />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" disabled={!form.participant_name.trim()} loading={saving}>
            {saving ? 'Saving...' : 'Add Resident'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
