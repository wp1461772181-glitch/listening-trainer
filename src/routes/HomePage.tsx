import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import TrendChart from '../components/TrendChart';

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

  // Last practiced lessons (up to 3)
  const recentLessons = Object.entries(progress)
    .sort((a, b) => b[1].date.localeCompare(a[1].date))
    .slice(0, 3)
    .map(([lessonId, p]) => ({ lessonId, ...p }));

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
        <StatCard label="Lessons" value={totalLessons} />
        <StatCard label="Attempts" value={totalAttempts} />
        <StatCard label="Best Score" value={`${bestOverall}%`} />
        <StatCard label="Streak" value="—" />
      </div>

      {/* Recent lessons */}
      {recentLessons.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Continue Practice</h2>
          <div className="space-y-2">
            {recentLessons.map((r) => (
              <button
                key={r.lessonId}
                onClick={() => navigate(`/player/${r.lessonId}`)}
                className="flex items-center gap-4 w-full text-left rounded-xl border border-border bg-surface px-4 py-3 hover:-translate-y-[1px] hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text truncate">{r.lessonId}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums text-text">{r.bestScore}%</div>
                  <div className="text-xs text-text-secondary">{r.date}</div>
                </div>
                <div className="text-sm font-medium text-primary">Continue &rarr;</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty cards */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Lessons</h2>
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
      </div>

      {/* Trend chart */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Progress</h2>
        <TrendChart days={7} />
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
