import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ReviewDetail, ReviewSentenceDetail } from '../types';
import { apiGetReviewDetail } from '../lib/api';
import OriginalTextPanel from '../components/OriginalTextPanel';
import AnswerPanel from '../components/AnswerPanel';
import Card from './ui/Card';

export default function ReviewPage() {
  const navigate = useNavigate();
  const { recordId } = useParams<{ recordId: string }>();
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSentenceId, setActiveSentenceId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!recordId) return;
    apiGetReviewDetail(Number(recordId))
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [recordId]);

  function playAudio(sentence: ReviewSentenceDetail) {
    setActiveSentenceId(sentence.sentenceId);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = sentence.audioPath;
      audioRef.current.play().catch(() => {});
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-text-secondary">Review not found.</p>
        <button
          onClick={() => navigate('/history')}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm text-text hover:border-primary/50 hover:text-primary transition-all"
        >
          Back to History
        </button>
      </div>
    );
  }

  const totalBlanks = detail.sentences.reduce((sum, s) => sum + s.blanks.length, 0);
  const correctBlanks = detail.sentences.reduce(
    (sum, s) => sum + s.blanks.filter(b => b.correct).length,
    0
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <button
        onClick={() => navigate('/history')}
        className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
      >
        &larr; Back to History
      </button>

      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text">{detail.lessonTitle}</h2>
            <p className="text-xs text-text-secondary">
              Completed: {new Date(detail.completedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{detail.score}</div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{correctBlanks}/{totalBlanks}</div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">Correct</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Two-column layout */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <OriginalTextPanel
            sentences={detail.sentences}
            activeSentenceId={activeSentenceId}
            onSentenceClick={(id) => {
              const s = detail.sentences.find(s => s.sentenceId === id);
              if (s) playAudio(s);
            }}
          />
        </Card>
        <Card className="p-4">
          <AnswerPanel
            sentences={detail.sentences}
            activeSentenceId={activeSentenceId}
            onSentenceClick={(id) => {
              const s = detail.sentences.find(s => s.sentenceId === id);
              if (s) playAudio(s);
            }}
          />
        </Card>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setActiveSentenceId(null)} />
    </div>
  );
}
