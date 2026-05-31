import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Difficulty } from '../types';
import { apiCreateLesson, apiUpdateLessonSentences, apiGenerateAudio, apiGetLesson } from '../lib/api';
import SentenceEditor from '../components/SentenceEditor';
import Card from './ui/Card';

export default function LessonCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [step, setStep] = useState<'upload' | 'edit' | 'generating' | 'done'>('upload');

  // Upload form
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('daily');
  const [hint, setHint] = useState('');
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<'male' | 'female'>('male');
  const [mode, setMode] = useState<'dialogue' | 'paragraph'>('dialogue');

  // Edit state
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [sentences, setSentences] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editId) {
      apiGetLesson(Number(editId))
        .then(lesson => {
          setLessonId(lesson.id);
          setTitle(lesson.title);
          setDifficulty(lesson.difficulty);
          setHint(lesson.hint);
          setSentences(lesson.sentences);
          setStep('edit');
        })
        .catch(() => {});
    }
  }, [editId]);

  async function handleUpload() {
    if (!title.trim() || !text.trim()) return;

    setError('');
    try {
      const lesson = await apiCreateLesson({ title, difficulty, hint, text, voice, mode });
      setLessonId(lesson.id);
      setSentences(lesson.sentences);
      setStep('edit');
    } catch (e) {
      setError('Failed to create lesson: ' + (e as Error).message);
    }
  }

  async function handleSaveSentences(edits: { index: number; text: string; blanksJson: any[] }[]) {
    if (!lessonId) return;

    setError('');
    try {
      setStep('generating');
      await apiUpdateLessonSentences(lessonId, edits);
      await apiGenerateAudio(lessonId);
      setStep('done');
    } catch (e) {
      setError('Failed to generate audio: ' + (e as Error).message);
      setStep('edit');
    }
  }

  if (step === 'upload') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <button
          onClick={() => navigate('/lessons')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          &larr; Back to Lessons
        </button>
        <h2 className="text-2xl font-bold text-text">Create New Lesson</h2>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/5 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <Card className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Climate Change Overview"
              className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:border-primary/50 focus:outline-none"
            >
              <option value="daily">Daily Life</option>
              <option value="campus">Campus Life</option>
              <option value="academic">Academic Lectures</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Hint (optional)</label>
            <input
              value={hint}
              onChange={e => setHint(e.target.value)}
              placeholder="e.g., A lecture about climate change"
              className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Voice</label>
            <select
              value={voice}
              onChange={e => setVoice(e.target.value as 'male' | 'female')}
              className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:border-primary/50 focus:outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {mode === 'dialogue' && (
              <p className="mt-1 text-xs text-text-tertiary">
                Voices will auto-alternate between speakers in dialogue mode.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Mode</label>
            <div className="flex gap-3">
              <button
                onClick={() => setMode('dialogue')}
                className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-all ${
                  mode === 'dialogue'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-bg text-text-secondary hover:border-primary/30'
                }`}
              >
                <div className="text-base">💬 Dialogue</div>
                <div className="mt-1 text-xs font-normal text-text-tertiary">
                  Auto-detects speakers from "Name:" labels
                </div>
              </button>
              <button
                onClick={() => setMode('paragraph')}
                className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-all ${
                  mode === 'paragraph'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-bg text-text-secondary hover:border-primary/30'
                }`}
              >
                <div className="text-base">📄 Long Paragraph</div>
                <div className="mt-1 text-xs font-normal text-text-tertiary">
                  IELTS-style single-voice passage
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Text</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              placeholder="Paste your English text here. It will be split into sentences automatically."
              className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:border-primary/50 focus:outline-none resize-y"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!title.trim() || !text.trim()}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Upload &amp; Split Sentences
          </button>
        </Card>
      </div>
    );
  }

  if (step === 'edit') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <button
          onClick={() => navigate('/lessons')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          &larr; Back to Lessons
        </button>
        <h2 className="text-2xl font-bold text-text">Review Sentences: {title}</h2>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/5 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <Card className="p-6">
          <SentenceEditor sentences={sentences} onChange={handleSaveSentences} lessonId={lessonId ?? undefined} />
        </Card>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <div className="h-10 w-10 rounded-full border-2 border-border border-t-primary animate-spin" />
        <p className="mt-4 text-sm text-text-secondary">Generating audio for each sentence...</p>
        <p className="mt-1 text-xs text-text-tertiary">This may take a minute.</p>
      </div>
    );
  }

  // step === 'done'
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-center py-20">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text">Lesson Ready!</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Your lesson "{title}" has been created and audio has been generated.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate(`/player/${lessonId}`)}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-all"
            >
              Start Practice
            </button>
            <button
              onClick={() => navigate('/lessons')}
              className="rounded-xl border border-border bg-bg px-6 py-2.5 text-sm font-semibold text-text hover:border-primary/50 hover:text-primary transition-all"
            >
              Back to Lessons
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
