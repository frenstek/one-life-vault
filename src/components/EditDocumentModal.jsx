import { useState, useEffect } from 'react';
import { HiPencilSquare, HiCheckCircle } from 'react-icons/hi2';
import { updateDocument, CATEGORIES, SUBCATEGORIES } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

export default function EditDocumentModal({ isOpen, onClose, document, onSaveComplete }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (document) {
      setName(document.name || '');
      setCategory(document.category || '');
      setSubcategory(document.subcategory || '');
      setError(null);
    }
  }, [document]);

  async function handleSave() {
    if (!name.trim() || !category) return;

    setSaving(true);
    setError(null);

    try {
      await updateDocument(document.id, {
        name: name.trim(),
        category,
        subcategory: subcategory.trim() || undefined,
      });
      onSaveComplete?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen && !!document} onClose={onClose} title="Edit Document" icon={HiPencilSquare} iconColor="text-brand-500" size="md">
      <ModalBody>
        <div className="space-y-6">
          <div>
            <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Document Name <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category <span className="text-red-500">*</span></label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}>
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          {category && SUBCATEGORIES[category]?.length > 0 && (
            <div>
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Subcategory <span className="text-xs text-slate-400">(optional)</span></label>
              <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                <option value="">Select a subcategory</option>
                {SUBCATEGORIES[category].map((sub) => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          )}
          <ModalError message={error} />
        </div>
      </ModalBody>
      <ModalFooter>
        <ButtonSecondary onClick={onClose} disabled={saving}>Cancel</ButtonSecondary>
        <ButtonPrimary onClick={handleSave} disabled={!name.trim() || !category} loading={saving}>
          {saving ? 'Saving...' : <><HiCheckCircle className="h-4 w-4" /> Save Changes</>}
        </ButtonPrimary>
      </ModalFooter>
    </Modal>
  );
}
