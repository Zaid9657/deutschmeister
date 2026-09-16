# DeutschStart A1.1 — launch checklist

Plan: `docs/superpowers/plans/2026-09-15-a11-organic-commercial-launch.md` Task 6.
Offer: €39 once, lifetime guided-course access, three free preview lessons,
12 included mission attempts + 60 permanent speaking minutes.

**The sellability gate below is closed.** Until every line in it is met, the
A1.1 checkout must stay disabled: the code already enforces this — an unset
`PUBLIC_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID` hides the buy surface rather
than opening a dead checkout, so *not configuring the product yet* is the
safe state, not an oversight.

## 1. External products (owner, Lemon Squeezy dashboard — API is read-only)

- [ ] DeutschStart A1.1 — €39 one-time
- [ ] AI Coach — €12.99/month and €129/year
- [ ] Speaking top-up — €6.99 (60 permanent minutes)
- [ ] **Existing subscribers keep their current variants** (€9.99/€79.99) —
      create NEW variants; never edit the ones live subscriptions bill against.

Then set, in Netlify (never committed):

| Scope | Variable |
|---|---|
| Functions | `LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID` (numeric variant id) |
| Functions | `LEMONSQUEEZY_SPEAKING_TOPUP_60_VARIANT_ID` |
| Builds | `VITE_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID`, `PUBLIC_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID` (checkout UUIDs) |
| Builds | `VITE_LEMONSQUEEZY_SPEAKING_TOPUP_60_VARIANT_ID` |
| Builds | `VITE_LEMONSQUEEZY_AI_COACH_MONTHLY_VARIANT_ID`, `VITE_LEMONSQUEEZY_AI_COACH_YEARLY_VARIANT_ID` |
| Functions | `SPEAKING_STATE_SECRET` (new — signs guided task state and mission results; fails closed) |
| Functions | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` (acoustic pronunciation) |

## 2. Migrations (owner, Supabase SQL editor — hand-applied per `migrations/README.md`)

- [ ] `migrations/2026-09-16-speaking-allowances.sql` — the seconds ledger.
      **Nothing about speaking billing works until this is applied.**
- [ ] `migrations/2026-09-16-a1-1-course-linked-practice.sql` — the 2 reading
      texts and 6 listening exercises the course links.
- [ ] `migrations/2026-09-17-a11-speaking-route.sql` — the 12 A1.1 missions.
      After applying, set `VITE_SPEAKING_MISSIONS_LIVE=true` so the
      Abschlusstest's speaking floor becomes required.
- [ ] `UPDATE public.listening_exercises SET status='completed' WHERE level='A1.1' AND exercise_number BETWEEN 7 AND 12;`
      (after the audio for them exists)

## 3. Sellability gate — all must be true before the checkout opens

- [ ] Recorded audio manifest populated (`src/data/curricula/a11.audio.js` is
      the empty stub today; the owner's Azure run is in `docs/owner-prompts.md`).
      Until then every audio surface honestly says „Computerstimme" and the
      sales page must not claim professional audio.
- [ ] Linked practice live (migration above applied).
- [ ] Language edge cases closed — **done**, DaF review #23's 24 minors are
      closed at the class with tests.
- [ ] Named DaF approval — `RELEASE-REVIEW-2026-09.md`, unfilled by design.
- [ ] Speaking benchmark passes (`scripts/run-speaking-eval.mjs`, live mode,
      with blinded reviewer scores).
- [ ] Accessibility, privacy and latency gates — see
      `speaking-beta-checklist.md`.
- [ ] Production webhook enabled and verified.

Run `npm run verify:a11-release` to see the gate state as code sees it: it
turns the two owner-blocked skips (`npm test` shows them as loud SKIPs) into
hard failures. **Release evidence must quote that command, never `npm test`.**

## 4. Production journey (real test buyer, after gates 1–3)

1. [ ] Land through an attributed organic URL (`?source=a11-sales`).
2. [ ] Create an account; complete all three preview lessons.
3. [ ] Buy A1.1 (€39).
4. [ ] Verify: lesson 4 opens, `speaking_mission_entitlements` holds 12 rows,
       `speaking_credit_buckets` holds 3,600 permanent seconds.
5. [ ] Complete one mission; verify the ledger settled (reserve → finalize +
       refund of the remainder) and nothing double-charged.
6. [ ] Refund the order; verify access revoked, unspent seconds revoked,
       consumed history intact.
7. [ ] Confirm the funnel events fired and the buyer is excluded from
       emails 2–5.

Record deploy id, order id, an anonymous user reference, the ledger rows and
the observed UI in `deutschstart-a11-launch-evidence.md`.

## 5. Launch

- [ ] Publish the four-week organic calendar (`docs/marketing/a11-organic-launch-calendar.md`).
- [ ] Send email 1 **only** after explicit owner confirmation
      (`scripts/send-a11-preview-email.ps1 -Email 1 -Live -ConfirmCampaign a11-foundation-2026-09`).
- [ ] Monitor funnel, support and errors daily for the first week.
- [ ] **Paid advertising stays at €0.** The later decision needs 100+
      qualified sales-page visits, 20+ checkout starts, a stable conversion
      estimate, refund rate under 10%, no unresolved severity-1 payment or
      speaking issue, and a documented maximum acquisition cost from real
      margin.
