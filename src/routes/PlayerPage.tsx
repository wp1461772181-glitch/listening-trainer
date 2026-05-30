import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Lesson, SentencePracticeInfo, LessonSentence } from '../types';
import { apiGetLesson, apiGetSentence, apiCompletePractice } from '../lib/api';
import ClozeRenderer from '../components/ClozeRenderer';
import Card from './ui/Card';

interface SentenceAnswer {
  sentenceId: number;
  sentenceText: string;
  userAnswer: string;
  score: number;
  blanks: any[];
}

export default function PlayerPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentIdxRef = useRef(0);
  const [sentenceInfo, setSentenceInfo] = useState<SentencePracticeInfo | null>(null);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [sentenceResult, setSentenceResult] = useState<{ score: number; blanks: any[] } | null>(null);
  const [answers, setAnswers] = useState<SentenceAnswer[]>([]);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load lesson metadata
  useEffect(() => {
    if (!lessonId) return;
    apiGetLesson(Number(lessonId))
      .then((l) => {
        console.log('[player] lesson loaded:', l?.status, 'sentences:', l?.sentences?.length);
        setLesson(l);
        if (l.status !== 'ready') {
          setLoading(false);
          return;
        }
  // Load first sentence
        loadSentence(0, () => {
          currentIdxRef.current = 0;
        });
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  const loadSentence = useCallback((idx: number, onDone?: () => void) => {
    if (!lessonId) return;
    apiGetSentence(Number(lessonId), idx)
      .then((info) => {
        console.log('[player] sentence info received:', info);
        setLoading(false);
        // Skip sentences with no blanks - auto-advance to next sentence
        if (info.blanks.length === 0) {
          if (idx + 1 < info.totalSentences) {
            console.log('[player] skipping sentence', idx, '- no blanks');
            loadSentence(idx + 1);
            return;
          } else {
            // No more sentences with blanks, finish
            console.log('[player] no more sentences with blanks, finishing');
            handleSubmit();
            return;
          }
        }
        setSentenceInfo(info);
        setUserInputs(info.blanks.map(() => ''));
        setSentenceResult(null);
        onDone?.();
      })
      .catch((err) => {
        console.error('[player] loadSentence error:', err);
        setLoading(false);
      });
  }, [lessonId]);

  function playAudio() {
    if (!sentenceInfo?.audioPath || !audioRef.current) return;
    audioRef.current.src = sentenceInfo.audioPath;
    audioRef.current.play().catch(() => {});
  }

  // Auto-play audio when sentence loads
  useEffect(() => {
    if (sentenceInfo && !completed) {
      const timer = setTimeout(() => playAudio(), 300);
      return () => clearTimeout(timer);
    }
  }, [sentenceInfo, completed]);

  function handleCheck() {
    if (!sentenceInfo || sentenceInfo.blanks.length === 0) return;

    // Allow check even if no inputs filled, as long as there are blanks
    const filledInputs = userInputs.filter(v => v.trim() !== '');
    if (filledInputs.length === 0 && sentenceInfo.blanks.length > 0) {
      // Auto-fill empty strings so check can proceed (will show all wrong)
    }

    // Compute score locally
    let correct = 0;
    const blankResults = sentenceInfo.blanks.map((blank, i) => {
      const userWord = userInputs[i]?.trim() || '';
      const isCorrect = userWord.toLowerCase() === blank.word.toLowerCase();
      if (isCorrect) correct++;
      return { word: blank.word, correct: isCorrect, userAnswer: userWord };
    });

    const score = sentenceInfo.blanks.length === 0 ? 100 : Math.round((correct / sentenceInfo.blanks.length) * 100);
    setSentenceResult({ score, blanks: blankResults });

    // Store answer
    setAnswers(prev => [...prev, {
      sentenceId: sentenceInfo.sentenceId,
      sentenceText: sentenceInfo.blanks.reduce((text, blank, i) => {
        // Simple: just store the full sentence text
        return '';
      }, ''),
      userAnswer: userInputs.join(' '),
      score,
      blanks: blankResults,
    }]);
  }

  function handleNext() {
    if (!sentenceInfo) return;
    const newIdx = currentIdxRef.current + 1;
    if (newIdx >= sentenceInfo.totalSentences) {
      // Complete practice
      handleSubmit();
    } else {
      setCurrentIdx(newIdx);
      currentIdxRef.current = newIdx;
      loadSentence(newIdx);
    }
  }

  async function handleSubmit() {
    if (!lessonId || answers.length === 0) return;
    setSubmitting(true);
    try {
      // Enrich answers with sentence text from blanks
      const enrichedAnswers = answers.map(a => ({
        ...a,
        sentenceText: sentenceInfo?.blanks?.map(b => b.word).join(' ') || '',
      }));
      const resp = await apiCompletePractice(Number(lessonId), enrichedAnswers);
      setRecordId(resp.recordId);
      setFinalScore(resp.score);
      setCompleted(true);
    } catch (e) {
      alert('Failed to save practice: ' + (e as Error).message);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="rounded-xl border border-border bg-surface py-16 text-center">
        <p className="text-sm text-text-secondary">Lesson not found.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (lesson.status !== 'ready') {
    return (
      <div className="rounded-xl border border-border bg-surface py-16 text-center">
        <p className="text-sm text-text-secondary">
          This lesson is {lesson.status}. Please wait for audio generation or continue editing.
        </p>
        <button
          onClick={() => navigate('/lessons')}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all"
        >
          Back to Lessons
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl font-bold text-primary">{finalScore}</span>
          </div>
          <h2 className="text-xl font-bold text-text">Practice Complete!</h2>
          <p className="mt-2 text-sm text-text-secondary">
            You answered {answers.length} sentences in "{lesson.title}".
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {recordId && (
              <button
                onClick={() => navigate(`/history/${recordId}/review`)}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-all"
              >
                Review Answers
              </button>
            )}
            <button
              onClick={() => navigate('/lessons')}
              className="rounded-xl border border-border bg-bg px-6 py-2.5 text-sm font-semibold text-text hover:border-primary/50 hover:text-primary transition-all"
            >
              Back to Lessons
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!sentenceInfo) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  const progress = ((currentIdxRef.current + 1) / sentenceInfo.totalSentences) * 100;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/lessons')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          &larr; Back
        </button>
        <div className="text-sm font-semibold text-text">{lesson.title}</div>
        <div className="text-sm text-text-secondary">
          {currentIdxRef.current + 1} / {sentenceInfo.totalSentences}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Audio button */}
      <div className="flex justify-center">
        <button
          onClick={playAudio}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover transition-all"
        >
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

      {/* Sentence with blanks */}
      <Card className="p-6">
        <ClozeRenderer
          text={sentenceInfo.sentenceText}
          blanks={sentenceInfo.blanks}
          onAnswersChange={setUserInputs}
        />
      </Card>

      {/* Result feedback */}
      {sentenceResult && (
        <Card className={`p-4 text-center ${sentenceResult.score >= 80 ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'}`}>
          <div className={`text-2xl font-bold ${sentenceResult.score >= 80 ? 'text-success' : 'text-error'}`}>
            {sentenceResult.score}%
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {sentenceResult.blanks.map((b, i) => (
              <span
                key={i}
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  b.correct
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'
                }`}
              >
                {b.correct ? b.userAnswer : `${b.userAnswer} → ${b.word}`}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!sentenceResult ? (
          <button
            onClick={handleCheck}
            disabled={userInputs.every(v => v.trim() === '')}
            className="flex-1 rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Check Answers
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                const prevIdx = Math.max(0, currentIdxRef.current - 1);
                setCurrentIdx(prevIdx);
                currentIdxRef.current = prevIdx;
                loadSentence(prevIdx);
                setAnswers(prev => prev.slice(0, -1));
                setSentenceResult(null);
              }}
              disabled={currentIdxRef.current === 0}
              className="rounded-xl border border-border bg-bg px-6 py-3 font-semibold text-text hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="flex-1 rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover transition-all"
            >
              {currentIdxRef.current + 1 >= sentenceInfo.totalSentences ? 'Finish' : 'Next Sentence'}
            </button>
          </>
        )}
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {submitting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <Card className="p-6 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin mx-auto" />
            <p className="mt-3 text-sm text-text-secondary">Saving your answers...</p>
          </Card>
        </div>
      )}
    </div>
  );
}
