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
  onViewDetail: (progressId: number) => void;
}

export default function LessonHistoryPanel({ lesson, onStartPractice, onViewDetail }: LessonHistoryPanelProps) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[LessonHistoryPanel] fetching history for', lesson.id);
    apiGetLessonHistory(lesson.id)
      .then((data) => { console.log('[LessonHistoryPanel] got rows:', data.length); setRows(data); })
      .catch((err) => { console.error('[LessonHistoryPanel] fetch error:', err); })
      .finally(() => setLoading(false));
  }, [lesson.id]);

  const bestScore = rows.length > 0 ? Math.max(...rows.map((r) => r.score)) : 0;

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">{lesson.title}</h2>
        <p className="mt-1 text-sm text-aurora-muted">
          {tierLabel(lesson.difficulty)} &middot; {rows.length} attempts
        </p>
      </div>

      <button
        onClick={() => onStartPractice(lesson)}
        className="w-full rounded-xl bg-gradient-to-r from-aurora-violet to-violet-600 py-3.5 font-semibold text-white transition-all duration-300 hover:glow-violet active:scale-[0.98]"
      >
        Practice This Lesson
      </button>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-aurora-violet/30 border-t-aurora-violet animate-spin" />
          <div className="text-sm text-aurora-muted">Loading...</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl glass py-16 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aurora-violet/10">
              <svg className="h-7 w-7 text-aurora-violet/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-aurora-muted">No attempts recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <button
              key={row.id}
              onClick={() => onViewDetail(row.id)}
              className="flex items-center gap-4 rounded-xl glass px-4 py-3 w-full text-left hover:bg-aurora-card/70 hover:border-aurora-border transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-aurora-violet/15 text-xs font-bold text-aurora-violet">
                  #{rows.length - i}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-aurora-muted">{row.date}</div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className={`text-lg font-bold tabular-nums ${
                  row.score >= 80 ? 'text-aurora-emerald' :
                  row.score >= 60 ? 'text-aurora-amber' :
                  'text-red-400'
                }`}>
                  {row.score}%
                </div>
                {row.score === bestScore && rows.length > 1 && (
                  <div className="text-xs font-semibold text-aurora-emerald">Best</div>
                )}
              </div>
              <svg className="h-4 w-4 text-aurora-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
