import { shortDate, daysUntil } from '../lib/paymentReviews';

/*  Small pieces shared by the Payment Review Desk pages. */

export function StatusPill({ status }) {
  const tone = {
    open: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800/50',
    sent: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:ring-brand-800/50',
    closed: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    evidenced: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800/50',
    paid: 'bg-green-600 text-white ring-green-600',
    cancelled: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800/50',
    not_ours: 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
  }[status] || 'bg-slate-100 text-slate-600 ring-slate-200';
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${tone}`}>{status === 'not_ours' ? 'not ours' : status}</span>;
}

export function DueDate({ iso, status }) {
  const d = daysUntil(iso);
  if (d == null) return <span className="text-slate-400">—</span>;
  const urgent = status === 'open' && d < 7;
  return (
    <div className="leading-tight">
      <span className={urgent ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}>{shortDate(iso)}</span>
      {status === 'open' && (
        <span className={`block text-[11px] ${urgent ? 'text-red-500 dark:text-red-400' : 'text-slate-400'}`}>
          {d < 0 ? `overdue ${-d} day${d === -1 ? '' : 's'}` : d === 0 ? 'due today' : `due in ${d} day${d === 1 ? '' : 's'}`}
        </span>
      )}
    </div>
  );
}

export function Coverage({ pct }) {
  if (pct == null) return <span className="text-xs text-slate-400">no claims</span>;
  const tone = pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-[#0f1a2e]">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">{pct}%</span>
    </div>
  );
}
