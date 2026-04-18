export async function fetchDocuments(category, subcategory) {
  let params = category ? `&category=${encodeURIComponent(category)}` : '';
  if (subcategory) params += `&subcategory=${encodeURIComponent(subcategory)}`;
  const res = await fetch(`/api/docs?action=list${params}`);
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  return res.json();
}

export async function fetchDocument(id) {
  const res = await fetch(`/api/docs?action=file&id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch document: ${res.status}`);
  return res.json();
}

export async function searchDocuments(query) {
  const res = await fetch(`/api/docs?action=search&q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Failed to search documents: ${res.status}`);
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`/api/docs?action=categories`);
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return res.json();
}

export function getDownloadUrl(storagePath) {
  return `/api/docs-download?path=${encodeURIComponent(storagePath)}`;
}

const SUPABASE_STORAGE_URL = 'https://czdlemutsimvwfpwylxh.supabase.co/storage/v1/object/public/documents';

export function getPublicFileUrl(storagePath) {
  return `${SUPABASE_STORAGE_URL}/${encodeURIComponent(storagePath).replace(/%2F/g, '/')}`;
}

export function getOfficeViewerUrl(storagePath) {
  const publicUrl = getPublicFileUrl(storagePath);
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicUrl)}`;
}

export function canPreviewInBrowser(fileType) {
  const ft = (fileType || '').toLowerCase();
  return ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ft);
}

export function isOfficeFile(fileType) {
  const ft = (fileType || '').toLowerCase();
  return ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ft);
}

// File type helpers based on file_type field
const FILE_TYPES = {
  pdf: { label: 'PDF', color: 'text-red-500', bg: 'bg-red-50' },
  docx: { label: 'Word Document', color: 'text-blue-600', bg: 'bg-blue-50' },
  doc: { label: 'Word Document', color: 'text-blue-600', bg: 'bg-blue-50' },
  xlsx: { label: 'Excel Spreadsheet', color: 'text-green-600', bg: 'bg-green-50' },
  xls: { label: 'Excel Spreadsheet', color: 'text-green-600', bg: 'bg-green-50' },
  pptx: { label: 'PowerPoint', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ppt: { label: 'PowerPoint', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  rtf: { label: 'Rich Text', color: 'text-blue-400', bg: 'bg-blue-50' },
  txt: { label: 'Text File', color: 'text-gray-500', bg: 'bg-gray-50' },
  csv: { label: 'CSV File', color: 'text-green-500', bg: 'bg-green-50' },
  png: { label: 'PNG Image', color: 'text-purple-500', bg: 'bg-purple-50' },
  jpg: { label: 'JPEG Image', color: 'text-purple-500', bg: 'bg-purple-50' },
  jpeg: { label: 'JPEG Image', color: 'text-purple-500', bg: 'bg-purple-50' },
  gif: { label: 'GIF Image', color: 'text-purple-500', bg: 'bg-purple-50' },
  svg: { label: 'SVG Image', color: 'text-purple-500', bg: 'bg-purple-50' },
  mp4: { label: 'Video', color: 'text-pink-500', bg: 'bg-pink-50' },
  zip: { label: 'ZIP Archive', color: 'text-amber-600', bg: 'bg-amber-50' },
};

export function getFileTypeInfo(fileType) {
  if (!fileType) return { label: 'File', color: 'text-gray-400', bg: 'bg-gray-50' };
  const ft = fileType.toLowerCase();
  return FILE_TYPES[ft] || { label: ft.toUpperCase(), color: 'text-gray-400', bg: 'bg-gray-50' };
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === '0' || bytes === 0) return '--';
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export async function uploadDocument(fileName, fileData, category, subcategory) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upload', fileName, fileData, category, subcategory: subcategory || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function updateDocument(id, updates) {
  const res = await fetch('/api/docs', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteDocument(id) {
  const res = await fetch('/api/docs', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete failed: ${res.status}`);
  }
  return res.json();
}

export async function moveDocuments(ids, category, subcategory) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'move', ids, category, subcategory: subcategory || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Move failed: ${res.status}`);
  }
  return res.json();
}

export async function bulkDeleteDocuments(ids) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'bulk-delete', ids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Bulk delete failed: ${res.status}`);
  }
  return res.json();
}

// ─── Staff Management API ───────────────────────────────────────────────

