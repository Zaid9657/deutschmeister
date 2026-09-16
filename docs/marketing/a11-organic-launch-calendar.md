# DeutschStart A1.1 — organic launch calendar (weeks 1–4)

Plan: `docs/superpowers/plans/2026-09-15-a11-organic-commercial-launch.md`, Task 5 Step 3.
Articles: `astro-site/src/data/guides/` (data modules, rendered at `/leitfaden/<slug>/` —
see the deviation note below). Sales page: `/courses/a1-1/`
(`astro-site/src/components/courses/A11CourseLanding.astro`).

## The rules this calendar operates under

- **Paid acquisition budget is €0.** Nothing in this calendar is boosted, promoted or
  advertised. The offer contract holds the budget at zero until the later metrics gate is
  explicitly approved by the owner — there is no "small test" exception.
- **No fake social proof.** No invented testimonials, no bought reviews, no fabricated
  learner counts, no "students say…" copy. The product has collected no genuine reviews yet
  and says so on the sales page; the same rule applies to every short, email and comment.
- **No mass posting.** One comment per thread, written for that thread, by a human who read
  it. No cross-posting the same text to ten subreddits or groups, no scheduled reply bots, no
  DM outreach. A link goes in only when it answers the question that was actually asked; most
  answers carry no link at all.
- **One weekly load, repeated four times:** 1 article · 3 shorts · 1 email · 2 community
  answers. If a week slips, the week slips — the volume does not get "caught up", because a
  double week is exactly what turns this into spam.
- **Every claim derives.** Figures in shorts, emails and comments come from the same places
  the sales page uses (`src/data/pricing.js`, `src/data/marketing.js`, the curriculum). Never
  quote a price or an allowance from memory.
