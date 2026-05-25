import { useState, useEffect } from 'react';
import type { Lesson } from '../types';
import { apiGetLessonHistory, type HistoryRow } from '../lib/api';

function tierLabel(d: string): string {
  switch (d) {
    case 'daily': return 'Daily Life';
    case 'campus': return 'Campus Life';
    case 'academic': return 'Academic Lecture';
    default: return d;
  }
}

interface LessonHistoryPanelProps {
  lesson: Lesson;
  onStartPractice: (lesson: Lesson) => void;
}

export default function LessonHistoryPanel({ lesson, onStartPractice }: LessonHistoryPanelProps) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetLessonHistory(lesson.id)
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lesson.id]);

  const bestScore = rows.length > 0 ? Math.max(...rows.map((r) => r.score)) : 0;

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">{lesson.title}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {tierLabel(lesson.difficulty)} &middot; {rows.length} attempts
        </p>
      </div>

      <button
        onClick={() => onStartPractice(lesson)}
        className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98]"
      >
        Practice This Lesson
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">Loading...</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 py-16 text-center">
          <p className="text-slate-400">No attempts recorded.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div
              key={row.id}
              className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                  #{rows.length - i}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-400">{row.date}</div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className={`text-lg font-bold ${
                  row.score >= 80 ? 'text-emerald-400' :
                  row.score >= 60 ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {row.score}%
                </div>
                {row.score === bestScore && rows.length > 1 && (
                  <div className="text-xs text-emerald-600">Best</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
