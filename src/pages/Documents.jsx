import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  HiSquares2X2,
  HiListBullet,
  HiArrowsUpDown,
  HiFolderOpen,
  HiChevronRight,
  HiHome,
  HiArrowUpTray,
  HiTrash,
  HiArrowRightCircle,
  HiXMark,
} from 'react-icons/hi2';
import { fetchDocuments, bulkDeleteDocuments } from '../lib/api';
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
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const [documents, setDocuments] = useState([]);
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
  const [moveIds, setMoveIds] = useState(null); // array of ids or null
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadDocuments = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchDocuments(category || undefined, subcategory || undefined)
      .then((data) => {
        setDocuments(data.documents || data || []);
        setSelectedIds(new Set());
      })
      .catch((err) => {
        console.error('Failed to fetch documents:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [category, subcategory]);

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

  const pageTitle = subcategory ? `${category} - ${subcategory}` : category || 'All Documents';
  const allSelected = sortedDocs.length > 0 && selectedIds.size === sortedDocs.length;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
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
                <span className="rounded px-1.5 py-1 font-medium text-slate-800 dark:text-slate-200">
                  {subcategory}
                </span>
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
                {sortedDocs.length} document{sortedDocs.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
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
      ) : sortedDocs.length === 0 ? (
        <EmptyState
          icon={HiFolderOpen}
          title="No documents found"
          description={subcategory ? `No documents in "${category} / ${subcategory}".` : category ? `No documents in "${category}".` : 'No documents found.'}
        />
      ) : view === 'grid' ? (
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
              onDelete={handleCardDelete}
              selectionMode={selectionMode}
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
              onDelete={handleCardDelete}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={loadDocuments}
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
