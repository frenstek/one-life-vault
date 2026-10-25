import { useState, useEffect } from 'react';
import {
  HiCheck,
  HiArrowPath,
  HiCalendarDays,
  HiHome,
  HiSparkles,
} from 'react-icons/hi2';
import { PageHeader } from '../components/ui/FormComponents';
import { useAuth } from '../contexts/AuthContext';
import { toLocalDate } from '../lib/dates';

const API_BASE = '/api/cleaning-schedule';

// ─── Weekly cleaning tasks for 59 Sever Street ──────────────────────────────

const DAILY_TASKS = [
  { id: 'kitchen-dishes', area: 'Kitchen', task: 'Wash & put away dishes' },
  { id: 'kitchen-benches', area: 'Kitchen', task: 'Wipe down benches & stovetop' },
  { id: 'kitchen-sweep', area: 'Kitchen', task: 'Sweep kitchen floor' },
  { id: 'bathroom-wipe', area: 'Bathroom', task: 'Wipe sink & toilet' },
  { id: 'living-tidy', area: 'Living Areas', task: 'Tidy lounge & common areas' },
  { id: 'bins-check', area: 'General', task: 'Empty small bins if full' },
  { id: 'laundry-load', area: 'Laundry', task: 'Put on a load of washing if needed' },
];

const WEEKLY_TASKS = {
  Monday: [
    { id: 'mon-vacuum', area: 'Living Areas', task: 'Vacuum all floors & carpets' },
    { id: 'mon-mop', area: 'Kitchen', task: 'Mop kitchen & bathroom floors' },
    { id: 'mon-bins', area: 'General', task: 'Put bins out (if bin night)' },
  ],
  Tuesday: [
    { id: 'tue-bathroom', area: 'Bathroom', task: 'Deep clean bathroom (shower, toilet, mirrors)' },
    { id: 'tue-towels', area: 'Laundry', task: 'Wash towels & bath mats' },
  ],
  Wednesday: [
    { id: 'wed-kitchen', area: 'Kitchen', task: 'Clean fridge (check dates, wipe shelves)' },
    { id: 'wed-microwave', area: 'Kitchen', task: 'Wipe microwave & oven exterior' },
    { id: 'wed-dust', area: 'Living Areas', task: 'Dust surfaces & TV unit' },
  ],
  Thursday: [
    { id: 'thu-bedrooms', area: 'Bedrooms', task: 'Change bed linen' },
    { id: 'thu-bedroom-tidy', area: 'Bedrooms', task: 'Vacuum bedrooms & tidy wardrobes' },
    { id: 'thu-windows', area: 'General', task: 'Wipe window sills & glass doors' },
  ],
  Friday: [
    { id: 'fri-laundry', area: 'Laundry', task: 'Clean laundry tub & tidy laundry room' },
    { id: 'fri-outdoor', area: 'Outdoor', task: 'Sweep front porch & entry' },
    { id: 'fri-general', area: 'General', task: 'Wipe light switches & door handles' },
  ],
  Saturday: [
    { id: 'sat-yard', area: 'Outdoor', task: 'General yard tidy (if needed)' },
    { id: 'sat-deep', area: 'Kitchen', task: 'Clean oven interior (fortnightly)' },
  ],
  Sunday: [
    { id: 'sun-prep', area: 'Kitchen', task: 'Meal prep area — deep clean benches' },
    { id: 'sun-restock', area: 'General', task: 'Restock cleaning supplies (note what\'s low)' },
  ],
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AREA_COLORS = {
  Kitchen: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  Bathroom: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  'Living Areas': 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  Bedrooms: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  Laundry: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300',
  Outdoor: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  General: 'bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-300',
};

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toLocalDate(d);
}

// Move a YYYY-MM-DD week start by N days (parsed as local midnight, not UTC)
function shiftWeekStart(weekStart, days) {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}

