export interface GrammarMatch {
  message: string;
  offset: number;
  length: number;
  shortMessage: string;
  replacements: { value: string }[];
}

export interface SpacingResult {
  hasIssues: boolean;
  issues: string[];
  fixed: string;
}

const PUNCTUATION = new Set(['.', ',', '!', '?', ';', ':']);

const CN_TO_EN: Record<string, string> = {
  '，': ',',  // ，
  '。': '.',  // 。
  '；': ';',  // ；
  '：': ':',  // ：
  '？': '?',  // ？
  '！': '!',  // ！
  '‘': "'",  // '
  '’': "'",  // '
  '“': '"',  // "
  '”': '"',  // "
  '（': '(',  // （
  '）': ')',  // ）
};

const CN_PUNCT_REGEX = /[，。；：？！‘’“”（）]/g;

export function checkSpacing(text: string): SpacingResult {
  const issues: string[] = [];
  let fixed = text.trim();

  if (fixed !== text) {
    issues.push('移除首尾多余空格');
  }

  // Detect and replace Chinese punctuation
  const chinesePunct: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = CN_PUNCT_REGEX.exec(fixed)) !== null) {
    chinesePunct.push(m[0]);
  }
  if (chinesePunct.length > 0) {
    const unique = [...new Set(chinesePunct)];
    const labels = unique.map((c) => `"${c}"`);
    issues.push(`检测到 ${chinesePunct.length} 个中文标点符号: ${labels.join(', ')}`);
    fixed = fixed.replace(CN_PUNCT_REGEX, (c) => CN_TO_EN[c] || c);
  }

  // Collapse multiple spaces, tabs, newlines into single space
  const collapsed = fixed.replace(/[\s\t\n\r]+/g, ' ');
  if (collapsed !== fixed) {
    issues.push('合并多余空格和换行');
    fixed = collapsed;
  }

  // Remove space before punctuation: "hello , world" → "hello, world"
  const beforeFix = fixed.replace(/\s+([.,!?;:])/g, '$1');
  if (beforeFix !== fixed) {
    issues.push('删除标点符号前的空格');
    fixed = beforeFix;
  }

  // Ensure space after punctuation: "hello,world" → "hello, world"
  let afterFix = '';
  for (let i = 0; i < fixed.length; i++) {
    afterFix += fixed[i];
    if (PUNCTUATION.has(fixed[i]) && i + 1 < fixed.length && fixed[i + 1] !== ' ') {
      afterFix += ' ';
    }
  }
  if (afterFix !== fixed) {
    issues.push('标点符号后添加空格');
    fixed = afterFix;
  }

  // Capitalize first letter
  if (fixed.length > 0 && fixed[0] !== fixed[0].toUpperCase()) {
    fixed = fixed[0].toUpperCase() + fixed.slice(1);
    issues.push('首字母大写');
  }

  // Final trim (in case any fixes introduced trailing space)
  fixed = fixed.trim();

  return { hasIssues: issues.length > 0, issues, fixed };
}

export function normalizeText(text: string): string {
  return checkSpacing(text).fixed;
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
