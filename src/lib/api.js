export async function fetchDocuments(category, subcategory, folder) {
  let params = category ? `&category=${encodeURIComponent(category)}` : '';
  if (subcategory) params += `&subcategory=${encodeURIComponent(subcategory)}`;
  if (folder) params += `&folder=${encodeURIComponent(folder)}`;
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

export async function uploadDocument(fileName, fileData, category, subcategory, folder) {
  // Estimate original file size from base64
  const base64Len = typeof fileData === 'string' ? fileData.length : 0;
  const fileSizeEstimate = Math.ceil(base64Len * 0.75);
  const SIZE_LIMIT = 2 * 1024 * 1024; // 2MB — anything larger uses signed URL

  if (fileSizeEstimate <= SIZE_LIMIT) {
    const res = await fetch('/api/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upload', fileName, fileData, category, subcategory: subcategory || undefined, folder: folder || undefined }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed: ${res.status}`);
    }
    return res.json();
  }

  // Large file — get signed URL, upload directly, then register metadata
  const signRes = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upload', fileName, category, subcategory: subcategory || undefined, folder: folder || undefined, requestSignedUrl: true }),
  });
  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed to get upload URL: ${signRes.status}`);
  }
  const { signedUrl, storagePath } = await signRes.json();

  // Decode base64 to blob and upload directly
  const raw = fileData.includes(',') ? fileData.split(',')[1] : fileData;
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
  const mimeMap = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
  const blob = new Blob([bytes], { type: mimeMap[ext] || 'application/octet-stream' });

  const uploadRes = await fetch(signedUrl, { method: 'PUT', body: blob });
  if (!uploadRes.ok) throw new Error(`Storage upload failed (${uploadRes.status})`);

  // Register metadata — file already in storage
  const metaRes = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upload', fileName, category, subcategory: subcategory || undefined, folder: folder || undefined, directUpload: true, storagePath, fileSize: bytes.length }),
  });
  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed to register document: ${metaRes.status}`);
  }
  return metaRes.json();
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

export async function moveDocuments(ids, category, subcategory, folder) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'move', ids, category, subcategory: subcategory || undefined, folder: folder || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Move failed: ${res.status}`);
  }
  return res.json();
}

export async function createFolder(name, category, subcategory, parentFolder) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create-folder', name, category, subcategory: subcategory || undefined, parentFolder: parentFolder || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create folder failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteFolder(id) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-folder', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete folder failed: ${res.status}`);
  }
  return res.json();
}

export async function renameFolder(id, newName) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'rename-folder', id, newName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Rename folder failed: ${res.status}`);
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
  'Resume',
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
  // Estimate file size from base64
  const base64Len = typeof fileData === 'string' ? fileData.length : 0;
  const fileSizeEstimate = Math.ceil(base64Len * 0.75);
  const SIZE_LIMIT = 2 * 1024 * 1024; // 2MB — anything larger uses signed URL to avoid Vercel 413

  if (fileSizeEstimate <= SIZE_LIMIT) {
    // File fits within Vercel body limit — send base64 through API route
    const res = await fetch('/api/staff-docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, documentType, fileName, fileData, issueDate, expiryDate, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed: ${res.status}`);
    }
    return res.json();
  }

  // Large file — get a signed upload URL, upload directly to Supabase Storage, then register metadata
  // Step 1: Request signed upload URL
  const signRes = await fetch('/api/staff-docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId, documentType, fileName, requestSignedUrl: true }),
  });
  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed to get upload URL: ${signRes.status}`);
  }
  const { signedUrl, storagePath, token } = await signRes.json();

  // Step 2: Decode base64 to Blob and upload directly to Supabase Storage
  const raw = fileData.includes(',') ? fileData.split(',')[1] : fileData;
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
  const mimeMap = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
  const contentType = mimeMap[ext] || 'application/octet-stream';
  const blob = new Blob([bytes], { type: contentType });

  let uploadRes;
  try {
    uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      body: blob,
    });
  } catch (networkErr) {
    throw new Error('Upload failed — check your connection and try again. If the file is very large, try a smaller file.');
  }
  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => '');
    throw new Error(`Storage upload failed (${uploadRes.status}). ${errText || 'Try a smaller file or different format.'}`);
  }

  // Step 3: Register metadata (file already in storage)
  const metaRes = await fetch('/api/staff-docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId, documentType, fileName, storagePath, fileSize: bytes.length, issueDate, expiryDate, notes, directUpload: true }),
  });
  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error || `Upload document failed: ${metaRes.status}`);
  }
  return metaRes.json();
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

function getGeoLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

export async function clockIn(staffId, notes) {
  const geo = await getGeoLocation();
  const res = await fetch('/api/time-clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'clock-in',
      staff_id: staffId,
      notes,
      ...(geo && { clock_in_lat: geo.lat, clock_in_lng: geo.lng, clock_in_accuracy: geo.accuracy }),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Clock-in failed: ${res.status}`);
  }
  return res.json();
}

