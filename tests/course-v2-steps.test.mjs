// Course v2 — one thing per screen inside a Lernschritt (owner feedback 2026-09-30: "it looks
// intimidating and too much, can we change the view to make it in duolingo style and for everything
// to be step for step"). Pins:
//   - the pure screen builders (src/components/course-v2/steps.js): a reading text revealed in
//     chunks that never split a paragraph or lose one, the English aligned only where it can be,
//     the phases of an input (the unaided listen kept), the rule card's screens, and the mark on
//     the form a model sentence teaches — checked against EVERY compiled text and rule card;
//   - the structure: no stage strip and no numbered heading, the section kept for screen readers,
//     one card per word / phrase, the story line by line, the rule card as small screens, every
//     „Weiter" in the bottom bar (StickyAction), the step's progress bar fed per screen;
//   - the rules that travel with it: audio only where it can play, motion only when allowed, the
//     course tokens (a kasus hue only on a case the card names), Sie, both chrome languages, and
//     the panel/list renderings the reference pages and the Start still use.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  wordCount, chunkIndices, textChunks, readingChunks, lineLabel, inputPhases, ruleScreens, ruleForms, emphasize,
  WHOLE_TEXT_WORDS, CHUNK_WORDS,
} from '../src/components/course-v2/steps.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const V2 = 'src/components/course-v2';
const DATA = 'src/data/course-v2';

const LEVELS = readdirSync(join(ROOT, DATA)).filter((l) => existsSync(join(ROOT, DATA, l, 'units')));
const UNITS = LEVELS.flatMap((l) => readdirSync(join(ROOT, DATA, l, 'units')).map((f) => json(`${DATA}/${l}/units/${f}`)));
const INPUTS = UNITS.flatMap((u) => (u.steps || []).filter((s) => s && s.input).map((s) => ({ id: s.id, input: s.input })));
const CARDS = LEVELS.flatMap((l) => json(`${DATA}/${l}/rule-cards.json`).cards);
const u01 = json(`${DATA}/a1.1/units/u01.json`);
const a11Cards = new Map(json(`${DATA}/a1.1/rule-cards.json`).cards.map((c) => [c.id, c]));
const deOf = (text) => (text && typeof text === 'object' ? text.de : text) || '';
const paragraphs = (s) => String(s).split('\n').filter((p) => p.trim());

// ---------------------------------------------------------------------------
// Reading texts, chunk by chunk
// ---------------------------------------------------------------------------

test('a short reading text is one screen; a long one is revealed in chunks that keep every paragraph, in order', () => {
  assert.equal(wordCount('  Ich  bin\nPriya. '), 3);
  const short = 'Heute im Angebot!\nBrot: 1,29 Euro\nKäse: 1,99 Euro';
  assert.deepEqual(textChunks(short), [short], `≤ ${WHOLE_TEXT_WORDS} words: the whole text at once`);
  assert.deepEqual(textChunks(''), []);
  assert.deepEqual(chunkIndices('\n\n'), []);
  let long = 0;
  for (const { id, input } of INPUTS) {
    const de = deOf(input.text);
    if (!de.trim()) continue;
    const chunks = textChunks(de);
    assert.ok(chunks.length >= 1, `${id}: no chunk`);
    // nothing lost, nothing split, nothing reordered: the chunks' paragraphs ARE the text's
    assert.deepEqual(chunks.flatMap(paragraphs), paragraphs(de), `${id}: the chunks must keep every paragraph whole and in order`);
    if (wordCount(de) <= WHOLE_TEXT_WORDS) assert.equal(chunks.length, 1, `${id}: a short text is one screen`);
    else {
      long += 1;
      for (const c of chunks) assert.ok(wordCount(c) >= 10, `${id}: a chunk of ${wordCount(c)} words is too small for a screen of its own`);
      // a chunk runs over the target only by whole paragraphs (the one that did not fit starts the next)
      for (const c of chunks) {
        const ps = paragraphs(c);
        if (ps.length > 1 && wordCount(c) > CHUNK_WORDS) {
          assert.ok(ps.some((p) => wordCount(p) > CHUNK_WORDS / 2) || ps.length <= 3, `${id}: an oversized chunk of short lines: ${c.slice(0, 60)}`);
        }
      }
    }
  }
  assert.ok(long >= 8, 'the long texts of the course are chunked');
});

