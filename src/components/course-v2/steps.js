// Course v2 — one thing per screen inside a Lernschritt, pure (owner feedback 2026-09-30: "it looks
// intimidating and too much … make it in duolingo style and for everything to be step for step").
// The screens of a step are built from data the step already carries; nothing is authored twice.
// No React, no import.meta: tests/course-v2-steps.test.mjs runs it.
//
//   a reading text, revealed chunk by chunk     readingChunks(), textChunks()
//   the story of an input (text · listen · lines) inputPhases()
//   the rule card as small screens              ruleScreens()
//   the form the model sentence teaches         ruleForms(), emphasize()

/** Words in a string (whitespace-separated). */
export const wordCount = (s) => (String(s || '').match(/\S+/g) || []).length;

// A reading text of up to WHOLE words is one screen; a longer one is revealed in chunks of about
// CHUNK words. A paragraph is never split: a line of a chat, a form or a menu stays one line.
export const WHOLE_TEXT_WORDS = 60;
export const CHUNK_WORDS = 40;

// A group this small is never a screen of its own: it joins its neighbour in the same section.
const MIN_CHUNK_WORDS = 10;

// A short line that heads what follows — „Getränke", „Mittagessen (ab 12 Uhr)", „Priya im Chat:" —
// never ends a chunk and never stands alone. „Käsebrot: 3,80 €" or „Kurs: A1" is a line, not a heading.
const headingLike = (line) => {
  const s = String(line || '').trim();
  if (wordCount(s) > 4) return false;
  if (s.endsWith(':')) return !s.slice(0, -1).includes(':');
  return !/[.!?,;€]$/.test(s) && !s.includes(':');
};

/**
 * The paragraph groups of a reading text: [[paragraph index]] — one group when the text is short,
 * else groups of about `max` words. A paragraph is never split. A blank line ends a section (it
 * separates two documents, „Postkarte von Sophie" and „Priya im Chat"): groups are made inside a
 * section; a heading line moves on with what it heads; a group under MIN_CHUNK_WORDS (a letterhead,
 * a signature) joins its neighbour, the blank line kept.
 */
