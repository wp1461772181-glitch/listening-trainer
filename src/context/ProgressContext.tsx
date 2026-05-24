import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ProgressMap } from '../types';

const STORAGE_KEY = 'listening-trainer-progress';

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: ProgressMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

interface ProgressContextType {
  progress: ProgressMap;
  saveLesson: (lessonId: string, score: number) => void;
  getBestScore: (lessonId: string) => number | null;
  totalCompleted: number;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);

  const saveLesson = useCallback(
    (lessonId: string, score: number) => {
      setProgress((prev) => {
        const existing = prev[lessonId];
        const next: ProgressMap = {
          ...prev,
          [lessonId]: {
            score,
            date: new Date().toISOString().split('T')[0],
            attempts: (existing?.attempts ?? 0) + 1,
            bestScore: Math.max(score, existing?.bestScore ?? 0),
          },
        };
        saveProgress(next);
        return next;
      });
    },
    [],
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
