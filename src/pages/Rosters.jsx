import { useEffect, useMemo, useState } from 'react';
import {
  HiPlus, HiMagnifyingGlass, HiCalendarDays, HiArrowDownTray, HiTrash, HiPencilSquare,
  HiDocumentText, HiUserGroup, HiLockClosed, HiCloudArrowUp,
} from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchRosters, uploadRoster, updateRoster, deleteRoster, getRosterLink, fetchParticipants, formatDate, formatFileSize,
} from '../lib/api';
import { toLocalDate } from '../lib/dates';
import { PageHeader, StatCard, Badge, EmptyState, FormInput, FormSelect, FormTextarea, FormRow, FormField } from '../components/ui/FormComponents';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ButtonDanger, ModalError } from '../components/ui/Modal';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';

/*  Rosters — where roster documents live. Admin only, enforced by the API
 *  (the sidebar hides it, the route redirects, and the server refuses
 *  anyone whose profile is not admin/owner). Files are held in a private
 *  bucket and opened through 10-minute signed links. */

const EMPTY = { participant_id: '', title: '', period_start: '', period_end: '', version: '1.0', workers: '', notes: '' };

const periodLabel = (r) => {
  if (r.period_start && r.period_end) return `${formatDate(r.period_start)} – ${formatDate(r.period_end)}`;
  if (r.period_start) return `From ${formatDate(r.period_start)}`;
  return '—';
};
const isCurrent = (r) => {
  const today = toLocalDate();
  return r.period_start && r.period_start <= today && (!r.period_end || r.period_end >= today);
};
const isUpcoming = (r) => r.period_start && r.period_start > toLocalDate();