- **Deviation on record:** the plan named four `.astro` pages under
  `astro-site/src/pages/leitfaden/`. CLAUDE.md forbids that shape ("Leitfäden are data, not
  pages"), so the four articles ship as guide **data modules** registered in `GUIDES` and in
  `scripts/check-built-html.mjs`. Same URLs, same renderer, no duplicated page code.

## Owners and tags

| Role | Owner |
| --- | --- |
| Article (write, publish, fix) | Owner |
| Shorts (script, record, caption, post) | Owner |
| Email (draft from the article, send to list) | Owner |
| Community answers | Owner |

Every destination carries its own source tag so the funnel
(`src/lib/a11Funnel.js`, `docs/analytics/a11-funnel.md`) can separate them:

| Surface | Link | Source tag |
| --- | --- | --- |
| Article preview CTA | `/course/a1.1/l/<nr>?source=organic-guide-<name>` | `organic-guide-*` → `organic-search` |
| Shorts | `/courses/a1-1/` (bio link) | `organic-social` |
| Email | `/course/a1.1/l/1?source=email` | `email` |
| Community answer | article URL, not the course | `organic-search` |

Publish dates below are the intended cadence (one article per week, Tuesdays; shorts on
Wednesday/Friday/Sunday; email on Thursday). Fill the actual date in when it goes out.

---

## Week 1 — „Deutsch lernen als Anfänger: der erste Monat"

- **Article:** `/leitfaden/deutsch-a1-anfaenger-start/` · publish: week 1, Tue · owner: Owner
- **Query it answers:** „womit fange ich an, Deutsch zu lernen" / „Deutsch lernen Anfänger"
- **Outcome metric:** impressions and average position for `deutsch lernen anfänger` after 28
  days (Search Console, once the property is verified — see `docs/seo-routines/README.md`);
  until then: sessions on the article and preview starts tagged `organic-guide-start`.

### Shorts (3)

| # | Length | Hook (first 2 s) | Teaching point (exact) | Visual beats | Caption | CTA |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | 30 s | „Du lernst seit drei Wochen Deutsch und kannst dich immer noch nicht vorstellen?" | The five sentences of a self-introduction: heißen, kommen aus, wohnen in, Beruf ohne Artikel, Sprachen. | 0–2 s face, hook · 2–20 s the five sentences typed on screen one by one as they are spoken · 20–27 s the same five spoken at speed · 27–30 s end card with the route illustration | „Fünf Sätze. Mehr braucht deine erste Woche Deutsch nicht. #deutschlernen #a1" | „Lektion 1 ist kostenlos — Link in der Bio." |
| 1.2 | 25 s | „Drei Buchstabenpaare, an denen jeder Anfänger im Deutschen hängen bleibt." | E/I, G/J, V/W when spelling a name aloud; why it matters at the Amt and on the phone. | 0–2 s hook · 2–8 s the three pairs, large · 8–20 s spelling a surname out loud, twice · 20–25 s „Wie buchstabiert man das?" as the rescue phrase | „Buchstabieren ist keine Schulübung — es ist der Satz, der in Deutschland ständig verlangt wird." | „Alphabet-Lektion kostenlos: Link in der Bio." |
| 1.3 | 40 s | „20 Minuten am Tag schlagen zwei Stunden am Sonntag. Hier ist warum." | Spacing: the same total time, split across six days, produces recall the single session does not. | 0–3 s hook · 3–15 s two calendars side by side · 15–30 s what a 20-minute day contains (one situation, five words, one spoken minute) · 30–40 s the four-week table from the article | „Nicht mehr lernen. Öfter lernen. #deutschlernen" | „Der komplette Wochenplan steht im Leitfaden — Link in der Bio." |

- **Email:** „Deine ersten fünf Sätze auf Deutsch" — the practice block from the article,
  nothing else, one link to Lektion 1 (`?source=email`). Drawn from the same lesson the
  article previews, so a reader who arrives by mail and by search reads one voice.
- **Community answers (2):**
  1. A beginner thread asking where to start (r/German, „how do I start", or a Facebook group
     for newcomers in Germany) — answer with the four-week order in full, in the comment. Link
     only if the asker asks for material.
  2. A thread about learning apps not producing speech — answer with the „speak every day, out
     loud, three sentences" rule and the spelling pairs. No link.

---

## Week 2 — „Sich auf Deutsch vorstellen"

- **Article:** `/leitfaden/sich-auf-deutsch-vorstellen/` · publish: week 2, Tue · owner: Owner
- **Query it answers:** „sich auf Deutsch vorstellen" / „ich heiße oder mein Name ist"
- **Outcome metric:** preview starts tagged `organic-guide-vorstellen`, and the article's
  scroll-to-practice rate (does the exercise get reached?).

### Shorts (3)

| # | Length | Hook (first 2 s) | Teaching point (exact) | Visual beats | Caption | CTA |
| --- | --- | --- | --- | --- | --- | --- |
| 2.1 | 20 s | „„Ich bin ein Lehrer" — und schon hört man, dass Deutsch nicht deine Sprache ist." | German states professions without an article: Ich bin Lehrer / Ich bin Studentin. | 0–2 s hook with the wrong sentence struck through · 2–10 s the rule, three examples · 10–18 s three professions said aloud correctly · 18–20 s end card | „Ein einziges Wort zu viel. Der häufigste Anfängerfehler im Deutschen." | „Übe es in Lektion 2 — kostenlos, Link in der Bio." |
| 2.2 | 35 s | „Sie oder du? Entscheide es, bevor du den Mund aufmachst." | Sie in Amt/Arzt/Arbeit, du in Kurs/Uni/Sport; the offer comes from the older or senior person; Vorname + Sie does not exist. | 0–3 s hook · 3–15 s two columns, Sie vs du situations · 15–28 s the same question in both registers · 28–35 s „Im Zweifel: Sie." | „Mit „Sie" zu starten ist nie ein Fehler. Umgekehrt schon." | „Die ganze Vorstellung Satz für Satz: Leitfaden in der Bio." |
| 2.3 | 45 s | „Nimm dich eine Minute lang auf. Es ist unangenehm und es wirkt sofort." | The 60-second self-recording, then checking it against three points: verb in position two, profession without article, ei vs ie. | 0–3 s hook · 3–20 s the six sentences on screen · 20–35 s recording running, the three check points appearing · 35–45 s „Drei Tage hintereinander, dann sitzt es." | „Die schnellste kostenlose Korrektur, die es gibt: dein eigenes Ohr." | „Lektion 2 übt genau das — Link in der Bio." |

- **Email:** „Sie oder du — und die sechs Sätze dazwischen" — the register table plus the six
  sentences, one link to Lektion 2 (`?source=email`).
- **Community answers (2):**
  1. A „how do I introduce myself in my first German class" question — give the six sentences
     in the comment, plus the Sie/du rule. Link to the article only if more is asked for.
  2. A thread confusing „ich heiße" and „mein Name ist" — answer the register difference in
     three sentences. No link.

---

## Week 3 — „Im Café auf Deutsch bestellen"

- **Article:** `/leitfaden/auf-deutsch-im-cafe-bestellen/` · publish: week 3, Tue · owner: Owner
- **Query it answers:** „im Café bestellen Deutsch" / „ich hätte gern"
- **Outcome metric:** preview starts tagged `organic-guide-cafe`; secondary: watch-through
  rate on short 3.1 (the dialogue short is the format test for this week).

### Shorts (3)

| # | Length | Hook (first 2 s) | Teaching point (exact) | Visual beats | Caption | CTA |
| --- | --- | --- | --- | --- | --- | --- |
| 3.1 | 30 s | „Der ganze Café-Besuch auf Deutsch. Elf Sätze." | The full exchange: Ist hier noch frei? → Was darf es sein? → Ich hätte gern … → Sonst noch etwas? → Zahlen, bitte. | 0–2 s hook · 2–25 s the dialogue as a two-column chat, line by line, spoken · 25–30 s the whole thing again at speed | „Elf Sätze, und du kommst durch jedes Café in Deutschland." | „Die Café-Lektion ist Lektion 9 — starte bei Lektion 1, kostenlos. Link in der Bio." |
| 3.2 | 20 s | „„Einen Kaffee" oder „ein Kaffee"? Ein Buchstabe, großer Unterschied." | Ordering takes the accusative: einen Kaffee, ein Wasser, eine Limonade — learn them as fixed pairs on A1.1. | 0–2 s hook · 2–12 s three drinks with their article, colour-coded · 12–18 s three orders spoken · 18–20 s end card | „Du wirst so oder so verstanden. Aber mit „-en" klingt es richtig." | „Artikel-Lektion kostenlos — Link in der Bio." |
| 3.3 | 35 s | „In Deutschland zahlst du meistens am Tisch. Das überrascht fast alle." | Zahlen, bitte · Zusammen oder getrennt? · Kann ich mit Karte zahlen? · rounding up by naming the total. | 0–3 s hook · 3–15 s the three sentences · 15–28 s the tipping convention demonstrated by naming a total · 28–35 s „Getrennt zahlen ist völlig normal." | „Der Teil, den Sprachkurse auslassen: bezahlen." | „Der komplette Ablauf steht im Leitfaden — Link in der Bio." |

- **Email:** „Elf Sätze, ein Kaffee" — the dialogue, the three politeness variants, one link to
  Lektion 1 (`?source=email`, because Lektion 9 is inside the paid course).
- **Community answers (2):**
  1. A „what do I say when ordering" thread from someone about to travel — post the dialogue in
     the comment, in full. Link to the article only if someone asks for more situations.
  2. A question about tipping in Germany — answer the rounding-up convention plainly, and
     correct any answer in the thread that claims a fixed percentage. No link.

---

## Week 4 — „Deutsch A1: ein realistischer 30-Tage-Plan"

- **Article:** `/leitfaden/deutsch-a1-30-tage-plan/` · publish: week 4, Tue · owner: Owner
- **Query it answers:** „Deutsch A1 in 30 Tagen" / „Deutsch Lernplan A1"
- **Outcome metric:** preview starts tagged `organic-guide-plan` and the share of week-4
  readers who reach the sales page (`/courses/a1-1/`) — this is the one article whose reader
  is deciding on a route, not a sentence.

### Shorts (3)

| # | Length | Hook (first 2 s) | Teaching point (exact) | Visual beats | Caption | CTA |
| --- | --- | --- | --- | --- | --- | --- |
| 4.1 | 30 s | „Deutsch A1 in 30 Tagen? Rechnen wir das kurz nach." | 30 × 20 minutes = ten hours; the A1 level is reckoned at 60–80 units, so a month is A1.1 — half of A1 — and not the whole level. | 0–3 s hook · 3–15 s the arithmetic on screen · 15–25 s what fits in A1.1 vs what does not · 25–30 s „Halbes A1 in 30 Tagen. Ehrlich gesagt." | „Ein Monat reicht — für die erste Hälfte. Alles andere ist Werbung." | „Der komplette Plan steht im Leitfaden — Link in der Bio." |
| 4.2 | 40 s | „Vier Wochen, zwölf Situationen. Hier ist der Plan." | Week 1 who you are · week 2 the things around you · week 3 your day · week 4 out and about — each with its weekly self-check. | 0–3 s hook · 3–30 s the four weeks as four cards, each with its check · 30–40 s the three buffer days explained | „Drei Puffertage sind Teil des Plans, nicht Nachsicht." | „Tag 1 entspricht Lektion 1 — kostenlos, Link in der Bio." |
| 4.3 | 25 s | „Tag 30: sechs Aufgaben, laut, ohne Notizen." | The self-test — introduce yourself, describe your family, ask three prices, order and pay, say what you did yesterday, fill in a form. | 0–2 s hook · 2–18 s the six tasks, one per beat · 18–25 s „Fünf von sechs? Dann ist A1.1 erreicht." | „Kein Test, keine Note. Sechs Aufgaben, die du selbst prüfst." | „Der Plan mit allen 30 Tagen: Link in der Bio." |

- **Email:** „Der 30-Tage-Plan, ehrlich gerechnet" — the arithmetic, the four weekly goals, the
  day-30 self-test, one link to Lektion 1 (`?source=email`).
- **Community answers (2):**
  1. A „can I learn German in a month" thread — answer with the arithmetic and what A1.1
     covers. This is the answer that earns the link; post the article only after the full
     answer stands on its own.
  2. A thread where someone is discouraged after a month of app streaks with no speech —
     answer with the weekly self-checks as a way to measure progress that is not a streak.
     No link.

---

## Tracking table (fill as you publish)

| Week | Asset | Owner | Publish date | Source tag | Outcome metric | Result |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Article `deutsch-a1-anfaenger-start` | Owner | | `organic-guide-start` | position for „deutsch lernen anfänger" @28 d | |
| 1 | Shorts 1.1 / 1.2 / 1.3 | Owner | | `organic-social` | views, saves, profile taps | |
| 1 | Email „Deine ersten fünf Sätze" | Owner | | `email` | open rate, preview starts | |
| 1 | Community answers ×2 | Owner | | `organic-search` | replies marked helpful | |
| 2 | Article `sich-auf-deutsch-vorstellen` | Owner | | `organic-guide-vorstellen` | preview starts | |
| 2 | Shorts 2.1 / 2.2 / 2.3 | Owner | | `organic-social` | watch-through rate | |
| 2 | Email „Sie oder du" | Owner | | `email` | click rate | |
| 2 | Community answers ×2 | Owner | | `organic-search` | replies marked helpful | |
| 3 | Article `auf-deutsch-im-cafe-bestellen` | Owner | | `organic-guide-cafe` | preview starts | |
| 3 | Shorts 3.1 / 3.2 / 3.3 | Owner | | `organic-social` | watch-through rate on 3.1 | |
| 3 | Email „Elf Sätze, ein Kaffee" | Owner | | `email` | click rate | |
| 3 | Community answers ×2 | Owner | | `organic-search` | replies marked helpful | |
| 4 | Article `deutsch-a1-30-tage-plan` | Owner | | `organic-guide-plan` | sales-page visits from the article | |
| 4 | Shorts 4.1 / 4.2 / 4.3 | Owner | | `organic-social` | profile taps | |
| 4 | Email „Der 30-Tage-Plan" | Owner | | `email` | preview starts | |
| 4 | Community answers ×2 | Owner | | `organic-search` | replies marked helpful | |

## Review after week 4

Read the numbers from the funnel (`docs/analytics/a11-funnel.md`) and the weekly metrics row
(`weekly_metrics`, per CLAUDE.md — measure before you claim). Three questions, three answers:

1. Which article produced preview starts, not just sessions? Write the next four on that
   article's pattern.
2. Which short format held attention past 50 %? Keep that format, drop the others.
3. Did any community answer get marked helpful without a link? That is the shape to repeat —
   the link is the smallest part of the mechanism.

Paid acquisition stays at €0 through this review and until the owner approves the metrics gate
in the plan. Nothing in this document authorises an ad spend.
