import { useEffect } from 'react';
import { HiXMark } from 'react-icons/hi2';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export default function Modal({ isOpen, onClose, title, icon: Icon, iconColor = 'text-accent-500', size = 'md', children }) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full ${SIZES[size]} rounded-2xl bg-white dark:bg-[#162036] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-modal-in border border-transparent dark:border-[#263554]`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#263554] px-10 py-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
            )}
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-300"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>
        {/* Content — scrollable */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalBody({ children, className = '' }) {
  return (
    <div className={`px-10 py-8 ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ children }) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-[#263554] px-10 py-6">
      {children}
    </div>
  );
}

export function ModalError({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      {message}
    </div>
  );
}

export function ButtonPrimary({ children, disabled, type = 'button', onClick, loading, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {children}
    </button>
  );
}

export function ButtonSecondary({ children, disabled, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border border-slate-300 dark:border-[#334766] px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonDanger({ children, disabled, onClick, loading, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {children}
    </button>
  );
}
