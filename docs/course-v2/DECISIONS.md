# Course v2 — owner decisions

Binding for every workflow and agent on the from-scratch course program.

| Date | Decision | Consequence |
|---|---|---|
| 2026-09-26 | Build all eight half-levels (A1.1–B2.2) **from scratch**; the old A1.1 course and `docs/course-standard-2026-09-12.md` are not the template. | Research → blueprint → curriculum → materials → review → build, in `docs/course-v2/`. The live A1.1 keeps serving until the new A1.1 passes review, then it is replaced. |
| 2026-09-26 | **B1/B2 go buyable as soon as they pass review** — no owner sample check first. | The integration PR removes each reviewed B-level from `COMING_SOON_LEVELS` (both `pricing.js` twins). A card still stays hidden until its `VITE_`/`PUBLIC_LEMONSQUEEZY_<KEY>_VARIANT_ID` is set (never a dead checkout), so the owner's Lemon Squeezy variants are the real on-switch — steps in `docs/owner-prompts.md`. |
