import type { Difficulty } from '../types';

interface DifficultyCardProps {
  difficulty: Difficulty;
  title: string;
  description: string;
  color: string;
  lessonCount: number;
  completedCount: number;
  onClick: () => void;
}

export default function DifficultyCard({
  title,
  description,
  color,
  lessonCount,
  completedCount,
  onClick,
}: DifficultyCardProps) {
  const pct = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl glass p-6 text-left transition-all duration-300 hover:bg-aurora-card/80 hover:border-aurora-border hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] ${color}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white tracking-tight">{title}</h3>
        <span className="rounded-full bg-aurora-border/50 px-2.5 py-0.5 text-xs font-medium text-aurora-muted">
          {completedCount}/{lessonCount}
        </span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-aurora-muted">{description}</p>
      <div className="h-2 rounded-full bg-aurora-border/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(color)} ${pct > 0 ? 'progress-bar-shimmer' : ''}`}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
    </button>
  );
}

function getBarColor(colorClass: string): string {
  if (colorClass.includes('emerald')) return 'bg-aurora-emerald';
  if (colorClass.includes('amber')) return 'bg-aurora-amber';
  if (colorClass.includes('violet')) return 'bg-aurora-violet';
  return 'bg-aurora-muted';
}
