// Guard suite: the German branch of every `isGerman ? … : …` UI string says Sie,
// never du (product agent, 2026-10-04). German-only screens and data fields
// (labelDe, descriptionDe) are not scanned yet; see agents/product backlog.
//
// The finding this closes (conversion handoff conv-b1): the listening results
// card asked "DeutschMeister gefällt dir?" and "Abonniere, um nach deinem Test
// weiter zu lernen." Two defects in one line. It says du, and the owner's copy
// rule is that the course speaks Sie everywhere (tasks, notices, rule cards,
// mail; CLAUDE.md). And "nach deinem Test" reads as "after the listening test
// you just took", not "after your trial" (Testphase), which is what the English
// branch says. The learning screens carried eleven more du lines: the "Das zählt
// für deinen Streak" completion note on listening and reading, the listening and
// reading leads, the listening player hint, the reading list footer, the video
// library heading, intro and empty state, the video player fallback, and the
// podcast tab's "Schau bald wieder vorbei!".
//
// The rule, not a list of lines: every inline bilingual branch under src/ (the
// `isGerman ? <German> : <English>` pattern, including the arrays and objects a
// branch returns) is walked, and no string in its German side addresses the
// reader with du: no du/dich/dir/dein… word, and no du-imperative opening a
// sentence ("Wähle …", "Schau …", "Lerne …"). Sie-imperatives ("Wählen Sie")
// and infinitive headings ("Deutsch lernen mit …") pass. A new screen is covered
// without editing this file.
//
// Out of scope here: learning content that names du as a grammar word
// (grammarTopics.js descriptions, the curricula and their dialogues, which duzen
// on purpose between learners), and the i18next resource file. Those are
// content, not UI chrome, and are checked where they are owned.
//
// MAX_DU_BRANCHES is a ratchet over what is left. It only goes down, and it must
// equal its measurement, so whoever fixes one lowers it in the same commit. On
// 2026-10-04 it counted six lines product could not change that day: four on
// SubscriptionPage (revenue's route; revenue moved them to Sie on 2026-10-05,
// 6 -> 2), and the two "Wähle …" headings in ReadingChecks.jsx, which a merged PR
// changed on 2026-09-06 (PROTOCOL rule 6 holds them until 2026-10-07).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

const MAX_DU_BRANCHES = 2;

/** Course data and lesson pools are content (dialogues duzen on purpose); validate-curriculum owns them. */
const CONTENT_DIRS = new Set(['curricula', 'lessonPools']);

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  if (statSync(p).isDirectory()) return CONTENT_DIRS.has(name) ? [] : walk(p);
  return /\.(jsx?|mjs)$/.test(name) ? [relative(ROOT, p)] : [];
});

/** Comments out, so a doc comment that quotes old copy cannot trip the rule. Line count is kept. */
const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/^(\s*)\/\/.*$/gm, '$1');

/**
 * The German side of `isGerman ? A : B`: the source text of A, read from just after
 * the `?` to the `:` that closes it at bracket depth 0, skipping string literals.
 */
export function germanBranch(src, from) {
  let depth = 0;
  let i = from;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"' || c === '`') {
      i = skipString(src, i);
      continue;
    }
    if (c === '?' && (src[i + 1] === '?' || src[i + 1] === '.')) {
      i += 2; // `??` and `?.` are not ternaries
      continue;
    }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') {
      if (depth === 0) break;
      depth--;
    } else if (c === ':' && depth === 0) break;
    else if (c === '?' && depth === 0) {
      // A nested ternary inside the German side: its own `:` belongs to it.
      depth++;
      const end = germanBranch(src, i + 1);
      i = end.end + 1;
      depth--;
      continue;
    }
    i++;
  }
  return { text: src.slice(from, i), end: i };
}

