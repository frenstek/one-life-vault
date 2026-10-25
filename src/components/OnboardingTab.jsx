import { useState, useEffect, useCallback } from 'react';
import {
  HiCheckCircle,
  HiLockClosed,
  HiClipboardDocumentCheck,
  HiDocumentText,
  HiBriefcase,
  HiAcademicCap,
  HiCog6Tooth,
  HiSparkles,
  HiArrowPath,
} from 'react-icons/hi2';
import {
  fetchOnboardingProgress,
  toggleOnboardingItem,
  updateStaffMember,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_CONFIG = {
  'Documentation & Clearances': {
    icon: HiDocumentText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  'Employment & Admin': {
    icon: HiBriefcase,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  'Training & Induction': {
    icon: HiAcademicCap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  'Access & Setup': {
    icon: HiCog6Tooth,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
};

function formatDateShort(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Skeleton loader ────────────────────────────────────────────────────────

function OnboardingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Progress header skeleton */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <div className="flex items-center gap-6">
          <div className="h-28 w-28 rounded-full bg-slate-200 dark:bg-[#1e2d4a]" />
          <div className="space-y-3 flex-1">
            <div className="h-5 w-48 rounded bg-slate-200 dark:bg-[#1e2d4a]" />
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-[#1e2d4a]" />
          </div>
        </div>
      </div>
      {/* Category skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6"
        >
          <div className="h-5 w-56 rounded bg-slate-200 dark:bg-[#1e2d4a] mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-slate-200 dark:bg-[#1e2d4a]" />
                <div className="h-4 flex-1 rounded bg-slate-200 dark:bg-[#1e2d4a]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Progress Ring ──────────────────────────────────────────────────────────

function ProgressRing({ percentage, size = 112, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isComplete = percentage >= 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-[#1e2d4a]"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-700 ease-out ${
            isComplete
              ? 'text-accent-500'
              : percentage >= 50
                ? 'text-brand-500'
                : 'text-amber-500'
          }`}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-2xl font-bold ${
            isComplete
              ? 'text-accent-500'
              : 'text-slate-800 dark:text-white'
          }`}
        >
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

// ─── Checklist Item ─────────────────────────────────────────────────────────

function ChecklistItem({ item, onToggle, toggling }) {
  const isAuto = item.auto_completed;
  const isCompleted = item.completed;
  const isToggling = toggling === item.template_id;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        isCompleted
          ? 'bg-green-50/50 dark:bg-green-900/5'
          : 'hover:bg-slate-50 dark:hover:bg-[#1e2d4a]/50'
      }`}
    >
      {/* Checkbox or lock icon */}
      {isAuto ? (
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-cyan-100 dark:bg-cyan-900/30">
          <HiLockClosed className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
        </div>
      ) : (
        <button
          onClick={() => onToggle(item)}
          disabled={isToggling}
          className="group flex h-5 w-5 flex-shrink-0 items-center justify-center"
        >
          {isToggling ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-brand-500" />
          ) : isCompleted ? (
            <HiCheckCircle className="h-5 w-5 text-accent-500 transition-transform group-hover:scale-110" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-[#334766] transition-colors group-hover:border-brand-500" />
          )}
        </button>
      )}

      {/* Label and metadata */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              isCompleted
                ? 'text-slate-500 dark:text-slate-400 line-through'
                : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            {item.label}
          </span>
          {isAuto && (
            <span className="inline-flex items-center rounded-full bg-cyan-100 dark:bg-cyan-900/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300">
              Auto
            </span>
          )}
        </div>
        {isCompleted && !isAuto && item.completed_by && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Completed by {item.completed_by}
            {item.completed_at && ` on ${formatDateShort(item.completed_at)}`}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OnboardingTab({ staffId, staffName, onStatusChange }) {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [activating, setActivating] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchOnboardingProgress(staffId);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    setLoading(true);
    loadProgress();
  }, [loadProgress]);

  async function handleToggle(item) {
    const newCompleted = !item.completed;
    setToggling(item.template_id);

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.items = updated.items.map((i) =>
        i.template_id === item.template_id
          ? {
              ...i,
              completed: newCompleted,
              completed_by: newCompleted ? (profile?.full_name || 'You') : null,
              completed_at: newCompleted ? new Date().toISOString() : null,
            }
          : i
      );
      // Recalculate counts
      const completedCount = updated.items.filter((i) => i.completed).length;
      updated.completed = completedCount;
      updated.total = updated.items.length;
      updated.percentage = updated.total > 0 ? Math.round((completedCount / updated.total) * 100) : 0;
      return updated;
    });

    try {
      await toggleOnboardingItem(
        staffId,
        item.template_id,
        newCompleted,
        newCompleted ? (profile?.full_name || profile?.email || 'Staff') : null
      );
      // Refresh to get actual server state
      const result = await fetchOnboardingProgress(staffId);
      setData(result);
    } catch (err) {
      // Revert on failure
      await loadProgress();
      console.error('Toggle failed:', err);
    } finally {
      setToggling(null);
    }
  }

  async function handleActivate() {
    setActivating(true);
    try {
      await updateStaffMember(staffId, { status: 'active' });
      onStatusChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setActivating(false);
    }
  }

  if (loading) return <OnboardingSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
        <button
          onClick={() => { setLoading(true); loadProgress(); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-[#1e2d4a] px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <HiArrowPath className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { items = [], completed = 0, total = 0, percentage = 0 } = data;
  const isComplete = percentage >= 100;

  // Group items by category
  const grouped = {};
  items.forEach((item) => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  // Order categories as defined
  const categoryOrder = Object.keys(CATEGORY_CONFIG);
  const sortedCategories = [
    ...categoryOrder.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !categoryOrder.includes(c)),
  ];

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <ProgressRing percentage={percentage} />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Onboarding Progress
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {completed} of {total}
              </span>{' '}
              items completed
              {staffName && (
                <span className="text-slate-400 dark:text-slate-500">
                  {' '}for {staffName}
                </span>
              )}
            </p>
            {isComplete && (
              <div className="mt-4 flex items-center gap-3 sm:justify-start justify-center">
                <div className="flex items-center gap-1.5 text-sm font-medium text-accent-500">
                  <HiSparkles className="h-4 w-4" />
                  All items complete
                </div>
                <button
                  onClick={handleActivate}
                  disabled={activating}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
                >
                  {activating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <HiCheckCircle className="h-4 w-4" />
                      Activate Staff
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      {sortedCategories.map((category) => {
        const config = CATEGORY_CONFIG[category] || {
          icon: HiClipboardDocumentCheck,
          color: 'text-slate-500',
          bgColor: 'bg-slate-500/10',
        };
        const Icon = config.icon;
        const categoryItems = grouped[category];
        const catCompleted = categoryItems.filter((i) => i.completed).length;
        const catTotal = categoryItems.length;

        return (
          <div
            key={category}
            className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#263554] px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor}`}
                >
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {category}
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {catCompleted}/{catTotal}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-slate-100 dark:divide-[#263554]/50 px-3 py-1">
              {categoryItems.map((item) => (
                <ChecklistItem
                  key={item.template_id}
                  item={item}
                  onToggle={handleToggle}
                  toggling={toggling}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state if no items */}
      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-[#334766] bg-slate-50/50 dark:bg-[#1e2d4a]/30 p-12 text-center">
          <HiClipboardDocumentCheck className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No onboarding checklist configured
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Onboarding templates have not been set up yet.
          </p>
        </div>
      )}
    </div>
  );
}
