import { useState, useEffect } from 'react';
import type { Lesson } from '../types';
import { lessons as builtInLessons } from '../data/lessons';
import { fetchCustomLessons } from '../utils/customLessons';
import { useProgress } from '../context/ProgressContext';

function tierLabel(d: string): string {
  switch (d) {
    case 'daily': return 'Daily Life';
    case 'campus': return 'Campus Life';
    case 'academic': return 'Academic Lecture';
    default: return d;
  }
}

const difficultyColor: Record<string, string> = {
  daily: 'border-emerald-700/50 bg-emerald-900/30 text-emerald-400',
  campus: 'border-amber-700/50 bg-amber-900/30 text-amber-400',
  academic: 'border-violet-700/50 bg-violet-900/30 text-violet-400',
};

interface HistoryPanelProps {
  onSelectLesson: (lesson: Lesson) => void;
}

export default function HistoryPanel({ onSelectLesson }: HistoryPanelProps) {
  const { progress } = useProgress();
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    fetchCustomLessons().then(setCustomLessons).catch(() => {});
  }, []);

  const lessonMap = new Map<string, Lesson>();
  for (const l of builtInLessons) lessonMap.set(l.id, l);
  for (const l of customLessons) lessonMap.set(l.id, l);

  const entries = Object.entries(progress).sort((a, b) => b[1].date.localeCompare(a[1].date));

  const totalAttempts = entries.reduce((sum, [, p]) => sum + p.attempts, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Practice History</h2>
        <p className="mt-1 text-sm text-aurora-muted">
          {entries.length} lessons practiced, {totalAttempts} total attempts
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl glass py-16 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aurora-violet/10">
              <svg className="h-7 w-7 text-aurora-violet/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-aurora-muted">No practice records yet.</p>
          <p className="mt-1 text-xs text-aurora-muted/70">Complete a lesson to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(([lessonId, p], idx) => {
            const lesson = lessonMap.get(lessonId);
            return (
              <button
                key={lessonId}
                onClick={() => lesson && onSelectLesson(lesson)}
                disabled={!lesson}
                className={`flex items-center gap-4 rounded-xl glass px-4 py-3 w-full text-left hover:bg-aurora-card/70 hover:border-aurora-border transition-all duration-200 disabled:cursor-not-allowed animate-fade-in-up`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {lesson?.title ?? lessonId}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {lesson && (
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${difficultyColor[lesson.difficulty] ?? 'border-aurora-border bg-aurora-border/30 text-aurora-muted'}`}>
                        {tierLabel(lesson.difficulty)}
                      </span>
                    )}
                    <span className="text-xs text-aurora-muted">
                      <span>{p.attempts} attempts</span>
                      <span className="mx-1 text-aurora-border">&middot;</span>
                      Last: {p.date}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-aurora-muted">Best</div>
                    <div className={`text-lg font-bold tabular-nums ${
                      p.bestScore >= 80 ? 'text-aurora-emerald' :
                      p.bestScore >= 60 ? 'text-aurora-amber' :
                      'text-red-400'
                    }`}>
                      {p.bestScore}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-aurora-muted">Latest</div>
                    <div className="text-sm font-semibold text-aurora-text tabular-nums">
                      {p.score}%
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
