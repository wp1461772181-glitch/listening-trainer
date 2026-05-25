import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ProgressMap } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ProgressContextType {
  progress: ProgressMap;
  saveLesson: (lessonId: string, score: number) => void;
  getBestScore: (lessonId: string) => number | null;
  totalCompleted: number;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    if (!user) {
      setProgress({});
      return;
    }

    supabase
      .from('user_progress')
      .select('lesson_id, score, attempts, best_score, date')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load progress:', error.message);
          return;
        }
        const map: ProgressMap = {};
        for (const row of data ?? []) {
          map[row.lesson_id] = {
            score: row.score,
            date: row.date,
            attempts: row.attempts,
            bestScore: row.best_score,
          };
        }
        setProgress(map);
      });
  }, [user]);

  const saveLesson = useCallback(
    (lessonId: string, score: number) => {
      if (!user) return;

      setProgress((prev) => {
        const existing = prev[lessonId];
        const upserted = {
          score,
          date: new Date().toISOString().split('T')[0],
          attempts: (existing?.attempts ?? 0) + 1,
          bestScore: Math.max(score, existing?.bestScore ?? 0),
        };

        supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            score,
            attempts: upserted.attempts,
            best_score: upserted.bestScore,
            date: upserted.date,
          })
          .then(({ error }) => {
            if (error) console.error('Failed to save progress:', error.message);
          });

        return { ...prev, [lessonId]: upserted };
      });
    },
    [user],
  );

  const getBestScore = useCallback(
    (lessonId: string) => progress[lessonId]?.bestScore ?? null,
    [progress],
  );

  const totalCompleted = Object.keys(progress).length;

  return (
    <ProgressContext.Provider value={{ progress, saveLesson, getBestScore, totalCompleted }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
