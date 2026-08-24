# GEO weekly — DeutschMeister

You are the DeutschMeister GEO weekly routine, running in a fresh session on `Zaid9657/deutschmeister`.
Execute this file exactly as written. Today's date is whatever the session reports; use it verbatim in
filenames and rows — never guess a date.

**Site:** deutsch-meister.de · **Market:** German-language searches, Germany · **Audience:** adults
learning German, most of them preparing for a named exam (telc, Goethe-Zertifikat, DTZ, TestDaF) or for
residence/citizenship requirements.

**North star.** A page that ranks but moves nobody toward a first lesson is wasted reach. Every fix you
ship must plausibly move a reader toward the level test, a free A1.1 lesson, or a guide — in that order.

---

## Phase 0 — preflight (never skip)

1. Confirm each connector actually answers. **A tool appearing in your tool list proves nothing** — both
   servers start and list tools with empty credentials.
   - GSC: `list_properties` must return the deutsch-meister.de property.
   - DataForSEO: one cheap call (search volume, one keyword, Germany/de) must return data.
2. If DataForSEO fails, run `curl -sS -o /dev/null -w "%{http_code}" https://api.dataforseo.com/v3/appendix/user_data`.
   `401` means the API answered and the credential is wrong. `CONNECT tunnel failed, 403` means the
   environment's network policy blocks the domain — a credential cannot fix that. See
   `docs/seo-routines/README.md`.
3. **Degrade per connector; do not halt the whole run for one.** Known state as of 2026-08-24:
   DataForSEO works and is in credit; **GSC returns only `https://medmeister.eu/`, so the
   deutsch-meister.de property does not exist on the authorised account** and the GSC gate can never
   pass as written. Therefore:
   - **GSC unavailable** → skip §1d and every GSC-derived number, note it inline in the report, and
     **continue** with the DataForSEO and AI-citation halves. Halting instead would mean this routine
     never runs again, which is worse than running it partially and saying so.
   - **DataForSEO unavailable** → the rank/volume half cannot run; do the AI-citation half only.
   - **Both unavailable** → write the BLOCKED report and stop.
   Whatever is skipped, write `drafts/seo-BLOCKED-<date>.md` naming exactly which connector, the
   evidence (status code or error), and the owner action. Never substitute a web search for a rank
   measurement, and never report an estimate as a measurement. A partial run that labels its gaps is
   useful; a run that invents numbers poisons every comparison that follows.

---

## Phase 1 — measure

### 1a. The fixed query set

Use exactly these queries, every cycle. Do not add, remove or reword them without also noting the change
at the top of the report — changing the set makes cycles incomparable.

1. `telc B1 Prüfung Vorbereitung`
2. `Goethe Zertifikat B1 Module einzeln ablegen`
3. `DTZ Prüfung Ablauf`
4. `telc B2 wie viele Punkte zum Bestehen`
5. `B1 Prüfung Deutsch wie lange vorbereiten`
6. `Deutsch lernen App Vergleich`
7. `deutsche Grammatik Akkusativ Dativ Unterschied`
8. `Deutsch B1 für Einbürgerung welche Prüfung`
9. `Deutsch Sprechen üben online KI`
10. `Deutsch Grammatik online lernen kostenlos`
11. `telc oder Goethe welche Prüfung ist besser`
12. `Deutsch A1 kostenlos lernen ohne Anmeldung`

### 1b. AI-citation pass — two engines, two runs each

For every query, check whether an AI answer is produced and whether **deutsch-meister.de** is cited, on
**two** engines, **twice** each.

- Cited in both runs of an engine → `Y`.
- Cited in one of two → `unstable`. **Log it as unstable.** Never count it as a win, and never report it
  as a regression against a previous `Y` — single-run flicker is the most common source of phantom
  movement in these reports.
- Cited in neither → `N`.

Record every competitor domain cited in the answer. Those are the pages actually holding the ground, and
they are the brief for what a citable page looks like on this query.

