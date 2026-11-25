// The browser walk of all twelve A1.1 Lektionen (2026-11-25): the player's screen defects, each as a rule.
// The sound options, the option order, the Arabic help, the example lines and the kept writing have their
// tests beside their subject (guided-rollout, arabic-help, wortfeld-pacing, graded-writing-restore).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 as c } from '../src/data/curricula/a11.js';
import { POPOVER_GUTTER, popoverShift } from '../src/lib/lesson/gloss.js';
import * as feedback from '../src/lib/lesson/guidedFeedback.js';
import { STRINGS, t } from '../src/lib/lesson/strings.js';
import { fullSentenceDe } from '../src/data/lessonPools/quality.js';
import buildLesson from '../src/lib/lesson/buildLesson.js';
import { keepFocus } from '../src/hooks/useKeepFocus.js';
import { loadJsxModule, oneRenderHooks } from './helpers/renderJsx.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const player = read('src/pages/lesson/LessonPlayerPage.jsx');

test('a gloss popover stays on the screen at every place of its word (44 of 473 left it at 390 px, 74 at 360)', () => {
  for (const width of [320, 360, 390, 768]) {
    for (let left = 0; left < width; left += 7) for (const size of [60, 150, 240]) {
      const rect = { left, right: left + size };
      const shift = popoverShift(rect, width);
      assert.ok(rect.left + shift >= POPOVER_GUTTER, `${width}/${left}/${size}: left edge`);
      assert.ok(rect.right + shift <= width - POPOVER_GUTTER, `${width}/${left}/${size}: right edge`);
      if (left >= POPOVER_GUTTER && left + size <= width - POPOVER_GUTTER) assert.equal(shift, 0, 'one that fits is not moved');
    }
  }
  const dialog = read('src/components/lesson/DialogStage.jsx');
  // Before the first paint, so the page never grows sideways; the only property that moves is the transform.
  assert.match(dialog, /useLayoutEffect\(\(\) => \{\s*const shift = popoverShift\(ref\.current\.getBoundingClientRect\(\), document\.documentElement\.clientWidth\);\s*if \(shift\) ref\.current\.style\.transform/);
  assert.match(dialog, /\{isOpen && <GlossPopover id=\{popoverId\} entry=\{entry\} lang=\{lang\} \/>\}/);
});

test('the recap ends the run: no Back into a finished one, and the next page opens at its top', () => {
  const recap = player.slice(player.indexOf("case 'recap':"), player.indexOf('default:\n      body = null;'));
  assert.ok(recap.includes('<RecapStage'));
  assert.doesNotMatch(recap, /onBack/, 'Back restarted the check at turn 1, and a refresh there lost the Lektion');
  assert.doesNotMatch(read('src/components/lesson/RecapStage.jsx'), /onBack/);
  assert.match(recap, /window\.scrollTo\(\{ top: 0, behavior: 'auto' \}\);\s*\}?\s*navigate\(nextTarget\.to\);/);
});

test('the streak chip stands last in the header row, so it never pushes the language switch to a second row', () => {
  const header = player.slice(player.indexOf('<LessonProgressBar\n'), player.indexOf('awayAt === `'));
  assert.ok(header.indexOf('<LangToggle />') > 0 && header.indexOf('<LangToggle />') < header.indexOf('<ComboChip'), 'the chip is what wraps');
});

test('the match header is written like the headers of its neighbours', () => {
  const style = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel-deep';
  for (const name of ['GuidedMatchItem', 'ListenSelectItem', 'PracticeItem', 'WordOrderItem', 'DictationItem']) {
    assert.ok(read(`src/components/lesson/${name}.jsx`).includes(style), name);
  }
});

test('in German mode the writing task shows its German text only, and every Lektion has one that stands alone', async () => {
  const hooks = oneRenderHooks();
  for (const lang of ['en', 'de']) {
    const { default: WritingStage } = await loadJsxModule('src/components/lesson/WritingStage.jsx', {
      react: { ...hooks.react, useCallback: (fn) => fn },
      '../../contexts/AuthContext': { useAuth: () => ({ user: null }) },
      './StageShell.jsx': { default: 'StageShell' }, './GradedWriting.jsx': { default: 'GradedWriting', forgetAssessedWriting: () => {} },
      '../../lib/lesson/strings.js': { t, useLessonLang: () => [lang] }, '../../lib/lesson/skillStatus.js': { writingSummary: () => ({}) },
    });
    for (const l of c.lektionen) {
      const shell = WritingStage({ stage: { key: 'writing', part: 3, schreiben: l.schreiben }, onBack() {}, onDone() {} });
      assert.equal(shell.props.title, l.schreiben.taskDe);
      assert.equal(shell.props.lead, lang === 'de' ? null : l.schreiben.taskEn, `L${l.nr} ${lang}`);
    }
  }
  for (const { nr, schreiben } of c.lektionen) {
    assert.match(schreiben.taskDe, /\b(Schreiben|Füllen) Sie\b/, `L${nr}: the German names the task, in Sie`);
    // What the English adds in words („Cover three points: …", the form's fields) is on the screen in German.
    assert.ok((schreiben.leitpunkte || schreiben.fields).length >= 3, `L${nr}`);
  }
});

test('sound and reading questions give a second try like the scene, and a reading question has its own answer lines', () => {
  assert.match(read('src/components/lesson/SoundStage.jsx'), /<CheckedChoice hintFirst item=\{item\}/);
  assert.match(read('src/components/lesson/ReadStage.jsx'), /<CheckedChoice hintFirst key=/);
  for (const l of c.lektionen) {
    const stage = buildLesson({ curriculum: c, lektion: l, pool }).stages.find((s) => s.kind === 'read');
    for (const item of stage.items) assert.equal(item.feedbackKey, 'read');
  }
  for (const lang of ['en', 'de']) {
    assert.doesNotMatch(t('read.correct', lang) + t('read.correction', lang, { answer: 'x' }), /meaning|Bedeutung/, 'a reading answer is not „the meaning"');
    assert.match(t('read.correction', lang, { answer: 'Am Montag.' }), /Am Montag\./);
  }
});

test('„Show the text instead" goes once the text is open, and the two retry buttons of one screen say what they do', () => {
  assert.match(read('src/components/lesson/SoundStage.jsx'), /onFallback=\{fallback \? undefined : \(\) => \{/);
  for (const lang of ['en', 'de']) assert.notEqual(t('audio.retry', lang), t('action.again', lang));
  assert.match(STRINGS.en['audio.retry'], /sound/);
  assert.match(STRINGS.de['audio.retry'], /Ton/);
});

test('after a listening sound the reason names the sound that is practised; it never repeats the instruction', async () => {
  const { buildSoundItems, nounsOf } = await import('../src/lib/lesson/guidedSound.js');
  const nouns = nounsOf(c.lektionen);
  for (const l of c.lektionen) for (const item of buildSoundItems(l, nouns)) {
    if (!['pair', 'phrase', 'sound-word'].includes(item.soundKind)) continue;
    assert.ok(item.explanationDe.includes(l.phonetik.focus) && item.explanationEn.includes(l.phonetik.focusEn), item.id);
    assert.notEqual(item.explanationDe, item.modelDe);
    for (const text of [item.explanationDe, item.explanationEn]) assert.doesNotMatch(text, /öffnen Sie|open the text|Hören Sie die Zeile|Listen to the line/, item.id);
  }
});

test('the first pretest’s sound notice stays on its first step', () => {
  const src = read('src/components/lesson/PretestStage.jsx');
  assert.match(src, /setStep\('recall'\); setChecked\(null\); setAudioFail\(null\);/);
  assert.match(src, /\{step === 'supported' && <AudioFailureNotice reason=\{audioFail\} \/>\}/);
});

test('a from-memory line that spells the surname asks for the surname', () => {
  assert.match(read('src/components/lesson/FluencyStage.jsx'), /t\(line\.ownName === 'surname' \? 'fluency\.surname' : 'fluency\.name', lang\)/);
  assert.match(STRINGS.en['fluency.surname'], /surname/);
  assert.match(STRINGS.de['fluency.surname'], /Nachnamen/);
  const asked = c.lektionen.flatMap((l) => l.guided.chunks.map((chunk) => chunk.say.ownName)).filter(Boolean);
  assert.deepEqual([...new Set(asked)].sort(), ['full', 'surname'], 'no third kind of name to ask for');
});

test('a gap hint names only the side of the gap that has text, and is never blank', () => {
  const side = (questionDe) => feedback.gapSide({ questionDe });
  assert.equal(side('___ Frau arbeitet hier.'), 'after');
  assert.equal(side('Es ist ___. (14:30, offiziell)'), 'before');
  assert.equal(side('Was kostet ___ Stuhl?'), 'both');
  assert.equal(side('Schreiben Sie das Wort: ___'), 'none', 'the instruction is no text around the gap');
  assert.equal(side('Ergänzen Sie den Artikel: ___ Tisch ist neu.'), 'after');
  assert.equal(side('Meine Mutter ist hier. ___ spricht Deutsch.'), 'both', 'the sentence before it counts');
  const fills = pool.items.filter((i) => i.type === 'fill_blank');
  for (const item of fills) for (const lang of ['de', 'en']) {
    const shown = feedback.guidedFeedback(item, { result: 'wrong', expected: item.answer }, false, lang).hint;
    assert.ok(shown, `${item.id}: ${item.questionDe} => no hint`);
    if (/vor und nach|before and after/.test(shown)) assert.equal(feedback.gapSide(item), 'both', `${item.id}: ${item.questionDe}`);
    assert.equal(feedback.hintContainsAnswer(shown, item), false, `${item.id}: ${shown}`);
  }
});

test('a retry tip is English on an English screen, for every tip the A1.1 bank has', () => {
  const tips = [...new Set(pool.items.map((i) => i.hint).filter(Boolean))];
  assert.ok(tips.length >= 10);
  for (const tip of tips) {
    assert.equal(feedback.tipFor(tip, 'de'), tip);
    const en = feedback.tipFor(tip, 'en');
    assert.ok(en, `„${tip}" has no English: write it in guidedFeedback TIPS_EN`);
    assert.doesNotMatch(en, /Buchstaben|Achten Sie|nächste|Stunde|Laut|Name,| oder nicht/, `${tip} → ${en}`);
  }
  assert.equal(feedback.tipFor('Ein neuer deutscher Tipp.', 'en'), null, 'an unknown tip is left out, never shown in German');
  assert.equal(feedback.tipFor(null, 'en'), null);
  assert.match(read('src/components/lesson/PracticeItem.jsx'), /const tip = !hintFirst && !state \? tipFor\(item\.hint, lang\) : null;/);
});

test('an explanation is a sentence: no bare sum of forms, no noun sentence that starts small', () => {
  assert.equal(fullSentenceDe('er + ist.'), 'Zu „er“ gehört die Form „ist“.');
  assert.equal(fullSentenceDe('du + -st.'), 'Zu „du“ gehört die Endung -st.');
  assert.equal(fullSentenceDe('das Bild ist neutral, Verb auf Platz zwei.'), 'Das Bild ist neutral, das Verb steht auf Platz zwei.');
  for (const text of ['halb + NÄCHSTE Stunde = 2:30.', 'der Beruf — B-E-R-U-F.', 'Nach „er“ steht „ist“.', '']) assert.equal(fullSentenceDe(text), text, 'any other text stays as written');
  for (const item of pool.items) {
    assert.equal(fullSentenceDe(item.explanationDe), item.explanationDe, `${item.id}: ${item.explanationDe}`);
    assert.doesNotMatch(item.explanationEn, /^\p{L}+ \+ -?\p{L}+\.$/u, `${item.id}: ${item.explanationEn}`);
  }
});

test('German hint words keep their spelling on the speaking screen, and a long word breaks inside its recap card', () => {
  // „heißen" in capitals is „HEISSEN".
  assert.match(read('src/components/lesson/SpeakingStage.jsx'), /<Chip key=\{w\} tone="quiet" className="normal-case" lang="de">\{w\}<\/Chip>/);
  assert.match(read('src/components/lesson/WordsLearnedCards.jsx'), /className="min-w-0 hyphens-auto [^"]*\[overflow-wrap:anywhere\]" lang="de">\{de\}/);
});

test('focus stays where a control disappeared or was switched off, and is left alone when the learner moved it', async () => {
  assert.match(player, /useKeepFocus\(bodyRef\);/);
  // A small document: elements with a parent, a focus, and an observer the test fires itself.
  const doc = { body: {}, activeElement: null };
  class El {
    constructor(parentElement) { this.parentElement = parentElement; this.isConnected = true; this.disabled = false; this.attrs = {}; this.listeners = {}; }
    hasAttribute(name) { return name in this.attrs; }
    setAttribute(name, value) { this.attrs[name] = value; }
    focus() { doc.activeElement = this; root.listeners.focusin({ target: this }); }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    removeEventListener(name) { delete this.listeners[name]; }
    querySelector() { return this.heading || null; }
  }
  const root = new El(new El(null));
  let mutated;
  let observing = true;
  class Observer {
    constructor(fn) { mutated = fn; }
    observe(target, what) { assert.equal(target, root); assert.ok(what.childList && what.subtree && what.attributeFilter.includes('disabled')); }
    disconnect() { observing = false; }
  }
  const undo = keepFocus(root, doc, Observer);
  const card = new El(root);
  const row = new El(card);
  const lose = () => { doc.activeElement = doc.body; mutated(); };

  // „I said it" goes: the focus stays on the nearest parent that is still there.
  const button = new El(row); button.focus();
  button.isConnected = false; lose();
  assert.equal(doc.activeElement, row);
  assert.equal(row.attrs.tabindex, '-1');
  // Its parent goes too.
  const other = new El(row); other.focus();
  other.isConnected = false; row.isConnected = false; lose();
  assert.equal(doc.activeElement, card);
  // Play is off while the sound loads, and on again after it: the focus comes back to it.
  const play = new El(card); play.focus();
  play.disabled = true; lose();
  assert.equal(doc.activeElement, doc.body, 'off: wait for it');
  play.disabled = false; mutated();
  assert.equal(doc.activeElement, play);
  // The learner clicked away: their choice stays.
  root.listeners.focusout({ target: play }); doc.activeElement = doc.body;
  await new Promise((resolve) => { setTimeout(resolve, 5); });
  mutated();
  assert.equal(doc.activeElement, doc.body);
  // Chrome blurs a control while it removes it: that is not the learner's doing.
  const gone = new El(card); gone.focus();
  root.listeners.focusout({ target: gone }); gone.isConnected = false; lose();
  assert.equal(doc.activeElement, card);
  // Another control holds the focus: it keeps it.
  const field = new El(card); play.focus(); field.focus(); play.isConnected = false; mutated();
  assert.equal(doc.activeElement, field);
  // The whole screen went and the next one loads late: its heading takes the focus when it is there.
  const heading = new El(root);
  field.focus(); field.isConnected = false; card.isConnected = false; lose();
  assert.equal(doc.activeElement, doc.body, 'no heading yet');
  root.heading = heading; mutated();
  assert.equal(doc.activeElement, heading);
  undo();
  assert.equal(observing, false);
  assert.deepEqual(root.listeners, {});
});
