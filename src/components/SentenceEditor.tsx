import { useState } from 'react';
import type { LessonSentence } from '../types';
import SentenceBlanksEditor from './SentenceBlanksEditor';

interface SentenceEditorProps {
  sentences: LessonSentence[];
  onChange: (sentences: { index: number; text: string; blanksJson: any[] }[]) => void;
  lessonId?: number;
}

export default function SentenceEditor({ sentences, onChange, lessonId }: SentenceEditorProps) {
  const [edited, setEdited] = useState(sentences.map(s => ({ ...s })));
  const [expandedBlanks, setExpandedBlanks] = useState<Set<number>>(new Set());
  const [regenerating, setRegenerating] = useState<Set<number>>(new Set());

  function updateText(idx: number, text: string) {
    setEdited(prev => prev.map((s, i) => i === idx ? { ...s, text } : s));
  }

  function updateBlanks(idx: number, blanks: any[]) {
    setEdited(prev => prev.map((s, i) => i === idx ? { ...s, blanks } : s));
  }

  function removeSentence(idx: number) {
    setEdited(prev => prev.filter((_, i) => i !== idx));
  }

  function mergeWithNext(idx: number) {
    if (idx >= edited.length - 1) return;
    setEdited(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], text: next[idx].text + ' ' + next[idx + 1].text, blanks: [] };
      next.splice(idx + 1, 1);
      return next;
    });
  }

  function toggleBlanksEditor(idx: number) {
    setExpandedBlanks(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  async function handleRegenerateAll() {
    if (!lessonId) return;
    setRegenerating(new Set([0])); // show loading on first sentence
    try {
      const { apiRegenerateBlanks } = await import('../lib/api');
      const lesson = await apiRegenerateBlanks(lessonId);
      setEdited(lesson.sentences.map(s => ({ ...s })));
    } catch (e) {
      console.error('Regenerate failed:', e);
    }
    setRegenerating(new Set());
  }

  async function handleRegenerateSentence(idx: number) {
    if (!lessonId || !edited[idx]?.id) return;
    setRegenerating(prev => { const next = new Set(prev); next.add(idx); return next; });
    try {
      const { apiRegenerateSentenceBlanks } = await import('../lib/api');
      const lesson = await apiRegenerateSentenceBlanks(lessonId, edited[idx].id);
      const updatedSentence = lesson.sentences.find(s => s.id === edited[idx].id);
      if (updatedSentence) {
        setEdited(prev => prev.map((s, i) => i === idx ? { ...s, blanks: updatedSentence.blanks } : s));
      }
    } catch (e) {
      console.error('Regenerate sentence failed:', e);
    }
    setRegenerating(prev => { const next = new Set(prev); next.delete(idx); return next; });
  }

  function handleSave() {
    onChange(
      edited.map((s, i) => ({
        index: i,
        text: s.text,
        blanksJson: s.blanks || [],
      }))
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">Review &amp; Edit Sentences</h3>
          <p className="text-xs text-text-secondary">
            Edit sentences, adjust blanks, or regenerate.
          </p>
        </div>
        {lessonId && (
          <button
            onClick={handleRegenerateAll}
            disabled={regenerating.size > 0}
            className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {regenerating.size > 0 ? 'Regenerating...' : 'Regenerate All Blanks'}
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {edited.map((s, idx) => {
          const isExpanded = expandedBlanks.has(idx);
          const isRegenerating = regenerating.has(idx);
          const blanks = s.blanks || [];

          return (
            <div key={idx} className="rounded-lg border border-border bg-surface">
              <div className="flex items-start gap-2 p-3">
                <span className="mt-1 shrink-0 text-xs font-bold text-text-tertiary w-6">{idx + 1}.</span>
                <textarea
                  value={s.text}
                  onChange={(e) => updateText(idx, e.target.value)}
                  rows={2}
                  className="flex-1 resize-none rounded-md border border-border bg-bg p-2 text-sm text-text focus:border-primary/50 focus:outline-none"
                />
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => toggleBlanksEditor(idx)}
                    className={`rounded px-2 py-1 text-[10px] font-medium border transition-all ${
                      isExpanded
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-bg text-text-secondary hover:text-primary border-border'
                    }`}
                    title="Edit blanks"
                  >
                    {blanks.length} blanks
                  </button>
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

              {isExpanded && (
                <div className="border-t border-border px-3 pb-3">
                  <SentenceBlanksEditor
                    sentenceText={s.text}
                    blanks={blanks}
                    onChange={(newBlanks) => updateBlanks(idx, newBlanks)}
                    onRegenerate={() => handleRegenerateSentence(idx)}
                    regenerating={isRegenerating}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-text-secondary">
        {edited.length} sentences. {edited.filter(s => (s.blanks || []).length === 0).length} have no blanks.
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
