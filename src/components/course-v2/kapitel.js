// Course v2 — the Kapitel view of a unit, pure (owner feedback 2026-09-29: "make it a CURRICULUM
// like the books — chapters, and in each chapter multiple things to learn … no German grammar, no
// listening, no questions visible"). Everything here is derived from data the unit already carries;
// nothing is authored twice. No React, no import.meta: tests/course-v2-chapter.test.mjs runs it.
//
//   the table of contents   tocRows()         Einstieg, A / B / C, Prüfungstraining, Sprechen,
//                                             Schreiben, Kapiteltest — each a row the learner taps
//   the stages of a step    stagesOf()        Wortschatz · Hören · Grammatik · Übungen · …, the strip
//                                             and the numbered exercise headings („A3 Grammatik")
//   the back matter         unitCardIds(), unitWordGroups(), nounParts()
//   the level reference     grammarChapters(), wordChapters(), searchWords()

import { sectionsOf } from '../../lib/course-v2/curriculum.js';

const INPUT_SKILLS = { dialog: ['hoeren'], text: ['lesen'], mixed: ['hoeren', 'lesen'] };
const SITUATION = ['situation', 'text', 'sprache'];

/**
 * The unit's outline derived from its own steps — the same rule as the compiler's `outlineOf`
 * (scripts/course-v2/lib/compiler.mjs), for a manifest row compiled before the outline existed.
 * The spine labels live in the registries, not in the SPA, so `grammar.short` is null here.
 */
export function outlineFromUnit(unit) {
  return (Array.isArray(unit && unit.steps) ? unit.steps : []).map((s, i) => {
    const skills = [];
    const add = (k) => { if (!skills.includes(k)) skills.push(k); };
    const poolSize = Array.isArray(s.pool && s.pool.items) ? s.pool.items.length : 0;
    if (SITUATION.includes(s.kind)) {
      add('wortschatz');
      for (const k of INPUT_SKILLS[s.input && s.input.kind] || []) add(k);
      if (s.structure) add('grammatik');
      if (poolSize) add('ueben');
      if (s.microOutput && s.microOutput.mode === 'spoken') add('sprechen');
      if (s.microOutput && s.microOutput.mode === 'written') add('schreiben');
      if (s.aussprache) add('aussprache');
    } else if (s.kind === 'pruefung') add('pruefung');
    else if (s.kind === 'sprechen') add('sprechen');
    else if (s.kind === 'schreiben' || s.kind === 'ueberarbeiten') add('schreiben');
    else if (s.kind === 'check') add('test');
    const teile = [
      ...(Array.isArray(s.blocks) ? s.blocks.map((b) => b && b.template) : []),
      ...(Array.isArray(s.task && s.task.parts) ? s.task.parts.map((p) => p && p.template) : []),
      s.task && s.task.template,
    ].filter((t) => typeof t === 'string');
    return {
      nr: i + 1,
      id: s.id,
      kind: s.kind,
      title: typeof s.title === 'string' ? s.title : null,
      skills,
      grammar: s.structure ? { id: s.structure, short: null, label: null } : null,
      ruleCard: typeof s.ruleCard === 'string' ? s.ruleCard : null,
      input: s.input ? { kind: s.input.kind || null, title: s.input.title || null } : null,
      teile: [...new Set(teile)],
      items: poolSize,
    };
  });
}

/** The manifest row of a unit (units[].unit is the unit id). */
export function manifestRowOf(course, unitId) {
  return ((course && course.units) || []).find((r) => r && (r.unit === unitId || r.id === unitId)) || null;
}

/** The compiled outline of the manifest row when it has one, else the one derived from the unit. */
export function unitOutline(unit, course) {
  const row = manifestRowOf(course, unit && unit.id);
  return row && Array.isArray(row.outline) && row.outline.length ? row.outline : outlineFromUnit(unit);
}

/** The unit's Lehrwerk sections (curriculum.js sectionsOf): A / B / C, then the fixed ones. */
export const chapterSections = (unit, course) => sectionsOf(unitOutline(unit, course));

/** The section of one step (its letter, grammar, input), or null. */
export const sectionOf = (sections, stepId) => (sections || []).find((s) => s.id === stepId) || null;

/**
 * A writing Aufgabe that is a form to fill (SCHEMA §9 form_fill — sd1.s1, ta2.s1): its fields are
 * checked deterministically (WritingTaskView FormTask), no KI reads it — so no label may promise
 * „KI-Korrektur" on it. The fact is the task's own `form`, never a list of templates.
 */
export const isFormTask = (task) => Boolean(task && task.form && typeof task.form === 'object');

