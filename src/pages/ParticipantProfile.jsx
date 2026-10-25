import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft, HiPencilSquare, HiTrash, HiPlus, HiDocumentText,
  HiPhone, HiEnvelope, HiMapPin, HiCalendarDays, HiHeart,
  HiShieldCheck, HiUser, HiClock, HiPaperClip, HiArrowDownTray,
  HiExclamationTriangle, HiChatBubbleBottomCenterText, HiArrowPath,
  HiXMark, HiCheckCircle, HiUserGroup, HiClipboardDocumentList, HiChartBar,
  HiShieldExclamation,
} from 'react-icons/hi2';
import {
  fetchParticipant, updateParticipant, deleteParticipant,
  addParticipantNote, deleteParticipantNote,
  uploadParticipantFile, deleteParticipantFile, formatDate,
  fetchMedications, createMedication, updateMedication, deleteMedication,
  fetchParticipantContacts, createParticipantContact, deleteParticipantContact,
  fetchProgressNotes,
  fetchIncidents,
  createIncident,
  fetchSupportPlan, createSupportPlan, updateSupportPlan, deleteSupportPlan,
  fetchRiskProfile, createRiskProfile, updateRiskProfile, deleteRiskProfile,
} from '../lib/api';
import ParticipantModal from '../components/ParticipantModal';
import MonitoringTab from '../components/MonitoringTab';
import HospitalPassportTab from '../components/HospitalPassportTab';
import { useAuth } from '../contexts/AuthContext';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from '../components/ui/Modal';
import { FormInput, FormSelect, FormTextarea, FormRow, FormDivider } from '../components/ui/FormComponents';
import jsPDF from 'jspdf';
import { toLocalDate } from '../lib/dates';
import OrientationPDF from '../components/OrientationPDF';
import OrientationTab from '../components/OrientationTab';
import RiskProfileTab from '../components/RiskProfileTab';
import GoalsOfCareTab from '../components/GoalsOfCareTab';
import PaymentReviewsPanel from '../components/PaymentReviewsPanel';
import { shiftTimeLabel } from '../lib/shiftTime';
import { fetchHospitalPassport } from '../lib/api';

const INCIDENT_CATEGORIES = {
  injury: 'Injury', medication: 'Medication Error', behaviour: 'Behaviour of Concern',
  property_damage: 'Property Damage', abuse_neglect: 'Abuse / Neglect', missing_person: 'Missing Person',
  fall: 'Fall', aggression: 'Aggression', other: 'Other',
};

// Function, not a constant, so the default date is today's (local) date when the
// form is opened rather than whenever the module was first loaded.
const INITIAL_INCIDENT = () => ({
  title: '', severity: 'medium', category: 'injury',
  incident_date: toLocalDate(), incident_time: '',
  location: '', description: '', immediate_actions: '', witnesses: '',
  follow_up_required: false, follow_up_actions: '', follow_up_date: '', reported_by: '',
});

