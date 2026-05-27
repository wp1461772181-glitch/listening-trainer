import { useState, useEffect } from 'react';
import { apiGetProgressDetail, type PracticeDetail } from '../lib/api';
import type { DiffToken } from '../utils/compare';
import Badge from './ui/Badge';
import Card from './ui/Card';

const stageLabels = ['1. Prepare', '2. First Listen', '3. Take Notes', '4. Reconstruct', '5. Result'];

export default function HistoryDetailPanel({ progressId, onBack }: HistoryDetailPanelProps) {
  const [detail, setDetail] = useState<PracticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'reconstruction' | 'comparison'>('overview');

  useEffect(() => {
    apiGetProgressDetail(progressId)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [progressId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
        <div className="text-sm text-text-secondary">Loading details...</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm text-text-secondary">Detail not found.</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg border border-border bg-surface px-6 py-2 text-sm text-text hover:bg-bg-alt transition-all"
        >
          Go Back
        </button>
      </Card>
    );
  }

  let diff: DiffToken[] = [];
  try {
    if (detail.diffJson) diff = JSON.parse(detail.diffJson);
  } catch {}

  const grade = detail.score >= 80 ? 'great' : detail.score >= 50 ? 'good' : 'keep';
  const gradeConfig = {
    great: { label: 'Great job!', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
    good: { label: 'Good effort!', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
    keep: { label: 'Keep trying!', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20' },
  }[grade];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-text tracking-tight">Practice Detail</h2>
          <p className="text-xs text-text-secondary">{detail.createdAt}</p>
        </div>
      </div>

      {/* Score card */}
      <Card className={`flex items-center gap-5 p-5 ${gradeConfig.border}`}>
        <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${gradeConfig.bg}`}>
          <span className={`text-3xl font-extrabold tracking-tight ${gradeConfig.color}`}>
            {detail.score}%
          </span>
        </div>
        <div>
          <div className={`text-xl font-bold ${gradeConfig.color}`}>{gradeConfig.label}</div>
          <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
            <span>Played {detail.listenCount} times</span>
            {diff.length > 0 && (
              <>
                <span className="text-text-tertiary">&middot;</span>
                <span>{diff.filter((d) => d.status === 'correct').length} of {diff.length} words correct</span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Tab bar */}
      <div className="flex rounded-lg border border-border bg-surface p-1 gap-1">
        {(['overview', 'notes', 'reconstruction', 'comparison'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {{ overview: 'Overview', notes: 'Notes', reconstruction: 'Reconstruct', comparison: 'Comparison' }[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-3 animate-fade-in">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-text">Practice Process</h3>
            <div className="space-y-3">
              {stageLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 4 ? 'bg-primary text-white' : 'bg-bg-alt text-text-tertiary'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-sm text-text">{label}</span>
                  {i < 4 && <div className="ml-3 h-6 w-0.5 rounded bg-border" />}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-text">Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-primary-surface p-3 text-center">
                <div className="text-2xl font-bold text-primary">{detail.listenCount}</div>
                <div className="text-xs text-text-secondary">Audio Plays</div>
              </div>
              <div className="rounded-lg bg-success/5 p-3 text-center">
                <div className="text-2xl font-bold text-success">{detail.score}%</div>
                <div className="text-xs text-text-secondary">Final Score</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'notes' && (
        <Card className="p-5 animate-fade-in">
          <h3 className="mb-3 text-sm font-semibold text-warning">Your Keyword Notes</h3>
          {detail.keywords ? (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.keywords}</p>
            </div>
          ) : (
            <p className="text-sm text-text-secondary italic">No notes were taken.</p>
          )}
        </Card>
      )}

      {activeTab === 'reconstruction' && (
        <Card className="p-5 animate-fade-in">
          <h3 className="mb-3 text-sm font-semibold text-primary">Your Reconstruction</h3>
          {detail.reconstruction ? (
            <div className="rounded-lg border border-primary/20 bg-primary-surface/30 p-4">
              <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">{detail.reconstruction}</p>
            </div>
          ) : (
            <p className="text-sm text-text-secondary italic">No reconstruction text.</p>
          )}
        </Card>
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-4 animate-fade-in">
          {diff.length > 0 ? (
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-text">Word-by-Word Comparison</h3>
              <div className="flex flex-wrap gap-x-2 gap-y-1.5">
                {diff.map((token, i) => (
                  <Badge
                    key={i}
                    variant={
                      token.status === 'correct' ? 'success'
                      : token.status === 'wrong' ? 'error'
                      : token.status === 'missing' ? 'warning'
                      : 'default'
                    }
                  >
                    {token.word}
                  </Badge>
                ))}
              </div>
              <div className="mt-5 flex gap-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-success/50" /> Correct
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-error/50" /> Wrong
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-warning/50" /> Missing
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-border" /> Extra
                </span>
              </div>
            </Card>
          ) : (
            <Card className="p-5 text-center">
              <p className="text-sm text-text-secondary">No comparison data available.</p>
            </Card>
          )}

          {detail.reconstruction && diff.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-text">Side by Side</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs font-semibold text-success">Your Input</div>
                  <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                    <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">
                      {detail.reconstruction}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-warning">Expected</div>
                  <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">
                      {diff
                        .filter((d) => d.status !== 'extra')
                        .map((d) => d.word)
                        .join(' ') || '(see word comparison above)'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

interface HistoryDetailPanelProps {
  progressId: number;
  onBack: () => void;
}
