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
  const grade = score >= 80 ? 'great' : score >= 50 ? 'good' : 'keep';
  const gradeConfig = {
    great: { label: 'Great job!', color: 'text-aurora-emerald', ring: 'ring-aurora-emerald/30', bg: 'bg-aurora-emerald/10' },
    good: { label: 'Good effort!', color: 'text-aurora-amber', ring: 'ring-aurora-amber/30', bg: 'bg-aurora-amber/10' },
    keep: { label: 'Keep trying!', color: 'text-red-400', ring: 'ring-red-400/30', bg: 'bg-red-500/10' },
  }[grade];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Score display */}
      <div className="flex items-center gap-5 rounded-2xl glass p-6">
        <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${gradeConfig.bg} ring-2 ${gradeConfig.ring}`}>
          <span className={`text-3xl font-extrabold tracking-tight ${gradeConfig.color}`}>
            {score}%
          </span>
        </div>
        <div>
          <div className={`text-xl font-bold ${gradeConfig.color}`}>{gradeConfig.label}</div>
          <div className="mt-0.5 text-sm text-aurora-muted">
            {diff.filter((d) => d.status === 'correct').length} of {diff.length} words correct
          </div>
        </div>
      </div>

      {/* Reveal answer */}
      {!revealed && score < 100 && (
        <button
          onClick={onReveal}
          className="w-full rounded-xl glass py-3 text-sm font-medium text-aurora-muted transition-all duration-300 hover:border-aurora-amber/40 hover:text-aurora-amber hover:bg-aurora-amber/5"
        >
          Reveal Answer
        </button>
      )}

      {/* Original text */}
      {revealed && (
        <div className="rounded-xl glass p-5 animate-fade-in">
          <div className="mb-2 text-xs font-semibold tracking-[0.15em] text-aurora-muted uppercase">
            Original Text
          </div>
          <p className="text-sm leading-relaxed text-aurora-text">{originalText}</p>
        </div>
      )}

      {/* Your input with diff */}
      <div className="rounded-xl glass p-5">
        <div className="mb-3 text-xs font-semibold tracking-[0.15em] text-aurora-muted uppercase">
          Your Input
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1.5">
          {diff.map((token, i) => (
            <span
              key={i}
              className={`rounded-md px-1.5 py-0.5 text-sm font-medium transition-all ${
                token.status === 'correct'
                  ? 'bg-aurora-emerald/15 text-aurora-emerald'
                  : token.status === 'wrong'
                    ? 'bg-red-500/15 text-red-400 line-through'
                    : token.status === 'missing'
                      ? 'bg-aurora-amber/15 text-aurora-amber'
                      : 'bg-aurora-border/50 text-aurora-muted'
              }`}
            >
              {token.word}
            </span>
          ))}
          {diff.length === 0 && (
            <span className="text-sm text-aurora-muted italic">Empty</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 rounded-xl glass py-3 text-sm font-semibold text-aurora-text transition-all duration-300 hover:bg-white/10 hover:border-aurora-border active:scale-[0.98]"
        >
          Try Again
        </button>
        {onNext && (
          <button
            onClick={onNext}
            className="flex-1 rounded-xl bg-gradient-to-r from-aurora-emerald to-emerald-600 py-3 text-sm font-semibold text-white transition-all duration-300 hover:glow-emerald active:scale-[0.98]"
          >
            Next Lesson
          </button>
        )}
      </div>
    </div>
  );
}
