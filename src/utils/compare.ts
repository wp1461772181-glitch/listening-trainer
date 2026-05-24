export interface DiffToken {
  word: string;
  status: 'correct' | 'wrong' | 'missing' | 'extra';
  correctWord?: string;
}

export function compareTexts(original: string, userInput: string): DiffToken[] {
  const originalWords = original.trim().split(/\s+/);
  const userWords = userInput.trim().split(/\s+/).filter((w) => w.length > 0);
  const result: DiffToken[] = [];

  if (userWords.length === 0) {
    return originalWords.map((word) => ({ word, status: 'missing' }));
  }

  const maxLen = Math.max(originalWords.length, userWords.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = originalWords[i];
    const user = userWords[i];

    if (orig === undefined && user !== undefined) {
      result.push({ word: user, status: 'extra' });
    } else if (orig !== undefined && user === undefined) {
      result.push({ word: orig, status: 'missing' });
    } else if (orig && user) {
      const origClean = orig.replace(/[^a-zA-Z0-9'-]/g, '').toLowerCase();
      const userClean = user.replace(/[^a-zA-Z0-9'-]/g, '').toLowerCase();
      if (origClean === userClean) {
        result.push({ word: user, status: 'correct' });
      } else {
        result.push({ word: user, status: 'wrong', correctWord: orig });
      }
    }
  }

  return result;
}

export function calculateScore(diff: DiffToken[]): number {
  const total = diff.length;
  const correct = diff.filter((d) => d.status === 'correct').length;
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}
