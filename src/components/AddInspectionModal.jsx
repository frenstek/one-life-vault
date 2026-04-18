import { useState, useEffect } from 'react';
import { HiClipboardDocumentCheck } from 'react-icons/hi2';
import { addInspection } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

const INSPECTION_TYPES = [
  'Fire Safety',
  'Building Compliance',
  'SDA Assessment',
  'Pest Control',
  'Electrical',
  'Plumbing',
  'General',
  'NDIS Quality',
];

const RESULTS = [
  { value: 'pass', label: 'Pass', color: 'bg-green-100 text-accent-500 border-green-300 dark:bg-green-900/30 dark:border-green-700' },
  { value: 'fail', label: 'Fail', color: 'bg-red-100 text-red-600 border-red-300 dark:bg-red-900/30 dark:border-red-700' },
  { value: 'needs_attention', label: 'Needs Attention', color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700' },
];

const INITIAL = {
  inspection_type: 'General',
  inspection_date: '',
  inspector: '',
  result: 'pass',
  notes: '',
  next_due_date: '',
};

export default function AddInspectionModal({ isOpen, onClose, propertyId, onCreated }) {
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm({ ...INITIAL, inspection_date: new Date().toISOString().split('T')[0] });
      setSaving(false);
      setError(null);
    }
  }, [isOpen]);

  function onChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.inspection_type || !form.inspection_date) return;

    setSaving(true);
    setError(null);

    try {
      await addInspection({
        property_id: propertyId,
        inspection_type: form.inspection_type,
        inspection_date: form.inspection_date,
        inspector: form.inspector.trim() || undefined,
        result: form.result,
        notes: form.notes.trim() || undefined,
        next_due_date: form.next_due_date || undefined,
      });
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Inspection" icon={HiClipboardDocumentCheck} iconColor="text-brand-500" size="lg">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ModalError message={error} />
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Inspection Type <span className="text-red-500">*</span></label>
              <select value={form.inspection_type} onChange={onChange('inspection_type')}>
                {INSPECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Inspection Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.inspection_date} onChange={onChange('inspection_date')} required />
            </div>
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Inspector</label>
              <input type="text" value={form.inspector} onChange={onChange('inspector')} placeholder="Inspector name" />
            </div>
            <div className="col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Result <span className="text-red-500">*</span></label>
              <div className="flex gap-3">
                {RESULTS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, result: r.value }))}
                    className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                      form.result === r.value
                        ? r.color + ' ring-2 ring-offset-1 ring-slate-300 dark:ring-slate-600'
                        : 'border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-400 hover:bg-slate-50 dark:hover:bg-[#263554]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea value={form.notes} onChange={onChange('notes')} rows={3} placeholder="Inspection notes, findings, recommendations..." />
            </div>
            <div className="col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Next Due Date</label>
              <input type="date" value={form.next_due_date} onChange={onChange('next_due_date')} />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" disabled={!form.inspection_type || !form.inspection_date} loading={saving}>
            {saving ? 'Saving...' : 'Record Inspection'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
