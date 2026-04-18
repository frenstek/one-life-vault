import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft, HiPencilSquare, HiTrash, HiPlus, HiPhone, HiEnvelope,
  HiMapPin, HiCalendarDays, HiShieldCheck, HiUser, HiClock,
  HiExclamationTriangle, HiChatBubbleBottomCenterText, HiBellAlert,
  HiCheckCircle, HiArrowPath, HiDocumentText,
} from 'react-icons/hi2';
import {
  fetchInquiry, deleteInquiry, addInquiryNote, deleteInquiryNote,
  convertInquiryToParticipant, formatDate,
} from '../lib/api';
import InquiryModal from '../components/InquiryModal';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from '../components/ui/Modal';

const STATUS_CONFIG = {
  New: { color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  'In Progress': { color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  Accepted: { color: 'bg-green-50 dark:bg-green-900/20 text-accent-500' },
  Declined: { color: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' },
  Waitlisted: { color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  Converted: { color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
};

const PRIORITY_CONFIG = {
  Low: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
  Normal: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  High: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  Urgent: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
};

function getFollowUpStatus(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr); date.setHours(0, 0, 0, 0);
  const diff = date - today;
  if (diff < 0) return 'overdue';
  if (diff <= 3 * 86400000) return 'soon';
  return 'upcoming';
}

export default function InquiryDetail() {
  const { inquiryId } = useParams();
  const navigate = useNavigate();

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [convertConfirm, setConvertConfirm] = useState(false);

  // Note form
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState('');

  // Delete / Convert
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');

  function load() {
    setLoading(true);
    fetchInquiry(inquiryId)
      .then(data => setInquiry(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [inquiryId]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteInquiry(inquiryId);
      navigate('/inquiries');
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleConvert() {
    setConverting(true);
    setConvertError('');
    try {
      const result = await convertInquiryToParticipant(inquiryId);
      navigate(`/participants/${result.participant.id}`);
    } catch (err) {
      setConvertError(err.message);
    } finally {
      setConverting(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setNoteSaving(true);
    setNoteError('');
    try {
      await addInquiryNote({ inquiry_id: inquiryId, content: noteContent, author: 'Staff' });
      setNoteContent('');
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
      await deleteInquiryNote(noteId);
      load();
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

  if (error || !inquiry) {
    return (
      <div className="py-16 text-center">
        <HiUser className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Inquiry not found</p>
        <Link to="/inquiries" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-500">
          <HiArrowLeft className="h-4 w-4" /> Back to Inquiries
        </Link>
      </div>
    );
  }

  const notes = inquiry.timeline_notes || [];
  const initialNotes = inquiry.notes || '';

  const fuStatus = getFollowUpStatus(inquiry.next_follow_up);
  const isOverdue = fuStatus === 'overdue' && !['Declined', 'Converted'].includes(inquiry.status);
  const isSoon = fuStatus === 'soon';
  const statusCfg = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.New;
  const canConvert = inquiry.status === 'Accepted' && !inquiry.converted_participant_id;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            to="/inquiries"
            className="mt-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <HiArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xl font-bold">
              {(inquiry.first_name?.[0] || '')}{(inquiry.last_name?.[0] || '')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {inquiry.first_name} {inquiry.last_name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                {inquiry.ndis_number && (
                  <span className="font-mono text-xs">{inquiry.ndis_number}</span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusCfg.color}`}>
                  {inquiry.status}
                </span>
                {inquiry.priority && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_CONFIG[inquiry.priority] || PRIORITY_CONFIG.Normal}`}>
                    {inquiry.priority}
                  </span>
                )}
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
          {canConvert && (
            <button
              onClick={() => setConvertConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
            >
              <HiCheckCircle className="h-4 w-4" />
              Convert to Participant
            </button>
          )}
          {inquiry.converted_participant_id && (
            <Link
              to={`/participants/${inquiry.converted_participant_id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 px-4 py-2.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
            >
              <HiArrowPath className="h-4 w-4" />
              View Participant
            </Link>
          )}
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <HiTrash className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Follow-up Alert Banner */}
      {isOverdue && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-4">
          <HiBellAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Follow-up Overdue</p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Was due {formatDate(inquiry.next_follow_up)}
            </p>
          </div>
        </div>
      )}
      {isSoon && !isOverdue && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-6 py-4">
          <HiClock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Follow-up Due Soon</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Due {formatDate(inquiry.next_follow_up)}
            </p>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Delete inquiry for <strong>{inquiry.first_name} {inquiry.last_name}</strong>? This cannot be undone.
          </p>
          <div className="mt-4 flex gap-3">
            <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button onClick={() => setDeleteConfirm(false)} className="rounded-lg border border-slate-300 dark:border-[#334766] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300">Cancel</button>
          </div>
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Details */}
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <HiUser className="h-4 w-4 text-brand-500" /> Contact Details
          </h3>
          <InfoRow icon={HiPhone} label="Phone" value={inquiry.phone} />
          <InfoRow icon={HiEnvelope} label="Email" value={inquiry.email} />
          <InfoRow icon={HiMapPin} label="Location" value={[inquiry.location, inquiry.state].filter(Boolean).join(', ') || null} />
          <InfoRow icon={HiCalendarDays} label="Date of Birth" value={inquiry.date_of_birth ? new Date(inquiry.date_of_birth).toLocaleDateString('en-AU') : null} />
          <InfoRow icon={HiShieldCheck} label="NDIS Number" value={inquiry.ndis_number} mono />
        </div>

        {/* Referral & Service */}
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <HiDocumentText className="h-4 w-4 text-brand-500" /> Referral & Service
          </h3>
          <InfoRow label="Referral Source" value={inquiry.referral_source} />
          <InfoRow label="Referral Contact" value={inquiry.referral_contact} />
          <InfoRow label="Service Type" value={inquiry.service_type} />
          <InfoRow label="Current Living" value={inquiry.current_living} />
          {inquiry.support_needs && (
            <div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Support Needs</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{inquiry.support_needs}</p>
            </div>
          )}
        </div>

        {/* Funding & Tracking */}
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <HiCalendarDays className="h-4 w-4 text-brand-500" /> Funding & Tracking
          </h3>
          <InfoRow label="Funding Status" value={inquiry.funding_status} />
          <InfoRow label="Funding Ratio" value={inquiry.funding_ratio} />
          <InfoRow icon={HiCalendarDays} label="Inquiry Date" value={inquiry.inquiry_date ? new Date(inquiry.inquiry_date).toLocaleDateString('en-AU') : null} />
          <InfoRow icon={HiClock} label="Next Follow-up" value={inquiry.next_follow_up ? new Date(inquiry.next_follow_up).toLocaleDateString('en-AU') : null} highlight={isOverdue ? 'red' : isSoon ? 'amber' : null} />
          <InfoRow label="Assigned To" value={inquiry.assigned_to} />
          <InfoRow label="Priority" value={inquiry.priority} />
        </div>
      </div>

      {/* Initial Notes */}
      {initialNotes && (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Initial Notes</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{initialNotes}</p>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HiChatBubbleBottomCenterText className="h-5 w-5 text-brand-500" />
            Activity Timeline ({notes.length})
          </h3>
          <button
            onClick={() => setNoteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
          >
            <HiPlus className="h-4 w-4" />
            Add Note
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
            <HiChatBubbleBottomCenterText className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No activity notes yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add notes to track calls, emails, and follow-ups</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {notes.map((note, i) => (
              <div key={note.id} className="group relative pl-8 pb-6">
                {/* Vertical line */}
                {i < notes.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200 dark:bg-[#263554]" />
                )}
                {/* Dot */}
                <div className="absolute left-1 top-1.5 h-4 w-4 rounded-full border-2 border-brand-500 bg-white dark:bg-[#162036]" />
                {/* Content */}
                <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{note.author || 'Staff'}</span>
                      {' — '}
                      {formatDate(note.created_at)}
                    </span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 group-hover:opacity-100"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Inquiry Modal */}
      <InquiryModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        inquiry={inquiry}
        onSaved={() => { setEditOpen(false); load(); }}
      />

      {/* Add Note Modal */}
      <Modal isOpen={noteOpen} onClose={() => setNoteOpen(false)} title="Add Note" icon={HiChatBubbleBottomCenterText} size="lg">
        <form onSubmit={handleAddNote}>
          <ModalBody>
            <ModalError message={noteError} />
            <div>
              <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Content <span className="text-red-500">*</span></label>
              <textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                rows={6}
                placeholder="e.g. Called and left voicemail, waiting for callback..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                required
                autoFocus
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setNoteOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={noteSaving} disabled={!noteContent.trim()}>Save Note</ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* Convert Confirmation Modal */}
      <Modal isOpen={convertConfirm} onClose={() => setConvertConfirm(false)} title="Convert to Participant" icon={HiCheckCircle} size="lg">
        <ModalBody>
          <ModalError message={convertError} />
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This will create a new participant profile for <strong>{inquiry.first_name} {inquiry.last_name}</strong> with
              the following details pre-filled:
            </p>
            <div className="rounded-lg border border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e] p-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {inquiry.ndis_number && <div><span className="text-slate-400">NDIS:</span> <span className="text-slate-700 dark:text-slate-300 font-mono">{inquiry.ndis_number}</span></div>}
                {inquiry.phone && <div><span className="text-slate-400">Phone:</span> <span className="text-slate-700 dark:text-slate-300">{inquiry.phone}</span></div>}
                {inquiry.email && <div><span className="text-slate-400">Email:</span> <span className="text-slate-700 dark:text-slate-300">{inquiry.email}</span></div>}
                {inquiry.location && <div><span className="text-slate-400">Location:</span> <span className="text-slate-700 dark:text-slate-300">{inquiry.location}{inquiry.state ? `, ${inquiry.state}` : ''}</span></div>}
                {inquiry.funding_status && <div><span className="text-slate-400">Funding:</span> <span className="text-slate-700 dark:text-slate-300">{inquiry.funding_status}</span></div>}
                {inquiry.funding_ratio && <div><span className="text-slate-400">Ratio:</span> <span className="text-slate-700 dark:text-slate-300">{inquiry.funding_ratio}</span></div>}
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              The inquiry will be marked as "Converted" and linked to the new participant profile.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setConvertConfirm(false)} disabled={converting}>Cancel</ButtonSecondary>
          <ButtonPrimary onClick={handleConvert} loading={converting}>Convert to Participant</ButtonPrimary>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono, highlight }) {
  if (!value) return null;
  const highlightClass = highlight === 'red'
    ? 'text-red-600 dark:text-red-400 font-semibold'
    : highlight === 'amber'
      ? 'text-amber-600 dark:text-amber-400 font-semibold'
      : '';
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />}
      {!Icon && <div className="w-4" />}
      <div>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm text-slate-700 dark:text-slate-300 ${mono ? 'font-mono' : ''} ${highlightClass}`}>{value}</p>
      </div>
    </div>
  );
}
