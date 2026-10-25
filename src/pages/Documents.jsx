import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  HiSquares2X2,
  HiListBullet,
  HiArrowsUpDown,
  HiFolderOpen,
  HiFolderPlus,
  HiChevronRight,
  HiHome,
  HiArrowUpTray,
  HiTrash,
  HiArrowRightCircle,
  HiXMark,
  HiPencilSquare,
  HiFolder,
} from 'react-icons/hi2';
import { fetchDocuments, bulkDeleteDocuments, createFolder, deleteFolder, renameFolder, moveDocuments } from '../lib/api';
import DocumentCard from '../components/DocumentCard';
import EmptyState from '../components/EmptyState';
import { SkeletonGrid } from '../components/ui/Skeleton';
import UploadModal from '../components/UploadModal';
import EditDocumentModal from '../components/EditDocumentModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import MoveDocumentsModal from '../components/MoveDocumentsModal';

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc', label: 'Smallest first' },
];

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const folder = searchParams.get('folder') || '';
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('name-asc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectionMode = selectedIds.size > 0;

  // Modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [moveIds, setMoveIds] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Folder creation state
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Folder rename state
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renameFolderName, setRenameFolderName] = useState('');

  // Drag-and-drop state
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [dropMoving, setDropMoving] = useState(false);

  const loadDocuments = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchDocuments(category || undefined, subcategory || undefined, folder || undefined)
      .then((data) => {
        setDocuments(data.documents || data || []);
        setFolders(data.folders || []);
        setSelectedIds(new Set());
      })
      .catch((err) => {
        console.error('Failed to fetch documents:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [category, subcategory, folder]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Sort documents
  const sortedDocs = [...documents].sort((a, b) => {
    const [field, dir] = sort.split('-');
    const mul = dir === 'asc' ? 1 : -1;

    if (field === 'name') {
      return mul * (a.name || '').localeCompare(b.name || '');
    }
    if (field === 'date') {
      return mul * (new Date(a.updated_at || 0) - new Date(b.updated_at || 0));
    }
    if (field === 'size') {
      return mul * ((Number(a.size) || 0) - (Number(b.size) || 0));
    }
    return 0;
  });

  // Selection handlers
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === sortedDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedDocs.map((d) => d.id)));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // Card action handlers
  function handleCardEdit(doc) {
    setEditDoc(doc);
  }

  function handleCardMove(doc) {
    setMoveIds([doc.id]);
  }

  async function handleCardArchive(doc) {
    try {
      await moveDocuments([doc.id], 'Archive');
      loadDocuments();
    } catch (err) {
      alert(`Failed to archive: ${err.message}`);
    }
  }

  function handleCardDelete(doc) {
    setDeleteDoc(doc);
  }

  // Bulk actions
  function handleBulkMove() {
    setMoveIds([...selectedIds]);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!window.confirm(`Delete ${count} selected document${count !== 1 ? 's' : ''}? This cannot be undone.`)) return;

    setBulkDeleting(true);
    try {
      await bulkDeleteDocuments([...selectedIds]);
      loadDocuments();
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setBulkDeleting(false);
    }
  }

  // Folder actions
  function navigateToFolder(folderFullName) {
    const params = new URLSearchParams(searchParams);
    params.set('folder', folderFullName);
    setSearchParams(params);
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim() || !category) return;
    setCreatingFolder(true);
    try {
      await createFolder(newFolderName.trim(), category, subcategory || undefined, folder || undefined);
      setNewFolderName('');
      setShowNewFolder(false);
      loadDocuments();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleDeleteFolder(f) {
    const displayName = f.display_name || f.name;
    if (!window.confirm(`Delete folder "${displayName}"? The folder must be empty.`)) return;
    try {
      await deleteFolder(f.id);
      loadDocuments();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRenameFolder(f) {
    if (!renameFolderName.trim()) return;
    try {
      await renameFolder(f.id, renameFolderName.trim());
      setRenamingFolder(null);
      setRenameFolderName('');
      loadDocuments();
    } catch (err) {
      alert(err.message);
    }
  }

  // Drag-and-drop handlers for folders
  function handleFolderDragOver(e, folderName) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolder !== folderName) setDragOverFolder(folderName);
  }

  function handleFolderDragLeave(e) {
    // Only clear if leaving the folder card entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverFolder(null);
    }
  }

  async function handleFolderDrop(e, folderName) {
    e.preventDefault();
    setDragOverFolder(null);

    const raw = e.dataTransfer.getData('application/x-doc-ids');
    if (!raw) return;

    let ids;
    try { ids = JSON.parse(raw); } catch { return; }
    if (!ids?.length || !category) return;

    setDropMoving(true);
    try {
      await moveDocuments(ids, category, subcategory || undefined, folderName);
      loadDocuments();
    } catch (err) {
      alert(`Failed to move: ${err.message}`);
    } finally {
      setDropMoving(false);
    }
  }

  // For nested folders, show just the last segment as page title
  const folderDisplayName = folder
    ? (folder.includes('/') ? folder.substring(folder.lastIndexOf('/') + 1) : folder)
    : '';
  const pageTitle = folder
    ? folderDisplayName
    : subcategory
      ? `${category} - ${subcategory}`
      : category || 'All Documents';
  // Split folder path into segments for breadcrumbs
  const folderSegments = folder ? folder.split('/') : [];
  const allSelected = sortedDocs.length > 0 && selectedIds.size === sortedDocs.length;
  const totalItems = sortedDocs.length + folders.length;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
        <Link
          to="/"
          className="flex items-center gap-1 rounded px-1.5 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200"
        >
          <HiHome className="h-4 w-4" />
          <span>Home</span>
        </Link>
        <HiChevronRight className="h-3.5 w-3.5 text-slate-400" />
        {category ? (
          <>
            <Link
              to="/documents"
              className="rounded px-1.5 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200"
            >
              All Documents
            </Link>
            <HiChevronRight className="h-3.5 w-3.5 text-slate-400" />
            {subcategory ? (
              <>
                <Link
                  to={`/documents?category=${encodeURIComponent(category)}`}
                  className="rounded px-1.5 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {category}
                </Link>
                <HiChevronRight className="h-3.5 w-3.5 text-slate-400" />
                {folder ? (
                  <>
                    <Link
                      to={`/documents?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`}
                      className="rounded px-1.5 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {subcategory}
                    </Link>
                    {folderSegments.map((seg, i) => {
                      const isLast = i === folderSegments.length - 1;
                      const pathUpTo = folderSegments.slice(0, i + 1).join('/');
                      return (
                        <span key={i} className="flex items-center gap-1">
                          <HiChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          {isLast ? (
                            <span className="flex items-center gap-1 rounded px-1.5 py-1 font-medium text-slate-800 dark:text-slate-200">
                              <HiFolder className="h-4 w-4 text-amber-500" />
                              {seg}
                            </span>
                          ) : (
                            <Link
                              to={`/documents?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}&folder=${encodeURIComponent(pathUpTo)}`}
                              className="flex items-center gap-1 rounded px-1.5 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200"
                            >
                              <HiFolder className="h-4 w-4 text-amber-400" />
                              {seg}
                            </Link>
                          )}
                        </span>
                      );
                    })}
                  </>
                ) : (
                  <span className="rounded px-1.5 py-1 font-medium text-slate-800 dark:text-slate-200">
                    {subcategory}
                  </span>
                )}
              </>
            ) : folder ? (
              <>
                <Link
                  to={`/documents?category=${encodeURIComponent(category)}`}
                  className="rounded px-1.5 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {category}
                </Link>
                {folderSegments.map((seg, i) => {
                  const isLast = i === folderSegments.length - 1;
                  const pathUpTo = folderSegments.slice(0, i + 1).join('/');
                  return (
                    <span key={i} className="flex items-center gap-1">
                      <HiChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      {isLast ? (
                        <span className="flex items-center gap-1 rounded px-1.5 py-1 font-medium text-slate-800 dark:text-slate-200">
                          <HiFolder className="h-4 w-4 text-amber-500" />
                          {seg}
                        </span>
                      ) : (
                        <Link
                          to={`/documents?category=${encodeURIComponent(category)}&folder=${encodeURIComponent(pathUpTo)}`}
                          className="flex items-center gap-1 rounded px-1.5 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <HiFolder className="h-4 w-4 text-amber-400" />
                          {seg}
                        </Link>
                      )}
                    </span>
                  );
                })}
              </>
            ) : (
              <span className="rounded px-1.5 py-1 font-medium text-slate-800 dark:text-slate-200">
                {category}
              </span>
            )}
          </>
        ) : (
          <span className="rounded px-1.5 py-1 font-medium text-slate-800 dark:text-slate-200">
            All Documents
          </span>
        )}
      </nav>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 border-b border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-6 py-3 shadow-sm lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{pageTitle}</h1>
            {!loading && (
              <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* New Folder button (when viewing a category or inside a folder) */}
            {category && (
              <button
                onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#263554]"
              >
                <HiFolderPlus className="h-4 w-4" />
                New Folder
              </button>
            )}

            {/* Upload button */}
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              <HiArrowUpTray className="h-4 w-4" />
              Upload
            </button>

            {/* Sort */}
            <div className="relative">
              <HiArrowsUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => setView('grid')}
                className={`rounded-l-lg p-2 transition-colors ${
                  view === 'grid'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="Grid view"
              >
                <HiSquares2X2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`rounded-r-lg p-2 transition-colors ${
                  view === 'list'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="List view"
              >
                <HiListBullet className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Folder inline form */}
      {showNewFolder && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
          <HiFolderPlus className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
            }}
            className="flex-1 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim() || creatingFolder}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {creatingFolder ? 'Creating...' : 'Create'}
          </button>
          <button
            onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selection action bar */}
      {selectionMode && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleBulkMove}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <HiArrowRightCircle className="h-4 w-4" />
              Move to...
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {bulkDeleting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <HiTrash className="h-4 w-4" />
              )}
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
              title="Clear selection"
            >
              <HiXMark className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Select all checkbox (when not in selection mode, show above list) */}
      {!selectionMode && !loading && sortedDocs.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={false}
            onChange={toggleSelectAll}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs text-slate-400">Select all</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SkeletonGrid count={12} cols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" />
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : totalItems === 0 ? (
        <EmptyState
          icon={HiFolderOpen}
          title={folder ? 'Folder is empty' : 'No documents found'}
          description={
            folder
              ? `No documents in folder "${folderDisplayName}".`
              : subcategory
                ? `No documents in "${category} / ${subcategory}".`
                : category
                  ? `No documents in "${category}".`
                  : 'No documents found.'
          }
        />
      ) : (
        <>
          {/* Folders grid */}
          {folders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Folders</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {folders.map((f) => (
                  <div
                    key={f.id}
                    onDragOver={(e) => handleFolderDragOver(e, f.name)}
                    onDragLeave={handleFolderDragLeave}
                    onDrop={(e) => handleFolderDrop(e, f.name)}
                    className={`group relative flex cursor-pointer flex-col items-center rounded-xl border bg-white dark:bg-[#162036] p-5 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                      dragOverFolder === f.name
                        ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-400/40 scale-[1.04]'
                        : 'border-slate-200 dark:border-[#263554] hover:border-amber-300 dark:hover:border-amber-600'
                    }`}
                  >
                    {/* Folder actions */}
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingFolder(f);
                          setRenameFolderName(f.display_name || f.name);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600"
                        title="Rename"
                      >
                        <HiPencilSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(f);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                        title="Delete"
                      >
                        <HiTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {renamingFolder?.id === f.id ? (
                      <div className="w-full" onClick={(e) => e.stopPropagation()}>
                        <HiFolder className="mx-auto mb-2 h-10 w-10 text-amber-400" />
                        <input
                          type="text"
                          value={renameFolderName}
                          onChange={(e) => setRenameFolderName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFolder(f);
                            if (e.key === 'Escape') { setRenamingFolder(null); setRenameFolderName(''); }
                          }}
                          className="w-full rounded border border-brand-300 bg-white dark:bg-[#0a1628] px-2 py-1 text-xs text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                        <div className="mt-2 flex gap-1 justify-center">
                          <button
                            onClick={() => handleRenameFolder(f)}
                            className="rounded bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-brand-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setRenamingFolder(null); setRenameFolderName(''); }}
                            className="rounded bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => navigateToFolder(f.name)} className="w-full">
                        <HiFolder className="mx-auto mb-3 h-12 w-12 text-amber-400 transition-transform group-hover:scale-105" />
                        <p className="mb-1 line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                          {f.display_name || f.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {f.doc_count || 0} document{(f.doc_count || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {sortedDocs.length > 0 && (
            <div className="space-y-3">
              {folders.length > 0 && (
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Documents</h2>
              )}
              {view === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {sortedDocs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      file={doc}
                      view="grid"
                      selected={selectedIds.has(doc.id)}
                      onSelect={toggleSelect}
                      onEdit={handleCardEdit}
                      onMove={handleCardMove}
                      onArchive={handleCardArchive}
                      onDelete={handleCardDelete}
                      selectionMode={selectionMode}
                      selectedIds={selectedIds}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {/* List header */}
                  <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <div className="w-4" />
                    <div className="w-6" />
                    <div className="flex-1">Name</div>
                    <div className="hidden sm:block sm:w-24">Type</div>
                    <div className="hidden md:block md:w-32">Category</div>
                    <div className="hidden sm:block sm:w-20 sm:text-right">Size</div>
                    <div className="w-24 text-right">Modified</div>
                    <div className="w-8" />
                  </div>
                  {sortedDocs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      file={doc}
                      view="list"
                      selected={selectedIds.has(doc.id)}
                      onSelect={toggleSelect}
                      onEdit={handleCardEdit}
                      onMove={handleCardMove}
                      onArchive={handleCardArchive}
                      onDelete={handleCardDelete}
                      selectionMode={selectionMode}
                      selectedIds={selectedIds}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Drop-move loading overlay */}
      {dropMoving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-[#162036] px-6 py-4 shadow-xl border border-slate-200 dark:border-[#263554]">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600/30 border-t-brand-600" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Moving documents...</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={loadDocuments}
        defaultCategory={category}
        defaultSubcategory={subcategory}
        defaultFolder={folder}
      />

      <EditDocumentModal
        isOpen={!!editDoc}
        onClose={() => setEditDoc(null)}
        document={editDoc}
        onSaveComplete={loadDocuments}
      />

      <DeleteConfirmModal
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        document={deleteDoc}
        onDeleteComplete={loadDocuments}
      />

      <MoveDocumentsModal
        isOpen={!!moveIds}
        onClose={() => setMoveIds(null)}
        documentIds={moveIds || []}
        onMoveComplete={loadDocuments}
      />
    </div>
  );
}
