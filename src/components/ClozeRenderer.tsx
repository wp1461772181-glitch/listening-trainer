import { useState, useRef, useEffect } from 'react';

interface ClozeBlank {
  word: string;
  position: number;
  length: number;
}

interface ClozeRendererProps {
  text: string;
  blanks: ClozeBlank[];
  onAnswersChange?: (answers: string[]) => void;
  readOnly?: boolean;
  answers?: string[];
  results?: { word: string; correct: boolean; userAnswer: string }[];
}

export default function ClozeRenderer({
  text = '',
  blanks,
  onAnswersChange,
  readOnly = false,
  answers = [],
  results,
}: ClozeRendererProps) {
  const [inputs, setInputs] = useState<string[]>(blanks.map(() => ''));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Reset inputs when blanks change (new sentence)
  useEffect(() => {
    setInputs(blanks.map(() => ''));
  }, [blanks]);

  useEffect(() => {
    if (!readOnly && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [readOnly, blanks]);

  function handleChange(idx: number, value: string) {
    setInputs(prev => {
      const next = [...prev];
      next[idx] = value;
      onAnswersChange?.(next);
      return next;
    });
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Tab') {
      e.preventDefault();
      const next = inputRefs.current[idx + 1];
      if (next) next.focus();
    }
  }

  // Build rendered text with blanks as inputs
  // Sort blanks by position to ensure correct rendering order,
  // but track original indices so results/answers map correctly
  const sortedBlanks = blanks
    .map((blank, origIdx) => ({ ...blank, origIdx }))
    .sort((a, b) => a.position - b.position);

  let offset = 0;
  const parts: React.ReactNode[] = [];

  for (let i = 0; i < sortedBlanks.length; i++) {
    const blank = sortedBlanks[i];
    const origIdx = blank.origIdx;
    // Text before blank
    if (blank.position > offset) {
      parts.push(text.slice(offset, blank.position));
    }

    // Blank input or display - use origIdx to map to results/answers/inputs
    if (readOnly && results && results[origIdx]) {
      const r = results[origIdx];
      const color = r.correct ? 'text-success' : 'text-error';
      const bg = r.correct ? 'bg-success/10' : 'bg-error/10';
      const border = r.correct ? 'border-success/30' : 'border-error/30';
      parts.push(
        <span key={i} className={`inline-block min-w-[60px] border-b-2 ${border} ${bg} ${color} px-2 text-center font-semibold mx-1`}>
          {r.userAnswer || '—'}
        </span>
      );
    } else if (readOnly) {
      parts.push(
        <span key={i} className="inline-block min-w-[60px] border-b-2 border-border px-2 text-center mx-1">
          {answers[origIdx] || '—'}
        </span>
      );
    } else {
      parts.push(
        <input
          key={i}
          ref={el => { if (el) inputRefs.current[i] = el; }}
          type="text"
          value={inputs[origIdx]}
          onChange={(e) => handleChange(origIdx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(origIdx, e)}
          placeholder="___"
          className="inline-block min-w-[80px] rounded border-b-2 border-primary bg-primary/5 px-2 text-center text-primary focus:outline-none focus:ring-1 focus:ring-primary/30 mx-1"
          style={{ width: `${Math.max(blank.length * 10 + 24, 70)}px` }}
        />
      );
    }

    offset = blank.position + blank.length;
  }

  // Remaining text after last blank
  if (offset < text.length) {
    parts.push(text.slice(offset));
  }

  return (
    <div className="text-sm leading-relaxed text-text break-words">
      {parts.map((part, i) => (
        <span key={i}>{part}</span>
      ))}
    </div>
  );
}
