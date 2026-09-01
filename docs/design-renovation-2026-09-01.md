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

## Copy doctrine for the sweep

Every rewritten surface speaks to the exam-deadline learner as person → pain →
promise, inside the existing truth bans: no outcome promises (OUTCOME regex in
tests/exams.test.mjs), no official-material claims, no invented counts, no
price literals off the pricing modules, disclaimers untouched. If copy fights
a ban, the copy is wrong.
