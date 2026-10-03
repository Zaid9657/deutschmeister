// Course v2 — the exam block step by step (owner feedback 2026-09-30: "it looks intimidating and too
// much, can we change the view to make it in duolingo style and for everything to be step for step").
// Before: one 3000 px screen — the Teil's chips, the instruction, a strategy box with its English twin
// printed in full, then Gespräch 1 … 6 with every listen button, question and option stacked. Now:
// an intro (instruction, one Tipp, „6 Aufgaben · Lernmodus", START), a read screen for a text several
// tasks share, and one task per screen with its material, its question, „Prüfen" in the bottom bar
// and the feedback sheet. Pins:
//   - the pure screen plan (src/components/course-v2/examSteps.js), checked against EVERY compiled
//     exam block (units, Plateaus, the Halbtest): every item exactly once in its authored order, a
//     shared or long text read on its own screen before its first task and never printed in full
//     above a question again, a gap item's excerpt holding its gap, the listening texts kept whole;
//   - the helpers: the gap of a cloze item, the sentence a gap needs, the strategy's body without its
//     „Hören Teil 1:" lead, a card body without its repeated title, the progress fraction;
//   - the view (ExamBlockView.jsx): the one action of every screen in the bottom bar, ItemView per task
//     (never `compact`), the counter, the English strategy only behind its toggle, the play count and
//     the transcript rule, the onDone/onAttempt contract, the optional onProgress, and the rules that
//     travel with every course screen (tokens, no kasus hue, Sie, both chrome languages, 44 px).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  examScreens, textReaders, gapOf, gapMarker, gapExcerpt, strategyBody, bodyOf, isListening, examProgress, LONG_TEXT,
} from '../src/components/course-v2/examSteps.js';
import { resolveText, teilLabel } from '../src/components/course-v2/content.js';
import { assessmentSections } from '../src/lib/course-v2/assessment.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const V2 = 'src/components/course-v2';
const DATA = 'src/data/course-v2';
const VIEW = `${V2}/ExamBlockView.jsx`;

// Every compiled exam block with the texts it resolves against, and the strategy cards.
const BLOCKS = [];
const CARDS = [];
for (const level of readdirSync(join(ROOT, DATA))) {
  const units = join(ROOT, DATA, level, 'units');
  if (existsSync(units)) {
    for (const f of readdirSync(units).filter((x) => x.endsWith('.json'))) {
      const unit = json(`${DATA}/${level}/units/${f}`);
      for (const step of unit.steps || []) {
        for (const b of step.blocks || []) BLOCKS.push({ where: `${level}/${f} ${step.id}`, block: b, texts: step.texts || [] });
        if (step.examBlock) BLOCKS.push({ where: `${level}/${f} ${step.id} examBlock`, block: step.examBlock, texts: step.texts || [] });
        for (const c of step.strategyCards || []) CARDS.push({ where: `${level}/${f}`, card: c });
      }
    }
  }
  for (const sub of ['plateaus', 'closing']) {
    const dir = join(ROOT, DATA, level, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      const doc = json(`${DATA}/${level}/${sub}/${f}`);
      for (const s of assessmentSections(doc).filter((x) => x.kind === 'block')) {
        BLOCKS.push({ where: `${level}/${sub}/${f} ${s.id}`, block: s.part, texts: doc.texts || [] });
      }
    }
  }
}

test('the corpus: exam blocks from units, Plateaus and the Halbtest, and their strategy cards', () => {
  assert.ok(BLOCKS.length >= 40, `only ${BLOCKS.length} exam blocks found`);
  assert.ok(BLOCKS.some((b) => /plateaus/.test(b.where)), 'Plateau blocks are in the corpus');
  assert.ok(BLOCKS.some((b) => /closing/.test(b.where)), 'Halbtest blocks are in the corpus');
  assert.ok(CARDS.length >= 25);
});

// ---------------------------------------------------------------------------------------------
// the plan, against every compiled block
// ---------------------------------------------------------------------------------------------

test('every block: ONE intro first, then every item exactly once as its own task, in the authored order', () => {
  for (const { where, block, texts } of BLOCKS) {
    const screens = examScreens(block, texts);
    assert.equal(screens[0].kind, 'intro', `${where}: the intro comes first`);
    assert.equal(screens.filter((s) => s.kind === 'intro').length, 1, `${where}: one intro`);
    const tasks = screens.filter((s) => s.kind === 'task');
    assert.deepEqual(tasks.map((s) => s.item.id), block.items.map((i) => i.id), `${where}: every item once, authored order`);
    tasks.forEach((s, i) => {
      assert.equal(s.n, i + 1, `${where}: the counter`);
      assert.equal(s.total, block.items.length);
    });
    for (let i = 1; i < screens.length; i += 1) {
      assert.ok(!(screens[i].kind === 'read' && screens[i - 1].kind === 'read'), `${where}: two read screens in a row are one`);
    }
    assert.ok(screens.every((s) => ['intro', 'read', 'task'].includes(s.kind)));
  }
});