export async function clockOut(staffId, notes) {
  const geo = await getGeoLocation();
  const res = await fetch('/api/time-clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'clock-out',
      staff_id: staffId,
      notes,
      ...(geo && { clock_out_lat: geo.lat, clock_out_lng: geo.lng, clock_out_accuracy: geo.accuracy }),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Clock-out failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchLocationLog(startDate, endDate, staffId) {
  let url = `/api/time-clock?action=location-log&start_date=${startDate}&end_date=${endDate}`;
  if (staffId) url += `&staff_id=${staffId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch location log: ${res.status}`);
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

export async function refreshToken(refresh_token) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'refresh', refresh_token }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Token refresh failed: ${res.status}`);
  }
  return res.json();
}

export async function signupUser(email, password, full_name, role) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'signup', email, password, full_name, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Signup failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchAllUsers(token) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: 'list-users' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Fetch users failed: ${res.status}`);
  }
  return res.json();
}

export async function updateUser(token, user_id, { full_name, email, role }) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: 'update-user', user_id, full_name, email, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update user failed: ${res.status}`);
  }
  return res.json();
}

export async function updateUserRole(token, user_id, role) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: 'update-role', user_id, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update role failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteUser(token, user_id) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: 'delete-user', user_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete user failed: ${res.status}`);
  }
  return res.json();
}

export async function resetUserPassword(token, user_id, new_password) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: 'reset-password', user_id, new_password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Reset password failed: ${res.status}`);
  }
  return res.json();
}

export const CATEGORIES = [
  'Human Resources',
  'Onboarding',
  'Clinical',
  'Governance & Compliance',
  'Operations',
  'Policies & Procedures',
  'Invoices',
  'Completed Records',
  'Archive',
];

export const SUBCATEGORIES = {
  'Human Resources': ['Job Descriptions', 'Employment', 'Performance', 'Induction', 'Training'],
  'Onboarding': ['Participant Intake', 'Service Agreements', 'Welcome Packs', 'Transition'],
  'Clinical': ['Medication', 'Behaviour Support', 'Care Plans', 'Complex Health', 'Nutrition', 'Capability Assessments'],
  'Governance & Compliance': ['NDIS Manual', 'NDIS Information', 'Audits', 'Risk Management', 'Compliance', 'Business Plans', 'Policies & Modules'],
  'Operations': ['SIL & SDA', 'Safety & WHS', 'Rostering', 'Incidents & Complaints', 'Records', 'General'],
  'Policies & Procedures': ['Core 1 - Rights & Responsibilities', 'Core 2 - Governance & Operations', 'Core 3 - Provision of Supports', 'Core 4 - Support Environment', 'Module 1 - High Intensity', 'Module 2A - Behaviour Support'],
  'Invoices': ['Supplier Invoices', 'Service Invoices', 'Receipts'],
  'Completed Records': [],
  'Archive': [],
};

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

export async function addRiskAssessment(data) {
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add-risk-assessment', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Add risk assessment failed: ${res.status}`);
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
    body: JSON.stringify({ action: 'update-announcement', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update announcement failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadAnnouncementImage(fileName, fileData) {
  const res = await fetch('/api/features?action=upload-announcement-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, fileData }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload announcement image failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteAnnouncement(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-announcement', id }),
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
    body: JSON.stringify({ action: 'send-message', ...data }),
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

// ─── Support Plans API ──────────────────────────────────────────────────────

export async function fetchSupportPlan(participantId) {
  const res = await fetch(`/api/participants?action=support-plan-get&participant_id=${encodeURIComponent(participantId)}`);
  if (!res.ok) throw new Error(`Failed to fetch support plan: ${res.status}`);
  return res.json();
}

export async function fetchSupportPlans(participantId) {
  const res = await fetch(`/api/participants?action=support-plan-list&participant_id=${encodeURIComponent(participantId)}`);
  if (!res.ok) throw new Error(`Failed to fetch support plans: ${res.status}`);
  return res.json();
}

export async function createSupportPlan(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'support-plan-create', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create support plan failed: ${res.status}`);
  }
  return res.json();
}

export async function updateSupportPlan(id, data) {
  const res = await fetch('/api/participants', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'support-plan-update', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update support plan failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteSupportPlan(id) {
  const res = await fetch('/api/participants', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'support-plan-delete', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete support plan failed: ${res.status}`);
  }
  return res.json();
}

