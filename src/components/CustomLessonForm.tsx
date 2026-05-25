import { useState, useCallback } from 'react';
import type { Difficulty, Lesson } from '../types';
import { checkGrammar, highlightErrors, type GrammarMatch } from '../utils/grammar';
import { saveCustomLesson } from '../utils/customLessons';

interface Props {
  onBack: () => void;
  onStart: (lesson: Lesson) => void;
}

export default function CustomLessonForm({ onBack, onStart }: Props) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('academic');
  const [hint, setHint] = useState('');
  const [sentence, setSentence] = useState('');
  const [voice, setVoice] = useState<'male' | 'female'>('female');
  const [matches, setMatches] = useState<GrammarMatch[]>([]);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saved, setSaved] = useState(false);

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
    const lesson = buildLesson();
    const result = await saveCustomLesson(lesson);
    if (result) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [buildLesson]);

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
          className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-white">Create Custom Lesson</h2>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., My Biology Notes"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-violet-500 focus:outline-none"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Difficulty</label>
          <div className="flex gap-2">
            {([
              ['daily', 'Daily'],
              ['campus', 'Campus'],
              ['academic', 'Academic'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDifficulty(val)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  difficulty === val
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">TTS Voice</label>
          <div className="flex gap-2">
            <button
              onClick={() => setVoice('female')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                voice === 'female'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Female
            </button>
            <button
              onClick={() => setVoice('male')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                voice === 'male'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Male
            </button>
          </div>
        </div>

        {/* Hint */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Context / Hint</label>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g., Biology lecture about cell structure"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-violet-500 focus:outline-none"
          />
        </div>

        {/* Sentence */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Sentence <span className="text-slate-500">(the text you'll hear and reconstruct)</span>
          </label>
          <textarea
            value={sentence}
            onChange={(e) => {
              setSentence(e.target.value);
              setChecked(false);
              setMatches([]);
            }}
            placeholder="Enter the full sentence or paragraph you want to practice with..."
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm leading-relaxed text-slate-200 placeholder-slate-600 focus:border-violet-500 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCheck}
            disabled={!sentence.trim() || checking}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {checking ? 'Checking...' : 'Check Grammar'}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 px-5 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-900/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={handleSaveAndStart}
            disabled={!canSave}
            className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save & Practice
          </button>
        </div>

        {/* Grammar results */}
        {checking && (
          <div className="text-center text-sm text-slate-500">Checking grammar...</div>
        )}

        {checked && !checking && (
          <div className={`rounded-xl border p-4 ${matches.length === 0 ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-amber-700/50 bg-amber-900/10'}`}>
            {matches.length === 0 ? (
              <p className="text-sm text-emerald-400">No grammar issues found.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-amber-400">
                  {matches.length} potential {matches.length === 1 ? 'issue' : 'issues'} found:
                </p>

                <div className="rounded-lg bg-slate-950/50 p-3 text-sm leading-relaxed text-slate-200">
                  <span dangerouslySetInnerHTML={{ __html: highlightErrors(sentence, matches) }} />
                </div>

                <div className="space-y-2">
                  {matches.map((m, i) => (
                    <div key={i} className="rounded-lg bg-slate-950/30 p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded bg-red-600/20 px-1.5 py-0.5 text-xs text-red-400">
                          {sentence.slice(m.offset, m.offset + m.length)}
                        </span>
                        <div>
                          <p className="text-slate-300">{m.message}</p>
                          {m.replacements.length > 0 && (
                            <p className="mt-1 text-xs text-slate-500">
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
                                    className="text-violet-400 hover:text-violet-300 underline"
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
