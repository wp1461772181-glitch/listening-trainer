interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function InputArea({ value, onChange, onSubmit, disabled }: InputAreaProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-400">
        Type what you heard
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Start typing here..."
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600">
          Enter to submit &middot; Shift+Enter for newline
        </span>
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
