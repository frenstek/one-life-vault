import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HiShieldCheck,
  HiUserGroup,
  HiCheckCircle,
  HiExclamationTriangle,
  HiXCircle,
  HiClipboardDocumentCheck,
  HiArrowDownTray,
  HiCalendarDays,
  HiBuildingOffice2,
  HiDocumentText,
} from 'react-icons/hi2';
import { fetchCompliance, fetchProperties, fetchParticipants } from '../lib/api';
import { toLocalDate } from '../lib/dates';
import { SkeletonDashboard } from '../components/ui/Skeleton';

const EXPIRY_TIERS = [
  { label: 'Expired', days: 0, color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800/40' },
  { label: '7 Days', days: 7, color: 'bg-red-400', textColor: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800/40' },
  { label: '14 Days', days: 14, color: 'bg-orange-400', textColor: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-200 dark:border-orange-800/40' },
  { label: '30 Days', days: 30, color: 'bg-amber-400', textColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800/40' },
  { label: '60 Days', days: 60, color: 'bg-yellow-400', textColor: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-800/40' },
  { label: '90 Days', days: 90, color: 'bg-blue-300', textColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800/40' },
];

function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return Infinity;
  // Whole calendar days in local time (expires today = 0, yesterday = -1)
  const today = new Date(toLocalDate() + 'T00:00:00');
  const expiry = new Date(String(expiryDate).slice(0, 10) + 'T00:00:00');
  return Math.round((expiry - today) / 86400000);
}

function getExpiryTier(days) {
  if (days <= 0) return EXPIRY_TIERS[0];
  if (days <= 7) return EXPIRY_TIERS[1];
  if (days <= 14) return EXPIRY_TIERS[2];
  if (days <= 30) return EXPIRY_TIERS[3];
  if (days <= 60) return EXPIRY_TIERS[4];
  if (days <= 90) return EXPIRY_TIERS[5];
  return null;
}

export default function Compliance() {
  const [data, setData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('staff');

  useEffect(() => {
    Promise.all([
      fetchCompliance(),
      fetchProperties().catch(() => []),
      fetchParticipants().catch(() => []),
    ])
      .then(([compData, propData, partData]) => {
        setData(compData);
        setProperties(Array.isArray(propData) ? propData : propData?.properties || []);
        setParticipants(Array.isArray(partData) ? partData : partData?.participants || []);
        // Log compliance review to audit trail
        fetch('/api/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'compliance_review',
            resource_type: 'compliance',
            resource_name: 'Compliance Dashboard',
            details: {
              total_staff: compData.total_staff,
              fully_compliant: compData.fully_compliant,
              non_compliant: compData.non_compliant,
              staff_with_gaps: compData.staff_gaps?.length || 0,
            },
          }),
        }).catch(() => {}); // fire and forget
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Enhanced expiry grouping with tiered warnings
  const expiryGroups = useMemo(() => {
    if (!data) return {};
    const expDocs = data.expiring_documents || [];
    const expiredDocs = data.expired_documents || [];
    const all = [...expDocs, ...expiredDocs];
    const groups = {};
    all.forEach(item => {
      const days = getDaysUntilExpiry(item.expiry_date);
      const tier = getExpiryTier(days);
      if (tier) {
        if (!groups[tier.label]) groups[tier.label] = { tier, items: [] };
        groups[tier.label].items.push({ ...item, daysLeft: days });
      }
    });
    return groups;
  }, [data]);

  // Audit readiness score
  const auditScore = useMemo(() => {
    if (!data) return { score: 0, breakdown: [] };
    const totalStaff = data.total_staff || 0;
    if (!totalStaff) return { score: 100, breakdown: [] };

    const compliant = data.fully_compliant || 0;
    const expiring = (data.expiring_documents || []).length;
    const expired = (data.expired_documents || []).length;
    const docTypeCount = data.document_type_rates ? Object.keys(data.document_type_rates).length : 0;

    // Score calculation: 100 base, -2 per expiring, -5 per expired, weighted by compliance rate
    const complianceRate = compliant / totalStaff;
    const penalties = (expiring * 2) + (expired * 5);
    const raw = Math.max(0, Math.round(complianceRate * 100 - penalties));

    const breakdown = [
      { label: 'Staff compliance rate', value: `${Math.round(complianceRate * 100)}%`, good: complianceRate >= 0.8 },
      { label: 'Documents expiring soon', value: expiring, good: expiring === 0 },
      { label: 'Documents expired', value: expired, good: expired === 0 },
      { label: 'Document types tracked', value: docTypeCount, good: true },
    ];

    return { score: raw, breakdown };
  }, [data]);

  // Property compliance (overdue inspections/maintenance)
  const propertyCompliance = useMemo(() => {
    const now = new Date();
    let overdueInspections = 0;
    let overdueMaintenance = 0;
    properties.forEach(p => {
      if (p.inspections) {
        p.inspections.forEach(insp => {
          if (insp.next_due && new Date(insp.next_due) < now) overdueInspections++;
        });
      }
      if (p.maintenance) {
        p.maintenance.forEach(m => {
          if (m.status === 'pending' || m.status === 'in_progress') overdueMaintenance++;
        });
      }
    });
    return { overdueInspections, overdueMaintenance, total: properties.length };
  }, [properties]);

  // Participant compliance (plan reviews due)
  const participantCompliance = useMemo(() => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 86400000);
    let planExpiring = 0;
    let planExpired = 0;
    participants.forEach(p => {
      if (p.plan_end_date) {
        const end = new Date(p.plan_end_date);
        if (end < now) planExpired++;
        else if (end < thirtyDays) planExpiring++;
      }
    });
    return { planExpiring, planExpired, total: participants.length };
  }, [participants]);

  if (loading) return <SkeletonDashboard />;
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }
  if (!data) return null;

  const totalStaff = data.total_staff || 0;
  const compliant = data.fully_compliant || 0;
  const expiringCount = data.expiring_soon || 0;
  const nonCompliant = data.non_compliant || 0;
  const byDocType = data.document_type_rates
    ? Object.entries(data.document_type_rates).map(([document_type, info]) => ({ document_type, count: info.valid + info.expiring, ...info }))
    : [];
  const staffGaps = data.staff_gaps || [];
  const staffScore = totalStaff > 0 ? Math.round((compliant / totalStaff) * 100) : 0;

  const fmtDate = (d) => {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Compliance Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">NDIS compliance overview — staff, property, and participant</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
        >
          <HiArrowDownTray className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Audit Readiness + Main Score */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Big Score */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8 lg:col-span-1">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={staffScore >= 80 ? '#0ea03e' : staffScore >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(staffScore / 100) * 264} 264`}
              />
            </svg>
            <span className="absolute text-3xl font-bold text-slate-900 dark:text-white">{staffScore}%</span>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">Staff Compliance</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-4 lg:grid-cols-4">
          <StatCard icon={HiUserGroup} label="Total Staff" value={totalStaff} color="bg-blue-50 dark:bg-blue-900/30 text-[#309edd]" />
          <StatCard icon={HiCheckCircle} label="Fully Compliant" value={compliant} color="bg-green-50 dark:bg-green-900/30 text-[#0ea03e]" />
          <StatCard icon={HiExclamationTriangle} label="Expiring (30d)" value={expiringCount} color="bg-amber-50 dark:bg-amber-900/30 text-amber-500" />
          <StatCard icon={HiXCircle} label="Non-Compliant" value={nonCompliant} color="bg-red-50 dark:bg-red-900/30 text-red-500" />
        </div>
      </div>

      {/* NDIS Audit Readiness Score */}
      <section className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
          <HiShieldCheck className="h-5 w-5 text-accent-500" />
          NDIS Audit Readiness
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Score gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={auditScore.score >= 80 ? '#0ea03e' : auditScore.score >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(auditScore.score / 100) * 264} 264`}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{auditScore.score}</span>
                <span className="text-sm text-slate-400">/100</span>
              </div>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
              {auditScore.score >= 80 ? 'Audit Ready' : auditScore.score >= 50 ? 'Needs Attention' : 'At Risk'}
            </p>
          </div>
          {/* Breakdown */}
          <div className="lg:col-span-2 space-y-3">
            {auditScore.breakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-[#0f1a2e] px-5 py-3">
                <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                <span className={`text-sm font-semibold ${item.good ? 'text-accent-500' : 'text-red-500'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs: Staff / Property / Participant */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-[#263554]">
        {[
          { id: 'staff', label: 'Staff Compliance', icon: HiUserGroup },
          { id: 'property', label: 'Property Compliance', icon: HiBuildingOffice2 },
          { id: 'participant', label: 'Participant Plans', icon: HiDocumentText },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Staff Compliance Tab */}
      {tab === 'staff' && (
        <div className="space-y-8">
          {/* Compliance by Document Type */}
          {byDocType.length > 0 && (
            <section className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                <HiClipboardDocumentCheck className="h-5 w-5 text-[#309edd]" />
                Compliance by Document Type
              </h2>
              <div className="space-y-4">
                {byDocType.map((item) => {
                  const pct = totalStaff > 0 ? Math.round(((item.count || 0) / totalStaff) * 100) : 0;
                  return (
                    <div key={item.document_type}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{item.document_type}</span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {item.count || 0}/{totalStaff} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1e2d4a]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 80 ? 'bg-[#0ea03e]' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tiered Expiry Warnings */}
          {Object.entries(expiryGroups).map(([label, group]) => (
            <section key={label} className={`rounded-xl border ${group.tier.borderColor} bg-white dark:bg-[#162036] p-8`}>
              <h2 className={`mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200`}>
                {label === 'Expired' ? <HiXCircle className="h-5 w-5 text-red-500" /> : <HiExclamationTriangle className={`h-5 w-5 ${group.tier.textColor}`} />}
                {label === 'Expired' ? 'Expired Documents' : `Expiring Within ${label}`}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${group.tier.bgColor} ${group.tier.textColor}`}>
                  {group.items.length}
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#263554] text-left">
                      <th className="pb-3 pr-5 font-medium text-slate-500 dark:text-slate-400">Staff Member</th>
                      <th className="pb-3 pr-5 font-medium text-slate-500 dark:text-slate-400">Document Type</th>
                      <th className="pb-3 pr-5 font-medium text-slate-500 dark:text-slate-400">Expiry Date</th>
                      <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-[#263554]/50 last:border-0">
                        <td className="py-4 pr-5">
                          <Link to={`/staff/${item.staff_id}`} className="font-medium text-[#309edd] hover:underline">
                            {item.staff_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown'}
                          </Link>
                        </td>
                        <td className="py-4 pr-5 text-slate-600 dark:text-slate-400">{item.document_type}</td>
                        <td className="py-4 pr-5">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${group.tier.bgColor} ${group.tier.textColor}`}>
                            {fmtDate(item.expiry_date)}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`text-xs font-bold ${group.tier.textColor}`}>
                            {item.daysLeft <= 0 ? 'EXPIRED' : `${item.daysLeft}d`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {/* All clear */}
          {Object.keys(expiryGroups).length === 0 && (
            <div className="rounded-xl border border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-900/10 p-8 text-center">
              <HiShieldCheck className="mx-auto mb-3 h-10 w-10 text-[#0ea03e]" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">All Clear</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No documents are expired or expiring within 90 days.</p>
            </div>
          )}

          {/* Missing Documents Report */}
          {staffGaps.length > 0 && (
            <section className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#263554] px-8 py-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                  <HiXCircle className="h-5 w-5 text-red-500" />
                  Missing Documents Report
                  <span className="ml-2 rounded-full bg-red-50 dark:bg-red-900/20 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                    {staffGaps.length} staff
                  </span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e]">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Staff Member</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Progress</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Missing Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#263554]/50">
                    {staffGaps.map((gap) => (
                      <tr key={gap.staff_id} className="hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/staff/${gap.staff_id}`} className="font-medium text-[#309edd] hover:underline">
                            {gap.staff_name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{gap.role}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                            gap.missing_count >= 10
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              : gap.missing_count >= 5
                              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          }`}>
                            {gap.uploaded_count}/{gap.total_required}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {gap.missing_documents.map((doc) => (
                              <span
                                key={doc}
                                className="inline-block rounded-md bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-800/30 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-300"
                              >
                                {doc}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Property Compliance Tab */}
      {tab === 'property' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={HiBuildingOffice2} label="Total Properties" value={propertyCompliance.total} color="bg-blue-50 dark:bg-blue-900/30 text-[#309edd]" />
            <StatCard icon={HiExclamationTriangle} label="Overdue Inspections" value={propertyCompliance.overdueInspections} color="bg-amber-50 dark:bg-amber-900/30 text-amber-500" />
            <StatCard icon={HiExclamationTriangle} label="Pending Maintenance" value={propertyCompliance.overdueMaintenance} color="bg-red-50 dark:bg-red-900/30 text-red-500" />
          </div>
          {properties.length > 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Property</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Occupancy</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inspections</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Maintenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                  {properties.map(p => {
                    const residents = p.residents?.length || 0;
                    const capacity = p.capacity || 0;
                    const pendingMaint = p.maintenance?.filter(m => m.status === 'pending' || m.status === 'in_progress').length || 0;
                    const lastInspection = p.inspections?.[0];
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
                        <td className="px-5 py-4">
                          <Link to={`/properties/${p.id}`} className="font-medium text-[#309edd] hover:underline">
                            {p.name || p.address}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            p.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {p.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{residents}/{capacity}</td>
                        <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{lastInspection ? fmtDate(lastInspection.inspection_date) : 'None'}</td>
                        <td className="px-5 py-4">
                          {pendingMaint > 0 ? (
                            <span className="rounded-full bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">{pendingMaint} pending</span>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
              <HiBuildingOffice2 className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No properties found</p>
            </div>
          )}
        </div>
      )}

      {/* Participant Plans Tab */}
      {tab === 'participant' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={HiUserGroup} label="Active Participants" value={participantCompliance.total} color="bg-blue-50 dark:bg-blue-900/30 text-[#309edd]" />
            <StatCard icon={HiCalendarDays} label="Plans Expiring (30d)" value={participantCompliance.planExpiring} color="bg-amber-50 dark:bg-amber-900/30 text-amber-500" />
            <StatCard icon={HiXCircle} label="Plans Expired" value={participantCompliance.planExpired} color="bg-red-50 dark:bg-red-900/30 text-red-500" />
          </div>
          {participants.length > 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#263554] bg-slate-50 dark:bg-[#0f1a2e]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Participant</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">NDIS #</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Plan Start</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Plan End</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#263554]">
                  {participants.map(p => {
                    const now = new Date();
                    const endDate = p.plan_end_date ? new Date(p.plan_end_date) : null;
                    const isExpired = endDate && endDate < now;
                    const isExpiring = endDate && !isExpired && endDate < new Date(now.getTime() + 30 * 86400000);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors">
                        <td className="px-5 py-4">
                          <Link to={`/participants/${p.id}`} className="font-medium text-[#309edd] hover:underline">
                            {p.first_name} {p.last_name}
                          </Link>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{p.ndis_number || '--'}</td>
                        <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{fmtDate(p.plan_start_date)}</td>
                        <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{fmtDate(p.plan_end_date)}</td>
                        <td className="px-5 py-4">
                          {isExpired ? (
                            <span className="rounded-full bg-red-50 dark:bg-red-900/20 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400">Expired</span>
                          ) : isExpiring ? (
                            <span className="rounded-full bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">Expiring</span>
                          ) : (
                            <span className="rounded-full bg-green-50 dark:bg-green-900/20 px-2.5 py-1 text-[11px] font-semibold text-green-600 dark:text-green-400">Current</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
              <HiDocumentText className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No participants found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] px-5 py-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
