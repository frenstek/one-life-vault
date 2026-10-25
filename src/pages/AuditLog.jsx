import { useState, useEffect } from 'react';
import {
  HiClipboardDocumentList,
  HiMagnifyingGlass,
  HiFunnel,
  HiChevronLeft,
  HiChevronRight,
  HiArrowDownTray,
  HiArrowUpTray,
  HiPencilSquare,
  HiTrash,
  HiUserPlus,
  HiShieldCheck,
  HiPhoto,
  HiKey,
  HiDocumentText,
} from 'react-icons/hi2';

const ACTION_LABELS = {
  create: { label: 'Created', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300', icon: HiUserPlus },
  update: { label: 'Updated', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300', icon: HiPencilSquare },
  delete: { label: 'Deleted', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300', icon: HiTrash },
  upload_document: { label: 'Uploaded Doc', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300', icon: HiArrowUpTray },
  delete_document: { label: 'Deleted Doc', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300', icon: HiTrash },
  archive_document: { label: 'Archived Doc', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300', icon: HiDocumentText },
  create_user: { label: 'Account Created', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300', icon: HiUserPlus },
  reset_password: { label: 'Password Reset', color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300', icon: HiKey },
  upload_photo: { label: 'Photo Uploaded', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300', icon: HiPhoto },
  delete_photo: { label: 'Photo Deleted', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300', icon: HiTrash },
};

const RESOURCE_LABELS = {
  staff: 'Staff',
  staff_document: 'Staff Document',
  participant: 'Participant',
  participant_inquiry: 'Inquiry',
  screening_checklist: 'Screening',
  user: 'User Account',
  property: 'Property',
  property_resident: 'Resident',
  property_photo: 'Property Photo',
  properties: 'Property',
};

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

function formatDetails(details) {
  if (!details) return null;
  if (details.updated_fields) {
    return details.updated_fields.join(', ');
  }
  if (details.document_type) {
    return details.document_type;
  }
  if (details.reason) {
    return details.reason;
  }
  if (details.vault_role) {
    return `Role: ${details.vault_role}`;
  }
  return null;
}

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchLog();
  }, [page, search, actionFilter, typeFilter, fromDate, toDate]);

  async function fetchLog() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);
      if (typeFilter) params.set('resource_type', typeFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await fetch(`/api/audit-log?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function clearFilters() {
    setSearch('');
    setSearchInput('');
    setActionFilter('');
    setTypeFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  const hasFilters = search || actionFilter || typeFilter || fromDate || toDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Complete record of all system actions — {total.toLocaleString()} entries
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
        >
          <HiArrowDownTray className="h-4 w-4" />
          Print / Export
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiFunnel className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</span>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs font-medium text-red-500 hover:text-red-600">
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0f1a2e] pl-9 pr-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </form>

          {/* Action filter */}
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0f1a2e] px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">All Actions</option>
            <option value="create">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
            <option value="upload_document">Document Upload</option>
            <option value="delete_document">Document Delete</option>
            <option value="archive_document">Document Archived</option>
            <option value="create_user">Account Created</option>
            <option value="reset_password">Password Reset</option>
          </select>

          {/* Resource type filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0f1a2e] px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">All Types</option>
            <option value="staff">Staff</option>
            <option value="staff_document">Staff Documents</option>
            <option value="participant">Participants</option>
            <option value="user">User Accounts</option>
            <option value="property">Properties</option>
            <option value="screening_checklist">Screening</option>
          </select>

          {/* Date range */}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0f1a2e] px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200"
            placeholder="From"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0f1a2e] px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200"
            placeholder="To"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Resource</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#263554]/50">
              {loading && entries.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-[#1e2d4a]" />
                    </td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No audit log entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const actionCfg = ACTION_LABELS[entry.action] || { label: entry.action, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', icon: HiDocumentText };
                  const ActionIcon = actionCfg.icon;
                  const details = formatDetails(entry.details);

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {formatDate(entry.created_at)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatTime(entry.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${actionCfg.color}`}>
                          <ActionIcon className="h-3 w-3" />
                          {actionCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {RESOURCE_LABELS[entry.resource_type] || entry.resource_type}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {entry.resource_name || '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {details ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate block">
                            {details}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {entry.user_email || 'system'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-[#263554] px-6 py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages} ({total.toLocaleString()} entries)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263554] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HiChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263554] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
