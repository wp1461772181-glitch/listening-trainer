import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Difficulty, Lesson } from '../types';
import { getLessonsByDifficulty } from '../data/lessons';
import { useProgress } from '../context/ProgressContext';
import { fetchCustomLessons } from '../utils/customLessons';
import { deleteCustomLesson } from '../utils/customLessons';

const tierTitles: Record<Difficulty, string> = {
  daily: 'Daily Life',
  campus: 'Campus Life',
  academic: 'Academic Lectures',
};

export default function LessonsPage() {
  const { difficulty } = useParams<{ difficulty: string }>();
  const navigate = useNavigate();
  const { progress } = useProgress();
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomLessons().then(setCustomLessons).finally(() => setLoading(false));
  }, []);

  if (!difficulty || !tierTitles[difficulty as Difficulty]) {
    return <p className="text-text-secondary">Invalid difficulty.</p>;
  }

  const diff = difficulty as Difficulty;
  const builtIn = getLessonsByDifficulty(diff);
  const custom = customLessons.filter((l) => l.difficulty === diff);
  const allLessons = [...builtIn, ...custom];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-text">{tierTitles[diff]}</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      ) : allLessons.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface py-16 text-center">
          <p className="text-sm text-text-secondary">No lessons in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allLessons.map((lesson, idx) => {
            const best = progress[lesson.id]?.bestScore ?? null;
            return (
              <div
                key={lesson.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-surface text-sm font-semibold text-primary">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text flex items-center gap-2">
                    {lesson.title}
                    {lesson.id.startsWith('custom-') && (
                      <span className="rounded-full border border-primary/20 bg-primary-surface px-2 py-0.5 text-[10px] font-medium text-primary">
                        Custom
                      </span>
                    )}
                  </div>
                  {best !== null && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                      <span>Best: {best}%</span>
                      <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${best >= 80 ? 'bg-success' : best >= 50 ? 'bg-warning' : 'bg-error'}`}
                          style={{ width: `${best}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/player/${lesson.id}`)}
                    className="rounded-lg border border-border bg-bg-alt px-4 py-2 text-xs font-semibold text-text hover:border-primary/50 hover:text-primary transition-all"
                  >
                    Start
                  </button>
                  {lesson.id.startsWith('custom-') && (
                    <button
                      onClick={async () => {
                        if (confirm('Delete this custom lesson?')) {
                          await deleteCustomLesson(lesson.id);
                          setCustomLessons((prev) => prev.filter((l) => l.id !== lesson.id));
                        }
                      }}
                      className="rounded-lg border border-error/20 bg-error/5 px-2 py-2 text-xs text-error hover:border-error/40 hover:bg-error/10 transition-all"
                      title="Delete"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
