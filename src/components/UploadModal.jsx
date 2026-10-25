import { useState, useRef, useCallback, useEffect } from 'react';
import {
  HiArrowUpTray,
  HiDocumentPlus,
  HiCheckCircle,
} from 'react-icons/hi2';
import { uploadDocument, CATEGORIES, SUBCATEGORIES, formatFileSize } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.xlsx,.xls,.pptx,.rtf,.txt,.csv';
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export default function UploadModal({ isOpen, onClose, onUploadComplete, defaultCategory = '', defaultSubcategory = '', defaultFolder = '' }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(defaultCategory);
  const [subcategory, setSubcategory] = useState(defaultSubcategory);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
      setSubcategory(defaultSubcategory);
    } else {
      setFile(null);
      setCategory(defaultCategory);
      setSubcategory(defaultSubcategory);
      setUploading(false);
      setError(null);
      setSuccess(false);
      setDragOver(false);
    }
  }, [isOpen, defaultCategory, defaultSubcategory]);

  const handleFile = useCallback((f) => {
    setError(null);
    setSuccess(false);
    if (f.size > MAX_SIZE) {
      setError(`File too large (${formatFileSize(f.size)}). Maximum is 25MB.`);
      return;
    }
    setFile(f);
  }, []);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file || !category) return;

    setUploading(true);
    setError(null);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await uploadDocument(file.name, base64, category, subcategory || undefined, defaultFolder || undefined);
      setSuccess(true);
      setTimeout(() => {
        onUploadComplete?.();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document" icon={HiDocumentPlus} iconColor="text-brand-500" size="md">
      <ModalBody>
        <div className="space-y-6">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
              dragOver
                ? 'border-accent-500 bg-green-50 dark:bg-green-900/20'
                : file
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                  : 'border-slate-200 dark:border-[#334766] hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]/50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              className="hidden"
            />
            {file ? (
              <>
                <HiCheckCircle className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-2 text-xs font-medium text-brand-500 hover:underline"
                >
                  Choose a different file
                </button>
              </>
            ) : (
              <>
                <HiArrowUpTray className="mb-2 h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  PDF, Word, Excel, PowerPoint, RTF, TXT, CSV (max 25MB)
                </p>
              </>
            )}
          </div>

          {/* Category — locked when uploading inside a folder */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category <span className="text-red-500">*</span></label>
            {defaultFolder ? (
              <div className="rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0a1628] px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{category}</div>
            ) : (
              <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}>
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            )}
          </div>

          {/* Subcategory — locked when uploading inside a folder */}
          {category && SUBCATEGORIES[category]?.length > 0 && (
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Subcategory <span className="text-xs text-slate-400">(optional)</span></label>
              {defaultFolder ? (
                <div className="rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#0a1628] px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{subcategory || '—'}</div>
              ) : (
                <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                  <option value="">Select a subcategory</option>
                  {SUBCATEGORIES[category].map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              )}
            </div>
          )}

          <ModalError message={error} />

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-600 dark:text-green-400">
              <HiCheckCircle className="h-4 w-4 flex-shrink-0" />
              Document uploaded successfully!
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <ButtonSecondary onClick={onClose} disabled={uploading}>Cancel</ButtonSecondary>
        <ButtonPrimary onClick={handleUpload} disabled={!file || !category || success} loading={uploading}>
          {uploading ? 'Uploading...' : <><HiArrowUpTray className="h-4 w-4" /> Upload</>}
        </ButtonPrimary>
      </ModalFooter>
    </Modal>
  );
}
