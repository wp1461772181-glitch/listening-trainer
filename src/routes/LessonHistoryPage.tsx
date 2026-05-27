import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Lesson } from '../types';
import { getLessonById } from '../data/lessons';
import { fetchCustomLessons } from '../utils/customLessons';
import LessonHistoryPanel from '../components/LessonHistoryPanel';

export default function LessonHistoryPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let found = getLessonById(lessonId!);
      if (!found) {
        const customs = await fetchCustomLessons();
        found = customs.find((l) => l.id === lessonId) ?? null;
      }
      setLesson(found);
      setLoading(false);
    })();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="rounded-xl border border-border bg-surface py-16 text-center">
        <p className="text-sm text-text-secondary">Lesson not found.</p>
        <button
          onClick={() => navigate('/history')}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all"
        >
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <LessonHistoryPanel
        lesson={lesson}
        onStartPractice={() => navigate(`/player/${lesson.id}`)}
        onViewDetail={(progressId) => navigate(`/history/detail/${progressId}`)}
      />
    </div>
  );
}
