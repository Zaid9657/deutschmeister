// Course v2 — the Lehrwerk frame of the lesson player (owner feedback 2026-09-29: "I want it to be a
// CURRICULUM like the books — CHAPTERS, and in each chapter multiple things to learn. In a lesson
// there's no German grammar, no listening, no questions visible."). Pins:
//   - the Kapitel page's table of contents (kapitel.js tocRows) from the compiled outline, and the
//     outline derived from a unit's own steps staying in step with the compiler's;
//   - the stages of a step (the section strip) and the Lehrwerk exercise numbers („A3 Grammatik");
//   - the back matter: a unit's words grouped by its lexicon blocks, nouns printed the textbook way
//     („die Stadt, ¨-e"), the words a step's input uses;
//   - the level reference: every rule card placed in exactly one Kapitel, every word in one;
//   - the wiring: the Kapitel page is the opt-in guide behind ?view=guide (round 3 — the unit opens on
//     a story screen / a welcome-back instead, tests/course-v2-flow.test.mjs), the two reference routes
//     sit above the legacy catch-all behind the v2 guard, the strings exist in both chrome languages,
//     and the colours are tokens (an article or a grammar box is never a kasus hue).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  outlineFromUnit, unitOutline, tocRows, chapterSections, sectionOf, stagesOf, exerciseNr, stageIcon,
  unitCardIds, cardsByIds, cardTitle, spineShortNames, isFormTask, unitWordGroups, wordsOfUnit, pluralSuffix, nounParts, isBareName, stepWords,
  inputText, grammarChapters, wordChapters, searchWords, fold,
} from '../src/components/course-v2/kapitel.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const LEVEL = 'src/data/course-v2/a1.1';
const manifest = json(`${LEVEL}/manifest.json`);
const cards = json(`${LEVEL}/rule-cards.json`).cards;
const words = json(`${LEVEL}/words.json`).words;
const unitAt = (nr) => json(`${LEVEL}/units/u${String(nr).padStart(2, '0')}.json`);
const u01 = unitAt(1);

// ---------------------------------------------------------------------------
// The table of contents
// ---------------------------------------------------------------------------

test('the outline derived from a unit equals the compiled one (spine labels aside), for every A1.1 unit', () => {
  const strip = (o) => o.map((s) => ({ ...s, grammar: s.grammar ? s.grammar.id : null }));
  for (const row of manifest.units) {
    const unit = unitAt(row.nr);
    assert.deepEqual(strip(outlineFromUnit(unit)), strip(row.outline), `${unit.id}: kapitel.js outlineFromUnit drifted from the compiler's outlineOf`);
  }
  // the manifest's outline wins where it exists (it carries the grammar names); a row without one falls back
  assert.equal(unitOutline(u01, manifest)[0].grammar.short, 'Präsens');
  assert.equal(unitOutline(u01, { units: [] })[0].grammar.short, null);
  assert.equal(unitOutline(u01, null).length, u01.steps.length);
});

test('the table of contents: A / B / C, then Prüfungstraining, Sprechen, Schreiben, Kapiteltest — with state and minutes', () => {
  const rows = tocRows({ unit: u01, course: manifest, finished: new Set(['a1.1-u01-ls1']), currentIndex: 1 });
  assert.equal(rows.length, u01.steps.length, 'one row per step: every row opens a step');
  assert.deepEqual(rows.map((r) => r.letter), ['A', 'B', 'C', null, null, null, null]);
  assert.deepEqual(rows.map((r) => r.kind), ['situation', 'situation', 'situation', 'pruefung', 'sprechen', 'schreiben', 'check']);
  assert.deepEqual(rows.map((r) => r.state), ['done', 'current', 'open', 'open', 'open', 'open', 'open']);
  rows.forEach((r, i) => {
    assert.equal(r.index, i);
    assert.equal(r.id, u01.steps[i].id);
    assert.equal(r.minutes, u01.minutesPlanned.byStep[r.id]);
  });
  assert.deepEqual(rows[0].input, { kind: 'dialog', title: 'Im Kurs: Wie heißen Sie?' }, 'the Hören line names the dialogue');
  assert.equal(rows[0].grammar.short, 'Präsens', 'the Grammatik line names the grammar');
  assert.ok(rows[0].skills.includes('grammatik') && rows[0].skills.includes('hoeren') && rows[0].skills.includes('ueben'));
  assert.equal(rows[2].input.kind, 'text', 'C is a reading text (Lesen)');
  assert.deepEqual(rows[4].teile, ['sd1.sp1', 'sd1.sp2'], 'the Sprechen row names its exam parts');
  // every A1.1 Kapitel has its three sections and teaches grammar in each (the owner's complaint, answered)
  for (const row of manifest.units) {
    const sec = chapterSections(unitAt(row.nr), manifest);
    const lettered = sec.filter((s) => s.letter);
    assert.ok(lettered.length >= 3, `${row.unit}: A, B, C`);
    assert.ok(lettered.every((s) => s.grammar && s.grammar.short && s.input && s.input.title), `${row.unit}: every section names its grammar and its text`);
  }
});

