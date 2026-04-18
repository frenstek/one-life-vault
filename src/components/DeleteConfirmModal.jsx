import { useState, useEffect } from 'react';
import { HiTrash, HiExclamationTriangle } from 'react-icons/hi2';
import { deleteDocument } from '../lib/api';
import Modal, { ModalFooter, ModalError, ButtonDanger, ButtonSecondary } from './ui/Modal';

export default function DeleteConfirmModal({ isOpen, onClose, document, onDeleteComplete }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setDeleting(false);
      setError(null);
    }
  }, [isOpen]);

  async function handleDelete() {
    if (!document) return;
    setDeleting(true);
    setError(null);

    try {
      await deleteDocument(document.id);
      onDeleteComplete?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal isOpen={isOpen && !!document} onClose={onClose} title="Delete Document" icon={HiTrash} iconColor="text-red-600" size="sm">
      <div className="p-6">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <HiExclamationTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Are you sure you want to delete this document?
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{document?.name}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              This action cannot be undone. The file will be permanently removed.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ModalError message={error} />
        </div>
      </div>
      <ModalFooter>
        <ButtonSecondary onClick={onClose} disabled={deleting}>Cancel</ButtonSecondary>
        <ButtonDanger onClick={handleDelete} loading={deleting}>
          {deleting ? 'Deleting...' : <><HiTrash className="h-4 w-4" /> Delete</>}
        </ButtonDanger>
      </ModalFooter>
    </Modal>
  );
}