// ─── Goals of Care ──────────────────────────────────────────────────────────

export async function fetchGoalsOfCare(participantId) {
  const res = await fetch(`/api/participants?action=goals-of-care-list&participant_id=${encodeURIComponent(participantId)}`);
  if (!res.ok) throw new Error(`Failed to fetch goals: ${res.status}`);
  return res.json();
}

export async function createGoalOfCare(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'goals-of-care-create', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create goal failed: ${res.status}`);
  }
  return res.json();
}

export async function updateGoalOfCare(id, data) {
  const res = await fetch('/api/participants', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'goals-of-care-update', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update goal failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteGoalOfCare(id) {
  const res = await fetch('/api/participants', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'goals-of-care-delete', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete goal failed: ${res.status}`);
  }
  return res.json();
}

// ─── Risk Profiles ──────────────────────────────────────────────────────────

export async function fetchRiskProfile(participantId) {
  const res = await fetch(`/api/participants?action=risk-profile-get&participant_id=${encodeURIComponent(participantId)}`);
  if (!res.ok) throw new Error(`Failed to fetch risk profile: ${res.status}`);
  return res.json();
}

export async function createRiskProfile(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'risk-profile-create', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create risk profile failed: ${res.status}`);
  }
  return res.json();
}

export async function updateRiskProfile(id, data) {
  const res = await fetch('/api/participants', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'risk-profile-update', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update risk profile failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteRiskProfile(id) {
  const res = await fetch('/api/participants', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'risk-profile-delete', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete risk profile failed: ${res.status}`);
  }
  return res.json();
}

// ─── Hospital Passport API ──────────────────────────────────────────────────

export async function fetchHospitalPassport(participantId) {
  const res = await fetch(`/api/participants?action=hospital-passport-get&participant_id=${encodeURIComponent(participantId)}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch hospital passport: ${res.status}`);
  }
  return res.json();
}

export async function saveHospitalPassport(data) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'hospital-passport-save', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Save hospital passport failed: ${res.status}`);
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

// ─── Policy Register API ─────────────────────────────────────────────────────

export async function fetchPolicyRegister(status, source) {
  let url = '/api/features?action=policy-list';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (source) url += `&source=${encodeURIComponent(source)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch policy register: ${res.status}`);
  return res.json();
}

export async function fetchPolicyStats() {
  const res = await fetch('/api/features?action=policy-stats');
  if (!res.ok) throw new Error(`Failed to fetch policy stats: ${res.status}`);
  return res.json();
}

export async function createPolicyEntry(data) {
  const res = await fetch('/api/features?action=policy-create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Create failed: ${res.status}`); }
  return res.json();
}

export async function updatePolicyEntry(id, data) {
  const res = await fetch('/api/features?action=policy-update', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Update failed: ${res.status}`); }
  return res.json();
}

export async function deletePolicyEntry(id) {
  const res = await fetch('/api/features?action=policy-delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Delete failed: ${res.status}`); }
  return res.json();
}

// ─── Conflict of Interest Register API ───────────────────────────────────────

