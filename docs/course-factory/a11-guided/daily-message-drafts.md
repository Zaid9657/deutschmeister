# Daily teacher message — owner draft, not approved for sending

Text only. No sending, scheduling, sender, eligibility, flags, claims, guards, frequency or mailer changes. `netlify/functions/course-reminder.mjs` is unchanged. “Daily” describes the product voice, not a proposal to override the reminder's current frequency cap. Owner approval is required before using any of this copy in mail.

## German

Betreff: Ihr nächster Schritt in Deutsch ist bereit

Guten Tag{{name}},

Ihr Platz ist für Sie freigehalten. Wir machen von hier aus weiter.

Heute: {{today_plan}}.

Ein vertrauter Anfang, dann ein neuer Schritt. Sie lernen in Ihrem Tempo.

[Heute starten]({{course_home_url}})

Bis zum nächsten Schritt
Frau Hoffmann · KI-Lehrerin bei DeutschMeister

{{existing_unsubscribe_footer}}

## English

Subject: Your next step in German is ready

Hello{{name}},

Your place is kept for you. We will continue from here.

Today: {{today_plan}}.

A familiar start, then a new step. You learn at your own pace.

[Start today]({{course_home_url}})

See you for the next step,
Frau Hoffmann · AI teacher at DeutschMeister

{{existing_unsubscribe_footer}}

## Fields and fallback text

- `name`: `, <profile name>` only for a known signed-in learner, otherwise empty. Never use an email address as a name. No guest name storage.
- `today_plan`: derive the next unlocked node from the existing reminder's `nextStep()` / course path, respecting checkpoints and the final test. In a future approved implementation, the home supplies a saved part and due-card count; the current mailer does not have those reads, so these drafts must not imply that it already does.
- Lektion: DE `Lektion {{nr}}: {{title}} · etwa {{lo}}–{{hi}} Min. (Schätzung)`; EN `Lektion {{nr}}: {{title}} · about {{lo}}–{{hi}} min (estimate)`. Derive the range from `lektionPartEstimate`, never copy a duration into the template. An English can-do may replace the German lesson title using `canDoLines`.
- Checkpoint/final test: use the actual next node's title and measured/configured minutes; do not say “Lektion” or promise a quick win that the test does not contain.
- If plan data cannot be resolved: DE `Ihr nächster Schritt wartet auf der Kursseite`; EN `Your next step is ready on your course page`.
- `course_home_url`: the existing tagged course-home destination, so the current plan is resolved when opened and a stale mail never sends someone to a newly locked lesson.
- Retain the existing unsubscribe footer and all sending controls. These are message drafts, not an approved sender identity change or a claim that every recipient has completed a goal.
