# DeutschMeister public language strategy

Last reviewed: 2026-10-05 (Arabic edition added)

DeutschMeister is English-first for product discovery, account journeys, and grammar explanations. German remains the learning language inside exercises and the document language for the established German-language exam-guide, exam-preparation, and comparison route families.

## Route rules

- English document: homepage, pricing, courses, grammar hubs and topic explanations, FAQ, About, tools, and public product screens.
- German document: `/leitfaden/`, `/pruefung/`, `/vergleich/`, `/telc-b1-komplettvorbereitung/`, and `/impressum/`.
- German examples embedded in an English lesson keep `lang="de"` on the smallest useful element.
- Links from English navigation into a German route must identify the destination as German before the visitor clicks.
- Every German acquisition page must show a visible language notice near the beginning with an English route back to grammar learning.
- Do not emit `hreflang` alternates unless a genuinely equivalent translated URL exists. A language notice is not an alternate page.

## Arabic (pilot, 2026-10-05)

- A third interface language, Arabic, for Arabic-speaking beginners with little English. It is a
  *support* language: the content being learned stays German, and German inside Arabic carries
  `lang="de" dir="ltr"` (isolated with `<bdi>`), never transliterated.
- Arabic documents are `lang="ar" dir="rtl"`: the five public pages under `/ar/` and the app routes
  in `AR_READY_PATTERN` (`src/lib/locale.js`). An Arabic visitor on any other app route gets an English
  document with an Arabic notice — never a half-translated page.
- Inside the translated scope (A1.1 Lektionen 1–3) no learning text falls back silently: a missing
  Arabic entry renders the English with `lang="en"` and a visible „(بالإنجليزية)“ tag, and Lektionen
  outside the scope say so in Arabic at their start.
- `hreflang` pairs only where a real equivalent exists: `/`↔`/ar/`, `/courses/`↔`/ar/courses/`,
  `/courses/a1-1/`↔`/ar/courses/a1-1/`, `/pricing/`↔`/ar/pricing/`, with `x-default` = English.
  `/ar/help/` has no English twin and names none. There is no German public twin: „Deutsch“ in the
  switch opens the English page and sets the app to German.

## Why this split exists

The product serves English-speaking German learners, so explanation and conversion paths must not switch languages unexpectedly. The German exam route families already contain detailed German terminology and target German-language search intent; keeping them avoids silently replacing established content while making the language boundary explicit.

## Verification

The language contract is enforced by `tests/language-strategy.test.mjs`: core routes render in English, declared German route templates retain `lang="de"`, and every German acquisition template includes the shared language notice.

