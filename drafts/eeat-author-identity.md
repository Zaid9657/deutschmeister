# Draft: author identity and the founder-experience signal (2026-08-24)

**Class B — draft only, must not self-merge.** Every item here asserts a fact about a real person.
Per `CLAUDE.md`, inventing a name or a credential is worse than having none, so nothing below can
ship until the owner supplies the identity. Written during the `claude-seo` audit; see
`drafts/seo-audit-2026-08-24.md`.

## What was measured

- **Zero `Person` schema anywhere in `dist/`.** `author` is `Organization` on all 71 Article pages —
  the 4 Leitfäden, the 3 comparisons and all 64 grammar topics. No byline, no bio, no `sameAs`.
- **`/ueber-uns` has no crawlable HTML.** It is a `netlify.toml` rewrite to `app.html`, whose body is
  an empty `#root`. It is footer-linked from all 87 Astro pages, so a non-JS crawler follows a link
  from every page on the site to a blank shell. Same for `/faq`.
- **The founder-experience signal exists on 2 pages out of 92.**

That last one is the point of this draft.

## The asset the site already owns and does not use

`src/data/competitorComparisons.js:59,77` and `astro-site/src/data/guides/telc-b1.js:241` carry:

> „Gegründet von einem Arzt in Deutschland — kennt den Lernweg aus Erfahrung."
>
> „Deutschmeister wurde von einem Arzt in Deutschland gebaut, der selbst Sprachprüfungen bestehen
> musste. Die Plattform ist kein Spiel — sie ist ein Werkzeug für Leute, die eine Prüfung bestehen
> müssen."

Built pages carrying it: **`/vergleich/babbel/` and `/leitfaden/telc-b1/`. That is all.**

Absent from `/vergleich/duolingo/`, `/vergleich/lingoda/`, `/leitfaden/telc-b2/`,
`/leitfaden/goethe-b1/`, `/leitfaden/dtz/`, `/pricing/` and the homepage.

Google's quality guidance asks Who / How / Why. This site answers **How** unusually well — the guides
render `factsCheckedOn` and `sources` on the page and carry an explicit *"ersetzt keine offizielle
Prüfungsberatung"* disclaimer, which is better than most competitors in this niche. **Why** is clear.
**Who** is answered on two pages, anonymously.

Someone who sat these exams themselves writing exam-prep guides is precisely the first-hand
Experience the guidance asks for. It is the strongest differentiator the site has against Babbel and
Duolingo, and it is nearly invisible.

## What the owner needs to supply

Nothing below can be drafted further without these. They are facts about a person, not copy choices.

1. **A real name** to attribute the guides to.
2. **The real qualification**, stated precisely enough to be true and checkable — e.g. medical
   degree and country, and whether the German exams referenced were actually sat (the current copy
   says *"musste selbst Sprachprüfungen bestehen"*, which implies it).
3. **At least one verifiable `sameAs` URL** — LinkedIn, ORCID, a professional register. A `Person`
   node with no `sameAs` adds markup without adding trust.
4. **A decision on `/ueber-uns`**: prerender it as a real page, or accept it as noindex and
   reconsider linking it from all 87 footers.

## What ships once they exist

Mechanical, and cheap — the blocker is entirely the facts, not the work.

- **`/ueber-uns` as an Astro page.** Needs the full treatment: the page under
  `astro-site/src/pages/`, a `cp -r` step in `netlify.toml`'s build command (a new **top-level**
  segment needs one — the `/leitfaden/` directory is already copied, this would not be), and it is
  picked up automatically by `check-built-html.mjs` now that the manifest is discovered. Emit the
  `Person` node here, once, with `sameAs`.
- **`author: { '@type': 'Person', … }`** on the four guides, replacing `author: ORGANIZATION` in
  `guideJsonLd()` (`astro-site/src/data/guides/index.js`). Keep `publisher` as the Organization.
  Reference the Person by `@id` rather than re-declaring it.
- **A visible byline** in the guide header, next to the existing "Fakten geprüft am" line — the
  schema and the visible page should agree, which is the same principle that moved `dateModified`
  off the build date in this branch.
- **Move the founder line into the shared layer** so it appears on all four guides and all three
  comparisons, not two pages. Note `competitorComparisons.js` is one of the byte-identical
  duplicated files — both copies must change or `npm run check:duplicates` fails.

## Constraints that still bind

- No outcome promise and no exam fee — `tests/guides.test.mjs` bans both, and a founder bio is a
  tempting place to slip in "hat die Prüfung bestanden" as a success claim about *learners*.
- No learner counts, testimonials or ratings alongside the bio. E-E-A-T advice reaches for social
  proof by default; the counts rule in `src/data/marketing.js` still applies.
- If the credential is stated on a guide, it is an exam-adjacent fact and belongs under the same
  `factsCheckedOn` / `sources` discipline as the rest of that page.
