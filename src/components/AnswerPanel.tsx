import type { ReviewSentenceDetail } from '../types';
import ClozeRenderer from './ClozeRenderer';

interface AnswerPanelProps {
  sentences: ReviewSentenceDetail[];
  activeSentenceId: number | null;
  onSentenceClick: (sentenceId: number) => void;
}

export default function AnswerPanel({
  sentences,
  activeSentenceId,
  onSentenceClick,
}: AnswerPanelProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Your Answers
      </h3>
      <div className="space-y-1.5">
        {sentences.map((s) => {
          const hasError = s.blanks.some(b => !b.correct);
          // Build blanks with proper position data for ClozeRenderer
          const clozeBlanks = s.blanks.map(b => ({
            word: b.word,
            position: (b as any).position ?? 0,
            length: (b as any).length ?? b.word.length,
          }));
          return (
            <button
              key={s.sentenceId}
              onClick={() => onSentenceClick(s.sentenceId)}
              className={`w-full text-left rounded-lg p-3 transition-all ${
                activeSentenceId === s.sentenceId
                  ? 'bg-primary/10 border border-primary/30'
                  : hasError
                  ? 'bg-error/5 border border-error/20 hover:border-error/40'
                  : 'bg-surface border border-transparent hover:border-border'
              }`}
            >
              <ClozeRenderer
                text={s.sentenceText}
                blanks={clozeBlanks}
                readOnly
                results={s.blanks}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