/** Index just past the string literal that opens at i (template ${…} skipped by brace depth). */
function skipString(src, i) {
  const q = src[i];
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { j += 2; continue; }
    if (q === '`' && c === '$' && src[j + 1] === '{') {
      let d = 1;
      j += 2;
      while (j < src.length && d > 0) {
        if (src[j] === '{') d++;
        else if (src[j] === '}') d--;
        j++;
      }
      continue;
    }
    if (c === q) return j + 1;
    j++;
  }
  return j;
}

/** The string literals in a piece of source, template ${…} parts blanked. */
export function stringsIn(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === "'" || c === '"' || c === '`') {
      const end = skipString(text, i);
      out.push(text.slice(i + 1, end - 1).replace(/\$\{[^}]*\}/g, ' '));
      i = end;
      continue;
    }
    i++;
  }
  return out;
}

// du, its object and possessive forms. \b is ASCII-only, so "Dü…" and "durch" never match.
const DU_WORD = /\b(?:du|Du|dich|Dich|dir|Dir|dein|Dein|deine|Deine|deinen|Deinen|deinem|Deinem|deiner|Deiner|deines|Deines)\b/;

// Common du-imperatives of UI copy. Words that are also nouns or numerals at a sentence
// start (Folge, Frage, Sage, Achte, Merke; also Sichere, Buche, Bleibe, Klick, which
// are adjectives or nouns: "Sichere Zahlung", "Klick für Klick") are left out on purpose.
const DU_IMPERATIVES = [
  'Abonniere', 'Antworte', 'Beantworte', 'Beginne', 'Benutze', 'Bestätige', 'Bleib',
  'Entdecke', 'Ergänze', 'Erstelle', 'Erzähle', 'Fang', 'Finde', 'Füge', 'Geh', 'Gehe',
  'Gib', 'Hilf', 'Hol', 'Hole', 'Hör', 'Höre', 'Kaufe', 'Klicke', 'Komm', 'Lade', 'Lass',
  'Lerne', 'Lern', 'Lies', 'Logge', 'Mach', 'Mache', 'Markiere', 'Melde', 'Nimm', 'Nutze', 'Öffne',
  'Ordne', 'Probiere', 'Prüfe', 'Registriere', 'Sammle', 'Schau', 'Schick', 'Schicke', 'Schließe',
  'Schreib', 'Schreibe', 'Sende', 'Setze', 'Sieh', 'Spare', 'Speichere', 'Sprich',
  'Starte', 'Teste', 'Tippe', 'Trage', 'Übe', 'Überprüfe', 'Vergiss', 'Verbessere', 'Verfolge',
  'Versuche', 'Verwandle', 'Wähl', 'Wähle', 'Warte', 'Wechsle', 'Wiederhole', 'Zeig', 'Zeige',
];
const lower = (w) => w[0].toLowerCase() + w.slice(1);
// A sentence start (string start, or after . ! ? … : — ·), optionally "Bitte ", then the verb,
// then a word that is not "Sie" (so "Lade Sie ein" style is not misread; "Wählen Sie" never matches).
const SENTENCE_START = String.raw`(?:^|[.!?…:—·]\s+)\s*`;
const DU_IMPERATIVE = new RegExp(
  `${SENTENCE_START}(?:Bitte\\s+(?:${DU_IMPERATIVES.map(lower).join('|')})|(?:${DU_IMPERATIVES.join('|')}))(?![\\wäöüß])(?!\\s+Sie\\b)`,
);

export const addressesWithDu = (s) => DU_WORD.test(s) || DU_IMPERATIVE.test(s.trim());

/** Every German string in an inline bilingual branch under src/ that says du, as "file:line: text". */
function duBranches() {
  const hits = [];
  for (const file of walk(SRC)) {
    const src = stripComments(readFileSync(join(ROOT, file), 'utf8'));
    const re = /\bisGerman\s*\?(?![.?])/g;
    let m;
    while ((m = re.exec(src))) {
      const branch = germanBranch(src, m.index + m[0].length);
      for (const s of stringsIn(branch.text)) {
        if (addressesWithDu(s)) {
          const line = src.slice(0, m.index).split('\n').length;
          hits.push(`${file}:${line}: ${s}`);
        }
      }
    }
  }
  return hits;
}