const NOTE_TYPES = [
  { value: 'progress', label: 'Progress Note', color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' },
  { value: 'incident', label: 'Incident', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
  { value: 'handover', label: 'Handover', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  { value: 'general', label: 'General', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
];

const FILE_CATEGORIES = ['Care Plan', 'BSP', 'Service Agreement', 'Medical', 'NDIS Plan', 'NDIS Review', 'General', 'Other'];

function formatBytes(bytes) {
  if (!bytes) return '--';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ParticipantProfile() {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isManager, profile, token } = useAuth();

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

  // Standalone progress notes (from progress_notes table)
  const [standaloneNotes, setStandaloneNotes] = useState([]);

  // Incidents
  const [incidents, setIncidents] = useState([]);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState(INITIAL_INCIDENT);  // lazy initializer
  const [incidentSaving, setIncidentSaving] = useState(false);
  const [incidentError, setIncidentError] = useState('');

  // Contacts
  const [contacts, setContacts] = useState([]);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', contact_type: 'emergency', relationship: '', phone: '', email: '', organisation: '', is_primary: false });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState('');

  // Support Plan
  const [supportPlan, setSupportPlan] = useState(null);
  const [spEditing, setSpEditing] = useState(false);
  const [spForm, setSpForm] = useState({
    plan_start_date: '', plan_end_date: '', plan_review_date: '',
    status: 'draft', prepared_by: '',
    short_term_goals: '', long_term_goals: '',
    daily_support_needs: '', health_medical: '', behaviour_support: '',
    community_access: '', communication: '', risk_management: '',
    overnight_support: '', additional_notes: '',
  });
  const [spSaving, setSpSaving] = useState(false);
  const [spError, setSpError] = useState('');
  const [spDeleting, setSpDeleting] = useState(false);
  const [spExporting, setSpExporting] = useState(false);
  const spPdfRef = useRef(null);

  // Hospital Passport (for orientation PDF)
  const [hospitalPassport, setHospitalPassport] = useState(null);

  // Risk Profile
  const [riskProfile, setRiskProfile] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchParticipant(participantId),
      fetchMedications(participantId).catch(() => []),
      fetchParticipantContacts(participantId).catch(() => []),
      fetchIncidents(null, null, participantId).catch(() => []),
      fetchSupportPlan(participantId).catch(() => null),
      fetchHospitalPassport(participantId).catch(() => null),
      fetchRiskProfile(participantId).catch(() => null),
    ])
      .then(([data, medsData, contactsData, incidentsData, spData, hpData, rpData]) => {
        setParticipant(data);
        setMeds(Array.isArray(medsData) ? medsData : []);
        setContacts(Array.isArray(contactsData) ? contactsData : []);
        setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
        setSupportPlan(spData || null);
        setHospitalPassport(hpData || null);
        setRiskProfile(rpData || null);
        // Fetch standalone progress notes by participant ID
        fetchProgressNotes(null, null, null, null, { participantId }).then(notes => {
          setStandaloneNotes(Array.isArray(notes) ? notes : []);
        }).catch(() => setStandaloneNotes([]));
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
        author: profile?.full_name || profile?.email || 'Staff',
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

  async function handleDeleteNote(noteId, source) {
    try {
      if (source === 'imported') {
        const { deleteProgressNote } = await import('../lib/api');
        await deleteProgressNote(noteId);
      } else {
        await deleteParticipantNote(noteId);
      }
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCreateIncident(e) {
    e.preventDefault();
    setIncidentError('');
    if (!incidentForm.title.trim()) return setIncidentError('Title is required.');
    if (!incidentForm.incident_date) return setIncidentError('Date is required.');
    if (!incidentForm.description.trim()) return setIncidentError('Description is required.');
    if (!incidentForm.reported_by.trim()) return setIncidentError('Reported By is required.');
    setIncidentSaving(true);
    try {
      await createIncident({
        ...incidentForm,
        participant_id: participantId,
        follow_up_date: incidentForm.follow_up_required ? incidentForm.follow_up_date || null : null,
        follow_up_actions: incidentForm.follow_up_required ? incidentForm.follow_up_actions : '',
      });
      setIncidentForm(INITIAL_INCIDENT());
      setIncidentOpen(false);
      load();
    } catch (err) {
      setIncidentError(err.message);
    } finally {
      setIncidentSaving(false);
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

  function openSpEditor(plan) {
    if (plan) {
      setSpForm({
        plan_start_date: plan.plan_start_date || '',
        plan_end_date: plan.plan_end_date || '',
        plan_review_date: plan.plan_review_date || '',
        status: plan.status || 'draft',
        prepared_by: plan.prepared_by || '',
        short_term_goals: plan.short_term_goals || '',
        long_term_goals: plan.long_term_goals || '',
        daily_support_needs: plan.daily_support_needs || '',
        health_medical: plan.health_medical || '',
        behaviour_support: plan.behaviour_support || '',
        community_access: plan.community_access || '',
        communication: plan.communication || '',
        risk_management: plan.risk_management || '',
        overnight_support: plan.overnight_support || '',
        additional_notes: plan.additional_notes || '',
      });
    } else {
      setSpForm({
        plan_start_date: '', plan_end_date: '', plan_review_date: '',
        status: 'draft', prepared_by: '',
        short_term_goals: '', long_term_goals: '',
        daily_support_needs: '', health_medical: '', behaviour_support: '',
        community_access: '', communication: '', risk_management: '',
        overnight_support: '', additional_notes: '',
      });
    }
    setSpError('');
    setSpEditing(true);
  }

  async function handleSaveSupportPlan(e) {
    e.preventDefault();
    setSpSaving(true);
    setSpError('');
    try {
      if (supportPlan?.id) {
        const updated = await updateSupportPlan(supportPlan.id, spForm);
        setSupportPlan(updated);
      } else {
        const created = await createSupportPlan({ participant_id: participantId, ...spForm });
        setSupportPlan(created);
      }
      setSpEditing(false);
    } catch (err) {
      setSpError(err.message);
    } finally {
      setSpSaving(false);
    }
  }

  async function handleDeleteSupportPlan() {
    if (!supportPlan?.id) return;
    setSpDeleting(true);
    try {
      await deleteSupportPlan(supportPlan.id);
      setSupportPlan(null);
      setSpEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSpDeleting(false);
    }
  }

  async function handleExportSupportPlanPdf() {
    if (!supportPlan) return;
    setSpExporting(true);
    try {
      // ── Constants ──
      const PAGE_W = 210, PAGE_H = 297;
      const ML = 18, MR = 18, MT = 18;
      const CW = PAGE_W - ML - MR;
      const HEADER_H = 28;
      const FOOTER_H = 14;
      const BODY_TOP = MT + HEADER_H + 6;
      const BODY_BOTTOM = PAGE_H - MT - FOOTER_H;
      const OLF_GREEN = [14, 160, 62];
      const DARK = [30, 41, 59];
      const MED = [71, 85, 105];
      const LIGHT = [148, 163, 184];
      const BORDER = [226, 232, 240];
      const ACCENT = [15, 118, 110]; // teal-700

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let pageNum = 1;
      let y = BODY_TOP;

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
      } catch { /* skip logo if load fails */ }

      // ── Header ──
      function drawHeader() {
        pdf.setFillColor(...OLF_GREEN);
        pdf.rect(0, 0, PAGE_W, MT + HEADER_H, 'F');

        if (logoData) {
          try { pdf.addImage(logoData, 'PNG', ML, MT + 2, 28, 14); } catch {}
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Support Plan', logoData ? ML + 32 : ML, MT + 10);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        const name = `${participant.first_name || ''} ${participant.last_name || ''}`.trim();
        pdf.text(name, logoData ? ML + 32 : ML, MT + 18);

        if (participant.ndis_number) {
          pdf.setFontSize(8);
          pdf.text(`NDIS: ${participant.ndis_number}`, logoData ? ML + 32 : ML, MT + 23);
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text('One Life Foundation', PAGE_W - MR, MT + 10, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        const genDate = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
        pdf.text(`Generated: ${genDate}`, PAGE_W - MR, MT + 16, { align: 'right' });
      }

      // ── Footer ──
      function drawFooter() {
        const fy = PAGE_H - MT;
        pdf.setDrawColor(...BORDER);
        pdf.setLineWidth(0.3);
        pdf.line(ML, fy - 4, PAGE_W - MR, fy - 4);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(...LIGHT);
        pdf.text('One Life Foundation Pty Ltd  |  Confidential', ML, fy);
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

      // ── Draw wrapped text, returns new y ──
      function drawWrappedText(text, x, startY, maxW, fontSize, fontStyle, color) {
        pdf.setFont('helvetica', fontStyle || 'normal');
        pdf.setFontSize(fontSize || 10);
        pdf.setTextColor(...(color || MED));
        const lines = pdf.splitTextToSize(text || '', maxW);
        const lineH = (fontSize || 10) * 0.42;
        for (const line of lines) {
          if (startY + lineH > BODY_BOTTOM) {
            newPage();
            startY = y;
            pdf.setFont('helvetica', fontStyle || 'normal');
            pdf.setFontSize(fontSize || 10);
            pdf.setTextColor(...(color || MED));
          }
          pdf.text(line, x, startY);
          startY += lineH;
        }
        return startY;
      }

      // ── Section renderer ──
      function drawSection(title, content) {
        if (!content) return;
        ensureSpace(16);

        // Section title with accent bar
        pdf.setFillColor(...ACCENT);
        pdf.rect(ML, y - 1, 3, 7, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(...DARK);
        pdf.text(title, ML + 6, y + 4);
        y += 10;

        // Section content
        y = drawWrappedText(content, ML + 6, y, CW - 6, 10, 'normal', MED);
        y += 6;
      }

      // ── Build PDF ──
      drawHeader();

      // Plan info row
      const planFields = [
        { label: 'Start Date', value: supportPlan.plan_start_date ? new Date(supportPlan.plan_start_date + 'T00:00:00').toLocaleDateString('en-AU') : '--' },
        { label: 'End Date', value: supportPlan.plan_end_date ? new Date(supportPlan.plan_end_date + 'T00:00:00').toLocaleDateString('en-AU') : '--' },
        { label: 'Review Date', value: supportPlan.plan_review_date ? new Date(supportPlan.plan_review_date + 'T00:00:00').toLocaleDateString('en-AU') : '--' },
        { label: 'Status', value: supportPlan.status === 'under_review' ? 'Under Review' : (supportPlan.status || '--') },
      ];

      const colW = CW / 4;
      for (let i = 0; i < planFields.length; i++) {
        const cx = ML + i * colW;
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(cx, y, colW - 3, 16, 2, 2, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(...LIGHT);
        pdf.text(planFields[i].label.toUpperCase(), cx + 4, y + 6);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(...DARK);
        pdf.text(String(planFields[i].value), cx + 4, y + 12);
      }
      y += 22;

      if (supportPlan.prepared_by) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...LIGHT);
        pdf.text('Prepared by: ', ML, y);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...DARK);
        pdf.text(supportPlan.prepared_by, ML + 22, y);
        y += 8;
      }

      // Sections
      const sections = [
        { title: 'Short-Term Goals', content: supportPlan.short_term_goals },
        { title: 'Long-Term Goals', content: supportPlan.long_term_goals },
        { title: 'Daily Support Needs (ADLs)', content: supportPlan.daily_support_needs },
        { title: 'Health & Medical', content: supportPlan.health_medical },
        { title: 'Behaviour Support', content: supportPlan.behaviour_support },
        { title: 'Community Access', content: supportPlan.community_access },
        { title: 'Communication', content: supportPlan.communication },
        { title: 'Risk Management', content: supportPlan.risk_management },
        { title: 'Overnight Support', content: supportPlan.overnight_support },
        { title: 'Additional Notes', content: supportPlan.additional_notes },
      ];

      for (const s of sections) {
        drawSection(s.title, s.content);
      }

      drawFooter();

      const pName = `${participant.first_name}_${participant.last_name}`.replace(/\s+/g, '_');
      pdf.save(`Support_Plan_${pName}_${toLocalDate()}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF: ' + err.message);
    } finally {
      setSpExporting(false);
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

  // Merge embedded notes + standalone progress_notes table entries
  const embeddedNotes = (participant.progress_notes || []).map(n => ({ ...n, _source: 'embedded' }));
  const importedNotes = standaloneNotes.map(n => ({
    id: n.id,
    content: n.content,
    note_type: 'progress',
    author: n.staff_name || 'Staff',
    created_at: n.created_at,
    note_date: n.note_date,
    shift: n.shift,
    bsl_reading: n.bsl_reading,
    medication_notes: n.medication_notes,
    concerns: n.concerns,
    _source: 'imported',
  }));
  const notesList = [...embeddedNotes, ...importedNotes].sort((a, b) => {
    // Sort by note_date first (newest first), then by created_at as tiebreaker
    const dateA = a.note_date || (a.created_at ? a.created_at.split('T')[0] : '');
    const dateB = b.note_date || (b.created_at ? b.created_at.split('T')[0] : '');
    if (dateB !== dateA) return dateB.localeCompare(dateA);
    return new Date(b.created_at) - new Date(a.created_at);
  });
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

      {/* Important Alerts Banner */}
      {(participant.allergies || participant.medications_summary || participant.mobility || participant.communication_needs || participant.dietary_requirements) && (
        <div className="rounded-xl border-2 border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 p-5">
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
            <HiExclamationTriangle className="h-5 w-5" /> Important Alerts — Read Before Shift
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {participant.allergies && (
              <div className="rounded-lg bg-white dark:bg-[#162036] border border-red-200 dark:border-red-800/30 p-3">
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Allergies</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{participant.allergies}</p>
              </div>
            )}
            {participant.medications_summary && (
              <div className="rounded-lg bg-white dark:bg-[#162036] border border-red-200 dark:border-red-800/30 p-3">
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Medication Notes</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{participant.medications_summary}</p>
              </div>
            )}
            {participant.dietary_requirements && (
              <div className="rounded-lg bg-white dark:bg-[#162036] border border-red-200 dark:border-red-800/30 p-3">
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Dietary Requirements</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{participant.dietary_requirements}</p>
              </div>
            )}
            {participant.mobility && (
              <div className="rounded-lg bg-white dark:bg-[#162036] border border-amber-200 dark:border-amber-800/30 p-3">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Mobility</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{participant.mobility}</p>
              </div>
            )}
            {participant.communication_needs && (
              <div className="rounded-lg bg-white dark:bg-[#162036] border border-blue-200 dark:border-blue-800/30 p-3">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Communication</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{participant.communication_needs}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Reference for Support Workers */}
      <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800/50 bg-brand-50 dark:bg-brand-900/10 p-5">
        <h3 className="text-sm font-bold text-brand-700 dark:text-brand-400 flex items-center gap-2 mb-4">
          <HiClipboardDocumentList className="h-5 w-5" /> Quick Reference for Support Workers
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white dark:bg-[#162036] border border-slate-200 dark:border-[#263554] p-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Support Ratio</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{participant.funding_ratio || 'Not set'}</p>
          </div>
          <div className="rounded-lg bg-white dark:bg-[#162036] border border-slate-200 dark:border-[#263554] p-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Support Level</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{participant.support_level || 'Not set'}</p>
          </div>
          <div className="rounded-lg bg-white dark:bg-[#162036] border border-slate-200 dark:border-[#263554] p-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Key Worker</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{participant.assigned_staff || 'Not assigned'}</p>
          </div>
          <div className="rounded-lg bg-white dark:bg-[#162036] border border-slate-200 dark:border-[#263554] p-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Funding Type</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{participant.funding_type || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* NDIA payment reviews touching this participant (admin/manager only, hidden when none) */}
      {(isAdmin || isManager) && <PaymentReviewsPanel participantId={participantId} token={token} />}

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
          <InfoRow icon={HiCalendarDays} label="Start Date with OLF" value={participant.start_date_with_olf ? new Date(participant.start_date_with_olf + 'T00:00:00').toLocaleDateString('en-AU') : null} />
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
          {participant.support_coordinator_name && (
            <>
              <div className="border-t border-slate-100 dark:border-[#263554] pt-4 mt-2" />
              <InfoRow label="Support Coordinator" value={participant.support_coordinator_name} />
              <InfoRow icon={HiPhone} label="SC Phone" value={participant.support_coordinator_phone} />
            </>
          )}
          {participant.plan_manager_name && (
            <>
              <div className="border-t border-slate-100 dark:border-[#263554] pt-4 mt-2" />
              <InfoRow label="Plan Manager" value={participant.plan_manager_name} />
              <InfoRow label="Organisation" value={participant.plan_manager_organisation} />
            </>
          )}
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
          {(participant.pharmacy_name || participant.pharmacy_phone || participant.pharmacy_address) && (
            <div className="border-t border-slate-100 dark:border-[#263554] pt-4 mt-4 space-y-5">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pharmacy</p>
              <InfoRow label="Pharmacy" value={participant.pharmacy_name} />
              <InfoRow icon={HiPhone} label="Pharmacy Phone" value={participant.pharmacy_phone} />
              <InfoRow label="Address" value={participant.pharmacy_address} />
            </div>
          )}
          {(participant.bsp_name || participant.occupational_therapist || participant.psychologist || participant.speech_pathologist) && (
            <div className="border-t border-slate-100 dark:border-[#263554] pt-4 mt-4 space-y-5">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Allied Health</p>
              {participant.bsp_name && <InfoRow label="BSP" value={`${participant.bsp_name}${participant.bsp_organisation ? ` (${participant.bsp_organisation})` : ''}`} />}
              {participant.occupational_therapist && <InfoRow label="OT" value={participant.occupational_therapist} />}
              {participant.speech_pathologist && <InfoRow label="Speech" value={participant.speech_pathologist} />}
              {participant.psychologist && <InfoRow label="Psych" value={participant.psychologist} />}
            </div>
          )}
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

      {/* Monitoring — always visible */}
      <MonitoringTab participantId={participantId} isAdmin={isAdmin || isManager} participantName={participant ? `${participant.first_name} ${participant.last_name}` : ''} ndisNumber={participant?.ndis_number || ''} />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-[#263554]">
        {[
          { id: 'notes', label: `Progress Notes (${notesList.length})`, icon: HiChatBubbleBottomCenterText },
          { id: 'incidents', label: `Incidents (${incidents.length})`, icon: HiExclamationTriangle },
          { id: 'files', label: `Files (${filesList.length})`, icon: HiPaperClip },
          { id: 'medications', label: `Medications (${meds.length})`, icon: HiHeart },
          { id: 'contacts', label: `Contacts (${contacts.length})`, icon: HiUserGroup },
          { id: 'goals-of-care', label: 'Goals of Care', icon: HiCheckCircle },
          { id: 'support-plan', label: 'Support Plan', icon: HiClipboardDocumentList },
          { id: 'risk-profile', label: 'Risk Profile', icon: HiShieldExclamation },
          { id: 'orientation', label: 'Orientation Guide', icon: HiDocumentText },
          { id: 'hospital-passport', label: 'Hospital Passport', icon: HiDocumentText },
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
                          {formatDate(note.note_date || note.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id, note._source)}
                        className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 group-hover:opacity-100"
                      >
                        <HiTrash className="h-4 w-4" />
                      </button>
                    </div>
                    {(shiftTimeLabel(note.shift) || note.bsl_reading) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {shiftTimeLabel(note.shift) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            <HiClock className="h-3 w-3" /> {shiftTimeLabel(note.shift)}
                          </span>
                        )}
                        {note.bsl_reading && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                            BSL: {note.bsl_reading}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                    {note.concerns && (
                      <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Concerns</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">{note.concerns}</p>
                      </div>
                    )}
                    {note.medication_notes && (
                      <div className="mt-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Medication</p>
                        <p className="text-xs text-green-700 dark:text-green-300">{note.medication_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Incidents Tab */}
      {tab === 'incidents' && (
        <div className="space-y-5">
          <button
            onClick={() => { setIncidentForm(INITIAL_INCIDENT()); setIncidentError(''); setIncidentOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
          >
            <HiPlus className="h-4 w-4" />
            Report Incident
          </button>

          {incidents.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
              <HiExclamationTriangle className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No incidents recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map(inc => {
                const sevColors = {
                  critical: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                  high: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
                  medium: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
                  low: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                };
                const statusColors = {
                  open: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                  investigating: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
                  resolved: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
                  closed: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
                };
                return (
                  <div key={inc.id} className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{inc.incident_number}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${sevColors[inc.severity] || sevColors.medium}`}>
                          {inc.severity}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusColors[inc.status] || statusColors.open}`}>
                          {inc.status}
                        </span>
                        {inc.category && (
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                            {inc.category.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap ml-3">
                        {formatDate(inc.incident_date)}
                      </span>
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{inc.title}</h4>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {inc.description}
                    </p>
                    {inc.immediate_actions && (
                      <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Immediate Actions</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">{inc.immediate_actions}</p>
                      </div>
                    )}
                    {inc.resolution_notes && (
                      <div className="mt-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Resolution</p>
                        <p className="text-xs text-green-700 dark:text-green-300">{inc.resolution_notes}</p>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                      {inc.reported_by && <span>Reported by: <span className="font-medium text-slate-600 dark:text-slate-300">{inc.reported_by}</span></span>}
                      {inc.location && <span>Location: <span className="font-medium text-slate-600 dark:text-slate-300">{inc.location}</span></span>}
                    </div>
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

      {/* Goals of Care Tab */}
      {tab === 'goals-of-care' && (
        <GoalsOfCareTab participantId={participantId} />
      )}

      {/* Support Plan Tab */}
      {tab === 'support-plan' && (
        <div className="space-y-5">
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!supportPlan ? (
              <button
                onClick={() => openSpEditor(null)}
                className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
              >
                <HiPlus className="h-4 w-4" />
                Create Support Plan
              </button>
            ) : (
              <>
                <button
                  onClick={() => openSpEditor(supportPlan)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
                >
                  <HiPencilSquare className="h-4 w-4" />
                  Edit Plan
                </button>
                <button
                  onClick={handleExportSupportPlanPdf}
                  disabled={spExporting}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors disabled:opacity-50"
                >
                  <HiArrowDownTray className="h-4 w-4" />
                  {spExporting ? 'Exporting...' : 'Download PDF'}
                </button>
                <button
                  onClick={handleDeleteSupportPlan}
                  disabled={spDeleting}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  <HiTrash className="h-4 w-4" />
                  {spDeleting ? 'Deleting...' : 'Delete Plan'}
                </button>
              </>
            )}
          </div>

          {/* Support Plan View */}
          {!supportPlan ? (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
              <HiClipboardDocumentList className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No support plan created yet</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Create a support plan to document goals, daily needs, and strategies</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Details Header */}
              <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <HiClipboardDocumentList className="h-4 w-4 text-brand-500" /> Plan Details
                    </h3>
                    {supportPlan.prepared_by && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Prepared by: <span className="font-medium text-slate-700 dark:text-slate-300">{supportPlan.prepared_by}</span></p>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                    supportPlan.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : supportPlan.status === 'under_review' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : supportPlan.status === 'expired' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    {supportPlan.status === 'under_review' ? 'Under Review' : supportPlan.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Start Date</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{supportPlan.plan_start_date ? new Date(supportPlan.plan_start_date).toLocaleDateString('en-AU') : '--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">End Date</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{supportPlan.plan_end_date ? new Date(supportPlan.plan_end_date).toLocaleDateString('en-AU') : '--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Review Date</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{supportPlan.plan_review_date ? new Date(supportPlan.plan_review_date).toLocaleDateString('en-AU') : '--'}</p>
                  </div>
                </div>
              </div>

              {/* Section cards */}
              <SupportPlanSection title="Short-Term Goals" content={supportPlan.short_term_goals} />
              <SupportPlanSection title="Long-Term Goals" content={supportPlan.long_term_goals} />
              <SupportPlanSection title="Daily Support Needs (ADLs)" content={supportPlan.daily_support_needs} subtitle="Showering, dressing, meals, medication, mobility" />
              <SupportPlanSection title="Health & Medical" content={supportPlan.health_medical} subtitle="Health management, medication, seizure/emergency protocols" />
              <SupportPlanSection title="Behaviour Support" content={supportPlan.behaviour_support} subtitle="Behaviours of concern, triggers, de-escalation strategies" />
              <SupportPlanSection title="Community Access" content={supportPlan.community_access} subtitle="Social/community participation goals and strategies" />
              <SupportPlanSection title="Communication" content={supportPlan.communication} subtitle="Communication preferences and strategies" />
              <SupportPlanSection title="Risk Management" content={supportPlan.risk_management} subtitle="Identified risks and mitigation strategies" />
              <SupportPlanSection title="Overnight Support" content={supportPlan.overnight_support} subtitle="Overnight support requirements" />
              <SupportPlanSection title="Additional Notes" content={supportPlan.additional_notes} />
            </div>
          )}

          {/* Hidden PDF content for export */}
          {supportPlan && (
            <div ref={spPdfRef} style={{ display: 'none', width: '800px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b', backgroundColor: '#ffffff' }}>
              <div style={{ padding: '40px' }}>
                <div style={{ borderBottom: '3px solid #0f766e', paddingBottom: '20px', marginBottom: '30px' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Support Plan</h1>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#334155', margin: '8px 0 0 0' }}>
                    {participant.first_name} {participant.last_name}
                  </h2>
                  {participant.ndis_number && <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>NDIS: {participant.ndis_number}</p>}
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>One Life Foundation</p>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Start Date</p>
                    <p style={{ fontSize: '14px', color: '#334155', margin: '4px 0 0 0' }}>{supportPlan.plan_start_date ? new Date(supportPlan.plan_start_date).toLocaleDateString('en-AU') : '--'}</p>
                  </div>
                  <div style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>End Date</p>
                    <p style={{ fontSize: '14px', color: '#334155', margin: '4px 0 0 0' }}>{supportPlan.plan_end_date ? new Date(supportPlan.plan_end_date).toLocaleDateString('en-AU') : '--'}</p>
                  </div>
                  <div style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Review Date</p>
                    <p style={{ fontSize: '14px', color: '#334155', margin: '4px 0 0 0' }}>{supportPlan.plan_review_date ? new Date(supportPlan.plan_review_date).toLocaleDateString('en-AU') : '--'}</p>
                  </div>
                  <div style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Status</p>
                    <p style={{ fontSize: '14px', color: '#334155', margin: '4px 0 0 0', textTransform: 'capitalize' }}>{supportPlan.status === 'under_review' ? 'Under Review' : supportPlan.status}</p>
                  </div>
                </div>

                {supportPlan.prepared_by && (
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Prepared by: <strong style={{ color: '#334155' }}>{supportPlan.prepared_by}</strong></p>
                )}

                {[
                  { title: 'Short-Term Goals', content: supportPlan.short_term_goals },
                  { title: 'Long-Term Goals', content: supportPlan.long_term_goals },
                  { title: 'Daily Support Needs (ADLs)', content: supportPlan.daily_support_needs },
                  { title: 'Health & Medical', content: supportPlan.health_medical },
                  { title: 'Behaviour Support', content: supportPlan.behaviour_support },
                  { title: 'Community Access', content: supportPlan.community_access },
                  { title: 'Communication', content: supportPlan.communication },
                  { title: 'Risk Management', content: supportPlan.risk_management },
                  { title: 'Overnight Support', content: supportPlan.overnight_support },
                  { title: 'Additional Notes', content: supportPlan.additional_notes },
                ].filter(s => s.content).map((section, i) => (
                  <div key={i} style={{ marginBottom: '20px', borderLeft: '3px solid #0f766e', paddingLeft: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>{section.title}</h3>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{section.content}</p>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '30px' }}>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    Generated on {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} | One Life Foundation | Confidential
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'risk-profile' && (
        <RiskProfileTab
          participant={participant}
          riskProfile={riskProfile}
          setRiskProfile={setRiskProfile}
        />
      )}

      {tab === 'orientation' && (
        <OrientationTab
          key={participantId}
          participant={participant}
          supportPlan={supportPlan}
        />
      )}

      {tab === 'hospital-passport' && (
        <HospitalPassportTab
          participant={participant}
          contacts={contacts}
          medications={meds}
          profile={profile}
        />
      )}

      {/* Support Plan Edit Modal */}
      <Modal isOpen={spEditing} onClose={() => setSpEditing(false)} title={supportPlan?.id ? 'Edit Support Plan' : 'Create Support Plan'} icon={HiClipboardDocumentList} iconColor="text-brand-500" size="xl">
        <form onSubmit={handleSaveSupportPlan}>
          <ModalBody>
            <ModalError message={spError} />
            <div className="space-y-6">
              {/* Plan Details */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Plan Details</p>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                    <input type="date" value={spForm.plan_start_date} onChange={e => setSpForm(p => ({ ...p, plan_start_date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">End Date</label>
                    <input type="date" value={spForm.plan_end_date} onChange={e => setSpForm(p => ({ ...p, plan_end_date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Review Date</label>
                    <input type="date" value={spForm.plan_review_date} onChange={e => setSpForm(p => ({ ...p, plan_review_date: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                    <select value={spForm.status} onChange={e => setSpForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="under_review">Under Review</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Prepared By</label>
                    <input type="text" value={spForm.prepared_by} onChange={e => setSpForm(p => ({ ...p, prepared_by: e.target.value }))} placeholder="Name of staff member" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-[#263554]" />

              {/* Goals */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Participant Goals</p>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Short-Term Goals</label>
                    <textarea value={spForm.short_term_goals} onChange={e => setSpForm(p => ({ ...p, short_term_goals: e.target.value }))} rows={4} placeholder="Goals for the next 3-6 months..." />
                  </div>
                  <div>
                    <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Long-Term Goals</label>
                    <textarea value={spForm.long_term_goals} onChange={e => setSpForm(p => ({ ...p, long_term_goals: e.target.value }))} rows={4} placeholder="Goals for the next 12+ months..." />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-[#263554]" />

              {/* Daily Support Needs */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Daily Support Needs</p>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">ADLs — Showering, Dressing, Meals, Medication, Mobility</label>
                  <textarea value={spForm.daily_support_needs} onChange={e => setSpForm(p => ({ ...p, daily_support_needs: e.target.value }))} rows={5} placeholder="Describe daily support needs including personal care, meal preparation, medication administration, mobility assistance..." />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-[#263554]" />

              {/* Health & Medical */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Health & Medical</p>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Health Management, Medication, Emergency Protocols</label>
                  <textarea value={spForm.health_medical} onChange={e => setSpForm(p => ({ ...p, health_medical: e.target.value }))} rows={5} placeholder="Health conditions, medication management, seizure protocols, emergency procedures..." />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-[#263554]" />

              {/* Behaviour Support */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Behaviour Support</p>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Behaviours of Concern, Triggers, De-escalation</label>
                  <textarea value={spForm.behaviour_support} onChange={e => setSpForm(p => ({ ...p, behaviour_support: e.target.value }))} rows={5} placeholder="Identified behaviours, known triggers, de-escalation strategies, positive behaviour support..." />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-[#263554]" />

              {/* Community Access */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Community Access</p>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Social & Community Participation</label>
                  <textarea value={spForm.community_access} onChange={e => setSpForm(p => ({ ...p, community_access: e.target.value }))} rows={4} placeholder="Community participation goals, activities, support required for outings..." />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-[#263554]" />

              {/* Communication */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Communication</p>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Communication Preferences & Strategies</label>
                  <textarea value={spForm.communication} onChange={e => setSpForm(p => ({ ...p, communication: e.target.value }))} rows={4} placeholder="Communication methods, assistive devices, visual supports, preferred communication style..." />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-[#263554]" />

              {/* Risk Management */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Risk Management</p>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Identified Risks & Mitigation</label>
                  <textarea value={spForm.risk_management} onChange={e => setSpForm(p => ({ ...p, risk_management: e.target.value }))} rows={5} placeholder="Identified risks, safety concerns, mitigation strategies, restrictive practices (if any)..." />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-[#263554]" />

              {/* Overnight Support */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Overnight Support</p>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Overnight Requirements</label>
                  <textarea value={spForm.overnight_support} onChange={e => setSpForm(p => ({ ...p, overnight_support: e.target.value }))} rows={4} placeholder="Overnight support needs, sleep routines, monitoring requirements..." />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-[#263554]" />

              {/* Additional Notes */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Additional Notes</p>
                <div>
                  <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Other Information</label>
                  <textarea value={spForm.additional_notes} onChange={e => setSpForm(p => ({ ...p, additional_notes: e.target.value }))} rows={4} placeholder="Any other relevant information..." />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setSpEditing(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={spSaving}>
              {supportPlan?.id ? 'Update Plan' : 'Create Plan'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

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

      {/* Report Incident Modal */}
      <Modal isOpen={incidentOpen} onClose={() => setIncidentOpen(false)} title="Report Incident" icon={HiExclamationTriangle} iconColor="text-red-500" size="xl">
        <form onSubmit={handleCreateIncident}>
          <ModalBody>
            <div className="space-y-6">
              <ModalError message={incidentError} />
              <FormRow>
                <FormInput label="Title" required value={incidentForm.title} onChange={e => setIncidentForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description of the incident" />
                <FormSelect label="Severity" required value={incidentForm.severity} onChange={e => setIncidentForm(f => ({ ...f, severity: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </FormSelect>
              </FormRow>
              <FormRow>
                <FormSelect label="Category" required value={incidentForm.category} onChange={e => setIncidentForm(f => ({ ...f, category: e.target.value }))}>
                  {Object.entries(INCIDENT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </FormSelect>
                <FormInput label="Date" required type="date" value={incidentForm.incident_date} onChange={e => setIncidentForm(f => ({ ...f, incident_date: e.target.value }))} />
              </FormRow>
              <FormRow>
                <FormInput label="Time" type="time" value={incidentForm.incident_time} onChange={e => setIncidentForm(f => ({ ...f, incident_time: e.target.value }))} />
                <FormInput label="Location" value={incidentForm.location} onChange={e => setIncidentForm(f => ({ ...f, location: e.target.value }))} placeholder="Where did the incident occur?" />
              </FormRow>
              <FormTextarea label="Description" required rows={5} value={incidentForm.description} onChange={e => setIncidentForm(f => ({ ...f, description: e.target.value }))} placeholder="Provide a detailed account of what happened..." />
              <FormTextarea label="Immediate Actions Taken" rows={3} value={incidentForm.immediate_actions} onChange={e => setIncidentForm(f => ({ ...f, immediate_actions: e.target.value }))} placeholder="What actions were taken immediately?" />
              <FormInput label="Witnesses" value={incidentForm.witnesses} onChange={e => setIncidentForm(f => ({ ...f, witnesses: e.target.value }))} placeholder="Names of any witnesses" />
              <FormDivider />
              <div className="flex items-center gap-3">
                <input id="inc_follow_up" type="checkbox" checked={incidentForm.follow_up_required} onChange={e => setIncidentForm(f => ({ ...f, follow_up_required: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-accent-500 focus:ring-accent-500" />
                <label htmlFor="inc_follow_up" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Follow-up Required</label>
              </div>
              {incidentForm.follow_up_required && (
                <div className="space-y-6 pl-7">
                  <FormTextarea label="Follow-up Actions" rows={3} value={incidentForm.follow_up_actions} onChange={e => setIncidentForm(f => ({ ...f, follow_up_actions: e.target.value }))} placeholder="What follow-up actions are needed?" />
                  <FormInput label="Follow-up Date" type="date" value={incidentForm.follow_up_date} onChange={e => setIncidentForm(f => ({ ...f, follow_up_date: e.target.value }))} />
                </div>
              )}
              <FormInput label="Reported By" required value={incidentForm.reported_by} onChange={e => setIncidentForm(f => ({ ...f, reported_by: e.target.value }))} placeholder="Name of person reporting" />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setIncidentOpen(false)} disabled={incidentSaving}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={incidentSaving}>Report Incident</ButtonPrimary>
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

function SupportPlanSection({ title, content, subtitle }) {
  if (!content) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{subtitle}</p>}
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{content}</p>
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
