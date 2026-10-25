import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiTrash,
  HiCheckCircle,
  HiClock,
  HiExclamationTriangle,
  HiDocumentText,
  HiShieldCheck,
  HiArrowDownTray,
  HiArrowTopRightOnSquare,
  HiArchiveBoxArrowDown,
} from 'react-icons/hi2';
import {
  fetchPolicyRegister,
  fetchPolicyStats,
  createPolicyEntry,
  updatePolicyEntry,
  deletePolicyEntry,
  formatDate,
} from '../lib/api';
import {
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
  FormInput,
  FormSelect,
  FormTextarea,
  FormRow,
} from '../components/ui/FormComponents';
import Modal, {
  ModalBody,
  ModalFooter,
  ButtonPrimary,
  ButtonSecondary,
  ButtonDanger,
  ModalError,
} from '../components/ui/Modal';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';
import { exportRegisterPdf } from '../lib/registerPdfExport';

const STATUS_CFG = {
  reviewed: { label: 'Reviewed', variant: 'success' },
  not_reviewed: { label: 'Not Reviewed', variant: 'default' },
  requires_update: { label: 'Requires Update', variant: 'warning' },
  compliant: { label: 'Compliant', variant: 'success' },
  archived: { label: 'Archived', variant: 'default' },
};

const SOURCE_FILTERS = ['All Sources', 'NDIS Manual', 'Module 1', 'Module 2A'];