test('every block: a listening text plays on its task; a reading text is in full above a question only when it is short and the task’s own', () => {
  let listen = 0; let full = 0; let folded = 0; let excerpt = 0;
  for (const { where, block, texts } of BLOCKS) {
    const pool = [...(block.texts || []), ...texts];
    const readers = textReaders(block, texts);
    const choiceIds = new Set((block.choices || []).filter((c) => c.textRef).map((c) => resolveText(c.textRef, pool)?.id).filter(Boolean));
    for (const s of examScreens(block, texts).filter((x) => x.kind === 'task')) {
      const x = s.item.textRef ? resolveText(s.item.textRef, pool) : null;
      assert.equal(s.text, x, `${where} ${s.item.id}: the task carries its item’s text`);
      if (!x) { assert.equal(s.show, null); continue; }
      if (isListening(x)) { assert.equal(s.show, 'listen', `${where} ${s.item.id}`); listen += 1; continue; }
      const own = (readers.get(x.id) || []).length === 1 && !choiceIds.has(x.id) && String(x.text || '').length <= LONG_TEXT;
      if (own) { assert.equal(s.show, 'full', `${where} ${s.item.id}: a short text of its own is shown in full`); full += 1; continue; }
      assert.ok(['excerpt', 'ref'].includes(s.show), `${where} ${s.item.id}: a shared text is never printed in full above the question (${s.show})`);
      if (s.show === 'excerpt') excerpt += 1; else folded += 1;
    }
  }
  assert.ok(listen >= 60 && full >= 30 && folded >= 15 && excerpt >= 25, `listen ${listen} · full ${full} · folded ${folded} · excerpt ${excerpt}`);
});

test('every block: a shared or long text is read on its own screen, once, before the first task that reads it', () => {
  for (const { where, block, texts } of BLOCKS) {
    const screens = examScreens(block, texts);
    const readAt = new Map();
    screens.forEach((s, i) => {
      if (s.kind !== 'read') return;
      assert.ok(s.texts.length + s.bank.length > 0, `${where}: an empty read screen`);
      for (const x of s.texts) {
        assert.ok(!readAt.has(x.id), `${where}: ${x.id} is read twice`);
        readAt.set(x.id, i);
      }
    });
    screens.forEach((s, i) => {
      if (s.kind !== 'task' || !['excerpt', 'ref'].includes(s.show)) return;
      assert.ok(readAt.has(s.text.id) && readAt.get(s.text.id) < i, `${where} ${s.item.id}: its text was read before it`);
    });
    // the texts the block's choices name (a set of ads) and its word bank: read right after the intro
    const withChoiceTexts = screens.filter((s) => s.kind === 'task' && s.choiceTexts.length);
    if (withChoiceTexts.length) {
      assert.equal(screens[1].kind, 'read', `${where}: the choice texts are read after the intro`);
      for (const x of withChoiceTexts[0].choiceTexts) assert.equal(readAt.get(x.id), 1);
      for (const x of withChoiceTexts[0].choiceTexts) assert.ok(withChoiceTexts[0].keys[x.id], `${where}: ${x.id} carries its choice key`);
    }
    if ((block.choices || []).some((c) => c.de && !c.textRef)) {
      assert.ok(screens.some((s) => s.kind === 'read' && s.bank.length === block.choices.filter((c) => c.de && !c.textRef).length), `${where}: the word bank is read`);
    }
  }
});

test('every gap item: its task shows the sentence of ITS gap, and the gap is in it', () => {
  let n = 0;
  for (const { where, block, texts } of BLOCKS) {
    for (const s of examScreens(block, texts).filter((x) => x.kind === 'task' && x.show === 'excerpt')) {
      assert.equal(s.gap, gapOf(s.item), `${where} ${s.item.id}`);
      const cut = gapExcerpt(bodyOf(s.text), s.gap);
      assert.ok(cut && cut.text.includes(gapMarker(s.gap)), `${where} ${s.item.id}: the excerpt holds ⟦${s.gap}⟧`);
      assert.ok(cut.text.length < bodyOf(s.text).length, `${where} ${s.item.id}: an excerpt, not the whole text`);
      assert.ok(cut.text.length <= 400, `${where} ${s.item.id}: the excerpt stays short (${cut.text.length})`);
      n += 1;
    }
  }
  assert.ok(n >= 25, `${n} gap tasks`);
});

