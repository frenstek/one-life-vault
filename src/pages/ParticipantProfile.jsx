import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft, HiPencilSquare, HiTrash, HiPlus, HiDocumentText,
  HiPhone, HiEnvelope, HiMapPin, HiCalendarDays, HiHeart,
  HiShieldCheck, HiUser, HiClock, HiPaperClip, HiArrowDownTray,
  HiExclamationTriangle, HiChatBubbleBottomCenterText, HiArrowPath,
  HiXMark, HiCheckCircle, HiUserGroup,
} from 'react-icons/hi2';
import {
  fetchParticipant, updateParticipant, deleteParticipant,
  addParticipantNote, deleteParticipantNote,
  uploadParticipantFile, deleteParticipantFile, formatDate,
  fetchMedications, createMedication, updateMedication, deleteMedication,
  fetchParticipantContacts, createParticipantContact, deleteParticipantContact,
} from '../lib/api';
import ParticipantModal from '../components/ParticipantModal';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from '../components/ui/Modal';

const NOTE_TYPES = [
  { value: 'progress', label: 'Progress Note', color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' },
  { value: 'incident', label: 'Incident', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
  { value: 'handover', label: 'Handover', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  { value: 'general', label: 'General', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
];

const FILE_CATEGORIES = ['Care Plan', 'BSP', 'Service Agreement', 'Medical', 'NDIS Plan', 'General', 'Other'];

function formatBytes(bytes) {
  if (!bytes) return '--';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ParticipantProfile() {
  const { participantId } = useParams();
  const navigate = useNavigate();

  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Note form
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('progress');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState('');

  // File form
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileCategory, setFileCategory] = useState('General');
  const [fileNotes, setFileNotes] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  // Active tab
  const [tab, setTab] = useState('notes');

  // Medications
  const [meds, setMeds] = useState([]);
  const [medOpen, setMedOpen] = useState(false);
  const [medForm, setMedForm] = useState({ medication_name: '', dosage: '', frequency: '', route: 'oral', prescriber: '', pharmacy: '', instructions: '', status: 'active' });
  const [medSaving, setMedSaving] = useState(false);
  const [medError, setMedError] = useState('');

  // Contacts
  const [contacts, setContacts] = useState([]);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', contact_type: 'emergency', relationship: '', phone: '', email: '', organisation: '', is_primary: false });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState('');

  function load() {
    setLoading(true);
    Promise.all([
      fetchParticipant(participantId),
      fetchMedications(participantId).catch(() => []),
      fetchParticipantContacts(participantId).catch(() => []),
    ])
      .then(([data, medsData, contactsData]) => {
        setParticipant(data);
        setMeds(Array.isArray(medsData) ? medsData : []);
        setContacts(Array.isArray(contactsData) ? contactsData : []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [participantId]);

  async function handleDeleteParticipant() {
    setDeleting(true);
    try {
      await deleteParticipant(participantId);
      navigate('/participants');
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setNoteSaving(true);
    setNoteError('');
    try {
      await addParticipantNote({
        participant_id: participantId,
        content: noteContent,
        note_type: noteType,
        author: 'Staff',
      });
      setNoteContent('');
      setNoteType('progress');
      setNoteOpen(false);
      load();
    } catch (err) {
      setNoteError(err.message);
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleDeleteNote(noteId) {
    try {
      await deleteParticipantNote(noteId);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileData(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleUploadFile(e) {
    e.preventDefault();
    if (!fileData || !fileName) return;
    setFileUploading(true);
    setFileError('');
    try {
      await uploadParticipantFile({
        participant_id: participantId,
        fileData,
        fileName,
        category: fileCategory,
        notes: fileNotes || undefined,
      });
      setFileData(null);
      setFileName('');
      setFileCategory('General');
      setFileNotes('');
      setFileOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err) {
      setFileError(err.message);
    } finally {
      setFileUploading(false);
    }
  }

  async function handleDeleteFile(fileId) {
    try {
      await deleteParticipantFile(fileId);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddMedication(e) {
    e.preventDefault();
    setMedSaving(true);
    setMedError('');
    try {
      await createMedication({ participant_id: participantId, ...medForm });
      setMedForm({ medication_name: '', dosage: '', frequency: '', route: 'oral', prescriber: '', pharmacy: '', instructions: '', status: 'active' });
      setMedOpen(false);
      const medsData = await fetchMedications(participantId);
      setMeds(Array.isArray(medsData) ? medsData : []);
    } catch (err) {
      setMedError(err.message);
    } finally {
      setMedSaving(false);
    }
  }

  async function handleDeleteMedication(id) {
    try {
      await deleteMedication(id);
      setMeds(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggleMedStatus(med) {
    const newStatus = med.status === 'active' ? 'discontinued' : 'active';
    try {
      await updateMedication(med.id, { status: newStatus });
      setMeds(prev => prev.map(m => m.id === med.id ? { ...m, status: newStatus } : m));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddContact(e) {
    e.preventDefault();
    setContactSaving(true);
    setContactError('');
    try {
      await createParticipantContact({ participant_id: participantId, ...contactForm });
      setContactForm({ name: '', contact_type: 'emergency', relationship: '', phone: '', email: '', organisation: '', is_primary: false });
      setContactOpen(false);
      const contactsData = await fetchParticipantContacts(participantId);
      setContacts(Array.isArray(contactsData) ? contactsData : []);
    } catch (err) {
      setContactError(err.message);
    } finally {
      setContactSaving(false);
    }
  }

  async function handleDeleteContact(id) {
    try {
      await deleteParticipantContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-accent-500" />
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="py-16 text-center">
        <HiUser className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Participant not found</p>
        <Link to="/participants" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-500">
          <HiArrowLeft className="h-4 w-4" /> Back to Participants
        </Link>
      </div>
    );
  }

  const notesList = participant.progress_notes || [];
  const filesList = participant.files || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            to="/participants"
            className="mt-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <HiArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xl font-bold">
              {(participant.first_name?.[0] || '')}{(participant.last_name?.[0] || '')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {participant.first_name} {participant.last_name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                {participant.ndis_number && (
                  <span className="font-mono text-xs">{participant.ndis_number}</span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  participant.status === 'active'
                    ? 'bg-green-50 dark:bg-green-900/20 text-accent-500'
                    : participant.status === 'exited'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                }`}>
                  {participant.status === 'active' ? 'Active' : participant.status === 'exited' ? 'Exited' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
          >
            <HiPencilSquare className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <HiTrash className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Delete <strong>{participant.first_name} {participant.last_name}</strong> and all notes/files? This cannot be undone.
          </p>
          <div className="mt-4 flex gap-3">
            <button onClick={handleDeleteParticipant} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button onClick={() => setDeleteConfirm(false)} className="rounded-lg border border-slate-300 dark:border-[#334766] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300">Cancel</button>
          </div>
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact & Personal */}
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <HiUser className="h-4 w-4 text-brand-500" /> Contact Details
          </h3>
          {participant.preferred_name && <InfoRow label="Preferred Name" value={participant.preferred_name} />}
          <InfoRow icon={HiPhone} label="Phone" value={participant.phone} />
          <InfoRow icon={HiEnvelope} label="Email" value={participant.email} />
          <InfoRow icon={HiMapPin} label="Location" value={[participant.location, participant.state].filter(Boolean).join(', ') || null} />
          <InfoRow icon={HiCalendarDays} label="Date of Birth" value={participant.date_of_birth ? new Date(participant.date_of_birth).toLocaleDateString('en-AU') : null} />
          <InfoRow icon={HiShieldCheck} label="NDIS Number" value={participant.ndis_number} mono />
          <InfoRow label="Medicare Number" value={participant.medicare_number} mono />
        </div>

        {/* Plan & Funding */}
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <HiDocumentText className="h-4 w-4 text-brand-500" /> Plan Details
          </h3>
          <InfoRow icon={HiCalendarDays} label="Plan Start" value={participant.plan_start_date ? new Date(participant.plan_start_date).toLocaleDateString('en-AU') : null} />
          <InfoRow icon={HiCalendarDays} label="Plan End" value={participant.plan_end_date ? new Date(participant.plan_end_date).toLocaleDateString('en-AU') : null} />
          <InfoRow label="Funding Type" value={participant.funding_type} />
          <InfoRow label="Funding Ratio" value={participant.funding_ratio} />
          <InfoRow label="Support Level" value={participant.support_level} />
          <InfoRow label="Assigned Key Worker" value={participant.assigned_staff} />
        </div>

        {/* Emergency & Medical */}
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <HiHeart className="h-4 w-4 text-red-500" /> Emergency & Medical
          </h3>
          <InfoRow icon={HiExclamationTriangle} label="Emergency Contact" value={participant.emergency_contact_name} />
          <InfoRow icon={HiPhone} label="Emergency Phone" value={participant.emergency_contact_phone} />
          <InfoRow label="Relationship" value={participant.emergency_contact_relationship} />
          <div className="border-t border-slate-100 dark:border-[#263554] pt-4 mt-4 space-y-5">
            <InfoRow label="GP Name" value={participant.gp_name} />
            <InfoRow icon={HiPhone} label="GP Phone" value={participant.gp_phone} />
            <InfoRow label="GP Clinic" value={participant.gp_clinic} />
          </div>
        </div>
      </div>

      {/* Disability & Needs + Support Team */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Disability & Needs */}
        {(participant.primary_disability || participant.communication_needs || participant.mobility || participant.dietary_requirements || participant.allergies || participant.medications_summary || participant.cultural_considerations) && (
          <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 space-y-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <HiShieldCheck className="h-4 w-4 text-brand-500" /> Disability & Needs
            </h3>
            <InfoRow label="Primary Disability" value={participant.primary_disability} />
            <InfoRow label="Secondary Disability" value={participant.secondary_disability} />
            <InfoRow label="Communication" value={participant.communication_needs} />
            <InfoRow label="Mobility" value={participant.mobility} />
            <InfoRow label="Dietary Requirements" value={participant.dietary_requirements} />
            <InfoRow label="Allergies" value={participant.allergies} />
            <InfoRow label="Medications" value={participant.medications_summary} />
            <InfoRow label="Cultural / Language" value={participant.cultural_considerations} />
          </div>
        )}

        {/* Support Team */}
        {(participant.bsp_name || participant.support_coordinator_name || participant.plan_manager_name || participant.occupational_therapist || participant.speech_pathologist || participant.psychologist) && (
          <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 space-y-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <HiUserGroup className="h-4 w-4 text-brand-500" /> Support Team
            </h3>
            {participant.bsp_name && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Behaviour Support Practitioner</p>
                <InfoRow label="Name" value={participant.bsp_name} />
                <InfoRow icon={HiPhone} label="Phone" value={participant.bsp_phone} />
                <InfoRow label="Organisation" value={participant.bsp_organisation} />
              </div>
            )}
            {participant.support_coordinator_name && (
              <div className="border-t border-slate-100 dark:border-[#263554] pt-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Support Coordinator</p>
                <InfoRow label="Name" value={participant.support_coordinator_name} />
                <InfoRow icon={HiPhone} label="Phone" value={participant.support_coordinator_phone} />
                <InfoRow label="Organisation" value={participant.support_coordinator_organisation} />
              </div>
            )}
            {participant.plan_manager_name && (
              <div className="border-t border-slate-100 dark:border-[#263554] pt-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Plan Manager</p>
                <InfoRow label="Name" value={participant.plan_manager_name} />
                <InfoRow label="Organisation" value={participant.plan_manager_organisation} />
              </div>
            )}
            {(participant.occupational_therapist || participant.speech_pathologist || participant.psychologist) && (
              <div className="border-t border-slate-100 dark:border-[#263554] pt-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Allied Health</p>
                <InfoRow label="Occupational Therapist" value={participant.occupational_therapist} />
                <InfoRow label="Speech Pathologist" value={participant.speech_pathologist} />
                <InfoRow label="Psychologist" value={participant.psychologist} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bio */}
      {participant.bio && (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Bio / Notes</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {participant.bio}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-[#263554]">
        {[
          { id: 'notes', label: `Progress Notes (${notesList.length})`, icon: HiChatBubbleBottomCenterText },
          { id: 'files', label: `Files (${filesList.length})`, icon: HiPaperClip },
          { id: 'medications', label: `Medications (${meds.length})`, icon: HiHeart },
          { id: 'contacts', label: `Contacts (${contacts.length})`, icon: HiUserGroup },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Notes Tab */}
      {tab === 'notes' && (
        <div className="space-y-5">
          <button
            onClick={() => setNoteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
          >
            <HiPlus className="h-4 w-4" />
            Add Note
          </button>

          {notesList.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
              <HiChatBubbleBottomCenterText className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No progress notes yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notesList.map(note => {
                const typeCfg = NOTE_TYPES.find(t => t.value === note.note_type) || NOTE_TYPES[3];
                return (
                  <div key={note.id} className="group rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {note.author && <span className="font-medium text-slate-600 dark:text-slate-300">{note.author}</span>}
                          {note.author && ' — '}
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 group-hover:opacity-100"
                      >
                        <HiTrash className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Files Tab */}
      {tab === 'files' && (
        <div className="space-y-5">
          <button
            onClick={() => setFileOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
          >
            <HiPlus className="h-4 w-4" />
            Upload File
          </button>

          {filesList.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
              <HiPaperClip className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No files attached</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">File</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Size</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Uploaded</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                  {filesList.map(file => (
                    <tr key={file.id} className="group hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                            <HiDocumentText className="h-4 w-4 text-brand-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{file.file_name}</p>
                            {file.notes && <p className="text-xs text-slate-400 mt-0.5">{file.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          {file.category || 'General'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono">{formatBytes(file.size)}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(file.created_at)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {file.public_url && (
                            <a
                              href={file.public_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500 transition-colors"
                              title="Download"
                            >
                              <HiArrowDownTray className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="rounded-lg p-2 text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <HiTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Medications Tab */}
      {tab === 'medications' && (
        <div className="space-y-5">
          <button
            onClick={() => setMedOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
          >
            <HiPlus className="h-4 w-4" />
            Add Medication
          </button>

          {meds.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
              <HiHeart className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No medications recorded</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {meds.map(med => (
                <div key={med.id} className={`group rounded-xl border ${med.status === 'active' ? 'border-slate-200 dark:border-[#263554]' : 'border-slate-200/50 dark:border-[#263554]/50 opacity-70'} bg-white dark:bg-[#162036] p-6`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{med.medication_name}</h4>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{med.dosage} — {med.frequency}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        med.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : med.status === 'prn' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {med.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {med.route && <p><span className="font-medium text-slate-600 dark:text-slate-300">Route:</span> {med.route}</p>}
                    {med.prescriber && <p><span className="font-medium text-slate-600 dark:text-slate-300">Prescriber:</span> {med.prescriber}</p>}
                    {med.pharmacy && <p><span className="font-medium text-slate-600 dark:text-slate-300">Pharmacy:</span> {med.pharmacy}</p>}
                    {med.instructions && <p className="mt-2 italic">{med.instructions}</p>}
                  </div>
                  <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleToggleMedStatus(med)} className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1e2d4a] transition-colors">
                      {med.status === 'active' ? 'Discontinue' : 'Reactivate'}
                    </button>
                    <button onClick={() => handleDeleteMedication(med.id)} className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contacts Tab */}
      {tab === 'contacts' && (
        <div className="space-y-5">
          <button
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
          >
            <HiPlus className="h-4 w-4" />
            Add Contact
          </button>

          {contacts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
              <HiUserGroup className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No additional contacts</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map(c => {
                const typeLabels = { emergency: 'Emergency', gp: 'GP', specialist: 'Specialist', allied_health: 'Allied Health', guardian: 'Guardian', family: 'Family', other: 'Other' };
                const typeColors = { emergency: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400', gp: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', specialist: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400', allied_health: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400', guardian: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', family: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400', other: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' };
                return (
                  <div key={c.id} className="group rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h4>
                          {c.is_primary && <span className="rounded bg-highlight-400 px-1.5 py-0.5 text-[9px] font-bold text-slate-900">PRIMARY</span>}
                        </div>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${typeColors[c.contact_type] || typeColors.other}`}>
                          {typeLabels[c.contact_type] || c.contact_type}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 group-hover:opacity-100"
                      >
                        <HiTrash className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {c.relationship && <p>{c.relationship}</p>}
                      {c.phone && <p className="flex items-center gap-1.5"><HiPhone className="h-3 w-3" />{c.phone}</p>}
                      {c.email && <p className="flex items-center gap-1.5"><HiEnvelope className="h-3 w-3" />{c.email}</p>}
                      {c.organisation && <p className="font-medium text-slate-600 dark:text-slate-300">{c.organisation}</p>}
                      {c.notes && <p className="mt-2 italic">{c.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Medication Modal */}
      <Modal isOpen={medOpen} onClose={() => setMedOpen(false)} title="Add Medication" icon={HiHeart} iconColor="text-red-500" size="lg">
        <form onSubmit={handleAddMedication}>
          <ModalBody>
            <ModalError message={medError} />
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Medication Name <span className="text-red-500">*</span></label>
                  <input type="text" value={medForm.medication_name} onChange={e => setMedForm(p => ({ ...p, medication_name: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Dosage <span className="text-red-500">*</span></label>
                  <input type="text" value={medForm.dosage} onChange={e => setMedForm(p => ({ ...p, dosage: e.target.value }))} placeholder="e.g. 500mg" required />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Frequency <span className="text-red-500">*</span></label>
                  <input type="text" value={medForm.frequency} onChange={e => setMedForm(p => ({ ...p, frequency: e.target.value }))} placeholder="e.g. Twice daily" required />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Route</label>
                  <select value={medForm.route} onChange={e => setMedForm(p => ({ ...p, route: e.target.value }))}>
                    <option value="oral">Oral</option>
                    <option value="topical">Topical</option>
                    <option value="injection">Injection</option>
                    <option value="inhaled">Inhaled</option>
                    <option value="sublingual">Sublingual</option>
                    <option value="rectal">Rectal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Prescriber</label>
                  <input type="text" value={medForm.prescriber} onChange={e => setMedForm(p => ({ ...p, prescriber: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Pharmacy</label>
                  <input type="text" value={medForm.pharmacy} onChange={e => setMedForm(p => ({ ...p, pharmacy: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Instructions</label>
                <textarea value={medForm.instructions} onChange={e => setMedForm(p => ({ ...p, instructions: e.target.value }))} rows={3} placeholder="e.g. Take with food, avoid alcohol..." />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setMedOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={medSaving} disabled={!medForm.medication_name || !medForm.dosage || !medForm.frequency}>Add Medication</ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* Add Contact Modal */}
      <Modal isOpen={contactOpen} onClose={() => setContactOpen(false)} title="Add Contact" icon={HiUserGroup} size="lg">
        <form onSubmit={handleAddContact}>
          <ModalBody>
            <ModalError message={contactError} />
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Name <span className="text-red-500">*</span></label>
                  <input type="text" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Type</label>
                  <select value={contactForm.contact_type} onChange={e => setContactForm(p => ({ ...p, contact_type: e.target.value }))}>
                    <option value="emergency">Emergency Contact</option>
                    <option value="gp">GP</option>
                    <option value="specialist">Specialist</option>
                    <option value="allied_health">Allied Health</option>
                    <option value="guardian">Guardian / Nominee</option>
                    <option value="family">Family Member</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Relationship</label>
                  <input type="text" value={contactForm.relationship} onChange={e => setContactForm(p => ({ ...p, relationship: e.target.value }))} placeholder="e.g. Mother, Case Manager" />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Organisation</label>
                  <input type="text" value={contactForm.organisation} onChange={e => setContactForm(p => ({ ...p, organisation: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                  <input type="tel" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                  <input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={contactForm.is_primary} onChange={e => setContactForm(p => ({ ...p, is_primary: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-accent-500" />
                Primary contact
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setContactOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={contactSaving} disabled={!contactForm.name}>Add Contact</ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Participant Modal */}
      <ParticipantModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); load(); }}
        participant={participant}
      />

      {/* Add Note Modal */}
      <Modal isOpen={noteOpen} onClose={() => setNoteOpen(false)} title="Add Progress Note" icon={HiChatBubbleBottomCenterText} size="lg">
        <form onSubmit={handleAddNote}>
          <ModalBody>
            <ModalError message={noteError} />
            <div className="space-y-6">
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Note Type</label>
                <div className="flex gap-2">
                  {NOTE_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setNoteType(t.value)}
                      className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                        noteType === t.value
                          ? 'bg-accent-500 text-white'
                          : 'bg-white dark:bg-[#1e2d4a] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#334766] hover:bg-slate-50 dark:hover:bg-[#263554]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Content <span className="text-red-500">*</span></label>
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={6}
                  placeholder="Write your progress note here..."
                  className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                  required
                  autoFocus
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setNoteOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={noteSaving} disabled={!noteContent.trim()}>Save Note</ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* Upload File Modal */}
      <Modal isOpen={fileOpen} onClose={() => setFileOpen(false)} title="Upload File" icon={HiPaperClip} size="lg">
        <form onSubmit={handleUploadFile}>
          <ModalBody>
            <ModalError message={fileError} />
            <div className="space-y-6">
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">File <span className="text-red-500">*</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                  className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 dark:file:bg-brand-900/30 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-600"
                  required
                />
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                <select
                  value={fileCategory}
                  onChange={e => setFileCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white"
                >
                  {FILE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Notes</label>
                <input
                  type="text"
                  value={fileNotes}
                  onChange={e => setFileNotes(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setFileOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={fileUploading} disabled={!fileData}>Upload</ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />}
      {!Icon && <div className="w-4" />}
      <div>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm text-slate-700 dark:text-slate-300 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
