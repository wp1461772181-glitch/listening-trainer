import type { DiffToken } from '../utils/compare';
import Card from './ui/Card';
import Badge from './ui/Badge';

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
    great: { label: 'Great job!', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
    good: { label: 'Good effort!', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
    keep: { label: 'Keep trying!', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20' },
  }[grade];

  return (
    <div className="space-y-5">
      {/* Score display */}
      <Card className={`flex items-center gap-5 p-6 ${gradeConfig.border}`}>
        <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${gradeConfig.bg}`}>
          <span className={`text-3xl font-extrabold tracking-tight ${gradeConfig.color}`}>
            {score}%
          </span>
        </div>
        <div>
          <div className={`text-xl font-bold ${gradeConfig.color}`}>{gradeConfig.label}</div>
          <div className="mt-0.5 text-sm text-text-secondary">
            {diff.filter((d) => d.status === 'correct').length} of {diff.length} words correct
          </div>
        </div>
      </Card>

      {/* Reveal answer */}
      {!revealed && score < 100 && (
        <button
          onClick={onReveal}
          className="w-full rounded-lg border border-border bg-surface py-3 text-sm font-medium text-text-secondary hover:border-warning/40 hover:text-warning hover:bg-warning/5 transition-all"
        >
          Reveal Answer
        </button>
      )}

      {/* Original text */}
      {revealed && (
        <Card className="p-5 animate-fade-in">
          <div className="mb-2 text-xs font-semibold tracking-[0.15em] text-text-secondary uppercase">
            Original Text
          </div>
          <p className="text-sm leading-relaxed text-text">{originalText}</p>
        </Card>
      )}

      {/* Your input with diff */}
      <Card className="p-5">
        <div className="mb-3 text-xs font-semibold tracking-[0.15em] text-text-secondary uppercase">
          Your Input
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1.5">
          {diff.map((token, i) => (
            <Badge
              key={i}
              variant={
                token.status === 'correct' ? 'success'
                : token.status === 'wrong' ? 'error'
                : token.status === 'missing' ? 'warning'
                : 'default'
              }
            >
              {token.word}
            </Badge>
          ))}
          {diff.length === 0 && (
            <span className="text-sm text-text-secondary italic">Empty</span>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-text hover:bg-bg-alt transition-all active:scale-[0.99]"
        >
          Try Again
        </button>
        {onNext && (
          <button
            onClick={onNext}
            className="flex-1 rounded-xl bg-success py-3 text-sm font-semibold text-white hover:bg-success/90 transition-all active:scale-[0.99]"
          >
            Next Lesson
          </button>
        )}
      </div>
    </div>
  );
}
