import { useState, useEffect } from 'react';
import { NavLink, Link, useSearchParams } from 'react-router-dom';
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
} from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';

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
    subcategories: ['Incidents & Complaints', 'Audits', 'Risk Management', 'Safety & WHS', 'Rostering', 'Induction', 'Medication', 'Compliance', 'General'],
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

export default function Sidebar({ open, onClose }) {
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  const activeSubcategory = searchParams.get('subcategory');
  const { isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(loadExpanded);

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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {/* Dashboard */}
            <li>
              <NavLink
                to="/"
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                      : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                  }`
                }
              >
                <HiHome className="h-5 w-5 flex-shrink-0" />
                <span>Dashboard</span>
              </NavLink>
            </li>

            {/* All Documents */}
            <li>
              <NavLink
                to="/documents"
                end
                onClick={onClose}
                className={({ isActive }) => {
                  const active = isActive && !activeCategory;
                  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                      : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                  }`;
                }}
              >
                <HiFolderOpen className="h-5 w-5 flex-shrink-0" />
                <span>All Documents</span>
              </NavLink>
            </li>

            {/* 1. Participants */}
                <li className="px-3 pb-2 pt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">
                    Participants
                  </span>
                </li>
                <li>
                  <NavLink
                    to="/participants"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiUserGroup className="h-5 w-5 flex-shrink-0" />
                    <span>Participants</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/inquiries"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiInboxArrowDown className="h-5 w-5 flex-shrink-0" />
                    <span>Inquiries</span>
                  </NavLink>
                </li>

                {/* Stakeholder Directory */}
                <li>
                  <NavLink
                    to="/stakeholders"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiBookOpen className="h-5 w-5 flex-shrink-0" />
                    <span>Stakeholders</span>
                  </NavLink>
                </li>

                {/* Incidents */}
                <li>
                  <NavLink
                    to="/incidents"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiExclamationTriangle className="h-5 w-5 flex-shrink-0" />
                    <span>Incidents</span>
                  </NavLink>
                </li>

                {/* Screening Checklist */}
                <li>
                  <NavLink
                    to="/screening"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiScreening className="h-5 w-5 flex-shrink-0" />
                    <span>Screening</span>
                  </NavLink>
                </li>

                {/* Roster of Care */}
                <li>
                  <NavLink
                    to="/roster-of-care"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiTableCells className="h-5 w-5 flex-shrink-0" />
                    <span>Roster of Care</span>
                  </NavLink>
                </li>

                {/* 2. Staff Management */}
                <li className="px-3 pb-2 pt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">
                    Staff Management
                  </span>
                </li>
                <li>
                  <NavLink
                    to="/time-clock"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiClock className="h-5 w-5 flex-shrink-0" />
                    <span>Time Clock</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/shift-roster"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiCalendarDays className="h-5 w-5 flex-shrink-0" />
                    <span>Shift Roster</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/tasks"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiTaskBoard className="h-5 w-5 flex-shrink-0" />
                    <span>Task Board</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/staff"
                    end
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiUserGroup className="h-5 w-5 flex-shrink-0" />
                    <span>Staff Directory</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/compliance"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiClipboardDocumentCheck className="h-5 w-5 flex-shrink-0" />
                    <span>Compliance</span>
                  </NavLink>
                </li>

                {/* 3. Property Management */}
                <li className="px-3 pb-2 pt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">
                    Property Management
                  </span>
                </li>
                <li>
                  <NavLink
                    to="/properties"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                          : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <HiBuildingOffice2 className="h-5 w-5 flex-shrink-0" />
                    <span>Properties</span>
                  </NavLink>
                </li>

            {/* 4. Registers */}
            <li className="px-3 pb-2 pt-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">
                Registers
              </span>
            </li>
            <li>
              <NavLink
                to="/continuous-improvement"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                      : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                  }`
                }
              >
                <HiLightBulb className="h-5 w-5 flex-shrink-0" />
                <span>Continuous Improvement</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/risk-register"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                      : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                  }`
                }
              >
                <HiShieldExclamation className="h-5 w-5 flex-shrink-0" />
                <span>Risk Register</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/hazard-register"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                      : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                  }`
                }
              >
                <HiFire className="h-5 w-5 flex-shrink-0" />
                <span>Hazard Register</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/feedback-complaints"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                      : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                  }`
                }
              >
                <HiChatBubbleLeftRight className="h-5 w-5 flex-shrink-0" />
                <span>Feedback & Complaints</span>
              </NavLink>
            </li>

            {/* 5. Communication */}
            <li className="px-3 pb-2 pt-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400/50">
                Communication
              </span>
            </li>
            <li>
              <NavLink
                to="/announcements"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                      : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                  }`
                }
              >
                <HiMegaphone className="h-5 w-5 flex-shrink-0" />
                <span>Announcements</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/messages"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-2 border-[#ffd900] bg-sidebar-active text-white'
                      : 'border-l-2 border-transparent text-green-200/70 hover:bg-sidebar-hover hover:text-white'
                  }`
                }
              >
                <HiEnvelope className="h-5 w-5 flex-shrink-0" />
                <span>Messages</span>
              </NavLink>
            </li>

            {/* 5. Departments */}
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
