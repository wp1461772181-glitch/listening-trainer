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
          className="rounded-lg p-1.5 text-aurora-muted hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-white tracking-tight">{tierTitle(difficulty)}</h2>
      </div>
      <div className="space-y-3">
        {lessons.map((lesson, idx) => {
          const best = getBestScore(lesson.id);
          return (
            <div
              key={lesson.id}
              className="rounded-xl glass p-4 transition-all duration-300 hover:bg-aurora-card/70 hover:border-aurora-border hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aurora-violet/15 text-sm font-semibold text-aurora-violet">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white flex items-center gap-2">
                    {lesson.title}
                    {lesson.id.startsWith('custom-') && (
                      <span className="rounded-full border border-aurora-violet/30 bg-aurora-violet/10 px-2 py-0.5 text-[10px] font-medium text-aurora-violet">
                        Custom
                      </span>
                    )}
                  </div>
                  {best !== null && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-aurora-muted">
                      <span>Best: {best}%</span>
                      <div className="h-1.5 w-16 rounded-full bg-aurora-border/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${best >= 80 ? 'bg-aurora-emerald' : best >= 50 ? 'bg-aurora-amber' : 'bg-red-400'}`}
                          style={{ width: `${best}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onSelect(lesson)}
                    className="rounded-lg border border-aurora-border bg-white/5 px-4 py-2 text-xs font-semibold text-aurora-text hover:border-aurora-violet/50 hover:text-aurora-violet hover:bg-aurora-violet/10 transition-all duration-200"
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
                      className="rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-2 text-xs text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all duration-200"
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
      {lessons.length === 0 && (
        <div className="rounded-2xl glass py-16 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aurora-violet/10">
              <svg className="h-7 w-7 text-aurora-violet/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-aurora-muted">No lessons available in this category yet.</p>
        </div>
      )}
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