test('the chunks read naturally: a chat line, a heading and a letter stay with their neighbours', () => {
  const chat = readingChunks(u01.steps[2].input.text).chunks;
  assert.equal(chat.length, 4, 'the A1.1 course chat: four screens');
  assert.ok(chat[0].de.startsWith('Chat · Kurs A1') && chat[0].de.includes('Frau Schulz:'), 'the chat header with its first message');
  assert.ok(chat.every((c) => c.en), 'the chat’s English has the same lines, so each chunk carries its own');
  const menu = textChunks(deOf(json(`${DATA}/a1.1/units/u09.json`).steps[0].input.text));
  assert.equal(menu.length, 2);
  for (const c of menu) assert.ok(!/\n(Kuchen|Getränke|Mittagessen[^\n]*)$/.test(c), 'a menu heading never ends a chunk');
  const mail = textChunks('Betreff: Termin\n\nLiebe Frau Otto,\n' + 'ich komme am Montag um neun Uhr und bringe die Unterlagen mit. '.repeat(4) + '\n' + 'Danach habe ich noch eine Frage zum Kurs und zur Prüfung im Mai. '.repeat(3) + '\n\nViele Grüße\nPriya');
  assert.ok(mail[0].startsWith('Betreff: Termin\n\nLiebe Frau Otto,'), 'a letterhead joins its letter, the blank line kept');
  assert.ok(mail[mail.length - 1].endsWith('Viele Grüße\nPriya'), 'a closing joins the chunk before it');
  // a heading line moves on with what it heads
  const headed = chunkIndices(['eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf dreizehn vierzehn fünfzehn sechzehn siebzehn achtzehn neunzehn zwanzig einundzwanzig zweiundzwanzig dreiundzwanzig vierundzwanzig fünfundzwanzig sechsundzwanzig siebenundzwanzig achtundzwanzig neunundzwanzig dreißig', 'Getränke', 'Kaffee, eine Tasse: 2,90 Euro und Tee, eine Tasse: 2,60 Euro, Orangensaft: 3,40 Euro, Wasser, eine Flasche: 2,50 Euro'].join('\n'), { whole: 10, max: 35 });
  assert.deepEqual(headed, [[0], [1, 2]]);
});

test('a document line’s „Label:" is found for the bold — a chat sender, a form field — never a sentence with a colon', () => {
  assert.deepEqual(lineLabel('Frau Schulz: Guten Abend! Ich begrüße alle Teilnehmer.'), { label: 'Frau Schulz', rest: 'Guten Abend! Ich begrüße alle Teilnehmer.' });
  assert.deepEqual(lineLabel('Familienname: Nair'), { label: 'Familienname', rest: 'Nair' });
  assert.deepEqual(lineLabel('Brot, 500 Gramm: nur 1,29 Euro'), { label: 'Brot, 500 Gramm', rest: 'nur 1,29 Euro' });
  assert.deepEqual(lineLabel('Sprache(n): Malayalam, Englisch, Deutsch'), { label: 'Sprache(n)', rest: 'Malayalam, Englisch, Deutsch' });
  for (const line of ['Ich finde: Das ist gut.', 'Frau Schulz sagt: Hallo!', 'Priya im Chat:', 'Chat · Kurs A1 · Sprachschule Leipzig · Thema: Vorstellen', 'Bis bald!', '', 'am Montag: frei']) {
    assert.equal(lineLabel(line), null, line);
  }
  // the chat of A1.1 Kapitel 1: every message line names its sender
  const chat = deOf(u01.steps[2].input.text).split('\n').slice(1);
  assert.deepEqual(chat.map((l) => lineLabel(l) && lineLabel(l).label), ['Frau Schulz', 'Arta', 'Emre', 'Arta', 'Emre', 'Olena', 'Arta']);
  const story = read(`${V2}/StoryInput.jsx`);
  assert.match(story, /<strong className="font-extrabold">\{gloss\(`\$\{cut\.label\}:`, 'l'\)\}<\/strong> \{gloss\(cut\.rest, 'r'\)\}/, 'the label is bold and still tap-glossed');
});

