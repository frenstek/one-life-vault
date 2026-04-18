import { useState, useEffect } from 'react';
import { HiUserPlus } from 'react-icons/hi2';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from './ui/Modal';
import { createParticipant, updateParticipant } from '../lib/api';

const EMPTY = {
  first_name: '', last_name: '', preferred_name: '', date_of_birth: '', ndis_number: '',
  phone: '', email: '', location: '', state: '', bio: '',
  plan_start_date: '', plan_end_date: '', funding_type: '', funding_ratio: '', support_level: '',
  primary_disability: '', secondary_disability: '',
  communication_needs: '', mobility: '', dietary_requirements: '', allergies: '',
  medications_summary: '', medicare_number: '', cultural_considerations: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
  gp_name: '', gp_phone: '', gp_clinic: '',
  bsp_name: '', bsp_phone: '', bsp_organisation: '',
  support_coordinator_name: '', support_coordinator_phone: '', support_coordinator_organisation: '',
  occupational_therapist: '', speech_pathologist: '', psychologist: '',
  plan_manager_name: '', plan_manager_organisation: '',
  assigned_staff: '', status: 'active',
};

export default function ParticipantModal({ isOpen, onClose, onSaved, participant }) {
  const isEdit = !!participant?.id;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (participant) {
        const f = { ...EMPTY };
        for (const key of Object.keys(EMPTY)) {
          if (participant[key] !== null && participant[key] !== undefined) {
            f[key] = participant[key];
          }
        }
        setForm(f);
      } else {
        setForm(EMPTY);
      }
      setError('');
    }
  }, [isOpen, participant]);

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await updateParticipant(participant.id, form);
      } else {
        await createParticipant(form);
      }
      onSaved();
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
      title={isEdit ? 'Edit Participant' : 'Add Participant'}
      icon={HiUserPlus}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ModalError message={error} />
          <div className="space-y-8">
            {/* Personal Details */}
            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Personal Details</legend>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">First Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)} required autoFocus className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)} required className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Preferred Name</label>
                  <input type="text" value={form.preferred_name} onChange={e => set('preferred_name', e.target.value)} placeholder="What they like to be called" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">NDIS Number</label>
                  <input type="text" value={form.ndis_number} onChange={e => set('ndis_number', e.target.value)} placeholder="e.g. 431234567" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white font-mono" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Medicare Number</label>
                  <input type="text" value={form.medicare_number} onChange={e => set('medicare_number', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white font-mono" />
                </div>
              </div>
            </fieldset>

            {/* Contact */}
            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Contact</legend>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Location / Suburb</label>
                  <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Parramatta, Bankstown" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white">
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
            </fieldset>

            {/* Plan Details */}
            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Plan & Support</legend>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Plan Start Date</label>
                  <input type="date" value={form.plan_start_date} onChange={e => set('plan_start_date', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Plan End Date</label>
                  <input type="date" value={form.plan_end_date} onChange={e => set('plan_end_date', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Funding Type</label>
                  <select value={form.funding_type} onChange={e => set('funding_type', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white">
                    <option value="">Select...</option>
                    <option>Self-managed</option>
                    <option>Plan-managed</option>
                    <option>NDIA-managed</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Funding Ratio</label>
                  <select value={form.funding_ratio} onChange={e => set('funding_ratio', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white">
                    <option value="">Select...</option>
                    <option>1:1</option>
                    <option>1:2</option>
                    <option>1:3</option>
                    <option>2:1</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Support Level</label>
                  <select value={form.support_level} onChange={e => set('support_level', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white">
                    <option value="">Select...</option>
                    <option>Standard</option>
                    <option>High</option>
                    <option>Complex</option>
                  </select>
                </div>
                {isEdit && (
                  <div>
                    <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                    <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="exited">Exited</option>
                    </select>
                  </div>
                )}
              </div>
            </fieldset>

            {/* Disability & Needs */}
            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Disability & Needs</legend>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Primary Disability</label>
                  <input type="text" value={form.primary_disability} onChange={e => set('primary_disability', e.target.value)} placeholder="e.g. Intellectual Disability" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Secondary Disability</label>
                  <input type="text" value={form.secondary_disability} onChange={e => set('secondary_disability', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Communication Needs</label>
                  <input type="text" value={form.communication_needs} onChange={e => set('communication_needs', e.target.value)} placeholder="e.g. Verbal, AAC device, Auslan" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Mobility</label>
                  <input type="text" value={form.mobility} onChange={e => set('mobility', e.target.value)} placeholder="e.g. Independent, Wheelchair, Walker" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Dietary Requirements</label>
                  <input type="text" value={form.dietary_requirements} onChange={e => set('dietary_requirements', e.target.value)} placeholder="e.g. Halal, Gluten-free, Texture modified" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Allergies</label>
                  <input type="text" value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="e.g. Penicillin, Nuts" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Medications Summary</label>
                  <textarea value={form.medications_summary} onChange={e => set('medications_summary', e.target.value)} rows={2} placeholder="Current medications..." className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white placeholder-slate-400 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Cultural / Language Considerations</label>
                  <input type="text" value={form.cultural_considerations} onChange={e => set('cultural_considerations', e.target.value)} placeholder="e.g. Language, cultural practices, religious needs" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
              </div>
            </fieldset>

            {/* Support Team */}
            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Support Team</legend>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-3 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Behaviour Support Practitioner</div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                  <input type="text" value={form.bsp_name} onChange={e => set('bsp_name', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input type="tel" value={form.bsp_phone} onChange={e => set('bsp_phone', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Organisation</label>
                  <input type="text" value={form.bsp_organisation} onChange={e => set('bsp_organisation', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>

                <div className="col-span-3 mt-2 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Support Coordinator</div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                  <input type="text" value={form.support_coordinator_name} onChange={e => set('support_coordinator_name', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input type="tel" value={form.support_coordinator_phone} onChange={e => set('support_coordinator_phone', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Organisation</label>
                  <input type="text" value={form.support_coordinator_organisation} onChange={e => set('support_coordinator_organisation', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>

                <div className="col-span-3 mt-2 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Plan Manager</div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                  <input type="text" value={form.plan_manager_name} onChange={e => set('plan_manager_name', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Organisation</label>
                  <input type="text" value={form.plan_manager_organisation} onChange={e => set('plan_manager_organisation', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div />

                <div className="col-span-3 mt-2 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Allied Health</div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Occupational Therapist</label>
                  <input type="text" value={form.occupational_therapist} onChange={e => set('occupational_therapist', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Speech Pathologist</label>
                  <input type="text" value={form.speech_pathologist} onChange={e => set('speech_pathologist', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Psychologist</label>
                  <input type="text" value={form.psychologist} onChange={e => set('psychologist', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>

                <div className="col-span-3 mt-2">
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assigned Key Worker</label>
                  <input type="text" value={form.assigned_staff} onChange={e => set('assigned_staff', e.target.value)} placeholder="Primary support worker" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
              </div>
            </fieldset>

            {/* Emergency Contact */}
            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Emergency Contact</legend>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                  <input type="text" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input type="tel" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Relationship</label>
                  <input type="text" value={form.emergency_contact_relationship} onChange={e => set('emergency_contact_relationship', e.target.value)} placeholder="e.g. Mother" className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
              </div>
            </fieldset>

            {/* GP Details */}
            <fieldset>
              <legend className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">GP / Medical</legend>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">GP Name</label>
                  <input type="text" value={form.gp_name} onChange={e => set('gp_name', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">GP Phone</label>
                  <input type="tel" value={form.gp_phone} onChange={e => set('gp_phone', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">GP Clinic</label>
                  <input type="text" value={form.gp_clinic} onChange={e => set('gp_clinic', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white" />
                </div>
              </div>
            </fieldset>

            {/* Bio */}
            <div>
              <label className="mb-2.5 block text-sm font-semibold text-slate-900 dark:text-white">Bio / Additional Notes</label>
              <textarea
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                rows={3}
                placeholder="Interests, preferences, important information about the participant..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white placeholder-slate-400 resize-none"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" loading={saving}>{isEdit ? 'Save Changes' : 'Add Participant'}</ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
