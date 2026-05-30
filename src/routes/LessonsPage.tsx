import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Lesson, Difficulty } from '../types';
import { apiGetAllLessons, apiDeleteLesson } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import Badge from './ui/Badge';
import Card from './ui/Card';

const tierTitles: Record<string, string> = {
  daily: 'Daily Life',
  campus: 'Campus Life',
  academic: 'Academic Lectures',
};

const tierColors: Record<string, string> = {
  daily: 'success',
  campus: 'warning',
  academic: 'primary',
};

export default function LessonsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const activeCategory = searchParams.get('category') as Difficulty | null;

  useEffect(() => {
    apiGetAllLessons()
      .then(setLessons)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory
    ? lessons.filter(l => l.difficulty === activeCategory)
    : lessons;

  const categories = [
    { key: null, label: 'All' },
    { key: 'daily' as const, label: 'Daily Life' },
    { key: 'campus' as const, label: 'Campus Life' },
    { key: 'academic' as const, label: 'Academic Lectures' },
  ];

  async function handleDelete(id: number) {
    if (!confirm('Delete this lesson and all its audio?')) return;
    try {
      await apiDeleteLesson(id);
      setLessons(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      alert('Failed to delete lesson');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">My Lessons</h2>
        <button
          onClick={() => navigate('/lessons/new')}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-all"
        >
          + New Lesson
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2">
        {categories.map(cat => (
          <button
            key={cat.key || 'all'}
            onClick={() => {
              if (cat.key) {
                setSearchParams({ category: cat.key });
              } else {
                setSearchParams({});
              }
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === cat.key
                ? 'bg-primary text-white'
                : 'border border-border bg-surface text-text-secondary hover:border-primary/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-sm text-text-secondary">
            {activeCategory ? 'No lessons in this category.' : 'No lessons yet.'}
          </p>
          {!activeCategory && (
            <button
              onClick={() => navigate('/lessons/new')}
              className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white"
            >
              Create your first lesson
            </button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((lesson, idx) => (
            <div
              key={lesson.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-surface text-sm font-semibold text-primary">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-text flex items-center gap-2">
                  {lesson.title}
                  <StatusBadge status={lesson.status} />
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant={tierColors[lesson.difficulty] || 'primary'}>
                    {tierTitles[lesson.difficulty]}
                  </Badge>
                  <span className="text-xs text-text-secondary">
                    {lesson.sentences?.length || 0} sentences
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {lesson.status === 'ready' && (
                  <button
                    onClick={() => navigate(`/player/${lesson.id}`)}
                    className="rounded-lg border border-border bg-bg-alt px-4 py-2 text-xs font-semibold text-text hover:border-primary/50 hover:text-primary transition-all"
                  >
                    Start
                  </button>
                )}
                {lesson.status === 'drafting' && (
                  <button
                    onClick={() => navigate(`/lessons/new?id=${lesson.id}`)}
                    className="rounded-lg border border-border bg-bg-alt px-4 py-2 text-xs font-semibold text-text hover:border-primary/50 hover:text-primary transition-all"
                  >
                    Continue
                  </button>
                )}
                {lesson.status === 'failed' && (
                  <button
                    onClick={() => navigate(`/lessons/new?id=${lesson.id}`)}
                    className="rounded-lg border border-error/20 bg-error/5 px-4 py-2 text-xs font-semibold text-error hover:border-error/40 transition-all"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={() => handleDelete(lesson.id)}
                  className="rounded-lg border border-border px-2 py-2 text-xs text-text-secondary hover:text-error hover:border-error/30 transition-all"
                  title="Delete"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
