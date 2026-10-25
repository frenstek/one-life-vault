import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft,
  HiPencilSquare,
  HiTrash,
  HiShieldCheck,
  HiExclamationTriangle,
  HiXCircle,
  HiArrowUpTray,
  HiDocumentText,
  HiCalendar,
  HiEnvelope,
  HiPhone,
  HiBriefcase,
  HiClock,
  HiMapPin,
  HiUser,
  HiArrowDownTray,
  HiFolderOpen,
  HiIdentification,
  HiHomeModern,
  HiExclamationCircle,
} from 'react-icons/hi2';
import {
  fetchStaffMember,
  deleteStaffMember,
  deleteStaffDocument,
  downloadStaffDocument,
  STAFF_DOCUMENT_TYPES,
} from '../lib/api';
import { toLocalDate } from '../lib/dates';

// Whole days from today (local) until a YYYY-MM-DD expiry; negative = expired.
function daysUntil(dateStr) {
  const expiry = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  const today = new Date(toLocalDate() + 'T00:00:00');
  return Math.round((expiry - today) / 86400000);
}
import LoadingSpinner from '../components/LoadingSpinner';
import EditStaffModal from '../components/EditStaffModal';
import UploadStaffDocModal from '../components/UploadStaffDocModal';
import OnboardingTab from '../components/OnboardingTab';
import GenerateContractModal from '../components/GenerateContractModal';
import { HiClipboardDocumentList } from 'react-icons/hi2';

const BASE_TABS = [
  { id: 'profile', label: 'Profile', icon: HiUser },
  { id: 'onboarding', label: 'Onboarding', icon: HiClipboardDocumentList, onboardingOnly: true },
  { id: 'compliance', label: 'Compliance', icon: HiShieldCheck },
  { id: 'files', label: 'Staff Files', icon: HiFolderOpen },
];

