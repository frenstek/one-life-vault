import { useState, useEffect } from 'react';
import {
  HiOutlineShieldCheck,
  HiOutlineHome,
  HiOutlineFolder,
  HiOutlineUsers,
  HiOutlineClipboardDocument,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineBanknotes,
  HiOutlineHomeModern,
  HiOutlineCalendarDays,
  HiOutlineExclamationTriangle,
  HiOutlineMegaphone,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCog6Tooth,
  HiOutlineTableCells,
  HiCheckCircle,
} from 'react-icons/hi2';
import { fetchPermissions, updatePermission } from '../lib/api';
import { PageHeader } from '../components/ui/FormComponents';
import { SkeletonBlock } from '../components/ui/Skeleton';

const FEATURES = [
  { id: 'dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { id: 'documents', label: 'Documents', icon: HiOutlineFolder },
  { id: 'participants', label: 'Participants', icon: HiOutlineUsers },
  { id: 'progress-notes', label: 'Progress Notes', icon: HiOutlineClipboardDocument },
  { id: 'time-clock', label: 'Time Clock', icon: HiOutlineClock },
  { id: 'staff-directory', label: 'Staff Directory', icon: HiOutlineUserGroup },
  { id: 'invoices', label: 'Invoices', icon: HiOutlineDocumentText },
  { id: 'staff-payslips', label: 'Staff Payslips', icon: HiOutlineBanknotes },
  { id: 'properties', label: 'Properties', icon: HiOutlineHomeModern },
  { id: 'shift-roster', label: 'Shift Roster', icon: HiOutlineCalendarDays },
  { id: 'incidents', label: 'Incidents', icon: HiOutlineExclamationTriangle },
  { id: 'announcements', label: 'Announcements', icon: HiOutlineMegaphone },
  { id: 'tasks', label: 'Tasks', icon: HiOutlineClipboardDocumentCheck },
  { id: 'staff-accounts', label: 'Staff Accounts', icon: HiOutlineCog6Tooth },
  { id: 'roster-of-care', label: 'Roster of Care', icon: HiOutlineTableCells },
];

const ROLES = [
  { id: 'admin', label: 'Admin', color: 'text-red-500 dark:text-red-400' },
  { id: 'manager', label: 'Manager', color: 'text-blue-500 dark:text-blue-400' },
  { id: 'staff', label: 'Staff', color: 'text-slate-500 dark:text-slate-400' },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
        dark:focus:ring-offset-[#162036]
        ${checked ? 'bg-teal-600' : 'bg-stone-300 dark:bg-stone-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
          ring-0 transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export default function Permissions() {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({}); // { 'role:feature': true }
  const [saved, setSaved] = useState({}); // { 'role:feature': true } for success flash

  useEffect(() => {
    loadPermissions();
  }, []);

  function loadPermissions() {
    setLoading(true);
    setError(null);
    fetchPermissions()
      .then(setPermissions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleToggle(role, feature, newValue) {
    const key = `${role}:${feature}`;

    // Optimistic update
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [feature]: newValue },
    }));

    setSaving((prev) => ({ ...prev, [key]: true }));

    try {
      await updatePermission(role, feature, newValue);
      // Show saved indicator
      setSaved((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 1500);
    } catch (err) {
      // Revert on failure
      setPermissions((prev) => ({
        ...prev,
        [role]: { ...prev[role], [feature]: !newValue },
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Role Permissions" subtitle="Configure access for each role" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-14" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader title="Role Permissions" subtitle="Configure access for each role" />
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load permissions: {error}</p>
          <button onClick={loadPermissions} className="mt-3 text-sm font-medium text-teal-600 hover:text-teal-500">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Role Permissions"
        subtitle="Configure which features each role can access"
        actions={
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <HiOutlineShieldCheck className="h-4 w-4" />
            <span>Admin always has full access</span>
          </div>
        }
      />

      {/* Permissions table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036]">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_100px_100px_100px] sm:grid-cols-[1fr_120px_120px_120px] items-center border-b border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#1a2744] px-4 sm:px-6 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Feature
          </div>
          {ROLES.map((role) => (
            <div key={role.id} className={`text-center text-xs font-semibold uppercase tracking-wider ${role.color}`}>
              {role.label}
            </div>
          ))}
        </div>

        {/* Feature rows */}
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          const isLast = idx === FEATURES.length - 1;

          return (
            <div
              key={feature.id}
              className={`grid grid-cols-[1fr_100px_100px_100px] sm:grid-cols-[1fr_120px_120px_120px] items-center px-4 sm:px-6 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-[#1a2744]/50 ${
                !isLast ? 'border-b border-slate-100 dark:border-[#263554]/60' : ''
              }`}
            >
              {/* Feature name */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1e2d4a]">
                  <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {feature.label}
                </span>
              </div>

              {/* Role toggles */}
              {ROLES.map((role) => {
                const key = `${role.id}:${feature.id}`;
                const isAdmin = role.id === 'admin';
                const isChecked = isAdmin ? true : (permissions?.[role.id]?.[feature.id] ?? false);
                const isSaved = saved[key];

                return (
                  <div key={role.id} className="flex items-center justify-center gap-1.5">
                    {isSaved && (
                      <HiCheckCircle className="h-4 w-4 text-teal-500 animate-in fade-in" />
                    )}
                    <div className="relative group">
                      <Toggle
                        checked={isChecked}
                        onChange={(val) => handleToggle(role.id, feature.id, val)}
                        disabled={isAdmin}
                      />
                      {isAdmin && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="rounded-lg bg-slate-900 dark:bg-slate-700 px-3 py-1.5 text-xs text-white whitespace-nowrap shadow-lg">
                            Admin always has full access
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5">
        <div className="flex items-start gap-3">
          <HiOutlineShieldCheck className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              How permissions work
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Changes take effect immediately. When a feature is disabled for a role, users with that role
              will not see the feature in the sidebar and cannot access it directly. Admin users always have
              full access and cannot be restricted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