export const STAFF_DOCUMENT_TYPES = [
  'Police Check',
  'WWCC',
  'NDIS Worker Screening Check',
  'First Aid Certificate',
  'CPR Certificate',
  "Driver's License",
  'Manual Handling Certificate',
  'Medication Administration Certificate',
  'COVID-19 Vaccination',
  'Qualifications/Degree',
  'Employment Contract',
  'Visa/Work Rights',
];

export async function fetchStaff(status) {
  const params = status ? `&status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`/api/staff?action=list${params}`);
  if (!res.ok) throw new Error(`Failed to fetch staff: ${res.status}`);
  return res.json();
}

export async function fetchStaffMember(id) {
  const res = await fetch(`/api/staff?action=get&id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch staff member: ${res.status}`);
  return res.json();
}

export async function createStaffMember(data) {
  const res = await fetch('/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create staff failed: ${res.status}`);
  }
  return res.json();
}

export async function updateStaffMember(id, data) {
  const res = await fetch('/api/staff', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update staff failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteStaffMember(id) {
  const res = await fetch('/api/staff', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete staff failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadStaffDocument(staffId, documentType, fileName, fileData, issueDate, expiryDate, notes) {
  const res = await fetch('/api/staff-docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId, documentType, fileName, fileData, issueDate, expiryDate, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload document failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteStaffDocument(id) {
  const res = await fetch('/api/staff-docs', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete document failed: ${res.status}`);
  }
  return res.json();
}

export async function downloadStaffDocument(docId) {
  const res = await fetch(`/api/staff-docs?id=${encodeURIComponent(docId)}`);
  if (!res.ok) throw new Error(`Failed to get download URL: ${res.status}`);
  return res.json();
}

export async function fetchCompliance() {
  const res = await fetch('/api/staff?action=compliance');
  if (!res.ok) throw new Error(`Failed to fetch compliance: ${res.status}`);
  return res.json();
}

// ─── Participant Inquiries API ────────────────────────────────────────────

export async function fetchInquiries(status, search) {
  let url = '/api/participants?action=list';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch inquiries: ${res.status}`);
  return res.json();
}

export async function fetchInquiry(id) {
  const res = await fetch(`/api/participants?action=get&id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch inquiry: ${res.status}`);
  return res.json();
}

export async function createInquiry(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create inquiry failed: ${res.status}`);
  }
  return res.json();
}

export async function updateInquiry(id, data) {
  const res = await fetch('/api/participants', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update inquiry failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteInquiry(id) {
  const res = await fetch('/api/participants', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete inquiry failed: ${res.status}`);
  }
  return res.json();
}

export async function addInquiryNote(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add-inquiry-note', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Add note failed');
  }
  return res.json();
}

export async function deleteInquiryNote(id) {
  const res = await fetch('/api/participants', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-inquiry-note', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Delete note failed');
  }
  return res.json();
}

export async function convertInquiryToParticipant(inquiryId) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'convert-inquiry', inquiry_id: inquiryId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Conversion failed');
  }
  return res.json();
}

// ─── Participant Profiles API ──────────────────────────────────────────

export async function fetchParticipants(status, search) {
  let url = '/api/participants?action=participants';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch participants: ${res.status}`);
  return res.json();
}

export async function fetchParticipant(id) {
  const res = await fetch(`/api/participants?action=participant&id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch participant: ${res.status}`);
  return res.json();
}

export async function createParticipant(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create-participant', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create participant failed: ${res.status}`);
  }
  return res.json();
}