/**
 * The table of contents of the Kapitel page: one row per step, in order, with its state —
 * 'done' (finished), 'current' (where „Weiter" leads) or 'open' — its planned minutes, and
 * `form` (a Schreiben row whose Aufgabe is a form to fill: „Schreiben (Formular)").
 */
export function tocRows({ unit, course = null, finished = new Set(), currentIndex = -1 }) {
  const byStep = (unit && unit.minutesPlanned && unit.minutesPlanned.byStep) || {};
  const steps = (unit && unit.steps) || [];
  return chapterSections(unit, course).map((s, i) => ({
    ...s,
    index: i,
    minutes: Number(byStep[s.id]) || null,
    form: isFormTask((steps.find((st) => st && st.id === s.id) || {}).task),
    state: finished.has(s.id) ? 'done' : i === currentIndex ? 'current' : 'open',
  }));
}

// ---------------------------------------------------------------------------
// Rule cards and words of one Kapitel (the back matter)
// ---------------------------------------------------------------------------

/** The rule cards a unit's steps show, in step order, each once. */
export function unitCardIds(unit) {
  const out = [];
  for (const s of (unit && unit.steps) || []) if (s && s.ruleCard && !out.includes(s.ruleCard)) out.push(s.ruleCard);
  return out;
}

/** Look cards up by id in the level's cards (a map { id: card }, an array, or { cards: [] }). */
export function cardsByIds(ids, cards) {
  const list = Array.isArray(cards) ? cards : Array.isArray(cards && cards.cards) ? cards.cards : Object.values(cards || {});
  const byId = new Map(list.filter((c) => c && c.id).map((c) => [c.id, c]));
  return (ids || []).map((id) => byId.get(id)).filter(Boolean);
}

/**
 * The short name of every grammar point the manifest's outlines tag (outline `grammar.id` →
 * `grammar.short`, the first wording wins): the name a rule card carries is its OWN spine's —
 * „Verben mit Vokalwechsel" on rc.vokalwechsel-2 even where the step that shows it is tagged
 * g.akkusativ (a1.1-u09-ls2: the Akkusativ step teaches „nehmen" on the way) — never the step's,
 * or the chip contradicts the card under it (DaF review 2026-09-30, DAF-04).
 */
export function spineShortNames(course) {
  const out = new Map();
  for (const r of (course && course.units) || []) {
    for (const s of (r && Array.isArray(r.outline) ? r.outline : [])) {
      if (s && s.grammar && s.grammar.id && s.grammar.short && !out.has(s.grammar.id)) out.set(s.grammar.id, s.grammar.short);
    }
  }
  return out;
}

/**
 * The grammar point's short name for a rule card of this unit: the card's own spine as the
 * outlines name it (spineShortNames), else the label of the step that shows it.
 */
export function cardTitle(unit, course, cardId) {
  const card = cardsByIds([cardId], unit && unit.ruleCards)[0] || null;
  const own = card && card.spine ? spineShortNames(course).get(card.spine) : null;
  if (own) return own;
  const step = ((unit && unit.steps) || []).find((s) => s && s.ruleCard === cardId);
  const sec = step ? sectionOf(chapterSections(unit, course), step.id) : null;
  return (sec && sec.grammar && sec.grammar.short) || null;
}

/** The level's words that belong to this unit (words.json `unit`). */
export const wordsOfUnit = (words, unitId) => (Array.isArray(words) ? words : []).filter((w) => w && w.unit === unitId);

/**
 * The unit's words grouped the way the unit spec groups them (spec.lexiconBlocks: { title,
 * lemmas: [lx ids] }); words of the unit in no block come last, under a null title.
 */
export function unitWordGroups(unit, words) {
  const own = wordsOfUnit(words, unit && unit.id);
  const byId = new Map(own.map((w) => [w.id, w]));
  const used = new Set();
  const groups = [];
  for (const b of (unit && unit.spec && unit.spec.lexiconBlocks) || []) {
    const list = (b.lemmas || []).map((id) => byId.get(id)).filter((w) => w && !used.has(w.id));
    list.forEach((w) => used.add(w.id));
    if (list.length) groups.push({ title: b.title || null, words: list });
  }
  const rest = own.filter((w) => !used.has(w.id));
  if (rest.length) groups.push({ title: null, words: rest });
  return groups;
}

const UMLAUT = { ä: 'a', ö: 'o', ü: 'u', Ä: 'A', Ö: 'O', Ü: 'U' };

/**
 * A noun's plural the way the Lehrwerke print it after the lemma: „-n", „-e", „-s", „-" (no
 * change), „¨-e" (umlaut plus ending), „¨-" (umlaut only) — else the whole plural (das Museum,
 * Museen). null without a plural.
 */
