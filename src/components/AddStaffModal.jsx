import { useState, useEffect } from 'react';
import { HiUserPlus, HiCheckCircle, HiClipboard, HiExclamationTriangle } from 'react-icons/hi2';
import { createStaffMember } from '../lib/api';
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

const STATUS_OPTIONS = ['active', 'onboarding'];

const INITIAL = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: 'Support Worker',
  department: '',
  position_type: 'Full-Time',
  status: 'active',
  start_date: '',
  date_of_birth: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: '',
  ndis_clearance_number: '',
  notes: '',
};

const VAULT_ROLE_MAP = {
  'Support Worker': 'staff', 'Nurse': 'staff', 'Allied Health': 'staff',
  'Team Leader': 'manager', 'Coordinator': 'manager',
  'Manager': 'admin', 'Operations Manager': 'admin', 'General Manager': 'admin', 'Director': 'admin', 'Admin': 'admin',
};

export default function AddStaffModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL);
      setSaving(false);
      setError(null);
      setCredentials(null);
    }
  }, [isOpen]);

  function onChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const data = {};
      for (const [key, val] of Object.entries(form)) {
        if (typeof val === 'string' && val.trim()) {
          data[key] = val.trim();
        }
      }
      const created = await createStaffMember(data);

      // Show vault account credentials if auto-created
      if (created.vault_account?.created) {
        setCredentials(created.vault_account);
      } else {
        onCreated?.(created);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    if (!credentials) return;
    const text = `Vault Login Credentials\nName: ${form.first_name} ${form.last_name}\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nRole: ${credentials.vault_role}`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  // Show credentials screen after successful creation
  if (credentials) {
    return (
      <Modal isOpen={isOpen} onClose={() => { setCredentials(null); onCreated?.(); }} title="Staff Member Created" icon={HiCheckCircle} iconColor="text-emerald-500" size="md">
        <ModalBody>
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2 mb-2">
                <HiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Vault account auto-created</p>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                A login account was automatically created for <strong>{form.first_name} {form.last_name}</strong> based on their role ({form.role} = {credentials.vault_role}).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#263554] dark:bg-[#1e2d4a]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Login Credentials</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Email</span>
                  <span className="font-mono text-sm font-medium text-slate-800 dark:text-white">{credentials.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Password</span>
                  <span className="font-mono text-sm font-medium text-slate-800 dark:text-white">{credentials.password}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Vault Role</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    credentials.vault_role === 'admin' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : credentials.vault_role === 'manager' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>{credentials.vault_role}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <HiExclamationTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700 dark:text-amber-400">Save these credentials now. The password is stored in Staff Accounts for reference, but share it securely with the staff member.</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={handleCopy}>
            <HiClipboard className="mr-1.5 h-4 w-4" />
            Copy Credentials
          </ButtonSecondary>
          <ButtonPrimary onClick={() => { setCredentials(null); onCreated?.(); }}>Done</ButtonPrimary>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Staff Member" icon={HiUserPlus} iconColor="text-accent-500" size="lg">
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
                  <input type="text" value={form.first_name} onChange={onChange('first_name')} required placeholder="Enter first name" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.last_name} onChange={onChange('last_name')} required placeholder="Enter last name" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={form.email} onChange={onChange('email')} required placeholder="email@example.com" />
                  <p className="mt-1 text-[10px] text-slate-400">Used to create their vault login account</p>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input type="tel" value={form.phone} onChange={onChange('phone')} placeholder="0400 000 000" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={onChange('date_of_birth')} />
                </div>
                <div className="col-span-2">
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                  <input type="text" value={form.address} onChange={onChange('address')} placeholder="Street address, suburb, state, postcode" />
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Employment Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                  <select value={form.role} onChange={onChange('role')}>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Vault access: <span className={`font-semibold ${VAULT_ROLE_MAP[form.role] === 'admin' ? 'text-red-500' : VAULT_ROLE_MAP[form.role] === 'manager' ? 'text-blue-500' : 'text-slate-500'}`}>{VAULT_ROLE_MAP[form.role] || 'staff'}</span>
                  </p>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Position Type</label>
                  <select value={form.position_type} onChange={onChange('position_type')}>
                    {POSITION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select value={form.status} onChange={onChange('status')}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                  <input type="text" value={form.department} onChange={onChange('department')} placeholder="e.g. SIL, SDA" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Start Date</label>
                  <input type="date" value={form.start_date} onChange={onChange('start_date')} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">NDIS Worker Clearance No.</label>
                  <input type="text" value={form.ndis_clearance_number} onChange={onChange('ndis_clearance_number')} placeholder="e.g. WSC-12345678" />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Emergency Contact</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Name</label>
                  <input type="text" value={form.emergency_contact_name} onChange={onChange('emergency_contact_name')} placeholder="Full name" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <input type="tel" value={form.emergency_contact_phone} onChange={onChange('emergency_contact_phone')} placeholder="0400 000 000" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Relationship</label>
                  <input type="text" value={form.emergency_contact_relationship} onChange={onChange('emergency_contact_relationship')} placeholder="e.g. Spouse, Parent" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea value={form.notes} onChange={onChange('notes')} rows={3} placeholder="Optional notes about this staff member..." />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" disabled={!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()} loading={saving}>
            {saving ? 'Saving...' : 'Add Staff'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
