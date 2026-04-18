import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchRoster,
  createRosterShift,
  updateRosterShift,
  deleteRosterShift,
  fetchShiftHandovers,
  createShiftHandover,
  fetchStaff,
  fetchProperties,
  formatDate,
} from '../lib/api';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from '../components/ui/Modal';
import { PageHeader, Badge, EmptyState, FormInput, FormSelect, FormTextarea, FormRow, TabBar } from '../components/ui/FormComponents';
import {
  HiOutlineCalendarDays,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePlus,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineBuildingOffice2,
  HiOutlineExclamationTriangle,
  HiOutlineFunnel,
  HiOutlineClock,
  HiOutlineUser,
} from 'react-icons/hi2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Mon=1
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt;
  });
}

function toDateStr(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

function fmtDayHeader(d) {
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
}

function fmtWeekRange(dates) {
  const start = dates[0].toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const end = dates[6].toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return `${start} — ${end}`;
}

function fmtTime12(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

const SHIFT_TYPES = [
  { id: 'morning', label: 'Morning', pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', badge: 'warning' },
  { id: 'afternoon', label: 'Afternoon', pill: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', badge: 'info' },
  { id: 'night', label: 'Night', pill: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', badge: 'purple' },
  { id: 'sleepover', label: 'Sleepover', pill: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', badge: 'default' },
];

const STATUSES = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function getShiftTypeConfig(type) {
  return SHIFT_TYPES.find((s) => s.id === type) || SHIFT_TYPES[0];
}

const TABS = [
  { id: 'roster', label: 'Roster', icon: HiOutlineCalendarDays },
  { id: 'handover', label: 'Handover Notes', icon: HiOutlineDocumentText },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShiftRoster() {
  const [activeTab, setActiveTab] = useState('roster');
  const [staff, setStaff] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Roster state
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState('');
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editShift, setEditShift] = useState(null);
  const [prefillDate, setPrefillDate] = useState('');
  const [prefillStaff, setPrefillStaff] = useState('');

  // Handover state
  const [handoverDate, setHandoverDate] = useState(toDateStr(new Date()));
  const [handoverPropertyFilter, setHandoverPropertyFilter] = useState('');
  const [handovers, setHandovers] = useState([]);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);

  // ─── Load base data ─────────────────────────────────────────────────────────

  const loadBase = useCallback(async () => {
    try {
      const [staffData, propData] = await Promise.all([
        fetchStaff('active'),
        fetchProperties('active'),
      ]);
      setStaff(staffData);
      setProperties(propData);
    } catch (err) {
      console.error('Failed to load base data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBase(); }, [loadBase]);

  // ─── Load roster when week or filter changes ────────────────────────────────

  const loadRoster = useCallback(async () => {
    setRosterLoading(true);
    try {
      const startDate = toDateStr(weekDates[0]);
      const endDate = toDateStr(weekDates[6]);
      const data = await fetchRoster(startDate, endDate, propertyFilter || undefined);
      setRoster(data);
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setRosterLoading(false);
    }
  }, [weekDates, propertyFilter]);

  useEffect(() => {
    if (!loading) loadRoster();
  }, [loadRoster, loading]);

  // ─── Load handovers ────────────────────────────────────────────────────────

  const loadHandovers = useCallback(async () => {
    if (activeTab !== 'handover') return;
    setHandoverLoading(true);
    try {
      const data = await fetchShiftHandovers(handoverPropertyFilter || undefined, handoverDate || undefined);
      setHandovers(data);
    } catch (err) {
      console.error('Failed to load handovers:', err);
    } finally {
      setHandoverLoading(false);
    }
  }, [activeTab, handoverDate, handoverPropertyFilter]);

  useEffect(() => {
    if (!loading) loadHandovers();
  }, [loadHandovers, loading]);

  // ─── Week navigation ───────────────────────────────────────────────────────

  const navigateWeek = (dir) => {
    setWeekAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  const goToday = () => setWeekAnchor(new Date());

  // ─── Shift CRUD ─────────────────────────────────────────────────────────────

  const handleCreateShift = async (data) => {
    const newShift = await createRosterShift(data);
    setRoster((prev) => [...prev, newShift]);
    setShowShiftModal(false);
    setEditShift(null);
    setPrefillDate('');
    setPrefillStaff('');
  };

  const handleUpdateShift = async (id, data) => {
    const updated = await updateRosterShift(id, data);
    setRoster((prev) => prev.map((s) => (s.id === id ? updated : s)));
    setShowShiftModal(false);
    setEditShift(null);
  };

  const handleDeleteShift = async (id) => {
    if (!confirm('Delete this shift?')) return;
    try {
      await deleteRosterShift(id);
      setRoster((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // ─── Handover CRUD ──────────────────────────────────────────────────────────

  const handleCreateHandover = async (data) => {
    await createShiftHandover(data);
    setShowHandoverModal(false);
    loadHandovers();
  };

  // ─── Cell click: add shift to empty cell ────────────────────────────────────

  const handleCellClick = (staffId, dateStr) => {
    setPrefillStaff(staffId);
    setPrefillDate(dateStr);
    setEditShift(null);
    setShowShiftModal(true);
  };

  const handleShiftClick = (shift) => {
    setEditShift(shift);
    setPrefillDate('');
    setPrefillStaff('');
    setShowShiftModal(true);
  };

  // ─── Lookup helpers ─────────────────────────────────────────────────────────

  const staffMap = useMemo(() => {
    const m = {};
    staff.forEach((s) => { m[s.id] = s; });
    return m;
  }, [staff]);

  const propertyMap = useMemo(() => {
    const m = {};
    properties.forEach((p) => { m[p.id] = p; });
    return m;
  }, [properties]);

  const getStaffName = (id) => {
    const s = staffMap[id];
    return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
  };

  const getPropertyName = (id) => {
    const p = propertyMap[id];
    return p ? p.name : '';
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-56" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-full overflow-x-hidden">
      <PageHeader
        title="Shift Roster"
        subtitle={`${staff.length} staff · ${properties.length} properties`}
      />

      <div className="mt-6">
        <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-6">
        {activeTab === 'roster' ? (
          <RosterTab
            weekDates={weekDates}
            roster={roster}
            rosterLoading={rosterLoading}
            staff={staff}
            properties={properties}
            propertyFilter={propertyFilter}
            setPropertyFilter={setPropertyFilter}
            navigateWeek={navigateWeek}
            goToday={goToday}
            onAddShift={() => { setEditShift(null); setPrefillDate(''); setPrefillStaff(''); setShowShiftModal(true); }}
            onCellClick={handleCellClick}
            onShiftClick={handleShiftClick}
            onDeleteShift={handleDeleteShift}
            getPropertyName={getPropertyName}
          />
        ) : (
          <HandoverTab
            handoverDate={handoverDate}
            setHandoverDate={setHandoverDate}
            handoverPropertyFilter={handoverPropertyFilter}
            setHandoverPropertyFilter={setHandoverPropertyFilter}
            handovers={handovers}
            handoverLoading={handoverLoading}
            properties={properties}
            staffMap={staffMap}
            getStaffName={getStaffName}
            getPropertyName={getPropertyName}
            onAddHandover={() => setShowHandoverModal(true)}
          />
        )}
      </div>

      {/* Shift Modal */}
      {showShiftModal && (
        <ShiftModal
          shift={editShift}
          staff={staff}
          properties={properties}
          prefillDate={prefillDate}
          prefillStaff={prefillStaff}
          onSave={(data) => editShift ? handleUpdateShift(editShift.id, data) : handleCreateShift(data)}
          onClose={() => { setShowShiftModal(false); setEditShift(null); setPrefillDate(''); setPrefillStaff(''); }}
        />
      )}

      {/* Handover Modal */}
      {showHandoverModal && (
        <HandoverModal
          staff={staff}
          properties={properties}
          onSave={handleCreateHandover}
          onClose={() => setShowHandoverModal(false)}
        />
      )}
    </div>
  );
}

// ─── Roster Tab ───────────────────────────────────────────────────────────────

function RosterTab({
  weekDates,
  roster,
  rosterLoading,
  staff,
  properties,
  propertyFilter,
  setPropertyFilter,
  navigateWeek,
  goToday,
  onAddShift,
  onCellClick,
  onShiftClick,
  onDeleteShift,
  getPropertyName,
}) {
  const weekLabel = fmtWeekRange(weekDates);

  // Build a lookup: staffId -> dateStr -> shifts[]
  const grid = useMemo(() => {
    const map = {};
    roster.forEach((shift) => {
      const sid = shift.staff_id;
      const dateKey = shift.shift_date;
      if (!map[sid]) map[sid] = {};
      if (!map[sid][dateKey]) map[sid][dateKey] = [];
      map[sid][dateKey].push(shift);
    });
    return map;
  }, [roster]);

  // Staff who have shifts this week + all active staff
  const staffIds = useMemo(() => {
    const ids = new Set(staff.map((s) => s.id));
    roster.forEach((s) => ids.add(s.staff_id));
    return [...ids];
  }, [staff, roster]);

  const isToday = (d) => toDateStr(d) === toDateStr(new Date());

  return (
    <div className="space-y-4">
      {/* Week nav + actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
          >
            <HiOutlineChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-900 dark:text-white min-w-[260px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
          >
            <HiOutlineChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="ml-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Property filter */}
          <div className="relative">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] text-slate-700 dark:text-slate-200"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <HiOutlineBuildingOffice2 className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={onAddShift}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Shift
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-x-auto">
        {rosterLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            <p className="mt-2 text-sm text-slate-400">Loading roster...</p>
          </div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#263554]">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-40 sticky left-0 bg-white dark:bg-[#162036] z-10">
                  Staff
                </th>
                {weekDates.map((d) => (
                  <th
                    key={toDateStr(d)}
                    className={`text-center px-2 py-3 text-xs font-semibold uppercase tracking-wider min-w-[120px] ${
                      isToday(d)
                        ? 'text-accent-600 dark:text-accent-400 bg-accent-50/50 dark:bg-accent-900/10'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {fmtDayHeader(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffIds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-slate-400">
                    No staff members found
                  </td>
                </tr>
              ) : (
                staffIds.map((staffId) => {
                  const s = staff.find((st) => st.id === staffId);
                  const staffName = s ? `${s.first_name} ${s.last_name}` : 'Unknown';
                  const initials = s ? `${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}` : '??';

                  return (
                    <tr key={staffId} className="border-b border-slate-100 dark:border-[#1e2d4a] last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-[#1a2844]/30">
                      <td className="px-4 py-3 sticky left-0 bg-white dark:bg-[#162036] z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-[11px] font-bold text-brand-600 dark:text-brand-400 flex-shrink-0">
                            {initials}
                          </div>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                            {staffName}
                          </span>
                        </div>
                      </td>
                      {weekDates.map((d) => {
                        const dateStr = toDateStr(d);
                        const shifts = grid[staffId]?.[dateStr] || [];
                        return (
                          <td
                            key={dateStr}
                            onClick={() => shifts.length === 0 ? onCellClick(staffId, dateStr) : null}
                            className={`px-1.5 py-2 align-top min-h-[60px] ${
                              isToday(d) ? 'bg-accent-50/30 dark:bg-accent-900/5' : ''
                            } ${shifts.length === 0 ? 'cursor-pointer hover:bg-slate-100/60 dark:hover:bg-[#1e2d4a]/50' : ''}`}
                          >
                            <div className="space-y-1">
                              {shifts.map((shift) => {
                                const cfg = getShiftTypeConfig(shift.shift_type);
                                const propName = !propertyFilter && shift.property_id ? getPropertyName(shift.property_id) : '';
                                return (
                                  <div
                                    key={shift.id}
                                    onClick={(e) => { e.stopPropagation(); onShiftClick(shift); }}
                                    className={`group relative rounded-lg px-2 py-1.5 text-[11px] leading-tight cursor-pointer transition-all hover:ring-1 hover:ring-accent-400/50 ${cfg.pill}`}
                                  >
                                    <div className="font-semibold">
                                      {shift.start_time ? fmtTime12(shift.start_time) : ''}{shift.start_time && shift.end_time ? '–' : ''}{shift.end_time ? fmtTime12(shift.end_time) : ''}
                                    </div>
                                    <div className="text-[10px] opacity-80 capitalize">{cfg.label}</div>
                                    {propName && (
                                      <div className="text-[10px] opacity-70 truncate">{propName}</div>
                                    )}
                                    {shift.status === 'cancelled' && (
                                      <div className="absolute inset-0 bg-white/60 dark:bg-black/40 rounded-lg flex items-center justify-center">
                                        <span className="text-[9px] font-bold text-red-500 uppercase">Cancelled</span>
                                      </div>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onDeleteShift(shift.id); }}
                                      className="absolute top-0.5 right-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-all"
                                    >
                                      <HiOutlineTrash className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })}
                              {shifts.length === 0 && (
                                <div className="h-10 flex items-center justify-center opacity-0 hover:opacity-40 transition-opacity">
                                  <HiOutlinePlus className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Handover Tab ─────────────────────────────────────────────────────────────

function HandoverTab({
  handoverDate,
  setHandoverDate,
  handoverPropertyFilter,
  setHandoverPropertyFilter,
  handovers,
  handoverLoading,
  properties,
  staffMap,
  getStaffName,
  getPropertyName,
  onAddHandover,
}) {
  return (
    <div className="space-y-4">
      {/* Filters + add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={handoverDate}
            onChange={(e) => setHandoverDate(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] text-slate-700 dark:text-slate-200"
          />
          <div className="relative">
            <select
              value={handoverPropertyFilter}
              onChange={(e) => setHandoverPropertyFilter(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] text-slate-700 dark:text-slate-200"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <HiOutlineBuildingOffice2 className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={onAddHandover}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Handover Note
        </button>
      </div>

      {/* Handover list */}
      {handoverLoading ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
          <p className="mt-2 text-sm text-slate-400">Loading handover notes...</p>
        </div>
      ) : handovers.length === 0 ? (
        <EmptyState
          icon={HiOutlineDocumentText}
          title="No handover notes"
          description={handoverDate ? `No notes found for ${formatDate(handoverDate)}` : 'No handover notes found'}
          action={
            <button
              onClick={onAddHandover}
              className="text-sm font-medium text-accent-500 hover:text-accent-600"
            >
              Create one now
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {handovers.map((note) => {
            const shiftCfg = getShiftTypeConfig(note.shift_type);
            return (
              <div
                key={note.id}
                className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <HiOutlineUser className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {note.staff ? `${note.staff.first_name} ${note.staff.last_name}` : getStaffName(note.staff_id)}
                    </span>
                  </div>
                  <Badge variant={shiftCfg.badge}>{shiftCfg.label}</Badge>
                  {note.shift_date && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                      {formatDate(note.shift_date)}
                    </span>
                  )}
                  {note.property_id && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <HiOutlineBuildingOffice2 className="w-3.5 h-3.5" />
                      {note.property ? note.property.name : getPropertyName(note.property_id)}
                    </span>
                  )}
                </div>

                {/* Notes sections */}
                <div className="space-y-3">
                  {note.general_notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">General Notes</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.general_notes}</p>
                    </div>
                  )}
                  {note.participant_notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Participant Notes</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.participant_notes}</p>
                    </div>
                  )}
                  {note.maintenance_notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Maintenance Notes</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.maintenance_notes}</p>
                    </div>
                  )}
                  {note.flagged_items && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/50 p-3">
                      <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <HiOutlineExclamationTriangle className="w-3.5 h-3.5" />
                        Flagged Items
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{note.flagged_items}</p>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                {note.created_at && (
                  <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <HiOutlineClock className="w-3 h-3" />
                    Created {new Date(note.created_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shift Modal ──────────────────────────────────────────────────────────────

function ShiftModal({ shift, staff, properties, prefillDate, prefillStaff, onSave, onClose }) {
  const [form, setForm] = useState({
    staff_id: shift?.staff_id || prefillStaff || '',
    property_id: shift?.property_id || '',
    shift_date: shift?.shift_date || prefillDate || toDateStr(new Date()),
    shift_type: shift?.shift_type || 'morning',
    start_time: shift?.start_time || '06:00',
    end_time: shift?.end_time || '14:00',
    notes: shift?.notes || '',
    status: shift?.status || 'scheduled',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.staff_id) { setError('Staff member is required'); return; }
    if (!form.shift_date) { setError('Date is required'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        property_id: form.property_id || null,
        notes: form.notes || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Auto-set times based on shift type
  const handleShiftTypeChange = (e) => {
    const type = e.target.value;
    const defaults = {
      morning: { start_time: '06:00', end_time: '14:00' },
      afternoon: { start_time: '14:00', end_time: '22:00' },
      night: { start_time: '22:00', end_time: '06:00' },
      sleepover: { start_time: '22:00', end_time: '08:00' },
    };
    setForm((f) => ({
      ...f,
      shift_type: type,
      ...(defaults[type] || {}),
    }));
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={shift ? 'Edit Shift' : 'Add Shift'}
      icon={HiOutlineCalendarDays}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <ModalError message={error} />

            <FormSelect
              label="Staff Member"
              required
              value={form.staff_id}
              onChange={updateField('staff_id')}
            >
              <option value="">Select staff...</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </FormSelect>

            <FormSelect
              label="Property"
              value={form.property_id}
              onChange={updateField('property_id')}
            >
              <option value="">No property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </FormSelect>

            <FormRow>
              <FormInput
                label="Date"
                type="date"
                required
                value={form.shift_date}
                onChange={updateField('shift_date')}
              />
              <FormSelect
                label="Shift Type"
                value={form.shift_type}
                onChange={handleShiftTypeChange}
              >
                {SHIFT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </FormSelect>
            </FormRow>

            <FormRow>
              <FormInput
                label="Start Time"
                type="time"
                value={form.start_time}
                onChange={updateField('start_time')}
              />
              <FormInput
                label="End Time"
                type="time"
                value={form.end_time}
                onChange={updateField('end_time')}
              />
            </FormRow>

            <FormTextarea
              label="Notes"
              rows={2}
              value={form.notes}
              onChange={updateField('notes')}
              placeholder="Optional shift notes..."
            />

            <FormSelect
              label="Status"
              value={form.status}
              onChange={updateField('status')}
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </FormSelect>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" loading={saving}>
            {shift ? 'Update Shift' : 'Create Shift'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Handover Modal ───────────────────────────────────────────────────────────

function HandoverModal({ staff, properties, onSave, onClose }) {
  const [form, setForm] = useState({
    staff_id: '',
    property_id: '',
    shift_date: toDateStr(new Date()),
    shift_type: 'morning',
    general_notes: '',
    participant_notes: '',
    maintenance_notes: '',
    flagged_items: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.staff_id) { setError('Staff member is required'); return; }
    if (!form.general_notes.trim()) { setError('General notes are required'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        property_id: form.property_id || null,
        participant_notes: form.participant_notes || null,
        maintenance_notes: form.maintenance_notes || null,
        flagged_items: form.flagged_items || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add Handover Note"
      icon={HiOutlineDocumentText}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <ModalError message={error} />

            <FormRow>
              <FormSelect
                label="Staff Member"
                required
                value={form.staff_id}
                onChange={updateField('staff_id')}
              >
                <option value="">Select staff...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </FormSelect>
              <FormSelect
                label="Property"
                value={form.property_id}
                onChange={updateField('property_id')}
              >
                <option value="">No property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </FormSelect>
            </FormRow>

            <FormRow>
              <FormInput
                label="Shift Date"
                type="date"
                value={form.shift_date}
                onChange={updateField('shift_date')}
              />
              <FormSelect
                label="Shift Type"
                value={form.shift_type}
                onChange={updateField('shift_type')}
              >
                {SHIFT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </FormSelect>
            </FormRow>

            <FormTextarea
              label="General Notes"
              required
              rows={4}
              value={form.general_notes}
              onChange={updateField('general_notes')}
              placeholder="Summary of the shift..."
            />

            <FormTextarea
              label="Participant Notes"
              rows={3}
              value={form.participant_notes}
              onChange={updateField('participant_notes')}
              placeholder="Any participant-specific observations..."
            />

            <FormTextarea
              label="Maintenance Notes"
              rows={3}
              value={form.maintenance_notes}
              onChange={updateField('maintenance_notes')}
              placeholder="Property maintenance issues..."
            />

            <div>
              <FormTextarea
                label="Flagged Items"
                rows={2}
                value={form.flagged_items}
                onChange={updateField('flagged_items')}
                placeholder="Urgent items requiring immediate attention..."
              />
              <p className="mt-1.5 text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
                <HiOutlineExclamationTriangle className="w-3 h-3" />
                Flagged items will be highlighted for management review
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" loading={saving}>
            Submit Handover
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
