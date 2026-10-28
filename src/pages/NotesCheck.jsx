// NOTES CHECK (29 Oct 2026). Which participants are missing a progress note for a day. The server (features.js
// pn-missing) watches every active participant who is noted daily (or is set to 'daily'); each day up to yesterday
// needs at least one note. Here: summary cards, a participant x day grid, the list of missed days with an Add Note
// button that opens the normal progress note form with the participant and date filled in.
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HiExclamationTriangle, HiCheckCircle, HiUserGroup, HiCalendarDays, HiPlus, HiArrowPath } from 'react-icons/hi2';
import { fetchMissingNotes, createProgressNote, fetchParticipants } from '../lib/api';
import { PageHeader, StatCard, EmptyState } from '../components/ui/FormComponents';
import { SkeletonStatCard, SkeletonCard } from '../components/ui/Skeleton';
import ProgressNoteForm from '../components/ProgressNoteForm';

const fmtDay = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtLong = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
const melbourneHour = () => Number(new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', hour: 'numeric', hour12: false }));

export default function NotesCheck() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participantNames, setParticipantNames] = useState([]);
  const [draft, setDraft] = useState(null); // { participant_name, note_date } for the form

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchMissingNotes(days)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetchParticipants('active').then((r) => {
      const list = Array.isArray(r) ? r : r?.participants || [];
      setParticipantNames(list.map((p) => `${p.first_name || ''} ${p.last_name || ''}`.trim()).filter(Boolean).sort());
    }).catch(() => {});
  }, []);

  async function handleSave(formData) {
    await createProgressNote(formData);
    setDraft(null);
    await load();
  }

  const afternoon = melbourneHour() >= 14;
  const watched = data?.participants || [];
  const gaps = watched.flatMap((p) => p.missing.map((m) => ({ ...m, participant: p.name })));
  gaps.sort((a, b) => b.date.localeCompare(a.date) || a.participant.localeCompare(b.participant));
  const noneToday = watched.filter((p) => p.today_count === 0);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Notes Check"
        subtitle="Every participant on daily support should have a progress note for every day. This is what is missing."
        actions={
          <div className="flex items-center gap-2">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="text-sm">
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <button onClick={load} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#263554] px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]">
              <HiArrowPath className="h-4 w-4" /> Refresh
            </button>
            <Link to="/progress-notes" className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600">All notes</Link>
          </div>
        }
      />

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !data ? (<><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></>) : (
          <>
            <StatCard icon={HiExclamationTriangle} label={`Days missing a note (last ${data.days} days)`} value={data.summary.missing_days}
              color={data.summary.missing_days ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}
              borderColor={data.summary.missing_days ? 'border-l-red-500' : 'border-l-emerald-500'} />
            <StatCard icon={HiUserGroup} label="Participants with gaps" value={data.summary.with_gaps}
              color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" borderColor={data.summary.with_gaps ? 'border-l-amber-500' : ''} />
            <StatCard icon={HiCalendarDays} label="No note yet today" value={data.summary.none_today}
              color={afternoon && data.summary.none_today ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-[#1e2d4a] text-slate-600 dark:text-slate-300'} />
            <StatCard icon={HiCheckCircle} label="Participants watched" value={data.summary.watched}
              color="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400" />
          </>
        )}
      </div>

      {/* Grid: participant x day */}
      {!loading && data && (
        <section className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5 overflow-x-auto">
          <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-white">Notes per day</h2>
          {watched.length === 0 ? (
            <EmptyState icon={HiUserGroup} title="No participants are being watched" description="A participant is watched once they have notes on most days of the last four weeks, or when set to daily on their profile." />
          ) : (
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white dark:bg-[#162036] py-2 pr-4 text-left font-semibold text-slate-500 dark:text-slate-400">Participant</th>
                  {data.window.map((d) => (
                    <th key={d} className="px-1 py-2 text-center font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'narrow' })}<br />
                      <span className="text-[10px]">{new Date(d + 'T00:00:00').getDate()}</span>
                    </th>
                  ))}
                  <th className="px-1 py-2 text-center font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">Today</th>
                </tr>
              </thead>
              <tbody>
                {watched.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-[#263554]">
                    <td className="sticky left-0 bg-white dark:bg-[#162036] py-2 pr-4 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {p.name}
                      {p.missing.length > 0 && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">{p.missing.length} missing</span>}
                    </td>
                    {p.days.map((d) => (
                      <td key={d.date} className="px-1 py-1 text-center">
                        <span title={`${fmtLong(d.date)}: ${d.count} note${d.count === 1 ? '' : 's'}${d.staff.length ? ' by ' + d.staff.join(', ') : ''}`}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md font-semibold ${d.count >= p.min_per_day ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-500 text-white'}`}>
                          {d.count}
                        </span>
                      </td>
                    ))}
                    <td className="px-1 py-1 text-center">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md font-semibold ${p.today_count > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : afternoon ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500 dark:bg-[#1e2d4a] dark:text-slate-400'}`}>
                        {p.today_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-[11px] text-slate-400">Green = at least one note that day. Red = no note. Today turns amber after 2 pm if nothing has been written yet. Hover a cell to see who wrote the notes.</p>
        </section>
      )}

      {/* Missed days */}
      {loading ? <SkeletonCard /> : data && (
        <section className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-white">Days with no note</h2>
          {gaps.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              <HiCheckCircle className="h-5 w-5" /> Every watched participant has a note for every day in the last {data.days} days.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-[#263554]">
              {gaps.map((g) => (
                <li key={g.participant + g.date} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"><HiExclamationTriangle className="h-5 w-5" /></span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{g.participant}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{fmtLong(g.date)} · {g.count === 0 ? 'no progress note' : `${g.count} of ${g.need} notes`}</p>
                    </div>
                  </div>
                  <button onClick={() => setDraft({ participant_name: g.participant, note_date: g.date })}
                    className="flex items-center gap-2 rounded-lg bg-accent-500 px-3 py-2 text-xs font-semibold text-white hover:bg-accent-600">
                    <HiPlus className="h-4 w-4" /> Add note for {fmtDay(g.date)}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {noneToday.length > 0 && afternoon && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              No note yet today for: {noneToday.map((p) => p.name).join(', ')}. Today is not counted as missing until tomorrow.
            </p>
          )}
        </section>
      )}

      {!loading && data && data.not_watched.length > 0 && (
        <p className="text-xs text-slate-400">
          Not watched (fewer than 17 noted days in the last 28, or set to none): {data.not_watched.map((p) => p.name).join(', ')}.
          To watch one of them regardless, set "Progress notes expected" to daily on the participant profile.
        </p>
      )}

      <ProgressNoteForm isOpen={!!draft} onClose={() => setDraft(null)} onSave={handleSave} editingNote={draft} participantNames={participantNames} />
    </div>
  );
}
