import { useState, useEffect, useRef } from 'react';
import {
  HiArrowUpTray,
  HiDocumentText,
  HiCloudArrowUp,
} from 'react-icons/hi2';
import { uploadStaffDocument, STAFF_DOCUMENT_TYPES } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

export default function UploadStaffDocModal({ isOpen, onClose, staffId, preselectedType, onUploaded, allowCustomType = false }) {
  const [docType, setDocType] = useState('');
  const [customType, setCustomType] = useState('');
  const [file, setFile] = useState(null);
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setDocType(preselectedType || (allowCustomType ? '__custom' : ''));
      setCustomType('');
      setFile(null);
      setIssueDate('');
      setExpiryDate('');
      setNotes('');
      setUploading(false);
      setError(null);
      setDragOver(false);
    }
  }, [isOpen, preselectedType, allowCustomType]);

  function toBase64(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  const effectiveDocType = docType === '__custom' ? customType.trim() : docType;
  const canSubmit = effectiveDocType && file;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setUploading(true);
    setError(null);

    try {
      const fileData = await toBase64(file);
      await uploadStaffDocument(
        staffId,
        effectiveDocType,
        file.name,
        fileData,
        issueDate || undefined,
        expiryDate || undefined,
        notes.trim() || undefined
      );
      onUploaded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={allowCustomType ? 'Upload Staff File' : 'Upload Document'} icon={HiArrowUpTray} iconColor="text-brand-500" size="md">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <ModalError message={error} />

            {/* Document type */}
            {allowCustomType ? (
              <div>
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Document Type <span className="text-red-500">*</span></label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="__custom">Custom label...</option>
                  <optgroup label="Standard Types">
                    {STAFF_DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                </select>
                {docType === '__custom' && (
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="e.g. Training Certificate, Performance Review"
                    className="mt-3"
                    required
                  />
                )}
              </div>
            ) : (
              <div>
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Document Type <span className="text-red-500">*</span></label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} required>
                  <option value="">Select document type...</option>
                  {STAFF_DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            {/* File drop zone */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">File <span className="text-red-500">*</span></label>
              <div
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                  dragOver
                    ? 'border-accent-500 bg-green-50 dark:bg-green-900/20'
                    : file
                    ? 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10'
                    : 'border-slate-300 dark:border-[#334766] bg-slate-50 dark:bg-[#1e2d4a]/30 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {file ? (
                  <div className="flex items-center gap-3">
                    <HiDocumentText className="h-8 w-8 text-accent-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <HiCloudArrowUp className="mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-accent-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-slate-400">PDF, images, Word documents, etc.</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} className="hidden" />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Issue Date</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Expiry Date</label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..." />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={onClose} disabled={uploading}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" disabled={!canSubmit} loading={uploading}>
            {uploading ? 'Uploading...' : <><HiArrowUpTray className="h-4 w-4" /> Upload</>}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
