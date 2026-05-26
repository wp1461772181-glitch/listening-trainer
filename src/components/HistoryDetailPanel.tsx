import { useState, useEffect } from 'react';
import { apiGetProgressDetail, type PracticeDetail } from '../lib/api';
import type { DiffToken } from '../utils/compare';

interface HistoryDetailPanelProps {
  progressId: number;
  onBack: () => void;
}

const stageLabels = ['1. Prepare', '2. First Listen', '3. Take Notes', '4. Reconstruct', '5. Result'];

export default function HistoryDetailPanel({ progressId, onBack }: HistoryDetailPanelProps) {
  console.log('[HistoryDetailPanel] render with progressId:', progressId);
  const [detail, setDetail] = useState<PracticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'reconstruction' | 'comparison'>('overview');

  useEffect(() => {
    console.log('[HistoryDetailPanel] fetching detail for progressId:', progressId);
    apiGetProgressDetail(progressId)
      .then((d) => { console.log('[HistoryDetailPanel] got detail:', d); setDetail(d); })
      .catch((err) => { console.error('[HistoryDetailPanel] fetch error:', err); })
      .finally(() => setLoading(false));
  }, [progressId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-aurora-violet/30 border-t-aurora-violet animate-spin" />
        <div className="text-sm text-aurora-muted">Loading details...</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-2xl glass py-16 text-center">
        <p className="text-sm text-aurora-muted">Detail not found.</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-xl glass px-6 py-2 text-sm text-aurora-violet hover:border-aurora-violet/40 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  let diff: DiffToken[] = [];
  try {
    if (detail.diffJson) diff = JSON.parse(detail.diffJson);
  } catch {}

  const grade = detail.score >= 80 ? 'great' : detail.score >= 50 ? 'good' : 'keep';
  const gradeConfig = {
    great: { label: 'Great job!', color: 'text-aurora-emerald', ring: 'ring-aurora-emerald/30', bg: 'bg-aurora-emerald/10' },
    good: { label: 'Good effort!', color: 'text-aurora-amber', ring: 'ring-aurora-amber/30', bg: 'bg-aurora-amber/10' },
    keep: { label: 'Keep trying!', color: 'text-red-400', ring: 'ring-red-400/30', bg: 'bg-red-500/10' },
  }[grade];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-aurora-muted hover:text-white hover:bg-white/5 transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Practice Detail</h2>
          <p className="text-xs text-aurora-muted">{detail.createdAt}</p>
        </div>
      </div>

      {/* Score card */}
      <div className="flex items-center gap-5 rounded-2xl glass p-5">
        <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${gradeConfig.bg} ring-2 ${gradeConfig.ring}`}>
          <span className={`text-3xl font-extrabold tracking-tight ${gradeConfig.color}`}>
            {detail.score}%
          </span>
        </div>
        <div>
          <div className={`text-xl font-bold ${gradeConfig.color}`}>{gradeConfig.label}</div>
          <div className="mt-1 flex items-center gap-3 text-xs text-aurora-muted">
            <span>Played {detail.listenCount} times</span>
            {diff.length > 0 && (
              <>
                <span className="text-aurora-border">&middot;</span>
                <span>{diff.filter((d) => d.status === 'correct').length} of {diff.length} words correct</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex rounded-xl glass p-1 gap-1">
        {(['overview', 'notes', 'reconstruction', 'comparison'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-aurora-violet text-white'
                : 'text-aurora-muted hover:text-white'
            }`}
          >
            {{ overview: 'Overview', notes: 'Notes', reconstruction: 'Reconstruct', comparison: 'Comparison' }[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-3 animate-fade-in">
          <div className="rounded-xl glass p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Practice Process</h3>
            <div className="space-y-3">
              {stageLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 4 ? 'bg-aurora-violet text-white' : 'bg-aurora-border/30 text-aurora-muted'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-sm text-aurora-text">{label}</span>
                  {i < 4 && <div className="ml-3 h-6 w-0.5 rounded bg-aurora-border/30" />}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl glass p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-aurora-violet/5 p-3 text-center">
                <div className="text-2xl font-bold text-aurora-violet">{detail.listenCount}</div>
                <div className="text-xs text-aurora-muted">Audio Plays</div>
              </div>
              <div className="rounded-lg bg-aurora-emerald/5 p-3 text-center">
                <div className="text-2xl font-bold text-aurora-emerald">{detail.score}%</div>
                <div className="text-xs text-aurora-muted">Final Score</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="rounded-xl glass p-5 animate-fade-in">
          <h3 className="mb-3 text-sm font-semibold text-aurora-amber">Your Keyword Notes</h3>
          {detail.keywords ? (
            <div className="rounded-lg border border-aurora-amber/20 bg-aurora-amber/5 p-4">
              <p className="text-sm leading-relaxed text-aurora-amber/80 whitespace-pre-wrap">{detail.keywords}</p>
            </div>
          ) : (
            <p className="text-sm text-aurora-muted italic">No notes were taken.</p>
          )}
        </div>
      )}

      {activeTab === 'reconstruction' && (
        <div className="rounded-xl glass p-5 animate-fade-in">
          <h3 className="mb-3 text-sm font-semibold text-aurora-violet">Your Reconstruction</h3>
          {detail.reconstruction ? (
            <div className="rounded-lg border border-aurora-violet/20 bg-aurora-violet/5 p-4">
              <p className="text-sm leading-relaxed text-aurora-text whitespace-pre-wrap">{detail.reconstruction}</p>
            </div>
          ) : (
            <p className="text-sm text-aurora-muted italic">No reconstruction text.</p>
          )}
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-4 animate-fade-in">
          {diff.length > 0 ? (
            <div className="rounded-xl glass p-5">
              <h3 className="mb-4 text-sm font-semibold text-white">Word-by-Word Comparison</h3>
              <div className="flex flex-wrap gap-x-2 gap-y-1.5">
                {diff.map((token, i) => (
                  <span
                    key={i}
                    className={`rounded-md px-1.5 py-0.5 text-sm font-medium transition-all ${
                      token.status === 'correct'
                        ? 'bg-aurora-emerald/15 text-aurora-emerald'
                        : token.status === 'wrong'
                          ? 'bg-red-500/15 text-red-400 line-through'
                          : token.status === 'missing'
                            ? 'bg-aurora-amber/15 text-aurora-amber'
                            : 'bg-aurora-border/50 text-aurora-muted'
                    }`}
                  >
                    {token.word}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-aurora-emerald/50" /> Correct
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-red-500/50" /> Wrong
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-aurora-amber/50" /> Missing
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-aurora-border/50" /> Extra
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl glass p-5 text-center">
              <p className="text-sm text-aurora-muted">No comparison data available.</p>
            </div>
          )}

          {detail.reconstruction && diff.length > 0 && (
            <div className="rounded-xl glass p-5">
              <h3 className="mb-3 text-sm font-semibold text-white">Side by Side</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs font-semibold text-aurora-emerald">Your Input</div>
                  <div className="rounded-lg bg-aurora-emerald/5 border border-aurora-emerald/20 p-3">
                    <p className="text-sm leading-relaxed text-aurora-text whitespace-pre-wrap">
                      {detail.reconstruction}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-aurora-amber">Expected</div>
                  <div className="rounded-lg bg-aurora-amber/5 border border-aurora-amber/20 p-3">
                    <p className="text-sm leading-relaxed text-aurora-text whitespace-pre-wrap">
                      {diff
                        .filter((d) => d.status !== 'extra')
                        .map((d) => d.word)
                        .join(' ') || '(see word comparison above)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