export async function updateParticipant(id, data) {
  const res = await fetch('/api/participants', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update-participant', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update participant failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteParticipant(id) {
  const res = await fetch('/api/participants', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-participant', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete participant failed: ${res.status}`);
  }
  return res.json();
}

export async function addParticipantNote(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add-note', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Add note failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteParticipantNote(id) {
  const res = await fetch('/api/participants', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-note', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete note failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadParticipantFile(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upload-file', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload file failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteParticipantFile(id) {
  const res = await fetch('/api/participants', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-file', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete file failed: ${res.status}`);
  }
  return res.json();
}

// ─── Time Clock API ─────────────────────────────────────────────────────

export async function fetchTimeEntries(staffId, startDate, endDate) {
  let url = '/api/time-clock?action=list';
  if (staffId) url += `&staff_id=${encodeURIComponent(staffId)}`;
  if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch time entries: ${res.status}`);
  return res.json();
}

export async function fetchActiveClocks(staffId) {
  let url = '/api/time-clock?action=active';
  if (staffId) url += `&staff_id=${encodeURIComponent(staffId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch active clocks: ${res.status}`);
  return res.json();
}

export async function clockIn(staffId, notes) {
  const res = await fetch('/api/time-clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clock-in', staff_id: staffId, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Clock-in failed: ${res.status}`);
  }
  return res.json();
}

export async function clockOut(staffId, notes) {
  const res = await fetch('/api/time-clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clock-out', staff_id: staffId, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Clock-out failed: ${res.status}`);
  }
  return res.json();
}

export async function startBreak(staffId) {
  const res = await fetch('/api/time-clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start-break', staff_id: staffId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Start break failed: ${res.status}`);
  }
  return res.json();
}

export async function endBreak(staffId) {
  const res = await fetch('/api/time-clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'end-break', staff_id: staffId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `End break failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchAllStaffSummary(startDate, endDate) {
  const url = `/api/time-clock?action=summary&start_date=${encodeURIComponent(
    startDate,
  )}&end_date=${encodeURIComponent(endDate)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch staff summary: ${res.status}`);
  return res.json();
}

export async function updateTimeEntry(id, data) {
  const res = await fetch('/api/time-clock', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update time entry failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteTimeEntry(id) {
  const res = await fetch('/api/time-clock', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete time entry failed: ${res.status}`);
  }
  return res.json();
}

// ─── Auth API ───────────────────────────────────────────────────────────

export async function login(email, password) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Login failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchCurrentUser(token) {
  const res = await fetch('/api/auth', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Auth check failed: ${res.status}`);
  return res.json();
}

export const CATEGORIES = [
  'Human Resources',
  'Onboarding',
  'Clinical',
  'Governance & Compliance',
  'Operations',
  'Completed Records',
];

// ─── Property Management API ────────────────────────────────────────────

export async function fetchProperties(status) {
  const params = status ? `&status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`/api/properties?action=list${params}`);
  if (!res.ok) throw new Error(`Failed to fetch properties: ${res.status}`);
  return res.json();
}

export async function fetchProperty(id) {
  const res = await fetch(`/api/properties?action=get&id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch property: ${res.status}`);
  return res.json();
}

export async function fetchPropertyDashboard() {
  const res = await fetch(`/api/properties?action=dashboard`);
  if (!res.ok) throw new Error(`Failed to fetch property dashboard: ${res.status}`);
  return res.json();
}

export async function createProperty(data) {
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create-property', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create property failed: ${res.status}`);
  }
  return res.json();
}

export async function addResident(data) {
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add-resident', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Add resident failed: ${res.status}`);
  }
  return res.json();
}

export async function addMaintenance(data) {
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add-maintenance', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Add maintenance request failed: ${res.status}`);
  }
  return res.json();
}

export async function addInspection(data) {
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add-inspection', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Add inspection failed: ${res.status}`);
  }
  return res.json();
}

export async function updatePropertyRecord(table, id, data) {
  const res = await fetch('/api/properties', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadPropertyPhoto(propertyId, fileName, fileData, caption) {
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upload-photo', property_id: propertyId, fileName, fileData, caption }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload photo failed: ${res.status}`);
  }
  return res.json();
}

export async function deletePropertyPhoto(photoId) {
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-photo', photo_id: photoId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete photo failed: ${res.status}`);
  }
  return res.json();
}

export async function setCoverPhoto(propertyId, photoId) {
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set-cover-photo', property_id: propertyId, photo_id: photoId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Set cover photo failed: ${res.status}`);
  }
  return res.json();
}

export async function deletePropertyRecord(table, id) {
  const res = await fetch('/api/properties', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete failed: ${res.status}`);
  }
  return res.json();
}


// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function fetchTasks(status, assigned_to) {
  let params = '';
  if (status) params += `&status=${encodeURIComponent(status)}`;
  if (assigned_to) params += `&assigned_to=${encodeURIComponent(assigned_to)}`;
  const res = await fetch(`/api/tasks?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
  return res.json();
}

export async function createTask(data) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create task failed: ${res.status}`);
  }
  return res.json();
}

export async function updateTask(id, data) {
  const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update task failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete task failed: ${res.status}`);
  }
  return res.json();
}

