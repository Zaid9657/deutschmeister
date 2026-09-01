# Design renovation 2026-09-01 — "Playful Depth"

The owner's verdict on the v1 design: "everything is boring and the copywriting
doesn't focus on the person, pain and promise." This is the record of what the
v2 system changes and why, so the deliberate rule changes don't read as drift.

## The four locked decisions (owner, via structured questions, 2026-09-01)

1. **Direction: Playful Depth.** Duolingo-energy with premium polish: chunky 3D
   pressable buttons, soft extruded clay cards, candy-bright accents around the
   case-colour system, bouncy springs, confetti moments.
2. **Persona: the exam-deadline learner, EN+DE.** One person: a telc/Goethe/DTZ
   date with visa/citizenship/job stakes. Pain: studying without knowing if
   it's the RIGHT studying. Promise: walk in knowing you're ready. Homepage and
   app in English; exam hubs, guides and the sales page stay German.
3. **Code-first, AI art slots later.** All depth/motion in CSS/JS; reserved
   `data-art-slot` positions plus ready-to-paste Higgsfield prompt specs
   (docs/design/higgsfield-art-specs.md) for hero artwork later.
4. **Rollout: skin one page → approve → all.** Design system + homepage first,
   desktop+phone screenshots to the owner, then waves: money pages → app
   chrome → content screens.

## What v2 keeps vs. overturns (the token header is the binding copy)

| Rule | v1 | v2 |
|---|---|---|
| 1. Colour means case | kept | **kept** — the brand's unique asset. Candy accents (`himbeer`/`aprikose`/`limette`) exist precisely so energy never borrows a case colour; their hues avoid the four case hues entirely. |
| 2. One primary | kept | **kept** — siegel is still the only interactive colour. Accents are energy (chips, streaks, confetti), with one sanctioned exception: the `celebrate` button variant for an earned moment. |
| 3. No resting shadows | "shadows only on lift" | **overturned deliberately** — depth is an affordance: interactive surfaces rest raised (hard bottom edge + soft ambient) and physically depress; reference material (tables, prose) stays flat. A shadow on the unpressable and a flat button are both bugs now. |

Also unchanged: the retired amber/rose palette bans (tests/brand.test.mjs,
both ratchets at 0), the claims/fact discipline, the kasus hexes, the type
faces (Fraunces/Nunito Sans/mono). The accent names are German on purpose —
`bg-accent-himbeer` can never contain a banned Tailwind palette substring.

## The mechanics (all in src/data/design-tokens.js + its astro twin)

- `accent` — three candy accents, each {bright, wash, ink, edge}.
- `depth` + `shadow.raise*` — the extrusion grammar: hard 4px bottom edge +
  soft ambient at rest; press = translate-y-1 + shadow-none (Button/Card).
- `motion` — spring/snap cubic-beziers + durations; `animate-pop-in`,
  `animate-wiggle` in both tailwind configs; EVERYTHING behind the
  `prefers-reduced-motion` gate now in both global stylesheets.
- `radius.clay` (1.25rem) — new name, so Tailwind's own `rounded-lg`/`xl`
  defaults are not reshaped (the `rounded-pill` lesson).
- `src/lib/confetti.js` — dependency-free burst, token colours, no-ops under
  reduced motion; callers never check, copy must carry the moment alone.
- Focus ring thickened to 3px (both sides) — still siegel, still on every
  focusable element; it and `::selection` remain whole-product brand surfaces.

## v3 (same day): "we can do a lot better" — the research pass

The owner rejected the v2 homepage: technically clean, but no theatre. A
research sweep over the open-source design landscape produced the v3 rebuild.
What was adopted and from where:

| Source (all MIT/open) | Adopted |
|---|---|
| **Atropos** (nolimits4web) — vanilla 3D parallax, ~10KB, no deps | The hero X-Ray card and the four exam cards are true multi-layer 3D scenes (`data-atropos-offset` layers) that tilt toward the pointer. This is the "make it 3D" ask done with craft instead of drop shadows. |
| **Magic UI** patterns | Marquee band with edge-fade mask; blur-fade scroll reveals (IntersectionObserver); number-ticker count-ups; shimmer-sweep primary CTA — all ported to vanilla CSS/JS (no React in the Astro site). |
| **react-bits** (DavidHDev) | Staggered hero entrance (rise + unblur per line); the general "animated backgrounds + text" playbook. React originals remain candidates for the SPA waves, where React exists. |
| **Aceternity UI** patterns | The aurora treatment: blurred drifting colour fields (token washes only) behind hero and close. |
| Considered, skipped | tailwindcss-motion / midudev animations (our keyframes already live with the tokens); three.js/WebGL (weight ≫ payoff at this stage); React islands in Astro (Atropos covers it vanilla). |

**The centrepiece is ours, not a library's**: the hero is a *living Sentence
X-Ray* — sentences pop in word by word, then each word receives its case
colour and label in sequence, cycling three real exam-context sentences
(NOM/AKK/DAT/GEN all appear). Server renders the first sentence fully
coloured; the script only enhances; reduced-motion and no-JS visitors keep
the static coloured state. Rule 1 is satisfied everywhere the case colours
move: every coloured chip names its case.

Safety details worth keeping: the reveal-hidden state is gated behind an
`html.js` stamp (crawlers/no-JS never see hidden content), and every new
animation collapses under the global `prefers-reduced-motion` gate.

## Copy doctrine for the sweep

Every rewritten surface speaks to the exam-deadline learner as person → pain →
promise, inside the existing truth bans: no outcome promises (OUTCOME regex in
tests/exams.test.mjs), no official-material claims, no invented counts, no
price literals off the pricing modules, disclaimers untouched. If copy fights
a ban, the copy is wrong.

## The sweep, as shipped (2026-09-01)

Six stages, each its own PR, each merged green:

| Wave | Scope | Result |
|---|---|---|
| 0 | Shared kit: `showtime.css`, `Showtime.astro`, `Aurora`, and the SPA primitives (`Chip`, `SectionHeading`, `Tilt`, `Reveal`, `Stat`, `motion.js`) + `docs/design/playbook.md` | one vocabulary for both front ends |
| 1 | All 19 public Astro pages | Astro legacy CSS 115 → 0 |
| 2 | App core loop, 17 screens | SPA legacy CSS 175 → 122 |
| 3 | Content screens, 30 files | SPA legacy CSS → **0** |
| 4 | The level test; `src/styles/LevelTest.css` (1,765 lines, 211 hexes) deleted | last hand-written stylesheet gone |
| 5 | `docs/design/higgsfield-art-specs.md` | artwork is optional, and specified |

Three defects were found by verifying rather than by reading, and each is
worth remembering:

1. **Confetti on re-entry.** `ReadingLessonPage` renders its completion card
   from persisted progress, so the new celebration would have fired every time
   a learner re-opened a finished lesson. Fixed by celebrating only the
   completion that happens in the session (`justCompleted`).
2. **A doc comment shipping CSS.** `ui/Button.jsx` quoted the retired gradient
   class in prose. Tailwind's scanner does not parse comments, so naming the
   class kept emitting the rule into production CSS long after the last real
   use was gone.
3. **The prerender coupling.** `scripts/prerender-spa-routes.mjs` writes the
   static HTML for eight crawlable routes but was never in Tailwind's content
   globs; its styling survived only because `src/` happened to use the same
   classes. The sweep ended that coincidence and unstyled the crawler view of
   those pages until the script was both scanned and converted.

The through-line: **the built artifact is the source of truth.** All three
were invisible in the source and obvious in `dist/` or in a browser with
JavaScript disabled.
