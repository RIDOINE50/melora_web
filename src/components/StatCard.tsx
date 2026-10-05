import type { LucideIcon } from 'lucide-react';

export default function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
      <div className="text-2xl font-extrabold text-heading">{value}</div>
      {hint && <div className="mt-1 text-xs text-neutral-500">{hint}</div>}
    </div>
  );
}
