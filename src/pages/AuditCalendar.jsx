import { useState, useEffect, useMemo } from 'react';
import {
  HiPlus,
  HiChevronLeft,
  HiChevronRight,
  HiCalendarDays,
  HiCheckCircle,
  HiClock,
  HiExclamationTriangle,
  HiPencilSquare,
  HiTrash,
  HiXMark,
  HiClipboardDocumentCheck,
  HiShieldCheck,
  HiDocumentText,
  HiUserGroup,
  HiBuildingOffice2,
  HiAcademicCap,
  HiEye,
} from 'react-icons/hi2';
import {
  fetchAuditEvents,
  createAuditEvent,
  updateAuditEvent,
  deleteAuditEvent,
  formatDate,
} from '../lib/api';
import { toLocalDate } from '../lib/dates';
import {
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
  FormInput,
  FormSelect,
  FormTextarea,
  FormRow,
} from '../components/ui/FormComponents';
import Modal, {
  ModalBody,
  ModalFooter,
  ButtonPrimary,
  ButtonSecondary,
  ButtonDanger,
  ModalError,
} from '../components/ui/Modal';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_TYPES = {
  audit: { label: 'Audit', icon: HiClipboardDocumentCheck, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  review: { label: 'Review', icon: HiEye, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  inspection: { label: 'Inspection', icon: HiBuildingOffice2, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  training: { label: 'Training', icon: HiAcademicCap, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  compliance: { label: 'Compliance', icon: HiShieldCheck, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  policy: { label: 'Policy Review', icon: HiDocumentText, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  meeting: { label: 'Meeting', icon: HiUserGroup, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
  deadline: { label: 'Deadline', icon: HiExclamationTriangle, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', dot: 'bg-red-500' },
};

const CATEGORIES = [
  'NDIS Practice Standards',
  'Quality Management',
  'WHS',
  'Human Resources',
  'Participant Rights',
  'Governance',
  'Risk Management',
  'Financial',
  'Incident Management',
  'Complaints & Feedback',
  'Other',
];

const STATUS_CFG = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

const PRIORITY_CFG = {
  low: { label: 'Low', variant: 'default' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  critical: { label: 'Critical', variant: 'danger' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const INITIAL_FORM = {
  title: '',
  event_type: 'audit',
  event_date: '',
  end_date: '',
  status: 'scheduled',
  priority: 'medium',
  assigned_to: '',
  category: '',
  description: '',
  notes: '',
  recurrence: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function isToday(dateStr) {
  return dateStr === toLocalDate();
}

function isPast(dateStr) {
  return dateStr < toLocalDate();
}

function formatDateNice(d) {
  if (!d) return '--';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AuditCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar state — start from March 2026
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // View
  const [view, setView] = useState('calendar'); // 'calendar' | 'list'

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  function loadData() {
    setLoading(true);
    setError(null);
    fetchAuditEvents()
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  // Group events by date for calendar
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      if (!ev.event_date) continue;
      if (!map[ev.event_date]) map[ev.event_date] = [];
      map[ev.event_date].push(ev);
    }
    return map;
  }, [events]);

  // Filtered events for list view
  const filtered = useMemo(() => {
    return events.filter(ev => {
      if (typeFilter && ev.event_type !== typeFilter) return false;
      if (statusFilter && ev.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => a.event_date.localeCompare(b.event_date));
  }, [events, typeFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const today = toLocalDate();
    const upcoming = events.filter(e => e.event_date >= today && e.status !== 'completed' && e.status !== 'cancelled');
    const overdue = events.filter(e => e.event_date < today && e.status !== 'completed' && e.status !== 'cancelled');
    const completed = events.filter(e => e.status === 'completed');
    const thisMonth = events.filter(e => {
      const d = e.event_date;
      return d && d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
    });
    return { upcoming: upcoming.length, overdue: overdue.length, completed: completed.length, thisMonth: thisMonth.length };
  }, [events, year, month]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Previous month padding
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevDays = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      days.push({ day: d, date: toDateStr(prevYear, prevMonth, d), current: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, date: toDateStr(year, month, d), current: true });
    }

    // Next month padding
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, date: toDateStr(nextYear, nextMonth, d), current: false });
    }

    return days;
  }, [year, month]);

  // ─── Handlers ────────────────────────────────────────────────────

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function goToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  function openCreate(date) {
    setEditing(null);
    setForm({ ...INITIAL_FORM, event_date: date || '' });
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(ev) {
    setEditing(ev);
    setForm({
      title: ev.title || '',
      event_type: ev.event_type || 'audit',
      event_date: ev.event_date || '',
      end_date: ev.end_date || '',
      status: ev.status || 'scheduled',
      priority: ev.priority || 'medium',
      assigned_to: ev.assigned_to || '',
      category: ev.category || '',
      description: ev.description || '',
      notes: ev.notes || '',
      recurrence: ev.recurrence || '',
    });
    setFormError('');
    setDetailEvent(null);
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date) {
      setFormError('Title and date are required');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await updateAuditEvent(editing.id, form);
      } else {
        await createAuditEvent(form);
      }
      setFormOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteAuditEvent(deleteConfirm.id);
      setDeleteConfirm(null);
      setDetailEvent(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function markComplete(ev) {
    try {
      await updateAuditEvent(ev.id, {
        status: 'completed',
        completed_date: toLocalDate(),
      });
      setDetailEvent(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Calendar"
        subtitle="Track audits, reviews, inspections, and compliance deadlines"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreate()}
              className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
            >
              <HiPlus className="h-4 w-4" />
              Add Event
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></>
        ) : (
          <>
            <StatCard icon={HiCalendarDays} label="This Month" value={stats.thisMonth} color="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400" />
            <StatCard icon={HiClock} label="Upcoming" value={stats.upcoming} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" />
            <StatCard icon={HiExclamationTriangle} label="Overdue" value={stats.overdue} color="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" borderColor={stats.overdue > 0 ? 'border-l-red-500' : ''} />
            <StatCard icon={HiCheckCircle} label="Completed" value={stats.completed} color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" />
          </>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-4">
        {/* Month nav row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-white transition-colors">
              <HiChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="min-w-[140px] text-center text-lg font-bold text-slate-900 dark:text-white">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-white transition-colors">
              <HiChevronRight className="h-5 w-5" />
            </button>
            <button onClick={goToToday} className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
              Today
            </button>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 dark:border-[#334766] overflow-hidden shrink-0">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${view === 'calendar' ? 'bg-brand-500 text-white' : 'bg-white dark:bg-[#162036] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${view === 'list' ? 'bg-brand-500 text-white' : 'bg-white dark:bg-[#162036] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'}`}
            >
              List
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-slate-600 dark:text-slate-300"
          >
            <option value="">All Types</option>
            {Object.entries(EVENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2 text-slate-600 dark:text-slate-300"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Calendar View */}
      {loading ? (
        <SkeletonGrid />
      ) : view === 'calendar' ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-[#263554]">
            {DAYS.map(d => (
              <div key={d} className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((cell, i) => {
              const dayEvents = (eventsByDate[cell.date] || []).filter(ev => {
                if (typeFilter && ev.event_type !== typeFilter) return false;
                if (statusFilter && ev.status !== statusFilter) return false;
                return true;
              });
              const today = isToday(cell.date);

              return (
                <div
                  key={cell.date}
                  className={`min-h-[100px] border-b border-r border-slate-100 dark:border-[#1e2d4a] p-1.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-[#1a2845] cursor-pointer ${
                    !cell.current ? 'bg-slate-50/50 dark:bg-[#0f1a2e]' : ''
                  }`}
                  onClick={() => openCreate(cell.date)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                      today
                        ? 'bg-accent-500 text-white font-bold'
                        : cell.current
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-300 dark:text-slate-600'
                    }`}>
                      {cell.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => {
                      const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.audit;
                      return (
                        <button
                          key={ev.id}
                          onClick={e => { e.stopPropagation(); setDetailEvent(ev); }}
                          className={`w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium transition-opacity hover:opacity-80 ${cfg.color} ${
                            ev.status === 'completed' ? 'opacity-50 line-through' : ''
                          }`}
                        >
                          {ev.title}
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 pl-1">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon={HiCalendarDays}
              title="No audit events found"
              description="Create your first audit event to start tracking compliance activities"
              action={
                <button onClick={() => openCreate()} className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600">
                  <HiPlus className="h-4 w-4" /> Add Event
                </button>
              }
            />
          ) : (
            filtered.map(ev => {
              const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.audit;
              const stCfg = STATUS_CFG[ev.status] || STATUS_CFG.scheduled;
              const priCfg = PRIORITY_CFG[ev.priority] || PRIORITY_CFG.medium;
              const overdue = isPast(ev.event_date) && ev.status !== 'completed' && ev.status !== 'cancelled';
              const Icon = cfg.icon;

              return (
                <div
                  key={ev.id}
                  className={`group flex items-start gap-4 rounded-xl border bg-white dark:bg-[#162036] p-5 transition-colors hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer ${
                    overdue ? 'border-red-200 dark:border-red-800/50' : 'border-slate-200 dark:border-[#263554]'
                  }`}
                  onClick={() => setDetailEvent(ev)}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-semibold text-slate-900 dark:text-white ${ev.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                        {ev.title}
                      </h3>
                      <Badge variant={stCfg.variant}>{overdue ? 'Overdue' : stCfg.label}</Badge>
                      <Badge variant={priCfg.variant}>{priCfg.label}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatDateNice(ev.event_date)}</span>
                      {ev.category && <span className="text-slate-300 dark:text-slate-600">|</span>}
                      {ev.category && <span>{ev.category}</span>}
                      {ev.assigned_to && <span className="text-slate-300 dark:text-slate-600">|</span>}
                      {ev.assigned_to && <span>{ev.assigned_to}</span>}
                    </div>
                    {ev.description && (
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{ev.description}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(EVENT_TYPES).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${v.dot}`} />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{v.label}</span>
          </div>
        ))}
      </div>

      {/* ─── Detail Modal ─── */}
      {detailEvent && (
        <Modal isOpen={true} onClose={() => setDetailEvent(null)} title={detailEvent.title} icon={EVENT_TYPES[detailEvent.event_type]?.icon || HiCalendarDays} size="md">
          <ModalBody>
            {(() => {
              const ev = detailEvent;
              const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.audit;
              const stCfg = STATUS_CFG[ev.status] || STATUS_CFG.scheduled;
              const priCfg = PRIORITY_CFG[ev.priority] || PRIORITY_CFG.medium;
              const overdue = isPast(ev.event_date) && ev.status !== 'completed' && ev.status !== 'cancelled';

              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">{cfg.label}</Badge>
                    <Badge variant={stCfg.variant}>{overdue ? 'Overdue' : stCfg.label}</Badge>
                    <Badge variant={priCfg.variant}>{priCfg.label} Priority</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Date</span>
                      <p className="text-slate-700 dark:text-slate-300">{formatDateNice(ev.event_date)}</p>
                    </div>
                    {ev.end_date && (
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">End Date</span>
                        <p className="text-slate-700 dark:text-slate-300">{formatDateNice(ev.end_date)}</p>
                      </div>
                    )}
                    {ev.category && (
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Category</span>
                        <p className="text-slate-700 dark:text-slate-300">{ev.category}</p>
                      </div>
                    )}
                    {ev.assigned_to && (
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Assigned To</span>
                        <p className="text-slate-700 dark:text-slate-300">{ev.assigned_to}</p>
                      </div>
                    )}
                    {ev.recurrence && (
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Recurrence</span>
                        <p className="text-slate-700 dark:text-slate-300">{ev.recurrence}</p>
                      </div>
                    )}
                    {ev.completed_date && (
                      <div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Completed</span>
                        <p className="text-slate-700 dark:text-slate-300">{formatDateNice(ev.completed_date)}</p>
                      </div>
                    )}
                  </div>

                  {ev.description && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Description</span>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ev.description}</p>
                    </div>
                  )}

                  {ev.notes && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Notes</span>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ev.notes}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </ModalBody>
          <ModalFooter>
            <div className="flex w-full items-center justify-between">
              <ButtonDanger onClick={() => { setDeleteConfirm(detailEvent); }}>Delete</ButtonDanger>
              <div className="flex gap-2">
                {detailEvent.status !== 'completed' && (
                  <button
                    onClick={() => markComplete(detailEvent)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-2.5 text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <HiCheckCircle className="h-4 w-4" />
                    Complete
                  </button>
                )}
                <ButtonPrimary onClick={() => openEdit(detailEvent)}>Edit</ButtonPrimary>
              </div>
            </div>
          </ModalFooter>
        </Modal>
      )}

      {/* ─── Create/Edit Modal ─── */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Event' : 'New Audit Event'} icon={HiCalendarDays} size="lg">
        <form onSubmit={handleSave}>
          <ModalBody>
            <div className="space-y-4">
              <FormInput label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. NDIS Mid-Term Audit" required />

              <FormRow>
                <FormSelect label="Event Type" value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
                  {Object.entries(EVENT_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </FormSelect>
                <FormSelect label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </FormSelect>
              </FormRow>

              <FormRow>
                <FormInput label="Event Date *" type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} required />
                <FormInput label="End Date" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </FormRow>

              <FormRow>
                <FormSelect label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS_CFG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </FormSelect>
                <FormSelect label="Priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {Object.entries(PRIORITY_CFG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </FormSelect>
              </FormRow>

              <FormRow>
                <FormInput label="Assigned To" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="e.g. Kevin Geronimo" />
                <FormSelect label="Recurrence" value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
                  <option value="">None</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="biannually">Every 6 Months</option>
                  <option value="annually">Annually</option>
                </FormSelect>
              </FormRow>

              <FormTextarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What needs to happen..." rows={3} />
              <FormTextarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} />

              {formError && <ModalError message={formError} />}
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setFormOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving} disabled={saving}>
              {editing ? 'Save Changes' : 'Create Event'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── Delete Confirm ─── */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Event" icon={HiTrash} iconColor="text-red-500" size="sm">
        <ModalBody>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>? This cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteConfirm(null)}>Cancel</ButtonSecondary>
          <ButtonDanger onClick={handleDelete} loading={deleting} disabled={deleting}>Delete</ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}
