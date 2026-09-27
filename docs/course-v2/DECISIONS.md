# Course v2 — owner decisions

Binding for every workflow and agent on the from-scratch course program.

| Date | Decision | Consequence |
|---|---|---|
| 2026-09-26 | **Eight courses, one per half-level** (A1.1, A1.2, A2.1, A2.2, B1.1, B1.2, B2.1, B2.2) — each is its own course and its own product. Build all eight **from scratch**; the old A1.1 course and `docs/course-standard-2026-09-12.md` are not the template. | Research → blueprint → curriculum → materials → review → build, in `docs/course-v2/`. The live A1.1 keeps serving until the new A1.1 passes review, then it is replaced. |
| 2026-09-26 | **B1/B2 go buyable as soon as they pass review** — no owner sample check first. | The integration PR removes each reviewed B-level from `COMING_SOON_LEVELS` (both `pricing.js` twins). A card still stays hidden until its `VITE_`/`PUBLIC_LEMONSQUEEZY_<KEY>_VARIANT_ID` is set (never a dead checkout), so the owner's Lemon Squeezy variants are the real on-switch — steps in `docs/owner-prompts.md`. |
| 2026-09-27 | **Take inspiration from the most-used German curricula** (Menschen, Schritte, Netzwerk neu, Linie 1, Aspekte neu, Sicher!, the CEFR/Profile Deutsch/Rahmencurriculum frameworks, DW Nicos Weg, Goethe Deutsch Online …). | `research/14-lehrwerke-curricula.md` is a required input for the blueprint and for every per-level curriculum: each level's topic sequence and unit anatomy cite where the leaders place it, and deviations are justified. |
| 2026-09-27 | **Finish one level (A1.1) completely and let the owner evaluate it before building the other seven.** | Only A1.1 gets its remaining 11 units, Plateaus, closing block and level review now. The other levels stop at their reviewed pilot unit (u04); no further unit authoring for A1.2–B2.2 until the owner has evaluated A1.1 and its lessons are folded back into the rails and the unit template. |
