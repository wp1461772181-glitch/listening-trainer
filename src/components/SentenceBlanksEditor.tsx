import { useState } from 'react';

interface Blank {
  word: string;
  position: number;
  length: number;
}

interface SentenceBlanksEditorProps {
  sentenceText: string;
  blanks: Blank[];
  onChange: (blanks: Blank[]) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export default function SentenceBlanksEditor({
  sentenceText,
  blanks,
  onChange,
  onRegenerate,
  regenerating,
}: SentenceBlanksEditorProps) {
  const [selectedWord, setSelectedWord] = useState<Blank | null>(null);

  function removeBlank(idx: number) {
    const updated = blanks.filter((_, i) => i !== idx);
    onChange(updated);
    setSelectedWord(null);
  }

  function addBlank() {
    if (!selectedWord) return;
    onChange([...blanks, selectedWord]);
    setSelectedWord(null);
  }

  // Parse the sentence into words and blanks for rendering
  function renderWithBlanks() {
    // Sort blanks by position
    const sorted = [...blanks].sort((a, b) => a.position - b.position);
    const parts: React.ReactNode[] = [];
    let offset = 0;

    for (let i = 0; i < sorted.length; i++) {
      const blank = sorted[i];
      if (blank.position > offset) {
        parts.push(
          <span key={`t${offset}`} className="text-text-secondary">
            {sentenceText.slice(offset, blank.position)}
          </span>
        );
      }

      const blankIdx = blanks.indexOf(blank);
      parts.push(
        <span
          key={`b${i}`}
          className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary mx-0.5 cursor-pointer hover:bg-primary/20"
          title="Click to remove this blank"
          onClick={() => removeBlank(blankIdx)}
        >
          {sentenceText.slice(blank.position, blank.position + blank.length)}
          <span className="text-[10px] text-primary/60 hover:text-primary">&times;</span>
        </span>
      );

      offset = blank.position + blank.length;
    }

    if (offset < sentenceText.length) {
      parts.push(
        <span key={`t${offset}`} className="text-text-secondary">
          {sentenceText.slice(offset)}
        </span>
      );
    }

    return parts;
  }

  // Parse words from sentence text for manual blank selection
  function getWords() {
    const words: { word: string; position: number }[] = [];
    const re = /[A-Za-z][A-Za-z'']{1,}/g;
    let m;
    while ((m = re.exec(sentenceText)) !== null) {
      words.push({ word: m[0], position: m.index });
    }
    return words;
  }

  const existingPositions = new Set(blanks.map(b => `${b.position}-${b.word}`));

  function handleWordClick(w: { word: string; position: number }) {
    const key = `${w.position}-${w.word}`;
    if (existingPositions.has(key)) {
      // Remove existing blank
      removeBlank(blanks.findIndex(b => b.position === w.position));
    } else {
      setSelectedWord({ word: w.word, position: w.position, length: w.word.length });
    }
  }

  return (
    <div className="space-y-2 mt-1">
      {/* Blanks preview */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">
          {blanks.length} blank{blanks.length !== 1 ? 's' : ''}:
        </span>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="rounded px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {regenerating ? '...' : 'Regenerate'}
          </button>
        )}
      </div>

      {/* Sentence with blanks highlighted */}
      <div className="text-sm leading-relaxed p-2 rounded-lg bg-bg border border-border min-h-[2rem]">
        {renderWithBlanks()}
      </div>

      {/* Add blank from word list */}
      <div>
        <span className="text-[10px] text-text-tertiary">Click word to toggle blank:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {getWords().map((w, i) => {
            const isBlank = blanks.some(b => b.position === w.position);
            const isSelected = selectedWord?.position === w.position;
            return (
              <span
                key={i}
                onClick={() => handleWordClick(w)}
                className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-mono transition-all ${
                  isSelected
                    ? 'bg-warning/20 text-warning ring-1 ring-warning/30'
                    : isBlank
                      ? 'bg-primary/10 text-primary line-through cursor-pointer'
                      : 'bg-bg-alt text-text-secondary hover:bg-primary/5 hover:text-primary'
                }`}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </div>

      {/* Add selected word */}
      {selectedWord && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-warning">Selected: "{selectedWord.word}"</span>
          <button
            onClick={addBlank}
            className="rounded bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning hover:bg-warning/20"
          >
            + Add as blank
          </button>
        </div>
      )}
    </div>
  );
}
