import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiUserGroup,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiQueueList,
  HiPencilSquare,
  HiTrash,
  HiPhone,
  HiEnvelope,
  HiExclamationTriangle,
  HiArrowPath,
  HiBellAlert,
  HiArrowTopRightOnSquare,
} from 'react-icons/hi2';
import { fetchInquiries, deleteInquiry } from '../lib/api';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';
import InquiryModal from '../components/InquiryModal';

const STATUS_FILTERS = ['All', 'New', 'In Progress', 'Accepted', 'Declined', 'Waitlisted', 'Converted'];

const STATUS_CONFIG = {
  New: { color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', icon: HiClock },
  'In Progress': { color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', icon: HiArrowPath },
  Accepted: { color: 'bg-green-50 dark:bg-green-900/20 text-accent-500', icon: HiCheckCircle },
  Declined: { color: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400', icon: HiXCircle },
  Waitlisted: { color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400', icon: HiQueueList },
  Converted: { color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400', icon: HiCheckCircle },
};

const PRIORITY_CONFIG = {
  Low: 'text-slate-400',
  Normal: 'text-slate-600 dark:text-slate-300',
  High: 'text-amber-500',
  Urgent: 'text-red-500 font-semibold',
};

function getFollowUpStatus(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr); date.setHours(0, 0, 0, 0);
  const diff = date - today;
  if (diff < 0) return 'overdue';
  if (diff <= 3 * 86400000) return 'soon';
  return 'upcoming';
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editInquiry, setEditInquiry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function loadInquiries() {
    setLoading(true);
    setError(null);
    const status = filter === 'All' ? undefined : filter;
    fetchInquiries(status, search.trim() || undefined)
      .then((data) => setInquiries(Array.isArray(data) ? data : data.inquiries || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadInquiries();
  }, [filter]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => loadInquiries(), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteInquiry(id);
      setDeleteConfirm(null);
      loadInquiries();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // Sort: overdue follow-ups first, then by created_at desc
  const sorted = [...inquiries].sort((a, b) => {
    const aOverdue = getFollowUpStatus(a.next_follow_up) === 'overdue' && !['Declined', 'Converted'].includes(a.status);
    const bOverdue = getFollowUpStatus(b.next_follow_up) === 'overdue' && !['Declined', 'Converted'].includes(b.status);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const counts = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === 'New').length,
    inProgress: inquiries.filter((i) => i.status === 'In Progress').length,
    overdue: inquiries.filter((i) => getFollowUpStatus(i.next_follow_up) === 'overdue' && !['Declined', 'Converted'].includes(i.status)).length,
  };

  const formatDate = (d) => {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Participant Inquiries</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track and manage incoming participant referrals</p>
        </div>
        <button
          onClick={() => { setEditInquiry(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
        >
          <HiPlus className="h-4 w-4" />
          New Inquiry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard icon={HiUserGroup} label="Total Inquiries" value={counts.total} color="bg-blue-50 dark:bg-blue-900/30 text-brand-500" />
            <StatCard icon={HiClock} label="New" value={counts.new} color="bg-amber-50 dark:bg-amber-900/30 text-amber-500" />
            <StatCard icon={HiArrowPath} label="In Progress" value={counts.inProgress} color="bg-purple-50 dark:bg-purple-900/30 text-purple-500" />
            <StatCard icon={HiBellAlert} label="Overdue" value={counts.overdue} color={counts.overdue > 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-green-50 dark:bg-green-900/30 text-accent-500'} />
          </>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === opt
                  ? 'bg-accent-500 text-white'
                  : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or NDIS #..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Inquiries Table */}
      {loading ? (
        <SkeletonGrid count={4} />
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <HiUserGroup className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {search || filter !== 'All' ? 'No inquiries match your filters.' : 'No participant inquiries yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#263554]">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Participant</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Service</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Referral</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Follow-up</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Priority</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((inq) => {
                const cfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.New;
                const StatusIcon = cfg.icon;
                const fuStatus = getFollowUpStatus(inq.next_follow_up);
                const isOverdue = fuStatus === 'overdue' && !['Declined', 'Converted'].includes(inq.status);
                return (
                  <tr key={inq.id} className={`border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50/50 dark:hover:bg-[#1e2d4a]/30 ${isOverdue ? 'bg-red-50/40 dark:bg-red-900/5' : ''}`}>
                    <td className="px-5 py-4">
                      <div>
                        <Link to={`/inquiries/${inq.id}`} className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                          {inq.first_name} {inq.last_name}
                        </Link>
                        {inq.ndis_number && (
                          <p className="text-xs text-slate-400">NDIS: {inq.ndis_number}</p>
                        )}
                        <div className="mt-1 flex items-center gap-3">
                          {inq.phone && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <HiPhone className="h-3 w-3" /> {inq.phone}
                            </span>
                          )}
                          {inq.email && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <HiEnvelope className="h-3 w-3" /> {inq.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 dark:bg-[#1e2d4a] px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {inq.service_type || '--'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {inq.referral_source || '--'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(inq.inquiry_date)}
                    </td>
                    <td className="px-5 py-4">
                      {inq.next_follow_up ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          isOverdue ? 'text-red-600 dark:text-red-400' :
                          fuStatus === 'soon' ? 'text-amber-600 dark:text-amber-400' :
                          'text-slate-500 dark:text-slate-400'
                        }`}>
                          {isOverdue && <HiBellAlert className="h-3.5 w-3.5" />}
                          {formatDate(inq.next_follow_up)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {inq.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium ${PRIORITY_CONFIG[inq.priority] || PRIORITY_CONFIG.Normal}`}>
                        {inq.priority || 'Normal'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/inquiries/${inq.id}`}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500"
                          title="View"
                        >
                          <HiArrowTopRightOnSquare className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => { setEditInquiry(inq); setModalOpen(true); }}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(inq)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                          title="Delete"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditInquiry(null); }}
        inquiry={editInquiry}
        onSaved={() => { setModalOpen(false); setEditInquiry(null); loadInquiries(); }}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-[#162036] p-8 shadow-xl animate-modal-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <HiExclamationTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Inquiry</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete the inquiry for <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 dark:border-[#263554] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : <><HiTrash className="h-4 w-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-5 py-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
