import { useState, useCallback } from 'react';
import type { Difficulty, Lesson, View } from './types';
import { getLessonsByDifficulty } from './data/lessons';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import Layout from './components/Layout';
import DifficultyCard from './components/DifficultyCard';
import LessonList from './components/LessonList';
import Player from './components/Player';

function AppContent() {
  const [view, setView] = useState<View>('home');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const { progress } = useProgress();

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
    setView('player');
  }, []);

  if (view === 'player' && currentLesson) {
    return (
      <Layout onHome={handleGoHome} showBack onBack={handleBackToLessons}>
        <Player
          lesson={currentLesson}
          onBack={handleBackToLessons}
          onSelectLesson={handleSelectLesson}
        />
      </Layout>
    );
  }

  if (view === 'lessons' && difficulty) {
    return (
      <Layout onHome={handleGoHome} showBack={false}>
        <LessonList
          difficulty={difficulty}
          lessons={getLessonsByDifficulty(difficulty)}
          onSelect={handleSelectLesson}
          onBack={handleBackToHome}
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

  const completedByTier = (d: Difficulty) =>
    getLessonsByDifficulty(d).filter((l) => progress[l.id]).length;

  return (
    <Layout onHome={handleGoHome} showBack={false}>
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-4xl font-bold text-white tracking-tight">
          Academic Listening
        </h1>
        <p className="text-slate-400">
          Dictation training for Monash University preparation
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
            lessonCount={getLessonsByDifficulty(tier.d).length}
            completedCount={completedByTier(tier.d)}
            onClick={() => handleSelectDifficulty(tier.d)}
          />
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <div className="text-sm text-slate-500">HOW IT WORKS</div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <div className="mb-1 text-2xl">🎧</div>
            <div className="text-sm font-medium text-white">Listen</div>
            <div className="text-xs text-slate-500">Play the audio as many times as you need</div>
          </div>
          <div>
            <div className="mb-1 text-2xl">⌨️</div>
            <div className="text-sm font-medium text-white">Type</div>
            <div className="text-xs text-slate-500">Write down exactly what you heard</div>
          </div>
          <div>
            <div className="mb-1 text-2xl">✅</div>
            <div className="text-sm font-medium text-white">Compare</div>
            <div className="text-xs text-slate-500">See your mistakes and improve</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <AppContent />
    </ProgressProvider>
  );
}
