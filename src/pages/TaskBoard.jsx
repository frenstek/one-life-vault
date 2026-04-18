import { useState, useEffect, useCallback } from 'react';
import { fetchTasks, createTask, updateTask, deleteTask, fetchStaff, fetchTaskNotes, addTaskNote, deleteTaskNote } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineClipboardDocumentList,
  HiOutlinePlus,
  HiOutlineCalendarDays,
  HiOutlineUser,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineChevronDown,
  HiOutlineFunnel,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
  HiOutlineChatBubbleLeftRight,
  HiOutlineListBullet,
  HiOutlineViewColumns,
  HiOutlineEye,
  HiOutlinePaperAirplane,
} from 'react-icons/hi2';

const COLUMNS = [
  { id: 'todo', label: 'To Do', icon: HiOutlineClipboardDocumentList, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800/50', accent: 'border-slate-300 dark:border-slate-600' },
  { id: 'in_progress', label: 'In Progress', icon: HiOutlineArrowPath, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', accent: 'border-blue-400 dark:border-blue-500' },
  { id: 'review', label: 'Review', icon: HiOutlineClock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', accent: 'border-amber-400 dark:border-amber-500' },
  { id: 'done', label: 'Done', icon: HiOutlineCheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', accent: 'border-green-400 dark:border-green-500' },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  { id: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'high', label: 'High', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
];

const CATEGORIES = ['General', 'Compliance', 'Maintenance', 'Participant Care', 'Referrals', 'Admin', 'HR', 'Other'];

function getPriorityConfig(p) {
  return PRIORITIES.find((pr) => pr.id === p) || PRIORITIES[1];
}

function getColumnConfig(s) {
  return COLUMNS.find((c) => c.id === s) || COLUMNS[0];
}

export default function TaskBoard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('olf-task-view') || 'board');

  const setView = (mode) => {
    setViewMode(mode);
    localStorage.setItem('olf-task-view', mode);
  };

  const loadData = useCallback(async () => {
    try {
      const [taskData, staffData] = await Promise.all([
        fetchTasks(),
        fetchStaff('active'),
      ]);
      setTasks(taskData);
      setStaff(staffData);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    try {
      const newTask = await createTask({ ...data, created_by: profile?.full_name || 'Admin' });
      setTasks((prev) => [newTask, ...prev]);
      setShowModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const updated = await updateTask(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditTask(null);
      setShowModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (detailTask?.id === id) setDetailTask(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDrop = async (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (err) {
      loadData();
    }
    setDraggedTask(null);
  };

  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('created');

  const filtered = tasks.filter((t) => {
    if (filterAssignee && t.assigned_to !== filterAssignee) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const STATUS_ORDER = { todo: 0, in_progress: 1, review: 2, done: 3 };
  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'status') return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    if (sortBy === 'priority') return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    if (sortBy === 'due') {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const stats = {
    total: tasks.length,
    overdue: tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineClipboardDocumentList className="text-brand-500" />
            Task Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {stats.total} tasks{stats.overdue > 0 && <> · <span className="text-red-500 font-medium">{stats.overdue} overdue</span></>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'board' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <HiOutlineViewColumns className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <HiOutlineListBullet className="w-3.5 h-3.5" />
              List
            </button>
          </div>
          <button
            onClick={() => { setEditTask(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Assignees</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
            ))}
          </select>
          <HiOutlineUser className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <HiOutlineChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <HiOutlineFunnel className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <HiOutlineChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            {COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <HiOutlineCheckCircle className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <HiOutlineChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="created">Sort: Newest</option>
            <option value="status">Sort: Status</option>
            <option value="priority">Sort: Priority</option>
            <option value="due">Sort: Due Date</option>
          </select>
          <HiOutlineListBullet className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <HiOutlineChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {(filterAssignee || filterPriority || filterStatus) && (
          <button
            onClick={() => { setFilterAssignee(''); setFilterPriority(''); setFilterStatus(''); }}
            className="text-sm text-brand-500 hover:text-brand-600 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = sorted.filter((t) => t.status === col.id);
            const Icon = col.icon;

            return (
              <div
                key={col.id}
                className={`rounded-xl border-t-2 ${col.accent} ${col.bg} p-3 min-h-[300px]`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('taskId');
                  if (taskId) handleDrop(taskId, col.id);
                }}
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${col.color}`} />
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{col.label}</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => { setEditTask(task); setShowModal(true); }}
                      onDelete={() => handleDelete(task.id)}
                      onView={() => setDetailTask(task)}
                      onDragStart={() => setDraggedTask(task.id)}
                      dragging={draggedTask === task.id}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#263554]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Task</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Priority</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assignee</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Due Date</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500">No tasks found</td>
                  </tr>
                )}
                {sorted.map((task) => {
                  const priorityCfg = getPriorityConfig(task.priority);
                  const colCfg = getColumnConfig(task.status);
                  const ColIcon = colCfg.icon;
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

                  return (
                    <tr key={task.id} className="border-b border-slate-50 dark:border-[#263554] hover:bg-slate-50/50 dark:hover:bg-[#1e2d4a]/30 transition-colors">
                      <td className="px-5 py-4">
                        <button onClick={() => setDetailTask(task)} className="text-left hover:text-brand-500 transition-colors">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">{task.title}</span>
                          {task.description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>}
                        </button>
                        {(task.follow_up_notes || task.completion_notes) && (
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {task.follow_up_notes && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">
                                <HiOutlineArrowPath className="w-2.5 h-2.5" />
                                Follow-up
                              </span>
                            )}
                            {task.completion_notes && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium">
                                <HiOutlineCheckCircle className="w-2.5 h-2.5" />
                                Completed
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${colCfg.color}`}>
                          <ColIcon className="w-3.5 h-3.5" />
                          {colCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {task.staff ? `${task.staff.first_name} ${task.staff.last_name}` : <span className="italic text-slate-400">Unassigned</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{task.category || '—'}</td>
                      <td className="px-5 py-4">
                        {task.due_date ? (
                          <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                            {isOverdue && <HiOutlineExclamationTriangle className="w-3.5 h-3.5 inline mr-1" />}
                            {new Date(task.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetailTask(task)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-accent-500" title="View & Notes">
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditTask(task); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500" title="Edit">
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(task.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500" title="Delete">
                            <HiOutlineTrash className="w-4 h-4" />
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

      {/* Task Modal (Create/Edit) */}
      {showModal && (
        <TaskModal
          task={editTask}
          staff={staff}
          onSave={(data) => editTask ? handleUpdate(editTask.id, data) : handleCreate(data)}
          onClose={() => { setShowModal(false); setEditTask(null); }}
        />
      )}

      {/* Task Detail + Notes */}
      {detailTask && (
        <TaskDetail
          task={detailTask}
          authorName={profile?.full_name || 'Admin'}
          onEdit={() => { setDetailTask(null); setEditTask(detailTask); setShowModal(true); }}
          onClose={() => setDetailTask(null)}
          onTaskUpdate={(id, updates) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))}
        />
      )}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onEdit, onDelete, onView, onDragStart, dragging }) {
  const priorityCfg = getPriorityConfig(task.priority);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
        onDragStart();
      }}
      className={`bg-white dark:bg-slate-800 rounded-lg p-3.5 shadow-sm border border-slate-200/80 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${
        dragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      {/* Top row: priority + actions */}
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${priorityCfg.color}`}>
          {priorityCfg.label}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onView} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-accent-500" title="View & Notes">
            <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={onEdit} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-brand-500">
            <HiOutlinePencilSquare className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 hover:text-red-500">
            <HiOutlineTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 line-clamp-2 cursor-pointer" onClick={onView}>{task.title}</h3>
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Category */}
      {task.category && (
        <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 mb-2">
          {task.category}
        </span>
      )}

      {/* Follow-up & Completion Notes preview */}
      {(task.follow_up_notes || task.completion_notes) && (
        <div className="space-y-1.5 mb-3">
          {task.follow_up_notes && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-800/40 px-2.5 py-1.5">
              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <HiOutlineArrowPath className="w-2.5 h-2.5" />
                Follow-up
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 line-clamp-2">{task.follow_up_notes}</p>
            </div>
          )}
          {task.completion_notes && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/15 border border-green-200/60 dark:border-green-800/40 px-2.5 py-1.5">
              <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <HiOutlineCheckCircle className="w-2.5 h-2.5" />
                Completion
              </p>
              <p className="text-[11px] text-green-700 dark:text-green-300 line-clamp-2">{task.completion_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer: assignee + due date */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
        {task.staff ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-[10px] font-bold text-brand-600 dark:text-brand-400">
              {task.staff.first_name?.[0]}{task.staff.last_name?.[0]}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{task.staff.first_name}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
        )}

        {task.due_date && (
          <div className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
            {isOverdue && <HiOutlineExclamationTriangle className="w-3 h-3" />}
            <HiOutlineCalendarDays className="w-3 h-3" />
            {new Date(task.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task Detail + Notes ─────────────────────────────────────────────────────

function TaskDetail({ task, authorName, onEdit, onClose, onTaskUpdate }) {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [sending, setSending] = useState(false);
  const [followUp, setFollowUp] = useState(task.follow_up_notes || '');
  const [completion, setCompletion] = useState(task.completion_notes || '');
  const [savingField, setSavingField] = useState(null);

  const priorityCfg = getPriorityConfig(task.priority);
  const colCfg = getColumnConfig(task.status);
  const ColIcon = colCfg.icon;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  useEffect(() => {
    fetchTaskNotes(task.id)
      .then(setNotes)
      .catch((err) => console.error('Failed to load notes:', err))
      .finally(() => setLoadingNotes(false));
  }, [task.id]);

  const handleSendNote = async () => {
    if (!noteText.trim()) return;
    setSending(true);
    try {
      const note = await addTaskNote({ task_id: task.id, content: noteText.trim(), author: authorName });
      setNotes((prev) => [...prev, note]);
      setNoteText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteTaskNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      alert(err.message);
    }
  };

  const saveField = async (field, value) => {
    setSavingField(field);
    try {
      await updateTask(task.id, { [field]: value || null });
      if (onTaskUpdate) onTaskUpdate(task.id, { [field]: value || null });
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingField(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#162036] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-[#263554]">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{task.title}</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${colCfg.color}`}>
                <ColIcon className="w-3.5 h-3.5" />
                {colCfg.label}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${priorityCfg.color}`}>
                {priorityCfg.label}
              </span>
              {task.category && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  {task.category}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-colors" title="Edit">
              <HiOutlinePencilSquare className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <HiOutlineXMark className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Task Info */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#263554] space-y-2">
            {task.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>
                <strong className="text-slate-600 dark:text-slate-300">Assignee:</strong>{' '}
                {task.staff ? `${task.staff.first_name} ${task.staff.last_name}` : 'Unassigned'}
              </span>
              {task.due_date && (
                <span className={isOverdue ? 'text-red-500' : ''}>
                  <strong className={`${isOverdue ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>Due:</strong>{' '}
                  {new Date(task.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {isOverdue && ' (Overdue)'}
                </span>
              )}
              {task.created_by && <span><strong className="text-slate-600 dark:text-slate-300">Created by:</strong> {task.created_by}</span>}
            </div>
          </div>

          {/* Comments / Notes */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#263554]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
              Notes ({notes.length})
            </h3>

            {loadingNotes ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No notes yet — add a comment below</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="group rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-[#263554] px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-[9px] font-bold text-brand-600 dark:text-brand-400">
                          {(note.author || 'A')[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{note.author || 'Admin'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(note.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}{' '}
                          {new Date(note.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 hover:text-red-500 transition-all"
                        title="Delete note"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Note Input */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendNote(); } }}
                placeholder="Add a note or comment..."
                className="flex-1 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-sm text-slate-900 dark:text-white px-4 py-2.5"
              />
              <button
                onClick={handleSendNote}
                disabled={!noteText.trim() || sending}
                className="px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white block" />
                ) : (
                  <HiOutlinePaperAirplane className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Follow-up Notes */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#263554]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <HiOutlineArrowPath className="w-3.5 h-3.5" />
              Follow-up Notes
            </h3>
            <textarea
              rows={3}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Add follow-up details, next steps, or actions needed..."
              className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-sm text-slate-900 dark:text-white px-4 py-2.5 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              {savingField === 'follow_up_notes' ? (
                <p className="text-[10px] text-accent-500">Saving...</p>
              ) : <span />}
              <button
                onClick={() => saveField('follow_up_notes', followUp)}
                disabled={followUp === (task.follow_up_notes || '') || savingField === 'follow_up_notes'}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-500 hover:bg-accent-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Follow-up
              </button>
            </div>
          </div>

          {/* Completion Notes */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <HiOutlineCheckCircle className="w-3.5 h-3.5" />
              Completion Notes
            </h3>
            <textarea
              rows={3}
              value={completion}
              onChange={(e) => setCompletion(e.target.value)}
              placeholder="Add completion summary, outcome, or resolution details..."
              className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] text-sm text-slate-900 dark:text-white px-4 py-2.5 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              {savingField === 'completion_notes' ? (
                <p className="text-[10px] text-accent-500">Saving...</p>
              ) : <span />}
              <button
                onClick={() => saveField('completion_notes', completion)}
                disabled={completion === (task.completion_notes || '') || savingField === 'completion_notes'}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-500 hover:bg-accent-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Completion
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task Modal ───────────────────────────────────────────────────────────────

function TaskModal({ task, staff, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assigned_to: task?.assigned_to || '',
    due_date: task?.due_date || '',
    category: task?.category || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      category: form.category || null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <HiOutlineXMark className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full"
              placeholder="Task title..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full"
              placeholder="Optional details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full">
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="w-full">
                {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Assign To</label>
              <select value={form.assigned_to} onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))} className="w-full">
                <option value="">Unassigned</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full">
              <option value="">No Category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
