import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGetReviewDetail, type PracticeRecordEntry } from '../lib/api';
import type { ReviewDetail, ReviewSentenceDetail } from '../types';
import Card from './ui/Card';

export default function HistoryDetailPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSentence, setExpandedSentence] = useState<number | null>(null);

  useEffect(() => {
    if (!recordId) return;
    apiGetReviewDetail(Number(recordId))
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [recordId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-xl border border-border bg-surface py-16 text-center">
        <p className="text-sm text-text-secondary">Practice record not found.</p>
        <button
          onClick={() => navigate('/history')}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all"
        >
          Back to History
        </button>
      </div>
    );
  }

  const scoreColor = detail.score >= 80 ? 'text-success' : detail.score >= 60 ? 'text-warning' : 'text-error';
  const scoreLabel = detail.score >= 80 ? 'Great job!' : detail.score >= 60 ? 'Good effort!' : 'Keep trying!';

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/history')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-text tracking-tight">{detail.lessonTitle}</h2>
          <p className="text-xs text-text-secondary">{formatDate(detail.completedAt)}</p>
        </div>
      </div>

      {/* Score card */}
      <Card className="p-5">
        <div className="flex items-center gap-5">
          <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${
            detail.score >= 80 ? 'bg-success/10' : detail.score >= 60 ? 'bg-warning/10' : 'bg-error/10'
          }`}>
            <span className={`text-3xl font-extrabold tracking-tight ${scoreColor}`}>
              {detail.score}%
            </span>
          </div>
          <div>
            <div className={`text-xl font-bold ${scoreColor}`}>{scoreLabel}</div>
            <div className="mt-1 text-xs text-text-secondary">
              {detail.sentences.length} sentences practiced
            </div>
          </div>
        </div>
      </Card>

      {/* Sentence results */}
      <div className="space-y-2">
        {detail.sentences.map((sentence, idx) => (
          <div key={sentence.sentenceId}>
            <button
              onClick={() => setExpandedSentence(prev => prev === idx ? null : idx)}
              className="flex items-center gap-3 w-full text-left rounded-xl border border-border bg-surface px-4 py-3 hover:shadow-md transition-all"
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                getSentenceScore(sentence) === 100 ? 'bg-success/20 text-success' :
                getSentenceScore(sentence) >= 50 ? 'bg-warning/20 text-warning' :
                'bg-error/20 text-error'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-secondary truncate">
                  {sentence.sentenceText}
                </div>
              </div>
              <div className={`text-sm font-bold ${
                getSentenceScore(sentence) === 100 ? 'text-success' :
                getSentenceScore(sentence) >= 50 ? 'text-warning' :
                'text-error'
              }`}>
                {getSentenceScore(sentence)}%
              </div>
              <svg className={`h-4 w-4 text-text-tertiary transition-transform ${expandedSentence === idx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSentence === idx && (
              <div className="ml-5 mt-2 rounded-xl border border-border bg-surface p-4 animate-fade-in">
                {/* Correct answer display */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-text-secondary mb-1">Correct Sentence:</div>
                  <div className="text-sm text-text leading-relaxed">
                    {renderSentenceWithBlanks(sentence, true)}
                  </div>
                </div>

                {/* User's answers */}
                <div>
                  <div className="text-xs font-semibold text-text-secondary mb-1">Your Answers:</div>
                  <div className="flex flex-wrap gap-2">
                    {sentence.blanks.map((blank, bi) => (
                      <span
                        key={bi}
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                          blank.correct
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error'
                        }`}
                      >
                        {blank.correct ? (
                          <>{blank.word}</>
                        ) : (
                          <>{blank.userAnswer || '(empty)'} → {blank.word}</>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getSentenceScore(sentence: ReviewSentenceDetail): number {
  if (sentence.blanks.length === 0) return 100;
  const correct = sentence.blanks.filter(b => b.correct).length;
  return Math.round((correct / sentence.blanks.length) * 100);
}

function renderSentenceWithBlanks(sentence: ReviewSentenceDetail, showCorrect: boolean): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let offset = 0;

  for (let i = 0; i < sentence.blanks.length; i++) {
    const blank = sentence.blanks[i];
    if (blank.position > offset) {
      parts.push(sentence.sentenceText.slice(offset, blank.position));
    }

    if (showCorrect) {
      parts.push(
        <span key={i} className="inline-block min-w-[60px] border-b-2 border-primary bg-primary/5 px-1 text-center font-semibold text-primary">
          {blank.word}
        </span>
      );
    } else {
      parts.push(
        <span key={i} className={`inline-block min-w-[60px] border-b-2 px-1 text-center font-semibold ${
          blank.correct ? 'border-success/30 text-success' : 'border-error/30 text-error'
        }`}>
          {blank.correct ? blank.userAnswer : blank.word}
        </span>
      );
    }

    offset = blank.position + blank.length;
  }

  if (offset < sentence.sentenceText.length) {
    parts.push(sentence.sentenceText.slice(offset));
  }

  return <>{parts}</>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
