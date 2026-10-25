import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiShieldCheck,
  HiClipboardDocumentCheck,
  HiCalendarDays,
  HiClipboardDocumentList,
  HiDocumentText,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiExclamationTriangle,
  HiArrowTopRightOnSquare,
  HiArrowDownTray,
  HiUserGroup,
} from 'react-icons/hi2';

// Audit checklist items — everything needed for the DNV NDIS recertification audit
const AUDIT_SECTIONS = [
  {
    title: 'Stage 1 — Document Review (11 June 2026, Remote)',
    description: 'Shabboo reviews all policies, procedures, quality systems, and staff records remotely.',
    items: [
      { id: 's1-1', label: 'NDIS Manual (Policies & Procedures) uploaded and current', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%201%20-%20Rights%20%26%20Responsibilities' },
      { id: 's1-2', label: 'Organisation Chart (Form100) uploaded', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%202%20-%20Governance%20%26%20Operations' },
      { id: 's1-3', label: 'Business Plan / Strategic Plan current', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%202%20-%20Governance%20%26%20Operations' },
      { id: 's1-4', label: 'Business Continuity Plan (Form103) uploaded', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%202%20-%20Governance%20%26%20Operations' },
      { id: 's1-5', label: 'Quality Management system documented (Form104)', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%202%20-%20Governance%20%26%20Operations' },
      { id: 's1-6', label: 'Risk Register has entries', link: '/risk-register' },
      { id: 's1-7', label: 'Complaints Register has entries (or nil report)', link: '/feedback-complaints' },
      { id: 's1-8', label: 'Incident Register reviewed', link: '/incidents' },
      { id: 's1-9', label: 'Continuous Improvement Register has entries', link: '/continuous-improvement' },
      { id: 's1-10', label: 'Conflict of Interest declarations entered', link: '/conflict-of-interest' },
      { id: 's1-11', label: 'Hazard Register reviewed', link: '/hazard-register' },
      { id: 's1-12', label: 'Staff Training Matrix (Form09) up to date', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%202%20-%20Governance%20%26%20Operations' },
      { id: 's1-13', label: 'Staff compliance documents uploaded (all active staff)', link: '/compliance' },
      { id: 's1-14', label: 'Internal Audit Report (Form15) completed', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%202%20-%20Governance%20%26%20Operations' },
      { id: 's1-15', label: 'Internal Audit Schedule (Form16) current', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%202%20-%20Governance%20%26%20Operations' },
      { id: 's1-16', label: 'Management Review Meeting Minutes (Form25) documented', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%202%20-%20Governance%20%26%20Operations' },
      { id: 's1-17', label: 'Legislative Compliance Register entries', link: '/legislation-register' },
      { id: 's1-18', label: 'Digital Registers Policy (Form105) uploaded', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%202%20-%20Governance%20%26%20Operations' },
      { id: 's1-19', label: 'Audit Log system active (verify entries)', link: '/audit-log' },
      { id: 's1-20', label: 'Screening Checklists for new staff', link: '/screening' },
    ],
  },
  {
    title: 'Stage 2 — Participant Files (18 June 2026, On-site)',
    description: 'Joan reviews selected participant files. Each participant needs complete documentation.',
    items: [
      { id: 's2-1', label: 'Service Agreements signed and dated (all participants)', link: '/participants' },
      { id: 's2-2', label: 'Consent Forms signed and dated', link: '/participants' },
      { id: 's2-3', label: 'Risk Assessments completed per participant', link: '/participants' },
      { id: 's2-4', label: 'Home Risk Assessment completed (Epping house)', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%202%20-%20Governance%20%26%20Operations' },
      { id: 's2-5', label: 'Support Plans current for all participants', link: '/participants' },
      { id: 's2-6', label: 'NDIS Plan copies on file', link: '/participants' },
      { id: 's2-7', label: 'Invoicing to NDIS records available', link: '/invoices' },
      { id: 's2-8', label: 'Progress Notes up to date', link: '/progress-notes' },
    ],
  },
  {
    title: 'Stage 2 — Module 1: High Intensity (Joan)',
    description: 'Clinical file review for John Ross — catheter, wound care, diabetes, and other high-intensity supports.',
    items: [
      { id: 'm1-1', label: 'Module 1 Manual uploaded (12 clinical procedures)', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Module%201%20-%20High%20Intensity' },
      { id: 'm1-2', label: 'Catheter Care training guide in Training Hub', link: '/training' },
      { id: 'm1-3', label: 'Wound Care training guide in Training Hub', link: '/training' },
      { id: 'm1-4', label: 'Diabetes Management training guide in Training Hub', link: '/training' },
      { id: 'm1-5', label: 'Staff competency records for high-intensity tasks' },
      { id: 'm1-6', label: 'Clinical notes / support notes for John Ross', link: '/progress-notes' },
      { id: 'm1-7', label: 'Medication charts current for John Ross', link: '/participants' },
      { id: 'm1-8', label: 'Delegation letters from RN for clinical tasks' },
    ],
  },
  {
    title: 'Stage 2 — Site Tour (Epping SIL House)',
    description: 'Shabboo walks through 59 Severn St, Epping. Use Form106 checklist.',
    items: [
      { id: 'st-1', label: 'Form106 SIL House Accommodation Audit Checklist completed', link: '/documents?category=Policies%20%26%20Procedures&subcategory=Core%204%20-%20Support%20Environment' },
      { id: 'st-2', label: 'Evacuation plans posted in common area + each bedroom' },
      { id: 'st-3', label: 'Emergency contact numbers displayed' },
      { id: 'st-4', label: 'Fire extinguisher accessible and in-date' },
      { id: 'st-5', label: 'Smoke alarms tested (monthly log)' },
      { id: 'st-6', label: 'First aid kit stocked and current' },
      { id: 'st-7', label: 'Medication cabinet locked, MARs current' },
      { id: 'st-8', label: 'Complaints process posted (easy-read)' },
      { id: 'st-9', label: 'Participant rights information visible' },
      { id: 'st-10', label: 'Cleaning schedule displayed and signed off' },
      { id: 'st-11', label: 'Dietary charts / allergy info in kitchen' },
      { id: 'st-12', label: 'Hot water temp below 50°C (test and record)' },
      { id: 'st-13', label: 'House clean, tidy, evidence of person-centred living' },
      { id: 'st-14', label: 'Staff roster displayed on-site' },
      { id: 'st-15', label: 'Shift handover notes maintained' },
    ],
  },
  {
    title: 'Stage 2 — Staff Interviews',
    description: 'Shabboo interviews support workers. Staff should know key policies and procedures.',
    items: [
      { id: 'si-1', label: 'Staff know the Code of Conduct' },
      { id: 'si-2', label: 'Staff know how to report an incident' },
      { id: 'si-3', label: 'Staff know how to lodge a complaint' },
      { id: 'si-4', label: 'Staff know abuse/neglect reporting obligations' },
      { id: 'si-5', label: 'Staff know where to find policies and procedures' },
      { id: 'si-6', label: 'Staff know participant support plans and goals' },
      { id: 'si-7', label: 'Staff have completed NDIS Worker Orientation Module' },
      { id: 'si-8', label: 'Staff have signed induction checklist on file' },
      { id: 'si-9', label: 'Staff have signed policy acknowledgement on file' },
    ],
  },
];

const LS_KEY = 'olf-audit-checklist';

function loadChecked() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}

export default function AuditHub() {
  const [checked, setChecked] = useState(loadChecked);
  const [expandedSection, setExpandedSection] = useState(0);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(checked));
  }, [checked]);

  function toggle(id) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const totalItems = AUDIT_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const totalChecked = AUDIT_SECTIONS.reduce((sum, s) => sum + s.items.filter((i) => checked[i.id]).length, 0);
  const overallPct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Preparation</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            DNV NDIS Recertification — Stage 1: 11 June | Stage 2: 18 June 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
          >
            <HiArrowDownTray className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8">
        <div className="flex items-center gap-6">
          <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={overallPct >= 80 ? '#0ea03e' : overallPct >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(overallPct / 100) * 264} 264`}
              />
            </svg>
            <span className="absolute text-2xl font-bold text-slate-900 dark:text-white">{overallPct}%</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Audit Readiness</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {totalChecked} of {totalItems} items completed
            </p>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1e2d4a]">
              <div
                className={`h-full rounded-full transition-all ${overallPct >= 80 ? 'bg-[#0ea03e]' : overallPct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick stats per section */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {AUDIT_SECTIONS.map((section, idx) => {
            const done = section.items.filter((i) => checked[i.id]).length;
            const total = section.items.length;
            const pct = Math.round((done / total) * 100);
            return (
              <button
                key={idx}
                onClick={() => setExpandedSection(idx)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  expandedSection === idx
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e] hover:bg-slate-100 dark:hover:bg-[#1e2d4a]'
                }`}
              >
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                  {section.title.split('—')[0].trim()}
                </div>
                <div className={`mt-1 text-lg font-bold ${pct === 100 ? 'text-[#0ea03e]' : pct > 0 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {done}/{total}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Compliance Dashboard', icon: HiShieldCheck, to: '/compliance', color: 'text-[#0ea03e]' },
          { label: 'Audit Calendar', icon: HiCalendarDays, to: '/audit-calendar', color: 'text-blue-500' },
          { label: 'Audit Log', icon: HiClipboardDocumentList, to: '/audit-log', color: 'text-purple-500' },
          { label: 'Staff Directory', icon: HiUserGroup, to: '/staff', color: 'text-amber-500' },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
          >
            <link.icon className={`h-5 w-5 ${link.color}`} />
            {link.label}
            <HiArrowTopRightOnSquare className="ml-auto h-3.5 w-3.5 text-slate-400" />
          </Link>
        ))}
      </div>

      {/* Checklist Sections */}
      <div className="space-y-4">
        {AUDIT_SECTIONS.map((section, sIdx) => {
          const done = section.items.filter((i) => checked[i.id]).length;
          const total = section.items.length;
          const isExpanded = expandedSection === sIdx;
          const allDone = done === total;

          return (
            <div key={sIdx} className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
              <button
                onClick={() => setExpandedSection(isExpanded ? -1 : sIdx)}
                className="flex w-full items-center gap-4 px-6 py-5 text-left hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
              >
                {allDone ? (
                  <HiCheckCircle className="h-6 w-6 flex-shrink-0 text-[#0ea03e]" />
                ) : done > 0 ? (
                  <HiClock className="h-6 w-6 flex-shrink-0 text-amber-500" />
                ) : (
                  <HiXCircle className="h-6 w-6 flex-shrink-0 text-slate-300 dark:text-slate-600" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{section.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{section.description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  allDone ? 'bg-green-50 dark:bg-green-900/20 text-[#0ea03e]'
                    : done > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-500 dark:text-slate-400'
                }`}>
                  {done}/{total}
                </span>
                <svg className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-[#263554]">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 px-6 py-3.5 border-b border-slate-100 dark:border-[#263554]/50 last:border-0 transition-colors ${
                        checked[item.id] ? 'bg-green-50/50 dark:bg-green-900/5' : 'hover:bg-slate-50 dark:hover:bg-[#0f1a2e]'
                      }`}
                    >
                      <button
                        onClick={() => toggle(item.id)}
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          checked[item.id]
                            ? 'border-[#0ea03e] bg-[#0ea03e] text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'
                        }`}
                      >
                        {checked[item.id] && (
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${
                        checked[item.id]
                          ? 'text-slate-400 dark:text-slate-500 line-through'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {item.label}
                      </span>
                      {item.link && (
                        <Link
                          to={item.link}
                          className="rounded-md border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#1e2d4a] px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#263554] transition-colors"
                        >
                          Open
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Audit Info */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Audit Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">DNV Project</p>
            <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">PRJN-261414-2021-AST-AUS</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Team Leader</p>
            <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">Shabboo Shariati</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Team Auditor</p>
            <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">Joan Sulda</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Site Contact</p>
            <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">Harsimran Singh</p>
          </div>
        </div>
      </div>
    </div>
  );
}
