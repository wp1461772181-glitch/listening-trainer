import type { Lesson, Difficulty } from '../types';
import { useProgress } from '../context/ProgressContext';
import { deleteCustomLesson } from '../utils/customLessons';

interface LessonListProps {
  difficulty: Difficulty;
  lessons: Lesson[];
  onSelect: (lesson: Lesson) => void;
  onBack: () => void;
  onDeleteLesson?: () => void;
}

export default function LessonList({ difficulty, lessons, onSelect, onBack, onDeleteLesson }: LessonListProps) {
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
            <div
              key={lesson.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-slate-300">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white flex items-center gap-2">
                    {lesson.title}
                    {lesson.id.startsWith('custom-') && (
                      <span className="rounded-full border border-violet-700/50 bg-violet-900/30 px-2 py-0.5 text-[10px] text-violet-400">
                        Custom
                      </span>
                    )}
                  </div>
                  {best !== null && (
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span>Best score: {best}%</span>
                      <span className="text-emerald-500">
                        {best >= 80 ? '✓' : best >= 50 ? '○' : ''}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onSelect(lesson)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-violet-600 hover:text-violet-400 transition-all"
                  >
                    Start
                  </button>
                  {lesson.id.startsWith('custom-') && (
                    <button
                      onClick={async () => {
                        if (confirm('Delete this custom lesson?')) {
                          await deleteCustomLesson(lesson.id);
                          onDeleteLesson?.();
                        }
                      }}
                      className="rounded-lg border border-red-800/50 px-2 py-2 text-xs text-red-500 hover:border-red-600 hover:text-red-400 transition-all"
                      title="Delete"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
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