export async function fetchConflictOfInterest(status) {
  let url = '/api/features?action=coi-list';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch conflict of interest register: ${res.status}`);
  return res.json();
}

export async function fetchConflictStats() {
  const res = await fetch('/api/features?action=coi-stats');
  if (!res.ok) throw new Error(`Failed to fetch conflict stats: ${res.status}`);
  return res.json();
}

export async function createConflictEntry(data) {
  const res = await fetch('/api/features?action=coi-create', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Create conflict entry failed: ${res.status}`); }
  return res.json();
}

export async function updateConflictEntry(id, data) {
  const res = await fetch('/api/features?action=coi-update', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Update conflict entry failed: ${res.status}`); }
  return res.json();
}

export async function deleteConflictEntry(id) {
  const res = await fetch('/api/features?action=coi-delete', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Delete conflict entry failed: ${res.status}`); }
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

// ─── SDS Register API ────────────────────────────────────────────────────────

export async function fetchSDSRegister(risk_rating) {
  let url = '/api/features?action=sds-list';
  if (risk_rating) url += `&risk_rating=${encodeURIComponent(risk_rating)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch SDS register: ${res.status}`);
  return res.json();
}

export async function createSDSEntry(data) {
  const res = await fetch('/api/features?action=sds-create', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Create SDS entry failed: ${res.status}`); }
  return res.json();
}

export async function updateSDSEntry(id, data) {
  const res = await fetch('/api/features?action=sds-update', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Update SDS entry failed: ${res.status}`); }
  return res.json();
}

export async function deleteSDSEntry(id) {
  const res = await fetch('/api/features?action=sds-delete', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Delete SDS entry failed: ${res.status}`); }
  return res.json();
}

// ─── Infection Register API ──────────────────────────────────────────────────

export async function fetchInfectionRegister(status, infection_type) {
  let url = '/api/features?action=infection-list';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (infection_type) url += `&infection_type=${encodeURIComponent(infection_type)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch infection register: ${res.status}`);
  return res.json();
}

export async function fetchInfectionStats() {
  const res = await fetch('/api/features?action=infection-stats');
  if (!res.ok) throw new Error(`Failed to fetch infection stats: ${res.status}`);
  return res.json();
}

export async function createInfectionEntry(data) {
  const res = await fetch('/api/features?action=infection-create', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Create infection entry failed: ${res.status}`); }
  return res.json();
}

export async function updateInfectionEntry(id, data) {
  const res = await fetch('/api/features?action=infection-update', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Update infection entry failed: ${res.status}`); }
  return res.json();
}

export async function deleteInfectionEntry(id) {
  const res = await fetch('/api/features?action=infection-delete', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Delete infection entry failed: ${res.status}`); }
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

// ─── Progress Notes API ──────────────────────────────────────────────────────

export async function fetchProgressNotes(participantName, startDate, endDate, search, { participantId } = {}) {
  let url = '/api/features?action=pn-list';
  if (participantId) url += `&participant_id=${encodeURIComponent(participantId)}`;
  else if (participantName) url += `&participant_name=${encodeURIComponent(participantName)}`;
  if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch progress notes: ${res.status}`);
  return res.json();
}

export async function fetchProgressNoteStats() {
  const res = await fetch('/api/features?action=pn-stats');
  if (!res.ok) throw new Error(`Failed to fetch progress note stats: ${res.status}`);
  return res.json();
}

export async function createProgressNote(data) {
  const res = await fetch('/api/features?action=pn-create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create progress note failed: ${res.status}`);
  }
  return res.json();
}

