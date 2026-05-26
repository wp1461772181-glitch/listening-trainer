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
      <label className="text-sm font-semibold text-aurora-text">
        Type what you heard
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Start typing here..."
        rows={3}
        className="w-full resize-none rounded-xl border border-aurora-border bg-aurora-surface/60 px-4 py-3 text-sm text-aurora-text placeholder:text-aurora-muted/50 focus:border-aurora-violet/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/10 transition-all disabled:opacity-50"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-aurora-muted">
          Enter to submit &middot; Shift+Enter for newline
        </span>
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="rounded-lg bg-gradient-to-r from-aurora-violet to-violet-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:glow-violet active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
