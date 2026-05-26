import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ProgressMap } from '../types';
import { apiGetProgress, apiSaveProgress } from '../lib/api';
import { useAuth } from './AuthContext';

interface ProgressContextType {
  progress: ProgressMap;
  saveLesson: (lessonId: string, score: number, keywords?: string, reconstruction?: string, diffJson?: string, listenCount?: number) => void;
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

    apiGetProgress()
      .then((data) => {
        const map: ProgressMap = {};
        for (const row of data) {
          map[row.lessonId] = {
            score: row.score,
            date: row.date,
            attempts: row.attempts,
            bestScore: row.bestScore,
          };
        }
        setProgress(map);
      })
      .catch((err) => {
        console.error('Failed to load progress:', err.message);
      });
  }, [user]);

  const saveLesson = useCallback(
    (lessonId: string, score: number, keywords?: string, reconstruction?: string, diffJson?: string, listenCount?: number) => {
      if (!user) return;

      setProgress((prev) => {
        const existing = prev[lessonId];
        const upserted = {
          score,
          date: new Date().toISOString().split('T')[0],
          attempts: (existing?.attempts ?? 0) + 1,
          bestScore: Math.max(score, existing?.bestScore ?? 0),
        };

        apiSaveProgress(lessonId, score, keywords, reconstruction, diffJson, listenCount).catch((err) => {
          console.error('Failed to save progress:', err.message);
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
