const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

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

export async function apiSaveProgress(lessonId: string, score: number): Promise<ProgressData> {
  return request<ProgressData>('/api/progress', {
    method: 'POST',
    body: JSON.stringify({ lessonId, score }),
  });
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