// ─── Task Notes API ─────────────────────────────────────────────────────────

export async function fetchTaskNotes(taskId) {
  const res = await fetch(`/api/tasks?action=notes&task_id=${encodeURIComponent(taskId)}`);
  if (!res.ok) throw new Error(`Failed to fetch task notes: ${res.status}`);
  return res.json();
}

export async function addTaskNote(data) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add-note', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Add note failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteTaskNote(noteId) {
  const res = await fetch('/api/tasks', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-note', note_id: noteId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete note failed: ${res.status}`);
  }
  return res.json();
}

// ─── Screening Checklist API ─────────────────────────────────────────────────

export async function fetchScreenings(result, search) {
  let url = '/api/features?action=screening-list';
  if (result) url += `&result=${encodeURIComponent(result)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch screenings: ${res.status}`);
  return res.json();
}

export async function fetchScreening(id) {
  const res = await fetch(`/api/features?action=screening-get&id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch screening: ${res.status}`);
  return res.json();
}

export async function fetchScreeningStats() {
  const res = await fetch('/api/features?action=screening-stats');
  if (!res.ok) throw new Error(`Failed to fetch screening stats: ${res.status}`);
  return res.json();
}

export async function createScreening(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'screening-create', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create screening failed: ${res.status}`);
  }
  return res.json();
}

export async function updateScreening(id, data) {
  const res = await fetch('/api/features', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'screening-update', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update screening failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteScreening(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'screening-delete', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete screening failed: ${res.status}`);
  }
  return res.json();
}

// ─── Incident Reporting API ──────────────────────────────────────────────────

export async function fetchIncidents(status, severity, participantId, propertyId) {
  let url = '/api/features?action=incidents';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (severity) url += `&severity=${encodeURIComponent(severity)}`;
  if (participantId) url += `&participant_id=${encodeURIComponent(participantId)}`;
  if (propertyId) url += `&property_id=${encodeURIComponent(propertyId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.status}`);
  return res.json();
}

export async function fetchIncident(id) {
  const res = await fetch(`/api/features?action=incident&id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch incident: ${res.status}`);
  return res.json();
}

export async function fetchIncidentStats() {
  const res = await fetch('/api/features?action=incident-stats');
  if (!res.ok) throw new Error(`Failed to fetch incident stats: ${res.status}`);
  return res.json();
}

export async function createIncident(data) {
  const res = await fetch('/api/features?action=create-incident', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create incident failed: ${res.status}`);
  }
  return res.json();
}

export async function updateIncident(id, data) {
  const res = await fetch('/api/features?action=update-incident', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update incident failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteIncident(id) {
  const res = await fetch('/api/features?action=delete-incident', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete incident failed: ${res.status}`);
  }
  return res.json();
}

// ─── Announcements & Messages API ───────────────────────────────────────────

export async function fetchAnnouncements(targetRole) {
  let url = '/api/features?action=announcements';
  if (targetRole) url += `&target_role=${encodeURIComponent(targetRole)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch announcements: ${res.status}`);
  return res.json();
}

export async function createAnnouncement(data) {
  const res = await fetch('/api/features?action=create-announcement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create announcement failed: ${res.status}`);
  }
  return res.json();
}

export async function updateAnnouncement(id, data) {
  const res = await fetch('/api/features', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update announcement failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteAnnouncement(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'announcement', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete announcement failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchMessages(recipientId) {
  const res = await fetch(`/api/features?action=messages&recipient_id=${encodeURIComponent(recipientId)}`);
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  return res.json();
}

export async function fetchUnreadCount(recipientId) {
  const res = await fetch(`/api/features?action=unread-count&recipient_id=${encodeURIComponent(recipientId)}`);
  if (!res.ok) throw new Error(`Failed to fetch unread count: ${res.status}`);
  return res.json();
}

export async function sendMessage(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'message', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Send message failed: ${res.status}`);
  }
  return res.json();
}

export async function markMessageRead(id) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'mark-read', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Mark read failed: ${res.status}`);
  }
  return res.json();
}

// ─── Shift Management API ───────────────────────────────────────────────────

export async function fetchShiftHandovers(propertyId, date) {
  let url = '/api/time-clock?action=handovers';
  if (propertyId) url += `&property_id=${encodeURIComponent(propertyId)}`;
  if (date) url += `&date=${encodeURIComponent(date)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch handovers: ${res.status}`);
  return res.json();
}