export function chunkIndices(text, { whole = WHOLE_TEXT_WORDS, max = CHUNK_WORDS } = {}) {
  const paras = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const idx = paras.map((p, i) => (p.trim() ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return [];
  if (wordCount(paras.join(' ')) <= whole) return [idx];
  const words = (g) => g.reduce((s, i) => s + wordCount(paras[i]), 0);
  const sections = [[]];
  paras.forEach((p, i) => {
    if (p.trim()) sections[sections.length - 1].push(i);
    else if (sections[sections.length - 1].length) sections.push([]);
  });
  const out = [];
  for (const section of sections.filter((s) => s.length)) {
    const groups = [];
    let cur = [];
    for (const i of section) {
      const onlyHeadings = cur.every((j) => headingLike(paras[j]));
      if (cur.length && !onlyHeadings && words(cur) + wordCount(paras[i]) > max) {
        const tail = cur.length > 1 && headingLike(paras[cur[cur.length - 1]]) ? cur.pop() : null;
        groups.push(cur);
        cur = tail == null ? [] : [tail];
      }
      cur.push(i);
    }
    if (cur.length) groups.push(cur);
    out.push(...groups);
  }
  // a small group joins the next one (a letterhead joins its letter), the last one the one before
  for (let g = 0; g < out.length && out.length > 1; g += 1) {
    if (words(out[g]) >= MIN_CHUNK_WORDS) continue;
    if (g + 1 < out.length) { out[g + 1] = [...out[g], ...out[g + 1]]; out.splice(g, 1); g -= 1; }
    else { out[g - 1] = [...out[g - 1], ...out[g]]; out.splice(g, 1); }
  }
  return out;
}

// The paragraphs of one group as text: a blank line where the group spans two sections.
const joinGroup = (paras, g) => g.map((i, k) => (k && i - g[k - 1] > 1 ? `\n${paras[i]}` : paras[i])).join('\n');

/** The chunks of a reading text as strings (its own line breaks kept inside a chunk). */
export function textChunks(text, opts) {
  const paras = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  return chunkIndices(text, opts).map((g) => joinGroup(paras, g));
}

/**
 * A reading text ({ de, en } or a German string) as reveal chunks: [{ de, en }]. The English goes
 * with each chunk only where it has the same paragraphs as the German; otherwise the chunks carry
 * none and `en` is the whole translation, shown once the text is read.
 */
export function readingChunks(text, opts) {
  const de = text && typeof text === 'object' ? String(text.de || '') : String(text || '');
  const en = text && typeof text === 'object' && text.en ? String(text.en) : '';
  const deParas = de.replace(/\r\n?/g, '\n').split('\n');
  const enParas = en.replace(/\r\n?/g, '\n').split('\n');
  const aligned = Boolean(en) && enParas.length === deParas.length
    && deParas.every((p, i) => Boolean(p.trim()) === Boolean(enParas[i].trim()));
  const chunks = chunkIndices(de, opts).map((g) => ({
    de: joinGroup(deParas, g),
    en: aligned ? joinGroup(enParas, g) : null,
  }));
  return { chunks, en: aligned || !en ? null : en };
}

/**
 * The „Label:" a line of a document opens with — the sender of a chat line („Frau Schulz: Guten
 * Abend!"), a form field („Familienname: Nair"), a menu entry („Öffnungszeiten: …") — so a reading
 * screen can set it in bold: { label, rest }, or null. A label is up to three words, starts with a
 * capital, ends on a capitalised word and holds no sentence end; a line that only ends in „:" is
 * a heading, not a label.
 */
export function lineLabel(line) {
  const m = /^(\p{Lu}[^:.!?]{0,40}?):\s+(\S.*)$/u.exec(String(line || ''));
  if (!m || wordCount(m[1]) > 3) return null;
  // German capitalises nouns and names: a label ends on one („Frau Schulz", „Brot, 500 Gramm"); a
  // sentence with a colon („Ich finde: …", „Frau Schulz sagt: …") ends on a verb
  const last = m[1].trim().split(/\s+/).pop();
  if (!/^\p{Lu}/u.test(last)) return null;
  return { label: m[1], rest: m[2] };
}

/**
 * The phases of an input screen, in order — each phase one screen, revealed beat by beat:
 *   'text'    the reading text (a mixed input's document first: the flyer, the ad, the chat opener
 *             the conversation is about), chunk by chunk
 *   'listen'  the unaided listen: the whole recording once, the transcript still hidden
 *             (SCHEMA §8 transcriptAfterUnaidedListen; BLUEPRINT §3.3 „transcript only after the
 *             first unaided listen") — only when the lines can be played at all
 *   'lines'   the transcript, one line at a time, each with its voice
 */
export function inputPhases(input, { playable = false } = {}) {
  const lines = Array.isArray(input && input.lines) ? input.lines : [];
  const text = input && input.text;
  const hasText = Boolean(text && (typeof text === 'string' ? text.trim() : String(text.de || '').trim()));
  const out = [];
  if (hasText) out.push('text');
  if (lines.length && playable && input.transcriptAfterUnaidedListen !== false) out.push('listen');
  if (lines.length) out.push('lines');
  return out;
}

/**
 * The screens of a rule card: 'tip' (the model sentence and the rule), then 'table' (the paradigm)
 * — or 'all' on one screen when the card is small (a short rule and a table of up to four rows).
 */
export function ruleScreens(card, modelSentence = null) {
  const model = modelSentence || (card && card.modelSentence) || null;
  const rule = (card && card.de) || '';
  const rows = Array.isArray(card && card.table) ? card.table.filter((r) => Array.isArray(r) && r.length) : [];
  const tip = Boolean(model || rule);
  if (!tip && !rows.length) return [];
  if (!rows.length) return ['tip'];
  if (!tip) return ['table'];
  if (wordCount(model) + wordCount(rule) <= 30 && rows.length <= 4) return ['all'];
  return ['tip', 'table'];
}

const clean = (s) => String(s || '').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase();
const DOTS = /^[…–-]$/;

/**
 * The forms a rule card teaches, read off its table: every one-word cell of a column (the first
 * column holds the persons or labels, a „…" column the rest of the sentence — both skipped), and
 * in a column of phrases the one word that changes („mein Vater", „Ihr Vater" → mein, Ihr).
 * The tokens its `caseMarks` name count too. Lower case.
 */
export function ruleForms(card) {
  const table = Array.isArray(card && card.table) ? card.table : [];
  const header = table[0] || [];
  const body = table.slice(1);
  const cols = table.reduce((m, r) => Math.max(m, Array.isArray(r) ? r.length : 0), 0);
  const out = new Set();
  for (let c = 0; c < cols; c += 1) {
    if (c === 0 && cols > 1) continue;
    if (DOTS.test(String(header[c] || '').trim())) continue;
    const multi = [];
    for (const row of body) {
      const ws = String((row && row[c]) || '').split(/\s+/).filter(Boolean).map(clean);
      if (ws.length === 1) out.add(ws[0]);
      else if (ws.length > 1) multi.push(ws);
    }
    if (multi.length < 2) continue;
    let pre = 0;
    while (multi.every((w) => w.length > pre + 1 && w[pre] === multi[0][pre])) pre += 1;
    let suf = 0;
    while (multi.every((w) => w.length > pre + suf + 1 && w[w.length - 1 - suf] === multi[0][multi[0].length - 1 - suf])) suf += 1;
    if (!pre && !suf) continue;
    for (const w of multi) {
      const mid = w.slice(pre, w.length - suf);
      if (mid.length === 1) out.add(mid[0]);
    }
  }
  for (const m of (card && card.caseMarks) || []) out.add(clean(m && m.token));
  out.delete('');
  return out;
}

/**
 * The model sentence as segments [{ text, strong }] with the taught forms marked — whitespace kept,
 * so the segments join back to the sentence. Nothing is marked when nothing matches, or when so much
 * would be (more than 3 words and 40 % of the sentence) that the mark would stop meaning anything.
 */
export function emphasize(sentence, card) {
  const src = String(sentence || '');
  if (!src) return [];
  const forms = ruleForms(card);
  const parts = src.split(/(\s+)/);
  const hit = parts.map((p) => (/\S/.test(p) ? forms.has(clean(p)) : false));
  const words = parts.filter((p) => /\S/.test(p)).length;
  const n = hit.filter(Boolean).length;
  if (!n || n > Math.max(3, Math.floor(words * 0.4))) return [{ text: src, strong: false }];
  const out = [];
  const plain = (text) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last && !last.strong) last.text += text;
    else out.push({ text, strong: false });
  };
  parts.forEach((p, i) => {
    if (!hit[i]) { plain(p); return; }
    // the mark sits on the word, not on its punctuation („auf." → auf + „.")
    const m = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(p);
    plain(m[1]);
    out.push({ text: m[2], strong: true });
    plain(m[3]);
  });
  return out;
}
