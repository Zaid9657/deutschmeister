# A1.1 rebuild — data contract (2026-09-12)

Binding for every agent on the A1.1 rebuild. The standard is
`docs/course-standard-2026-09-12.md`; this file is the shape of the data the standard's
lesson engine, checkpoints and syllabus page all read. **Derive, never retype**: the
curriculum module is the single source; the player, the checkpoint builder and the Astro
syllabus page consume it.

## Files and owners

| Path | Owner | Notes |
|---|---|---|
| `src/data/curricula/a11.js` | curriculum author | exports `CURRICULUM_A11` (shape below) |
| `src/data/curricula/index.js` | integration (exists) | `curriculumFor(level)`, `curriculumPath()` |
| `src/data/lessonPools/a11.json` | `scripts/build-lesson-pool.mjs` (exists) | 262 A1.1 grammar exercises keyed by topic slug — never hand-edit |
| `src/lib/lesson/check.js` | integration (exists) | `checkAnswer`, `tagError`, `STRICT_TOPIC`, `ERROR_TAGS` |
| `src/lib/lesson/*` (buildLesson, requeue, mastery, progress) | lesson engine | |
| `src/components/lesson/*`, `src/pages/lesson/LessonPlayerPage.jsx` | lesson engine | route `/course/:level/l/:nr` |
| `src/lib/checkpoint/*`, `src/pages/lesson/CheckpointPage.jsx`, `src/services/reviewService.js` | checkpoint + review | route `/course/:level/checkpoint/:nr` |
| `migrations/2026-09-12-lesson-engine.sql` | lesson engine (tables) + checkpoint (review_cards) — ONE file, engine agent creates it, checkpoint agent appends | applied by hand by the integrator |
| `astro-site/src/pages/courses/[level].astro` syllabus grid, `astro-site/src/data/curricula/a11.js` twin | syllabus | register the twin in `scripts/check-duplicates.mjs` |
| `src/App.jsx` routes, `src/pages/CourseHomePage.jsx` path rendering, `src/data/courses/index.js` | integration | agents do NOT edit these; they list the exact lines they need in their report |

Agents never run git (no commit, checkout, stash). Agents never edit files owned by another agent.

## `CURRICULUM_A11` shape

```js
export const CURRICULUM_A11 = {
  level: 'a1.1', code: 'A1.1', examKey: 'goethe_a1', examName: 'Start Deutsch 1',
  testSlug: 'abschlusstest-a1-1',
  provenance: { canDo: 'Goethe-Zertifikat A1 Start Deutsch 1 — Prüfungsziele, Testbeschreibung (Goethe-Institut/telc, 2016 ed.)', wortliste: 'Goethe-Zertifikat A1 Wortliste (≈650 units)', themen: 'BAMF Rahmencurriculum Integrationskurs (Handlungsfelder)' },
  hoursTotal: 55,                      // sum of lektion minutes + checkpoints + review, /60, rounded
  lektionen: [ /* exactly 12, see below */ ],
  checkpoints: [
    { nr: 1, id: 'a1.1-cp1', afterLektion: 3,  title: 'Checkpoint 1: Lektion 1–3' },
    { nr: 2, id: 'a1.1-cp2', afterLektion: 6,  title: 'Checkpoint 2: Lektion 4–6' },
    { nr: 3, id: 'a1.1-cp3', afterLektion: 9,  title: 'Checkpoint 3: Lektion 7–9' },
    { nr: 4, id: 'a1.1-cp4', afterLektion: 12, title: 'Checkpoint 4: Lektion 10–12' },
  ],
};
```

### One Lektion

```js
{
  nr: 1, id: 'a1.1-l01', slug: 'hallo-ich-bin',
  title: 'Hallo, ich bin …', situation: 'Sich vorstellen und den Namen buchstabieren',
  handlungsfeld: 'Kontakte / Sich vorstellen',                 // BAMF Handlungsfeld wording
  canDo: [ 'Ich kann mich vorstellen: Name, Land, Sprache.', /* 3–5, Goethe SD1 Kann-Beschreibungen in ich-Form */ ],
  examTeile: ['Sprechen Teil 1', 'Schreiben Teil 1'],           // official Teil names for SD1
  grammarSlugs: ['alphabet-pronunciation', 'verb-sein'],      // 1–3 EXISTING a1.1 slugs (list below); all 12 slugs must be used across the 12 Lektionen, each slug primary in exactly one Lektion (`primarySlug`)
  primarySlug: 'verb-sein',
  minutes: 15,
  wortfeld: [ { de: 'der Name', word: 'Name', article: 'der', plural: 'Namen', en: 'name', wordId: '<uuid from words dump or null>' }, /* 15–25; nouns with article+plural; verbs in infinitive; chunks allowed ("Wie geht's?") */ ],
  dialog: {
    title: 'Im Sprachkurs', setting: 'Erster Kurstag, zwei Teilnehmer.',
    lines: [ { speaker: 'Ana', de: 'Hallo, ich bin Ana.', en: 'Hi, I am Ana.' }, /* 6–10 lines, ≤ 12 words each, ONLY words from this Lektion's wortfeld + earlier Lektionen + the closed list of function words; the primary grammar occurs ≥ 3 times */ ],
  },
  pretest: { promptDe: 'Wie heißt du? Antworte mit einem Satz.', promptEn: 'Say your name in one sentence.', model: 'Ich heiße Ana.', accepted: ['Ich heiße', 'Ich bin', 'Mein Name ist'] /* prefixes; checked with startsWith after normalisation */ },
  notice: { title: 'sein: ich bin, du bist, Sie sind', bodyDe: '≤ 60 words, plain text, may use **bold**; one point only', examples: ['Ich bin Ana.', 'Sind Sie Frau Kaya?'] /* 2, taken verbatim from dialog.lines */ , ruleSlug: 'verb-sein' },
  phonetik: { focus: 'Wortakzent auf der ersten Silbe', items: ['HAL-lo', 'DAN-ke', 'A-na'] },
  hoeren: { kind: 'dictation', lines: [0, 2] },                 // indexes into dialog.lines to type after hearing
  sprechen: { readAloud: [1, 3], open: { teil: 'Sprechen Teil 1', promptDe: 'Stellen Sie sich vor: Name, Land, Sprache.', hintWords: ['heißen', 'kommen aus', 'sprechen'], missionOrder: 1 /* speaking_missions.mission_order at A1.1 or null */ } },
  schreiben: { kind: 'formular' | 'mitteilung', taskDe: '…', fields: ['Name', 'Vorname', 'Land'] /* formular */, leitpunkte: ['…','…','…'] /* mitteilung: exactly 3 */, minWords: 0, maxWords: 30, sample: '…' },
  links: { listeningExercise: 1 | null, readingOrder: 1 | null },   // existing A1.1 listening_exercises.exercise_number / reading_lessons.order_index worth doing after this Lektion
  practiceRule: { topics: ['verb-sein', 'alphabet-pronunciation'], typedMin: 3 }, // which pool topics feed the 7 controlled items; the engine picks deterministically
}
```