export async function createShiftHandover(data) {
  const res = await fetch('/api/time-clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create-handover', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create handover failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchRoster(startDate, endDate, propertyId) {
  let url = `/api/time-clock?action=roster&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
  if (propertyId) url += `&property_id=${encodeURIComponent(propertyId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch roster: ${res.status}`);
  return res.json();
}

export async function createRosterShift(data) {
  const res = await fetch('/api/time-clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create-roster-shift', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create roster shift failed: ${res.status}`);
  }
  return res.json();
}

export async function updateRosterShift(id, data) {
  const res = await fetch('/api/time-clock', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update-roster', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update roster shift failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteRosterShift(id) {
  const res = await fetch('/api/time-clock', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-roster', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete roster shift failed: ${res.status}`);
  }
  return res.json();
}

// ─── Medication Charts API ──────────────────────────────────────────────────

export async function fetchMedications(participantId) {
  const res = await fetch(`/api/participants?action=medications&participant_id=${encodeURIComponent(participantId)}`);
  if (!res.ok) throw new Error(`Failed to fetch medications: ${res.status}`);
  return res.json();
}

export async function createMedication(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create-medication', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create medication failed: ${res.status}`);
  }
  return res.json();
}

export async function updateMedication(id, data) {
  const res = await fetch('/api/participants', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update-medication', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update medication failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteMedication(id) {
  const res = await fetch('/api/participants', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-medication', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete medication failed: ${res.status}`);
  }
  return res.json();
}

// ─── Participant Contacts API ───────────────────────────────────────────────

export async function fetchParticipantContacts(participantId) {
  const res = await fetch(`/api/participants?action=contacts&participant_id=${encodeURIComponent(participantId)}`);
  if (!res.ok) throw new Error(`Failed to fetch contacts: ${res.status}`);
  return res.json();
}

export async function createParticipantContact(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create-contact', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create contact failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteParticipantContact(id) {
  const res = await fetch('/api/participants', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-contact', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete contact failed: ${res.status}`);
  }
  return res.json();
}

// ─── Continuous Improvement API ──────────────────────────────────────────────

export async function fetchCIRegister(status, priority) {
  let url = '/api/features?action=ci-list';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (priority) url += `&priority=${encodeURIComponent(priority)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch CI register: ${res.status}`);
  return res.json();
}

export async function fetchCIStats() {
  const res = await fetch('/api/features?action=ci-stats');
  if (!res.ok) throw new Error(`Failed to fetch CI stats: ${res.status}`);
  return res.json();
}

export async function createCIEntry(data) {
  const res = await fetch('/api/features?action=ci-create', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Create CI entry failed: ${res.status}`); }
  return res.json();
}

export async function updateCIEntry(id, data) {
  const res = await fetch('/api/features?action=ci-update', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Update CI entry failed: ${res.status}`); }
  return res.json();
}

export async function deleteCIEntry(id) {
  const res = await fetch('/api/features?action=ci-delete', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Delete CI entry failed: ${res.status}`); }
  return res.json();
}

// ─── Risk Register API ──────────────────────────────────────────────────────

export async function fetchRiskRegister(status, riskRating) {
  let url = '/api/features?action=risk-list';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (riskRating) url += `&risk_rating=${encodeURIComponent(riskRating)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch risk register: ${res.status}`);
  return res.json();
}

export async function fetchRiskStats() {
  const res = await fetch('/api/features?action=risk-stats');
  if (!res.ok) throw new Error(`Failed to fetch risk stats: ${res.status}`);
  return res.json();
}

export async function createRiskEntry(data) {
  const res = await fetch('/api/features?action=risk-create', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Create risk entry failed: ${res.status}`); }
  return res.json();
}

export async function updateRiskEntry(id, data) {
  const res = await fetch('/api/features?action=risk-update', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Update risk entry failed: ${res.status}`); }
  return res.json();
}

export async function deleteRiskEntry(id) {
  const res = await fetch('/api/features?action=risk-delete', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Delete risk entry failed: ${res.status}`); }
  return res.json();
}

// ─── Hazard Register API ────────────────────────────────────────────────────