export async function updateProgressNote(id, data) {
  const res = await fetch('/api/features?action=pn-update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update progress note failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteProgressNote(id) {
  const res = await fetch('/api/features?action=pn-delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete progress note failed: ${res.status}`);
  }
  return res.json();
}

export async function bulkImportProgressNotes(notesArray) {
  const res = await fetch('/api/features?action=pn-bulk-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: notesArray }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Bulk import failed: ${res.status}`);
  }
  return res.json();
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function fetchInvoices(status, participantId) {
  let params = '';
  if (status) params += `&status=${encodeURIComponent(status)}`;
  if (participantId) params += `&participant_id=${encodeURIComponent(participantId)}`;
  const res = await fetch(`/api/features?action=inv-list${params}`);
  if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.status}`);
  return res.json();
}

export async function fetchInvoice(id) {
  const res = await fetch(`/api/features?action=inv-get&id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch invoice: ${res.status}`);
  return res.json();
}

export async function fetchInvoiceStats() {
  const res = await fetch('/api/features?action=inv-stats');
  if (!res.ok) throw new Error(`Failed to fetch invoice stats: ${res.status}`);
  return res.json();
}

export async function createInvoice(data) {
  const res = await fetch('/api/features?action=inv-create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create invoice failed: ${res.status}`);
  }
  return res.json();
}

export async function updateInvoice(id, data) {
  const res = await fetch('/api/features?action=inv-update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update invoice failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteInvoice(id) {
  const res = await fetch('/api/features?action=inv-delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete invoice failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadInvoiceFile(data) {
  const res = await fetch('/api/features?action=inv-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload invoice file failed: ${res.status}`);
  }
  return res.json();
}

// ─── NDIS Invoice Generator ──────────────────────────────────────────────────

export async function fetchNDISInvoiceData(participantId, startDate, endDate) {
  const res = await fetch(`/api/features?action=ndis-invoice-data&participant_id=${encodeURIComponent(participantId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch NDIS invoice data: ${res.status}`);
  }
  return res.json();
}

// ─── Payslips ─────────────────────────────────────────────────────────────────

export async function fetchPayslipData(startDate, endDate) {
  const res = await fetch(`/api/features?action=payslip-data&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`);
  if (!res.ok) throw new Error(`Failed to fetch payslip data: ${res.status}`);
  return res.json();
}

// ─── Role Permissions ────────────────────────────────────────────────────────

export async function fetchPermissions() {
  const res = await fetch('/api/features?action=permissions-list');
  if (!res.ok) throw new Error('Failed to fetch permissions');
  return res.json();
}

export async function updatePermission(role, feature, canAccess) {
  const res = await fetch('/api/features?action=permissions-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, feature, can_access: canAccess }),
  });
  if (!res.ok) throw new Error('Failed to update permission');
  return res.json();
}

// ─── Onboarding Checklist API ────────────────────────────────────────────────

export async function fetchOnboardingProgress(staffId) {
  const res = await fetch(`/api/onboarding?action=progress&staffId=${encodeURIComponent(staffId)}`);
  if (!res.ok) throw new Error(`Failed to fetch onboarding progress: ${res.status}`);
  return res.json();
}

export async function toggleOnboardingItem(staffId, templateId, completed, completedBy) {
  const res = await fetch('/api/onboarding?action=toggle', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId, templateId, completed, completedBy }),
  });
  if (!res.ok) throw new Error(`Failed to toggle onboarding item: ${res.status}`);
  return res.json();
}

export async function fetchBulkOnboardingProgress(staffIds) {
  const res = await fetch(`/api/onboarding?action=bulk-progress&staffIds=${staffIds.join(',')}`);
  if (!res.ok) throw new Error(`Failed to fetch bulk onboarding progress: ${res.status}`);
  return res.json();
}

// ─── Asset Register API ──────────────────────────────────────────────────────

export async function fetchAssets(category, status) {
  let url = '/api/features?action=asset-list';
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch assets: ${res.status}`);
  return res.json();
}

export async function fetchAssetStats() {
  const res = await fetch('/api/features?action=asset-stats');
  if (!res.ok) throw new Error(`Failed to fetch asset stats: ${res.status}`);
  return res.json();
}

export async function createAsset(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'asset-create', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create asset failed: ${res.status}`);
  }
  return res.json();
}

