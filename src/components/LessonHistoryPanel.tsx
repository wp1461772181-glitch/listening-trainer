import { useState, useEffect } from 'react';
import type { Lesson } from '../types';
import { apiGetLessonHistory, type HistoryRow } from '../lib/api';
import Badge from './ui/Badge';
import Card from './ui/Card';

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
    apiGetLessonHistory(lesson.id)
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lesson.id]);

  const bestScore = rows.length > 0 ? Math.max(...rows.map((r) => r.score)) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight">{lesson.title}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {tierLabel(lesson.difficulty)} &middot; {rows.length} attempts
        </p>
      </div>

      <button
        onClick={() => onStartPractice(lesson)}
        className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white hover:bg-primary-hover transition-all active:scale-[0.99]"
      >
        Practice This Lesson
      </button>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
          <div className="text-sm text-text-secondary">Loading...</div>
        </div>
      ) : rows.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="mb-3 flex justify-center text-text-tertiary">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">No attempts recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => {
            const scoreColor = row.score >= 80 ? 'text-success' : row.score >= 60 ? 'text-warning' : 'text-error';
            return (
              <button
                key={row.id}
                onClick={() => onViewDetail(row.id)}
                className="flex items-center gap-4 w-full text-left rounded-xl border border-border bg-surface px-4 py-3 hover:-translate-y-[1px] hover:shadow-md transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-surface text-xs font-bold text-primary shrink-0">
                  #{rows.length - i}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-text-secondary">{row.date}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className={`text-lg font-bold tabular-nums ${scoreColor}`}>
                    {row.score}%
                  </div>
                  {row.score === bestScore && rows.length > 1 && (
                    <div className="text-xs font-semibold text-success">Best</div>
                  )}
                </div>
                <svg className="h-4 w-4 text-text-tertiary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
