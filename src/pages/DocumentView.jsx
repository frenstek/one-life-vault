import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HiArrowLeft,
  HiArrowDownTray,
  HiDocument,
  HiDocumentText,
  HiTableCells,
  HiPresentationChartBar,
  HiPhoto,
  HiCalendar,
  HiCircleStack,
  HiTag,
  HiFolderOpen,
  HiBookmark,
  HiEye,
  HiPencilSquare,
  HiTrash,
} from 'react-icons/hi2';
import {
  fetchDocument,
  getDownloadUrl,
  getOfficeViewerUrl,
  getPublicFileUrl,
  isOfficeFile,
  getFileTypeInfo,
  formatFileSize,
} from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EditDocumentModal from '../components/EditDocumentModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

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

export default function DocumentView() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(true);

  // Modal state
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function loadFile() {
    setLoading(true);
    fetchDocument(fileId)
      .then((data) => setFile(data))
      .catch((err) => {
        console.error('Failed to fetch document:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFile();
  }, [fileId]);

  function handleEditComplete() {
    loadFile();
  }

  function handleDeleteComplete() {
    navigate('/documents');
  }

  if (loading) return <LoadingSpinner message="Loading document..." />;

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!file) return null;

  const fileInfo = getFileTypeInfo(file.file_type);
  const FileIcon = getIcon(file.file_type);
  const ft = (file.file_type || '').toLowerCase();
  const isPDF = ft === 'pdf';
  const isOffice = isOfficeFile(ft);
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ft);
  const isRTF = ft === 'rtf';
  const canPreview = isPDF || isOffice || isImage;
  const downloadUrl = file.storage_path ? getDownloadUrl(file.storage_path) : null;

  let previewUrl = null;
  if (isPDF && file.storage_path) {
    previewUrl = getPublicFileUrl(file.storage_path);
  } else if (isOffice && file.storage_path) {
    previewUrl = getOfficeViewerUrl(file.storage_path);
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <HiArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{file.name}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{fileInfo.label}</span>
              {canPreview && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <HiEye className="h-3 w-3" />
                  Viewable
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <HiPencilSquare className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <HiTrash className="h-4 w-4" />
            Delete
          </button>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={file.name && file.file_type && !file.name.toLowerCase().endsWith(`.${file.file_type.toLowerCase()}`) ? `${file.name}.${file.file_type.toLowerCase()}` : file.name || 'download'}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              <HiArrowDownTray className="h-4 w-4" />
              Download
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Preview area */}
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {isPDF && previewUrl ? (
            <iframe
              src={previewUrl}
              title={file.name}
              className="h-[calc(100vh-200px)] w-full border-0"
            />
          ) : isOffice && previewUrl ? (
            <iframe
              src={previewUrl}
              title={file.name}
              className="h-[calc(100vh-200px)] w-full border-0"
            />
          ) : isImage && file.storage_path ? (
            <div className="flex items-center justify-center p-8">
              <img
                src={getPublicFileUrl(file.storage_path)}
                alt={file.name}
                className="max-h-[calc(100vh-250px)] max-w-full rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className={`mb-4 rounded-2xl p-6 ${fileInfo.bg}`}>
                <FileIcon className={`h-12 w-12 ${fileInfo.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">{file.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {isRTF
                  ? 'RTF files cannot be previewed in browser.'
                  : `Preview not available for ${fileInfo.label} files.`}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Download the file to view its contents.
              </p>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={file.name && file.file_type && !file.name.toLowerCase().endsWith(`.${file.file_type.toLowerCase()}`) ? `${file.name}.${file.file_type.toLowerCase()}` : file.name || 'download'}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                >
                  <HiArrowDownTray className="h-4 w-4" />
                  Download File
                </a>
              )}
            </div>
          )}
        </div>

        {/* Details sidebar */}
        <div
          className={`w-72 flex-shrink-0 ${
            showDetails ? 'block' : 'hidden'
          } lg:block`}
        >
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              File Details
            </h2>

            <div className="space-y-4">
              <DetailRow icon={HiDocument} label="Name" value={file.name} />
              <DetailRow icon={HiTag} label="Type" value={fileInfo.label} />
              <DetailRow icon={HiFolderOpen} label="Category" value={file.category} />
              {file.subcategory && (
                <DetailRow icon={HiBookmark} label="Subcategory" value={file.subcategory} />
              )}
              <DetailRow
                icon={HiCircleStack}
                label="Size"
                value={formatFileSize(file.size)}
              />
              <DetailRow
                icon={HiCalendar}
                label="Modified"
                value={
                  file.updated_at
                    ? new Date(file.updated_at).toLocaleString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--'
                }
              />
              <DetailRow
                icon={HiCalendar}
                label="Created"
                value={
                  file.created_at
                    ? new Date(file.created_at).toLocaleString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--'
                }
              />
            </div>

            {/* Category link */}
            {file.category && (
              <Link
                to={`/documents?category=${encodeURIComponent(file.category)}`}
                className="mt-6 block w-full rounded-lg border border-slate-200 py-2 text-center text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                View all in {file.category}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditDocumentModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        document={file}
        onSaveComplete={handleEditComplete}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        document={file}
        onDeleteComplete={handleDeleteComplete}
      />
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="break-words text-sm font-medium text-slate-700">{value || '--'}</p>
      </div>
    </div>
  );
}