// ---------------------------------------------------------------------------
// The stages of a step
// ---------------------------------------------------------------------------

// StepView's segments of a Situation step, in its order (segmentsFor, BLUEPRINT §3.3)
const SITUATION_SEGS = ['words', 'input', 'inputItems', 'form', 'structured', 'practice', 'aussprache', 'micro', 'exit', 'end'].map((id) => ({ id }));

test('a step reads like a Lehrwerk page: its stages in order, numbered from the section letter', () => {
  const ls1 = u01.steps[0];
  const stages = stagesOf(SITUATION_SEGS, ls1);
  assert.deepEqual(stages.map((s) => s.skill), ['wortschatz', 'hoeren', 'grammatik', 'ueben', 'aussprache', 'sprechen', 'abschluss']);
  assert.deepEqual(stages[1].segs, ['input', 'inputItems'], 'the dialogue and its questions are one Hören stage');
  const nr = (id) => exerciseNr(stages, id, 'A');
  assert.deepEqual(['words', 'input', 'inputItems', 'form', 'structured', 'practice', 'aussprache', 'micro', 'exit'].map(nr), ['A1', 'A2a', 'A2b', 'A3a', 'A3b', 'A4', 'A5', 'A6', 'A7']);
  assert.equal(exerciseNr(stages, 'end', 'A'), null);
  // a reading text is Lesen, a written micro-output Schreiben
  const text = stagesOf(SITUATION_SEGS, { input: { kind: 'text' }, microOutput: { mode: 'written' } });
  assert.equal(text[1].skill, 'lesen');
  assert.equal(text[5].skill, 'schreiben');
  // exam blocks are a stage each; the Aufgaben and the Check have none
  const blocks = stagesOf([{ id: 'block-0', block: { template: 'sd1.h1' } }, { id: 'block-1', block: { template: 'sd1.l2' } }, { id: 'end' }], { kind: 'pruefung' });
  assert.deepEqual(blocks.map((s) => s.skill), ['pruefung', 'pruefung']);
  assert.deepEqual(stagesOf([{ id: 'check' }], { kind: 'check' }), []);
  assert.equal(stageIcon('abschluss'), 'test');
  assert.equal(stageIcon('redemittel'), 'wortschatz');
  assert.equal(sectionOf(chapterSections(u01, manifest), ls1.id).letter, 'A');
});

