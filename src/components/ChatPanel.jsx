import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiPaperAirplane,
  HiTrash,
  HiChatBubbleLeftRight,
  HiXMark,
  HiChevronDown,
  HiArrowsPointingOut,
} from 'react-icons/hi2';
import { fetchTeamChat, sendTeamChat, deleteTeamChat } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_COLORS = {
  owner: { text: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/20', label: 'Owner' },
  admin: { text: 'text-red-500 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/20', label: 'Admin' },
  manager: { text: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20', label: 'Manager' },
  staff: { text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-500/20', label: 'Staff' },
};

function getRoleStyle(role) {
  return ROLE_COLORS[role] || ROLE_COLORS.staff;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getDateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - msgDate) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-pink-500',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatPanel({ open, onClose }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const currentUserId = profile?.id;
  const currentUserName = profile?.full_name || '';
  const currentUserRole = profile?.role || 'staff';

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionError, setActionError] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchTeamChat();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load team chat:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll only when open
  useEffect(() => {
    if (!open) return;
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [open, loadMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: messages.length - prevMsgCountRef.current > 5 ? 'instant' : 'smooth' });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !currentUserId) return;
    setSending(true);
    try {
      await sendTeamChat({ sender_id: currentUserId, sender_name: currentUserName, sender_role: currentUserRole, content: text });
      setInput('');
      await loadMessages();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to send:', err);
      setActionError(err.message || 'Message not sent. Try again.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleDelete(id) {
    setActionError('');
    try {
      await deleteTeamChat(id, currentUserId, currentUserRole);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setDeleteConfirm(null); // only close on success — a failed delete keeps the dialog + shows why
    } catch (err) {
      console.error('Failed to delete:', err);
      setActionError(err.message || 'Could not delete the message.');
    }
  }

  // Group messages by date
  const grouped = [];
  let curDate = null;
  for (const msg of messages) {
    const label = getDateLabel(msg.created_at);
    if (label !== curDate) {
      curDate = label;
      grouped.push({ type: 'date', label, key: `d-${msg.created_at}` });
    }
    grouped.push({ type: 'msg', data: msg, key: msg.id });
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={onClose} />

      {/* Panel */}
      <div className="fixed bottom-0 right-0 z-50 flex h-[min(600px,calc(100vh-80px))] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#263554] dark:bg-[#0c1425] sm:bottom-4 sm:right-4 sm:w-[380px] sm:rounded-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-[#263554] dark:bg-[#162036]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0ea03e]/10 dark:bg-[#0ea03e]/20">
              <HiChatBubbleLeftRight className="h-4 w-4 text-[#0ea03e]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Team Chat</span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
              </div>
              {currentUserName && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {currentUserName} &middot; {getRoleStyle(currentUserRole).label}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onClose(); navigate('/team-chat'); }}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#1e2d4a] dark:hover:text-slate-300"
              title="Open full chat"
            >
              <HiArrowsPointingOut className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#1e2d4a] dark:hover:text-slate-300"
            >
              <HiXMark className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollAreaRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto">
          <div className="px-3 py-3">
            {loading ? (
              <div className="flex flex-col gap-3 py-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`flex gap-2 ${i % 2 === 0 ? '' : 'justify-end'}`}>
                    {i % 2 === 0 && <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />}
                    <div className={`flex flex-col gap-1 ${i % 2 !== 0 ? 'items-end' : ''}`}>
                      <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      <div className={`h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${i % 2 === 0 ? 'w-44' : 'w-36'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <HiChatBubbleLeftRight className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No messages yet</p>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">Start the conversation!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {grouped.map((item, idx) => {
                  if (item.type === 'date') {
                    return (
                      <div key={item.key} className="my-2.5 flex items-center justify-center">
                        <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700/80 dark:text-slate-400">
                          {item.label}
                        </span>
                      </div>
                    );
                  }

                  const msg = item.data;
                  const isOwn = msg.sender_id === currentUserId;
                  const roleStyle = getRoleStyle(msg.sender_role);
                  const prevItem = grouped[idx - 1];
                  const isSameSender = prevItem?.type === 'msg' && prevItem.data.sender_id === msg.sender_id;

                  return (
                    <div key={item.key} className={`group flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''} ${isSameSender ? 'mt-0.5' : 'mt-2'}`}>
                      {/* Avatar */}
                      {!isOwn && (
                        <div className={`flex-shrink-0 ${isSameSender ? 'invisible' : ''}`}>
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white ${getAvatarColor(msg.sender_name)}`}>
                            {getInitials(msg.sender_name)}
                          </div>
                        </div>
                      )}

                      <div className={`relative max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        {/* Name */}
                        {!isSameSender && (
                          <div className={`mb-0.5 flex items-center gap-1 ${isOwn ? 'justify-end pr-0.5' : 'pl-0.5'}`}>
                            <span className={`text-[10px] font-semibold ${isOwn ? 'text-slate-400 dark:text-slate-500' : roleStyle.text}`}>
                              {isOwn ? 'You' : msg.sender_name}
                            </span>
                            <span className={`rounded px-1 py-px text-[8px] font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                              {roleStyle.label}
                            </span>
                          </div>
                        )}

                        <div className="flex items-end gap-1">
                          {isOwn && (
                            <button
                              onClick={() => setDeleteConfirm(msg.id)}
                              className="mb-0.5 flex-shrink-0 rounded-full p-0.5 text-slate-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:text-red-400"
                            >
                              <HiTrash className="h-3 w-3" />
                            </button>
                          )}

                          <div className={`rounded-xl px-3 py-1.5 ${isOwn ? 'rounded-br-sm bg-[#0ea03e] text-white' : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-[#1e2d4a] dark:text-slate-100'}`}>
                            <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</p>
                            <p className={`mt-0.5 text-right text-[9px] ${isOwn ? 'text-white/50' : 'text-slate-400 dark:text-slate-500'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>

                          {!isOwn && (currentUserRole === 'admin' || currentUserRole === 'owner') && (
                            <button
                              onClick={() => setDeleteConfirm(msg.id)}
                              className="mb-0.5 flex-shrink-0 rounded-full p-0.5 text-slate-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:text-red-400"
                            >
                              <HiTrash className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Scroll to bottom */}
          {showScrollBtn && (
            <button
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute bottom-2 left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-white text-slate-500 shadow-md dark:bg-[#1e2d4a] dark:text-slate-400"
            >
              <HiChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Delete confirmation */}
        {deleteConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-xs rounded-xl bg-white p-4 shadow-xl dark:bg-[#162036]">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Delete message?</p>
              <p className="mt-0.5 text-xs text-slate-500">This can't be undone.</p>
              {actionError && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{actionError}</p>}
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => { setDeleteConfirm(null); setActionError(''); }} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-3 py-2.5 dark:border-[#263554] dark:bg-[#162036]">
          {actionError && !deleteConfirm && (
            <p className="mb-1.5 px-1 text-[11px] text-red-500 dark:text-red-400">{actionError}</p>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentUserId ? 'Type a message...' : 'Loading...'}
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-[13px] text-slate-900 placeholder-slate-400 transition-colors focus:border-[#0ea03e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0ea03e]/20 dark:border-slate-600 dark:bg-[#0c1a2e] dark:text-white dark:placeholder-slate-500 dark:focus:border-[#0ea03e]"
              disabled={sending || !currentUserId}
              maxLength={2000}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || !currentUserId}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0ea03e] text-white transition-all hover:bg-[#0c8a35] disabled:opacity-40"
            >
              <HiPaperAirplane className={`h-4 w-4 ${sending ? 'animate-pulse' : ''}`} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
