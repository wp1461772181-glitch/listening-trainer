import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { progress } = useProgress();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const totalLessons = Object.keys(progress).length;
  const totalAttempts = Object.values(progress).reduce((sum, p) => sum + p.attempts, 0);
  const bestOverall = Object.values(progress).reduce((max, p) => Math.max(max, p.bestScore), 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-text">
          {greeting}{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-sm text-text-secondary mt-1">Ready to practice?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Lessons" value={totalLessons} />
        <StatCard label="Attempts" value={totalAttempts} />
        <StatCard label="Best Score" value={`${bestOverall}%`} />
        <StatCard label="Streak" value="—" />
      </div>

      {/* Difficulty cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(['daily', 'campus', 'academic'] as const).map((d) => (
          <button
            key={d}
            onClick={() => navigate(`/lessons/${d}`)}
            className="rounded-xl border border-border bg-surface p-5 text-left transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md hover:border-border-strong"
          >
            <div className="text-lg font-bold text-text">{tierTitle(d)}</div>
            <div className="mt-1 text-sm text-text-secondary">{tierDesc(d)}</div>
          </button>
        ))}
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
          onClick={() => navigate('/custom')}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-all"
        >
          + Create Custom Lesson
        </button>
      </div>

      {/* Settings link */}
      <div className="text-center">
        <button
          onClick={() => navigate('/settings')}
          className="text-sm text-text-secondary hover:text-primary transition-colors"
        >
          Settings
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
