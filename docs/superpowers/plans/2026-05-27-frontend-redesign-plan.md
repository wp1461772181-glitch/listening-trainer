# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete frontend overhaul — modern minimalist UI, react-router v6, Dashboard, immersive player, history charts, settings page, responsive design.

**Architecture:** 7 progressive phases. Each phase produces a buildable app. Phase 1-2 are the foundation (design system + routing), Phase 3-7 rebuild pages one-by-one using existing contexts (AuthContext, ProgressContext) and API layer (api.ts).

**Tech Stack:** React 18, TypeScript, Vite 5, TailwindCSS v4, react-router-dom v6, framer-motion v11, Chart.js v4

---

## Phase 0: Install Dependencies

### Task 1: Install new packages

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1: Install dependencies**

Run in `D:\listening-trainer`:
```bash
npm install react-router-dom@^6 framer-motion@^11
npm install -D chart.js@^4 react-chartjs-2@^5
```

- [ ] **Step 2: Verify install**

```bash
npm ls react-router-dom framer-motion chart.js react-chartjs-2
```
Expected: all present with correct versions.

- [ ] **Step 3: Verify build still works**

```bash
npx vite build
```
Expected: successful build to `dist/`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-router, framer-motion, chart.js dependencies"
```

---

## Phase 1: Design System Foundation

### File Map for Phase 1

| Action | File | Responsibility |
|--------|------|----------------|
| Rewrite | `src/index.css` | New design tokens, remove Aurora theme |
| Create | `src/components/ui/Button.tsx` | Button primitive with variants |
| Create | `src/components/ui/Card.tsx` | Card primitive |
| Create | `src/components/ui/Badge.tsx` | Badge/tag primitive |
| Create | `src/components/ui/Skeleton.tsx` | Loading placeholder |
| Create | `src/components/ui/EmptyState.tsx` | Empty state with icon |
| Modify | `src/App.tsx` | Test: use new design tokens on existing auth page |

### Task 2: Rewrite `index.css` with new design system

**Files:**
- Modify: `src/index.css` (complete rewrite)

- [ ] **Step 1: Rewrite `src/index.css`**

Replace the entire file content with:

```css
@import "tailwindcss";

@theme {
  --color-bg: #FAFAFA;
  --color-bg-alt: #F5F5F5;
  --color-surface: #FFFFFF;
  --color-surface-hover: #F9FAFB;
  --color-border: #E5E7EB;
  --color-border-strong: #D1D5DB;
  --color-text: #111827;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  --color-primary: #4F46E5;
  --color-primary-hover: #4338CA;
  --color-primary-surface: #EEF2FF;
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
}

/* ── Base ─────────────────────────────────────────────── */

* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}

::selection {
  background: rgba(79, 70, 229, 0.2);
  color: var(--color-text);
}

:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ── Animations ───────────────────────────────────────── */

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out both;
}

.animate-fade-in-up {
  animation: fade-in-up 0.4s ease-out both;
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out both;
}

/* ── Stagger children ─────────────────────────────────── */

.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
```

- [ ] **Step 2: Verify build**

```bash
npx vite build
```
Expected: build succeeds. Visual appearance will change dramatically — that's expected.

### Task 3: Create UI primitive components

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Skeleton.tsx`
- Create: `src/components/ui/EmptyState.tsx`

- [ ] **Step 1: Create `src/components/ui/Button.tsx`**

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover disabled:bg-primary/40',
    secondary: 'border border-border bg-surface text-text hover:bg-bg-alt',
    ghost: 'text-text-secondary hover:text-text hover:bg-bg-alt',
    danger: 'bg-error/10 text-error border border-error/20 hover:bg-error/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Card.tsx`**

```tsx
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export default function Card({
  children,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  const base = 'bg-surface rounded-xl border border-border';
  const hover = interactive
    ? 'transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md hover:border-border-strong cursor-pointer'
    : '';

  return (
    <div className={`${base} ${hover} ${className}`} {...props}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/Badge.tsx`**

```tsx
import type { HTMLAttributes, ReactNode } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary';
  children: ReactNode;
}

export default function Badge({
  variant = 'default',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-bg-alt text-text-secondary border-border',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    primary: 'bg-primary-surface text-primary border-primary/20',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Create `src/components/ui/Skeleton.tsx`**

```tsx
import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

export default function Skeleton({
  width = 'w-full',
  height = 'h-4',
  className = '',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`${width} ${height} rounded-lg bg-border animate-pulse ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 5: Create `src/components/ui/EmptyState.tsx`**

```tsx
import type { ReactNode } from 'react';
import Card from './Card';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="py-16 text-center">
      <div className="mb-4 flex justify-center text-text-tertiary">
        {icon}
      </div>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-text-tertiary">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
npx vite build
```
Expected: successful build.

- [ ] **Step 7: Commit**

```bash
git add src/index.css src/components/ui/
git commit -m "feat(phase-1): new design system tokens and UI primitives"
```

### Task 4: Add `formatDate` utility

**Files:**
- Create: `src/utils/formatDate.ts`

- [ ] **Step 1: Create `src/utils/formatDate.ts`**

```tsx
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return formatDate(dateStr);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/formatDate.ts
git commit -m "feat(phase-1): add date formatting utilities"
```

---

## Phase 2: Routing + RootLayout

### File Map for Phase 2

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/router.tsx` | Router config with route tree |
| Create | `src/routes/RootLayout.tsx` | Shared header, nav, outlet |
| Create | `src/routes/AuthPage.tsx` | Wraps existing AuthForm |
| Create | `src/routes/HomePage.tsx` | Placeholder: redirects to lessons for now |
| Create | `src/routes/LessonsPage.tsx` | Wraps existing LessonList |
| Create | `src/routes/PlayerPage.tsx` | Wraps existing Player |
| Create | `src/routes/CustomLessonPage.tsx` | Wraps existing CustomLessonForm |
| Create | `src/routes/HistoryPage.tsx` | Wraps existing HistoryPanel |
| Create | `src/routes/LessonHistoryPage.tsx` | Wraps existing LessonHistoryPanel |
| Create | `src/routes/HistoryDetailPage.tsx` | Wraps existing HistoryDetailPanel |
| Rewrite | `src/App.tsx` | BrowserRouter + Routes + Auth guard |
| Modify | `src/main.tsx` | Remove StrictMode wrapper (keeps clean) |
| Delete | `src/lib/supabase.ts` | Old, unused |

### Task 5: Create route wrapper pages

**Files:** All `src/routes/*.tsx` files + `src/lib/router.tsx`

- [ ] **Step 1: Create `src/routes/` directory and route wrappers**

Create `src/routes/RootLayout.tsx`:

```tsx
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RootLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => navigate('/')}
            className="text-lg font-bold text-text hover:text-primary transition-colors"
          >
            Listening Trainer
          </button>

          {user && (
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-text-secondary sm:inline">{user.email}</span>
              <button
                onClick={signOut}
                className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
```

Create `src/routes/AuthPage.tsx`:

```tsx
import AuthForm from '../components/AuthForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-text">
            Listening Trainer
          </h1>
          <p className="mt-2 text-lg font-light text-text-secondary">
            Academic Listening Practice
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
```

Create `src/routes/HomePage.tsx` (placeholder — Phase 3 will build full Dashboard):

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to lessons for now — Dashboard built in Phase 3
    navigate('/lessons');
  }, [navigate]);

  return null;
}
```

Create `src/routes/LessonsPage.tsx`:

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getLessonsByDifficulty } from '../data/lessons';
import { fetchCustomLessons } from '../utils/customLessons';
import type { Lesson, Difficulty } from '../types';
import LessonList from '../components/LessonList';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const tierTitle = (d: Difficulty) => {
  switch (d) {
    case 'daily': return 'Daily Life';
    case 'campus': return 'Campus Life';
    case 'academic': return 'Academic Lectures';
  }
};

export default function LessonsPage() {
  const { difficulty } = useParams<{ difficulty: string }>();
  const navigate = useNavigate();
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    fetchCustomLessons().then(setCustomLessons);
  }, []);

  if (!difficulty || !['daily', 'campus', 'academic'].includes(difficulty)) {
    return (
      <div>
        <button onClick={() => navigate('/')} className="mb-4 text-sm text-text-secondary hover:text-primary transition-colors">
          &larr; Back to Home
        </button>
        <Card className="py-12 text-center">
          <p className="text-text-secondary">Invalid difficulty.</p>
        </Card>
      </div>
    );
  }

  const d = difficulty as Difficulty;
  const builtIn = getLessonsByDifficulty(d);
  const custom = customLessons.filter((l) => l.difficulty === d);
  const all = [...builtIn, ...custom];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-text tracking-tight">{tierTitle(d)}</h2>
        <Badge variant="primary">{all.length} lessons</Badge>
      </div>

      <LessonList
        difficulty={d}
        lessons={all}
        onSelect={(lesson) => navigate(`/player/${lesson.id}`)}
        onBack={() => navigate('/')}
        onDeleteLesson={() => fetchCustomLessons().then(setCustomLessons)}
      />
    </div>
  );
}
```

