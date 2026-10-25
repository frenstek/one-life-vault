import { useState, useEffect, useCallback } from 'react';
import { HiMapPin, HiChevronLeft, HiChevronRight, HiClock } from 'react-icons/hi2';
import { fetchLocationLog } from '../lib/api';

function formatTime(iso) {
  if (!iso) return '--';
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(d) {
  return new Date(d).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isToday(dateStr) {
  return dateStr === toDateStr(new Date());
}

function LocationPin({ lat, lng, accuracy, label, color }) {
  if (!lat) return <span className="text-xs text-slate-400 italic">No GPS</span>;
  const isAccurate = accuracy && accuracy <= 100;
  const isRough = accuracy && accuracy > 1000;
  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
          color === 'green'
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
            : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
        }`}
        title={`${label}: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`}
      >
        <HiMapPin className="h-3.5 w-3.5" />
        Maps
      </a>
      {accuracy && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          isAccurate
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : isRough
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {isRough ? '⚠ Approx' : isAccurate ? `±${accuracy}m` : `±${accuracy}m`}
        </span>
      )}
    </div>
  );
}

export default function LocationLog() {
  const [date, setDate] = useState(toDateStr(new Date()));
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLocationLog(date, date);
      setEntries(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  function shiftDay(dir) {
    setDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir);
      return toDateStr(d);
    });
  }

  // Group by staff
  const staffMap = new Map();
  for (const e of entries) {
    const key = e.staff_id;
    if (!staffMap.has(key)) {
      staffMap.set(key, {
        name: e.staff ? `${e.staff.first_name || ''} ${e.staff.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
        initials: e.staff ? `${e.staff.first_name?.[0] || ''}${e.staff.last_name?.[0] || ''}` || '?' : '?',
        entries: [],
      });
    }
    staffMap.get(key).entries.push(e);
  }
  const staffList = Array.from(staffMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Staff Locations
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          See where staff clocked in and out
        </p>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => shiftDay(-1)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <HiChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={() => setDate(toDateStr(new Date()))}
          className={`flex-1 rounded-xl border px-4 py-3 text-center font-semibold transition-colors ${
            isToday(date)
              ? 'border-accent-500 bg-accent-500/5 text-accent-600 dark:text-accent-400'
              : 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-[#162036] dark:text-white'
          }`}
        >
          {isToday(date) ? 'Today' : ''} {formatDateDisplay(date)}
        </button>

        <button
          onClick={() => shiftDay(1)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <HiChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#162036]">
          <HiClock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            No one clocked in on this date
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Count */}
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {staffList.length} staff &middot; {entries.length} {entries.length === 1 ? 'session' : 'sessions'}
          </p>

          {staffList.map((staff) => (
            <div
              key={staff.name}
              className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#162036]"
            >
              {/* Staff header */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-slate-700/50">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-sm font-bold text-accent-600 dark:text-accent-400">
                  {staff.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{staff.name}</p>
                  <p className="text-xs text-slate-400">{staff.entries.length} {staff.entries.length === 1 ? 'session' : 'sessions'}</p>
                </div>
              </div>

              {/* Sessions */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {staff.entries.map((entry) => (
                  <div key={entry.id} className="px-5 py-3.5">
                    {/* Clock in row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">In</span>
                        <span className="text-sm tabular-nums text-slate-900 dark:text-white">{formatTime(entry.clock_in)}</span>
                      </div>
                      <LocationPin lat={entry.clock_in_lat} lng={entry.clock_in_lng} accuracy={entry.clock_in_accuracy} label="Clock in" color="green" />
                    </div>

                    {/* Clock out row */}
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${entry.clock_out ? 'bg-red-500' : 'animate-pulse bg-emerald-500'}`} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Out</span>
                        <span className="text-sm tabular-nums text-slate-900 dark:text-white">
                          {entry.clock_out ? formatTime(entry.clock_out) : 'Still working'}
                        </span>
                      </div>
                      {entry.clock_out ? (
                        <LocationPin lat={entry.clock_out_lat} lng={entry.clock_out_lng} accuracy={entry.clock_out_accuracy} label="Clock out" color="red" />
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