// Round 3 (owner 2026-09-30: "intimidating and too much … step for step"): the strip and the numbered
// headings left the step (stagesOf / exerciseNr stay pure helpers above); the section is kept for
// screen readers, and the words still open a Situation step — as cards (tests/course-v2-steps.test.mjs).
test('StepView shows one thing per screen: no strip, no numbered heading, the section for screen readers, the words first', () => {
  const sv = read('src/components/course-v2/StepView.jsx');
  assert.doesNotMatch(sv, /StageStrip|stagesOf\(|exerciseNr\(/, 'no stage strip and no „A3 Grammatik" numbering above a screen');
  assert.match(sv, /\{context && <h1 className="sr-only"[^>]*>\{context\}<\/h1>\}/, 'the section („Teil A: …") is still named, for screen readers');
  assert.match(sv, /\$\{t\('kap\.part', \{ l: letter \}\)\}\$\{step\.title \? `: \$\{step\.title\}` : ''\}/);
  assert.match(sv, /if \(extras\.words && extras\.words\.length >= MIN_WORDS\) segs\.push\(\{ id: 'words'/);
  assert.match(sv, /const \[words\] = useState\(\(\) =>/, 'the step’s words are fixed when it opens — the segments never shift under the learner');
  assert.match(sv, /<WordCards key="words" words=\{words\}/, 'a Situation step opens with its words, one card each');
  // DaF review 2026-09-30 (DAF-04): the chip names the CARD's grammar (its spine, as the outlines name
  // it), the step's tag only as a fallback — „Akkusativ" no longer sits over the Vokalwechsel card
  assert.match(sv, /const cardName = \(ruleCard && ruleCard\.spine && spineShort\.get\(ruleCard\.spine\)\) \|\| \(section && section\.grammar && section\.grammar\.short\) \|\| null;/, 'the Grammatik-Tipp names the card’s own grammar');
  assert.match(sv, /<RuleCardSteps\s+key="form"\s+card=\{ruleCard\}\s+modelSentence=\{step\.modelSentence\}\s+title=\{cardName\}/);
  assert.match(sv, /const spineShort = useMemo\(\(\) => spineShortNames\(course\), \[course\]\);/);
  const names = spineShortNames(manifest);
  assert.equal(names.get('g.vokalwechsel'), 'Verben mit Vokalwechsel');
  assert.equal(names.get('g.akkusativ'), 'Akkusativ');
  assert.equal(spineShortNames(null).size, 0);
  // the u09 pairing (structure g.akkusativ, card rc.vokalwechsel-2) is the documented case, not a mismatch:
  // every step's card is named by its own spine, and the two agree everywhere else in A1.1
  for (const row of manifest.units) {
    const unit = unitAt(row.nr);
    for (const s of unit.steps.filter((x) => x.ruleCard)) {
      const card = cards.find((c) => c.id === s.ruleCard);
      assert.ok(card && names.get(card.spine), `${s.id}: the card ${s.ruleCard} has a named spine`);
      if (s.id !== 'a1.1-u09-ls2') assert.equal(card.spine, s.structure, `${s.id}: structure and card spine agree`);
    }
  }
});

test('a Schreiben row names a form to fill as one — never as „mit KI-Korrektur" (WT-07)', () => {
  // the fact is the Aufgabe's own `form` (sd1.s1: fields checked deterministically, no KI)
  assert.equal(isFormTask({ form: { fields: [] } }), true);
  assert.equal(isFormTask({ template: 'sd1.s2' }), false);
  assert.equal(isFormTask(null), false);
  const rowsOf = (nr) => tocRows({ unit: unitAt(nr), course: manifest });
  assert.equal(rowsOf(1).find((r) => r.kind === 'schreiben').form, true, 'u01: a form');
  assert.equal(rowsOf(3).find((r) => r.kind === 'schreiben').form, false, 'u03: a short message, KI-corrected');
  for (const row of manifest.units) {
    const unit = unitAt(row.nr);
    for (const r of rowsOf(row.nr)) {
      const step = unit.steps.find((s) => s.id === r.id);
      assert.equal(r.form, Boolean(step.task && step.task.form), `${r.id}: form follows the task`);
      if (r.form) assert.deepEqual(r.teile, ['sd1.s1'], `${r.id}: the form is Goethe A1 Schreiben Teil 1`);
    }
  }
  const ui = read('src/components/course-v2/UnitIntro.jsx');
  assert.match(ui, /schreiben: \{ icon: 'schreiben', title: t\(r\.form \? 'kap\.schreibenForm' : 'kap\.schreiben'\) \}/, 'the guide row');
  const sv = read('src/components/course-v2/StepView.jsx');
  assert.match(sv, /const schreibenName = isFormTask\(step\.task\) \? t\('kap\.schreibenForm'\) : t\('kap\.schreiben'\);/, 'the step heading and its sr-only context');
  assert.match(sv, /schreiben: schreibenName,/);
  assert.match(sv, /schreiben: \(\) => schreibenName,/);
  const strings = read('src/components/course-v2/strings.js');
  assert.match(strings, /'kap\.schreibenForm': 'Writing \(form\)'/);
  assert.match(strings, /'kap\.schreibenForm': 'Schreiben \(Formular\)'/);
  assert.doesNotMatch(strings.match(/'kap\.schreibenForm': '[^']*'/g).join(' '), /\bKI\b|\bAI\b/, 'the form label promises no KI');
});

// ---------------------------------------------------------------------------
// The back matter: words and rule cards of one Kapitel
// ---------------------------------------------------------------------------

test('nouns are printed the Lehrwerk way: article, lemma, plural sign', () => {
  const cases = [
    ['Sprachschule', 'Sprachschulen', '-n'], ['Stadt', 'Städte', '¨-e'], ['Mutter', 'Mütter', '¨-'], ['Buch', 'Bücher', '¨-er'],
    ['Lehrer', 'Lehrer', '-'], ['Chat', 'Chats', '-s'], ['Kurs', 'Kurse', '-e'], ['Museum', 'Museen', 'Museen'],
  ];
  for (const [lemma, plural, want] of cases) assert.equal(pluralSuffix(lemma, plural), want, `${lemma} → ${plural}`);
  assert.equal(pluralSuffix('Stadt', null), null);
  const byId = new Map(words.map((w) => [w.id, w]));
  assert.deepEqual(nounParts(byId.get('lx.sprachschule')), { article: 'die', lemma: 'Sprachschule', plural: '-n', note: null, say: 'die Sprachschule' });
  assert.equal(nounParts(byId.get('lx.eltern')).note, 'pl');
  assert.equal(nounParts(byId.get('lx.eltern')).article, 'die', 'a plural-only noun takes the plural article');
  assert.equal(nounParts(byId.get('lx.deutsch')).note, 'sg');
  assert.equal(nounParts(byId.get('lx.heissen')).article, null, 'a verb is its lemma');
  // every noun of the level prints: an article (or plural-only, or a bare language/country name),
  // and a plural sign unless singular-only
  for (const w of words.filter((x) => x.pos === 'NOUN')) {
    const p = nounParts(w);
    assert.ok(p.article || isBareName(w), `${w.id}: no article`);
    if (w.plural_kind === 'regular') assert.ok(p.plural, `${w.id}: no plural`);
  }
});

test('a language or country name is shown and spoken without its article; die Schweiz keeps hers (DAF-05)', () => {
  const byId = new Map(words.map((w) => [w.id, w]));
  // the first word card of the course: „Deutsch", never „das Deutsch" (the learner copies it: „Ich lerne Deutsch")
  assert.deepEqual(nounParts(byId.get('lx.deutsch')), { article: null, lemma: 'Deutsch', plural: null, note: 'sg', say: 'Deutsch' });
  assert.equal(nounParts(byId.get('lx.oesterreich')).say, 'Österreich');
  assert.equal(nounParts(byId.get('lx.schweiz')).say, 'die Schweiz', 'a feminine country keeps its article');
  for (const id of ['lx.wasser', 'lx.fleisch', 'lx.geld', 'lx.internet', 'lx.ausland']) {
    assert.equal(nounParts(byId.get(id)).article, 'das', `${id}: a mass noun keeps its article`);
  }
  // the rule, not a list: every neuter language (-isch/-deutsch) and one-word country of the level
  // is bare, every other noun keeps its article — and the lexicon keeps the gender either way
  const bare = words.filter(isBareName).map((w) => w.lemma).sort();
  assert.deepEqual(bare, ['Deutsch', 'Deutschland', 'Englisch', 'Österreich', 'Spanisch', 'Türkisch'].sort());
  for (const w of words.filter(isBareName)) assert.equal(w.article, 'das', `${w.id}: the gender stays in the data`);
  // what a later level adds is caught by the same rule
  const noun = (lemma, article, gloss, extra = {}) => ({ pos: 'NOUN', lemma, article, plural: null, plural_kind: 'singular-only', gloss, ...extra });
  assert.equal(isBareName(noun('Frankreich', 'das', 'France')), true);
  assert.equal(isBareName(noun('Italienisch', 'das', 'Italian (language)')), true);
  assert.equal(isBareName(noun('Plattdeutsch', 'das', { en: 'Low German' })), true, 'a lexicon entry (gloss object) too');
  assert.equal(isBareName(noun('Türkei', 'die', 'Turkey')), false, 'die Türkei keeps hers');
  assert.equal(isBareName(noun('Irak', 'der', 'Iraq')), false, 'der Irak keeps his');
  assert.equal(isBareName(noun('Mittelalter', 'das', 'Middle Ages')), false, 'a multi-word name keeps it');
  assert.equal(isBareName(noun('Fleisch', 'das', 'meat')), false, '-isch is no language when English does not capitalise it');
  assert.equal(isBareName(noun('Kino', 'das', 'Cinema', { plural: 'Kinos', plural_kind: 'regular' })), false, 'a noun with a plural is no name');
});

test('a unit’s words come grouped by its lexicon blocks; a step shows the words its text uses', () => {
  const own = wordsOfUnit(words, u01.id);
  const groups = unitWordGroups(u01, words);
  assert.deepEqual(groups.map((g) => g.title), u01.spec.lexiconBlocks.map((b) => b.title));
  assert.equal(groups.reduce((n, g) => n + g.words.length, 0), own.length, 'every word of the unit, once');
  assert.ok(groups.every((g) => g.words.every((w) => w.unit === u01.id)));
  for (const row of manifest.units) {
    const unit = unitAt(row.nr);
    const lexicon = wordsOfUnit(words, unit.id);
    for (const step of unit.steps.filter((s) => s.input)) {
      const hits = stepWords(step, lexicon);
      assert.ok(hits.length <= 8, `${step.id}: at most eight words`);
      const text = inputText(step).toLowerCase();
      for (const w of hits) {
        assert.equal(w.unit, unit.id, `${step.id}: ${w.id} is not a word of the unit`);
        const stems = [w.lemma, w.plural].filter(Boolean).map((x) => x.toLowerCase().replace(/^sich /, '').split(' ')[0].replace(/e?n$/, ''));
        assert.ok(stems.some((st) => text.includes(st)), `${step.id}: ${w.lemma} is not in the text`);
      }
    }
  }
  const ls1 = stepWords(u01.steps[0], wordsOfUnit(words, u01.id)).map((w) => w.lemma);
  assert.ok(ls1.includes('heißen') && ls1.includes('Name') && ls1.length >= 3, ls1.join(', '));
  assert.deepEqual(stepWords(u01.steps[0], []), []);
});

test('the Kapitel’s rule cards are the ones its steps show, named by the grammar they teach', () => {
  const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
  assert.deepEqual(unitCardIds(u01), ['rc.praesens', 'rc.verbposition-2']);
  assert.deepEqual(cardsByIds(unitCardIds(u01), byId).map((c) => c.id), ['rc.praesens', 'rc.verbposition-2'], 'a map');
  assert.deepEqual(cardsByIds(['rc.kein'], cards).map((c) => c.id), ['rc.kein'], 'an array');
  assert.deepEqual(cardsByIds(['rc.none'], byId), []);
  assert.equal(cardTitle(u01, manifest, 'rc.praesens'), 'Präsens');
  assert.equal(cardTitle(u01, manifest, 'rc.verbposition-2'), 'Aussagesatz und W-Frage');
  // the player hands the unit its level's cards: a card is then named by its OWN spine (DAF-04) —
  // rc.vokalwechsel-2 in Kapitel 9 is „Verben mit Vokalwechsel", not the step's „Akkusativ"
  const u09 = { ...unitAt(9), ruleCards: cards };
  assert.equal(cardTitle(u09, manifest, 'rc.vokalwechsel-2'), 'Verben mit Vokalwechsel');
  assert.equal(cardTitle(u09, manifest, 'rc.moegen'), 'mögen');
  assert.equal(cardTitle({ ...u01, ruleCards: cards }, manifest, 'rc.praesens'), 'Präsens');
  assert.equal(cardTitle(unitAt(9), manifest, 'rc.vokalwechsel-2'), 'Akkusativ', 'without the cards: the step’s label, as before');
});

// ---------------------------------------------------------------------------
// The level reference pages
// ---------------------------------------------------------------------------

test('Grammatik A1.1: every rule card in exactly one Kapitel, a repeated grammar point as a reference', () => {
  const chapters = grammarChapters(manifest, cards);
  const placed = chapters.flatMap((c) => c.cards.map((x) => x.id));
  assert.equal(new Set(placed).size, placed.length, 'no card twice');
  assert.deepEqual([...placed].sort(), cards.map((c) => c.id).sort(), 'every card of the level');
  assert.deepEqual(chapters.map((c) => c.nr), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.deepEqual(chapters[0].cards.map((c) => c.id), ['rc.praesens', 'rc.verbposition-2']);
  assert.equal(chapters[0].titles['rc.praesens'], 'Präsens');
  assert.ok(chapters[1].cards.some((c) => c.id === 'rc.praesens-2'), 'Präsens taught again: its second card, by depth');
  const k9 = chapters.find((c) => c.nr === 9);
  assert.deepEqual(k9.seeAlso.map((x) => [x.card.id, x.nr]), [['rc.akkusativ', 6]], 'Akkusativ again without a deeper card: „siehe Kapitel 6"');
  // no outline at all: one group with every card; nothing compiled: nothing
  assert.equal(grammarChapters({ units: [{ unit: 'x', nr: 1 }] }, cards)[0].cards.length, cards.length);
  assert.deepEqual(grammarChapters(null, []), []);
});

test('Wortschatz A1.1: every word in one Kapitel, and the search folds umlauts, ß and English', () => {
  const chapters = wordChapters(manifest, words);
  assert.equal(chapters.length, 12);
  assert.equal(chapters.reduce((n, c) => n + c.words.length, 0), words.length);
  assert.equal(chapters[0].title, 'Hallo, ich bin Priya');
  assert.equal(fold('Straße'), 'strasse');
  assert.equal(fold('  Möchte '), 'mochte');
  assert.ok(searchWords(words, 'strasse').some((w) => w.lemma === 'Straße'));
  assert.ok(searchWords(words, 'city').some((w) => w.lemma === 'Stadt'), 'by the English gloss');
  assert.ok(searchWords(words, 'die sprachschule').some((w) => w.id === 'lx.sprachschule'), 'by article and lemma');
  assert.equal(searchWords(words, '').length, words.length);
  assert.deepEqual(searchWords(words, 'qqqxyz'), []);
});

test('the two reference routes sit above the legacy catch-all, behind the v2 access question', () => {
  const app = read('src/App.jsx');
  const catchAll = app.indexOf('path="/course/:level/:itemId"');
  for (const [path, page] of [['/course/:level/grammatik', 'GrammarPage'], ['/course/:level/wortschatz', 'WordsPage']]) {
    const at = app.indexOf(`path="${path}"`);
    assert.ok(at > 0, `missing route ${path}`);
    assert.ok(at < catchAll, `${path} must sit above /course/:level/:itemId`);
    const line = app.slice(at, app.indexOf('\n', at));
    // `courseV2` like the closing route: LevelSubscriptionGuard's v2 path regex names only v2|abschluss|u|p
    assert.match(line, new RegExp(`<LevelSubscriptionGuard courseV2><EmailVerificationGate><${page} /></EmailVerificationGate></LevelSubscriptionGuard>`));
    assert.match(app, new RegExp(`const ${page} = lazy\\(\\(\\) => import\\('\\./pages/course-v2/${page}\\.jsx'\\)\\);`));
  }
  assert.ok(read('netlify.toml').includes('from = "/course/*"'), 'inside the /course/* rewrite: no netlify.toml change');
  const loaders = read('src/lib/course-v2/loaders.js');
  assert.match(loaders, /const WORDS = withDevFixture\(import\.meta\.glob\('\.\.\/\.\.\/data\/course-v2\/\*\/words\.json'\)/, 'loadWords is lazy, like the rule cards');
  assert.match(loaders, /export function loadWords\(level\)/);
});

// ---------------------------------------------------------------------------
// The wiring of the Kapitel page
// ---------------------------------------------------------------------------

test('the Kapitel page is the opt-in guide (?view=guide): can-dos ticked, the table of contents, the back matter, ONE button at the end', () => {
  // round 3 (owner 2026-09-30: "it looks intimidating and too much"): the unit no longer OPENS on this
  // page — a fresh unit opens on the story screen, a resumed one on a welcome-back
  // (tests/course-v2-flow.test.mjs) — but every part of it stays, one tap deep.
  const page = read('src/pages/course-v2/UnitPlayerPage.jsx');
  assert.match(page, /const view = params\.get\('view'\) === 'guide' \? 'guide' : null;/, 'the page reads ?view=guide');
  assert.match(page, /const screen = screenOf\(phase, view\);/);
  const guide = page.slice(page.indexOf("if (screen === 'guide') {"), page.indexOf("if (screen === 'story') {"));
  assert.ok(guide.length > 100, 'the guide branch');
  for (const prop of ['rows={rows}', 'onOpenRow={openFromChapter}', "onOpenIntro={() => openStart('folge')}", 'cards={', 'wordGroups={', 'redemittel={', 'goals={goals}', 'examFocus={']) {
    assert.ok(guide.includes(prop), `the guide hands UnitIntro ${prop}`);
  }
  // the can-dos, ticked by the recap's own proof reading — every proof the rule names (proofs.js)
  assert.ok(!guide.includes('referenceOpen='), 'the back matter stays folded until tapped, even on a finished chapter (calm)');
  assert.match(guide, /\{allProven \? t\('player\.canNow'\) : t\('player\.goalsUnit'\)\}/);
  assert.match(guide, /\{proven\(i\)\s*\n?\s*\? <Check /, 'a tick per proven can-do');
  assert.match(guide, /const primaryLabel = !started\s*\? t\('kap\.start'\)/, '„Kapitel starten" on a fresh unit, „Weiter mit Teil B" on a resumed one');
  assert.match(guide, /const onPrimary = !started \? \(\) => openStart\(null\) : \(\) => openFromChapter\(next \? next\.index : steps\.length\);/);
  assert.match(guide, /<GuideTopBar title=\{t\('flow\.guideTitle', \{ n: unit\.nr \}\)\} closeLabel=\{t\('flow\.close'\)\} onClose=\{onCloseGuide\} \/>/, '„Kapitel 1 im Überblick" with its X');
  // leaving the guide by an action drops ?view=guide; the welcome-back and the recap push it; the X goes back
  assert.match(page, /const openFromChapter = \(i\) => \{\s*leaveGuide\(\);/);
  assert.match(page, /const openStart = \(entry = null\) => \{\s*leaveGuide\(\);/);
  assert.match(page, /next\.set\('view', 'guide'\); return next;/);
  assert.match(page, /next\.delete\('view'\); return next; \}, \{ replace: true \}\);/);
  assert.match(page, /const to = guideCloseTarget\(location\.key, v2Paths\.home\(level\)\);/);
  assert.match(page, /loadWords\(level\)\]\)/, 'the words load with the unit');
  assert.match(page, /lexicon: wordsOfUnit\(words, unit\.id\)/);
  const ui = read('src/components/course-v2/UnitIntro.jsx');
  const guidePage = ui.slice(ui.indexOf('export default function UnitIntro('));
  assert.match(guidePage, /<TocRow[\s\S]{0,300}t\('kap\.episode'/, 'the Einstieg row: Folge n');
  assert.match(guidePage, /<ReferenceShelf/);
  assert.ok(!guidePage.includes('<StickyAction'), 'no sticky start bar competing with the page');
  assert.equal((guidePage.match(/<GameButton/g) || []).length, 1, 'one button');
  assert.ok(guidePage.indexOf('<GameButton') > guidePage.indexOf('<ReferenceShelf'), '…at the very end');
  const parts = read('src/components/course-v2/KapitelParts.jsx');
  assert.match(parts, /<RuleCardView key=\{card\.id\} card=\{card\} title=\{title\} \/>/, 'Grammatik: the rule cards');
  assert.match(parts, /<WordList words=\{g\.words\}/, 'Wortschatz: the words by block');
  assert.match(parts, /aria-expanded=\{open\}/, 'the back matter folds');
});

test('the colours are tokens: the grammar box is the course wash, an article is neutral ink, never a kasus hue', () => {
  const V2 = 'src/components/course-v2';
  const files = [`${V2}/UnitIntro.jsx`, `${V2}/KapitelParts.jsx`, `${V2}/WordList.jsx`, `${V2}/ReferenceShell.jsx`, `${V2}/RuleCardView.jsx`,
    `${V2}/StepView.jsx`, `${V2}/StartView.jsx`, `${V2}/kapitel.js`, `${V2}/story.js`, `${V2}/GameTopBar.jsx`,
    'src/pages/course-v2/GrammarPage.jsx', 'src/pages/course-v2/WordsPage.jsx', 'src/pages/course-v2/UnitPlayerPage.jsx'];
  for (const f of files) {
    const src = read(f);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${f}: a hex colour outside design-tokens.js`);
    assert.doesNotMatch(src, /\b(?:bg|text|border|fill|stroke)-(?:amber|rose|red|green|blue|gray|slate|emerald|orange|yellow)-\d/, `${f}: a raw Tailwind palette class`);
    assert.doesNotMatch(src, /\b(?:bg|text|border|fill|stroke)-kasus-/, `${f}: a kasus colour as decoration`);
    assert.doesNotMatch(src, /\bdu\b|\bdein/i, `${f}: the course speaks Sie`);
  }
  const rule = read(`${V2}/RuleCardView.jsx`);
  assert.match(rule, /border-course-soft bg-course-wash/, 'the Grammatik box is the palette wash');
  assert.match(rule, /<Chip tone=\{mark\.kasus\}/, 'a case colour only where the card names the case');
  assert.match(read(`${V2}/WordList.jsx`), /\{p\.article && <span className="font-bold text-game-muted">/, 'the article in neutral ink');
  // A11Y-05: the TOC's „Jetzt" pill is 11 px bold — small text — so white on the course primary (3.29:1
  // türkis) fails AA; white on ink (6.39:1 türkis, 6.61 limette, 7.96 himbeere) holds for every palette
  // and is the home page's „Jetzt" treatment (home/InhaltPlan.jsx). A wash pill would vanish on the
  // current row, which is itself the wash.
  const parts = read(`${V2}/KapitelParts.jsx`);
  const nowPill = parts.match(/<span className="([^"]*)">\{t\('kap\.now'\)\}<\/span>/);
  assert.ok(nowPill, 'the TocRow „Jetzt" pill');
  assert.match(nowPill[1], /\bbg-course-ink\b/, 'the pill is ink…');
  assert.match(nowPill[1], /\btext-white\b/, '…with white text');
  assert.doesNotMatch(nowPill[1], /\bbg-course(?![\w-])|\bbg-course-wash\b/, 'never the primary (3.29:1 at 11 px) nor the wash (invisible on the wash row)');
  assert.match(read('src/components/course-v2/home/InhaltPlan.jsx'), /bg-course-ink[^"]*text-white">Jetzt</, 'the home page’s „Jetzt" badge is the same treatment');
});

test('a reference page opens at its top: ReferenceShell resets the scroll before paint, per page, unless a fragment is the target', () => {
  // A client-side route change keeps the previous page's scroll offset (App.jsx has no ScrollToTop),
  // so „Alle Grammatik von A1.1" tapped 3000px down a Kapitel guide opened /grammatik 3000px down —
  // clamped into the footer. The reset must run before paint (useLayoutEffect, not useEffect), be
  // 'instant' (src/index.css: html { scroll-behavior: smooth }), re-fire on the Grammatik ↔ Wörter tab
  // switch ([level, page]) but not on ChapterJump's in-page hash links, and leave a #kapitel-n / #wk-n
  // fragment to the browser.
  const shell = read('src/components/course-v2/ReferenceShell.jsx');
  assert.match(shell, /import \{ useLayoutEffect \} from 'react';/);
  const reset = shell.match(/useLayoutEffect\(\(\) => \{([\s\S]*?)\}, \[level, page\]\);/);
  assert.ok(reset, 'the scroll reset is a useLayoutEffect keyed on [level, page]');
  assert.match(reset[1], /if \(window\.location\.hash\) return;/, 'a fragment in the URL is the browser\'s target');
  assert.match(reset[1], /window\.scrollTo\(\{ top: 0, behavior: 'instant' \}\);/, "'instant', because html scrolls smoothly");
  assert.ok(!/useEffect\(\(\) => \{[\s\S]*?scrollTo/.test(shell), 'the reset runs before paint, not after');
  // The guide links that exposed it stay plain (no hash), so the reset is what places the page.
  const parts = read('src/components/course-v2/KapitelParts.jsx');
  assert.match(parts, /<Link to=\{`\/course\/\$\{lvl\}\/grammatik`\}/);
  assert.match(parts, /<Link to=\{`\/course\/\$\{lvl\}\/wortschatz`\}/);
  assert.match(read('src/index.css'), /scroll-behavior: smooth;/, 'the reason for instant');
});

test('every chrome key of the Kapitel page, the step frame and the reference pages exists in both tables', () => {
  const strings = read('src/components/course-v2/strings.js');
  const en = strings.slice(strings.indexOf('const EN = {'), strings.indexOf('const DE = {'));
  const de = strings.slice(strings.indexOf('const DE = {'), strings.indexOf('export const V2_STRINGS'));
  const used = new Set();
  for (const f of ['UnitIntro.jsx', 'KapitelParts.jsx', 'WordList.jsx', 'ReferenceShell.jsx', 'StepView.jsx', 'StartView.jsx', 'RuleCardView.jsx', 'GameTopBar.jsx'].map((x) => `src/components/course-v2/${x}`)
    .concat(['src/pages/course-v2/GrammarPage.jsx', 'src/pages/course-v2/WordsPage.jsx', 'src/pages/course-v2/UnitPlayerPage.jsx'])) {
    for (const m of read(f).matchAll(/\bt\('([a-z]+\.[A-Za-z0-9]+)'/g)) used.add(m[1]);
  }
  assert.ok([...used].filter((k) => /^(kap|stage|ref)\./.test(k)).length > 30);
  for (const k of used) {
    assert.ok(en.includes(`'${k}':`), `EN lacks ${k}`);
    assert.ok(de.includes(`'${k}':`), `DE lacks ${k}`);
  }
  // the unit is a Kapitel now, in both languages
  assert.match(de, /'player\.unit': 'Kapitel \{n\}'/);
  assert.match(en, /'player\.unit': 'Chapter \{n\}'/);
  assert.match(de, /'kap\.start': 'Kapitel starten'/);
  assert.match(de, /'kap\.continuePart': 'Weiter mit Teil \{l\}'/);
  assert.match(de, /'rule\.title': 'Grammatik'/);
  // round 3: the guide's name and the flow's buttons
  assert.match(de, /'flow\.guideTitle': 'Kapitel \{n\} im Überblick'/);
  assert.match(de, /'flow\.overview': 'Kapitel im Überblick'/);
  assert.match(de, /'flow\.go': 'Los geht’s'/);
  assert.match(de, /'flow\.testOut': 'Ich kann das schon – Test machen'/);
});
