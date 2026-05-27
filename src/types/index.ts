export type Difficulty = 'daily' | 'campus' | 'academic';

export interface Lesson {
  id: string;
  difficulty: Difficulty;
  title: string;
  sentence: string;
  hint: string;
  audioPath?: string;
  voice?: 'male' | 'female';
}

export interface LessonProgress {
  score: number;
  date: string;
  attempts: number;
  bestScore: number;
}

export interface ProgressMap {
  [lessonId: string]: LessonProgress;
}
