import { curriculumFor } from '../../data/curricula/index.js';

/**
 * Tap-word gloss for DialogStage. A dialogue line is tokenised on whitespace;
 * a token (or a run of tokens forming a multi-word Wortfeld entry, matched
 * phrase-first / longest-match-first) whose lowercased, punctuation-stripped
 * form matches a vocabulary entry from THIS Lektion or an EARLIER one becomes
 * a gloss segment. Punctuation stays attached to the displayed text — only
 * the lookup key drops it.
 *
 * Pure and framework-free so it is unit-testable without mounting React.
 */

const STRIP_PUNCT = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/** Lowercase, punctuation-stripped lookup key for one raw token. */
export function cleanToken(raw) {
  return String(raw || '').replace(STRIP_PUNCT, '').toLowerCase();
}

/**
 * `a1.1-l01` → { level: 'a1.1', nr: 1 }. Every Lektion id in the curricula is
 * `${level}-l${nr padded to 2}`, so the Lektion is derivable from its id alone
 * — the stage never needs the player to pass `level`/`nr` separately.
 */
export function parseLektionId(lektionId) {
  const m = /^(.+)-l(\d+)$/.exec(String(lektionId || ''));
  if (!m) return null;
  const nr = parseInt(m[2], 10);
  if (!Number.isFinite(nr)) return null;
  return { level: m[1], nr };
}

/**
 * The gloss lexicon for a Lektion: every Wortfeld entry of that Lektion and
 * every EARLIER one in the same level (`lektionen.slice(0, nr)` — `nr` is
 * 1-based and Lektion 1 sits at index 0, so this includes the current
 * Lektion's own new words too). Entries are keyed by the article-free surface
 * form (`word`, falling back to `de`) so "der Gruß" is looked up as "gruß"
 * but still displays its full `de` (with article) in the popover. Sorted by
 * word count, longest first, so phrase entries ("Wie geht es Ihnen?") win
 * over any single-word entry they contain.
 */
export function buildLexicon(level, nr) {
  const curriculum = curriculumFor(level);
  if (!curriculum || !Number.isFinite(nr)) return [];
  const lektionen = curriculum.lektionen.slice(0, nr);
  const byKey = new Map();
  for (const lektion of lektionen) {
    for (const w of lektion.wortfeld || []) {
      const surface = String((w.word || w.de || '')).trim();
      if (!surface) continue;
      const key = surface.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, w); // first (earliest Lektion) wins
    }
  }
  return [...byKey.entries()]
    .map(([key, entry]) => ({ tokens: key.split(/\s+/).filter(Boolean), entry }))
    .filter((e) => e.tokens.length > 0)
    .sort((a, b) => b.tokens.length - a.tokens.length);
}

/**
 * Splits `line` into display segments — `{ type: 'gloss', text, entry }` for
 * a matched word/phrase (raw text, punctuation kept), `{ type: 'text', text
 * }` otherwise. Matching is greedy left-to-right, phrase-first: at every
 * position it tries the lexicon's longest phrases before shorter ones (the
 * lexicon is pre-sorted that way), so a two-word Wortfeld entry glosses as
 * one token, never as two independent single-word matches.
 */
export function glossTokens(line, lexicon) {
  const raw = String(line || '').split(/\s+/).filter(Boolean);
  const clean = raw.map(cleanToken);
  const segments = [];
  let i = 0;
  while (i < raw.length) {
    let matchLen = 0;
    let matchEntry = null;
    for (const { tokens, entry } of lexicon) {
      const len = tokens.length;
      if (len === 0 || i + len > raw.length) continue;
      let ok = true;
      for (let k = 0; k < len; k += 1) {
        if (clean[i + k] !== tokens[k]) { ok = false; break; }
      }
      if (ok) { matchLen = len; matchEntry = entry; break; }
    }
    if (matchEntry) {
      segments.push({ type: 'gloss', text: raw.slice(i, i + matchLen).join(' '), entry: matchEntry });
      i += matchLen;
    } else {
      segments.push({ type: 'text', text: raw[i] });
      i += 1;
    }
  }
  return segments;
}
