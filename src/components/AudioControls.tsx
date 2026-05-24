interface AudioControlsProps {
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onReplay: () => void;
  onChangeSpeed: () => void;
}

const speeds = [0.75, 1, 1.25];

export default function AudioControls({
  isPlaying,
  speed,
  onTogglePlay,
  onReplay,
  onChangeSpeed,
}: AudioControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onTogglePlay}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-500/25 active:scale-95"
      >
        {isPlaying ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5.14v14.72a1 1 0 001.555.832l11.318-7.36a1 1 0 000-1.664L9.555 4.308A1 1 0 008 5.14z" />
          </svg>
        )}
      </button>

      <button
        onClick={onReplay}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition-all hover:border-slate-500 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      <button
        onClick={onChangeSpeed}
        className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-all hover:border-slate-500 hover:text-white"
      >
        {speed}x
      </button>
    </div>
  );
}

function getNextSpeed(current: number): number {
  const idx = speeds.indexOf(current);
  return speeds[(idx + 1) % speeds.length];
}

export { getNextSpeed, speeds };
