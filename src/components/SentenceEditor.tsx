import { useState } from 'react';
import type { LessonSentence } from '../types';

interface SentenceEditorProps {
  sentences: LessonSentence[];
  onChange: (sentences: { index: number; text: string; blanksJson: any[] }[]) => void;
}

export default function SentenceEditor({ sentences, onChange }: SentenceEditorProps) {
  const [edited, setEdited] = useState(sentences.map(s => ({ ...s })));

  function updateText(idx: number, text: string) {
    setEdited(prev => prev.map((s, i) => i === idx ? { ...s, text } : s));
  }

  function removeSentence(idx: number) {
    setEdited(prev => prev.filter((_, i) => i !== idx));
  }

  function mergeWithNext(idx: number) {
    if (idx >= edited.length - 1) return;
    setEdited(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], text: next[idx].text + ' ' + next[idx + 1].text };
      next.splice(idx + 1, 1);
      return next;
    });
  }

  function handleSave() {
    onChange(
      edited.map((s, i) => ({
        index: i,
        text: s.text,
        blanksJson: s.blanks,
      }))
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text">Review &amp; Edit Sentences</h3>
      <p className="text-xs text-text-secondary">
        Edit sentences, merge short ones, or remove unnecessary ones.
      </p>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {edited.map((s, idx) => (
          <div key={idx} className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3">
            <span className="mt-1 shrink-0 text-xs font-bold text-text-tertiary w-6">{idx + 1}.</span>
            <textarea
              value={s.text}
              onChange={(e) => updateText(idx, e.target.value)}
              rows={2}
              className="flex-1 resize-none rounded-md border border-border bg-bg p-2 text-sm text-text focus:border-primary/50 focus:outline-none"
            />
            <div className="flex flex-col gap-1 shrink-0">
              {idx < edited.length - 1 && (
                <button
                  onClick={() => mergeWithNext(idx)}
                  className="rounded px-2 py-1 text-[10px] font-medium text-text-secondary hover:text-primary border border-border"
                  title="Merge with next sentence"
                >
                  Merge &darr;
                </button>
              )}
              <button
                onClick={() => removeSentence(idx)}
                className="rounded px-2 py-1 text-[10px] font-medium text-error hover:bg-error/10 border border-error/20"
                title="Remove sentence"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-text-secondary">
        {edited.length} sentences detected. {edited.filter(s => s.blanks.length === 0).length} have no blanks.
      </div>

      <button
        onClick={handleSave}
        className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover transition-all"
      >
        Save &amp; Generate Audio
      </button>
    </div>
  );
}