export default function PolicyRegister() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteEntry || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePolicyEntry(deleteEntry.id);
      setDeleteEntry(null);
      load();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete policy');
    } finally {
      setDeleting(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([fetchPolicyRegister(), fetchPolicyStats()]);
      setEntries(data);
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = entries.filter((e) => {
    // Hide archived unless specifically filtering for them
    if (!statusFilter && e.status === 'archived') return false;
    if (statusFilter && e.status !== statusFilter) return false;
    if (sourceFilter && e.source_document !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (e.policy_name || '').toLowerCase().includes(q) || (e.ref_number || '').toLowerCase().includes(q) || (e.ndis_element || '').toLowerCase().includes(q);
    }
    return true;
  });

  async function handleArchive(entry) {
    try {
      await updatePolicyEntry(entry.id, { status: 'archived' });
      load();
    } catch (err) {
      alert('Failed to archive: ' + err.message);
    }
  }

  async function handleRestore(entry) {
    try {
      await updatePolicyEntry(entry.id, { status: 'reviewed' });
      load();
    } catch (err) {
      alert('Failed to restore: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonStatCard key={i} />)}
        </div>
        <SkeletonGrid count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy & Procedure Register"
        subtitle={`${entries.length} policies and procedures tracked`}
        actions={
          <button
            type="button"
            onClick={() => { setEditEntry(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
          >
            <HiPlus className="h-4 w-4" /> Add Policy
          </button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={HiDocumentText} label="Total Policies" value={stats.total} color="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400" />
          <StatCard icon={HiCheckCircle} label="Reviewed" value={stats.reviewed} color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" />
          <StatCard icon={HiExclamationTriangle} label="Requires Update" value={stats.requires_update} color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" />
          <StatCard icon={HiClock} label="Not Reviewed" value={stats.not_reviewed} color="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0f1a2e] pl-9 pr-3 py-2.5 text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0f1a2e] px-3 py-2.5 text-sm">
          <option value="">All Statuses</option>
          <option value="reviewed">Reviewed</option>
          <option value="not_reviewed">Not Reviewed</option>
          <option value="requires_update">Requires Update</option>
          <option value="compliant">Compliant</option>
          <option value="archived">Archived</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#0f1a2e] px-3 py-2.5 text-sm">
          <option value="">All Sources</option>
          <option value="NDIS Manual">NDIS Manual</option>
          <option value="Module 1">Module 1</option>
          <option value="Module 2A">Module 2A</option>
        </select>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
        >
          <HiArrowDownTray className="h-4 w-4" /> Export
        </button>
        <button
          onClick={() => exportRegisterPdf({
            title: 'Policy Register',
            columns: ['Ref', 'Policy Name', 'Source', 'NDIS Element', 'Status', 'Review Date'],
            rows: filtered.map((p) => [
              p.ref_number || '',
              p.policy_name || '',
              p.source_document || '',
              p.ndis_element || '',
              STATUS_CFG[p.status]?.label || p.status || '',
              p.review_date ? formatDate(p.review_date) : '',
            ]),
            filename: 'OLF-Policy-Register.pdf',
          })}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <HiArrowDownTray className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e]">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ref</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Policy Name</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Source</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">NDIS Element</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Review Date</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Changes</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#263554]/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No policies found</td></tr>
              ) : filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{entry.ref_number}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{entry.policy_name}</span>
                      {entry.link && (
                        <Link to={entry.link} className="inline-flex items-center gap-1 rounded-md bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/30 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors flex-shrink-0">
                          <HiArrowTopRightOnSquare className="h-3 w-3" />
                          View
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{entry.source_document}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate">{entry.ndis_element || '--'}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_CFG[entry.status]?.variant || 'default'}>{STATUS_CFG[entry.status]?.label || entry.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{entry.review_date ? formatDate(entry.review_date) : '--'}</td>
                  <td className="px-4 py-3">
                    {entry.changes_required ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 max-w-[200px] block truncate" title={entry.changes_required}>{entry.changes_required}</span>
                    ) : (
                      <span className="text-xs text-green-500">No changes</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => { setEditEntry(entry); setModalOpen(true); }} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#263554] hover:text-slate-600 dark:hover:text-slate-200" title="Edit">
                      <HiPencilSquare className="h-4 w-4" />
                    </button>
                    {entry.status === 'archived' ? (
                      <button onClick={() => handleRestore(entry)} className="rounded p-1.5 text-slate-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-500" title="Restore">
                        <HiArrowTopRightOnSquare className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleArchive(entry)} className="rounded p-1.5 text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500" title="Archive">
                        <HiArchiveBoxArrowDown className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setDeleteEntry(entry)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500" title="Delete">
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <PolicyModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditEntry(null); }}
        entry={editEntry}
        onSaved={load}
      />

      {/* Delete Confirm */}
      {deleteEntry && (
        <Modal isOpen onClose={() => setDeleteEntry(null)} title="Delete Policy" icon={HiTrash} iconColor="text-red-500" size="sm">
          <ModalBody>
            <ModalError message={deleteError} />
            <p className="text-sm text-slate-600 dark:text-slate-300">Delete <strong>{deleteEntry.ref_number} — {deleteEntry.policy_name}</strong>?</p>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => { setDeleteEntry(null); setDeleteError(null); }} disabled={deleting}>Cancel</ButtonSecondary>
            <ButtonDanger onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</ButtonDanger>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

function PolicyModal({ isOpen, onClose, entry, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm(entry ? {
        ref_number: entry.ref_number || '',
        policy_name: entry.policy_name || '',
        source_document: entry.source_document || 'NDIS Manual',
        page_reference: entry.page_reference || '',
        ndis_element: entry.ndis_element || '',
        version: entry.version || '01',
        original_date: entry.original_date ? entry.original_date.slice(0, 10) : '',
        review_date: entry.review_date ? entry.review_date.slice(0, 10) : '',
        reviewed_by: entry.reviewed_by || '',
        status: entry.status || 'not_reviewed',
        changes_required: entry.changes_required || '',
        addendum_ref: entry.addendum_ref || '',
        link: entry.link || '',
        notes: entry.notes || '',
      } : {
        ref_number: '', policy_name: '', source_document: 'NDIS Manual', page_reference: '',
        ndis_element: '', version: '01', original_date: '2024-08-26', review_date: new Date().toISOString().slice(0, 10),
        reviewed_by: 'Kevin Rae Geronimo', status: 'not_reviewed', changes_required: '', addendum_ref: '', link: '', notes: '',
      });
      setSaving(false);
      setError(null);
    }
  }, [isOpen, entry]);

  function onChange(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.ref_number?.trim() || !form.policy_name?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (entry) {
        await updatePolicyEntry(entry.id, form);
      } else {
        await createPolicyEntry(form);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={entry ? 'Edit Policy' : 'Add Policy'} icon={HiDocumentText} iconColor="text-brand-500" size="lg">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <ModalError message={error} />
          <div className="space-y-5">
            <FormRow>
              <FormInput label="Reference #" value={form.ref_number || ''} onChange={onChange('ref_number')} required placeholder="e.g. NDIS-PP-01" />
              <FormSelect label="Source Document" value={form.source_document || ''} onChange={onChange('source_document')}>
                <option value="NDIS Manual">NDIS Manual</option>
                <option value="Module 1">Module 1 - High Intensity</option>
                <option value="Module 2A">Module 2A - Behaviour Support</option>
                <option value="Other">Other</option>
              </FormSelect>
            </FormRow>
            <FormInput label="Policy Name" value={form.policy_name || ''} onChange={onChange('policy_name')} required placeholder="e.g. Person-Centred Support" />
            <FormRow>
              <FormInput label="Page Reference" value={form.page_reference || ''} onChange={onChange('page_reference')} placeholder="e.g. 18-20" />
              <FormInput label="NDIS Element" value={form.ndis_element || ''} onChange={onChange('ndis_element')} placeholder="e.g. Element 6" />
            </FormRow>
            <FormRow>
              <FormInput label="Version" value={form.version || ''} onChange={onChange('version')} placeholder="01" />
              <FormSelect label="Status" value={form.status || ''} onChange={onChange('status')}>
                <option value="not_reviewed">Not Reviewed</option>
                <option value="reviewed">Reviewed</option>
                <option value="requires_update">Requires Update</option>
                <option value="compliant">Compliant</option>
                <option value="archived">Archived</option>
              </FormSelect>
            </FormRow>
            <FormRow>
              <FormInput label="Original Date" type="date" value={form.original_date || ''} onChange={onChange('original_date')} />
              <FormInput label="Review Date" type="date" value={form.review_date || ''} onChange={onChange('review_date')} />
            </FormRow>
            <FormRow>
              <FormInput label="Reviewed By" value={form.reviewed_by || ''} onChange={onChange('reviewed_by')} placeholder="Name" />
              <FormInput label="Addendum Ref" value={form.addendum_ref || ''} onChange={onChange('addendum_ref')} placeholder="e.g. ADD-01" />
            </FormRow>
            <FormInput label="Link (URL path)" value={form.link || ''} onChange={onChange('link')} placeholder="e.g. /documents?category=... or /risk-register" />
            <FormTextarea label="Changes Required" value={form.changes_required || ''} onChange={onChange('changes_required')} rows={3} placeholder="Describe any changes needed..." />
            <FormTextarea label="Notes" value={form.notes || ''} onChange={onChange('notes')} rows={2} placeholder="Additional notes..." />
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" disabled={saving} loading={saving}>
            {saving ? 'Saving...' : entry ? 'Save Changes' : 'Add Policy'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
