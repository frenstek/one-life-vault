import { useState, useEffect } from 'react';
import { HiUserPlus, HiPencilSquare } from 'react-icons/hi2';
import { createInquiry, updateInquiry } from '../lib/api';
import { toLocalDate } from '../lib/dates';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

const STATUS_OPTIONS = ['New', 'In Progress', 'Accepted', 'Declined', 'Waitlisted', 'Converted'];
const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Urgent'];
const SERVICE_TYPES = ['SIL', 'SDA', 'SIL + SDA', 'Community', 'Respite', 'Other'];
const FUNDING_STATUSES = ['Unknown', 'Plan Managed', 'Self Managed', 'NDIA Managed', 'No Funding'];
const REFERRAL_SOURCES = ['NDIA', 'Support Coordinator', 'Family/Self', 'Hospital', 'Other Provider', 'Other'];

const INITIAL = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  ndis_number: '',
  phone: '',
  email: '',
  location: '',
  state: '',
  referral_source: '',
  referral_contact: '',
  service_type: 'SIL',
  support_needs: '',
  current_living: '',
  funding_status: 'Unknown',
  funding_ratio: '',
  inquiry_date: '',
  status: 'New',
  priority: 'Normal',
  assigned_to: '',
  next_follow_up: '',
  notes: '',
};

export default function InquiryModal({ isOpen, onClose, inquiry, onSaved }) {
  const isEdit = !!inquiry;
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (inquiry) {
        const f = {};
        for (const key of Object.keys(INITIAL)) {
          if (key.includes('date') && inquiry[key]) {
            f[key] = inquiry[key].slice(0, 10);
          } else {
            f[key] = inquiry[key] || INITIAL[key];
          }
        }
        setForm(f);
      } else {
        setForm({ ...INITIAL, inquiry_date: toLocalDate() });
      }
      setSaving(false);
      setError(null);
    }
  }, [isOpen, inquiry]);

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
        if (typeof val === 'string' && val.trim()) {
          data[key] = val.trim();
        }
      }

      if (isEdit) {
        await updateInquiry(inquiry.id, data);
      } else {
        await createInquiry(data);
      }
      onSaved?.();
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
      title={isEdit ? 'Edit Inquiry' : 'New Participant Inquiry'}
      icon={isEdit ? HiPencilSquare : HiUserPlus}
      iconColor={isEdit ? 'text-brand-500' : 'text-accent-500'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ModalError message={error} />
          <div className="space-y-6">
            {/* Participant Details */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Participant Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">First Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.first_name} onChange={onChange('first_name')} required placeholder="First name" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.last_name} onChange={onChange('last_name')} required placeholder="Last name" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={onChange('date_of_birth')} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">NDIS Number</label>
                  <input type="text" value={form.ndis_number} onChange={onChange('ndis_number')} placeholder="e.g. 431234567" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input type="tel" value={form.phone} onChange={onChange('phone')} placeholder="0400 000 000" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input type="email" value={form.email} onChange={onChange('email')} placeholder="email@example.com" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Location / Suburb</label>
                  <input type="text" value={form.location} onChange={onChange('location')} placeholder="e.g. Parramatta, Bankstown" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
                  <select value={form.state} onChange={onChange('state')}>
                    <option value="">Select...</option>
                    <option>NSW</option>
                    <option>VIC</option>
                    <option>QLD</option>
                    <option>SA</option>
                    <option>WA</option>
                    <option>TAS</option>
                    <option>NT</option>
                    <option>ACT</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Referral & Service */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Referral & Service</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Referral Source</label>
                  <select value={form.referral_source} onChange={onChange('referral_source')}>
                    <option value="">Select...</option>
                    {REFERRAL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Referral Contact</label>
                  <input type="text" value={form.referral_contact} onChange={onChange('referral_contact')} placeholder="Contact name / org" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Service Type</label>
                  <select value={form.service_type} onChange={onChange('service_type')}>
                    {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Funding Status</label>
                  <select value={form.funding_status} onChange={onChange('funding_status')}>
                    {FUNDING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Funding Ratio</label>
                  <select value={form.funding_ratio} onChange={onChange('funding_ratio')}>
                    <option value="">Select...</option>
                    <option>1:1</option>
                    <option>1:2</option>
                    <option>1:3</option>
                    <option>2:1</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Current Living Situation</label>
                  <input type="text" value={form.current_living} onChange={onChange('current_living')} placeholder="e.g. Living with family, group home, hospital" />
                </div>
                <div className="col-span-2">
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Support Needs</label>
                  <textarea value={form.support_needs} onChange={onChange('support_needs')} rows={2} placeholder="Brief description of support needs..." />
                </div>
              </div>
            </div>

            {/* Status & Tracking */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Status & Tracking</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Inquiry Date</label>
                  <input type="date" value={form.inquiry_date} onChange={onChange('inquiry_date')} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Next Follow-up</label>
                  <input type="date" value={form.next_follow_up} onChange={onChange('next_follow_up')} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select value={form.status} onChange={onChange('status')}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
                  <select value={form.priority} onChange={onChange('priority')}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea value={form.notes} onChange={onChange('notes')} rows={3} placeholder="Additional notes..." />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" disabled={!form.first_name.trim() || !form.last_name.trim()} loading={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Inquiry'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
