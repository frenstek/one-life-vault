import { useState, useEffect } from 'react';
import { HiBookOpen } from 'react-icons/hi2';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

const STAKEHOLDER_TYPES = [
  'Support Coordinator',
  'SDA Provider',
  'Plan Manager',
  'Allied Health',
  'Behaviour Support Practitioner',
  'Occupational Therapist',
  'Speech Pathologist',
  'Psychologist',
  'Physiotherapist',
  'Dietitian',
  'GP / Medical',
  'NDIS LAC',
  'Transport Provider',
  'Equipment Supplier',
  'Other',
];

const EMPTY = {
  name: '',
  type: '',
  organization: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  notes: '',
};

export default function StakeholderModal({ isOpen, onClose, onSaved, stakeholder }) {
  const isEdit = !!stakeholder;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSaving(false);
      if (stakeholder) {
        setForm({
          name: stakeholder.name || '',
          type: stakeholder.type || '',
          organization: stakeholder.organization || '',
          contact_name: stakeholder.contact_name || '',
          phone: stakeholder.phone || '',
          email: stakeholder.email || '',
          address: stakeholder.address || '',
          website: stakeholder.website || '',
          notes: stakeholder.notes || '',
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [isOpen, stakeholder]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required');
    if (!form.type) return setError('Type is required');

    setSaving(true);
    setError(null);

    try {
      const url = '/api/stakeholders';
      const method = isEdit ? 'PATCH' : 'POST';
      const body = isEdit ? { id: stakeholder.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed: ${res.status}`);
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Stakeholder' : 'Add Stakeholder'}
      icon={HiBookOpen}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ModalError message={error} />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. John Smith or ABC Therapy Services"
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0c1425] px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            {/* Type */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0c1425] px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="">Select type...</option>
                {STAKEHOLDER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Organization */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Organization
              </label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) => set('organization', e.target.value)}
                placeholder="Company / practice name"
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0c1425] px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            {/* Contact Name */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Contact Person
              </label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => set('contact_name', e.target.value)}
                placeholder="Primary contact"
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0c1425] px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="04XX XXX XXX"
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0c1425] px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0c1425] px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            {/* Website */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0c1425] px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Street address, suburb, state, postcode"
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0c1425] px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
                placeholder="Any additional details..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0c1425] px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none"
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" loading={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Stakeholder'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
