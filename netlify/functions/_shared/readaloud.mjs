// Read-aloud alignment (plan P3, "Scored speaking").
//
// Given the line the learner was asked to read and what the speech-to-text
// engine actually heard, decide WORD BY WORD what came through. The score is
// word recognition — it is labelled *Verständlichkeit* in the UI and never
// "Aussprache", because an STT hit is evidence a listener would have
// understood the word, not evidence the vowel was right.
//
// Deliberately dependency-free: this exact file is copied to
// netlify/functions/_shared/readaloud.mjs so the client and the server can
// never disagree about a score, and scripts/check-duplicates.mjs pins the two
// byte-identical. Do not add an import here.
//
// Rules:
//   - tokens are compared normalised: lowercase, umlaut/ß in their ASCII
//     spelling (ä→ae … ß→ss), punctuation stripped;
//   - a digit token is expanded to its German word ("25" → "fuenfundzwanzig"),
//     because a learner reads numbers aloud and the STT writes words;
//   - a token is a hit when the normalised forms are equal, or — only for
//     expected tokens of five letters or more — one edit apart;
//   - alignment is a longest-common-subsequence walk, so a partial read marks
//     the words that were actually said and leaves the rest as misses,
//     whatever order the extra words arrive in.

/** Word recognition at or above this counts the line as said. */
export const READALOUD_PASS_PCT = 0.8;

const ONES = [
  'null', 'eins', 'zwei', 'drei', 'vier', 'fuenf', 'sechs', 'sieben', 'acht', 'neun',
  'zehn', 'elf', 'zwoelf', 'dreizehn', 'vierzehn', 'fuenfzehn', 'sechzehn', 'siebzehn',
  'achtzehn', 'neunzehn',
];
const TENS = {
  20: 'zwanzig', 30: 'dreissig', 40: 'vierzig', 50: 'fuenfzig',
  60: 'sechzig', 70: 'siebzig', 80: 'achtzig', 90: 'neunzig',
};

/** 0–100 as the normalised German word; null outside that range. */
export function germanNumberWord(n) {
  if (!Number.isInteger(n) || n < 0 || n > 100) return null;
  if (n < 20) return ONES[n];
  if (n === 100) return 'hundert';
  const tens = Math.floor(n / 10) * 10;
  const unit = n % 10;
  if (!unit) return TENS[tens];
  return `${ONES[unit] === 'eins' ? 'ein' : ONES[unit]}und${TENS[tens]}`;
}

/** Lowercase, ASCII-spell the umlauts, drop punctuation, spell out digits. */
export function normalizeToken(word) {
  const base = String(word ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[.,!?;:"“”„'’`()[\]…–—-]/g, '')
    .trim();
  if (/^\d+$/.test(base)) {
    const spelled = germanNumberWord(Number(base));
    if (spelled) return spelled;
  }
  return base;
}

/** Split a line into display words plus their normalised comparison form. */
export function tokenize(text) {
  return String(text ?? '')
    .split(/\s+/)
    .map((raw) => ({ raw, norm: normalizeToken(raw) }))
    .filter((t) => t.norm.length > 0);
}

/** Classic Levenshtein distance — the same one the typed checker uses. */
export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Equal, or one edit apart on a word long enough for that to be a slip. */
export function tokensMatch(expected, heard) {
  if (!expected || !heard) return false;
  if (expected === heard) return true;
  if (expected.length < 5) return false;
  return levenshtein(expected, heard) <= 1;
}

/**
 * alignTranscript(expected, transcript) → { words: [{ word, hit }], pct }
 *
 * `words` keeps the expected line's own spelling and order — that is what the
 * UI renders — with `hit` saying whether the STT heard that word. `pct` is
 * hits / expected tokens, 0…1 rounded to two decimals.
 */
export function alignTranscript(expected, transcript) {
  const want = tokenize(expected);
  const heard = tokenize(transcript);
  const n = want.length;
  const m = heard.length;
  if (!n) return { words: [], pct: 0 };
  if (!m) return { words: want.map((t) => ({ word: t.raw, hit: false })), pct: 0 };

  // dp[i][j] = length of the longest common subsequence of want[i…] / heard[j…]
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = tokensMatch(want[i].norm, heard[j].norm)
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const words = want.map((t) => ({ word: t.raw, hit: false }));
  let i = 0;
  let j = 0;
  let hits = 0;
  while (i < n && j < m) {
    if (tokensMatch(want[i].norm, heard[j].norm)) {
      words[i].hit = true;
      hits += 1;
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  return { words, pct: Math.round((hits / n) * 100) / 100 };
}
