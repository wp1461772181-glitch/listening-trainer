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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-bold text-white tracking-tight">
              Academic Listening
            </h1>
            <p className="text-slate-400">
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
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-4xl font-bold text-white tracking-tight">
          Academic Listening
        </h1>
        <p className="text-slate-400">
          Listening training for Monash University preparation
          <span className="mx-2 text-slate-700">|</span>
          IELTS 6.0 &rarr; Lecture-ready
        </p>
      </div>

      <div className="space-y-4">
        {tiers.map((tier) => (
          <DifficultyCard
            key={tier.d}
            difficulty={tier.d}
            title={tier.title}
            description={tier.desc}
            color={tier.color}
            lessonCount={totalByTier(tier.d)}
            completedCount={completedByTier(tier.d)}
            onClick={() => handleSelectDifficulty(tier.d)}
          />
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <div className="text-sm text-slate-500">HOW IT WORKS</div>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-violet-800/30 bg-violet-900/10 p-4">
            <div className="mb-1 text-2xl">📝</div>
            <div className="text-sm font-medium text-violet-400">Dictogloss Method</div>
            <div className="mt-1 text-xs text-slate-500">Listen, take notes, then reconstruct from memory. Proven to improve both listening comprehension and language production.</div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={handleGoHistory}
          className="w-full rounded-xl border border-emerald-700/50 bg-emerald-900/20 py-3.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-900/40 hover:text-emerald-200 active:scale-[0.98]"
        >
          Practice History
        </button>
        <button
          onClick={handleGoCustom}
          className="w-full rounded-xl border border-violet-700/50 bg-violet-900/20 py-3.5 text-sm font-semibold text-violet-300 transition-all hover:bg-violet-900/40 hover:text-violet-200 active:scale-[0.98]"
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