export async function updateAsset(id, data) {
  const res = await fetch('/api/features', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'asset-update', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update asset failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteAsset(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'asset-delete', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete asset failed: ${res.status}`);
  }
  return res.json();
}

// ─── Expense Tracker API ─────────────────────────────────────────────────────

export async function fetchExpenses(category, status, month) {
  let url = '/api/features?action=expense-list';
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (month) url += `&month=${encodeURIComponent(month)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch expenses: ${res.status}`);
  return res.json();
}

export async function fetchExpenseStats(month) {
  let url = '/api/features?action=expense-stats';
  if (month) url += `&month=${encodeURIComponent(month)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch expense stats: ${res.status}`);
  return res.json();
}

export async function createExpense(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'expense-create', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create expense failed: ${res.status}`);
  }
  return res.json();
}

export async function updateExpense(id, data) {
  const res = await fetch('/api/features', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'expense-update', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update expense failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteExpense(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'expense-delete', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete expense failed: ${res.status}`);
  }
  return res.json();
}

// ─── Orientation Guide API ─────────────────────────────────────────────────────

export async function fetchOrientation(participantId) {
  const res = await fetch(`/api/features?action=orientation-get&participant_id=${encodeURIComponent(participantId)}`);
  if (!res.ok) throw new Error(`Failed to fetch orientation: ${res.status}`);
  return res.json();
}

export async function saveOrientation(data) {
  const res = await fetch('/api/features?action=orientation-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to save orientation: ${res.status}`);
  return res.json();
}

// ─── Legislation Register API ─────────────────────────────────────────────────

export async function fetchLegislation(complianceStatus, legislationType, jurisdiction) {
  let url = '/api/features?action=legislation-list';
  if (complianceStatus) url += `&compliance_status=${encodeURIComponent(complianceStatus)}`;
  if (legislationType) url += `&legislation_type=${encodeURIComponent(legislationType)}`;
  if (jurisdiction) url += `&jurisdiction=${encodeURIComponent(jurisdiction)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch legislation: ${res.status}`);
  return res.json();
}

export async function fetchLegislationStats() {
  const res = await fetch('/api/features?action=legislation-stats');
  if (!res.ok) throw new Error(`Failed to fetch legislation stats: ${res.status}`);
  return res.json();
}

export async function createLegislation(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'legislation-create', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create legislation failed: ${res.status}`);
  }
  return res.json();
}

export async function updateLegislation(id, data) {
  const res = await fetch('/api/features', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'legislation-update', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update legislation failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteLegislation(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'legislation-delete', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete legislation failed: ${res.status}`);
  }
  return res.json();
}

// ─── Recurring Expenses API ───────────────────────────────────────────────────

export async function fetchRecurring(activeOnly = true) {
  const res = await fetch(`/api/features?action=recurring-list&active_only=${activeOnly}`);
  if (!res.ok) throw new Error(`Failed to fetch recurring: ${res.status}`);
  return res.json();
}

export async function createRecurring(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'recurring-create', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create recurring failed: ${res.status}`);
  }
  return res.json();
}

export async function updateRecurring(id, data) {
  const res = await fetch('/api/features', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'recurring-update', id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update recurring failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteRecurring(id) {
  const res = await fetch('/api/features', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'recurring-delete', id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete recurring failed: ${res.status}`);
  }
  return res.json();
}

// ─── Team Chat API ───────────────────────────────────────────────────────────

export async function fetchTeamChat() {
  const res = await fetch('/api/features?action=team-chat');
  if (!res.ok) throw new Error('Failed to fetch team chat');
  return res.json();
}

export async function sendTeamChat(data) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'send-team-chat', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send message');
  }
  return res.json();
}

