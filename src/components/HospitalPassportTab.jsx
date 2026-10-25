import { useState, useEffect } from 'react';
import {
  HiPencilSquare, HiArrowDownTray, HiPlus, HiTrash,
  HiDocumentText, HiHeart, HiExclamationTriangle,
  HiClock, HiMapPin, HiPhone, HiCheckCircle, HiHome,
} from 'react-icons/hi2';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from './ui/Modal';
import { FormInput, FormTextarea, FormSelect, FormRow, FormDivider } from './ui/FormComponents';
import { fetchHospitalPassport, saveHospitalPassport } from '../lib/api';
import jsPDF from 'jspdf';

const EMPTY_PASSPORT = {
  provider_name: 'One Life Foundation',
  provider_phone: '1300 ONE LIFE (1300 663 543)',
  provider_email: 'info@onelifefoundation.com.au',
  provider_address: '59 Severn Street, Epping VIC 3076',
  provider_service: 'Supported Independent Living (SIL)',
  communication_style: '',
  communication_aids: '',
  things_i_like: '',
  things_i_dont_like: '',
  things_that_upset_me: '',
  things_that_calm_me: '',
  diagnoses: '',
  medical_conditions: '',
  medical_restrictions: '',
  pain_indicators: '',
  seizure_info: '',
  nfr_status: 'full_code', // 'full_code', 'nfr', or 'limited'
  nfr_notes: '',
  mobility_transfers: '',
  equipment_aids: '',
  eating_drinking: '',
  personal_care_needs: '',
  behaviour_triggers: '',
  behaviour_strategies: '',
  routine_appointments: [],
  additional_notes: '',
};

const EMPTY_APPOINTMENT = {
  name: '',
  frequency: '',
  time: '',
  location: '',
  transport: '',
  notes: '',
};

// ─── OLF Brand Colors (PDF) ─────────────────────────────────────────────────
const OLF_NAVY = [15, 82, 138];
const OLF_GREEN = [14, 160, 62];
const WHITE = [255, 255, 255];
const DARK_TEXT = [30, 41, 59];
const MED_TEXT = [71, 85, 105];
const LIGHT_TEXT = [148, 163, 184];
const BORDER = [226, 232, 240];
const RED_BG = [254, 242, 242];
const RED_BORDER = [239, 68, 68];
const RED_TEXT = [153, 27, 27];
const BLUE_BG = [239, 246, 255];
const LABEL_BG = [245, 247, 250];

