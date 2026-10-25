import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  HiAcademicCap,
  HiArrowUpTray,
  HiDocumentText,
  HiPhoto,
  HiPresentationChartBar,
  HiFilm,
  HiMagnifyingGlass,
  HiXMark,
  HiArrowDownTray,
  HiTrash,
  HiEye,
  HiFunnel,
  HiBookOpen,
  HiMapPin,
  HiClipboardDocumentList,
  HiCog6Tooth,
  HiShieldCheck,
  HiArrowPath,
} from 'react-icons/hi2';

const RESOURCE_CATEGORIES = [
  { id: 'user-guides', label: 'User Guides', icon: HiBookOpen, color: 'blue' },
  { id: 'flowcharts', label: 'Flowcharts', icon: HiMapPin, color: 'purple' },
  { id: 'procedures', label: 'Procedures', icon: HiClipboardDocumentList, color: 'emerald' },
  { id: 'system-guides', label: 'System Guides', icon: HiCog6Tooth, color: 'amber' },
  { id: 'compliance', label: 'Compliance Training', icon: HiShieldCheck, color: 'red' },
  { id: 'other', label: 'Other', icon: HiDocumentText, color: 'slate' },
];

const CATEGORY_COLORS = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500', badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-500', badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', icon: 'text-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500', badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' },
  red: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800', icon: 'text-red-500', badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-800/30', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', icon: 'text-slate-500', badge: 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300' },
};

