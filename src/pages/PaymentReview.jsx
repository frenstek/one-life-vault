import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  HiArrowLeft, HiPaperClip, HiCalendarDays, HiArrowDownTray, HiCheckCircle, HiXCircle, HiXMark, HiMagnifyingGlass,
  HiPaperAirplane, HiArrowUpTray, HiEnvelope, HiDocumentText, HiLink, HiEye, HiChevronDown,
} from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';
import { prGet, prPost, prGapsPdf } from '../lib/api';
import {
  buildWeeks, evidenceFor, reviewSummary, kindLabel, KINDS, CLAIM_STATUSES, REVIEW_STATUSES, weekEndOf, money, shortDate,
} from '../lib/paymentReviews';
import { StatusPill, DueDate, Coverage } from '../components/PaymentReviewUI';
import ImportClaimsModal from '../components/ImportClaimsModal';
import { EmptyState, FormInput, FormRow } from '../components/ui/FormComponents';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Skeleton';

/*  One review: its letter facts, then every claim grouped by participant and
 *  service week with the evidence the NDIA asked for. Files are linked from the
 *  participant's vault folder, never uploaded or generated here. */

const card = 'rounded-xl border border-slate-200 bg-white dark:border-[#263554] dark:bg-[#162036]';
const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#334766] dark:bg-[#162036] dark:text-slate-300 dark:hover:text-brand-400';
const select = 'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-[#334766] dark:bg-[#0f1a2e] dark:text-slate-200';

