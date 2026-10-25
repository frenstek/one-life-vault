import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HiPaperAirplane,
  HiTrash,
  HiChatBubbleLeftRight,
  HiChevronDown,
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
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

// Avatar color pool based on name hash
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 3 === 0 ? 'justify-end' : ''}`}>
          {i % 3 !== 0 && <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />}
          <div className={`flex flex-col gap-1.5 ${i % 3 === 0 ? 'items-end' : ''}`}>
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className={`h-12 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700 ${i % 2 === 0 ? 'w-56' : 'w-72'}`} />
            <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamChat() {
  const { profile } = useAuth();
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
  const [memberCount, setMemberCount] = useState(0);

  const bottomRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchTeamChat();
      const arr = Array.isArray(data) ? data : [];
      setMessages(arr);

      // Count unique senders
      const unique = new Set(arr.map((m) => m.sender_id));
      setMemberCount(unique.size);
    } catch (err) {
      console.error('Failed to load team chat:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: messages.length - prevMsgCountRef.current > 5 ? 'instant' : 'smooth' });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length]);

  // Scroll-to-bottom button visibility
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBtn(!isNearBottom);
  }, []);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  // Send message
  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !currentUserId) return;

    setSending(true);
    try {
      await sendTeamChat({
        sender_id: currentUserId,
        sender_name: currentUserName,
        sender_role: currentUserRole,
        content: text,
      });
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

  // Delete message
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
  const groupedMessages = [];
  let currentDate = null;
  for (const msg of messages) {
    const dateLabel = getDateLabel(msg.created_at);
    if (dateLabel !== currentDate) {
      currentDate = dateLabel;
      groupedMessages.push({ type: 'date', label: dateLabel, key: `date-${msg.created_at}` });
    }
    groupedMessages.push({ type: 'message', data: msg, key: msg.id });
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-[#f4f4f4] dark:bg-[#0c1425]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700/50 dark:bg-[#162036] sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0ea03e]/10 dark:bg-[#0ea03e]/20">
              <HiChatBubbleLeftRight className="h-5 w-5 text-[#0ea03e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-900 dark:text-white">Team Chat</h1>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                </span>
                {memberCount > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">One Life Foundation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          {loading ? (
            <ChatSkeleton />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <HiChatBubbleLeftRight className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No messages yet</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Start the conversation!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {groupedMessages.map((item, idx) => {
                if (item.type === 'date') {
                  return (
                    <div key={item.key} className="my-4 flex items-center justify-center">
                      <span className="rounded-full bg-slate-200/80 px-3 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-700/80 dark:text-slate-400">
                        {item.label}
                      </span>
                    </div>
                  );
                }

                const msg = item.data;
                const isOwn = msg.sender_id === currentUserId;
                const roleStyle = getRoleStyle(msg.sender_role);

                // Check if previous message is from same sender (for grouping)
                const prevItem = groupedMessages[idx - 1];
                const isSameSender = prevItem?.type === 'message' && prevItem.data.sender_id === msg.sender_id;

                return (
                  <div
                    key={item.key}
                    className={`group flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''} ${isSameSender ? 'mt-0.5' : 'mt-3'}`}
                  >
                    {/* Avatar */}
                    {!isOwn && (
                      <div className={`flex-shrink-0 ${isSameSender ? 'invisible' : ''}`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(msg.sender_name)}`}>
                          {getInitials(msg.sender_name)}
                        </div>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`relative max-w-[75%] sm:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {/* Name + role badge */}
                      {!isSameSender && (
                        <div className={`mb-1 flex items-center gap-1.5 ${isOwn ? 'justify-end pr-1' : 'pl-1'}`}>
                          <span className={`text-xs font-semibold ${isOwn ? 'text-slate-500 dark:text-slate-400' : roleStyle.text}`}>
                            {isOwn ? 'You' : msg.sender_name}
                          </span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                            {roleStyle.label}
                          </span>
                        </div>
                      )}

                      <div className="flex items-end gap-1.5">
                        {/* Delete button (own messages only) */}
                        {isOwn && (
                          <button
                            onClick={() => setDeleteConfirm(msg.id)}
                            className="mb-1 flex-shrink-0 rounded-full p-1 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            title="Delete message"
                          >
                            <HiTrash className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <div
                          className={`rounded-2xl px-3.5 py-2 ${
                            isOwn
                              ? 'rounded-br-md bg-[#0ea03e] text-white'
                              : 'rounded-bl-md bg-white text-slate-800 dark:bg-[#1e2d4a] dark:text-slate-100'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                          <p className={`mt-0.5 text-right text-[10px] ${isOwn ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>

                        {/* Delete button (other's messages — admin only) */}
                        {!isOwn && (currentUserRole === 'admin' || currentUserRole === 'owner') && (
                          <button
                            onClick={() => setDeleteConfirm(msg.id)}
                            className="mb-1 flex-shrink-0 rounded-full p-1 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            title="Delete message"
                          >
                            <HiTrash className="h-3.5 w-3.5" />
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

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl dark:bg-[#1e2d4a] dark:text-slate-300 dark:hover:bg-[#263a5a] sm:right-[calc(50%-32rem+1.5rem)]"
          >
            <HiChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Delete confirmation overlay */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-[#162036]">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Delete message?</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
            {actionError && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{actionError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setDeleteConfirm(null); setActionError(''); }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700/50 dark:bg-[#162036] sm:px-6">
        <div className="mx-auto max-w-4xl">
          {actionError && !deleteConfirm && (
            <p className="mb-1.5 px-1 text-xs text-red-500 dark:text-red-400">{actionError}</p>
          )}
          {currentUserName && (
            <div className="mb-1.5 flex items-center gap-1.5 px-1">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white ${getAvatarColor(currentUserName)}`}>
                {getInitials(currentUserName)}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Chatting as <span className="font-medium text-slate-600 dark:text-slate-300">{currentUserName}</span>
              </span>
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${getRoleStyle(currentUserRole).bg} ${getRoleStyle(currentUserRole).text}`}>
                {getRoleStyle(currentUserRole).label}
              </span>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentUserId ? 'Type a message...' : 'Loading your profile...'}
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[#0ea03e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0ea03e]/20 dark:border-slate-600 dark:bg-[#0c1a2e] dark:text-white dark:placeholder-slate-500 dark:focus:border-[#0ea03e] dark:focus:bg-[#0c1a2e] dark:focus:ring-[#0ea03e]/20"
                disabled={sending || !currentUserId}
                maxLength={2000}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || sending || !currentUserId}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0ea03e] text-white transition-all hover:bg-[#0c8a35] disabled:opacity-40 disabled:hover:bg-[#0ea03e]"
            >
              <HiPaperAirplane className={`h-4.5 w-4.5 ${sending ? 'animate-pulse' : ''}`} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
