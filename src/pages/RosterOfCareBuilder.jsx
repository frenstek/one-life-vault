import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchROC,
  updateROC,
  addROCParticipant,
  removeROCParticipant,
  addROCTimeBlock,
  updateROCTimeBlock,
  deleteROCTimeBlock,
  assignROCStaff,
  unassignROCStaff,
  copyROCDay,
  fetchStaff,
  fetchProperties,
  fetchParticipants,
} from '../lib/api';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ButtonDanger, ModalError } from '../components/ui/Modal';
import { PageHeader, Badge, EmptyState, FormInput, FormSelect, FormTextarea, FormRow, TabBar, StatCard } from '../components/ui/FormComponents';
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineCalendarDays,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineClipboardDocumentList,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentDuplicate,
  HiOutlineChartBar,
  HiOutlineUser,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

// ─── Constants ──────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SUPPORT_TYPES = [
  { id: 'active', label: 'Active', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', dot: 'bg-blue-500' },
  { id: 'sleepover', label: 'Sleepover', color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', dot: 'bg-purple-500' },
  { id: 'passive_night', label: 'Passive Night', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-500' },
];

const RATIOS = ['1:1', '1:2', '1:3', '1:4', '1:5'];

const STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft' },
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
];

const STATUS_BADGES = {
  draft: { variant: 'warning', label: 'Draft' },
  active: { variant: 'success', label: 'Active' },
  archived: { variant: 'default', label: 'Archived' },
};

const TABS = [
  { id: 'schedule', label: 'Schedule', icon: HiOutlineCalendarDays },
  { id: 'participants', label: 'Participants', icon: HiOutlineUserGroup },
  { id: 'summary', label: 'Summary', icon: HiOutlineChartBar },
];

function fmtTime12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

function getSupportTypeConfig(type) {
  return SUPPORT_TYPES.find(s => s.id === type) || SUPPORT_TYPES[0];
}

function calcBlockHours(block) {
  const [sh, sm] = block.start_time.split(':').map(Number);
  const [eh, em] = block.end_time.split(':').map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60; // overnight
  return (endMins - startMins) / 60;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function RosterOfCareBuilder() {
  const { rocId } = useParams();
  const navigate = useNavigate();
  const [roc, setRoc] = useState(null);
  const [allStaff, setAllStaff] = useState([]);
  const [allParticipants, setAllParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');

  // Modals
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [editBlock, setEditBlock] = useState(null);
  const [prefillDay, setPrefillDay] = useState(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(null); // time_block_id
  const [showCopyDayModal, setShowCopyDayModal] = useState(null); // source day index
  const [showEditRocModal, setShowEditRocModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [rocData, staffData, participantData] = await Promise.all([
        fetchROC(rocId),
        fetchStaff('active'),
        fetchParticipants(),
      ]);
      setRoc(rocData);
      setAllStaff(staffData);
      setAllParticipants(participantData);
    } catch (err) {
      console.error('Failed to load ROC:', err);
    } finally {
      setLoading(false);
    }
  }, [rocId]);

  useEffect(() => { loadData(); }, [loadData]);

  const reload = async () => {
    try {
      const rocData = await fetchROC(rocId);
      setRoc(rocData);
    } catch (err) {
      console.error('Failed to reload ROC:', err);
    }
  };

  // ─── Block CRUD ─────────────────────────────────────────────────────

  const handleAddBlock = async (data) => {
    await addROCTimeBlock({ roster_id: rocId, ...data });
    setShowBlockModal(false);
    setEditBlock(null);
    setPrefillDay(null);
    await reload();
  };

  const handleUpdateBlock = async (id, data) => {
    await updateROCTimeBlock(id, data);
    setShowBlockModal(false);
    setEditBlock(null);
    await reload();
  };

  const handleDeleteBlock = async (id) => {
    if (!confirm('Delete this time block?')) return;
    try {
      await deleteROCTimeBlock(id);
      await reload();
    } catch (err) {
      alert(err.message);
    }
  };

  // ─── Participant CRUD ───────────────────────────────────────────────

  const handleAddParticipant = async (data) => {
    await addROCParticipant({ roster_id: rocId, ...data });
    setShowParticipantModal(false);
    await reload();
  };

  const handleRemoveParticipant = async (id) => {
    if (!confirm('Remove this participant from the roster?')) return;
    try {
      await removeROCParticipant(id);
      await reload();
    } catch (err) {
      alert(err.message);
    }
  };

  // ─── Staff Assignment ───────────────────────────────────────────────

  const handleAssignStaff = async (blockId, staffId) => {
    await assignROCStaff({ time_block_id: blockId, staff_id: staffId });
    setShowStaffModal(null);
    await reload();
  };

  const handleUnassignStaff = async (assignmentId) => {
    try {
      await unassignROCStaff(assignmentId);
      await reload();
    } catch (err) {
      alert(err.message);
    }
  };

  // ─── Copy Day ───────────────────────────────────────────────────────

  const handleCopyDay = async (fromDay, toDays) => {
    await copyROCDay(rocId, fromDay, toDays);
    setShowCopyDayModal(null);
    await reload();
  };

  // ─── Update ROC ─────────────────────────────────────────────────────

  const handleUpdateRoc = async (data) => {
    await updateROC(rocId, data);
    setShowEditRocModal(false);
    await reload();
  };

  // ─── Loading ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-[500px] bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!roc) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          icon={HiOutlineClipboardDocumentList}
          title="Roster not found"
          action={
            <button onClick={() => navigate('/roster-of-care')} className="text-sm font-medium text-accent-500 hover:text-accent-600">
              Back to list
            </button>
          }
        />
      </div>
    );
  }

  const statusCfg = STATUS_BADGES[roc.status] || STATUS_BADGES.draft;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

  return (
    <div className="p-4 lg:p-8 max-w-full overflow-x-hidden">
      {/* Back + header */}
      <button
        onClick={() => navigate('/roster-of-care')}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Rosters
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{roc.roc_number}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{roc.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            {roc.property && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <HiOutlineBuildingOffice2 className="w-3.5 h-3.5" />
                {roc.property.name}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <HiOutlineCalendarDays className="w-3.5 h-3.5" />
              {fmtDate(roc.effective_from)}{roc.effective_to ? ` — ${fmtDate(roc.effective_to)}` : ' — Ongoing'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowEditRocModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] rounded-lg hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
        >
          <HiOutlinePencilSquare className="w-4 h-4" />
          Edit Details
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <TabBar
          tabs={TABS.map(t => ({
            ...t,
            label: t.id === 'participants' ? `${t.label} (${roc.participants?.length || 0})` : t.label,
          }))}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="mt-6">
        {activeTab === 'schedule' && (
          <ScheduleTab
            roc={roc}
            allStaff={allStaff}
            onAddBlock={(day) => { setPrefillDay(day); setEditBlock(null); setShowBlockModal(true); }}
            onEditBlock={(block) => { setEditBlock(block); setPrefillDay(null); setShowBlockModal(true); }}
            onDeleteBlock={handleDeleteBlock}
            onAssignStaff={(blockId) => setShowStaffModal(blockId)}
            onUnassignStaff={handleUnassignStaff}
            onCopyDay={(day) => setShowCopyDayModal(day)}
          />
        )}
        {activeTab === 'participants' && (
          <ParticipantsTab
            roc={roc}
            onAdd={() => setShowParticipantModal(true)}
            onRemove={handleRemoveParticipant}
          />
        )}
        {activeTab === 'summary' && (
          <SummaryTab roc={roc} />
        )}
      </div>

      {/* Modals */}
      {showBlockModal && (
        <TimeBlockModal
          block={editBlock}
          prefillDay={prefillDay}
          onSave={(data) => editBlock ? handleUpdateBlock(editBlock.id, data) : handleAddBlock(data)}
          onClose={() => { setShowBlockModal(false); setEditBlock(null); setPrefillDay(null); }}
        />
      )}
      {showParticipantModal && (
        <AddParticipantModal
          allParticipants={allParticipants}
          existingIds={(roc.participants || []).map(p => p.participant_id)}
          onSave={handleAddParticipant}
          onClose={() => setShowParticipantModal(false)}
        />
      )}
      {showStaffModal && (
        <AssignStaffModal
          blockId={showStaffModal}
          allStaff={allStaff}
          block={(roc.time_blocks || []).find(b => b.id === showStaffModal)}
          onSave={handleAssignStaff}
          onClose={() => setShowStaffModal(null)}
        />
      )}
      {showCopyDayModal !== null && (
        <CopyDayModal
          fromDay={showCopyDayModal}
          onCopy={handleCopyDay}
          onClose={() => setShowCopyDayModal(null)}
        />
      )}
      {showEditRocModal && (
        <EditRocModal
          roc={roc}
          onSave={handleUpdateRoc}
          onClose={() => setShowEditRocModal(false)}
        />
      )}
    </div>
  );
}

// ─── Schedule Tab ────────────────────────────────────────────────────────────

function ScheduleTab({ roc, allStaff, onAddBlock, onEditBlock, onDeleteBlock, onAssignStaff, onUnassignStaff, onCopyDay }) {
  const blocksByDay = useMemo(() => {
    const map = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    (roc.time_blocks || []).forEach(b => {
      if (map[b.day_of_week]) map[b.day_of_week].push(b);
    });
    return map;
  }, [roc.time_blocks]);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {SUPPORT_TYPES.map(st => (
          <div key={st.id} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <div className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
            {st.label}
          </div>
        ))}
      </div>

      {/* Weekly grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {DAYS.map((day, idx) => (
          <DayColumn
            key={idx}
            dayIndex={idx}
            dayLabel={day}
            blocks={blocksByDay[idx]}
            onAddBlock={() => onAddBlock(idx)}
            onEditBlock={onEditBlock}
            onDeleteBlock={onDeleteBlock}
            onAssignStaff={onAssignStaff}
            onUnassignStaff={onUnassignStaff}
            onCopyDay={() => onCopyDay(idx)}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({ dayIndex, dayLabel, blocks, onAddBlock, onEditBlock, onDeleteBlock, onAssignStaff, onUnassignStaff, onCopyDay }) {
  const isWeekend = dayIndex >= 5;

  return (
    <div className={`rounded-xl border ${isWeekend ? 'border-amber-200 dark:border-amber-900/40' : 'border-slate-200 dark:border-[#263554]'} bg-white dark:bg-[#162036] overflow-hidden`}>
      {/* Day header */}
      <div className={`px-3 py-2.5 border-b ${isWeekend ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#1a2844]'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isWeekend ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
            {dayLabel}
          </span>
          {blocks.length > 0 && (
            <button
              onClick={onCopyDay}
              title="Copy to other days"
              className="p-1 rounded text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
            >
              <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Time blocks */}
      <div className="p-2 space-y-2 min-h-[120px]">
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-slate-300 dark:text-slate-600">
            No blocks
          </div>
        ) : (
          blocks.map(block => {
            const cfg = getSupportTypeConfig(block.support_type);
            const staffCount = block.staff_assignments?.length || 0;
            return (
              <div
                key={block.id}
                className={`group relative rounded-lg p-2.5 text-[11px] leading-tight cursor-pointer transition-all hover:ring-1 hover:ring-brand-400/50 ${cfg.color}`}
                onClick={() => onEditBlock(block)}
              >
                <div className="font-bold">
                  {fmtTime12(block.start_time)} – {fmtTime12(block.end_time)}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="capitalize font-medium">{cfg.label}</span>
                  <span className="opacity-70">{block.support_ratio}</span>
                </div>
                <div className="mt-1 text-[10px] opacity-70">
                  {staffCount}/{block.required_staff} staff
                </div>
                {/* Assigned staff names */}
                {block.staff_assignments && block.staff_assignments.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {block.staff_assignments.map(a => (
                      <div key={a.id} className="flex items-center justify-between gap-1">
                        <span className="text-[10px] truncate">
                          {a.staff ? `${a.staff.first_name} ${a.staff.last_name?.[0]}.` : '—'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onUnassignStaff(a.id); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-all"
                        >
                          <HiOutlineTrash className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Quick actions */}
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onAssignStaff(block.id); }}
                    className="p-0.5 rounded hover:bg-white/60 dark:hover:bg-black/30 text-current transition-colors"
                    title="Assign staff"
                  >
                    <HiOutlineUser className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                    className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-colors"
                    title="Delete block"
                  >
                    <HiOutlineTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add button */}
      <div className="px-2 pb-2">
        <button
          onClick={onAddBlock}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-200 dark:border-[#263554] text-xs text-slate-400 dark:text-slate-500 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors"
        >
          <HiOutlinePlus className="w-3 h-3" />
          Add Block
        </button>
      </div>
    </div>
  );
}

// ─── Participants Tab ────────────────────────────────────────────────────────

function ParticipantsTab({ roc, onAdd, onRemove }) {
  const participants = roc.participants || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {participants.length} participant{participants.length !== 1 ? 's' : ''} assigned to this roster
        </p>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Participant
        </button>
      </div>

      {participants.length === 0 ? (
        <EmptyState
          icon={HiOutlineUserGroup}
          title="No participants assigned"
          description="Add participants to this roster to define their support needs"
          action={
            <button onClick={onAdd} className="text-sm font-medium text-accent-500 hover:text-accent-600">
              Add participant
            </button>
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#263554]">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Participant</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">NDIS Number</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Funding Ratio</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Individual Ratio</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {participants.map(rp => {
                const p = rp.participant;
                return (
                  <tr key={rp.id} className="border-b border-slate-100 dark:border-[#1e2d4a] last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-[#1a2844]/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">
                          {p ? `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}` : '??'}
                        </div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {p ? `${p.first_name} ${p.last_name}` : 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">
                      {p?.ndis_number || '--'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {p?.funding_ratio || '--'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {rp.individual_ratio || '--'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                      {rp.notes || '--'}
                    </td>
                    <td className="px-3 py-4">
                      <button
                        onClick={() => onRemove(rp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Summary Tab ─────────────────────────────────────────────────────────────

function SummaryTab({ roc }) {
  const blocks = roc.time_blocks || [];

  const summary = useMemo(() => {
    const byType = {};
    const byDay = {};
    let totalHours = 0;
    let totalStaffHours = 0;
    let weekdayHours = 0;
    let saturdayHours = 0;
    let sundayHours = 0;

    blocks.forEach(b => {
      const hours = calcBlockHours(b);
      totalHours += hours;
      totalStaffHours += hours * b.required_staff;

      // By type
      if (!byType[b.support_type]) byType[b.support_type] = { hours: 0, staffHours: 0, blocks: 0 };
      byType[b.support_type].hours += hours;
      byType[b.support_type].staffHours += hours * b.required_staff;
      byType[b.support_type].blocks += 1;

      // By day
      if (!byDay[b.day_of_week]) byDay[b.day_of_week] = { hours: 0, staffHours: 0, blocks: 0 };
      byDay[b.day_of_week].hours += hours;
      byDay[b.day_of_week].staffHours += hours * b.required_staff;
      byDay[b.day_of_week].blocks += 1;

      // Day category
      if (b.day_of_week <= 4) weekdayHours += hours * b.required_staff;
      else if (b.day_of_week === 5) saturdayHours += hours * b.required_staff;
      else sundayHours += hours * b.required_staff;
    });

    return { byType, byDay, totalHours, totalStaffHours, weekdayHours, saturdayHours, sundayHours };
  }, [blocks]);

  const assignedStaff = useMemo(() => {
    const staffSet = new Set();
    blocks.forEach(b => {
      (b.staff_assignments || []).forEach(a => staffSet.add(a.staff_id));
    });
    return staffSet.size;
  }, [blocks]);

  const unfilledBlocks = blocks.filter(b => (b.staff_assignments?.length || 0) < b.required_staff).length;

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={HiOutlineClock}
          label="Total Weekly Hours"
          value={summary.totalHours.toFixed(1)}
          color="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
        />
        <StatCard
          icon={HiOutlineUserGroup}
          label="Total Staff Hours"
          value={summary.totalStaffHours.toFixed(1)}
          color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={HiOutlineUser}
          label="Unique Staff Assigned"
          value={assignedStaff}
          color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          icon={HiOutlineCalendarDays}
          label="Unfilled Blocks"
          value={unfilledBlocks}
          color={unfilledBlocks > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}
          borderColor={unfilledBlocks > 0 ? 'border-l-red-500' : 'border-l-green-500'}
        />
      </div>

      {/* Hours by support type */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Hours by Support Type</h3>
        {Object.keys(summary.byType).length === 0 ? (
          <p className="text-sm text-slate-400">No time blocks configured</p>
        ) : (
          <div className="space-y-3">
            {SUPPORT_TYPES.filter(st => summary.byType[st.id]).map(st => {
              const data = summary.byType[st.id];
              const pct = summary.totalStaffHours > 0 ? (data.staffHours / summary.totalStaffHours * 100) : 0;
              return (
                <div key={st.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{st.label}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                      {data.staffHours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${st.dot} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{data.blocks} blocks · {data.hours.toFixed(1)}h coverage</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hours by day category */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Staff Hours by Day Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-[#1a2844]">
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{summary.weekdayHours.toFixed(1)}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Weekday Hours (Mon–Fri)</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
            <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">{summary.saturdayHours.toFixed(1)}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Saturday Hours</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
            <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">{summary.sundayHours.toFixed(1)}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sunday Hours</p>
          </div>
        </div>
      </div>

      {/* Hours by day of week */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Daily Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#263554]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Day</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Blocks</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Coverage Hours</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Staff Hours</th>
              </tr>
            </thead>
            <tbody>
              {DAYS_FULL.map((day, idx) => {
                const data = summary.byDay[idx];
                return (
                  <tr key={idx} className="border-b border-slate-100 dark:border-[#1e2d4a] last:border-b-0">
                    <td className={`px-4 py-2.5 text-sm font-medium ${idx >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {day}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono text-right text-slate-500 dark:text-slate-400">
                      {data?.blocks || 0}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono text-right text-slate-500 dark:text-slate-400">
                      {data ? data.hours.toFixed(1) : '0.0'}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono text-right font-semibold text-slate-900 dark:text-white">
                      {data ? data.staffHours.toFixed(1) : '0.0'}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 dark:bg-[#1a2844]">
                <td className="px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white">Total</td>
                <td className="px-4 py-2.5 text-sm font-mono text-right font-bold text-slate-900 dark:text-white">
                  {blocks.length}
                </td>
                <td className="px-4 py-2.5 text-sm font-mono text-right font-bold text-slate-900 dark:text-white">
                  {summary.totalHours.toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-sm font-mono text-right font-bold text-slate-900 dark:text-white">
                  {summary.totalStaffHours.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Time Block Modal ────────────────────────────────────────────────────────

function TimeBlockModal({ block, prefillDay, onSave, onClose }) {
  const [form, setForm] = useState({
    day_of_week: block?.day_of_week ?? prefillDay ?? 0,
    start_time: block?.start_time || '06:00',
    end_time: block?.end_time || '14:00',
    support_type: block?.support_type || 'active',
    support_ratio: block?.support_ratio || '1:3',
    required_staff: block?.required_staff || 1,
    notes: block?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.start_time || !form.end_time) { setError('Start and end times are required'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        day_of_week: Number(form.day_of_week),
        required_staff: Number(form.required_staff),
        notes: form.notes || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Quick-set time templates
  const timeTemplates = [
    { label: 'Morning (6am–2pm)', start: '06:00', end: '14:00' },
    { label: 'Afternoon (2pm–10pm)', start: '14:00', end: '22:00' },
    { label: 'Night (10pm–6am)', start: '22:00', end: '06:00' },
    { label: 'Sleepover (10pm–8am)', start: '22:00', end: '08:00' },
    { label: 'Full Day (6am–10pm)', start: '06:00', end: '22:00' },
  ];

  return (
    <Modal isOpen onClose={onClose} title={block ? 'Edit Time Block' : 'Add Time Block'} icon={HiOutlineClock} size="md">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <ModalError message={error} />

            <FormSelect
              label="Day of Week"
              value={form.day_of_week}
              onChange={updateField('day_of_week')}
            >
              {DAYS_FULL.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </FormSelect>

            {/* Time template quick buttons */}
            <div>
              <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Quick Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {timeTemplates.map(t => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, start_time: t.start, end_time: t.end }))}
                    className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
                      form.start_time === t.start && form.end_time === t.end
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                        : 'border-slate-200 dark:border-[#263554] text-slate-500 dark:text-slate-400 hover:border-brand-300 dark:hover:border-brand-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <FormRow>
              <FormInput
                label="Start Time"
                type="time"
                required
                value={form.start_time}
                onChange={updateField('start_time')}
              />
              <FormInput
                label="End Time"
                type="time"
                required
                value={form.end_time}
                onChange={updateField('end_time')}
              />
            </FormRow>

            <FormRow>
              <FormSelect
                label="Support Type"
                value={form.support_type}
                onChange={updateField('support_type')}
              >
                {SUPPORT_TYPES.map(st => (
                  <option key={st.id} value={st.id}>{st.label}</option>
                ))}
              </FormSelect>
              <FormSelect
                label="Support Ratio"
                value={form.support_ratio}
                onChange={updateField('support_ratio')}
              >
                {RATIOS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </FormSelect>
            </FormRow>

            <FormInput
              label="Required Staff"
              type="number"
              min="1"
              max="10"
              value={form.required_staff}
              onChange={updateField('required_staff')}
            />

            <FormTextarea
              label="Notes"
              rows={2}
              value={form.notes}
              onChange={updateField('notes')}
              placeholder="Optional block notes..."
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" loading={saving}>
            {block ? 'Update Block' : 'Add Block'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Add Participant Modal ───────────────────────────────────────────────────

function AddParticipantModal({ allParticipants, existingIds, onSave, onClose }) {
  const [participantId, setParticipantId] = useState('');
  const [individualRatio, setIndividualRatio] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const available = allParticipants.filter(p => !existingIds.includes(p.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!participantId) { setError('Please select a participant'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({
        participant_id: participantId,
        individual_ratio: individualRatio || null,
        notes: notes || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add Participant" icon={HiOutlineUserGroup} size="md">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <ModalError message={error} />

            {available.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                All participants have already been added to this roster.
              </p>
            ) : (
              <>
                <FormSelect
                  label="Participant"
                  required
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                >
                  <option value="">Select participant...</option>
                  {available.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}{p.ndis_number ? ` (${p.ndis_number})` : ''}
                    </option>
                  ))}
                </FormSelect>

                <FormSelect
                  label="Individual Ratio"
                  value={individualRatio}
                  onChange={(e) => setIndividualRatio(e.target.value)}
                  hint="Override ratio for this participant (if different from block ratio)"
                >
                  <option value="">Same as block ratio</option>
                  {RATIOS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </FormSelect>

                <FormTextarea
                  label="Notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Support needs, preferences, etc."
                />
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose}>Cancel</ButtonSecondary>
          {available.length > 0 && (
            <ButtonPrimary type="submit" loading={saving}>Add Participant</ButtonPrimary>
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Assign Staff Modal ──────────────────────────────────────────────────────

function AssignStaffModal({ blockId, allStaff, block, onSave, onClose }) {
  const [staffId, setStaffId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const existingStaffIds = (block?.staff_assignments || []).map(a => a.staff_id);
  const available = allStaff.filter(s => !existingStaffIds.includes(s.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!staffId) { setError('Please select a staff member'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave(blockId, staffId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cfg = block ? getSupportTypeConfig(block.support_type) : null;

  return (
    <Modal isOpen onClose={onClose} title="Assign Staff" icon={HiOutlineUser} size="sm">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <ModalError message={error} />

            {/* Block info */}
            {block && (
              <div className={`rounded-lg p-3 text-sm ${cfg.color}`}>
                <div className="font-semibold">
                  {DAYS[block.day_of_week]} · {fmtTime12(block.start_time)} – {fmtTime12(block.end_time)}
                </div>
                <div className="text-xs mt-1 opacity-80">
                  {cfg.label} · {block.support_ratio} · {block.staff_assignments?.length || 0}/{block.required_staff} assigned
                </div>
              </div>
            )}

            {available.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                All staff members have been assigned to this block.
              </p>
            ) : (
              <FormSelect
                label="Staff Member"
                required
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              >
                <option value="">Select staff...</option>
                {available.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </FormSelect>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose}>Cancel</ButtonSecondary>
          {available.length > 0 && (
            <ButtonPrimary type="submit" loading={saving}>Assign</ButtonPrimary>
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Copy Day Modal ──────────────────────────────────────────────────────────

function CopyDayModal({ fromDay, onCopy, onClose }) {
  const [selectedDays, setSelectedDays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (idx) => {
    setSelectedDays(prev =>
      prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
    );
  };

  const selectWeekdays = () => {
    setSelectedDays([0, 1, 2, 3, 4].filter(d => d !== fromDay));
  };

  const selectAll = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6].filter(d => d !== fromDay));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDays.length === 0) { setError('Select at least one target day'); return; }
    setError('');
    setSaving(true);
    try {
      await onCopy(fromDay, selectedDays);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Copy ${DAYS_FULL[fromDay]}`} icon={HiOutlineDocumentDuplicate} size="sm">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <ModalError message={error} />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Copy all time blocks from <span className="font-semibold text-slate-700 dark:text-slate-200">{DAYS_FULL[fromDay]}</span> to the selected days. Existing blocks on target days will be replaced.
            </p>

            <div className="space-y-2">
              {DAYS_FULL.map((day, idx) => {
                if (idx === fromDay) return null;
                return (
                  <label key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1a2844] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(idx)}
                      onChange={() => toggleDay(idx)}
                      className="rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500"
                    />
                    <span className={`text-sm font-medium ${idx >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {day}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectWeekdays}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#263554] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1a2844] transition-colors"
              >
                Select Weekdays
              </button>
              <button
                type="button"
                onClick={selectAll}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#263554] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1a2844] transition-colors"
              >
                Select All
              </button>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" loading={saving}>
            Copy to {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Edit ROC Modal ──────────────────────────────────────────────────────────

function EditRocModal({ roc, onSave, onClose }) {
  const [form, setForm] = useState({
    name: roc.name || '',
    status: roc.status || 'draft',
    effective_from: roc.effective_from || '',
    effective_to: roc.effective_to || '',
    notes: roc.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        effective_to: form.effective_to || null,
        notes: form.notes || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Modal isOpen onClose={onClose} title="Edit Roster Details" icon={HiOutlinePencilSquare} size="md">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <ModalError message={error} />

            <FormInput
              label="Roster Name"
              required
              value={form.name}
              onChange={updateField('name')}
            />

            <FormSelect
              label="Status"
              value={form.status}
              onChange={updateField('status')}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </FormSelect>

            <FormRow>
              <FormInput
                label="Effective From"
                type="date"
                required
                value={form.effective_from}
                onChange={updateField('effective_from')}
              />
              <FormInput
                label="Effective To"
                type="date"
                value={form.effective_to}
                onChange={updateField('effective_to')}
                hint="Leave blank for ongoing"
              />
            </FormRow>

            <FormTextarea
              label="Notes"
              rows={3}
              value={form.notes}
              onChange={updateField('notes')}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" loading={saving}>Save Changes</ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
