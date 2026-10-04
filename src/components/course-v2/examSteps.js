// Course v2 — an exam block (SCHEMA §8 ExamBlock) as a run of small screens, the way every other
// part of the course runs now (owner feedback 2026-09-30: "it looks intimidating and too much …
// make it in duolingo style and for everything to be step for step"). Pure — no React here;
// ExamBlockView draws the screens.
//
//   intro   the instruction, the Tipp, „6 Aufgaben · Lernmodus", one START
//   read    a text several tasks share (a letter with gaps, two e-mails, a set of ads, a word
//           bank), read ONCE on its own screen before the first task that needs it
//   task    one item: its material (the audio, or its short text in full, or what the task needs
//           of a shared text) above its question, the check in the bottom bar
//
// A shared text is never printed in full above a question again: a gap item shows the sentence
// its gap sits in (and the one before, which the gap often depends on), every other task a
// folded card („Text anzeigen"). The learner never scrolls past a long text to find the question.

import { resolveText } from './content.js';

/** A text above this many characters is read on its own screen even when only one task reads it. */
export const LONG_TEXT = 600;

/** A listening text: the audio kind, or lines with no written text. */
export const isListening = (x) => Boolean(x) && (x.kind === 'audio' || (Array.isArray(x.lines) && x.lines.length > 0 && !x.text));

/** The item types that answer from the block's `choices` (ItemView's rule). */
const usesChoices = (item) => item && (item.type === 'zuordnen' || item.type === 'insert' || (item.type === 'cloze' && !item.options));

/** The gap a cloze item fills — „Lücke 3" / „Gap 3" in its prompt — or null. */
export function gapOf(item) {
  const m = /\b(?:Lücke|Gap)\s*(\d{1,2})\b/i.exec(String((item && item.promptDe) || ''));
  return m ? Number(m[1]) : null;
}

/** The marker of gap `n` in an exam text (`⟦01⟧`). */
export const gapMarker = (n) => `⟦${String(n).padStart(2, '0')}⟧`;

/**
 * Sentence starts in a text: after . ! ? (a closing quote may follow) and a space — never after a
 * number („am 19. Juni" is one sentence) — and after every line break.
 */
function sentenceStarts(src) {
  const starts = [0];
  const re = /([.!?…])["“”»)]*[ \t]+|\n+/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[1] && /\d/.test(src.charAt(m.index - 1))) continue;
    starts.push(m.index + m[0].length);
  }
  return starts;
}

/**
 * What one gap needs of its text: the sentence gap `n` sits in and the sentence before it (the
 * gap often depends on it: „Der Satz davor ist der Gegengrund"). → { text, before, after } —
 * `before`/`after` say the excerpt is cut there — or null when the text has no such gap.
 */
export function gapExcerpt(text, n) {
  const src = String(text || '');
  const at = src.indexOf(gapMarker(n));
  if (at < 0) return null;
  const starts = sentenceStarts(src);
  let i = 0;
  while (i + 1 < starts.length && starts[i + 1] <= at) i += 1;
  const from = starts[Math.max(0, i - 1)];
  const to = i + 1 < starts.length ? starts[i + 1] : src.length;
  // a paragraph break inside the excerpt is one line break: the excerpt is two sentences, not a layout
  const cut = src.slice(from, to).trim().replace(/[ \t]*\n\s*/g, '\n');
  return { text: cut, before: from > 0, after: src.slice(to).trim().length > 0 };
}

/**
 * A text's body as a card shows it under its title: an ad or a sign that repeats its title as its
 * first line („Mit dem Fahrrad am Fluss\nJeden Samstag …") drops that line — the card prints the
 * title once. Anything else is the text as written.
 */
export function bodyOf(x) {
  const src = String((x && x.text) || '');
  const title = String((x && x.title) || '').trim();
  if (!title) return src;
  const m = /^[ \t]*([^\n]*)\n\s*/.exec(src);
  return m && m[1].trim() === title ? src.slice(m[0].length) : src;
}

/**
 * The strategy card's body without its lead („Hören Teil 1: …", „Listening part 1: …"): the screen
 * already says which Teil it is. The rest is the card's own words, first letter raised.
 */
