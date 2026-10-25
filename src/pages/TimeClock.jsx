import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HiClock,
  HiPlay,
  HiStop,
  HiPencilSquare,
  HiTrash,
  HiChevronLeft,
  HiChevronRight,
  HiPlus,
  HiTableCells,
  HiPause,
  HiArrowDownTray,
  HiUser,
  HiUsers,
  HiMapPin,
} from 'react-icons/hi2';
import {
  fetchStaff,
  fetchTimeEntries,
  clockIn,
  clockOut,
  updateTimeEntry,
  deleteTimeEntry,
  fetchActiveClocks,
  startBreak,
  endBreak,
  fetchAllStaffSummary,
} from '../lib/api';
import AddStaffModal from '../components/AddStaffModal';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { toLocalDate, toLocalDatetime } from '../lib/dates';

function formatDuration(ms, showSeconds) {
  if (!ms || ms <= 0) return showSeconds ? '0h 0m 0s' : '0h 0m';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (showSeconds) {
    const secs = Math.floor((ms % 60000) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  }
  return `${hours}h ${mins}m`;
}

function toDecimalHours(ms) {
  if (!ms || ms <= 0) return '0.00';
  return (ms / 3600000).toFixed(2);
}

function formatTime(iso) {
  if (!iso) return '--';
  return new Date(iso).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateLabel(iso) {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const toDateStr = toLocalDate;

// Find the staff row that belongs to the logged-in profile (same match as Sidebar)
function findMyStaff(staffList, profile) {
  if (!profile) return null;
  const myName = profile.full_name?.toLowerCase()?.trim();
  const myEmail = profile.email?.toLowerCase()?.trim();
  return (
    staffList.find((s) => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().trim();
      return (myName && name === myName) || (myEmail && s.email?.toLowerCase()?.trim() === myEmail);
    }) || null
  );
}

// Convert array of objects to CSV string and trigger download
function downloadCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function TimeClock() {
  const { profile, hasRole } = useAuth();
  const canPickStaff = hasRole(['admin', 'manager', 'owner']);
  const [view, setView] = useState('mine'); // 'mine' | 'all'
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [entries, setEntries] = useState([]);
  const [activeEntry, setActiveEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [weekOf, setWeekOf] = useState(new Date());
  const [editModal, setEditModal] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [allSummary, setAllSummary] = useState([]);
  const [allLoading, setAllLoading] = useState(false);

  const week = useMemo(() => getWeekRange(weekOf), [weekOf]);

  // Load staff list
  function loadStaff() {
    return fetchStaff('active').then((data) => {
      setStaff(data);
      if (data.length === 0) setLoading(false);
      return data;
    }).catch(() => {
      setLoading(false);
      return [];
    });
  }

  useEffect(() => {
    loadStaff();
  }, []);

  // Default the selector to the logged-in user's own staff row. Admin/manager/owner
  // fall back to the first row; other roles are locked to themselves.
  useEffect(() => {
    if (staff.length === 0) return;
    const mine = findMyStaff(staff, profile);
    if (mine) {
      if (!selectedStaff || (!canPickStaff && selectedStaff !== mine.id)) setSelectedStaff(mine.id);
      return;
    }
    if (!selectedStaff) {
      if (canPickStaff) setSelectedStaff(staff[0].id);
      else setLoading(false); // staff user with no matching staff row — nothing to show
    }
  }, [staff, profile, canPickStaff]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStaffCreated(created) {
    await loadStaff();
    if (created?.id) setSelectedStaff(created.id);
    setAddStaffModal(false);
  }

  // Load entries + active clock for selected staff. Optional isStale callback
  // lets the calling effect drop stale responses when the user switches views.
  const loadEntries = useCallback(async (isStale) => {
    if (!selectedStaff) {
      if (isStale?.()) return;
      setEntries([]);
      setActiveEntry(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [entriesData, activeData] = await Promise.all([
        fetchTimeEntries(selectedStaff, week.start.toISOString(), week.end.toISOString()).catch(() => []),
        fetchActiveClocks(selectedStaff).catch(() => []),
      ]);
      if (isStale?.()) return;
      setEntries(entriesData);
      setActiveEntry(activeData.length > 0 ? activeData[0] : null);
    } catch (err) {
      console.error(err);
    }
    if (isStale?.()) return;
    setLoading(false);
  }, [selectedStaff, week.start.getTime(), week.end.getTime()]);

  useEffect(() => {
    if (view !== 'mine') return;
    let ignore = false;
    loadEntries(() => ignore);
    return () => { ignore = true; };
  }, [loadEntries, view]);

  // Load all-staff summary
  const loadAllSummary = useCallback(async (isStale) => {
    setAllLoading(true);
    try {
      const data = await fetchAllStaffSummary(week.start.toISOString(), week.end.toISOString());
      if (isStale?.()) return;
      setAllSummary(data);
    } catch (err) {
      console.error(err);
    }
    if (isStale?.()) return;
    setAllLoading(false);
  }, [week.start.getTime(), week.end.getTime()]);

  useEffect(() => {
    if (view !== 'all') return;
    let ignore = false;
    loadAllSummary(() => ignore);
    return () => { ignore = true; };
  }, [loadAllSummary, view]);

  // Live elapsed timer — parse the timestamps once per active-entry change.
  const clockInMs = activeEntry ? new Date(activeEntry.clock_in).getTime() : 0;
  const breakStartMs = activeEntry?.break_start ? new Date(activeEntry.break_start).getTime() : 0;

  useEffect(() => {
    if (!activeEntry) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Date.now() - clockInMs);
      if (breakStartMs) {
        setBreakElapsed(Date.now() - breakStartMs);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeEntry, clockInMs, breakStartMs]);

  // Reset break timer once when the break ends — separate from the 1Hz tick.
  useEffect(() => {
    if (!breakStartMs) setBreakElapsed(0);
  }, [breakStartMs]);

  async function handleClockIn() {
    setClocking(true);
    try {
      const entry = await clockIn(selectedStaff, notes || undefined);
      setActiveEntry(entry);
      setNotes('');
      loadEntries();
    } catch (err) {
      alert(err.message);
    }
    setClocking(false);
  }

  async function handleClockOut() {
    setClocking(true);
    try {
      await clockOut(selectedStaff, notes || undefined);
      setActiveEntry(null);
      setNotes('');
      loadEntries();
    } catch (err) {
      alert(err.message);
    }
    setClocking(false);
  }

  async function handleStartBreak() {
    setClocking(true);
    try {
      const entry = await startBreak(selectedStaff);
      setActiveEntry(entry);
    } catch (err) {
      alert(err.message);
    }
    setClocking(false);
  }

  async function handleEndBreak() {
    setClocking(true);
    try {
      const entry = await endBreak(selectedStaff);
      setActiveEntry(entry);
      loadEntries();
    } catch (err) {
      alert(err.message);
    }
    setClocking(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this time entry?')) return;
    try {
      await deleteTimeEntry(id);
      loadEntries();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleEditSave() {
    if (!editModal || editSaving) return;
    // Inputs hold local wall-clock (datetime-local); convert to instants before saving
    const inDate = editModal.clock_in ? new Date(editModal.clock_in) : null;
    const outDate = editModal.clock_out ? new Date(editModal.clock_out) : null;
    if (!inDate || Number.isNaN(inDate.getTime())) {
      setEditModal({ ...editModal, error: 'Clock in time is required.' });
      return;
    }
    if (outDate && Number.isNaN(outDate.getTime())) {
      setEditModal({ ...editModal, error: 'Clock out time is not valid.' });
      return;
    }
    if (outDate && outDate <= inDate) {
      setEditModal({ ...editModal, error: 'Clock out must be after clock in.' });
      return;
    }
    setEditSaving(true);
    try {
      await updateTimeEntry(editModal.id, {
        clock_in: inDate.toISOString(),
        clock_out: outDate ? outDate.toISOString() : undefined,
        break_minutes: editModal.break_minutes || 0,
        notes: editModal.notes || undefined,
      });
      setEditModal(null);
      loadEntries();
    } catch (err) {
      setEditModal((m) => (m ? { ...m, error: err.message } : m));
    } finally {
      setEditSaving(false);
    }
  }

  function shiftWeek(dir) {
    const d = new Date(weekOf);
    d.setDate(d.getDate() + dir * 7);
    setWeekOf(d);
  }

  // Group entries by date (My Hours view) — recomputes only when entries change.
  const { grouped, weekTotalMs, completedSessionsCount } = useMemo(() => {
    const groupedMap = {};
    let total = 0;
    let completed = 0;
    entries.forEach((e) => {
      const dateKey = new Date(e.clock_in).toLocaleDateString('en-AU');
      if (!groupedMap[dateKey]) groupedMap[dateKey] = { entries: [], totalMs: 0, date: e.clock_in };
      groupedMap[dateKey].entries.push(e);
      if (e.clock_out) {
        completed += 1;
        // Clamp so a bad entry (clock_out before clock_in) can't shrink the totals
        const ms = Math.max(0, new Date(e.clock_out) - new Date(e.clock_in) - (e.break_minutes || 0) * 60000);
        groupedMap[dateKey].totalMs += ms;
        total += ms;
      }
    });
    return { grouped: groupedMap, weekTotalMs: total, completedSessionsCount: completed };
  }, [entries]);

  // Daily summary (Mon–Sun)
  const dailySummary = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(week.start);
      day.setDate(week.start.getDate() + i);
      const dayKey = day.toLocaleDateString('en-AU');
      const group = grouped[dayKey];
      let sessions = 0;
      let openSessions = 0;
      if (group) {
        for (const e of group.entries) {
          if (e.clock_out) sessions += 1;
          else openSessions += 1;
        }
      }
      days.push({
        date: new Date(day),
        label: day.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }),
        sessions,
        openSessions,
        totalMs: group ? group.totalMs : 0,
      });
    }
    return days;
  }, [grouped, week.start]);

  const selectedStaffObj = staff.find((s) => s.id === selectedStaff);
  const staffName = selectedStaffObj
    ? `${selectedStaffObj.first_name} ${selectedStaffObj.last_name}`
    : '';

  const onBreak = !!activeEntry?.break_start;

  const { allTotalMs, allSessionsCount } = useMemo(() => {
    let totalMs = 0;
    let sessions = 0;
    for (const s of allSummary) {
      totalMs += s.total_ms || 0;
      sessions += s.sessions || 0;
    }
    return { allTotalMs: totalMs, allSessionsCount: sessions };
  }, [allSummary]);

  // CSV export
  function handleExportMine() {
    const rows = entries
      .slice()
      .sort((a, b) => new Date(a.clock_in) - new Date(b.clock_in))
      .map((e) => {
        const durationMs = e.clock_out
          ? new Date(e.clock_out) - new Date(e.clock_in) - (e.break_minutes || 0) * 60000
          : 0;
        return {
          Date: new Date(e.clock_in).toLocaleDateString('en-AU'),
          'Clock In': formatTime(e.clock_in),
          'Clock Out': e.clock_out ? formatTime(e.clock_out) : 'In progress',
          'Break (min)': e.break_minutes || 0,
          Hours: e.clock_out ? formatDuration(durationMs) : '--',
          Decimal: e.clock_out ? toDecimalHours(durationMs) : '--',
          Notes: e.notes || '',
        };
      });
    if (rows.length === 0) {
      alert('No entries to export this week.');
      return;
    }
    rows.push({
      Date: 'WEEK TOTAL',
      'Clock In': '',
      'Clock Out': '',
      'Break (min)': '',
      Hours: formatDuration(weekTotalMs),
      Decimal: toDecimalHours(weekTotalMs),
      Notes: '',
    });
    const safeName = (staffName || 'staff').replace(/\s+/g, '-').toLowerCase();
    downloadCsv(`timesheet-${safeName}-${toDateStr(week.start)}.csv`, rows);
  }

  function handleExportAll() {
    const rows = allSummary.map((s) => ({
      Name: `${s.first_name} ${s.last_name}`,
      Role: s.role || '',
      Sessions: s.sessions,
      Hours: formatDuration(s.total_ms),
      Decimal: toDecimalHours(s.total_ms),
      Status: s.active ? (s.on_break ? 'On break' : 'Clocked in') : 'Off',
    }));
    if (rows.length === 0) {
      alert('No staff to export.');
      return;
    }
    rows.push({
      Name: 'TEAM TOTAL',
      Role: '',
      Sessions: allSessionsCount,
      Hours: formatDuration(allTotalMs),
      Decimal: toDecimalHours(allTotalMs),
      Status: '',
    });
    downloadCsv(`team-timesheet-${toDateStr(week.start)}.csv`, rows);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Time Clock</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track staff clock-in/out and hours worked
          </p>
        </div>

        {/* View toggle */}
        <div className="inline-flex self-start rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-[#162036]">
          <button
            onClick={() => setView('mine')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === 'mine'
                ? 'bg-brand-500 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            <HiUser className="h-4 w-4" />
            My Hours
          </button>
          <button
            onClick={() => setView('all')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === 'all'
                ? 'bg-brand-500 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            <HiUsers className="h-4 w-4" />
            All Staff
          </button>
        </div>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => shiftWeek(-1)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <HiChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {toDateStr(week.start)} &mdash; {toDateStr(week.end)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Week total:{' '}
            <span className="font-semibold text-brand-500">
              {formatDuration(view === 'all' ? allTotalMs : weekTotalMs)}
            </span>
          </p>
        </div>
        <button
          onClick={() => shiftWeek(1)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <HiChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ─── MY HOURS VIEW ─── */}
      {view === 'mine' && (
        <>
          {/* Staff selector + Clock button */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-[#162036]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Staff Member
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    disabled={!canPickStaff}
                    title={canPickStaff ? undefined : 'Only managers can clock in for other staff'}
                    className="min-w-0 flex-1 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} — {s.role || 'Staff'}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setAddStaffModal(true)}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                    title="Add new staff member"
                  >
                    <HiPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Staff</span>
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Office admin, filing..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Clock status + buttons */}
            <div className="mt-8 flex flex-col items-center gap-4">
              {activeEntry ? (
                <>
                  {onBreak ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
                      <HiPause className="h-4 w-4" />
                      On break since {formatTime(activeEntry.break_start)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-accent-500">
                      <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-accent-500" />
                      Clocked in since {formatTime(activeEntry.clock_in)}
                    </div>
                  )}

                  <div className="font-mono text-4xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {onBreak ? formatDuration(breakElapsed, true) : formatDuration(elapsed, true)}
                  </div>

                  {onBreak && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total shift: {formatDuration(elapsed, true)}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {onBreak ? (
                      <button
                        onClick={handleEndBreak}
                        disabled={clocking}
                        className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                      >
                        <HiPlay className="h-5 w-5" />
                        End Break
                      </button>
                    ) : (
                      <button
                        onClick={handleStartBreak}
                        disabled={clocking}
                        className="flex items-center gap-2 rounded-xl border border-amber-500 bg-transparent px-6 py-3 text-sm font-semibold text-amber-500 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
                      >
                        <HiPause className="h-5 w-5" />
                        Start Break
                      </button>
                    )}

                    <button
                      onClick={handleClockOut}
                      disabled={clocking || onBreak}
                      title={onBreak ? 'End break before clocking out' : 'Clock out'}
                      className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                    >
                      <HiStop className="h-5 w-5" />
                      {clocking ? 'Working...' : 'Clock Out'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {staffName ? `${staffName} is not clocked in` : 'Select a staff member'}
                  </div>
                  <button
                    onClick={handleClockIn}
                    disabled={clocking || !selectedStaff}
                    className="flex items-center gap-2 rounded-xl bg-accent-500 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
                  >
                    <HiPlay className="h-5 w-5" />
                    {clocking ? 'Clocking in...' : 'Clock In'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Export button */}
          {!loading && entries.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleExportMine}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#162036] dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <HiArrowDownTray className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          )}

          {/* Daily Hours Report */}
          {!loading && entries.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#162036]">
              <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                <HiTableCells className="h-5 w-5 text-brand-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Daily Hours Report
                </h2>
                {staffName && (
                  <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                    {staffName}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Day
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Total Hours
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Decimal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummary.map((day) => {
                      const isToday = toDateStr(day.date) === toDateStr(new Date());
                      const hasHours = day.totalMs > 0;
                      return (
                        <tr
                          key={day.label}
                          className={`border-b border-slate-50 dark:border-slate-700/50 ${
                            isToday ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''
                          }`}
                        >
                          <td className="px-6 py-3">
                            <span className={`font-medium ${isToday ? 'text-brand-500' : 'text-slate-900 dark:text-slate-200'}`}>
                              {day.label}
                            </span>
                            {isToday && (
                              <span className="ml-2 text-[10px] font-semibold uppercase text-brand-500">Today</span>
                            )}
                            {day.openSessions > 0 && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-accent-500">
                                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" />
                                In progress
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={hasHours ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                              {day.sessions + day.openSessions || '--'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className={`font-mono tabular-nums ${hasHours ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                              {hasHours ? formatDuration(day.totalMs) : '--'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className={`font-mono tabular-nums ${hasHours ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                              {hasHours ? toDecimalHours(day.totalMs) : '--'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <td className="px-6 py-3 text-sm font-bold text-slate-900 dark:text-white">
                        Week Total
                      </td>
                      <td className="px-6 py-3 text-center font-medium text-slate-700 dark:text-slate-300">
                        {completedSessionsCount}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="font-mono text-sm font-bold tabular-nums text-brand-500">
                          {formatDuration(weekTotalMs)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="font-mono text-sm font-bold tabular-nums text-brand-500">
                          {toDecimalHours(weekTotalMs)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Time entries log */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
              </div>
            ) : staff.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-600">
                <HiPlus className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  No staff members yet. Click <strong>Add Staff</strong> above to get started.
                </p>
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-600">
                <HiClock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  No time entries this week
                </p>
              </div>
            ) : (
              Object.entries(grouped)
                .sort(([, a], [, b]) => new Date(b.date) - new Date(a.date))
                .map(([dateKey, group]) => (
                  <div key={dateKey}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {formatDateLabel(group.date)}
                      </h3>
                      <span className="text-xs font-medium text-brand-500">
                        {formatDuration(group.totalMs)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.entries.map((entry) => {
                        const durationMs = entry.clock_out
                          ? new Date(entry.clock_out) - new Date(entry.clock_in) - (entry.break_minutes || 0) * 60000
                          : null;

                        return (
                          <div
                            key={entry.id}
                            className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-[#162036]"
                          >
                            <div
                              className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                                entry.clock_out ? 'bg-slate-300 dark:bg-slate-600' : 'animate-pulse bg-accent-500'
                              }`}
                            />

                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                                <span>{formatTime(entry.clock_in)}</span>
                                {entry.clock_in_lat && (
                                  <a
                                    href={`https://www.google.com/maps?q=${entry.clock_in_lat},${entry.clock_in_lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent-500 hover:text-accent-600 transition-colors"
                                    title={`Clock-in: ${Number(entry.clock_in_lat).toFixed(5)}, ${Number(entry.clock_in_lng).toFixed(5)}`}
                                  >
                                    <HiMapPin className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                <span className="text-slate-400">&rarr;</span>
                                <span>{entry.clock_out ? formatTime(entry.clock_out) : 'In progress'}</span>
                                {entry.clock_out_lat && (
                                  <a
                                    href={`https://www.google.com/maps?q=${entry.clock_out_lat},${entry.clock_out_lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-500 hover:text-red-600 transition-colors"
                                    title={`Clock-out: ${Number(entry.clock_out_lat).toFixed(5)}, ${Number(entry.clock_out_lng).toFixed(5)}`}
                                  >
                                    <HiMapPin className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                              {entry.notes && (
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  {entry.notes}
                                </p>
                              )}
                              {entry.break_minutes > 0 && (
                                <p className="mt-0.5 text-xs text-slate-400">
                                  Break: {entry.break_minutes}m
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                                {durationMs ? formatDuration(durationMs) : '--'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  setEditModal({
                                    id: entry.id,
                                    clock_in: entry.clock_in ? toLocalDatetime(new Date(entry.clock_in)) : '',
                                    clock_out: entry.clock_out ? toLocalDatetime(new Date(entry.clock_out)) : '',
                                    break_minutes: entry.break_minutes || 0,
                                    notes: entry.notes || '',
                                  })
                                }
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-slate-700"
                                title="Edit"
                              >
                                <HiPencilSquare className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                                title="Delete"
                              >
                                <HiTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
            )}
          </div>
        </>
      )}

      {/* ─── ALL STAFF VIEW ─── */}
      {view === 'all' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={handleExportAll}
              disabled={allSummary.length === 0}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-[#162036] dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <HiArrowDownTray className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#162036]">
            <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4 dark:border-slate-700">
              <HiUsers className="h-5 w-5 text-brand-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                All Staff — Weekly Hours
              </h2>
              <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                {allSummary.length} staff
              </span>
            </div>

            {allLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
              </div>
            ) : allSummary.length === 0 ? (
              <div className="py-16 text-center">
                <HiUsers className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  No active staff
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Staff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Total Hours
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Decimal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSummary.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-slate-50 dark:border-slate-700/50"
                      >
                        <td className="px-6 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {s.first_name} {s.last_name}
                          </div>
                          {s.role && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {s.role}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {s.active ? (
                            s.on_break ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500">
                                <HiPause className="h-3 w-3" />
                                On break
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-500">
                                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" />
                                Clocked in
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              Off
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={
                              s.sessions > 0
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-400 dark:text-slate-500'
                            }
                          >
                            {s.sessions || '--'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span
                            className={`font-mono tabular-nums ${
                              s.total_ms > 0
                                ? 'font-semibold text-slate-900 dark:text-white'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {s.total_ms > 0 ? formatDuration(s.total_ms) : '--'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span
                            className={`font-mono tabular-nums ${
                              s.total_ms > 0
                                ? 'text-slate-600 dark:text-slate-300'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {s.total_ms > 0 ? toDecimalHours(s.total_ms) : '--'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <td className="px-6 py-3 text-sm font-bold text-slate-900 dark:text-white" colSpan={2}>
                        Team Total
                      </td>
                      <td className="px-6 py-3 text-center font-medium text-slate-700 dark:text-slate-300">
                        {allSessionsCount}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="font-mono text-sm font-bold tabular-nums text-brand-500">
                          {formatDuration(allTotalMs)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="font-mono text-sm font-bold tabular-nums text-brand-500">
                          {toDecimalHours(allTotalMs)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={addStaffModal}
        onClose={() => setAddStaffModal(false)}
        onCreated={handleStaffCreated}
      />

      {/* Edit Time Entry Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title="Edit Time Entry"
        icon={HiPencilSquare}
        iconColor="text-brand-500"
        size="md"
      >
        {editModal && (
          <>
            <ModalBody>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Clock In
                  </label>
                  <input
                    type="datetime-local"
                    value={editModal.clock_in}
                    onChange={(e) => setEditModal({ ...editModal, clock_in: e.target.value, error: null })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Clock Out
                  </label>
                  <input
                    type="datetime-local"
                    value={editModal.clock_out}
                    onChange={(e) => setEditModal({ ...editModal, clock_out: e.target.value, error: null })}
                  />
                </div>
                {editModal.error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    {editModal.error}
                  </p>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Break (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editModal.break_minutes}
                    onChange={(e) =>
                      setEditModal({ ...editModal, break_minutes: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={editModal.notes}
                    onChange={(e) => setEditModal({ ...editModal, notes: e.target.value })}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary onClick={() => setEditModal(null)}>Cancel</ButtonSecondary>
              <ButtonPrimary onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </ButtonPrimary>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}
