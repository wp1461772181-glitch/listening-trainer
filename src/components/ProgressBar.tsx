interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-aurora-border/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-aurora-emerald to-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-aurora-muted tabular-nums">
        {current}/{total}
      </span>
    </div>
  );
}
