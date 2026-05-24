import type { Lesson, Difficulty } from '../types';
import { useProgress } from '../context/ProgressContext';

interface LessonListProps {
  difficulty: Difficulty;
  lessons: Lesson[];
  onSelect: (lesson: Lesson) => void;
  onBack: () => void;
}

export default function LessonList({ difficulty, lessons, onSelect, onBack }: LessonListProps) {
  const { getBestScore } = useProgress();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-white">{tierTitle(difficulty)}</h2>
      </div>
      <div className="space-y-3">
        {lessons.map((lesson, idx) => {
          const best = getBestScore(lesson.id);
          return (
            <button
              key={lesson.id}
              onClick={() => onSelect(lesson)}
              className="flex w-full items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left transition-all hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-slate-300">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white">{lesson.title}</div>
                {best !== null && (
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <span>Best score: {best}%</span>
                    <span className="text-emerald-500">
                      {best >= 80 ? '✓' : best >= 50 ? '○' : ''}
                    </span>
                  </div>
                )}
              </div>
              <svg
                className="h-5 w-5 shrink-0 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function tierTitle(d: Difficulty): string {
  switch (d) {
    case 'daily': return 'Daily Life';
    case 'campus': return 'Campus Life';
    case 'academic': return 'Academic Lectures';
  }
}
