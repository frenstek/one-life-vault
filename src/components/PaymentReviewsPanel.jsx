import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiReceiptPercent, HiChevronRight } from 'react-icons/hi2';
import { prGet } from '../lib/api';
import { money } from '../lib/paymentReviews';
import { StatusPill, DueDate } from './PaymentReviewUI';

/*  Participant profile: this participant's claims under NDIA payment review,
 *  one line per review. Renders nothing when there are none. */

export default function PaymentReviewsPanel({ participantId, token }) {
  const [claims, setClaims] = useState([]);
  useEffect(() => {
    if (!token || !participantId) return;
    prGet(token, 'participant', { participant_id: participantId }).then(setClaims).catch(() => setClaims([]));
  }, [participantId, token]);

  const reviews = useMemo(() => {
    const m = new Map();
    for (const c of claims) {
      if (!c.review) continue;
      if (!m.has(c.review.id)) m.set(c.review.id, { ...c.review, claims: [] });
      m.get(c.review.id).claims.push(c);
    }
    return [...m.values()].sort((a, b) => (b.due_date || '').localeCompare(a.due_date || ''));
  }, [claims]);

  if (!reviews.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-[#263554] dark:bg-[#162036]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-[#263554]">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><HiReceiptPercent className="h-4 w-4 text-brand-500" /> Payment reviews</h3>
        <Link to="/payment-reviews" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">All reviews</Link>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-[#263554]">
        {reviews.map((r) => {
          const counts = r.claims.reduce((o, c) => ({ ...o, [c.status]: (o[c.status] || 0) + 1 }), {});
          return (
            <li key={r.id}>
              <Link to={`/payment-reviews/${r.id}`} className="flex flex-col gap-2 px-5 py-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center dark:hover:bg-[#1e2d4a]">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{r.reference}{r.round != null && ` R${r.round}`}</span>
                    <StatusPill status={r.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{r.title}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="tabular-nums text-slate-700 dark:text-slate-200"><b>{r.claims.length}</b> claim{r.claims.length === 1 ? '' : 's'} · {money(r.claims.reduce((s, c) => s + Number(c.amount || 0), 0))}</span>
                  <span className="text-slate-500 dark:text-slate-400">{Object.entries(counts).map(([s, n]) => `${n} ${s === 'not_ours' ? 'not ours' : s}`).join(' · ')}</span>
                  <span className="text-xs"><DueDate iso={r.due_date} status={r.status} /></span>
                  <HiChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