export async function fetchHazardRegister(status, propertyId) {
  let url = '/api/features?action=hazard-list';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (propertyId) url += `&property_id=${encodeURIComponent(propertyId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch hazard register: ${res.status}`);
  return res.json();
}

export async function fetchHazardStats() {
  const res = await fetch('/api/features?action=hazard-stats');
  if (!res.ok) throw new Error(`Failed to fetch hazard stats: ${res.status}`);
  return res.json();
}

export async function createHazardEntry(data) {
  const res = await fetch('/api/features?action=hazard-create', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Create hazard entry failed: ${res.status}`); }
  return res.json();
}

export async function updateHazardEntry(id, data) {
  const res = await fetch('/api/features?action=hazard-update', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Update hazard entry failed: ${res.status}`); }
  return res.json();
}

export async function deleteHazardEntry(id) {
  const res = await fetch('/api/features?action=hazard-delete', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Delete hazard entry failed: ${res.status}`); }
  return res.json();
}

// ─── Feedback & Complaints API ──────────────────────────────────────────────

export async function fetchFCRegister(status, type, severity) {
  let url = '/api/features?action=fc-list';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (type) url += `&type=${encodeURIComponent(type)}`;
  if (severity) url += `&severity=${encodeURIComponent(severity)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch feedback register: ${res.status}`);
  return res.json();
}

export async function fetchFCStats() {
  const res = await fetch('/api/features?action=fc-stats');
  if (!res.ok) throw new Error(`Failed to fetch FC stats: ${res.status}`);
  return res.json();
}

export async function createFCEntry(data) {
  const res = await fetch('/api/features?action=fc-create', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Create FC entry failed: ${res.status}`); }
  return res.json();
}

export async function updateFCEntry(id, data) {
  const res = await fetch('/api/features?action=fc-update', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Update FC entry failed: ${res.status}`); }
  return res.json();
}

export async function deleteFCEntry(id) {
  const res = await fetch('/api/features?action=fc-delete', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Delete FC entry failed: ${res.status}`); }
  return res.json();
}

// ─── Roster of Care API ──────────────────────────────────────────────────────

export async function fetchROCs(propertyId, status) {
  let url = '/api/features?action=roc-list';
  if (propertyId) url += `&property_id=${encodeURIComponent(propertyId)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ROCs: ${res.status}`);
  return res.json();
}

export async function fetchROC(id) {
  const res = await fetch(`/api/features?action=roc-get&id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch ROC: ${res.status}`);
  return res.json();
}

export async function fetchROCStats() {
  const res = await fetch('/api/features?action=roc-stats');
  if (!res.ok) throw new Error(`Failed to fetch ROC stats: ${res.status}`);
  return res.json();
}

export async function createROC(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-create', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create ROC failed: ${res.status}`);
  }
  return res.json();
}

export async function updateROC(id, data) {
  const res = await fetch('/api/features', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-update', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update ROC failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteROC(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-delete', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete ROC failed: ${res.status}`);
  }
  return res.json();
}

export async function addROCParticipant(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-add-participant', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Add participant failed: ${res.status}`);
  }
  return res.json();
}

export async function removeROCParticipant(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-remove-participant', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Remove participant failed: ${res.status}`);
  }
  return res.json();
}

export async function addROCTimeBlock(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-add-time-block', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Add time block failed: ${res.status}`);
  }
  return res.json();
}

export async function updateROCTimeBlock(id, data) {
  const res = await fetch('/api/features', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-update-time-block', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update time block failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteROCTimeBlock(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-delete-time-block', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete time block failed: ${res.status}`);
  }
  return res.json();
}

export async function assignROCStaff(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-assign-staff', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Assign staff failed: ${res.status}`);
  }
  return res.json();
}

export async function unassignROCStaff(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-unassign-staff', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Unassign staff failed: ${res.status}`);
  }
  return res.json();
}

export async function duplicateROC(id, name, effectiveFrom) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-duplicate', id, name, effective_from: effectiveFrom }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Duplicate ROC failed: ${res.status}`);
  }
  return res.json();
}

export async function copyROCDay(rosterId, fromDay, toDays) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'roc-copy-day', roster_id: rosterId, from_day: fromDay, to_days: toDays }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Copy day failed: ${res.status}`);
  }
  return res.json();
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function formatDate(dateString) {
  if (!dateString) return '--';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