test('the English goes with each chunk only where the translation has the same paragraphs', () => {
  const aligned = readingChunks({ de: 'A eins.\nB zwei.', en: 'A one.\nB two.' });
  assert.deepEqual(aligned, { chunks: [{ de: 'A eins.\nB zwei.', en: 'A one.\nB two.' }], en: null });
  const whole = readingChunks({ de: 'A eins.\nB zwei.', en: 'A one. B two.' });
  assert.equal(whole.chunks[0].en, null);
  assert.equal(whole.en, 'A one. B two.', 'a translation in one block is shown whole, once the text is read');
  assert.deepEqual(readingChunks('Nur Deutsch.'), { chunks: [{ de: 'Nur Deutsch.', en: null }], en: null });
});

// ---------------------------------------------------------------------------
// The input's phases: the unaided listen is kept
// ---------------------------------------------------------------------------

test('an input is text → the unaided listen → the lines; no listen where the lines cannot play', () => {
  const lines = [{ id: 'l1', de: 'Hallo!' }];
  assert.deepEqual(inputPhases({ kind: 'dialog', lines, transcriptAfterUnaidedListen: true }, { playable: true }), ['listen', 'lines']);
  assert.deepEqual(inputPhases({ kind: 'dialog', lines }, { playable: true }), ['listen', 'lines'], 'the listen gate is the default');
  assert.deepEqual(inputPhases({ kind: 'dialog', lines, transcriptAfterUnaidedListen: true }, { playable: false }), ['lines'], 'sound is never the only channel: no audio, the transcript at once');
  assert.deepEqual(inputPhases({ kind: 'dialog', lines, transcriptAfterUnaidedListen: false }, { playable: true }), ['lines']);
  assert.deepEqual(inputPhases({ kind: 'text', text: { de: 'Text.' } }, { playable: true }), ['text']);
  assert.deepEqual(inputPhases({ kind: 'mixed', lines, text: { de: 'Prospekt.' } }, { playable: true }), ['text', 'listen', 'lines'], 'the document first, then the conversation about it');
  assert.deepEqual(inputPhases({}, {}), []);
  assert.deepEqual(inputPhases(null), []);
  // every compiled input has at least one screen, and every one with lines keeps its listen gate
  for (const { id, input } of INPUTS) {
    const phases = inputPhases(input, { playable: true });
    assert.ok(phases.length, `${id}: an input with nothing to show`);
    if ((input.lines || []).length && input.transcriptAfterUnaidedListen !== false) assert.ok(phases.includes('listen'), `${id}: lost its unaided listen`);
  }
});

// ---------------------------------------------------------------------------
// The rule card as small screens, and the form its model sentence teaches
// ---------------------------------------------------------------------------

test('a rule card is „Grammatik-Tipp" then „Auf einen Blick" — or one screen when it is small; nothing is dropped', () => {
  for (const c of CARDS) {
    const s = ruleScreens(c);
    assert.ok(['tip,table', 'all'].includes(s.join()), `${c.id}: ${s.join()}`);
  }
  assert.deepEqual(ruleScreens({ de: 'Kurz.', table: [['ich', 'bin'], ['du', 'bist']] }, 'Ich bin hier.'), ['all']);
  assert.deepEqual(ruleScreens({ de: 'Eine Regel ohne Tabelle.' }), ['tip']);
  assert.deepEqual(ruleScreens({ table: [['a', 'b']] }), ['table']);
  assert.deepEqual(ruleScreens(null, 'Nur ein Mustersatz.'), ['tip'], 'a card not loaded yet: the model sentence alone');
  assert.deepEqual(ruleScreens(null), []);
});

