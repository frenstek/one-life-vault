import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiMagnifyingGlass,
  HiBanknotes,
  HiDocumentText,
  HiCurrencyDollar,
  HiCheckCircle,
  HiClock,
} from 'react-icons/hi2';
import { fetchParticipants, fetchInvoiceStats } from '../lib/api';
import { PageHeader, StatCard } from '../components/ui/FormComponents';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';

function formatCurrency(val) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(val) || 0);
}

export default function Invoices() {
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetchParticipants('active'),
      fetchInvoiceStats().catch(() => null),
    ]).then(([parts, st]) => {
      setParticipants(Array.isArray(parts) ? parts : []);
      setStats(st);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = participants.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    return name.includes(q) || (p.ndis_number || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invoices"
        subtitle="Select a participant to view, upload, or create invoices for NDIS claiming"
      />

      {/* Stats */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : stats && stats.total > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={HiDocumentText} label="Total Invoices" value={stats.total} color="bg-brand-50 dark:bg-brand-900/20 text-brand-500" />
          <StatCard icon={HiCurrencyDollar} label="Total Value" value={formatCurrency(stats.total_value)} color="bg-green-50 dark:bg-green-900/20 text-green-500" />
          <StatCard icon={HiClock} label="Outstanding" value={formatCurrency(stats.outstanding)} color="bg-amber-50 dark:bg-amber-900/20 text-amber-500" />
          <StatCard icon={HiCheckCircle} label="Paid" value={formatCurrency(stats.paid_value)} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <HiMagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search participants by name or NDIS number..."
          className="w-full pl-11 sm:max-w-md"
        />
      </div>

      {/* Participant Grid */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <HiBanknotes className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {search ? 'No participants match your search' : 'No active participants'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => (
            <Link
              key={p.id}
              to={`/invoices/${p.id}`}
              className="group rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 transition-all hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-700"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold">
                  {(p.first_name?.[0] || '')}{(p.last_name?.[0] || '')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {p.first_name} {p.last_name}
                  </p>
                  {p.ndis_number && (
                    <p className="mt-0.5 font-mono text-xs text-slate-400">{p.ndis_number}</p>
                  )}
                </div>
                <HiBanknotes className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-brand-400 transition-colors" />
              </div>

              {(p.funding_type || p.plan_manager_name) && (
                <div className="mt-4 space-y-1.5 border-t border-slate-100 dark:border-[#263554] pt-4">
                  {p.funding_type && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Funding</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{p.funding_type}</span>
                    </div>
                  )}
                  {p.plan_manager_name && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Plan Manager</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{p.plan_manager_name}</span>
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