const weekText = (w) => {
  if (!w.week_start) return 'Week not set';
  const a = new Date(`${w.week_start}T00:00:00`);
  const b = new Date(`${(w.week_end || weekEndOf(w.week_start))}T00:00:00`);
  const d = (x, opts) => x.toLocaleDateString('en-AU', opts);
  return `${d(a, { weekday: 'short', day: 'numeric', month: 'short' })} – ${d(b, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;
};
const roundTag = (r) => (r ? `${r.reference}${r.round != null ? ` R${r.round}` : ''}` : '');

export default function PaymentReview() {
  const { reviewId } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('weeks');
  const [who, setWho] = useState('');
  const [gapsOnly, setGapsOnly] = useState(false);
  const [attach, setAttach] = useState(null);      // { week, kind }
  const [weekEdit, setWeekEdit] = useState(null);  // week
  const [sentOpen, setSentOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState('');

  const load = async () => {
    try { setData(await prGet(token, 'review', { id: reviewId })); setError(''); } catch (e) { setError(e.message); }
  };
  useEffect(() => { if (token) load(); }, [token, reviewId]); // eslint-disable-line react-hooks/exhaustive-deps

  const review = data?.review;
  const weeks = useMemo(() => (data ? buildWeeks(data.claims.filter((c) => c.status !== 'cancelled' && c.status !== 'not_ours'), data.evidence, data.review.id) : []), [data]);
  const summary = useMemo(() => (data ? reviewSummary(data.review, data.claims, data.evidence) : null), [data]);
  const people = useMemo(() => [...new Set(weeks.map((w) => w.participant_name))], [weeks]);
  const shown = weeks.filter((w) => (!who || w.participant_name === who) && (!gapsOnly || !w.covered));
  const gaps = weeks.flatMap((w) => w.missing.map((k) => ({ w, k })));

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 4000); };
  const run = async (key, fn) => {
    setBusy(key); setError('');
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(''); }
  };

  const openFile = (e) => run(`open-${e.id}`, async () => {
    const tabRef = window.open('', '_blank');
    const { url } = await prGet(token, 'link', e.file_id ? { file_id: e.file_id } : { path: e.storage_path, name: e.file_name });
    if (tabRef) tabRef.location = url; else window.location.assign(url);
  });
  const unlink = (e) => run(`un-${e.id}`, async () => { await prPost(token, 'detach', { id: e.id }); await load(); });
  const linkExisting = (week, e) => run(`re-${e.id}`, async () => {
    await prPost(token, 'attach', { review_id: review.id, participant_id: week.participant_id, week_start: e.week_start ? week.week_start : null, week_end: e.week_start ? week.week_end : null, kind: e.kind, file_id: e.file_id });
    await load();
  });
  const exportPack = (week) => run(week ? `pack-${week.key}` : 'pack-all', async () => {
    const params = { review_id: review.id };
    if (week) { params.participant_id = week.participant_id || ''; params.week_start = week.week_start || ''; }
    const r = await prGet(token, 'pack', params);
    window.location.assign(r.url);
    flash(`${r.file_name} · ${r.files} file${r.files === 1 ? '' : 's'}`);
  });
  const gapsPdf = () => run('gaps', async () => {
    const { blob, name } = await prGapsPdf(token, review.id);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  const setStatus = (status) => run('status', async () => { await prPost(token, 'update-review', { id: review.id, status }); await load(); });
  const markSent = () => run('sent', async () => { await prPost(token, 'mark-sent', { id: review.id }); setSentOpen(false); await load(); });
  const setClaimStatus = (c, status) => run(`c-${c.id}`, async () => {
    await prPost(token, 'update-claim', { id: c.id, status });
    setData((d) => ({ ...d, claims: d.claims.map((x) => (x.id === c.id ? { ...x, status } : x)) }));
  });

  if (error && !data) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</div>;
  if (!data) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  const openClaims = data.claims.filter((c) => c.status === 'open' || c.status === 'evidenced').length;

  return (
    <div className="space-y-6">
      {/* ── letter facts ── */}
      <div>
        <Link to="/payment-reviews" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400"><HiArrowLeft className="h-3.5 w-3.5" /> Payment reviews</Link>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">{review.reference}{review.round != null && ` · Round ${review.round}`}</span>
              <StatusPill status={review.status} />
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{review.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={review.status} onChange={(e) => setStatus(e.target.value)} disabled={busy === 'status'} className={`${select} w-auto`} aria-label="Review status">
              {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
            <button onClick={() => setImportOpen(true)} className={btn}><HiArrowUpTray className="h-4 w-4" /> Import claims</button>
            <button onClick={() => exportPack(null)} disabled={!weeks.length || busy === 'pack-all'} className={btn}><HiArrowDownTray className="h-4 w-4" /> {busy === 'pack-all' ? 'Packing…' : 'Export all'}</button>
            <button onClick={() => setSentOpen(true)} disabled={review.status !== 'open'} className="inline-flex items-center gap-1.5 rounded-lg bg-accent-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-40">
              <HiPaperAirplane className="h-4 w-4" /> Mark sent
            </button>
          </div>
        </div>

        <dl className={`${card} mt-4 grid grid-cols-2 divide-slate-100 sm:grid-cols-3 lg:grid-cols-7 lg:divide-x dark:divide-[#263554]`}>
          {[
            ['Letter', shortDate(review.letter_date)],
            ['Due', <DueDate key="d" iso={review.due_date} status={review.status} />],
            ['Sent', review.sent_date ? shortDate(review.sent_date) : '—'],
            ['Claims', <span key="c" className="tabular-nums">{data.claims.length}{openClaims !== data.claims.length && <span className="ml-1 text-xs font-normal text-slate-400">({openClaims} open)</span>}</span>],
            ['Amount', <span key="a" className="tabular-nums">{money(summary.total)}</span>],
            ['Covered', <Coverage key="v" pct={summary.covered_pct} />],
            ['Send to', review.email_to ? <a key="e" href={`mailto:${review.email_to}?subject=${encodeURIComponent(review.reference)}`} className="inline-flex max-w-full items-center gap-1 truncate text-brand-600 hover:underline dark:text-brand-400"><HiEnvelope className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{review.email_to}</span></a> : '—'],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{v}</dd>
            </div>
          ))}
        </dl>
        {review.notes && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{review.notes}</p>}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
      {notice && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">Downloading {notice}</div>}

      {/* ── tabs ── */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-[#263554]">
        {[['weeks', 'Evidence by week', weeks.length], ['gaps', 'Gaps', gaps.length], ['claims', 'Claims', data.claims.length]].map(([k, label, n]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === k ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${k === 'gaps' && n ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-[#0f1a2e] dark:text-slate-300'}`}>{n}</span>
          </button>
        ))}
      </div>

      {tab === 'weeks' && (
        data.claims.length === 0 ? (
          <EmptyState icon={HiDocumentText} title="No claims on this review yet" description="Import the NDIA's Attachment A to list the claims under review."
            action={<button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600"><HiArrowUpTray className="h-4 w-4" /> Import claims</button>} />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {['', ...people].map((p) => {
                const n = weeks.filter((w) => !p || w.participant_name === p).reduce((s, w) => s + w.missing.length, 0);
                return (
                  <button key={p || 'all'} onClick={() => setWho(p)} className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${who === p ? 'bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 dark:bg-[#162036] dark:text-slate-300 dark:ring-[#334766]'}`}>
                    {p || 'Everyone'}{n > 0 && <span className="ml-1.5 text-red-500">{n}</span>}
                  </button>
                );
              })}
              <label className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <input type="checkbox" checked={gapsOnly} onChange={(e) => setGapsOnly(e.target.checked)} className="rounded border-slate-300" /> Only weeks with gaps
              </label>
            </div>
            {shown.map((w) => (
              <WeekCard key={w.key} week={w} busy={busy}
                onOpen={openFile} onUnlink={unlink} onLinkExisting={(e) => linkExisting(w, e)}
                onAttach={(kind) => setAttach({ week: w, kind })} onSetWeek={() => setWeekEdit(w)} onPack={() => exportPack(w)} />
            ))}
            {!shown.length && <p className="py-8 text-center text-sm text-slate-500">Every week in this view has its evidence linked.</p>}
          </div>
        )
      )}

      {tab === 'gaps' && (
        <div className={`${card} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#263554]">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {gaps.length
                ? <><span className="font-semibold text-red-600 dark:text-red-400">{gaps.length} missing</span> across {new Set(gaps.map((g) => g.w.key)).size} participant-weeks</>
                : 'Nothing missing: every week has each kind of evidence the NDIA asked for.'}
            </p>
            <button onClick={gapsPdf} disabled={busy === 'gaps'} className={btn}><HiArrowDownTray className="h-4 w-4" /> {busy === 'gaps' ? 'Building…' : 'Export PDF'}</button>
          </div>
          {gaps.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left dark:bg-[#0f1a2e]">
                    {['Participant', 'Service week', 'Missing', 'Claims', 'Amount', ''].map((h, i) => <th key={i} className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${i === 3 || i === 4 ? 'text-right' : ''}`}>{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                  {gaps.map(({ w, k }) => (
                    <tr key={`${w.key}-${k}`} className="hover:bg-slate-50 dark:hover:bg-[#1e2d4a]">
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{w.participant_name}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 dark:text-slate-300">{weekText(w)}</td>
                      <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-300"><HiXCircle className="h-3.5 w-3.5" />{kindLabel(k)}</span></td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">{w.claims.length}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-200">{money(w.amount)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => setAttach({ week: w, kind: k })} disabled={!w.week_start || !w.participant_id} className={btn}><HiPaperClip className="h-3.5 w-3.5" /> Attach</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'claims' && <ClaimsTab claims={data.claims} busy={busy} onStatus={setClaimStatus} />}

      <AttachModal state={attach} review={review} token={token} onClose={() => setAttach(null)} onChanged={load} weeks={weeks} />
      <SetWeekModal week={weekEdit} token={token} onClose={() => setWeekEdit(null)} onSaved={async () => { setWeekEdit(null); await load(); }} />
      <ImportClaimsModal review={importOpen ? review : null} token={token} onClose={() => setImportOpen(false)} onDone={async () => { setImportOpen(false); await load(); }} />

      <Modal isOpen={sentOpen} onClose={() => busy !== 'sent' && setSentOpen(false)} title="Mark review sent" icon={HiPaperAirplane}>
        <ModalBody>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>Record that the evidence for <span className="font-semibold text-slate-900 dark:text-white">{review.reference}{review.round != null && ` Round ${review.round}`}</span> went to {review.email_to || 'the NDIA'} today.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Review status becomes <b>sent</b>, sent date today.</li>
              <li>{openClaims} open or evidenced claim{openClaims === 1 ? '' : 's'} move to <b>sent</b>. Paid, cancelled and not-ours claims are left alone.</li>
              <li>Linked evidence without a sent date is stamped with today.</li>
            </ul>
            {summary.gaps > 0 && <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">{summary.gaps} evidence gap{summary.gaps === 1 ? ' is' : 's are'} still open on this review.</p>}
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setSentOpen(false)} disabled={busy === 'sent'}>Cancel</ButtonSecondary>
          <ButtonPrimary onClick={markSent} loading={busy === 'sent'}>Mark sent</ButtonPrimary>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── a participant-week ───────────────────────────────────────────────────

function WeekCard({ week: w, busy, onOpen, onUnlink, onLinkExisting, onAttach, onSetWeek, onPack }) {
  const [expanded, setExpanded] = useState(false);
  const extra = w.evidence.filter((e) => !w.required.some((k) => evidenceFor({ evidence: [e] }, k).length));
  const rows = expanded ? w.claims : w.claims.slice(0, 4);
  const canAttach = !!(w.week_start && w.participant_id);

  return (
    <section className={`${card} overflow-hidden ${w.covered ? '' : 'border-l-4 border-l-red-400 dark:border-l-red-500'}`}>
      <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-[#263554]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            {w.participant_id
              ? <Link to={`/participants/${w.participant_id}`} className="font-semibold text-slate-900 hover:text-brand-600 dark:text-white">{w.participant_name}</Link>
              : <span className="font-semibold text-slate-900 dark:text-white">{w.participant_name}</span>}
            {w.ndis_number && <span className="font-mono text-[11px] text-slate-400">{w.ndis_number}</span>}
          </div>
          <p className={`mt-0.5 text-sm ${w.week_start ? 'text-slate-600 dark:text-slate-300' : 'font-semibold text-amber-600'}`}>{weekText(w)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{money(w.amount)}</p>
            <p className="text-[11px] text-slate-400">{w.claims.length} claim{w.claims.length === 1 ? '' : 's'}</p>
          </div>
          {w.covered
            ? <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-green-700 dark:bg-green-900/20 dark:text-green-300"><HiCheckCircle className="h-4 w-4" /> Covered</span>
            : <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-900/20 dark:text-red-300"><HiXCircle className="h-4 w-4" /> {w.missing.length} missing</span>}
        </div>
      </header>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {w.required.map((k) => {
            const files = evidenceFor(w, k);
            const ok = files.length > 0;
            const suggest = ok ? [] : w.elsewhere.filter((e) => evidenceFor({ evidence: [e] }, k).length);
            return (
              <div key={k} className={`rounded-lg border px-3 py-2 ${ok ? 'border-green-200 bg-green-50/50 dark:border-green-800/50 dark:bg-green-900/10' : 'border-red-200 bg-red-50/60 dark:border-red-800/50 dark:bg-red-900/10'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {ok ? <HiCheckCircle className="h-4 w-4" /> : <HiXCircle className="h-4 w-4" />}{kindLabel(k)}
                  </span>
                  {!ok && <span className="text-[10px] font-black tracking-widest text-red-600 dark:text-red-400">MISSING</span>}
                </div>
                {ok && (
                  <ul className="mt-1.5 space-y-1">
                    {files.map((e) => <FileLine key={e.id} e={e} busy={busy} onOpen={onOpen} onUnlink={onUnlink} />)}
                  </ul>
                )}
                {!ok && (
                  <div className="mt-1.5 space-y-1">
                    {suggest.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-xs">
                        <button onClick={() => onOpen(e)} className="min-w-0 flex-1 truncate text-left text-amber-700 hover:underline dark:text-amber-400" title={`Linked to ${roundTag(e.review)} — ${e.file_name}`}>
                          <span className="font-mono text-[10px]">{roundTag(e.review)}</span> {e.file_name}
                        </button>
                        <button onClick={() => onLinkExisting(e)} disabled={busy === `re-${e.id}`} className="inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:ring-amber-700 dark:hover:bg-amber-900/30"><HiLink className="h-3 w-3" /> Use</button>
                      </div>
                    ))}
                    <button onClick={() => onAttach(k)} disabled={!canAttach} className="text-xs font-medium text-red-700 hover:underline disabled:no-underline disabled:opacity-50 dark:text-red-300">+ Attach from vault</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {extra.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400">Also linked:</span>
            {extra.map((e) => (
              <span key={e.id} className="group inline-flex max-w-full items-center gap-1 rounded-md bg-slate-100 py-0.5 pl-2 pr-1 text-slate-600 dark:bg-[#0f1a2e] dark:text-slate-300">
                <button onClick={() => onOpen(e)} className="truncate hover:underline"><span className="text-slate-400">{kindLabel(e.kind)}:</span> {e.file_name}</button>
                <button onClick={() => onUnlink(e)} title="Unlink" className="rounded p-0.5 text-slate-400 hover:text-red-500"><HiXMark className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-[#263554]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-400 dark:bg-[#0f1a2e]">
                <th className="px-3 py-1.5 font-semibold">PRN</th><th className="px-3 py-1.5 font-semibold">Posted</th><th className="px-3 py-1.5 font-semibold">Support</th>
                <th className="px-3 py-1.5 text-right font-semibold">Amount</th><th className="px-3 py-1.5 font-semibold">NDIA finding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
              {rows.map((c) => (
                <tr key={c.id} className="align-top text-slate-600 dark:text-slate-300">
                  <td className="whitespace-nowrap px-3 py-1.5 font-mono text-slate-800 dark:text-slate-100">{c.prn}</td>
                  <td className="whitespace-nowrap px-3 py-1.5">{shortDate(c.posted)}</td>
                  <td className="min-w-[160px] px-3 py-1.5">{c.support || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">{money(c.amount)}</td>
                  <td className="min-w-[200px] px-3 py-1.5">{c.finding || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {w.claims.length > 4 && (
            <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-center gap-1 border-t border-slate-100 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50 dark:border-[#263554] dark:hover:bg-[#1e2d4a]">
              {expanded ? 'Show fewer' : `Show all ${w.claims.length} claims`}<HiChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => onAttach(w.missing[0] || w.required[0])} disabled={!canAttach} className={btn} title={canAttach ? '' : w.participant_id ? 'Set the service week first' : 'No vault participant for this name'}>
            <HiPaperClip className="h-4 w-4" /> Attach from vault
          </button>
          <button onClick={onSetWeek} className={btn}><HiCalendarDays className="h-4 w-4" /> Set week</button>
          <button onClick={onPack} disabled={!w.evidence.length || busy === `pack-${w.key}`} className={btn}><HiArrowDownTray className="h-4 w-4" /> {busy === `pack-${w.key}` ? 'Packing…' : 'Export pack'}</button>
        </div>
      </div>
    </section>
  );
}

function FileLine({ e, busy, onOpen, onUnlink }) {
  return (
    <li className="flex items-center gap-1.5 text-xs">
      <button onClick={() => onOpen(e)} disabled={busy === `open-${e.id}`} className="min-w-0 flex-1 truncate text-left text-slate-700 hover:text-brand-600 hover:underline dark:text-slate-200" title={e.file_name}>
        {e.file_name}
      </button>
      {!e.week_start && <span className="shrink-0 rounded bg-white px-1 text-[9px] font-semibold uppercase text-slate-400 ring-1 ring-slate-200 dark:bg-transparent dark:ring-slate-600">all weeks</span>}
      {e.sent_date && <span className="shrink-0 text-[10px] text-slate-400" title={`Sent ${shortDate(e.sent_date)}`}>sent</span>}
      <button onClick={() => onUnlink(e)} disabled={busy === `un-${e.id}`} title="Unlink from this review (the file stays in the vault)" className="shrink-0 rounded p-0.5 text-slate-300 hover:text-red-500 dark:text-slate-500"><HiXMark className="h-3.5 w-3.5" /></button>
    </li>
  );
}

// ─── pick a file from the participant's vault folder ──────────────────────

function AttachModal({ state, review, token, onClose, onChanged, weeks }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState('notes');
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [allWeeks, setAllWeeks] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const pid = state?.week.participant_id;
  // the card in `state` is a snapshot; read the live one so freshly linked files show
  const week = weeks.find((w) => w.key === state?.week.key) || state?.week;

  useEffect(() => {
    if (!state) return;
    setKind(state.kind || 'notes'); setCat(''); setQ(''); setError(''); setAllWeeks(['service_agreement', 'contacts'].includes(state.kind));
    if (!pid) return;
    setLoading(true);
    prGet(token, 'files', { participant_id: pid }).then(setFiles).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [state, pid, token]);

  if (!state) return null;
  const cats = [...new Set(files.map((f) => f.category || 'General'))].sort();
  const list = files.filter((f) => (!cat || (f.category || 'General') === cat) && (!q || (f.file_name || '').toLowerCase().includes(q.toLowerCase())));
  const linked = (f) => week?.evidence.some((e) => e.file_id === f.id && e.kind === kind);

  const link = async (f) => {
    setBusy(f.id); setError('');
    try {
      await prPost(token, 'attach', {
        review_id: review.id, participant_id: pid, kind, file_id: f.id,
        week_start: allWeeks ? null : week.week_start, week_end: allWeeks ? null : week.week_end,
      });
      await onChanged();
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const open = async (f) => {
    const tabRef = window.open('', '_blank');
    try { const { url } = await prGet(token, 'link', { file_id: f.id }); if (tabRef) tabRef.location = url; } catch (e) { tabRef?.close(); setError(e.message); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Attach from vault" icon={HiPaperClip} size="xl" dismissable>
      <ModalBody className="px-5! py-5! sm:px-8!">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">{week.participant_name}</span> · {allWeeks ? 'every week of this review' : weekText(week)}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-medium text-slate-500">Link as
              <select value={kind} onChange={(e) => setKind(e.target.value)} className={`${select} mt-1 block w-full py-2 text-sm`}>
                {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}{week.missing.includes(k.value) ? ' (missing)' : ''}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-500">Category
              <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${select} mt-1 block w-full py-2 text-sm`}>
                <option value="">All categories</option>
                {cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-500">Name
              <div className="relative mt-1">
                <HiMagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="payslip, roster, WE12…" className={`${select} block w-full py-2 pl-8 text-sm`} />
              </div>
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <input type="checkbox" checked={allWeeks} onChange={(e) => setAllWeeks(e.target.checked)} className="rounded border-slate-300" />
            Applies to every week of this review (service agreement, worker contact list)
          </label>
          {error && <ModalError message={error} />}
          <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-[#263554]">
            {loading ? <p className="p-6 text-center text-sm text-slate-400">Loading the participant's files…</p>
              : !list.length ? <p className="p-6 text-center text-sm text-slate-400">{files.length ? 'No files match.' : 'This participant has no files in the vault yet. Upload them on the participant profile first.'}</p>
                : (
                  <ul className="divide-y divide-slate-100 dark:divide-[#263554]">
                    {list.map((f) => (
                      <li key={f.id} className="flex items-center gap-3 px-3 py-2">
                        <HiDocumentText className="h-4 w-4 shrink-0 text-brand-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-slate-800 dark:text-slate-100" title={f.file_name}>{f.file_name}</p>
                          <p className="text-[11px] text-slate-400">{f.category || 'General'} · added {shortDate(f.created_at?.slice(0, 10))}</p>
                        </div>
                        <button onClick={() => open(f)} title="Open" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-[#1e2d4a]"><HiEye className="h-4 w-4" /></button>
                        {linked(f)
                          ? <span className="inline-flex w-20 items-center justify-center gap-1 text-xs font-semibold text-green-600"><HiCheckCircle className="h-4 w-4" /> Linked</span>
                          : <button onClick={() => link(f)} disabled={busy === f.id} className="w-20 rounded-md bg-brand-500 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50">{busy === f.id ? '…' : 'Link'}</button>}
                      </li>
                    ))}
                  </ul>
                )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <ButtonPrimary onClick={onClose}>Done</ButtonPrimary>
      </ModalFooter>
    </Modal>
  );
}

// ─── service week for a card's claims ─────────────────────────────────────

function SetWeekModal({ week, token, onClose, onSaved }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (week) { setStart(week.week_start || ''); setEnd(week.week_end || ''); setError(''); } }, [week]);
  if (!week) return null;

  const save = async () => {
    setBusy(true); setError('');
    try { await prPost(token, 'set-week', { claim_ids: week.claims.map((c) => c.id), week_start: start || null, week_end: end || null }); await onSaved(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal isOpen onClose={() => !busy && onClose()} title="Set service week" icon={HiCalendarDays}>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{week.claims.length} claim{week.claims.length === 1 ? '' : 's'} for <b>{week.participant_name}</b>. Use the dates the support was delivered, from the invoice or roster, not the posting date.</p>
          <FormRow>
            <FormInput label="Week starts" type="date" value={start} onChange={(e) => { setStart(e.target.value); setEnd(weekEndOf(e.target.value) || ''); }} />
            <FormInput label="Week ends" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </FormRow>
          {error && <ModalError message={error} />}
        </div>
      </ModalBody>
      <ModalFooter>
        <ButtonSecondary onClick={onClose} disabled={busy}>Cancel</ButtonSecondary>
        <ButtonPrimary onClick={save} loading={busy}>Save week</ButtonPrimary>
      </ModalFooter>
    </Modal>
  );
}

// ─── every claim, with inline status ──────────────────────────────────────

function ClaimsTab({ claims, busy, onStatus }) {
  const [q, setQ] = useState('');
  const list = claims.filter((c) => !q || (c.prn || '').includes(q.trim()) || (c.participant_name || '').toLowerCase().includes(q.trim().toLowerCase()) || (c.invoice_no || '').toLowerCase().includes(q.trim().toLowerCase()));
  const total = list.reduce((s, c) => s + Number(c.amount || 0), 0);
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#263554]">
        <div className="relative sm:w-72">
          <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search PRN, participant or invoice" inputMode="search"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 dark:border-[#334766] dark:bg-[#0f1a2e] dark:text-slate-200" />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{list.length}</span> claims · <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{money(total)}</span></p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left dark:bg-[#0f1a2e]">
              {['PRN', 'Participant', 'Posted', 'Service week', 'Support', 'Invoice', 'Amount', 'Finding', 'Status'].map((h, i) => <th key={h} className={`whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${i === 6 ? 'text-right' : ''}`}>{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
            {list.map((c) => (
              <tr key={c.id} className="align-top text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#1e2d4a]">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-[13px] text-slate-900 dark:text-white">{c.prn}</td>
                <td className="whitespace-nowrap px-3 py-2">{c.participant_name}</td>
                <td className="whitespace-nowrap px-3 py-2">{shortDate(c.posted)}</td>
                <td className="whitespace-nowrap px-3 py-2">{c.week_start ? `${shortDate(c.week_start)}` : <span className="text-amber-600">not set</span>}</td>
                <td className="min-w-[180px] px-3 py-2 text-xs">{c.support || '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{c.invoice_no || '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-900 dark:text-white">{money(c.amount)}</td>
                <td className="min-w-[220px] px-3 py-2 text-xs">{c.finding || '—'}</td>
                <td className="px-3 py-2">
                  <select value={c.status} onChange={(e) => onStatus(c, e.target.value)} disabled={busy === `c-${c.id}`} className={`${select} w-auto`} aria-label={`Status of ${c.prn}`}>
                    {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s === 'not_ours' ? 'not ours' : s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="p-8 text-center text-sm text-slate-400">No claims match “{q}”.</p>}
      </div>
    </div>
  );
}
