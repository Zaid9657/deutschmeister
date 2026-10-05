# Arabic edition — how we will know whether it works

Status: **plan, nothing measured yet.** No Arabic page or lesson has had a single real visitor
when this was written (2026-10-05). Every number below is to be read from the existing
pipeline after launch; none may be quoted before it exists.

## The question

Does an Arabic-speaking A0 beginner who arrives through an Arabic link (Telegram, Instagram,
WhatsApp groups, community pages) start A1.1, finish Lessons 1–3, and come back — at a rate
worth extending the Arabic to Lessons 4–12 and A1.2?

## What is recorded (already wired, consent-gated)

| Signal | Where | Notes |
|---|---|---|
| `ui_locale` | PostHog super-property + every GA4 event (`src/lib/analytics.js`), and every Astro event (`astro-site/src/lib/track.js`, from `<html lang>`) | `en`, `de` or `ar` — the interface the screen was rendered in. A product setting, never a proxy for nationality or origin. |
| `locale_changed {ui_locale, locale_from, surface}` | `src/lib/analytics.js` on the `dm-locale-changed` event | `surface` = `lesson`, `navbar`, `menu`, `suggestion`, `fallback`. Explicit switches only; the first-load resolution is not an event. |
| `course_selected {surface: ar_hero / ar_close / ar_courses / ar_course_page / ar_pricing / ar_help}` | `data-track` on every Arabic start button | Which Arabic door was used. |
| `lesson_started`, `lesson_completed` (once per run) | `LessonPlayerPage` | `lesson_completed` is deduped by the run id (G-fix): a re-mounted recap no longer double-counts. |
| `lesson_resumed` | `LessonPlayerPage` | A run picked up again after a reload or a return. |
| `help_opened {surface: ar_help}` | `/ar/help/` | Once per visit. |
| Acquisition source | `dm_attribution` → `profiles.acquisition_*` (unchanged) | Tag Arabic links with `?ref=` or `utm_*` exactly as in `docs/tracking-links.md`; add `lang=ar` to app links. |

Consent caveat: GA4 and PostHog load only after the cookie banner's Accept (`public/consent.js`,
now in Arabic on Arabic pages). Event counts are therefore a **consenting subset**; the account
side (`profiles`, `lesson_progress`, `weekly_truth_metrics()`) is the complete record for anyone
who signs up. Never extrapolate event counts to "all visitors".

## Definitions (decide them now, so nobody moves them later)

- **Arabic visitor**: a session whose first page view has `ui_locale = ar` (an `/ar/` page or an
  app screen rendered in Arabic).
- **Arabic starter**: an Arabic visitor with `lesson_started` for `a1.1-l01`.
- **Pilot finisher**: an Arabic starter with `lesson_completed` for `a1.1-l01`, `-l02` and `-l03`.
- **Returner**: a pilot starter with a `lesson_started` or `lesson_resumed` on a later calendar
  day (UTC) within 7 days.
- **Arabic signup**: an `auth.users` row whose `raw_user_meta_data->>'ui_lang' = 'ar'` at
  signup (written by `signUp` when the device has a language choice, `src/lib/localeAccount.js`;
  read it with the service role — it is not copied into `profiles`).

## The comparison

Compare Arabic starters with English starters **from the same acquisition source mix** over the
same window (the English baseline is whoever starts A1.1 in English from comparable links). A
raw Arabic-vs-English comparison mixes audiences and would mislead.

Read, per 2-week window, once at least 30 Arabic starters exist (below that, report counts only,
no rates):

1. Arabic starter → Lesson 1 completion; → pilot finisher (all three).
2. Returner rate.
3. Arabic signup rate among pilot finishers.
4. `locale_changed` away from Arabic during a lesson (`surface = lesson`): a high rate means the
   Arabic is not doing its job or the learner reads English better than assumed.
5. Lesson 4 entry rate among pilot finishers — where the Arabic stops. A cliff here is the
   strongest argument for translating Lessons 4–12 next.

## Decision rule (proposal for the owner)

Extend the Arabic support to Lessons 4–12 when, over ≥ 30 Arabic starters, Lesson-3 completion is
at least the English rate from comparable sources **and** at least a third of pilot finishers
reach Lesson 4. Otherwise run the usability study (`usability-study.md`) before translating more.

## What this cannot tell us

- Whether the learner understood — completion is not comprehension. The usability study's
  next-day recall task is the only comprehension signal in this plan.
- Anything about learners who decline cookies, except through the account tables.
- Translation quality. That needs the native review gate in `README.md` §4, not analytics.