export function pluralSuffix(lemma, plural) {
  const l = String(lemma || '');
  const p = String(plural || '');
  if (!l || !p) return null;
  if (p === l) return '-';
  if (p.startsWith(l)) return `-${p.slice(l.length)}`;
  for (let i = p.length - 1; i >= 0; i -= 1) {
    const base = UMLAUT[p[i]];
    if (!base) continue;
    const undone = p.slice(0, i) + base + p.slice(i + 1);
    if (undone === l) return '¨-';
    if (undone.startsWith(l)) return `¨-${undone.slice(l.length)}`;
  }
  return p;
}

/**
 * How a word is printed in a word list: a noun as article + lemma + plural („die Sprachschule, -n",
 * „die Stadt, ¨-e"), a plural-only noun with „die" and a Pl. note, a singular-only one with a Sg.
 * note; everything else as its lemma. `say` is what the audio button speaks.
 */
export function nounParts(word) {
  const w = word || {};
  if (w.pos !== 'NOUN') return { article: null, lemma: w.lemma || '', plural: null, note: null, say: w.lemma || '' };
  if (w.plural_kind === 'plural-only') return { article: 'die', lemma: w.lemma, plural: null, note: 'pl', say: `die ${w.lemma}` };
  const plural = w.plural_kind === 'singular-only' ? null : pluralSuffix(w.lemma, w.plural);
  return {
    article: w.article || null,
    lemma: w.lemma,
    plural,
    note: w.plural_kind === 'singular-only' ? 'sg' : null,
    say: w.article ? `${w.article} ${w.lemma}` : w.lemma,
  };
}

// ---------------------------------------------------------------------------
// The words a step's text uses („Vor dem Hören / Vor dem Lesen")
// ---------------------------------------------------------------------------

const lower = (s) => String(s || '').toLowerCase();
const tokensOf = (text) => (String(text || '').match(/[\p{L}-]+/gu) || []).map(lower);

function formsOf(w) {
  const lem = lower(w.lemma).replace(/^sich /, '');
  if (lem.includes(' ')) return { phrase: lem };
  if (w.pos === 'NOUN') {
    const forms = new Set([lem, `${lem}s`, `${lem}n`, `${lem}en`]);
    if (w.plural) forms.add(lower(w.plural));
    return { forms };
  }
  if (w.pos === 'VERB') {
    const stem = lem.endsWith('en') ? lem.slice(0, -2) : lem.endsWith('n') ? lem.slice(0, -1) : lem;
    const forms = new Set([lem, ...['e', 'st', 't', 'en', 'n', 'et', 'est'].map((e) => stem + e)]);
    return { forms };
  }
  return { forms: new Set([lem, `${lem}e`, `${lem}en`, `${lem}er`, `${lem}es`, `${lem}em`]) };
}

/** The German text of a step's input: its lines and its reading text. */
export function inputText(step) {
  const input = (step && step.input) || {};
  const lines = Array.isArray(input.lines) ? input.lines.map((l) => (l && l.de) || '') : [];
  const text = input.text && typeof input.text === 'object' ? input.text.de || '' : typeof input.text === 'string' ? input.text : '';
  return [...lines, text].filter(Boolean).join('\n');
}

/**
 * The unit's words that the step's input uses, in the order the text first uses them (at most
 * `max`): the „Wortschatz" box before the learner hears or reads it. A word matches by its lemma,
 * its plural, or (verbs) a regular present-tense form; a phrase („ein bisschen") by its words.
 */
export function stepWords(step, unitWords, max = 8) {
  const text = inputText(step);
  if (!text || !Array.isArray(unitWords) || !unitWords.length) return [];
  const toks = tokensOf(text);
  const low = lower(text);
  const hits = [];
  for (const w of unitWords) {
    if (!w || !w.lemma) continue;
    const f = formsOf(w);
    let at = -1;
    if (f.phrase) at = low.indexOf(f.phrase);
    else at = toks.findIndex((t) => f.forms.has(t));
    if (at >= 0) hits.push({ w, at: f.phrase ? tokensOf(low.slice(0, at)).length : at });
  }
  return hits.sort((a, b) => a.at - b.at).slice(0, max).map((h) => h.w);
}

// ---------------------------------------------------------------------------
// The stages of one step: the textbook section strip and the numbered headings
// (round 3, 2026-09-30: the step no longer draws them — one thing per screen, steps.js; the
// helpers stay pure and tested for a guide view that wants the Lehrwerk numbering back)
// ---------------------------------------------------------------------------

