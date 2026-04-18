export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-[#1e2d4a] ${className}`} />;
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-5 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-[#1e2d4a] flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-4">
      <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-200 dark:bg-[#1e2d4a]" />
      <div className="flex-1 space-y-2">
        <div className="h-6 w-12 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200 dark:bg-[#1e2d4a] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
      </div>
      <div className="h-5 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-[#1e2d4a]" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-10">
      {/* Welcome banner */}
      <SkeletonBlock className="h-32" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
      </div>

      {/* Quick access */}
      <div>
        <div className="mb-5 h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
              <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200 dark:bg-[#1e2d4a]" />
              <div className="space-y-2 text-center">
                <div className="mx-auto h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
                <div className="mx-auto h-3 w-12 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden">
          {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-8">
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
                  <div className="h-4 w-8 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d4a]" />
                </div>
                <div className="h-3.5 animate-pulse rounded-full bg-slate-200 dark:bg-[#1e2d4a]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, cols = 'sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div className={`grid gap-4 ${cols}`}>
      {[...Array(count)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
