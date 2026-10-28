import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiTrash,
  HiClipboardDocumentList,
  HiExclamationTriangle,
  HiCalendarDays,
  HiUserGroup,
  HiClock,
  HiHeart,
  HiListBullet,
  HiQueueList,
  HiUser,
  HiArrowsUpDown,
} from 'react-icons/hi2';
import {
  fetchProgressNotes,
  fetchProgressNoteStats,
  fetchMissingNotes,
  createProgressNote,
  updateProgressNote,
  deleteProgressNote,
  fetchParticipants,
} from '../lib/api';
import {
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
} from '../components/ui/FormComponents';
import Modal, {
  ModalBody,
  ModalFooter,
  ButtonPrimary,
  ButtonSecondary,
  ButtonDanger,
  ModalError,
} from '../components/ui/Modal';
import { SkeletonCard, SkeletonStatCard } from '../components/ui/Skeleton';
import ProgressNoteForm from '../components/ProgressNoteForm';
import { shiftTimeLabel } from '../lib/shiftTime';
import ProgressNotesPDF from '../components/ProgressNotesPDF';

const MOOD_BADGE = {
  Happy: 'success',
  Content: 'success',
  Neutral: 'default',
  Anxious: 'warning',
  Agitated: 'warning',
  Upset: 'danger',
};

const SLEEP_BADGE = {
  Good: 'success',
  Fair: 'default',
  Poor: 'warning',
  Restless: 'danger',
};