test('the du detector: du words and du-imperatives fail, Sie and infinitives pass', () => {
  for (const s of [
    'DeutschMeister gefällt dir?',
    'Abonniere, um nach deinem Test weiter zu lernen.',
    'Das zählt für deinen Streak und dein Tagesziel.',
    'Höre dir den Dialog an.',
    'Wähle a, b oder c',
    'Lerne Deutsch mit Videos',
    'Wir arbeiten daran. Schau bald wieder vorbei!',
    'Du hast den Kurs.',
    'Bitte wähle eine Stufe.',
    'Spare 20%',
  ]) assert.equal(addressesWithDu(s), true, `should fail: ${s}`);
  for (const s of [
    'Gefällt Ihnen DeutschMeister?',
    'Abonnieren Sie, um nach Ihrer Testphase weiterzulernen.',
    'Das zählt für Ihren Streak und Ihr Tagesziel.',
    'Hören Sie sich den Dialog an und beantworten Sie die Fragen unten.',
    'Wählen Sie a, b oder c',
    'Deutsch lernen mit Videozusammenfassungen und Folien',
    // Review of e4a2ea33: adjectives and nouns that look like du-imperatives.
    'Sichere Zahlung über Lemon Squeezy',
    'Klick für Klick zum Ziel',
    'Bleibe gesucht? Unser Leitfaden hilft.',
    'Folge 3: Im Café',
    'Frage 2 von 5',
    'Durchsuchen Sie die Videothek',
    'Düsseldorf',
    'Kostenlos registrieren',
    'Richtig oder falsch?',
  ]) assert.equal(addressesWithDu(s), false, `should pass: ${s}`);
});

test('the branch reader takes the German side only, through arrays, objects and nested ternaries', () => {
  const src = "x = isGerman ? ['Lerne A', { t: 'Wähle B' }] : ['Learn A']; y = isGerman ? (a ? 'Schau' : 'Höre') : 'Look';";
  const first = germanBranch(src, src.indexOf('?') + 1);
  assert.deepEqual(stringsIn(first.text), ['Lerne A', 'Wähle B']);
  const second = src.indexOf('isGerman ?', first.end) + 'isGerman ?'.length;
  assert.deepEqual(stringsIn(germanBranch(src, second).text), ['Schau', 'Höre']);
  const tpl = "z = isGerman ? `Noch keine Videos für ${level}. Schau dir die Stufen an!` : `None for ${level}`;";
  assert.deepEqual(stringsIn(germanBranch(tpl, tpl.indexOf('?') + 1).text), ['Noch keine Videos für  . Schau dir die Stufen an!']);
});

test('no German UI branch under src/ says du (ratchet: only goes down, equals its measurement)', () => {
  const hits = duBranches();
  assert.ok(
    hits.length <= MAX_DU_BRANCHES,
    `${hits.length} German UI strings say du (max ${MAX_DU_BRANCHES}). Use Sie ("Wählen Sie", "Ihr", "Ihnen") or an infinitive heading:\n  ${hits.join('\n  ')}`,
  );
  assert.equal(
    hits.length,
    MAX_DU_BRANCHES,
    `MAX_DU_BRANCHES is ${MAX_DU_BRANCHES} but ${hits.length} remain: lower the ratchet to ${hits.length} in this file.\n  ${hits.join('\n  ')}`,
  );
});

test('the listening results upgrade card speaks Sie and means the trial (conv-b1)', () => {
  const src = readFileSync(join(ROOT, 'src/components/listening/ResultsView.jsx'), 'utf8');
  assert.match(src, /Gefällt Ihnen DeutschMeister\?/);
  assert.match(src, /nach Ihrer Testphase/, 'the card is about the trial (Testphase), not the listening test just taken');
  assert.doesNotMatch(src, /nach deinem Test\b/);
});