// ---------------------------------------------------------------------------------------------
// the helpers
// ---------------------------------------------------------------------------------------------

test('gapOf: the gap a cloze item names', () => {
  assert.equal(gapOf({ promptDe: 'Lücke 3: Welches Wort passt?' }), 3);
  assert.equal(gapOf({ promptDe: 'Lücke 10' }), 10);
  assert.equal(gapOf({ promptDe: 'Gap 2 — which word fits?' }), 2);
  assert.equal(gapOf({ promptDe: 'Woher kommt Anna?' }), null);
  assert.equal(gapOf({}), null);
  assert.equal(gapOf(null), null);
  assert.equal(gapMarker(3), '⟦03⟧');
  assert.equal(gapMarker(12), '⟦12⟧');
});

test('gapExcerpt: the sentence of the gap and the one before it, never split at a date', () => {
  const text = 'Liebe Olena,\ndanke für die E-Mail! Wir planen am Freitag, dem 19. Juni, einen Teamtag. Das Haus liegt am See, ⟦02⟧ uns gefällt. Bis bald!\nPriya';
  const cut = gapExcerpt(text, 2);
  assert.equal(cut.text, 'Wir planen am Freitag, dem 19. Juni, einen Teamtag. Das Haus liegt am See, ⟦02⟧ uns gefällt.');
  assert.equal(cut.before, true);
  assert.equal(cut.after, true);
  const first = gapExcerpt('⟦01⟧ kommt Anna. Dann Paul.', 1);
  assert.deepEqual(first, { text: '⟦01⟧ kommt Anna.', before: false, after: true });
  const last = gapExcerpt('Ich komme. Dann ⟦01⟧ ich.', 1);
  assert.deepEqual(last, { text: 'Ich komme. Dann ⟦01⟧ ich.', before: false, after: false });
  assert.equal(gapExcerpt('Kein Platzhalter.', 1), null);
  assert.equal(gapExcerpt(null, 1), null);
  // a paragraph break inside the excerpt is one line break
  assert.equal(gapExcerpt('Sehr geehrte Damen und Herren,\n\nich habe gelesen, ⟦01⟧ Sie vermieten.', 1).text, 'Sehr geehrte Damen und Herren,\nich habe gelesen, ⟦01⟧ Sie vermieten.');
});

test('strategyBody: the card without its „Hören Teil 1:" lead — the screen already names the Teil', () => {
  assert.equal(strategyBody('Hören Teil 1: Sie hören sechs Gespräche.'), 'Sie hören sechs Gespräche.');
  assert.equal(strategyBody('Listening part 1: six short conversations.'), 'Six short conversations.');
  assert.equal(strategyBody('Sprachbausteine Teil 2: Lesen Sie zuerst den Brief.'), 'Lesen Sie zuerst den Brief.');
  assert.equal(strategyBody('Lesen Sie zuerst die Frage: Wer? Wo?'), 'Lesen Sie zuerst die Frage: Wer? Wo?', 'a colon that is no Teil lead stays');
  assert.equal(strategyBody(''), '');
  for (const { where, card } of CARDS) {
    for (const side of ['de', 'en']) {
      if (!card[side]) continue;
      const body = strategyBody(card[side]);
      assert.ok(body.length >= 40, `${where} ${card.template} ${side}: a body is left`);
      assert.ok(card[side].toLowerCase().endsWith(body.toLowerCase()), `${where} ${card.template} ${side}: only the lead is dropped`);
      assert.ok(!body.startsWith(teilLabel(card.template)), `${where} ${card.template} ${side}: no Teil lead left`);
      assert.doesNotMatch(body, /^[^:]{0,48}\b(?:Teil|part)\s+\d+\s*:/i, `${where} ${card.template} ${side}`);
    }
  }
});

