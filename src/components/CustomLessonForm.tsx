import { useState, useCallback, useRef } from 'react';
import type { Difficulty, Lesson } from '../types';
import { checkGrammar, highlightErrors, checkSpacing, normalizeText, type GrammarMatch } from '../utils/grammar';
import { saveCustomLesson } from '../utils/customLessons';

interface Props {
  onBack: () => void;
  onStart: (lesson: Lesson) => void;
  onSaved?: () => void;
}

export default function CustomLessonForm({ onBack, onStart, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('academic');
  const [hint, setHint] = useState('');
  const [sentence, setSentence] = useState('');
  const [voice, setVoice] = useState<'male' | 'female'>('female');
  const [matches, setMatches] = useState<GrammarMatch[]>([]);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [spacingResult, setSpacingResult] = useState<ReturnType<typeof checkSpacing> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildLesson = useCallback((): Lesson => ({
    id: `custom-${Date.now()}`,
    difficulty,
    title: title.trim() || 'Custom Lesson',
    sentence: sentence.trim(),
    hint: hint.trim() || 'Custom practice text',
    voice,
  }), [title, difficulty, hint, sentence, voice]);

  const handleCheck = useCallback(async () => {
    if (!sentence.trim()) return;
    setChecking(true);
    const result = await checkGrammar(sentence);
    setMatches(result);
    setChecked(true);
    setChecking(false);
  }, [sentence]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const lesson = buildLesson();
    const result = await saveCustomLesson(lesson);
    if (result) {
      setSaved(true);
      if (onSaved) {
        onSaved();
      } else {
        setTimeout(() => setSaved(false), 2000);
      }
    }
    setSaving(false);
  }, [buildLesson, onSaved]);

  const handleSaveAndStart = useCallback(async () => {
    const lesson = buildLesson();
    const result = await saveCustomLesson(lesson);
    onStart(result || lesson);
  }, [buildLesson, onStart]);

  const canSave = sentence.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-aurora-muted hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-white tracking-tight">Create Custom Lesson</h2>
      </div>

      <div className="rounded-2xl glass p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-aurora-text">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., My Biology Notes"
            className="w-full rounded-xl border border-aurora-border bg-aurora-surface/60 px-4 py-2.5 text-sm text-aurora-text placeholder:text-aurora-muted/50 focus:border-aurora-violet/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/10 transition-all"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-aurora-text">Difficulty</label>
          <div className="flex gap-2">
            {([
              ['daily', 'Daily'],
              ['campus', 'Campus'],
              ['academic', 'Academic'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDifficulty(val)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  difficulty === val
                    ? 'bg-aurora-violet text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                    : 'bg-aurora-border/40 text-aurora-muted hover:bg-aurora-border hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-aurora-text">TTS Voice</label>
          <div className="flex gap-2">
            {(['female', 'male'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVoice(v)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all duration-200 ${
                  voice === v
                    ? 'bg-aurora-violet text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                    : 'bg-aurora-border/40 text-aurora-muted hover:bg-aurora-border hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Hint */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-aurora-text">Context / Hint</label>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g., Biology lecture about cell structure"
            className="w-full rounded-xl border border-aurora-border bg-aurora-surface/60 px-4 py-2.5 text-sm text-aurora-text placeholder:text-aurora-muted/50 focus:border-aurora-violet/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/10 transition-all"
          />
        </div>

        {/* Sentence */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-aurora-text">
            Sentence <span className="text-aurora-muted font-normal">(the text you'll hear and reconstruct)</span>
          </label>
          <textarea
            value={sentence}
            onChange={(e) => {
              setSentence(e.target.value);
              setChecked(false);
              setMatches([]);
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => {
                const result = checkSpacing(e.target.value);
                setSpacingResult(result.hasIssues ? result : null);
              }, 400);
            }}
            placeholder="Enter the full sentence or paragraph you want to practice with..."
            rows={4}
            className="w-full resize-none rounded-xl border border-aurora-border bg-aurora-surface/60 p-4 text-sm leading-relaxed text-aurora-text placeholder:text-aurora-muted/50 focus:border-aurora-violet/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/10 transition-all"
          />
        </div>

        {/* Spacing fix preview */}
        {spacingResult && (
          <div className="rounded-xl border border-aurora-cyan/30 bg-aurora-cyan/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-aurora-cyan shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-aurora-cyan">Format issues detected</span>
            </div>
            <ul className="space-y-1">
              {spacingResult.issues.map((issue, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-aurora-muted">
                  <span className="h-1 w-1 rounded-full bg-aurora-cyan/60 shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
            <div className="rounded-lg bg-aurora-surface/80 p-3 text-sm leading-relaxed text-aurora-text border border-aurora-border">
              <div className="mb-1 text-xs font-medium text-aurora-muted">Fixed version:</div>
              {spacingResult.fixed}
            </div>
            <button
              onClick={() => {
                setSentence(spacingResult.fixed);
                setSpacingResult(null);
                setChecked(false);
                setMatches([]);
              }}
              className="rounded-lg bg-aurora-cyan/20 px-4 py-2 text-sm font-medium text-aurora-cyan hover:bg-aurora-cyan/30 transition-all duration-200"
            >
              Apply Fix
            </button>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCheck}
            disabled={!sentence.trim() || checking}
            className="rounded-xl border border-aurora-border bg-white/5 px-5 py-2.5 text-sm font-medium text-aurora-text hover:border-aurora-cyan/50 hover:text-aurora-cyan hover:bg-aurora-cyan/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {checking ? 'Checking...' : 'Check Grammar'}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-xl border border-aurora-emerald/30 bg-aurora-emerald/10 px-5 py-2.5 text-sm font-medium text-aurora-emerald hover:bg-aurora-emerald/20 hover:border-aurora-emerald/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={handleSaveAndStart}
            disabled={!canSave}
            className="flex-1 rounded-xl bg-gradient-to-r from-aurora-violet to-violet-600 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:glow-violet active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save & Practice
          </button>
        </div>

        {/* Grammar results */}
        {checking && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-aurora-muted">
            <div className="h-4 w-4 rounded-full border-2 border-aurora-violet/30 border-t-aurora-violet animate-spin" />
            Checking grammar...
          </div>
        )}

        {checked && !checking && (
          <div className={`rounded-xl border p-4 ${matches.length === 0 ? 'border-aurora-emerald/30 bg-aurora-emerald/5' : 'border-aurora-amber/30 bg-aurora-amber/5'}`}>
            {matches.length === 0 ? (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-aurora-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-aurora-emerald">No grammar issues found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-aurora-amber">
                  {matches.length} potential {matches.length === 1 ? 'issue' : 'issues'} found:
                </p>

                <div className="rounded-lg bg-aurora-surface/80 p-3 text-sm leading-relaxed text-aurora-text">
                  <span dangerouslySetInnerHTML={{ __html: highlightErrors(sentence, matches) }} />
                </div>

                <div className="space-y-2">
                  {matches.map((m, i) => (
                    <div key={i} className="rounded-lg bg-aurora-surface/60 p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
                          {sentence.slice(m.offset, m.offset + m.length)}
                        </span>
                        <div>
                          <p className="text-aurora-text">{m.message}</p>
                          {m.replacements.length > 0 && (
                            <p className="mt-1 text-xs text-aurora-muted">
                              Suggestion:{' '}
                              {m.replacements.slice(0, 3).map((r, j) => (
                                <span key={j}>
                                  <button
                                    onClick={() => {
                                      const before = sentence.slice(0, m.offset);
                                      const after = sentence.slice(m.offset + m.length);
                                      const fixed = before + r.value + after;
                                      setSentence(fixed);
                                      setChecked(false);
                                      setMatches([]);
                                    }}
                                    className="text-aurora-violet hover:text-aurora-violet/80 underline font-medium"
                                  >
                                    {r.value}
                                  </button>
                                  {j < Math.min(m.replacements.length, 3) - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
