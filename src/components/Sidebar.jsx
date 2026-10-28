import { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, useSearchParams } from 'react-router-dom';
import { fetchActiveClocks } from '../lib/api';
import {
  HiHome,
  HiFolderOpen,
  HiXMark,
  HiUserGroup,
  HiClipboardDocumentList,
  HiHeart,
  HiShieldCheck,
  HiCog6Tooth,
  HiCheckCircle,
  HiChevronDown,
  HiClipboardDocumentCheck,
  HiBuildingOffice2,
  HiInboxArrowDown,
  HiBookOpen,
  HiClock,
  HiClipboardDocumentList as HiTaskBoard,
  HiExclamationTriangle,
  HiMegaphone,
  HiEnvelope,
  HiCalendarDays,
  HiLightBulb,
  HiShieldExclamation,
  HiFire,
  HiChatBubbleLeftRight,
  HiClipboardDocumentCheck as HiScreening,
  HiTableCells,
  HiBanknotes,
  HiPencilSquare,
  HiKey,
  HiCube,
  HiCurrencyDollar,
  HiScale,
  HiAcademicCap,
  HiSparkles,
  HiArchiveBox,
  HiDocumentText,
  HiBeaker,
  HiMapPin,
  HiCloudArrowUp,
  HiReceiptPercent,
} from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

const DEPARTMENTS = [
  {
    name: 'Human Resources',
    icon: HiUserGroup,
    subcategories: ['Job Descriptions', 'Employment', 'Performance', 'Induction', 'Training'],
  },
  {
    name: 'Onboarding',
    icon: HiClipboardDocumentList,
    subcategories: ['Participant Intake', 'Service Agreements', 'Welcome Packs', 'Transition'],
  },
  {
    name: 'Clinical',
    icon: HiHeart,
    subcategories: ['Medication', 'Behaviour Support', 'Care Plans', 'Complex Health', 'Nutrition', 'Capability Assessments'],
  },
  {
    name: 'Governance & Compliance',
    icon: HiShieldCheck,
    subcategories: ['NDIS Manual', 'NDIS Information', 'Audits', 'Risk Management', 'Compliance', 'Business Plans', 'Policies & Modules'],
  },
  {
    name: 'Operations',
    icon: HiCog6Tooth,
    subcategories: ['SIL & SDA', 'Safety & WHS', 'Rostering', 'Incidents & Complaints', 'Records', 'General'],
  },
  {
    name: 'Policies & Procedures',
    icon: HiCheckCircle,
    // Aligned to NDIS Practice Standards Core Module Divisions
    subcategories: [
      'Core 1 - Rights & Responsibilities',
      'Core 2 - Governance & Operations',
      'Core 3 - Provision of Supports',
      'Core 4 - Support Environment',
      'Module 1 - High Intensity',
      'Module 2A - Behaviour Support',
    ],
  },
];

const LS_KEY = 'olf-sidebar-expanded';

