import { useState, useEffect, useCallback } from 'react';
import {
  HiPlus,
  HiEnvelope,
  HiEnvelopeOpen,
  HiPaperAirplane,
  HiArrowUturnLeft,
  HiTrash,
  HiChevronLeft,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import { fetchMessages, sendMessage, markMessageRead, fetchStaff, formatDate } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from '../components/ui/Modal';
import { PageHeader, Badge, EmptyState, FormInput, FormSelect, FormTextarea } from '../components/ui/FormComponents';
import { useAuth } from '../contexts/AuthContext';

// No client helper exists in lib/api.js for this one; matches the 'delete-message' handler in api/features.js
async function deleteMessageApi(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-message', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete message failed: ${res.status}`);
  }
  return res.json();
}

export default function Messages() {
  const { profile } = useAuth();
  // Inbox and sender are the logged-in user, not a shared 'admin' mailbox.
  // Recipients are picked from the staff table, so "me" is my staff row (matched by email);
  // accounts with no staff row fall back to the profile id.
  const [staff, setStaff] = useState([]);
  const [staffLoaded, setStaffLoaded] = useState(false);
  const myEmail = (profile?.email || '').toLowerCase();
  const myStaff = staff.find((s) => (s.email || '').toLowerCase() === myEmail && myEmail);
  const senderId = staffLoaded && profile ? (myStaff?.id || profile.id) : null;
  const senderName = profile?.full_name || profile?.email || 'Staff';

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ recipient_id: '', subject: '', content: '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  // Staff list first (it decides who "me" is), then the inbox for that id.
  useEffect(() => {
    fetchStaff('active')
      .then((staffData) => setStaff(Array.isArray(staffData) ? staffData : staffData.staff || []))
      .catch((err) => setError(err.message))
      .finally(() => setStaffLoaded(true));
  }, []);

  const loadData = useCallback(async () => {
    if (!senderId) return; // profile/staff not loaded yet — effect re-runs when they are
    try {
      setError(null);
      const msgData = await fetchMessages(senderId);
      setMessages(Array.isArray(msgData) ? msgData : msgData.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [senderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selected = messages.find((m) => m.id === selectedId) || null;
  // Server column is `read` (api/features.js mark-read / unread-count)
  const unreadCount = messages.filter((m) => !m.read && m.recipient_id === senderId).length;

  async function handleSelect(msg) {
    setSelectedId(msg.id);
    setMobileDetail(true);
    if (!msg.read && msg.recipient_id === senderId) {
      try {
        await markMessageRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
        );
      } catch {
        // silent — UI already shows it selected
      }
    }
  }

  function openCompose(replyTo) {
    if (replyTo) {
      const replyRecipient = replyTo.sender_id === senderId ? replyTo.recipient_id : replyTo.sender_id;
      setComposeData({
        recipient_id: replyRecipient || '',
        subject: replyTo.subject?.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject || ''}`,
        content: '',
      });
    } else {
      setComposeData({ recipient_id: '', subject: '', content: '' });
    }
    setSendError(null);
    setShowCompose(true);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!composeData.recipient_id || !composeData.content.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const recipientStaff = staff.find((s) => s.id === composeData.recipient_id);
      await sendMessage({
        sender_id: senderId,
        sender_name: senderName,
        recipient_id: composeData.recipient_id,
        recipient_name: recipientStaff?.full_name || recipientStaff?.first_name || 'Staff',
        subject: composeData.subject.trim() || '(No subject)',
        content: composeData.content.trim(),
      });
      setShowCompose(false);
      loadData();
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMessageApi(deleteConfirm.id);
      setMessages((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
      if (selectedId === deleteConfirm.id) {
        setSelectedId(null);
        setMobileDetail(false);
      }
      setDeleteConfirm(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function getDisplayName(msg) {
    if (msg.sender_id === senderId) {
      return `To: ${msg.recipient_name || 'Staff'}`;
    }
    return msg.sender_name || 'Unknown';
  }

  function getSnippet(content) {
    if (!content) return '';
    return content.length > 100 ? content.slice(0, 100) + '...' : content;
  }

  function formatFullDate(dateString) {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Sort: newest first
  const sorted = [...messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Messages"
        subtitle="Internal staff communication"
        actions={
          <button
            onClick={() => openCompose()}
            className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
          >
            <HiPlus className="h-4 w-4" />
            New Message
          </button>
        }
      />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-accent-500" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading messages...</p>
        </div>
      ) : messages.length === 0 && !error ? (
        <EmptyState
          icon={HiEnvelope}
          title="No messages yet"
          description="Send a message to start communicating with your team."
          action={
            <button
              onClick={() => openCompose()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
            >
              <HiPlus className="h-4 w-4" />
              New Message
            </button>
          }
        />
      ) : !error && (
        /* Two-column layout */
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[380px_1fr] lg:gap-6">
          {/* Left: Message List */}
          <div className={`rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden ${mobileDetail ? 'hidden lg:block' : ''}`}>
            {/* List header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#263554] px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Inbox</h2>
                {unreadCount > 0 && (
                  <Badge variant="info">{unreadCount} unread</Badge>
                )}
              </div>
              <span className="text-xs text-slate-400">{messages.length} messages</span>
            </div>

            {/* Message rows */}
            <div className="divide-y divide-slate-100 dark:divide-[#263554] max-h-[calc(100vh-320px)] overflow-y-auto">
              {sorted.map((msg) => {
                const isUnread = !msg.read && msg.recipient_id === senderId;
                const isSelected = selectedId === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => handleSelect(msg)}
                    className={`w-full text-left px-5 py-4 transition-colors ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-l-brand-500'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1e2d4a]/40 border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread dot */}
                      <div className="mt-1.5 flex-shrink-0">
                        {isUnread ? (
                          <span className="block h-2.5 w-2.5 rounded-full bg-blue-500" />
                        ) : (
                          <span className="block h-2.5 w-2.5 rounded-full bg-transparent" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm ${isUnread ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                            {getDisplayName(msg)}
                          </span>
                          <span className="flex-shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        <p className={`mt-0.5 truncate text-sm ${isUnread ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                          {msg.subject || '(No subject)'}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                          {getSnippet(msg.content)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Message Detail */}
          <div className={`rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden ${!mobileDetail && !selected ? '' : ''} ${mobileDetail ? '' : 'hidden lg:block'}`}>
            {selected ? (
              <div className="flex flex-col h-full">
                {/* Detail header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#263554] px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* Mobile back button */}
                    <button
                      onClick={() => { setMobileDetail(false); setSelectedId(null); }}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
                    >
                      <HiChevronLeft className="h-5 w-5" />
                    </button>
                    <HiEnvelopeOpen className="h-5 w-5 text-brand-500" />
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Message</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openCompose(selected)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a]"
                    >
                      <HiArrowUturnLeft className="h-4 w-4" />
                      Reply
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(selected)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                      title="Delete"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Detail body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selected.subject || '(No subject)'}
                  </h2>

                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-500 dark:text-slate-400 w-12">From</span>
                      <span className="text-slate-900 dark:text-white">{selected.sender_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-500 dark:text-slate-400 w-12">To</span>
                      <span className="text-slate-900 dark:text-white">{selected.recipient_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-500 dark:text-slate-400 w-12">Date</span>
                      <span className="text-slate-500 dark:text-slate-400">{formatFullDate(selected.created_at)}</span>
                    </div>
                  </div>

                  <hr className="border-slate-200 dark:border-[#263554]" />

                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selected.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <HiEnvelope className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-sm text-slate-400 dark:text-slate-500">Select a message to read</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      <Modal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        title="New Message"
        icon={HiPaperAirplane}
        size="lg"
      >
        <form onSubmit={handleSend}>
          <ModalBody>
            <ModalError message={sendError} />
            <div className="space-y-6">
              <FormSelect
                label="To"
                required
                value={composeData.recipient_id}
                onChange={(e) => setComposeData((d) => ({ ...d, recipient_id: e.target.value }))}
              >
                <option value="">Select a staff member...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Subject"
                value={composeData.subject}
                onChange={(e) => setComposeData((d) => ({ ...d, subject: e.target.value }))}
                placeholder="Message subject..."
              />

              <FormTextarea
                label="Message"
                required
                rows={8}
                value={composeData.content}
                onChange={(e) => setComposeData((d) => ({ ...d, content: e.target.value }))}
                placeholder="Write your message..."
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setShowCompose(false)} disabled={sending}>
              Cancel
            </ButtonSecondary>
            <ButtonPrimary
              type="submit"
              loading={sending}
              disabled={!composeData.recipient_id || !composeData.content.trim()}
            >
              <HiPaperAirplane className="h-4 w-4" />
              Send Message
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) { setDeleteConfirm(null); setDeleteError(null); } }}
        >
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-[#162036] p-8 shadow-xl animate-modal-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <HiExclamationTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Message</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.subject || '(No subject)'}"</strong>?
            </p>
            {deleteError && (
              <p className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setDeleteConfirm(null); setDeleteError(null); }}
                disabled={deleting}
                className="rounded-lg border border-slate-200 dark:border-[#263554] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <HiTrash className="h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
