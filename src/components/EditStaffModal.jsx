import { useState, useEffect } from 'react';
import { HiPencilSquare } from 'react-icons/hi2';
import { updateStaffMember } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

const ROLE_OPTIONS = [
  'Support Worker',
  'Nurse',
  'Allied Health',
  'Team Leader',
  'Coordinator',
  'Manager',
  'Operations Manager',
  'General Manager',
  'Director',
  'Admin',
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
        ndis_clearance_number: member.ndis_clearance_number || '',
        pay_rate_weekday: member.pay_rate_weekday || '',
        pay_rate_saturday: member.pay_rate_saturday || '',
        pay_rate_sunday: member.pay_rate_sunday || '',
        sleepover_rate: member.sleepover_rate || '',
        abn: member.abn || '',
        tfn: member.tfn || '',
        preferred_super: member.preferred_super || '',
        bsb: member.bsb || '',
        bank_account: member.bank_account || '',
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
                    <option value="onboarding">Onboarding</option>
                    <option value="inactive">Inactive</option>
                    <option value="resigned">Resigned</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">NDIS Worker Clearance No.</label>
                  <input type="text" value={form.ndis_clearance_number || ''} onChange={onChange('ndis_clearance_number')} placeholder="e.g. WSC-12345678" />
                </div>
              </div>
            </div>

            {/* Pay Rates & Banking */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Pay Rates & Banking</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Weekday Rate ($/hr)</label>
                  <input type="number" step="0.01" min="0" value={form.pay_rate_weekday || ''} onChange={onChange('pay_rate_weekday')} placeholder="0.00" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Saturday Rate ($/hr)</label>
                  <input type="number" step="0.01" min="0" value={form.pay_rate_saturday || ''} onChange={onChange('pay_rate_saturday')} placeholder="0.00" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Sunday Rate ($/hr)</label>
                  <input type="number" step="0.01" min="0" value={form.pay_rate_sunday || ''} onChange={onChange('pay_rate_sunday')} placeholder="0.00" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Sleepover Rate ($)</label>
                  <input type="number" step="0.01" min="0" value={form.sleepover_rate || ''} onChange={onChange('sleepover_rate')} placeholder="0.00" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">ABN</label>
                  <input type="text" value={form.abn || ''} onChange={onChange('abn')} placeholder="e.g. 12 345 678 901" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">TFN</label>
                  <input type="text" value={form.tfn || ''} onChange={onChange('tfn')} placeholder="e.g. 123 456 789" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Preferred Super</label>
                  <input type="text" value={form.preferred_super || ''} onChange={onChange('preferred_super')} placeholder="e.g. Australian Super" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">BSB</label>
                  <input type="text" value={form.bsb || ''} onChange={onChange('bsb')} placeholder="e.g. 062-000" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Account Number</label>
                  <input type="text" value={form.bank_account || ''} onChange={onChange('bank_account')} placeholder="e.g. 1234 5678" />
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