function getFileIcon(fileType) {
  const ft = (fileType || '').toLowerCase();
  if (['pdf', 'doc', 'docx', 'txt'].includes(ft)) return HiDocumentText;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ft)) return HiPhoto;
  if (['ppt', 'pptx'].includes(ft)) return HiPresentationChartBar;
  if (['mp4', 'mov', 'webm'].includes(ft)) return HiFilm;
  return HiDocumentText;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TrainingHub() {
  const { isAdmin, isManager, profile } = useAuth();
  const isAdminOrManager = isAdmin || isManager;

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('user-guides');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => { loadResources(); }, []);

  async function loadResources() {
    setLoading(true);
    try {
      const res = await fetch('/api/docs?action=list&category=Training%20Resources');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setResources(data.documents || []);
    } catch (err) {
      console.error('Failed to load training resources:', err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      const fileData = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(uploadFile);
      });

      const body = {
        action: 'upload',
        fileName: uploadFile.name,
        fileData,
        category: 'Training Resources',
        subcategory: uploadCategory,
      };

      // Store title and description in the document name or as metadata
      if (uploadTitle && uploadTitle !== uploadFile.name) {
        // Prefix with title for display
        body.fileName = uploadFile.name;
      }

      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      // If we have a title or description, update the document metadata
      const result = await res.json();
      if (result.document && (uploadTitle || uploadDescription)) {
        await fetch('/api/docs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: result.document.id,
            name: uploadTitle || uploadFile.name,
            description: uploadDescription || undefined,
          }),
        });
      }

      showToast('Resource uploaded successfully');
      setShowUpload(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadCategory('user-guides');
      loadResources();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc) {
    try {
      const res = await fetch(`/api/docs?id=${doc.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Resource deleted');
      setDeleteConfirm(null);
      loadResources();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleView(doc) {
    const ext = (doc.file_type || '').toLowerCase();
    if (ext === 'pdf' || ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
      const url = `/api/docs-download?path=${encodeURIComponent(doc.storage_path)}`;
      setPreviewUrl(url);
    } else if (['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext)) {
      const publicUrl = `https://czdlemutsimvwfpwylxh.supabase.co/storage/v1/object/public/documents/${encodeURIComponent(doc.storage_path).replace(/%2F/g, '/')}`;
      window.open(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicUrl)}`, '_blank');
    } else {
      handleDownload(doc);
    }
  }

  function handleDownload(doc) {
    const url = `/api/docs-download?path=${encodeURIComponent(doc.storage_path)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
  }

  // Filter and search
  const filtered = resources.filter(doc => {
    const matchesSearch = !search || doc.name?.toLowerCase().includes(search.toLowerCase()) || doc.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'all' || doc.subcategory === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Group by subcategory for display
  const getCategoryInfo = (subcategory) => RESOURCE_CATEGORIES.find(c => c.id === subcategory) || RESOURCE_CATEGORIES[RESOURCE_CATEGORIES.length - 1];

  // Count per category
  const categoryCounts = RESOURCE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = resources.filter(r => r.subcategory === cat.id).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg text-sm font-medium flex items-center gap-2 animate-[slideIn_0.2s_ease] ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <HiAcademicCap className="h-7 w-7 text-[#0F528A]" />
              Training Hub
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              User guides, flowcharts, and training resources for staff
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadResources}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <HiArrowPath className="h-4 w-4" />
              Refresh
            </button>
            {isAdminOrManager && (
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F528A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1565a8] transition-colors shadow-sm"
              >
                <HiArrowUpTray className="h-4 w-4" />
                Upload Resource
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        {RESOURCE_CATEGORIES.map(cat => {
          const colors = CATEGORY_COLORS[cat.color];
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(activeFilter === cat.id ? 'all' : cat.id)}
              className={`rounded-lg border p-3 text-left transition-all ${
                activeFilter === cat.id
                  ? `${colors.bg} ${colors.border} ring-2 ring-offset-1 ring-${cat.color}-400/50`
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1.5 ${activeFilter === cat.id ? colors.icon : 'text-slate-400 dark:text-slate-500'}`} />
              <div className={`text-lg font-bold ${activeFilter === cat.id ? colors.text : 'text-slate-900 dark:text-white'}`}>
                {categoryCounts[cat.id] || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{cat.label}</div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#0F528A] focus:ring-1 focus:ring-[#0F528A] outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <HiXMark className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        {activeFilter !== 'all' && (
          <button
            onClick={() => setActiveFilter('all')}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <HiFunnel className="h-3.5 w-3.5" />
            Clear filter
          </button>
        )}
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {filtered.length} resource{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
              <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-700/50 mb-2" />
              <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-700/50" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 p-12 text-center">
          <HiAcademicCap className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            {search || activeFilter !== 'all' ? 'No resources found' : 'No training resources yet'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {search || activeFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : isAdminOrManager
                ? 'Upload user guides, flowcharts, and training materials for your staff.'
                : 'Training resources will appear here once uploaded by your manager.'
            }
          </p>
          {isAdminOrManager && !search && activeFilter === 'all' && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0F528A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1565a8]"
            >
              <HiArrowUpTray className="h-4 w-4" />
              Upload First Resource
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(doc => {
            const catInfo = getCategoryInfo(doc.subcategory);
            const colors = CATEGORY_COLORS[catInfo.color];
            const FileIcon = getFileIcon(doc.file_type);

            return (
              <div
                key={doc.id}
                className="group rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                {/* Color accent top */}
                <div className={`h-1 ${colors.bg.includes('blue') ? 'bg-blue-500' : colors.bg.includes('purple') ? 'bg-purple-500' : colors.bg.includes('emerald') ? 'bg-emerald-500' : colors.bg.includes('amber') ? 'bg-amber-500' : colors.bg.includes('red') ? 'bg-red-500' : 'bg-slate-400'}`} />

                <div className="p-4">
                  {/* Category badge */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}>
                      <catInfo.icon className="h-3 w-3" />
                      {catInfo.label}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase">
                      {doc.file_type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2 leading-snug">
                    {doc.name}
                  </h3>

                  {/* Description */}
                  {doc.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2.5">
                      {doc.description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mb-3">
                    {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                    <span>{formatDate(doc.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleView(doc)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex-1 justify-center"
                    >
                      <HiEye className="h-3.5 w-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex-1 justify-center"
                    >
                      <HiArrowDownTray className="h-3.5 w-3.5" />
                      Download
                    </button>
                    {isAdminOrManager && (
                      <button
                        onClick={() => setDeleteConfirm(doc)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <HiTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !uploading && setShowUpload(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-800 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#0F528A]/10 p-1.5">
                  <HiArrowUpTray className="h-5 w-5 text-[#0F528A]" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upload Training Resource</h2>
              </div>
              <button onClick={() => !uploading && setShowUpload(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <HiXMark className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              {/* File picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.svg,.mp4,.txt,.csv"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^.]+$/, ''));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#0F528A]/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-[#0F528A] hover:file:bg-[#0F528A]/20 text-slate-700 dark:text-slate-300"
                />
                {uploadFile && (
                  <p className="mt-1 text-xs text-slate-500">{formatFileSize(uploadFile.size)}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Display Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. CRM Quick Reference Guide"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#0F528A] focus:ring-1 focus:ring-[#0F528A] outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                <select
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#0F528A] focus:ring-1 focus:ring-[#0F528A] outline-none"
                >
                  {RESOURCE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  placeholder="Brief description of what this resource covers..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#0F528A] focus:ring-1 focus:ring-[#0F528A] outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  disabled={uploading}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="rounded-lg bg-[#0F528A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1565a8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <HiArrowUpTray className="h-4 w-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
                <HiTrash className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Delete Resource</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteConfirm.name}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setPreviewUrl(null)}>
          <div className="w-full max-w-4xl h-[85vh] rounded-xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Document Preview</span>
              <button onClick={() => setPreviewUrl(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <HiXMark className="h-5 w-5" />
              </button>
            </div>
            <iframe src={previewUrl} className="flex-1 w-full" title="Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
