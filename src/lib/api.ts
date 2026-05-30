const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

let token: string | null = localStorage.getItem('auth_token');

export function getToken(): string | null {
  return token;
}

export function setToken(t: string | null) {
  token = t;
  if (t) {
    localStorage.setItem('auth_token', t);
  } else {
    localStorage.removeItem('auth_token');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path}`;
  console.log('[api] fetching:', url, 'method:', options.method || 'GET');
  const res = await fetch(url, { ...options, headers });
  console.log('[api] response:', url, res.status, res.ok);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth API
export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  token: string;
  email: string;
}

export async function apiRegister(email: string, password: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(res.token);
  return res;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(res.token);
  return res;
}

export async function apiGetMe(): Promise<{ email: string }> {
  return request<{ email: string }>('/api/auth/me');
}

// Progress API
export interface ProgressData {
  lessonId: string;
  score: number;
  attempts: number;
  bestScore: number;
  date: string;
}

export async function apiGetProgress(): Promise<ProgressData[]> {
  return request<ProgressData[]>('/api/progress');
}

export async function apiSaveProgress(
  lessonId: string,
  score: number,
  keywords?: string,
  reconstruction?: string,
  diffJson?: string,
  listenCount?: number
): Promise<ProgressData> {
  return request<ProgressData>('/api/progress', {
    method: 'POST',
    body: JSON.stringify({ lessonId, score, keywords, reconstruction, diffJson, listenCount }),
  });
}

// Progress History API
export interface HistoryRow {
  id: number;
  lessonId: string;
  score: number;
  date: string;
}

export async function apiGetHistory(): Promise<HistoryRow[]> {
  return request<HistoryRow[]>('/api/progress/history');
}

export async function apiGetLessonHistory(lessonId: string): Promise<HistoryRow[]> {
  return request<HistoryRow[]>(`/api/progress/${encodeURIComponent(lessonId)}/history`);
}

// Practice Detail API
export interface PracticeDetail {
  id: number;
  progressId: number;
  lessonId: string;
  keywords: string | null;
  reconstruction: string | null;
  diffJson: string | null;
  listenCount: number;
  score: number;
  createdAt: string;
}

export async function apiGetProgressDetail(progressId: number): Promise<PracticeDetail> {
  return request<PracticeDetail>(`/api/progress/detail/${progressId}`);
}

// Lessons API
export interface LessonData {
  id: string;
  difficulty: string;
  title: string;
  sentence: string;
  hint: string;
  audioPath: string;
}

export async function apiGetLessons(): Promise<LessonData[]> {
  return request<LessonData[]>('/api/lessons');
}

// Custom Lessons API
export interface CustomLessonData {
  lessonKey: string;
  title: string;
  difficulty: string;
  hint: string;
  sentence: string;
  voice: string;
}

export async function apiGetCustomLessons(): Promise<CustomLessonData[]> {
  return request<CustomLessonData[]>('/api/custom-lessons');
}

export async function apiCreateCustomLesson(data: {
  title: string;
  difficulty: string;
  hint?: string;
  sentence: string;
  voice?: string;
}): Promise<CustomLessonData> {
  return request<CustomLessonData>('/api/custom-lessons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteCustomLesson(lessonKey: string): Promise<void> {
  return request<void>(`/api/custom-lessons/${lessonKey}`, {
    method: 'DELETE',
  });
}

export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  await request<void>('/api/users/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ===== Lesson Management API =====

import type { Lesson, ReviewDetail, LessonStatus } from '../types';

export async function apiCreateLesson(data: {
  title: string;
  difficulty: string;
  hint?: string;
  text: string;
  voice?: string;
}): Promise<Lesson> {
  return request<Lesson>('/api/lessons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateLessonSentences(
  lessonId: number,
  sentences: { index: number; text: string; blanksJson: any[] }[]
): Promise<Lesson> {
  return request<Lesson>(`/api/lessons/${lessonId}/sentences`, {
    method: 'PUT',
    body: JSON.stringify(sentences),
  });
}

export async function apiGenerateAudio(lessonId: number): Promise<Lesson> {
  return request<Lesson>(`/api/lessons/${lessonId}/generate`, {
    method: 'POST',
  });
}

export async function apiGetAllLessons(): Promise<Lesson[]> {
  return request<Lesson[]>('/api/lessons');
}

export async function apiGetLesson(lessonId: number): Promise<Lesson> {
  return request<Lesson>(`/api/lessons/${lessonId}`);
}

export async function apiDeleteLesson(lessonId: number): Promise<void> {
  return request<void>(`/api/lessons/${lessonId}`, {
    method: 'DELETE',
  });
}

// ===== Practice API =====

export interface SentencePracticeInfo {
  sentenceId: number;
  index: number;
  totalSentences: number;
  audioPath: string;
  sentenceText: string;
  blanks: { word: string; position: number; length: number }[];
}

export async function apiGetSentence(lessonId: number, sentenceIdx: number): Promise<SentencePracticeInfo> {
  return request<SentencePracticeInfo>(`/api/lessons/${lessonId}/practice?sentenceIdx=${sentenceIdx}`);
}

export async function apiSubmitSentenceAnswer(
  lessonId: number,
  data: { sentenceId: number; userAnswer: string }
): Promise<{ sentenceId: number; score: number; blanks: { word: string; correct: boolean; userAnswer: string }[] }> {
  return request(`/api/lessons/${lessonId}/practice/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiCompletePractice(
  lessonId: number,
  answers: { sentenceId: number; sentenceText: string; userAnswer: string; score: number; blanks: any[] }[]
): Promise<{ recordId: number; score: number }> {
  return request(`/api/lessons/${lessonId}/practice/complete`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

// ===== Review API =====

export async function apiGetReviewDetail(recordId: number): Promise<ReviewDetail> {
  return request<ReviewDetail>(`/api/progress/detail/${recordId}`);
}

