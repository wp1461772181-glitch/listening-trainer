import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGetPracticeRecords } from '../lib/api';
import TrendChart from '../components/TrendChart';
import { DifficultyBarChart, AccuracyRadarChart } from '../components/StatsCharts';

interface RecentPractice {
  recordId: number;
  lessonId: number;
  lessonTitle: string;
  difficulty: string;
  score: number;
  completedAt: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentPractices, setRecentPractices] = useState<RecentPractice[]>([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    apiGetPracticeRecords()
      .then(records => {
        setRecentPractices(records.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const totalLessons = new Set(recentPractices.map(r => r.lessonId)).size;
  const totalAttempts = recentPractices.length;
  const bestOverall = recentPractices.length > 0 ? Math.max(...recentPractices.map(r => r.score)) : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-text">
          {greeting}{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-sm text-text-secondary mt-1">Ready to practice?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Sessions" value={totalAttempts} />
        <StatCard label="Lessons" value={totalLessons} />
        <StatCard label="Best Score" value={`${bestOverall}%`} />
        <StatCard label="Streak" value="—" />
      </div>

      {/* Recent lessons */}
      {recentPractices.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Recent Practice</h2>
          <div className="space-y-2">
            {recentPractices.map((r) => (
              <button
                key={r.recordId}
                onClick={() => navigate(`/history/${r.recordId}`)}
                className="flex items-center gap-4 w-full text-left rounded-xl border border-border bg-surface px-4 py-3 hover:-translate-y-[1px] hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text truncate">{r.lessonTitle}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums text-text">{r.score}%</div>
                  <div className="text-xs text-text-secondary">{formatDate(r.completedAt)}</div>
                </div>
                <svg className="h-4 w-4 text-text-tertiary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lesson categories */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Lesson Categories</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(['daily', 'campus', 'academic'] as const).map((d) => (
            <button
              key={d}
              onClick={() => navigate(`/lessons?category=${d}`)}
              className="rounded-xl border border-border bg-surface p-5 text-left transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md hover:border-border-strong"
            >
              <div className="text-lg font-bold text-text">{tierTitle(d)}</div>
              <div className="mt-1 text-sm text-text-secondary">{tierDesc(d)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Trend chart */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Progress</h2>
        <TrendChart days={7} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DifficultyBarChart />
        <AccuracyRadarChart />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => navigate('/history')}
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text hover:bg-bg-alt transition-all"
        >
          Practice History
        </button>
        <button
          onClick={() => navigate('/lessons/new')}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-all"
        >
          + Create New Lesson
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center">
      <div className="text-2xl font-bold text-text tabular-nums">{value}</div>
      <div className="text-xs text-text-secondary mt-1">{label}</div>
    </div>
  );
}

function tierTitle(d: string) {
  return { daily: 'Daily Life', campus: 'Campus Life', academic: 'Academic Lectures' }[d] || d;
}

function tierDesc(d: string) {
  return {
    daily: 'Short everyday sentences',
    campus: 'University conversations',
    academic: 'Real lecture scenarios',
  }[d] || '';
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
