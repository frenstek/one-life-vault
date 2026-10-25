import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiBuildingOffice2,
  HiUsers,
  HiWrenchScrewdriver,
  HiClipboardDocumentCheck,
  HiPlus,
  HiMagnifyingGlass,
  HiChartBar,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import { fetchProperties, fetchPropertyDashboard } from '../lib/api';
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';
import AddPropertyModal from '../components/AddPropertyModal';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);

  function loadData() {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchProperties(statusFilter === 'all' ? undefined : statusFilter),
      fetchPropertyDashboard(),
    ])
      .then(([propData, dashData]) => {
        setProperties(propData.properties || propData || []);
        setStats(dashData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const filtered = properties.filter((p) => {
    // When viewing active properties, only show occupied ones (with residents)
    if (statusFilter === 'active') {
      const residents = p.resident_count ?? p.current_residents ?? 0;
      if (residents === 0) return false;
    }
    if (typeFilter !== 'all' && p.property_type !== typeFilter) return false;
    if (stateFilter !== 'all' && p.state !== stateFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q) ||
      (p.suburb || '').toLowerCase().includes(q)
    );
  });

  // Group by state for display
  const states = ['VIC', 'SA', 'TAS'];
  const availableStates = [...new Set(properties.map((p) => p.state).filter(Boolean))];
  const stateLabels = { VIC: 'Victoria', SA: 'South Australia', TAS: 'Tasmania' };
  const groupedByState = {};
  for (const p of filtered) {
    const s = p.state || 'Other';
    if (!groupedByState[s]) groupedByState[s] = [];
    groupedByState[s].push(p);
  }
  const orderedStates = states.filter((s) => groupedByState[s]?.length > 0);
  if (groupedByState['Other']?.length > 0) orderedStates.push('Other');

  const totalProps = stats?.total_properties ?? properties.length;
  const totalCapacity = stats?.total_capacity ?? 0;
  const totalResidents = stats?.total_residents ?? 0;
  const occupancyRate = totalCapacity > 0 ? Math.round((totalResidents / totalCapacity) * 100) : 0;
  const pendingMaintenance = stats?.pending_maintenance ?? 0;
  const overdueInspections = stats?.overdue_inspections ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Property Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage SIL/SDA properties and residents</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
        >
          <HiPlus className="h-4 w-4" />
          Add Property
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          [...Array(6)].map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard icon={HiBuildingOffice2} label="Total Properties" value={totalProps} color="bg-blue-50 dark:bg-blue-900/30 text-brand-500" />
            <StatCard icon={HiUsers} label="Total Capacity" value={`${totalCapacity} beds`} color="bg-green-50 dark:bg-green-900/30 text-accent-500" />
            <StatCard icon={HiUsers} label="Current Residents" value={totalResidents} color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={HiChartBar} label="Occupancy Rate" value={`${occupancyRate}%`} color="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
            <StatCard
              icon={HiWrenchScrewdriver}
              label="Pending Maintenance"
              value={pendingMaintenance}
              color={pendingMaintenance > 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-50 dark:bg-[#1e2d4a] text-slate-400'}
            />
            <StatCard
              icon={HiExclamationTriangle}
              label="Overdue Inspections"
              value={overdueInspections}
              color={overdueInspections > 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-slate-50 dark:bg-[#1e2d4a] text-slate-400'}
            />
          </>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'inactive', 'maintenance'].map((opt) => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                statusFilter === opt
                  ? 'bg-accent-500 text-white'
                  : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
              }`}
            >
              {opt}
            </button>
          ))}
          <div className="mx-1 w-px bg-slate-200 dark:bg-[#1e2d4a]" />
          {['all', ...availableStates].map((opt) => (
            <button
              key={opt}
              onClick={() => setStateFilter(opt)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                stateFilter === opt
                  ? 'bg-brand-500 text-white'
                  : 'bg-white dark:bg-[#162036] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#263554] hover:bg-slate-50 dark:hover:bg-[#1e2d4a]'
              }`}
            >
              {opt === 'all' ? 'All States' : stateLabels[opt] || opt}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Property Grid */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
          <HiBuildingOffice2 className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {search ? 'No properties matching your search.' : 'No properties found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {orderedStates.map((state) => (
            <div key={state}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {stateLabels[state] || state}
                </h2>
                <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-500">
                  {groupedByState[state].length}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {groupedByState[state].map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddPropertyModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          loadData();
        }}
      />
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

function PropertyCard({ property }) {
  const p = property;
  const occupied = p.resident_count ?? p.current_residents ?? 0;
  const capacity = p.capacity ?? 0;
  const occupancyPct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
  const pendingMaint = p.pending_maintenance ?? 0;

  const typeColors = {
    SIL: 'bg-green-50 dark:bg-green-900/20 text-accent-500',
    SDA: 'bg-blue-50 dark:bg-blue-900/20 text-brand-500',
    'SIL/SDA': 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  const statusColors = {
    active: 'bg-green-50 dark:bg-green-900/20 text-accent-500',
    inactive: 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-500 dark:text-slate-400',
    maintenance: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  };

  const barColor =
    occupancyPct > 90 ? 'bg-red-500' : occupancyPct >= 75 ? 'bg-amber-500' : 'bg-accent-500';

  return (
    <Link
      to={`/properties/${p.id}`}
      className="card-hover group flex flex-col rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-600"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-accent-500">
            {p.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{p.address}</p>
          {p.suburb && (
            <p className="truncate text-xs text-slate-400">
              {p.suburb}
              {p.state ? `, ${p.state}` : ''}
              {p.postcode ? ` ${p.postcode}` : ''}
            </p>
          )}
        </div>
        <div className="ml-3 flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[p.property_type] || 'bg-slate-100 dark:bg-[#1e2d4a] text-slate-500'}`}>
            {p.property_type || 'SIL'}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[p.status] || statusColors.active}`}>
            {p.status || 'active'}
          </span>
        </div>
      </div>

      {capacity > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {occupied}/{capacity} beds occupied
            </span>
            <span className="text-slate-400">{occupancyPct}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1e2d4a]">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(occupancyPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {pendingMaint > 0 && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5">
          <HiWrenchScrewdriver className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-600">
            {pendingMaint} pending maintenance
          </span>
        </div>
      )}
    </Link>
  );
}
