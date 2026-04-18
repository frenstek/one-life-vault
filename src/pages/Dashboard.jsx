import { useState, useEffect, useMemo } from 'react';
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
} from 'react-icons/hi2';
import { fetchCategories, fetchDocuments, fetchAnnouncements, formatDate } from '../lib/api';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchDocuments(),
      fetchAnnouncements().catch(() => []),
    ])
      .then(([catData, docsData, annData]) => {
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
        <div className="relative">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">One Life Foundation</h1>
          <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
            Document Management System — NDIS SIL Provider
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <StatCard icon={HiDocument} label="Total Documents" value={totalDocs} borderColor="border-l-brand-500" iconBg="bg-blue-50 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" />
        <StatCard icon={HiSquares2X2} label="Departments" value={categories.length} borderColor="border-l-accent-500" iconBg="bg-emerald-50 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={HiClock} label="Recently Updated" value={recentDocs.length} borderColor="border-l-highlight-400" iconBg="bg-amber-50 dark:bg-amber-900/30" iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard icon={HiTableCells} label="File Types" value={fileTypeSummary} borderColor="border-l-purple-500" iconBg="bg-purple-50 dark:bg-purple-900/30" iconColor="text-purple-600 dark:text-purple-400" smallValue />
      </div>

      {/* Quick Access Categories */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Quick Access</h2>
          <Link to="/documents" className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600">
            View all <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6">
          {categories.map((cat) => {
            const style = DEPARTMENT_STYLES[cat.category] || DEFAULT_DEPT_STYLE;
            const Icon = style.icon;
            return (
              <Link
                key={cat.category}
                to={`/documents?category=${encodeURIComponent(cat.category)}`}
                className="card-hover group flex flex-col items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-6 py-8 shadow-sm text-center"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${style.iconBg}`}>
                  <Icon className={`h-7 w-7 ${style.iconColor}`} />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                    {cat.category}
                  </span>
                  <p className="mt-0.5 text-xs text-slate-400">{cat.count} doc{cat.count !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            );
          })}
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

function StatCard({ icon: Icon, label, value, borderColor, iconBg, iconColor, smallValue = false }) {
  return (
    <div className={`flex items-center gap-5 rounded-xl border border-slate-200 dark:border-[#263554] border-l-4 ${borderColor} bg-white dark:bg-[#162036] px-7 py-7 shadow-sm`}>
      <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-7 w-7 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className={`font-bold text-slate-900 dark:text-white ${smallValue ? 'text-sm' : 'text-3xl'}`}>{value}</p>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