// StepView's segment ids → the Lehrwerk skill they train. The input and its questions are one
// stage (Hören or Lesen), the rule card and its structured practice one (Grammatik), and so on.
const SEG_SKILL = {
  warmup: 'wortschatz',
  words: 'wortschatz',
  form: 'grammatik',
  structured: 'grammatik',
  table: 'grammatik',
  practice: 'ueben',
  cloze: 'ueben',
  aussprache: 'aussprache',
  redemittel: 'redemittel',
  exit: 'abschluss',
};

/** The SkillIcon a stage shows (SkillIcon knows the SKILL_ORDER skills; the two others borrow one). */
export const stageIcon = (skill) => (skill === 'redemittel' ? 'wortschatz' : skill === 'abschluss' ? 'test' : skill);

/**
 * The stages of a step from its ordered segments ({ id, block? }): consecutive segments that
 * train the same skill form one stage. An exam block is a stage of its own (its Teil). The
 * closing 'end' and the single-segment Aufgaben/Check are no stage.
 *   → [{ key, skill, segs: [segId], block }]
 */
export function stagesOf(segments, step) {
  const input = step && step.input && step.input.kind === 'text' ? 'lesen' : 'hoeren';
  const micro = step && step.microOutput && step.microOutput.mode === 'written' ? 'schreiben' : 'sprechen';
  const skillOf = (id) => (id === 'input' || id === 'inputItems' || id === 'inputBlock' ? input : id === 'micro' ? micro : SEG_SKILL[id] || null);
  const out = [];
  for (const seg of segments || []) {
    if (!seg || seg.id === 'end') continue;
    if (seg.block) { out.push({ key: seg.id, skill: 'pruefung', segs: [seg.id], block: seg.block }); continue; }
    const skill = skillOf(seg.id);
    if (!skill) continue;
    const last = out[out.length - 1];
    if (last && !last.block && last.skill === skill) last.segs.push(seg.id);
    else out.push({ key: `${skill}-${out.length}`, skill, segs: [seg.id], block: null });
  }
  return out;
}

/**
 * The exercise number of a segment, Lehrwerk style: the section letter, the stage number, and a
 * sub-letter where one stage has several parts — „A2", „A3a", „A3b". null outside a stage.
 */
export function exerciseNr(stages, segId, letter) {
  const i = (stages || []).findIndex((s) => s.segs.includes(segId));
  if (i < 0) return null;
  const st = stages[i];
  const sub = st.segs.length > 1 ? 'abcdefgh'[st.segs.indexOf(segId)] || '' : '';
  return `${letter || ''}${i + 1}${sub}`;
}

// ---------------------------------------------------------------------------
// The level reference pages
// ---------------------------------------------------------------------------

const unitRows = (manifest) => ((manifest && manifest.units) || []).filter((r) => r && r.unit).slice().sort((a, b) => (a.nr || 0) - (b.nr || 0));

/**
 * The level's rule cards by Kapitel, in course order: a Kapitel lists the cards of the grammar its
 * steps teach (outline `grammar.id` = the card's spine). A spine taught again later gets its next
 * card by depth (rc.praesens → rc.praesens-2); taught again without a deeper card it becomes a
 * „see Kapitel n" reference instead of the same card twice. Cards no outline names come last,
 * under nr null. Without any outline every card comes in one group.
 *   → [{ nr, unitId, title, cards: [card], titles: { cardId: short name }, seeAlso: [{ card, nr, title }] }]
 */