Create `src/routes/PlayerPage.tsx`:

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById } from '../data/lessons';
import { fetchCustomLessons } from '../utils/customLessons';
import { useState, useEffect } from 'react';
import type { Lesson } from '../types';
import Player from '../components/Player';
import Card from '../components/ui/Card';

export default function PlayerPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let found = getLessonById(lessonId!);
      if (!found) {
        const customs = await fetchCustomLessons();
        found = customs.find((l) => l.id === lessonId);
      }
      setLesson(found ?? null);
      setLoading(false);
    };
    load();
  }, [lessonId]);

  if (loading) {
    return <div className="py-20 text-center text-text-secondary">Loading lesson...</div>;
  }

  if (!lesson) {
    return (
      <Card className="py-16 text-center">
        <p className="text-text-secondary">Lesson not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sm text-primary hover:underline">
          Back to Home
        </button>
      </Card>
    );
  }

  return (
    <Player
      lesson={lesson}
      onBack={() => navigate(-1)}
      onSelectLesson={(next) => navigate(`/player/${next.id}`, { replace: true })}
    />
  );
}
```

Create `src/routes/CustomLessonPage.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';
import CustomLessonForm from '../components/CustomLessonForm';

export default function CustomLessonPage() {
  const navigate = useNavigate();

  return (
    <CustomLessonForm
      onBack={() => navigate('/')}
      onStart={(lesson) => navigate(`/player/${lesson.id}`)}
      onSaved={() => navigate('/')}
    />
  );
}
```

Create `src/routes/HistoryPage.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';
import HistoryPanel from '../components/HistoryPanel';

export default function HistoryPage() {
  const navigate = useNavigate();

  return (
    <HistoryPanel
      onSelectLesson={(lesson) => navigate(`/history/${lesson.id}`)}
    />
  );
}
```

Create `src/routes/LessonHistoryPage.tsx`:

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById } from '../data/lessons';
import { fetchCustomLessons } from '../utils/customLessons';
import { useState, useEffect } from 'react';
import type { Lesson } from '../types';
import LessonHistoryPanel from '../components/LessonHistoryPanel';
import Card from '../components/ui/Card';

export default function LessonHistoryPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let found = getLessonById(lessonId!);
      if (!found) {
        const customs = await fetchCustomLessons();
        found = customs.find((l) => l.id === lessonId);
      }
      setLesson(found ?? null);
      setLoading(false);
    };
    load();
  }, [lessonId]);

  if (loading) {
    return <div className="py-20 text-center text-text-secondary">Loading...</div>;
  }

  if (!lesson) {
    return (
      <Card className="py-16 text-center">
        <p className="text-text-secondary">Lesson not found.</p>
        <button onClick={() => navigate('/history')} className="mt-4 text-sm text-primary hover:underline">
          Back to History
        </button>
      </Card>
    );
  }

  return (
    <LessonHistoryPanel
      lesson={lesson}
      onStartPractice={(l) => navigate(`/player/${l.id}`)}
      onViewDetail={(id) => navigate(`/history/detail/${id}`)}
    />
  );
}
```

Create `src/routes/HistoryDetailPage.tsx`:

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import HistoryDetailPanel from '../components/HistoryDetailPanel';

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <HistoryDetailPanel
      progressId={parseInt(id!, 10)}
      onBack={() => navigate(-1)}
    />
  );
}
```

- [ ] **Step 2: Create `src/lib/router.tsx`**

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RootLayout from '../routes/RootLayout';
import AuthPage from '../routes/AuthPage';
import HomePage from '../routes/HomePage';
import LessonsPage from '../routes/LessonsPage';
import PlayerPage from '../routes/PlayerPage';
import CustomLessonPage from '../routes/CustomLessonPage';
import HistoryPage from '../routes/HistoryPage';
import LessonHistoryPage from '../routes/LessonHistoryPage';
import HistoryDetailPage from '../routes/HistoryDetailPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/auth',
      element: <AuthPage />,
    },
    {
      element: (
        <AuthGuard>
          <RootLayout />
        </AuthGuard>
      ),
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/lessons/:difficulty', element: <LessonsPage /> },
        { path: '/player/:lessonId', element: <PlayerPage /> },
        { path: '/custom', element: <CustomLessonPage /> },
        { path: '/history', element: <HistoryPage /> },
        { path: '/history/:lessonId', element: <LessonHistoryPage /> },
        { path: '/history/detail/:id', element: <HistoryDetailPage /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ]);
}
```

- [ ] **Step 3: Rewrite `src/App.tsx`**

Replace the entire file:

```tsx
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { createAppRouter } from './lib/router';

const router = createAppRouter();

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 4: Delete unused supabase file**

```bash
rm src/lib/supabase.ts
```

- [ ] **Step 5: Verify build**

```bash
npx vite build
```
Expected: build succeeds. App now uses URL routing. Test by running `npx vite dev` and navigating to `/auth`, `/`, `/lessons/daily`, etc.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/main.tsx src/lib/router.tsx src/lib/supabase.ts src/routes/
git commit -m "feat(phase-2): add react-router v6 with route wrappers"
```

---

## Phase 3: AuthPage + Dashboard

### File Map for Phase 3

| Action | File | Responsibility |
|--------|------|----------------|
| Rewrite | `src/routes/AuthPage.tsx` | Full redesigned auth UI |
| Rewrite | `src/routes/HomePage.tsx` | Dashboard with stats, quick resume, difficulty cards |
| Create | `src/routes/HomePage/StatGrid.tsx` | 4-card stats grid |
| Create | `src/routes/HomePage/QuickResume.tsx` | Recent lessons |
| Create | `src/routes/HomePage/DifficultyCards.tsx` | Compact difficulty selection |
| Modify | `src/components/AuthForm.tsx` | Use new design system tokens |

### Task 6: Redesign AuthPage

**Files:**
- Rewrite: `src/components/AuthForm.tsx`
- Rewrite: `src/routes/AuthPage.tsx`

- [ ] **Step 1: Rewrite `src/components/AuthForm.tsx`**

Replace the entire file:

```tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Card from './ui/Card';

export default function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    const { error: err } = isRegister
      ? await signUp(email, password)
      : await signIn(email, password);

    setSubmitting(false);

    if (err) {
      setError(err.message);
    } else if (isRegister) {
      setMessage('Check your email for the confirmation link.');
    }
  };

  return (
    <Card className="mx-auto max-w-sm p-8 animate-fade-in-up">
      <h2 className="mb-1 text-center text-2xl font-bold text-text tracking-tight">
        {isRegister ? 'Create Account' : 'Welcome Back'}
      </h2>
      <p className="mb-6 text-center text-sm text-text-secondary">
        {isRegister ? 'Start your listening practice' : 'Continue your practice'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Min 6 characters"
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-2.5 text-sm text-error">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-2.5 text-sm text-success">
            {message}
          </div>
        )}

        <Button type="submit" variant="primary" size="md" className="w-full" disabled={submitting}>
          {submitting ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
        </Button>
      </form>

      <button
        onClick={() => { setIsRegister(!isRegister); setError(''); setMessage(''); }}
        className="mt-5 w-full text-center text-sm text-text-secondary hover:text-primary transition-colors"
      >
        {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
      </button>
    </Card>
  );
}
```

- [ ] **Step 2: Rewrite `src/routes/AuthPage.tsx`**

```tsx
import AuthForm from '../components/AuthForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-text sm:text-5xl">
            Listening Trainer
          </h1>
          <p className="mt-2 text-lg font-light text-text-secondary">
            Dictogloss Method &middot; Academic Preparation
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthForm.tsx src/routes/AuthPage.tsx
git commit -m "feat(phase-3): redesign auth page with new design system"
```

### Task 7: Build Dashboard HomePage

**Files:**
- Rewrite: `src/routes/HomePage.tsx`
- Create: `src/routes/HomePage/StatGrid.tsx`
- Create: `src/routes/HomePage/QuickResume.tsx`
- Create: `src/routes/HomePage/DifficultyCards.tsx`

- [ ] **Step 1: Create `src/routes/HomePage/StatGrid.tsx`**

```tsx
import { useProgress } from '../../context/ProgressContext';
import Card from '../../components/ui/Card';

interface StatGridProps {
  lessonMap: Map<string, { difficulty: string }>;
}

export default function StatGrid({ lessonMap }: StatGridProps) {
  const { progress, totalCompleted } = useProgress();

  const allScores = Object.values(progress).map((p) => p.bestScore);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  const lastScore = allScores.length > 0
    ? allScores[allScores.length - 1]
    : null;

  // Simple streak: count consecutive days from today backwards
  const streak = calculateStreak(progress);

  const stats = [
    { label: 'Lessons Done', value: totalCompleted.toString(), color: 'text-text' },
    { label: 'Avg Best Score', value: `${avgScore}%`, color: 'text-primary' },
    { label: 'Day Streak', value: streak.toString(), color: 'text-success' },
    { label: 'Last Score', value: lastScore !== null ? `${lastScore}%` : '—', color: 'text-text-secondary' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4 sm:p-5">
          <div className={`text-2xl font-extrabold tabular-nums sm:text-3xl ${stat.color}`}>
            {stat.value}
          </div>
          <div className="mt-1 text-xs font-medium text-text-secondary">{stat.label}</div>
        </Card>
      ))}
    </div>
  );
}

function calculateStreak(progress: Record<string, { date: string }>): number {
  const dates = new Set(Object.values(progress).map((p) => p.date));
  let streak = 0;
  let d = new Date();

  // Check if today has activity, if not start from yesterday
  const todayStr = d.toISOString().split('T')[0];
  if (!dates.has(todayStr)) {
    d.setDate(d.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const str = d.toISOString().split('T')[0];
    if (dates.has(str)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
```

- [ ] **Step 2: Create `src/routes/HomePage/QuickResume.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { lessons as builtInLessons } from '../../data/lessons';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const tierLabel = (d: string) => {
  switch (d) {
    case 'daily': return 'Daily';
    case 'campus': return 'Campus';
    case 'academic': return 'Academic';
    default: return d;
  }
};

export default function QuickResume() {
  const { progress } = useProgress();
  const navigate = useNavigate();

  const recent = Object.entries(progress)
    .sort(([, a], [, b]) => b.date.localeCompare(a.date))
    .slice(0, 3);

  if (recent.length === 0) return null;

  const allLessons = new Map(builtInLessons.map((l) => [l.id, l]));

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Continue Practice
      </h3>
      <div className="space-y-2">
        {recent.map(([lessonId, p]) => {
          const lesson = allLessons.get(lessonId);
          return (
            <Card key={lessonId} interactive className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text truncate">
                  {lesson?.title ?? lessonId}
                </div>
                {lesson && (
                  <Badge variant="primary" className="mt-1">
                    {tierLabel(lesson.difficulty)}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold tabular-nums text-primary">
                  {p.bestScore}%
                </div>
                <div className="text-xs text-text-tertiary">best</div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/player/${lessonId}`)}
              >
                Go
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/routes/HomePage/DifficultyCards.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { getLessonsByDifficulty } from '../../data/lessons';
import type { Difficulty } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const tiers: { d: Difficulty; title: string; desc: string; color: string }[] = [
  { d: 'daily', title: 'Daily Life', desc: 'Everyday sentences, slow speed', color: 'text-success' },
  { d: 'campus', title: 'Campus Life', desc: 'University conversations', color: 'text-warning' },
  { d: 'academic', title: 'Academic Lectures', desc: 'Real lecture scenarios', color: 'text-primary' },
];