export async function deleteTeamChat(id, senderId, role) {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-team-chat', id, sender_id: senderId, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete message');
  }
  return res.json();
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export async function fetchActivityFeed() {
  const res = await fetch('/api/features?action=activity-feed');
  if (!res.ok) throw new Error('Failed to fetch activity feed');
  return res.json();
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function formatDate(dateString) {
  if (!dateString) return '--';
  // Date-only values (due dates, expiry dates, note dates) are calendar days, not
  // moments: print them as dd/mm/yyyy rather than "Xd ago"/"Just now".
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);
  const now = new Date();
  const diffMs = now - date;
  // Future timestamps (scheduled/due) — relative wording makes no sense, print the date
  if (diffMs < -12 * 3600000) return date.toLocaleDateString('en-AU');
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

// ─── Audit Calendar ──────────────────────────────────────────────────────────

export async function fetchAuditEvents() {
  const res = await fetch('/api/features?action=audit-list');
  if (!res.ok) throw new Error(`Failed to fetch audit events: ${res.status}`);
  return res.json();
}

export async function createAuditEvent(data) {
  const res = await fetch('/api/features?action=audit-create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Create audit event failed: ${res.status}`);
  }
  return res.json();
}

export async function updateAuditEvent(id, data) {
  const res = await fetch('/api/features?action=audit-update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update audit event failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteAuditEvent(id) {
  const res = await fetch('/api/features?action=audit-delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete audit event failed: ${res.status}`);
  }
  return res.json();
}

// ─── Expense Hub API (Finance Hub synced data) ────────────────────────────────

export async function fetchHubExpenses(month) {
  const params = new URLSearchParams({ action: 'hub-expenses' });
  if (month) params.set('month', month);
  const res = await fetch(`/api/features?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch hub expenses: ${res.status}`);
  return res.json();
}

export async function fetchHubInvoices(month) {
  const params = new URLSearchParams({ action: 'hub-invoices' });
  if (month) params.set('month', month);
  const res = await fetch(`/api/features?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch hub invoices: ${res.status}`);
  return res.json();
}

export async function fetchHubStats(month) {
  const params = new URLSearchParams({ action: 'hub-stats' });
  if (month) params.set('month', month);
  const res = await fetch(`/api/features?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch hub stats: ${res.status}`);
  return res.json();
}

export async function createHubInvoice(data) {
  const res = await fetch('/api/features?action=hub-invoice-create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create invoice: ${res.status}`);
  }
  return res.json();
}

export async function updateHubInvoice(data) {
  const res = await fetch('/api/features?action=hub-invoice-update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update invoice: ${res.status}`);
  }
  return res.json();
}

export async function deleteHubInvoice(id) {
  const res = await fetch(`/api/features?action=hub-invoice-delete&id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete invoice: ${res.status}`);
  return res.json();
}

// ─── Rosters (admin only; every call carries the session token) ─────────

const rosterHeaders = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });
async function rosterRes(res, what) {
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `${what} failed: ${res.status}`); }
  return res.json();
}
export async function fetchRosters(token, participantId) {
  let url = '/api/rosters?action=list';
  if (participantId) url += `&participant_id=${encodeURIComponent(participantId)}`;
  return rosterRes(await fetch(url, { headers: rosterHeaders(token) }), 'Load rosters');
}
export async function getRosterLink(token, id) {
  return rosterRes(await fetch(`/api/rosters?action=link&id=${encodeURIComponent(id)}`, { headers: rosterHeaders(token) }), 'Open roster');
}
export async function uploadRoster(token, data) {
  return rosterRes(await fetch('/api/rosters?action=upload', { method: 'POST', headers: rosterHeaders(token), body: JSON.stringify({ action: 'upload', ...data }) }), 'Upload roster');
}
export async function updateRoster(token, data) {
  return rosterRes(await fetch('/api/rosters', { method: 'PATCH', headers: rosterHeaders(token), body: JSON.stringify(data) }), 'Update roster');
}
export async function deleteRoster(token, id) {
  return rosterRes(await fetch('/api/rosters', { method: 'DELETE', headers: rosterHeaders(token), body: JSON.stringify({ id }) }), 'Delete roster');
}

// ─── Payment Review Desk (admin/manager; every call carries the session token) ─

async function prRes(res, what) {
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `${what} failed: ${res.status}`); }
  return res.json();
}
export async function prGet(token, action, params = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  return prRes(await fetch(`/api/payment-reviews?${qs}`, { headers: rosterHeaders(token) }), 'Load');
}
export async function prPost(token, action, body = {}) {
  return prRes(await fetch(`/api/payment-reviews?action=${action}`, { method: 'POST', headers: rosterHeaders(token), body: JSON.stringify({ action, ...body }) }), 'Save');
}
export async function prGapsPdf(token, reviewId) {
  const res = await fetch(`/api/payment-reviews?action=gaps-pdf&review_id=${encodeURIComponent(reviewId)}`, { headers: rosterHeaders(token) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Gaps PDF failed: ${res.status}`); }
  const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || 'gaps.pdf';
  return { blob: await res.blob(), name };
}
