import { useState, useEffect, useCallback } from 'react';
import { fetchScreenings, createScreening, updateScreening, deleteScreening, fetchScreeningStats } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineCurrencyDollar,
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineBriefcase,
  HiOutlineShieldCheck,
  HiOutlinePencilSquare,
} from 'react-icons/hi2';

// ─── Constants ───────────────────────────────────────────────────────────────

const PLAN_STATUSES = [
  { value: 'current', label: 'Current' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'change_requested', label: 'Change Requested' },
];

const RESULT_CONFIG = {
  GREEN: { label: 'Green', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800', icon: HiOutlineCheckCircle, dotColor: 'bg-green-500' },
  AMBER: { label: 'Amber', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: HiOutlineExclamationTriangle, dotColor: 'bg-amber-500' },
  RED: { label: 'Red', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800', icon: HiOutlineXCircle, dotColor: 'bg-red-500' },
};

const STEPS = [
  { id: 'participant', label: 'Participant', icon: HiOutlineUserGroup },
  { id: 'funding', label: 'Funding', icon: HiOutlineCurrencyDollar },
  { id: 'housing', label: 'Housing', icon: HiOutlineHome },
  { id: 'support', label: 'Support Needs', icon: HiOutlineShieldCheck },
  { id: 'plan', label: 'Plan Status', icon: HiOutlineDocumentText },
  { id: 'providers', label: 'Providers', icon: HiOutlineBriefcase },
];

const INITIAL_FORM = {
  participant_name: '',
  ndis_number: '',
  assessor_name: '',
  total_core_funding: '',
  hours_per_week_available: '',
  current_hours_used: '',
  has_sda: false,
  has_sil: false,
  weekly_income: '',
  weekly_rent: '',
  needs_1_to_1: false,
  needs_overnight: false,
  needs_24_7: false,
  plan_status: 'current',
  number_of_providers: '',
  total_hours_used: '',
  willing_to_reduce_hours: false,
  notes: '',
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ScreeningChecklist() {
  const { profile } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [stats, setStats] = useState({ total: 0, green: 0, amber: 0, red: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([
        fetchScreenings(filterResult, search),
        fetchScreeningStats(),
      ]);
      setScreenings(list);
      setStats(s);
    } catch (err) {
      console.error('Failed to load screenings:', err);
    } finally {
      setLoading(false);
    }
  }, [filterResult, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this screening record?')) return;
    try {
      await deleteScreening(id);
      setScreenings((prev) => prev.filter((s) => s.id !== id));
      setStats((prev) => {
        const deleted = screenings.find((s) => s.id === id);
        const key = (deleted?.result || '').toLowerCase();
        return { ...prev, total: prev.total - 1, [key]: (prev[key] || 1) - 1 };
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreated = (newScreening) => {
    setScreenings((prev) => [newScreening, ...prev]);
    const key = (newScreening.result || '').toLowerCase();
    setStats((prev) => ({ ...prev, total: prev.total + 1, [key]: (prev[key] || 0) + 1 }));
    setShowForm(false);
  };

  const handleUpdated = (updated) => {
    const old = screenings.find((s) => s.id === updated.id);
    setScreenings((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    // Update stats if result changed
    if (old && old.result !== updated.result) {
      const oldKey = old.result.toLowerCase();
      const newKey = updated.result.toLowerCase();
      setStats((prev) => ({ ...prev, [oldKey]: (prev[oldKey] || 1) - 1, [newKey]: (prev[newKey] || 0) + 1 }));
    }
    setEditItem(null);
    setViewItem(null);
  };

  const openEdit = (item) => {
    setViewItem(null);
    setEditItem(item);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineClipboardDocumentCheck className="text-accent-500" />
            Screening Checklist
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            NDIS participant suitability assessments
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-600 transition-colors"
        >
          <HiOutlinePlus className="h-4 w-4" />
          New Screening
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Screenings" value={stats.total} color="bg-slate-50 dark:bg-slate-800/50" textColor="text-slate-600 dark:text-slate-300" />
        <StatCard label="Green — Suitable" value={stats.green} color="bg-green-50 dark:bg-green-900/20" textColor="text-green-600 dark:text-green-400" />
        <StatCard label="Amber — Review" value={stats.amber} color="bg-amber-50 dark:bg-amber-900/20" textColor="text-amber-600 dark:text-amber-400" />
        <StatCard label="Red — Not Suitable" value={stats.red} color="bg-red-50 dark:bg-red-900/20" textColor="text-red-600 dark:text-red-400" />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or NDIS number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-sm text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {['', 'GREEN', 'AMBER', 'RED'].map((val) => (
            <button
              key={val}
              onClick={() => setFilterResult(val)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                filterResult === val
                  ? 'bg-accent-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {val || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {screenings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <HiOutlineClipboardDocumentCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No screening records found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-500 hover:text-accent-600"
          >
            <HiOutlinePlus className="h-4 w-4" /> Start a new screening
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#263554]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Participant</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">NDIS Number</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assessor</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Result</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Flags</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {screenings.map((s) => {
                  const cfg = RESULT_CONFIG[s.result] || RESULT_CONFIG.GREEN;
                  const Icon = cfg.icon;
                  const flagCount = Array.isArray(s.flags) ? s.flags.length : 0;
                  return (
                    <tr key={s.id} className="border-b border-slate-50 dark:border-[#263554] hover:bg-slate-50/50 dark:hover:bg-[#1e2d4a]/30 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-medium text-sm text-slate-900 dark:text-white">{s.participant_name}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">{s.ndis_number || '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{s.assessor_name || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {flagCount > 0 ? `${flagCount} flag${flagCount > 1 ? 's' : ''}` : 'None'}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(s.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewItem(s)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-accent-500 transition-colors"
                            title="View details"
                          >
                            <HiOutlineEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Edit"
                          >
                            <HiOutlinePencilSquare className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Screening Form */}
      {showForm && (
        <ScreeningForm
          assessorName={profile?.full_name || ''}
          onSaved={handleCreated}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit Screening Form */}
      {editItem && (
        <ScreeningForm
          existing={editItem}
          assessorName={profile?.full_name || ''}
          onSaved={handleUpdated}
          onClose={() => setEditItem(null)}
        />
      )}

      {/* View Detail Modal */}
      {viewItem && (
        <ScreeningDetail item={viewItem} onEdit={() => openEdit(viewItem)} onClose={() => setViewItem(null)} />
      )}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, color, textColor }) {
  return (
    <div className={`rounded-xl p-5 ${color}`}>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}

// ─── Screening Form (Wizard) ─────────────────────────────────────────────────

function ScreeningForm({ existing, assessorName, onSaved, onClose }) {
  const isEdit = !!existing;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => {
    if (existing) {
      const f = { ...INITIAL_FORM };
      for (const key of Object.keys(INITIAL_FORM)) {
        if (existing[key] !== undefined && existing[key] !== null) {
          f[key] = existing[key];
        }
      }
      // Ensure numeric fields show their value (not empty string for 0)
      const numericFields = ['total_core_funding', 'hours_per_week_available', 'current_hours_used', 'weekly_income', 'weekly_rent', 'number_of_providers', 'total_hours_used'];
      for (const nf of numericFields) {
        if (f[nf] === 0) f[nf] = '0';
      }
      return f;
    }
    return { ...INITIAL_FORM, assessor_name: assessorName };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const num = (key) => form[key] === '' ? '' : form[key];

  const canProceed = () => {
    if (step === 0) return form.participant_name.trim() !== '';
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      // Convert empty strings to 0 for numeric fields
      const payload = { ...form };
      const numericFields = ['total_core_funding', 'hours_per_week_available', 'current_hours_used', 'weekly_income', 'weekly_rent', 'number_of_providers', 'total_hours_used'];
      for (const f of numericFields) {
        payload[f] = payload[f] === '' ? 0 : Number(payload[f]);
      }
      const result = isEdit
        ? await updateScreening(existing.id, payload)
        : await createScreening(payload);
      onSaved(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#162036] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-modal-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-[#263554]">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Screening' : 'New Screening'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Step {step + 1} of {STEPS.length} — {STEPS[step].label}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <HiOutlineXMark className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-8 pt-5">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => (isEdit || i <= step) && setStep(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    i === step
                      ? 'bg-accent-500 text-white'
                      : i < step || isEdit
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 cursor-pointer'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <StepIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              <HiOutlineExclamationTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-5">
              <FormField label="Participant Name" required>
                <input type="text" value={form.participant_name} onChange={(e) => set('participant_name', e.target.value)} className="w-full" placeholder="Full name" />
              </FormField>
              <FormField label="NDIS Number">
                <input type="text" value={form.ndis_number} onChange={(e) => set('ndis_number', e.target.value)} className="w-full" placeholder="e.g. 431234567" />
              </FormField>
              <FormField label="Assessor">
                <input type="text" value={form.assessor_name} onChange={(e) => set('assessor_name', e.target.value)} className="w-full" placeholder="Staff member conducting screening" />
              </FormField>
              <FormField label="Notes">
                <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} className="w-full" placeholder="Any initial notes..." />
              </FormField>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Check the participant's NDIS plan funding details.</p>
              <FormField label="Total Core Funding ($)">
                <input type="number" min="0" value={num('total_core_funding')} onChange={(e) => set('total_core_funding', e.target.value)} className="w-full" placeholder="0" />
              </FormField>
              <div className="grid grid-cols-2 gap-5">
                <FormField label="Hours/Week Available">
                  <input type="number" min="0" value={num('hours_per_week_available')} onChange={(e) => set('hours_per_week_available', e.target.value)} className="w-full" placeholder="0" />
                </FormField>
                <FormField label="Current Hours Used">
                  <input type="number" min="0" value={num('current_hours_used')} onChange={(e) => set('current_hours_used', e.target.value)} className="w-full" placeholder="0" />
                </FormField>
              </div>
              {form.hours_per_week_available && form.current_hours_used !== '' && (
                <HoursIndicator available={Number(form.hours_per_week_available)} used={Number(form.current_hours_used)} />
              )}
              <div className="grid grid-cols-2 gap-5">
                <ToggleField label="Has SDA Funding" checked={form.has_sda} onChange={(v) => set('has_sda', v)} />
                <ToggleField label="Has SIL Funding" checked={form.has_sil} onChange={(v) => set('has_sil', v)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Assess whether the participant can afford housing.</p>
              <div className="grid grid-cols-2 gap-5">
                <FormField label="Weekly Income ($)">
                  <input type="number" min="0" value={num('weekly_income')} onChange={(e) => set('weekly_income', e.target.value)} className="w-full" placeholder="0" />
                </FormField>
                <FormField label="Weekly Rent ($)">
                  <input type="number" min="0" value={num('weekly_rent')} onChange={(e) => set('weekly_rent', e.target.value)} className="w-full" placeholder="0" />
                </FormField>
              </div>
              {form.weekly_income > 0 && (
                <RentRatioIndicator income={Number(form.weekly_income)} rent={Number(form.weekly_rent || 0)} />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">What level of support does this participant require?</p>
              <ToggleField label="Requires 1:1 Support" checked={form.needs_1_to_1} onChange={(v) => set('needs_1_to_1', v)} description="Dedicated support worker at all times" />
              <ToggleField label="Requires Overnight Support" checked={form.needs_overnight} onChange={(v) => set('needs_overnight', v)} description="Active or sleepover support during night" />
              <ToggleField label="Requires 24/7 Support" checked={form.needs_24_7} onChange={(v) => set('needs_24_7', v)} description="Round-the-clock support coverage" />
              {form.needs_24_7 && !form.has_sil && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  <HiOutlineExclamationTriangle className="h-4 w-4 flex-shrink-0" />
                  24/7 support is needed but SIL funding is not active — this will flag RED
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">What is the current status of the participant's NDIS plan?</p>
              <FormField label="Plan Status">
                <div className="space-y-2">
                  {PLAN_STATUSES.map((ps) => (
                    <label
                      key={ps.value}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                        form.plan_status === ps.value
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                          : 'border-slate-200 dark:border-[#334766] hover:border-slate-300 dark:hover:border-[#445577]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan_status"
                        value={ps.value}
                        checked={form.plan_status === ps.value}
                        onChange={() => set('plan_status', ps.value)}
                        className="accent-accent-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{ps.label}</span>
                      {ps.value !== 'current' && form.plan_status === ps.value && (
                        <span className="ml-auto text-xs text-amber-500 font-medium">AMBER flag</span>
                      )}
                    </label>
                  ))}
                </div>
              </FormField>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Details about existing service providers.</p>
              <div className="grid grid-cols-2 gap-5">
                <FormField label="Number of Providers">
                  <input type="number" min="0" value={num('number_of_providers')} onChange={(e) => set('number_of_providers', e.target.value)} className="w-full" placeholder="0" />
                </FormField>
                <FormField label="Total Hours Used/Week">
                  <input type="number" min="0" value={num('total_hours_used')} onChange={(e) => set('total_hours_used', e.target.value)} className="w-full" placeholder="0" />
                </FormField>
              </div>
              <ToggleField label="Willing to Reduce Hours with Other Providers" checked={form.willing_to_reduce_hours} onChange={(v) => set('willing_to_reduce_hours', v)} description="Participant/family agrees to adjust existing provider hours" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-200 dark:border-[#263554]">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <HiOutlineChevronLeft className="h-4 w-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <HiOutlineCheckCircle className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : isEdit ? 'Update Screening' : 'Submit Screening'}
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Next
              <HiOutlineChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Detail View Modal ───────────────────────────────────────────────────────

function ScreeningDetail({ item, onEdit, onClose }) {
  const cfg = RESULT_CONFIG[item.result] || RESULT_CONFIG.GREEN;
  const Icon = cfg.icon;
  const flags = Array.isArray(item.flags) ? item.flags : [];
  const hoursRemaining = (item.hours_per_week_available || 0) - (item.current_hours_used || 0);
  const rentRatio = item.weekly_income > 0 ? ((item.weekly_rent || 0) / item.weekly_income * 100).toFixed(0) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#162036] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-[#263554]">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.participant_name}</h2>
            {item.ndis_number && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">NDIS: {item.ndis_number}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-full border ${cfg.color}`}>
              <Icon className="h-4 w-4" />
              {cfg.label}
            </span>
            <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-colors" title="Edit">
              <HiOutlinePencilSquare className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <HiOutlineXMark className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Flags */}
          {flags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Flags Raised</h3>
              {flags.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
                    f.severity === 'RED'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {f.severity === 'RED' ? <HiOutlineXCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <HiOutlineExclamationTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-semibold">{f.section}:</span> {f.message}
                  </div>
                </div>
              ))}
            </div>
          )}

          {flags.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-600 dark:text-green-400">
              <HiOutlineCheckCircle className="h-4 w-4" />
              No flags raised — participant appears suitable
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <DetailSection title="Funding">
              <DetailRow label="Core Funding" value={item.total_core_funding ? `$${Number(item.total_core_funding).toLocaleString()}` : '—'} />
              <DetailRow label="Hours Available" value={`${item.hours_per_week_available || 0}h/week`} />
              <DetailRow label="Hours Used" value={`${item.current_hours_used || 0}h/week`} />
              <DetailRow label="Hours Remaining" value={`${hoursRemaining}h/week`} highlight={hoursRemaining < 5} />
              <DetailRow label="SDA Funding" value={item.has_sda ? 'Yes' : 'No'} />
              <DetailRow label="SIL Funding" value={item.has_sil ? 'Yes' : 'No'} />
            </DetailSection>

            <DetailSection title="Housing">
              <DetailRow label="Weekly Income" value={item.weekly_income ? `$${Number(item.weekly_income).toLocaleString()}` : '—'} />
              <DetailRow label="Weekly Rent" value={item.weekly_rent ? `$${Number(item.weekly_rent).toLocaleString()}` : '—'} />
              <DetailRow label="Rent Ratio" value={rentRatio ? `${rentRatio}%` : '—'} highlight={rentRatio && rentRatio >= 50} />
            </DetailSection>

            <DetailSection title="Support Needs">
              <DetailRow label="1:1 Support" value={item.needs_1_to_1 ? 'Yes' : 'No'} />
              <DetailRow label="Overnight" value={item.needs_overnight ? 'Yes' : 'No'} />
              <DetailRow label="24/7 Support" value={item.needs_24_7 ? 'Yes' : 'No'} highlight={item.needs_24_7} />
            </DetailSection>

            <DetailSection title="Plan & Providers">
              <DetailRow label="Plan Status" value={PLAN_STATUSES.find((p) => p.value === item.plan_status)?.label || item.plan_status || '—'} />
              <DetailRow label="Providers" value={item.number_of_providers || '0'} />
              <DetailRow label="Provider Hours" value={`${item.total_hours_used || 0}h/week`} />
              <DetailRow label="Will Reduce Hours" value={item.willing_to_reduce_hours ? 'Yes' : 'No'} />
            </DetailSection>
          </div>

          {/* Notes */}
          {item.notes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Notes</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-[#263554]">
            Assessed by {item.assessor_name || 'Unknown'} on {new Date(item.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Form Components ──────────────────────────────────────────────────

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function ToggleField({ label, checked, onChange, description }) {
  return (
    <label className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 cursor-pointer transition-colors ${
      checked
        ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
        : 'border-slate-200 dark:border-[#334766] hover:border-slate-300 dark:hover:border-[#445577]'
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-accent-500"
      />
      <div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function HoursIndicator({ available, used }) {
  const remaining = available - used;
  const pct = available > 0 ? Math.min((used / available) * 100, 100) : 0;
  const isLow = remaining < 5;

  return (
    <div className={`rounded-lg border px-4 py-3 ${isLow ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-[#334766]'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hours Remaining</span>
        <span className={`text-sm font-bold ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
          {remaining}h / {available}h
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isLow ? 'bg-amber-500' : 'bg-accent-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RentRatioIndicator({ income, rent }) {
  const ratio = income > 0 ? (rent / income) : 0;
  const pct = (ratio * 100).toFixed(0);
  const color = ratio > 0.75 ? 'RED' : ratio >= 0.5 ? 'AMBER' : 'GREEN';
  const colors = {
    GREEN: { bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400', label: 'Affordable' },
    AMBER: { bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Borderline' },
    RED: { bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Unaffordable' },
  };
  const c = colors[color];

  return (
    <div className={`rounded-lg border px-4 py-3 ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rent-to-Income Ratio</span>
        <span className={`text-sm font-bold ${c.text}`}>{pct}% — {c.label}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${c.bar}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-slate-400">
        <span>0%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-medium ${highlight ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>{value}</span>
    </div>
  );
}
