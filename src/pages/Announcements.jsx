import { useState, useEffect, useCallback } from 'react';
import {
  HiPlus,
  HiMegaphone,
  HiPencilSquare,
  HiTrash,
  HiExclamationTriangle,
  HiCalendarDays,
  HiUser,
  HiMapPin,
} from 'react-icons/hi2';
import { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, formatDate } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from '../components/ui/Modal';
import { PageHeader, Badge, EmptyState, FormInput, FormSelect, FormTextarea, FormRow } from '../components/ui/FormComponents';
import { SkeletonGrid } from '../components/ui/Skeleton';

const PRIORITY_BADGE = {
  normal: 'default',
  important: 'warning',
  urgent: 'danger',
};

const PRIORITY_LABELS = {
  normal: 'Normal',
  important: 'Important',
  urgent: 'Urgent',
};

const TARGET_LABELS = {
  all: 'All Staff',
  admin: 'Admin',
  manager: 'Managers',
  staff: 'Staff',
};

const EMPTY_FORM = {
  title: '',
  content: '',
  priority: 'normal',
  target_audience: 'all',
  pinned: false,
  expires_at: '',
  author: 'Admin',
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // ─── Modal open / close ───────────────────────────────────────────────────

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(ann) {
    setEditTarget(ann);
    setForm({
      title: ann.title || '',
      content: ann.content || '',
      priority: ann.priority || 'normal',
      target_audience: ann.target_audience || 'all',
      pinned: !!ann.pinned,
      expires_at: ann.expires_at ? ann.expires_at.slice(0, 10) : '',
      author: ann.author || 'Admin',
    });
    setSaveError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setSaveError(null);
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        target_audience: form.target_audience,
        pinned: form.pinned,
        expires_at: form.expires_at || null,
        author: form.author || 'Admin',
      };
      if (editTarget) {
        await updateAnnouncement(editTarget.id, payload);
      } else {
        await createAnnouncement(payload);
      }
      closeModal();
      loadAnnouncements();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Pin / Unpin ──────────────────────────────────────────────────────────

  async function handleTogglePin(ann) {
    try {
      await updateAnnouncement(ann.id, { pinned: !ann.pinned });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, pinned: !a.pinned } : a))
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAnnouncement(deleteTarget.id);
      setDeleteTarget(null);
      loadAnnouncements();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Read more toggle ────────────────────────────────────────────────────

  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ─── Derived data ─────────────────────────────────────────────────────────

  const pinned = announcements.filter((a) => a.pinned);
  const all = [...announcements].sort((a, b) => {
    // Pinned first, then by created_at desc
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Announcements"
        subtitle="Company notices and updates"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
          >
            <HiPlus className="h-4 w-4" />
            New Announcement
          </button>
        }
      />

      {/* Loading */}
      {loading ? (
        <SkeletonGrid count={3} />
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadAnnouncements}
            className="mt-2 text-sm font-medium text-red-600 underline"
          >
            Retry
          </button>
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={HiMegaphone}
          title="No announcements yet"
          description="Post your first announcement to keep the team informed"
          action={
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
            >
              <HiPlus className="h-4 w-4" />
              New Announcement
            </button>
          }
        />
      ) : (
        <>
          {/* Pinned Announcements */}
          {pinned.length > 0 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <HiMapPin className="h-4 w-4 text-highlight-400" />
                Pinned
              </h2>
              <div className="space-y-4">
                {pinned.map((ann) => (
                  <AnnouncementCard
                    key={`pinned-${ann.id}`}
                    announcement={ann}
                    isPinSection
                    expanded={expandedIds.has(ann.id)}
                    onToggleExpand={() => toggleExpand(ann.id)}
                    onEdit={() => openEdit(ann)}
                    onTogglePin={() => handleTogglePin(ann)}
                    onDelete={() => { setDeleteTarget(ann); setDeleteError(null); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Announcements */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              All Announcements ({announcements.length})
            </h2>
            <div className="space-y-4">
              {all.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  announcement={ann}
                  expanded={expandedIds.has(ann.id)}
                  onToggleExpand={() => toggleExpand(ann.id)}
                  onEdit={() => openEdit(ann)}
                  onTogglePin={() => handleTogglePin(ann)}
                  onDelete={() => { setDeleteTarget(ann); setDeleteError(null); }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Announcement' : 'New Announcement'}
        icon={HiMegaphone}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <ModalBody>
            <div className="space-y-6">
              <ModalError message={saveError} />

              <FormInput
                label="Title"
                required
                placeholder="Announcement title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />

              <FormTextarea
                label="Content"
                required
                rows={6}
                placeholder="Write your announcement..."
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />

              <FormRow>
                <FormSelect
                  label="Priority"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </FormSelect>

                <FormSelect
                  label="Target Audience"
                  value={form.target_audience}
                  onChange={(e) => setForm((f) => ({ ...f, target_audience: e.target.value }))}
                >
                  <option value="all">All Staff</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Managers</option>
                  <option value="staff">Staff</option>
                </FormSelect>
              </FormRow>

              <FormRow>
                <div className="flex items-center gap-3 pt-7">
                  <input
                    type="checkbox"
                    id="pinned-checkbox"
                    checked={form.pinned}
                    onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 dark:border-[#334766] text-accent-500 focus:ring-accent-500"
                  />
                  <label htmlFor="pinned-checkbox" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Pin this announcement
                  </label>
                </div>

                <FormInput
                  label="Expires"
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                  hint="Leave empty for no expiry"
                />
              </FormRow>
            </div>
          </ModalBody>

          <ModalFooter>
            <ButtonSecondary onClick={closeModal} disabled={saving}>
              Cancel
            </ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>
              {saving ? 'Saving...' : editTarget ? 'Update Announcement' : 'Post Announcement'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Announcement"
        icon={HiTrash}
        iconColor="text-red-600"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Are you sure you want to delete <span className="font-semibold">{deleteTarget?.title}</span>?
          </p>

          {/* Inline red warning box */}
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
            <HiExclamationTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">This action cannot be undone</p>
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400/70">
                The announcement will be permanently removed for all staff.
              </p>
            </div>
          </div>

          <ModalError message={deleteError} />
        </div>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </ButtonSecondary>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── Announcement Card ───────────────────────────────────────────────────────

function AnnouncementCard({ announcement: ann, isPinSection, expanded, onToggleExpand, onEdit, onTogglePin, onDelete }) {
  const isExpired = ann.expires_at && new Date(ann.expires_at) < new Date();

  return (
    <div
      className={`rounded-xl border bg-white dark:bg-[#162036] transition-all hover:shadow-md ${
        isPinSection
          ? 'border-l-4 border-highlight-400 border-t-slate-200 dark:border-t-[#263554] border-r-slate-200 dark:border-r-[#263554] border-b-slate-200 dark:border-b-[#263554]'
          : 'border-slate-200 dark:border-[#263554]'
      } ${isExpired ? 'opacity-60' : ''}`}
    >
      <div className="p-6">
        {/* Top row: title + badges */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {ann.pinned && (
                <HiMapPin className="h-4 w-4 flex-shrink-0 text-highlight-400" />
              )}
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {ann.title}
              </h3>
              <Badge variant={PRIORITY_BADGE[ann.priority] || 'default'}>
                {PRIORITY_LABELS[ann.priority] || 'Normal'}
              </Badge>
              {ann.target_audience && ann.target_audience !== 'all' && (
                <Badge variant="info">
                  {TARGET_LABELS[ann.target_audience] || ann.target_audience}
                </Badge>
              )}
              {isExpired && (
                <Badge variant="danger">Expired</Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-300"
              title="Edit"
            >
              <HiPencilSquare className="h-4 w-4" />
            </button>
            <button
              onClick={onTogglePin}
              className={`rounded-lg p-2 transition-colors ${
                ann.pinned
                  ? 'text-highlight-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title={ann.pinned ? 'Unpin' : 'Pin'}
            >
              <HiMapPin className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
              title="Delete"
            >
              <HiTrash className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-3">
          <p
            className={`text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap ${
              !expanded ? 'line-clamp-4' : ''
            }`}
          >
            {ann.content}
          </p>
          {ann.content && ann.content.split('\n').length > 4 && (
            <button
              onClick={onToggleExpand}
              className="mt-1 text-xs font-medium text-accent-500 hover:text-accent-600 transition-colors"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Footer: author + date + expiry */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 dark:border-[#263554] pt-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <HiUser className="h-3.5 w-3.5" />
            <span>{ann.author || 'Admin'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <HiCalendarDays className="h-3.5 w-3.5" />
            <span>{formatDate(ann.created_at)}</span>
          </div>
          {ann.expires_at && (
            <div className={`flex items-center gap-1.5 text-xs ${isExpired ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <HiExclamationTriangle className="h-3.5 w-3.5" />
              <span>{isExpired ? 'Expired' : 'Expires'} {formatDate(ann.expires_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
