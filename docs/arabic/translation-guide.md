# Arabic translation guide (DeutschMeister)

Status of every Arabic string in the repository today: **draft** — machine-authored, not yet
reviewed by a qualified human. Nothing may be marked `reviewed` without a named reviewer and a
date (`reviewer`, `reviewedOn` in the sidecar entry); the coverage test refuses a `reviewed`
entry without both.

## 1. Where Arabic lives (three layers)

| Layer | What | File |
|---|---|---|
| Interface | buttons, eyebrows, errors, saving status | `src/locales/ar/lesson.js` (lesson table), `src/locales/ar/app.js` (i18next: nav, account screens) |
| Learning support | meanings, explanations, tasks, hints — attached to one piece of German content by a stable id | `src/data/curricula/a11.ar.js` |
| Public content | the `/ar/` pages | `astro-site/src/data/i18n/ar.js` |

The German source is never copied. A support entry is `{ ar, src, status }`; `src` is the hash of
the exact German/English source fields it was made from (`scripts/lib/i18n-sources.mjs`). Edit the
German and the entry turns **stale**: `node scripts/i18n-coverage.mjs` lists it, CI fails for the
pilot scope, and an editor re-checks the Arabic and runs
`node scripts/i18n-coverage.mjs --accept <key>` (the status stays `draft`).

## 2. Style

- **Modern Standard Arabic, simple.** Short sentences, everyday words, no ornate prose, no
  literal English syntax. The reader is an A0 learner of German who may have little English and
  any Arabic background — avoid dialect words and regional idioms.
- **Address:** the generic masculine imperative common in Arabic interfaces (`اضغط`, `استمع`,
  `اكتب`). A reviewer may decide to move to a plural or gender-inclusive form; change it in
  one pass across all three files, never piecemeal.
- **Digits:** Latin digits everywhere (`ar-u-nu-latn`). German number and time exercises are
  learning content and are never re-digitised.
- **Arrows:** where English points forward with `→`, Arabic uses `←` (arrows are not mirrored by
  the bidi algorithm).
- **Grammar terms:** explain, do not name-drop. `الفعل` (verb), `الاسم` (noun), `أداة التعريف`
  (definite article: der/die/das), `أداة النكرة` (indefinite article: ein/eine), `الجمع`
  (plural), `الفاعل` (subject), `حرف كبير` (capital letter). A German term the learner meets on
  the exam paper stays German and is explained once beside it: **Formular** (استمارة),
  **Mitteilung** (رسالة قصيرة), **Anrede** (التحية في البداية), **Gruß** (عبارة الختام),
  **Hören / Lesen / Schreiben / Sprechen** (أجزاء الامتحان).

## 3. German inside Arabic

- German words, phrases and sentences are written **exactly** as German, in Latin script, inside
  `«…»` or `**…**`. The renderer (`src/components/lesson/richText.jsx`) wraps every such run in
  `<bdi lang="de" dir="ltr">`, so it keeps its own order and punctuation and a screen reader
  switches voice. Never reverse, never re-order German tokens, never transliterate German into
  Arabic script (no `غوتن تاغ`) — pronunciation is taught by audio, not by Arabic respelling.
- A German example that the English explanation quotes in bold stays bold German in Arabic.
- Do not translate German names of people or places (Ana, Frau Kaya, Bremen).

## 4. Meaning, not words

- Translate the **teaching point**, not the English sentence. Example — the profession rule:
  `عند ذكر المهنة بعد فعل sein، نستخدم عادةً اسم المهنة دون أداة نكرة.` and the German example
  separately: **Ich bin Lehrerin.** = أنا معلّمة. Never sharpen a hedge into an absolute ("never use
  an article") that the German does not support.
- Explanations written for English speakers ("E sounds like English ‘ay’") are **adapted** for
  Arabic speakers (e.g. E/I and O/U, P/B, F/V contrasts), keeping the same German facts.
- Keep characters, situations, German difficulty, objectives and register. Adapt an example only
  when the English one would not be understood.

## 5. Never give the answer away

A translation may say what the English support already says — no more. In scored listening
items no Arabic appears before the answer; a dictation's meaning is shown only in the feedback;
a question's Arabic line translates the instruction, not the solution, unless the English line
already contains it.

## 6. Ambiguity

Two words of one Lektion's Wortfeld must never share an Arabic meaning: the matching exercise
grades pairs, and two identical tiles would be ungradable (`tests/arabic-coverage.test.mjs`).
Where Arabic has one word for two German ones, disambiguate in the gloss: `Hallo` = `مرحبًا`,
`Guten Tag` = `نهارك سعيد (تحية رسمية)`.

## 7. Glossary (fixed choices)

| English | Arabic |
|---|---|
| Check | تحقّق من الإجابة |
| Continue | متابعة |
| Listen again | استمع مرة أخرى |
| Show translation | اعرض الترجمة |
| Lesson (Lektion) | الدرس |
| Checkpoint | اختبار مرحلي |
| Final test | الاختبار النهائي |
| Review | المراجعة |
| Computer voice | صوت حاسوبي |
| Recording | تسجيل صوتي |
| Reading support | مساعدة في القراءة |
| Intelligibility (read-aloud score) | وضوح الكلام — "words the system recognised", never "pronunciation" |
| AI assessment | تقييم آلي |
| Form check | فحص الشكل |
| Free account | حساب مجاني |
| Trial | تجربة |
