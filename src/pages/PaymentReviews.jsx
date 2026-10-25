import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiPlus, HiReceiptPercent, HiArrowUpTray } from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';
import { prGet, prPost } from '../lib/api';
import { PageHeader, EmptyState, FormInput, FormRow, FormTextarea } from '../components/ui/FormComponents';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from '../components/ui/Modal';
import { SkeletonRow } from '../components/ui/Skeleton';
import ImportClaimsModal from '../components/ImportClaimsModal';
import { StatusPill, DueDate, Coverage } from '../components/PaymentReviewUI';
import { money, shortDate, daysUntil } from '../lib/paymentReviews';

/*  Payment Review Desk — the register. One row per NDIA payment integrity
 *  review (a letter + its Attachment A). Coverage counts a claim once every
 *  kind of evidence its finding asks for is linked for its service week. */

const EMPTY = { reference: '', round: '', title: '', letter_date: '', due_date: '', email_to: 'crt.integrity.review@ndis.gov.au', notes: '' };

export default function PaymentReviews() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [importFor, setImportFor] = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try { setRows(await prGet(token, 'list')); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const open = rows.filter((r) => r.status === 'open');
    const next = open.filter((r) => r.due_date).sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
    return {
      open: open.length,
      atStake: open.reduce((s, r) => s + r.total, 0),
      next,
      gaps: open.reduce((n, r) => n + (r.gaps || 0), 0),
    };
  }, [rows]);

  const create = async () => {
    setFormError('');
    if (!form.reference.trim() || !form.title.trim()) return setFormError('Reference and title are required.');
    setBusy(true);
    try {
      const r = await prPost(token, 'create-review', form);
      setNewOpen(false);
      navigate(`/payment-reviews/${r.id}`);
    } catch (e) { setFormError(e.message); } finally { setBusy(false); }
  };

  const nextDays = stats.next ? daysUntil(stats.next.due_date) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payment Reviews"
        subtitle="NDIA payment integrity reviews: what each letter asked for, what is linked from the vault, and what is still missing."
        actions={(
          <button onClick={() => { setForm(EMPTY); setFormError(''); setNewOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600">
            <HiPlus className="h-4 w-4" /> New review
          </button>
        )}
      />

      <dl className="grid grid-cols-2 divide-slate-100 rounded-xl border border-slate-200 bg-white lg:grid-cols-4 lg:divide-x dark:divide-[#263554] dark:border-[#263554] dark:bg-[#162036]">
        {[
          ['Open reviews', loading ? '…' : stats.open, ''],
          ['Held in open reviews', loading ? '…' : money(stats.atStake), ''],
          [stats.next ? `Next due · ${stats.next.reference}${stats.next.round ? ` R${stats.next.round}` : ''}` : 'Next due',
            loading || !stats.next ? '—' : nextDays < 0 ? `${-nextDays} days late` : nextDays === 0 ? 'today' : `${nextDays} days`,
            nextDays != null && nextDays < 7 ? 'text-red-600 dark:text-red-400' : ''],
          ['Evidence gaps in open reviews', loading ? '…' : stats.gaps, stats.gaps ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'],
        ].map(([k, v, tone]) => (
          <div key={k} className="min-w-0 px-4 py-4 sm:px-5">
            <dt className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
            <dd className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${tone || 'text-slate-900 dark:text-white'}`}>{v}</dd>
          </div>
        ))}
      </dl>

      {error && <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5 text-sm text-red-700 dark:text-red-300">{error}</div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036]">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={HiReceiptPercent} title="No payment reviews yet" description="When the NDIA sends a Request for Information, add it here and import its Attachment A." />
      ) : (
        <>
          {/* desktop register */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block dark:border-[#263554] dark:bg-[#162036]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left dark:border-[#263554] dark:bg-[#0f1a2e]">
                    {['Reference', 'Review · participants', 'Letter', 'Due', 'Claims', 'Amount', 'Covered', 'Status', ''].map((h, i) => (
                      <th key={i} className={`whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${i === 4 || i === 5 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                  {rows.map((r) => (
                    <tr key={r.id} onClick={() => navigate(`/payment-reviews/${r.id}`)} className="cursor-pointer align-top transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]">
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{r.reference}</span>
                        {r.round != null && <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-[#0f1a2e] dark:text-slate-300">R{r.round}</span>}
                      </td>
                      <td className="min-w-[260px] px-4 py-3">
                        <Link to={`/payment-reviews/${r.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-slate-800 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400">{r.title}</Link>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {r.participants.length ? r.participants.join(', ') : 'No claims imported yet'}
                          {r.sent_date && <span className="text-slate-400"> · sent {shortDate(r.sent_date)}</span>}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{shortDate(r.letter_date)}</td>
                      <td className="whitespace-nowrap px-4 py-3"><DueDate iso={r.due_date} status={r.status} /></td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-200">{r.claim_count}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900 dark:text-white">{money(r.total)}</td>
                      <td className="px-4 py-3"><Coverage pct={r.covered_pct} /></td>
                      <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setImportFor(r); }} title="Import claims from Attachment A" aria-label="Import claims from Attachment A"
                          className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-[#334766] dark:text-slate-300 dark:hover:text-brand-400">
                          <HiArrowUpTray className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* phone register */}
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#263554] dark:bg-[#162036]">
                <Link to={`/payment-reviews/${r.id}`} className="block">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{r.reference}{r.round != null && ` · R${r.round}`}</span>
                    <StatusPill status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{r.title}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-slate-400">Claims</p><p className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{r.claim_count}</p></div>
                    <div><p className="text-slate-400">Amount</p><p className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{money(r.total)}</p></div>
                    <div><p className="text-slate-400">Due</p><DueDate iso={r.due_date} status={r.status} /></div>
                  </div>
                  <div className="mt-3"><Coverage pct={r.covered_pct} /></div>
                </Link>
                <button onClick={() => setImportFor(r)} className="mt-3 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-[#334766] dark:text-slate-300">
                  <HiArrowUpTray className="h-3.5 w-3.5" /> Import claims
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal isOpen={newOpen} onClose={() => !busy && setNewOpen(false)} title="New payment review" icon={HiReceiptPercent}>
        <ModalBody>
          <div className="space-y-5">
            <FormRow>
              <FormInput label="NDIA reference" required value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value.toUpperCase() })} placeholder="IPML0346" />
              <FormInput label="Round" type="number" min="1" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} placeholder="6" />
            </FormRow>
            <FormInput label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="IPML0346 · Round 6 · Darrell, Nicole" />
            <FormRow>
              <FormInput label="Letter date" type="date" value={form.letter_date} onChange={(e) => setForm({ ...form, letter_date: e.target.value })} />
              <FormInput label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </FormRow>
            <FormInput label="Send evidence to" type="email" value={form.email_to} onChange={(e) => setForm({ ...form, email_to: e.target.value })} />
            <FormTextarea label="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What the letter asks for, anything unusual" />
            {formError && <ModalError message={formError} />}
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setNewOpen(false)} disabled={busy}>Cancel</ButtonSecondary>
          <ButtonPrimary onClick={create} loading={busy}>Create review</ButtonPrimary>
        </ModalFooter>
      </Modal>

      <ImportClaimsModal review={importFor} token={token} onClose={() => setImportFor(null)} onDone={() => { setImportFor(null); load(); }} />
    </div>
  );
}
