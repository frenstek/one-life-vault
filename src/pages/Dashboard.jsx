import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  HiDocument,
  HiSquares2X2,
  HiClock,
  HiDocumentText,
  HiTableCells,
  HiUserGroup,
  HiClipboardDocumentList,
  HiHeart,
  HiShieldCheck,
  HiCog6Tooth,
  HiCheckCircle,
  HiArrowRight,
  HiPencilSquare,
  HiCalendarDays,
  HiExclamationTriangle,
  HiFolderOpen,
  HiBanknotes,
  HiMegaphone,
  HiNewspaper,
  HiGlobeAlt,
  HiArrowUpTray,
} from 'react-icons/hi2';
import { fetchCategories, fetchDocuments, fetchAnnouncements, fetchTasks, fetchActivityFeed, formatDate } from '../lib/api';
import { toLocalDate } from '../lib/dates';
import { SkeletonDashboard } from '../components/ui/Skeleton';

const DEPARTMENT_STYLES = {
  'Clinical': {
    icon: HiHeart,
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-400',
    barColor: '#f43f5e',
  },
  'Policies & Procedures': {
    icon: HiCheckCircle,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-400',
    barColor: '#10b981',
  },
  'Governance & Compliance': {
    icon: HiShieldCheck,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-400',
    barColor: '#3b82f6',
  },
  'Human Resources': {
    icon: HiUserGroup,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-400',
    barColor: '#f59e0b',
  },
  'Onboarding': {
    icon: HiClipboardDocumentList,
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-400',
    barColor: '#06b6d4',
  },
  'Operations': {
    icon: HiCog6Tooth,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-400',
    barColor: '#8b5cf6',
  },
};

const DEFAULT_DEPT_STYLE = {
  icon: HiDocument,
  iconBg: 'bg-slate-100 dark:bg-[#1e2d4a]',
  iconColor: 'text-slate-600 dark:text-slate-400',
  border: 'border-slate-400',
  barColor: '#64748b',
};