test('bodyOf: a card prints the title once; examProgress: 0 at the intro, below 1 until the block is done', () => {
  assert.equal(bodyOf({ title: 'Mit dem Fahrrad', text: 'Mit dem Fahrrad\nJeden Samstag um 10 Uhr.' }), 'Jeden Samstag um 10 Uhr.');
  assert.equal(bodyOf({ title: 'Am Supermarkt', text: 'Geöffnet:\nMontag bis Freitag' }), 'Geöffnet:\nMontag bis Freitag');
  assert.equal(bodyOf({ text: 'Ohne Titel.' }), 'Ohne Titel.');
  assert.equal(bodyOf(null), '');
  assert.equal(examProgress(0, 7), 0);
  assert.ok(examProgress(6, 7) < 1);
  assert.equal(examProgress(9, 7), 1);
  assert.equal(examProgress(0, 0), 1);
  assert.equal(isListening({ kind: 'audio', lines: [] }), true);
  assert.equal(isListening({ kind: 'text', text: 'x' }), false);
  assert.equal(isListening({ lines: [{ id: 'l1', de: 'Hallo' }] }), true);
  assert.equal(examScreens(null).length, 0);
  assert.deepEqual(examScreens({ id: 'b', items: [] }).map((s) => s.kind), ['intro'], 'a block without items is its intro, whose START reports it');
});

// ---------------------------------------------------------------------------------------------
// the view
// ---------------------------------------------------------------------------------------------

test('ExamBlockView runs the plan: one action per screen in the bottom bar, ItemView per task with the sheet', () => {
  const src = read(VIEW);
  assert.match(src, /examScreens\(block, texts\)/);
  assert.equal((src.match(/<StickyAction>/g) || []).length, 2, 'the intro’s START and the read screen’s CONTINUE sit in the bottom bar');
  assert.match(src, /<GameButton onClick=\{next\}>\{t\('exam\.start'\)\}<\/GameButton>/);
  assert.match(src, /<GameButton onClick=\{next\}>\{t\('item\.next'\)\}<\/GameButton>/);
  assert.match(src, /<ItemView[\s\S]{0,400}onNext=\{next\}/, 'a task is one ItemView screen: „Prüfen" in the bottom bar, the feedback sheet, CONTINUE');
  assert.doesNotMatch(src, /\bcompact\b(?!\s*[:=]\s*false)/, 'no several-items-on-one-screen mode left');
  assert.equal((src.match(/<ItemView\b/g) || []).length, 1, 'one ItemView: the task’s');
  assert.doesNotMatch(src, /<section[^>]*animate-pop-in/, 'the pop-in’s transform never wraps the fixed bottom bar or the sheet');
  // the counter „3 / 6", read as „Aufgabe 3 von 6"
  assert.match(src, /<span aria-hidden="true">\{n\} \/ \{total\}<\/span>\s*<span className="sr-only">\{t\('item\.of', \{ n, total \}\)\}<\/span>/);
  // the chip row is gone: one muted line „Goethe-Zertifikat A1 · 6 Aufgaben · Lernmodus"
  assert.doesNotMatch(src, /<Chip\b/);
  assert.match(src, /t\('exam\.count', \{ n: total \}\)/);
  assert.match(src, /t\('exam\.lern'\)/);
});

test('the English strategy is never printed in full: English chrome only, behind its toggle', () => {
  const src = read(VIEW);
  assert.match(src, /const en = strategy && strategy\.en && lang !== 'de' \? strategyBody\(strategy\.en\) : null;/);
  assert.match(src, /aria-expanded=\{!!open\.en\}\s*aria-controls=\{enId\}/);
  assert.match(src, /<p id=\{enId\} hidden=\{!open\.en\}[^>]*lang="en">\{en\}<\/p>/);
  assert.equal(src.split('\n').filter((l) => l.includes('strategy.en')).length, 1, 'the English is read on one line: the toggle’s');
  assert.doesNotMatch(src, /\{strategy\.(?:en|de)\}/, 'the card is shown through strategyBody');
  assert.match(src, /const tip = strategy && strategy\.de \? strategyBody\(strategy\.de\) : null;/);
});

