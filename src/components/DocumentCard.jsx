import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiDocument,
  HiDocumentText,
  HiTableCells,
  HiPresentationChartBar,
  HiPhoto,
  HiEllipsisVertical,
  HiPencilSquare,
  HiArrowRightCircle,
  HiArchiveBoxArrowDown,
  HiTrash,
} from 'react-icons/hi2';
import { getFileTypeInfo, formatFileSize, formatDate } from '../lib/api';

const TYPE_ICONS = {
  pdf: HiDocument,
  docx: HiDocumentText,
  doc: HiDocumentText,
  rtf: HiDocumentText,
  txt: HiDocumentText,
  xlsx: HiTableCells,
  xls: HiTableCells,
  csv: HiTableCells,
  pptx: HiPresentationChartBar,
  ppt: HiPresentationChartBar,
  png: HiPhoto,
  jpg: HiPhoto,
  jpeg: HiPhoto,
  gif: HiPhoto,
  svg: HiPhoto,
};

function getIcon(fileType) {
  if (!fileType) return HiDocument;
  return TYPE_ICONS[fileType.toLowerCase()] || HiDocument;
}

export default function DocumentCard({
  file,
  view = 'grid',
  selected = false,
  onSelect,
  onEdit,
  onMove,
  onDelete,
  onArchive,
  selectionMode = false,
  draggable = true,
  selectedIds,
}) {
  const navigate = useNavigate();
  const fileInfo = getFileTypeInfo(file.file_type);
  const Icon = getIcon(file.file_type);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  function handleClick(e) {
    // If in selection mode, toggle checkbox instead of navigating
    if (selectionMode) {
      onSelect?.(file.id);
      return;
    }
    navigate(`/view/${file.id}`);
  }

  function handleCheckbox(e) {
    e.stopPropagation();
    onSelect?.(file.id);
  }

  function handleDragStart(e) {
    // If this doc is part of a multi-selection, drag all selected
    const ids = selectedIds?.size > 0 && selectedIds.has(file.id)
      ? [...selectedIds]
      : [file.id];
    e.dataTransfer.setData('application/x-doc-ids', JSON.stringify(ids));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleMenuToggle(e) {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  }

  function handleEdit(e) {
    e.stopPropagation();
    setMenuOpen(false);
    onEdit?.(file);
  }

  function handleMove(e) {
    e.stopPropagation();
    setMenuOpen(false);
    onMove?.(file);
  }

  function handleArchive(e) {
    e.stopPropagation();
    setMenuOpen(false);
    onArchive?.(file);
  }

  function handleDelete(e) {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete?.(file);
  }

  const menuItems = (
    <div
      ref={menuRef}
      className="absolute z-20 mt-1 w-40 rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] py-1 shadow-lg"
    >
      <button
        onClick={handleEdit}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
      >
        <HiPencilSquare className="h-4 w-4 text-slate-400" />
        Edit
      </button>
      <button
        onClick={handleMove}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
      >
        <HiArrowRightCircle className="h-4 w-4 text-slate-400" />
        Move to...
      </button>
      {file.category !== 'Archive' && (
        <button
          onClick={handleArchive}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20"
        >
          <HiArchiveBoxArrowDown className="h-4 w-4" />
          Archive
        </button>
      )}
      <hr className="my-1 border-slate-100 dark:border-[#263554]" />
      <button
        onClick={handleDelete}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <HiTrash className="h-4 w-4" />
        Delete
      </button>
    </div>
  );

  if (view === 'list') {
    return (
      <div
        onClick={handleClick}
        draggable={draggable}
        onDragStart={handleDragStart}
        className={`group relative flex w-full cursor-pointer items-center gap-4 rounded-lg border bg-white dark:bg-[#162036] px-4 py-3 text-left shadow-sm transition-all hover:shadow-md ${
          selected ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-[#263554] hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {/* Checkbox */}
        <div
          className={`flex-shrink-0 ${selectionMode || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckbox}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
        </div>

        <div className={`flex-shrink-0 ${fileInfo.color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{file.name}</p>
          {file.subcategory && (
            <span className="mt-0.5 inline-block truncate text-[10px] text-slate-400">{file.subcategory}</span>
          )}
        </div>
        <div className="hidden sm:block sm:w-24">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${fileInfo.bg} ${fileInfo.color}`}>
            {file.file_type?.toUpperCase() || 'FILE'}
          </span>
        </div>
        <div className="hidden text-xs text-slate-400 md:block md:w-32 md:truncate">
          {file.category || '--'}
        </div>
        <div className="hidden text-xs text-slate-400 sm:block sm:w-20 sm:text-right">
          {formatFileSize(file.size)}
        </div>
        <div className="w-24 text-right text-xs text-slate-400">
          {formatDate(file.updated_at)}
        </div>

        {/* Three-dot menu */}
        <div className={`relative flex-shrink-0 ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <button
            onClick={handleMenuToggle}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <HiEllipsisVertical className="h-5 w-5" />
          </button>
          {menuOpen && <div className="absolute right-0 top-full">{menuItems}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      className={`group relative flex cursor-pointer flex-col items-center rounded-xl border bg-white dark:bg-[#162036] p-6 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
        menuOpen ? 'z-30' : ''
      } ${
        selected ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-[#263554] hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {/* Checkbox - top left */}
      <div
        className={`absolute left-3 top-3 ${selectionMode || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={handleCheckbox}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </div>

      {/* Three-dot menu - top right */}
      <div
        className={`absolute right-3 top-3 ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
      >
        <button
          onClick={handleMenuToggle}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <HiEllipsisVertical className="h-5 w-5" />
        </button>
        {menuOpen && <div className="absolute right-0 top-full">{menuItems}</div>}
      </div>

      <div
        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${fileInfo.bg}`}
      >
        <Icon className={`h-8 w-8 ${fileInfo.color}`} />
      </div>
      <p className="mb-2 line-clamp-2 w-full text-sm font-medium text-slate-800 dark:text-slate-200">
        {file.name}
      </p>
      <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${fileInfo.bg} ${fileInfo.color}`}>
          {file.file_type?.toUpperCase() || 'FILE'}
        </span>
        {file.category && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {file.category}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400">
        {formatFileSize(file.size)}
        {file.updated_at && ` \u00b7 ${formatDate(file.updated_at)}`}
      </p>
    </div>
  );
}
