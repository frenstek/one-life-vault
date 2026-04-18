import { useState, useEffect } from 'react';
import { HiUserPlus } from 'react-icons/hi2';
import { addResident } from '../lib/api';
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

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL);
      setSaving(false);
      setError(null);
    }
  }, [isOpen]);

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
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Participant Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.participant_name} onChange={onChange('participant_name')} required placeholder="Full name" />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">NDIS Number</label>
              <input type="text" value={form.ndis_number} onChange={onChange('ndis_number')} placeholder="e.g. 43XXXXXXXX" />
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
