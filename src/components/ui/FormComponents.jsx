/**
 * Reusable form components — consistent styling per DESIGN_SYSTEM.md
 * All inputs use global CSS styles from index.css (py-3 px-4, border, focus ring)
 */

export function FormField({ label, required, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-2.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function FormInput({ label, required, hint, error, className = '', ...props }) {
  return (
    <FormField label={label} required={required} hint={hint} error={error}>
      <input
        className={`w-full ${error ? 'border-red-300 dark:border-red-700' : ''} ${className}`}
        {...props}
      />
    </FormField>
  );
}

export function FormSelect({ label, required, hint, error, children, className = '', ...props }) {
  return (
    <FormField label={label} required={required} hint={hint} error={error}>
      <select
        className={`w-full ${error ? 'border-red-300 dark:border-red-700' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
    </FormField>
  );
}

export function FormTextarea({ label, required, hint, error, className = '', ...props }) {
  return (
    <FormField label={label} required={required} hint={hint} error={error}>
      <textarea
        className={`w-full resize-none ${error ? 'border-red-300 dark:border-red-700' : ''} ${className}`}
        {...props}
      />
    </FormField>
  );
}

export function FormRow({ children, cols = 2 }) {
  const gridCols = cols === 3 ? 'sm:grid-cols-3' : cols === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-2';
  return (
    <div className={`grid gap-6 ${gridCols}`}>
      {children}
    </div>
  );
}

export function FormSection({ title, children }) {
  return (
    <div>
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

export function FormDivider() {
  return <hr className="border-slate-200 dark:border-[#263554]" />;
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    info: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color, borderColor }) {
  return (
    <div className={`flex items-center gap-4 rounded-xl border border-slate-200 dark:border-[#263554] ${borderColor ? `border-l-4 ${borderColor}` : ''} bg-white dark:bg-[#162036] px-5 py-5`}>
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

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] p-12 text-center">
      {Icon && <Icon className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />}
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 dark:border-[#263554]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === tab.id
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {tab.icon && <tab.icon className="h-4 w-4" />}
          {tab.label}
          {tab.count != null && ` (${tab.count})`}
        </button>
      ))}
    </div>
  );
}