export default function Dashboard() {
  const [categories, setCategories] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [allDocs, setAllDocs] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchDocuments(),
      fetchAnnouncements().catch(() => []),
      fetchTasks().catch(() => []),
    ])
      .then(([catData, docsData, annData, tasksData]) => {
        const cats = catData.categories || catData || [];
        setCategories(cats);

        const totalCount = cats.reduce((sum, c) => sum + (c.count || 0), 0);
        setTotalDocs(totalCount);

        const docs = docsData.documents || docsData || [];
        setAllDocs(docs);
        const sorted = [...docs]
          .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
          .slice(0, 8);
        setRecentDocs(sorted);

        const anns = Array.isArray(annData) ? annData : annData?.announcements || [];
        setAnnouncements(anns.slice(0, 3));

        const tasksList = Array.isArray(tasksData) ? tasksData : tasksData?.tasks || [];
        setTasks(tasksList);
      })
      .catch((err) => {
        console.error('Dashboard load error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const fileTypeCounts = useMemo(() => {
    const counts = {};
    allDocs.forEach((doc) => {
      const ft = (doc.file_type || 'other').toLowerCase();
      counts[ft] = (counts[ft] || 0) + 1;
    });
    return counts;
  }, [allDocs]);

  const fileTypeSummary = useMemo(() => {
    const pdfCount = fileTypeCounts['pdf'] || 0;
    const docxCount = (fileTypeCounts['docx'] || 0) + (fileTypeCounts['doc'] || 0);
    const xlsxCount = (fileTypeCounts['xlsx'] || 0) + (fileTypeCounts['xls'] || 0) + (fileTypeCounts['csv'] || 0);
    const otherCount = allDocs.length - pdfCount - docxCount - xlsxCount;
    const parts = [];
    if (pdfCount) parts.push(`${pdfCount} PDF`);
    if (docxCount) parts.push(`${docxCount} Word`);
    if (xlsxCount) parts.push(`${xlsxCount} Excel`);
    if (otherCount > 0) parts.push(`${otherCount} Other`);
    return parts.join(' / ') || '--';
  }, [fileTypeCounts, allDocs]);

  const deptBreakdown = useMemo(() => {
    if (!categories.length) return [];
    const maxCount = Math.max(...categories.map((c) => c.count || 0), 1);
    return categories.map((cat) => ({
      ...cat,
      percentage: Math.round(((cat.count || 0) / maxCount) * 100),
    }));
  }, [categories]);

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="space-y-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-[#263554] bg-gradient-to-r from-accent-500/8 via-white dark:via-slate-800 to-brand-500/8 px-10 py-12 shadow-sm">
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.06]">
          <img src="/logo.png" alt="" className="h-36 w-auto" aria-hidden="true" />
        </div>
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">One Life Foundation</h1>
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
              NDIS SIL Provider — Operations Platform
            </p>
          </div>
          <MelbourneClock />
        </div>
      </div>

      {/* Stats Cards — Tasks & Announcements */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link to="/tasks" className="card-hover group">
          <TaskSummaryCard tasks={tasks} />
        </Link>
        <Link to="/announcements" className="card-hover group">
          <AnnouncementSummaryCard announcements={announcements} />
        </Link>
      </div>

      {/* Activity Feed */}
      <ActivityFeed />

      {/* NDIS News Feed */}
      <NDISNewsFeed />

      {/* Quick Access — most used features */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Quick Access</h2>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { name: 'Progress Notes', to: '/progress-notes', icon: HiPencilSquare, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
            { name: 'Participants', to: '/participants', icon: HiUserGroup, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
            { name: 'Time Clock', to: '/time-clock', icon: HiClock, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
            { name: 'Shift Roster', to: '/shift-roster', icon: HiCalendarDays, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
            { name: 'Incidents', to: '/incidents', icon: HiExclamationTriangle, iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
            { name: 'Documents', to: '/documents', icon: HiFolderOpen, iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' },
          ].map((item) => (
            <Link
              key={item.name}
              to={item.to}
              className="card-hover group flex flex-col items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-6 py-8 shadow-sm text-center"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${item.iconBg}`}>
                <item.icon className={`h-7 w-7 ${item.iconColor}`} />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Two-column: Recent Activity + Document Breakdown */}
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Recent Activity */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Recent Activity</h2>
            <Link to="/documents" className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600">
              View all <HiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {error ? (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">Could not load documents.</p>
            </div>
          ) : recentDocs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8 text-center text-sm text-slate-500 shadow-sm">
              No recent documents found.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] shadow-sm">
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {recentDocs.map((doc) => {
                  const ft = (doc.file_type || '').toLowerCase();
                  const typeLabel = doc.file_type?.toUpperCase() || 'FILE';
                  let typeBg = 'bg-slate-100 text-slate-600 dark:bg-[#1e2d4a] dark:text-slate-400';
                  if (ft === 'pdf') typeBg = 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400';
                  else if (ft === 'docx' || ft === 'doc') typeBg = 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
                  else if (ft === 'xlsx' || ft === 'xls' || ft === 'csv') typeBg = 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400';

                  return (
                    <li key={doc.id}>
                      <Link
                        to={`/view/${doc.id}`}
                        className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]/50"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1e2d4a]">
                          <HiDocumentText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{doc.name}</p>
                          <p className="truncate text-xs text-slate-400">
                            {doc.category || 'Uncategorized'}
                            {doc.subcategory ? ` / ${doc.subcategory}` : ''}
                          </p>
                        </div>
                        <span className={`hidden flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:inline-flex ${typeBg}`}>
                          {typeLabel}
                        </span>
                        <span className="flex-shrink-0 text-xs text-slate-400">
                          {formatDate(doc.updated_at)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Document Breakdown by Department */}
        <section>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Documents by Department</h2>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8 shadow-sm">
            <div className="space-y-7">
              {deptBreakdown.map((dept) => {
                const style = DEPARTMENT_STYLES[dept.category] || DEFAULT_DEPT_STYLE;
                const Icon = style.icon;
                return (
                  <div key={dept.category}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${style.iconColor}`} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{dept.category}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{dept.count}</span>
                    </div>
                    <div className="h-3.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1e2d4a]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${dept.percentage}%`, backgroundColor: style.barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <Link to="/documents" className="card-hover flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <HiDocument className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Browse All</p>
              <p className="text-xs text-slate-400">View all documents</p>
            </div>
          </Link>
          <Link to="/documents?category=Clinical" className="card-hover flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/30">
              <HiHeart className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clinical Forms</p>
              <p className="text-xs text-slate-400">Care plans & medication</p>
            </div>
          </Link>
          <Link to="/documents?category=Onboarding" className="card-hover flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-900/30">
              <HiClipboardDocumentList className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Onboarding</p>
              <p className="text-xs text-slate-400">Intake & agreements</p>
            </div>
          </Link>
          <Link to="/documents?category=Human+Resources" className="card-hover flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
              <HiUserGroup className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">HR Documents</p>
              <p className="text-xs text-slate-400">Job descriptions & training</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Announcements</h2>
            <Link to="/announcements" className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600">
              View all <HiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`rounded-xl border bg-white dark:bg-[#162036] p-6 shadow-sm ${
                  ann.priority === 'urgent'
                    ? 'border-l-4 border-l-red-500 border-red-200 dark:border-red-800/40'
                    : ann.priority === 'important'
                      ? 'border-l-4 border-l-amber-400 border-amber-200 dark:border-amber-800/40'
                      : 'border-slate-200 dark:border-[#263554]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{ann.title}</h3>
                  {ann.priority !== 'normal' && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      ann.priority === 'urgent' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {ann.priority}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{ann.content}</p>
                <p className="mt-3 text-xs text-slate-400">{ann.author} — {formatDate(ann.created_at)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer info */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-gradient-to-r from-accent-500/5 to-brand-500/5 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-5">
            <img src="/logo.png" alt="One Life Foundation" className="h-14 w-auto" />
            <div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">One Life Foundation PTY LTD</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">NDIS Registered Provider — Supported Independent Living</p>
            </div>
          </div>
          <div className="text-right text-sm text-slate-400">
            <p className="font-medium text-slate-600 dark:text-slate-300">{totalDocs} documents</p>
            <p>{categories.length} departments</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Melbourne Live Clock ────────────────────────────────────────────────────

function MelbourneClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const melb = time.toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="text-right">
      <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Melbourne, AU</p>
      <p className="text-lg font-semibold tabular-nums text-slate-700 dark:text-slate-200 font-mono">{melb}</p>
    </div>
  );
}

// ─── Task Summary Card ───────────────────────────────────────────────────────

function TaskSummaryCard({ tasks }) {
  const open = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress' || t.status === 'in-progress').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress' || t.status === 'in-progress').length;
  const today = toLocalDate();
  const overdue = tasks.filter((t) => {
    if (!t.due_date) return false;
    const isOpen = t.status !== 'done' && t.status !== 'completed';
    return isOpen && String(t.due_date).slice(0, 10) < today;
  }).length;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 shadow-sm group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
          <HiClipboardDocumentList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Task Board</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{open}</p>
          <p className="text-xs text-slate-400 mt-0.5">Open</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgress}</p>
          <p className="text-xs text-slate-400 mt-0.5">In Progress</p>
        </div>
        <div>
          <p className={`text-2xl font-bold ${overdue > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{overdue}</p>
          <p className="text-xs text-slate-400 mt-0.5">Overdue</p>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Summary Card ───────────────────────────────────────────────

function AnnouncementSummaryCard({ announcements }) {
  const urgent = announcements.filter((a) => a.priority === 'urgent').length;
  const latest = announcements[0];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 shadow-sm group-hover:border-amber-300 dark:group-hover:border-amber-700 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
          <HiMegaphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Announcements</h3>
          {urgent > 0 && (
            <span className="rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">{urgent} urgent</span>
          )}
        </div>
      </div>
      {latest ? (
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{latest.title}</p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{latest.content}</p>
          <p className="text-xs text-slate-400 mt-2">{latest.author} — {announcements.length} total</p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">No announcements</p>
      )}
    </div>
  );
}

// ─── NDIS News Feed ──────────────────────────────────────────────────────────

function NewsImage({ src, favicon }) {
  const [failed, setFailed] = useState(false);
  // Prefer favicon/source logo for clean look, fallback to article image, then icon
  if (favicon && !failed) {
    return (
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-[#1e2d4a] mt-0.5">
        <img src={favicon} alt="" className="h-8 w-8 rounded" onError={() => setFailed(true)} />
      </div>
    );
  }
  if (src && !failed) {
    return (
      <img
        src={`/api/image-proxy?url=${encodeURIComponent(src)}`}
        alt=""
        className="h-12 w-12 flex-shrink-0 rounded-lg object-cover bg-slate-100 dark:bg-[#1e2d4a] mt-0.5"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 mt-0.5">
      <HiNewspaper className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    </div>
  );
}

// ─── Activity Feed ──────────────────────────────────────────────────────────

const FEED_TYPE_CONFIG = {
  document: { icon: HiArrowUpTray, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', label: 'Document' },
  announcement: { icon: HiMegaphone, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', label: 'Announcement' },
  incident: { icon: HiExclamationTriangle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', label: 'Incident' },
};

function getRelativeTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function ActivityFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityFeed()
      .then(data => setFeed(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section>
        <div className="mb-6"><h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">What's Happening</h2></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-[#1e2d4a]" />)}
        </div>
      </section>
    );
  }

  if (feed.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">What's Happening</h2>
        <span className="rounded-full bg-[#0ea03e]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#0ea03e] uppercase">Live</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-[#263554]">
          {feed.slice(0, 12).map((item) => {
            const cfg = FEED_TYPE_CONFIG[item.type] || FEED_TYPE_CONFIG.document;
            const Icon = cfg.icon;

            // Priority badge for announcements
            const priorityBadge = item.type === 'announcement' && item.meta && item.meta !== 'normal';
            // Severity badge for incidents
            const severityBadge = item.type === 'incident' && item.meta;

            return (
              <div key={item.id} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-[#1e2d4a]/30">
                <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${cfg.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{item.title}</p>
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>
                          {item.meta && item.type === 'document' ? item.meta : cfg.label}
                        </span>
                        {priorityBadge && (
                          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                            item.meta === 'urgent' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {item.meta}
                          </span>
                        )}
                        {severityBadge && (
                          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                            item.meta === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              : item.meta === 'high' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                            {item.meta}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.subtitle}</p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{getRelativeTime(item.timestamp)}</span>
                  </div>
                  {item.author && (
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">by {item.author}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── NDIS News Feed ──────────────────────────────────────────────────────────

function NDISNewsFeed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/features?action=ndis-news')
      .then(r => r.json())
      .then(data => setArticles(data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = expanded ? articles : articles.slice(0, 4);

  if (loading) {
    return (
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">NDIS News</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-[#1e2d4a]" />
          ))}
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">NDIS News</h2>
          <span className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Live</span>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] shadow-sm">
        <ul className="divide-y divide-slate-100 dark:divide-[#263554]">
          {visible.map((article, i) => (
            <li key={i}>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 px-6 py-5 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]/50"
              >
                <NewsImage src={article.image} favicon={article.favicon} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                    {article.title}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                    {article.source && (
                      <span className="flex items-center gap-1">
                        <HiGlobeAlt className="h-3 w-3" />
                        {article.source}
                      </span>
                    )}
                    {article.timeAgo && <span>{article.timeAgo}</span>}
                  </div>
                </div>
                <HiArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300 dark:text-slate-600 mt-1" />
              </a>
            </li>
          ))}
        </ul>
        {articles.length > 4 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full border-t border-slate-100 dark:border-[#263554] px-6 py-3 text-sm font-medium text-brand-500 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]/50 transition-colors"
          >
            {expanded ? 'Show less' : `Show all ${articles.length} articles`}
          </button>
        )}
      </div>
    </section>
  );
}
