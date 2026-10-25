import { useState, useEffect } from 'react';
import {
  HiKey,
  HiPlus,
  HiMagnifyingGlass,
  HiUserGroup,
  HiShieldCheck,
  HiPencilSquare,
  HiTrash,
  HiUserCircle,
  HiArrowPath,
  HiClipboard,
  HiCheck,
} from 'react-icons/hi2';
import { fetchAllUsers, signupUser, updateUser, updateUserRole, deleteUser, resetUserPassword } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  PageHeader,
  Badge,
  EmptyState,
  FormInput,
  FormSelect,
  FormRow,
} from '../components/ui/FormComponents';
import Modal, {
  ModalBody,
  ModalFooter,
  ButtonPrimary,
  ButtonSecondary,
  ButtonDanger,
  ModalError,
} from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Skeleton';

const ROLE_CONFIG = {
  admin: { label: 'Admin', variant: 'danger', description: 'Full access to all features' },
  manager: { label: 'Manager', variant: 'info', description: 'Access to most features except staff accounts' },
  staff: { label: 'Staff', variant: 'default', description: 'Limited access — progress notes, participants, time clock' },
};

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export default function StaffAccounts() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', full_name: '', role: 'staff' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Edit user modal
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('staff');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete modal
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Reset password modal
  /*  Which credential has just been copied, so the button can show a tick.
   *  This state was missing entirely while both the handler and the JSX used
   *  it — so the reset-password modal threw a ReferenceError ON RENDER and
   *  took the page down at the moment an admin had just been shown a new
   *  password they had not copied yet. */
  const [copiedId, setCopiedId] = useState(null);

  const [resetUser, setResetUser] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  function loadUsers() {
    setLoading(true);
    setError(null);
    fetchAllUsers(token)
      .then((data) => {
        setUsers(data.profiles || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, [token]);

  // Filter users
  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  // Stats
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const managerCount = users.filter((u) => u.role === 'manager').length;
  const staffCount = users.filter((u) => u.role === 'staff').length;

  // ─── Handlers ──────────────────────────────────────────────

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await signupUser(createForm.email, createForm.password, createForm.full_name, createForm.role);
      setCreateOpen(false);
      setCreateForm({ email: '', password: '', full_name: '', role: 'staff' });
      loadUsers();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function openEditModal(user) {
    setEditUser(user);
    setEditName(user.full_name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'staff');
    setEditError(null);
  }

  async function handleUpdateUser() {
    if (!editUser) return;
    setUpdating(true);
    setEditError(null);
    try {
      await updateUser(token, editUser.id, {
        full_name: editName,
        email: editEmail,
        role: editRole,
      });
      setEditUser(null);
      loadUsers();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser(token, deleteConfirm.id);
      setDeleteConfirm(null);
      loadUsers();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function openResetModal(user) {
    const pw = generatePassword();
    setResetUser(user);
    setResetPw(pw);
    setResetError(null);
    setResetSuccess(false);
  }

  async function handleResetPassword() {
    if (!resetUser) return;
    setResetting(true);
    setResetError(null);
    try {
      await resetUserPassword(token, resetUser.id, resetPw);
      setResetSuccess(true);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetting(false);
    }
  }

  async function copyToClipboard(text, id) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* fallback silently */ }
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Staff Accounts"
        subtitle="Manage user accounts, credentials, and permissions"
        actions={
          <button
            onClick={() => {
              setCreateOpen(true);
              setCreateError(null);
              setCreateForm((f) => ({ ...f, password: generatePassword() }));
            }}
            className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
          >
            <HiPlus className="h-4 w-4" />
            Create Account
          </button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={HiUserGroup} label="Total Users" value={totalUsers} color="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400" />
        <StatCard icon={HiShieldCheck} label="Admins" value={adminCount} color="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" />
        <StatCard icon={HiKey} label="Managers" value={managerCount} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" />
        <StatCard icon={HiUserCircle} label="Staff" value={staffCount} color="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2.5 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ─── Accounts List ─── */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HiUserGroup}
          title="No accounts found"
          description={search ? 'Try adjusting your search' : 'Create the first staff account'}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036]">
              {/* Desktop table */}
              <table className="hidden sm:table w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#263554]">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                  {filtered.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.staff;
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500/10 text-accent-500 text-sm font-semibold">
                              {(user.full_name || '?')[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {user.full_name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {user.email}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={roleConfig.variant}>
                            {roleConfig.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-400 dark:text-slate-500">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString('en-AU', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '--'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openResetModal(user)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400"
                              title="Reset password"
                            >
                              <HiArrowPath className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
                              title="Edit user"
                            >
                              <HiPencilSquare className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setDeleteConfirm(user); setDeleteError(null); }}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                              title="Delete account"
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

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-slate-100 dark:divide-[#263554]">
                {filtered.map((user) => {
                  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.staff;
                  return (
                    <div key={user.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500/10 text-accent-500 text-sm font-semibold">
                            {(user.full_name || '?')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{user.full_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                        <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openResetModal(user)} className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400" title="Reset password">
                          <HiArrowPath className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEditModal(user)} className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400" title="Edit user">
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setDeleteConfirm(user); setDeleteError(null); }} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400" title="Delete account">
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
        </div>
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Showing {filtered.length} of {totalUsers} account{totalUsers !== 1 ? 's' : ''}
        </p>
      )}

      {/* ─── Create Account Modal ─── */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Staff Account"
        icon={HiPlus}
        size="md"
      >
        <form onSubmit={handleCreate}>
          <ModalBody>
            <ModalError message={createError} />
            <div className="space-y-5">
              <FormInput
                label="Full Name"
                required
                type="text"
                value={createForm.full_name}
                onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="e.g. Jane Smith"
              />
              <FormInput
                label="Email"
                required
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@onelifefoundation.com"
              />
              <div>
                <FormInput
                  label="Password"
                  required
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  hint="This password will be stored and visible in the Credentials tab"
                />
                <button
                  type="button"
                  onClick={() => setCreateForm((f) => ({ ...f, password: generatePassword() }))}
                  className="mt-1.5 text-xs text-accent-500 hover:text-accent-600 font-medium"
                >
                  Generate new password
                </button>
              </div>
              <FormSelect
                label="Role"
                required
                value={createForm.role}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </FormSelect>

              {/* Role description */}
              <div className="rounded-lg bg-slate-50 dark:bg-[#0c1425] p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {ROLE_CONFIG[createForm.role]?.label} Role
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {ROLE_CONFIG[createForm.role]?.description}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={() => setCreateOpen(false)}>Cancel</ButtonSecondary>
            <ButtonPrimary type="submit" loading={creating}>
              Create Account
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── Edit User Modal ─── */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        icon={HiPencilSquare}
        size="md"
      >
        <ModalBody>
          <ModalError message={editError} />
          <div className="space-y-5">
            <FormInput
              label="Full Name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Jane Smith"
            />
            <FormInput
              label="Email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="jane@example.com"
            />
            <FormSelect
              label="Role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </FormSelect>

            <div className="rounded-lg bg-slate-50 dark:bg-[#0c1425] p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {ROLE_CONFIG[editRole]?.label} Role
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {ROLE_CONFIG[editRole]?.description}
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setEditUser(null)}>Cancel</ButtonSecondary>
          <ButtonPrimary onClick={handleUpdateUser} loading={updating}>
            Save Changes
          </ButtonPrimary>
        </ModalFooter>
      </Modal>

      {/* ─── Reset Password Modal ─── */}
      <Modal
        isOpen={!!resetUser}
        onClose={() => setResetUser(null)}
        title="Reset Password"
        icon={HiArrowPath}
        size="sm"
      >
        <ModalBody>
          <ModalError message={resetError} />
          {resetSuccess ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Password reset successfully</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">New login details for {resetUser?.full_name}:</p>
                <div className="rounded-lg bg-slate-50 dark:bg-[#0c1425] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Email</span>
                    <code className="text-sm font-mono text-slate-700 dark:text-slate-300">{resetUser?.email}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Password</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-slate-700 dark:text-slate-300">{resetPw}</code>
                      <button
                        onClick={() => copyToClipboard(resetPw, 'reset')}
                        className={`rounded p-1 ${copiedId === 'reset' ? 'text-green-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        {copiedId === 'reset' ? <HiCheck className="h-3.5 w-3.5" /> : <HiClipboard className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Reset password for <span className="font-semibold">{resetUser?.full_name}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">{resetUser?.email}</p>
              </div>
              <div>
                <FormInput
                  label="New Password"
                  required
                  type="text"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setResetPw(generatePassword())}
                  className="mt-1.5 text-xs text-accent-500 hover:text-accent-600 font-medium"
                >
                  Generate new password
                </button>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {resetSuccess ? (
            <ButtonPrimary onClick={() => setResetUser(null)}>Done</ButtonPrimary>
          ) : (
            <>
              <ButtonSecondary onClick={() => setResetUser(null)}>Cancel</ButtonSecondary>
              <ButtonPrimary onClick={handleResetPassword} loading={resetting}>
                Reset Password
              </ButtonPrimary>
            </>
          )}
        </ModalFooter>
      </Modal>

      {/* ─── Delete Confirmation ─── */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User Account"
        icon={HiTrash}
        iconColor="text-red-500"
        size="sm"
      >
        <ModalBody>
          <ModalError message={deleteError} />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to permanently delete the account for{' '}
            <span className="font-semibold">{deleteConfirm?.full_name}</span>?
          </p>
          <p className="mt-2 text-xs text-slate-400">
            This will remove the user from authentication and delete their profile. This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteConfirm(null)}>Cancel</ButtonSecondary>
          <ButtonDanger onClick={handleDelete} loading={deleting}>Delete Account</ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── Stat Card (local) ──────────────────────────────────────────────────────

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
