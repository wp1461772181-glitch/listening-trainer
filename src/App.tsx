import { useState, useCallback, useEffect } from 'react';
import type { Difficulty, Lesson, View } from './types';
import { getLessonsByDifficulty } from './data/lessons';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import Layout from './components/Layout';
import DifficultyCard from './components/DifficultyCard';
import LessonList from './components/LessonList';
import Player from './components/Player';
import CustomLessonForm from './components/CustomLessonForm';
import HistoryPanel from './components/HistoryPanel';
import LessonHistoryPanel from './components/LessonHistoryPanel';
import { fetchCustomLessons } from './utils/customLessons';
import AuthForm from './components/AuthForm';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-aurora grain-overlay flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-aurora-violet/30 border-t-aurora-violet animate-spin" />
          <div className="text-aurora-muted text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-aurora grain-overlay">
        <div className="mx-auto max-w-4xl px-4 py-6 relative z-10">
          <div className="mb-10 text-center">
            <h1 className="mb-3 text-5xl font-extrabold tracking-tight">
              <span className="text-gradient-brand">Academic Listening</span>
            </h1>
            <p className="text-aurora-muted text-lg font-light">
              Listening training for Monash University preparation
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    );
  }

  return <AppRoutes />;
}

function AppRoutes() {
  const [view, setView] = useState<View>('home');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [returnView, setReturnView] = useState<'lessons' | 'history'>('lessons');
  const { progress } = useProgress();

  useEffect(() => {
    fetchCustomLessons().then(setCustomLessons);
  }, []);

  const refreshCustomLessons = useCallback(() => {
    fetchCustomLessons().then(setCustomLessons);
  }, []);

  const handleGoHome = useCallback(() => {
    setView('home');
    setDifficulty(null);
    setCurrentLesson(null);
  }, []);

  const handleSelectDifficulty = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setView('lessons');
  }, []);

  const handleBackToHome = useCallback(() => {
    setView('home');
    setDifficulty(null);
  }, []);

  const handleBackToLessons = useCallback(() => {
    setView('lessons');
    setCurrentLesson(null);
  }, []);

  const handleSelectLesson = useCallback((lesson: Lesson) => {
    setCurrentLesson(lesson);
    setReturnView('lessons');
    setView('player');
  }, []);

  const handleViewLessonHistory = useCallback((lesson: Lesson) => {
    setCurrentLesson(lesson);
    setView('lessonHistory');
  }, []);

  const handleStartFromHistory = useCallback((lesson: Lesson) => {
    setCurrentLesson(lesson);
    setReturnView('history');
    setView('player');
  }, []);

  const handleBackToHistory = useCallback(() => {
    setView('history');
    setCurrentLesson(null);
  }, []);

  const handleGoCustom = useCallback(() => {
    setView('custom');
  }, []);

  const handleGoHistory = useCallback(() => {
    setView('history');
  }, []);

  const handleStartCustom = useCallback((lesson: Lesson) => {
    setDifficulty(lesson.difficulty);
    setCurrentLesson(lesson);
    setView('player');
  }, []);

  const playerBack = returnView === 'history' ? handleGoHistory : handleBackToLessons;

  if (view === 'player' && currentLesson) {
    return (
      <Layout onHome={handleGoHome} showBack onBack={playerBack}>
        <Player
          lesson={currentLesson}
          onBack={playerBack}
          onSelectLesson={handleSelectLesson}
        />
      </Layout>
    );
  }

  if (view === 'custom') {
    return (
      <Layout onHome={handleGoHome} showBack={false}>
        <CustomLessonForm onBack={handleGoHome} onStart={handleStartCustom} />
      </Layout>
    );
  }

  if (view === 'history') {
    return (
      <Layout onHome={handleGoHome} showBack onBack={handleGoHome}>
        <HistoryPanel onSelectLesson={handleViewLessonHistory} />
      </Layout>
    );
  }

  if (view === 'lessonHistory' && currentLesson) {
    return (
      <Layout onHome={handleGoHome} showBack onBack={handleBackToHistory}>
        <LessonHistoryPanel
          lesson={currentLesson}
          onStartPractice={handleStartFromHistory}
        />
      </Layout>
    );
  }

  if (view === 'lessons' && difficulty) {
    const filteredCustom = customLessons.filter((l) => l.difficulty === difficulty);
    const allLessons = [...getLessonsByDifficulty(difficulty), ...filteredCustom];
    return (
      <Layout onHome={handleGoHome} showBack={false}>
        <LessonList
          difficulty={difficulty}
          lessons={allLessons}
          onSelect={handleSelectLesson}
          onBack={handleBackToHome}
          onDeleteLesson={refreshCustomLessons}
        />
      </Layout>
    );
  }

  const tiers: { d: Difficulty; title: string; desc: string; color: string }[] = [
    {
      d: 'daily',
      title: 'Daily Life',
      desc: 'Slow speed, clear pronunciation. Short everyday sentences to build confidence.',
      color: 'hover:border-emerald-500/50',
    },
    {
      d: 'campus',
      title: 'Campus Life',
      desc: 'Medium speed with connected speech. Navigate university conversations with ease.',
      color: 'hover:border-amber-500/50',
    },
    {
      d: 'academic',
      title: 'Academic Lectures',
      desc: 'Natural speed with academic vocabulary. Prepare for real lecture scenarios at Monash.',
      color: 'hover:border-violet-500/50',
    },
  ];

  const completedByTier = (d: Difficulty) => {
    const builtIn = getLessonsByDifficulty(d).filter((l) => progress[l.id]).length;
    const custom = customLessons.filter((l) => l.difficulty === d && progress[l.id]).length;
    return builtIn + custom;
  };

  const totalByTier = (d: Difficulty) =>
    getLessonsByDifficulty(d).length + customLessons.filter((l) => l.difficulty === d).length;

  return (
    <Layout onHome={handleGoHome} showBack={false}>
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-5xl font-extrabold tracking-tight">
          <span className="text-gradient-brand">Academic Listening</span>
        </h1>
        <p className="text-aurora-muted text-lg font-light">
          Listening training for Monash University preparation
          <span className="mx-3 text-aurora-border">|</span>
          IELTS 6.0 &rarr; Lecture-ready
        </p>
      </div>

      <div className="space-y-4">
        {tiers.map((tier, i) => (
          <div key={tier.d} className={`animate-fade-in-up stagger-${i + 1}`}>
            <DifficultyCard
              difficulty={tier.d}
              title={tier.title}
              description={tier.desc}
              color={tier.color}
              lessonCount={totalByTier(tier.d)}
              completedCount={completedByTier(tier.d)}
              onClick={() => handleSelectDifficulty(tier.d)}
            />
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl glass p-6 text-center animate-fade-in-up stagger-4">
        <div className="text-xs font-semibold tracking-[0.2em] text-aurora-muted uppercase">
          How it Works
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="rounded-xl glass p-5 text-left">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-violet/15 text-lg">
                <svg className="h-5 w-5 text-aurora-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Dictogloss Method</div>
                <div className="text-xs text-aurora-muted">Listen, take notes, reconstruct from memory</div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-aurora-muted">
              Proven to improve both listening comprehension and language production. You hear the audio twice, take keyword notes, then write the full text from memory.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3 animate-fade-in-up stagger-5">
        <button
          onClick={handleGoHistory}
          className="w-full rounded-xl glass border-glow-emerald py-3.5 text-sm font-semibold text-aurora-emerald transition-all duration-300 hover:glow-emerald hover:text-emerald-300 active:scale-[0.98]"
        >
          Practice History
        </button>
        <button
          onClick={handleGoCustom}
          className="w-full rounded-xl bg-gradient-to-r from-aurora-violet/20 to-aurora-magenta/10 border border-aurora-violet/30 py-3.5 text-sm font-semibold text-aurora-violet transition-all duration-300 hover:from-aurora-violet/30 hover:to-aurora-magenta/20 hover:border-aurora-violet/50 hover:glow-violet active:scale-[0.98]"
        >
          + Create Custom Lesson
        </button>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <AppContent />
      </ProgressProvider>
    </AuthProvider>
  );
}