### The 12 existing A1.1 grammar slugs (topic_order)

1 nouns-gender · 2 definite-articles · 3 personal-pronouns · 4 verb-sein · 5 alphabet-pronunciation ·
6 verb-haben · 7 indefinite-articles · 8 present-tense-regular · 9 possessive-articles ·
10 separable-verbs-intro · 11 yes-no-questions · 12 time-and-dates

### The 12 situations (standard §2.2, in order)

1 Begrüßung, Vorstellen, Alphabet · 2 Angaben zur Person, Beruf, Zahlen · 3 Familie & Sprachen ·
4 Einkaufen, Möbel, Preise · 5 Gegenstände & Farben · 6 Büro, Technik, Telefon · 7 Freizeit & Hobbys ·
8 Verabredungen, Uhrzeit, Tagesablauf · 9 Essen & Trinken, Einladung · 10 Verkehrsmittel & Reisen ·
11 Gestern: Tagesablauf (Perfekt mit haben — INTRO ONLY, taught as chunks; Perfekt is an A1.2 slug) ·
12 Feste & Vergangenes (chunks) + Wiederholung.
Where the situation needs grammar that only A1.2 carries (Perfekt, Akkusativ, Modalverben), the Lektion
teaches fixed chunks ("Ich habe gearbeitet", "Ich möchte einen Kaffee") and says so in `notice`.

## Pool items (`src/data/lessonPools/a11.json`)

`{ id, topic, type: fill_blank|multiple_choice|sentence_building|error_correction, stage, difficulty, order, questionDe, questionEn, options|null, answer, accepted[], explanationDe, hint }`.
A `fill_blank` WITH `options` is recognition (show as chips); WITHOUT is typed. Typed = fill_blank without
options, sentence_building, error_correction.

## Engine rules (from the standard, binding)

Stages 0–8 as in §3; 7 controlled items: ≥ `typedMin` typed, at most 2 multiple_choice, drawn from
`practiceRule.topics`, deterministic per (level, nr, attempt) so tests can pin them; misses re-queue as a
different item of the same topic (cap 4); `checkAnswer(user, expected, { strict: STRICT_TOPIC.test(topic) })`;
no hearts; complete at any accuracy, gold at ≥ 80 % first-attempt; every miss logged with `tagError`.
Audio: Wortfeld words have `audio_url` in `words` (fetch by `wordId`); dialogue lines use
`window.speechSynthesis` with a `de-DE` voice as the v1 fallback (a real recording lands later) — never
make sound the only channel (text is always shown after the first play).

## Persistence (Supabase, RLS own-rows, service role for nothing)

- `lesson_progress(user_id, level, lektion_id, status text check in ('started','complete','gold'), accuracy numeric, completed_at, updated_at, primary key (user_id, lektion_id))`
- `lesson_attempts(id bigserial, user_id, level, lektion_id, item_id text, stage text, correct boolean, error_tag text, created_at)`
- `review_cards(user_id, card_key text, kind text check in ('word','pattern','sentence'), level, step smallint default 0, due_at timestamptz, lapses int default 0, last_result text, primary key (user_id, card_key))` — Babbel ladder days `[1, 4, 7, 14, 60, 180]`, lapse → step 0.
- Course-level completion keeps using `program_progress` with `program_key = 'a11_course'` and `item_id` = lektion/checkpoint id, so the existing CourseHome percent and certificate keep working.

## Acceptance (integration runs these)

`npm run lint` 0 warnings · `npm run check:duplicates` · `npm test` incl. new `tests/curricula.test.mjs`,
`tests/lesson-engine.test.mjs`, `tests/checkpoint.test.mjs` · SPA build · offline Astro build ·
Playwright screenshots of `/course/a1.1`, `/course/a1.1/l/1` (three stages), `/course/a1.1/checkpoint/1`.
