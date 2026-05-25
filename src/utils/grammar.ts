export interface GrammarMatch {
  message: string;
  offset: number;
  length: number;
  shortMessage: string;
  replacements: { value: string }[];
}

const LT_API = 'https://api.languagetool.org/v2/check';

export async function checkGrammar(text: string): Promise<GrammarMatch[]> {
  const body = new URLSearchParams({ text, language: 'en-US' });
  const res = await fetch(LT_API, { method: 'POST', body });
  if (!res.ok) return [];
  const data = await res.json();
  return data.matches || [];
}

export function highlightErrors(text: string, matches: GrammarMatch[]): string {
  const sorted = [...matches].sort((a, b) => b.offset - a.offset);
  let result = text;
  for (const m of sorted) {
    const before = result.slice(0, m.offset + m.length);
    const after = result.slice(m.offset + m.length);
    result = before + '</mark>' + after;
    const before2 = result.slice(0, m.offset);
    const after2 = result.slice(m.offset);
    result = before2 + '<mark class="bg-red-600/30 text-red-300 px-0.5 rounded">' + after2;
  }
  return result;
}
