export type Difficulty = 'daily' | 'campus' | 'academic';

export interface Lesson {
  id: string;
  difficulty: Difficulty;
  title: string;
  sentence: string;
  hint: string;
  audioPath: string;
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

export type View = 'home' | 'lessons' | 'player';

export interface AppState {
  view: View;
  difficulty: Difficulty | null;
  currentLesson: Lesson | null;
}
