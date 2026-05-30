import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetPracticeRecords, type PracticeRecordEntry } from '../lib/api';
import type { Lesson } from '../types';
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

export default function HistoryPanel() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PracticeRecordEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetPracticeRecords()
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight">Practice History</h2>
          <p className="mt-1 text-sm text-text-secondary">No practice records yet.</p>
        </div>
        <Card className="py-16 text-center">
          <div className="mb-3 flex justify-center text-text-tertiary">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">Complete a lesson to see your history here.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight">Practice History</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {records.length} practice sessions completed
        </p>
      </div>

      <div className="space-y-2">
        {records.map((record, idx) => {
          const scoreColor = record.score >= 80 ? 'text-success' : record.score >= 60 ? 'text-warning' : 'text-error';
          return (
            <button
              key={record.recordId}
              onClick={() => navigate(`/history/${record.recordId}`)}
              className="flex items-center gap-4 w-full text-left rounded-xl border border-border bg-surface px-4 py-3 hover:-translate-y-[1px] hover:shadow-md hover:border-border-strong transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text truncate">
                  {record.lessonTitle}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    difficultyBadge[record.difficulty] === 'success' ? 'bg-success/10 text-success' :
                    difficultyBadge[record.difficulty] === 'warning' ? 'bg-warning/10 text-warning' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {tierLabel(record.difficulty)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {record.sentenceCount} sentences
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="text-right">
                  <div className={`text-lg font-bold tabular-nums ${scoreColor}`}>
                    {record.score}%
                  </div>
                </div>
                <div className="text-right text-xs text-text-secondary">
                  {formatDate(record.completedAt)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