export function strategyBody(text) {
  const src = String(text || '').trim();
  const m = /^[^:\n]{2,48}?\b(?:Teil|part)\s+\d+\s*:\s*/i.exec(src);
  if (!m || m[0].length >= src.length) return src;
  const rest = src.slice(m[0].length);
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/** textId → the ids of the block's items that read it (their `textRef`). */
export function textReaders(block, extraTexts = null) {
  const pool = [...((block && block.texts) || []), ...(extraTexts || [])];
  const readers = new Map();
  for (const it of (block && block.items) || []) {
    const x = it && it.textRef ? resolveText(it.textRef, pool) : null;
    if (x) readers.set(x.id, [...(readers.get(x.id) || []), it.id]);
  }
  return readers;
}

/**
 * The screens of one exam block, in order (see the head of this file):
 *
 *   { kind: 'intro' }
 *   { kind: 'read', texts: [ExamText], keys: { textId: 'a' }, bank: [{ key, de }] }
 *   { kind: 'task', item, n, total, text, show, gap, choiceTexts, keys }
 *       n / total   the task's position (1-based) among the block's items
 *       text        the item's ExamText (its `textRef`), or null
 *       show        'listen' (audio, its play count) | 'full' (a short text of its own)
 *                   | 'excerpt' (the gap's sentence of a shared text) | 'ref' (a shared text, folded) | null
 *       gap         the gap number of an 'excerpt'
 *       choiceTexts the texts the item's choices name (a set of ads), folded on the task — [] otherwise
 *       keys        textId → its choice key („a"), as on the read screen
 *
 * Every item is one task screen, in the authored order; no item is dropped or repeated. The
 * block's own material (texts its choices name, texts it lists that no item reads, a word bank)
 * is read right after the intro; a text several items share, before the first of them. Two read
 * screens in a row are one.
 */
export function examScreens(block, extraTexts = null) {
  if (!block) return [];
  const pool = [...(block.texts || []), ...(extraTexts || [])];
  const items = block.items || [];
  const textOf = (ref) => (ref ? resolveText(ref, pool) : null);
  const readers = textReaders(block, extraTexts);

  const lead = [];
  const keys = {};
  const addLead = (x, key = null) => {
    if (!x) return;
    if (!lead.some((y) => y.id === x.id)) lead.push(x);
    if (key && !keys[x.id]) keys[x.id] = key;
  };
  for (const c of block.choices || []) if (c && c.textRef) addLead(textOf(c.textRef), c.key);
  for (const r of block.textRefs || []) {
    const x = textOf(r);
    if (x && !readers.has(x.id)) addLead(x);
  }
  const bank = (block.choices || []).filter((c) => c && c.de && !c.textRef).map((c) => ({ key: c.key, de: c.de }));
  const choiceTexts = lead.filter((x) => keys[x.id]);

  const screens = [{ kind: 'intro' }];
  const read = (texts, extra = {}) => {
    const prev = screens[screens.length - 1];
    if (prev.kind === 'read') {
      for (const x of texts) if (!prev.texts.some((y) => y.id === x.id)) prev.texts.push(x);
      return;
    }
    screens.push({ kind: 'read', texts: [...texts], keys, bank: [], ...extra });
  };
  if (lead.length || bank.length) read(lead, { bank });
  const seen = new Set(lead.map((x) => x.id));

  items.forEach((item, i) => {
    const x = textOf(item && item.textRef);
    let show = null;
    let gap = null;
    if (x && isListening(x)) show = 'listen';
    else if (x) {
      const shared = (readers.get(x.id) || []).length > 1 || Boolean(keys[x.id]) || String(x.text || '').length > LONG_TEXT;
      if (!shared) show = 'full';
      else {
        if (!seen.has(x.id)) {
          seen.add(x.id);
          read([x]);
        }
        gap = gapOf(item);
        show = gap != null && gapExcerpt(bodyOf(x), gap) ? 'excerpt' : 'ref';
        if (show === 'ref') gap = null;
      }
    }
    screens.push({
      kind: 'task',
      item,
      n: i + 1,
      total: items.length,
      text: x,
      show,
      gap,
      choiceTexts: usesChoices(item) ? choiceTexts : [],
      keys,
    });
  });
  return screens;
}

/** How far through the block the learner is at screen `pos` of `count`, 0..1 (the player's bar). */
export const examProgress = (pos, count) => (count > 0 ? Math.min(1, Math.max(0, pos) / count) : 1);
