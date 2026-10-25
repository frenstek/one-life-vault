import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiMagnifyingGlass,
  HiBars3,
  HiUserCircle,
  HiArrowUpTray,
  HiChevronDown,
  HiFolderOpen,
  HiArrowRightOnRectangle,
  HiSun,
  HiMoon,
  HiChatBubbleLeftRight,
} from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Header({ onMenuToggle, onUpload, chatOpen, onChatToggle }) {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { profile, logout, hasRole } = useAuth();
  const { dark, toggle } = useTheme();

  const displayName = profile?.full_name || profile?.email || 'Admin';

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <header className="flex h-16 flex-shrink-0 items-center gap-4 border-b border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-5 shadow-sm lg:px-8">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200 lg:hidden"
        aria-label="Toggle menu"
      >
        <HiBars3 className="h-6 w-6" />
      </button>

      {/* Spacer */}
      <div className="hidden flex-1 lg:block" />

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex flex-1 justify-center lg:flex-initial">
        <div className="relative w-full max-w-lg">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-slate-50 dark:bg-[#1e2d4a]/50 py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-colors focus:border-accent-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
      </form>

      {/* Team Chat toggle */}
      <button
        onClick={onChatToggle}
        className={`relative rounded-lg p-2 transition-colors ${chatOpen ? 'bg-[#0ea03e]/10 text-[#0ea03e] dark:bg-[#0ea03e]/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200'}`}
        aria-label="Toggle team chat"
      >
        <HiChatBubbleLeftRight className="h-5 w-5" />
      </button>

      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        className="rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-700 dark:hover:text-slate-200"
        aria-label="Toggle dark mode"
      >
        {dark ? <HiSun className="h-5 w-5" /> : <HiMoon className="h-5 w-5" />}
      </button>

      {/* Admin dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
        >
          <div className="hidden text-right text-sm lg:block">
            <p className="font-medium text-slate-700 dark:text-slate-200">{displayName}</p>
            <p className="text-xs text-slate-400">One Life Foundation</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-white">
            <HiUserCircle className="h-6 w-6" />
          </div>
          <HiChevronDown className={`hidden h-4 w-4 text-slate-400 transition-transform lg:block ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] shadow-lg">
            <div className="border-b border-slate-100 dark:border-[#263554] px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{displayName}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                  profile?.role === 'admin'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : profile?.role === 'manager'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {profile?.role || 'staff'}
                </span>
              </div>
              <p className="text-xs text-slate-400">{profile?.email || 'Manage your documents'}</p>
            </div>
            <div className="py-1">
              {hasRole(['admin', 'manager']) && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onUpload?.();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <HiArrowUpTray className="h-4 w-4 text-accent-500" />
                    Upload Document
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/documents');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <HiFolderOpen className="h-4 w-4 text-brand-500" />
                    Manage Documents
                  </button>
                </>
              )}
              <div className="my-1 border-t border-slate-100 dark:border-[#263554]" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <HiArrowRightOnRectangle className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
