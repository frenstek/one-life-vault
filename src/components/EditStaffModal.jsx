import { useState, useEffect } from 'react';
import { HiPencilSquare } from 'react-icons/hi2';
import { updateStaffMember } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

const ROLE_OPTIONS = [
  'Support Worker',
  'Team Leader',
  'Manager',
  'Coordinator',
  'Admin',
  'Nurse',
  'Allied Health',
];

const POSITION_TYPES = ['Full-Time', 'Part-Time', 'Casual', 'Contract'];

export default function EditStaffModal({ isOpen, onClose, member, onUpdated }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && member) {
      setForm({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || 'Support Worker',
        department: member.department || '',
        position_type: member.position_type || 'Full-Time',
        start_date: member.start_date ? member.start_date.slice(0, 10) : '',
        date_of_birth: member.date_of_birth ? member.date_of_birth.slice(0, 10) : '',
        address: member.address || '',
        emergency_contact_name: member.emergency_contact_name || '',
        emergency_contact_phone: member.emergency_contact_phone || '',
        emergency_contact_relationship: member.emergency_contact_relationship || '',
        notes: member.notes || '',
        status: member.status || 'active',
      });
      setSaving(false);
      setError(null);
    }
  }, [isOpen, member]);

  function onChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const data = {};
      for (const [key, val] of Object.entries(form)) {
        if (typeof val === 'string') {
          data[key] = val.trim() || undefined;
        } else {
          data[key] = val;
        }
      }
      // Always include status
      data.status = form.status;
      await updateStaffMember(member.id, data);
      onUpdated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen && !!member} onClose={onClose} title="Edit Staff Member" icon={HiPencilSquare} iconColor="text-brand-500" size="lg">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ModalError message={error} />
          <div className="space-y-6">
            {/* Personal Details */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Personal Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">First Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.first_name || ''} onChange={onChange('first_name')} required />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.last_name || ''} onChange={onChange('last_name')} required />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input type="email" value={form.email || ''} onChange={onChange('email')} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input type="tel" value={form.phone || ''} onChange={onChange('phone')} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <input type="date" value={form.date_of_birth || ''} onChange={onChange('date_of_birth')} />
                </div>
                <div className="col-span-2">
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                  <input type="text" value={form.address || ''} onChange={onChange('address')} placeholder="Street address, suburb, state, postcode" />
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Employment Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                  <select value={form.role || 'Support Worker'} onChange={onChange('role')}>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Position Type</label>
                  <select value={form.position_type || 'Full-Time'} onChange={onChange('position_type')}>
                    {POSITION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                  <input type="text" value={form.department || ''} onChange={onChange('department')} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Start Date</label>
                  <input type="date" value={form.start_date || ''} onChange={onChange('start_date')} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select value={form.status || 'active'} onChange={onChange('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Emergency Contact</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Name</label>
                  <input type="text" value={form.emergency_contact_name || ''} onChange={onChange('emergency_contact_name')} placeholder="Full name" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <input type="tel" value={form.emergency_contact_phone || ''} onChange={onChange('emergency_contact_phone')} placeholder="0400 000 000" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Relationship</label>
                  <input type="text" value={form.emergency_contact_relationship || ''} onChange={onChange('emergency_contact_relationship')} placeholder="e.g. Spouse, Parent" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea value={form.notes || ''} onChange={onChange('notes')} rows={2} placeholder="Optional notes..." />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" disabled={saving} loading={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
