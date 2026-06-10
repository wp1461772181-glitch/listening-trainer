import type { ReviewSentenceDetail } from '../types';

interface OriginalTextPanelProps {
  sentences: ReviewSentenceDetail[];
  activeSentenceId: number | null;
  onSentenceClick: (sentenceId: number) => void;
}

export default function OriginalTextPanel({
  sentences,
  activeSentenceId,
  onSentenceClick,
}: OriginalTextPanelProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Original Text
      </h3>
      <div className="space-y-1.5">
        {sentences.map((s) => (
          <button
            key={s.sentenceId}
            onClick={() => onSentenceClick(s.sentenceId)}
            className={`w-full text-left rounded-lg p-3 text-sm leading-relaxed transition-all ${
              activeSentenceId === s.sentenceId
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-surface text-text border border-transparent hover:border-border'
            }`}
          >
            {s.sentenceText}
          </button>
        ))}
      </div>
    </div>
  );
}