export default function Rosters() {
  const { token, profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [who, setWho] = useState('');
  const [modal, setModal] = useState(null);          // 'new' | 'edit' | 'delete'
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [list, ppl] = await Promise.all([fetchRosters(token), fetchParticipants().catch(() => [])]);
      setRows(list);
      setParticipants(Array.isArray(ppl) ? ppl : ppl?.participants || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => rows.filter((r) => {
    if (who && r.participant_id !== who) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return [r.title, r.participant_name, r.workers, r.file_name].some((v) => v?.toLowerCase().includes(s));
  }), [rows, search, who]);

  const stats = useMemo(() => ({
    total: rows.length,
    current: rows.filter(isCurrent).length,
    upcoming: rows.filter(isUpcoming).length,
    people: new Set(rows.map((r) => r.participant_id || r.participant_name).filter(Boolean)).size,
  }), [rows]);

  const nameOf = (id) => { const p = participants.find((x) => x.id === id); return p ? `${p.first_name} ${p.last_name}`.trim() : ''; };

  const openNew = () => { setForm(EMPTY); setFile(null); setFormError(''); setModal('new'); };
  const openEdit = (r) => { setTarget(r); setForm({ participant_id: r.participant_id || '', title: r.title, period_start: r.period_start || '', period_end: r.period_end || '', version: r.version || '', workers: r.workers || '', notes: r.notes || '' }); setFormError(''); setModal('edit'); };
  const openDelete = (r) => { setTarget(r); setModal('delete'); };
  const close = () => { if (!busy) setModal(null); };

  const readFile = (f) => new Promise((resolve, reject) => { const rd = new FileReader(); rd.onload = () => resolve(rd.result); rd.onerror = reject; rd.readAsDataURL(f); });

  const save = async () => {
    setFormError('');
    if (!form.title.trim()) return setFormError('Give the roster a title.');
    if (modal === 'new' && !file) return setFormError('Attach the roster file.');
    if (form.period_start && form.period_end && form.period_end < form.period_start) return setFormError('The end date is before the start date.');
    setBusy(true);
    try {
      const payload = { ...form, participant_name: form.participant_id ? nameOf(form.participant_id) : '' };
      if (modal === 'new') {
        const fileData = await readFile(file);
        await uploadRoster(token, { ...payload, fileName: file.name, fileData });
      } else {
        await updateRoster(token, { id: target.id, ...payload });
      }
      setModal(null); await load();
    } catch (e) { setFormError(e.message); } finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try { await deleteRoster(token, target.id); setModal(null); await load(); }
    catch (e) { setError(e.message); setModal(null); } finally { setBusy(false); }
  };

  const open = async (r) => {
    try { const { url } = await getRosterLink(token, r.id); window.open(url, '_blank', 'noopener'); }
    catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rosters"
        subtitle="Roster of Care and shift roster documents. Admin only."
        actions={(
          <button onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600">
            <HiPlus className="h-4 w-4" /> Add roster
          </button>
        )}
      />

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {loading ? [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />) : (
          <>
            <StatCard icon={HiDocumentText} label="Rosters filed" value={stats.total} color="text-brand-500" borderColor="border-brand-200" />
            <StatCard icon={HiCalendarDays} label="Current" value={stats.current} color="text-green-500" borderColor="border-green-200" />
            <StatCard icon={HiCloudArrowUp} label="Upcoming" value={stats.upcoming} color="text-amber-500" borderColor="border-amber-200" />
            <StatCard icon={HiUserGroup} label="Participants covered" value={stats.people} color="text-slate-500" borderColor="border-slate-200" />
          </>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, participant, worker or file"
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2.5 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400" />
        </div>
        <select value={who} onChange={(e) => setWho(e.target.value)} className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 md:w-64">
          <option value="">All participants</option>
          {participants.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
        </select>
      </div>

      {error && <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-sm text-red-700 dark:text-red-300">{error}</div>}

      {loading ? <SkeletonGrid count={4} /> : filtered.length === 0 ? (
        <EmptyState icon={HiCalendarDays} title={rows.length ? 'No rosters match' : 'No rosters filed yet'}
          description={rows.length ? 'Try a different search or participant.' : 'Upload a Roster of Care or shift roster and it will be kept here, visible to admins only.'}
          action={!rows.length && <button onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600"><HiPlus className="h-4 w-4" /> Add the first roster</button>} />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#263554]">
                  {['Roster', 'Participant', 'Period', 'Workers', 'Version', 'Uploaded', ''].map((h, i) => (
                    <th key={i} className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]">
                    <td className="px-5 py-4">
                      <button onClick={() => open(r)} className="text-left">
                        <p className="font-medium text-slate-800 dark:text-slate-100 hover:text-brand-500">{r.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{r.file_name} · {formatFileSize(r.size || 0)}</p>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{r.participant_name || '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{periodLabel(r)}</span>
                        {isCurrent(r) && <Badge variant="success">Current</Badge>}
                        {isUpcoming(r) && <Badge variant="warning">Upcoming</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-[220px] truncate" title={r.workers || ''}>{r.workers || '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{r.version || '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(r.created_at)}<br /><span className="text-xs">{r.uploaded_by}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => open(r)} title="Download" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500"><HiArrowDownTray className="h-4 w-4" /></button>
                        <button onClick={() => openEdit(r)} title="Edit details" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200"><HiPencilSquare className="h-4 w-4" /></button>
                        <button onClick={() => openDelete(r)} title="Delete" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"><HiTrash className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-slate-400"><HiLockClosed className="h-3.5 w-3.5" /> Files are stored in a private bucket. Download links expire after 10 minutes. Signed in as {profile?.full_name || profile?.email}.</p>

      <Modal isOpen={modal === 'new' || modal === 'edit'} onClose={close} title={modal === 'new' ? 'Add roster' : 'Edit roster details'} icon={HiCalendarDays}>
        <ModalBody>
          <div className="space-y-6">
            <FormInput label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Roster of Care — Moira Sunai — Sep 2026" />
            <FormRow>
              <FormSelect label="Participant" value={form.participant_id} onChange={(e) => setForm({ ...form, participant_id: e.target.value })}>
                <option value="">Not participant-specific</option>
                {participants.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </FormSelect>
              <FormInput label="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0" />
            </FormRow>
            <FormRow>
              <FormInput label="Period start" type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
              <FormInput label="Period end" type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
            </FormRow>
            <FormInput label="Workers on this roster" value={form.workers} onChange={(e) => setForm({ ...form, workers: e.target.value })} placeholder="Kawia Akinsola (day), Bamidele Akinsola (night)" />
            <FormTextarea label="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything the next admin needs to know" />
            {modal === 'new' && (
              <FormField label="Roster file" required hint="PDF, Word or Excel, up to 15 MB">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-dashed border-slate-300 dark:border-[#334766] bg-slate-50 dark:bg-[#0f1a2e] px-5 py-4 text-sm text-slate-600 dark:text-slate-300 hover:border-brand-400">
                  <span className="flex items-center gap-2"><HiCloudArrowUp className="h-5 w-5 text-brand-500" />{file ? file.name : 'Choose a file'}</span>
                  {file && <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>}
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </FormField>
            )}
            {formError && <ModalError message={formError} />}
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={close} disabled={busy}>Cancel</ButtonSecondary>
          <ButtonPrimary onClick={save} loading={busy}>{modal === 'new' ? 'Upload roster' : 'Save changes'}</ButtonPrimary>
        </ModalFooter>
      </Modal>

      <Modal isOpen={modal === 'delete'} onClose={close} title="Delete roster" icon={HiTrash} iconColor="text-red-500">
        <ModalBody>
          <p className="text-sm text-slate-600 dark:text-slate-300">Delete <span className="font-semibold">{target?.title}</span> and its file? This cannot be undone.</p>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={close} disabled={busy}>Keep it</ButtonSecondary>
          <ButtonDanger onClick={confirmDelete} loading={busy}>Delete</ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}
