import { useState, useEffect } from 'react';
import { HiPlus, HiPencilSquare, HiTrash, HiCheckCircle, HiXMark } from 'react-icons/hi2';
import { fetchGoalsOfCare, createGoalOfCare, updateGoalOfCare, deleteGoalOfCare } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from './ui/Modal';
import { FormInput, FormSelect, FormTextarea, FormRow } from './ui/FormComponents';

const GOAL_AREAS = [
  'Daily Living', 'Health & Wellbeing', 'Community Participation',
  'Social & Relationships', 'Independence', 'Employment & Education',
  'Communication', 'Behaviour Support', 'Safety', 'Other',
];

const STATUS_STYLES = {
  active: { label: 'Active', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
  achieved: { label: 'Achieved', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
  on_hold: { label: 'On Hold', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400' },
  discontinued: { label: 'Discontinued', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-500 dark:text-red-400' },
};

// Local calendar date (toISOString would give the UTC date, a day early in the evening)
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const INITIAL_GOAL = {
  goal_area: 'Daily Living',
  goal_description: '',
  target_outcome: '',
  strategies: '',
  responsible_person: '',
  start_date: '',
  target_date: '',
  review_date: '',
  status: 'active',
  progress_notes: '',
  progress_percentage: 0,
};

export default function GoalsOfCareTab({ participantId }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_GOAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const { profile } = useAuth();

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchGoalsOfCare(participantId);
      setGoals(data || []);
    } catch (err) {
      setLoadError(err.message || 'Could not load goals of care.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [participantId]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...INITIAL_GOAL, start_date: localToday() });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (goal) => {
    setEditing(goal);
    setForm({
      goal_area: goal.goal_area || 'Daily Living',
      goal_description: goal.goal_description || '',
      target_outcome: goal.target_outcome || '',
      strategies: goal.strategies || '',
      responsible_person: goal.responsible_person || '',
      start_date: goal.start_date || '',
      target_date: goal.target_date || '',
      review_date: goal.review_date || '',
      status: goal.status || 'active',
      progress_notes: goal.progress_notes || '',
      progress_percentage: goal.progress_percentage || 0,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.goal_description.trim()) {
      setError('Goal description is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateGoalOfCare(editing.id, form);
      } else {
        await createGoalOfCare({
          ...form,
          participant_id: participantId,
          created_by: profile?.full_name || 'Staff',
        });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    setActionError('');
    try {
      await deleteGoalOfCare(id);
      load();
    } catch (err) {
      // Shown above the list — the modal is closed here so the modal error would never be seen
      setActionError(err.message || 'Could not delete this goal. Nothing was changed.');
    }
  };

  const handleQuickStatus = async (goal, newStatus) => {
    setActionError('');
    try {
      await updateGoalOfCare(goal.id, {
        status: newStatus,
        progress_percentage: newStatus === 'achieved' ? 100 : goal.progress_percentage,
      });
      load();
    } catch (err) {
      setActionError(err.message || 'Could not update the goal status. Nothing was changed.');
    }
  };

  const up = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'in_progress');
  const completedGoals = goals.filter(g => g.status === 'achieved');
  const otherGoals = goals.filter(g => g.status === 'on_hold' || g.status === 'discontinued');

  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">Loading goals...</div>;
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-8 text-center">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Could not load goals of care</p>
        <p className="mt-1 text-xs text-red-500 dark:text-red-400/80">{loadError}</p>
        <button onClick={load}
          className="mt-4 inline-flex items-center rounded-lg bg-white dark:bg-[#162036] border border-red-200 dark:border-red-900/40 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {actionError && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-600 dark:hover:text-red-300"><HiXMark className="h-4 w-4" /></button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {goals.length} goal{goals.length !== 1 ? 's' : ''} · {activeGoals.length} active · {completedGoals.length} achieved
          </p>
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors">
          <HiPlus className="h-4 w-4" /> Add Goal
        </button>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Active Goals</h3>
          <div className="space-y-3">
            {activeGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleQuickStatus} />
            ))}
          </div>
        </div>
      )}

      {/* Achieved Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-green-500 dark:text-green-400 uppercase tracking-wider mb-3">Achieved Goals</h3>
          <div className="space-y-3">
            {completedGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleQuickStatus} />
            ))}
          </div>
        </div>
      )}

      {/* On Hold / Discontinued */}
      {otherGoals.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">On Hold / Discontinued</h3>
          <div className="space-y-3">
            {otherGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleQuickStatus} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <HiCheckCircle className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No goals of care documented yet</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Add goals to track participant outcomes and progress</p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <Modal isOpen={modalOpen} title={editing ? 'Edit Goal' : 'Add Goal of Care'} onClose={() => setModalOpen(false)}>
          <ModalBody>
            {error && <ModalError message={error} />}
            <FormRow>
              <FormSelect label="Goal Area" value={form.goal_area} onChange={e => up('goal_area', e.target.value)}>
                {GOAL_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </FormSelect>
            </FormRow>
            <FormRow>
              <FormTextarea label="Goal Description *" value={form.goal_description} onChange={e => up('goal_description', e.target.value)}
                placeholder="What does the participant want to achieve?" rows={3} />
            </FormRow>
            <FormRow>
              <FormTextarea label="Target Outcome" value={form.target_outcome} onChange={e => up('target_outcome', e.target.value)}
                placeholder="How will we know when this goal is achieved?" rows={2} />
            </FormRow>
            <FormRow>
              <FormTextarea label="Strategies / Actions" value={form.strategies} onChange={e => up('strategies', e.target.value)}
                placeholder="What steps will be taken to achieve this goal?" rows={3} />
            </FormRow>
            <FormRow>
              <FormInput label="Responsible Person" value={form.responsible_person} onChange={e => up('responsible_person', e.target.value)}
                placeholder="e.g. Key Worker, Support Coordinator" />
            </FormRow>
            <FormRow cols={3}>
              <FormInput label="Start Date" type="date" value={form.start_date} onChange={e => up('start_date', e.target.value)} />
              <FormInput label="Target Date" type="date" value={form.target_date} onChange={e => up('target_date', e.target.value)} />
              <FormInput label="Review Date" type="date" value={form.review_date} onChange={e => up('review_date', e.target.value)} />
            </FormRow>
            <FormRow cols={2}>
              <FormSelect label="Status" value={form.status} onChange={e => up('status', e.target.value)}>
                {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </FormSelect>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Progress ({form.progress_percentage}%)
                </label>
                <input type="range" min="0" max="100" step="5" value={form.progress_percentage}
                  onChange={e => up('progress_percentage', Number(e.target.value))}
                  className="w-full accent-brand-500" />
              </div>
            </FormRow>
            <FormRow>
              <FormTextarea label="Progress Notes" value={form.progress_notes} onChange={e => up('progress_notes', e.target.value)}
                placeholder="Document progress, observations, adjustments..." rows={3} />
            </FormRow>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setModalOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Goal' : 'Add Goal'}
            </ButtonPrimary>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete, onStatusChange }) {
  const st = STATUS_STYLES[goal.status] || STATUS_STYLES.active;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className={`rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5 ${goal.status === 'achieved' ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-brand-500 dark:text-brand-400 uppercase tracking-wider">{goal.goal_area}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${st.bg} ${st.text}`}>{st.label}</span>
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{goal.goal_description}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {goal.status !== 'achieved' && (
            <button onClick={() => onStatusChange(goal, 'achieved')} title="Mark Achieved"
              className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
              <HiCheckCircle className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => onEdit(goal)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <HiPencilSquare className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <HiTrash className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Progress</span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{goal.progress_percentage || 0}%</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${goal.status === 'achieved' ? 'bg-green-500' : 'bg-brand-500'}`}
            style={{ width: `${goal.progress_percentage || 0}%` }} />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {goal.target_outcome && (
          <div>
            <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Target Outcome</span>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">{goal.target_outcome}</p>
          </div>
        )}
        {goal.strategies && (
          <div>
            <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Strategies</span>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">{goal.strategies}</p>
          </div>
        )}
      </div>

      {/* Dates + Responsible */}
      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-[#263554] text-[11px] text-slate-400 dark:text-slate-500">
        {goal.responsible_person && <span>Responsible: <span className="font-medium text-slate-600 dark:text-slate-300">{goal.responsible_person}</span></span>}
        {goal.start_date && <span>Start: {fmtDate(goal.start_date)}</span>}
        {goal.target_date && <span>Target: {fmtDate(goal.target_date)}</span>}
        {goal.review_date && <span>Review: {fmtDate(goal.review_date)}</span>}
      </div>

      {/* Progress notes */}
      {goal.progress_notes && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#263554]">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Progress Notes</span>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">{goal.progress_notes}</p>
        </div>
      )}
    </div>
  );
}
