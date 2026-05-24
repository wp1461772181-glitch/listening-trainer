import { useState, useRef, useCallback, useEffect } from 'react';
import type { Lesson } from '../types';
import { useProgress } from '../context/ProgressContext';
import { compareTexts, calculateScore, type DiffToken } from '../utils/compare';
import { getNextLessonId, getLessonById } from '../data/lessons';
import AudioControls from './AudioControls';
import InputArea from './InputArea';
import ResultPanel from './ResultPanel';

interface PlayerProps {
  lesson: Lesson;
  onBack: () => void;
  onSelectLesson: (lesson: Lesson) => void;
}

export default function Player({ lesson, onBack, onSelectLesson }: PlayerProps) {
  const { saveLesson } = useProgress();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [diff, setDiff] = useState<DiffToken[]>([]);
  const [score, setScore] = useState(0);
  const [listenCount, setListenCount] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setUserInput('');
    setSubmitted(false);
    setRevealed(false);
    setDiff([]);
    setScore(0);
    setListenCount(0);
    setShowHint(false);
    setIsPlaying(false);
  }, [lesson.id]);

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleReplay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    setIsPlaying(true);
    setListenCount((c) => c + 1);
  }, []);

  const handleChangeSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25];
    const idx = speeds.indexOf(speed);
    const next = speeds[(idx + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  }, [speed]);

  const handleSubmit = useCallback(() => {
    const result = compareTexts(lesson.sentence, userInput);
    const s = calculateScore(result);
    setDiff(result);
    setScore(s);
    setSubmitted(true);
    setIsPlaying(false);
    audioRef.current?.pause();
    saveLesson(lesson.id, s);
  }, [lesson, userInput, saveLesson]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleRetry = useCallback(() => {
    setUserInput('');
    setSubmitted(false);
    setRevealed(false);
    setDiff([]);
    setScore(0);
  }, []);

  const handleNext = useCallback(() => {
    const nextId = getNextLessonId(lesson.id);
    if (nextId) {
      const next = getLessonById(nextId);
      if (next) onSelectLesson(next);
    }
  }, [lesson.id, onSelectLesson]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const nextId = getNextLessonId(lesson.id);

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={lesson.audioPath}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Lesson header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
          <div className="text-xs text-slate-500">
            {tierLabel(lesson.difficulty)} &middot; Listen count: {listenCount}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
        <AudioControls
          isPlaying={isPlaying}
          speed={speed}
          onTogglePlay={handleTogglePlay}
          onReplay={handleReplay}
          onChangeSpeed={handleChangeSpeed}
        />
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{listenCount}</div>
          <div className="text-xs text-slate-500">plays</div>
        </div>
      </div>

      {/* Hint */}
      {!submitted && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-sm text-slate-500 hover:text-amber-400 transition-colors"
        >
          {showHint ? lesson.hint : 'Show hint'}
        </button>
      )}

      {/* Input or Result */}
      {!submitted ? (
        <InputArea
          value={userInput}
          onChange={setUserInput}
          onSubmit={handleSubmit}
          disabled={false}
        />
      ) : (
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

function tierLabel(d: string): string {
  switch (d) {
    case 'daily': return 'Daily Life';
    case 'campus': return 'Campus Life';
    case 'academic': return 'Academic Lecture';
    default: return '';
  }
}