export default function StaffProfile() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadCustom, setUploadCustom] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [contractOpen, setContractOpen] = useState(false);

  function loadMember() {
    setLoading(true);
    setError(null);
    fetchStaffMember(staffId)
      .then((data) => setMember(data.staff || data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMember();
  }, [staffId]);

  async function handleDeleteStaff() {
    setDeleting(true);
    try {
      await deleteStaffMember(staffId);
      navigate('/staff', { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  async function handleDeleteDoc(docId) {
    setDeletingDoc(docId);
    try {
      await deleteStaffDocument(docId);
      loadMember();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingDoc(null);
    }
  }

  async function handleDownloadDoc(docId, fileName) {
    try {
      const { url } = await downloadStaffDocument(docId);
      window.open(url, '_blank');
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  }

  if (loading) return <LoadingSpinner message="Loading staff profile..." />;
  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/staff')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <HiArrowLeft className="h-4 w-4" /> Back to Staff
        </button>
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }
  if (!member) return null;

  const documents = member.documents || [];
  // Sort by created_at desc so newest first
  const sortedDocs = [...documents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const docMap = {};
  const archivedDocs = [];
  sortedDocs.forEach((doc) => {
    if (STAFF_DOCUMENT_TYPES.includes(doc.document_type)) {
      if (!docMap[doc.document_type]) {
        docMap[doc.document_type] = doc; // newest becomes current
      } else {
        archivedDocs.push(doc); // older ones are archived
      }
    }
  });

  // Personal files = any document that isn't a standard compliance type
  const personalFiles = documents.filter(
    (doc) => !STAFF_DOCUMENT_TYPES.includes(doc.document_type)
  );

  function getDocStatus(docType) {
    const doc = docMap[docType];
    if (!doc) return 'missing';
    if (!doc.expiry_date) return 'valid';
    const days = daysUntil(doc.expiry_date);
    if (days < 0) return 'expired';
    if (days <= 30) return 'expiring';
    return 'valid';
  }

  const formatDate = (d) => {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const complianceUploaded = STAFF_DOCUMENT_TYPES.filter((t) => docMap[t]).length;
  const complianceTotal = STAFF_DOCUMENT_TYPES.length;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/staff')}
        className="flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <HiArrowLeft className="h-4 w-4" /> Back to Staff Directory
      </button>

      {/* Profile Header */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/10 text-accent-500 text-xl font-bold">
              {(member.first_name || '?')[0]}
              {(member.last_name || '?')[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {member.first_name} {member.last_name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {member.role || 'Staff'}
                {member.position_type && <span className="text-slate-400 dark:text-slate-500"> &middot; {member.position_type}</span>}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    member.status === 'active'
                      ? 'bg-green-50 dark:bg-green-900/20 text-accent-500'
                      : member.status === 'onboarding'
                      ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400'
                      : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {member.status || 'active'}
                </span>
                <span className="text-xs text-slate-400">
                  {complianceUploaded}/{complianceTotal} docs
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!['Admin', 'Manager', 'Operations Manager', 'General Manager', 'Director', 'Coordinator'].includes(member.role) && (
              <button
                onClick={() => setContractOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 transition-colors hover:bg-brand-100 dark:hover:bg-brand-900/30"
              >
                <HiDocumentText className="h-4 w-4" /> Generate Contract
              </button>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#1e2d4a] px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#263554]"
            >
              <HiPencilSquare className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-[#1e2d4a] px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <HiTrash className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-1.5">
        {BASE_TABS.filter(tab => !tab.onboardingOnly || member.status === 'onboarding').map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'files' && personalFiles.length > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-500 dark:text-slate-400'}`}>
                  {personalFiles.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <ProfileTab member={member} formatDate={formatDate} />
      )}

      {activeTab === 'onboarding' && member.status === 'onboarding' && (
        <OnboardingTab
          staffId={staffId}
          staffName={`${member.first_name} ${member.last_name}`}
          onStatusChange={loadMember}
        />
      )}

      {activeTab === 'compliance' && (
        <ComplianceTab
          docMap={docMap}
          archivedDocs={archivedDocs}
          getDocStatus={getDocStatus}
          formatDate={formatDate}
          deletingDoc={deletingDoc}
          onUpload={(docType) => {
            setUploadDocType(docType);
            setUploadCustom(false);
            setUploadOpen(true);
          }}
          onDelete={handleDeleteDoc}
          onDownload={handleDownloadDoc}
        />
      )}

      {activeTab === 'files' && (
        <FilesTab
          files={personalFiles}
          formatDate={formatDate}
          deletingDoc={deletingDoc}
          onUpload={() => {
            setUploadDocType('');
            setUploadCustom(true);
            setUploadOpen(true);
          }}
          onDelete={handleDeleteDoc}
          onDownload={handleDownloadDoc}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(false); }}
        >
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-[#162036] p-8 shadow-xl animate-modal-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <HiExclamationTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Staff Member</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <strong>{member.first_name} {member.last_name}</strong>?
              All associated documents will also be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 dark:border-[#263554] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <HiTrash className="h-4 w-4" /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Contract Modal */}
      {contractOpen && (
        <GenerateContractModal
          member={member}
          onClose={() => setContractOpen(false)}
        />
      )}

      {/* Edit Staff Modal */}
      <EditStaffModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        member={member}
        onUpdated={() => {
          setEditOpen(false);
          loadMember();
        }}
      />

      {/* Upload Doc Modal */}
      <UploadStaffDocModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        staffId={staffId}
        preselectedType={uploadDocType}
        allowCustomType={uploadCustom}
        onUploaded={() => {
          setUploadOpen(false);
          loadMember();
        }}
      />
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ member, formatDate }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Personal Information */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <div className="mb-5 flex items-center gap-2">
          <HiIdentification className="h-5 w-5 text-brand-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Personal Information</h2>
        </div>
        <div className="space-y-4">
          <DetailRow icon={HiUser} label="Full Name" value={`${member.first_name} ${member.last_name}`} />
          <DetailRow icon={HiEnvelope} label="Email" value={member.email} />
          <DetailRow icon={HiPhone} label="Phone" value={member.phone} />
          <DetailRow icon={HiCalendar} label="Date of Birth" value={member.date_of_birth ? formatDate(member.date_of_birth) : null} />
          <DetailRow icon={HiMapPin} label="Address" value={member.address} />
        </div>
      </div>

      {/* Employment Details */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <div className="mb-5 flex items-center gap-2">
          <HiBriefcase className="h-5 w-5 text-brand-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Employment Details</h2>
        </div>
        <div className="space-y-4">
          <DetailRow icon={HiBriefcase} label="Role" value={member.role} />
          <DetailRow label="Position Type" value={member.position_type} />
          <DetailRow label="Department" value={member.department} />
          <DetailRow icon={HiCalendar} label="Start Date" value={member.start_date ? formatDate(member.start_date) : null} />
          <DetailRow icon={HiShieldCheck} label="NDIS Worker Clearance No." value={member.ndis_clearance_number} />
          <DetailRow label="TFN" value={member.tfn} />
          <DetailRow label="Preferred Super" value={member.preferred_super} />
          <DetailRow label="Status" value={
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
              member.status === 'active'
                ? 'bg-green-50 dark:bg-green-900/20 text-accent-500'
                : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-500 dark:text-slate-400'
            }`}>
              {member.status || 'active'}
            </span>
          } />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <div className="mb-5 flex items-center gap-2">
          <HiExclamationCircle className="h-5 w-5 text-red-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Emergency Contact</h2>
        </div>
        {member.emergency_contact_name ? (
          <div className="space-y-4">
            <DetailRow icon={HiUser} label="Name" value={member.emergency_contact_name} />
            <DetailRow icon={HiPhone} label="Phone" value={member.emergency_contact_phone} />
            <DetailRow label="Relationship" value={member.emergency_contact_relationship} />
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">No emergency contact set</p>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <div className="mb-5 flex items-center gap-2">
          <HiDocumentText className="h-5 w-5 text-brand-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notes</h2>
        </div>
        {member.notes ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{member.notes}</p>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">No notes added</p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />}
      {!Icon && <div className="w-4" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          {value || <span className="text-slate-300 dark:text-slate-600">--</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Compliance Tab ───────────────────────────────────────────────────────────

function ComplianceTab({ docMap, archivedDocs = [], getDocStatus, formatDate, deletingDoc, onUpload, onDelete, onDownload }) {
  const [showArchive, setShowArchive] = useState(false);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Compliance Documents</h2>
        <button
          onClick={() => onUpload('')}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <HiArrowUpTray className="h-4 w-4" /> Upload Document
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {STAFF_DOCUMENT_TYPES.map((docType) => {
          const doc = docMap[docType];
          const status = getDocStatus(docType);
          const archiveCount = archivedDocs.filter((d) => d.document_type === docType).length;

          return (
            <DocumentTypeCard
              key={docType}
              docType={docType}
              doc={doc}
              status={status}
              formatDate={formatDate}
              deletingDoc={deletingDoc}
              archiveCount={archiveCount}
              onUpload={() => onUpload(docType)}
              onDelete={() => onDelete(doc?.id)}
              onDownload={() => onDownload(doc?.id, doc?.document_name)}
            />
          );
        })}
      </div>

      {/* Archive Section */}
      {archivedDocs.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <HiFolderOpen className="h-4 w-4" />
            Archive ({archivedDocs.length} previous version{archivedDocs.length !== 1 ? 's' : ''})
            <svg className={`h-4 w-4 transition-transform ${showArchive ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {showArchive && (
            <div className="mt-4 space-y-2">
              {archivedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#1e2d4a]/50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <HiDocumentText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <p className="break-words text-sm font-medium text-slate-600 dark:text-slate-300">{doc.document_name}</p>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                      <span>{doc.document_type}</span>
                      {doc.issue_date && <span>Issued: {formatDate(doc.issue_date)}</span>}
                      {doc.expiry_date && <span>Expired: {formatDate(doc.expiry_date)}</span>}
                      <span>Uploaded: {formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <button
                      onClick={() => onDownload(doc.id, doc.document_name)}
                      className="rounded-md border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#263554]"
                    >
                      <HiArrowDownTray className="mr-1 inline h-3 w-3" />
                      View
                    </button>
                    <button
                      onClick={() => onDelete(doc.id)}
                      disabled={deletingDoc === doc.id}
                      className="rounded-md border border-red-200 dark:border-red-800 bg-white dark:bg-[#162036] px-2.5 py-1 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      {deletingDoc === doc.id ? '...' : <HiTrash className="inline h-3 w-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentTypeCard({ docType, doc, status, formatDate, deletingDoc, onUpload, onDelete, onDownload, archiveCount = 0 }) {
  const statusConfig = {
    valid: {
      border: 'border-accent-500/30 dark:border-accent-500/20',
      bg: 'bg-green-50/50 dark:bg-green-900/10',
      icon: HiShieldCheck,
      iconColor: 'text-accent-500',
      badge: 'bg-green-50 dark:bg-green-900/20 text-accent-500',
      badgeText: 'Valid',
    },
    expiring: {
      border: 'border-amber-300 dark:border-amber-700',
      bg: 'bg-amber-50/50 dark:bg-amber-900/10',
      icon: HiExclamationTriangle,
      iconColor: 'text-amber-500',
      badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      badgeText: 'Expiring',
    },
    expired: {
      border: 'border-red-300 dark:border-red-800',
      bg: 'bg-red-50/50 dark:bg-red-900/10',
      icon: HiXCircle,
      iconColor: 'text-red-500',
      badge: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      badgeText: 'Expired',
    },
    missing: {
      border: 'border-dashed border-slate-300 dark:border-[#334766]',
      bg: 'bg-slate-50/50 dark:bg-[#1e2d4a]/30',
      icon: HiDocumentText,
      iconColor: 'text-slate-400 dark:text-slate-500',
      badge: 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-500 dark:text-slate-400',
      badgeText: 'Missing',
    },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${cfg.iconColor}`} />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{docType}</h3>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
          {cfg.badgeText}
        </span>
      </div>

      {doc ? (
        <div className="mt-3 space-y-2">
          {doc.document_name && (
            <p className="text-xs text-slate-500 dark:text-slate-400 break-words leading-relaxed">
              {doc.document_name}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {doc.issue_date && (
              <span className="flex items-center gap-1">
                <HiCalendar className="h-3 w-3" /> Issued: {formatDate(doc.issue_date)}
              </span>
            )}
          </div>
          {doc.expiry_date && (
            <p className={`text-xs font-medium ${status === 'expired' ? 'text-red-500' : status === 'expiring' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <HiClock className="mr-1 inline h-3 w-3" />
              Expires: {formatDate(doc.expiry_date)}
            </p>
          )}
          {archiveCount > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              <HiFolderOpen className="mr-1 inline h-3 w-3" />
              +{archiveCount} archived version{archiveCount !== 1 ? 's' : ''}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              onClick={onDownload}
              className="rounded-md border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#1e2d4a] px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263554]"
            >
              <HiArrowDownTray className="mr-1 inline h-3 w-3" />
              View
            </button>
            <button
              onClick={onUpload}
              className="rounded-md border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#1e2d4a] px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263554]"
            >
              Add New
            </button>
            <button
              onClick={onDelete}
              disabled={deletingDoc === doc.id}
              className="rounded-md border border-red-200 dark:border-red-800 bg-white dark:bg-[#1e2d4a] px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              {deletingDoc === doc.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">No document uploaded</p>
          <button
            onClick={onUpload}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#1e2d4a] px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263554] hover:border-slate-300 dark:hover:border-slate-500"
          >
            <HiArrowUpTray className="h-3.5 w-3.5" /> Upload
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Files Tab ────────────────────────────────────────────────────────────────

function FilesTab({ files, formatDate, deletingDoc, onUpload, onDelete, onDownload }) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Staff Files</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Personal documents, training records, and other files
          </p>
        </div>
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <HiArrowUpTray className="h-4 w-4" /> Upload File
        </button>
      </div>

      {files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-[#334766] bg-slate-50/50 dark:bg-[#1e2d4a]/30 p-12 text-center">
          <HiFolderOpen className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No personal files uploaded yet</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Upload training certificates, performance reviews, or any other documents
          </p>
          <button
            onClick={onUpload}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <HiArrowUpTray className="h-4 w-4" /> Upload First File
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#263554]">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Document</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Uploaded</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expiry</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((doc) => {
                const isExpired = doc.expiry_date && daysUntil(doc.expiry_date) < 0;
                return (
                  <tr key={doc.id} className="border-b border-slate-100 dark:border-[#263554] last:border-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <HiDocumentText className="h-5 w-5 flex-shrink-0 text-brand-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 break-words">
                          {doc.document_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 dark:bg-[#1e2d4a] px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      {doc.expiry_date ? (
                        <span className={`text-sm font-medium ${isExpired ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                          {formatDate(doc.expiry_date)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-300 dark:text-slate-600">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onDownload(doc.id, doc.document_name)}
                          className="rounded-md border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#1e2d4a] px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263554]"
                        >
                          <HiArrowDownTray className="mr-1 inline h-3 w-3" />
                          View
                        </button>
                        <button
                          onClick={() => onDelete(doc.id)}
                          disabled={deletingDoc === doc.id}
                          className="rounded-md border border-red-200 dark:border-red-800 bg-white dark:bg-[#1e2d4a] px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                        >
                          {deletingDoc === doc.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
