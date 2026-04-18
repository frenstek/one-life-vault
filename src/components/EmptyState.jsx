import { HiFolderOpen } from 'react-icons/hi2';

export default function EmptyState({
  icon: Icon = HiFolderOpen,
  title = 'Nothing here yet',
  description = 'This folder is empty.',
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-2xl bg-slate-100 p-5">
        <Icon className="h-10 w-10 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}
