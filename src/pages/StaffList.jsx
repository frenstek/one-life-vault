import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiUserGroup,
  HiShieldCheck,
  HiExclamationTriangle,
  HiXCircle,
  HiPlus,
  HiMagnifyingGlass,
  HiCheckCircle,
} from 'react-icons/hi2';
import { fetchStaff } from '../lib/api';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';
import AddStaffModal from '../components/AddStaffModal';

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  function loadStaff() {
    setLoading(true);
    setError(null);
    fetchStaff(filter === 'all' ? undefined : filter)
      .then((data) => {
        setStaff(data.staff || data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStaff();
  }, [filter]);

  const filtered = staff.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return name.includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  const total = staff.length;
  const compliant = staff.filter((s) => s.compliance_status === 'compliant').length;
  const expiring = staff.filter((s) => s.compliance_status === 'expiring').length;
  const nonCompliant = staff.filter(
    (s) => s.compliance_status === 'non_compliant' || s.compliance_status === 'expired'
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your team and compliance documents</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
        >
          <HiPlus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard icon={HiUserGroup} label="Total Staff" value={total} color="bg-blue-50 dark:bg-blue-900/30 text-brand-500" />
            <StatCard icon={HiCheckCircle} label="Compliant" value={compliant} color="bg-green-50 dark:bg-green-900/30 text-accent-500" />
            <StatCard icon={HiExclamationTriangle} label="Expiring Soon" value={expiring} color="bg-amber-50 dark:bg-amber-900/30 text-amber-500" />
            <StatCard icon={HiXCircle} label="Non-Compliant" value={nonCompliant} color="bg-red-50 dark:bg-red-900/30 text-red-500" />
          </>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
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
            placeholder="Search by name..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <HiUserGroup className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {search ? 'No staff matching your search.' : 'No staff members found.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <StaffCard key={member.id} member={member} />
          ))}
        </div>
      )}

      <AddStaffModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          loadStaff();
        }}
      />
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

function StaffCard({ member }) {
  const status = member.status || 'active';
  const compliance = member.compliance_status || 'unknown';

  const complianceConfig = {
    compliant: { icon: HiShieldCheck, text: 'Compliant', color: 'text-accent-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    expiring: { icon: HiExclamationTriangle, text: 'Expiring', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    non_compliant: { icon: HiXCircle, text: 'Non-Compliant', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    expired: { icon: HiXCircle, text: 'Expired', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    unknown: { icon: HiShieldCheck, text: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-[#1e2d4a]' },
  };

  const comp = complianceConfig[compliance] || complianceConfig.unknown;
  const CompIcon = comp.icon;

  return (
    <Link
      to={`/staff/${member.id}`}
      className="group flex flex-col rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500/10 text-accent-500 font-semibold text-sm">
            {(member.first_name || '?')[0]}
            {(member.last_name || '?')[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-accent-500">
              {member.first_name} {member.last_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{member.role || 'Staff'}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
            status === 'active'
              ? 'bg-green-50 dark:bg-green-900/20 text-accent-500'
              : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-500 dark:text-slate-400'
          }`}
        >
          {status}
        </span>
      </div>

      {member.department && (
        <p className="mt-3 text-xs text-slate-400">{member.department}</p>
      )}

      <div className={`mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${comp.bg}`}>
        <CompIcon className={`h-4 w-4 ${comp.color}`} />
        <span className={`text-xs font-medium ${comp.color}`}>{comp.text}</span>
        {member.docs_valid !== undefined && (
          <span className="ml-auto text-xs text-slate-400">
            {member.docs_valid}/{member.docs_required || 12} docs
          </span>
        )}
      </div>
    </Link>
  );
}