test('the model sentence marks the form the card teaches, read off its table — and never marks everything', () => {
  const marked = (id, sentence) => emphasize(sentence || a11Cards.get(id).modelSentence, a11Cards.get(id)).filter((s) => s.strong).map((s) => s.text);
  assert.deepEqual(marked('rc.praesens'), ['komme', 'kommst']);
  assert.deepEqual(marked('rc.verbposition-2'), ['heißen', 'heiße'], 'the „…" column (the rest of the sentence) is not the form');
  assert.deepEqual(marked('rc.possessiv-mein-dein'), ['meine', 'mein'], 'in a column of phrases, the word that changes');
  assert.deepEqual(marked('rc.akkusativ'), ['einen'], 'a token the card names in caseMarks');
  assert.deepEqual(marked('rc.trennbare-verben'), ['stehe', 'auf'], 'the mark sits on the word, not on its full stop');
  assert.deepEqual(marked('rc.adjektiv-praedikativ'), [], 'nothing clear to mark: nothing marked');
  assert.ok(ruleForms(a11Cards.get('rc.praesens')).has('kommst'));
  assert.ok(!ruleForms(a11Cards.get('rc.praesens')).has('ich'), 'the persons column is a label, not a form');
  // DaF review 2026-09-30 (DAF-01): only the taught form is marked — a column whose phrases are all
  // the same („das / ein Heft" in both rows) teaches no change, so „Heft" is no accusative form; a
  // separable prefix read off the „Ende" column („um.") is marked where it ends the clause, never as
  // the preposition of „um 9.10 Uhr"
  assert.deepEqual(marked('rc.akkusativ', 'Ich habe einen Kuli und ein Heft.'), ['einen'], 'u6’s own model sentence: the Akkusativ article alone');
  assert.deepEqual(marked('rc.trennbare-verben-2'), ['fährt', 'ab'], 'the verb and its prefix, not the preposition');
  assert.deepEqual(marked('rc.trennbare-verben-2', 'Wir steigen in Hannover um.'), ['steigen', 'um'], '…and the same prefix where it does end the clause');
  assert.deepEqual(marked('rc.trennbare-verben-2', 'Wann kommt der Zug an? Um 10 Uhr.'), ['an'], 'a prefix before a question mark ends its clause; the „Um" of the time does not');
  for (const id of ['heft', 'tasche', 'stifte']) assert.ok(!ruleForms(a11Cards.get('rc.akkusativ')).has(id) && !ruleForms(a11Cards.get('rc.kein')).has(id), `${id} is a noun, not a form`);
  assert.ok(ruleForms(a11Cards.get('rc.trennbare-verben-2')).has('um'), 'the prefix is still a form of the card');
  // the invariants hold for EVERY model sentence the course shows: the cards' own and every step's override
  const sentences = [
    ...CARDS.map((c) => ({ id: c.id, sentence: c.modelSentence, card: c })),
    ...LEVELS.flatMap((l) => {
      const byId = new Map(json(`${DATA}/${l}/rule-cards.json`).cards.map((c) => [c.id, c]));
      return UNITS.filter((u) => u.id && u.id.startsWith(`${l}-`)).flatMap((u) => (u.steps || [])
        .filter((s) => s && s.ruleCard && s.modelSentence)
        .map((s) => ({ id: s.id, sentence: s.modelSentence, card: byId.get(s.ruleCard) || null })));
    }),
  ];
  assert.ok(sentences.length > CARDS.length + 20, 'the step overrides are covered too');
  for (const { id, sentence, card } of sentences) {
    const segs = emphasize(sentence, card);
    assert.equal(segs.map((s) => s.text).join(''), sentence, `${id}: the segments must give the sentence back`);
    const n = segs.filter((s) => s.strong).length;
    const words = wordCount(sentence);
    assert.ok(n <= Math.max(3, Math.floor(words * 0.4)), `${id}: ${n} of ${words} words marked`);
    for (const s of segs.filter((x) => x.strong)) {
      assert.match(s.text, /^[\p{L}\p{N}].*[\p{L}\p{N}]$|^[\p{L}\p{N}]$/u, `${id}: punctuation inside a mark`);
      assert.ok(ruleForms(card).has(s.text.toLowerCase()), `${id}: „${s.text}" is not a form the card teaches`);
    }
  }
  assert.deepEqual(emphasize('', a11Cards.get('rc.praesens')), []);
  assert.deepEqual(emphasize('Ich komme.', null), [{ text: 'Ich komme.', strong: false }]);
});