function loadExpanded() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveExpanded(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

// Standard NavLink classes
const navLinkClasses = (isActive) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
      : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
  }`;

export default function Sidebar({ open, onClose }) {
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  const activeSubcategory = searchParams.get('subcategory');
  const { isAdmin, userRole, hasRole, profile } = useAuth();
  const { canAccess } = usePermissions();
  const [expanded, setExpanded] = useState(loadExpanded);
  const [clockStatus, setClockStatus] = useState(null); // null | { clocked_in: true, clock_in: '...', staff_name: '...' }

  // Poll clock-in status every 60s
  const checkClockStatus = useCallback(async () => {
    if (!profile?.full_name) return;
    try {
      const active = await fetchActiveClocks();
      if (Array.isArray(active)) {
        const myName = profile.full_name?.toLowerCase()?.trim();
        const mine = active.find(a => {
          const staffName = a.staff ? `${a.staff.first_name} ${a.staff.last_name}`.toLowerCase().trim() : '';
          return staffName === myName || a.staff_name?.toLowerCase()?.trim() === myName;
        });
        setClockStatus(mine || null);
      }
    } catch {}
  }, [profile?.full_name]);

  useEffect(() => {
    checkClockStatus();
    const interval = setInterval(checkClockStatus, 60000);
    return () => clearInterval(interval);
  }, [checkClockStatus]);

  // Shortcuts for role checks
  const isAdminOrManager = hasRole(['owner', 'admin', 'manager']);

  // Persist expanded state
  useEffect(() => {
    saveExpanded(expanded);
  }, [expanded]);

  // Auto-expand active department
  useEffect(() => {
    if (activeCategory && !expanded[activeCategory]) {
      setExpanded((prev) => ({ ...prev, [activeCategory]: true }));
    }
  }, [activeCategory]);

  function toggleDepartment(name) {
    setExpanded((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      return next;
    });
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar
          transition-transform duration-200
          lg:static lg:z-auto lg:flex-shrink-0
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand - OLF Logo */}
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <img src="/logo.png" alt="One Life Foundation" className="h-12 w-auto" />
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-green-300/60 transition-colors hover:bg-sidebar-hover hover:text-white lg:hidden"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Yellow accent line */}
        <div className="mx-4 mb-2 h-0.5 bg-[#ffd900]/40 rounded-full" />

        {/* Clock-in status badge */}
        {canAccess('time-clock') && (
          <Link to="/time-clock" onClick={onClose} className="mx-3 mb-2 block">
            {clockStatus ? (
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-emerald-300 truncate">Clocked In</p>
                  <p className="text-[10px] text-emerald-400/70 truncate">
                    Since {clockStatus.clock_in ? new Date(clockStatus.clock_in).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg bg-slate-500/10 border border-slate-500/20 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500/50 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400 truncate">Not Clocked In</p>
                  <p className="text-[10px] text-slate-500 truncate">Tap to clock in</p>
                </div>
              </div>
            )}
          </Link>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {/* ─── Top ─── */}
            {canAccess('dashboard') && (
              <li>
                <NavLink to="/" end onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}>
                  <HiHome className="h-5 w-5 flex-shrink-0" />
                  <span>Dashboard</span>
                </NavLink>
              </li>
            )}
            {canAccess('documents') && (
              <li>
                <NavLink to="/documents" end onClick={onClose} className={({ isActive }) => navLinkClasses(isActive && !activeCategory)}>
                  <HiFolderOpen className="h-5 w-5 flex-shrink-0" />
                  <span>All Documents</span>
                </NavLink>
              </li>
            )}
            {canAccess('documents') && (
              <li>
                <NavLink to="/documents?category=Archive" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive && activeCategory === 'Archive')}>
                  <HiArchiveBox className="h-5 w-5 flex-shrink-0" />
                  <span>Archive</span>
                </NavLink>
              </li>
            )}

            {/* ─── Participants ─── */}
            <li className="px-3 pb-2 pt-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">Participants</span>
            </li>
            {canAccess('participants') && (
              <li><NavLink to="/participants" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiUserGroup className="h-5 w-5 flex-shrink-0" /><span>Participants</span></NavLink></li>
            )}
            {canAccess('progress-notes') && (
              <li><NavLink to="/progress-notes" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiPencilSquare className="h-5 w-5 flex-shrink-0" /><span>Progress Notes</span></NavLink></li>
            )}
            {canAccess('progress-notes') && (
              <li><NavLink to="/notes-check" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiExclamationTriangle className="h-5 w-5 flex-shrink-0" /><span>Notes Check</span></NavLink></li>
            )}
            {canAccess('roster-of-care') && (
              <li><NavLink to="/roster-of-care" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiTableCells className="h-5 w-5 flex-shrink-0" /><span>Roster of Care</span></NavLink></li>
            )}
            {canAccess('invoices') && (
              <li><NavLink to="/invoices" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiBanknotes className="h-5 w-5 flex-shrink-0" /><span>Invoices</span></NavLink></li>
            )}

            {/* ─── Staff ─── */}
            <li className="px-3 pb-2 pt-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">Staff</span>
            </li>
            {canAccess('staff-directory') && (
              <li><NavLink to="/staff" end onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiUserGroup className="h-5 w-5 flex-shrink-0" /><span>Staff Directory</span></NavLink></li>
            )}
            {canAccess('shift-roster') && (
              <li><NavLink to="/shift-roster" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiCalendarDays className="h-5 w-5 flex-shrink-0" /><span>Shift Roster</span></NavLink></li>
            )}
            {canAccess('time-clock') && (
              <li><NavLink to="/time-clock" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiClock className="h-5 w-5 flex-shrink-0" /><span>Time Clock</span></NavLink></li>
            )}
            {canAccess('time-clock') && isAdmin && (
              <li><NavLink to="/location-log" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiMapPin className="h-5 w-5 flex-shrink-0" /><span>Location Log</span></NavLink></li>
            )}
            {canAccess('tasks') && (
              <li><NavLink to="/tasks" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiTaskBoard className="h-5 w-5 flex-shrink-0" /><span>Task Board</span></NavLink></li>
            )}
            {canAccess('staff-payslips') && (
              <li><NavLink to="/staff-payslips" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiBanknotes className="h-5 w-5 flex-shrink-0" /><span>Staff Payslips</span></NavLink></li>
            )}
            <li><NavLink to="/training" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiAcademicCap className="h-5 w-5 flex-shrink-0" /><span>Training Hub</span></NavLink></li>

            {/* ─── Properties & Facilities ─── */}
            <li className="px-3 pb-2 pt-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">Facilities</span>
            </li>
            {canAccess('properties') && (
              <li><NavLink to="/properties" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiBuildingOffice2 className="h-5 w-5 flex-shrink-0" /><span>Properties</span></NavLink></li>
            )}
            <li><NavLink to="/cleaning-schedule" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiSparkles className="h-5 w-5 flex-shrink-0" /><span>Cleaning Schedule</span></NavLink></li>

            {/* ─── Compliance & Registers (admin/manager) ─── */}
            {isAdminOrManager && (
              <>
                <li className="px-3 pb-2 pt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">Compliance</span>
                </li>
                <li><NavLink to="/policy-register" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiTableCells className="h-5 w-5 flex-shrink-0" /><span>Policy Register</span></NavLink></li>
                <li><NavLink to="/view/3128da13-8d39-4618-8fad-7b446ba84ad2" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiDocumentText className="h-5 w-5 flex-shrink-0" /><span>Policy Addendum</span></NavLink></li>
                <li><NavLink to="/view/dfea9f4a-54ab-43d9-b6fb-09d461d47ef3" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiPencilSquare className="h-5 w-5 flex-shrink-0" /><span>Meeting Minutes</span></NavLink></li>
                <li><NavLink to="/compliance" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiClipboardDocumentCheck className="h-5 w-5 flex-shrink-0" /><span>Staff Compliance</span></NavLink></li>
                <li><NavLink to="/screening" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiScreening className="h-5 w-5 flex-shrink-0" /><span>Screening</span></NavLink></li>
                <li><NavLink to="/payment-reviews" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiReceiptPercent className="h-5 w-5 flex-shrink-0" /><span>Payment Reviews</span></NavLink></li>
                <li className="px-3 pb-1 pt-4">
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400/60">Registers</span>
                </li>
                {canAccess('incidents') && (
                  <li><NavLink to="/incidents" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiExclamationTriangle className="h-5 w-5 flex-shrink-0" /><span>Incident Register</span></NavLink></li>
                )}
                <li><NavLink to="/continuous-improvement" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiLightBulb className="h-5 w-5 flex-shrink-0" /><span>Continuous Improvement</span></NavLink></li>
                <li><NavLink to="/risk-register" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiShieldExclamation className="h-5 w-5 flex-shrink-0" /><span>Risk Register</span></NavLink></li>
                <li><NavLink to="/hazard-register" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiFire className="h-5 w-5 flex-shrink-0" /><span>Hazard Register</span></NavLink></li>
                <li><NavLink to="/feedback-complaints" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiChatBubbleLeftRight className="h-5 w-5 flex-shrink-0" /><span>Feedback & Complaints</span></NavLink></li>
                <li><NavLink to="/infection-register" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiBeaker className="h-5 w-5 flex-shrink-0" /><span>Infection Register</span></NavLink></li>
                <li><NavLink to="/sds-register" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiShieldExclamation className="h-5 w-5 flex-shrink-0" /><span>SDS Register</span></NavLink></li>
                <li><NavLink to="/legislation-register" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiScale className="h-5 w-5 flex-shrink-0" /><span>Legislation Register</span></NavLink></li>
                <li><NavLink to="/conflict-of-interest" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiUserGroup className="h-5 w-5 flex-shrink-0" /><span>Conflict of Interest</span></NavLink></li>
                <li><NavLink to="/audit-calendar" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiCalendarDays className="h-5 w-5 flex-shrink-0" /><span>Audit Calendar</span></NavLink></li>
                <li><NavLink to="/audit-log" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiClipboardDocumentCheck className="h-5 w-5 flex-shrink-0" /><span>Audit Log</span></NavLink></li>
              </>
            )}

            {/* ─── Finance (admin/manager + owner) ─── */}
            {isAdminOrManager && (
              <>
                <li className="px-3 pb-2 pt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">Finance</span>
                </li>
                <li><NavLink to="/expenses" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiCurrencyDollar className="h-5 w-5 flex-shrink-0" /><span>Expenses</span></NavLink></li>
                <li><NavLink to="/expense-hub" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiCloudArrowUp className="h-5 w-5 flex-shrink-0" /><span>Expense Hub</span></NavLink></li>
                <li><NavLink to="/asset-register" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiCube className="h-5 w-5 flex-shrink-0" /><span>Asset Register</span></NavLink></li>
                {userRole === 'owner' && (
                  <li><NavLink to="/payroll" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiCurrencyDollar className="h-5 w-5 flex-shrink-0" /><span>Payroll Details</span></NavLink></li>
                )}
              </>
            )}

            {/* ─── Admin (admin/manager) ─── */}
            {isAdminOrManager && (
              <>
                <li className="px-3 pb-2 pt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">Admin</span>
                </li>
                <li><NavLink to="/inquiries" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiInboxArrowDown className="h-5 w-5 flex-shrink-0" /><span>Inquiries</span></NavLink></li>
                <li><NavLink to="/stakeholders" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiBookOpen className="h-5 w-5 flex-shrink-0" /><span>Stakeholders</span></NavLink></li>
                {canAccess('announcements') && (
                  <li><NavLink to="/announcements" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiMegaphone className="h-5 w-5 flex-shrink-0" /><span>Announcements</span></NavLink></li>
                )}
                {canAccess('staff-accounts') && (
                  <li><NavLink to="/staff-accounts" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiKey className="h-5 w-5 flex-shrink-0" /><span>Staff Accounts</span></NavLink></li>
                )}
                {isAdmin && (
                  <li><NavLink to="/rosters" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiCalendarDays className="h-5 w-5 flex-shrink-0" /><span>Rosters</span></NavLink></li>
                )}
                {isAdmin && (
                  <li><NavLink to="/permissions" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiShieldCheck className="h-5 w-5 flex-shrink-0" /><span>Permissions</span></NavLink></li>
                )}
              </>
            )}

            {/* ─── Communication ─── */}
            <li className="px-3 pb-2 pt-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">Communication</span>
            </li>
            <li><NavLink to="/messages" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiEnvelope className="h-5 w-5 flex-shrink-0" /><span>Messages</span></NavLink></li>
            <li><NavLink to="/team-chat" onClick={onClose} className={({ isActive }) => navLinkClasses(isActive)}><HiChatBubbleLeftRight className="h-[18px] w-[18px]" /><span>Team Chat</span></NavLink></li>

            {/* ─── Departments ─── */}
            {canAccess('documents') && (
              <>
                <li className="px-3 pb-2 pt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">
                    Departments
                  </span>
                </li>

                {/* Department sections */}
                {DEPARTMENTS.map((dept) => {
                  const Icon = dept.icon;
                  const isExpanded = !!expanded[dept.name];
                  const isDeptActive = activeCategory === dept.name;

                  return (
                    <li key={dept.name}>
                      {/* Department header — clickable to expand/collapse */}
                      <button
                        onClick={() => toggleDepartment(dept.name)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isDeptActive && !activeSubcategory
                            ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                            : isDeptActive
                              ? 'border-l-2 border-transparent bg-sidebar-hover/50 text-white'
                              : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex-1 text-left">{dept.name}</span>
                        <HiChevronDown
                          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Subcategories (collapsible) */}
                      {isExpanded && (
                        <ul className="mt-1 space-y-1 pb-1">
                          {/* "All" link for department */}
                          <li>
                            <Link
                              to={`/documents?category=${encodeURIComponent(dept.name)}`}
                              onClick={onClose}
                              className={`flex items-center gap-3 rounded-lg py-2 pl-11 pr-3 text-xs font-medium transition-colors ${
                                isDeptActive && !activeSubcategory
                                  ? 'text-[#ffd900]'
                                  : 'text-green-300/50 hover:bg-sidebar-hover hover:text-green-200/80'
                              }`}
                            >
                              All {dept.name}
                            </Link>
                          </li>
                          {dept.subcategories.map((sub) => {
                            const isSubActive = isDeptActive && activeSubcategory === sub;
                            return (
                              <li key={sub}>
                                <Link
                                  to={`/documents?category=${encodeURIComponent(dept.name)}&subcategory=${encodeURIComponent(sub)}`}
                                  onClick={onClose}
                                  className={`flex items-center gap-3 rounded-lg py-2 pl-11 pr-3 text-xs font-medium transition-colors ${
                                    isSubActive
                                      ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                                      : 'border-l-2 border-transparent text-green-200/60 hover:bg-sidebar-hover hover:text-white'
                                  }`}
                                >
                                  {sub}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </>
            )}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="border-t border-green-800/30 px-5 py-4">
          <p className="text-[10px] text-green-400/40">
            One Life Foundation PTY LTD
          </p>
        </div>
      </aside>
    </>
  );
}
