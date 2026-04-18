import { useState, useEffect } from 'react';
import { HiArrowRightCircle } from 'react-icons/hi2';
import { moveDocuments, CATEGORIES } from '../lib/api';
import Modal, { ModalBody, ModalFooter, ModalError, ButtonPrimary, ButtonSecondary } from './ui/Modal';

export default function MoveDocumentsModal({ isOpen, onClose, documentIds, onMoveComplete }) {
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCategory('');
      setSubcategory('');
      setMoving(false);
      setError(null);
    }
  }, [isOpen]);

  async function handleMove() {
    if (!category || !documentIds?.length) return;
    setMoving(true);
    setError(null);

    try {
      await moveDocuments(documentIds, category, subcategory.trim() || undefined);
      onMoveComplete?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setMoving(false);
    }
  }

  const count = documentIds?.length || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Move Documents" icon={HiArrowRightCircle} iconColor="text-brand-500" size="md">
      <ModalBody>
        <div className="space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Move <span className="font-semibold">{count}</span> document{count !== 1 ? 's' : ''} to a new category.
          </p>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Destination Category <span className="text-red-500">*</span></label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Subcategory <span className="text-xs text-slate-400">(optional)</span></label>
            <input type="text" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="e.g., Section 1, Part A" />
          </div>
          <ModalError message={error} />
        </div>
      </ModalBody>
      <ModalFooter>
        <ButtonSecondary onClick={onClose} disabled={moving}>Cancel</ButtonSecondary>
        <ButtonPrimary onClick={handleMove} disabled={!category} loading={moving}>
          {moving ? 'Moving...' : <><HiArrowRightCircle className="h-4 w-4" /> Move</>}
        </ButtonPrimary>
      </ModalFooter>
    </Modal>
  );
}
