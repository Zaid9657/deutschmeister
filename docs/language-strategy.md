# DeutschMeister public language strategy

Last reviewed: 2026-09-14

DeutschMeister is English-first for product discovery, account journeys, and grammar explanations. German remains the learning language inside exercises and the document language for the established German-language exam-guide, exam-preparation, and comparison route families.

## Route rules

- English document: homepage, pricing, courses, grammar hubs and topic explanations, FAQ, About, tools, and public product screens.
- German document: `/leitfaden/`, `/pruefung/`, `/vergleich/`, `/telc-b1-komplettvorbereitung/`, and `/impressum/`.
- German examples embedded in an English lesson keep `lang="de"` on the smallest useful element.
- Links from English navigation into a German route must identify the destination as German before the visitor clicks.
- Every German acquisition page must show a visible language notice near the beginning with an English route back to grammar learning.
- Do not emit `hreflang` alternates unless a genuinely equivalent translated URL exists. A language notice is not an alternate page.

## Why this split exists

The product serves English-speaking German learners, so explanation and conversion paths must not switch languages unexpectedly. The German exam route families already contain detailed German terminology and target German-language search intent; keeping them avoids silently replacing established content while making the language boundary explicit.

## Verification

The language contract is enforced by `tests/language-strategy.test.mjs`: core routes render in English, declared German route templates retain `lang="de"`, and every German acquisition template includes the shared language notice.

