import { useState, useEffect } from 'react';
import { HiBuildingOffice2 } from 'react-icons/hi2';
import { createProperty } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
const TYPES = ['SIL', 'SDA', 'SIL/SDA'];

const INITIAL = {
  name: '',
  address: '',
  suburb: '',
  state: 'NSW',
  postcode: '',
  property_type: 'SIL',
  capacity: '',
  manager_name: '',
  manager_phone: '',
  notes: '',
};

export default function AddPropertyModal({ isOpen, onClose, onCreated }) {
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
    if (!form.name.trim() || !form.address.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await createProperty({
        name: form.name.trim(),
        address: form.address.trim(),
        suburb: form.suburb.trim() || undefined,
        state: form.state,
        postcode: form.postcode.trim() || undefined,
        property_type: form.property_type,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        manager_name: form.manager_name.trim() || undefined,
        manager_phone: form.manager_phone.trim() || undefined,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add Property" icon={HiBuildingOffice2} iconColor="text-accent-500" size="lg">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ModalError message={error} />
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Property Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={onChange('name')} required placeholder="e.g. Sunrise House" />
            </div>
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Address <span className="text-red-500">*</span></label>
              <input type="text" value={form.address} onChange={onChange('address')} required placeholder="Street address" />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Suburb</label>
              <input type="text" value={form.suburb} onChange={onChange('suburb')} placeholder="Suburb" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
                <select value={form.state} onChange={onChange('state')}>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Postcode</label>
                <input type="text" value={form.postcode} onChange={onChange('postcode')} placeholder="2000" maxLength={4} />
              </div>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Property Type</label>
              <select value={form.property_type} onChange={onChange('property_type')}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Capacity (beds)</label>
              <input type="number" min="1" max="20" value={form.capacity} onChange={onChange('capacity')} placeholder="e.g. 4" />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Property Manager</label>
              <input type="text" value={form.manager_name} onChange={onChange('manager_name')} placeholder="Manager name" />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
              <input type="tel" value={form.manager_phone} onChange={onChange('manager_phone')} placeholder="0400 000 000" />
            </div>
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea value={form.notes} onChange={onChange('notes')} rows={3} placeholder="Optional notes about this property..." />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" disabled={!form.name.trim() || !form.address.trim()} loading={saving}>
            {saving ? 'Saving...' : 'Add Property'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
