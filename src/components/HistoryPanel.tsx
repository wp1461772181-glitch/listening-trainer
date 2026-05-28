import { useState, useEffect } from 'react';
import type { Lesson } from '../types';
import { lessons as builtInLessons } from '../data/lessons';
import { fetchCustomLessons } from '../utils/customLessons';
import { apiGetAllLessons } from '../lib/api';
import { useProgress } from '../context/ProgressContext';
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

const difficultyBadge: Record<string, string> = {
  daily: 'success',
  campus: 'warning',
  academic: 'primary',
} as const;

interface HistoryPanelProps {
  onSelectLesson: (lesson: Lesson) => void;
}

export default function HistoryPanel({ onSelectLesson }: HistoryPanelProps) {
  const { progress } = useProgress();
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [backendLessons, setBackendLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    fetchCustomLessons().then(setCustomLessons).catch(() => {});
    apiGetAllLessons().then(setBackendLessons).catch(() => {});
  }, []);

  const lessonMap = new Map<string, Lesson>();
  for (const l of builtInLessons) lessonMap.set(l.id, l);
  for (const l of customLessons) lessonMap.set(l.id, l);
  for (const l of backendLessons) lessonMap.set(String(l.id), l);

  const entries = Object.entries(progress).sort((a, b) => b[1].date.localeCompare(a[1].date));
  const totalAttempts = entries.reduce((sum, [, p]) => sum + p.attempts, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight">Practice History</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {entries.length} lessons practiced, {totalAttempts} total attempts
        </p>
      </div>

      {entries.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="mb-3 flex justify-center text-text-tertiary">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">No practice records yet.</p>
          <p className="mt-1 text-xs text-text-tertiary">Complete a lesson to see your history here.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map(([lessonId, p], idx) => {
            const lesson = lessonMap.get(lessonId);
            const scoreColor = p.bestScore >= 80 ? 'text-success' : p.bestScore >= 60 ? 'text-warning' : 'text-error';
            return (
              <button
                key={lessonId}
                onClick={() => lesson && onSelectLesson(lesson)}
                disabled={!lesson}
                className="flex items-center gap-4 w-full text-left rounded-xl border border-border bg-surface px-4 py-3 hover:-translate-y-[1px] hover:shadow-md hover:border-border-strong transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text truncate">
                    {lesson?.title ?? lessonId}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {lesson && (
                      <Badge variant={difficultyBadge[lesson.difficulty] as 'success' | 'warning' | 'primary'}>
                        {tierLabel(lesson.difficulty)}
                      </Badge>
                    )}
                    <span className="text-xs text-text-secondary">
                      {p.attempts} attempts
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-text-secondary">Best</div>
                    <div className={`text-lg font-bold tabular-nums ${scoreColor}`}>
                      {p.bestScore}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-secondary">Latest</div>
                    <div className="text-sm font-semibold text-text tabular-nums">
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
