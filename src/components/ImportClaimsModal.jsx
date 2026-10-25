import { useEffect, useState } from 'react';
import { HiArrowUpTray, HiDocumentText, HiCheckCircle } from 'react-icons/hi2';
import { prPost } from '../lib/api';
import { money } from '../lib/paymentReviews';
import { FormField } from './ui/FormComponents';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from './ui/Modal';

/*  Import claims into a review from the NDIA's Attachment A: paste the table
 *  text or drop the PDF. First pass parses only (nothing saved) so the counts
 *  can be checked against the letter; second pass upserts by PRN. */

const readFile = (f) => new Promise((resolve, reject) => { const rd = new FileReader(); rd.onload = () => resolve(rd.result); rd.onerror = reject; rd.readAsDataURL(f); });

export default function ImportClaimsModal({ review, token, onClose, onDone }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setText(''); setFile(null); setPreview(null); setResult(null); setError(''); }, [review?.id]);

  const send = async (commit) => {
    setError('');
    if (!text.trim() && !file) return setError('Paste the Attachment A text or choose its PDF.');
    setBusy(true);
    try {
      const body = { review_id: review.id, commit };
      if (file) body.pdf = await readFile(file); else body.text = text;
      const r = await prPost(token, 'import', body);
      if (commit) setResult(r); else setPreview(r);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const fresh = preview?.claims.filter((c) => !c.exists).length || 0;
  const unmatched = [...new Set((preview?.claims || []).filter((c) => !c.matched).map((c) => c.participant_name))];
  const people = [...new Set((preview?.claims || []).map((c) => c.participant_name))];

  return (
    <Modal isOpen={!!review} onClose={() => !busy && onClose()} title={`Import claims · ${review?.reference || ''}${review?.round ? ` R${review.round}` : ''}`} icon={HiArrowUpTray} size="lg">
      <ModalBody>
        {result ? (
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
            <p className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400"><HiCheckCircle className="h-5 w-5" /> {result.imported} claims imported</p>
            <p>{result.added} new, {result.updated} already on the review and refreshed from the letter.</p>
            {result.unmatched?.length > 0 && <p className="text-amber-700 dark:text-amber-400">Not matched to a vault participant: {[...new Set(result.unmatched)].join(', ')}. Their claims are saved by name; files cannot be linked until the participant exists.</p>}
          </div>
        ) : (
          <div className="space-y-5">
            <FormField label="Attachment A PDF" hint="The 'Missing Information' or 'Request for Information' PDF exactly as the NDIA sent it">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 hover:border-brand-400 dark:border-[#334766] dark:bg-[#0f1a2e] dark:text-slate-300">
                <span className="flex min-w-0 items-center gap-2"><HiDocumentText className="h-5 w-5 shrink-0 text-brand-500" /><span className="truncate">{file ? file.name : 'Choose the PDF'}</span></span>
                {file && <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); setPreview(null); }} className="text-xs text-slate-400 hover:text-red-500">clear</button>}
                <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); }} />
              </label>
            </FormField>
            {!file && (
              <FormField label="…or paste the table text" hint="Select all in the PDF viewer, copy, paste here">
                <textarea value={text} onChange={(e) => { setText(e.target.value); setPreview(null); }} rows={8}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 placeholder-slate-400 dark:border-[#334766] dark:bg-[#0f1a2e] dark:text-slate-200"
                  placeholder={'431576804\nDarrell\nTwyford\n13-Jul-26 814039961 $81.06 Supported Independent Living - Standard\n(Description is Truncated) MPM-DT-003-00749\nInsufficient\ninformation\n>Missing case notes, timesheet, roster, payslips'} />
              </FormField>
            )}
            {preview && (
              <div className="rounded-lg border border-slate-200 dark:border-[#263554]">
                <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 text-center dark:divide-[#263554] dark:border-[#263554]">
                  <div className="p-3"><p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{preview.claims.length}</p><p className="text-[11px] text-slate-500">claims found</p></div>
                  <div className="p-3"><p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{money(preview.total)}</p><p className="text-[11px] text-slate-500">total</p></div>
                  <div className="p-3"><p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{fresh}</p><p className="text-[11px] text-slate-500">new to this review</p></div>
                </div>
                <div className="space-y-1 p-3 text-xs text-slate-600 dark:text-slate-300">
                  <p>Participants: {people.join(', ')}</p>
                  {unmatched.length > 0 && <p className="text-amber-700 dark:text-amber-400">No vault participant found for: {unmatched.join(', ')}</p>}
                  <p className="text-slate-400">Check the count and total against the letter before importing.</p>
                </div>
                <div className="max-h-48 overflow-y-auto border-t border-slate-200 dark:border-[#263554]">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                      {preview.claims.map((c) => (
                        <tr key={c.prn} className={c.exists ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}>
                          <td className="px-3 py-1.5 font-mono">{c.prn}</td>
                          <td className="px-3 py-1.5">{c.participant_name}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">{money(c.amount)}</td>
                          <td className="hidden px-3 py-1.5 sm:table-cell">{c.finding || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {error && <ModalError message={error} />}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        {result ? (
          <ButtonPrimary onClick={onDone}>Done</ButtonPrimary>
        ) : (
          <>
            <ButtonSecondary onClick={onClose} disabled={busy}>Cancel</ButtonSecondary>
            {preview
              ? <ButtonPrimary onClick={() => send(true)} loading={busy}>Import {preview.claims.length} claims</ButtonPrimary>
              : <ButtonPrimary onClick={() => send(false)} loading={busy}>Read claims</ButtonPrimary>}
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