export function grammarChapters(manifest, cards) {
  const list = Array.isArray(cards) ? cards : Array.isArray(cards && cards.cards) ? cards.cards : Object.values(cards || {});
  const all = list.filter((c) => c && c.id);
  const rows = unitRows(manifest).filter((r) => Array.isArray(r.outline) && r.outline.length);
  if (!rows.length) return all.length ? [{ nr: null, unitId: null, title: null, cards: all, seeAlso: [], titles: {} }] : [];
  const bySpine = new Map();
  for (const c of all) {
    const k = c.spine || c.id;
    if (!bySpine.has(k)) bySpine.set(k, []);
    bySpine.get(k).push(c);
  }
  for (const arr of bySpine.values()) arr.sort((a, b) => (a.depth || 1) - (b.depth || 1));
  const placed = new Map(); // card id → Kapitel nr
  const out = [];
  // Compiled outlines name each step's rule card (outline `ruleCard`): a card then belongs to the
  // Kapitel whose step first shows it — a card about „nehmen" with the Akkusativ belongs where it is
  // taught, not where its spine is first tagged — and a step whose grammar tag names another card's
  // spine points back to where that grammar was taught („siehe Kapitel 6").
  if (rows.some((r) => r.outline.some((s) => s && s.ruleCard))) {
    const byId = new Map(all.map((c) => [c.id, c]));
    const spineShort = new Map();
    for (const r of rows) for (const s of r.outline) if (s && s.grammar && s.grammar.id && s.grammar.short && !spineShort.has(s.grammar.id)) spineShort.set(s.grammar.id, s.grammar.short);
    for (const r of rows) {
      const chapter = { nr: r.nr, unitId: r.unit, title: r.title || null, cards: [], seeAlso: [], titles: {} };
      const refer = (card, title) => {
        if (placed.get(card.id) !== r.nr && !chapter.seeAlso.some((x) => x.card.id === card.id)) chapter.seeAlso.push({ card, nr: placed.get(card.id), title });
      };
      for (const s of r.outline) {
        if (!s) continue;
        const card = s.ruleCard ? byId.get(s.ruleCard) : null;
        if (card && !placed.has(card.id)) {
          chapter.cards.push(card);
          chapter.titles[card.id] = spineShort.get(card.spine) || (s.grammar && s.grammar.short) || null;
          placed.set(card.id, r.nr);
        } else if (card) refer(card, spineShort.get(card.spine) || null);
        if (s.grammar && s.grammar.id && (!card || card.spine !== s.grammar.id)) {
          const earlier = [...placed.keys()].map((id) => byId.get(id)).filter((c) => c && c.spine === s.grammar.id).pop();
          if (earlier) refer(earlier, s.grammar.short || null);
        }
      }
      if (chapter.cards.length || chapter.seeAlso.length) out.push(chapter);
    }
    const unused = all.filter((c) => !placed.has(c.id));
    if (unused.length) out.push({ nr: null, unitId: null, title: null, cards: unused, seeAlso: [], titles: {} });
    return out;
  }
  const seen = new Map(); // spine → times taught so far
  for (const r of rows) {
    const spines = new Map(); // spine → its short name in this Kapitel's outline
    for (const s of r.outline) if (s && s.grammar && s.grammar.id && !spines.has(s.grammar.id)) spines.set(s.grammar.id, s.grammar.short || null);
    const chapter = { nr: r.nr, unitId: r.unit, title: r.title || null, cards: [], seeAlso: [], titles: {} };
    for (const [spine, short] of spines) {
      const arr = bySpine.get(spine);
      if (!arr || !arr.length) continue;
      const k = (seen.get(spine) || 0) + 1;
      seen.set(spine, k);
      const fresh = arr.find((c) => (c.depth || 1) === k && !placed.has(c.id)) || arr.find((c) => !placed.has(c.id) && (c.depth || 1) <= k);
      if (fresh) { chapter.cards.push(fresh); chapter.titles[fresh.id] = short; placed.set(fresh.id, r.nr); continue; }
      const earlier = arr.filter((c) => placed.has(c.id)).pop();
      if (earlier && !chapter.seeAlso.some((x) => x.card.id === earlier.id)) chapter.seeAlso.push({ card: earlier, nr: placed.get(earlier.id), title: short });
    }
    if (chapter.cards.length || chapter.seeAlso.length) out.push(chapter);
  }
  const rest = all.filter((c) => !placed.has(c.id));
  if (rest.length) out.push({ nr: null, unitId: null, title: null, cards: rest, seeAlso: [], titles: {} });
  return out;
}

/** The level's words by Kapitel, in course order (words.json `unit`); words of no listed unit last. */
export function wordChapters(manifest, words) {
  const list = Array.isArray(words) ? words.filter((w) => w && w.lemma) : [];
  const rows = unitRows(manifest);
  const out = rows.map((r) => ({ nr: r.nr, unitId: r.unit, title: r.title || null, words: list.filter((w) => w.unit === r.unit) })).filter((c) => c.words.length);
  const known = new Set(rows.map((r) => r.unit));
  const rest = list.filter((w) => !known.has(w.unit));
  if (rest.length) out.push({ nr: null, unitId: null, title: null, words: rest });
  return out;
}

/** Search folding: lower case, no diacritics, ß = ss (so „strasse" finds „Straße", „mochte" „möchte"). */
export function fold(s) {
  return String(s || '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

/** The words whose lemma, plural, article + lemma or English gloss contain the query (folded). */
export function searchWords(words, query) {
  const q = fold(query);
  const list = Array.isArray(words) ? words : [];
  if (!q) return list;
  return list.filter((w) => {
    if (!w) return false;
    const hay = [w.lemma, w.plural, w.article ? `${w.article} ${w.lemma}` : '', w.gloss].map(fold);
    return hay.some((h) => h && h.includes(q));
  });
}
