import type { LessonStatus } from '../types';

const statusConfig: Record<LessonStatus, { label: string; color: string; bg: string; pulse?: boolean }> = {
  drafting: { label: 'Draft', color: 'text-text-secondary', bg: 'bg-bg-alt' },
  generating: { label: 'Generating', color: 'text-warning', bg: 'bg-warning/10', pulse: true },
  ready: { label: 'Ready', color: 'text-success', bg: 'bg-success/10' },
  failed: { label: 'Failed', color: 'text-error', bg: 'bg-error/10' },
};

export default function StatusBadge({ status }: { status: LessonStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.color}`}>
      {config.pulse && (
        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