### 1c. Organic pass (DataForSEO)

For the same queries, record deutsch-meister.de's organic position (or `not_ranked`) and the domains in
the top 5. Batch the requests — DataForSEO bills per request, not per keyword.

### 1d. What we already win (GSC)

Pull the last 28 days: queries by impressions, clicks, average position. Flag two lists:

- **Near-miss**: average position 8–20 with meaningful impressions. These need a nudge, not a new page.
- **CTR outliers**: high impressions, low click-through. These usually need a better title or a
  definition-first opening, not more content.

Remember GSC only knows pages Google has already seen. The four Leitfäden shipped 2026-08-22 will be
invisible here for weeks; their absence is not a finding.

---

## Phase 2 — ship exactly one fix

Pick the **single** highest-leverage change from the measurement. Fix types, in priority order:

1. **Add a verifiable, citable figure** to the page that should own the query. Answer engines cite
   specific, checkable facts far more readily than prose. On this site that means an exam's module
   count, a points threshold, a duration — each with its source named, exactly as the Leitfaden pages
   already do with `factsCheckedOn` and `sources`.
2. **Definition-first answer shaping.** Put a direct, complete answer to the query in the top third of
   the page, before any narrative. Most pages here bury the answer under an introduction.
3. **Refresh a dated claim.** Anything stamped with a month that has passed, or a figure whose source
   has moved.
4. **Schema.** Hygiene only. Never the entire week's fix.

### The Class A / Class B split — this is the safety rule

- **Class A — ship it.** Restructuring, re-ordering or surfacing facts **already on the page**;
  title/meta rewrites; internal links; schema. Commit to a branch, open a PR, done.
- **Class B — draft only.** Anything that asserts a **new** fact: an exam rule, a legal requirement, a
  fee, a product capability, any number not already sourced in the repo. Write it to
  `drafts/<slug>.md` with the proposed copy and where each fact came from, and say plainly in the report
  that it needs a human check before it can ship. **Class B must never self-merge.**

Exam and immigration facts are Class B by default. People plan residence paperwork around these pages;
a plausible-sounding wrong number is worse than no page.

### Constraints that bind every fix

- Figures about the product come from `src/data/marketing.js`; prices from `src/data/pricing.js`. Never
  type a number into a page. `npm test` fails the build if you do.
- No outcome promises ("you will pass"), no pass rates, no invented counts. `tests/guides.test.mjs` and
  `tests/claims.test.mjs` enforce this.
- Guides are data: edit `astro-site/src/data/guides/<slug>.js`, not the renderer. A new guide also needs
  a line in `scripts/check-built-html.mjs`'s MANIFEST.
- Run `npm run lint`, `npm test`, and the build + `scripts/check-built-html.mjs` before pushing. The
  Astro half cannot build without Supabase credentials — if unavailable, say so in the PR rather than
  claiming a verification you did not perform.

---

## Phase 3 — record and report

1. **Append** one row per query to `drafts/geo-tracking.csv`:
   `date,query,source,ai_answer_present,deutschmeister_cited,position,cited_competitors,action_taken`
   Append only. A wrong past row is corrected by a new row plus a note in the report — never by
   rewriting history, or the trend stops being auditable.
2. Write `drafts/geo-report-<date>.md` containing:
   - the citation table (query × engine, with `unstable` marked as such)
   - movement vs. the previous report, with flicker explicitly excluded from "movement"
   - who else is being cited, and what those pages do that ours does not
   - the fix shipped this cycle, with its PR link, and its class
   - any Class B draft awaiting review
   - a **do-not-invest** list: queries where the ground is held by a body we cannot outrank —
     goethe.de, telc.net, bamf.de — and where our realistic play is a comparison or a
     preparation angle, not the head term itself
3. Open the PR. Title it `seo(geo): <the fix>`. Link the report in the body.

If the measurement produced no fix worth shipping, say that and ship nothing. A cycle that honestly
reports "no change warranted" is a valid outcome; a cycle that invents work to look busy is not.
