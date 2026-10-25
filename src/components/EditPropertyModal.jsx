import { useState, useEffect } from 'react';
import { HiPencilSquare } from 'react-icons/hi2';
import { updatePropertyRecord } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
const TYPES = ['SIL', 'SDA', 'SIL/SDA'];
const STATUSES = ['active', 'inactive', 'maintenance'];

export default function EditPropertyModal({ isOpen, onClose, property, onUpdated }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && property) {
      setForm({
        name: property.name || '',
        address: property.address || '',
        suburb: property.suburb || '',
        state: property.state || 'NSW',
        postcode: property.postcode || '',
        property_type: property.property_type || 'SIL',
        capacity: property.capacity || '',
        status: property.status || 'active',
        property_manager: property.property_manager || '',
        contact_phone: property.contact_phone || '',
        notes: property.notes || '',
      });
      setSaving(false);
      setError(null);
    }
  }, [isOpen, property]);

  function onChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await updatePropertyRecord('properties', property.id, {
        name: form.name.trim(),
        address: form.address.trim(),
        suburb: form.suburb.trim() || null,
        state: form.state,
        postcode: form.postcode.trim() || null,
        property_type: form.property_type,
        capacity: form.capacity ? Number(form.capacity) : null,
        status: form.status,
        property_manager: form.property_manager.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        notes: form.notes.trim() || null,
      });
      onUpdated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Property" icon={HiPencilSquare} iconColor="text-accent-500" size="lg">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ModalError message={error} />
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Property Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name || ''} onChange={onChange('name')} required placeholder="e.g. Sunrise House" />
            </div>
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Address <span className="text-red-500">*</span></label>
              <input type="text" value={form.address || ''} onChange={onChange('address')} required placeholder="Street address" />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Suburb</label>
              <input type="text" value={form.suburb || ''} onChange={onChange('suburb')} placeholder="Suburb" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
                <select value={form.state || 'NSW'} onChange={onChange('state')}>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Postcode</label>
                <input type="text" value={form.postcode || ''} onChange={onChange('postcode')} placeholder="2000" maxLength={4} />
              </div>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Property Type</label>
              <select value={form.property_type || 'SIL'} onChange={onChange('property_type')}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Capacity (beds)</label>
              <input type="number" min="1" max="20" value={form.capacity || ''} onChange={onChange('capacity')} placeholder="e.g. 4" />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select value={form.status || 'active'} onChange={onChange('status')}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Property Manager</label>
              <input type="text" value={form.property_manager || ''} onChange={onChange('property_manager')} placeholder="Manager name" />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
              <input type="tel" value={form.contact_phone || ''} onChange={onChange('contact_phone')} placeholder="0400 000 000" />
            </div>
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea value={form.notes || ''} onChange={onChange('notes')} rows={3} placeholder="Optional notes about this property..." />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" disabled={!form.name?.trim() || !form.address?.trim()} loading={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
