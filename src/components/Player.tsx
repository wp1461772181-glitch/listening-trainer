import { useState, useRef, useCallback, useEffect } from 'react';
import type { Lesson } from '../types';
import { useProgress } from '../context/ProgressContext';
import { compareTexts, calculateScore, type DiffToken } from '../utils/compare';
import { getNextLessonId, getLessonById } from '../data/lessons';
import AudioControls from './AudioControls';
import ResultPanel from './ResultPanel';

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
  const audioSrc = lesson.audioPath || `/api/tts?text=${encodeURIComponent(lesson.sentence)}&voice=${lesson.voice || 'female'}`;

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
    setAudioReady(false);
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
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-aurora-muted hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{lesson.title}</h2>
          <div className="flex items-center gap-2 text-xs text-aurora-violet">
            <span className="font-medium">Dictogloss</span>
            <span className="text-aurora-border">·</span>
            <span>{tierLabel(lesson.difficulty)}</span>
          </div>
        </div>
      </div>

      {/* Stage indicator */}
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                i < stageIdx
                  ? 'bg-aurora-emerald text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : i === stageIdx
                  ? 'bg-aurora-violet text-white animate-stage-pulse'
                  : 'bg-aurora-border/40 text-aurora-muted'
              }`}
            >
              {i + 1}
            </div>
            {i < 4 && (
              <div className={`h-0.5 w-3 rounded-full transition-all duration-500 ${i < stageIdx ? 'bg-aurora-emerald' : 'bg-aurora-border/40'}`} />
            )}
          </div>
        ))}
        <span className="ml-2 text-xs font-medium text-aurora-muted">{stageLabels[stage]}</span>
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
    <div className="space-y-6 rounded-2xl glass p-6 animate-fade-in-up">
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">Prepare to Listen</h3>
        <p className="mt-2 text-sm leading-relaxed text-aurora-muted">
          You will hear the audio <strong className="text-white font-semibold">twice</strong>.
          First, just listen without writing anything.
          Then, take keyword notes while listening a second time.
          Finally, reconstruct the full text <strong className="text-white font-semibold">from memory</strong>.
        </p>
      </div>

      <div className="rounded-xl bg-aurora-violet/5 border border-aurora-violet/10 p-4">
        <h4 className="mb-1.5 text-sm font-semibold text-aurora-text">Topic</h4>
        <p className="text-sm text-aurora-muted">{lesson.hint}</p>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-aurora-text">Key vocabulary to listen for</h4>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="rounded-full border border-aurora-violet/25 bg-aurora-violet/10 px-3.5 py-1.5 text-sm font-medium text-aurora-violet"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        disabled={!audioReady}
        className="w-full rounded-xl bg-gradient-to-r from-aurora-violet to-violet-600 py-3.5 font-semibold text-white transition-all duration-300 hover:glow-violet active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {audioReady ? 'Start Listening' : 'Preparing audio...'}
      </button>
    </div>
  );
}

function ListenStage({ stage, keywords, onChangeKeywords, isPlaying, speed, listenCount, onTogglePlay, onReplay, onChangeSpeed, onNext }: {
  stage: 'listen1' | 'listen2';
  keywords: string;
  onChangeKeywords: (v: string) => void;
  isPlaying: boolean;
  speed: number;
  listenCount: number;
  onTogglePlay: () => void;
  onReplay: () => void;
  onChangeSpeed: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between rounded-2xl glass p-5">
        <AudioControls
          isPlaying={isPlaying}
          speed={speed}
          onTogglePlay={onTogglePlay}
          onReplay={onReplay}
          onChangeSpeed={onChangeSpeed}
        />
        <div className="text-center">
          <div className="text-2xl font-extrabold text-white tabular-nums">{listenCount}</div>
          <div className="text-xs text-aurora-muted font-medium">plays</div>
        </div>
      </div>

      {stage === 'listen1' ? (
        <div className="rounded-2xl glass border-dashed border-aurora-violet/20 p-10 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-aurora-violet/10">
              <svg className="h-8 w-8 text-aurora-violet/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          <p className="text-aurora-text font-medium">Just listen. Do not write anything.</p>
          <p className="mt-1.5 text-sm text-aurora-muted">Focus on understanding the overall meaning.</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 rounded-xl border border-aurora-amber/20 bg-aurora-amber/5 p-4 text-center">
            <p className="text-sm font-medium text-aurora-amber">Take keyword notes while you listen. Write down important words only — not the full text.</p>
          </div>
          <textarea
            value={keywords}
            onChange={(e) => onChangeKeywords(e.target.value)}
            placeholder="Type keywords as you listen...&#10;e.g., mitochondria, energy, ATP, oxidative"
            rows={5}
            className="w-full resize-none rounded-xl border border-aurora-border bg-aurora-surface/60 p-4 text-sm leading-relaxed text-aurora-text placeholder:text-aurora-muted/50 focus:border-aurora-amber/50 focus:outline-none focus:ring-2 focus:ring-aurora-amber/10 transition-all"
            autoFocus
          />
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-gradient-to-r from-aurora-violet to-violet-600 py-3.5 font-semibold text-white transition-all duration-300 hover:glow-violet active:scale-[0.98]"
      >
        {stage === 'listen1' ? "I've Listened — Take Notes Now" : "I'm Done — Reconstruct from Memory"}
      </button>
    </div>
  );
}

function ReconstructStage({ keywords, value, onChange, onSubmit, onReplayAudio, isPlaying, speed, onTogglePlay, onChangeSpeed }: {
  keywords: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onReplayAudio: () => void;
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onChangeSpeed: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Mini audio bar */}
      <div className="flex items-center gap-3 rounded-xl glass px-4 py-2.5">
        <button
          onClick={onTogglePlay}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
            isPlaying
              ? 'bg-aurora-amber text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'bg-aurora-border/40 text-aurora-muted hover:bg-aurora-border hover:text-white'
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
          className="flex h-9 w-9 items-center justify-center rounded-full border border-aurora-border text-aurora-muted hover:text-aurora-violet hover:border-aurora-violet/50 transition-all duration-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={onChangeSpeed}
          className="rounded-md border border-aurora-border px-2.5 py-1 text-xs font-medium text-aurora-muted hover:text-aurora-violet hover:border-aurora-violet/50 transition-all duration-200"
        >
          {speed}x
        </button>
        <span className="ml-auto text-xs text-aurora-muted">Replay if needed</span>
      </div>

      {/* Your notes */}
      {keywords.trim() && (
        <div className="rounded-xl border border-aurora-amber/20 bg-aurora-amber/5 p-4">
          <div className="mb-1.5 text-xs font-semibold text-aurora-amber uppercase tracking-wider">Your Notes</div>
          <div className="text-sm leading-relaxed text-aurora-amber/80">{keywords}</div>
        </div>
      )}

      {/* Reconstruction textarea */}
      <div>
        <div className="mb-2 text-sm font-semibold text-aurora-text">
          Reconstruct the full text from memory
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write the complete text you heard, using your notes to help you remember..."
          rows={8}
          className="w-full resize-none rounded-xl border border-aurora-border bg-aurora-surface/60 p-4 text-sm leading-relaxed text-aurora-text placeholder:text-aurora-muted/50 focus:border-aurora-violet/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/10 transition-all"
          autoFocus
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="w-full rounded-xl bg-gradient-to-r from-aurora-violet to-violet-600 py-3.5 font-semibold text-white transition-all duration-300 hover:glow-violet active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Submit & Compare
      </button>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

const stages: DGStage[] = ['prep', 'listen1', 'listen2', 'reconstruct', 'result'];

const stageLabels: Record<DGStage, string> = {
  prep: 'Prepare',
  listen1: 'Listen (no writing)',
  listen2: 'Take Notes',
  reconstruct: 'Reconstruct',
  result: 'Result',
};

function tierLabel(d: string): string {
  switch (d) {
    case 'daily': return 'Daily Life';
    case 'campus': return 'Campus Life';
    case 'academic': return 'Academic Lecture';
    default: return '';
  }
}
