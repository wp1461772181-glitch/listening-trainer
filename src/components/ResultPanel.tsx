import type { DiffToken } from '../utils/compare';

interface ResultPanelProps {
  diff: DiffToken[];
  score: number;
  originalText: string;
  onNext: (() => void) | null;
  onRetry: () => void;
  onReveal: () => void;
  revealed: boolean;
}

export default function ResultPanel({
  diff,
  score,
  originalText,
  onNext,
  onRetry,
  onReveal,
  revealed,
}: ResultPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
          <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}%</span>
        </div>
        <div>
          <div className="text-lg font-semibold text-white">
            {score >= 80 ? 'Great job!' : score >= 50 ? 'Good effort!' : 'Keep trying!'}
          </div>
          <div className="text-sm text-slate-400">
            {diff.filter((d) => d.status === 'correct').length} of {diff.length} words correct
          </div>
        </div>
      </div>

      {!revealed && score < 100 && (
        <button
          onClick={onReveal}
          className="w-full rounded-xl border border-slate-700 bg-slate-900/50 py-3 text-sm text-slate-400 transition-all hover:border-amber-500 hover:text-amber-400"
        >
          Reveal Answer
        </button>
      )}

      {revealed && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Original Text
          </div>
          <p className="text-slate-300 leading-relaxed">{originalText}</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
          Your Input
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {diff.map((token, i) => (
            <span
              key={i}
              className={`rounded px-1 py-0.5 text-sm font-medium ${
                token.status === 'correct'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : token.status === 'wrong'
                    ? 'bg-red-500/15 text-red-400 line-through'
                    : token.status === 'missing'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-slate-800 text-slate-500'
              }`}
            >
              {token.word}
            </span>
          ))}
          {diff.length === 0 && (
            <span className="text-sm text-slate-600 italic">Empty</span>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-slate-500 hover:text-white"
        >
          Try Again
        </button>
        {onNext && (
          <button
            onClick={onNext}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-500"
          >
            Next Lesson
          </button>
        )}
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}
