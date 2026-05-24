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
      className={`w-full rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-left transition-all hover:border-slate-700 hover:bg-slate-900 hover:shadow-lg ${color}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
          {completedCount}/{lessonCount}
        </span>
      </div>
      <p className="mb-4 text-sm text-slate-400">{description}</p>
      <div className="h-1.5 rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(color)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}

function getBarColor(colorClass: string): string {
  if (colorClass.includes('emerald')) return 'bg-emerald-500';
  if (colorClass.includes('amber')) return 'bg-amber-500';
  if (colorClass.includes('violet')) return 'bg-violet-500';
  return 'bg-slate-500';
}
