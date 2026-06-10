export type Difficulty = 'daily' | 'campus' | 'academic';
export type LessonStatus = 'drafting' | 'generating' | 'ready' | 'failed';
export type WordBankCategory = 'blacklist' | 'core' | 'pos_default';

export interface ClozeBlank {
  word: string;
  position: number;
  length: number;
}

export interface LessonSentence {
  id: number;
  index: number;
  text: string;
  audioPath: string;
  voice: 'male' | 'female';
  blanks: ClozeBlank[];
}

export interface Lesson {
  id: number;
  title: string;
  difficulty: Difficulty;
  hint: string;
  status: LessonStatus;
  createdAt?: string;
  sentences: LessonSentence[];
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

export interface PracticeRecord {
  id: number;
  lessonId: number;
  lessonTitle: string;
  score: number;
  listenCount: number;
  completedAt: string;
}

export interface ReviewSentenceDetail {
  sentenceId: number;
  sentenceText: string;
  audioPath: string;
  userAnswer: string;
  blanks: { word: string; correct: boolean; userAnswer: string }[];
}

export interface ReviewDetail {
  recordId: number;
  lessonId: number;
  lessonTitle: string;
  score: number;
  listenCount: number;
  completedAt: string;
  sentences: ReviewSentenceDetail[];
}

export interface WordBankEntry {
  id: number;
  word: string;
  category: WordBankCategory | string;
  posTag: string | null;
  baseScore: number;
  notes: string | null;
  createdAt: string;
}

export interface WordBankStats {
  blacklist: number;
  core: number;
  pos_default: number;
  total: number;
}