export default function HospitalPassportTab({ participant, contacts, medications, profile }) {
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_PASSPORT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [exporting, setExporting] = useState(false);

  // Appointment modal
  const [apptOpen, setApptOpen] = useState(false);
  const [apptForm, setApptForm] = useState(EMPTY_APPOINTMENT);
  const [editApptIdx, setEditApptIdx] = useState(-1);

  useEffect(() => {
    loadPassport();
  }, [participant?.id]);

  async function loadPassport() {
    if (!participant?.id) return;
    setLoading(true);
    setLoadError('');
    try {
      // fetchHospitalPassport returns null on a real 404 (no passport yet) and throws on anything else
      const data = await fetchHospitalPassport(participant.id);
      setPassport(data);
      if (data) {
        setForm({
          ...EMPTY_PASSPORT,
          ...data,
          routine_appointments: Array.isArray(data.routine_appointments) ? data.routine_appointments : [],
        });
      }
    } catch (err) {
      // A failed load must NOT look like "no passport" — Create would upsert a blank one over the real record
      setPassport(null);
      setLoadError(err.message || 'Could not load the hospital passport');
    } finally {
      setLoading(false);
    }
  }

  function openEditor() {
    if (passport) {
      setForm({
        ...EMPTY_PASSPORT,
        ...passport,
        routine_appointments: Array.isArray(passport.routine_appointments) ? passport.routine_appointments : [],
      });
    } else {
      // Pre-fill from participant data
      setForm({
        ...EMPTY_PASSPORT,
        communication_style: participant.communication_needs || '',
        diagnoses: [participant.primary_disability, participant.secondary_disability].filter(Boolean).join(', '),
        mobility_transfers: participant.mobility || '',
        eating_drinking: participant.dietary_requirements || '',
        medical_restrictions: participant.allergies || '',
      });
    }
    setError('');
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = await saveHospitalPassport({
        participant_id: participant.id,
        ...form,
        last_updated_by: profile?.full_name || profile?.email || 'Staff',
      });
      setPassport(saved);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddAppointment() {
    if (!apptForm.name.trim()) return;
    const appts = [...form.routine_appointments];
    if (editApptIdx >= 0) {
      appts[editApptIdx] = { ...apptForm };
    } else {
      appts.push({ ...apptForm });
    }
    setForm(f => ({ ...f, routine_appointments: appts }));
    setApptForm(EMPTY_APPOINTMENT);
    setApptOpen(false);
    setEditApptIdx(-1);
  }

  function handleEditAppointment(idx) {
    setApptForm({ ...form.routine_appointments[idx] });
    setEditApptIdx(idx);
    setApptOpen(true);
  }

  function handleDeleteAppointment(idx) {
    setForm(f => ({
      ...f,
      routine_appointments: f.routine_appointments.filter((_, i) => i !== idx),
    }));
  }

  // ─── PDF Generation ─────────────────────────────────────────────────────────
  async function handleExportPDF() {
    setExporting(true);
    try {
      await generatePassportPDF(participant, passport || form, contacts, medications);
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  const data = passport || null;
  const appts = data?.routine_appointments || [];
  const hasData = !!data;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
        </div>
      ) : (
      <>
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <HiDocumentText className="h-4 w-4 text-brand-500" />
            Hospital Passport
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Essential information for transport, hospital & appointment staff
          </p>
        </div>
        <div className="flex gap-3">
          {hasData && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#263554] transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-400" />
              ) : (
                <HiArrowDownTray className="h-4 w-4" />
              )}
              Download PDF
            </button>
          )}
          {!loadError && (
            <button
              onClick={openEditor}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
            >
              {hasData ? <HiPencilSquare className="h-4 w-4" /> : <HiPlus className="h-4 w-4" />}
              {hasData ? 'Edit Passport' : 'Create Passport'}
            </button>
          )}
        </div>
      </div>

      {/* Load error — never show Create here, the passport may exist */}
      {loadError && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-8 text-center">
          <HiExclamationTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Could not load the hospital passport</p>
          <p className="mt-1 text-xs text-red-500 dark:text-red-400/80">{loadError}</p>
          <button
            onClick={loadPassport}
            className="mt-4 inline-flex items-center rounded-lg bg-white dark:bg-[#162036] border border-red-200 dark:border-red-900/40 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!hasData && !loadError && (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <HiDocumentText className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No Hospital Passport created yet</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Create a hospital passport with essential information for ambulance,<br />
            transport and hospital staff attending to {participant.first_name}.
          </p>
        </div>
      )}

      {/* Display Mode */}
      {hasData && (
        <div className="space-y-5">
          {/* Routine Appointments */}
          {appts.length > 0 && (
            <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/10 p-6">
              <h4 className="text-sm font-semibold text-brand-700 dark:text-brand-400 flex items-center gap-2 mb-4">
                <HiClock className="h-4 w-4" /> Routine Appointments
              </h4>
              <div className="space-y-3">
                {appts.map((appt, i) => (
                  <div key={i} className="rounded-lg border border-brand-200 dark:border-brand-800 bg-white dark:bg-[#162036] p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{appt.name}</p>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                          {appt.frequency && <span className="flex items-center gap-1"><HiClock className="h-3 w-3" /> {appt.frequency}</span>}
                          {appt.time && <span>{appt.time}</span>}
                          {appt.location && <span className="flex items-center gap-1"><HiMapPin className="h-3 w-3" /> {appt.location}</span>}
                          {appt.transport && <span className="rounded-full bg-brand-100 dark:bg-brand-900/30 px-2 py-0.5 text-brand-700 dark:text-brand-400 font-medium">{appt.transport}</span>}
                        </div>
                        {appt.notes && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{appt.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support Provider */}
          <div className="rounded-xl border-2 border-accent-200 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/10 p-6">
            <h4 className="text-sm font-semibold text-accent-700 dark:text-accent-400 flex items-center gap-2 mb-3">
              <HiHome className="h-4 w-4" /> Support Provider
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {data.provider_name && <div><span className="text-slate-500 dark:text-slate-400">Provider:</span> <span className="font-medium text-slate-800 dark:text-white">{data.provider_name}</span></div>}
              {data.provider_phone && <div><span className="text-slate-500 dark:text-slate-400">Phone:</span> <span className="font-medium text-slate-800 dark:text-white">{data.provider_phone}</span></div>}
              {data.provider_email && <div><span className="text-slate-500 dark:text-slate-400">Email:</span> <span className="font-medium text-slate-800 dark:text-white">{data.provider_email}</span></div>}
              {data.provider_address && <div><span className="text-slate-500 dark:text-slate-400">Address:</span> <span className="font-medium text-slate-800 dark:text-white">{data.provider_address}</span></div>}
              {data.provider_service && <div><span className="text-slate-500 dark:text-slate-400">Service:</span> <span className="font-medium text-slate-800 dark:text-white">{data.provider_service}</span></div>}
            </div>
          </div>

          {/* NFR Status Banner */}
          {data.nfr_status && data.nfr_status !== 'full_code' && (
            <div className={`rounded-xl border-2 p-5 ${
              data.nfr_status === 'nfr'
                ? 'border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                : 'border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
            }`}>
              <div className="flex items-center gap-3">
                <HiExclamationTriangle className={`h-6 w-6 flex-shrink-0 ${data.nfr_status === 'nfr' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                <div>
                  <p className={`text-sm font-bold ${data.nfr_status === 'nfr' ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
                    {data.nfr_status === 'nfr' ? 'NOT FOR RESUSCITATION (NFR)' : 'LIMITED TREATMENT'}
                  </p>
                  {data.nfr_notes && (
                    <p className={`mt-1 text-sm ${data.nfr_status === 'nfr' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {data.nfr_notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Sections */}
          <div className="grid gap-5 lg:grid-cols-2">
            <PassportSection title="Communication" icon={HiDocumentText} color="text-blue-500">
              <PassportField label="Communication Style" value={data.communication_style} />
              <PassportField label="Communication Aids" value={data.communication_aids} />
            </PassportSection>

            <PassportSection title="Things to Know" icon={HiHeart} color="text-pink-500">
              <PassportField label="Things I Like" value={data.things_i_like} />
              <PassportField label="Things I Don't Like" value={data.things_i_dont_like} />
              <PassportField label="Things That Upset Me" value={data.things_that_upset_me} />
              <PassportField label="Things That Calm Me" value={data.things_that_calm_me} />
            </PassportSection>

            <PassportSection title="Medical" icon={HiExclamationTriangle} color="text-red-500">
              <PassportField label="Diagnoses" value={data.diagnoses} />
              <PassportField label="Medical Conditions" value={data.medical_conditions} />
              <PassportField label="Medical Restrictions" value={data.medical_restrictions} />
              <PassportField label="Pain Indicators" value={data.pain_indicators} />
              <PassportField label="Seizure Information" value={data.seizure_info} />
            </PassportSection>

            <PassportSection title="Mobility & Personal Care" icon={HiDocumentText} color="text-emerald-500">
              <PassportField label="Mobility & Transfers" value={data.mobility_transfers} />
              <PassportField label="Equipment & Aids" value={data.equipment_aids} />
              <PassportField label="Eating & Drinking" value={data.eating_drinking} />
              <PassportField label="Personal Care Needs" value={data.personal_care_needs} />
            </PassportSection>

            <PassportSection title="Behaviour Support" icon={HiDocumentText} color="text-amber-500">
              <PassportField label="Triggers" value={data.behaviour_triggers} />
              <PassportField label="Strategies" value={data.behaviour_strategies} />
            </PassportSection>

            {data.additional_notes && (
              <PassportSection title="Additional Notes" icon={HiDocumentText} color="text-slate-500">
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{data.additional_notes}</p>
              </PassportSection>
            )}
          </div>

          {/* Last Updated */}
          {data.updated_at && (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
              Last updated: {new Date(data.updated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              {data.last_updated_by && ` by ${data.last_updated_by}`}
            </p>
          )}
        </div>
      )}
      </>
      )}

      {/* ═══ Edit Modal ═══ */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Hospital Passport" icon={HiDocumentText} size="xl">
        <form onSubmit={handleSave}>
          <ModalBody>
            <ModalError message={error} />
            <div className="space-y-8">
              {/* Support Provider (editable) */}
              <div>
                <p className="text-[10px] font-bold text-accent-600 dark:text-accent-400 uppercase tracking-wider mb-4">Support Provider (Direct Contact)</p>
                <div className="space-y-6">
                  <FormRow>
                    <FormInput label="Provider Name" value={form.provider_name} onChange={e => setForm(f => ({ ...f, provider_name: e.target.value }))} placeholder="One Life Foundation" />
                    <FormInput label="Phone" value={form.provider_phone} onChange={e => setForm(f => ({ ...f, provider_phone: e.target.value }))} placeholder="1300 ONE LIFE (1300 663 543)" />
                  </FormRow>
                  <FormRow>
                    <FormInput label="Email" value={form.provider_email} onChange={e => setForm(f => ({ ...f, provider_email: e.target.value }))} placeholder="info@onelifefoundation.com.au" />
                    <FormInput label="Service Type" value={form.provider_service} onChange={e => setForm(f => ({ ...f, provider_service: e.target.value }))} placeholder="Supported Independent Living (SIL)" />
                  </FormRow>
                  <FormInput label="Address" value={form.provider_address} onChange={e => setForm(f => ({ ...f, provider_address: e.target.value }))} placeholder="59 Severn Street, Epping VIC 3076" />
                </div>
              </div>

              <FormDivider />

              {/* Routine Appointments */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Routine Appointments</p>
                  <button
                    type="button"
                    onClick={() => { setApptForm(EMPTY_APPOINTMENT); setEditApptIdx(-1); setApptOpen(true); }}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-50 dark:bg-brand-900/20 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                  >
                    <HiPlus className="h-3 w-3" /> Add Appointment
                  </button>
                </div>
                {form.routine_appointments.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">No routine appointments added</p>
                ) : (
                  <div className="space-y-2">
                    {form.routine_appointments.map((appt, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#1e2d4a] px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{appt.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {[appt.frequency, appt.time, appt.location, appt.transport].filter(Boolean).join(' | ')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => handleEditAppointment(i)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-[#263554] hover:text-brand-500 transition-colors">
                            <HiPencilSquare className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleDeleteAppointment(i)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                            <HiTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormDivider />

              {/* Communication */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Communication</p>
                <div className="space-y-6">
                  <FormTextarea label="How I Communicate" rows={3} value={form.communication_style} onChange={e => setForm(f => ({ ...f, communication_style: e.target.value }))} placeholder="e.g. Uses short sentences, may take time to respond, uses gestures..." />
                  <FormInput label="Communication Aids" value={form.communication_aids} onChange={e => setForm(f => ({ ...f, communication_aids: e.target.value }))} placeholder="e.g. Communication board, iPad with AAC app, hearing aid..." />
                </div>
              </div>

              <FormDivider />

              {/* Things to Know */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Things to Know About Me</p>
                <div className="space-y-6">
                  <FormTextarea label="Things I Like" rows={2} value={form.things_i_like} onChange={e => setForm(f => ({ ...f, things_i_like: e.target.value }))} placeholder="e.g. Music, being called by my nickname, having things explained..." />
                  <FormTextarea label="Things I Don't Like" rows={2} value={form.things_i_dont_like} onChange={e => setForm(f => ({ ...f, things_i_dont_like: e.target.value }))} placeholder="e.g. Loud noises, being rushed, people talking over me..." />
                  <FormTextarea label="Things That Upset Me" rows={2} value={form.things_that_upset_me} onChange={e => setForm(f => ({ ...f, things_that_upset_me: e.target.value }))} placeholder="e.g. Changes to routine, unfamiliar environments, being touched without warning..." />
                  <FormTextarea label="Things That Calm Me" rows={2} value={form.things_that_calm_me} onChange={e => setForm(f => ({ ...f, things_that_calm_me: e.target.value }))} placeholder="e.g. Familiar music, quiet voice, having a familiar object..." />
                </div>
              </div>

              <FormDivider />

              {/* Medical */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Medical Information</p>
                <div className="space-y-6">
                  {/* NFR Status */}
                  <div>
                    <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Resuscitation Status
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'full_code', label: 'Full Code', desc: 'All resuscitation measures' },
                        { value: 'nfr', label: 'NFR', desc: 'Not for resuscitation' },
                        { value: 'limited', label: 'Limited', desc: 'Limited treatment plan' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, nfr_status: opt.value }))}
                          className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                            form.nfr_status === opt.value
                              ? opt.value === 'nfr'
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : opt.value === 'limited'
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                : 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-slate-200 dark:border-[#334766] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                          }`}
                        >
                          <p className={`text-sm font-semibold ${
                            form.nfr_status === opt.value
                              ? opt.value === 'nfr' ? 'text-red-700 dark:text-red-300' : opt.value === 'limited' ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}>{opt.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.nfr_status !== 'full_code' && (
                    <FormTextarea
                      label="NFR/Limited Treatment Notes"
                      rows={2}
                      value={form.nfr_notes}
                      onChange={e => setForm(f => ({ ...f, nfr_notes: e.target.value }))}
                      placeholder="e.g. As per ACD dated 01/03/2025. GP: Dr Smith. Guardian/NOK aware and consenting."
                    />
                  )}
                  <FormTextarea label="Key Diagnoses" rows={2} value={form.diagnoses} onChange={e => setForm(f => ({ ...f, diagnoses: e.target.value }))} placeholder="e.g. End-stage renal disease, Type 2 diabetes..." />
                  <FormTextarea label="Other Medical Conditions" rows={2} value={form.medical_conditions} onChange={e => setForm(f => ({ ...f, medical_conditions: e.target.value }))} placeholder="e.g. Hypertension, mild hearing loss in left ear..." />
                  <FormTextarea label="Medical Restrictions" rows={2} value={form.medical_restrictions} onChange={e => setForm(f => ({ ...f, medical_restrictions: e.target.value }))} placeholder="e.g. Fluid restriction 1.5L/day, no NSAIDs, fistula in left arm - DO NOT use for BP or cannula..." />
                  <FormTextarea label="How I Show Pain" rows={2} value={form.pain_indicators} onChange={e => setForm(f => ({ ...f, pain_indicators: e.target.value }))} placeholder="e.g. Becomes quiet, grimaces, holds affected area, may become agitated..." />
                  <FormTextarea label="Seizure Information" rows={2} value={form.seizure_info} onChange={e => setForm(f => ({ ...f, seizure_info: e.target.value }))} placeholder="Leave blank if not applicable. e.g. Has tonic-clonic seizures, rescue medication is midazolam..." />
                </div>
              </div>

              <FormDivider />

              {/* Mobility & Personal Care */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Mobility & Personal Care</p>
                <div className="space-y-6">
                  <FormTextarea label="Mobility & Transfers" rows={2} value={form.mobility_transfers} onChange={e => setForm(f => ({ ...f, mobility_transfers: e.target.value }))} placeholder="e.g. Walks independently with walking frame, needs 1-assist for transfers..." />
                  <FormInput label="Equipment & Aids" value={form.equipment_aids} onChange={e => setForm(f => ({ ...f, equipment_aids: e.target.value }))} placeholder="e.g. Walking frame, wheelchair for long distances, glasses..." />
                  <FormTextarea label="Eating & Drinking" rows={2} value={form.eating_drinking} onChange={e => setForm(f => ({ ...f, eating_drinking: e.target.value }))} placeholder="e.g. Normal diet, thickened fluids, needs food cut into small pieces, aspiration risk..." />
                  <FormTextarea label="Personal Care Needs" rows={2} value={form.personal_care_needs} onChange={e => setForm(f => ({ ...f, personal_care_needs: e.target.value }))} placeholder="e.g. Requires assistance with toileting, wears continence aids, needs prompting for hygiene..." />
                </div>
              </div>

              <FormDivider />

              {/* Behaviour Support */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Behaviour Support</p>
                <div className="space-y-6">
                  <FormTextarea label="Triggers" rows={2} value={form.behaviour_triggers} onChange={e => setForm(f => ({ ...f, behaviour_triggers: e.target.value }))} placeholder="e.g. Long waits, sudden changes, feeling unheard..." />
                  <FormTextarea label="Strategies That Help" rows={2} value={form.behaviour_strategies} onChange={e => setForm(f => ({ ...f, behaviour_strategies: e.target.value }))} placeholder="e.g. Give clear instructions, allow processing time, offer choices..." />
                </div>
              </div>

              <FormDivider />

              {/* Additional */}
              <div>
                <FormTextarea label="Additional Notes" rows={3} value={form.additional_notes} onChange={e => setForm(f => ({ ...f, additional_notes: e.target.value }))} placeholder="Any other important information for hospital or transport staff..." />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setEditing(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>
              {passport?.id ? 'Update Passport' : 'Create Passport'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ═══ Add Appointment Modal ═══ */}
      <Modal isOpen={apptOpen} onClose={() => { setApptOpen(false); setEditApptIdx(-1); }} title={editApptIdx >= 0 ? 'Edit Appointment' : 'Add Routine Appointment'} icon={HiClock} size="lg">
        <ModalBody>
          <div className="space-y-6">
            <FormInput label="Appointment Name" required value={apptForm.name} onChange={e => setApptForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Dialysis, Physiotherapy, GP Review" />
            <FormRow>
              <FormInput label="Frequency" value={apptForm.frequency} onChange={e => setApptForm(f => ({ ...f, frequency: e.target.value }))} placeholder="e.g. Mon / Wed / Fri, Weekly, Fortnightly" />
              <FormInput label="Time" value={apptForm.time} onChange={e => setApptForm(f => ({ ...f, time: e.target.value }))} placeholder="e.g. 7:00 AM, Morning" />
            </FormRow>
            <FormRow>
              <FormInput label="Location" value={apptForm.location} onChange={e => setApptForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Royal Melbourne Hospital, Dialysis Unit" />
              <FormInput label="Transport" value={apptForm.transport} onChange={e => setApptForm(f => ({ ...f, transport: e.target.value }))} placeholder="e.g. Ambulance, Family, Support Worker" />
            </FormRow>
            <FormTextarea label="Notes" rows={2} value={apptForm.notes} onChange={e => setApptForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Fasting required, bring medication list, arrives 30min early..." />
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => { setApptOpen(false); setEditApptIdx(-1); }}>Cancel</ButtonSecondary>
          <ButtonPrimary onClick={handleAddAppointment} disabled={!apptForm.name.trim()}>
            {editApptIdx >= 0 ? 'Update' : 'Add'} Appointment
          </ButtonPrimary>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── Display Helpers ──────────────────────────────────────────────────────────

function PassportSection({ title, icon: Icon, color, children }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        {Icon && <Icon className={`h-4 w-4 ${color}`} />}
        {title}
      </h4>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function PassportField({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF GENERATION — Hospital Passport
// ═══════════════════════════════════════════════════════════════════════════════

const PAGE_W = 210;
const PAGE_H = 297;
const ML = 16;
const MR = 16;
const MT = 14;
const CW = PAGE_W - ML - MR;
const HEADER_H = 26;
const FOOTER_H = 12;
const BODY_TOP = MT + HEADER_H + 4;
const BODY_BOTTOM = PAGE_H - MT - FOOTER_H;

function formatDateAU(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function generatePassportPDF(participant, passport, contacts, medications) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let pageNum = 1;
  let y = BODY_TOP;

  const fullName = `${participant.first_name || ''} ${participant.last_name || ''}`.trim();
  const ndis = participant.ndis_number || '';

  // ── Load logo ──
  let logoData = null;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = '/logo.png';
    });
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    logoData = c.toDataURL('image/png');
  } catch { /* skip logo */ }

  // ── Header ──
  function drawHeader() {
    pdf.setFillColor(...OLF_NAVY);
    pdf.rect(0, 0, PAGE_W, MT + HEADER_H, 'F');

    let textX = ML;
    if (logoData) {
      try { pdf.addImage(logoData, 'PNG', ML, MT + 2, 26, 13); } catch {}
      textX = ML + 30;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(...WHITE);
    pdf.text('HOSPITAL PASSPORT', textX, MT + 9);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(fullName, textX, MT + 17);

    if (ndis) {
      pdf.setFontSize(8);
      pdf.text(`NDIS: ${ndis}`, textX, MT + 22);
    }

    // Right side
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('One Life Foundation', PAGE_W - MR, MT + 9, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    const genDate = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    pdf.text(`Generated: ${genDate}`, PAGE_W - MR, MT + 15, { align: 'right' });
    pdf.setFontSize(6);
    pdf.text('CONFIDENTIAL', PAGE_W - MR, MT + 20, { align: 'right' });
  }

  // ── Footer ──
  function drawFooter() {
    const fy = PAGE_H - MT;
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.3);
    pdf.line(ML, fy - 4, PAGE_W - MR, fy - 4);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(...LIGHT_TEXT);
    pdf.text(`One Life Foundation  |  Hospital Passport  |  ${fullName}  |  NDIS: ${ndis}`, ML, fy);
    pdf.text(`Page ${pageNum}`, PAGE_W - MR, fy, { align: 'right' });
  }

  function newPage() {
    drawFooter();
    pdf.addPage();
    pageNum++;
    drawHeader();
    y = BODY_TOP;
  }

  function ensureSpace(needed) {
    if (y + needed > BODY_BOTTOM) newPage();
  }

  // ── Section heading with coloured bar ──
  function drawSectionBar(title, color = OLF_NAVY) {
    ensureSpace(12);
    pdf.setFillColor(...color);
    pdf.rect(ML, y, CW, 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...WHITE);
    pdf.text(title.toUpperCase(), ML + 3, y + 5);
    y += 9;
  }

  // ── Info table row ──
  function drawInfoRow(label, value) {
    if (!value) return;
    const valLines = pdf.splitTextToSize(String(value), CW - 48);
    const rowH = Math.max(6, valLines.length * 4.5 + 2);
    ensureSpace(rowH);

    // Label bg
    pdf.setFillColor(...LABEL_BG);
    pdf.rect(ML, y, 44, rowH, 'F');
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.2);
    pdf.rect(ML, y, CW, rowH, 'S');
    pdf.line(ML + 44, y, ML + 44, y + rowH);

    // Label text
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...MED_TEXT);
    pdf.text(label, ML + 2, y + 4);

    // Value text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...DARK_TEXT);
    let ty = y + 4;
    for (const line of valLines) {
      pdf.text(line, ML + 46, ty);
      ty += 4;
    }

    y += rowH;
  }

  // ── Alert box (red) ──
  function drawAlertBox(text) {
    if (!text) return;
    const lines = pdf.splitTextToSize(text, CW - 10);
    const boxH = lines.length * 4.5 + 6;
    ensureSpace(boxH + 2);

    pdf.setFillColor(...RED_BG);
    pdf.setDrawColor(...RED_BORDER);
    pdf.setLineWidth(0.5);
    pdf.rect(ML, y, CW, boxH, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...RED_TEXT);
    let ty = y + 5;
    for (const line of lines) {
      pdf.text(line, ML + 5, ty);
      ty += 4.5;
    }
    y += boxH + 2;
  }

  // ── Wrapped text block ──
  function drawTextBlock(text, bold = false) {
    if (!text) return;
    const lines = pdf.splitTextToSize(text, CW - 4);
    for (const line of lines) {
      ensureSpace(5);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...DARK_TEXT);
      pdf.text(line, ML + 2, y + 4);
      y += 4.5;
    }
    y += 1;
  }

  // ═══ Build the PDF ═══

  drawHeader();

  // ── 1. Participant Details ──
  drawSectionBar('Participant Details');
  drawInfoRow('Full Name', fullName);
  if (participant.preferred_name) drawInfoRow('Preferred Name', participant.preferred_name);
  drawInfoRow('Date of Birth', participant.date_of_birth ? new Date(participant.date_of_birth + 'T00:00:00').toLocaleDateString('en-AU') : null);
  drawInfoRow('NDIS Number', ndis);
  if (participant.medicare_number) drawInfoRow('Medicare Number', participant.medicare_number);
  drawInfoRow('Address', participant.location);
  drawInfoRow('Phone', participant.phone);
  y += 3;

  // ── Support Provider ──
  drawSectionBar('Support Provider', OLF_GREEN);
  drawInfoRow('Provider', passport.provider_name || 'One Life Foundation');
  drawInfoRow('Phone', passport.provider_phone || '1300 ONE LIFE (1300 663 543)');
  drawInfoRow('Email', passport.provider_email || 'info@onelifefoundation.com.au');
  drawInfoRow('Address', passport.provider_address || '59 Severn Street, Epping VIC 3076');
  drawInfoRow('Service Type', passport.provider_service || 'Supported Independent Living (SIL)');
  y += 3;

  // ── Emergency Contact (NOK/Family only) ──
  if (participant.emergency_contact_name) {
    drawSectionBar('Emergency Contact / Next of Kin', [220, 38, 38]);
    drawInfoRow('Name', `${participant.emergency_contact_name}${participant.emergency_contact_relationship ? ` (${participant.emergency_contact_relationship})` : ''}`);
    if (participant.emergency_contact_phone) drawInfoRow('Phone', participant.emergency_contact_phone);
    // GP
    if (participant.gp_name) {
      drawInfoRow('GP', `${participant.gp_name}${participant.gp_clinic ? ` (${participant.gp_clinic})` : ''}`);
      if (participant.gp_phone) drawInfoRow('GP Phone', participant.gp_phone);
    }
    y += 3;
  }


  // ── 3. Routine Appointments ──
  const appts = passport.routine_appointments || [];
  if (appts.length > 0) {
    drawSectionBar('Routine Appointments', [15, 118, 110]); // teal
    for (const appt of appts) {
      ensureSpace(18);
      // Appointment name bold
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...DARK_TEXT);
      pdf.text(appt.name, ML + 2, y + 4);
      y += 6;

      if (appt.frequency) drawInfoRow('Frequency', appt.frequency);
      if (appt.time) drawInfoRow('Time', appt.time);
      if (appt.location) drawInfoRow('Location', appt.location);
      if (appt.transport) drawInfoRow('Transport', appt.transport);
      if (appt.notes) drawInfoRow('Notes', appt.notes);
      y += 2;
    }
    y += 1;
  }

  // ── Resuscitation Status (always shown) ──
  const nfrStatus = passport.nfr_status || 'full_code';
  if (nfrStatus === 'nfr' || nfrStatus === 'limited') {
    drawSectionBar('RESUSCITATION STATUS', [220, 38, 38]);
    const nfrLabel = nfrStatus === 'nfr' ? 'NOT FOR RESUSCITATION (NFR)' : 'LIMITED TREATMENT';
    drawAlertBox(nfrLabel + (passport.nfr_notes ? '\n' + passport.nfr_notes : ''));
  } else {
    drawSectionBar('RESUSCITATION STATUS');
    drawInfoRow('Status', 'FULL CODE — All resuscitation measures');
  }
  y += 2;

  // ── 4. Medical Information ──
  if (passport.diagnoses || passport.medical_conditions || passport.medical_restrictions || passport.seizure_info) {
    drawSectionBar('Medical Information');
    if (passport.diagnoses) drawInfoRow('Diagnoses', passport.diagnoses);
    if (passport.medical_conditions) drawInfoRow('Other Conditions', passport.medical_conditions);
    if (passport.seizure_info) drawInfoRow('Seizure Info', passport.seizure_info);

    // Medical restrictions as alert box
    if (passport.medical_restrictions) {
      y += 2;
      drawAlertBox('MEDICAL RESTRICTIONS: ' + passport.medical_restrictions);
    }
    y += 3;
  }

  // ── 5. Medications ──
  const activeMeds = (medications || []).filter(m => m.status === 'active');
  if (activeMeds.length > 0) {
    drawSectionBar('Current Medications');
    for (const med of activeMeds) {
      const medDetail = [med.dosage, med.frequency, med.route && med.route !== 'oral' ? med.route : null].filter(Boolean).join(' | ') || 'See medication chart';
      drawInfoRow(med.medication_name || 'Medication', `${medDetail}${med.instructions ? '\n' + med.instructions : ''}`);
    }
    y += 3;
  }

  // ── 6. Allergies ──
  if (participant.allergies) {
    drawSectionBar('Allergies & Dietary', [220, 38, 38]);
    drawAlertBox('ALLERGIES: ' + participant.allergies);
    if (participant.dietary_requirements) drawInfoRow('Dietary Requirements', participant.dietary_requirements);
    y += 3;
  }

  // ── 7. Communication ──
  if (passport.communication_style || passport.communication_aids) {
    drawSectionBar('Communication');
    if (passport.communication_style) drawInfoRow('How I Communicate', passport.communication_style);
    if (passport.communication_aids) drawInfoRow('Communication Aids', passport.communication_aids);
    y += 3;
  }

  // ── 8. Things to Know ──
  if (passport.things_i_like || passport.things_i_dont_like || passport.things_that_upset_me || passport.things_that_calm_me) {
    drawSectionBar('Things to Know About Me', [124, 58, 237]); // purple
    if (passport.things_i_like) drawInfoRow('Things I Like', passport.things_i_like);
    if (passport.things_i_dont_like) drawInfoRow("Things I Don't Like", passport.things_i_dont_like);
    if (passport.things_that_upset_me) drawInfoRow('Things That Upset Me', passport.things_that_upset_me);
    if (passport.things_that_calm_me) drawInfoRow('Things That Calm Me', passport.things_that_calm_me);
    y += 3;
  }

  // ── 9. Pain Indicators ──
  if (passport.pain_indicators) {
    drawSectionBar('How I Show Pain');
    drawTextBlock(passport.pain_indicators);
    y += 3;
  }

  // ── 10. Mobility & Personal Care ──
  if (passport.mobility_transfers || passport.equipment_aids || passport.eating_drinking || passport.personal_care_needs) {
    drawSectionBar('Mobility & Personal Care');
    if (passport.mobility_transfers) drawInfoRow('Mobility & Transfers', passport.mobility_transfers);
    if (passport.equipment_aids) drawInfoRow('Equipment & Aids', passport.equipment_aids);
    if (passport.eating_drinking) drawInfoRow('Eating & Drinking', passport.eating_drinking);
    if (passport.personal_care_needs) drawInfoRow('Personal Care', passport.personal_care_needs);
    y += 3;
  }

  // ── 11. Behaviour Support ──
  if (passport.behaviour_triggers || passport.behaviour_strategies) {
    drawSectionBar('Behaviour Support', [245, 158, 11]); // amber
    if (passport.behaviour_triggers) drawInfoRow('Triggers', passport.behaviour_triggers);
    if (passport.behaviour_strategies) drawInfoRow('Strategies', passport.behaviour_strategies);
    y += 3;
  }

  // ── 12. Additional Notes ──
  if (passport.additional_notes) {
    drawSectionBar('Additional Notes');
    drawTextBlock(passport.additional_notes);
    y += 3;
  }

  // ── 13. Key Specialists ──
  const specs = [];
  if (participant.bsp_name) specs.push({ role: 'BSP', name: participant.bsp_name, phone: participant.bsp_phone });
  if (participant.support_coordinator_name) specs.push({ role: 'Support Coordinator', name: participant.support_coordinator_name, phone: participant.support_coordinator_phone });
  if (participant.occupational_therapist) specs.push({ role: 'Occupational Therapist', name: participant.occupational_therapist });
  if (participant.speech_pathologist) specs.push({ role: 'Speech Pathologist', name: participant.speech_pathologist });
  if (participant.psychologist) specs.push({ role: 'Psychologist', name: participant.psychologist });
  if (participant.pharmacy_name) specs.push({ role: 'Pharmacy', name: participant.pharmacy_name, phone: participant.pharmacy_phone });

  if (specs.length > 0) {
    drawSectionBar('Key Contacts & Specialists');
    for (const s of specs) {
      drawInfoRow(s.role, `${s.name}${s.phone ? ' — ' + s.phone : ''}`);
    }
    y += 3;
  }

  // ── Final Footer ──
  drawFooter();

  // Save
  const safeName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`Hospital_Passport_${safeName}.pdf`);
}