function getTodayName() {
  return new Date().toLocaleDateString('en-AU', { weekday: 'long' });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CleaningSchedule() {
  const { user, profile } = useAuth();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [completions, setCompletions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const todayName = getTodayName();

  // Load completions for this week
  useEffect(() => {
    loadCompletions();
  }, [weekStart]);

  async function loadCompletions() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?week_start=${weekStart}&property=59-sever-street`);
      if (res.ok) {
        const data = await res.json();
        const map = {};
        (data.completions || []).forEach((c) => {
          map[c.task_id + '_' + c.day] = c;
        });
        setCompletions(map);
      }
    } catch (err) {
      console.error('Failed to load completions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(taskId, day) {
    const key = taskId + '_' + day;
    const isCompleted = !!completions[key];
    setSaving(true);
    setError(null);

    try {
      if (isCompleted) {
        // Uncomplete
        const res = await fetch(`${API_BASE}?id=${completions[key].id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Could not untick task (${res.status})`);
        setCompletions((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } else {
        // Complete
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: taskId,
            day,
            week_start: weekStart,
            property: '59-sever-street',
            completed_by: profile?.full_name || user?.email || 'Staff',
          }),
        });
        if (!res.ok) throw new Error(`Could not save task (${res.status})`);
        const data = await res.json();
        setCompletions((prev) => ({ ...prev, [key]: data }));
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // Count completions for a day
  function dayProgress(day) {
    const dailyCount = DAILY_TASKS.length;
    const weeklyCount = (WEEKLY_TASKS[day] || []).length;
    const total = dailyCount + weeklyCount;
    let done = 0;
    DAILY_TASKS.forEach((t) => { if (completions[t.id + '_' + day]) done++; });
    (WEEKLY_TASKS[day] || []).forEach((t) => { if (completions[t.id + '_' + day]) done++; });
    return { done, total };
  }

  const weekEnd = new Date(weekStart + 'T00:00:00');
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${new Date(weekStart + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cleaning Schedule"
        subtitle="59 Sever Street — Weekly cleaning tasks"
        icon={HiSparkles}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Week selector */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HiCalendarDays className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Week of {weekLabel}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Today is {todayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setWeekStart(shiftWeekStart(weekStart, -7));
              }}
              className="rounded-lg border border-slate-200 dark:border-[#334766] px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setWeekStart(getWeekStart(new Date()))}
              className="rounded-lg border border-slate-200 dark:border-[#334766] px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
            >
              This Week
            </button>
            <button
              onClick={() => {
                setWeekStart(shiftWeekStart(weekStart, 7));
              }}
              className="rounded-lg border border-slate-200 dark:border-[#334766] px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Progress overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {DAYS.map((day) => {
          const { done, total } = dayProgress(day);
          const isToday = day === todayName;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div
              key={day}
              className={`rounded-xl border p-4 text-center transition-colors ${
                isToday
                  ? 'border-accent-500 bg-accent-500/5 dark:bg-accent-500/10'
                  : 'border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036]'
              }`}
            >
              <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-accent-600 dark:text-accent-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {day.slice(0, 3)}
              </p>
              <p className={`text-lg font-bold font-mono ${pct === 100 ? 'text-accent-600 dark:text-accent-400' : 'text-slate-700 dark:text-slate-200'}`}>
                {done}/{total}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-accent-500' : 'bg-brand-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <HiArrowPath className="h-6 w-6 text-slate-400 animate-spin" />
        </div>
      ) : (
        /* Day sections */
        <div className="space-y-6">
          {DAYS.map((day) => {
            const isToday = day === todayName;
            const dayTasks = [...DAILY_TASKS.map((t) => ({ ...t, recurring: true })), ...(WEEKLY_TASKS[day] || []).map((t) => ({ ...t, recurring: false }))];

            return (
              <div
                key={day}
                className={`rounded-xl border overflow-hidden ${
                  isToday
                    ? 'border-accent-500/50 ring-1 ring-accent-500/20'
                    : 'border-slate-200 dark:border-[#334766]'
                } bg-white dark:bg-[#162036]`}
              >
                {/* Day header */}
                <div className={`px-6 py-4 border-b ${
                  isToday
                    ? 'bg-accent-500/5 dark:bg-accent-500/10 border-accent-500/20'
                    : 'bg-slate-50 dark:bg-[#1a2844] border-slate-100 dark:border-[#334766]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold ${isToday ? 'text-accent-600 dark:text-accent-400' : 'text-slate-800 dark:text-white'}`}>
                        {day}
                        {isToday && <span className="ml-2 text-xs font-medium bg-accent-500 text-white rounded-full px-2 py-0.5">Today</span>}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {dayProgress(day).done}/{dayProgress(day).total} done
                    </span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="divide-y divide-slate-50 dark:divide-[#253552]">
                  {dayTasks.map((task) => {
                    const key = task.id + '_' + day;
                    const isComplete = !!completions[key];
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-[#1e2d4a]/30 ${
                          isComplete ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTask(task.id, day)}
                          disabled={saving}
                          className={`flex-shrink-0 h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isComplete
                              ? 'bg-accent-500 border-accent-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-accent-500 dark:hover:border-accent-500'
                          }`}
                        >
                          {isComplete && <HiCheck className="h-4 w-4" />}
                        </button>

                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isComplete ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                            {task.task}
                          </p>
                          {isComplete && completions[key]?.completed_by && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              Done by {completions[key].completed_by}
                            </p>
                          )}
                        </div>

                        {/* Area badge */}
                        <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${AREA_COLORS[task.area] || AREA_COLORS.General}`}>
                          {task.area}
                        </span>

                        {/* Daily indicator */}
                        {task.recurring && (
                          <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Daily
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
