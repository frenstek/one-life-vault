import { useState, useEffect } from 'react';
import { HiWrenchScrewdriver } from 'react-icons/hi2';
import { addMaintenance } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const INITIAL = {
  title: '',
  description: '',
  priority: 'medium',
  reported_by: '',
};

export default function AddMaintenanceModal({ isOpen, onClose, propertyId, onCreated }) {
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
    if (!form.title.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await addMaintenance({
        property_id: propertyId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        reported_by: form.reported_by.trim() || undefined,
      });
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Maintenance Request" icon={HiWrenchScrewdriver} iconColor="text-amber-600" size="lg">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ModalError message={error} />
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={onChange('title')} required placeholder="e.g. Leaking tap in bathroom" />
            </div>
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea value={form.description} onChange={onChange('description')} rows={4} placeholder="Describe the issue in detail..." />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.priority === p.value
                        ? p.color + ' ring-2 ring-offset-1 ring-slate-300 dark:ring-slate-600'
                        : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-400 hover:bg-slate-200 dark:hover:bg-[#263554]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Reported By</label>
              <input type="text" value={form.reported_by} onChange={onChange('reported_by')} placeholder="Name of person reporting" />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" disabled={!form.title.trim()} loading={saving}>
            {saving ? 'Saving...' : 'Submit Request'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
