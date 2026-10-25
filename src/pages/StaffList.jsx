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
  HiClipboardDocumentList,
} from 'react-icons/hi2';
import { fetchStaff, fetchBulkOnboardingProgress } from '../lib/api';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';
import AddStaffModal from '../components/AddStaffModal';

// ─── Role Categories ─────────────────────────────────────────────────────────
const ADMIN_ROLES = ['Admin', 'Manager', 'Operations Manager', 'General Manager', 'Director', 'Coordinator', 'Team Leader'];
const SUPPORT_ROLES = ['Support Worker', 'Nurse', 'Allied Health'];

function getRoleCategory(role, positionType) {
  const pt = (positionType || '').toLowerCase();
  if (pt === 'contractor' || pt === 'contract') return 'contractor';
  if (ADMIN_ROLES.includes(role)) return 'admin';
  return 'support';
}

const ROLE_FILTERS = [
  { key: 'all', label: 'All Roles' },
  { key: 'support', label: 'Employees' },
  { key: 'contractor', label: 'Contractors' },
  { key: 'admin', label: 'Admin & Management' },
];

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState({});

  function loadStaff() {
    setLoading(true);
    setError(null);
    fetchStaff(filter === 'all' ? undefined : filter)
      .then((data) => {
        const staffData = data.staff || data || [];
        setStaff(staffData);
        // Fetch onboarding progress for onboarding staff
        const onboardingIds = staffData.filter(s => s.status === 'onboarding').map(s => s.id);
        if (onboardingIds.length > 0) {
          fetchBulkOnboardingProgress(onboardingIds)
            .then(setOnboardingProgress)
            .catch(() => {});
        } else {
          setOnboardingProgress({});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStaff();
  }, [filter]);

  const filtered = staff.filter((s) => {
    // Role category filter
    if (roleFilter !== 'all') {
      const cat = getRoleCategory(s.role, s.position_type);
      if (cat !== roleFilter) return false;
    }
    // Search filter
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return name.includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  // Group filtered staff by role category
  const supportStaff = filtered.filter(s => getRoleCategory(s.role, s.position_type) === 'support');
  const contractorStaff = filtered.filter(s => getRoleCategory(s.role, s.position_type) === 'contractor');
  const adminStaff = filtered.filter(s => getRoleCategory(s.role, s.position_type) === 'admin');

  const total = staff.length;
  const onboardingCount = staff.filter((s) => s.status === 'onboarding').length;
  const compliant = staff.filter((s) => s.compliance?.is_fully_compliant).length;
  const expiring = staff.filter((s) => !s.compliance?.is_fully_compliant && s.compliance?.docs_expiring > 0 && s.compliance?.docs_expired === 0).length;
  const nonCompliant = staff.filter((s) => !s.compliance?.is_fully_compliant && (s.compliance?.docs_expired > 0 || (s.compliance?.docs_uploaded || 0) < (s.compliance?.total_required || 0))).length;

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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {loading ? (
          [...Array(5)].map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard icon={HiUserGroup} label="Total Staff" value={total} color="bg-blue-50 dark:bg-blue-900/30 text-brand-500" />
            <StatCard icon={HiClipboardDocumentList} label="Onboarding" value={onboardingCount} color="bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500" />
            <StatCard icon={HiCheckCircle} label="Compliant" value={compliant} color="bg-green-50 dark:bg-green-900/30 text-accent-500" />
            <StatCard icon={HiExclamationTriangle} label="Expiring Soon" value={expiring} color="bg-amber-50 dark:bg-amber-900/30 text-amber-500" />
            <StatCard icon={HiXCircle} label="Non-Compliant" value={nonCompliant} color="bg-red-50 dark:bg-red-900/30 text-red-500" />
          </>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filters */}
          <div className="flex gap-1.5">
            {['all', 'active', 'onboarding', 'inactive'].map((opt) => (
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

          {/* Divider */}
          <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-[#334766]" />

          {/* Role category filters */}
          <div className="flex gap-1.5">
            {ROLE_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRoleFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  roleFilter === key
                    ? 'bg-brand-500 text-white'
                    : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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
      ) : roleFilter === 'all' ? (
        /* Grouped view when showing all roles */
        <div className="space-y-8">
          {supportStaff.length > 0 && (
            <StaffSection
              title="Employees"
              subtitle={`${supportStaff.length} staff`}
              color="bg-blue-500"
              staff={supportStaff}
            />
          )}
          {contractorStaff.length > 0 && (
            <StaffSection
              title="Contractors"
              subtitle={`${contractorStaff.length} contractors`}
              color="bg-amber-500"
              staff={contractorStaff}
            />
          )}
          {adminStaff.length > 0 && (
            <StaffSection
              title="Admin & Management"
              subtitle={`${adminStaff.length} staff`}
              color="bg-purple-500"
              staff={adminStaff}
            />
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <StaffCard key={member.id} member={member} onboardingProgress={onboardingProgress[member.id]} />
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

function StaffCard({ member, onboardingProgress }) {
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
              : status === 'onboarding'
              ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400'
              : status === 'resigned'
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
              : status === 'terminated'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-500 dark:text-slate-400'
          }`}
        >
          {status}
        </span>
      </div>

      {member.department && (
        <p className="mt-3 text-xs text-slate-400">{member.department}</p>
      )}

      {status === 'onboarding' && onboardingProgress ? (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-cyan-600 dark:text-cyan-400">Onboarding</span>
            <span className="text-slate-500 dark:text-slate-400">{onboardingProgress.completed}/{onboardingProgress.total} ({onboardingProgress.percent}%)</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1e2d4a]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${onboardingProgress.percent === 100 ? 'bg-accent-500' : 'bg-cyan-500'}`}
              style={{ width: `${onboardingProgress.percent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className={`mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${comp.bg}`}>
          <CompIcon className={`h-4 w-4 ${comp.color}`} />
          <span className={`text-xs font-medium ${comp.color}`}>{comp.text}</span>
          {member.docs_valid !== undefined && (
            <span className="ml-auto text-xs text-slate-400">
              {member.docs_valid}/{member.docs_required || 12} docs
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

// ─── Grouped Section ──────────────────────────────────────────────────────────

function StaffSection({ title, subtitle, color, staff }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <StaffCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