function formatNoteDate(d) {
  if (!d) return '--';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(d) {
  if (!d) return '--';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Group notes by date for list view
function groupByDate(notes, order = 'newest') {
  const groups = {};
  for (const note of notes) {
    const key = note.note_date || 'Unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(note);
  }
  // Sort dates based on order
  return Object.entries(groups).sort(([a], [b]) =>
    order === 'newest' ? b.localeCompare(a) : a.localeCompare(b)
  );
}

export default function ProgressNotes() {
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [missing, setMissing] = useState(null);  // missing-notes check, last 7 days
  useEffect(() => { fetchMissingNotes(7).then(setMissing).catch(() => setMissing(null)); }, [notes.length]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [participantFilter, setParticipantFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // View toggle
  const [view, setView] = useState('list'); // 'list' | 'timeline'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function loadData() {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchProgressNotes(
        participantFilter || undefined,
        startDate || undefined,
        endDate || undefined,
        undefined,
      ),
      fetchProgressNoteStats(),
      fetchParticipants('active').catch(() => []),
    ])
      .then(([notesData, statsData, participantData]) => {
        setNotes(Array.isArray(notesData) ? notesData : []);
        setStats(statsData);
        const pList = Array.isArray(participantData) ? participantData : participantData?.participants || [];
        setParticipants(pList);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [participantFilter, startDate, endDate]);

  // Client-side search filtering
  const filtered = notes.filter(note => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (note.participant_name || '').toLowerCase().includes(q) ||
      (note.staff_name || '').toLowerCase().includes(q) ||
      (note.content || '').toLowerCase().includes(q) ||
      (note.concerns || '').toLowerCase().includes(q) ||
      (note.medication_notes || '').toLowerCase().includes(q) ||
      (note.activities || '').toLowerCase().includes(q)
    );
  });

  const grouped = groupByDate(filtered, sortOrder);

  // Participant name list for form dropdown (active clients only)
  const participantNames = [
    ...new Set(
      participants.map(p => `${p.first_name || ''} ${p.last_name || ''}`.trim()).filter(Boolean)
    ),
  ].sort();

  // Unique participants for the filter dropdown
  const filterParticipants = [...new Set(notes.map(n => n.participant_name).filter(Boolean))].sort();

  // ─── Handlers ──────────────────────────────────────────────────

  function openCreateModal() {
    setEditingNote(null);
    setFormOpen(true);
  }

  function openEditModal(note) {
    setEditingNote(note);
    setFormOpen(true);
  }

  async function handleSave(formData) {
    if (editingNote) {
      await updateProgressNote(editingNote.id, formData);
    } else {
      await createProgressNote(formData);
    }
    loadData();
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteProgressNote(deleteConfirm.id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Stat cards ────────────────────────────────────────────────

  const totalNotes = stats?.total || 0;
  const participantCount = stats?.participants || 0;
  const concernCount = stats?.with_concerns || 0;

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        title="Progress Notes"
        subtitle="Daily shift records for participants"
        actions={
          <div className="flex items-center gap-2">
            <ProgressNotesPDF
              participantNames={filterParticipants}
              currentFilters={{
                participant: participantFilter,
                startDate,
                endDate,
              }}
            />
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
            >
              <HiPlus className="h-4 w-4" />
              Add Note
            </button>
          </div>
        }
      />

      {/* Missing notes banner (29 Oct 2026) */}
      {missing && missing.summary.missing_days > 0 && (
        <Link to="/notes-check" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          <span className="flex items-center gap-2 font-semibold"><HiExclamationTriangle className="h-5 w-5" />
            {missing.summary.missing_days} day{missing.summary.missing_days === 1 ? '' : 's'} with no progress note in the last 7 days
          </span>
          <span className="text-xs">
            {missing.participants.filter(p => p.missing.length).map(p => `${p.name}: ${p.missing.map(m => new Date(m.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })).join(', ')}`).join(' · ')} — open Notes Check
          </span>
        </Link>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              icon={HiClipboardDocumentList}
              label="Total Notes"
              value={totalNotes}
              color="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
            />
            <StatCard
              icon={HiUserGroup}
              label="Participants"
              value={participantCount}
              color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="With Concerns"
              value={concernCount}
              color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              borderColor={concernCount > 0 ? 'border-l-amber-500' : ''}
            />
            <StatCard
              icon={HiCalendarDays}
              label="This Week"
              value={
                notes.filter(n => {
                  if (!n.note_date) return false;
                  const d = new Date(n.note_date + 'T00:00:00');
                  const now = new Date();
                  const weekAgo = new Date(now);
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return d >= weekAgo;
                }).length
              }
              color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            />
          </>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-4 sm:flex-row sm:items-end">
        {/* Participant filter */}
        <div className="flex-1 min-w-0">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Participant</label>
          <select
            value={participantFilter}
            onChange={e => setParticipantFilter(e.target.value)}
            className="w-full text-sm"
          >
            <option value="">All Participants</option>
            {filterParticipants.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="min-w-0">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">From</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full text-sm"
          />
        </div>
        <div className="min-w-0">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">To</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full text-sm"
          />
        </div>

        {/* Search */}
        <div className="flex-1 min-w-0">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Search</label>
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 text-sm"
            />
          </div>
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors flex-shrink-0"
          title={sortOrder === 'newest' ? 'Showing newest first' : 'Showing oldest first'}
        >
          <HiArrowsUpDown className="h-4 w-4" />
          {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
        </button>

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 dark:border-[#334766] overflow-hidden flex-shrink-0">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
              view === 'list'
                ? 'bg-brand-500 text-white'
                : 'bg-white dark:bg-[#162036] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
            }`}
          >
            <HiListBullet className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setView('timeline')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
              view === 'timeline'
                ? 'bg-brand-500 text-white'
                : 'bg-white dark:bg-[#162036] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
            }`}
          >
            <HiQueueList className="h-4 w-4" />
            Timeline
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HiClipboardDocumentList}
          title="No progress notes found"
          description={search || participantFilter || startDate ? 'Try adjusting your filters' : 'Click "Add Note" to create the first progress note'}
          action={
            !search && !participantFilter && !startDate && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
              >
                <HiPlus className="h-4 w-4" />
                Add Note
              </button>
            )
          }
        />
      ) : view === 'list' ? (
        <ListView
          grouped={grouped}
          onEdit={openEditModal}
          onDelete={setDeleteConfirm}
        />
      ) : (
        <TimelineView
          grouped={grouped}
          onEdit={openEditModal}
          onDelete={setDeleteConfirm}
        />
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Showing {filtered.length} note{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Create/Edit Modal */}
      <ProgressNoteForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingNote(null); }}
        onSave={handleSave}
        editingNote={editingNote}
        participantNames={participantNames}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Progress Note"
        icon={HiTrash}
        iconColor="text-red-500"
        size="sm"
      >
        <ModalBody>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete this progress note for{' '}
            <span className="font-semibold">{deleteConfirm?.participant_name}</span> on{' '}
            <span className="font-semibold">{formatShortDate(deleteConfirm?.note_date)}</span>?
          </p>
          <p className="mt-2 text-xs text-slate-400">This action cannot be undone.</p>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteConfirm(null)}>Cancel</ButtonSecondary>
          <ButtonDanger onClick={handleDelete} loading={deleting}>Delete</ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── List View ─────────────────────────────────────────────────────────────────

function ListView({ grouped, onEdit, onDelete }) {
  return (
    <div className="space-y-8">
      {grouped.map(([date, notes]) => (
        <div key={date}>
          {/* Date header */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
              <HiCalendarDays className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {formatNoteDate(date)}
            </h3>
            <Badge variant="default">{notes.length} note{notes.length !== 1 ? 's' : ''}</Badge>
          </div>

          {/* Note cards */}
          <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-[#263554] ml-4">
            {notes.map(note => (
              <NoteCard key={note.id} note={note} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline View ─────────────────────────────────────────────────────────────

function TimelineView({ grouped, onEdit, onDelete }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-[#263554]" />

      <div className="space-y-6">
        {grouped.map(([date, notes]) => (
          <div key={date}>
            {/* Date marker */}
            <div className="relative mb-4 flex items-center gap-4">
              <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-white shadow-md">
                <HiCalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatNoteDate(date)}
                </h3>
                <p className="text-xs text-slate-400">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Notes under this date */}
            <div className="space-y-4 pl-14">
              {notes.map(note => (
                <div key={note.id} className="relative">
                  {/* Dot on timeline */}
                  <div className="absolute -left-[37px] top-5 z-10 h-3 w-3 rounded-full border-2 border-white dark:border-[#0c1425] bg-slate-300 dark:bg-slate-600" />
                  <NoteCard note={note} onEdit={onEdit} onDelete={onDelete} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Note Card ─────────────────────────────────────────────────────────────────

function NoteCard({ note, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const hasBSL = note.bsl_reading && note.bsl_reading.trim();
  const hasMeds = note.medication_notes && note.medication_notes.trim();
  const hasConcerns = note.concerns && note.concerns.trim();
  const hasMeals = note.meals && note.meals.trim();
  const hasActivities = note.activities && note.activities.trim();
  const hasExtras = hasBSL || hasMeds || hasConcerns || hasMeals || hasActivities;

  return (
    <div className="group rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] transition-shadow hover:shadow-md overflow-hidden">
      {/* Main content */}
      <div className="p-5 overflow-hidden">
        {/* Top row: meta */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {note.participant_name}
          </span>
          {shiftTimeLabel(note.shift) && (
            <Badge variant="info">{shiftTimeLabel(note.shift)}</Badge>
          )}
          {note.mood && (
            <Badge variant={MOOD_BADGE[note.mood] || 'default'}>
              {note.mood}
            </Badge>
          )}
          {note.sleep_quality && (
            <Badge variant={SLEEP_BADGE[note.sleep_quality] || 'default'}>
              Sleep: {note.sleep_quality}
            </Badge>
          )}
          {hasConcerns && (
            <Badge variant="warning">
              <HiExclamationTriangle className="mr-1 h-3 w-3" />
              Concerns
            </Badge>
          )}
        </div>

        {/* Staff & time info */}
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {note.staff_name && (
            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
              <HiUser className="h-3.5 w-3.5 text-brand-500" />
              {note.staff_name}
            </span>
          )}
          {(note.note_date || note.created_at) && (
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <HiClock className="h-3.5 w-3.5" />
              {note.note_date
                ? new Date(note.note_date + 'T00:00:00').toLocaleDateString('en-AU', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                : new Date(note.created_at).toLocaleString('en-AU', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
              }
            </span>
          )}
          {note.day_of_week && (
            <span className="text-slate-400 dark:text-slate-500">{note.day_of_week}</span>
          )}
        </div>

        {/* Main content text */}
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">
          {note.content}
        </p>

        {/* BSL Reading — always visible if present */}
        {hasBSL && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <HiHeart className="h-3.5 w-3.5" />
            BSL: {note.bsl_reading}
          </div>
        )}

        {/* Concerns — always visible if present */}
        {hasConcerns && (
          <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
              <HiExclamationTriangle className="mr-1 inline h-3.5 w-3.5" />
              Concerns
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{note.concerns}</p>
          </div>
        )}

        {/* Expandable extras */}
        {hasExtras && (hasMeds || hasMeals || hasActivities) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {expanded ? 'Show less' : 'Show more details'}
          </button>
        )}

        {expanded && (
          <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-[#263554] pt-3">
            {hasMeds && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Medication Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{note.medication_notes}</p>
              </div>
            )}
            {hasMeals && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Meals</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{note.meals}</p>
              </div>
            )}
            {hasActivities && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Activities</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{note.activities}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-[#263554] px-5 py-3">
        <p className="text-[11px] text-slate-400">
          {note.note_date
            ? new Date(note.note_date + 'T00:00:00').toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : note.created_at
              ? new Date(note.created_at).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : ''}
        </p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(note)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
            title="Edit"
          >
            <HiPencilSquare className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(note)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            title="Delete"
          >
            <HiTrash className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
