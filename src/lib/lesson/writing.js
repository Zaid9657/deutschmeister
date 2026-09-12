// Stage 6 scoring — the MECHANICAL half, client-side.
//
// AI grading on the Goethe criteria now runs server-side
// (netlify/functions/evaluate-writing.mjs, rendered by
// src/components/lesson/GradedWriting.jsx). This file is what remains true
// without it and is the honest FALLBACK whenever the grader is unavailable —
// signed out, over the free course allowance, offline: did you fill every
// field, are you inside the word range, did you touch each Leitpunkt, did you
// open and close a Mitteilung. It never claims the text is "correct" — see the
// wording in GradedWriting.jsx — because an unchecked promise of feedback is
// exactly what FernUSG forbids.

const words = (text) => String(text || '').trim().split(/\s+/).filter(Boolean);

export const countWords = (text) => words(text).length;

const STOPWORDS = new Set([
  'der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'einer', 'und', 'oder', 'aber', 'ihr', 'ihre',
  'sie', 'du', 'ich', 'wir', 'es', 'zu', 'in', 'an', 'auf', 'für', 'mit', 'von', 'dein', 'deine',
  'wann', 'wie', 'was', 'wo', 'wer', 'warum', 'schreiben', 'schreib', 'nennen', 'nenne', 'sagen',
]);

/**
 * One keyword per Leitpunkt: its first content word (noun or verb), which for
 * German prompts is reliably the first token that is not a function word.
 * Crude on purpose — it is a hint that a point was addressed, not a grade.
 */
export function leitpunktKeyword(leitpunkt) {
  const token = words(leitpunkt)
    .map((w) => w.replace(/[.,!?;:()"„“]/g, ''))
    .find((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()));
  return token || '';
}

/**
 * A filled-in Formular as the one text the grader receives: one "Feld: Wert"
 * line per field, which is exactly the shape the Formular tasks in the bank ask
 * for ("Schreib zu jedem Feld eine Zeile"). Empty fields are kept, so a missing
 * answer is visible to the grader rather than silently dropped.
 */
export function formularText(fields = [], values = {}) {
  return (fields || [])
    .map((field) => `${field}: ${String(values?.[field] ?? '').trim()}`)
    .join('\n');
}

const ANREDE = /\b(hallo|liebe|lieber|guten\s+(tag|morgen|abend)|sehr\s+geehrte)/i;
const GRUSS = /\b(tschüss|tschuess|viele\s+grüße|viele\s+gruesse|liebe\s+grüße|liebe\s+gruesse|bis\s+bald|mit\s+freundlichen\s+grüßen|grüße|gruesse)/i;

/**
 * scoreWriting(schreiben, value) → { ok, checks: [{ key, label, ok }], count }
 * `value` is a string for a Mitteilung, or a { field: text } map for a Formular.
 */
export function scoreWriting(schreiben, value) {
  if (!schreiben) return { ok: false, checks: [], count: 0 };

  if (schreiben.kind === 'formular') {
    const map = value && typeof value === 'object' ? value : {};
    const checks = (schreiben.fields || []).map((field) => ({
      key: field,
      label: field,
      ok: String(map[field] || '').trim().length > 0,
    }));
    return { ok: checks.length > 0 && checks.every((c) => c.ok), checks, count: checks.length };
  }

  const text = String(value || '');
  const count = countWords(text);
  const min = Number(schreiben.minWords) || 0;
  const max = Number(schreiben.maxWords) || Infinity;
  const lower = text.toLowerCase();

  const checks = [
    { key: 'length', label: `${min}–${Number.isFinite(max) ? max : '∞'} Wörter`, ok: count >= min && count <= max },
    { key: 'anrede', label: 'Anrede', ok: ANREDE.test(text) },
    { key: 'gruss', label: 'Gruß', ok: GRUSS.test(text) },
    ...(schreiben.leitpunkte || []).map((lp, i) => {
      const kw = leitpunktKeyword(lp);
      return { key: `lp${i}`, label: lp, ok: !!kw && lower.includes(kw.toLowerCase()) };
    }),
  ];

  return { ok: checks.every((c) => c.ok), checks, count };
}