export default function DifficultyCards() {
  const { progress } = useProgress();
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Start by Level
      </h3>
      <div className="space-y-3">
        {tiers.map((tier) => {
          const total = getLessonsByDifficulty(tier.d).length;
          const completed = getLessonsByDifficulty(tier.d).filter((l) => progress[l.id]).length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <Card
              key={tier.d}
              interactive
              onClick={() => navigate(`/lessons/${tier.d}`)}
              className="p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-lg font-semibold ${tier.color}`}>{tier.title}</h4>
                  <p className="mt-0.5 text-sm text-text-secondary">{tier.desc}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold tabular-nums text-text">
                    {pct}%
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {completed}/{total}
                  </div>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-bg-alt overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    tier.d === 'daily' ? 'bg-success' :
                    tier.d === 'campus' ? 'bg-warning' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `src/routes/HomePage.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatGrid from './HomePage/StatGrid';
import QuickResume from './HomePage/QuickResume';
import DifficultyCards from './HomePage/DifficultyCards';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const greeting = getTimeGreeting();

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-extrabold text-text tracking-tight">
          {greeting}, {user?.email?.split('@')[0]}
        </h1>
        <p className="mt-1 text-text-secondary">Ready for some listening practice?</p>
      </div>

      {/* Stats */}
      <StatGrid lessonMap={new Map()} />

      {/* Quick Resume */}
      <QuickResume />

      {/* Difficulty Selection */}
      <DifficultyCards />

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" size="md" className="flex-1" onClick={() => navigate('/history')}>
          Practice History
        </Button>
        <Button variant="primary" size="md" className="flex-1" onClick={() => navigate('/custom')}>
          + Custom Lesson
        </Button>
      </div>
    </div>
  );
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
```

- [ ] **Step 5: Update `src/routes/RootLayout.tsx` header**

Update the logo text in RootLayout to use the new design:

```tsx
// Change this line in RootLayout.tsx:
<button
  onClick={() => navigate('/')}
  className="text-lg font-bold text-text hover:text-primary transition-colors"
>
  Listening Trainer
</button>
```

- [ ] **Step 6: Verify build**

```bash
npx vite build
```
Expected: build succeeds. Login should show new auth page. Dashboard should show stats, quick resume, difficulty cards.

- [ ] **Step 7: Commit**

```bash
git add src/routes/HomePage.tsx src/routes/HomePage/ src/components/AuthForm.tsx
git commit -m "feat(phase-3): build Dashboard homepage with stats, quick resume, difficulty cards"
```

---

## Phase 4: Lessons + Custom Lesson Pages

### File Map for Phase 4

| Action | File | Responsibility |
|--------|------|----------------|
| Rewrite | `src/routes/LessonsPage.tsx` | Full redesign with lesson card grid |
| Create | `src/components/LessonCard.tsx` | Individual lesson card component |
| Rewrite | `src/routes/CustomLessonPage.tsx` | Full redesign |
| Modify | `src/components/CustomLessonForm.tsx` | Use new design tokens |
| Modify | `src/components/LessonList.tsx` | Use new design tokens + LessonCard |

### Task 8: Redesign Lessons page with new LessonCard

**Files:**
- Create: `src/components/LessonCard.tsx`
- Rewrite: `src/routes/LessonsPage.tsx`
- Modify: `src/components/LessonList.tsx`

- [ ] **Step 1: Create `src/components/LessonCard.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import type { Lesson } from '../types';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  onDelete?: () => void;
}

export default function LessonCard({ lesson, index, onDelete }: LessonCardProps) {
  const { getBestScore } = useProgress();
  const navigate = useNavigate();
  const best = getBestScore(lesson.id);
  const isCustom = lesson.id.startsWith('custom-');

  return (
    <Card className="p-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text">{lesson.title}</span>
            {isCustom && <Badge variant="primary">Custom</Badge>}
          </div>
          {best !== null && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 w-16 rounded-full bg-bg-alt overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    best >= 80 ? 'bg-success' : best >= 50 ? 'bg-warning' : 'bg-error'
                  }`}
                  style={{ width: `${best}%` }}
                />
              </div>
              <span className="text-xs text-text-tertiary">Best: {best}%</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="primary" size="sm" onClick={() => navigate(`/player/${lesson.id}`)}>
            Start
          </Button>
          {isCustom && (
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (confirm('Delete this custom lesson?')) {
                  const { deleteCustomLesson } = await import('../utils/customLessons');
                  await deleteCustomLesson(lesson.id);
                  onDelete?.();
                }
              }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Rewrite `src/routes/LessonsPage.tsx`**

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getLessonsByDifficulty } from '../data/lessons';
import { fetchCustomLessons } from '../utils/customLessons';
import type { Lesson, Difficulty } from '../types';
import LessonCard from '../components/LessonCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const tierTitle = (d: Difficulty) => {
  switch (d) {
    case 'daily': return 'Daily Life';
    case 'campus': return 'Campus Life';
    case 'academic': return 'Academic Lectures';
  }
};

export default function LessonsPage() {
  const { difficulty } = useParams<{ difficulty: string }>();
  const navigate = useNavigate();
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    fetchCustomLessons().then(setCustomLessons);
  }, []);

  if (!difficulty || !['daily', 'campus', 'academic'].includes(difficulty)) {
    return (
      <div>
        <button onClick={() => navigate('/')} className="mb-4 text-sm text-text-secondary hover:text-primary">
          &larr; Home
        </button>
        <Card className="py-12 text-center">
          <p className="text-text-secondary">Invalid difficulty.</p>
        </Card>
      </div>
    );
  }

  const d = difficulty as Difficulty;
  const builtIn = getLessonsByDifficulty(d);
  const custom = customLessons.filter((l) => l.difficulty === d);
  const all = [...builtIn, ...custom];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-text tracking-tight">{tierTitle(d)}</h2>
        <Badge variant="primary">{all.length} lessons</Badge>
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
          title="No lessons available"
          description="Create a custom lesson to get started!"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {all.map((lesson, i) => (
            <LessonCard key={lesson.id} lesson={lesson} index={i} onDelete={() => fetchCustomLessons().then(setCustomLessons)} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update `src/components/LessonList.tsx`**

Update `LessonList.tsx` to use the new design tokens. The main changes:
- Replace `glass` classes with `bg-surface border border-border`
- Replace `text-white` with `text-text`
- Replace `text-aurora-muted` with `text-text-secondary`
- Replace `text-aurora-violet` with `text-primary`
- Replace `bg-aurora-violet/15` with `bg-primary/10`
- Replace `border-aurora-border` with `border-border`
- Replace `bg-aurora-border/50` with `bg-bg-alt`

Key search-and-replace patterns in `src/components/LessonList.tsx`:
- `glass` → `bg-surface`
- `text-white` → `text-text`
- `text-aurora-muted` → `text-text-secondary`
- `text-aurora-violet` → `text-primary`
- `bg-aurora-violet/15` → `bg-primary/10`
- `text-aurora-text` → `text-text`
- `border-aurora-border` → `border-border`
- `border-aurora-violet/50` → `border-primary/50`
- `bg-aurora-card/70` → `bg-bg-alt`
- `text-aurora-emerald` → `text-success`
- `text-aurora-amber` → `text-warning`
- `text-red-400` → `text-error`
- `bg-aurora-border/50` → `bg-bg-alt`
- `bg-aurora-violet/10` → `bg-primary/5`
- `text-aurora-violet/50` → `text-primary/50`
- `rounded-2xl` → `rounded-xl`

- [ ] **Step 4: Verify build**

```bash
npx vite build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/LessonCard.tsx src/routes/LessonsPage.tsx src/components/LessonList.tsx
git commit -m "feat(phase-4): redesign lessons page with card grid layout"
```

### Task 9: Redesign CustomLessonForm

**Files:**
- Modify: `src/components/CustomLessonForm.tsx`
- Rewrite: `src/routes/CustomLessonPage.tsx` (minor update for nav consistency)

- [ ] **Step 1: Update `src/components/CustomLessonForm.tsx` with new design tokens**

Replace all old color tokens with new ones:
- `glass` → `bg-surface`
- `text-white` → `text-text`
- `text-aurora-muted` → `text-text-secondary`
- `text-aurora-text` → `text-text`
- `text-aurora-violet` → `text-primary`
- `text-aurora-amber` → `text-warning`
- `text-aurora-cyan` → `text-primary` (cyan → primary for spacing alerts)
- `text-aurora-emerald` → `text-success`
- `text-red-400` → `text-error`
- `border-aurora-border` → `border-border`
- `border-aurora-violet/50` → `border-primary/50`
- `border-aurora-amber/20` → `border-warning/20`
- `border-aurora-cyan/30` → `border-primary/30`
- `border-aurora-emerald/30` → `border-success/30`
- `border-red-500/20` → `border-error/20`
- `bg-aurora-surface/60` → `bg-bg`
- `bg-aurora-violet/10` → `bg-primary/5`
- `bg-aurora-amber/5` → `bg-warning/5`
- `bg-aurora-cyan/5` → `bg-primary/5`
- `bg-aurora-emerald/5` → `bg-success/5`
- `bg-aurora-violet/15` → `bg-primary/10`
- `bg-aurora-violet` → `bg-primary`
- `bg-aurora-violet/20` → `bg-primary/10`
- `bg-aurora-border` → `bg-bg-alt`
- `bg-aurora-border/40` → `bg-bg-alt`
- `shadow-[0_0_12px_rgba(139,92,246,0.3)]` → `shadow-md`
- `rounded-2xl` → `rounded-xl`
- `focus:ring-aurora-violet/10` → `focus:ring-primary/10`
- `focus:border-aurora-violet/50` → `focus:border-primary/50`
- `from-aurora-violet to-violet-600` → `from-primary to-primary-hover`
- `glow-violet` → `shadow-lg`
- `rounded-xl glass border border-red-500/20 bg-red-500/10` → `rounded-xl border border-error/20 bg-error/5`

- [ ] **Step 2: Commit**

```bash
git add src/components/CustomLessonForm.tsx src/routes/CustomLessonPage.tsx
git commit -m "feat(phase-4): redesign custom lesson form with new design system"
```

---

## Phase 5: Immersive Player

### File Map for Phase 5

| Action | File | Responsibility |
|--------|------|----------------|
| Rewrite | `src/routes/PlayerPage.tsx` | Immersive player wrapper |
| Create | `src/components/AudioWaveform.tsx` | Web Audio API visualization |
| Rewrite | `src/components/Player.tsx` | Full immersive redesign |
| Modify | `src/components/AudioControls.tsx` | Redesign with new tokens |
| Modify | `src/components/ResultPanel.tsx` | Redesign with new tokens |

### Task 10: Create AudioWaveform component

**Files:**
- Create: `src/components/AudioWaveform.tsx`

- [ ] **Step 1: Create `src/components/AudioWaveform.tsx`**

```tsx
import { useRef, useEffect, useCallback, useState } from 'react';

interface AudioWaveformProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export default function AudioWaveform({ audioElement, isPlaying }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [bars, setBars] = useState<number[]>(new Array(40).fill(4));

  const animate = useCallback(() => {
    if (!isPlaying) {
      setBars((prev) => prev.map((h) => Math.max(4, h * 0.9)));
    } else {
      setBars((prev) =>
        prev.map(() => Math.random() * 48 + 8)
      );
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barCount = bars.length;
    const barWidth = width / barCount - 2;
    const barGap = 2;

    bars.forEach((barHeight, i) => {
      const x = i * (barWidth + barGap);
      const y = (height - barHeight) / 2;

      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.8)');
      gradient.addColorStop(1, 'rgba(79, 70, 229, 0.3)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [bars, isPlaying]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={64}
      className="w-full max-w-md rounded-xl bg-bg"
    />
  );
}
```

### Task 11: Redesign Player component

**Files:**
- Rewrite: `src/components/Player.tsx`
- Modify: `src/components/AudioControls.tsx`
- Modify: `src/components/ResultPanel.tsx`

- [ ] **Step 1: Update `src/components/AudioControls.tsx`**

Replace old tokens:
- `bg-aurora-violet` → `bg-primary`
- `from-aurora-emerald to-emerald-600` → `from-success to-emerald-600`
- `glow-violet` → `shadow-lg shadow-primary/30`
- `glow-emerald` → `shadow-lg shadow-success/30`
- `text-aurora-muted` → `text-text-secondary`
- `text-aurora-violet` → `text-primary`
- `border-aurora-border` → `border-border`
- `border-aurora-violet/50` → `border-primary/50`
- `bg-aurora-violet/5` → `bg-primary/5`

- [ ] **Step 2: Rewrite `src/components/Player.tsx`**

Replace entire file with redesigned player featuring:
- New design tokens throughout
- AudioWaveform integration in listen stages
- Keyboard shortcuts (Space, Enter, Esc)
- Cleaner stage indicator
- Better layout

```tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import type { Lesson } from '../types';
import { useProgress } from '../context/ProgressContext';
import { compareTexts, calculateScore, type DiffToken } from '../utils/compare';
import { getNextLessonId, getLessonById } from '../data/lessons';
import AudioControls from './AudioControls';
import ResultPanel from './ResultPanel';
import AudioWaveform from './AudioWaveform';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

type DGStage = 'prep' | 'listen1' | 'listen2' | 'reconstruct' | 'result';

interface PlayerProps {
  lesson: Lesson;
  onBack: () => void;
  onSelectLesson: (lesson: Lesson) => void;
}

function extractKeywords(sentence: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'this',
    'that', 'these', 'those', 'it', 'its', 'and', 'or', 'but', 'not',
    'so', 'if', 'than', 'then', 'just', 'also', 'very', 'too', 'all',
    'no', 'up', 'out', 'there', 'their', 'been', 'more', 'some', 'which',
    'who', 'whom', 'what', 'when', 'where', 'how',
  ]);
  return sentence
    .replace(/[^a-zA-Z\s'-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w.toLowerCase()))
    .map((w) => w.toLowerCase())
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 8);
}

const stages: DGStage[] = ['prep', 'listen1', 'listen2', 'reconstruct', 'result'];

const stageLabels: Record<DGStage, string> = {
  prep: 'Prepare',
  listen1: 'First Listen',
  listen2: 'Take Notes',
  reconstruct: 'Reconstruct',
  result: 'Result',
};

export default function Player({ lesson, onBack, onSelectLesson }: PlayerProps) {
  const { saveLesson } = useProgress();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [stage, setStage] = useState<DGStage>('prep');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [keywords, setKeywords] = useState('');
  const [reconstruction, setReconstruction] = useState('');
  const [diff, setDiff] = useState<DiffToken[]>([]);
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [listenCount, setListenCount] = useState(0);
  const [audioReady, setAudioReady] = useState(false);

  const keywordList = extractKeywords(lesson.sentence);
  const audioSrc = lesson.audioPath || `/api/tts?text=${encodeURIComponent(lesson.sentence)}`;

  useEffect(() => {
    setStage('prep');
    setKeywords('');
    setReconstruction('');
    setDiff([]);
    setScore(0);
    setRevealed(false);
    setListenCount(0);
    setIsPlaying(false);
    setAudioReady(false);
  }, [lesson.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (stage === 'prep') handleStartListen();
        else if (stage === 'listen1') handleGoToNotes();
        else if (stage === 'listen2') handleGoToReconstruct();
        else if (stage === 'reconstruct') handleSubmit();
      } else if (e.code === 'Escape') {
        onBack();
      } else if (e.key === '1') {
        setSpeed(0.75);
        if (audioRef.current) audioRef.current.playbackRate = 0.75;
      } else if (e.key === '2') {
        setSpeed(1);
        if (audioRef.current) audioRef.current.playbackRate = 1;
      } else if (e.key === '3') {
        setSpeed(1.25);
        if (audioRef.current) audioRef.current.playbackRate = 1.25;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [stage, isPlaying, onBack]);

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    setIsPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) pause(); else play();
  }, [isPlaying, play, pause]);

  const handleReplay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
    setIsPlaying(true);
    setListenCount((c) => c + 1);
  }, []);

  const handleChangeSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25];
    const idx = speeds.indexOf(speed);
    const next = speeds[(idx + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, [speed]);

  const handleStartListen = useCallback(() => {
    setStage('listen1');
    setTimeout(() => play(), 300);
  }, [play]);

  const handleGoToNotes = useCallback(() => {
    pause();
    setStage('listen2');
    setTimeout(() => play(), 300);
  }, [play, pause]);

  const handleGoToReconstruct = useCallback(() => {
    pause();
    setStage('reconstruct');
  }, [pause]);

  const handleSubmit = useCallback(() => {
    const result = compareTexts(lesson.sentence, reconstruction);
    const s = calculateScore(result);
    setDiff(result);
    setScore(s);
    setStage('result');
    const diffJson = JSON.stringify(result);
    saveLesson(lesson.id, s, keywords, reconstruction, diffJson, listenCount);
  }, [lesson, reconstruction, keywords, listenCount, saveLesson]);

  const handleRetry = useCallback(() => {
    setKeywords('');
    setReconstruction('');
    setDiff([]);
    setScore(0);
    setRevealed(false);
    setListenCount(0);
    const a = audioRef.current;
    setAudioReady(a ? a.readyState >= 2 : false);
    setStage('prep');
  }, []);

  const handleNext = useCallback(() => {
    const nextId = getNextLessonId(lesson.id);
    if (nextId) {
      const next = getLessonById(nextId);
      if (next) onSelectLesson(next);
    }
  }, [lesson.id, onSelectLesson]);

  const handleReveal = useCallback(() => setRevealed(true), []);

  const nextId = getNextLessonId(lesson.id);
  const stageIdx = stages.indexOf(stage);

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        src={audioSrc}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onCanPlay={() => setAudioReady(true)}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-text tracking-tight">{lesson.title}</h2>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Badge variant="primary">Dictogloss</Badge>
              <span>{tierLabel(lesson.difficulty)}</span>
            </div>
          </div>
        </div>

        {/* Stage dots */}
        <div className="flex items-center gap-1">
          {stages.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  i < stageIdx
                    ? 'bg-success text-white'
                    : i === stageIdx
                    ? 'bg-primary text-white'
                    : 'bg-bg-alt text-text-tertiary'
                }`}
              >
                {i + 1}
              </div>
              {i < 4 && (
                <div className={`h-0.5 w-4 rounded-full transition-all duration-300 ${i < stageIdx ? 'bg-success' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage content */}
      {stage === 'prep' && (
        <PrepStage
          lesson={lesson}
          keywords={keywordList}
          audioReady={audioReady}
          onStart={handleStartListen}
        />
      )}

      {(stage === 'listen1' || stage === 'listen2') && (
        <ListenStage
          stage={stage as 'listen1' | 'listen2'}
          keywords={keywords}
          onChangeKeywords={setKeywords}
          isPlaying={isPlaying}
          speed={speed}
          listenCount={listenCount}
          audioElement={audioRef.current}
          onTogglePlay={handleTogglePlay}
          onReplay={handleReplay}
          onChangeSpeed={handleChangeSpeed}
          onNext={stage === 'listen1' ? handleGoToNotes : handleGoToReconstruct}
        />
      )}

      {stage === 'reconstruct' && (
        <ReconstructStage
          keywords={keywords}
          value={reconstruction}
          onChange={setReconstruction}
          onSubmit={handleSubmit}
          onReplayAudio={handleReplay}
          isPlaying={isPlaying}
          speed={speed}
          audioElement={audioRef.current}
          onTogglePlay={handleTogglePlay}
          onChangeSpeed={handleChangeSpeed}
        />
      )}

      {stage === 'result' && (
        <ResultPanel
          diff={diff}
          score={score}
          originalText={lesson.sentence}
          onNext={nextId ? handleNext : null}
          onRetry={handleRetry}
          onReveal={handleReveal}
          revealed={revealed}
        />
      )}
    </div>
  );
}

// ─── Stage components ────────────────────────────────────────────

function PrepStage({ lesson, keywords, audioReady, onStart }: {
  lesson: Lesson;
  keywords: string[];
  audioReady: boolean;
  onStart: () => void;
}) {
  return (
    <Card className="p-6 animate-fade-in-up space-y-5">
      <div>
        <h3 className="text-lg font-bold text-text">Prepare to Listen</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          You will hear the audio <strong className="text-text">twice</strong>.
          First, just listen without writing. Then take keyword notes.
          Finally, reconstruct the full text from memory.
        </p>
      </div>

      <Card className="p-4 border border-primary/10 bg-primary-surface/50">
        <h4 className="mb-1 text-sm font-semibold text-text">Topic</h4>
        <p className="text-sm text-text-secondary">{lesson.hint}</p>
      </Card>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-text">Key vocabulary to listen for</h4>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <Badge key={kw} variant="primary">{kw}</Badge>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onStart}
        disabled={!audioReady}
        className="w-full"
      >
        {audioReady ? 'Start Listening' : 'Preparing audio...'}
      </Button>
    </Card>
  );
}

function ListenStage({ stage, keywords, onChangeKeywords, isPlaying, speed, listenCount, audioElement, onTogglePlay, onReplay, onChangeSpeed, onNext }: {
  stage: 'listen1' | 'listen2';
  keywords: string;
  onChangeKeywords: (v: string) => void;
  isPlaying: boolean;
  speed: number;
  listenCount: number;
  audioElement: HTMLAudioElement | null;
  onTogglePlay: () => void;
  onReplay: () => void;
  onChangeSpeed: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Audio + waveform */}
      <Card className="p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <AudioControls
            isPlaying={isPlaying}
            speed={speed}
            onTogglePlay={onTogglePlay}
            onReplay={onReplay}
            onChangeSpeed={onChangeSpeed}
          />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-text tabular-nums">{listenCount}</div>
            <div className="text-xs text-text-secondary font-medium">plays</div>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <AudioWaveform audioElement={audioElement} isPlaying={isPlaying} />
        </div>
      </Card>

      {stage === 'listen1' ? (
        <Card className="py-12 text-center border-dashed border border-primary/20">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <svg className="h-8 w-8 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          <p className="text-text font-medium">Just listen. Do not write anything.</p>
          <p className="mt-1.5 text-sm text-text-secondary">Focus on understanding the overall meaning.</p>
        </Card>
      ) : (
        <div>
          <Card className="mb-4 p-4 text-center border border-warning/20 bg-warning/5">
            <p className="text-sm font-medium text-warning">Take keyword notes while you listen. Write down important words only.</p>
          </Card>
          <textarea
            value={keywords}
            onChange={(e) => onChangeKeywords(e.target.value)}
            placeholder="Type keywords as you listen...&#10;e.g., mitochondria, energy, ATP, oxidative"
            rows={5}
            className="w-full resize-none rounded-xl border border-border bg-bg p-4 text-sm leading-relaxed text-text placeholder:text-text-tertiary focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            autoFocus
          />
        </div>
      )}

      <Button variant="primary" size="lg" onClick={onNext} className="w-full">
        {stage === 'listen1' ? "I've Listened — Take Notes Now" : "I'm Done — Reconstruct from Memory"}
      </Button>
    </div>
  );
}

function ReconstructStage({ keywords, value, onChange, onSubmit, onReplayAudio, isPlaying, speed, audioElement, onTogglePlay, onChangeSpeed }: {
  keywords: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onReplayAudio: () => void;
  isPlaying: boolean;
  speed: number;
  audioElement: HTMLAudioElement | null;
  onTogglePlay: () => void;
  onChangeSpeed: () => void;
}) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Mini audio bar */}
      <Card className="flex items-center gap-3 px-4 py-2.5">
        <button
          onClick={onTogglePlay}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
            isPlaying
              ? 'bg-warning text-white'
              : 'bg-bg-alt text-text-tertiary hover:bg-border hover:text-text'
          }`}
        >
          {isPlaying ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5.14v14.72a1 1 0 001.555.832l11.318-7.36a1 1 0 000-1.664L9.555 4.308A1 1 0 008 5.14z" />
            </svg>
          )}
        </button>
        <button
          onClick={onReplayAudio}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-tertiary hover:text-primary hover:border-primary/50 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={onChangeSpeed}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-tertiary hover:text-primary hover:border-primary/50 transition-all"
        >
          {speed}x
        </button>
        <span className="ml-auto text-xs text-text-tertiary">Replay if needed</span>
      </Card>

      {/* Your notes */}
      {keywords.trim() && (
        <Card className="p-4 border border-warning/20 bg-warning/5">
          <div className="mb-1 text-xs font-semibold text-warning uppercase tracking-wider">Your Notes</div>
          <div className="text-sm leading-relaxed text-warning/80">{keywords}</div>
        </Card>
      )}

      {/* Reconstruction textarea */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-text">
            Reconstruct the full text from memory
          </div>
          <div className="text-xs text-text-tertiary">{wordCount} words</div>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write the complete text you heard, using your notes to help you remember..."
          rows={8}
          className="w-full resize-none rounded-xl border border-border bg-bg p-4 text-sm leading-relaxed text-text placeholder:text-text-tertiary focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          autoFocus
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onSubmit}
        disabled={!value.trim()}
        className="w-full"
      >
        Submit & Compare
      </Button>
    </div>
  );
}

function tierLabel(d: string): string {
  switch (d) {
    case 'daily': return 'Daily Life';
    case 'campus': return 'Campus Life';
    case 'academic': return 'Academic Lecture';
    default: return '';
  }
}
```

- [ ] **Step 3: Update `src/components/ResultPanel.tsx`**

Replace old tokens:
- `glass` → `bg-surface`
- `text-aurora-emerald` → `text-success`
- `text-aurora-amber` → `text-warning`
- `text-red-400` → `text-error`
- `text-aurora-muted` → `text-text-secondary`
- `text-aurora-text` → `text-text`
- `bg-aurora-emerald/15` → `bg-success/15`
- `bg-red-500/15` → `bg-error/15`
- `bg-aurora-amber/15` → `bg-warning/15`
- `bg-aurora-border/50` → `bg-bg-alt`
- `bg-aurora-emerald/10` → `bg-success/10`
- `bg-aurora-amber/5` → `bg-warning/5`
- `ring-aurora-emerald/30` → `ring-success/30`
- `ring-aurora-amber/30` → `ring-warning/30`
- `ring-red-400/30` → `ring-error/30`
- `from-aurora-emerald to-emerald-600` → `from-success to-emerald-600`
- `glow-emerald` → `shadow-lg shadow-success/30`
- `rounded-2xl` → `rounded-xl`
- `border-aurora-amber/40` → `border-warning/40`

- [ ] **Step 4: Verify build**

```bash
npx vite build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Player.tsx src/components/AudioWaveform.tsx src/components/AudioControls.tsx src/components/ResultPanel.tsx
git commit -m "feat(phase-5): immersive player with waveform, keyboard shortcuts"
```

---

## Phase 6: History Pages

### File Map for Phase 6

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/routes/HomePage/TrendChart.tsx` | Line chart for dashboard |
| Modify | `src/routes/HomePage.tsx` | Add trend chart |
| Modify | `src/routes/HistoryPage.tsx` | Add filter tabs, redesign |
| Modify | `src/components/HistoryPanel.tsx` | New design tokens + filter tabs |
| Modify | `src/routes/LessonHistoryPage.tsx` | Redesign |
| Modify | `src/components/LessonHistoryPanel.tsx` | New design tokens |
| Modify | `src/routes/HistoryDetailPage.tsx` | Redesign |
| Modify | `src/components/HistoryDetailPanel.tsx` | New design tokens |

### Task 12: Add Trend Chart to Dashboard

**Files:**
- Create: `src/routes/HomePage/TrendChart.tsx`
- Modify: `src/routes/HomePage.tsx`

- [ ] **Step 1: Create `src/routes/HomePage/TrendChart.tsx`**

Uses Chart.js for a lightweight line chart showing score trends.

```tsx
import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import Card from '../../components/ui/Card';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface TrendChartProps {
  scores: { date: string; score: number }[];
}

export default function TrendChart({ scores }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || scores.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const last7 = scores.slice(-7);
    const labels = last7.map((s) => s.date);
    const data = last7.map((s) => s.score);

    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#4F46E5',
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Score Trend', font: { size: 14, weight: '600' } },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [scores]);

  if (scores.length === 0) return null;

  return (
    <Card className="p-5">
      <canvas ref={canvasRef} />
    </Card>
  );
}
```

- [ ] **Step 2: Update `src/routes/HomePage.tsx` to include trend chart**

Add imports and component:
```tsx
import { apiGetHistory } from '../lib/api';
import TrendChart from './HomePage/TrendChart';
```

Add state and fetch:
```tsx
const [trendData, setTrendData] = useState<{ date: string; score: number }[]>([]);

useEffect(() => {
  apiGetHistory().then((rows) => {
    const sorted = rows.sort((a, b) => a.date.localeCompare(b.date));
    setTrendData(sorted.map((r) => ({ date: r.date, score: r.score })));
  }).catch(() => {});
}, []);
```

Add before action buttons:
```tsx
{trendData.length > 0 && <TrendChart scores={trendData} />}
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/HomePage/TrendChart.tsx src/routes/HomePage.tsx
git commit -m "feat(phase-6): add score trend chart to dashboard"
```

### Task 13: Redesign History pages

**Files:**
- Modify: `src/components/HistoryPanel.tsx`
- Modify: `src/components/LessonHistoryPanel.tsx`
- Modify: `src/components/HistoryDetailPanel.tsx`

- [ ] **Step 1: Update `src/components/HistoryPanel.tsx`**

Search-and-replace old tokens:
- `glass` → `bg-surface`
- `text-white` → `text-text`
- `text-aurora-muted` → `text-text-secondary`
- `text-aurora-text` → `text-text`
- `text-aurora-border` → `text-border`
- `text-aurora-violet` → `text-primary`
- `text-aurora-emerald` → `text-success`
- `text-aurora-amber` → `text-warning`
- `text-red-400` → `text-error`
- `border-aurora-border` → `border-border`
- `bg-aurora-card/70` → `bg-bg-alt`
- `bg-aurora-violet/10` → `bg-primary/5`
- `text-aurora-violet/50` → `text-primary/50`
- `border-aurora-violet/40` → `border-primary/40`
- `rounded-2xl` → `rounded-xl`

- [ ] **Step 2: Update `src/components/LessonHistoryPanel.tsx`**

Same token replacements as above, plus:
- `bg-aurora-violet/15` → `bg-primary/10`
- `text-aurora-violet` → `text-primary`

- [ ] **Step 3: Update `src/components/HistoryDetailPanel.tsx`**

Same token replacements, plus update tab bar styling:
- `bg-aurora-violet` → `bg-primary`
- `bg-aurora-border/30` → `bg-bg-alt`
- `bg-aurora-violet/5` → `bg-primary/5`
- `bg-aurora-amber/5` → `bg-warning/5`
- `bg-aurora-emerald/5` → `bg-success/5`
- `border-aurora-amber/20` → `border-warning/20`
- `border-aurora-violet/20` → `border-primary/20`
- `border-aurora-emerald/20` → `border-success/20`
- `text-aurora-amber` → `text-warning`
- `text-aurora-violet` → `text-primary`
- `text-aurora-emerald` → `text-success`

- [ ] **Step 4: Verify build**

```bash
npx vite build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/HistoryPanel.tsx src/components/LessonHistoryPanel.tsx src/components/HistoryDetailPanel.tsx
git commit -m "feat(phase-6): redesign history pages with new design system"
```

---

## Phase 7: Settings + Responsive + Polish

### File Map for Phase 7

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/routes/SettingsPage.tsx` | User settings page |
| Modify | `src/lib/api.ts` | Add changePassword endpoint |
| Modify | `src/lib/router.tsx` | Add /settings route |
| Modify | `src/routes/RootLayout.tsx` | Add settings link, mobile nav |
| Modify | `src/index.css` | Add responsive utilities |

### Task 14: Create Settings page

**Files:**
- Create: `src/routes/SettingsPage.tsx`
- Modify: `src/lib/api.ts`
- Modify: `src/lib/router.tsx`

- [ ] **Step 1: Add changePassword API endpoint to `src/lib/api.ts`**

Add at end of file:
```tsx
export async function apiChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await request('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
```

- [ ] **Step 2: Create `src/routes/SettingsPage.tsx`**

```tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { apiGetHistory } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { progress } = useProgress();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  // Preferences stored in localStorage
  const [defaultSpeed, setDefaultSpeed] = useState(() =>
    localStorage.getItem('pref_speed') || '1'
  );
  const [defaultVoice, setDefaultVoice] = useState(() =>
    localStorage.getItem('pref_voice') || 'female'
  );

  const handleSavePref = (key: string, value: string) => {
    localStorage.setItem(`pref_${key}`, value);
  };

  const handleExport = async () => {
    try {
      const history = await apiGetHistory();
      const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `listening-trainer-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setPwError('Failed to export data.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwMessage('');

    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPw.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }

    try {
      const { apiChangePassword } = await import('../lib/api');
      await apiChangePassword(currentPw, newPw);
      setPwMessage('Password changed successfully.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password.');
    }
  };

  const totalLessons = Object.keys(progress).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-text tracking-tight">Settings</h1>

      {/* Profile */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-text">Profile</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-text">{user?.email}</div>
            <div className="text-sm text-text-secondary">{totalLessons} lessons practiced</div>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-text">Preferences</h3>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Default TTS Speed</label>
          <div className="flex gap-2">
            {['0.75', '1', '1.25', '1.5'].map((s) => (
              <button
                key={s}
                onClick={() => { setDefaultSpeed(s); handleSavePref('speed', s); }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  defaultSpeed === s
                    ? 'bg-primary text-white'
                    : 'bg-bg-alt text-text-secondary hover:bg-border'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">TTS Voice</label>
          <div className="flex gap-2">
            {(['female', 'male'] as const).map((v) => (
              <button
                key={v}
                onClick={() => { setDefaultVoice(v); handleSavePref('voice', v); }}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                  defaultVoice === v
                    ? 'bg-primary text-white'
                    : 'bg-bg-alt text-text-secondary hover:bg-border'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-text">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Current Password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">New Password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Confirm New Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {pwError && (
            <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-2 text-sm text-error">
              {pwError}
            </div>
          )}
          {pwMessage && (
            <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-2 text-sm text-success">
              {pwMessage}
            </div>
          )}

          <Button type="submit" variant="primary" size="sm">
            Change Password
          </Button>
        </form>
      </Card>

      {/* Data */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-text">Data</h3>
        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={handleExport}>
            Export Practice Data
          </Button>
          <Button variant="danger" size="md" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Add /settings route to `src/lib/router.tsx`**

Add import and route:
```tsx
import SettingsPage from '../routes/SettingsPage';
```

Inside the AuthGuard children array, add:
```tsx
{ path: '/settings', element: <SettingsPage /> },
```

- [ ] **Step 4: Add settings link to RootLayout header**

Add a settings button next to the email in RootLayout.tsx:
```tsx
<button
  onClick={() => navigate('/settings')}
  className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
  title="Settings"
>
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
</button>
```

- [ ] **Step 5: Verify build**

```bash
npx vite build
```

- [ ] **Step 6: Commit**

```bash
git add src/routes/SettingsPage.tsx src/lib/api.ts src/lib/router.tsx src/routes/RootLayout.tsx
git commit -m "feat(phase-7): add settings page with preferences, password change, data export"
```

---

## Phase 8: Responsive Polish + Final Cleanup

### Task 15: Add mobile bottom tab bar

**Files:**
- Modify: `src/routes/RootLayout.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add mobile bottom tab bar to `src/routes/RootLayout.tsx`**

Add at bottom of RootLayout, before `</div>`:
```tsx
{/* Mobile Bottom Nav */}
<nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-sm sm:hidden">
  <div className="flex h-14 items-center justify-around">
    <button onClick={() => navigate('/')} className="flex flex-col items-center gap-0.5 text-xs text-text-secondary hover:text-primary">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
      Home
    </button>
    <button onClick={() => navigate('/lessons/daily')} className="flex flex-col items-center gap-0.5 text-xs text-text-secondary hover:text-primary">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
      Lessons
    </button>
    <button onClick={() => navigate('/history')} className="flex flex-col items-center gap-0.5 text-xs text-text-secondary hover:text-primary">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      History
    </button>
    <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-0.5 text-xs text-text-secondary hover:text-primary">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.828a1.125 1.125 0 01.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Settings
    </button>
  </div>
</nav>
```

Add bottom padding for mobile:
```tsx
<main className="relative mx-auto max-w-5xl px-4 pb-20 py-6 sm:px-6">
```

- [ ] **Step 2: Final global token sweep**

Run a search across ALL files in `src/` for any remaining old tokens and replace:
- `bg-aurora` → `bg-bg`
- `grain-overlay` → remove (no longer needed)
- `text-gradient-brand` → `text-primary`
- `text-gradient-violet` → `text-primary`
- `border-glow-violet` → `border-primary/25`
- `border-glow-emerald` → `border-success/25`
- `glow-violet` → `shadow-lg shadow-primary/30`
- `glow-emerald` → `shadow-lg shadow-success/30`
- `glow-amber` → `shadow-lg shadow-warning/30`
- `glass` → `bg-surface border border-border`
- `glass-strong` → `bg-surface/95 backdrop-blur-sm border border-border`
- `animate-stage-pulse` → remove (unused)
- `animate-breathe` → remove (unused)
- `animate-shimmer` → remove (unused)
- `animate-score-glow` → remove (unused)
- `progress-bar-shimmer` → remove (unused)

- [ ] **Step 3: Clean up old unused CSS animations from index.css**

Remove all unused animation keyframes and classes from index.css, keep only:
- `fade-in`, `fade-in-up`, `slide-in-right`
- stagger classes
- base styles

- [ ] **Step 4: Final build + test**

```bash
npx vite build
npx vite preview
```

Test the full flow: login → dashboard → select difficulty → start lesson → all 5 stages → result → history → settings → export.

- [ ] **Step 5: Final commit**

```bash
git add src/
git commit -m "feat(phase-8): mobile bottom nav, responsive polish, final cleanup"
```

---

## Summary of Commits

| Phase | Commit Message | Files Changed |
|-------|---------------|---------------|
| 0 | Add dependencies | package.json |
| 1 | Design system tokens + UI primitives | index.css, ui/* |
| 1 | Date formatting utility | formatDate.ts |
| 2 | react-router v6 | App.tsx, router.tsx, routes/* |
| 3 | Auth page redesign | AuthForm.tsx, AuthPage.tsx |
| 3 | Dashboard homepage | HomePage.tsx, HomePage/* |
| 4 | Lessons page card grid | LessonCard.tsx, LessonsPage.tsx, LessonList.tsx |
| 4 | Custom lesson form | CustomLessonForm.tsx |
| 5 | Immersive player | Player.tsx, AudioWaveform.tsx |
| 6 | Trend chart | TrendChart.tsx, HomePage.tsx |
| 6 | History pages | HistoryPanel.tsx, LessonHistoryPanel.tsx, HistoryDetailPanel.tsx |
| 7 | Settings page | SettingsPage.tsx, router.tsx, RootLayout.tsx |
| 8 | Mobile nav + polish | RootLayout.tsx, index.css |