// ---------------------------------------------------------------------------
// The structure of the step
// ---------------------------------------------------------------------------

const sv = read(`${V2}/StepView.jsx`);
const NEW_FILES = [`${V2}/StepScreen.jsx`, `${V2}/WordCards.jsx`, `${V2}/StoryInput.jsx`, `${V2}/steps.js`];
const STEP_FILES = [`${V2}/StepView.jsx`, `${V2}/RuleCardView.jsx`, `${V2}/WordList.jsx`, `${V2}/InputView.jsx`, ...NEW_FILES];

test('the step has no stage strip and no numbered heading; the section stays for screen readers', () => {
  assert.doesNotMatch(sv, /StageStrip|stagesOf|exerciseNr|stageIcon|SkillIcon/, 'the strip and the Lehrwerk numbering are gone from the step');
  assert.match(sv, /\{context && <h1 className="sr-only"[^>]*>\{context\}<\/h1>\}/);
  assert.match(sv, /const context = letter\s*\? `\$\{t\('kap\.part', \{ l: letter \}\)\}/, '„Teil B: Woher kommst …" — the section and the step title');
  // one short heading where the screen has none of its own; the item runs bring theirs
  assert.match(sv, /micro: \(\) => t\('card\.yourTurn'\)/);
  for (const seg of ['warmup', 'words', 'input', 'inputItems', 'form', 'structured', 'practice', 'aussprache', 'redemittel', 'cloze', 'exit', 'end']) {
    assert.ok(new RegExp(`const OWN_TITLE = \\[[^\\]]*'${seg}'`).test(sv), `${seg} brings its own heading`);
  }
  assert.equal((sv.match(/<h2 /g) || []).length, 1, 'one heading element in the frame');
});

test('words, input, rule card and phrases are stepped screens that feed the progress bar and finish once', () => {
  assert.match(sv, /case 'words':\s*body = <WordCards key="words" words=\{words\} unitId=\{unitId\} onProgress=\{setInner\} onDone=\{advance\} \/>;/);
  assert.match(sv, /case 'input':\s*body = <StoryInput key="input" input=\{step\.input\} unitId=\{unitId\} names=\{names\} onProgress=\{setInner\} onDone=\{advance\} \/>;/);
  assert.match(sv, /<RuleCardSteps[\s\S]{0,300}onProgress=\{setInner\}\s+onDone=\{advance\}/);
  assert.match(sv, /case 'redemittel':\s*body = <PhraseCards key="redemittel" phrases=\{redemittel\} unitId=\{unitId\} onProgress=\{setInner\} onDone=\{advance\} \/>;/);
  assert.match(sv, /case 'table':\s*body = <RuleTableFill table=\{step\.ruleTable\} stepId=\{step\.id\} onAttempt=\{attempt\} onDone=\{count\} onNext=\{advance\} \/>;/, 'the table still counts, then moves on from the bottom bar');
  assert.doesNotMatch(sv, /function NextBar|<NextBar/, 'no in-flow „Weiter" that moves with the content');
  // the order and the counting are segmentsFor's, unchanged
  assert.match(sv, /if \(extras\.words && extras\.words\.length >= MIN_WORDS\) segs\.push\(\{ id: 'words', label: 'stage\.words' \}\);\s*if \(step\.input\) segs\.push\(\{ id: 'input', label: 'seg\.input' \}\);/);
  assert.match(sv, /if \(step\.modelSentence \|\| step\.ruleCard\) segs\.push\(\{ id: 'form', label: 'seg\.form' \}\);/);
  // each deck finishes once and reports its position
  const cards = read(`${V2}/WordCards.jsx`);
  assert.match(cards, /sink\.current\(total \? Math\.min\(1, i \/ total\) : 1\)/);
  assert.match(cards, /if \(finished\.current\) return;\s*finished\.current = true;\s*if \(typeof onDone === 'function'\) onDone\(\);/);
  const rule = read(`${V2}/RuleCardView.jsx`);
  assert.match(rule, /sink\.current\(Math\.min\(1, at \/ screens\.length\)\)/);
  const story = read(`${V2}/StoryInput.jsx`);
  assert.match(story, /sink\.current\(total \? Math\.min\(1, position \/ total\) : 1\)/);
  assert.match(story, /if \(finished\.current\) return;\s*finished\.current = true;/);
});

test('every „Weiter" of a stepped screen sits in the bottom bar, with room left for it on a phone', () => {
  const screen = read(`${V2}/StepScreen.jsx`);
  assert.match(screen, /\{action && <StickyAction>\{action\}<\/StickyAction>\}/);
  assert.match(screen, /action \? 'pb-32 sm:pb-0' : ''/);
  // each StepScreen (opening tag to its closing tag) names its bottom-bar action
  const screensOf = (src) => src.split('<StepScreen').slice(1).map((s) => s.slice(0, Math.max(s.indexOf('</StepScreen>'), s.indexOf('/>'))));
  for (const f of [`${V2}/WordCards.jsx`, `${V2}/StoryInput.jsx`]) {
    const screens = screensOf(read(f));
    assert.ok(screens.length >= 2, `${f}: its screens are StepScreens`);
    for (const s of screens) assert.match(s, /action=\{/, `${f}: a screen without its bottom-bar action: ${s.slice(0, 80)}`);
  }
  assert.match(read(`${V2}/RuleCardView.jsx`), /<StepScreen title=\{kind === 'table' \? t\('card\.table'\) : t\('card\.tip'\)\} action=\{<GameButton onClick=\{next\}>/);
  assert.match(read(`${V2}/RuleCardView.jsx`), /\{stepped && \(\s*<StickyAction>/, 'the table fill checks and moves on from the bottom bar');
  const inStep = screensOf(sv);
  assert.ok(inStep.length >= 5);
  for (const s of inStep) assert.match(s, /action=\{/, `StepView: a screen without its bottom-bar action: ${s.slice(0, 80)}`);
  assert.match(sv, /action=\{readAloudDone\s*\?\s*<GameButton[^}]*\}>\{t\('item\.next'\)\}<\/GameButton>\s*:\s*<QuietButton/, 'the read-aloud: „Weiter" once said, a quiet skip before');
});

test('the story keeps the unaided listen, reveals one line per „Weiter" and speaks only where it can', () => {
  const story = read(`${V2}/StoryInput.jsx`);
  assert.match(story, /const playable = lines\.length > 0 && canPlay\(unitId, lines\[0\]\.id\);/);
  assert.match(story, /const \[phases\] = useState\(\(\) => inputPhases\(input, \{ playable \}\)\);/, 'the screens are fixed when the input opens');
  assert.match(story, /disabled=\{kind === 'listen' && !heard\}/, 'the transcript waits for the first listen');
  assert.match(story, /if \(kind && kind !== 'listen' && shown < beatsOf\(kind\)\) \{ setShown\(shown \+ 1\); return; \}/, 'one more line (or chunk) per „Weiter"');
  assert.match(story, /lines\.slice\(0, shown\)\.map/, 'the earlier lines stay above');
  assert.match(story, /<CastAvatar name=\{name\}/, 'each line with its speaker');
  assert.match(story, /<GlossText text=\{l\.de\}/, 'tap-glosses still work');
  assert.match(story, /if \(!line \|\| !canPlay\(unitId, line\.id\)\) return undefined;/, 'a new line speaks only where it can be played');
  assert.match(story, /<ol className="space-y-3\.5" aria-live="polite">/, 'a new line is announced');
  assert.match(story, /aria-pressed=\{typeof pressed === 'boolean'|pressed=\{english\}/);
  assert.match(read(`${V2}/WordCards.jsx`), /if \(!text \|\| !id \|\| !canPlay\(unitId, id\)\) return undefined;/, 'a word card speaks only where it can');
  // the Start's Folge and the reward pieces still read the whole input on one screen
  const iv = read(`${V2}/InputView.jsx`);
  assert.match(iv, /const gate = hasAudio && input\?\.transcriptAfterUnaidedListen !== false && playable;/);
  assert.match(read(`${V2}/StartView.jsx`), /<InputView/);
});

test('the paradigm table fits a phone, or says that it scrolls and can be scrolled by keyboard (DAF-06, A11Y-01)', () => {
  // The „Auf einen Blick" screen cut the sein column of the Präsens table at 390 px and hid it at 360
  // px behind a clean rounded border; axe flagged the overflow box as scrollable-region-focusable.
  const rule = read(`${V2}/RuleCardView.jsx`);
  const table = rule.slice(rule.indexOf('function RuleTable('), rule.indexOf('export function RuleCardSteps('));
  // the stepped table is sized like the panel below sm, so a five-column A1 table fits 360 px (measured 312 in 324)
  assert.match(table, /big \? 'text-\[0\.875rem\] sm:text-\[1rem\]' : 'text-\[0\.875rem\] sm:text-\[0\.9375rem\]'/, 'the big table shrinks to the panel size on a phone');
  assert.match(table, /big \? 'px-1\.5 py-2\.5 sm:px-2\.5' : 'px-2 py-1\.5 sm:px-3 sm:py-2'/, 'the big cells shrink with it');
  // the overflow box is measured; only a box that scrolls is a named, focusable region, and only
  // while there is more to the right does its edge fade — nothing when the table fits
  assert.match(table, /const \{ scrolls, more, onScroll \} = useOverflowX\(box\);/);
  assert.match(table, /tabIndex=\{scrolls \? 0 : undefined\}\s+role=\{scrolls \? 'region' : undefined\}\s+aria-label=\{scrolls \? t\('card\.table'\) : undefined\}/, 'keyboard-reachable exactly when it scrolls');
  assert.match(table, /\$\{more \? FADE_RIGHT : ''\}/, 'the scroll cue while there is more');
  assert.match(rule, /const FADE_RIGHT = '\[mask-image:linear-gradient\(to_right,black_85%,transparent\)\]/, 'a mask, no palette colour');
  const hook = rule.slice(rule.indexOf('function useOverflowX('), rule.indexOf('function RuleTable('));
  assert.match(hook, /useLayoutEffect\(/, 'measured before paint');
  assert.match(hook, /const scrolls = el\.scrollWidth > el\.clientWidth \+ 1;/);
  assert.match(hook, /const more = scrolls && el\.scrollLeft \+ el\.clientWidth < el\.scrollWidth - 1;/);
  assert.match(hook, /new ResizeObserver\(measure\)/, 'a table that widens later (the web font) is re-measured');
  // the mask fades the scrolling box, never the bordered card around it
  assert.match(table, /<div className=\{`bg-white \$\{big \? 'rounded-\[1\.25rem\] border-2 border-b-4 border-game-line p-1\.5'/);
  assert.match(table, /className=\{`overflow-x-auto rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-course \$\{more \? FADE_RIGHT : ''\}`\}/);
});

test('the reference pages keep the panel and the list; the Kapitel page keeps its back matter', () => {
  assert.match(read('src/pages/course-v2/GrammarPage.jsx'), /<RuleCardView key=\{card\.id\} card=\{card\}/);
  assert.match(read('src/pages/course-v2/WordsPage.jsx'), /<WordList words=\{ch\.words\}/);
  const rule = read(`${V2}/RuleCardView.jsx`);
  assert.match(rule, /export default function RuleCardView\(\{ card, modelSentence = null, compact = false, title = null, headingAs = 'p' \}\)/);
  assert.match(rule, /border-course-soft bg-course-wash/, 'the panel is still the Grammatik box');
  assert.match(read(`${V2}/WordList.jsx`), /export default function WordList\(/);
});

test('the new screens write course tokens only, mark a form in the course ink, move only when allowed, and speak Sie', () => {
  for (const f of STEP_FILES) {
    const src = read(f);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${f}: a hex colour`);
    assert.doesNotMatch(src, /\b(?:bg|text|border|fill|stroke|ring|decoration)-(?:amber|rose|red|green|blue|gray|slate|emerald|orange|yellow|teal|cyan)-\d/, `${f}: a raw palette class`);
    assert.doesNotMatch(src, /\b(?:bg|text|border|fill|stroke|decoration)-kasus-/, `${f}: a kasus colour outside the case chip`);
    assert.doesNotMatch(src, /\bdu\b|\bdein/i, `${f}: the course speaks Sie`);
    for (const m of src.matchAll(/\banimate-[a-z-]+/g)) {
      const at = m.index;
      assert.equal(src.slice(at - 'motion-safe:'.length, at), 'motion-safe:', `${f}: an animation that ignores reduced motion`);
    }
  }
  const rule = read(`${V2}/RuleCardView.jsx`);
  assert.match(rule, /<strong key=\{i\} className="font-extrabold text-course-ink underline decoration-course/, 'the taught form: course ink + underline, never a case hue');
  assert.equal((rule.match(/<Chip tone=/g) || []).length, 1, 'the kasus chip lives in one place: the table cell the card names');
  const cards = read(`${V2}/WordCards.jsx`);
  assert.match(cards, /\{p\.article && <span className="font-bold text-game-muted">/, 'the article in neutral ink');
});

test('every chrome key of the stepped screens exists in both tables, the German ones in Sie', () => {
  const strings = read(`${V2}/strings.js`);
  const en = strings.slice(strings.indexOf('const EN = {'), strings.indexOf('const DE = {'));
  const de = strings.slice(strings.indexOf('const DE = {'), strings.indexOf('export const V2_STRINGS'));
  const used = new Set();
  for (const f of STEP_FILES) for (const m of read(f).matchAll(/\bt\('([a-z]+\.[A-Za-z0-9]+)'/g)) used.add(m[1]);
  assert.ok([...used].filter((k) => k.startsWith('card.')).length >= 15);
  for (const k of used) {
    assert.ok(en.includes(`'${k}':`), `EN lacks ${k}`);
    assert.ok(de.includes(`'${k}':`), `DE lacks ${k}`);
  }
  // the block is one contiguous run of card.* keys in each table
  for (const table of [en, de]) {
    const lines = table.split('\n').map((l, i) => ({ l, i })).filter(({ l }) => /^\s*'card\./.test(l));
    assert.ok(lines.length >= 15);
    assert.equal(lines[lines.length - 1].i - lines[0].i, lines.length - 1, 'the card.* keys are one block');
  }
  const cardDe = de.split('\n').filter((l) => /^\s*'card\./.test(l)).join('\n');
  assert.doesNotMatch(cardDe, /\b(du|dir|dich|dein\w*)\b/i);
  assert.match(de, /'card\.listen': 'Hören Sie zu'/);
  assert.match(de, /'card\.tip': 'Grammatik-Tipp'/);
  assert.match(de, /'card\.newWord': 'Neues Wort'/);
});
