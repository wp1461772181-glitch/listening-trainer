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
        <h2 className="text-2xl font-bold text-white">Practice History</h2>
        <p className="mt-1 text-sm text-slate-400">
          {entries.length} lessons practiced, {totalAttempts} total attempts
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 py-16 text-center">
          <div className="mb-3 text-4xl">📋</div>
          <p className="text-slate-400">No practice records yet.</p>
          <p className="mt-1 text-sm text-slate-600">Complete a lesson to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(([lessonId, p]) => {
            const lesson = lessonMap.get(lessonId);
            return (
              <button
                key={lessonId}
                onClick={() => lesson && onSelectLesson(lesson)}
                disabled={!lesson}
                className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3 w-full text-left hover:bg-slate-800/50 hover:border-slate-700 transition-colors disabled:cursor-not-allowed"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {lesson?.title ?? lessonId}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {lesson && (
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${difficultyColor[lesson.difficulty] ?? 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                        {tierLabel(lesson.difficulty)}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      <span className="text-slate-600">{p.attempts} attempts</span>
                      <span className="mx-1 text-slate-700">&middot;</span>
                      Last: {p.date}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Best</div>
                    <div className={`text-lg font-bold ${
                      p.bestScore >= 80 ? 'text-emerald-400' :
                      p.bestScore >= 60 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {p.bestScore}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Latest</div>
                    <div className="text-sm font-semibold text-slate-400">
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