test('the exam rules stay: the lane’s play count, the transcript after the answer, the item contract', () => {
  const src = read(VIEW);
  assert.match(src, /const plays = playsFor\(block\);/);
  assert.match(src, /const left = plays == null \|\| answered \? null : Math\.max\(0, plays - used\);/, 'counted plays until answered, free afterwards');
  assert.match(src, /used=\{used\[x\.id\] \|\| 0\}/, 'the plays are counted per text across the block’s screens');
  assert.match(src, /\{plays != null && <p[^>]*>\{t\('exam\.playsRule', \{ n: plays \}\)\}<\/p>\}/, 'the intro says the lane’s play count once');
  assert.match(src, /\{answered \? \([\s\S]{0,200}t\('exam\.transcript'\)[\s\S]{0,900}t\('exam\.transcriptAfter'\)/, 'the transcript only after the answer');
  assert.match(src, /answered=\{answeredAll\(readers\.get\(x\.id\) \|\| /, 'answered = every item that reads the text');
  assert.match(src, /onAttempt\(\{ \.\.\.payload, stepId \}\)/);
  assert.match(src, /onDone\(\{ blockId: block\.id, correct, total \}\)/, 'the tally shape the players read');
  assert.match(src, /if \(reported\.current\) return;\s*reported\.current = true;/, 'onDone once');
  assert.match(src, /onProgress = null \}\)/, 'onProgress is optional');
  assert.match(src, /sink\.current\(examProgress\(pos, screens\.length\)\)/);
  // the item is graded by ItemView as ever; it only loses the textRef this view draws above it
  assert.match(src, /it\.textRef \? \{ \.\.\.it, textRef: undefined \} : it/);
  assert.doesNotMatch(src, /gradeAnswer|checkItem|checkAnswer/, 'no grading of its own');
});

test('the folded texts are disclosures: a real button, aria-expanded, aria-controls, ≥ 44 px, scroll inside', () => {
  const src = read(VIEW);
  const expanded = (src.match(/aria-expanded=/g) || []).length;
  assert.equal(expanded, (src.match(/aria-controls=/g) || []).length, 'every toggle names what it opens');
  assert.ok(expanded >= 2);
  assert.match(src, /const FOLD = 'flex min-h-11 w-full/);
  assert.match(src, /inline-flex min-h-11 items-center gap-1 rounded-xl px-2/, 'the English toggle is 44 px tall');
  assert.match(src, /const PANEL = 'mt-3 max-h-\[40vh\] overflow-y-auto/, 'an unfolded shared text scrolls inside its card');
  assert.match(src, /role="region" aria-label=\{text\.title \|\| undefined\} tabIndex=\{open \? 0 : -1\}/, 'the scrolling panel is reachable by keyboard');
  assert.match(src, /<span className="sr-only">\{t\('item\.gap', \{ n \}\)\}<\/span>/, 'a gap is read as „Lücke 3"');
});

test('ExamBlockView: course tokens only, no kasus hue, no du; every exam.* key in both tables, one block, in Sie', () => {
  const src = read(VIEW);
  assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, 'a hex colour outside design-tokens.js');
  assert.doesNotMatch(src, /\b(?:bg|text|border|fill|stroke|ring|shadow)-(?:amber|rose|red|green|blue|gray|slate|emerald|orange|teal|zinc|neutral|stone)-\d/, 'a raw Tailwind palette class');
  assert.doesNotMatch(src, /\b(?:bg|text|border|fill|stroke)-kasus-/, 'a kasus colour on the chrome');
  assert.doesNotMatch(src, /\b(?:text-ink|text-graphite|border-rule|border-ink)\b/, 'the old reference styling is gone');
  const strings = read(`${V2}/strings.js`);
  const en = strings.slice(strings.indexOf('const EN = {'), strings.indexOf('const DE = {'));
  const de = strings.slice(strings.indexOf('const DE = {'), strings.indexOf('export const V2_STRINGS'));
  const used = new Set();
  for (const m of src.matchAll(/\bt\((?:[^()]*\? )?'([a-z]+\.[A-Za-z0-9]+)'/g)) used.add(m[1]);
  for (const m of src.matchAll(/'((?:exam|item|audio)\.[A-Za-z0-9]+)'/g)) used.add(m[1]);
  assert.ok([...used].filter((k) => k.startsWith('exam.')).length >= 15, [...used].join(' '));
  for (const k of used) {
    assert.ok(en.includes(`'${k}':`), `EN lacks ${k}`);
    assert.ok(de.includes(`'${k}':`), `DE lacks ${k}`);
  }
  for (const table of [en, de]) {
    const lines = table.split('\n').map((l, i) => ({ l, i })).filter(({ l }) => /^\s*'exam\./.test(l));
    assert.equal(lines[lines.length - 1].i - lines[0].i, lines.length - 1, 'the exam.* keys are one block');
  }
  const examDe = de.split('\n').filter((l) => /^\s*'exam\./.test(l)).join('\n');
  assert.doesNotMatch(examDe, /\b(du|dir|dich|dein\w*|Lies|Hör)\b/);
  assert.match(de, /'exam\.readFirst': 'Lesen Sie zuerst den Text\.'/);
  assert.match(de, /'exam\.start': 'Los geht’s'/);
  assert.match(de, /'exam\.count': '\{n\} Aufgaben'/);
  assert.match(de, /'exam\.lern': 'Lernmodus'/);
});
